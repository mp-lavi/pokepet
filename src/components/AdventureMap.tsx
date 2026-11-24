import { Crown, DoorOpen, Heart } from 'lucide-react';
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
  water: '🪨',
  electric: '⚡',
  ghost: '🪦',
  dragon: '🏔️',
  fairy: '🌸',
};

function EnemyMiniIcon({ enemy }: { enemy: WildOpponent }) {
  return (
    <div className="relative flex items-center justify-center">
      <img
        src={getAnimatedSpriteUrl(enemy.id)}
        alt={enemy.name}
        className="h-9 w-9 object-contain drop-shadow"
      />
      {enemy.isBoss && (
        <Crown className="absolute -right-1 -top-1 h-3.5 w-3.5 text-amber-300 drop-shadow" />
      )}
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
    <div className="relative z-20 flex h-full w-full flex-col justify-between p-3">
      {/* Top Map Status */}
      <div className="flex items-center justify-between gap-2 rounded-2xl bg-slate-950/75 px-3 py-2 ring-1 ring-white/15 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {floor.isBossFloor && <Crown className="h-4 w-4 text-amber-300" />}
          <div>
            <p className="text-xs font-extrabold text-white leading-none">
              Mapa • Fase {floor.stageNumber}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <Heart className="h-3 w-3 text-rose-400" />
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${hpPct}%` }}
                />
              </div>
              <span className="font-mono text-[10px] text-slate-300">
                {playerHp}/{playerMaxHp}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-1 rounded-xl bg-slate-800 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 ring-1 ring-white/10 hover:bg-slate-700 active:scale-95"
        >
          <DoorOpen className="h-3.5 w-3.5 text-amber-300" />
          <span>Voltar</span>
        </button>
      </div>

      {/* Log Toast */}
      {mapLog && (
        <div className="mx-auto w-fit max-w-[95%] rounded-full bg-slate-950/85 px-3 py-1 text-center text-[11px] font-bold text-amber-200 ring-1 ring-amber-400/35 backdrop-blur-md shadow">
          {mapLog}
        </div>
      )}

      {/* 5x5 Procedural Exploration Grid */}
      <div className="mx-auto grid w-full max-w-[320px] grid-cols-5 gap-1.5 rounded-3xl bg-slate-950/60 p-2.5 ring-1 ring-white/15 backdrop-blur-md">
        {floor.tiles.flat().map((tile: MapTile) => {
          const isPlayerHere = tile.x === floor.playerX && tile.y === floor.playerY;
          const dist = Math.abs(tile.x - floor.playerX) + Math.abs(tile.y - floor.playerY);
          const isAdjacent = dist === 1 && tile.kind !== 'wall';
          const isRevealed =
            tile.visited || dist <= 1 || tile.kind === 'exit' || Boolean(tile.enemy?.isBoss);

          return (
            <button
              key={`${tile.x}-${tile.y}`}
              type="button"
              disabled={!isAdjacent}
              onClick={() => isAdjacent && onStep(tile.x, tile.y)}
              className={`relative flex aspect-square items-center justify-center rounded-xl transition ${
                isPlayerHere
                  ? 'bg-emerald-500/25 ring-2 ring-emerald-400'
                  : tile.kind === 'wall'
                  ? 'bg-slate-900/90 opacity-75'
                  : isAdjacent
                  ? 'bg-slate-800/85 ring-2 ring-amber-300/65 hover:bg-slate-700/90 active:scale-90'
                  : tile.visited
                  ? 'bg-slate-900/55 ring-1 ring-white/10'
                  : 'bg-slate-950/75 ring-1 ring-white/10'
              }`}
            >
              {isPlayerHere ? (
                <img
                  src={getAnimatedSpriteUrl(playerPokemonId, playerShiny)}
                  alt={playerName}
                  className="h-10 w-10 object-contain drop-shadow animate-pet-breathe"
                />
              ) : !isRevealed ? (
                <span className="text-xs font-bold text-slate-600">?</span>
              ) : tile.kind === 'wall' ? (
                <span className="text-lg opacity-80">{OBSTACLE_BY_TYPE[playerType]}</span>
              ) : tile.kind === 'berry' ? (
                <span className="text-xl animate-bounce">
                  {tile.berryId === 'sitrus' ? '🍋' : '🫐'}
                </span>
              ) : tile.kind === 'coins' ? (
                <span className="text-lg animate-pulse">🪙</span>
              ) : tile.kind === 'heal' ? (
                <span className="text-lg animate-pulse">♨️</span>
              ) : tile.kind === 'exit' ? (
                <span className="text-xl animate-pulse" title="Próxima Fase">
                  🌀
                </span>
              ) : tile.kind === 'enemy' && tile.enemy ? (
                <EnemyMiniIcon enemy={tile.enemy} />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-white/15" />
              )}
            </button>
          );
        })}
      </div>

      <p className="text-center text-[11px] font-semibold text-slate-200 drop-shadow">
        Toque nos quadrados iluminados para andar • Pegue 🫐🪙♨️ e vá até {floor.isBossFloor ? '👑 o Chefe' : '🌀 o Portal'}!
      </p>
    </div>
  );
}
