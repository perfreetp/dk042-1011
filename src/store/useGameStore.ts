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
} from '../types';
import { STARTER_PETS, PET_TEMPLATES, SKILL_POOL, RARITY_MULTIPLIER } from '../data/pets';
import { getInitialIslandProgress, ISLANDS } from '../data/islands';
import { generateInitialOrders, refreshOrders } from '../data/orders';
import { getUpgradeCost, getFacilityBonus, getMaxFacilityLevel } from '../data/facilities';
import { getRecipeById } from '../data/recipes';
import { createDiscovery, DISCOVERY_TEMPLATES } from '../data/discoveries';
import { randomInt, randomChoice, randomPetName, randomId, weightedRandomChoice, clamp } from '../utils/random';

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
  lastOrderRefresh: Date.now(),
});

const loadFromStorage = (): GameState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed as GameState;
    }
  } catch (e) {
    console.error('Failed to load game state:', e);
  }
  return null;
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

  startExpedition: (islandId: string) => boolean;
  updateExpeditionStatus: (status: Expedition['status']) => void;
  completeExpedition: (rewards: ResourceReward[], battleWins: number, discoveries: string[]) => void;
  cancelExpedition: () => void;

  collectResource: (type: 'ore' | 'herb' | 'shell') => number;
  craftItem: (recipeId: string) => boolean;

  repairEquipment: (equipId: string) => boolean;

  submitOrder: (orderId: string) => boolean;
  refreshOrderList: () => void;

  addLog: (message: string, type?: LogEntry['type']) => void;
  addDiscovery: (discoveryId: string) => boolean;

  checkAndUnlockIslands: () => string[];
  resetGame: () => void;
  saveToStorage: () => void;
}

export type GameStore = GameState & GameActions;

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

  startExpedition: (islandId) => {
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

    const expedition: Expedition = {
      islandId,
      startTime: Date.now(),
      status: 'traveling',
      battleWins: 0,
      collected: [],
      logs: [`远征队出发前往 ${island.emoji}${island.name}`],
      discoveredItems: [],
    };

    set({ expedition });
    get().addLog(`🚢 远征队出发前往 ${island.emoji}${island.name}！消耗 ${travelCost} 金币`, 'info');
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

  completeExpedition: (rewards, battleWins, discoveries) => {
    const state = get();
    if (!state.expedition) return;

    const islandId = state.expedition.islandId;
    const island = ISLANDS.find((i) => i.id === islandId);

    get().addResources(rewards);

    const totalExp = rewards.find((r) => r.type === 'exp')?.amount || 0;
    if (totalExp > 0) {
      const expPerPet = Math.floor(totalExp / state.team.length);
      for (const petId of state.team) {
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

  cancelExpedition: () => {
    set({ expedition: null });
    get().addLog('远征已取消', 'warning');
  },

  collectResource: (type) => {
    const state = get();
    const workshopLevel = state.facilities.workshop;
    const baseAmount = randomInt(2, 6);
    const bonus = Math.floor(workshopLevel * 0.5);
    const amount = baseAmount + bonus;

    get().addResource(type, amount);
    get().addLog(`采集到 ${amount} 个${type === 'ore' ? '矿石⛏️' : type === 'herb' ? '草药🌿' : '贝壳🐚'}`, 'success');
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

    get().spendResources(costs);

    if ('type' in recipe.output && recipe.output.type) {
      get().addResource(recipe.output.type as ResourceType, recipe.output.amount);
      get().addLog(
        `制作了 ${recipe.emoji}${recipe.name}！获得 ${recipe.output.amount} ${recipe.output.type}`,
        'success'
      );
    } else {
      get().addLog(`制作了 ${recipe.emoji}${recipe.name}！`, 'success');
    }

    return true;
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

  addLog: (message, type = 'info') => {
    const entry: LogEntry = {
      id: randomId('log'),
      timestamp: Date.now(),
      message,
      type,
    };
    set((state) => ({
      logs: [entry, ...state.logs].slice(0, 100),
    }));
  },

  addDiscovery: (discoveryId) => {
    const state = get();
    if (state.discoveries.some((d) => d.id === discoveryId)) {
      return false;
    }

    const discovery = createDiscovery(discoveryId);
    if (!discovery) return false;

    set((s) => ({
      discoveries: [...s.discoveries, discovery],
    }));

    get().addLog(
      `📖 新发现！${discovery.emoji}${discovery.name} [${discovery.rarity}]`,
      'success'
    );
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
        lastOrderRefresh,
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
        lastOrderRefresh,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    } catch (e) {
      console.error('Failed to save game state:', e);
    }
  },
}));

export const initializeGameStore = () => {
  const saved = loadFromStorage();
  if (saved) {
    useGameStore.setState(saved);
    useGameStore.getState().addLog('存档加载成功！', 'info');
  }
};
