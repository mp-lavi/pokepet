import { Backpack, Egg, X } from 'lucide-react';
import { getLineById, SHOP_ITEMS } from '../data/pokemonData';

interface BackpackModalProps {
  open: boolean;
  inventory: Record<string, number>;
  eggBag: string[];
  canUseItems: boolean;
  onUseFood: (foodId: string) => void;
  onUseStone: (stoneId: string) => void;
  onClose: () => void;
}

export function BackpackModal({
  open,
  inventory,
  eggBag,
  canUseItems,
  onUseFood,
  onUseStone,
  onClose,
}: BackpackModalProps) {
  if (!open) return null;

  const ownedItems = SHOP_ITEMS.filter((item) => (inventory[item.id] ?? 0) > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[82dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-slate-900 ring-1 ring-white/15 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <Backpack className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Mochila</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
          {ownedItems.length === 0 && eggBag.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
              <Backpack className="mb-2 h-10 w-10 text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">
                Sua mochila está vazia
              </p>
              <p className="mt-1 max-w-xs text-xs text-slate-400">
                Compre Berries e Pedras na PokéMart ou derrote Pokémon na Aventura para conseguir drops!
              </p>
            </div>
          ) : (
            <>
              {ownedItems.map((item) => {
                const count = inventory[item.id] ?? 0;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-slate-800/75 p-3 ring-1 ring-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950/70 text-2xl ring-1 ring-white/10">
                        {item.emoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{item.name}</span>
                          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-300">
                            x{count}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!canUseItems}
                      onClick={() => {
                        if (item.category === 'food') {
                          onUseFood(item.id);
                        } else {
                          onUseStone(item.id);
                        }
                        onClose();
                      }}
                      className="shrink-0 rounded-xl bg-emerald-500/20 px-3 py-2 text-xs font-extrabold text-emerald-200 ring-1 ring-emerald-400/40 transition hover:bg-emerald-500/30 active:scale-95 disabled:opacity-35"
                    >
                      Usar
                    </button>
                  </div>
                );
              })}

              {eggBag.length > 0 && (
                <div className="rounded-2xl bg-pink-950/40 p-3 ring-1 ring-pink-400/30">
                  <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-pink-200">
                    <Egg className="h-4 w-4 text-pink-300" />
                    <span>Ovos Raros Guardados ({eggBag.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {eggBag.map((lineId, idx) => {
                      const l = getLineById(lineId);
                      return (
                        <span
                          key={`${lineId}-${idx}`}
                          className="rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-bold text-slate-200 ring-1 ring-white/10"
                        >
                          🥚 Ovo de {l.stages[0].name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
