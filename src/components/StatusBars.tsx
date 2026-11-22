import { BatteryCharging, Heart, Sparkles, Utensils } from 'lucide-react';
import { MAX_LEVEL } from '../data/pokemonData';

interface StatusBarsProps {
  hunger: number;
  happiness: number;
  energy: number;
  level: number;
  xp: number;
  xpNeeded: number;
  isEgg: boolean;
}

function MiniBar({
  icon,
  value,
  colorClass,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  colorClass: string;
  label: string;
}) {
  const rounded = Math.round(value);
  const low = rounded <= 25;

  return (
    <div className="flex flex-1 flex-col gap-0.5" title={`${label}: ${rounded}%`}>
      <div className="flex items-center justify-between text-[10px] font-bold">
        <span className={`flex items-center gap-1 ${low ? 'text-rose-300 animate-pulse' : 'text-slate-200'}`}>
          {icon}
          <span>{label}</span>
        </span>
        <span className="font-mono text-[10px] text-slate-300">{rounded}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-950/75 ring-1 ring-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            low ? 'bg-rose-500' : colorClass
          }`}
          style={{ width: `${Math.max(2, Math.min(100, rounded))}%` }}
        />
      </div>
    </div>
  );
}

export function StatusBars({
  hunger,
  happiness,
  energy,
  level,
  xp,
  xpNeeded,
  isEgg,
}: StatusBarsProps) {
  const xpPct = level >= MAX_LEVEL ? 100 : Math.min(100, Math.round((xp / xpNeeded) * 100));

  return (
    <div className="flex flex-col gap-1.5 rounded-2xl bg-slate-950/55 px-3 py-2 ring-1 ring-white/15 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-300">
          <Sparkles className="h-3 w-3" />
          <span>{isEgg ? 'Fase de Ovo' : `Nível ${level} / ${MAX_LEVEL}`}</span>
        </div>
        {!isEgg && (
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-950/80 ring-1 ring-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-300"
                style={{ width: `${xpPct}%` }}
              />
            </div>
            <span className="font-mono text-[10px] font-semibold text-slate-300">
              {xp}/{xpNeeded} XP
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <MiniBar
          icon={<Utensils className="h-3 w-3 text-orange-400" />}
          label="Fome"
          value={isEgg ? 100 : hunger}
          colorClass="bg-gradient-to-r from-orange-500 to-amber-400"
        />
        <MiniBar
          icon={<Heart className="h-3 w-3 text-pink-400" />}
          label="Feliz"
          value={isEgg ? 100 : happiness}
          colorClass="bg-gradient-to-r from-pink-500 to-rose-400"
        />
        <MiniBar
          icon={<BatteryCharging className="h-3 w-3 text-emerald-400" />}
          label="Energia"
          value={isEgg ? 100 : energy}
          colorClass="bg-gradient-to-r from-emerald-500 to-teal-400"
        />
      </div>
    </div>
  );
}
