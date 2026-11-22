import { getLineById, STARTER_LINE_IDS } from '../data/pokemonData';

interface StarterEggPickerProps {
  onSelect: (lineId: string) => void;
}

export function StarterEggPicker({ onSelect }: StarterEggPickerProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl bg-slate-950/75 p-4 text-center ring-1 ring-white/15 backdrop-blur-md">
      <div>
        <h2 className="text-sm font-extrabold text-white">Escolha seu Ovo Inicial</h2>
        <p className="mt-0.5 text-[11px] text-slate-300">
          Qual parceiro você quer chocar primeiro?
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {STARTER_LINE_IDS.map((lineId) => {
          const line = getLineById(lineId);
          const starter = line.stages[0];

          return (
            <button
              key={lineId}
              type="button"
              onClick={() => onSelect(lineId)}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-slate-900/85 px-3 py-3 ring-1 ring-white/15 transition hover:bg-slate-800 active:scale-95"
            >
              <svg viewBox="0 0 120 140" className="h-16 w-14 drop-shadow">
                <path
                  d="M60 10 C32 10, 14 55, 14 90 C14 118, 34 132, 60 132 C86 132, 106 118, 106 90 C106 55, 88 10, 60 10 Z"
                  fill={line.eggColor}
                  stroke="#1e293b"
                  strokeWidth="5"
                />
                <ellipse cx="40" cy="68" rx="10" ry="13" fill={line.eggSpotColor} opacity="0.85" transform="rotate(-15 40 68)" />
                <ellipse cx="80" cy="54" rx="8" ry="10" fill={line.eggSpotColor} opacity="0.85" transform="rotate(20 80 54)" />
                <circle cx="68" cy="102" r="11" fill={line.eggSpotColor} opacity="0.85" />
              </svg>
              <span className="text-xs font-extrabold text-white">{starter.name}</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-200">
                {line.type}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
