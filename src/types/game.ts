export type PokemonType =
  | 'fire'
  | 'grass'
  | 'water'
  | 'electric'
  | 'ghost'
  | 'dragon'
  | 'fairy';

export interface PokemonMove {
  id: string;
  name: string;
  type: PokemonType | 'normal';
  power: number;
  accuracy: number;
}

export type ItemCategory = 'food' | 'stone';

export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  category: ItemCategory;
  price: number;
  hungerRestore?: number;
  xpBonus?: number;
  happinessBonus?: number;
  levelUp?: boolean;
  stoneTypes?: PokemonType[];
  rarityWeight: number; // higher = more common in PokéMart rotation
  maxStock: number;
  description: string;
}

export interface ShopSlot {
  itemId: string;
  stock: number;
}

export interface PokemonStage {
  id: number; // National Pokédex ID for PokéAPI sprites
  name: string;
  minLevel: number;
  basePower: number;
  baseSpeed: number;
  baseCharm: number;
}

export interface EvolutionaryLine {
  lineId: string;
  type: PokemonType;
  accentColor: string;
  bgGradient: string;
  eggColor: string;
  eggSpotColor: string;
  stages: [PokemonStage, PokemonStage, PokemonStage];
}

export type PetPhase = 'egg' | 'pet' | 'evolving' | 'farewell';

export type PetMoodAnimation =
  | 'idle'
  | 'happy'
  | 'poke'
  | 'dizzy'
  | 'somersault'
  | 'eating'
  | 'cleaning'
  | 'startled';

export interface FloatingParticle {
  id: string;
  text: string;
  x: number; // percentage 15..85
  y: number; // percentage 15..75
  tone: 'heart' | 'xp' | 'zzz' | 'sparkle' | 'angry' | 'clean';
}

export interface HallOfFameEntry {
  uid: string;
  lineId: string;
  finalPokemonId: number;
  finalName: string;
  type: PokemonType;
  isShiny?: boolean;
  levelReached: number;
  hatchedAt: number;
  departedAt: number;
  totalInteractions: number;
}

export type QuestMetric = 'battle_win' | 'feed' | 'pet' | 'minigame';

export interface QuestItem {
  id: string;
  title: string;
  metric: QuestMetric;
  target: number;
  progress: number;
  rewardCoins: number;
  rewardBerryId?: string;
  claimed: boolean;
}

export interface GameState {
  phase: PetPhase;
  lineId: string;
  stageIndex: 0 | 1 | 2;
  isShiny: boolean;
  level: number;
  xp: number;
  hunger: number; // 0..100
  happiness: number; // 0..100
  energy: number; // 0..100
  isSleeping: boolean;
  isDirty: boolean;
  eggProgress: number; // 0..100
  starterChosen: boolean;
  hatchedAt: number;
  lastActiveAt: number;
  totalInteractions: number;
  adventureStage: number;
  coins: number;
  inventory: Record<string, number>;
  shopSlots: ShopSlot[];
  shopRefreshesAt: number;
  quests: QuestItem[];
  eggBag: string[]; // lineIds of bonus eggs dropped by Bosses
  hallOfFame: HallOfFameEntry[];
}
