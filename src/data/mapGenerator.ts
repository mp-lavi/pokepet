import { spawnWildOpponent, WildOpponent } from './pokemonData';

export type MapTileKind =
  | 'empty'
  | 'wall'
  | 'berry'
  | 'coins'
  | 'heal'
  | 'enemy'
  | 'exit';

export interface MapTile {
  x: number;
  y: number;
  kind: MapTileKind;
  visited: boolean;
  berryId?: 'oran' | 'sitrus';
  coinsAmount?: number;
  enemy?: WildOpponent;
}

export interface AdventureFloor {
  width: number;
  height: number;
  stageNumber: number;
  isBossFloor: boolean;
  playerX: number;
  playerY: number;
  tiles: MapTile[][];
}

export function generateAdventureFloor(
  stageNumber: number,
  playerLevel: number,
  excludePokemonId: number
): AdventureFloor {
  const width = 5;
  const height = 5;
  const isBossFloor = stageNumber > 0 && stageNumber % 5 === 0;

  const tiles: MapTile[][] = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => ({
      x,
      y,
      kind: 'empty' as MapTileKind,
      visited: false,
    }))
  );

  // Start at bottom-left, exit at top-right
  const startX = 0;
  const startY = height - 1;
  const exitX = width - 1;
  const exitY = 0;

  // Carve a guaranteed winding path from start to exit
  const guaranteedPath = new Set<string>();
  let cx = startX;
  let cy = startY;
  guaranteedPath.add(`${cx},${cy}`);
  while (cx !== exitX || cy !== exitY) {
    if (cx < exitX && (cy === exitY || Math.random() < 0.5)) {
      cx += 1;
    } else if (cy > exitY) {
      cy -= 1;
    }
    guaranteedPath.add(`${cx},${cy}`);
  }

  // Place walls on non-path tiles (~22% chance)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!guaranteedPath.has(`${x},${y}`) && Math.random() < 0.24) {
        tiles[y][x].kind = 'wall';
      }
    }
  }

  // Place exit (or Boss on every 5th floor!)
  if (isBossFloor) {
    tiles[exitY][exitX].kind = 'enemy';
    tiles[exitY][exitX].enemy = spawnWildOpponent(
      stageNumber,
      playerLevel,
      excludePokemonId
    );
  } else {
    tiles[exitY][exitX].kind = 'exit';
  }

  // Collect candidate open tiles (not start, not exit)
  const openTiles: MapTile[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (
        (x !== startX || y !== startY) &&
        (x !== exitX || y !== exitY) &&
        tiles[y][x].kind === 'empty'
      ) {
        openTiles.push(tiles[y][x]);
      }
    }
  }

  const shuffled = [...openTiles].sort(() => Math.random() - 0.5);

  // Place 2-3 Berries
  const berryCount = 2 + (Math.random() < 0.4 ? 1 : 0);
  for (let i = 0; i < berryCount && shuffled.length > 0; i++) {
    const t = shuffled.pop()!;
    t.kind = 'berry';
    t.berryId = Math.random() < 0.28 ? 'sitrus' : 'oran';
  }

  // Place 1-2 Coin Chests
  const coinCount = 1 + (Math.random() < 0.5 ? 1 : 0);
  for (let i = 0; i < coinCount && shuffled.length > 0; i++) {
    const t = shuffled.pop()!;
    t.kind = 'coins';
    t.coinsAmount = 18 + Math.floor(Math.random() * 20);
  }

  // Place 1 Healing Spring (~55% chance)
  if (Math.random() < 0.55 && shuffled.length > 0) {
    const t = shuffled.pop()!;
    t.kind = 'heal';
  }

  // Place 2-3 Wild Enemies (using non-boss stageNumber so they are regular wilds)
  const regularStage = isBossFloor ? Math.max(1, stageNumber - 1) : stageNumber;
  const enemyCount = 2 + (Math.random() < 0.45 ? 1 : 0);
  for (let i = 0; i < enemyCount && shuffled.length > 0; i++) {
    const t = shuffled.pop()!;
    t.kind = 'enemy';
    t.enemy = spawnWildOpponent(regularStage, playerLevel, excludePokemonId);
  }

  tiles[startY][startX].visited = true;

  return {
    width,
    height,
    stageNumber,
    isBossFloor,
    playerX: startX,
    playerY: startY,
    tiles,
  };
}
