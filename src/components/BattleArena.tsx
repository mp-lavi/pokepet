import { useEffect, useState } from 'react';
import { Crown, Egg, HeartPulse } from 'lucide-react';
import {
  getAnimatedSpriteUrl,
  getMovesForLine,
  getStaticSpriteUrl,
  getTypeEffectiveness,
  rollAdventureBerryDrop,
  rollAdventureStoneDrop,
  spawnWildOpponent,
  TYPE_META,
  WildOpponent,
} from '../data/pokemonData';
import { triggerHapticMedium, triggerHapticVibrate } from '../hooks/usePetSensors';
import { PokemonMove, PokemonStage, PokemonType } from '../types/game';
import { sound } from '../utils/sound';

interface BattleArenaProps {
  adventureStage: number;
  playerLineId: string;
  playerStage: PokemonStage;
  playerType: PokemonType;
  playerLevel: number;
  playerShiny: boolean;
  playerHappiness: number;
  playerHunger: number;
  inventory: Record<string, number>;
  onUseBattleBerry: (foodId: string) => void;
  onStageClear: (result: {
    xpGained: number;
    coinsGained: number;
    happinessGained: number;
    defeatedName: string;
    droppedEggLineId?: string;
    droppedBerryId?: string;
    droppedStoneId?: string;
    continueNext: boolean;
  }) => void;
  onDefeat: (message: string) => void;
  onExit: (message?: string) => void;
}

function BattleSprite({
  id,
  name,
  hit,
  flip,
  isBoss,
  isShiny = false,
}: {
  id: number;
  name: string;
  hit: boolean;
  flip?: boolean;
  isBoss?: boolean;
  isShiny?: boolean;
}) {
  const [useStatic, setUseStatic] = useState(false);

  useEffect(() => {
    setUseStatic(false);
  }, [id, isShiny]);

  return (
    <img
      src={useStatic ? getStaticSpriteUrl(id, isShiny) : getAnimatedSpriteUrl(id, isShiny)}
      alt={name}
      onError={() => setUseStatic(true)}
      className={`object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.55)] transition-transform duration-150 ${
        isBoss ? 'h-28 w-28' : 'h-24 w-24'
      } ${flip ? '-scale-x-100' : ''} ${
        hit ? 'animate-pet-dizzy brightness-200' : 'animate-pet-breathe'
      }`}
    />
  );
}

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = Math.max(0, Math.min(100, Math.round((current / max) * 100)));
  const color =
    pct > 50 ? 'bg-emerald-400' : pct > 22 ? 'bg-amber-400' : 'bg-rose-500';
  return (
    <div className="w-full">
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-950/90 p-0.5 ring-1 ring-white/15">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-0.5 text-right font-mono text-[10px] text-slate-300">
        {Math.max(0, current)}/{max} HP
      </div>
    </div>
  );
}

export function BattleArena({
  adventureStage,
  playerLineId,
  playerStage,
  playerType,
  playerLevel,
  playerShiny,
  playerHappiness,
  playerHunger,
  inventory,
  onUseBattleBerry,
  onStageClear,
  onDefeat,
  onExit,
}: BattleArenaProps) {
  const [stageNum, setStageNum] = useState(adventureStage);
  const [opponent, setOpponent] = useState<WildOpponent>(() =>
    spawnWildOpponent(adventureStage, playerLevel, playerStage.id)
  );
  const playerMaxHp = 52 + playerLevel * 12;
  const [playerHp, setPlayerHp] = useState(playerMaxHp);
  const [enemyHp, setEnemyHp] = useState(opponent.maxHp);
  const [busy, setBusy] = useState(false);
  const [playerHit, setPlayerHit] = useState(false);
  const [enemyHit, setEnemyHit] = useState(false);
  const [victoryInfo, setVictoryInfo] = useState<{
    xpGained: number;
    coinsGained: number;
    happinessGained: number;
    droppedEggLineId?: string;
    droppedBerry?: { id: string; name: string; emoji: string };
    droppedStone?: { id: string; name: string; emoji: string };
  } | null>(null);
  const [log, setLog] = useState(
    opponent.isBoss
      ? `CHEFE! ${opponent.name} evoluído (Nv.${opponent.level}) bloqueia o caminho!`
      : `Fase ${stageNum}: Um ${opponent.name} selvagem (Nv.${opponent.level}) apareceu!`
  );

  const playerMoves = getMovesForLine(playerLineId, playerType);
  const healBerryId =
    (inventory.sitrus ?? 0) > 0
      ? 'sitrus'
      : (inventory.oran ?? 0) > 0
      ? 'oran'
      : null;

  const calcDamage = (
    move: PokemonMove,
    attackerPower: number,
    attackerType: PokemonType,
    defenderType: PokemonType,
    isPlayer: boolean
  ) => {
    if (Math.random() * 100 > move.accuracy) {
      return { damage: 0, eff: 1, missed: true, immune: false, crit: false };
    }
    const eff = getTypeEffectiveness(move.type, defenderType);
    if (eff === 0) {
      return { damage: 0, eff: 0, missed: false, immune: true, crit: false };
    }
    const stab = move.type === attackerType ? 1.2 : 1;
    const careMod = isPlayer
      ? (playerHappiness >= 70 ? 1.12 : 1) * (playerHunger <= 25 ? 0.85 : 1)
      : 1;
    const critChance = isPlayer && playerHappiness >= 70 ? 0.18 : 0.06;
    const crit = Math.random() < critChance;
    const variance = 0.85 + Math.random() * 0.3;
    const raw =
      ((move.power + attackerPower * 0.65) * stab * eff * careMod * (crit ? 1.5 : 1) * variance) /
      2.4;
    return { damage: Math.max(4, Math.round(raw)), eff, missed: false, immune: false, crit };
  };

  const triggerEnemyTurn = (currentPlayerHp: number, prefixLog?: string) => {
    window.setTimeout(() => {
      const enemyMove =
        opponent.moves[Math.floor(Math.random() * opponent.moves.length)];
      const eRes = calcDamage(enemyMove, opponent.power, opponent.type, playerType, false);

      if (eRes.missed) {
        setLog(`${prefixLog ? `${prefixLog} ` : ''}${opponent.name} usou ${enemyMove.name}, mas errou!`);
        setBusy(false);
        return;
      }
      if (eRes.immune) {
        setLog(`${prefixLog ? `${prefixLog} ` : ''}${opponent.name} usou ${enemyMove.name}... Não teve efeito!`);
        setBusy(false);
        return;
      }

      sound.playHit(eRes.eff > 1.1);
      void triggerHapticVibrate(90);
      setPlayerHit(true);
      window.setTimeout(() => setPlayerHit(false), 380);

      const nextPlayerHp = Math.max(0, currentPlayerHp - eRes.damage);
      setPlayerHp(nextPlayerHp);
      setLog(`${opponent.name} usou ${enemyMove.name}! (-${eRes.damage} HP)`);

      if (nextPlayerHp <= 0) {
        window.setTimeout(() => {
          onDefeat(
            `${playerStage.name} foi derrotado na Fase ${stageNum}! (-22⚡, -12❤️)`
          );
        }, 950);
      } else {
        setBusy(false);
      }
    }, 750);
  };

  const handleMove = (move: PokemonMove) => {
    if (busy || victoryInfo || enemyHp <= 0 || playerHp <= 0) return;
    setBusy(true);

    const playerAtk = playerStage.basePower + playerLevel * 2.2;
    const res = calcDamage(move, playerAtk, playerType, opponent.type, true);

    if (res.missed) {
      setLog(`${playerStage.name} usou ${move.name}, mas errou!`);
    } else if (res.immune) {
      setLog(`${playerStage.name} usou ${move.name}... Não teve efeito! (Imune)`);
    } else {
      sound.playHit(res.eff > 1.1 || res.crit);
      void triggerHapticMedium();
      setEnemyHit(true);
      window.setTimeout(() => setEnemyHit(false), 380);

      const nextEnemyHp = Math.max(0, enemyHp - res.damage);
      setEnemyHp(nextEnemyHp);

      const effText =
        res.eff > 1.1
          ? ' Super efetivo!'
          : res.eff < 0.9
          ? ' Pouco efetivo...'
          : '';
      const critText = res.crit ? ' 💥 CRÍTICO!' : '';
      setLog(`${playerStage.name} usou ${move.name}!${critText}${effText} (-${res.damage} HP)`);

      if (nextEnemyHp <= 0) {
        const xpReward = (opponent.isBoss ? 65 : 32) + opponent.level * 5;
        const coinsReward = (opponent.isBoss ? 80 : 25) + opponent.level * 4;
        const happinessReward = opponent.isBoss ? 18 : 14;
        const droppedEgg =
          opponent.isBoss && Math.random() < 0.55 ? opponent.lineId : undefined;
        const droppedBerry = rollAdventureBerryDrop(opponent.isBoss);
        const droppedStone = rollAdventureStoneDrop(opponent.isBoss);

        window.setTimeout(() => {
          sound.playVictory();
          void triggerHapticMedium();
          setBusy(false);
          setVictoryInfo({
            xpGained: xpReward,
            coinsGained: coinsReward,
            happinessGained: happinessReward,
            droppedEggLineId: droppedEgg,
            droppedBerry: droppedBerry
              ? { id: droppedBerry.id, name: droppedBerry.name, emoji: droppedBerry.emoji }
              : undefined,
            droppedStone: droppedStone
              ? { id: droppedStone.id, name: droppedStone.name, emoji: droppedStone.emoji }
              : undefined,
          });
        }, 700);
        return;
      }
    }

    triggerEnemyTurn(playerHp);
  };

  const handleBattleHeal = () => {
    if (busy || victoryInfo || !healBerryId || playerHp >= playerMaxHp) return;
    setBusy(true);
    const healAmount = healBerryId === 'sitrus' ? 50 : 28;
    const healedHp = Math.min(playerMaxHp, playerHp + healAmount);
    setPlayerHp(healedHp);
    onUseBattleBerry(healBerryId);
    sound.playEat();
    const label = healBerryId === 'sitrus' ? 'Sitrus Berry' : 'Oran Berry';
    setLog(`${playerStage.name} comeu ${label} (+${healedHp - playerHp} HP)!`);
    triggerEnemyTurn(healedHp);
  };

  const handleNextOrReturn = (continueNext: boolean) => {
    if (!victoryInfo) return;

    // Random Adventure Event when advancing!
    let bonusCoins = 0;
    let eventBanner = '';
    let nextHp = playerHp;

    if (continueNext) {
      const eventRoll = Math.random();
      if (eventRoll < 0.16) {
        const heal = Math.round(playerMaxHp * 0.35);
        nextHp = Math.min(playerMaxHp, playerHp + heal);
        eventBanner = `♨️ Fonte Termal! (+${nextHp - playerHp} HP) `;
      } else if (eventRoll < 0.32) {
        bonusCoins = 25 + Math.floor(Math.random() * 20);
        eventBanner = `🎁 Baú encontrado! (+${bonusCoins}🪙) `;
      } else if (eventRoll < 0.42 && playerHp > 14) {
        nextHp = Math.max(8, playerHp - 10);
        eventBanner = `⚠️ Emboscada no caminho! (-10 HP) `;
      }
    }

    onStageClear({
      xpGained: victoryInfo.xpGained,
      coinsGained: victoryInfo.coinsGained + bonusCoins,
      happinessGained: victoryInfo.happinessGained,
      defeatedName: opponent.name,
      droppedEggLineId: victoryInfo.droppedEggLineId,
      droppedBerryId: victoryInfo.droppedBerry?.id,
      droppedStoneId: victoryInfo.droppedStone?.id,
      continueNext,
    });

    if (continueNext) {
      const nextStage = stageNum + 1;
      const nextOpp = spawnWildOpponent(nextStage, playerLevel, playerStage.id);
      setStageNum(nextStage);
      setOpponent(nextOpp);
      setPlayerHp(nextHp);
      setEnemyHp(nextOpp.maxHp);
      setVictoryInfo(null);
      setLog(
        `${eventBanner}${
          nextOpp.isBoss
            ? `CHEFE! ${nextOpp.name} evoluído (Nv.${nextOpp.level}) apareceu!`
            : `Fase ${nextStage}: Um ${nextOpp.name} selvagem (Nv.${nextOpp.level}) apareceu!`
        }`
      );
    }
  };

  return (
    <div className="relative z-20 flex h-full w-full flex-col justify-between p-3">
      {/* Stage Counter Banner */}
      <div className="flex items-center justify-center gap-2">
        <div
          className={`flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[10px] font-extrabold tracking-wide ring-1 backdrop-blur-sm ${
            opponent.isBoss
              ? 'bg-amber-500/25 text-amber-200 ring-amber-400/50'
              : 'bg-slate-950/70 text-slate-200 ring-white/15'
          }`}
        >
          {opponent.isBoss && <Crown className="h-3 w-3 text-amber-300" />}
          <span>
            {opponent.isBoss ? `FASE ${stageNum} • CHEFE` : `AVENTURA • FASE ${stageNum}`}
          </span>
        </div>
        {playerHappiness >= 70 && (
          <span className="rounded-full bg-pink-500/20 px-2 py-0.5 text-[9px] font-bold text-pink-200 ring-1 ring-pink-400/35">
            💖 Vínculo +Crítico
          </span>
        )}
      </div>

      {/* Top Enemy Row */}
      <div className="flex items-start justify-between gap-2">
        <div
          className={`w-36 rounded-2xl bg-slate-950/75 p-2 ring-1 backdrop-blur-sm ${
            opponent.isBoss ? 'ring-amber-400/50' : 'ring-white/15'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span className="truncate">{opponent.name}</span>
            <span className="text-[10px] text-amber-300">Nv.{opponent.level}</span>
          </div>
          <span className="mb-1 inline-block text-[9px] font-bold uppercase tracking-wider text-slate-400">
            {opponent.type} {opponent.isBoss ? '• CHEFE' : ''}
          </span>
          <HpBar current={enemyHp} max={opponent.maxHp} />
        </div>

        <div className="flex flex-1 items-center justify-center pt-1">
          <BattleSprite
            id={opponent.id}
            name={opponent.name}
            hit={enemyHit}
            isBoss={opponent.isBoss}
          />
        </div>
      </div>

      {/* Bottom Player Row */}
      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-1 items-center justify-center">
          <BattleSprite
            id={playerStage.id}
            name={playerStage.name}
            hit={playerHit}
            isShiny={playerShiny}
            flip
          />
        </div>

        <div className="w-36 rounded-2xl bg-slate-950/75 p-2 ring-1 ring-white/15 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span className="truncate">
              {playerShiny ? '✨ ' : ''}
              {playerStage.name}
            </span>
            <span className="text-[10px] text-amber-300">Nv.{playerLevel}</span>
          </div>
          <span className="mb-1 inline-block text-[9px] font-bold uppercase tracking-wider text-slate-400">
            {playerType}
          </span>
          <HpBar current={playerHp} max={playerMaxHp} />
        </div>
      </div>

      {/* Victory Overlay or Combat Moves */}
      {victoryInfo ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-950/90 p-3 text-center ring-1 ring-amber-400/40 backdrop-blur-md">
          <p className="text-xs font-extrabold text-amber-300">
            Vitória na Fase {stageNum}! (+{victoryInfo.xpGained} XP • 🪙 +{victoryInfo.coinsGained} • ❤️ +{victoryInfo.happinessGained})
          </p>
          {victoryInfo.droppedBerry && (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-0.5 text-[11px] font-bold text-emerald-200 ring-1 ring-emerald-400/40">
              <span>{victoryInfo.droppedBerry.emoji}</span>
              <span>Dropou {victoryInfo.droppedBerry.name}!</span>
            </div>
          )}
          {victoryInfo.droppedStone && (
            <div className="flex items-center gap-1.5 rounded-full bg-indigo-500/25 px-3 py-0.5 text-[11px] font-bold text-indigo-200 ring-1 ring-indigo-400/50">
              <span>{victoryInfo.droppedStone.emoji}</span>
              <span>Drop Raro: {victoryInfo.droppedStone.name}!</span>
            </div>
          )}
          {victoryInfo.droppedEggLineId && (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-[11px] font-bold text-amber-200 ring-1 ring-amber-400/40">
              <Egg className="h-3.5 w-3.5 text-amber-300" />
              <span>O Chefe dropou um Ovo Pokémon!</span>
            </div>
          )}
          <div className="flex w-full gap-2">
            <button
              type="button"
              onClick={() => handleNextOrReturn(false)}
              className="flex-1 rounded-xl bg-slate-800 py-2 text-[11px] font-bold text-slate-200 ring-1 ring-white/10 hover:bg-slate-700 active:scale-95"
            >
              Voltar p/ Casa
            </button>
            <button
              type="button"
              onClick={() => handleNextOrReturn(true)}
              className="flex-1 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-2 text-[11px] font-extrabold text-slate-950 shadow-md active:scale-95"
            >
              Fase {stageNum + 1} →
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 rounded-2xl bg-slate-950/85 p-2.5 ring-1 ring-white/15 backdrop-blur-md">
          <div className="flex items-center justify-between gap-1.5">
            <p className="flex-1 text-[11px] font-semibold text-slate-100 leading-tight">
              {log}
            </p>
            {healBerryId && playerHp < playerMaxHp && (
              <button
                type="button"
                disabled={busy}
                onClick={handleBattleHeal}
                className="flex shrink-0 items-center gap-1 rounded-lg bg-emerald-500/25 px-2 py-1 text-[10px] font-bold text-emerald-200 ring-1 ring-emerald-400/40 hover:bg-emerald-500/35 disabled:opacity-40"
              >
                <HeartPulse className="h-3 w-3" />
                <span>{healBerryId === 'sitrus' ? '🍋 +50' : '🫐 +28'}</span>
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => onExit('Você fugiu da batalha em segurança.')}
              className="shrink-0 rounded-lg bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-300 ring-1 ring-white/10 hover:bg-slate-700 disabled:opacity-40"
            >
              Fugir
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {playerMoves.map((move) => {
              const meta = TYPE_META[move.type];
              const eff = getTypeEffectiveness(move.type, opponent.type);
              const effSign = eff > 1 ? '+' : eff < 1 ? '-' : '=';
              const effBadgeClass =
                eff > 1
                  ? 'bg-emerald-500/30 text-emerald-200 ring-emerald-400/50'
                  : eff < 1
                  ? 'bg-rose-500/30 text-rose-200 ring-rose-400/50'
                  : 'bg-white/10 text-slate-300 ring-white/15';
              const effTitle =
                eff > 1
                  ? 'Super efetivo (2x)'
                  : eff === 0
                  ? 'Sem efeito / Imune (0x)'
                  : eff < 1
                  ? 'Pouco efetivo (0.5x)'
                  : 'Dano normal (1x)';

              return (
                <button
                  key={move.id}
                  type="button"
                  disabled={busy}
                  onClick={() => handleMove(move)}
                  className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-left ring-1 transition active:scale-95 disabled:opacity-45 ${meta.buttonClass}`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="shrink-0 text-xs">{meta.emoji}</span>
                    <span className="truncate text-[11px] font-bold">
                      {move.name}
                    </span>
                  </div>
                  <div className="ml-1 flex shrink-0 items-center gap-1">
                    <span
                      title={effTitle}
                      className={`flex h-4 w-4 items-center justify-center rounded-md text-[10px] font-black ring-1 ${effBadgeClass}`}
                    >
                      {effSign}
                    </span>
                    <span className="font-mono text-[10px] opacity-80">
                      {move.power}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
