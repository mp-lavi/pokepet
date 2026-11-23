import { useEffect, useState } from 'react';
import { Timer, X } from 'lucide-react';
import { triggerHapticLight, triggerHapticVibrate } from '../hooks/usePetSensors';
import { sound } from '../utils/sound';

interface TargetOrb {
  id: string;
  x: number;
  y: number;
  emoji: string;
  points: number;
}

interface PlayMinigameProps {
  pokemonName: string;
  onFinish: (score: number) => void;
  onCancel: () => void;
}

const ORB_POOL = [
  { emoji: '🫐', points: 1 },
  { emoji: '🍓', points: 1 },
  { emoji: '⭐', points: 2 },
  { emoji: '🪨', points: -1 },
];

export function PlayMinigame({ pokemonName, onFinish, onCancel }: PlayMinigameProps) {
  const [timeLeft, setTimeLeft] = useState(8);
  const [score, setScore] = useState(0);
  const [orbs, setOrbs] = useState<TargetOrb[]>([]);

  useEffect(() => {
    const countdown = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const spawner = window.setInterval(() => {
      const pick = ORB_POOL[Math.floor(Math.random() * ORB_POOL.length)];
      const orb: TargetOrb = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        x: 15 + Math.random() * 70,
        y: 22 + Math.random() * 52,
        emoji: pick.emoji,
        points: pick.points,
      };
      setOrbs((prev) => [...prev.slice(-5), orb]);
    }, 620);

    return () => {
      window.clearInterval(countdown);
      window.clearInterval(spawner);
    };
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      onFinish(Math.max(0, score));
    }
  }, [onFinish, score, timeLeft]);

  const handleTapOrb = (orb: TargetOrb) => {
    setOrbs((prev) => prev.filter((o) => o.id !== orb.id));
    if (orb.points > 0) {
      sound.playMinigameCatch();
      void triggerHapticLight();
      setScore((s) => s + orb.points);
    } else {
      void triggerHapticVibrate(80);
      setScore((s) => Math.max(0, s + orb.points));
    }
  };

  return (
    <div className="relative z-20 flex h-full w-full flex-col justify-between p-3">
      <div className="flex items-center justify-between rounded-2xl bg-slate-950/80 px-3 py-2 ring-1 ring-white/15 backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-extrabold text-amber-300">
          <Timer className="h-4 w-4" />
          <span>{timeLeft}s</span>
        </div>
        <span className="text-xs font-bold text-white">
          Pegue as Berries com {pokemonName}!
        </span>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-emerald-500/20 px-2 py-0.5 font-mono text-xs font-extrabold text-emerald-300">
            {score} pts
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Cancelar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {orbs.map((orb) => (
          <button
            key={orb.id}
            type="button"
            onClick={() => handleTapOrb(orb)}
            style={{ left: `${orb.x}%`, top: `${orb.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 animate-bounce rounded-full bg-slate-950/60 p-2.5 text-2xl ring-1 ring-white/25 backdrop-blur-sm transition active:scale-75"
          >
            {orb.emoji}
          </button>
        ))}
      </div>

      <p className="text-center text-[11px] font-semibold text-slate-200 drop-shadow">
        Toque em 🫐 🍓 ⭐ (+pts) • Evite 🪨 (-1 pt)
      </p>
    </div>
  );
}
