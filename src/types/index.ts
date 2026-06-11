export type PetType = 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type ResourceType = 'gold' | 'ore' | 'herb' | 'shell' | 'exp';

export type FacilityType = 'dock' | 'warehouse' | 'workshop' | 'hatchery';

export type ExpeditionStatus = 'traveling' | 'battling' | 'collecting' | 'returning' | 'completed';

export type ItemType = 'consumable' | 'material' | 'tool' | 'special';

export type DiscoveryCategory = 'pet' | 'island' | 'monster' | 'treasure' | 'lore';

export type AdventureNodeType = 'depart' | 'collect' | 'encounter' | 'discover' | 'claim' | 'start_battle' | 'victory' | 'defeat';

export interface ToolDrop {
  itemId: string;
  probability: number;
}

export interface AdventureNode {
  id: string;
  type: AdventureNodeType;
  timestamp: number;
  title?: string;
  description?: string;
  islandName?: string;
  islandEmoji?: string;
  message?: string;
  difficulty?: 'easy' | 'normal' | 'hard';
  usedLuckyCharm?: boolean;
  expChange?: number;
  won?: boolean;
  teamSnapshot?: { id: string; name: string; emoji: string; level: number; hp?: number; maxHp?: number }[];
  resourceChanges?: { type: ResourceType; amount: number; delta?: number; itemId?: string; itemName?: string }[];
  monsterIds?: string[];
  monsterDetails?: { templateId: string; name: string; emoji: string; defeated: boolean }[];
  discoveryIds?: string[];
  discoveryDetails?: { id: string; name: string; emoji: string; rarity: Rarity; category?: DiscoveryCategory }[];
  expDelta?: number;
  itemChanges?: { itemId: string; itemName: string; itemEmoji: string; amount: number; delta?: number }[];
}

export interface Item {
  id: string;
  name: string;
  emoji: string;
  description: string;
  type: ItemType;
  effect?: {
    type: 'heal' | 'hatchBoost' | 'moodBoost' | 'staminaBoost' | 'gatheringBonus' | 'discoveryBoost';
    value: number;
  };
  rarity: Rarity;
  stackable: boolean;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  damage: number;
  cooldown: number;
  currentCooldown: number;
  type: PetType;
  emoji: string;
}

export interface SynergySkill {
  id: string;
  name: string;
  description: string;
  damage: number;
  requiredBonds: string[];
  emoji: string;
}

export interface Pet {
  id: string;
  name: string;
  type: PetType;
  emoji: string;
  level: number;
  exp: number;
  expToNext: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  mood: number;
  stamina: number;
  skills: Skill[];
  synergyBonds: string[];
  rarity: Rarity;
}

export interface Egg {
  id: string;
  type: PetType;
  progress: number;
  rarity: Rarity;
  emoji: string;
}

export interface ResourceReward {
  type: ResourceType;
  amount: number;
}

export interface MonsterTemplate {
  id: string;
  name: string;
  emoji: string;
  type: PetType;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  rewards: ResourceReward[];
  expReward: number;
  toolDrops: ToolDrop[];
}

export interface Monster {
  id: string;
  templateId: string;
  name: string;
  emoji: string;
  type: PetType;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  rewards: ResourceReward[];
  expReward: number;
  toolDrops: ToolDrop[];
}

export interface Island {
  id: string;
  name: string;
  emoji: string;
  level: number;
  unlocked: boolean;
  x: number;
  y: number;
  specialties: ('ore' | 'herb' | 'shell')[];
  monsters: string[];
  rareDrops: string[];
  description: string;
  duration: number;
  toolDrops?: ToolDrop[];
  unlockRequirement?: { islandId: string; progress: number };
}

export interface Order {
  id: string;
  islander: string;
  islanderEmoji: string;
  requirements: { type: ResourceType; amount: number }[];
  rewards: { type: ResourceType; amount: number }[];
  completed: boolean;
  expiresAt: number;
  createdAt: number;
}

export interface AdventureRecord {
  id: string;
  type: 'expedition' | 'battle';
  startTime: number;
  endTime: number;
  islandId?: string;
  islandName?: string;
  islandEmoji?: string;
  difficulty?: 'easy' | 'normal' | 'hard';
  teamPetIds: string[];
  teamPetSnapshots: { id: string; name: string; emoji: string; level: number }[];
  collectedResources: ResourceReward[];
  encounteredMonsters: { templateId: string; name: string; emoji: string; defeated: boolean }[];
  discoveries: string[];
  expGained: number;
  usedLuckyCharm: boolean;
  summary: string;
  nodes: AdventureNode[];
  itemsGained: { itemId: string; amount: number }[];
}

export interface Expedition {
  islandId: string;
  startTime: number;
  durationSeconds: number;
  status: ExpeditionStatus;
  rewardsReady: boolean;
  battleWins: number;
  collected: ResourceReward[];
  logs: string[];
  discoveredItems: string[];
  encounteredMonsters: string[];
  battleLog: string[];
  lockedTeamPetIds: string[];
  lockedTeamSnapshots: { id: string; name: string; emoji: string; level: number }[];
  usedLuckyCharm: boolean;
  adventureRecordId?: string;
  pendingItems: { itemId: string; amount: number }[];
}

export interface Discovery {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  category: DiscoveryCategory;
  description: string;
  foundAt: number;
  referenceId?: string;
  adventureRecordId?: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  relatedDiscoveryId?: string;
  relatedIslandId?: string;
  relatedAdventureRecordId?: string;
}

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  description: string;
  materials: { type: ResourceType; amount: number }[];
  output: { type: ResourceType; amount: number } | { itemId: string; amount: number };
  requiredWorkshopLevel: number;
}

export interface Equipment {
  id: string;
  name: string;
  emoji: string;
  type: 'weapon' | 'armor' | 'accessory';
  durability: number;
  maxDurability: number;
  stats: { attack?: number; defense?: number; speed?: number; hp?: number };
  rarity: Rarity;
}

export interface BattleState {
  playerTeam: Pet[];
  enemyTeam: Monster[];
  turn: number;
  phase: 'idle' | 'fighting' | 'playerWin' | 'enemyWin';
  actionQueue: BattleAction[];
  battleLog: string[];
  synergyEnergy: number;
  maxSynergyEnergy: number;
  rewards: {
    exp: number;
    resources: ResourceReward[];
    discoveries: string[];
  };
  difficulty: 'easy' | 'normal' | 'hard';
}

export interface BattleAction {
  actorId: string;
  actorType: 'pet' | 'monster';
  targetId: string;
  actionType: 'attack' | 'skill' | 'synergy';
  skillId?: string;
  damage: number;
  timestamp: number;
}

export interface Facilities {
  dock: number;
  warehouse: number;
  workshop: number;
  hatchery: number;
}

export interface Resources {
  gold: number;
  ore: number;
  herb: number;
  shell: number;
  exp: number;
}

export interface GameState {
  resources: Resources;
  facilities: Facilities;
  pets: Pet[];
  eggs: Egg[];
  team: string[];
  expedition: Expedition | null;
  orders: Order[];
  discoveries: Discovery[];
  islandProgress: Record<string, number>;
  logs: LogEntry[];
  equipment: Equipment[];
  inventory: Record<string, number>;
  lastOrderRefresh: number;
  adventureRecords: AdventureRecord[];
  equippedTools: { ore?: string; herb?: string; shell?: string };
}
