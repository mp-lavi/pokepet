import { useState } from 'react';
import { Backpack, Coins, Smartphone, Sparkles } from 'lucide-react';
import { ActionDeck } from './components/ActionDeck';
import { BackpackModal } from './components/BackpackModal';
import { BattleArena } from './components/BattleArena';
import { EggStage } from './components/EggStage';
import { HabitatBackground } from './components/HabitatBackground';
import { HallOfFameModal } from './components/HallOfFameModal';
import { PokedexIcon } from './components/PokedexIcon';
import { PokemonSprite } from './components/PokemonSprite';
import { ShopModal } from './components/ShopModal';
import { StarterEggPicker } from './components/StarterEggPicker';
import { StatusBars } from './components/StatusBars';
import { useGameLoop } from './hooks/useGameLoop';
import { usePetSensors } from './hooks/usePetSensors';

export function App() {
  const [hallOpen, setHallOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [inBattle, setInBattle] = useState(false);

  const {
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
    actions,
  } = useGameLoop();

  const sensors = usePetSensors({
    enabled:
      !inBattle &&
      ((state.phase === 'egg' && state.starterChosen) || state.phase === 'pet'),
    onPet: actions.handlePet,
    onPoke: actions.handlePoke,
    onShake: actions.handleShake,
  });

  const isEgg = state.phase === 'egg';

  const handleStartAdventure = () => {
    if (state.phase !== 'pet' || state.isSleeping) return;
    if (state.energy < 15) {
      actions.awardBattleResult(0, 0, 0, 'Sem energia para aventurar! Descanse primeiro.');
      return;
    }
    setInBattle(true);
  };

  return (
    <div className="relative mx-auto flex h-[100dvh] w-full max-w-md flex-col justify-between overflow-hidden bg-slate-950 text-slate-100">
      {/* Full-Screen Natural Habitat Background */}
      <HabitatBackground
        type={line.type}
        isEgg={isEgg}
        isSleeping={state.isSleeping && !inBattle}
      />

      {/* Night / Sleep dimmer */}
      <div
        className={`pointer-events-none absolute inset-0 z-10 bg-slate-950/55 transition-opacity duration-500 ${
          state.isSleeping && !inBattle ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Floating Top HUD (Header + Status Bars) */}
      <header className="relative z-20 flex flex-col gap-2 px-3 pt-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 rounded-2xl bg-slate-950/55 px-2.5 py-1.5 ring-1 ring-white/15 backdrop-blur-md">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 shadow-md">
              <span className="text-xs font-black text-white">P</span>
            </div>
            <div>
              <h1 className="text-xs font-extrabold tracking-tight text-white leading-none">
                PokéPet
              </h1>
              <p className="mt-0.5 text-[10px] font-semibold text-slate-300 leading-none">
                {isEgg
                  ? 'Ovo Misterioso'
                  : `${currentStage.name} • ${line.type.toUpperCase()}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setBagOpen(true)}
              title="Abrir Mochila (Berries, Pedras e Ovos)"
              className="flex items-center gap-1 rounded-xl bg-slate-950/60 px-2 py-1.5 text-[11px] font-bold text-emerald-200 ring-1 ring-emerald-400/35 backdrop-blur-md transition hover:bg-slate-900/80 active:scale-95"
            >
              <Backpack className="h-3.5 w-3.5 text-emerald-300" />
              <span>
                {Object.values(state.inventory).reduce((a, b) => a + b, 0) +
                  state.eggBag.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShopOpen(true)}
              title="Abrir PokéMart (Loja de Berries)"
              className="flex items-center gap-1 rounded-xl bg-slate-950/60 px-2.5 py-1.5 text-[11px] font-bold text-sky-200 ring-1 ring-sky-400/35 backdrop-blur-md transition hover:bg-slate-900/80 active:scale-95"
            >
              <Coins className="h-3.5 w-3.5 text-amber-300" />
              <span>{state.coins}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                void sensors.requestMotionPermission();
                sensors.triggerSimulatedShake();
              }}
              title="Simular Chacoalhada (Shake)"
              className="flex items-center gap-1 rounded-xl bg-slate-950/60 px-2 py-1.5 text-[11px] font-semibold text-slate-200 ring-1 ring-white/15 backdrop-blur-md transition hover:bg-slate-900/80 active:scale-95"
            >
              <Smartphone className="h-3.5 w-3.5 text-sky-400" />
            </button>

            <button
              type="button"
              onClick={() => setHallOpen(true)}
              title="Abrir Pokédex & Hall da Fama"
              className="flex items-center gap-1 rounded-xl bg-slate-950/60 px-2.5 py-1.5 text-[11px] font-bold text-rose-200 ring-1 ring-rose-400/35 backdrop-blur-md transition hover:bg-slate-900/80 active:scale-95"
            >
              <PokedexIcon className="h-4 w-4" />
              <span>{state.hallOfFame.length}</span>
            </button>
          </div>
        </div>

        <StatusBars
          hunger={state.hunger}
          happiness={state.happiness}
          energy={state.energy}
          level={state.level}
          xp={state.xp}
          xpNeeded={xpNeeded}
          isEgg={isEgg}
        />
      </header>

      {/* Interactive Center-Bottom Ground Stage */}
      <main
        {...(!inBattle ? sensors.gestureHandlers : {})}
        className="relative z-10 flex flex-1 flex-col items-center justify-end pb-5 touch-none"
      >
        {inBattle && state.phase === 'pet' ? (
          <BattleArena
            adventureStage={state.adventureStage}
            playerLineId={line.lineId}
            playerStage={currentStage}
            playerType={line.type}
            playerLevel={state.level}
            onStageClear={({
              xpGained,
              coinsGained,
              happinessGained,
              defeatedName,
              droppedEggLineId,
              droppedBerryId,
              droppedStoneId,
              continueNext,
            }) => {
              if (!continueNext) setInBattle(false);
              const eggMsg = droppedEggLineId ? ' + 🥚 Ovo Raro!' : '';
              actions.awardBattleResult(
                xpGained,
                14,
                happinessGained,
                `Vitória contra ${defeatedName}! (+${xpGained} XP, +${coinsGained}🪙, +${happinessGained}❤️${eggMsg})`,
                {
                  advanceStage: true,
                  droppedEggLineId,
                  coinsGained,
                  droppedBerryId,
                  droppedStoneId,
                }
              );
            }}
            onDefeat={(msg) => {
              setInBattle(false);
              actions.awardBattleResult(0, 22, -12, msg);
            }}
            onExit={(msg) => {
              setInBattle(false);
              if (msg) {
                actions.awardBattleResult(0, 6, 0, msg);
              }
            }}
          />
        ) : (
          <>
            {/* Petting active indicator */}
            {sensors.isPetting && (
              <div className="pointer-events-none absolute top-3 z-20 flex items-center gap-1 rounded-full bg-pink-500/30 px-3 py-1 text-[11px] font-bold text-pink-100 ring-1 ring-pink-300/50 backdrop-blur-md">
                <span>💖 Fazendo carinho...</span>
              </div>
            )}

            {/* Evolving banner */}
            {state.phase === 'evolving' && (
              <div className="pointer-events-none absolute top-4 z-30 flex items-center gap-1.5 rounded-full bg-amber-400/30 px-4 py-1.5 text-xs font-extrabold text-amber-100 ring-1 ring-amber-300/60 backdrop-blur-md animate-pulse">
                <Sparkles className="h-4 w-4" />
                <span>Evoluindo para {currentStage.name}!</span>
              </div>
            )}

            {/* Status Toast */}
            {statusMessage && (
              <div className="pointer-events-none absolute top-3 right-3 left-3 z-20 mx-auto w-fit max-w-[90%] rounded-full bg-slate-950/80 px-3 py-1 text-center text-[11px] font-semibold text-white ring-1 ring-white/20 backdrop-blur-md shadow-lg">
                {statusMessage}
              </div>
            )}

            {/* Floating Particles */}
            {particles.map((p) => (
              <span
                key={p.id}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                className={`pointer-events-none absolute z-30 -translate-x-1/2 text-xs font-extrabold drop-shadow animate-float-up ${
                  p.tone === 'heart'
                    ? 'text-pink-300 text-base'
                    : p.tone === 'xp'
                    ? 'text-amber-300'
                    : p.tone === 'angry'
                    ? 'text-rose-300'
                    : p.tone === 'clean'
                    ? 'text-emerald-300'
                    : 'text-sky-200'
                }`}
              >
                {p.text}
              </span>
            ))}

            {/* Pet or Egg anchored to the natural ground */}
            <div className="relative z-10 flex flex-col items-center justify-end">
              {isEgg ? (
                state.starterChosen ? (
                  <EggStage
                    eggColor={line.eggColor}
                    eggSpotColor={line.eggSpotColor}
                    progress={state.eggProgress}
                    wobble={eggWobble}
                    tilt={sensors.tilt}
                  />
                ) : (
                  <StarterEggPicker onSelect={actions.chooseStarterEgg} />
                )
              ) : (
                <>
                  <PokemonSprite
                    pokemonId={currentStage.id}
                    name={currentStage.name}
                    phase={state.phase}
                    mood={mood}
                    isSleeping={state.isSleeping}
                    isDirty={state.isDirty}
                    tilt={sensors.tilt}
                    autonomousX={autonomousX}
                    facingRight={facingRight}
                    speechBubble={speechBubble}
                    urgentNeed={urgentNeed}
                  />
                  {state.phase !== 'farewell' && (
                    <div className="mt-2 flex items-center gap-2.5 rounded-full bg-slate-950/60 px-3 py-0.5 text-[10px] font-bold text-slate-200 ring-1 ring-white/15 backdrop-blur-md">
                      <span>⚔️ {currentStage.basePower}</span>
                      <span>⚡ {currentStage.baseSpeed}</span>
                      <span>✨ {currentStage.baseCharm}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Farewell Prestige Overlay */}
            {state.phase === 'farewell' && (
              <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/80 p-5 text-center backdrop-blur-sm">
                <Sparkles className="mb-2 h-8 w-8 text-amber-300 animate-bounce" />
                <h2 className="text-lg font-extrabold text-white">
                  Até logo, {currentStage.name}!
                </h2>
                <p className="mt-1.5 max-w-xs text-xs text-slate-300">
                  Seu parceiro atingiu o Nível 60 e partiu para viver livre na natureza. Ele foi eternizado no seu Hall da Fama!
                </p>
                <button
                  type="button"
                  onClick={actions.startNewEgg}
                  className="mt-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg transition active:scale-95"
                >
                  Receber Novo Ovo
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Bottom Action Deck over the Habitat */}
      <footer className="relative z-20 flex flex-col gap-1.5 px-3 pb-3">
        <ActionDeck
          phase={state.phase}
          isSleeping={state.isSleeping}
          isDirty={state.isDirty}
          inBattle={inBattle}
          inventory={state.inventory}
          onFeed={actions.feed}
          onOpenShop={() => setShopOpen(true)}
          onPlay={actions.play}
          onAdventure={handleStartAdventure}
          onToggleSleep={actions.toggleSleep}
          onClean={actions.cleanAndHeal}
        />

        <p className="text-center text-[10px] font-medium text-slate-200/80 drop-shadow">
          Deslize 1s para carinho • Toque para cutucar • Incline ou chacoalhe
        </p>
      </footer>

      <HallOfFameModal
        open={hallOpen}
        entries={state.hallOfFame}
        onClose={() => setHallOpen(false)}
      />

      <ShopModal
        open={shopOpen}
        coins={state.coins}
        inventory={state.inventory}
        shopSlots={state.shopSlots}
        shopRefreshesAt={state.shopRefreshesAt}
        canUseStone={state.phase === 'pet' && !state.isSleeping}
        onBuy={actions.buyFood}
        onRefresh={actions.refreshShop}
        onUseStone={actions.useEvolutionStone}
        onClose={() => setShopOpen(false)}
      />

      <BackpackModal
        open={bagOpen}
        inventory={state.inventory}
        eggBag={state.eggBag}
        canUseItems={state.phase === 'pet' && !state.isSleeping}
        onUseFood={actions.feed}
        onUseStone={actions.useEvolutionStone}
        onClose={() => setBagOpen(false)}
      />
    </div>
  );
}

export default App;
