import type { Order, ResourceType, Rarity } from '../types';

export interface OrderTemplate {
  id: string;
  islander: string;
  islanderEmoji: string;
  title: string;
  description: string;
  requirements: { type: ResourceType; amount: number }[];
  rewards: { type: ResourceType; amount: number }[];
  durationMs: number;
  rarity: Rarity;
}

export const ORDER_TEMPLATES: OrderTemplate[] = [
  {
    id: 'order-fisherman',
    islander: '老渔夫阿海',
    islanderEmoji: '👴',
    title: '海鲜汤的材料',
    description: '我要煮一锅美味的海鲜汤，需要一些新鲜的贝壳和草药来提味。完成这个订单我会给你丰厚的报酬！',
    requirements: [
      { type: 'shell' as ResourceType, amount: 8 },
      { type: 'herb' as ResourceType, amount: 5 }
    ],
    rewards: [
      { type: 'gold' as ResourceType, amount: 120 },
      { type: 'exp' as ResourceType, amount: 50 }
    ],
    durationMs: 6 * 60 * 60 * 1000,
    rarity: 'common'
  },
  {
    id: 'order-blacksmith',
    islander: '铁匠大力',
    islanderEmoji: '🧔',
    title: '锻造原料',
    description: '最近订单太多，矿石快用完了！帮我收集一些矿石，我正在打造一批新武器。',
    requirements: [
      { type: 'ore' as ResourceType, amount: 15 }
    ],
    rewards: [
      { type: 'gold' as ResourceType, amount: 200 },
      { type: 'exp' as ResourceType, amount: 80 }
    ],
    durationMs: 8 * 60 * 60 * 1000,
    rarity: 'rare'
  },
  {
    id: 'order-miko',
    islander: '巫女小灵',
    islanderEmoji: '🧙‍♀️',
    title: '神秘仪式材料',
    description: '下个月的满月仪式需要特殊材料。请帮我收集草药、矿石和贝壳，仪式的成功就靠你了！',
    requirements: [
      { type: 'herb' as ResourceType, amount: 12 },
      { type: 'ore' as ResourceType, amount: 5 },
      { type: 'shell' as ResourceType, amount: 8 }
    ],
    rewards: [
      { type: 'gold' as ResourceType, amount: 350 },
      { type: 'exp' as ResourceType, amount: 150 }
    ],
    durationMs: 12 * 60 * 60 * 1000,
    rarity: 'epic'
  },
  {
    id: 'order-tailor',
    islander: '裁缝小美',
    islanderEmoji: '👩',
    title: '华美的布料装饰',
    description: '我正在设计一件华丽的礼服，需要用贝壳做装饰。你能帮我收集一些吗？',
    requirements: [
      { type: 'shell' as ResourceType, amount: 10 }
    ],
    rewards: [
      { type: 'gold' as ResourceType, amount: 180 },
      { type: 'exp' as ResourceType, amount: 70 }
    ],
    durationMs: 6 * 60 * 60 * 1000,
    rarity: 'common'
  },
  {
    id: 'order-captain',
    islander: '船长杰克',
    islanderEmoji: '🏴‍☠️',
    title: '远航补给',
    description: '下周一就要出航了！我需要大量贝壳和矿石来修理船只。',
    requirements: [
      { type: 'shell' as ResourceType, amount: 20 },
      { type: 'ore' as ResourceType, amount: 18 }
    ],
    rewards: [
      { type: 'gold' as ResourceType, amount: 450 },
      { type: 'exp' as ResourceType, amount: 200 }
    ],
    durationMs: 18 * 60 * 60 * 1000,
    rarity: 'epic'
  },
  {
    id: 'order-chef',
    islander: '厨师长胖虎',
    islanderEmoji: '👨‍🍳',
    title: '宴席食材大采购',
    description: '下周村长老爷的寿宴，我需要各种食材！草药、贝壳都多多益善！',
    requirements: [
      { type: 'herb' as ResourceType, amount: 15 },
      { type: 'shell' as ResourceType, amount: 12 },
      { type: 'ore' as ResourceType, amount: 6 }
    ],
    rewards: [
      { type: 'gold' as ResourceType, amount: 280 },
      { type: 'exp' as ResourceType, amount: 120 }
    ],
    durationMs: 10 * 60 * 60 * 1000,
    rarity: 'rare'
  },
  {
    id: 'order-scholar',
    islander: '学者阿明',
    islanderEmoji: '🤓',
    title: '古生物研究样本',
    description: '我在研究远古生物的进化，需要收集大量矿石和贝壳样本。这对学术研究很重要！',
    requirements: [
      { type: 'ore' as ResourceType, amount: 15 },
      { type: 'shell' as ResourceType, amount: 12 }
    ],
    rewards: [
      { type: 'gold' as ResourceType, amount: 320 },
      { type: 'exp' as ResourceType, amount: 140 }
    ],
    durationMs: 12 * 60 * 60 * 1000,
    rarity: 'rare'
  },
  {
    id: 'order-nun',
    islander: '修女玛丽',
    islanderEmoji: '👼',
    title: '孤儿院的药品',
    description: '孤儿院最近有很多孩子生病了，我需要大量草药来配药，还有矿石制作治疗设备。',
    requirements: [
      { type: 'herb' as ResourceType, amount: 20 },
      { type: 'ore' as ResourceType, amount: 8 },
      { type: 'shell' as ResourceType, amount: 10 }
    ],
    rewards: [
      { type: 'gold' as ResourceType, amount: 400 },
      { type: 'exp' as ResourceType, amount: 180 }
    ],
    durationMs: 16 * 60 * 60 * 1000,
    rarity: 'epic'
  },
  {
    id: 'order-merchant',
    islander: '商人路易',
    islanderEmoji: '💰',
    title: '稀有收藏品订单',
    description: '我有一个大客户，专门收集稀有物品。需要极品矿石、贝壳和草药，报酬绝对让你满意！',
    requirements: [
      { type: 'ore' as ResourceType, amount: 25 },
      { type: 'shell' as ResourceType, amount: 20 },
      { type: 'herb' as ResourceType, amount: 15 }
    ],
    rewards: [
      { type: 'gold' as ResourceType, amount: 800 },
      { type: 'exp' as ResourceType, amount: 350 }
    ],
    durationMs: 24 * 60 * 60 * 1000,
    rarity: 'legendary'
  },
  {
    id: 'order-adventurer',
    islander: '冒险者雷克斯',
    islanderEmoji: '⚔️',
    title: '精英探险装备',
    description: '我计划去暗影迷雾岛探险，需要最好的装备材料！矿石和草药都要最好的！',
    requirements: [
      { type: 'ore' as ResourceType, amount: 25 },
      { type: 'herb' as ResourceType, amount: 18 }
    ],
    rewards: [
      { type: 'gold' as ResourceType, amount: 650 },
      { type: 'exp' as ResourceType, amount: 280 }
    ],
    durationMs: 20 * 60 * 60 * 1000,
    rarity: 'legendary'
  },
  {
    id: 'order-florist',
    islander: '花店老板娘',
    islanderEmoji: '🌹',
    title: '美容护肤品材料',
    description: '春天来了，姑娘们都要护肤！我需要大量草药和贝壳做面膜和护肤品。',
    requirements: [
      { type: 'herb' as ResourceType, amount: 10 },
      { type: 'shell' as ResourceType, amount: 15 }
    ],
    rewards: [
      { type: 'gold' as ResourceType, amount: 150 },
      { type: 'exp' as ResourceType, amount: 60 }
    ],
    durationMs: 5 * 60 * 60 * 1000,
    rarity: 'common'
  },
  {
    id: 'order-guard',
    islander: '守卫队长',
    islanderEmoji: '🛡️',
    title: '城防紧急补充',
    description: '收到情报，近期可能有怪物袭击。我需要矿石来加强防御工事！',
    requirements: [
      { type: 'ore' as ResourceType, amount: 20 },
      { type: 'herb' as ResourceType, amount: 7 }
    ],
    rewards: [
      { type: 'gold' as ResourceType, amount: 260 },
      { type: 'exp' as ResourceType, amount: 110 }
    ],
    durationMs: 8 * 60 * 60 * 1000,
    rarity: 'rare'
  }
];

export const createOrderFromTemplate = (template: OrderTemplate): Order => {
  const now = Date.now();
  return {
    id: `${template.id}-${now}-${Math.floor(Math.random() * 1000)}`,
    islander: template.islander,
    islanderEmoji: template.islanderEmoji,
    requirements: template.requirements.map(r => ({ ...r })),
    rewards: template.rewards.map(r => ({ ...r })),
    completed: false,
    expiresAt: now + template.durationMs,
    createdAt: now
  };
};

export const getRandomOrders = (count: number = 3): Order[] => {
  const shuffled = [...ORDER_TEMPLATES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  return selected.map(t => createOrderFromTemplate(t));
};

export const getOrderTemplateById = (id: string): OrderTemplate | undefined => {
  return ORDER_TEMPLATES.find(t => t.id === id);
};

export const canCompleteOrder = (
  order: Order,
  resources: Record<ResourceType, number>
): boolean => {
  if (order.completed) return false;
  if (Date.now() > order.expiresAt) return false;
  for (const req of order.requirements) {
    const available = resources[req.type] || 0;
    if (available < req.amount) return false;
  }
  return true;
};

export const generateInitialOrders = (): Order[] => {
  return getRandomOrders(4);
};

export const refreshOrders = (minCount: number = 3, maxCount: number = 5): Order[] => {
  const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
  return getRandomOrders(count);
};
