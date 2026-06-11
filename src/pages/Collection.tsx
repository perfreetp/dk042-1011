import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { ISLANDS, getIslandById } from '../data/islands';
import { SYNERGY_SKILLS } from '../data/pets';
import { DISCOVERY_TEMPLATES, getDiscoveryById } from '../data/discoveries';
import {
  RARITY_NAMES,
  RARITY_COLORS,
  PET_TYPE_NAMES,
  PET_TYPE_COLORS,
  PET_TYPE_EMOJIS,
  RESOURCE_NAMES,
  RESOURCE_EMOJIS,
  getProgressColor,
} from '../utils/formatters';
import type { PetType, Rarity, DiscoveryCategory, Discovery, LogEntry, AdventureRecord, AdventureNode, ResourceType } from '../types';

type TabType = 'bonds' | 'progress' | 'discoveries' | 'adventures' | 'logs';
type DiscoveryViewMode = 'all' | 'found';
type RarityFilter = 'all' | Rarity;
type CategoryFilter = 'all' | DiscoveryCategory;
type LogTypeFilter = 'all' | LogEntry['type'];
type AdventureFilter = 'all' | 'expedition' | 'battle';

const CATEGORY_NAMES: Record<DiscoveryCategory, string> = {
  treasure: '宝藏',
  lore: '传说',
  monster: '怪物',
  pet: '宠物',
  island: '岛屿',
};

const CATEGORY_EMOJIS: Record<DiscoveryCategory, string> = {
  treasure: '💎',
  lore: '📚',
  monster: '👹',
  pet: '🐾',
  island: '🏝️',
};

const RARITY_BORDER_CLASSES: Record<Rarity, string> = {
  common: 'border-gray-400',
  rare: 'border-blue-400',
  epic: 'border-purple-400',
  legendary: 'border-yellow-400',
};

const RARITY_GLOW_CLASSES: Record<Rarity, string> = {
  common: 'shadow-gray-400/30',
  rare: 'shadow-blue-400/50',
  epic: 'shadow-purple-400/60',
  legendary: 'shadow-yellow-400/70',
};

const RARITY_BG_GRADIENT: Record<Rarity, string> = {
  common: 'from-gray-100 to-gray-200',
  rare: 'from-blue-50 to-blue-100',
  epic: 'from-purple-50 to-purple-100',
  legendary: 'from-yellow-50 to-orange-100',
};

const DIFFICULTY_NAMES: Record<string, string> = {
  easy: '简单',
  normal: '普通',
  hard: '困难',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'text-green-600 bg-green-100 border-green-300',
  normal: 'text-yellow-600 bg-yellow-100 border-yellow-300',
  hard: 'text-red-600 bg-red-100 border-red-300',
};

const NODE_TYPE_EMOJIS: Record<string, string> = {
  depart: '🚢',
  collect: '📦',
  encounter: '👹',
  discover: '✨',
  claim: '🎁',
  start_battle: '⚔️',
  victory: '🏆',
  defeat: '💔',
};

const NODE_TYPE_DOT_COLORS: Record<string, string> = {
  depart: 'bg-blue-500 ring-blue-300',
  collect: 'bg-green-500 ring-green-300',
  encounter: 'bg-red-500 ring-red-300',
  discover: 'bg-purple-500 ring-purple-300',
  claim: 'bg-yellow-500 ring-yellow-300',
  start_battle: 'bg-orange-500 ring-orange-300',
  victory: 'bg-emerald-500 ring-emerald-300',
  defeat: 'bg-rose-500 ring-rose-300',
};

const NODE_TYPE_CARD_BG: Record<string, string> = {
  depart: 'bg-blue-50 border-blue-200',
  collect: 'bg-green-50 border-green-200',
  encounter: 'bg-red-50 border-red-200',
  discover: 'bg-purple-50 border-purple-200',
  claim: 'bg-yellow-50 border-yellow-200',
  start_battle: 'bg-orange-50 border-orange-200',
  victory: 'bg-emerald-50 border-emerald-200',
  defeat: 'bg-rose-50 border-rose-200',
};

const NODE_TYPE_TITLE_COLORS: Record<string, string> = {
  depart: 'text-blue-800',
  collect: 'text-green-800',
  encounter: 'text-red-800',
  discover: 'text-purple-800',
  claim: 'text-yellow-800',
  start_battle: 'text-orange-800',
  victory: 'text-emerald-800',
  defeat: 'text-rose-800',
};

export default function Collection() {
  const { pets, islandProgress, logs, discoveries, adventureRecords, checkAndUnlockIslands, getDiscoverySource, getAdventureRecordById } = useGameStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('bonds');
  const [discoveryViewMode, setDiscoveryViewMode] = useState<DiscoveryViewMode>('all');
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [selectedDiscovery, setSelectedDiscovery] = useState<Discovery | null>(null);
  const [logTypeFilter, setLogTypeFilter] = useState<LogTypeFilter>('all');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [highlightedLogId, setHighlightedLogId] = useState<string | null>(null);
  const [adventureFilter, setAdventureFilter] = useState<AdventureFilter>('all');
  const [highlightedRecordId, setHighlightedRecordId] = useState<string | null>(null);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const adventureContainerRef = useRef<HTMLDivElement>(null);
  const cleanupRecordTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const jumpToRecord = useCallback((recordId: string, from: string = 'discovery') => {
    setSearchParams(
      { tab: 'adventures', record: recordId, expand: '1', from },
      { replace: false }
    );
  }, [setSearchParams]);

  const jumpToDiscovery = useCallback((discoveryId: string, from: string = 'adventure') => {
    setSearchParams(
      { tab: 'discoveries', sel: discoveryId, from },
      { replace: false }
    );
  }, [setSearchParams]);

  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType;
    const recordParam = searchParams.get('record');
    const expandParam = searchParams.get('expand');
    const selParam = searchParams.get('sel');

    if (tabParam) {
      setActiveTab(tabParam);
    }

    if (recordParam) {
      setActiveTab('adventures');
      setAdventureFilter('all');
      if (cleanupRecordTimeout.current) {
        clearTimeout(cleanupRecordTimeout.current);
        cleanupRecordTimeout.current = null;
      }
      setHighlightedRecordId(recordParam);
      if (expandParam !== '0') {
        setExpandedRecordId(recordParam);
      }
      setTimeout(() => {
        const el = document.getElementById(`adventure-${recordParam}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      cleanupRecordTimeout.current = setTimeout(() => {
        setHighlightedRecordId(null);
        setSearchParams(new URLSearchParams({ tab: activeTab }), { replace: true });
      }, 3000);
    }

    if (selParam) {
      setActiveTab('discoveries');
      setDiscoveryViewMode('found');
      setRarityFilter('all');
      setCategoryFilter('all');
      const found = discoveries.find((d) => d.id === selParam);
      if (found) {
        setTimeout(() => {
          setSelectedDiscovery(found);
        }, 100);
      }
    }
  }, [searchParams, discoveries, activeTab, setSearchParams]);

  useEffect(() => {
    return () => {
      if (cleanupRecordTimeout.current) {
        clearTimeout(cleanupRecordTimeout.current);
        cleanupRecordTimeout.current = null;
      }
    };
  }, []);

  const ownedPetTypes = useMemo(() => {
    const types = new Set<PetType>();
    pets.forEach((p) => types.add(p.type));
    return types;
  }, [pets]);

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

  const totalProgress = useMemo(() => {
    const total = ISLANDS.filter((i) => i.id !== 'island-home').length;
    const sum = ISLANDS.filter((i) => i.id !== 'island-home').reduce(
      (acc, i) => acc + (islandProgress[i.id] || 0),
      0
    );
    return {
      average: total > 0 ? Math.round(sum / total) : 0,
      unlocked: ISLANDS.filter((i) => i.id !== 'island-home' && unlockMap[i.id])
        .length,
      total,
    };
  }, [islandProgress, unlockMap]);

  const discoveredIds = useMemo(() => {
    return new Set(discoveries.map((d) => d.id));
  }, [discoveries]);

  const discoveryStats = useMemo(() => {
    const total = DISCOVERY_TEMPLATES.length;
    const found = discoveries.length;
    const percentage = total > 0 ? Math.round((found / total) * 100) : 0;
    return { total, found, percentage };
  }, [discoveries]);

  const filteredDiscoveries = useMemo(() => {
    let result = [...DISCOVERY_TEMPLATES];

    if (discoveryViewMode === 'found') {
      result = result.filter((d) => discoveredIds.has(d.id));
    }

    if (rarityFilter !== 'all') {
      result = result.filter((d) => d.rarity === rarityFilter);
    }

    if (categoryFilter !== 'all') {
      result = result.filter((d) => d.category === categoryFilter);
    }

    return result;
  }, [discoveryViewMode, rarityFilter, categoryFilter, discoveredIds]);

  const filteredLogs = useMemo(() => {
    let result = [...logs];

    if (logTypeFilter !== 'all') {
      result = result.filter((log) => log.type === logTypeFilter);
    }

    if (logSearchQuery.trim()) {
      const query = logSearchQuery.toLowerCase();
      result = result.filter((log) => log.message.toLowerCase().includes(query));
    }

    return result;
  }, [logs, logTypeFilter, logSearchQuery]);

  const adventureStats = useMemo(() => {
    const total = adventureRecords.length;
    const expeditions = adventureRecords.filter((r) => r.type === 'expedition').length;
    const battles = adventureRecords.filter((r) => r.type === 'battle').length;
    const totalDiscoveries = adventureRecords.reduce((acc, r) => acc + r.discoveries.length, 0);
    return { total, expeditions, battles, totalDiscoveries };
  }, [adventureRecords]);

  const filteredAdventures = useMemo(() => {
    let result = [...adventureRecords].sort((a, b) => b.endTime - a.endTime);

    if (adventureFilter !== 'all') {
      result = result.filter((r) => r.type === adventureFilter);
    }

    return result;
  }, [adventureRecords, adventureFilter]);

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}`;
  };

  const formatFullDate = (ts: number) => {
    const date = new Date(ts);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const formatNodeTime = (ts: number) => {
    const date = new Date(ts);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const getLogStyle = (type: string) => {
    switch (type) {
      case 'success':
        return {
          dot: 'bg-green-400',
          ring: 'ring-green-400/30',
          icon: '✅',
          bg: 'bg-green-500/10',
          border: 'border-green-500/20',
        };
      case 'warning':
        return {
          dot: 'bg-yellow-400',
          ring: 'ring-yellow-400/30',
          icon: '⚠️',
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/20',
        };
      case 'danger':
        return {
          dot: 'bg-red-400',
          ring: 'ring-red-400/30',
          icon: '❌',
          bg: 'bg-red-500/10',
          border: 'border-red-500/20',
        };
      default:
        return {
          dot: 'bg-blue-400',
          ring: 'ring-blue-400/30',
          icon: 'ℹ️',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
        };
    }
  };

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'bonds', label: '宠物羁绊', icon: '🤝' },
    { key: 'progress', label: '岛屿探索', icon: '🏝️' },
    { key: 'discoveries', label: '稀有发现', icon: '✨' },
    { key: 'adventures', label: '冒险记录', icon: '📖' },
    { key: 'logs', label: '活动日志', icon: '📜' },
  ];

  const getRarityBadgeClass = (rarity: Rarity) => {
    const classes: Record<Rarity, string> = {
      common: 'bg-gray-500/80 border-gray-400',
      rare: 'bg-blue-500/80 border-blue-400',
      epic: 'bg-purple-500/80 border-purple-400',
      legendary: 'bg-gradient-to-r from-yellow-500 to-orange-500 border-yellow-400',
    };
    return classes[rarity];
  };

  const getDiscoverySourceText = (discovery: Discovery | Omit<Discovery, 'foundAt'>) => {
    return getDiscoverySource(discovery.id);
  };

  const getAdventureSourceText = useCallback((discovery: Discovery) => {
    if (discovery.adventureRecordId) {
      const record = getAdventureRecordById(discovery.adventureRecordId);
      if (record) {
        if (record.type === 'expedition' && record.islandName) {
          return `🏝️${record.islandName}远征`;
        }
        if (record.type === 'battle') {
          const diffLabel = record.difficulty ? DIFFICULTY_NAMES[record.difficulty] : '';
          return `⚔️${diffLabel}战斗`;
        }
      }
    }
    return '来源不明';
  }, [getAdventureRecordById]);

  const handleViewRelatedLog = (discoveryId: string) => {
    const relatedLog = logs.find((log) => log.relatedDiscoveryId === discoveryId);
    if (relatedLog) {
      setActiveTab('logs');
      setLogTypeFilter('all');
      setLogSearchQuery('');
      setHighlightedLogId(relatedLog.id);
      setTimeout(() => {
        const logElement = document.getElementById(`log-${relatedLog.id}`);
        if (logElement) {
          logElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
    setSelectedDiscovery(null);
  };

  const handleViewAdventureFromDiscovery = (discovery: Discovery) => {
    if (discovery.adventureRecordId) {
      jumpToRecord(discovery.adventureRecordId, 'discovery');
    }
    setSelectedDiscovery(null);
  };

  const handleViewAdventureFromLog = (recordId: string) => {
    jumpToRecord(recordId, 'log');
  };

  const handleViewDiscoveryFromAdventure = (discoveryId: string) => {
    jumpToDiscovery(discoveryId);
  };

  useEffect(() => {
    if (highlightedLogId) {
      const timer = setTimeout(() => setHighlightedLogId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightedLogId]);

  const getFoundDiscovery = (templateId: string): Discovery | undefined => {
    return discoveries.find((d) => d.id === templateId);
  };

  const renderAdventureNode = (node: AdventureNode, index: number, totalNodes: number) => {
    const nodeEmoji = NODE_TYPE_EMOJIS[node.type] || '📍';
    const dotColor = NODE_TYPE_DOT_COLORS[node.type] || 'bg-gray-500 ring-gray-300';
    const cardBg = NODE_TYPE_CARD_BG[node.type] || 'bg-gray-50 border-gray-200';
    const titleColor = NODE_TYPE_TITLE_COLORS[node.type] || 'text-gray-800';
    const isLast = index === totalNodes - 1;

    const nodeTitle = node.title || {
      depart: '出发远征',
      collect: '采集资源',
      encounter: '遭遇怪物',
      discover: '新发现',
      claim: '领取奖励',
      start_battle: '战斗开始',
      victory: '战斗胜利',
      defeat: '战斗失败',
    }[node.type] || '事件';

    return (
      <div key={node.id} className="relative flex gap-3">
        <div className="flex flex-col items-center shrink-0 w-12">
          <div className={`w-5 h-5 rounded-full ${dotColor} ring-4 shadow-md z-10`}></div>
          {!isLast && (
            <div className="w-0.5 flex-1 bg-gradient-to-b from-amber-300 to-amber-400/50 my-1"></div>
          )}
        </div>

        <div className={`flex-1 rounded-xl p-3 md:p-4 border-2 ${cardBg} mb-2 animate-fadeIn`}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl shrink-0">{nodeEmoji}</span>
              <h5 className={`font-title text-base ${titleColor} truncate`}>
                {nodeTitle}
              </h5>
            </div>
            <span className="text-xs font-game text-amber-700/60 shrink-0">
              🕐 {formatNodeTime(node.timestamp)}
            </span>
          </div>

          {node.description && (
            <p className="text-sm font-game text-amber-800/80 leading-relaxed mb-3">
              {node.description}
            </p>
          )}

          {node.type === 'depart' && node.teamSnapshot && node.teamSnapshot.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-game text-amber-700/60">出发队伍:</p>
              <div className="flex flex-wrap gap-2">
                {node.teamSnapshot.map((pet) => (
                  <div key={pet.id} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/70 border border-amber-200 text-xs font-game text-amber-800">
                    <span className="text-lg">{pet.emoji}</span>
                    <span className="truncate max-w-[60px]">{pet.name}</span>
                    <span className="text-amber-600">Lv.{pet.level}</span>
                    {pet.hp !== undefined && pet.maxHp !== undefined && (
                      <span className="text-red-500">❤️{pet.hp}/{pet.maxHp}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {node.type === 'collect' && node.resourceChanges && node.resourceChanges.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-game text-amber-700/60">获得资源:</p>
              <div className="flex flex-wrap gap-2">
                {node.resourceChanges.map((res, idx) => {
                  const amount = res.delta !== undefined ? res.delta : res.amount;
                  if (res.itemId && res.itemName) {
                    return (
                      <span
                        key={`item-${idx}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 border border-green-300 text-xs font-game text-green-700 animate-floatGreen"
                      >
                        📦 {res.itemName} +{amount}
                      </span>
                    );
                  }
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 border border-green-300 text-xs font-game text-green-700 animate-floatGreen"
                    >
                      {RESOURCE_EMOJIS[res.type as ResourceType]} {RESOURCE_NAMES[res.type as ResourceType]} +{amount}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {node.type === 'encounter' && node.monsterDetails && node.monsterDetails.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-game text-amber-700/60">遭遇怪物:</p>
              <div className="flex flex-wrap gap-2">
                {node.monsterDetails.map((m, idx) => (
                  <div
                    key={idx}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-game
                      ${m.defeated
                        ? 'bg-green-100 border-green-300 text-green-800'
                        : 'bg-red-100 border-red-300 text-red-800'
                      }
                    `}
                  >
                    <span className="text-lg">{m.emoji}</span>
                    <span>{m.name}</span>
                    <span>{m.defeated ? '✅击败' : '❌逃跑'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {node.type === 'discover' && (
            <div className="space-y-2">
              <p className="text-xs font-game text-amber-700/60">新发现:</p>
              <div className="flex flex-wrap gap-2">
                {(node.discoveryDetails && node.discoveryDetails.length > 0
                  ? node.discoveryDetails
                  : (node.discoveryIds || []).map((id) => {
                      const d = getDiscoveryById(id);
                      return d ? { id: d.id, name: d.name, emoji: d.emoji, rarity: d.rarity, category: d.category } : null;
                    }).filter(Boolean)
                ).map((d) => d && (
                  <button
                    key={d.id}
                    onClick={() => handleViewDiscoveryFromAdventure(d.id)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100/80 border border-purple-300 text-xs font-game text-purple-800 hover:bg-purple-200 hover:scale-105 transition-all cursor-pointer"
                  >
                    <span className="text-lg">{d.emoji}</span>
                    <span>{d.name}</span>
                    <span className={`px-1.5 rounded text-[10px] ${RARITY_COLORS[d.rarity]} bg-white/60`}>
                      {RARITY_NAMES[d.rarity]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {node.type === 'claim' && (
            <div className="space-y-3">
              {node.resourceChanges && node.resourceChanges.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-game text-amber-700/60">总资源奖励:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {node.resourceChanges.map((res, idx) => {
                      const amount = res.delta !== undefined ? res.delta : res.amount;
                      if (res.itemId && res.itemName) {
                        return (
                          <span
                            key={`item-${idx}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 border border-yellow-300 text-xs font-game text-yellow-700"
                          >
                            📦 {res.itemName} +{amount}
                          </span>
                        );
                      }
                      return (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 border border-yellow-300 text-xs font-game text-yellow-700"
                        >
                          {RESOURCE_EMOJIS[res.type as ResourceType]} +{amount}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              {node.itemChanges && node.itemChanges.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-game text-amber-700/60">获得道具:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {node.itemChanges.map((item, idx) => {
                      const amount = item.delta !== undefined ? item.delta : item.amount;
                      return (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 border border-orange-300 text-xs font-game text-orange-700"
                        >
                          {item.itemEmoji} {item.itemName} +{amount}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              {node.expDelta !== undefined && node.expDelta !== 0 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100/80 border border-blue-300 text-xs font-game text-blue-700">
                  ⭐ 经验 +{node.expDelta}
                </div>
              )}
              {node.expChange !== undefined && node.expChange !== 0 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100/80 border border-blue-300 text-xs font-game text-blue-700">
                  ⭐ 经验 +{node.expChange}
                </div>
              )}
            </div>
          )}

          {(node.type === 'victory' || node.type === 'defeat') && (
            <div className="space-y-3">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-title border-2
                ${node.type === 'victory'
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                  : 'bg-rose-100 border-rose-400 text-rose-800'
                }
              `}>
                <span className="text-xl">{node.type === 'victory' ? '🏆' : '💔'}</span>
                <span>{node.type === 'victory' ? '战斗胜利！' : '战斗失败...'}</span>
              </div>
              {node.resourceChanges && node.resourceChanges.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-game text-amber-700/60">奖励资源:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {node.resourceChanges.map((res, idx) => {
                      const amount = res.delta !== undefined ? res.delta : res.amount;
                      if (res.itemId && res.itemName) {
                        return (
                          <span
                            key={`item-${idx}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 border border-amber-300 text-xs font-game text-amber-700"
                          >
                            📦 {res.itemName} +{amount}
                          </span>
                        );
                      }
                      return (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 border border-amber-300 text-xs font-game text-amber-700"
                        >
                          {RESOURCE_EMOJIS[res.type as ResourceType]} +{amount}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              {node.discoveryIds && node.discoveryIds.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-game text-amber-700/60">获得发现:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {node.discoveryIds.map((dId) => {
                      const d = getDiscoveryById(dId);
                      if (!d) return null;
                      return (
                        <button
                          key={dId}
                          onClick={() => handleViewDiscoveryFromAdventure(dId)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100/80 border border-purple-300 text-xs font-game text-purple-800 hover:bg-purple-200 transition-colors cursor-pointer"
                        >
                          {d.emoji} {d.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {(node.expDelta !== undefined || node.expChange !== undefined) && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100/80 border border-blue-300 text-xs font-game text-blue-700">
                  ⭐ 经验 +{node.expDelta ?? node.expChange}
                </div>
              )}
            </div>
          )}

          {node.type === 'start_battle' && (
            <div className="space-y-3">
              {node.difficulty && (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-game border ${DIFFICULTY_COLORS[node.difficulty]}`}>
                  难度: {DIFFICULTY_NAMES[node.difficulty]}
                </div>
              )}
              {node.teamSnapshot && node.teamSnapshot.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-game text-amber-700/60">参战队伍:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {node.teamSnapshot.map((pet) => (
                      <div key={pet.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/70 border border-orange-200 text-xs font-game text-orange-800">
                        <span className="text-base">{pet.emoji}</span>
                        <span>{pet.name}</span>
                        <span className="text-orange-600">Lv.{pet.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAdventureCard = (record: AdventureRecord) => {
    const isExpedition = record.type === 'expedition';
    const isHighlighted = highlightedRecordId === record.id;
    const isExpanded = expandedRecordId === record.id;

    const topBorderColor = isExpedition ? 'border-t-blue-500' : 'border-t-red-500';
    const typeIcon = isExpedition ? '🚢' : '⚔️';
    const typeLabel = isExpedition ? '远征' : '战斗';
    const typeBg = isExpedition ? 'bg-blue-500/10 border-blue-500/30' : 'bg-red-500/10 border-red-500/30';
    const typeText = isExpedition ? 'text-blue-700' : 'text-red-700';

    const titleText = isExpedition && record.islandName
      ? `${record.islandName}(远征)`
      : `${record.difficulty ? DIFFICULTY_NAMES[record.difficulty] : ''}战斗(遭遇战)`;

    const discoveryCount = record.discoveries.length;
    const resourceCount = record.collectedResources.reduce((sum, r) => sum + r.amount, 0);
    const monsterCount = record.encounteredMonsters.length;

    return (
      <div
        key={record.id}
        id={`adventure-${record.id}`}
        className={`rounded-2xl border-2 border-t-4 ${topBorderColor} bg-white/60 transition-all duration-500
          ${isHighlighted ? 'ring-2 ring-amber-400 animate-pulse shadow-lg shadow-amber-400/30' : ''}
        `}
      >
        <div
          className="p-4 md:p-5 cursor-pointer hover:bg-amber-50/40 transition-colors"
          onClick={() => setExpandedRecordId(isExpanded ? null : record.id)}
        >
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border ${typeBg}`}>
              {typeIcon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className={`font-title text-lg ${typeText}`}>{titleText}</h4>
                <span className={`px-2 py-0.5 rounded-full text-xs font-game border ${typeBg} ${typeText}`}>
                  {typeLabel}
                </span>
                {record.usedLuckyCharm && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-game bg-green-100 border border-green-300 text-green-700">
                    🍀 幸运符
                  </span>
                )}
              </div>
              <p className="text-xs font-game text-amber-700/50 mt-1">
                🕐 {formatFullDate(record.endTime)}
              </p>
            </div>
            <div className="text-amber-400 text-sm shrink-0 transition-transform duration-300"
                 style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              ▼
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-xs font-game text-amber-700/60 mr-1">队伍:</span>
            {record.teamPetSnapshots.slice(0, 3).map((pet) => (
              <span key={pet.id} className="text-xl" title={`${pet.name} Lv.${pet.level}`}>
                {pet.emoji}
              </span>
            ))}
            {record.teamPetSnapshots.length > 3 && (
              <span className="text-xs font-game text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                +{record.teamPetSnapshots.length - 3}
              </span>
            )}
          </div>

          {!isExpanded && (
            <div className="flex items-center gap-3 flex-wrap mt-2 pt-2 border-t border-amber-200/40">
              {discoveryCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-game text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full border border-purple-200">
                  ✨ 发现 ×{discoveryCount}
                </span>
              )}
              {resourceCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-game text-green-700 bg-green-100/80 px-2 py-0.5 rounded-full border border-green-200">
                  📦 资源 ×{resourceCount}
                </span>
              )}
              {monsterCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-game text-red-700 bg-red-100/80 px-2 py-0.5 rounded-full border border-red-200">
                  👹 怪物 ×{monsterCount}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-xs font-game text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full border border-blue-200">
                ⭐ {record.expGained} 经验
              </span>
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="px-4 md:px-5 pb-4 md:pb-5 border-t border-amber-200/50 pt-4 animate-fadeIn">
            {record.nodes && record.nodes.length > 0 ? (
              <div className="space-y-0">
                {record.nodes.map((node, idx) =>
                  renderAdventureNode(node, idx, record.nodes.length)
                )}
              </div>
            ) : (
              <div className="bg-amber-50/80 rounded-xl p-3 border border-amber-200/50">
                <p className="font-game text-amber-800 text-sm leading-relaxed">
                  {record.summary}
                </p>
              </div>
            )}

            {(!record.nodes || record.nodes.length === 0) && (
              <div className="mt-3 space-y-2">
                {isExpedition && record.collectedResources.length > 0 && (
                  <div>
                    <p className="text-xs font-game text-amber-700/60 mb-1">📦 采集资源:</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {record.collectedResources.map((res, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 text-xs font-game text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                          {RESOURCE_EMOJIS[res.type]} {res.amount}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {record.encounteredMonsters.length > 0 && (
                  <div>
                    <p className="text-xs font-game text-amber-700/60 mb-1">👹 遭遇怪物:</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {record.encounteredMonsters.map((m, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 text-xs font-game text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                          {m.emoji} {m.name} {m.defeated ? '✅' : '❌'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {record.discoveries.length > 0 && (
                  <div>
                    <p className="text-xs font-game text-amber-700/60 mb-1">✨ 新发现:</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {record.discoveries.map((dId) => {
                        const disc = getDiscoveryById(dId);
                        if (!disc) return null;
                        return (
                          <button
                            key={dId}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDiscoveryFromAdventure(dId);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-game text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full border border-purple-200 hover:bg-purple-200 transition-colors"
                          >
                            {disc.emoji} {disc.name}
                            <span className={`px-1 rounded text-[10px] ${RARITY_COLORS[disc.rarity]}`}>
                              {RARITY_NAMES[disc.rarity]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-enter container mx-auto px-4 py-6 md:py-8">
      <div className="mb-6">
        <h2 className="font-title text-3xl md:text-4xl text-white mb-2 drop-shadow">
          📚 收藏册
        </h2>
        <p className="text-white/80 text-base md:text-lg font-game">
          记录你冒险旅途中的所有成就与回忆！
        </p>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden card-shadow">
        <div className="relative">
          <div className="absolute inset-0 bg-parchment opacity-95 pointer-events-none"></div>

          <div className="relative border-b-2 border-amber-700/50">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set('tab', tab.key);
                    newParams.delete('record');
                    newParams.delete('expand');
                    newParams.delete('from');
                    newParams.delete('sel');
                    setSearchParams(newParams, { replace: true });
                  }}
                  className={`flex-1 flex items-center justify-center gap-1 px-1 py-3 md:py-4
                    font-game text-xs md:text-sm transition-all duration-300
                    ${activeTab === tab.key
                      ? 'text-amber-900 bg-amber-400/40'
                      : 'text-amber-800/70 hover:text-amber-900 hover:bg-amber-400/20'
                    }
                  `}
                >
                  <span className="text-base md:text-lg">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
            {tabs.map((tab, idx) => (
              <div
                key={`indicator-${tab.key}`}
                className={`absolute bottom-0 h-1 bg-gradient-to-r from-amber-600 to-orange-600
                  transition-all duration-300 rounded-t-md
                  ${activeTab === tab.key ? 'opacity-100' : 'opacity-0'}
                `}
                style={{
                  left: `${(idx * 100) / tabs.length}%`,
                  width: `${100 / tabs.length}%`,
                }}
              ></div>
            ))}
          </div>

          <div className="relative p-4 md:p-6 lg:p-8 min-h-[500px]">
            {activeTab === 'bonds' && (
              <div className="space-y-8 animate-fadeIn">
                <div>
                  <h3 className="font-title text-2xl text-amber-900 mb-5 flex items-center gap-2">
                    ⚔️ 羁绊组合
                    <span className="text-sm font-game text-amber-700/70 ml-2">
                      （{SYNERGY_SKILLS.length} 种组合）
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                    {SYNERGY_SKILLS.map((synergy, idx) => {
                      const requiredTypes = synergy.requiredBonds;
                      const allOwned =
                        requiredTypes.length === 0
                          ? pets.length >= 3
                          : requiredTypes.every((t) =>
                              ownedPetTypes.has(t as PetType)
                            );

                      return (
                        <div
                          key={synergy.id}
                          className={`rounded-2xl p-5 border-2 transition-all duration-500
                            ${
                              allOwned
                                ? 'bg-gradient-to-br from-amber-100 to-orange-100 border-amber-400 shadow-lg shadow-amber-500/20'
                                : 'bg-amber-50/60 border-amber-300/50'
                            }
                          `}
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          <div className="flex items-start gap-4 mb-4">
                            <div
                              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl
                                ${
                                  allOwned
                                    ? 'bg-gradient-to-br from-amber-300 to-orange-400 shadow-lg animate-breath'
                                    : 'bg-gray-200 grayscale opacity-70'
                                }
                              `}
                            >
                              {synergy.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-title text-xl text-amber-900 mb-1">
                                {synergy.name}
                              </h4>
                              <div className="flex items-center gap-2 flex-wrap">
                                {requiredTypes.length > 0 ? (
                                  requiredTypes.map((type) => {
                                    const owned = ownedPetTypes.has(
                                      type as PetType
                                    );
                                    return (
                                      <span
                                        key={type}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-game border
                                          ${
                                            owned
                                              ? 'bg-green-100 text-green-800 border-green-400'
                                              : 'bg-gray-100 text-gray-500 border-gray-300 grayscale'
                                          }
                                        `}
                                      >
                                        <span>
                                          {PET_TYPE_EMOJIS[type as PetType]}
                                        </span>
                                        {PET_TYPE_NAMES[type as PetType]}
                                      </span>
                                    );
                                  })
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-game border bg-purple-100 text-purple-800 border-purple-400">
                                    <span>⚡</span>
                                    任意3只宠物
                                  </span>
                                )}
                              </div>
                            </div>
                            <div
                              className={`text-right shrink-0
                                ${allOwned ? 'text-orange-600' : 'text-gray-400'}
                              `}
                            >
                              <div className="font-title text-2xl md:text-3xl font-bold">
                                {synergy.damage}
                              </div>
                              <div className="text-xs font-game">伤害</div>
                            </div>
                          </div>
                          <p className="font-game text-amber-800/80 text-sm leading-relaxed bg-white/40 rounded-xl p-3 border border-amber-200/50">
                            {synergy.description}
                          </p>
                          {allOwned && (
                            <div className="mt-3 flex items-center justify-end">
                              <span className="inline-flex items-center gap-1 text-xs font-game text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-300">
                                ✨ 已激活
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="font-title text-2xl text-amber-900 mb-5 flex items-center gap-2">
                    🐾 宠物图鉴
                    <span className="text-sm font-game text-amber-700/70 ml-2">
                      （已收集 {pets.length} 只）
                    </span>
                  </h3>
                  {pets.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                      {pets.map((pet, idx) => (
                        <div
                          key={pet.id}
                          className={`rounded-xl p-3 md:p-4 text-center border-2 transition-all
                            rarity-${pet.rarity}
                          `}
                          style={{ animationDelay: `${idx * 0.03}s` }}
                        >
                          <div className="text-4xl md:text-5xl mb-2 animate-float">
                            {pet.emoji}
                          </div>
                          <h4 className="font-game text-white font-bold text-sm mb-1 truncate">
                            {pet.name}
                          </h4>
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            <span
                              className={`text-xs ${PET_TYPE_COLORS[pet.type]}`}
                            >
                              {PET_TYPE_EMOJIS[pet.type]}
                            </span>
                            <span
                              className={`text-xs font-game ${RARITY_COLORS[pet.rarity]}`}
                            >
                              {RARITY_NAMES[pet.rarity]}
                            </span>
                          </div>
                          <p className="text-xs text-white/70 font-game mt-1">
                            Lv.{pet.level}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-amber-50/50 rounded-xl border border-amber-200/50">
                      <div className="text-6xl mb-3 opacity-50">🐣</div>
                      <p className="font-game text-amber-800/60">
                        还没有收集到宠物
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'progress' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-5 md:p-6 border-2 border-amber-400 shadow-lg shadow-amber-500/10">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="font-title text-2xl text-amber-900 mb-1">
                        📊 总体探索度
                      </h3>
                      <p className="font-game text-amber-800/70 text-sm">
                        已解锁 {totalProgress.unlocked} / {totalProgress.total}{' '}
                        个岛屿
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-title text-4xl md:text-5xl text-orange-600 font-bold">
                          {totalProgress.average}%
                        </div>
                        <p className="font-game text-amber-800/60 text-xs">
                          平均探索度
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 w-full h-5 bg-amber-200/60 rounded-full overflow-hidden border-2 border-amber-400/50">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400`}
                      style={{ width: `${totalProgress.average}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ISLANDS.filter((i) => i.id !== 'island-home').map(
                    (island, idx) => {
                      const progress = islandProgress[island.id] || 0;
                      const unlocked = unlockMap[island.id];

                      return (
                        <div
                          key={island.id}
                          className={`rounded-2xl p-4 md:p-5 border-2 transition-all duration-500
                            ${
                              unlocked
                                ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-400'
                                : 'bg-amber-50/40 border-amber-300/40'
                            }
                          `}
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          <div className="flex items-start gap-4 mb-4">
                            <div
                              className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-4xl md:text-5xl shrink-0
                                ${
                                  unlocked
                                    ? 'bg-gradient-to-br from-amber-200 to-amber-400 border-3 border-amber-600 shadow-md'
                                    : 'bg-gray-200 border-3 border-gray-400 grayscale opacity-60'
                                }
                              `}
                            >
                              {unlocked ? island.emoji : '🔒'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h4 className="font-title text-xl text-amber-900 truncate">
                                  {island.name}
                                </h4>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-game border
                                    ${getRarityBadgeClass(
                                      island.level <= 2
                                        ? 'common'
                                        : island.level <= 4
                                        ? 'rare'
                                        : island.level <= 6
                                        ? 'epic'
                                        : 'legendary'
                                    )}
                                    text-white border-white/30
                                  `}
                                >
                                  Lv.{island.level}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {unlocked ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-game text-green-700 bg-green-100 px-2 py-0.5 rounded-full border border-green-300">
                                    ✓ 已解锁
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-game text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-300">
                                    🔒 未解锁
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mb-2 flex items-center justify-between">
                            <span className="font-game text-sm text-amber-800/70">
                              探索进度
                            </span>
                            <span
                              className={`font-game text-sm font-bold
                                ${
                                  progress >= 100
                                    ? 'text-green-600'
                                    : progress >= 50
                                    ? 'text-amber-600'
                                    : 'text-orange-600'
                                }
                              `}
                            >
                              {progress}%
                            </span>
                          </div>
                          <div className="w-full h-3.5 bg-amber-200/50 rounded-full overflow-hidden border border-amber-300/50">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${getProgressColor(
                                progress
                              )}`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>

                          {!unlocked && island.unlockRequirement && (
                            <p className="mt-3 text-xs font-game text-orange-700/80 bg-orange-50 rounded-lg px-3 py-2 border border-orange-200">
                              🔓 解锁条件：探索{' '}
                              {ISLANDS.find(
                                (i) =>
                                  i.id === island.unlockRequirement!.islandId
                              )?.name}{' '}
                              达到 {island.unlockRequirement.progress}%
                            </p>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {activeTab === 'discoveries' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-5 md:p-6 border-2 border-purple-300 shadow-lg shadow-purple-500/10">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="font-title text-2xl text-purple-900 mb-1">
                        ✨ 稀有发现图鉴
                      </h3>
                      <p className="font-game text-purple-800/70 text-sm">
                        已发现 {discoveryStats.found} / {discoveryStats.total} 种
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-title text-4xl md:text-5xl text-purple-600 font-bold">
                          {discoveryStats.percentage}%
                        </div>
                        <p className="font-game text-purple-800/60 text-xs">
                          完成度
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 w-full h-5 bg-purple-200/60 rounded-full overflow-hidden border-2 border-purple-300/50">
                    <div
                      className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400"
                      style={{ width: `${discoveryStats.percentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDiscoveryViewMode('all')}
                      className={`px-4 py-2 rounded-xl font-game text-sm transition-all
                        ${discoveryViewMode === 'all'
                          ? 'bg-amber-500 text-white shadow-md'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        }
                      `}
                    >
                      📖 全部显示
                    </button>
                    <button
                      onClick={() => setDiscoveryViewMode('found')}
                      className={`px-4 py-2 rounded-xl font-game text-sm transition-all
                        ${discoveryViewMode === 'found'
                          ? 'bg-amber-500 text-white shadow-md'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        }
                      `}
                    >
                      ✓ 仅已发现
                    </button>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <select
                      value={rarityFilter}
                      onChange={(e) => setRarityFilter(e.target.value as RarityFilter)}
                      className="px-3 py-2 rounded-xl font-game text-sm bg-amber-100 text-amber-800 border-2 border-amber-300 focus:outline-none focus:border-amber-500"
                    >
                      <option value="all">全部稀有度</option>
                      <option value="common">普通</option>
                      <option value="rare">稀有</option>
                      <option value="epic">史诗</option>
                      <option value="legendary">传说</option>
                    </select>

                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                      className="px-3 py-2 rounded-xl font-game text-sm bg-amber-100 text-amber-800 border-2 border-amber-300 focus:outline-none focus:border-amber-500"
                    >
                      <option value="all">全部类别</option>
                      <option value="treasure">宝藏</option>
                      <option value="lore">传说</option>
                      <option value="monster">怪物</option>
                      <option value="pet">宠物</option>
                      <option value="island">岛屿</option>
                    </select>
                  </div>
                </div>

                {filteredDiscoveries.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                    {filteredDiscoveries.map((template, idx) => {
                      const isFound = discoveredIds.has(template.id);
                      const foundDiscovery = getFoundDiscovery(template.id);

                      return (
                        <div
                          key={template.id}
                          onClick={() => {
                            if (isFound && foundDiscovery) {
                              setSelectedDiscovery(foundDiscovery);
                            }
                          }}
                          className={`rounded-xl p-3 md:p-4 text-center border-3 transition-all duration-300
                            ${isFound
                              ? `bg-gradient-to-br ${RARITY_BG_GRADIENT[template.rarity]} ${RARITY_BORDER_CLASSES[template.rarity]} shadow-lg ${RARITY_GLOW_CLASSES[template.rarity]} cursor-pointer hover:scale-105 hover:-translate-y-1`
                              : 'bg-gray-100/80 border-gray-300 grayscale cursor-default'
                            }
                          `}
                          style={{ animationDelay: `${idx * 0.03}s` }}
                        >
                          <div className={`text-4xl md:text-5xl mb-2 ${isFound ? 'animate-float' : 'opacity-30'}`}>
                            {isFound ? template.emoji : '❓'}
                          </div>
                          <h4 className={`font-game font-bold text-sm mb-1 truncate
                            ${isFound ? 'text-amber-900' : 'text-gray-400'}
                          `}>
                            {isFound ? template.name : '???'}
                          </h4>
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-game
                              ${isFound
                                ? `${RARITY_COLORS[template.rarity]} border-current`
                                : 'text-gray-400 border-gray-300'
                              }
                            `}>
                              {RARITY_NAMES[template.rarity]}
                            </span>
                          </div>
                          {isFound && foundDiscovery && (
                            <p className="text-xs text-amber-700/60 font-game mt-2">
                              {formatTimestamp(foundDiscovery.foundAt)}
                            </p>
                          )}
                          {!isFound && (
                            <p className="text-xs text-gray-400 font-game mt-2">
                              尚未发现...
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-amber-50/50 rounded-xl border border-amber-200/50">
                    <div className="text-6xl mb-3 opacity-50">🔍</div>
                    <p className="font-game text-amber-800/60">
                      没有找到符合条件的发现物
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'adventures' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-gradient-to-r from-indigo-100 to-blue-100 rounded-2xl p-5 md:p-6 border-2 border-indigo-300 shadow-lg shadow-indigo-500/10">
                  <h3 className="font-title text-2xl text-indigo-900 mb-4">
                    📖 冒险记录
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white/60 rounded-xl p-3 border border-indigo-200 text-center">
                      <div className="font-title text-2xl text-indigo-600 font-bold">{adventureStats.total}</div>
                      <p className="text-xs font-game text-indigo-700/60">总冒险次数</p>
                    </div>
                    <div className="bg-white/60 rounded-xl p-3 border border-indigo-200 text-center">
                      <div className="font-title text-2xl text-blue-600 font-bold">{adventureStats.expeditions}</div>
                      <p className="text-xs font-game text-indigo-700/60">远征次数</p>
                    </div>
                    <div className="bg-white/60 rounded-xl p-3 border border-indigo-200 text-center">
                      <div className="font-title text-2xl text-red-600 font-bold">{adventureStats.battles}</div>
                      <p className="text-xs font-game text-indigo-700/60">战斗次数</p>
                    </div>
                    <div className="bg-white/60 rounded-xl p-3 border border-indigo-200 text-center">
                      <div className="font-title text-2xl text-purple-600 font-bold">{adventureStats.totalDiscoveries}</div>
                      <p className="text-xs font-game text-indigo-700/60">总发现数</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {(['all', 'expedition', 'battle'] as AdventureFilter[]).map((filter) => {
                    const labels: Record<AdventureFilter, string> = {
                      all: '📋 全部',
                      expedition: '🚢 远征',
                      battle: '⚔️ 战斗',
                    };
                    return (
                      <button
                        key={filter}
                        onClick={() => setAdventureFilter(filter)}
                        className={`px-4 py-2 rounded-xl font-game text-sm transition-all
                          ${adventureFilter === filter
                            ? 'bg-indigo-500 text-white shadow-md'
                            : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                          }
                        `}
                      >
                        {labels[filter]}
                      </button>
                    );
                  })}
                </div>

                {filteredAdventures.length > 0 ? (
                  <div ref={adventureContainerRef} className="space-y-4">
                    {filteredAdventures.map((record) => renderAdventureCard(record))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-amber-50/50 rounded-xl border border-amber-200/50">
                    <div className="text-6xl mb-4 opacity-50">📖</div>
                    <p className="font-game text-amber-800/60 text-lg">
                      还没有任何冒险记录
                    </p>
                    <p className="font-game text-amber-800/40 text-sm mt-1">
                      开始远征或战斗，记录你的冒险故事！
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h3 className="font-title text-2xl text-amber-900 flex items-center gap-2">
                    📜 活动日志
                    <span className="text-sm font-game text-amber-700/70 ml-2">
                      （共 {filteredLogs.length} 条）
                    </span>
                  </h3>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={logSearchQuery}
                      onChange={(e) => setLogSearchQuery(e.target.value)}
                      placeholder="搜索日志..."
                      className="px-3 py-2 rounded-xl font-game text-sm bg-amber-50 text-amber-800 border-2 border-amber-300 focus:outline-none focus:border-amber-500 w-full sm:w-48"
                    />

                    <select
                      value={logTypeFilter}
                      onChange={(e) => setLogTypeFilter(e.target.value as LogTypeFilter)}
                      className="px-3 py-2 rounded-xl font-game text-sm bg-amber-50 text-amber-800 border-2 border-amber-300 focus:outline-none focus:border-amber-500"
                    >
                      <option value="all">全部类型</option>
                      <option value="info">ℹ️ 信息</option>
                      <option value="success">✅ 成功</option>
                      <option value="warning">⚠️ 警告</option>
                      <option value="danger">❌ 危险</option>
                    </select>
                  </div>
                </div>

                {filteredLogs.length > 0 ? (
                  <div className="relative" ref={logContainerRef}>
                    <div className="absolute left-4 md:left-6 top-2 bottom-2 w-0.5 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-400 rounded-full"></div>

                    <div className="space-y-4">
                      {filteredLogs.map((log, idx) => {
                        const style = getLogStyle(log.type);
                        const isHighlighted = highlightedLogId === log.id;
                        const relatedDiscovery = log.relatedDiscoveryId
                          ? getDiscoveryById(log.relatedDiscoveryId)
                          : null;

                        return (
                          <div
                            key={log.id}
                            id={`log-${log.id}`}
                            className={`relative pl-12 md:pl-16 transition-all duration-500
                              ${isHighlighted ? 'scale-102' : ''}
                            `}
                            style={{ animationDelay: `${idx * 0.03}s` }}
                          >
                            <div
                              className={`absolute left-2 md:left-4 top-3 w-5 h-5 rounded-full ${style.dot}
                                ring-4 ${style.ring} shadow-md
                                ${isHighlighted ? 'ring-8 animate-pulse' : ''}
                              `}
                            ></div>

                            <div
                              className={`rounded-xl p-4 border-2 ${style.bg} ${style.border}
                                transition-all hover:scale-[1.01]
                                ${isHighlighted ? 'ring-4 ring-yellow-400/50 scale-102' : ''}
                              `}
                            >
                              <div className="flex items-start gap-3">
                                <div className="text-2xl shrink-0">
                                  {style.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-game text-amber-900 text-sm md:text-base leading-relaxed">
                                    {log.message}
                                  </p>
                                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                                    <p className="text-xs font-game text-amber-700/50 flex items-center gap-1.5">
                                      <span>🕐</span>
                                      {formatTimestamp(log.timestamp)}
                                    </p>
                                    {relatedDiscovery && (
                                      <span className="inline-flex items-center gap-1 text-xs font-game text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-300">
                                        ✨ 伴随新发现
                                      </span>
                                    )}
                                    {log.relatedAdventureRecordId && (
                                      <button
                                        onClick={() => handleViewAdventureFromLog(log.relatedAdventureRecordId!)}
                                        className="inline-flex items-center gap-1 text-xs font-game text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-300 hover:bg-indigo-200 transition-colors"
                                      >
                                        📖 查看冒险记录
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 bg-amber-50/50 rounded-xl border border-amber-200/50">
                    <div className="text-6xl mb-4 opacity-50">📖</div>
                    <p className="font-game text-amber-800/60 text-lg">
                      还没有任何日志记录
                    </p>
                    <p className="font-game text-amber-800/40 text-sm mt-1">
                      开始你的冒险，记录精彩瞬间吧！
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedDiscovery && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedDiscovery(null)}
        >
          <div
            className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 md:p-8 max-w-md w-full border-4 border-amber-400 shadow-2xl shadow-amber-500/30 animate-bounceIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className={`text-7xl md:text-8xl mb-4 animate-float
                ${selectedDiscovery.rarity === 'legendary' ? 'animate-breath' : ''}
              `}>
                {selectedDiscovery.emoji}
              </div>

              <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
                <h3 className="font-title text-3xl md:text-4xl text-amber-900">
                  {selectedDiscovery.name}
                </h3>
                {selectedDiscovery.adventureRecordId && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-game bg-indigo-100 text-indigo-700 border border-indigo-300">
                    {getAdventureSourceText(selectedDiscovery)}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-sm font-game border-2 ${RARITY_COLORS[selectedDiscovery.rarity]} border-current`}>
                  {RARITY_NAMES[selectedDiscovery.rarity]}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-game bg-amber-200 text-amber-800 border-2 border-amber-300">
                  {CATEGORY_EMOJIS[selectedDiscovery.category]} {CATEGORY_NAMES[selectedDiscovery.category]}
                </span>
              </div>

              <div className="bg-white/60 rounded-2xl p-4 mb-4 border-2 border-amber-200">
                <p className="font-game text-amber-800 leading-relaxed">
                  {selectedDiscovery.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-amber-100/80 rounded-xl p-3 border border-amber-300">
                  <p className="text-xs font-game text-amber-600 mb-1">发现时间</p>
                  <p className="font-game text-amber-900 text-sm">
                    {formatFullDate(selectedDiscovery.foundAt)}
                  </p>
                </div>
                <div className="bg-amber-100/80 rounded-xl p-3 border border-amber-300">
                  <p className="text-xs font-game text-amber-600 mb-1">来源</p>
                  <p className="font-game text-amber-900 text-sm">
                    {getAdventureSourceText(selectedDiscovery)}
                  </p>
                </div>
              </div>

              {selectedDiscovery.adventureRecordId && (
                <div className="mb-4">
                  <button
                    onClick={() => handleViewAdventureFromDiscovery(selectedDiscovery)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl font-game shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                  >
                    🔗 查看来源冒险
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleViewRelatedLog(selectedDiscovery.id)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-game shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                  📜 查看相关日志
                </button>
                <button
                  onClick={() => setSelectedDiscovery(null)}
                  className="px-6 py-3 bg-amber-200 text-amber-800 rounded-xl font-game hover:bg-amber-300 transition-all"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        .bg-parchment {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 25%, #fcd34d 50%, #fbbf24 75%, #f59e0b 100%);
          background-size: 200% 200%;
          animation: parchmentShift 15s ease infinite;
        }
        @keyframes parchmentShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounceIn {
          animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        .scale-102 {
          transform: scale(1.02);
        }
        @keyframes floatGreen {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-floatGreen {
          animation: floatGreen 2s ease-in-out infinite;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}