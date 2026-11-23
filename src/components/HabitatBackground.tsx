import { useEffect, useMemo, useState } from 'react';
import { PokemonType } from '../types/game';

interface HabitatBackgroundProps {
  type: PokemonType;
  isEgg: boolean;
  isSleeping: boolean;
}

const FALLBACK_GRADIENTS: Record<PokemonType | 'egg', string> = {
  egg: 'from-sky-900 via-emerald-900 to-slate-950',
  fire: 'from-red-950 via-orange-900 to-stone-950',
  grass: 'from-sky-900 via-emerald-800 to-green-950',
  water: 'from-sky-700 via-cyan-800 to-blue-950',
  electric: 'from-indigo-950 via-amber-900/70 to-slate-950',
  ghost: 'from-slate-950 via-purple-950 to-indigo-950',
  dragon: 'from-slate-900 via-indigo-900 to-blue-950',
  fairy: 'from-purple-950 via-pink-900 to-rose-950',
};

const AMBIENT_SYMBOL: Record<PokemonType | 'egg', string> = {
  egg: '✨',
  fire: '🔥',
  grass: '🍃',
  water: '🫧',
  electric: '⚡',
  ghost: '👻',
  dragon: '⭐',
  fairy: '🌸',
};

export function HabitatBackground({ type, isEgg, isSleeping }: HabitatBackgroundProps) {
  const key = isEgg ? 'egg' : type;
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [key]);

  const weatherParticles = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        left: `${10 + ((i * 11) % 82)}%`,
        top: `${14 + ((i * 17) % 62)}%`,
        delay: `${(i * 0.65).toFixed(2)}s`,
        duration: `${3.2 + (i % 3) * 1.1}s`,
      })),
    []
  );

  return (
    <div
      className={`pointer-events-none absolute inset-0 h-full w-full overflow-hidden bg-gradient-to-b ${FALLBACK_GRADIENTS[key]} transition-all duration-700 ${
        isSleeping ? 'brightness-45 saturate-75' : 'brightness-100'
      }`}
    >
      {!imgError && (
        <img
          key={key}
          src={`${import.meta.env.BASE_URL}habitats/${key}.jpg`}
          alt={`Habitat ${key}`}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover object-center"
          draggable={false}
        />
      )}

      {/* Subtle ambient weather particles matching habitat */}
      {!isSleeping &&
        weatherParticles.map((p) => (
          <span
            key={p.id}
            style={{
              left: p.left,
              top: p.top,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
            className="absolute animate-pulse text-xs opacity-55 drop-shadow"
          >
            {AMBIENT_SYMBOL[key]}
          </span>
        ))}

      {/* Subtle bottom vignette so the pet sprite & HUD pop cleanly */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/25" />
    </div>
  );
}
