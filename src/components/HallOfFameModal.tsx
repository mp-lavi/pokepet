import { X } from 'lucide-react';
import { getStaticSpriteUrl } from '../data/pokemonData';
import { HallOfFameEntry } from '../types/game';
import { PokedexIcon } from './PokedexIcon';

interface HallOfFameModalProps {
  open: boolean;
  entries: HallOfFameEntry[];
  onClose: () => void;
}

export function HallOfFameModal({ open, entries, onClose }: HallOfFameModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[82dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-slate-900 ring-1 ring-white/15 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <PokedexIcon className="h-5 w-5" />
            <h2 className="text-base font-bold text-white">Pokédex & Hall da Fama</h2>
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

        <div className="flex-1 overflow-y-auto p-4">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
              <PokedexIcon className="mb-2 h-12 w-12 opacity-70" />
              <p className="text-sm font-semibold text-slate-300">
                Nenhum Pokémon registrado ainda
              </p>
              <p className="mt-1 max-w-xs text-xs text-slate-400">
                Cuide do seu parceiro até o Nível 60 para que ele parta para a natureza e entre no Hall da Fama!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {entries.map((entry) => (
                <div
                  key={entry.uid}
                  className="flex flex-col items-center rounded-2xl bg-slate-800/70 p-3 text-center ring-1 ring-white/10"
                >
                  <img
                    src={getStaticSpriteUrl(entry.finalPokemonId)}
                    alt={entry.finalName}
                    className="h-16 w-16 object-contain drop-shadow"
                  />
                  <span className="mt-1 text-sm font-bold text-white">{entry.finalName}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">
                    Nv. {entry.levelReached} • {entry.type}
                  </span>
                  <span className="mt-1 text-[10px] text-slate-400">
                    {entry.totalInteractions} interações
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
