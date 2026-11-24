import { Crown, DoorOpen, Footprints, Heart } from 'lucide-react';
import { AdventureFloor, MapTile } from '../data/mapGenerator';
import { getAnimatedSpriteUrl, WildOpponent } from '../data/pokemonData';
import { PokemonType } from '../types/game';

interface AdventureMapProps {
  floor: AdventureFloor;
  playerPokemonId: number;
  playerName: string;
  playerType: PokemonType;
  playerShiny: boolean;
  playerHp: number;
  playerMaxHp: number;
  mapLog: string | null;
  onStep: (x: number, y: number) => void;
  onExit: () => void;
}

const OBSTACLE_BY_TYPE: Record<PokemonType, string> = {
  fire: '🌋',
  grass: '🌲',
  water: '🪸',
  electric: '⚡',
  ghost: '🪦',
  dragon: '🏔️',
  fairy: '🌸',
};

const BIOME_TINT: Record<PokemonType, string> = {
  fire: 'from-orange-950/55 via-stone-950/45 to-red-950/65',
  grass: 'from-emerald-950/50 via-green-950/40 to-teal-950/60',
  water: 'from-sky-950/50 via-cyan-950/40 to-blue-950/65',
  electric: 'from-indigo-950/55 via-slate-950/45 to-amber-950/55',
  ghost: 'from-purple-950/60 via-slate-950/55 to-indigo-950/70',
  dragon: 'from-indigo-950/55 via-slate-950/45 to-blue-950/65',
  fairy: 'from-pink-950/50 via-purple-950/40 to-rose-950/60',
};

function EnemyMapSprite({ enemy }: { enemy: WildOpponent }) {
  return (
    <div className="relative flex flex-col items-center justify-center">
      {enemy.isBoss && (
        <div className="absolute inset-0 rounded-full bg-amber-400/25 blur-md animate-pulse" />
      )}
      <img
        src={getAnimatedSpriteUrl(enemy.id)}
        alt={enemy.name}
        className={`relative object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.65)] animate-pet-breathe ${
          enemy.isBoss ? 'h-12 w-12' : 'h-10 w-10'
        }`}
      />
      <span
        className={`-mt-1 rounded-full px-1.5 py-0 text-[8px] font-black shadow ${
          enemy.isBoss
            ? 'bg-amber-400 text-slate-950'
            : 'bg-slate-950/85 text-slate-200 ring-1 ring-white/15'
        }`}
      >
        {enemy.isBoss ? '👑 ' : ''}Nv.{enemy.level}
      </span>
    </div>
  );
}

export function AdventureMap({
  floor,
  playerPokemonId,
  playerName,
  playerType,
  playerShiny,
  playerHp,
  playerMaxHp,
  mapLog,
  onStep,
  onExit,
}: AdventureMapProps) {
  const hpPct = Math.max(0, Math.min(100, Math.round((playerHp / playerMaxHp) * 100)));

  return (
    <div
      className={`absolute inset-0 z-30 flex h-full w-full flex-col justify-between bg-gradient-to-b ${BIOME_TINT[playerType]} p-3 backdrop-blur-[2px]`}
    >
      {/* Floating Top HUD */}
      <div className="flex items-center justify-between gap-2 rounded-2xl bg-slate-950/70 px-3 py-2 ring-1 ring-white/15 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-2">
          {floor.isBossFloor && <Crown className="h-4 w-4 text-amber-300 animate-bounce" />}
          <div>
            <p className="text-xs font-extrabold text-white leading-none">
              {floor.isBossFloor ? `Fase ${floor.stageNumber} • Chefe` : `Exploração • Fase ${floor.stageNumber}`}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <Heart className="h-3 w-3 text-rose-400" />
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${hpPct}%` }}
                />
              </div>
              <span className="font-mono text-[10px] font-bold text-slate-200">
                {playerHp}/{playerMaxHp}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-1 rounded-xl bg-slate-800/90 px-2.5 py-1.5 text-[11px] font-bold text-slate-100 ring-1 ring-white/15 hover:bg-slate-700 active:scale-95"
        >
          <DoorOpen className="h-3.5 w-3.5 text-amber-300" />
          <span>Voltar</span>
        </button>
      </div>

      {/* Floating Event Toast */}
      {mapLog && (
        <div className="pointer-events-none mx-auto my-1 w-fit max-w-[92%] rounded-full bg-slate-950/85 px-3.5 py-1 text-center text-[11px] font-bold text-amber-200 ring-1 ring-amber-400/40 backdrop-blur-md shadow-lg">
          {mapLog}
        </div>
      )}

      {/* Full-Screen Seamless Terrain Grid (6x8) */}
      <div className="my-1.5 grid flex-1 grid-cols-6 grid-rows-8 gap-1 rounded-3xl bg-slate-950/25 p-2 ring-1 ring-white/10">
        {floor.tiles.flat().map((tile: MapTile) => {
          const isPlayerHere = tile.x === floor.playerX && tile.y === floor.playerY;
          const dist = Math.abs(tile.x - floor.playerX) + Math.abs(tile.y - floor.playerY);
          const isAdjacent = dist === 1 && tile.kind !== 'wall';
          const isRevealed =
            tile.visited || dist <= 2 || tile.kind === 'exit' || Boolean(tile.enemy?.isBoss);

          return (
            <button
              key={`${tile.x}-${tile.y}`}
              type="button"
              disabled={!isAdjacent}
              onClick={() => isAdjacent && onStep(tile.x, tile.y)}
              className={`relative flex items-center justify-center rounded-xl transition-all duration-200 ${
                isPlayerHere
                  ? 'bg-emerald-500/25 ring-2 ring-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.45)]'
                  : !isRevealed
                  ? 'bg-slate-950/60 backdrop-blur-[3px]'
                  : tile.kind === 'wall'
                  ? 'bg-slate-950/35'
                  : isAdjacent
                  ? 'bg-amber-400/15 ring-1 ring-amber-300/65 hover:bg-amber-400/25 active:scale-90'
                  : tile.isPath
                  ? 'bg-amber-950/25'
                  : 'bg-white/[0.04]'
              }`}
            >
              {isPlayerHere ? (
                <img
                  src={getAnimatedSpriteUrl(playerPokemonId, playerShiny)}
                  alt={playerName}
                  className="h-11 w-11 object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.7)] animate-pet-breathe"
                />
              ) : !isRevealed ? (
                <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
              ) : tile.kind === 'wall' ? (
                <span className="text-xl opacity-85 drop-shadow">
                  {OBSTACLE_BY_TYPE[playerType]}
                </span>
              ) : tile.kind === 'berry' ? (
                <span className="text-xl drop-shadow animate-bounce">
                  {tile.berryId === 'sitrus' ? '🍋' : '🫐'}
                </span>
              ) : tile.kind === 'coins' ? (
                <span className="text-xl drop-shadow animate-pulse">🎁</span>
              ) : tile.kind === 'heal' ? (
                <span className="text-xl drop-shadow animate-pulse">♨️</span>
              ) : tile.kind === 'exit' ? (
                <div className="flex flex-col items-center">
                  <span className="text-2xl drop-shadow animate-spin" style={{ animationDuration: '5s' }}>
                    🌀
                  </span>
                </div>
              ) : tile.kind === 'enemy' && tile.enemy ? (
                <EnemyMapSprite enemy={tile.enemy} />
              ) : isAdjacent ? (
                <Footprints className="h-3.5 w-3.5 text-amber-200/65 animate-pulse" />
              ) : tile.visited ? (
                <span className="h-1 w-1 rounded-full bg-emerald-300/35" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Bottom Legend */}
      <div className="flex items-center justify-center gap-3 rounded-2xl bg-slate-950/65 px-3 py-1.5 text-[10px] font-semibold text-slate-200 ring-1 ring-white/10 backdrop-blur-md">
        <span>👣 Toque para andar</span>
        <span>🫐 Berry</span>
        <span>🎁 Moedas</span>
        <span>♨️ Cura</span>
        <span>{floor.isBossFloor ? '👑 Chefe' : '🌀 Portal'}</span>
      </div>
    </div>
  );
}
