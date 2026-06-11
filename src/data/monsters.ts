import type { MonsterTemplate, Monster, PetType } from '../types';

export const MONSTER_TEMPLATES: MonsterTemplate[] = [
  {
    id: 'monster-slime',
    name: '史莱姆',
    emoji: '🟢',
    type: 'water',
    baseHp: 60,
    baseAttack: 12,
    baseDefense: 5,
    baseSpeed: 8,
    rewards: [
      { type: 'gold', amount: 15 },
      { type: 'exp', amount: 20 },
    ],
    expReward: 25,
    toolDrops: [{ itemId: 'harvest-sickle', probability: 0.03 }],
  },
  {
    id: 'monster-fire-wolf',
    name: '火狼',
    emoji: '🐺',
    type: 'fire',
    baseHp: 80,
    baseAttack: 22,
    baseDefense: 8,
    baseSpeed: 18,
    rewards: [
      { type: 'gold', amount: 25 },
      { type: 'herb', amount: 3 },
      { type: 'exp', amount: 35 },
    ],
    expReward: 40,
    toolDrops: [{ itemId: 'harvest-sickle', probability: 0.06 }],
  },
  {
    id: 'monster-rock-golem',
    name: '岩石傀儡',
    emoji: '🗿',
    type: 'earth',
    baseHp: 150,
    baseAttack: 18,
    baseDefense: 25,
    baseSpeed: 5,
    rewards: [
      { type: 'ore', amount: 8 },
      { type: 'gold', amount: 30 },
      { type: 'exp', amount: 45 },
    ],
    expReward: 55,
    toolDrops: [{ itemId: 'miner-pickaxe', probability: 0.08 }],
  },
  {
    id: 'monster-harpy',
    name: '鸟身女妖',
    emoji: '🦅',
    type: 'wind',
    baseHp: 70,
    baseAttack: 25,
    baseDefense: 6,
    baseSpeed: 28,
    rewards: [
      { type: 'shell', amount: 5 },
      { type: 'gold', amount: 28 },
      { type: 'exp', amount: 38 },
    ],
    expReward: 45,
    toolDrops: [{ itemId: 'shell-net', probability: 0.07 }],
  },
  {
    id: 'monster-shadow',
    name: '暗影刺客',
    emoji: '👤',
    type: 'dark',
    baseHp: 90,
    baseAttack: 30,
    baseDefense: 10,
    baseSpeed: 25,
    rewards: [
      { type: 'gold', amount: 45 },
      { type: 'herb', amount: 5 },
      { type: 'exp', amount: 60 },
    ],
    expReward: 70,
    toolDrops: [
      { itemId: 'miner-pickaxe', probability: 0.05 },
      { itemId: 'harvest-sickle', probability: 0.05 },
      { itemId: 'shell-net', probability: 0.05 },
    ],
  },
  {
    id: 'monster-angel',
    name: '堕落天使',
    emoji: '😇',
    type: 'light',
    baseHp: 120,
    baseAttack: 28,
    baseDefense: 15,
    baseSpeed: 22,
    rewards: [
      { type: 'gold', amount: 55 },
      { type: 'shell', amount: 8 },
      { type: 'exp', amount: 75 },
    ],
    expReward: 85,
    toolDrops: [
      { itemId: 'miner-pickaxe', probability: 0.06 },
      { itemId: 'harvest-sickle', probability: 0.06 },
      { itemId: 'shell-net', probability: 0.06 },
    ],
  },
  {
    id: 'monster-sea-serpent',
    name: '海蛇',
    emoji: '🐍',
    type: 'water',
    baseHp: 110,
    baseAttack: 26,
    baseDefense: 12,
    baseSpeed: 20,
    rewards: [
      { type: 'shell', amount: 10 },
      { type: 'gold', amount: 40 },
      { type: 'exp', amount: 55 },
    ],
    expReward: 65,
    toolDrops: [{ itemId: 'shell-net', probability: 0.1 }],
  },
  {
    id: 'monster-kraken',
    name: '海怪',
    emoji: '🦑',
    type: 'water',
    baseHp: 300,
    baseAttack: 40,
    baseDefense: 20,
    baseSpeed: 15,
    rewards: [
      { type: 'gold', amount: 150 },
      { type: 'shell', amount: 25 },
      { type: 'ore', amount: 15 },
      { type: 'exp', amount: 200 },
    ],
    expReward: 250,
    toolDrops: [
      { itemId: 'shell-net', probability: 0.2 },
      { itemId: 'miner-pickaxe', probability: 0.1 },
    ],
  },
  {
    id: 'monster-phoenix',
    name: '凤凰',
    emoji: '🦅',
    type: 'fire',
    baseHp: 280,
    baseAttack: 45,
    baseDefense: 18,
    baseSpeed: 32,
    rewards: [
      { type: 'gold', amount: 180 },
      { type: 'herb', amount: 20 },
      { type: 'exp', amount: 220 },
    ],
    expReward: 280,
    toolDrops: [
      { itemId: 'harvest-sickle', probability: 0.18 },
      { itemId: 'shell-net', probability: 0.1 },
    ],
  },
  {
    id: 'monster-dragon',
    name: '远古巨龙',
    emoji: '🐉',
    type: 'fire',
    baseHp: 500,
    baseAttack: 55,
    baseDefense: 30,
    baseSpeed: 18,
    rewards: [
      { type: 'gold', amount: 300 },
      { type: 'ore', amount: 40 },
      { type: 'shell', amount: 20 },
      { type: 'herb', amount: 25 },
      { type: 'exp', amount: 400 },
    ],
    expReward: 500,
    toolDrops: [
      { itemId: 'miner-pickaxe', probability: 0.25 },
      { itemId: 'harvest-sickle', probability: 0.2 },
      { itemId: 'shell-net', probability: 0.2 },
    ],
  },
];

export const createMonsterFromTemplate = (
  templateId: string,
  levelMultiplier: number = 1,
  instanceId?: string
): Monster | null => {
  const template = MONSTER_TEMPLATES.find((m) => m.id === templateId);
  if (!template) return null;

  const id = instanceId || `monster-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const mult = levelMultiplier;

  return {
    id,
    templateId: template.id,
    name: template.name,
    emoji: template.emoji,
    type: template.type,
    hp: Math.floor(template.baseHp * mult),
    maxHp: Math.floor(template.baseHp * mult),
    attack: Math.floor(template.baseAttack * mult),
    defense: Math.floor(template.baseDefense * mult),
    speed: Math.floor(template.baseSpeed * mult),
    rewards: template.rewards.map((r) => ({
      ...r,
      amount: Math.floor(r.amount * mult),
    })),
    expReward: Math.floor(template.expReward * mult),
    toolDrops: template.toolDrops,
  };
};

export const getMonsterByType = (type: PetType): MonsterTemplate[] => {
  return MONSTER_TEMPLATES.filter((m) => m.type === type);
};
