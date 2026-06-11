import { useNavigate } from 'react-router-dom';
import { ArrowRight, RefreshCw, Check, Ship, Anchor, Package, Hammer, Egg, Clock, Map } from 'lucide-react';
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
import type { FacilityType, ResourceType, Order, LogEntry } from '@/types';
import { useMemo, useState, useEffect } from 'react';

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

function ExpeditionStatus() {
  const { expedition, team, pets, cancelExpedition } = useGameStore();
  const navigate = useNavigate();
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const island = expedition ? getIslandById(expedition.islandId) : null;
  const teamPets = pets.filter((p) => team.includes(p.id));

  if (!expedition || !island) {
    return (
      <div
        className="rounded-2xl p-6 border backdrop-blur-sm bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-cyan-400/30 cursor-pointer hover:scale-[1.01] transition-all duration-300"
        onClick={() => navigate('/map')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-4xl">
              🚢
            </div>
            <div>
              <h3 className="font-title text-xl text-cyan-300 mb-1">远征待命中</h3>
              <p className="text-white/70 text-sm">
                当前没有进行中的远征，前往地图选择岛屿开始冒险吧！
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-title font-bold shadow-lg shadow-cyan-500/30">
            <Map size={20} />
            去组队
            <ArrowRight size={18} />
          </div>
        </div>
      </div>
    );
  }

  const elapsed = Date.now() - expedition.startTime;
  const totalDuration = island.duration;
  const progress = Math.min(100, (elapsed / totalDuration) * 100);
  const remaining = Math.max(0, totalDuration - elapsed);

  return (
    <div className="rounded-2xl p-6 border backdrop-blur-sm bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-400/30 relative overflow-hidden">
      <div className="absolute top-0 right-0 text-9xl opacity-10 -translate-y-8 translate-x-8 pointer-events-none">
        ⛵
      </div>
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-4xl animate-bounce">
              {island.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-title text-xl text-white">{island.name}</h3>
                <span className={cn(
                  'px-2.5 py-0.5 rounded-full text-xs font-bold',
                  EXPEDITION_STATUS_COLORS[expedition.status],
                  'bg-black/30'
                )}>
                  <Ship size={10} className="inline mr-1" />
                  {EXPEDITION_STATUS_NAMES[expedition.status]}
                </span>
              </div>
              <div className="text-white/70 text-sm">{island.description}</div>
            </div>
          </div>
          <button
            onClick={cancelExpedition}
            className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-300 font-game text-sm transition-all duration-300 border border-red-400/30"
          >
            取消远征
          </button>
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-white/70 flex items-center gap-1">
              <Anchor size={14} className={EXPEDITION_STATUS_COLORS[expedition.status]} />
              远征进度
            </span>
            <span className="text-white font-bold">
              {formatTimeShort(remaining)} 剩余
            </span>
          </div>
          <div className="h-4 rounded-full bg-black/30 overflow-hidden border border-white/10">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500 relative',
                'bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500'
              )}
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
          <div className="text-right text-xs text-white/50 mt-1">
            {progress.toFixed(1)}%
          </div>
        </div>

        {teamPets.length > 0 && (
          <div>
            <div className="text-white/70 text-sm mb-2">出征队伍</div>
            <div className="flex flex-wrap gap-2">
              {teamPets.map((pet) => (
                <div
                  key={pet.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/10"
                >
                  <span className="text-2xl">{pet.emoji}</span>
                  <div>
                    <div className="text-white text-sm font-bold">{pet.name}</div>
                    <div className="text-white/50 text-xs">Lv.{pet.level}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => navigate('/map')}
          className="w-full mt-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-title font-bold text-lg hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Ship size={18} />
          查看远征详情
        </button>
      </div>
    </div>
  );
}

function LogPanel() {
  const { logs } = useGameStore();
  const recentLogs = logs.slice(0, 5);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1.5 h-8 bg-gradient-to-b from-slate-400 to-slate-600 rounded-full" />
        <h2 className="font-title text-2xl md:text-3xl text-white drop-shadow">📋 活动日志</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-white/30 to-transparent" />
      </div>
      <div className="glass-card rounded-2xl p-5 card-shadow border border-white/10">
        {recentLogs.length === 0 ? (
          <div className="text-center py-8 text-white/50 font-game">
            暂无日志记录
          </div>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log) => {
              const styles = logTypeStyles[log.type];
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
                    <p className={cn('font-game text-sm leading-relaxed', styles.text)}>
                      {log.message}
                    </p>
                  </div>
                  <div className="text-white/40 text-xs font-mono flex-shrink-0">
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
              <span className="text-xl">⚓</span>
              <div>
                <div className="text-white/60 text-xs">码头等级</div>
                <div className="text-cyan-300 font-title text-xl font-bold">Lv.{facilities.dock}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
              <span className="text-xl">📦</span>
              <div>
                <div className="text-white/60 text-xs">仓库等级</div>
                <div className="text-amber-300 font-title text-xl font-bold">Lv.{facilities.warehouse}</div>
              </div>
            </div>
            {expedition && island ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500/30 to-teal-500/30 border border-emerald-400/30 backdrop-blur-sm">
                <span className="text-xl animate-pulse">{island.emoji}</span>
                <div>
                  <div className="text-white/60 text-xs">远征中</div>
                  <div className="text-emerald-300 font-title text-xl font-bold">{island.name}</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
                <span className="text-xl">🏝️</span>
                <div>
                  <div className="text-white/60 text-xs">远征状态</div>
                  <div className="text-white/80 font-title text-xl font-bold">待命中</div>
                </div>
              </div>
            )}
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
        <ExpeditionStatus />
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
