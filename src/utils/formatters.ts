import type { ResourceType, Rarity, PetType, ExpeditionStatus } from '../types';

export const RESOURCE_NAMES: Record<ResourceType, string> = {
  gold: '金币',
  ore: '矿石',
  herb: '草药',
  shell: '贝壳',
  exp: '经验',
};

export const RESOURCE_EMOJIS: Record<ResourceType, string> = {
  gold: '💰',
  ore: '⛏️',
  herb: '🌿',
  shell: '🐚',
  exp: '⭐',
};

export const RESOURCE_COLORS: Record<ResourceType, string> = {
  gold: 'text-yellow-400',
  ore: 'text-gray-400',
  herb: 'text-green-400',
  shell: 'text-pink-300',
  exp: 'text-blue-400',
};

export const RARITY_NAMES: Record<Rarity, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

export const RARITY_COLORS: Record<Rarity, string> = {
  common: 'text-gray-300',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
};

export const RARITY_BG_COLORS: Record<Rarity, string> = {
  common: 'bg-gray-600',
  rare: 'bg-blue-600',
  epic: 'bg-purple-600',
  legendary: 'bg-gradient-to-r from-yellow-500 to-orange-500',
};

export const RARITY_BORDER_COLORS: Record<Rarity, string> = {
  common: 'border-gray-500',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-yellow-500',
};

export const PET_TYPE_NAMES: Record<PetType, string> = {
  fire: '火系',
  water: '水系',
  earth: '土系',
  wind: '风系',
  light: '光系',
  dark: '暗系',
};

export const PET_TYPE_COLORS: Record<PetType, string> = {
  fire: 'text-red-400',
  water: 'text-blue-400',
  earth: 'text-amber-600',
  wind: 'text-green-300',
  light: 'text-yellow-300',
  dark: 'text-purple-400',
};

export const PET_TYPE_BG_COLORS: Record<PetType, string> = {
  fire: 'bg-red-500/20',
  water: 'bg-blue-500/20',
  earth: 'bg-amber-600/20',
  wind: 'bg-green-400/20',
  light: 'bg-yellow-400/20',
  dark: 'bg-purple-500/20',
};

export const PET_TYPE_EMOJIS: Record<PetType, string> = {
  fire: '🔥',
  water: '💧',
  earth: '🗿',
  wind: '💨',
  light: '✨',
  dark: '🌑',
};

export const EXPEDITION_STATUS_NAMES: Record<ExpeditionStatus, string> = {
  traveling: '航行中',
  battling: '战斗中',
  collecting: '采集中',
  returning: '返航中',
  completed: '已完成',
};

export const EXPEDITION_STATUS_COLORS: Record<ExpeditionStatus, string> = {
  traveling: 'text-blue-400',
  battling: 'text-red-400',
  collecting: 'text-green-400',
  returning: 'text-purple-400',
  completed: 'text-yellow-400',
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return Math.floor(num).toString();
};

export const formatNumberFull = (num: number): string => {
  return Math.floor(num).toLocaleString('zh-CN');
};

export const formatTime = (ms: number): string => {
  if (ms <= 0) return '0秒';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}天${hours % 24}小时`;
  }
  if (hours > 0) {
    return `${hours}小时${minutes % 60}分`;
  }
  if (minutes > 0) {
    return `${minutes}分${seconds % 60}秒`;
  }
  return `${seconds}秒`;
};

export const formatTimeShort = (ms: number): string => {
  if (ms <= 0) return '00:00';

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const formatPercentage = (value: number, total: number): string => {
  if (total <= 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
};

export const formatResource = (type: ResourceType, amount: number): string => {
  return `${RESOURCE_EMOJIS[type]} ${RESOURCE_NAMES[type]}: ${formatNumberFull(amount)}`;
};

export const getProgressColor = (progress: number): string => {
  if (progress >= 80) return 'bg-green-500';
  if (progress >= 50) return 'bg-yellow-500';
  if (progress >= 20) return 'bg-orange-500';
  return 'bg-red-500';
};

export const getMoodEmoji = (mood: number): string => {
  if (mood >= 80) return '😄';
  if (mood >= 60) return '😊';
  if (mood >= 40) return '😐';
  if (mood >= 20) return '😟';
  return '😢';
};

export const getStaminaEmoji = (stamina: number): string => {
  if (stamina >= 80) return '⚡';
  if (stamina >= 60) return '🔋';
  if (stamina >= 40) return '🪫';
  if (stamina >= 20) return '😴';
  return '💀';
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};
