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
    output: { type: 'exp', amount: 0 },
    requiredWorkshopLevel: 1,
  },
  {
    id: 'recipe-attack-scroll',
    name: '力量卷轴',
    emoji: '�',
    description: '临时提升攻击力20%',
    materials: [
      { type: 'herb', amount: 8 },
      { type: 'ore', amount: 3 },
    ],
    output: { type: 'exp', amount: 15 },
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
    output: { type: 'exp', amount: 15 },
    requiredWorkshopLevel: 2,
  },
  {
    id: 'recipe-gold-bag',
    name: '金币袋',
    emoji: '�',
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
    emoji: '�',
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
    id: 'recipe-super-potion',
    name: '高级治疗药水',
    emoji: '⚗️',
    description: '完全恢复一只宠物的生命值',
    materials: [
      { type: 'herb', amount: 20 },
      { type: 'shell', amount: 10 },
      { type: 'ore', amount: 5 },
    ],
    output: { type: 'exp', amount: 25 },
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
    output: { type: 'exp', amount: 30 },
    requiredWorkshopLevel: 3,
  },
  {
    id: 'recipe-mood-snack',
    name: '美味零食',
    emoji: '�',
    description: '大幅提升宠物心情值',
    materials: [
      { type: 'herb', amount: 10 },
      { type: 'shell', amount: 8 },
    ],
    output: { type: 'exp', amount: 10 },
    requiredWorkshopLevel: 2,
  },
];

export const getRecipeById = (id: string): Recipe | undefined => {
  return RECIPES.find((r) => r.id === id);
};

export const getRecipesByWorkshopLevel = (level: number): Recipe[] => {
  return RECIPES.filter((r) => r.requiredWorkshopLevel <= level);
};
