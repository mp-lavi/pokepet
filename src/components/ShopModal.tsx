import { useEffect, useState } from 'react';
import { Clock, Coins, RefreshCw, ShoppingBag, Sparkles, X } from 'lucide-react';
import { EVOLUTION_STONES, getShopItemById } from '../data/pokemonData';
import { ShopSlot } from '../types/game';

interface ShopModalProps {
  open: boolean;
  coins: number;
  inventory: Record<string, number>;
  shopSlots: ShopSlot[];
  shopRefreshesAt: number;
  canUseStone: boolean;
  onBuy: (itemId: string) => void;
  onRefresh: () => void;
  onUseStone: (stoneId: string) => void;
  onClose: () => void;
}

function formatRemaining(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ShopModal({
  open,
  coins,
  inventory,
  shopSlots,
  shopRefreshesAt,
  canUseStone,
  onBuy,
  onRefresh,
  onUseStone,
  onClose,
}: ShopModalProps) {
  const [remainingMs, setRemainingMs] = useState(() => shopRefreshesAt - Date.now());

  useEffect(() => {
    if (!open) return;
    setRemainingMs(shopRefreshesAt - Date.now());
    const id = window.setInterval(() => {
      setRemainingMs(shopRefreshesAt - Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, [open, shopRefreshesAt]);

  if (!open) return null;

  const ownedStones = EVOLUTION_STONES.filter((s) => (inventory[s.id] ?? 0) > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-slate-900 ring-1 ring-white/15 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-sky-400" />
            <div>
              <h2 className="text-base font-bold text-white leading-none">PokéMart</h2>
              <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                <Clock className="h-3 w-3 text-sky-400" />
                <span>Novo estoque em {formatRemaining(remainingMs)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-extrabold text-amber-300 ring-1 ring-amber-400/30">
              <Coins className="h-3.5 w-3.5" />
              <span>{coins}</span>
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
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              5 Ofertas Limitadas
            </span>
            <button
              type="button"
              disabled={coins < 15}
              onClick={onRefresh}
              className="flex items-center gap-1 rounded-xl bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-sky-300 ring-1 ring-white/10 transition hover:bg-slate-700 active:scale-95 disabled:opacity-40"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Atualizar (🪙 15)</span>
            </button>
          </div>

          {shopSlots.map((slot) => {
            const item = getShopItemById(slot.itemId);
            if (!item) return null;
            const owned = inventory[item.id] ?? 0;
            const soldOut = slot.stock <= 0;
            const canAfford = coins >= item.price;

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-3 rounded-2xl bg-slate-800/75 p-3 ring-1 ring-white/10 ${
                  soldOut ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950/70 text-2xl ring-1 ring-white/10">
                    {item.emoji}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-bold text-white">{item.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          soldOut
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {soldOut ? 'Esgotado' : `Estoque: ${slot.stock}`}
                      </span>
                      {owned > 0 && (
                        <span className="rounded-full bg-slate-700/80 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                          Mochila: {owned}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-400">{item.description}</p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={soldOut || !canAfford}
                  onClick={() => onBuy(item.id)}
                  className="flex shrink-0 items-center gap-1 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-2 text-xs font-extrabold text-slate-950 shadow transition active:scale-95 disabled:opacity-35"
                >
                  <Coins className="h-3.5 w-3.5" />
                  <span>{item.price}</span>
                </button>
              </div>
            );
          })}

          {/* Owned Evolution Stones section */}
          {ownedStones.length > 0 && (
            <div className="mt-3 rounded-2xl bg-indigo-950/50 p-3 ring-1 ring-indigo-400/25">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-indigo-200">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Pedras de Evolução na Mochila</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ownedStones.map((stone) => (
                  <button
                    key={stone.id}
                    type="button"
                    disabled={!canUseStone}
                    onClick={() => {
                      onUseStone(stone.id);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-900/90 px-2.5 py-1.5 text-xs font-bold text-white ring-1 ring-white/15 transition hover:bg-slate-800 active:scale-95 disabled:opacity-40"
                  >
                    <span>{stone.emoji}</span>
                    <span>{stone.name}</span>
                    <span className="text-[10px] text-amber-300">
                      x{inventory[stone.id]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
