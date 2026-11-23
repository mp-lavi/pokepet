import { EvolutionaryLine, GameState, PokemonMove, PokemonStage, PokemonType, QuestItem, ShopItem, ShopSlot } from '../types/game';

export const STARTER_LINE_IDS = ['charmander', 'bulbasaur', 'squirtle'] as const;
export const SHOP_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export const EVOLUTIONARY_LINES: EvolutionaryLine[] = [
  {
    lineId: 'charmander',
    type: 'fire',
    accentColor: '#fb923c',
    bgGradient: 'from-orange-950/70 via-rose-950/40 to-slate-900',
    eggColor: '#fed7aa',
    eggSpotColor: '#ea580c',
    stages: [
      { id: 4, name: 'Charmander', minLevel: 1, basePower: 12, baseSpeed: 13, baseCharm: 14 },
      { id: 5, name: 'Charmeleon', minLevel: 16, basePower: 22, baseSpeed: 20, baseCharm: 16 },
      { id: 6, name: 'Charizard', minLevel: 36, basePower: 38, baseSpeed: 32, baseCharm: 26 },
    ],
  },
  {
    lineId: 'bulbasaur',
    type: 'grass',
    accentColor: '#4ade80',
    bgGradient: 'from-emerald-950/70 via-teal-950/40 to-slate-900',
    eggColor: '#bbf7d0',
    eggSpotColor: '#16a34a',
    stages: [
      { id: 1, name: 'Bulbasaur', minLevel: 1, basePower: 11, baseSpeed: 10, baseCharm: 16 },
      { id: 2, name: 'Ivysaur', minLevel: 16, basePower: 20, baseSpeed: 17, baseCharm: 22 },
      { id: 3, name: 'Venusaur', minLevel: 32, basePower: 34, baseSpeed: 26, baseCharm: 32 },
    ],
  },
  {
    lineId: 'squirtle',
    type: 'water',
    accentColor: '#38bdf8',
    bgGradient: 'from-sky-950/70 via-cyan-950/40 to-slate-900',
    eggColor: '#bae6fd',
    eggSpotColor: '#0284c7',
    stages: [
      { id: 7, name: 'Squirtle', minLevel: 1, basePower: 11, baseSpeed: 11, baseCharm: 15 },
      { id: 8, name: 'Wartortle', minLevel: 16, basePower: 20, baseSpeed: 18, baseCharm: 21 },
      { id: 9, name: 'Blastoise', minLevel: 36, basePower: 35, baseSpeed: 27, baseCharm: 29 },
    ],
  },
  {
    lineId: 'pichu',
    type: 'electric',
    accentColor: '#facc15',
    bgGradient: 'from-amber-950/70 via-yellow-950/35 to-slate-900',
    eggColor: '#fef08a',
    eggSpotColor: '#ca8a04',
    stages: [
      { id: 172, name: 'Pichu', minLevel: 1, basePower: 9, baseSpeed: 15, baseCharm: 18 },
      { id: 25, name: 'Pikachu', minLevel: 12, basePower: 21, baseSpeed: 26, baseCharm: 28 },
      { id: 26, name: 'Raichu', minLevel: 28, basePower: 33, baseSpeed: 36, baseCharm: 29 },
    ],
  },
  {
    lineId: 'gastly',
    type: 'ghost',
    accentColor: '#c084fc',
    bgGradient: 'from-purple-950/70 via-fuchsia-950/35 to-slate-900',
    eggColor: '#e9d5ff',
    eggSpotColor: '#7e22ce',
    stages: [
      { id: 92, name: 'Gastly', minLevel: 1, basePower: 13, baseSpeed: 14, baseCharm: 12 },
      { id: 93, name: 'Haunter', minLevel: 25, basePower: 24, baseSpeed: 23, baseCharm: 18 },
      { id: 94, name: 'Gengar', minLevel: 40, basePower: 39, baseSpeed: 34, baseCharm: 27 },
    ],
  },
  {
    lineId: 'dratini',
    type: 'dragon',
    accentColor: '#818cf8',
    bgGradient: 'from-indigo-950/70 via-blue-950/40 to-slate-900',
    eggColor: '#c7d2fe',
    eggSpotColor: '#4338ca',
    stages: [
      { id: 147, name: 'Dratini', minLevel: 1, basePower: 12, baseSpeed: 12, baseCharm: 16 },
      { id: 148, name: 'Dragonair', minLevel: 30, basePower: 23, baseSpeed: 22, baseCharm: 26 },
      { id: 149, name: 'Dragonite', minLevel: 55, basePower: 40, baseSpeed: 31, baseCharm: 34 },
    ],
  },
  {
    lineId: 'togepi',
    type: 'fairy',
    accentColor: '#f472b6',
    bgGradient: 'from-pink-950/70 via-rose-950/35 to-slate-900',
    eggColor: '#fce7f3',
    eggSpotColor: '#db2777',
    stages: [
      { id: 175, name: 'Togepi', minLevel: 1, basePower: 8, baseSpeed: 10, baseCharm: 22 },
      { id: 176, name: 'Togetic', minLevel: 15, basePower: 18, baseSpeed: 19, baseCharm: 30 },
      { id: 468, name: 'Togekiss', minLevel: 35, basePower: 32, baseSpeed: 30, baseCharm: 40 },
    ],
  },
];

export const MAX_LEVEL = 60;

export function getXpForNextLevel(level: number): number {
  return 25 + (level - 1) * 7;
}

export function getLineById(lineId: string): EvolutionaryLine {
  return EVOLUTIONARY_LINES.find((l) => l.lineId === lineId) ?? EVOLUTIONARY_LINES[0];
}

export function getStageForLevel(line: EvolutionaryLine, level: number): { stage: PokemonStage; stageIndex: 0 | 1 | 2 } {
  if (level >= line.stages[2].minLevel) {
    return { stage: line.stages[2], stageIndex: 2 };
  }
  if (level >= line.stages[1].minLevel) {
    return { stage: line.stages[1], stageIndex: 1 };
  }
  return { stage: line.stages[0], stageIndex: 0 };
}

export function pickRandomLine(excludeLineId?: string): EvolutionaryLine {
  const pool = excludeLineId
    ? EVOLUTIONARY_LINES.filter((l) => l.lineId !== excludeLineId)
    : EVOLUTIONARY_LINES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getAnimatedSpriteUrl(id: number, isShiny = false): string {
  return isShiny
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export function getStaticSpriteUrl(id: number, isShiny = false): string {
  return isShiny
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/${id}.png`
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`;
}

export function generateQuests(): QuestItem[] {
  const templates: Array<Omit<QuestItem, 'id' | 'progress' | 'claimed'>> = [
    {
      title: 'Vença 2 batalhas na Aventura',
      metric: 'battle_win',
      target: 2,
      rewardCoins: 45,
      rewardBerryId: 'sitrus',
    },
    {
      title: 'Alimente seu Pokémon 2 vezes',
      metric: 'feed',
      target: 2,
      rewardCoins: 30,
      rewardBerryId: 'oran',
    },
    {
      title: 'Faça carinho 3 vezes no pet',
      metric: 'pet',
      target: 3,
      rewardCoins: 25,
    },
    {
      title: 'Jogue o mini-game Brincar 1 vez',
      metric: 'minigame',
      target: 1,
      rewardCoins: 35,
      rewardBerryId: 'oran',
    },
    {
      title: 'Vença 4 batalhas na Aventura',
      metric: 'battle_win',
      target: 4,
      rewardCoins: 85,
      rewardBerryId: 'poffin',
    },
  ];

  const shuffled = [...templates].sort(() => Math.random() - 0.5).slice(0, 3);
  return shuffled.map((t, idx) => ({
    ...t,
    id: `q-${Date.now()}-${idx}`,
    progress: 0,
    claimed: false,
  }));
}

export function createInitialGameState(
  existingHallOfFame = [] as GameState['hallOfFame'],
  previousLineId?: string,
  forcedLineId?: string
): GameState {
  const line = forcedLineId
    ? getLineById(forcedLineId)
    : pickRandomLine(previousLineId);
  const now = Date.now();
  return {
    phase: 'egg',
    lineId: forcedLineId ? line.lineId : 'charmander',
    stageIndex: 0,
    isShiny: Math.random() < 0.08,
    level: 1,
    xp: 0,
    hunger: 85,
    happiness: 85,
    energy: 90,
    isSleeping: false,
    isDirty: false,
    eggProgress: 0,
    starterChosen: Boolean(forcedLineId),
    hatchedAt: now,
    lastActiveAt: now,
    totalInteractions: 0,
    adventureStage: 1,
    coins: 100,
    inventory: { oran: 3, sitrus: 1 },
    shopSlots: generateShopSlots(),
    shopRefreshesAt: now + SHOP_REFRESH_INTERVAL_MS,
    quests: generateQuests(),
    eggBag: [],
    hallOfFame: existingHallOfFame,
  };
}

export const FOOD_ITEMS: ShopItem[] = [
  {
    id: 'oran',
    name: 'Oran Berry',
    emoji: '🫐',
    category: 'food',
    price: 20,
    hungerRestore: 22,
    xpBonus: 12,
    happinessBonus: 3,
    rarityWeight: 35,
    maxStock: 4,
    description: 'Berry azul nutritiva (+22 Fome, +12 XP)',
  },
  {
    id: 'sitrus',
    name: 'Sitrus Berry',
    emoji: '🍋',
    category: 'food',
    price: 40,
    hungerRestore: 40,
    xpBonus: 20,
    happinessBonus: 7,
    rarityWeight: 25,
    maxStock: 3,
    description: 'Berry dourada restauradora (+40 Fome, +20 XP)',
  },
  {
    id: 'poffin',
    name: 'Poffin Especial',
    emoji: '🧁',
    category: 'food',
    price: 70,
    hungerRestore: 60,
    xpBonus: 30,
    happinessBonus: 15,
    rarityWeight: 16,
    maxStock: 2,
    description: 'Doce gourmet favorito (+60 Fome, +30 XP, +15 Feliz)',
  },
  {
    id: 'rare_candy',
    name: 'Rare Candy',
    emoji: '🍬',
    category: 'food',
    price: 150,
    hungerRestore: 10,
    xpBonus: 0,
    happinessBonus: 10,
    levelUp: true,
    rarityWeight: 7,
    maxStock: 1,
    description: 'Doce raro que sobe +1 Nível instantaneamente!',
  },
];

export const EVOLUTION_STONES: ShopItem[] = [
  {
    id: 'fire_stone',
    name: 'Pedra do Fogo',
    emoji: '🔥',
    category: 'stone',
    price: 220,
    stoneTypes: ['fire'],
    rarityWeight: 8,
    maxStock: 1,
    description: 'Evolui Pokémon do tipo Fogo instantaneamente!',
  },
  {
    id: 'leaf_stone',
    name: 'Pedra da Folha',
    emoji: '🍃',
    category: 'stone',
    price: 220,
    stoneTypes: ['grass'],
    rarityWeight: 8,
    maxStock: 1,
    description: 'Evolui Pokémon do tipo Planta instantaneamente!',
  },
  {
    id: 'water_stone',
    name: 'Pedra da Água',
    emoji: '💧',
    category: 'stone',
    price: 220,
    stoneTypes: ['water'],
    rarityWeight: 8,
    maxStock: 1,
    description: 'Evolui Pokémon do tipo Água instantaneamente!',
  },
  {
    id: 'thunder_stone',
    name: 'Pedra do Trovão',
    emoji: '⚡',
    category: 'stone',
    price: 220,
    stoneTypes: ['electric'],
    rarityWeight: 8,
    maxStock: 1,
    description: 'Evolui Pokémon Elétricos instantaneamente!',
  },
  {
    id: 'dusk_stone',
    name: 'Pedra Sombria',
    emoji: '🔮',
    category: 'stone',
    price: 240,
    stoneTypes: ['ghost'],
    rarityWeight: 6,
    maxStock: 1,
    description: 'Evolui Pokémon Fantasma instantaneamente!',
  },
  {
    id: 'shiny_stone',
    name: 'Pedra Brilhante',
    emoji: '✨',
    category: 'stone',
    price: 250,
    stoneTypes: ['fairy', 'dragon'],
    rarityWeight: 6,
    maxStock: 1,
    description: 'Evolui Pokémon Fada e Dragão instantaneamente!',
  },
];

export const SHOP_ITEMS: ShopItem[] = [...FOOD_ITEMS, ...EVOLUTION_STONES];

export function getFoodById(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((f) => f.id === id);
}

export function getShopItemById(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === id);
}

export function generateShopSlots(count = 5): ShopSlot[] {
  const pool = [...SHOP_ITEMS];
  const chosen: ShopSlot[] = [];

  while (chosen.length < count && pool.length > 0) {
    const totalWeight = pool.reduce((sum, item) => sum + item.rarityWeight, 0);
    let r = Math.random() * totalWeight;
    let pickedIdx = 0;
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].rarityWeight;
      if (r <= 0) {
        pickedIdx = i;
        break;
      }
    }
    const [picked] = pool.splice(pickedIdx, 1);
    const stock =
      picked.maxStock === 1
        ? 1
        : 1 + Math.floor(Math.random() * picked.maxStock);
    chosen.push({ itemId: picked.id, stock });
  }

  return chosen;
}

export function rollAdventureBerryDrop(isBoss: boolean): ShopItem | undefined {
  const roll = Math.random();
  if (isBoss) {
    if (roll < 0.25) return FOOD_ITEMS[3]; // Rare Candy
    if (roll < 0.75) return FOOD_ITEMS[1]; // Sitrus Berry
    return FOOD_ITEMS[0]; // Oran Berry
  }
  if (roll < 0.35) return FOOD_ITEMS[0];
  if (roll < 0.48) return FOOD_ITEMS[1];
  return undefined;
}

export function rollAdventureStoneDrop(isBoss: boolean): ShopItem | undefined {
  const chance = isBoss ? 0.22 : 0.05;
  if (Math.random() >= chance) return undefined;
  return EVOLUTION_STONES[Math.floor(Math.random() * EVOLUTION_STONES.length)];
}

export const MOVES_BY_LINE: Record<string, PokemonMove[]> = {
  charmander: [
    { id: 'scratch', name: 'Arranhão', type: 'normal', power: 22, accuracy: 98 },
    { id: 'ember', name: 'Brasas', type: 'fire', power: 30, accuracy: 95 },
    { id: 'fire_fang', name: 'Presa de Fogo', type: 'fire', power: 35, accuracy: 92 },
    { id: 'flamethrower', name: 'Lança-Chamas', type: 'fire', power: 42, accuracy: 88 },
  ],
  bulbasaur: [
    { id: 'tackle', name: 'Investida', type: 'normal', power: 22, accuracy: 98 },
    { id: 'vine_whip', name: 'Chicote de Vinha', type: 'grass', power: 30, accuracy: 95 },
    { id: 'razor_leaf', name: 'Folha Navalha', type: 'grass', power: 35, accuracy: 92 },
    { id: 'solar_beam', name: 'Raio Solar', type: 'grass', power: 43, accuracy: 85 },
  ],
  squirtle: [
    { id: 'tackle', name: 'Investida', type: 'normal', power: 22, accuracy: 98 },
    { id: 'water_gun', name: 'Jato de Água', type: 'water', power: 30, accuracy: 95 },
    { id: 'water_pulse', name: 'Pulso de Água', type: 'water', power: 36, accuracy: 91 },
    { id: 'hydro_pump', name: 'Hidro Bomba', type: 'water', power: 43, accuracy: 84 },
  ],
  pichu: [
    { id: 'quick_attack', name: 'Ataque Rápido', type: 'normal', power: 24, accuracy: 100 },
    { id: 'thunder_shock', name: 'Choque do Trovão', type: 'electric', power: 30, accuracy: 96 },
    { id: 'spark', name: 'Faísca', type: 'electric', power: 35, accuracy: 92 },
    { id: 'thunderbolt', name: 'Relâmpago', type: 'electric', power: 42, accuracy: 86 },
  ],
  gastly: [
    { id: 'lick', name: 'Lambida', type: 'ghost', power: 24, accuracy: 98 },
    { id: 'night_shade', name: 'Sombra Noturna', type: 'ghost', power: 31, accuracy: 95 },
    { id: 'shadow_punch', name: 'Soco Sombrio', type: 'ghost', power: 36, accuracy: 94 },
    { id: 'shadow_ball', name: 'Bola Sombria', type: 'ghost', power: 42, accuracy: 87 },
  ],
  dratini: [
    { id: 'wrap', name: 'Enrolar', type: 'normal', power: 22, accuracy: 96 },
    { id: 'dragon_breath', name: 'Sopro do Dragão', type: 'dragon', power: 31, accuracy: 95 },
    { id: 'dragon_pulse', name: 'Pulso do Dragão', type: 'dragon', power: 37, accuracy: 91 },
    { id: 'outrage', name: 'Fúria do Dragão', type: 'dragon', power: 44, accuracy: 84 },
  ],
  togepi: [
    { id: 'pound', name: 'Tapa', type: 'normal', power: 22, accuracy: 98 },
    { id: 'fairy_wind', name: 'Vento de Fada', type: 'fairy', power: 30, accuracy: 96 },
    { id: 'dazzling_gleam', name: 'Brilho Mágico', type: 'fairy', power: 36, accuracy: 92 },
    { id: 'moonblast', name: 'Explosão Lunar', type: 'fairy', power: 42, accuracy: 86 },
  ],
};

export function getMovesForLine(lineId: string, fallbackType: PokemonType): PokemonMove[] {
  return MOVES_BY_LINE[lineId] ?? MOVES_BY_TYPE[fallbackType];
}

export const MOVES_BY_TYPE: Record<PokemonType, PokemonMove[]> = {
  fire: [
    { id: 'scratch', name: 'Arranhão', type: 'normal', power: 22, accuracy: 98 },
    { id: 'ember', name: 'Brasas', type: 'fire', power: 30, accuracy: 95 },
    { id: 'flame_burst', name: 'Rajada Flamejante', type: 'fire', power: 40, accuracy: 88 },
    { id: 'fire_fang', name: 'Presa de Fogo', type: 'fire', power: 34, accuracy: 92 },
  ],
  grass: [
    { id: 'tackle', name: 'Investida', type: 'normal', power: 22, accuracy: 98 },
    { id: 'vine_whip', name: 'Chicote de Vinha', type: 'grass', power: 30, accuracy: 95 },
    { id: 'razor_leaf', name: 'Folha Navalha', type: 'grass', power: 35, accuracy: 92 },
    { id: 'solar_beam', name: 'Raio Solar', type: 'grass', power: 42, accuracy: 85 },
  ],
  water: [
    { id: 'tackle', name: 'Investida', type: 'normal', power: 22, accuracy: 98 },
    { id: 'water_gun', name: 'Jato de Água', type: 'water', power: 30, accuracy: 95 },
    { id: 'aqua_tail', name: 'Cauda Acuática', type: 'water', power: 36, accuracy: 90 },
    { id: 'hydro_pump', name: 'Hidro Bomba', type: 'water', power: 43, accuracy: 84 },
  ],
  electric: [
    { id: 'quick_attack', name: 'Ataque Rápido', type: 'normal', power: 24, accuracy: 100 },
    { id: 'thunder_shock', name: 'Choque do Trovão', type: 'electric', power: 30, accuracy: 96 },
    { id: 'spark', name: 'Faísca', type: 'electric', power: 35, accuracy: 92 },
    { id: 'thunderbolt', name: 'Relâmpago', type: 'electric', power: 42, accuracy: 86 },
  ],
  ghost: [
    { id: 'lick', name: 'Lambida', type: 'ghost', power: 24, accuracy: 98 },
    { id: 'night_shade', name: 'Sombra Noturna', type: 'ghost', power: 31, accuracy: 95 },
    { id: 'shadow_claw', name: 'Garra Sombria', type: 'ghost', power: 36, accuracy: 92 },
    { id: 'shadow_ball', name: 'Bola Sombria', type: 'ghost', power: 42, accuracy: 87 },
  ],
  dragon: [
    { id: 'slam', name: 'Pancada', type: 'normal', power: 24, accuracy: 96 },
    { id: 'dragon_breath', name: 'Sopro do Dragão', type: 'dragon', power: 31, accuracy: 95 },
    { id: 'dragon_claw', name: 'Garra do Dragão', type: 'dragon', power: 37, accuracy: 91 },
    { id: 'outrage', name: 'Fúria do Dragão', type: 'dragon', power: 44, accuracy: 84 },
  ],
  fairy: [
    { id: 'pound', name: 'Pancada Fofa', type: 'normal', power: 22, accuracy: 98 },
    { id: 'fairy_wind', name: 'Vento de Fada', type: 'fairy', power: 30, accuracy: 96 },
    { id: 'dazzling_gleam', name: 'Brilho Mágico', type: 'fairy', power: 36, accuracy: 92 },
    { id: 'moonblast', name: 'Explosão Lunar', type: 'fairy', power: 42, accuracy: 86 },
  ],
};

export const TYPE_META: Record<
  PokemonType | 'normal',
  { label: string; emoji: string; buttonClass: string; badgeClass: string }
> = {
  fire: {
    label: 'FOGO',
    emoji: '🔥',
    buttonClass: 'bg-orange-500/20 ring-orange-400/50 text-orange-100 hover:bg-orange-500/30',
    badgeClass: 'bg-orange-500/25 text-orange-200',
  },
  grass: {
    label: 'PLANTA',
    emoji: '🍃',
    buttonClass: 'bg-emerald-500/20 ring-emerald-400/50 text-emerald-100 hover:bg-emerald-500/30',
    badgeClass: 'bg-emerald-500/25 text-emerald-200',
  },
  water: {
    label: 'ÁGUA',
    emoji: '💧',
    buttonClass: 'bg-sky-500/20 ring-sky-400/50 text-sky-100 hover:bg-sky-500/30',
    badgeClass: 'bg-sky-500/25 text-sky-200',
  },
  electric: {
    label: 'ELÉTRICO',
    emoji: '⚡',
    buttonClass: 'bg-amber-500/20 ring-amber-400/50 text-amber-100 hover:bg-amber-500/30',
    badgeClass: 'bg-amber-500/25 text-amber-200',
  },
  ghost: {
    label: 'FANTASMA',
    emoji: '👻',
    buttonClass: 'bg-purple-500/20 ring-purple-400/50 text-purple-100 hover:bg-purple-500/30',
    badgeClass: 'bg-purple-500/25 text-purple-200',
  },
  dragon: {
    label: 'DRAGÃO',
    emoji: '🐉',
    buttonClass: 'bg-indigo-500/20 ring-indigo-400/50 text-indigo-100 hover:bg-indigo-500/30',
    badgeClass: 'bg-indigo-500/25 text-indigo-200',
  },
  fairy: {
    label: 'FADA',
    emoji: '✨',
    buttonClass: 'bg-pink-500/20 ring-pink-400/50 text-pink-100 hover:bg-pink-500/30',
    badgeClass: 'bg-pink-500/25 text-pink-200',
  },
  normal: {
    label: 'NORMAL',
    emoji: '⭐',
    buttonClass: 'bg-slate-600/35 ring-slate-400/45 text-slate-100 hover:bg-slate-600/50',
    badgeClass: 'bg-slate-600/40 text-slate-200',
  },
};

const TYPE_CHART: Record<PokemonType | 'normal', Partial<Record<PokemonType, number>>> = {
  fire: { grass: 2, fire: 0.5, water: 0.5, dragon: 0.5 },
  grass: { water: 2, fire: 0.5, grass: 0.5, dragon: 0.5 },
  water: { fire: 2, water: 0.5, grass: 0.5, dragon: 0.5 },
  electric: { water: 2, grass: 0.5, electric: 0.5, dragon: 0.5 },
  ghost: { ghost: 2 },
  dragon: { dragon: 2, fairy: 0 },
  fairy: { dragon: 2, fire: 0.5 },
  normal: { ghost: 0 },
};

export function getTypeEffectiveness(moveType: PokemonType | 'normal', defenderType: PokemonType): number {
  return TYPE_CHART[moveType]?.[defenderType] ?? 1;
}

export interface WildOpponent {
  id: number;
  lineId: string;
  name: string;
  type: PokemonType;
  level: number;
  maxHp: number;
  power: number;
  isBoss: boolean;
  stageNumber: number;
  moves: PokemonMove[];
}

export function spawnWildOpponent(
  stageNumber: number,
  playerLevel: number,
  excludeId?: number
): WildOpponent {
  const isBoss = stageNumber > 0 && stageNumber % 5 === 0;

  if (isBoss) {
    // Bosses are always evolved forms (stage 1 or final stage 2)
    const bossStageIndex = stageNumber >= 10 ? 2 : Math.random() < 0.5 ? 1 : 2;
    const bossPool = EVOLUTIONARY_LINES.filter(
      (l) => l.stages[bossStageIndex].id !== excludeId
    );
    const chosenLine =
      bossPool[Math.floor(Math.random() * bossPool.length)] ?? EVOLUTIONARY_LINES[0];
    const bossStage = chosenLine.stages[bossStageIndex];
    const level = Math.max(playerLevel + 1, Math.min(20, Math.round(playerLevel + stageNumber * 0.25)));
    const maxHp = Math.round((68 + level * 14) * 1.25);

    return {
      id: bossStage.id,
      lineId: chosenLine.lineId,
      name: bossStage.name,
      type: chosenLine.type,
      level,
      maxHp,
      power: Math.round((bossStage.basePower + level * 2.2) * 1.15),
      isBoss: true,
      stageNumber,
      moves: getMovesForLine(chosenLine.lineId, chosenLine.type),
    };
  }

  const candidates: Array<{ stage: PokemonStage; lineId: string; type: PokemonType }> = [];
  for (const line of EVOLUTIONARY_LINES) {
    for (const stage of line.stages) {
      if (stage.id !== excludeId && stage.minLevel <= Math.max(1, playerLevel + 1)) {
        candidates.push({ stage, lineId: line.lineId, type: line.type });
      }
    }
  }
  const pick = candidates[Math.floor(Math.random() * candidates.length)] ?? {
    stage: EVOLUTIONARY_LINES[0].stages[0],
    lineId: EVOLUTIONARY_LINES[0].lineId,
    type: EVOLUTIONARY_LINES[0].type,
  };
  const level = Math.max(
    1,
    Math.round(playerLevel + (stageNumber - 1) * 0.15 + (Math.random() < 0.3 ? 1 : 0))
  );
  const maxHp = 44 + level * 10;
  return {
    id: pick.stage.id,
    lineId: pick.lineId,
    name: pick.stage.name,
    type: pick.type,
    level,
    maxHp,
    power: pick.stage.basePower + level * 1.8,
    isBoss: false,
    stageNumber,
    moves: getMovesForLine(pick.lineId, pick.type),
  };
}
