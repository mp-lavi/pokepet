import { useState } from 'react';
import { Compass, Gamepad2, Moon, ShoppingBag, Sparkles, Sun, Utensils } from 'lucide-react';
import { FOOD_ITEMS } from '../data/pokemonData';
import { PetPhase } from '../types/game';

interface ActionDeckProps {
  phase: PetPhase;
  isSleeping: boolean;
  isDirty: boolean;
  inBattle: boolean;
  inventory: Record<string, number>;
  onFeed: (foodId: string) => void;
  onOpenShop: () => void;
  onPlay: () => void;
  onToggleSleep: () => void;
  onClean: () => void;
  onAdventure: () => void;
}

export function ActionDeck({
  phase,
  isSleeping,
  isDirty,
  inBattle,
  inventory,
  onFeed,
  onOpenShop,
  onPlay,
  onToggleSleep,
  onClean,
  onAdventure,
}: ActionDeckProps) {
  const [foodTrayOpen, setFoodTrayOpen] = useState(false);
  const disabled = phase !== 'pet' || inBattle;

  const totalFood = FOOD_ITEMS.reduce(
    (sum, item) => sum + (inventory[item.id] ?? 0),
    0
  );

  return (
    <div className="relative">
      {/* Compact Berry / Food Picker Tray */}
      {foodTrayOpen && !disabled && !isSleeping && (
        <div className="absolute bottom-full left-0 right-0 z-30 mb-2 flex items-center justify-between gap-1.5 rounded-2xl bg-slate-900/95 p-2 ring-1 ring-white/15 shadow-xl backdrop-blur-md">
          <div className="flex flex-1 items-center gap-1.5 overflow-x-auto">
            {FOOD_ITEMS.map((item) => {
              const count = inventory[item.id] ?? 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={count <= 0}
                  onClick={() => {
                    onFeed(item.id);
                    setFoodTrayOpen(false);
                  }}
                  className="flex shrink-0 items-center gap-1 rounded-xl bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-white ring-1 ring-white/10 transition active:scale-95 disabled:opacity-35"
                >
                  <span>{item.emoji}</span>
                  <span className="text-[11px]">{item.name.split(' ')[0]}</span>
                  <span className="rounded-md bg-slate-950/80 px-1 text-[10px] text-amber-300">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              setFoodTrayOpen(false);
              onOpenShop();
            }}
            className="flex shrink-0 items-center gap-1 rounded-xl bg-sky-500/20 px-2.5 py-1.5 text-[11px] font-bold text-sky-200 ring-1 ring-sky-400/30"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Loja</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-5 gap-1.5">
        <button
          type="button"
          disabled={disabled || isSleeping}
          onClick={() => {
            if (totalFood <= 0) {
              onOpenShop();
            } else {
              setFoodTrayOpen((v) => !v);
            }
          }}
          className="relative flex flex-col items-center justify-center gap-1 rounded-2xl bg-slate-950/60 py-2.5 px-1 text-orange-200 ring-1 ring-orange-400/35 backdrop-blur-md transition active:scale-95 disabled:opacity-40"
        >
          <span className="absolute -right-1 -top-1 rounded-full bg-slate-900 px-1.5 py-0.2 text-[9px] font-extrabold text-amber-300 ring-1 ring-white/15">
            {totalFood}
          </span>
          <Utensils className="h-4 w-4" />
          <span className="text-[10px] font-bold">Alimentar</span>
        </button>

        <button
          type="button"
          disabled={disabled || isSleeping}
          onClick={() => {
            setFoodTrayOpen(false);
            onPlay();
          }}
          className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-slate-950/60 py-2.5 px-1 text-sky-200 ring-1 ring-sky-400/35 backdrop-blur-md transition active:scale-95 disabled:opacity-40"
        >
          <Gamepad2 className="h-4 w-4" />
          <span className="text-[10px] font-bold">Brincar</span>
        </button>

        <button
          type="button"
          disabled={disabled || isSleeping}
          onClick={() => {
            setFoodTrayOpen(false);
            onAdventure();
          }}
          className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-slate-950/60 py-2.5 px-1 text-rose-200 ring-1 ring-rose-400/35 backdrop-blur-md transition active:scale-95 disabled:opacity-40"
        >
          <Compass className="h-4 w-4" />
          <span className="text-[10px] font-bold">Aventura</span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setFoodTrayOpen(false);
            onToggleSleep();
          }}
          className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2.5 px-1 ring-1 backdrop-blur-md transition active:scale-95 disabled:opacity-40 ${
            isSleeping
              ? 'bg-amber-950/65 text-amber-200 ring-amber-400/45'
              : 'bg-slate-950/60 text-indigo-200 ring-indigo-400/35'
          }`}
        >
          {isSleeping ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="text-[10px] font-bold">{isSleeping ? 'Acordar' : 'Dormir'}</span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setFoodTrayOpen(false);
            onClean();
          }}
          className={`relative flex flex-col items-center justify-center gap-1 rounded-2xl bg-slate-950/60 py-2.5 px-1 text-emerald-200 ring-1 ring-emerald-400/35 backdrop-blur-md transition active:scale-95 disabled:opacity-40 ${
            isDirty ? 'animate-pulse ring-2 ring-amber-400' : ''
          }`}
        >
          {isDirty && (
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
            </span>
          )}
          <Sparkles className="h-4 w-4" />
          <span className="text-[10px] font-bold">Limpar</span>
        </button>
      </div>
    </div>
  );
}
