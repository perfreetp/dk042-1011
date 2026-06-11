import { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../store/useGameStore';
import { RECIPES } from '../data/recipes';
import { ITEMS, getItemById } from '../data/items';
import type { Recipe, Equipment, ResourceType, Rarity, Item, Pet, Egg } from '../types';
import { cn } from '@/lib/utils';

const RESOURCE_NAMES: Record<string, string> = {
  gold: '金币',
  ore: '矿石',
  herb: '草药',
  shell: '贝壳',
  exp: '经验',
};

const RESOURCE_EMOJI: Record<string, string> = {
  gold: '💰',
  ore: '⛏️',
  herb: '🌿',
  shell: '🐚',
  exp: '⭐',
};

const RARITY_NAMES: Record<Rarity, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

const ITEM_TYPE_NAMES: Record<string, string> = {
  consumable: '消耗品',
  material: '材料',
  tool: '工具',
  special: '特殊',
};

const rarityClass = (rarity: Rarity) => `rarity-${rarity}`;

interface CollectPoint {
  type: 'ore' | 'herb' | 'shell';
  name: string;
  emoji: string;
  gradient: string;
  bgColor: string;
  borderColor: string;
  shadowColor: string;
}

const COLLECT_POINTS: CollectPoint[] = [
  {
    type: 'ore',
    name: '矿洞',
    emoji: '⛏️',
    gradient: 'from-orange-500 via-amber-500 to-yellow-500',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/40',
    shadowColor: 'shadow-orange-500/30',
  },
  {
    type: 'herb',
    name: '药园',
    emoji: '🌿',
    gradient: 'from-emerald-500 via-green-500 to-lime-500',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/40',
    shadowColor: 'shadow-emerald-500/30',
  },
  {
    type: 'shell',
    name: '海滩',
    emoji: '🐚',
    gradient: 'from-cyan-500 via-sky-500 to-blue-500',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/40',
    shadowColor: 'shadow-cyan-500/30',
  },
];

const TOOL_SLOT_NAMES: Record<'ore' | 'herb' | 'shell', string> = {
  ore: '矿洞',
  herb: '药园',
  shell: '海滩',
};

const TOOL_SLOT_EMOJIS: Record<'ore' | 'herb' | 'shell', string> = {
  ore: '⛏️',
  herb: '🌿',
  shell: '🐚',
};

const TOOL_SLOT_MAP: Record<string, 'ore' | 'herb' | 'shell'> = {
  'miner-pickaxe': 'ore',
  'harvest-sickle': 'herb',
  'shell-net': 'shell',
};

const COLLECT_COOLDOWN = 3000;

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'warning' | 'info' | 'danger';
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto px-4 py-3 rounded-xl shadow-xl backdrop-blur-md border font-game text-sm max-w-sm animate-toast-in',
            toast.type === 'success' && 'bg-emerald-500/90 border-emerald-400 text-white',
            toast.type === 'warning' && 'bg-amber-500/90 border-amber-400 text-white',
            toast.type === 'info' && 'bg-sky-500/90 border-sky-400 text-white',
            toast.type === 'danger' && 'bg-red-500/90 border-red-400 text-white'
          )}
          onClick={() => onRemove(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, removeToast };
}

interface ToolSelectModalProps {
  slot: 'ore' | 'herb' | 'shell';
  onClose: () => void;
  onSelect: (itemId: string) => void;
  addToast: (msg: string, type?: Toast['type']) => void;
}

function ToolSelectModal({ slot, onClose, onSelect, addToast }: ToolSelectModalProps) {
  const inventory = useGameStore((s) => s.inventory);
  const equippedTools = useGameStore((s) => s.equippedTools);

  const availableTools = useMemo(() => {
    return ITEMS.filter((item) => {
      if (item.type !== 'tool') return false;
      const mappedSlot = TOOL_SLOT_MAP[item.id];
      if (mappedSlot !== slot) return false;
      const count = inventory[item.id] || 0;
      if (count <= 0) return false;
      const currentlyEquipped = equippedTools[slot];
      if (currentlyEquipped === item.id && count < 2) return false;
      return true;
    });
  }, [inventory, equippedTools, slot]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-purple-900/95 to-indigo-900/95 border-2 border-purple-400/50 rounded-2xl p-5 max-w-md w-full max-h-[80vh] overflow-y-auto card-shadow"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-title text-xl text-white flex items-center gap-2">
            <span className="text-2xl">{TOOL_SLOT_EMOJIS[slot]}</span>
            选择装备到{TOOL_SLOT_NAMES[slot]}
          </h4>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {availableTools.length > 0 ? (
          <div className="space-y-2">
            {availableTools.map((tool) => {
              const count = inventory[tool.id] || 0;
              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    onSelect(tool.id);
                    addToast(`装备了 ${tool.emoji}${tool.name} 到${TOOL_SLOT_NAMES[slot]}`, 'success');
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-purple-500/25 border border-white/10 hover:border-purple-400/50 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30 flex items-center justify-center text-3xl border border-purple-400/30 shrink-0">
                    {tool.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-title text-white text-base truncate">{tool.name}</div>
                    <div className="text-xs text-purple-300 font-game mt-0.5">
                      采集加成 +{tool.effect?.value || 0}
                    </div>
                    <div className="text-[10px] text-white/50 font-game mt-0.5">
                      稀有度：{RARITY_NAMES[tool.rarity]} · 背包数量：{count}
                    </div>
                  </div>
                  <span className="text-purple-300 text-xl opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="text-5xl mb-3 opacity-50">🎒</div>
            <p className="text-white/60 font-game mb-1">背包中没有匹配的工具</p>
            <p className="text-white/40 font-game text-xs">
              {slot === 'ore' ? '去制作台制作「矿工镐」吧~' : slot === 'herb' ? '去制作台制作「采集镰刀」吧~' : '去制作台制作「贝壳网兜」吧~'}
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 rounded-xl bg-white/10 text-white/70 text-sm font-game hover:bg-white/15 hover:text-white transition-all border border-white/10"
        >
          取消
        </button>
      </div>
    </div>
  );
}

interface CollectAnim {
  type: string;
  amount: number;
  key: number;
  breakdown: {
    base: number;
    workshop: number;
    tool: number;
    toolName?: string;
  };
}

function ResourceGathering({ addToast }: { addToast: (msg: string, type?: Toast['type']) => void }) {
  const resources = useGameStore((s) => s.resources);
  const facilities = useGameStore((s) => s.facilities);
  const collectResource = useGameStore((s) => s.collectResource);
  const getWarehouseCapacity = useGameStore((s) => s.getWarehouseCapacity);
  const getGatheringBonus = useGameStore((s) => s.getGatheringBonus);
  const equippedTools = useGameStore((s) => s.equippedTools);
  const equipTool = useGameStore((s) => s.equipTool);
  const unequipTool = useGameStore((s) => s.unequipTool);

  const [collectAnim, setCollectAnim] = useState<CollectAnim | null>(null);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [toolSelectSlot, setToolSelectSlot] = useState<'ore' | 'herb' | 'shell' | null>(null);
  const [collectResultModal, setCollectResultModal] = useState<{
    point: CollectPoint;
    amount: number;
    breakdown: CollectAnim['breakdown'];
  } | null>(null);

  const capacity = getWarehouseCapacity();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setCooldowns((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          if (next[key] <= now) {
            delete next[key];
          }
        }
        return next;
      });
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const handleCollect = (point: CollectPoint) => {
    const now = Date.now();
    if (cooldowns[point.type] && cooldowns[point.type] > now) return;
    if (resources[point.type] >= capacity) {
      addToast(`${TOOL_SLOT_NAMES[point.type]}仓库已满！`, 'warning');
      return;
    }

    setCooldowns((prev) => ({ ...prev, [point.type]: now + COLLECT_COOLDOWN }));

    const workshopBonus = Math.floor(facilities.workshop * 0.5);
    const toolBonus = getGatheringBonus(point.type);
    const equippedItemId = equippedTools[point.type];
    const equippedItem = equippedItemId ? getItemById(equippedItemId) : null;

    setTimeout(() => {
      const amount = collectResource(point.type);
      const base = Math.max(2, amount - workshopBonus - toolBonus);
      const breakdown = {
        base,
        workshop: workshopBonus,
        tool: toolBonus,
        toolName: equippedItem?.name,
      };
      setCollectAnim({
        type: point.type,
        amount,
        key: Date.now(),
        breakdown,
      });

      setCollectResultModal({
        point,
        amount,
        breakdown,
      });

      setTimeout(() => setCollectAnim(null), 2500);
      setTimeout(() => setCollectResultModal(null), 3000);
    }, 400);
  };

  const getCooldownPercent = (type: string) => {
    const now = Date.now();
    const endTime = cooldowns[type];
    if (!endTime || endTime <= now) return 0;
    const remaining = endTime - now;
    return (remaining / COLLECT_COOLDOWN) * 100;
  };

  const isOnCooldown = (type: string) => {
    return getCooldownPercent(type) > 0;
  };

  const handleEquipTool = (slot: 'ore' | 'herb' | 'shell', itemId: string) => {
    equipTool(slot, itemId);
  };

  const handleUnequipTool = (slot: 'ore' | 'herb' | 'shell') => {
    unequipTool(slot);
  };

  return (
    <>
      <div className="rounded-2xl p-5 md:p-6 card-shadow" style={{
        background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(251, 191, 36, 0.1) 50%, rgba(234, 88, 12, 0.15) 100%)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(251, 146, 60, 0.3)',
      }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-title text-2xl text-white flex items-center gap-2">
            <span className="text-3xl">⛏️</span> 资源采集区
          </h3>
          <div className="flex items-center gap-2 text-xs font-game text-white/70 bg-amber-900/30 px-3 py-1.5 rounded-lg border border-amber-600/30">
            <span>🏠 工坊 Lv.{facilities.workshop}</span>
            <span className="opacity-40">|</span>
            <span>📦 仓库容量 {capacity}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {COLLECT_POINTS.map((point) => {
            const current = resources[point.type];
            const percent = Math.min(100, (current / capacity) * 100);
            const onCooldown = isOnCooldown(point.type);
            const cooldownPercent = getCooldownPercent(point.type);
            const showAnim = collectAnim?.type === point.type;
            const isFull = current >= capacity;
            const equippedItemId = equippedTools[point.type];
            const equippedItem = equippedItemId ? getItemById(equippedItemId) : null;
            const workshopBonus = Math.floor(facilities.workshop * 0.5);
            const toolBonus = getGatheringBonus(point.type);
            const baseExpected = 4;
            const totalBonus = baseExpected + workshopBonus + toolBonus;

            return (
              <div
                key={point.type}
                className={cn(
                  'relative rounded-2xl p-5',
                  point.bgColor,
                  'border-2',
                  point.borderColor,
                  'overflow-hidden transition-all duration-300'
                )}
              >
                <div className="mb-4">
                  <div className={cn(
                    'rounded-xl p-4 border-2 transition-all',
                    equippedItem
                      ? 'bg-gradient-to-br from-purple-500/25 to-indigo-500/20 border-purple-400/50'
                      : 'bg-white/5 border-white/15 border-dashed'
                  )}>
                    {equippedItem ? (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-game text-purple-300/70 uppercase tracking-wider">已装备</span>
                          </div>
                          <span className="text-[10px] font-game bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full border border-purple-400/30">
                            🔧 {TOOL_SLOT_NAMES[point.type]}槽
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-400/40 to-indigo-500/40 flex items-center justify-center text-3xl border border-purple-300/50 shrink-0 shadow-lg shadow-purple-500/20">
                            {equippedItem.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-title text-white text-lg truncate">{equippedItem.name}</div>
                            <div className="text-sm font-game text-purple-200 mt-0.5 flex items-center gap-1">
                              <span className="text-emerald-300 font-bold">+{equippedItem.effect?.value || 0}</span>
                              <span>采集加成</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => setToolSelectSlot(point.type)}
                            className="flex-1 py-2 rounded-lg bg-white/15 text-white text-xs font-game hover:bg-white/25 border border-white/20 transition-all flex items-center justify-center gap-1.5"
                          >
                            🔄 更换装备
                          </button>
                          <button
                            onClick={() => {
                              handleUnequipTool(point.type);
                              addToast(`卸下了 ${equippedItem.emoji}${equippedItem.name}`, 'info');
                            }}
                            className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-200 text-xs font-game hover:bg-red-500/30 border border-red-400/30 transition-all flex items-center justify-center gap-1.5"
                          >
                            ⏏️ 卸下装备
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-game text-white/40 uppercase tracking-wider">未装备</span>
                          </div>
                          <span className="text-[10px] font-game bg-white/10 text-white/50 px-2 py-0.5 rounded-full border border-white/10">
                            🔧 {TOOL_SLOT_NAMES[point.type]}槽
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center text-3xl border-2 border-dashed border-white/20 shrink-0">
                            <span className="text-white/30">＋</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-title text-white/40 text-base">空槽位</div>
                            <div className="text-sm font-game text-white/30 mt-0.5">
                              装备工具提升采集效率
                            </div>
                          </div>
                          <button
                            onClick={() => setToolSelectSlot(point.type)}
                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-2xl font-bold shadow-lg shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center shrink-0"
                          >
                            ➕
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {showAnim && (
                  <div
                    key={collectAnim!.key}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
                    style={{ animation: 'floatUp 2.5s ease-out forwards' }}
                  >
                    <div className="font-title text-4xl text-white drop-shadow-lg text-center">
                      +{collectAnim!.amount} {point.emoji}
                    </div>
                  </div>
                )}

                {onCooldown && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0 flex items-center justify-center rounded-2xl">
                    <div className="text-center">
                      <div className="text-4xl mb-1 opacity-60">{point.emoji}</div>
                      <div className="font-game text-white/80 text-sm">冷却中...</div>
                      <div className="w-20 h-2 bg-black/40 rounded-full mt-2 overflow-hidden mx-auto">
                        <div
                          className={cn('h-full bg-gradient-to-r', point.gradient, 'transition-all duration-100')}
                          style={{ width: `${100 - cooldownPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="relative z-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-5xl drop-shadow-lg">{point.emoji}</div>
                    <div className="text-right">
                      <h4 className="font-title text-xl text-white">{point.name}</h4>
                      <p className="text-xs text-white/70 font-game">
                        {RESOURCE_NAMES[point.type]}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3 px-3 py-2 rounded-lg bg-black/25 border border-white/10">
                    <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-sm font-game text-white/90">
                      <span className="font-bold text-amber-300">共+{totalBonus}</span>
                      <span className="text-white/60">{point.emoji}</span>
                      <span className="text-white/50">(</span>
                      <span className="text-sky-300">基础{baseExpected}</span>
                      {workshopBonus > 0 && (
                        <>
                          <span className="text-white/40">+</span>
                          <span className="text-amber-300">工坊{workshopBonus}</span>
                        </>
                      )}
                      {toolBonus > 0 && equippedItem && (
                        <>
                          <span className="text-white/40">+</span>
                          <span className="text-purple-300">{equippedItem.name.replace(/[矿工采集贝壳网兜镐镰刀]/g, '').slice(0, 3) || '工具'}{toolBonus}</span>
                        </>
                      )}
                      <span className="text-white/50">)</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-white/80 mb-1.5 font-game">
                      <span>📦 当前库存</span>
                      <span>{current} / {capacity}</span>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full bg-gradient-to-r', point.gradient, 'transition-all duration-500')}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleCollect(point)}
                    disabled={onCooldown || isFull}
                    className={cn(
                      'w-full py-3 rounded-xl bg-gradient-to-r',
                      point.gradient,
                      'text-white font-title text-lg shadow-lg',
                      point.shadowColor,
                      'hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 relative overflow-hidden'
                    )}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isFull ? '📦 仓库已满' : onCooldown ? '⏱️ 冷却中' : `${point.emoji} 采集`}
                    </span>
                  </button>
                </div>

                {collectResultModal && collectResultModal.point.type === point.type && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex items-center justify-center rounded-2xl animate-fade-in">
                    <div className="bg-gradient-to-br from-amber-900/95 to-orange-900/95 border-2 border-amber-400/60 rounded-2xl p-5 text-center max-w-[85%] card-shadow animate-scale-in">
                      <div className="text-6xl mb-2 animate-bounce-in">{point.emoji}</div>
                      <div className="font-title text-3xl text-amber-300 mb-1">
                        +{collectResultModal.amount}
                      </div>
                      <div className="text-sm text-white/80 font-game mb-3">
                        获得{RESOURCE_NAMES[point.type]}
                      </div>
                      <div className="bg-black/30 rounded-xl px-3 py-2 border border-white/10">
                        <div className="text-xs font-game text-white/70 mb-1">加成分解</div>
                        <div className="flex flex-wrap items-center justify-center gap-1.5 text-sm font-game">
                          <span className="px-2 py-0.5 rounded bg-sky-500/25 text-sky-300 border border-sky-400/30">
                            基础 {collectResultModal.breakdown.base}
                          </span>
                          {collectResultModal.breakdown.workshop > 0 && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/25 text-amber-300 border border-amber-400/30">
                              工坊 +{collectResultModal.breakdown.workshop}
                            </span>
                          )}
                          {collectResultModal.breakdown.tool > 0 && (
                            <span className="px-2 py-0.5 rounded bg-purple-500/25 text-purple-300 border border-purple-400/30">
                              {collectResultModal.breakdown.toolName || '工具'} +{collectResultModal.breakdown.tool}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2">
          {(['gold', 'ore', 'herb', 'shell'] as ResourceType[]).map((type) => (
            <div
              key={type}
              className="bg-white/10 rounded-lg px-3 py-2.5 flex items-center justify-between border border-white/10"
            >
              <span className="text-2xl">{RESOURCE_EMOJI[type]}</span>
              <div className="text-right">
                <div className="text-xs text-white/60 font-game">{RESOURCE_NAMES[type]}</div>
                <div className="font-title text-white text-lg">{resources[type]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {toolSelectSlot && (
        <ToolSelectModal
          slot={toolSelectSlot}
          onClose={() => setToolSelectSlot(null)}
          onSelect={(itemId) => handleEquipTool(toolSelectSlot, itemId)}
          addToast={addToast}
        />
      )}
    </>
  );
}

interface CraftAnim {
  recipeId: string;
  key: number;
  itemEmoji?: string;
  itemName?: string;
  amount: number;
}

function RecipeCard({ recipe, onCraft, addToast }: { recipe: Recipe; onCraft: (recipeId: string) => void; addToast: (msg: string, type?: Toast['type']) => void }) {
  const resources = useGameStore((s) => s.resources);
  const facilities = useGameStore((s) => s.facilities);
  const equippedTools = useGameStore((s) => s.equippedTools);
  const inventory = useGameStore((s) => s.inventory);

  const workshopLevel = facilities.workshop;
  const levelEnough = workshopLevel >= recipe.requiredWorkshopLevel;

  const materialStatus = recipe.materials.map((mat) => ({
    ...mat,
    enough: resources[mat.type] >= mat.amount,
  }));
  const allMaterialsEnough = materialStatus.every((m) => m.enough);
  const canCraft = levelEnough && allMaterialsEnough;

  const outputItem = 'itemId' in recipe.output
    ? getItemById(recipe.output.itemId)
    : null;

  const isToolRecipe = outputItem?.type === 'tool';
  const isToolAlreadyEquipped = isToolRecipe && outputItem && Object.values(equippedTools).includes(outputItem.id);
  const hasToolInInventory = isToolRecipe && outputItem && (inventory[outputItem.id] || 0) > 0;

  return (
    <div
      className={cn(
        'rounded-xl p-4 card-shadow transition-all duration-300 border-2 relative overflow-hidden',
        canCraft
          ? 'bg-gradient-to-br from-amber-900/40 to-orange-900/30 border-amber-500/40 hover:border-amber-400/60'
          : 'bg-white/5 border-white/10 opacity-80'
      )}
    >
      {(isToolAlreadyEquipped || hasToolInInventory) && (
        <div className="absolute top-2 right-2 z-10">
          <span className="text-[10px] font-game bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30 backdrop-blur-sm">
            ✅ 已拥有该装备
          </span>
        </div>
      )}

      <div className="flex items-start gap-3 mb-3">
        <div className={cn(
          'w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0 relative',
          canCraft
            ? 'bg-gradient-to-br from-amber-400/30 to-orange-500/30 border border-amber-400/40'
            : 'bg-white/10 border border-white/10'
        )}>
          {recipe.emoji}
          {isToolRecipe && (
            <span className="absolute -bottom-1 -right-1 text-[10px] font-game bg-purple-500 text-white px-1.5 py-0.5 rounded-full shadow-lg leading-none">
              🔧
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-title text-lg text-white truncate">{recipe.name}</h4>
          <p className="text-[11px] text-white/60 font-game leading-snug line-clamp-2">{recipe.description}</p>
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            <span className={cn(
              'text-[10px] font-game px-1.5 py-0.5 rounded',
              levelEnough
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            )}>
              🔨 工坊 Lv.{recipe.requiredWorkshopLevel}
            </span>
            {outputItem && (
              <span className="text-[10px] font-game px-1.5 py-0.5 rounded bg-white/10 text-white/70 border border-white/10">
                {ITEM_TYPE_NAMES[outputItem.type]}
              </span>
            )}
            {isToolRecipe && (
              <span className="text-[10px] font-game px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                🔧 可装备
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mb-3">
        <div className="text-[10px] text-white/50 font-game mb-1.5">📜 材料需求</div>
        <div className="flex flex-wrap gap-1.5">
          {materialStatus.map((mat, i) => (
            <span
              key={i}
              className={cn(
                'text-xs font-game px-2 py-0.5 rounded-lg border',
                mat.enough
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-red-500/15 text-red-300 border-red-500/30'
              )}
            >
              {RESOURCE_EMOJI[mat.type]} {resources[mat.type]}/{mat.amount}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-3 bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/5">
        <div className="text-[10px] text-white/50 font-game mb-1">📦 产出</div>
        <div className="flex items-center gap-1.5 text-sm font-game">
          {outputItem ? (
            <span className="text-amber-300 flex items-center gap-1">
              <span className="text-lg">{outputItem.emoji}</span>
              {outputItem.name} ×{recipe.output.amount}
              {isToolRecipe && outputItem.effect && (
                <span className="text-[10px] text-purple-300 ml-1 bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-400/20">
                  采集+{outputItem.effect.value}
                </span>
              )}
            </span>
          ) : 'type' in recipe.output ? (
            <span className="text-amber-300 flex items-center gap-1">
              <span className="text-lg">{RESOURCE_EMOJI[recipe.output.type as string]}</span>
              {RESOURCE_NAMES[recipe.output.type as string]} ×{recipe.output.amount}
            </span>
          ) : null}
        </div>
      </div>

      <button
        onClick={() => {
          onCraft(recipe.id);
          if (outputItem) {
            addToast(`制作成功！获得 ${outputItem.emoji}${outputItem.name} ×${recipe.output.amount}`, 'success');
          }
        }}
        disabled={!canCraft}
        className={cn(
          'w-full py-2.5 rounded-lg font-game text-sm transition-all duration-200',
          canCraft
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-98'
            : 'bg-white/10 text-white/40 cursor-not-allowed'
        )}
      >
        {!levelEnough ? `🔒 工坊需 Lv.${recipe.requiredWorkshopLevel}` : !allMaterialsEnough ? '❌ 材料不足' : '🔨 开始制作'}
      </button>
    </div>
  );
}

function CraftingTable({ addToast }: { addToast: (msg: string, type?: Toast['type']) => void }) {
  const facilities = useGameStore((s) => s.facilities);
  const craftItem = useGameStore((s) => s.craftItem);
  const [filter, setFilter] = useState<'all' | 'consumable' | 'material' | 'tool'>('all');
  const [craftAnims, setCraftAnims] = useState<CraftAnim[]>([]);

  const handleCraft = (recipeId: string) => {
    const recipe = RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return;

    const success = craftItem(recipeId);
    if (success) {
      const outputItem = 'itemId' in recipe.output
        ? getItemById(recipe.output.itemId)
        : null;

      setCraftAnims((prev) => [
        ...prev,
        {
          recipeId,
          key: Date.now(),
          itemEmoji: outputItem?.emoji || ('type' in recipe.output ? RESOURCE_EMOJI[recipe.output.type as string] : ''),
          itemName: outputItem?.name || ('type' in recipe.output ? RESOURCE_NAMES[recipe.output.type as string] : ''),
          amount: recipe.output.amount,
        },
      ]);

      setTimeout(() => {
        setCraftAnims((prev) => prev.slice(1));
      }, 1500);
    } else {
      addToast('制作失败：材料不足或等级不够', 'warning');
    }
  };

  const filteredRecipes = RECIPES.filter((r) => {
    if (filter === 'all') return true;
    const outputItem = 'itemId' in r.output ? getItemById(r.output.itemId) : null;
    if (!outputItem) return false;
    return outputItem.type === filter;
  });

  return (
    <div className="rounded-2xl p-5 md:p-6 card-shadow relative" style={{
      background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.15) 0%, rgba(217, 119, 6, 0.1) 50%, rgba(194, 65, 12, 0.15) 100%)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(234, 88, 12, 0.3)',
    }}>
      {craftAnims.map((anim) => (
        <div
          key={anim.key}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
          style={{ animation: 'floatUp 1.5s ease-out forwards' }}
        >
          <div className="font-title text-3xl text-amber-300 drop-shadow-lg whitespace-nowrap">
            +{anim.amount} {anim.itemEmoji} {anim.itemName}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-title text-2xl text-white flex items-center gap-2">
          <span className="text-3xl">🔨</span> 道具制作台
        </h3>
        <div className="flex items-center gap-1 bg-orange-900/30 p-1 rounded-lg border border-orange-600/30 flex-wrap">
          {([
            { key: 'all', label: '全部' },
            { key: 'consumable', label: '消耗品' },
            { key: 'material', label: '材料' },
            { key: 'tool', label: '工具🔧' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-game transition-all duration-200',
                filter === key
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRecipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} onCraft={handleCraft} addToast={addToast} />
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-3 opacity-50">🔨</div>
          <p className="text-white/60 font-game">没有符合条件的配方</p>
        </div>
      )}
    </div>
  );
}

interface UseItemModalProps {
  item: Item;
  onClose: () => void;
  onUse: (targetId: string) => void;
}

function UseItemModal({ item, onClose, onUse }: UseItemModalProps) {
  const pets = useGameStore((s) => s.pets);
  const eggs = useGameStore((s) => s.eggs);

  const showPets = item.effect?.type === 'heal' || item.effect?.type === 'moodBoost' || item.effect?.type === 'staminaBoost';
  const showEggs = item.effect?.type === 'hatchBoost';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-amber-900/90 to-orange-900/90 border-2 border-amber-500/40 rounded-2xl p-5 max-w-md w-full max-h-[80vh] overflow-y-auto card-shadow"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-title text-xl text-white flex items-center gap-2">
            <span className="text-2xl">{item.emoji}</span>
            选择使用目标
          </h4>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <p className="text-white/70 text-sm font-game mb-4">{item.description}</p>

        {showPets && pets.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-white/60 font-game mb-2">🐾 宠物</div>
            <div className="space-y-2">
              {pets.map((pet) => {
                const canUse = item.effect?.type === 'heal'
                  ? pet.hp < pet.maxHp
                  : item.effect?.type === 'moodBoost'
                    ? pet.mood < 100
                    : item.effect?.type === 'staminaBoost'
                      ? pet.stamina < 100
                      : true;

                return (
                  <button
                    key={pet.id}
                    onClick={() => canUse && onUse(pet.id)}
                    disabled={!canUse}
                    className={cn(
                      'w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 text-left',
                      canUse
                        ? 'bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20'
                        : 'bg-white/5 border border-white/5 opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="text-3xl">{pet.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-title text-white truncate">{pet.name}</div>
                      <div className="text-xs text-white/60 font-game">
                        Lv.{pet.level} · {RARITY_NAMES[pet.rarity]}
                      </div>
                      {item.effect?.type === 'heal' && (
                        <div className="text-xs text-red-300 font-game mt-1">
                          ❤️ {pet.hp} / {pet.maxHp}
                        </div>
                      )}
                      {item.effect?.type === 'moodBoost' && (
                        <div className="text-xs text-yellow-300 font-game mt-1">
                          😊 心情: {pet.mood}/100
                        </div>
                      )}
                      {item.effect?.type === 'staminaBoost' && (
                        <div className="text-xs text-green-300 font-game mt-1">
                          ⚡ 体力: {pet.stamina}/100
                        </div>
                      )}
                    </div>
                    {canUse && <span className="text-amber-300 text-lg">→</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {showEggs && eggs.length > 0 && (
          <div>
            <div className="text-xs text-white/60 font-game mb-2">🥚 宠物蛋</div>
            <div className="space-y-2">
              {eggs.map((egg) => {
                const canUse = egg.progress < 100;

                return (
                  <button
                    key={egg.id}
                    onClick={() => canUse && onUse(egg.id)}
                    disabled={!canUse}
                    className={cn(
                      'w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 text-left',
                      canUse
                        ? 'bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20'
                        : 'bg-white/5 border border-white/5 opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="text-3xl">{egg.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-title text-white truncate">宠物蛋</div>
                      <div className="text-xs text-white/60 font-game">
                        {RARITY_NAMES[egg.rarity]} · {egg.type}属性
                      </div>
                      <div className="w-full bg-black/30 rounded-full h-2 mt-1.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all"
                          style={{ width: `${egg.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-white/50 font-game mt-0.5">
                        孵化进度: {egg.progress}%
                      </div>
                    </div>
                    {canUse && <span className="text-amber-300 text-lg">→</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {showPets && pets.length === 0 && showEggs && eggs.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2 opacity-50">📦</div>
            <p className="text-white/50 font-game text-sm">暂无可使用的目标</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface EquipSlotSelectModalProps {
  item: Item;
  onClose: () => void;
  onSelect: (slot: 'ore' | 'herb' | 'shell') => void;
  addToast: (msg: string, type?: Toast['type']) => void;
}

function EquipSlotSelectModal({ item, onClose, onSelect, addToast }: EquipSlotSelectModalProps) {
  const equippedTools = useGameStore((s) => s.equippedTools);
  const correctSlot = TOOL_SLOT_MAP[item.id];

  const slots: { key: 'ore' | 'herb' | 'shell'; name: string; emoji: string }[] = [
    { key: 'ore', name: '矿洞', emoji: '⛏️' },
    { key: 'herb', name: '药园', emoji: '🌿' },
    { key: 'shell', name: '海滩', emoji: '🐚' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-purple-900/95 to-indigo-900/95 border-2 border-purple-400/50 rounded-2xl p-5 max-w-md w-full card-shadow"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-title text-xl text-white flex items-center gap-2">
            <span className="text-2xl">{item.emoji}</span>
            装备到哪个采集位？
          </h4>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="bg-white/10 rounded-xl p-3 mb-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30 flex items-center justify-center text-3xl border border-purple-400/30 shrink-0">
              {item.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-title text-white">{item.name}</div>
              <div className="text-xs text-purple-300 font-game">
                采集加成 +{item.effect?.value || 0} · 推荐：{correctSlot ? TOOL_SLOT_NAMES[correctSlot] : '未知'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {slots.map((slot) => {
            const isCorrect = correctSlot === slot.key;
            const isEquippedHere = equippedTools[slot.key] === item.id;

            return (
              <button
                key={slot.key}
                onClick={() => {
                  if (!isCorrect) {
                    addToast(`${item.name}不适合装备到${slot.name}哦~`, 'warning');
                    return;
                  }
                  onSelect(slot.key);
                  addToast(`装备了 ${item.emoji}${item.name} 到${slot.name}`, 'success');
                  onClose();
                }}
                disabled={!isCorrect}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                  isCorrect
                    ? isEquippedHere
                      ? 'bg-emerald-500/25 border-emerald-400/50 hover:bg-emerald-500/35 cursor-pointer'
                      : 'bg-purple-500/25 border-purple-400/50 hover:bg-purple-500/35 hover:scale-105 cursor-pointer'
                    : 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
                )}
              >
                <span className="text-3xl">{slot.emoji}</span>
                <span className="text-sm font-title text-white">{slot.name}</span>
                {!isCorrect && (
                  <span className="text-[10px] font-game text-red-300">类型不匹配</span>
                )}
                {isEquippedHere && (
                  <span className="text-[10px] font-game text-emerald-300">✅ 已在此槽</span>
                )}
                {isCorrect && !isEquippedHere && (
                  <span className="text-[10px] font-game text-purple-300">✨ 推荐</span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-white/10 text-white/70 text-sm font-game hover:bg-white/15 hover:text-white transition-all border border-white/10"
        >
          取消
        </button>
      </div>
    </div>
  );
}

function InventoryBag({ addToast }: { addToast: (msg: string, type?: Toast['type']) => void }) {
  const inventory = useGameStore((s) => s.inventory);
  const useItem = useGameStore((s) => s.useItem);
  const equipTool = useGameStore((s) => s.equipTool);
  const equippedTools = useGameStore((s) => s.equippedTools);

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [equipSelectItem, setEquipSelectItem] = useState<Item | null>(null);

  const ownedItems = ITEMS.filter((item) => (inventory[item.id] || 0) > 0);
  const totalTypes = ownedItems.length;

  const gridSize = Math.max(12, Math.ceil(totalTypes / 4) * 4);
  const emptySlots = Array.from({ length: Math.max(0, gridSize - totalTypes) }, (_, i) => i);

  const handleItemClick = (item: Item) => {
    if (item.type === 'consumable' && item.effect) {
      setSelectedItem(item);
    } else if (item.type === 'tool') {
      setEquipSelectItem(item);
    }
  };

  const handleUseItem = (targetId: string) => {
    if (!selectedItem) return;
    const success = useItem(selectedItem.id, targetId);
    if (success) {
      addToast(`使用了 ${selectedItem.emoji}${selectedItem.name}`, 'success');
    } else {
      addToast('使用失败：条件不满足', 'warning');
    }
    setSelectedItem(null);
  };

  const getEquippedSlotForItem = (itemId: string): 'ore' | 'herb' | 'shell' | undefined => {
    for (const slot of ['ore', 'herb', 'shell'] as const) {
      if (equippedTools[slot] === itemId) return slot;
    }
    return undefined;
  };

  return (
    <>
      <div className="rounded-2xl p-5 md:p-6 card-shadow" style={{
        background: 'linear-gradient(135deg, rgba(180, 83, 9, 0.15) 0%, rgba(146, 64, 14, 0.1) 50%, rgba(120, 53, 15, 0.15) 100%)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(180, 83, 9, 0.3)',
      }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-title text-2xl text-white flex items-center gap-2">
            <span className="text-3xl">🎒</span> 道具背包
          </h3>
          <span className="text-xs font-game text-white/70 bg-yellow-900/30 px-3 py-1.5 rounded-lg border border-yellow-600/30">
            背包物品：{totalTypes}种
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {ownedItems.map((item) => {
            const count = inventory[item.id] || 0;
            const isConsumable = item.type === 'consumable';
            const isTool = item.type === 'tool';
            const isLuckyCharm = item.id === 'lucky-charm';
            const equippedSlot = isTool ? getEquippedSlotForItem(item.id) : undefined;

            return (
              <div
                key={item.id}
                className="relative group"
              >
                <div
                  className={cn(
                    'aspect-square rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition-all duration-200 hover:scale-105',
                    rarityClass(item.rarity),
                    isLuckyCharm && 'ring-2 ring-purple-400/70'
                  )}
                  style={{ background: undefined }}
                  onClick={() => handleItemClick(item)}
                >
                  <div
                    className="w-full h-full rounded-lg flex items-center justify-center relative"
                    style={{
                      background: isLuckyCharm
                        ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(139, 92, 246, 0.15) 50%, rgba(168, 85, 247, 0.25) 100%)'
                        : isTool
                          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(255,255,255,0.05) 100%)'
                          : 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                    }}
                  >
                    <span className="text-2xl md:text-3xl">{item.emoji}</span>
                    {isLuckyCharm && (
                      <span className="absolute top-0 right-0 text-[10px]">✨</span>
                    )}
                  </div>
                </div>

                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-game px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-lg">
                  ×{count}
                </div>

                {equippedSlot && (
                  <div className="absolute -top-1 -left-1 bg-emerald-500 text-white text-[8px] font-game px-1.5 py-0.5 rounded-full shadow-lg leading-none whitespace-nowrap">
                    🔧 已装备: {TOOL_SLOT_NAMES[equippedSlot]}
                  </div>
                )}

                {!equippedSlot && isTool && (
                  <div className="absolute -top-1 -left-1 bg-purple-500 text-white text-[8px] font-game px-1 py-0.5 rounded-full shadow-lg leading-none cursor-pointer hover:bg-purple-600 transition-colors z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEquipSelectItem(item);
                    }}
                    title="装备到工坊"
                  >
                    ➕🔧
                  </div>
                )}

                {isLuckyCharm && !equippedSlot && (
                  <div className="absolute -top-1 -left-1 bg-purple-500 text-white text-[8px] font-game px-1 py-0.5 rounded-full shadow-lg leading-none">
                    🍀
                  </div>
                )}

                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-10">
                  <div className="bg-black/90 backdrop-blur-sm rounded-lg p-2 border border-white/20 text-center whitespace-nowrap min-w-[120px]">
                    <div className="font-title text-white text-sm">{item.name}</div>
                    <div className="text-[10px] text-white/60 font-game">
                      {RARITY_NAMES[item.rarity]} · {ITEM_TYPE_NAMES[item.type]}
                    </div>
                    <div className="text-[10px] text-white/70 font-game mt-1 max-w-[150px] whitespace-normal">
                      {item.description}
                    </div>
                    {isConsumable && (
                      <div className="text-[10px] text-amber-300 font-game mt-1">💊 点击使用</div>
                    )}
                    {isTool && (
                      <div className="text-[10px] text-purple-300 font-game mt-1">
                        🔧 {equippedSlot ? `已装备在${TOOL_SLOT_NAMES[equippedSlot]}` : '点击装备到工坊'}
                      </div>
                    )}
                    {isLuckyCharm && (
                      <div className="text-[10px] text-emerald-300 font-game mt-1">🍀 出征消耗品（Battle/Map页）</div>
                    )}
                    {item.effect?.type === 'gatheringBonus' && (
                      <div className="text-[10px] text-emerald-300 font-game mt-1">
                        采集加成 +{item.effect.value}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {emptySlots.map((_, i) => (
            <div
              key={`empty-${i}`}
              className="aspect-square rounded-xl border-2 border-dashed border-white/10 bg-white/5 opacity-40"
            />
          ))}
        </div>

        {totalTypes === 0 && (
          <div className="text-center py-8">
            <div className="text-5xl mb-3 opacity-50">🎒</div>
            <p className="text-white/60 font-game">背包空空如也，去制作一些道具吧！</p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-game">
          <span className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-400/20">
            ➕🔧 工具可点击徽章快速装备
          </span>
          <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/20">
            🔧 已装备: XX 表示正在某槽位使用
          </span>
          <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/20">
            🍀 幸运符在远征/战斗时消耗
          </span>
        </div>
      </div>

      {selectedItem && (
        <UseItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUse={handleUseItem}
        />
      )}

      {equipSelectItem && (
        <EquipSlotSelectModal
          item={equipSelectItem}
          onClose={() => setEquipSelectItem(null)}
          onSelect={(slot) => equipTool(slot, equipSelectItem.id)}
          addToast={addToast}
        />
      )}
    </>
  );
}

function EquipmentCard({ equipment }: { equipment: Equipment }) {
  const resources = useGameStore((s) => s.resources);
  const repairEquipment = useGameStore((s) => s.repairEquipment);

  const damage = equipment.maxDurability - equipment.durability;
  const repairCost = Math.ceil(damage * 0.5);
  const isFullDurability = equipment.durability >= equipment.maxDurability;
  const canRepair = !isFullDurability && resources.gold >= repairCost;
  const durPercent = (equipment.durability / equipment.maxDurability) * 100;

  const typeName = equipment.type === 'weapon' ? '武器' : equipment.type === 'armor' ? '护甲' : '饰品';
  const typeEmoji = equipment.type === 'weapon' ? '⚔️' : equipment.type === 'armor' ? '🛡️' : '💍';

  return (
    <div className={cn('rounded-xl p-4 card-shadow border-2', rarityClass(equipment.rarity))}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-14 h-14 rounded-xl bg-white/15 flex items-center justify-center text-3xl shrink-0 border border-white/20">
          {equipment.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h4 className="font-title text-lg text-white truncate">{equipment.name}</h4>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-game text-white/80 bg-black/20 px-1.5 py-0.5 rounded">
              {typeEmoji} {typeName}
            </span>
            <span className="text-[10px] font-game text-white/90 bg-black/20 px-1.5 py-0.5 rounded">
              {RARITY_NAMES[equipment.rarity]}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {Object.entries(equipment.stats).map(([stat, value]) => {
          if (!value) return null;
          const statMap: Record<string, { name: string; emoji: string }> = {
            attack: { name: '攻击', emoji: '⚔️' },
            defense: { name: '防御', emoji: '🛡️' },
            speed: { name: '速度', emoji: '💨' },
            hp: { name: '生命', emoji: '❤️' },
          };
          const info = statMap[stat];
          return (
            <span
              key={stat}
              className="text-xs font-game bg-white/15 text-white px-2 py-0.5 rounded border border-white/10"
            >
              {info?.emoji} {info?.name} +{value}
            </span>
          );
        })}
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-white/80 mb-1.5 font-game">
          <span>🔧 耐久度</span>
          <span className={durPercent < 30 ? 'text-red-400' : ''}>
            {equipment.durability} / {equipment.maxDurability}
          </span>
        </div>
        <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              durPercent >= 70 ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                : durPercent >= 40 ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
                : 'bg-gradient-to-r from-red-500 to-rose-500'
            )}
            style={{ width: `${durPercent}%` }}
          />
        </div>
      </div>

      {isFullDurability ? (
        <div className="w-full py-2.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-game text-sm text-center border border-emerald-500/30">
          ✨ 无需修复
        </div>
      ) : (
        <button
          onClick={() => repairEquipment(equipment.id)}
          disabled={!canRepair}
          className={cn(
            'w-full py-2.5 rounded-lg font-game text-sm transition-all duration-200',
            canRepair
              ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-amber-900 shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 hover:scale-[1.02] active:scale-98'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          )}
        >
          <div className="flex items-center justify-center gap-1.5">
            <span>🔧 修复</span>
            <span className={!canRepair ? 'text-red-300' : ''}>💰 {repairCost}</span>
          </div>
        </button>
      )}
    </div>
  );
}

function RepairStation() {
  const equipment = useGameStore((s) => s.equipment);

  return (
    <div className="rounded-2xl p-5 md:p-6 card-shadow" style={{
      background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.15) 0%, rgba(180, 83, 9, 0.1) 50%, rgba(146, 64, 14, 0.15) 100%)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(217, 119, 6, 0.3)',
    }}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-title text-2xl text-white flex items-center gap-2">
          <span className="text-3xl">🔧</span> 装备修复站
        </h3>
        <span className="text-xs font-game text-white/70 bg-yellow-900/30 px-3 py-1.5 rounded-lg border border-yellow-600/30">
          🛡️ 装备数量: {equipment.length}
        </span>
      </div>

      {equipment.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipment.map((eq) => (
            <EquipmentCard key={eq.id} equipment={eq} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-5xl mb-3 opacity-50">🔧</div>
          <p className="text-white/60 font-game">暂时没有装备，去远征中获取吧！</p>
        </div>
      )}

      <div className="mt-4 text-xs text-white/50 font-game bg-white/5 rounded-lg px-3 py-2 border border-white/5">
        💡 提示：修复费用 = 损坏耐久度 × 0.5 金币
      </div>
    </div>
  );
}

export default function Workshop() {
  const { toasts, addToast, removeToast } = useToast();
  const saveToStorage = useGameStore((s) => s.saveToStorage);
  const [hasCheckedConsistency, setHasCheckedConsistency] = useState(false);

  useEffect(() => {
    if (!hasCheckedConsistency) {
      setHasCheckedConsistency(true);
      try {
        const inventoryBefore = JSON.stringify(useGameStore.getState().inventory);
        saveToStorage();
        const inventoryAfter = JSON.stringify(useGameStore.getState().inventory);
        if (inventoryBefore !== inventoryAfter) {
          addToast('🔧 已自动修正装备和背包数量不一致', 'warning');
        }
      } catch (e) {
        console.error('[Workshop] 一致性校验出错:', e);
      }
    }
  }, [hasCheckedConsistency, saveToStorage, addToast]);

  return (
    <div className="page-enter container mx-auto px-4 py-6 space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="rounded-2xl p-6 card-shadow" style={{
        background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.2) 0%, rgba(251, 191, 36, 0.15) 50%, rgba(234, 88, 12, 0.2) 100%)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(251, 146, 60, 0.35)',
      }}>
        <h2 className="font-title text-3xl md:text-4xl text-white mb-2 drop-shadow flex items-center gap-3">
          <span className="text-4xl">🔨</span> 采集工坊
        </h2>
        <p className="text-white/80 text-base leading-relaxed font-game">
          采集珍贵资源、制作强力道具、修复受损装备！升级工坊解锁更多高级配方~
        </p>
      </div>

      <ResourceGathering addToast={addToast} />
      <CraftingTable addToast={addToast} />
      <InventoryBag addToast={addToast} />
      <RepairStation />

      <style>{`
        @keyframes floatUp {
          0% {
            opacity: 0;
            transform: translate(-50%, -30%) scale(0.5);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, -60%) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -150%) scale(1);
          }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.3); }
          50% { transform: scale(1.1); }
          70% { transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes toast-in {
          0% { opacity: 0; transform: translateX(100%); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
        .animate-bounce-in { animation: bounce-in 0.5s ease-out forwards; }
        .animate-toast-in { animation: toast-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}
