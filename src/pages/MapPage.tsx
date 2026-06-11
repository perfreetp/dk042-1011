import { useState, useMemo, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { ISLANDS } from '../data/islands';
import { MONSTER_TEMPLATES } from '../data/monsters';
import { cn } from '@/lib/utils';
import {
  RESOURCE_NAMES,
  RESOURCE_EMOJIS,
  getProgressColor,
  getMoodEmoji,
} from '../utils/formatters';
import type { Island } from '../types';

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
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, removeToast };
}

interface ExpeditionResultModalProps {
  island: Island;
  usedLuckyCharm: boolean;
  durationSeconds: number;
  onClose: () => void;
}

function ExpeditionResultModal({ island, usedLuckyCharm, durationSeconds, onClose }: ExpeditionResultModalProps) {
  const mins = Math.floor(durationSeconds / 60);
  const secs = durationSeconds % 60;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-amber-900/95 to-orange-900/95 border-2 border-amber-400/60 rounded-2xl p-6 max-w-md w-full card-shadow animate-scale-in text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-6xl mb-3 animate-bounce-in">🚢</div>
        <h3 className="font-title text-2xl md:text-3xl text-amber-300 mb-2">
          远征队出发！
        </h3>
        <div className="text-white/80 font-game mb-4">
          前往 <span className="text-amber-200 font-bold">{island.emoji}{island.name}</span>
        </div>

        <div className="space-y-3 mb-5">
          <div className="bg-black/30 rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-sm font-game">
              <span className="text-white/70">🍀 幸运符</span>
              <span className={usedLuckyCharm ? 'text-emerald-300 font-bold' : 'text-white/50'}>
                {usedLuckyCharm ? '✅ 已使用（发现概率大幅提升）' : '❌ 未使用'}
              </span>
            </div>
          </div>

          <div className="bg-black/30 rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between text-sm font-game">
              <span className="text-white/70">⏱️ 预计耗时</span>
              <span className="text-sky-300 font-bold">
                {mins > 0 ? `${mins}分` : ''}{secs}秒
              </span>
            </div>
            <div className="w-full bg-black/40 rounded-full h-2 mt-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-sky-400 to-cyan-400 w-1/12 animate-pulse" />
            </div>
          </div>

          <div className="bg-emerald-500/15 rounded-xl p-3 border border-emerald-400/30">
            <div className="flex items-center gap-2 text-sm font-game text-emerald-300">
              <span>📢</span>
              <span>可前往码头营地查看进度</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-title text-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-98 transition-all"
        >
          知道啦！
        </button>
      </div>
    </div>
  );
}

export default function MapPage() {
  const {
    islandProgress,
    expedition,
    team,
    pets,
    resources,
    inventory,
    startExpedition,
    checkAndUnlockIslands,
  } = useGameStore();

  const { toasts, addToast, removeToast } = useToast();

  const [selectedIsland, setSelectedIsland] = useState<Island | null>(null);
  const [useLuckyCharm, setUseLuckyCharm] = useState(false);
  const [expeditionResult, setExpeditionResult] = useState<{
    island: Island;
    usedLuckyCharm: boolean;
    durationSeconds: number;
  } | null>(null);

  const luckyCharmCount = inventory['lucky-charm'] || 0;

  useEffect(() => {
    if (luckyCharmCount === 0 && useLuckyCharm) {
      setUseLuckyCharm(false);
    }
  }, [luckyCharmCount, useLuckyCharm]);

  const unlockMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    const pendingUnlocks = checkAndUnlockIslands();
    ISLANDS.forEach((island) => {
      if (island.unlocked) {
        map[island.id] = true;
      } else if (island.unlockRequirement) {
        const progress = islandProgress[island.unlockRequirement.islandId] || 0;
        map[island.id] =
          progress >= island.unlockRequirement.progress ||
          pendingUnlocks.includes(island.id);
      } else {
        map[island.id] = false;
      }
    });
    return map;
  }, [islandProgress, checkAndUnlockIslands]);

  const teamPets = useMemo(() => {
    return team
      .map((id) => pets.find((p) => p.id === id))
      .filter(Boolean);
  }, [team, pets]);

  const getMonsterInfo = (monsterId: string) => {
    return MONSTER_TEMPLATES.find((m) => m.id === monsterId);
  };

  const handleStartExpedition = (island: Island) => {
    if (useLuckyCharm) {
      if (luckyCharmCount < 1) {
        addToast('⚠️ 幸运符不足！无法使用幸运符远征', 'warning');
        setUseLuckyCharm(false);
        return;
      }
    }

    const durationSeconds = 30 + island.level * 15;
    const success = startExpedition(island.id, useLuckyCharm);
    if (success) {
      setExpeditionResult({
        island,
        usedLuckyCharm: useLuckyCharm,
        durationSeconds,
      });
      setSelectedIsland(null);
      setUseLuckyCharm(false);
    } else {
      addToast('远征启动失败，请检查条件是否满足', 'danger');
    }
  };

  const getExpeditionCost = (level: number) => 20 + level * 10;

  const routes = useMemo(() => {
    const lines: { from: Island; to: Island }[] = [];
    ISLANDS.forEach((island) => {
      if (island.unlockRequirement) {
        const fromIsland = ISLANDS.find(
          (i) => i.id === island.unlockRequirement!.islandId
        );
        if (fromIsland) {
          lines.push({ from: fromIsland, to: island });
        }
      }
    });
    return lines;
  }, []);

  return (
    <div className="page-enter container mx-auto px-4 py-6 md:py-8 relative">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="mb-6">
        <h2 className="font-title text-3xl md:text-4xl text-white mb-2 drop-shadow">
          🗺️ 远征地图
        </h2>
        <p className="text-white/80 text-base md:text-lg font-game">
          探索冒险岛的神秘海域，派遣你的宠物远征队发现宝藏与秘密！
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="glass-card rounded-2xl p-4 md:p-6 card-shadow">
            <div
              className="relative w-full rounded-xl overflow-hidden border-4 border-amber-700 shadow-inner"
              style={{
                aspectRatio: '16/10',
                background:
                  'linear-gradient(135deg, #87CEEB 0%, #4A90A4 30%, #2E6B7A 60%, #1A4A5A 100%)',
              }}
            >
              <div className="absolute inset-0 bg-parchment opacity-90"></div>

              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {routes.map((route, idx) => (
                  <line
                    key={idx}
                    x1={route.from.x}
                    y1={route.from.y}
                    x2={route.to.x}
                    y2={route.to.y}
                    stroke={
                      unlockMap[route.to.id]
                        ? '#D97706'
                        : '#9CA3AF'
                    }
                    strokeWidth="0.4"
                    strokeDasharray="2,1.5"
                    opacity={unlockMap[route.to.id] ? 0.8 : 0.4}
                  />
                ))}
              </svg>

              {ISLANDS.map((island) => {
                const isUnlocked = unlockMap[island.id];
                const isExpeditionHere =
                  expedition?.islandId === island.id;
                const progress = islandProgress[island.id] || 0;
                const isSelected = selectedIsland?.id === island.id;

                return (
                  <button
                    key={island.id}
                    onClick={() => setSelectedIsland(island)}
                    className={cn(
                      'absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 transition-all duration-300',
                      isUnlocked ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed',
                      isSelected && 'scale-110 z-30'
                    )}
                    style={{
                      left: `${island.x}%`,
                      top: `${island.y}%`,
                    }}
                  >
                    <div className="relative">
                      <div
                        className={cn(
                          'flex items-center justify-center rounded-full transition-all duration-300',
                          isUnlocked
                            ? 'bg-gradient-to-br from-amber-200 to-amber-400 border-4 border-amber-600 shadow-lg'
                            : 'bg-gray-300 border-4 border-gray-500 opacity-70 grayscale'
                        )}
                        style={{
                          width: 'clamp(3rem, 5vw, 4rem)',
                          height: 'clamp(3rem, 5vw, 4rem)',
                          fontSize: 'clamp(1.5rem, 2.5vw, 2.2rem)',
                        }}
                      >
                        {isUnlocked ? island.emoji : '🔒'}
                      </div>

                      {isExpeditionHere && (
                        <div
                          className="absolute -top-3 -right-3 text-2xl animate-sail z-40"
                          style={{ fontSize: 'clamp(1rem, 1.8vw, 1.5rem)' }}
                        >
                          🚢
                        </div>
                      )}

                      {island.id !== 'island-home' && (
                        <div
                          className={cn(
                            'absolute -top-1 -left-1 rounded-full px-1.5 py-0.5 text-xs font-bold border-2 border-white shadow-md',
                            isUnlocked
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                              : 'bg-gray-500 text-gray-200'
                          )}
                        >
                          Lv.{island.level}
                        </div>
                      )}
                    </div>

                    <div
                      className={cn(
                        'mt-1 px-2 py-0.5 rounded-md text-xs md:text-sm font-game whitespace-nowrap shadow',
                        isUnlocked
                          ? 'bg-white/90 text-amber-900'
                          : 'bg-gray-400/80 text-gray-700'
                      )}
                    >
                      {island.name}
                    </div>

                    {isUnlocked && island.id !== 'island-home' && (
                      <div className="w-10 md:w-14 h-1.5 bg-gray-300/80 rounded-full mt-1 overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-500', getProgressColor(progress))}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    )}
                  </button>
                );
              })}

              <div className="absolute top-3 left-3 md:top-4 md:left-4 flex items-center gap-2 bg-white/80 backdrop-blur rounded-lg px-3 py-1.5 shadow-md z-30">
                <span className="text-lg">🧭</span>
                <span className="font-game text-amber-900 text-sm md:text-base">
                  冒险岛海域
                </span>
              </div>

              {expedition && (
                <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 bg-amber-500/95 backdrop-blur rounded-lg px-3 py-2 shadow-lg z-30 border-2 border-amber-600">
                  <div className="flex items-center gap-2">
                    <span className="text-xl animate-bounce">🚢</span>
                    <div>
                      <p className="font-game text-amber-900 text-xs md:text-sm font-bold">
                        远征进行中
                      </p>
                      <p className="font-game text-amber-800 text-xs">
                        {ISLANDS.find((i) => i.id === expedition.islandId)?.name}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-4 md:p-5 card-shadow">
            <h3 className="font-title text-xl text-white mb-4 flex items-center gap-2">
              ⚓ 远征队伍
            </h3>
            {teamPets.length > 0 ? (
              <div className="space-y-3">
                {teamPets.map((pet) => (
                  pet && (
                    <div
                      key={pet.id}
                      className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-3xl">{pet.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-game text-white font-bold truncate">
                              {pet.name}
                            </p>
                            <span className="text-xs">
                              {getMoodEmoji(pet.mood)}
                            </span>
                          </div>
                          <p className="text-xs text-white/60 font-game">
                            Lv.{pet.level}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-300 w-6">HP</span>
                          <div className="flex-1 h-2 bg-gray-700/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all"
                              style={{ width: `${(pet.hp / pet.maxHp) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-white/70 font-game w-10 text-right">
                            {pet.hp}/{pet.maxHp}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-pink-300 w-6">心情</span>
                          <div className="flex-1 h-2 bg-gray-700/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-pink-500 to-pink-400 rounded-full transition-all"
                              style={{ width: `${pet.mood}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-white/70 font-game w-10 text-right">
                            {pet.mood}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-5xl mb-3 opacity-50">🐾</div>
                <p className="text-white/60 font-game text-sm">
                  还没有编队
                </p>
                <p className="text-white/40 font-game text-xs mt-1">
                  请前往宠物小屋编组队伍
                </p>
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="font-game text-white/70 text-sm">💰 金币</span>
              <span className="font-game text-yellow-300 font-bold">
                {resources.gold}
              </span>
            </div>
          </div>
        </div>
      </div>

      {selectedIsland && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedIsland(null)}
        >
          <div
            className="glass-card rounded-2xl max-w-lg w-full p-6 card-shadow max-h-[90vh] overflow-y-auto animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'w-20 h-20 rounded-2xl flex items-center justify-center text-5xl',
                    unlockMap[selectedIsland.id]
                      ? 'bg-gradient-to-br from-amber-200 to-amber-400 border-4 border-amber-600'
                      : 'bg-gray-300 border-4 border-gray-500 grayscale'
                  )}
                >
                  {unlockMap[selectedIsland.id]
                    ? selectedIsland.emoji
                    : '🔒'}
                </div>
                <div>
                  <h3 className="font-title text-2xl md:text-3xl text-white mb-1">
                    {selectedIsland.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-0.5 rounded-full text-sm font-game">
                      等级要求 Lv.{selectedIsland.level}
                    </span>
                    {unlockMap[selectedIsland.id] ? (
                      <span className="bg-green-500/80 text-white px-2.5 py-0.5 rounded-full text-xs font-game">
                        已解锁
                      </span>
                    ) : (
                      <span className="bg-gray-500/80 text-white px-2.5 py-0.5 rounded-full text-xs font-game">
                        未解锁
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedIsland(null)}
                className="text-white/60 hover:text-white text-2xl transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <p className="text-white/85 font-game text-base leading-relaxed mb-5 bg-white/5 rounded-xl p-4 border border-white/10">
              📖 {selectedIsland.description}
            </p>

            {selectedIsland.specialties.length > 0 && (
              <div className="mb-5">
                <h4 className="font-game text-white/80 text-sm mb-2 flex items-center gap-1.5">
                  🎁 特产资源
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedIsland.specialties.map((s) => (
                    <span
                      key={s}
                      className="bg-white/15 backdrop-blur text-white px-3 py-1.5 rounded-full text-sm font-game border border-white/20"
                    >
                      {RESOURCE_EMOJIS[s]} {RESOURCE_NAMES[s]}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedIsland.monsters.length > 0 && (
              <div className="mb-5">
                <h4 className="font-game text-white/80 text-sm mb-2 flex items-center gap-1.5">
                  👹 出没怪物
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedIsland.monsters.map((mId) => {
                    const monster = getMonsterInfo(mId);
                    return monster ? (
                      <span
                        key={mId}
                        className="bg-red-500/20 text-red-200 px-3 py-1.5 rounded-full text-sm font-game border border-red-400/30 flex items-center gap-1.5"
                      >
                        <span>{monster.emoji}</span>
                        {monster.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {selectedIsland.id !== 'island-home' && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-game text-white/80 text-sm flex items-center gap-1.5">
                    📊 探索进度
                  </h4>
                  <span className="font-game text-yellow-300 text-sm font-bold">
                    {islandProgress[selectedIsland.id] || 0}%
                  </span>
                </div>
                <div className="w-full h-4 bg-gray-700/50 rounded-full overflow-hidden border border-white/10">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', getProgressColor(islandProgress[selectedIsland.id] || 0))}
                    style={{ width: `${islandProgress[selectedIsland.id] || 0}%` }}
                  ></div>
                </div>
                {!unlockMap[selectedIsland.id] &&
                  selectedIsland.unlockRequirement && (
                    <p className="text-xs text-orange-300 mt-2 font-game">
                      🔓 解锁条件：探索{' '}
                      {ISLANDS.find(
                        (i) => i.id === selectedIsland.unlockRequirement!.islandId
                      )?.name}{' '}
                      达到 {selectedIsland.unlockRequirement.progress}%
                    </p>
                  )}
              </div>
            )}

            {selectedIsland.id !== 'island-home' && (
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-4 border border-amber-400/30 mb-5">
                <div className="flex items-center justify-between">
                  <span className="font-game text-white/90">💰 远征费用</span>
                  <span className="font-game text-yellow-300 text-xl font-bold">
                    {getExpeditionCost(selectedIsland.level)} 金币
                  </span>
                </div>
              </div>
            )}

            {selectedIsland.id !== 'island-home' && (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-400/30 mb-5">
                <label className={cn(
                  'flex items-start gap-3 cursor-pointer',
                  luckyCharmCount === 0 && 'cursor-not-allowed opacity-60'
                )}>
                  <div className="relative mt-0.5 flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={useLuckyCharm}
                      onChange={(e) => {
                        if (luckyCharmCount === 0) {
                          addToast('🍀 幸运符不足！去工坊制作一些吧~', 'warning');
                          return;
                        }
                        setUseLuckyCharm(e.target.checked);
                      }}
                      disabled={luckyCharmCount === 0}
                      className="peer sr-only"
                    />
                    <div className={cn(
                      'w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200',
                      useLuckyCharm
                        ? 'bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-500 scale-110'
                        : 'bg-white/50 border-emerald-300/50',
                      luckyCharmCount === 0 && 'bg-gray-200 border-gray-300'
                    )}>
                      {useLuckyCharm && (
                        <svg className="w-4 h-4 text-white animate-checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-3xl">🍀</span>
                      <div>
                        <div className="font-title text-emerald-900 text-base font-bold">使用幸运符 🍀</div>
                        <div className="text-xs text-emerald-700/80 font-game leading-snug">
                          发现概率大幅提升（普通 30%→80%，稀有 15%→40%，史诗 5%→15%，传说 1%→5%）
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={cn(
                        'text-sm font-game font-bold',
                        luckyCharmCount === 0 ? 'text-red-600' : 'text-emerald-700'
                      )}>
                        🎒 背包拥有: {luckyCharmCount} 个
                      </span>
                      {luckyCharmCount === 0 && (
                        <span className="text-xs font-game text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-400/30">
                          不足
                        </span>
                      )}
                      {useLuckyCharm && luckyCharmCount > 0 && (
                        <span className="text-xs font-game text-emerald-600 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-400/30 animate-pulse">
                          ✨ 已勾选 - 消耗1个
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedIsland(null)}
                className="flex-1 py-3 rounded-xl font-game text-base
                  bg-white/10 text-white/80 hover:bg-white/20
                  transition-all border border-white/20"
              >
                关闭
              </button>
              {selectedIsland.id !== 'island-home' && (
                <button
                  onClick={() => handleStartExpedition(selectedIsland)}
                  disabled={
                    !unlockMap[selectedIsland.id] ||
                    teamPets.length === 0 ||
                    expedition !== null ||
                    resources.gold < getExpeditionCost(selectedIsland.level)
                  }
                  className={cn(
                    'flex-1 py-3 rounded-xl font-game text-base transition-all',
                    unlockMap[selectedIsland.id] &&
                    teamPets.length > 0 &&
                    expedition === null &&
                    resources.gold >= getExpeditionCost(selectedIsland.level)
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-orange-500/30 hover:scale-[1.02]'
                      : 'bg-gray-600/50 text-white/40 cursor-not-allowed'
                  )}
                >
                  {expedition
                    ? '🚢 远征中...'
                    : teamPets.length === 0
                    ? '🐾 请先编队'
                    : !unlockMap[selectedIsland.id]
                    ? '🔒 未解锁'
                    : resources.gold < getExpeditionCost(selectedIsland.level)
                    ? '💰 金币不足'
                    : '⚓ 派遣远征队'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {expeditionResult && (
        <ExpeditionResultModal
          island={expeditionResult.island}
          usedLuckyCharm={expeditionResult.usedLuckyCharm}
          durationSeconds={expeditionResult.durationSeconds}
          onClose={() => setExpeditionResult(null)}
        />
      )}

      <style>{`
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
        @keyframes checkmark {
          0% { stroke-dashoffset: 100; opacity: 0; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
        .animate-bounce-in { animation: bounce-in 0.5s ease-out forwards; }
        .animate-toast-in { animation: toast-in 0.3s ease-out forwards; }
        .animate-checkmark {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: checkmark 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
