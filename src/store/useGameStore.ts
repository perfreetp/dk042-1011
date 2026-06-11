import { create } from 'zustand';
import type {
  GameState,
  ResourceType,
  FacilityType,
  Pet,
  Egg,
  PetType,
  Rarity,
  Order,
  Expedition,
  Discovery,
  LogEntry,
  ResourceReward,
  Equipment,
  AdventureRecord,
  AdventureNode,
} from '../types';
import { STARTER_PETS, PET_TEMPLATES, SKILL_POOL, RARITY_MULTIPLIER } from '../data/pets';
import { getInitialIslandProgress, ISLANDS, getIslandById } from '../data/islands';
import { generateInitialOrders, refreshOrders } from '../data/orders';
import { getUpgradeCost, getFacilityBonus, getMaxFacilityLevel } from '../data/facilities';
import { getRecipeById } from '../data/recipes';
import { createDiscovery, DISCOVERY_TEMPLATES, getDiscoveryById } from '../data/discoveries';
import { getItemById, ITEMS } from '../data/items';
import { MONSTER_TEMPLATES } from '../data/monsters';
import { randomInt, randomChoice, randomPetName, randomId, weightedRandomChoice, clamp, randomBool } from '../utils/random';

const STORAGE_KEY = 'maple-pet-expedition-save-v1';

const createInitialEggs = (): Egg[] => {
  const types: PetType[] = ['fire', 'water', 'earth', 'wind', 'light', 'dark'];
  const rarities: Rarity[] = ['common', 'common', 'common', 'rare', 'rare', 'epic'];
  const eggs: Egg[] = [];

  for (let i = 0; i < 2; i++) {
    const type = randomChoice(types);
    const rarity = weightedRandomChoice<Rarity>([
      { item: 'common', weight: 50 },
      { item: 'rare', weight: 35 },
      { item: 'epic', weight: 12 },
      { item: 'legendary', weight: 3 },
    ]);
    eggs.push({
      id: randomId('egg'),
      type,
      progress: randomInt(0, 30),
      rarity,
      emoji: rarity === 'legendary' ? '🥚✨' : rarity === 'epic' ? '🥚💜' : rarity === 'rare' ? '🥚💙' : '🥚',
    });
  }

  return eggs;
};

const createInitialEquipment = (): Equipment[] => [
  {
    id: 'equip-starter-sword',
    name: '新手木剑',
    emoji: '🗡️',
    type: 'weapon',
    durability: 100,
    maxDurability: 100,
    stats: { attack: 5 },
    rarity: 'common',
  },
  {
    id: 'equip-starter-armor',
    name: '布甲',
    emoji: '👕',
    type: 'armor',
    durability: 100,
    maxDurability: 100,
    stats: { defense: 5 },
    rarity: 'common',
  },
];

const getInitialState = (): GameState => ({
  resources: {
    gold: 500,
    ore: 50,
    herb: 30,
    shell: 20,
    exp: 0,
  },
  facilities: {
    dock: 1,
    warehouse: 1,
    workshop: 1,
    hatchery: 1,
  },
  pets: [...STARTER_PETS],
  eggs: createInitialEggs(),
  team: STARTER_PETS.slice(0, 3).map((p) => p.id),
  expedition: null,
  orders: generateInitialOrders(),
  discoveries: [],
  islandProgress: getInitialIslandProgress(),
  logs: [
    {
      id: randomId('log'),
      timestamp: Date.now(),
      message: '欢迎来到冒险岛！开始你的宠物远征之旅吧~',
      type: 'success',
    },
  ],
  equipment: createInitialEquipment(),
  inventory: {
    'heal-potion': 3,
    'mood-snack': 2,
    'energy-drink': 2,
  },
  lastOrderRefresh: Date.now(),
  adventureRecords: [],
  equippedTools: {},
});

const loadFromStorage = (): GameState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.inventory) {
        parsed.inventory = {
          'heal-potion': 3,
          'mood-snack': 2,
          'energy-drink': 2,
        };
      }
      if (!parsed.adventureRecords) {
        parsed.adventureRecords = [];
      }

      let equippedToolsFixed = false;
      if (!parsed.equippedTools || typeof parsed.equippedTools !== 'object') {
        parsed.equippedTools = {};
        console.warn('[存档加载] equippedTools 不存在或格式错误，已重置为 {}');
        equippedToolsFixed = true;
      } else {
        const validSlots: string[] = ['ore', 'herb', 'shell'];
        const cleanedTools: Record<string, string | undefined> = {};
        let hasInvalidFormat = false;
        for (const slot of validSlots) {
          const val = parsed.equippedTools[slot];
          if (typeof val === 'string' && val.length > 0) {
            cleanedTools[slot] = val;
          } else if (val !== undefined && val !== null) {
            hasInvalidFormat = true;
          }
        }
        const originalKeys = Object.keys(parsed.equippedTools);
        if (originalKeys.length !== Object.keys(cleanedTools).length || hasInvalidFormat) {
          equippedToolsFixed = true;
        }
        parsed.equippedTools = cleanedTools;

        if (equippedToolsFixed) {
          console.warn('[存档加载] equippedTools 格式已清洗修复');
        }
      }

      const state = parsed as GameState;
      return state;
    }
  } catch (e) {
    console.error('Failed to load game state:', e);
  }
  return null;
};

const TOOL_SLOT_MAP: Record<string, 'ore' | 'herb' | 'shell'> = {
  'miner-pickaxe': 'ore',
  'harvest-sickle': 'herb',
  'shell-net': 'shell',
};

interface GameActions {
  addResource: (type: ResourceType, amount: number) => void;
  spendResource: (type: ResourceType, amount: number) => boolean;
  addResources: (rewards: ResourceReward[]) => void;
  canAfford: (costs: Partial<Record<ResourceType, number>>) => boolean;
  spendResources: (costs: Partial<Record<ResourceType, number>>) => boolean;

  upgradeFacility: (facility: FacilityType) => boolean;
  getWarehouseCapacity: () => number;

  hatchEgg: (eggId: string) => void;
  accelerateHatch: (eggId: string, amount: number) => void;
  addEgg: (type?: PetType, rarity?: Rarity) => void;

  feedPet: (petId: string) => boolean;
  restPet: (petId: string) => boolean;
  healPet: (petId: string, amount: number) => void;
  addPetExp: (petId: string, amount: number) => void;

  setTeam: (petIds: string[]) => void;
  addPetToTeam: (petId: string) => boolean;
  removePetFromTeam: (petId: string) => void;

  startExpedition: (islandId: string, useLuckyCharm?: boolean) => boolean;
  updateExpeditionStatus: (status: Expedition['status']) => void;
  updateExpeditionProgress: () => void;
  completeExpedition: (rewards: ResourceReward[], battleWins: number, discoveries: string[]) => void;
  claimExpeditionRewards: () => { success: boolean; recordId?: string };
  cancelExpedition: () => void;

  collectResource: (type: 'ore' | 'herb' | 'shell') => number;
  craftItem: (recipeId: string) => boolean;

  repairEquipment: (equipId: string) => boolean;

  submitOrder: (orderId: string) => boolean;
  refreshOrderList: () => void;

  addLog: (message: string, type?: LogEntry['type'], relatedDiscoveryId?: string, relatedIslandId?: string, relatedAdventureRecordId?: string) => void;
  addDiscovery: (discoveryId: string, adventureRecordId?: string) => boolean;
  rollDiscoveryForIsland: (islandId: string, hasLuckyCharm?: boolean) => string | null;
  getDiscoverySource: (discoveryId: string) => string;

  useItem: (itemId: string, targetPetId?: string) => boolean;
  addItem: (itemId: string, amount: number) => void;
  removeItem: (itemId: string, amount: number) => boolean;

  checkAndUnlockIslands: () => string[];
  resetGame: () => void;
  saveToStorage: () => void;

  addAdventureRecord: (record: AdventureRecord) => void;
  getAdventureRecordById: (id: string) => AdventureRecord | undefined;
  equipTool: (slot: 'ore' | 'herb' | 'shell', itemId: string) => boolean;
  unequipTool: (slot: 'ore' | 'herb' | 'shell') => void;
  getGatheringBonus: (type: 'ore' | 'herb' | 'shell') => number;
  generateAdventureNodesForExpedition: (
    islandId: string,
    teamSnapshot: { id: string; name: string; emoji: string; level: number }[],
    collectedResources: ResourceReward[],
    monsters: { templateId: string; name: string; emoji: string; defeated: boolean }[],
    discoveries: string[],
    usedLuckyCharm: boolean,
    itemDrops?: { itemId: string; itemName: string; itemEmoji: string; amount: number }[]
  ) => AdventureNode[];
  generateAdventureNodesForBattle: (
    difficulty: 'easy' | 'normal' | 'hard',
    teamSnapshot: { id: string; name: string; emoji: string; level: number }[],
    monsters: { templateId: string; name: string; emoji: string; defeated: boolean }[],
    discoveries: string[],
    usedLuckyCharm: boolean,
    won: boolean,
    resources?: ResourceReward[],
    expGained?: number,
    itemDrops?: { itemId: string; itemName: string; itemEmoji: string; amount: number }[]
  ) => AdventureNode[];
  createBattleRecord: (params: {
    islandId?: string;
    difficulty: 'easy' | 'normal' | 'hard';
    teamPetIds: string[];
    teamPetSnapshots: { id: string; name: string; emoji: string; level: number }[];
    monsters: { templateId: string; name: string; emoji: string; defeated: boolean }[];
    discoveries: string[];
    expGained: number;
    resources: ResourceReward[];
    usedLuckyCharm: boolean;
    won: boolean;
    itemDrops?: { itemId: string; amount: number }[];
  }) => string;
}

export type GameStore = GameState & GameActions;

const RESOURCE_NAMES: Record<string, string> = {
  gold: '金币',
  ore: '矿石',
  herb: '草药',
  shell: '贝壳',
  exp: '经验',
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...getInitialState(),

  addResource: (type, amount) => {
    if (amount <= 0) return;
    set((state) => {
      const capacity = getFacilityBonus('warehouse', state.facilities.warehouse);
      const current = state.resources[type];
      const newAmount = type === 'gold' || type === 'exp'
        ? current + amount
        : Math.min(current + amount, capacity);
      return {
        resources: {
          ...state.resources,
          [type]: newAmount,
        },
      };
    });
  },

  spendResource: (type, amount) => {
    const state = get();
    if (state.resources[type] < amount) return false;
    set((s) => ({
      resources: {
        ...s.resources,
        [type]: s.resources[type] - amount,
      },
    }));
    return true;
  },

  addResources: (rewards) => {
    set((state) => {
      const newResources = { ...state.resources };
      const capacity = getFacilityBonus('warehouse', state.facilities.warehouse);
      for (const reward of rewards) {
        const current = newResources[reward.type];
        if (reward.type === 'gold' || reward.type === 'exp') {
          newResources[reward.type] = current + reward.amount;
        } else {
          newResources[reward.type] = Math.min(current + reward.amount, capacity);
        }
      }
      return { resources: newResources };
    });
  },

  canAfford: (costs) => {
    const state = get();
    for (const [type, amount] of Object.entries(costs)) {
      if (amount && state.resources[type as ResourceType] < amount) {
        return false;
      }
    }
    return true;
  },

  spendResources: (costs) => {
    const state = get();
    for (const [type, amount] of Object.entries(costs)) {
      if (amount && state.resources[type as ResourceType] < amount) {
        return false;
      }
    }
    set((s) => {
      const newResources = { ...s.resources };
      for (const [type, amount] of Object.entries(costs)) {
        if (amount) {
          newResources[type as ResourceType] -= amount;
        }
      }
      return { resources: newResources };
    });
    return true;
  },

  upgradeFacility: (facility) => {
    const state = get();
    const currentLevel = state.facilities[facility];
    const maxLevel = getMaxFacilityLevel(facility);

    if (currentLevel >= maxLevel) {
      get().addLog(`${facility} 已达到最高等级！`, 'warning');
      return false;
    }

    const costs = getUpgradeCost(facility, currentLevel);
    if (!costs) return false;

    if (!get().canAfford(costs)) {
      get().addLog('资源不足，无法升级设施', 'warning');
      return false;
    }

    get().spendResources(costs);

    set((s) => ({
      facilities: {
        ...s.facilities,
        [facility]: currentLevel + 1,
      },
    }));

    get().addLog(`${facility} 升级至 Lv.${currentLevel + 1}！`, 'success');
    return true;
  },

  getWarehouseCapacity: () => {
    const state = get();
    return getFacilityBonus('warehouse', state.facilities.warehouse);
  },

  hatchEgg: (eggId) => {
    const state = get();
    const egg = state.eggs.find((e) => e.id === eggId);
    if (!egg || egg.progress < 100) {
      get().addLog('蛋还未孵化完成！', 'warning');
      return;
    }

    const template = PET_TEMPLATES[egg.type];
    const rarityMult = RARITY_MULTIPLIER[egg.rarity];
    const baseHp = template.baseStats.maxHp || 100;
    const baseAtk = template.baseStats.attack || 20;
    const baseDef = template.baseStats.defense || 10;
    const baseSpd = template.baseStats.speed || 15;

    const availableSkills = SKILL_POOL[egg.type];
    const selectedSkills = [...availableSkills]
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
      .map((s) => ({ ...s, id: `${s.id}-${randomId()}` }));

    const newPet: Pet = {
      id: randomId('pet'),
      name: randomPetName(),
      type: egg.type,
      emoji: template.emoji,
      level: 1,
      exp: 0,
      expToNext: 100,
      hp: Math.floor(baseHp * rarityMult),
      maxHp: Math.floor(baseHp * rarityMult),
      attack: Math.floor(baseAtk * rarityMult),
      defense: Math.floor(baseDef * rarityMult),
      speed: Math.floor(baseSpd * rarityMult),
      mood: 100,
      stamina: 100,
      skills: selectedSkills,
      synergyBonds: [],
      rarity: egg.rarity,
    };

    set((s) => ({
      eggs: s.eggs.filter((e) => e.id !== eggId),
      pets: [...s.pets, newPet],
    }));

    get().addLog(`🎉 孵化成功！获得了 ${newPet.emoji}${newPet.name}！`, 'success');

    const petDiscovery = DISCOVERY_TEMPLATES.find(
      (d) => d.category === 'pet' && d.rarity === egg.rarity
    );
    if (petDiscovery) {
      get().addDiscovery(petDiscovery.id);
    }
  },

  accelerateHatch: (eggId, amount) => {
    set((state) => ({
      eggs: state.eggs.map((e) =>
        e.id === eggId
          ? { ...e, progress: Math.min(100, e.progress + amount) }
          : e
      ),
    }));
  },

  addEgg: (type, rarity) => {
    const petType: PetType = type || randomChoice(['fire', 'water', 'earth', 'wind', 'light', 'dark']);
    const eggRarity: Rarity = rarity || weightedRandomChoice<Rarity>([
      { item: 'common', weight: 50 },
      { item: 'rare', weight: 35 },
      { item: 'epic', weight: 12 },
      { item: 'legendary', weight: 3 },
    ]);

    const newEgg: Egg = {
      id: randomId('egg'),
      type: petType,
      progress: 0,
      rarity: eggRarity,
      emoji: eggRarity === 'legendary' ? '🥚✨' : eggRarity === 'epic' ? '🥚💜' : eggRarity === 'rare' ? '🥚💙' : '🥚',
    };

    set((s) => ({ eggs: [...s.eggs, newEgg] }));
    get().addLog(`获得了一颗 ${newEgg.emoji} 新宠物蛋！`, 'success');
  },

  feedPet: (petId) => {
    if (!get().spendResource('herb', 5)) {
      get().addLog('草药不足，无法喂食！', 'warning');
      return false;
    }

    set((state) => ({
      pets: state.pets.map((p) =>
        p.id === petId
          ? {
              ...p,
              mood: Math.min(100, p.mood + 25),
              stamina: Math.min(100, p.stamina + 15),
            }
          : p
      ),
    }));

    const pet = get().pets.find((p) => p.id === petId);
    if (pet) {
      get().addLog(`${pet.emoji}${pet.name} 吃得很开心！心情和体力恢复了~`, 'success');
    }
    return true;
  },

  restPet: (petId) => {
    set((state) => ({
      pets: state.pets.map((p) =>
        p.id === petId
          ? {
              ...p,
              hp: Math.min(p.maxHp, p.hp + Math.floor(p.maxHp * 0.3)),
              stamina: Math.min(100, p.stamina + 40),
            }
          : p
      ),
    }));

    const pet = get().pets.find((p) => p.id === petId);
    if (pet) {
      get().addLog(`${pet.emoji}${pet.name} 休息了一会儿，恢复了体力！`, 'info');
    }
    return true;
  },

  healPet: (petId, amount) => {
    set((state) => ({
      pets: state.pets.map((p) =>
        p.id === petId ? { ...p, hp: Math.min(p.maxHp, p.hp + amount) } : p
      ),
    }));
  },

  addPetExp: (petId, amount) => {
    set((state) => {
      const newPets = state.pets.map((p) => {
        if (p.id !== petId) return p;

        let newExp = p.exp + amount;
        let newLevel = p.level;
        let expToNext = p.expToNext;
        let maxHp = p.maxHp;
        let attack = p.attack;
        let defense = p.defense;
        let speed = p.speed;

        while (newExp >= expToNext) {
          newExp -= expToNext;
          newLevel++;
          expToNext = Math.floor(expToNext * 1.5);
          maxHp = Math.floor(maxHp * 1.1);
          attack = Math.floor(attack * 1.08);
          defense = Math.floor(defense * 1.06);
          speed = Math.floor(speed * 1.04);
        }

        return {
          ...p,
          exp: newExp,
          level: newLevel,
          expToNext,
          maxHp,
          hp: p.hp > maxHp ? maxHp : p.hp,
          attack,
          defense,
          speed,
        };
      });

      return { pets: newPets };
    });
  },

  setTeam: (petIds) => {
    if (petIds.length > 3) {
      get().addLog('队伍最多只能有3只宠物！', 'warning');
      return;
    }
    set({ team: petIds.slice(0, 3) });
  },

  addPetToTeam: (petId) => {
    const state = get();
    if (state.team.length >= 3) {
      get().addLog('队伍已满！', 'warning');
      return false;
    }
    if (state.team.includes(petId)) {
      get().addLog('该宠物已在队伍中！', 'warning');
      return false;
    }
    set((s) => ({ team: [...s.team, petId] }));
    return true;
  },

  removePetFromTeam: (petId) => {
    set((s) => ({ team: s.team.filter((id) => id !== petId) }));
  },

  startExpedition: (islandId, useLuckyCharm) => {
    const state = get();
    if (state.expedition) {
      get().addLog('已有远征进行中！', 'warning');
      return false;
    }
    if (state.team.length === 0) {
      get().addLog('请先编组远征队伍！', 'warning');
      return false;
    }

    const island = ISLANDS.find((i) => i.id === islandId);
    if (!island) return false;
    if (!island.unlocked && island.id !== 'island-home') {
      const progress = state.islandProgress[island.unlockRequirement?.islandId || ''] || 0;
      const required = island.unlockRequirement?.progress || 0;
      if (progress < required) {
        get().addLog(`该岛屿尚未解锁，需要先完成前置探索！`, 'warning');
        return false;
      }
    }

    const travelCost = 20 + island.level * 10;
    if (!get().spendResource('gold', travelCost)) {
      get().addLog(`金币不足！远征需要 ${travelCost} 金币`, 'warning');
      return false;
    }

    let usedLuckyCharm = false;
    if (useLuckyCharm === true) {
      const charmCount = state.inventory['lucky-charm'] || 0;
      if (charmCount >= 1) {
        const removeOk = get().removeItem('lucky-charm', 1);
        if (removeOk) {
          usedLuckyCharm = true;
          get().addLog('🍀 消耗了1个幸运符，本次远征发现概率大幅提升！', 'success');
        } else {
          get().addLog('⚠️ 勾选了幸运符但消耗失败，未使用幸运符', 'warning');
          usedLuckyCharm = false;
        }
      } else {
        get().addLog('⚠️ 勾选了幸运符但背包中没有！未使用幸运符，正常开始远征', 'warning');
        usedLuckyCharm = false;
      }
    } else {
      get().addLog('未使用幸运符', 'info');
    }

    const lockedTeamPetIds = [...state.team];
    const lockedTeamSnapshots = state.team
      .map((petId) => state.pets.find((p) => p.id === petId))
      .filter((p): p is Pet => !!p)
      .map((p) => ({ id: p.id, name: p.name, emoji: p.emoji, level: p.level }));

    const durationSeconds = 30 + island.level * 15;

    const expedition: Expedition = {
      islandId,
      startTime: Date.now(),
      durationSeconds,
      status: 'traveling',
      rewardsReady: false,
      battleWins: 0,
      collected: [],
      logs: [`远征队出发前往 ${island.emoji}${island.name}`],
      discoveredItems: [],
      encounteredMonsters: [],
      battleLog: [],
      lockedTeamPetIds,
      lockedTeamSnapshots,
      usedLuckyCharm,
      pendingItems: [],
    };

    set({ expedition });
    get().addLog(`🚢 远征队出发前往 ${island.emoji}${island.name}！消耗 ${travelCost} 金币`, 'info', undefined, islandId);
    return true;
  },

  updateExpeditionStatus: (status) => {
    set((state) => {
      if (!state.expedition) return state;
      return {
        expedition: {
          ...state.expedition,
          status,
        },
      };
    });
  },

  updateExpeditionProgress: () => {
    const state = get();
    if (!state.expedition || state.expedition.rewardsReady) return;

    const now = Date.now();
    const elapsed = (now - state.expedition.startTime) / 1000;

    if (elapsed >= state.expedition.durationSeconds) {
      const island = getIslandById(state.expedition.islandId);
      if (!island) return;

      const collected: ResourceReward[] = [];
      for (const specialty of island.specialties) {
        const amount = randomInt(5, 15) + island.level * 3;
        collected.push({ type: specialty, amount });
      }
      const goldAmount = randomInt(10, 30) + island.level * 5;
      collected.push({ type: 'gold', amount: goldAmount });
      const expAmount = randomInt(20, 50) + island.level * 10;
      collected.push({ type: 'exp', amount: expAmount });

      const encounteredMonsters: string[] = [];
      let battleWins = 0;
      const battleLog: string[] = [];
      if (island.monsters.length > 0) {
        const numBattles = randomInt(1, 3);
        for (let i = 0; i < numBattles; i++) {
          const monsterId = randomChoice(island.monsters);
          encounteredMonsters.push(monsterId);
          battleWins++;
          battleLog.push(`击败了 ${monsterId}`);
        }
      }

      const discoveredItems: string[] = [];
      const discoveryId = get().rollDiscoveryForIsland(island.id, state.expedition.usedLuckyCharm);
      if (discoveryId) {
        discoveredItems.push(discoveryId);
      }

      const pendingItems: { itemId: string; amount: number }[] = [];
      if (island.toolDrops && island.toolDrops.length > 0) {
        for (const drop of island.toolDrops) {
          const roll = Math.random();
          if (roll < drop.probability) {
            pendingItems.push({ itemId: drop.itemId, amount: 1 });
          }
        }
      }

      const logs = [...state.expedition.logs];
      logs.push(`到达 ${island.emoji}${island.name}`);
      if (collected.length > 0) {
        logs.push(`采集了 ${collected.map(r => `${r.amount}${r.type}`).join('、')}`);
      }
      if (encounteredMonsters.length > 0) {
        logs.push(`遭遇了 ${encounteredMonsters.length} 只怪物`);
      }
      if (discoveredItems.length > 0) {
        logs.push('有了新的发现！');
      }
      if (pendingItems.length > 0) {
        logs.push(`找到了 ${pendingItems.length} 件工具！`);
      }
      logs.push('远征完成，等待领取奖励');

      set((s) => ({
        expedition: {
          ...s.expedition!,
          status: 'completed',
          rewardsReady: true,
          battleWins,
          collected,
          discoveredItems,
          encounteredMonsters,
          battleLog,
          pendingItems,
          logs,
        },
      }));
    }
  },

  completeExpedition: (rewards, battleWins, discoveries) => {
    const state = get();
    if (!state.expedition) return;

    const islandId = state.expedition.islandId;
    const lockedTeamPetIds = state.expedition.lockedTeamPetIds;

    get().addResources(rewards);

    const totalExp = rewards.find((r) => r.type === 'exp')?.amount || 0;
    if (totalExp > 0 && lockedTeamPetIds.length > 0) {
      const expPerPet = Math.floor(totalExp / lockedTeamPetIds.length);
      for (const petId of lockedTeamPetIds) {
        get().addPetExp(petId, expPerPet);
      }
    }

    for (const discoveryId of discoveries) {
      get().addDiscovery(discoveryId);
    }

    const currentProgress = state.islandProgress[islandId] || 0;
    const progressGain = Math.min(100 - currentProgress, 15 + battleWins * 5);

    set((s) => ({
      expedition: null,
      islandProgress: {
        ...s.islandProgress,
        [islandId]: currentProgress + progressGain,
      },
    }));

    const unlocked = get().checkAndUnlockIslands();
    if (unlocked.length > 0) {
      unlocked.forEach((id) => {
        const isl = ISLANDS.find((i) => i.id === id);
        if (isl) {
          get().addLog(`🗺️ 新岛屿解锁：${isl.emoji}${isl.name}！`, 'success');
        }
      });
    }

    get().addLog(
      `🏆 远征完成！获得奖励，探索度 +${progressGain}%`,
      'success'
    );
  },

  claimExpeditionRewards: () => {
    const state = get();
    if (!state.expedition || !state.expedition.rewardsReady) {
      get().addLog('远征奖励尚未准备好！', 'warning');
      return { success: false };
    }

    const islandId = state.expedition.islandId;
    const island = getIslandById(islandId);
    if (!island) return { success: false };

    const {
      collected,
      battleWins,
      discoveredItems,
      encounteredMonsters,
      lockedTeamPetIds,
      lockedTeamSnapshots,
      usedLuckyCharm,
      pendingItems,
    } = state.expedition;

    get().addResources(collected);

    const totalExp = collected.find((r) => r.type === 'exp')?.amount || 0;
    if (totalExp > 0 && lockedTeamPetIds.length > 0) {
      const expPerPet = Math.floor(totalExp / lockedTeamPetIds.length);
      for (const petId of lockedTeamPetIds) {
        get().addPetExp(petId, expPerPet);
      }
    }

    const recordId = randomId('adv');
    for (const discoveryId of discoveredItems) {
      get().addDiscovery(discoveryId, recordId);
    }

    const currentProgress = state.islandProgress[islandId] || 0;
    const progressGain = Math.min(100 - currentProgress, 15 + battleWins * 5);

    for (const petId of lockedTeamPetIds) {
      set((s) => ({
        pets: s.pets.map((p) =>
          p.id === petId
            ? {
                ...p,
                stamina: Math.max(0, p.stamina - 20 - island.level * 2),
                mood: Math.max(0, p.mood - 10 - island.level),
              }
            : p
        ),
      }));
    }

    const monsterSnapshots = encounteredMonsters.map((mId) => {
      const tpl = MONSTER_TEMPLATES.find((m) => m.id === mId);
      return { templateId: mId, name: tpl?.name || mId, emoji: tpl?.emoji || '👹', defeated: true };
    });

    const itemDrops: { itemId: string; itemName: string; itemEmoji: string; amount: number }[] = [];
    if (pendingItems && pendingItems.length > 0) {
      for (const pi of pendingItems) {
        const item = getItemById(pi.itemId);
        if (item) {
          itemDrops.push({
            itemId: pi.itemId,
            itemName: item.name,
            itemEmoji: item.emoji,
            amount: pi.amount,
          });
          get().addItem(pi.itemId, pi.amount);
        }
      }
    }

    const collectedSummary = collected
      .filter((r) => r.type !== 'exp')
      .map((r) => `${r.amount}${RESOURCE_NAMES[r.type] || r.type}`)
      .join('、');

    const teamNames = lockedTeamSnapshots.map((p) => `${p.emoji}${p.name}`).join('、');
    const monsterPart = encounteredMonsters.length > 0 ? `，遭遇并击败了${encounteredMonsters.length}只怪物` : '';
    const discoveryPart = discoveredItems.length > 0 ? '，还有了珍贵的发现！' : '';
    const itemDropPart = itemDrops.length > 0 ? `，获得了${itemDrops.map(i => `${i.itemEmoji}${i.itemName}`).join('、')}` : '';
    const luckyPart = usedLuckyCharm ? '（消耗了1个幸运符🍀）' : '（未使用幸运符）';
    const summary = `${teamNames}前往${island.emoji}${island.name}远征，采集了${collectedSummary}，获得了${totalExp}点经验${monsterPart}${discoveryPart}${itemDropPart}${luckyPart}`;

    const nodes = get().generateAdventureNodesForExpedition(
      islandId,
      lockedTeamSnapshots,
      collected,
      monsterSnapshots,
      discoveredItems,
      usedLuckyCharm,
      itemDrops
    );

    const itemsGained = itemDrops.map(i => ({ itemId: i.itemId, amount: i.amount }));

    const record: AdventureRecord = {
      id: recordId,
      type: 'expedition',
      startTime: state.expedition.startTime,
      endTime: Date.now(),
      islandId,
      islandName: island.name,
      islandEmoji: island.emoji,
      teamPetIds: lockedTeamPetIds,
      teamPetSnapshots: lockedTeamSnapshots,
      collectedResources: collected,
      encounteredMonsters: monsterSnapshots,
      discoveries: discoveredItems,
      expGained: totalExp,
      usedLuckyCharm,
      summary,
      nodes,
      itemsGained,
    };

    set((s) => ({
      expedition: null,
      islandProgress: {
        ...s.islandProgress,
        [islandId]: currentProgress + progressGain,
      },
      adventureRecords: [record, ...s.adventureRecords],
    }));

    const unlocked = get().checkAndUnlockIslands();
    if (unlocked.length > 0) {
      unlocked.forEach((id) => {
        const isl = ISLANDS.find((i) => i.id === id);
        if (isl) {
          get().addLog(`🗺️ 新岛屿解锁：${isl.emoji}${isl.name}！`, 'success');
        }
      });
    }

    if (usedLuckyCharm) {
      get().addLog('🍀 消耗了1个幸运符', 'info', undefined, islandId, recordId);
    } else {
      get().addLog('未使用幸运符', 'info', undefined, islandId, recordId);
    }

    get().addLog(
      `🏆 远征奖励已领取！${collectedSummary}，探索度 +${progressGain}%`,
      'success',
      discoveredItems[0],
      islandId,
      recordId
    );

    if (itemDrops.length > 0) {
      for (const drop of itemDrops) {
        get().addLog(
          `🔧 远征中找到了 ${drop.itemEmoji}${drop.itemName}！`,
          'success',
          undefined,
          islandId,
          recordId
        );
      }
    }

    if (encounteredMonsters.length > 0) {
      get().addLog(
        `⚔️ 本次远征共击败 ${battleWins} 只怪物`,
        'info',
        undefined,
        islandId,
        recordId
      );
    }

    if (discoveredItems.length > 0) {
      for (const dId of discoveredItems) {
        get().addLog(
          `✨ 发现了稀有物品！`,
          'success',
          dId,
          islandId,
          recordId
        );
      }
    }

    return { success: true, recordId };
  },

  cancelExpedition: () => {
    set({ expedition: null });
    get().addLog('远征已取消', 'warning');
  },

  collectResource: (type) => {
    const state = get();
    const workshopLevel = state.facilities.workshop;
    const baseAmount = randomInt(2, 6);
    const workshopBonus = Math.floor(workshopLevel * 0.5);
    const toolBonus = get().getGatheringBonus(type);
    const amount = baseAmount + workshopBonus + toolBonus;

    get().addResource(type, amount);

    const typeLabel = type === 'ore' ? '矿石⛏️' : type === 'herb' ? '草药🌿' : '贝壳🐚';
    const parts = [`基础${baseAmount}`];
    if (workshopBonus > 0) parts.push(`工坊+${workshopBonus}`);
    if (toolBonus > 0) parts.push(`工具+${toolBonus}`);
    get().addLog(`采集到 ${amount} 个${typeLabel}（${parts.join('，')}）`, 'success');
    return amount;
  },

  craftItem: (recipeId) => {
    const recipe = getRecipeById(recipeId);
    if (!recipe) return false;

    const state = get();
    if (state.facilities.workshop < recipe.requiredWorkshopLevel) {
      get().addLog(`工坊等级不足！需要 Lv.${recipe.requiredWorkshopLevel}`, 'warning');
      return false;
    }

    const costs: Partial<Record<ResourceType, number>> = {};
    for (const mat of recipe.materials) {
      costs[mat.type] = mat.amount;
    }

    if (!get().canAfford(costs)) {
      get().addLog('材料不足！', 'warning');
      return false;
    }

    const spendOk = get().spendResources(costs);
    if (!spendOk) {
      get().addLog('材料扣除失败，已回滚', 'warning');
      return false;
    }

    try {
      if ('type' in recipe.output && recipe.output.type) {
        get().addResource(recipe.output.type as ResourceType, recipe.output.amount);
        get().addLog(
          `制作了 ${recipe.emoji}${recipe.name}！获得 ${recipe.output.amount} ${recipe.output.type}`,
          'success'
        );
      } else if ('itemId' in recipe.output && recipe.output.itemId) {
        get().addItem(recipe.output.itemId, recipe.output.amount);
        const item = getItemById(recipe.output.itemId);
        if (item && item.type === 'tool') {
          get().addLog(
            `制作了工具 ${recipe.emoji}${recipe.name}！获得 ${recipe.output.amount} 个【已加入背包】`,
            'success'
          );
        } else {
          get().addLog(
            `制作了 ${recipe.emoji}${recipe.name}！获得 ${recipe.output.amount} 个`,
            'success'
          );
        }
      }
      return true;
    } catch (e) {
      console.error('[craftItem] 制作过程出错，尝试回滚材料:', e);
      for (const mat of recipe.materials) {
        get().addResource(mat.type, mat.amount);
      }
      get().addLog('制作失败，材料已回滚', 'danger');
      return false;
    }
  },

  repairEquipment: (equipId) => {
    const state = get();
    const equip = state.equipment.find((e) => e.id === equipId);
    if (!equip) return false;

    if (equip.durability >= equip.maxDurability) {
      get().addLog('装备无需修复！', 'info');
      return false;
    }

    const damage = equip.maxDurability - equip.durability;
    const cost = Math.ceil(damage * 0.5);

    if (!get().spendResource('gold', cost)) {
      get().addLog(`金币不足！修复需要 ${cost} 金币`, 'warning');
      return false;
    }

    set((s) => ({
      equipment: s.equipment.map((e) =>
        e.id === equipId ? { ...e, durability: e.maxDurability } : e
      ),
    }));

    get().addLog(`${equip.emoji}${equip.name} 修复完成！消耗 ${cost} 金币`, 'success');
    return true;
  },

  submitOrder: (orderId) => {
    const state = get();
    const order = state.orders.find((o) => o.id === orderId);
    if (!order || order.completed) return false;

    const costs: Partial<Record<ResourceType, number>> = {};
    for (const req of order.requirements) {
      costs[req.type] = req.amount;
    }

    if (!get().canAfford(costs)) {
      get().addLog('材料不足，无法完成订单！', 'warning');
      return false;
    }

    get().spendResources(costs);

    const rewardResources: ResourceReward[] = order.rewards.map((r) => ({
      type: r.type,
      amount: r.amount,
    }));
    get().addResources(rewardResources);

    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId ? { ...o, completed: true } : o
      ),
    }));

    get().addLog(
      `📜 ${order.islanderEmoji}${order.islander}的订单完成！获得奖励！`,
      'success'
    );
    return true;
  },

  refreshOrderList: () => {
    const state = get();
    const now = Date.now();
    const refreshInterval = 30 * 60 * 1000;

    if (now - state.lastOrderRefresh < refreshInterval) {
      const remaining = Math.ceil((refreshInterval - (now - state.lastOrderRefresh)) / 60000);
      get().addLog(`订单冷却中，还需等待 ${remaining} 分钟`, 'warning');
      return;
    }

    if (!get().spendResource('gold', 50)) {
      get().addLog('金币不足！刷新订单需要 50 金币', 'warning');
      return;
    }

    set({
      orders: refreshOrders(3, 5),
      lastOrderRefresh: now,
    });
    get().addLog('📋 订单列表已刷新！', 'info');
  },

  addLog: (message, type = 'info', relatedDiscoveryId, relatedIslandId, relatedAdventureRecordId) => {
    const entry: LogEntry = {
      id: randomId('log'),
      timestamp: Date.now(),
      message,
      type,
      relatedDiscoveryId,
      relatedIslandId,
      relatedAdventureRecordId,
    };
    set((state) => ({
      logs: [entry, ...state.logs].slice(0, 100),
    }));
  },

  addDiscovery: (discoveryId, adventureRecordId) => {
    const state = get();
    if (state.discoveries.some((d) => d.id === discoveryId)) {
      return false;
    }

    const discovery = createDiscovery(discoveryId);
    if (!discovery) return false;

    const finalDiscovery = adventureRecordId
      ? { ...discovery, adventureRecordId }
      : discovery;

    set((s) => ({
      discoveries: [...s.discoveries, finalDiscovery],
    }));

    get().addLog(
      `📖 新发现！${discovery.emoji}${discovery.name} [${discovery.rarity}]`,
      'success',
      discoveryId
    );
    return true;
  },

  rollDiscoveryForIsland: (islandId, hasLuckyCharm) => {
    const island = getIslandById(islandId);
    if (!island) return null;

    const roll = Math.random() * 100;
    let rarity: Rarity | null = null;

    if (hasLuckyCharm) {
      if (roll < 5) {
        rarity = 'legendary';
      } else if (roll < 20) {
        rarity = 'epic';
      } else if (roll < 40) {
        rarity = 'rare';
      } else if (roll < 80) {
        rarity = 'common';
      }
    } else {
      if (roll < 1) {
        rarity = 'legendary';
      } else if (roll < 6) {
        rarity = 'epic';
      } else if (roll < 21) {
        rarity = 'rare';
      } else if (roll < 51) {
        rarity = 'common';
      }
    }

    if (!rarity) return null;

    const relatedDiscoveries = DISCOVERY_TEMPLATES.filter((d) => {
      if (d.rarity !== rarity) return false;
      if (island.rareDrops.includes(d.id)) return true;
      if (d.referenceId === island.id) return true;
      if (d.category === 'lore') return true;
      return false;
    });

    if (relatedDiscoveries.length === 0) {
      const fallbackDiscoveries = DISCOVERY_TEMPLATES.filter((d) => d.rarity === rarity);
      if (fallbackDiscoveries.length === 0) return null;
      return randomChoice(fallbackDiscoveries).id;
    }

    return randomChoice(relatedDiscoveries).id;
  },

  getDiscoverySource: (discoveryId) => {
    const discovery = getDiscoveryById(discoveryId);
    if (!discovery) return '未知来源';

    if (discovery.referenceId) {
      const island = getIslandById(discovery.referenceId);
      if (island) {
        return `${island.emoji}${island.name} 特产`;
      }
    }

    switch (discovery.category) {
      case 'pet':
        return '🐾 宠物探索';
      case 'monster':
        return '⚔️ 战斗掉落';
      case 'treasure':
        return '💎 宝藏探索';
      case 'lore':
        return '📚 传说故事';
      case 'island':
        return '🏝️ 岛屿探索';
      default:
        return '❓ 未知来源';
    }
  },

  useItem: (itemId, targetPetId) => {
    const state = get();
    const item = getItemById(itemId);

    if (!item) {
      get().addLog('道具不存在！', 'warning');
      return false;
    }

    if (!item.effect) {
      get().addLog(item.emoji + item.name + ' 无法使用！', 'warning');
      return false;
    }

    const currentAmount = state.inventory[itemId] || 0;
    if (currentAmount <= 0) {
      get().addLog(item.emoji + item.name + ' 数量不足！', 'warning');
      return false;
    }

    const effectType = item.effect.type;
    const effectValue = item.effect.value;

    switch (effectType) {
      case 'heal': {
        if (!targetPetId) {
          get().addLog('请选择要使用道具的宠物！', 'warning');
          return false;
        }
        const pet = state.pets.find((p) => p.id === targetPetId);
        if (!pet) {
          get().addLog('宠物不存在！', 'warning');
          return false;
        }
        if (pet.hp >= pet.maxHp) {
          get().addLog(pet.emoji + pet.name + ' 生命值已满！', 'info');
          return false;
        }
        const healAmount = effectValue >= 999 ? pet.maxHp : effectValue;
        get().healPet(targetPetId, healAmount);
        const healMsg = effectValue >= 999
          ? item.emoji + ' 对 ' + pet.emoji + pet.name + ' 使用了 ' + item.name + '，生命值完全恢复！'
          : item.emoji + ' 对 ' + pet.emoji + pet.name + ' 使用了 ' + item.name + '，恢复了 ' + effectValue + ' 点生命！';
        get().addLog(healMsg, 'success');
        break;
      }
      case 'hatchBoost': {
        if (!targetPetId) {
          get().addLog('请选择要加速的蛋！', 'warning');
          return false;
        }
        const egg = state.eggs.find((e) => e.id === targetPetId);
        if (!egg) {
          get().addLog('蛋不存在！', 'warning');
          return false;
        }
        if (egg.progress >= 100) {
          get().addLog('这颗蛋已经孵化完成了！', 'info');
          return false;
        }
        get().accelerateHatch(targetPetId, effectValue);
        get().addLog(
          item.emoji + ' 使用了 ' + item.name + '，孵化进度 +' + effectValue + '%！',
          'success'
        );
        break;
      }
      case 'moodBoost': {
        if (!targetPetId) {
          get().addLog('请选择要使用道具的宠物！', 'warning');
          return false;
        }
        const pet = state.pets.find((p) => p.id === targetPetId);
        if (!pet) {
          get().addLog('宠物不存在！', 'warning');
          return false;
        }
        if (pet.mood >= 100) {
          get().addLog(pet.emoji + pet.name + ' 心情值已满！', 'info');
          return false;
        }
        const boostAmount = effectValue >= 999 ? 100 : effectValue;
        set((s) => ({
          pets: s.pets.map((p) =>
            p.id === targetPetId
              ? { ...p, mood: Math.min(100, p.mood + boostAmount) }
              : p
          ),
        }));
        get().addLog(
          item.emoji + ' ' + pet.emoji + pet.name + ' 吃了 ' + item.name + '，心情变好了！',
          'success'
        );
        break;
      }
      case 'staminaBoost': {
        if (!targetPetId) {
          get().addLog('请选择要使用道具的宠物！', 'warning');
          return false;
        }
        const pet = state.pets.find((p) => p.id === targetPetId);
        if (!pet) {
          get().addLog('宠物不存在！', 'warning');
          return false;
        }
        if (pet.stamina >= 100) {
          get().addLog(pet.emoji + pet.name + ' 体力值已满！', 'info');
          return false;
        }
        const boostAmount = effectValue >= 999 ? 100 : effectValue;
        set((s) => ({
          pets: s.pets.map((p) =>
            p.id === targetPetId
              ? { ...p, stamina: Math.min(100, p.stamina + boostAmount) }
              : p
          ),
        }));
        get().addLog(
          item.emoji + ' ' + pet.emoji + pet.name + ' 喝了 ' + item.name + '，体力恢复了！',
          'success'
        );
        break;
      }
      default:
        get().addLog('未知的道具类型！', 'warning');
        return false;
    }

    get().removeItem(itemId, 1);
    return true;
  },

  addItem: (itemId, amount) => {
    if (amount <= 0) return;
    const item = getItemById(itemId);
    if (!item) return;

    set((state) => ({
      inventory: {
        ...state.inventory,
        [itemId]: (state.inventory[itemId] || 0) + amount,
      },
    }));

    get().addLog('获得了 ' + item.emoji + item.name + ' x' + amount, 'success');
  },

  removeItem: (itemId, amount) => {
    const state = get();
    const current = state.inventory[itemId] || 0;

    if (current < amount) {
      return false;
    }

    set((s) => ({
      inventory: {
        ...s.inventory,
        [itemId]: current - amount,
      },
    }));

    return true;
  },

  checkAndUnlockIslands: () => {
    const state = get();
    const unlocked: string[] = [];

    for (const island of ISLANDS) {
      if (island.unlocked) continue;
      if (!island.unlockRequirement) continue;

      const progress = state.islandProgress[island.unlockRequirement.islandId] || 0;
      if (progress >= island.unlockRequirement.progress) {
        unlocked.push(island.id);
      }
    }

    return unlocked;
  },

  resetGame: () => {
    localStorage.removeItem(STORAGE_KEY);
    set(getInitialState());
    get().addLog('游戏已重置！', 'warning');
  },

  saveToStorage: () => {
    try {
      const state = get();
      const {
        resources,
        facilities,
        pets,
        eggs,
        team,
        expedition,
        orders,
        discoveries,
        islandProgress,
        logs,
        equipment,
        inventory,
        lastOrderRefresh,
        adventureRecords,
        equippedTools,
      } = state;

      const saveData = {
        resources,
        facilities,
        pets,
        eggs,
        team,
        expedition,
        orders,
        discoveries,
        islandProgress,
        logs,
        equipment,
        inventory,
        lastOrderRefresh,
        adventureRecords,
        equippedTools,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    } catch (e) {
      console.error('Failed to save game state:', e);
    }
  },

  addAdventureRecord: (record) => {
    set((state) => ({
      adventureRecords: [record, ...state.adventureRecords],
    }));
  },

  getAdventureRecordById: (id) => {
    return get().adventureRecords.find((r) => r.id === id);
  },

  equipTool: (slot, itemId) => {
    const state = get();
    const item = getItemById(itemId);
    if (!item) {
      get().addLog('装备失败：物品不存在', 'warning');
      return false;
    }

    const expectedSlot = TOOL_SLOT_MAP[itemId];
    if (expectedSlot !== slot) {
      get().addLog('装备失败：物品与槽位不匹配', 'warning');
      return false;
    }

    const currentCount = state.inventory[itemId] || 0;
    if (currentCount <= 0) {
      get().addLog('装备失败：背包中没有该物品', 'warning');
      return false;
    }

    const currentEquipped = state.equippedTools[slot];
    if (currentEquipped) {
      get().addItem(currentEquipped, 1);
    }

    const removeOk = get().removeItem(itemId, 1);
    if (!removeOk) {
      get().addLog('装备失败：物品扣除失败', 'warning');
      return false;
    }

    set((s) => ({
      equippedTools: {
        ...s.equippedTools,
        [slot]: itemId,
      },
    }));

    get().addLog(`装备了 ${item.emoji}${item.name} 到${slot === 'ore' ? '矿石' : slot === 'herb' ? '草药' : '贝壳'}采集位`, 'success');
    return true;
  },

  unequipTool: (slot) => {
    const state = get();
    const equippedItemId = state.equippedTools[slot];
    if (!equippedItemId) {
      return;
    }

    const item = getItemById(equippedItemId);
    if (item) {
      get().addItem(equippedItemId, 1);
    } else {
      set((s) => ({
        inventory: {
          ...s.inventory,
          [equippedItemId]: (s.inventory[equippedItemId] || 0) + 1,
        },
      }));
    }

    set((s) => ({
      equippedTools: {
        ...s.equippedTools,
        [slot]: undefined,
      },
    }));

    const slotName = slot === 'ore' ? '矿石' : slot === 'herb' ? '草药' : '贝壳';
    const itemName = item ? `${item.emoji}${item.name}` : equippedItemId;
    get().addLog(`卸下了 ${itemName}（${slotName}采集位）`, 'info');
  },

  getGatheringBonus: (type) => {
    const state = get();
    const equippedItemId = state.equippedTools[type];
    if (!equippedItemId) return 0;

    const item = getItemById(equippedItemId);
    if (!item || !item.effect || item.effect.type !== 'gatheringBonus') return 0;

    return item.effect.value;
  },

  generateAdventureNodesForExpedition: (
    islandId,
    teamSnapshot,
    collectedResources,
    monsters,
    discoveries,
    usedLuckyCharm,
    itemDrops
  ) => {
    const nodes: AdventureNode[] = [];
    const island = getIslandById(islandId);
    const baseTime = Date.now();

    nodes.push({
      id: randomId('node'),
      type: 'depart',
      timestamp: baseTime - 100000,
      teamSnapshot,
      islandName: island?.name,
      islandEmoji: island?.emoji,
      usedLuckyCharm,
      message: `远征队出发前往 ${island?.emoji || ''}${island?.name || ''}`,
    });

    if (collectedResources.length > 0) {
      nodes.push({
        id: randomId('node'),
        type: 'collect',
        timestamp: baseTime - 80000,
        resourceChanges: collectedResources.map(r => ({ type: r.type, amount: r.amount })),
        message: `采集到了资源`,
      });
    }

    if (monsters.length > 0) {
      nodes.push({
        id: randomId('node'),
        type: 'encounter',
        timestamp: baseTime - 60000,
        monsterDetails: monsters,
        message: `遭遇了 ${monsters.length} 只怪物`,
      });
    }

    if (discoveries.length > 0) {
      const discoveryDetails = discoveries.map(dId => {
        const d = getDiscoveryById(dId);
        return {
          id: dId,
          name: d?.name || dId,
          emoji: d?.emoji || '✨',
          rarity: (d?.rarity || 'common') as Rarity,
        };
      });
      nodes.push({
        id: randomId('node'),
        type: 'discover',
        timestamp: baseTime - 40000,
        discoveryIds: discoveries,
        discoveryDetails,
        message: `有了珍贵的发现！`,
      });
    }

    const claimItemChanges: AdventureNode['itemChanges'] = [];
    if (itemDrops && itemDrops.length > 0) {
      for (const drop of itemDrops) {
        claimItemChanges.push({
          itemId: drop.itemId,
          itemName: drop.itemName,
          itemEmoji: drop.itemEmoji,
          amount: drop.amount,
        });
      }
    }

    const expAmount = collectedResources.find(r => r.type === 'exp')?.amount || 0;
    nodes.push({
      id: randomId('node'),
      type: 'claim',
      timestamp: baseTime,
      resourceChanges: collectedResources.filter(r => r.type !== 'exp').map(r => ({ type: r.type, amount: r.amount })),
      expChange: expAmount,
      itemChanges: claimItemChanges.length > 0 ? claimItemChanges : undefined,
      usedLuckyCharm,
      message: `领取远征奖励${usedLuckyCharm ? '（已使用幸运符🍀）' : '（未使用幸运符）'}`,
    });

    return nodes;
  },

  generateAdventureNodesForBattle: (
    difficulty,
    teamSnapshot,
    monsters,
    discoveries,
    usedLuckyCharm,
    won,
    resources,
    expGained,
    itemDrops
  ) => {
    const nodes: AdventureNode[] = [];
    const baseTime = Date.now();
    const diffLabel = difficulty === 'hard' ? '困难' : difficulty === 'normal' ? '普通' : '简单';

    nodes.push({
      id: randomId('node'),
      type: 'start_battle',
      timestamp: baseTime - 60000,
      teamSnapshot,
      difficulty,
      usedLuckyCharm,
      message: `${diffLabel}难度战斗开始${usedLuckyCharm ? '（使用幸运符🍀）' : ''}`,
    });

    if (monsters.length > 0) {
      nodes.push({
        id: randomId('node'),
        type: 'encounter',
        timestamp: baseTime - 40000,
        monsterDetails: monsters,
        message: `遭遇了 ${monsters.length} 只怪物`,
      });
    }

    const resultType: AdventureNode['type'] = won ? 'victory' : 'defeat';
    const resultMsg = won ? '🎉 战斗胜利！' : '💔 战斗失败...';

    const battleDiscoveries: AdventureNode['discoveryDetails'] = [];
    if (discoveries.length > 0) {
      for (const dId of discoveries) {
        const d = getDiscoveryById(dId);
        battleDiscoveries.push({
          id: dId,
          name: d?.name || dId,
          emoji: d?.emoji || '✨',
          rarity: (d?.rarity || 'common') as Rarity,
        });
      }
    }

    const battleItemChanges: AdventureNode['itemChanges'] = [];
    let itemDropMsg = '';
    if (won && itemDrops && itemDrops.length > 0) {
      for (const drop of itemDrops) {
        battleItemChanges.push({
          itemId: drop.itemId,
          itemName: drop.itemName,
          itemEmoji: drop.itemEmoji,
          amount: drop.amount,
        });
      }
      itemDropMsg = `获得工具：${itemDrops.map(i => `${i.itemEmoji}${i.itemName} × ${i.amount}`).join('、')}`;
    }

    nodes.push({
      id: randomId('node'),
      type: resultType,
      timestamp: baseTime - 20000,
      resourceChanges: resources ? resources.map(r => ({ type: r.type, amount: r.amount })) : undefined,
      expChange: expGained,
      discoveryIds: discoveries.length > 0 ? discoveries : undefined,
      discoveryDetails: battleDiscoveries.length > 0 ? battleDiscoveries : undefined,
      itemChanges: battleItemChanges.length > 0 ? battleItemChanges : undefined,
      won,
      usedLuckyCharm,
      message: `${resultMsg}${itemDropMsg ? ' ' + itemDropMsg : ''}`,
    });

    if (discoveries.length > 0) {
      nodes.push({
        id: randomId('node'),
        type: 'discover',
        timestamp: baseTime - 10000,
        discoveryIds: discoveries,
        discoveryDetails: battleDiscoveries,
        message: `获得了 ${discoveries.length} 个珍贵发现！`,
      });
    }

    const finalLootMsg = won ? `（获得经验和战利品）` : '';
    const finalNode: AdventureNode = {
      id: randomId('node'),
      type: resultType,
      timestamp: baseTime,
      resourceChanges: resources ? resources.filter(r => r.type !== 'exp').map(r => ({ type: r.type, amount: r.amount })) : undefined,
      expChange: expGained,
      discoveryIds: discoveries.length > 0 ? discoveries : undefined,
      discoveryDetails: battleDiscoveries.length > 0 ? battleDiscoveries : undefined,
      itemChanges: battleItemChanges.length > 0 ? battleItemChanges : undefined,
      won,
      usedLuckyCharm,
      message: `${resultMsg}${itemDropMsg ? ' ' + itemDropMsg : ''}${finalLootMsg}`,
    };
    if (nodes[nodes.length - 1]?.type === 'discover') {
      nodes.push(finalNode);
    } else {
      nodes[nodes.length - 1] = finalNode;
    }

    return nodes;
  },

  createBattleRecord: (params) => {
    const recordId = randomId('adv');
    const island = params.islandId ? getIslandById(params.islandId) : undefined;

    const resourcesSummary = params.resources
      .map((r) => `${r.amount}${RESOURCE_NAMES[r.type] || r.type}`)
      .join('、');

    const itemsGained = params.itemDrops || [];

    const fullItemDrops: { itemId: string; itemName: string; itemEmoji: string; amount: number }[] = [];
    if (itemsGained.length > 0) {
      for (const d of itemsGained) {
        const item = getItemById(d.itemId);
        fullItemDrops.push({
          itemId: d.itemId,
          itemName: item?.name || d.itemId,
          itemEmoji: item?.emoji || '📦',
          amount: d.amount,
        });
      }
    }

    const itemDropSummary = fullItemDrops.length > 0
      ? fullItemDrops.map(d => `${d.itemEmoji}${d.itemName}x${d.amount}`).join('、')
      : '';

    const teamNames = params.teamPetSnapshots.map((p) => `${p.emoji}${p.name}`).join('、');
    const monsterPart = params.monsters.length > 0
      ? `，击败了${params.monsters.filter((m) => m.defeated).length}只怪物`
      : '';
    const discoveryPart = params.discoveries.length > 0 ? '，获得了珍贵发现' : '';
    const luckyPart = params.usedLuckyCharm ? '（使用了幸运符🍀）' : '（未使用幸运符）';
    const islandPart = island ? `在${island.emoji}${island.name}` : '';
    const winPart = params.won ? '胜利' : '失败';
    const itemPart = itemDropSummary ? `，获得了${itemDropSummary}` : '';
    const summary = `${teamNames}${islandPart}进行了一场${params.difficulty === 'hard' ? '困难' : params.difficulty === 'normal' ? '普通' : '简单'}难度的战斗，${winPart}！获得了${resourcesSummary}和${params.expGained}点经验${monsterPart}${discoveryPart}${itemPart}${luckyPart}`;

    const nodes = get().generateAdventureNodesForBattle(
      params.difficulty,
      params.teamPetSnapshots,
      params.monsters,
      params.discoveries,
      params.usedLuckyCharm,
      params.won,
      params.resources,
      params.expGained,
      fullItemDrops.length > 0 ? fullItemDrops : undefined
    );

    const record: AdventureRecord = {
      id: recordId,
      type: 'battle',
      startTime: Date.now() - 60000,
      endTime: Date.now(),
      islandId: params.islandId,
      islandName: island?.name,
      islandEmoji: island?.emoji,
      difficulty: params.difficulty,
      teamPetIds: params.teamPetIds,
      teamPetSnapshots: params.teamPetSnapshots,
      collectedResources: params.resources,
      encounteredMonsters: params.monsters,
      discoveries: params.discoveries,
      expGained: params.expGained,
      usedLuckyCharm: params.usedLuckyCharm,
      summary,
      nodes,
      itemsGained,
    };

    get().addAdventureRecord(record);

    if (params.usedLuckyCharm) {
      get().addLog('🍀 本次战斗消耗了1个幸运符', 'info', undefined, params.islandId, recordId);
    } else {
      get().addLog('本次战斗未使用幸运符', 'info', undefined, params.islandId, recordId);
    }

    if (itemsGained.length > 0 && params.won) {
      for (const drop of fullItemDrops) {
        get().addLog(
          `战斗中获得了 ${drop.itemEmoji}${drop.itemName} × ${drop.amount}`,
          'success',
          undefined,
          params.islandId,
          recordId
        );
      }
    }

    return recordId;
  },
}));

export const initializeGameStore = () => {
  const saved = loadFromStorage();
  if (saved) {
    useGameStore.setState(saved);
    useGameStore.getState().addLog('存档加载成功！', 'info');
  }
};