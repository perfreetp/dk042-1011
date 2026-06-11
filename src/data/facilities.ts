import type { FacilityType, ResourceType } from '../types';

export interface FacilityUpgrade {
  level: number;
  costs: Partial<Record<ResourceType, number>>;
  effect: string;
  bonus: number;
}

export const FACILITY_CONFIG: Record<FacilityType, {
  name: string;
  emoji: string;
  description: string;
  upgrades: FacilityUpgrade[];
}> = {
  dock: {
    name: '码头',
    emoji: '⚓',
    description: '提升远征效率，减少远征时间',
    upgrades: [
      { level: 1, costs: {}, effect: '基础码头', bonus: 0 },
      { level: 2, costs: { gold: 200, ore: 20 }, effect: '远征时间-10%', bonus: 0.1 },
      { level: 3, costs: { gold: 500, ore: 50, herb: 30 }, effect: '远征时间-20%', bonus: 0.2 },
      { level: 4, costs: { gold: 1200, ore: 100, shell: 50 }, effect: '远征时间-30%', bonus: 0.3 },
      { level: 5, costs: { gold: 3000, ore: 200, shell: 100, herb: 100 }, effect: '远征时间-40%', bonus: 0.4 },
    ],
  },
  warehouse: {
    name: '仓库',
    emoji: '🏠',
    description: '增加资源存储上限',
    upgrades: [
      { level: 1, costs: {}, effect: '基础容量 500', bonus: 500 },
      { level: 2, costs: { gold: 150, ore: 15 }, effect: '容量提升至 1000', bonus: 1000 },
      { level: 3, costs: { gold: 400, ore: 40, shell: 20 }, effect: '容量提升至 2000', bonus: 2000 },
      { level: 4, costs: { gold: 1000, ore: 80, shell: 40 }, effect: '容量提升至 5000', bonus: 5000 },
      { level: 5, costs: { gold: 2500, ore: 150, shell: 80, herb: 80 }, effect: '容量提升至 10000', bonus: 10000 },
    ],
  },
  workshop: {
    name: '工坊',
    emoji: '🔨',
    description: '解锁更多制作配方，提升制作效率',
    upgrades: [
      { level: 1, costs: {}, effect: '解锁基础配方', bonus: 1 },
      { level: 2, costs: { gold: 250, ore: 30 }, effect: '解锁中级配方', bonus: 2 },
      { level: 3, costs: { gold: 600, ore: 60, herb: 40 }, effect: '解锁高级配方', bonus: 3 },
      { level: 4, costs: { gold: 1500, ore: 120, herb: 80, shell: 60 }, effect: '解锁稀有配方', bonus: 4 },
      { level: 5, costs: { gold: 3500, ore: 250, herb: 150, shell: 120 }, effect: '解锁传说配方', bonus: 5 },
    ],
  },
  hatchery: {
    name: '孵化巢',
    emoji: '🥚',
    description: '提升孵化速度和蛋的品质',
    upgrades: [
      { level: 1, costs: {}, effect: '基础孵化速度', bonus: 1 },
      { level: 2, costs: { gold: 180, herb: 20, shell: 15 }, effect: '孵化速度+25%', bonus: 1.25 },
      { level: 3, costs: { gold: 450, herb: 50, shell: 40 }, effect: '孵化速度+50%', bonus: 1.5 },
      { level: 4, costs: { gold: 1100, herb: 100, shell: 80, ore: 50 }, effect: '孵化速度+75%', bonus: 1.75 },
      { level: 5, costs: { gold: 2800, herb: 200, shell: 150, ore: 100 }, effect: '孵化速度+100%', bonus: 2 },
    ],
  },
};

export const getUpgradeCost = (
  facility: FacilityType,
  currentLevel: number
): Partial<Record<ResourceType, number>> | null => {
  const config = FACILITY_CONFIG[facility];
  const nextUpgrade = config.upgrades.find((u) => u.level === currentLevel + 1);
  return nextUpgrade ? nextUpgrade.costs : null;
};

export const getFacilityBonus = (facility: FacilityType, level: number): number => {
  const config = FACILITY_CONFIG[facility];
  const upgrade = config.upgrades.find((u) => u.level === level);
  return upgrade ? upgrade.bonus : 0;
};

export const getMaxFacilityLevel = (facility: FacilityType): number => {
  return FACILITY_CONFIG[facility].upgrades.length;
};
