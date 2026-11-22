import { TiltOffset } from '../hooks/usePetSensors';

interface EggStageProps {
  eggColor: string;
  eggSpotColor: string;
  progress: number;
  wobble: boolean;
  tilt: TiltOffset;
}

export function EggStage({
  eggColor,
  eggSpotColor,
  progress,
  wobble,
  tilt,
}: EggStageProps) {
  const tiltTransform = `translate3d(${(tilt.x * 12).toFixed(1)}px, ${(tilt.y * 6).toFixed(1)}px, 0) rotate(${(tilt.x * 6).toFixed(1)}deg)`;

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className="relative flex items-center justify-center transition-transform duration-150 ease-out"
        style={{ transform: tiltTransform }}
      >
        <div className="absolute -bottom-2 h-3.5 w-20 rounded-full bg-black/40 blur-[3px]" />

        <svg
          viewBox="0 0 120 140"
          className={`h-32 w-28 drop-shadow-[0_10px_16px_rgba(0,0,0,0.45)] ${
            wobble ? 'animate-egg-wobble' : 'animate-pet-breathe'
          }`}
          aria-label="Ovo Pokémon"
        >
          {/* Egg shell */}
          <path
            d="M60 10 C32 10, 14 55, 14 90 C14 118, 34 132, 60 132 C86 132, 106 118, 106 90 C106 55, 88 10, 60 10 Z"
            fill={eggColor}
            stroke="#1e293b"
            strokeWidth="4"
          />
          {/* Spots */}
          <ellipse cx="38" cy="68" rx="10" ry="13" fill={eggSpotColor} opacity="0.85" transform="rotate(-15 38 68)" />
          <ellipse cx="80" cy="52" rx="8" ry="10" fill={eggSpotColor} opacity="0.85" transform="rotate(20 80 52)" />
          <circle cx="68" cy="102" r="11" fill={eggSpotColor} opacity="0.85" />
          <circle cx="34" cy="106" r="6" fill={eggSpotColor} opacity="0.75" />

          {/* Highlight */}
          <ellipse cx="44" cy="36" rx="7" ry="14" fill="#ffffff" opacity="0.45" transform="rotate(-22 44 36)" />

          {/* Progressive cracks */}
          {progress >= 25 && (
            <path
              d="M52 44 L60 54 L54 64 L64 72"
              fill="none"
              stroke="#1e293b"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {progress >= 55 && (
            <path
              d="M78 72 L68 80 L74 90 L64 96"
              fill="none"
              stroke="#1e293b"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {progress >= 80 && (
            <path
              d="M36 82 L46 86 L42 96 L52 102"
              fill="none"
              stroke="#1e293b"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>

      {/* Hatch Progress */}
      <div className="w-44 text-center">
        <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-300">
          <span>Eclosão</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-950/70 p-0.5 ring-1 ring-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-300"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-slate-300/90">
          Toque no ovo ou chacoalhe o celular!
        </p>
      </div>
    </div>
  );
}
