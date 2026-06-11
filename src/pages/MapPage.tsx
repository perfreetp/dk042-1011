import { useState, useMemo } from 'react';
import { useGameStore } from '../store/useGameStore';
import { ISLANDS } from '../data/islands';
import { MONSTER_TEMPLATES } from '../data/monsters';
import {
  RESOURCE_NAMES,
  RESOURCE_EMOJIS,
  getProgressColor,
  getMoodEmoji,
} from '../utils/formatters';
import type { Island } from '../types';

export default function MapPage() {
  const {
    islandProgress,
    expedition,
    team,
    pets,
    resources,
    startExpedition,
    checkAndUnlockIslands,
  } = useGameStore();

  const [selectedIsland, setSelectedIsland] = useState<Island | null>(null);

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
    const success = startExpedition(island.id);
    if (success) {
      setSelectedIsland(null);
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
    <div className="page-enter container mx-auto px-4 py-6 md:py-8">
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
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 
                      flex flex-col items-center z-20 transition-all duration-300
                      ${isUnlocked ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'}
                      ${isSelected ? 'scale-110 z-30' : ''}
                    `}
                    style={{
                      left: `${island.x}%`,
                      top: `${island.y}%`,
                    }}
                  >
                    <div className="relative">
                      <div
                        className={`flex items-center justify-center rounded-full
                          transition-all duration-300
                          ${isUnlocked
                            ? 'bg-gradient-to-br from-amber-200 to-amber-400 border-4 border-amber-600 shadow-lg'
                            : 'bg-gray-300 border-4 border-gray-500 opacity-70 grayscale'
                          }
                          ${isUnlocked && !isExpeditionHere ? 'hover:animate-pulse-glow' : ''}
                          ${isSelected ? 'ring-4 ring-yellow-300 ring-opacity-80' : ''}
                        `}
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
                          className={`absolute -top-1 -left-1 rounded-full px-1.5 py-0.5 text-xs font-bold
                            ${isUnlocked
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                              : 'bg-gray-500 text-gray-200'
                            }
                            border-2 border-white shadow-md
                          `}
                        >
                          Lv.{island.level}
                        </div>
                      )}
                    </div>

                    <div
                      className={`mt-1 px-2 py-0.5 rounded-md text-xs md:text-sm font-game whitespace-nowrap shadow
                        ${isUnlocked
                          ? 'bg-white/90 text-amber-900'
                          : 'bg-gray-400/80 text-gray-700'
                        }
                      `}
                    >
                      {island.name}
                    </div>

                    {isUnlocked && island.id !== 'island-home' && (
                      <div className="w-10 md:w-14 h-1.5 bg-gray-300/80 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                            progress
                          )}`}
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
                              style={{
                                width: `${(pet.hp / pet.maxHp) * 100}%`,
                              }}
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedIsland(null)}
        >
          <div
            className="glass-card rounded-2xl max-w-lg w-full p-6 card-shadow max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-4">
                <div
                  className={`w-20 h-20 rounded-2xl flex items-center justify-center text-5xl
                    ${unlockMap[selectedIsland.id]
                      ? 'bg-gradient-to-br from-amber-200 to-amber-400 border-4 border-amber-600'
                      : 'bg-gray-300 border-4 border-gray-500 grayscale'
                    }
                  `}
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
                    className={`h-full rounded-full transition-all duration-700 ${getProgressColor(
                      islandProgress[selectedIsland.id] || 0
                    )}`}
                    style={{
                      width: `${islandProgress[selectedIsland.id] || 0}%`,
                    }}
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
                  className={`flex-1 py-3 rounded-xl font-game text-base transition-all
                    ${
                      unlockMap[selectedIsland.id] &&
                      teamPets.length > 0 &&
                      expedition === null &&
                      resources.gold >= getExpeditionCost(selectedIsland.level)
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-orange-500/30 hover:scale-[1.02]'
                        : 'bg-gray-600/50 text-white/40 cursor-not-allowed'
                    }
                  `}
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
    </div>
  );
}
