export const randomInt = (min: number, max: number): number => {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1)) + minCeiled;
};

export const randomFloat = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export const randomChoice = <T>(arr: T[]): T => {
  if (arr.length === 0) {
    throw new Error('Cannot pick from empty array');
  }
  return arr[Math.floor(Math.random() * arr.length)];
};

export const randomChoices = <T>(arr: T[], count: number, unique: boolean = true): T[] => {
  if (arr.length === 0) return [];
  if (unique && count >= arr.length) return [...arr];

  const result: T[] = [];
  const used = new Set<number>();

  while (result.length < count) {
    const index = Math.floor(Math.random() * arr.length);
    if (unique) {
      if (!used.has(index)) {
        used.add(index);
        result.push(arr[index]);
      }
    } else {
      result.push(arr[index]);
    }
  }

  return result;
};

export interface WeightedItem<T> {
  item: T;
  weight: number;
}

export const weightedRandomChoice = <T>(items: WeightedItem<T>[]): T => {
  if (items.length === 0) {
    throw new Error('Cannot pick from empty weighted array');
  }

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item.item;
    }
  }

  return items[items.length - 1].item;
};

export const weightedRandomChoices = <T>(items: WeightedItem<T>[], count: number): T[] => {
  const result: T[] = [];
  const remaining = [...items];

  for (let i = 0; i < count && remaining.length > 0; i++) {
    const totalWeight = remaining.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedIndex = 0;

    for (let j = 0; j < remaining.length; j++) {
      random -= remaining[j].weight;
      if (random <= 0) {
        selectedIndex = j;
        break;
      }
    }

    result.push(remaining[selectedIndex].item);
    remaining.splice(selectedIndex, 1);
  }

  return result;
};

export const randomBool = (probability: number = 0.5): boolean => {
  return Math.random() < probability;
};

const PET_NAME_PREFIXES = [
  '小', '大', '阿', '老', '可', '萌', '神', '圣', '魔', '灵',
  '飞', '炎', '冰', '雷', '风', '暗', '光', '星', '月', '日',
];

const PET_NAME_SUFFIXES = [
  '龙', '凤', '虎', '狮', '狼', '鹰', '猫', '狗', '兔', '狐',
  '宝宝', '贝贝', '晶晶', '欢欢', '乐乐', '奇奇', '妙妙', '豆豆', '球球', '雪球',
  '战士', '法师', '猎手', '守护', '使者', '精灵', '骑士', '王者', '勇者', '传说',
];

const PET_NAME_MIDDLES = [
  '', '之', '心', '翼', '影', '魂', '魄', '焰', '霜', '雷',
];

export const randomPetName = (): string => {
  const useThree = randomBool(0.4);
  const prefix = randomChoice(PET_NAME_PREFIXES);
  const suffix = randomChoice(PET_NAME_SUFFIXES);

  if (useThree) {
    const middle = randomChoice(PET_NAME_MIDDLES.filter((m) => m !== ''));
    return `${prefix}${middle}${suffix}`;
  }

  return `${prefix}${suffix}`;
};

export const randomId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const shuffle = <T>(arr: T[]): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};
