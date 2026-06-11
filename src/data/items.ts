import type { Item, Rarity } from '../types';

export const ITEMS: Item[] = [
  {
    id: 'heal-potion',
    name: '治疗药水',
    emoji: '🧪',
    description: '恢复宠物50点生命值',
    type: 'consumable',
    effect: {
      type: 'heal',
      value: 50,
    },
    rarity: 'common',
    stackable: true,
  },
  {
    id: 'super-potion',
    name: '高级治疗药水',
    emoji: '⚗️',
    description: '完全恢复一只宠物的生命值',
    type: 'consumable',
    effect: {
      type: 'heal',
      value: 999,
    },
    rarity: 'rare',
    stackable: true,
  },
  {
    id: 'hatch-accelerator',
    name: '孵化加速器',
    emoji: '⚡',
    description: '加速蛋的孵化进度30%',
    type: 'consumable',
    effect: {
      type: 'hatchBoost',
      value: 30,
    },
    rarity: 'rare',
    stackable: true,
  },
  {
    id: 'mood-snack',
    name: '美味零食',
    emoji: '🍰',
    description: '大幅提升宠物心情值',
    type: 'consumable',
    effect: {
      type: 'moodBoost',
      value: 40,
    },
    rarity: 'common',
    stackable: true,
  },
  {
    id: 'energy-drink',
    name: '能量饮料',
    emoji: '🥤',
    description: '恢复宠物50点体力值',
    type: 'consumable',
    effect: {
      type: 'staminaBoost',
      value: 50,
    },
    rarity: 'common',
    stackable: true,
  },
  {
    id: 'attack-scroll',
    name: '力量卷轴',
    emoji: '📜',
    description: '临时提升攻击力20%，可用于战斗buff',
    type: 'material',
    rarity: 'rare',
    stackable: true,
  },
  {
    id: 'defense-scroll',
    name: '铁壁卷轴',
    emoji: '🛡️',
    description: '临时提升防御力20%，可用于战斗buff',
    type: 'material',
    rarity: 'rare',
    stackable: true,
  },
  {
    id: 'miner-pickaxe',
    name: '矿工镐',
    emoji: '⛏️',
    description: '采集矿石时获得额外加成',
    type: 'tool',
    effect: {
      type: 'gatheringBonus',
      value: 3,
    },
    rarity: 'rare',
    stackable: false,
  },
  {
    id: 'harvest-sickle',
    name: '采集镰刀',
    emoji: '🌾',
    description: '采集草药时获得额外加成',
    type: 'tool',
    effect: {
      type: 'gatheringBonus',
      value: 3,
    },
    rarity: 'rare',
    stackable: false,
  },
  {
    id: 'lucky-charm',
    name: '幸运符',
    emoji: '🍀',
    description: '出征前消耗一次，大幅提升稀有发现的概率',
    type: 'special',
    effect: {
      type: 'discoveryBoost',
      value: 30,
    },
    rarity: 'epic',
    stackable: true,
  },
  {
    id: 'shell-net',
    name: '贝壳网兜',
    emoji: '🥅',
    description: '采集贝壳时获得额外加成',
    type: 'tool',
    effect: {
      type: 'gatheringBonus',
      value: 3,
    },
    rarity: 'rare',
    stackable: false,
  },
  {
    id: 'stamina-potion',
    name: '体力药剂',
    emoji: '💪',
    description: '完全恢复宠物体力值',
    type: 'consumable',
    effect: {
      type: 'staminaBoost',
      value: 999,
    },
    rarity: 'epic',
    stackable: true,
  },
  {
    id: 'mood-candy',
    name: '心情糖果',
    emoji: '🍬',
    description: '稍微提升宠物心情值',
    type: 'consumable',
    effect: {
      type: 'moodBoost',
      value: 20,
    },
    rarity: 'common',
    stackable: true,
  },
];

export const getItemById = (id: string): Item | undefined => {
  return ITEMS.find((item) => item.id === id);
};

export const getItemsByType = (type: Item['type']): Item[] => {
  return ITEMS.filter((item) => item.type === type);
};

export const getItemsByRarity = (rarity: Rarity): Item[] => {
  return ITEMS.filter((item) => item.rarity === rarity);
};
