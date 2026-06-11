import { useNavigate } from 'react-router-dom';
import { ArrowRight, RefreshCw, Check, Ship, Anchor, Package, Hammer, Clock, Map, Gift, Sparkles, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/store/useGameStore';
import {
  formatNumberFull,
  RESOURCE_EMOJIS,
  RESOURCE_NAMES,
  EXPEDITION_STATUS_NAMES,
  EXPEDITION_STATUS_COLORS,
  RARITY_COLORS,
  RARITY_BORDER_COLORS,
  RARITY_NAMES,
  formatTimeShort,
} from '@/utils/formatters';
import { FACILITY_CONFIG, getUpgradeCost, getMaxFacilityLevel, getFacilityBonus } from '@/data/facilities';
import { getIslandById } from '@/data/islands';
import { ORDER_TEMPLATES } from '@/data/orders';
import type { FacilityType, ResourceType, Order, LogEntry, ResourceReward } from '@/types';
import { useMemo, useState, useEffect, useRef } from 'react';

const facilityEmojiMap: Record<FacilityType, string> = {
  dock: '⚓',
  warehouse: '📦',
  workshop: '🔨',
  hatchery: '🥚',
};

const facilityAccentMap: Record<FacilityType, { from: string; to: string; border: string; text: string }> = {
  dock: { from: 'from-cyan-500/30', to: 'to-blue-500/30', border: 'border-cyan-400/40', text: 'text-cyan-300' },
  warehouse: { from: 'from-amber-500/30', to: 'to-orange-500/30', border: 'border-amber-400/40', text: 'text-amber-300' },
  workshop: { from: 'from-red-500/30', to: 'to-rose-500/30', border: 'border-red-400/40', text: 'text-red-300' },
  hatchery: { from: 'from-purple-500/30', to: 'to-pink-500/30', border: 'border-purple-400/40', text: 'text-purple-300' },
};

const logTypeStyles: Record<LogEntry['type'], { bg: string; text: string; dot: string }> = {
  info: { bg: 'bg-blue-500/10', text: 'text-blue-300', dot: 'bg-blue-400' },
  success: { bg: 'bg-green-500/10', text: 'text-green-300', dot: 'bg-green-400' },
  warning: { bg: 'bg-yellow-500/10', text: 'text-yellow-300', dot: 'bg-yellow-400' },
  danger: { bg: 'bg-red-500/10', text: 'text-red-300', dot: 'bg-red-400' },
};

function FacilityCard({ facility }: { facility: FacilityType }) {
  const { facilities, resources, upgradeFacility, canAfford } = useGameStore();
  const currentLevel = facilities[facility];
  const config = FACILITY_CONFIG[facility];
  const maxLevel = getMaxFacilityLevel(facility);
  const nextCosts = getUpgradeCost(facility, currentLevel);
  const accent = facilityAccentMap[facility];
  const isMaxLevel = currentLevel >= maxLevel;
  const afford = nextCosts ? canAfford(nextCosts) : false;
  const currentBonus = getFacilityBonus(facility, currentLevel);
  const nextUpgrade = config.upgrades.find((u) => u.level === currentLevel + 1);

  const handleUpgrade = () => {
    upgradeFacility(facility);
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 border backdrop-blur-sm transition-all duration-300',
        'hover:scale-[1.02] hover:shadow-2xl',
        `bg-gradient-to-br ${accent.from} ${accent.to}`,
        accent.border
      )}
    >
      <div className="absolute top-0 right-0 text-8xl opacity-10 -translate-y-4 translate-x-4 pointer-events-none">
        {facilityEmojiMap[facility]}
      </div>
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl">{facilityEmojiMap[facility]}</span>
              <h3 className={cn('font-title text-xl', accent.text)}>{config.name}</h3>
            </div>
            <p className="text-white/70 text-sm">{config.description}</p>
          </div>
          <div className="text-right">
            <div className={cn('font-title text-3xl font-bold', accent.text)}>
              Lv.{currentLevel}
            </div>
            <div className="text-white/50 text-xs">/ {maxLevel}</div>
          </div>
        </div>

        <div className="bg-black/20 rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-white/70">当前效果</span>
            <span className={cn('font-bold', accent.text)}>
              {facility === 'warehouse' ? `容量 ${currentBonus}` :
               facility === 'dock' ? `时间 -${Math.round(currentBonus * 100)}%` :
               facility === 'hatchery' ? `速度 x${currentBonus.toFixed(2)}` :
               `解锁 Lv.${currentBonus} 配方`}
            </span>
          </div>
          {nextUpgrade && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">升级后</span>
              <span className="text-emerald-400 font-bold">
                {facility === 'warehouse' ? `容量 ${nextUpgrade.bonus}` :
                 facility === 'dock' ? `时间 -${Math.round(nextUpgrade.bonus * 100)}%` :
                 facility === 'hatchery' ? `速度 x${nextUpgrade.bonus.toFixed(2)}` :
                 `解锁 Lv.${nextUpgrade.bonus} 配方`}
              </span>
            </div>
          )}
        </div>

        {!isMaxLevel && nextCosts ? (
          <>
            <div className="mb-4">
              <div className="text-white/70 text-xs mb-2 flex items-center gap-1">
                <Package size={12} /> 升级所需
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(nextCosts).map(([type, amount]) => {
                  const rType = type as ResourceType;
                  const hasEnough = resources[rType] >= (amount || 0);
                  return (
                    <div
                      key={type}
                      className={cn(
                        'flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm',
                        hasEnough ? 'bg-white/10 text-white' : 'bg-red-500/20 text-red-300'
                      )}
                    >
                      <span>{RESOURCE_EMOJIS[rType]}</span>
                      <span className="font-bold">{formatNumberFull(amount || 0)}</span>
                      {!hasEnough && (
                        <span className="text-xs opacity-70">
                          (缺 {formatNumberFull((amount || 0) - resources[rType])})
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <button
              onClick={handleUpgrade}
              disabled={!afford}
              className={cn(
                'w-full py-3 rounded-xl font-title font-bold text-lg transition-all duration-300',
                'flex items-center justify-center gap-2',
                afford
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
              )}
            >
              <Hammer size={18} />
              升级到 Lv.{currentLevel + 1}
            </button>
          </>
        ) : (
          <div className="w-full py-3 rounded-xl font-title font-bold text-lg bg-gradient-to-r from-yellow-500/30 to-amber-500/30 text-yellow-300 text-center border border-yellow-400/30">
            ✨ 已达到最高等级
          </div>
        )}
      </div>
    </div>
  );
}

function FacilityPanel() {
  const facilities: FacilityType[] = ['dock', 'warehouse', 'workshop', 'hatchery'];
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1.5 h-8 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full" />
        <h2 className="font-title text-2xl md:text-3xl text-white drop-shadow">🏗️ 设施升级</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-white/30 to-transparent" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {facilities.map((f) => (
          <FacilityCard key={f} facility={f} />
        ))}
      </div>
    </div>
  );
}

function getOrderRarity(order: Order): string {
  const template = ORDER_TEMPLATES.find((t) => order.id.startsWith(t.id));
  return template?.rarity || 'common';
}

function OrderCard({ order }: { order: Order }) {
  const { resources, submitOrder, canAfford } = useGameStore();
  const rarity = getOrderRarity(order);
  const costs: Partial<Record<ResourceType, number>> = {};
  for (const req of order.requirements) {
    costs[req.type] = req.amount;
  }
  const afford = canAfford(costs);
  const timeLeft = Math.max(0, order.expiresAt - Date.now());
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (order.completed) return;
    const timer = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [order.completed]);

  const handleSubmit = () => {
    submitOrder(order.id);
  };

  if (order.completed) {
    return (
      <div className="rounded-2xl p-5 bg-gray-600/20 border border-gray-500/30 backdrop-blur-sm opacity-60">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl grayscale">{order.islanderEmoji}</span>
          <div>
            <div className="font-title text-lg text-gray-400 line-through">{order.islander}</div>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Check size={12} /> 已完成
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-6 text-emerald-400">
          <Check size={32} />
          <span className="font-title text-xl ml-2">订单已交付</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 border backdrop-blur-sm transition-all duration-300',
        'hover:scale-[1.02] hover:shadow-2xl',
        'bg-gradient-to-br from-slate-600/30 to-slate-800/30',
        RARITY_BORDER_COLORS[rarity as keyof typeof RARITY_BORDER_COLORS] || 'border-white/10'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{order.islanderEmoji}</span>
          <div>
            <div className="font-title text-lg text-white">{order.islander}</div>
            <div className={cn(
              'text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-0.5',
              RARITY_COLORS[rarity as keyof typeof RARITY_COLORS],
              'bg-white/10'
            )}>
              {RARITY_NAMES[rarity as keyof typeof RARITY_NAMES]}订单
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-white/60 text-xs bg-black/20 px-2 py-1 rounded-lg">
          <Clock size={12} />
          <span className={timeLeft < 3600000 ? 'text-red-400 font-bold' : ''}>
            {formatTimeShort(timeLeft)}
          </span>
        </div>
      </div>

      <div className="bg-black/20 rounded-xl p-3 mb-3">
        <div className="text-white/70 text-xs mb-2 flex items-center gap-1">
          <Package size={12} /> 需要材料
        </div>
        <div className="flex flex-wrap gap-2">
          {order.requirements.map((req, i) => {
            const hasEnough = resources[req.type] >= req.amount;
            return (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm',
                  hasEnough ? 'bg-white/10 text-white' : 'bg-red-500/20 text-red-300'
                )}
              >
                <span>{RESOURCE_EMOJIS[req.type]}</span>
                <span className="font-bold">{formatNumberFull(req.amount)}</span>
                <span className="text-xs opacity-70">
                  ({RESOURCE_NAMES[req.type]})
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-emerald-500/10 rounded-xl p-3 mb-4 border border-emerald-400/20">
        <div className="text-emerald-400/80 text-xs mb-2 flex items-center gap-1">
          🎁 完成奖励
        </div>
        <div className="flex flex-wrap gap-2">
          {order.rewards.map((reward, i) => (
            <div
              key={i}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm bg-emerald-500/20 text-emerald-200"
            >
              <span>{RESOURCE_EMOJIS[reward.type]}</span>
              <span className="font-bold">+{formatNumberFull(reward.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!afford}
        className={cn(
          'w-full py-3 rounded-xl font-title font-bold text-lg transition-all duration-300',
          'flex items-center justify-center gap-2',
          afford
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]'
            : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
        )}
      >
        <Check size={18} />
        {afford ? '交付订单' : '材料不足'}
      </button>
    </div>
  );
}

function OrderBoard() {
  const { orders, refreshOrderList } = useGameStore();
  const activeOrders = useMemo(() => orders.filter((o) => !o.completed), [orders]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1.5 h-8 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
        <h2 className="font-title text-2xl md:text-3xl text-white drop-shadow">📜 岛民订单板</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-white/30 to-transparent" />
        <button
          onClick={refreshOrderList}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500/80 to-purple-500/80 hover:from-indigo-400 hover:to-purple-400 text-white font-game text-sm transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
        >
          <RefreshCw size={16} />
          刷新订单 (50🪙)
        </button>
      </div>
      {activeOrders.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center card-shadow">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-white/70 font-game text-lg">当前没有待完成的订单</p>
          <p className="text-white/50 text-sm mt-2">点击刷新按钮获取新订单</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {activeOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

function ExpeditionIdlePanel({ lastExpedition }: { lastExpedition: LogEntry | null }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-3xl p-8 border backdrop-blur-sm bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-cyan-400/30 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-blue-400/20 blur-3xl" />
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-3xl bg-white/10 flex items-center justify-center text-6xl mb-6 border border-white/10">
          🚢
        </div>
        <h3 className="font-title text-2xl md:text-3xl text-white mb-3">暂无远征进行</h3>
        <p className="text-white/70 text-base max-w-md mb-6">
          远征队正待命中，前往地图选择岛屿，开启新的冒险旅程吧！
        </p>
        <button
          onClick={() => navigate('/map')}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-title font-bold text-lg shadow-lg shadow-cyan-500/30 hover:from-cyan-400 hover:to-blue-400 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
        >
          <Map size={22} />
          前往地图派遣远征队
          <ArrowRight size={20} />
        </button>

        {lastExpedition && (
          <div className="mt-8 w-full max-w-lg">
            <div className="text-white/50 text-sm mb-3 text-left flex items-center gap-2">
              <Clock size={14} />
              上次远征回顾
            </div>
            <div className="bg-black/20 rounded-2xl p-4 border border-white/10 text-left">
              <p className="text-white/80 text-sm">{lastExpedition.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ExpeditionProgressPanel() {
  const { expedition, team, pets, updateExpeditionProgress } = useGameStore();
  const [, forceUpdate] = useState(0);
  const hasCalledUpdateRef = useRef(false);

  useEffect(() => {
    hasCalledUpdateRef.current = false;
    const timer = setInterval(() => {
      updateExpeditionProgress();
      forceUpdate((n) => n + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [updateExpeditionProgress]);

  if (!expedition) return null;

  const island = getIslandById(expedition.islandId);
  if (!island) return null;

  const teamPets = pets.filter((p) => team.includes(p.id));
  const elapsed = Date.now() - expedition.startTime;
  const totalDuration = expedition.durationSeconds * 1000;
  const progress = Math.min(100, (elapsed / totalDuration) * 100);
  const remaining = Math.max(0, totalDuration - elapsed);

  return (
    <div className="rounded-3xl p-6 md:p-8 border backdrop-blur-sm bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-400/30 relative overflow-hidden">
      <div className="absolute top-0 right-0 text-[10rem] opacity-10 -translate-y-12 translate-x-12 pointer-events-none">
        ⛵
      </div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 rounded-full bg-blue-400/15 blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/10 flex items-center justify-center text-4xl md:text-5xl animate-bounce border border-white/10">
              {island.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-title text-xl md:text-2xl text-white">{island.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/10 text-amber-300 border border-amber-400/30">
                  Lv.{island.level}
                </span>
              </div>
              <span className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold',
                EXPEDITION_STATUS_COLORS[expedition.status],
                'bg-black/30'
              )}>
                <Ship size={12} />
                {EXPEDITION_STATUS_NAMES[expedition.status]}
              </span>
            </div>
          </div>

          <div className="bg-black/20 rounded-2xl px-5 py-3 border border-white/10">
            <div className="text-white/50 text-xs mb-1 text-center">剩余时间</div>
            <div className="font-mono text-2xl md:text-3xl font-bold text-cyan-300 text-center">
              {formatTimeShort(remaining)}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-white/70 flex items-center gap-1.5">
              <Anchor size={14} className="text-cyan-400" />
              远征进度
            </span>
            <span className="text-white font-bold">{progress.toFixed(1)}%</span>
          </div>
          <div className="h-4 md:h-5 rounded-full bg-black/30 overflow-hidden border border-white/10">
            <div
              className="h-full rounded-full transition-all duration-500 relative bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>

        {teamPets.length > 0 && (
          <div className="mb-6">
            <div className="text-white/70 text-sm mb-3 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-400" />
              出征队伍
            </div>
            <div className="flex flex-wrap gap-3">
              {teamPets.map((pet) => (
                <div
                  key={pet.id}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 transition-all duration-200"
                >
                  <span className="text-2xl md:text-3xl">{pet.emoji}</span>
                  <div>
                    <div className="text-white text-sm font-bold">{pet.name}</div>
                    <div className="text-white/50 text-xs">Lv.{pet.level}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center text-white/60 text-sm bg-black/20 rounded-xl py-3 border border-white/5">
          💫 远征进行中，请耐心等待...
        </div>
      </div>
    </div>
  );
}

function ExpeditionRewardPanel() {
  const { expedition, claimExpeditionRewards } = useGameStore();
  const [claimed, setClaimed] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const rewardsRef = useRef<ResourceReward[]>([]);
  const discoveriesRef = useRef<string[]>([]);

  if (!expedition || !expedition.rewardsReady) return null;

  const island = getIslandById(expedition.islandId);
  if (!island) return null;

  const handleClaim = () => {
    rewardsRef.current = [...expedition.collected];
    discoveriesRef.current = [...expedition.discoveredItems];
    const success = claimExpeditionRewards();
    if (success) {
      setClaimed(true);
      setTimeout(() => setShowRewards(true), 300);
    }
  };

  if (claimed && showRewards) {
    return (
      <div className="rounded-3xl p-6 md:p-8 border backdrop-blur-sm bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border-amber-400/40 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full bg-amber-400/20 blur-3xl animate-pulse" />
          <div className="absolute -bottom-32 -left-32 w-72 h-72 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" />
        </div>

        <div className="relative z-10 text-center">
          <div className="text-6xl md:text-7xl mb-4 animate-bounce">🎉</div>
          <h3 className="font-title text-2xl md:text-3xl text-amber-300 mb-2">奖励已领取！</h3>
          <p className="text-white/70 mb-6">恭喜完成本次远征冒险</p>

          <div className="bg-black/20 rounded-2xl p-5 mb-6 border border-amber-400/20">
            <div className="text-white/70 text-sm mb-4 flex items-center justify-center gap-2">
              <Gift size={16} className="text-amber-400" />
              获得奖励
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {rewardsRef.current.map((reward, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 text-amber-200 border border-amber-400/30"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <span className="text-xl">{RESOURCE_EMOJIS[reward.type]}</span>
                  <span className="font-bold text-lg">+{formatNumberFull(reward.amount)}</span>
                </div>
              ))}
            </div>

            {discoveriesRef.current.length > 0 && (
              <div className="mt-5 pt-5 border-t border-white/10">
                <div className="text-white/70 text-sm mb-3 flex items-center justify-center gap-2">
                  <Sparkles size={16} className="text-purple-400" />
                  新发现
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {discoveriesRef.current.map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/20 text-purple-200 border border-purple-400/30"
                    >
                      <span className="text-xl">✨</span>
                      <span className="font-bold">稀有发现</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="text-white/50 text-sm">
            远征队已安全返回码头营地
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl p-6 md:p-8 border backdrop-blur-sm bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border-amber-400/40 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full bg-amber-400/25 blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-72 h-72 rounded-full bg-yellow-400/25 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15rem] opacity-5">
          🎁
        </div>
      </div>

      <div className="relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-500/30 to-yellow-500/30 border border-amber-400/50 mb-4">
            <Sparkles size={16} className="text-amber-300 animate-pulse" />
            <span className="text-amber-200 font-bold text-sm">远征完成</span>
            <Sparkles size={16} className="text-amber-300 animate-pulse" />
          </div>
          <h3 className="font-title text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-300 drop-shadow-lg mb-2">
            ✨ 奖励已就绪！✨
          </h3>
          <p className="text-white/70">远征队满载而归，快来领取丰厚奖励吧！</p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/10 flex items-center justify-center text-4xl md:text-5xl border border-amber-400/30">
            {island.emoji}
          </div>
          <div>
            <div className="font-title text-xl md:text-2xl text-white">{island.name}</div>
            <div className="text-white/60 text-sm">
              <span className="text-amber-300 font-bold">{expedition.battleWins}</span> 场战斗胜利
            </div>
          </div>
        </div>

        <div className="bg-black/20 rounded-2xl p-4 mb-6 border border-amber-400/20">
          <div className="text-white/50 text-xs mb-2 text-center">奖励预览</div>
          <div className="flex flex-wrap justify-center gap-2">
            {expedition.collected.map((reward, i) => (
              <div
                key={i}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-white/80 text-sm"
              >
                <span>{RESOURCE_EMOJIS[reward.type]}</span>
                <span className="font-bold">?{formatNumberFull(reward.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleClaim}
          className="w-full py-4 md:py-5 rounded-2xl font-title font-bold text-xl md:text-2xl text-white bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 shadow-lg shadow-amber-500/40 hover:from-amber-400 hover:via-yellow-400 hover:to-amber-400 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
          <Gift size={24} className="relative z-10" />
          <span className="relative z-10">🎁 领取奖励</span>
          <Gift size={24} className="relative z-10" />
        </button>
      </div>
    </div>
  );
}

function ExpeditionPanel() {
  const { expedition, logs } = useGameStore();

  const lastExpeditionLog = useMemo(() => {
    return logs.find((log) => log.message.includes('远征')) || null;
  }, [logs]);

  const getExpeditionState = () => {
    if (!expedition) return 'idle';
    if (expedition.rewardsReady) return 'rewards';
    return 'progress';
  };

  const state = getExpeditionState();

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1.5 h-8 bg-gradient-to-b from-amber-400 to-cyan-500 rounded-full" />
        <h2 className="font-title text-2xl md:text-3xl text-white drop-shadow">⚓ 远征管理</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-white/30 to-transparent" />
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold">
          {state === 'idle' && (
            <span className="text-gray-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              待命中
            </span>
          )}
          {state === 'progress' && (
            <span className="text-cyan-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              进行中
            </span>
          )}
          {state === 'rewards' && (
            <span className="text-amber-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              可领取
            </span>
          )}
        </div>
      </div>

      {state === 'idle' && <ExpeditionIdlePanel lastExpedition={lastExpeditionLog} />}
      {state === 'progress' && <ExpeditionProgressPanel />}
      {state === 'rewards' && <ExpeditionRewardPanel />}
    </div>
  );
}

function LogPanel() {
  const { logs } = useGameStore();
  const recentLogs = logs.slice(0, 10);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1.5 h-8 bg-gradient-to-b from-slate-400 to-slate-600 rounded-full" />
        <h2 className="font-title text-2xl md:text-3xl text-white drop-shadow">📋 远征日志</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-white/30 to-transparent" />
        <span className="text-white/40 text-sm">最近 10 条</span>
      </div>
      <div className="glass-card rounded-2xl p-4 card-shadow border border-white/10 max-h-80 overflow-y-auto custom-scrollbar">
        {recentLogs.length === 0 ? (
          <div className="text-center py-12 text-white/50 font-game">
            暂无日志记录
          </div>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log) => {
              const styles = logTypeStyles[log.type];
              const island = log.relatedIslandId ? getIslandById(log.relatedIslandId) : null;
              return (
                <div
                  key={log.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl transition-all duration-200',
                    styles.bg,
                    'hover:bg-opacity-30'
                  )}
                >
                  <div className={cn('w-2 h-2 rounded-full mt-2 flex-shrink-0', styles.dot)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      {island && (
                        <span className="text-sm" title={island.name}>
                          {island.emoji}
                        </span>
                      )}
                      <p className={cn('font-game text-sm leading-relaxed', styles.text)}>
                        {log.message}
                      </p>
                      {log.relatedDiscoveryId && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/30 text-purple-300 border border-purple-400/30">
                          ✨ 新发现
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-white/40 text-xs font-mono flex-shrink-0 mt-0.5">
                    {formatTime(log.timestamp)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function WelcomeBanner() {
  const { facilities, expedition } = useGameStore();
  const island = expedition ? getIslandById(expedition.islandId) : null;
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
  };

  const getExpeditionStatusText = () => {
    if (!expedition) return { text: '空闲中', color: 'text-gray-300', emoji: '💤' };
    if (expedition.rewardsReady) return { text: '奖励可领取', color: 'text-amber-300', emoji: '🎁' };
    return { text: '远征进行中', color: 'text-cyan-300', emoji: '⛵' };
  };

  const status = getExpeditionStatusText();

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 mb-8 border border-white/10 backdrop-blur-sm bg-gradient-to-br from-cyan-600/40 via-blue-600/30 to-indigo-700/40">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute top-1/2 right-1/4 text-[12rem] opacity-5 -translate-y-1/2 animate-pulse">
          ⚓
        </div>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-4xl md:text-5xl animate-bounce">⛵</span>
            <h1 className="font-title text-3xl md:text-5xl text-white drop-shadow-lg">
              码头营地
            </h1>
          </div>
          <p className="text-white/80 text-base md:text-lg leading-relaxed max-w-xl font-game mb-4">
            欢迎回到冒险岛码头！海风轻轻吹拂，远处的海浪奏起冒险的序曲。
            在这里整备物资、升级设施，为下一次伟大的远征做好准备吧！
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
              <Calendar size={18} className="text-cyan-300" />
              <div>
                <div className="text-white/60 text-xs">今日日期</div>
                <div className="text-white font-title text-sm md:text-base">{formatDate(currentDate)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
              <span className="text-xl">⚓</span>
              <div>
                <div className="text-white/60 text-xs">码头等级</div>
                <div className="text-cyan-300 font-title text-xl font-bold">Lv.{facilities.dock}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
              <span className="text-xl">{status.emoji}</span>
              <div>
                <div className="text-white/60 text-xs">远征状态</div>
                <div className={cn('font-title text-xl font-bold', status.color)}>
                  {island ? island.name : status.text}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Camp() {
  return (
    <div className="page-enter container mx-auto px-4 py-8 pb-16">
      <WelcomeBanner />

      <div className="mb-10">
        <ExpeditionPanel />
      </div>

      <div className="mb-10">
        <FacilityPanel />
      </div>

      <div className="mb-10">
        <OrderBoard />
      </div>

      <div>
        <LogPanel />
      </div>
    </div>
  );
}
