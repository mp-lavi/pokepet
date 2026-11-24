import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createInitialGameState,
  generateQuests,
  generateShopSlots,
  getFoodById,
  getLineById,
  getShopItemById,
  getStageForLevel,
  getXpForNextLevel,
  MAX_LEVEL,
  SHOP_REFRESH_INTERVAL_MS,
} from '../data/pokemonData';
import {
  FloatingParticle,
  GameState,
  PetMoodAnimation,
  QuestItem,
  QuestMetric,
} from '../types/game';
import { sound } from '../utils/sound';
import { triggerHapticMedium } from './usePetSensors';

const STORAGE_KEY = 'pokepet_save_v1';
const TICK_INTERVAL_MS = 4000;
const PET_XP_COOLDOWN_MS = 10000;

function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(val * 10) / 10));
}

function loadSavedState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialGameState();
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed || !parsed.lineId) return createInitialGameState();

    // Calculate offline decay since lastActiveAt
    const now = Date.now();
    const elapsedMin = Math.min(24 * 60, Math.max(0, (now - (parsed.lastActiveAt ?? now)) / 60000));

    if (parsed.phase === 'pet' && elapsedMin > 0.2) {
      if (parsed.isSleeping) {
        parsed.energy = clamp(parsed.energy + elapsedMin * 1.6);
        parsed.hunger = clamp(parsed.hunger - elapsedMin * 0.25);
        parsed.happiness = clamp(parsed.happiness - elapsedMin * 0.15);
      } else {
        parsed.hunger = clamp(parsed.hunger - elapsedMin * 0.55);
        parsed.happiness = clamp(parsed.happiness - elapsedMin * 0.4);
        parsed.energy = clamp(parsed.energy - elapsedMin * 0.35);
      }
    }

    // Recover from transient animation phases if app was closed mid-animation
    if (parsed.phase === 'evolving') {
      parsed.phase = 'pet';
    }

    parsed.adventureStage = parsed.adventureStage ?? 1;
    parsed.coins = typeof parsed.coins === 'number' ? parsed.coins : 100;
    parsed.inventory =
      parsed.inventory && typeof parsed.inventory === 'object'
        ? parsed.inventory
        : { oran: 3, sitrus: 1 };
    parsed.starterChosen =
      typeof parsed.starterChosen === 'boolean'
        ? parsed.starterChosen
        : parsed.phase !== 'egg' || parsed.eggProgress > 0;
    if (!Array.isArray(parsed.shopSlots) || parsed.shopSlots.length === 0 || now >= (parsed.shopRefreshesAt ?? 0)) {
      parsed.shopSlots = generateShopSlots();
      parsed.shopRefreshesAt = now + SHOP_REFRESH_INTERVAL_MS;
    }
    parsed.isShiny = Boolean(parsed.isShiny);
    parsed.quests =
      Array.isArray(parsed.quests) && parsed.quests.length > 0
        ? parsed.quests
        : generateQuests();
    parsed.eggBag = Array.isArray(parsed.eggBag) ? parsed.eggBag : [];
    parsed.lastActiveAt = now;
    return parsed;
  } catch {
    return createInitialGameState();
  }
}

function advanceQuestsList(quests: QuestItem[], metric: QuestMetric, delta = 1): QuestItem[] {
  return quests.map((q) =>
    q.metric === metric && !q.claimed
      ? { ...q, progress: Math.min(q.target, q.progress + delta) }
      : q
  );
}

export function useGameLoop() {
  const [state, setState] = useState<GameState>(() => loadSavedState());
  const [mood, setMood] = useState<PetMoodAnimation>('idle');
  const [eggWobble, setEggWobble] = useState(false);
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [autonomousX, setAutonomousX] = useState(0);
  const [facingRight, setFacingRight] = useState(false);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);

  const moodTimeoutRef = useRef<number | null>(null);
  const statusTimeoutRef = useRef<number | null>(null);
  const petXpCooldownUntilRef = useRef<number>(0);

  const line = getLineById(state.lineId);
  const currentStage = line.stages[state.stageIndex];
  const xpNeeded = getXpForNextLevel(state.level);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  const spawnParticle = useCallback(
    (text: string, tone: FloatingParticle['tone'], x?: number, y?: number) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const px = x ?? 30 + Math.random() * 40;
      const py = y ?? 25 + Math.random() * 30;
      setParticles((prev) => [...prev.slice(-10), { id, text, tone, x: px, y: py }]);
      window.setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== id));
      }, 1300);
    },
    []
  );

  const showStatus = useCallback((msg: string, duration = 2600) => {
    setStatusMessage(msg);
    if (statusTimeoutRef.current) window.clearTimeout(statusTimeoutRef.current);
    statusTimeoutRef.current = window.setTimeout(() => {
      setStatusMessage(null);
    }, duration);
  }, []);

  const triggerMood = useCallback((nextMood: PetMoodAnimation, duration = 900) => {
    setMood(nextMood);
    if (moodTimeoutRef.current) window.clearTimeout(moodTimeoutRef.current);
    moodTimeoutRef.current = window.setTimeout(() => {
      setMood('idle');
    }, duration);
  }, []);

  // Realtime decay / sleep recovery & PokéMart rotation tick
  useEffect(() => {
    const timer = window.setInterval(() => {
      setState((prev) => {
        const now = Date.now();
        const shouldRefreshShop = now >= prev.shopRefreshesAt;
        const nextShopSlots = shouldRefreshShop ? generateShopSlots() : prev.shopSlots;
        const nextShopRefresh = shouldRefreshShop ? now + SHOP_REFRESH_INTERVAL_MS : prev.shopRefreshesAt;

        if (prev.phase !== 'pet') {
          if (!shouldRefreshShop) return prev;
          return { ...prev, shopSlots: nextShopSlots, shopRefreshesAt: nextShopRefresh };
        }
        if (prev.isSleeping) {
          const nextEnergy = clamp(prev.energy + 3.2);
          return {
            ...prev,
            energy: nextEnergy,
            hunger: clamp(prev.hunger - 0.35),
            happiness: clamp(prev.happiness - 0.15),
            shopSlots: nextShopSlots,
            shopRefreshesAt: nextShopRefresh,
            lastActiveAt: now,
          };
        }

        const becameDirty = !prev.isDirty && Math.random() < 0.04;
        return {
          ...prev,
          hunger: clamp(prev.hunger - 0.85),
          happiness: clamp(prev.happiness - (prev.isDirty ? 2.2 : 0.55)),
          energy: clamp(prev.energy - 0.5),
          isDirty: prev.isDirty || becameDirty,
          shopSlots: nextShopSlots,
          shopRefreshesAt: nextShopRefresh,
          lastActiveAt: now,
        };
      });
    }, TICK_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, []);

  const urgentNeed =
    state.phase === 'pet' &&
    !state.isSleeping &&
    (state.hunger <= 35 || state.energy <= 30 || state.isDirty || state.happiness <= 35);

  // Autonomous wandering, micro-reactions & need request bubbles
  useEffect(() => {
    if (state.phase !== 'pet') {
      setAutonomousX(0);
      setSpeechBubble(null);
      return;
    }

    const runBehavior = () => {
      if (state.isSleeping) {
        setAutonomousX(0);
        setSpeechBubble(Math.random() < 0.65 ? 'Zzz... 💤' : null);
        return;
      }

      // 1. Express urgent needs first so the player knows what to care for
      if (state.hunger <= 35) {
        setSpeechBubble(
          Math.random() < 0.5 ? 'Estou com fome! 🫐' : 'Quero comer... 🍽️'
        );
      } else if (state.energy <= 30) {
        setSpeechBubble(
          Math.random() < 0.5 ? 'Que sono... 😴' : 'Preciso dormir! 💤'
        );
      } else if (state.isDirty) {
        setSpeechBubble('Me limpa por favor! 🫧');
      } else if (state.happiness <= 35) {
        setSpeechBubble(
          Math.random() < 0.5 ? 'Brinca comigo? 🥺' : 'Quero carinho... ❤️'
        );
      } else if (Math.random() < 0.48) {
        const happyPhrases = [
          'Tô muito feliz! ✨',
          'Vamos aventurar? ⚔️',
          'Que lugar incrível! 🎵',
          'Adoro ficar com você! 💖',
        ];
        setSpeechBubble(
          happyPhrases[Math.floor(Math.random() * happyPhrases.length)]
        );
      } else {
        setSpeechBubble(null);
      }

      // 2. Autonomous wandering across the habitat ground (slower if tired/hungry)
      const maxRange = state.energy <= 30 || state.hunger <= 30 ? 28 : 68;
      if (Math.random() < 0.78) {
        const nextX = Math.round((Math.random() * 2 - 1) * maxRange);
        setAutonomousX((prevX) => {
          if (Math.abs(nextX - prevX) > 4) {
            setFacingRight(nextX > prevX);
          }
          return nextX;
        });

        // Spontaneous playful hop when healthy and happy
        if (state.energy > 45 && state.happiness > 55 && Math.random() < 0.25) {
          triggerMood('happy', 650);
        }
      }
    };

    runBehavior();
    const aiTimer = window.setInterval(runBehavior, 2900);
    return () => window.clearInterval(aiTimer);
  }, [
    state.energy,
    state.happiness,
    state.hunger,
    state.isDirty,
    state.isSleeping,
    state.phase,
    triggerMood,
  ]);

  // Handle XP gain, Level Up, Evolution (Lv 5 / Lv 10), and Farewell (Lv 15)
  const applyXpAndProgress = useCallback(
    (prev: GameState, gainedXp: number): { next: GameState; evolvedTo?: string; departed?: boolean } => {
      let level = prev.level;
      let xp = prev.xp + gainedXp;
      let stageIndex = prev.stageIndex;
      const petLine = getLineById(prev.lineId);

      while (level < MAX_LEVEL && xp >= getXpForNextLevel(level)) {
        xp -= getXpForNextLevel(level);
        level += 1;
      }

      if (level >= MAX_LEVEL) {
        const finalStage = petLine.stages[2];
        const entry = {
          uid: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          lineId: petLine.lineId,
          finalPokemonId: finalStage.id,
          finalName: finalStage.name,
          type: petLine.type,
          isShiny: prev.isShiny,
          levelReached: MAX_LEVEL,
          hatchedAt: prev.hatchedAt,
          departedAt: Date.now(),
          totalInteractions: prev.totalInteractions + 1,
        };

        return {
          departed: true,
          next: {
            ...prev,
            phase: 'farewell',
            level: MAX_LEVEL,
            xp: 0,
            stageIndex: 2,
            isSleeping: false,
            lastActiveAt: Date.now(),
            hallOfFame: [entry, ...prev.hallOfFame],
          },
        };
      }

      const targetStage = getStageForLevel(petLine, level);
      let evolvedTo: string | undefined;
      if (targetStage.stageIndex > stageIndex) {
        stageIndex = targetStage.stageIndex;
        evolvedTo = targetStage.stage.name;
      }

      return {
        evolvedTo,
        next: {
          ...prev,
          phase: evolvedTo ? 'evolving' : prev.phase,
          level,
          xp,
          stageIndex,
          lastActiveAt: Date.now(),
        },
      };
    },
    []
  );

  // Transition out of evolving phase after flash animation
  useEffect(() => {
    if (state.phase !== 'evolving') return;
    const t = window.setTimeout(() => {
      setState((prev) => (prev.phase === 'evolving' ? { ...prev, phase: 'pet' } : prev));
    }, 1500);
    return () => window.clearTimeout(t);
  }, [state.phase]);

  const startNewEgg = useCallback(() => {
    setState((prev) => {
      const [nextEggLineId, ...restBag] = prev.eggBag;
      const fresh = createInitialGameState(prev.hallOfFame, prev.lineId, nextEggLineId);
      return {
        ...fresh,
        adventureStage: prev.adventureStage,
        coins: prev.coins,
        inventory: prev.inventory,
        shopSlots: prev.shopSlots,
        shopRefreshesAt: prev.shopRefreshesAt,
        eggBag: restBag,
      };
    });
    setMood('idle');
    showStatus('Um novo Ovo Pokémon chegou!');
  }, [showStatus]);

  const chooseStarterEgg = useCallback(
    (lineId: string) => {
      const chosen = getLineById(lineId);
      void triggerHapticMedium();
      setState((prev) => ({
        ...prev,
        lineId: chosen.lineId,
        starterChosen: true,
        eggProgress: 0,
        lastActiveAt: Date.now(),
      }));
      showStatus(`Você escolheu o Ovo de ${chosen.stages[0].name}!`);
    },
    [showStatus]
  );

  const awardBattleResult = useCallback(
    (
      xpGained: number,
      energyCost: number,
      happinessDelta: number,
      message: string,
      options?: {
        advanceStage?: boolean;
        droppedEggLineId?: string;
        coinsGained?: number;
        droppedBerryId?: string;
        droppedStoneId?: string;
      }
    ) => {
      if (xpGained > 0) {
        triggerMood('happy', 900);
        spawnParticle(`🏆 +${xpGained} XP`, 'xp', 38, 26);
      }
      if (happinessDelta > 0) {
        spawnParticle(`❤️ +${happinessDelta} Feliz`, 'heart', 55, 36);
      }
      if (options?.coinsGained) {
        spawnParticle(`🪙 +${options.coinsGained}`, 'sparkle', 68, 26);
      }
      if (options?.droppedBerryId) {
        const berry = getFoodById(options.droppedBerryId);
        if (berry) spawnParticle(`${berry.emoji} ${berry.name}!`, 'clean', 46, 46);
      }
      if (options?.droppedStoneId) {
        const stone = getShopItemById(options.droppedStoneId);
        if (stone) spawnParticle(`${stone.emoji} ${stone.name}!`, 'sparkle', 50, 56);
      }
      if (options?.droppedEggLineId) {
        spawnParticle('🥚 Ovo Raro!', 'sparkle', 50, 64);
      }
      showStatus(message, 3600);

      setState((prev) => {
        const nextInv = { ...prev.inventory };
        if (options?.droppedBerryId) {
          nextInv[options.droppedBerryId] = (nextInv[options.droppedBerryId] ?? 0) + 1;
        }
        if (options?.droppedStoneId) {
          nextInv[options.droppedStoneId] = (nextInv[options.droppedStoneId] ?? 0) + 1;
        }
        const updated: GameState = {
          ...prev,
          energy: clamp(prev.energy - energyCost),
          happiness: clamp(prev.happiness + happinessDelta),
          coins: prev.coins + (options?.coinsGained ?? 0),
          inventory: nextInv,
          quests: xpGained > 0 ? advanceQuestsList(prev.quests, 'battle_win', 1) : prev.quests,
          totalInteractions: prev.totalInteractions + 1,
          adventureStage: options?.advanceStage
            ? prev.adventureStage + 1
            : prev.adventureStage,
          eggBag: options?.droppedEggLineId
            ? [...prev.eggBag, options.droppedEggLineId]
            : prev.eggBag,
          lastActiveAt: Date.now(),
        };
        if (xpGained <= 0) return updated;
        const res = applyXpAndProgress(updated, xpGained);
        if (res.evolvedTo) showStatus(`Evoluiu para ${res.evolvedTo}!`, 3400);
        return res.next;
      });
    },
    [applyXpAndProgress, showStatus, spawnParticle, triggerMood]
  );

  const buyFood = useCallback(
    (itemId: string) => {
      const item = getShopItemById(itemId);
      if (!item) return;
      void triggerHapticMedium();
      setState((prev) => {
        const slotIndex = prev.shopSlots.findIndex((s) => s.itemId === itemId);
        if (slotIndex === -1 || prev.shopSlots[slotIndex].stock <= 0) {
          showStatus('Item esgotado nesta rotação!');
          return prev;
        }
        if (prev.coins < item.price) {
          showStatus('Moedas insuficientes! Vá para a Aventura.');
          return prev;
        }
        const nextSlots = prev.shopSlots.map((slot, idx) =>
          idx === slotIndex ? { ...slot, stock: slot.stock - 1 } : slot
        );
        showStatus(`Comprou ${item.emoji} ${item.name}!`);
        return {
          ...prev,
          coins: prev.coins - item.price,
          shopSlots: nextSlots,
          inventory: {
            ...prev.inventory,
            [item.id]: (prev.inventory[item.id] ?? 0) + 1,
          },
          lastActiveAt: Date.now(),
        };
      });
    },
    [showStatus]
  );

  const refreshShop = useCallback(() => {
    const REROLL_COST = 15;
    void triggerHapticMedium();
    setState((prev) => {
      if (prev.coins < REROLL_COST) {
        showStatus(`Precisa de ${REROLL_COST} moedas para atualizar a loja!`);
        return prev;
      }
      return {
        ...prev,
        coins: prev.coins - REROLL_COST,
        shopSlots: generateShopSlots(),
        shopRefreshesAt: Date.now() + SHOP_REFRESH_INTERVAL_MS,
        lastActiveAt: Date.now(),
      };
    });
  }, [showStatus]);

  const useEvolutionStone = useCallback(
    (stoneId: string) => {
      if (state.phase !== 'pet') return;
      const stone = getShopItemById(stoneId);
      if (!stone || stone.category !== 'stone') return;
      if ((state.inventory[stone.id] ?? 0) <= 0) return;

      const petLine = getLineById(state.lineId);
      if (!stone.stoneTypes?.includes(petLine.type)) {
        showStatus(`${stone.name} não é compatível com ${currentStage.name}!`);
        return;
      }
      if (state.stageIndex >= 2) {
        showStatus(`${currentStage.name} já está na forma final!`);
        return;
      }

      void triggerHapticMedium();
      const nextIndex = (state.stageIndex + 1) as 1 | 2;
      const nextStage = petLine.stages[nextIndex];
      spawnParticle(`${stone.emoji} Evolução!`, 'sparkle', 50, 32);
      showStatus(`${currentStage.name} evoluiu para ${nextStage.name}!`, 3400);

      setState((prev) => ({
        ...prev,
        phase: 'evolving',
        stageIndex: nextIndex,
        level: Math.max(prev.level, nextStage.minLevel),
        xp: 0,
        inventory: {
          ...prev.inventory,
          [stone.id]: Math.max(0, (prev.inventory[stone.id] ?? 1) - 1),
        },
        totalInteractions: prev.totalInteractions + 1,
        lastActiveAt: Date.now(),
      }));
    },
    [currentStage.name, showStatus, spawnParticle, state.inventory, state.lineId, state.phase, state.stageIndex]
  );

  const tapEgg = useCallback(
    (amount = 14) => {
      setEggWobble(true);
      window.setTimeout(() => setEggWobble(false), 450);

      setState((prev) => {
        if (prev.phase !== 'egg') return prev;
        const nextProgress = Math.min(100, prev.eggProgress + amount);
        if (nextProgress >= 100) {
          const petLine = getLineById(prev.lineId);
          void triggerHapticMedium();
          spawnParticle('✨', 'sparkle', 50, 35);
          showStatus(`Nasceu um ${petLine.stages[0].name}!`, 3200);
          return {
            ...prev,
            phase: 'pet',
            eggProgress: 100,
            hatchedAt: Date.now(),
            lastActiveAt: Date.now(),
          };
        }
        return {
          ...prev,
          eggProgress: nextProgress,
          lastActiveAt: Date.now(),
        };
      });
    },
    [showStatus, spawnParticle]
  );

  const feed = useCallback(
    (foodId = 'oran') => {
      if (state.phase !== 'pet' || state.isSleeping) {
        if (state.isSleeping) showStatus('Ele está dormindo! Acorde-o primeiro.');
        return;
      }

      const item = getFoodById(foodId);
      if (!item) return;

      const owned = state.inventory[item.id] ?? 0;
      if (owned <= 0) {
        showStatus(`Sem ${item.name}! Compre na Loja ou ache na Aventura.`);
        return;
      }

      const hungerRestore = item.hungerRestore ?? 0;
      const happinessBonus = item.happinessBonus ?? 0;
      const xpGain = item.levelUp ? getXpForNextLevel(state.level) : (item.xpBonus ?? 0);

      sound.playEat();
      void triggerHapticMedium();
      triggerMood('happy', 850);
      spawnParticle(`${item.emoji} +${hungerRestore} Fome`, 'sparkle', 35, 35);
      spawnParticle(`+${xpGain} XP`, 'xp', 62, 28);

      setState((prev) => {
        const currentQty = prev.inventory[item.id] ?? 0;
        if (currentQty <= 0) return prev;
        const updated: GameState = {
          ...prev,
          hunger: clamp(prev.hunger + hungerRestore),
          happiness: clamp(prev.happiness + happinessBonus),
          inventory: {
            ...prev.inventory,
            [item.id]: currentQty - 1,
          },
          quests: advanceQuestsList(prev.quests, 'feed', 1),
          totalInteractions: prev.totalInteractions + 1,
          isDirty: prev.isDirty || Math.random() < 0.16,
        };
        const res = applyXpAndProgress(updated, xpGain);
        if (res.evolvedTo) {
          sound.playEvolve();
          showStatus(`Evoluiu para ${res.evolvedTo}!`, 3200);
        }
        return res.next;
      });
    },
    [applyXpAndProgress, showStatus, spawnParticle, state.inventory, state.isSleeping, state.level, state.phase, triggerMood]
  );

  const consumeBattleBerry = useCallback((foodId: string) => {
    setState((prev) => {
      const qty = prev.inventory[foodId] ?? 0;
      if (qty <= 0) return prev;
      return {
        ...prev,
        inventory: { ...prev.inventory, [foodId]: qty - 1 },
        lastActiveAt: Date.now(),
      };
    });
  }, []);

  const collectMapLoot = useCallback(
    (loot: { berryId?: string; coins?: number }) => {
      setState((prev) => {
        const nextInv = { ...prev.inventory };
        if (loot.berryId) {
          nextInv[loot.berryId] = (nextInv[loot.berryId] ?? 0) + 1;
        }
        return {
          ...prev,
          coins: prev.coins + (loot.coins ?? 0),
          inventory: nextInv,
          lastActiveAt: Date.now(),
        };
      });
    },
    []
  );

  const advanceAdventureFloor = useCallback(() => {
    setState((prev) => ({
      ...prev,
      adventureStage: prev.adventureStage + 1,
      energy: clamp(prev.energy - 6),
      happiness: clamp(prev.happiness + 4),
      lastActiveAt: Date.now(),
    }));
  }, []);

  const finishMinigame = useCallback(
    (score: number) => {
      const happinessGain = Math.min(32, 12 + score * 2);
      const coinsGain = score * 2;
      sound.playVictory();
      void triggerHapticMedium();
      triggerMood('somersault', 850);
      spawnParticle(`😄 +${happinessGain} Feliz`, 'heart', 40, 34);
      if (coinsGain > 0) {
        spawnParticle(`🪙 +${coinsGain}`, 'sparkle', 65, 28);
      }
      showStatus(`Mini-game: ${score} pts! (+${happinessGain}❤️, +${coinsGain}🪙)`, 3000);

      setState((prev) => ({
        ...prev,
        happiness: clamp(prev.happiness + happinessGain),
        energy: clamp(prev.energy - 10),
        hunger: clamp(prev.hunger - 4),
        coins: prev.coins + coinsGain,
        quests: advanceQuestsList(prev.quests, 'minigame', 1),
        totalInteractions: prev.totalInteractions + 1,
        lastActiveAt: Date.now(),
      }));
    },
    [showStatus, spawnParticle, triggerMood]
  );

  const claimQuest = useCallback(
    (questId: string) => {
      sound.playQuestClaim();
      void triggerHapticMedium();
      setState((prev) => {
        const targetQuest = prev.quests.find((q) => q.id === questId);
        if (!targetQuest || targetQuest.claimed || targetQuest.progress < targetQuest.target) {
          return prev;
        }
        const nextInv = { ...prev.inventory };
        if (targetQuest.rewardBerryId) {
          nextInv[targetQuest.rewardBerryId] =
            (nextInv[targetQuest.rewardBerryId] ?? 0) + 1;
        }
        const updatedQuests = prev.quests.map((q) =>
          q.id === questId ? { ...q, claimed: true } : q
        );
        const allClaimed = updatedQuests.every((q) => q.claimed);
        showStatus(
          allClaimed
            ? 'Todas as missões concluídas! Novas missões chegaram!'
            : `Recompensa resgatada: +${targetQuest.rewardCoins}🪙!`
        );
        return {
          ...prev,
          coins: prev.coins + targetQuest.rewardCoins,
          inventory: nextInv,
          quests: allClaimed ? generateQuests() : updatedQuests,
          lastActiveAt: Date.now(),
        };
      });
    },
    [showStatus]
  );

  const play = useCallback(() => {
    if (state.phase !== 'pet') return;
    if (state.isSleeping) {
      showStatus('Acorde seu Pokémon antes de brincar!');
      return;
    }
    if (state.energy < 12) {
      showStatus('Sem energia! Coloque-o para dormir.');
      return;
    }

    void triggerHapticMedium();
    triggerMood('somersault', 800);
    spawnParticle('😄 +20 Felicidade', 'heart', 45, 36);

    setState((prev) => ({
      ...prev,
      happiness: clamp(prev.happiness + 20),
      energy: clamp(prev.energy - 12),
      hunger: clamp(prev.hunger - 5),
      totalInteractions: prev.totalInteractions + 1,
      lastActiveAt: Date.now(),
    }));
  }, [showStatus, spawnParticle, state.energy, state.isSleeping, state.phase, triggerMood]);

  const toggleSleep = useCallback(() => {
    if (state.phase !== 'pet') return;
    void triggerHapticMedium();
    setState((prev) => {
      const nextSleep = !prev.isSleeping;
      showStatus(nextSleep ? 'Boa noite! Recuperando energia...' : 'Bom dia! Hora de brincar!');
      if (nextSleep) {
        spawnParticle('💤', 'zzz', 60, 28);
      }
      return {
        ...prev,
        isSleeping: nextSleep,
        lastActiveAt: Date.now(),
      };
    });
  }, [showStatus, spawnParticle, state.phase]);

  const cleanAndHeal = useCallback(() => {
    if (state.phase !== 'pet') return;
    if (!state.isDirty) {
      showStatus('Seu Pokémon já está limpinho!');
      return;
    }
    void triggerHapticMedium();
    triggerMood('happy', 800);
    spawnParticle('🫧 Limpo!', 'clean', 46, 34);

    setState((prev) => ({
      ...prev,
      isDirty: false,
      happiness: clamp(prev.happiness + 8),
      totalInteractions: prev.totalInteractions + 1,
      lastActiveAt: Date.now(),
    }));
  }, [showStatus, spawnParticle, state.isDirty, state.phase, triggerMood]);

  const handlePet = useCallback(() => {
    if (state.phase !== 'pet' || state.isSleeping) return;

    const now = Date.now();
    const canGrantXp = now >= petXpCooldownUntilRef.current;
    if (canGrantXp) {
      petXpCooldownUntilRef.current = now + PET_XP_COOLDOWN_MS;
      spawnParticle('+12 XP', 'xp', 62, 26);
    }

    sound.playPet();
    triggerMood('happy', 750);
    spawnParticle('❤️', 'heart', 35 + Math.random() * 30, 28 + Math.random() * 20);

    setState((prev) => {
      const updated: GameState = {
        ...prev,
        happiness: clamp(prev.happiness + 4),
        quests: advanceQuestsList(prev.quests, 'pet', 1),
        totalInteractions: prev.totalInteractions + 1,
      };
      if (!canGrantXp) return { ...updated, lastActiveAt: now };
      const res = applyXpAndProgress(updated, 12);
      if (res.evolvedTo) showStatus(`Evoluiu para ${res.evolvedTo}!`, 3200);
      return res.next;
    });
  }, [applyXpAndProgress, showStatus, spawnParticle, state.isSleeping, state.phase, triggerMood]);

  const handlePoke = useCallback(
    (isOverPoked: boolean) => {
      if (state.phase === 'egg') {
        tapEgg(14);
        return;
      }
      if (state.phase !== 'pet') return;

      if (isOverPoked) {
        triggerMood('dizzy', 3200);
        spawnParticle('😵 Bravo!', 'angry', 50, 26);
        showStatus('Ei! Você cutucou demais e ele ficou tonto! (-2 Felicidade)');
        setState((prev) => ({
          ...prev,
          happiness: clamp(prev.happiness - 2),
          isSleeping: false,
          totalInteractions: prev.totalInteractions + 1,
          lastActiveAt: Date.now(),
        }));
      } else {
        triggerMood('poke', 400);
        spawnParticle(state.isSleeping ? '❗' : '✨', 'sparkle', 50, 30);
        setState((prev) => ({
          ...prev,
          totalInteractions: prev.totalInteractions + 1,
          lastActiveAt: Date.now(),
        }));
      }
    },
    [showStatus, spawnParticle, state.isSleeping, state.phase, tapEgg, triggerMood]
  );

  const handleShake = useCallback(() => {
    if (state.phase === 'egg') {
      tapEgg(22);
      spawnParticle('🥚 Crack!', 'sparkle', 50, 32);
      return;
    }
    if (state.phase !== 'pet') return;

    if (state.isSleeping) {
      triggerMood('poke', 700);
      spawnParticle('❗ Assustado!', 'angry', 50, 26);
      showStatus('Você acordou o Pokémon no susto! (-5 Felicidade)');
      setState((prev) => ({
        ...prev,
        isSleeping: false,
        happiness: clamp(prev.happiness - 5),
        lastActiveAt: Date.now(),
      }));
    } else {
      triggerMood('somersault', 800);
      spawnParticle('🌀 Cambalhota!', 'sparkle', 50, 26);
      setState((prev) => ({
        ...prev,
        happiness: clamp(prev.happiness + 3),
        totalInteractions: prev.totalInteractions + 1,
        lastActiveAt: Date.now(),
      }));
    }
  }, [showStatus, spawnParticle, state.isSleeping, state.phase, tapEgg, triggerMood]);

  return {
    state,
    line,
    currentStage,
    xpNeeded,
    mood,
    eggWobble,
    particles,
    statusMessage,
    autonomousX,
    facingRight,
    speechBubble,
    urgentNeed,
    actions: {
      tapEgg,
      chooseStarterEgg,
      feed,
      buyFood,
      refreshShop,
      useEvolutionStone,
      consumeBattleBerry,
      collectMapLoot,
      advanceAdventureFloor,
      finishMinigame,
      claimQuest,
      play,
      toggleSleep,
      cleanAndHeal,
      handlePet,
      handlePoke,
      handleShake,
      startNewEgg,
      awardBattleResult,
    },
  };
}
