import type { Recipe } from '../types';

export const RECIPES: Recipe[] = [
  {
    id: 'recipe-heal-potion',
    name: '治疗药水',
    emoji: '🧪',
    description: '恢复宠物50点生命值',
    materials: [
      { type: 'herb', amount: 5 },
      { type: 'shell', amount: 2 },
    ],
    output: { itemId: 'heal-potion', amount: 1 },
    requiredWorkshopLevel: 1,
  },
  {
    id: 'recipe-super-potion',
    name: '高级治疗药水',
    emoji: '⚗️',
    description: '完全恢复一只宠物的生命值',
    materials: [
      { type: 'herb', amount: 20 },
      { type: 'shell', amount: 10 },
      { type: 'ore', amount: 5 },
    ],
    output: { itemId: 'super-potion', amount: 1 },
    requiredWorkshopLevel: 4,
  },
  {
    id: 'recipe-hatch-accelerator',
    name: '孵化加速器',
    emoji: '⚡',
    description: '加速蛋的孵化进度30%',
    materials: [
      { type: 'herb', amount: 12 },
      { type: 'ore', amount: 8 },
      { type: 'shell', amount: 15 },
    ],
    output: { itemId: 'hatch-accelerator', amount: 1 },
    requiredWorkshopLevel: 3,
  },
  {
    id: 'recipe-mood-snack',
    name: '美味零食',
    emoji: '🍰',
    description: '大幅提升宠物心情值',
    materials: [
      { type: 'herb', amount: 10 },
      { type: 'shell', amount: 8 },
    ],
    output: { itemId: 'mood-snack', amount: 1 },
    requiredWorkshopLevel: 2,
  },
  {
    id: 'recipe-attack-scroll',
    name: '力量卷轴',
    emoji: '📜',
    description: '临时提升攻击力20%',
    materials: [
      { type: 'herb', amount: 8 },
      { type: 'ore', amount: 3 },
    ],
    output: { itemId: 'attack-scroll', amount: 1 },
    requiredWorkshopLevel: 2,
  },
  {
    id: 'recipe-defense-scroll',
    name: '铁壁卷轴',
    emoji: '🛡️',
    description: '临时提升防御力20%',
    materials: [
      { type: 'ore', amount: 10 },
      { type: 'shell', amount: 5 },
    ],
    output: { itemId: 'defense-scroll', amount: 1 },
    requiredWorkshopLevel: 2,
  },
  {
    id: 'recipe-gold-bag',
    name: '金币袋',
    emoji: '💰',
    description: '将材料兑换成金币',
    materials: [
      { type: 'ore', amount: 5 },
      { type: 'herb', amount: 5 },
      { type: 'shell', amount: 5 },
    ],
    output: { type: 'gold', amount: 100 },
    requiredWorkshopLevel: 1,
  },
  {
    id: 'recipe-exp-tome',
    name: '经验典籍',
    emoji: '📚',
    description: '获得大量经验值',
    materials: [
      { type: 'herb', amount: 15 },
      { type: 'shell', amount: 10 },
      { type: 'ore', amount: 10 },
    ],
    output: { type: 'exp', amount: 80 },
    requiredWorkshopLevel: 3,
  },
  {
    id: 'recipe-energy-drink',
    name: '能量饮料',
    emoji: '🥤',
    description: '恢复宠物50点体力值',
    materials: [
      { type: 'herb', amount: 6 },
      { type: 'ore', amount: 4 },
    ],
    output: { itemId: 'energy-drink', amount: 1 },
    requiredWorkshopLevel: 2,
  },
  {
    id: 'recipe-mood-candy',
    name: '心情糖果',
    emoji: '🍬',
    description: '稍微提升宠物心情值',
    materials: [
      { type: 'herb', amount: 4 },
      { type: 'shell', amount: 3 },
    ],
    output: { itemId: 'mood-candy', amount: 3 },
    requiredWorkshopLevel: 1,
  },
  {
    id: 'recipe-lucky-charm',
    name: '幸运符',
    emoji: '🍀',
    description: '提升稀有发现的概率',
    materials: [
      { type: 'herb', amount: 25 },
      { type: 'shell', amount: 20 },
      { type: 'ore', amount: 15 },
    ],
    output: { itemId: 'lucky-charm', amount: 1 },
    requiredWorkshopLevel: 5,
  },
];

export const getRecipeById = (id: string): Recipe | undefined => {
  return RECIPES.find((r) => r.id === id);
};

export const getRecipesByWorkshopLevel = (level: number): Recipe[] => {
  return RECIPES.filter((r) => r.requiredWorkshopLevel <= level);
};
