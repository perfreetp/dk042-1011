import type { Pet, PetType, Rarity, Skill, SynergySkill } from '../types';

const createSkill = (
  id: string,
  name: string,
  description: string,
  damage: number,
  cooldown: number,
  type: PetType,
  emoji: string
): Skill => ({
  id,
  name,
  description,
  damage,
  cooldown,
  currentCooldown: 0,
  type,
  emoji,
});

export const STARTER_PETS: Pet[] = [
  {
    id: 'pet-flame-001',
    name: '小火龙',
    type: 'fire',
    emoji: '�',
    level: 1,
    exp: 0,
    expToNext: 100,
    hp: 120,
    maxHp: 120,
    attack: 28,
    defense: 12,
    speed: 22,
    mood: 80,
    stamina: 100,
    rarity: 'rare',
    skills: [
      createSkill('skill-fire-1', '火花', '喷出炽热火花', 35, 2, 'fire', '✨'),
      createSkill('skill-fire-2', '烈焰冲击', '全身燃烧冲撞敌人', 55, 4, 'fire', '💥'),
    ],
    synergyBonds: ['pet-water-001', 'pet-wind-001'],
  },
  {
    id: 'pet-water-001',
    name: '水灵龟',
    type: 'water',
    emoji: '🐢',
    level: 1,
    exp: 0,
    expToNext: 100,
    hp: 150,
    maxHp: 150,
    attack: 20,
    defense: 25,
    speed: 15,
    mood: 85,
    stamina: 100,
    rarity: 'rare',
    skills: [
      createSkill('skill-water-1', '水枪', '射出强力水柱', 30, 2, 'water', '💧'),
      createSkill('skill-water-2', '海啸', '召唤巨浪席卷敌人', 50, 4, 'water', '🌊'),
    ],
    synergyBonds: ['pet-earth-001', 'pet-fire-001'],
  },
  {
    id: 'pet-wind-001',
    name: '风语鸟',
    type: 'wind',
    emoji: '🦅',
    level: 1,
    exp: 0,
    expToNext: 100,
    hp: 90,
    maxHp: 90,
    attack: 25,
    defense: 10,
    speed: 35,
    mood: 90,
    stamina: 100,
    rarity: 'rare',
    skills: [
      createSkill('skill-wind-1', '风刃', '挥出锋利风刃', 32, 2, 'wind', '🌀'),
      createSkill('skill-wind-2', '暴风漩涡', '召唤狂风漩涡', 48, 4, 'wind', '🌪️'),
    ],
    synergyBonds: ['pet-fire-001', 'pet-light-001'],
  },
];

export const PET_TEMPLATES: Record<PetType, { name: string; emoji: string; baseStats: Partial<Pet> }> = {
  fire: {
    name: '火焰精灵',
    emoji: '🔥',
    baseStats: { attack: 28, defense: 12, speed: 22, maxHp: 110 },
  },
  water: {
    name: '海之使者',
    emoji: '🌊',
    baseStats: { attack: 20, defense: 25, speed: 16, maxHp: 140 },
  },
  earth: {
    name: '岩石巨人',
    emoji: '🗿',
    baseStats: { attack: 24, defense: 30, speed: 10, maxHp: 160 },
  },
  wind: {
    name: '疾风之翼',
    emoji: '�',
    baseStats: { attack: 25, defense: 10, speed: 35, maxHp: 95 },
  },
  light: {
    name: '圣光使者',
    emoji: '✨',
    baseStats: { attack: 26, defense: 18, speed: 25, maxHp: 120 },
  },
  dark: {
    name: '暗影刺客',
    emoji: '🌑',
    baseStats: { attack: 32, defense: 12, speed: 28, maxHp: 100 },
  },
};

export const SKILL_POOL: Record<PetType, Skill[]> = {
  fire: [
    createSkill('skill-fire-a', '火球术', '投掷燃烧火球', 30, 2, 'fire', '🔥'),
    createSkill('skill-fire-b', '熔岩喷射', '喷射滚烫熔岩', 45, 3, 'fire', '🌋'),
    createSkill('skill-fire-c', '爆炎', '引发大范围爆炸', 65, 5, 'fire', '�'),
  ],
  water: [
    createSkill('skill-water-a', '水弹', '发射压缩水弹', 28, 2, 'water', '💧'),
    createSkill('skill-water-b', '冰冻光线', '冻结敌人的光线', 42, 3, 'water', '❄️'),
    createSkill('skill-water-c', '深渊漩涡', '吞噬一切的漩涡', 60, 5, 'water', '🌀'),
  ],
  earth: [
    createSkill('skill-earth-a', '落石', '召唤岩石砸落', 32, 2, 'earth', '🪨'),
    createSkill('skill-earth-b', '地裂', '撕裂大地的冲击', 48, 3, 'earth', '⛰️'),
    createSkill('skill-earth-c', '山崩地裂', '天崩地裂的一击', 70, 5, 'earth', '🏔️'),
  ],
  wind: [
    createSkill('skill-wind-a', '疾风斩', '快速风之刃', 26, 2, 'wind', '💨'),
    createSkill('skill-wind-b', '龙卷风', '小型龙卷风', 44, 3, 'wind', '🌪️'),
    createSkill('skill-wind-c', '天罚风雷', '雷霆万钧的风暴', 58, 5, 'wind', '⚡'),
  ],
  light: [
    createSkill('skill-light-a', '圣光弹', '神圣之光凝聚', 30, 2, 'light', '💫'),
    createSkill('skill-light-b', '净化光束', '净化邪恶的光芒', 46, 3, 'light', '🌟'),
    createSkill('skill-light-c', '神圣审判', '来自天界的裁决', 62, 5, 'light', '👼'),
  ],
  dark: [
    createSkill('skill-dark-a', '暗影突袭', '从阴影中偷袭', 34, 2, 'dark', '👤'),
    createSkill('skill-dark-b', '腐蚀之雾', '侵蚀一切的黑雾', 42, 3, 'dark', '�️'),
    createSkill('skill-dark-c', '虚空吞噬', '来自虚空的毁灭', 68, 5, 'dark', '🕳️'),
  ],
};

export const SYNERGY_SKILLS: SynergySkill[] = [
  {
    id: 'synergy-fire-wind',
    name: '烈焰风暴',
    description: '火与风的结合，产生毁天灭地的火焰风暴',
    damage: 150,
    requiredBonds: ['fire', 'wind'],
    emoji: '🔥�️',
  },
  {
    id: 'synergy-water-earth',
    name: '泥沼陷阱',
    description: '水土交融，形成无法逃脱的泥沼',
    damage: 130,
    requiredBonds: ['water', 'earth'],
    emoji: '�🗿',
  },
  {
    id: 'synergy-light-dark',
    name: '混沌一击',
    description: '光暗平衡的力量，超越常理的攻击',
    damage: 180,
    requiredBonds: ['light', 'dark'],
    emoji: '✨🌑',
  },
  {
    id: 'synergy-fire-water',
    name: '蒸汽爆发',
    description: '冰火相遇产生的高压蒸汽爆炸',
    damage: 140,
    requiredBonds: ['fire', 'water'],
    emoji: '🔥💧',
  },
  {
    id: 'synergy-triple',
    name: '三位一体',
    description: '三只宠物心意相通，释放终极合击',
    damage: 250,
    requiredBonds: [],
    emoji: '⚡⚡⚡',
  },
];

export const RARITY_MULTIPLIER: Record<Rarity, number> = {
  common: 1,
  rare: 1.2,
  epic: 1.5,
  legendary: 2,
};
