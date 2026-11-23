import { useEffect, useState } from 'react';
import { getAnimatedSpriteUrl, getStaticSpriteUrl } from '../data/pokemonData';
import { TiltOffset } from '../hooks/usePetSensors';
import { PetMoodAnimation, PetPhase } from '../types/game';

interface PokemonSpriteProps {
  pokemonId: number;
  name: string;
  phase: PetPhase;
  mood: PetMoodAnimation;
  isSleeping: boolean;
  isDirty: boolean;
  isShiny?: boolean;
  tilt: TiltOffset;
  autonomousX?: number;
  facingRight?: boolean;
  speechBubble?: string | null;
  urgentNeed?: boolean;
}

export function PokemonSprite({
  pokemonId,
  name,
  phase,
  mood,
  isSleeping,
  isDirty,
  isShiny = false,
  tilt,
  autonomousX = 0,
  facingRight = false,
  speechBubble = null,
  urgentNeed = false,
}: PokemonSpriteProps) {
  const [srcMode, setSrcMode] = useState<'animated' | 'static' | 'fallback'>('animated');

  useEffect(() => {
    setSrcMode('animated');
  }, [pokemonId]);

  const animClass =
    phase === 'evolving'
      ? 'animate-evolve-flash'
      : phase === 'farewell'
      ? 'animate-farewell'
      : mood === 'happy'
      ? 'animate-pet-happy'
      : mood === 'poke'
      ? 'animate-pet-poke'
      : mood === 'dizzy'
      ? 'animate-pet-dizzy'
      : mood === 'somersault'
      ? 'animate-pet-somersault'
      : isSleeping
      ? 'animate-pet-sleep brightness-75 saturate-75'
      : 'animate-pet-breathe';

  const totalX = autonomousX + tilt.x * 16;
  const totalY = tilt.y * 8;
  const tiltTransform = `translate3d(${totalX.toFixed(1)}px, ${totalY.toFixed(1)}px, 0) rotate(${(tilt.x * 5).toFixed(1)}deg)`;

  const imgSrc =
    srcMode === 'animated'
      ? getAnimatedSpriteUrl(pokemonId, isShiny)
      : getStaticSpriteUrl(pokemonId, isShiny);

  return (
    <div
      className="relative flex flex-col items-center justify-center transition-transform duration-1000 ease-in-out"
      style={{ transform: tiltTransform }}
    >
      {/* Autonomous Speech / Need Bubble */}
      {speechBubble && phase === 'pet' && (
        <div
          className={`pointer-events-none absolute -top-11 z-30 whitespace-nowrap rounded-2xl px-3 py-1 text-[11px] font-bold shadow-lg ring-1 backdrop-blur-md transition-all duration-300 ${
            urgentNeed
              ? 'animate-bounce bg-rose-950/90 text-rose-100 ring-rose-400/60'
              : 'bg-slate-950/85 text-slate-100 ring-white/20'
          }`}
        >
          {speechBubble}
          <span
            className={`absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 ${
              urgentNeed ? 'bg-rose-950/90' : 'bg-slate-950/85'
            }`}
          />
        </div>
      )}

      {/* Ground shadow */}
      <div
        className={`absolute -bottom-2 h-3.5 w-24 rounded-full bg-black/45 blur-[3px] transition-all duration-300 ${
          mood === 'somersault' || mood === 'happy' ? 'scale-75 opacity-40' : 'scale-100'
        }`}
      />

      {/* Dirty indicator */}
      {isDirty && phase === 'pet' && (
        <div className="absolute -right-4 top-0 z-20 animate-bounce rounded-full bg-amber-900/80 px-2 py-0.5 text-xs border border-amber-500/40">
          💩
        </div>
      )}

      {/* Real cozy Pillow SVG + Sleepy closed-eyes indicator */}
      {isSleeping && phase === 'pet' && (
        <>
          {/* Visible plush pillow tucked under the Pokémon */}
          <svg
            viewBox="0 0 180 76"
            className="pointer-events-none absolute -bottom-3 z-0 h-16 w-44 drop-shadow-[0_8px_14px_rgba(0,0,0,0.65)]"
            aria-hidden="true"
          >
            {/* Pillow body */}
            <path
              d="M22 22 Q90 8 158 22 Q170 38 158 56 Q90 68 22 56 Q10 38 22 22 Z"
              fill="#e0e7ff"
              stroke="#6366f1"
              strokeWidth="4"
            />
            {/* Inner seam & soft shading */}
            <path
              d="M28 28 Q90 16 152 28 Q160 39 152 50 Q90 60 28 50 Q20 39 28 28 Z"
              fill="#c7d2fe"
              opacity="0.7"
            />
            {/* Cute star embroidery */}
            <circle cx="42" cy="40" r="5" fill="#818cf8" opacity="0.6" />
            <circle cx="138" cy="40" r="5" fill="#818cf8" opacity="0.6" />
          </svg>

          {/* Closed-eyes sleeping expression badge */}
          <div className="pointer-events-none absolute left-1 top-1 z-20 flex items-center gap-1 rounded-full bg-indigo-950/85 px-2 py-0.5 text-[11px] font-bold text-indigo-100 ring-1 ring-indigo-300/40 shadow">
            <span>🌙</span>
            <span className="tracking-tighter">︶︶</span>
          </div>

          <div className="pointer-events-none absolute -top-2 right-1 z-20 flex flex-col items-end">
            <span className="animate-bounce text-sm font-black text-indigo-200 drop-shadow">
              💤
            </span>
            <span
              className="animate-pulse text-[11px] font-extrabold text-sky-200/90"
              style={{ animationDelay: '0.4s' }}
            >
              z z
            </span>
          </div>
        </>
      )}

      <div className={`transition-transform duration-300 ${facingRight ? '-scale-x-100' : 'scale-x-100'}`}>
        {srcMode === 'fallback' ? (
          <div
            className={`flex h-28 w-28 items-center justify-center rounded-full border-4 border-slate-200/80 bg-gradient-to-b from-red-500 via-red-500 to-white shadow-lg ${animClass}`}
            aria-label={name}
          >
            <div className="h-7 w-7 rounded-full border-4 border-slate-800 bg-white" />
          </div>
        ) : (
          <img
            src={imgSrc}
            alt={name}
            draggable={false}
            onError={() => {
              setSrcMode((prev) => (prev === 'animated' ? 'static' : 'fallback'));
            }}
            className={`pointer-events-none h-36 w-36 object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.55)] ${animClass}`}
          />
        )}
      </div>
    </div>
  );
}
