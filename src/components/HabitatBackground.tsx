import { useEffect, useState } from 'react';
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

export function HabitatBackground({ type, isEgg, isSleeping }: HabitatBackgroundProps) {
  const key = isEgg ? 'egg' : type;
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [key]);

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
      {/* Subtle bottom vignette so the pet sprite & HUD pop cleanly */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/25" />
    </div>
  );
}
