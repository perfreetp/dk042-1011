import type { Discovery, Rarity, DiscoveryCategory } from '../types';

export const DISCOVERY_TEMPLATES: Omit<Discovery, 'foundAt'>[] = [
  {
    id: 'discovery-pearl',
    name: '深海珍珠',
    emoji: '🫧',
    rarity: 'rare',
    category: 'treasure',
    description: '在贝壳浅滩发现的天然珍珠，闪耀着柔和的光芒',
    referenceId: 'island-shell',
  },
  {
    id: 'discovery-coral',
    name: '红珊瑚',
    emoji: '🪸',
    rarity: 'rare',
    category: 'treasure',
    description: '深海中生长的珍贵红珊瑚，色泽鲜艳夺目',
    referenceId: 'island-shell',
  },
  {
    id: 'discovery-amber',
    name: '远古琥珀',
    emoji: '🟠',
    rarity: 'epic',
    category: 'treasure',
    description: '封存着远古昆虫的琥珀，记录着千万年前的生命',
    referenceId: 'island-herb',
  },
  {
    id: 'discovery-fossil',
    name: '远古化石',
    emoji: '🦴',
    rarity: 'epic',
    category: 'treasure',
    description: '远古生物的化石遗骸，见证了地球的变迁',
    referenceId: 'island-mine',
  },
  {
    id: 'discovery-ancient-coin',
    name: '远古金币',
    emoji: '🪙',
    rarity: 'rare',
    category: 'treasure',
    description: '刻有神秘符文的远古金币，来自失落的文明',
    referenceId: 'island-mine',
  },
  {
    id: 'discovery-ancient-herb',
    name: '千年灵芝',
    emoji: '🍄',
    rarity: 'epic',
    category: 'treasure',
    description: '草药密林深处生长的千年灵药，据说有起死回生之效',
    referenceId: 'island-herb',
  },
  {
    id: 'discovery-crystal',
    name: '魔法水晶',
    emoji: '💎',
    rarity: 'epic',
    category: 'treasure',
    description: '蕴含强大魔力的稀有水晶，散发着神秘的能量波动',
    referenceId: 'island-mine',
  },
  {
    id: 'discovery-holy-relic',
    name: '圣光遗物',
    emoji: '✨',
    rarity: 'legendary',
    category: 'treasure',
    description: '远古神圣时代遗留的神器碎片，触摸它能感受到神圣的力量',
    referenceId: 'island-light',
  },
  {
    id: 'discovery-phoenix-feather',
    name: '凤凰羽毛',
    emoji: '🪶',
    rarity: 'legendary',
    category: 'treasure',
    description: '传说中凤凰遗落的羽毛，温暖如火，永不熄灭',
    referenceId: 'island-volcano',
  },
  {
    id: 'discovery-trident',
    name: '海神三叉戟',
    emoji: '🔱',
    rarity: 'legendary',
    category: 'treasure',
    description: '失落的海神波塞冬之武器，掌控海洋的力量',
    referenceId: 'island-abyss',
  },
  {
    id: 'discovery-dragon-scale',
    name: '龙之逆鳞',
    emoji: '🐉',
    rarity: 'legendary',
    category: 'treasure',
    description: '远古巨龙身上最坚硬的鳞片，传说触之必怒',
    referenceId: 'island-dragon',
  },
  {
    id: 'discovery-world-tree',
    name: '世界树种子',
    emoji: '🌳',
    rarity: 'legendary',
    category: 'treasure',
    description: '孕育整个世界的神圣之树的种子，蕴含无限生机',
    referenceId: 'island-dragon',
  },
  {
    id: 'discovery-lore-map',
    name: '古老航海图',
    emoji: '🗺️',
    rarity: 'rare',
    category: 'lore',
    description: '一张泛黄的航海图，标注着许多未知的岛屿',
  },
  {
    id: 'discovery-lore-journal',
    name: '冒险家日志',
    emoji: '📖',
    rarity: 'rare',
    category: 'lore',
    description: '某位传奇冒险家留下的日志，记录了无数冒险故事',
  },
  {
    id: 'discovery-lore-stone',
    name: '古代石碑',
    emoji: '🪨',
    rarity: 'epic',
    category: 'lore',
    description: '刻有神秘符文的古代石碑，记载着远古文明的秘密',
  },
  {
    id: 'discovery-pet-legendary',
    name: '传说宠物目击',
    emoji: '👁️',
    rarity: 'legendary',
    category: 'pet',
    description: '在野外目击到了从未见过的神秘宠物身影',
  },
  {
    id: 'discovery-monster-dragon',
    name: '巨龙足迹',
    emoji: '🐾',
    rarity: 'epic',
    category: 'monster',
    description: '发现了巨大的龙形足迹，传说中的生物真的存在！',
    referenceId: 'monster-dragon',
  },
  {
    id: 'discovery-island-secret',
    name: '神秘岛屿传说',
    emoji: '🏝️',
    rarity: 'rare',
    category: 'island',
    description: '从当地人口中听到了关于一座神秘岛屿的传说',
  },
];

export const getDiscoveryById = (id: string): Omit<Discovery, 'foundAt'> | undefined => {
  return DISCOVERY_TEMPLATES.find((d) => d.id === id);
};

export const createDiscovery = (templateId: string): Discovery | null => {
  const template = getDiscoveryById(templateId);
  if (!template) return null;
  return {
    ...template,
    foundAt: Date.now(),
  };
};

export const getDiscoveriesByRarity = (rarity: Rarity): Omit<Discovery, 'foundAt'>[] => {
  return DISCOVERY_TEMPLATES.filter((d) => d.rarity === rarity);
};

export const getDiscoveriesByCategory = (category: DiscoveryCategory): Omit<Discovery, 'foundAt'>[] => {
  return DISCOVERY_TEMPLATES.filter((d) => d.category === category);
};

export const getDiscoveriesForIsland = (islandId: string): Omit<Discovery, 'foundAt'>[] => {
  return DISCOVERY_TEMPLATES.filter((d) => d.referenceId === islandId);
};
