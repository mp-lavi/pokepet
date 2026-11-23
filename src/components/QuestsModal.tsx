import { CheckCircle2, ClipboardList, Coins, X } from 'lucide-react';
import { getFoodById } from '../data/pokemonData';
import { QuestItem } from '../types/game';

interface QuestsModalProps {
  open: boolean;
  quests: QuestItem[];
  onClaim: (questId: string) => void;
  onClose: () => void;
}

export function QuestsModal({ open, quests, onClaim, onClose }: QuestsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[82dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-slate-900 ring-1 ring-white/15 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white leading-none">Missões</h2>
              <p className="mt-0.5 text-[10px] text-slate-400">
                Complete as 3 missões para receber novas!
              </p>
            </div>
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
          {quests.map((q) => {
            const done = q.progress >= q.target;
            const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
            const berry = q.rewardBerryId ? getFoodById(q.rewardBerryId) : undefined;

            return (
              <div
                key={q.id}
                className={`flex items-center justify-between gap-3 rounded-2xl p-3 ring-1 ${
                  q.claimed
                    ? 'bg-slate-800/40 ring-white/5 opacity-60'
                    : done
                    ? 'bg-amber-500/15 ring-amber-400/40'
                    : 'bg-slate-800/75 ring-white/10'
                }`}
              >
                <div className="flex-1">
                  <p className="text-xs font-bold text-white">{q.title}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-950/80">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] font-bold text-slate-300">
                      {Math.min(q.progress, q.target)}/{q.target}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] font-bold text-amber-300">
                    <span className="flex items-center gap-0.5">
                      <Coins className="h-3 w-3" /> +{q.rewardCoins}
                    </span>
                    {berry && (
                      <span className="text-emerald-300">
                        + {berry.emoji} {berry.name}
                      </span>
                    )}
                  </div>
                </div>

                {q.claimed ? (
                  <span className="flex items-center gap-1 rounded-xl bg-slate-800 px-2.5 py-1.5 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Feito</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={!done}
                    onClick={() => onClaim(q.id)}
                    className="shrink-0 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-2 text-xs font-extrabold text-slate-950 shadow transition active:scale-95 disabled:opacity-35"
                  >
                    Resgatar
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
