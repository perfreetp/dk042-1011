import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { RECIPES } from '../data/recipes';
import type { Recipe, Equipment, ResourceType, Rarity } from '../types';

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

interface CollectAnim {
  type: string;
  amount: number;
  key: number;
}

function ResourceGathering() {
  const resources = useGameStore((s) => s.resources);
  const facilities = useGameStore((s) => s.facilities);
  const collectResource = useGameStore((s) => s.collectResource);
  const getWarehouseCapacity = useGameStore((s) => s.getWarehouseCapacity);
  const [collectAnim, setCollectAnim] = useState<CollectAnim | null>(null);
  const [isCollecting, setIsCollecting] = useState<string | null>(null);
  const capacity = getWarehouseCapacity();

  const handleCollect = (point: CollectPoint) => {
    if (isCollecting) return;
    setIsCollecting(point.type);

    setTimeout(() => {
      const amount = collectResource(point.type);
      setCollectAnim({ type: point.type, amount, key: Date.now() });
      setIsCollecting(null);

      setTimeout(() => setCollectAnim(null), 1500);
    }, 600);
  };

  return (
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLLECT_POINTS.map((point) => {
          const current = resources[point.type];
          const percent = Math.min(100, (current / capacity) * 100);
          const collecting = isCollecting === point.type;
          const showAnim = collectAnim?.type === point.type;

          return (
            <div
              key={point.type}
              className={`relative rounded-2xl p-5 ${point.bgColor} border-2 ${point.borderColor} overflow-hidden transition-all duration-300 ${collecting ? 'scale-95' : 'hover:scale-[1.02]'}`}
            >
              {showAnim && (
                <div
                  key={collectAnim!.key}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
                  style={{ animation: 'floatUp 1.5s ease-out forwards' }}
                >
                  <div className="font-title text-3xl text-white drop-shadow-lg">
                    +{collectAnim!.amount} {point.emoji}
                  </div>
                </div>
              )}

              {collecting && (
                <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] z-0 flex items-center justify-center">
                  <div className="text-5xl animate-bounce">{point.emoji}</div>
                </div>
              )}

              <div className="relative z-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-5xl drop-shadow-lg">{point.emoji}</div>
                  <div className="text-right">
                    <h4 className="font-title text-xl text-white">{point.name}</h4>
                    <p className="text-xs text-white/70 font-game">
                      {RESOURCE_NAMES[point.type]}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs text-white/80 mb-1.5 font-game">
                    <span>📦 当前库存</span>
                    <span>{current} / {capacity}</span>
                  </div>
                  <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${point.gradient} transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleCollect(point)}
                  disabled={collecting || current >= capacity}
                  className={`w-full py-3 rounded-xl bg-gradient-to-r ${point.gradient} text-white font-title text-lg shadow-lg ${point.shadowColor} hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 relative overflow-hidden`}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {current >= capacity ? '📦 仓库已满' : (
                      <>
                        {collecting ? '采集中...' : `${point.emoji} 采集`}
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        {(['gold', 'ore', 'herb', 'shell'] as ResourceType[]).map((type) => (
          <div
            key={type}
            className="bg-white/10 rounded-lg px-3 py-2 flex items-center justify-between border border-white/10"
          >
            <span className="text-lg">{RESOURCE_EMOJI[type]}</span>
            <div className="text-right">
              <div className="text-xs text-white/60 font-game">{RESOURCE_NAMES[type]}</div>
              <div className="font-title text-white">{resources[type]}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const resources = useGameStore((s) => s.resources);
  const facilities = useGameStore((s) => s.facilities);
  const craftItem = useGameStore((s) => s.craftItem);

  const workshopLevel = facilities.workshop;
  const levelEnough = workshopLevel >= recipe.requiredWorkshopLevel;

  const materialStatus = recipe.materials.map((mat) => ({
    ...mat,
    enough: resources[mat.type] >= mat.amount,
  }));
  const allMaterialsEnough = materialStatus.every((m) => m.enough);
  const canCraft = levelEnough && allMaterialsEnough;

  return (
    <div
      className={`rounded-xl p-4 card-shadow transition-all duration-300 border-2 ${
        canCraft
          ? 'bg-gradient-to-br from-amber-900/40 to-orange-900/30 border-amber-500/40 hover:border-amber-400/60'
          : 'bg-white/5 border-white/10 opacity-80'
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0 ${
          canCraft
            ? 'bg-gradient-to-br from-amber-400/30 to-orange-500/30 border border-amber-400/40'
            : 'bg-white/10 border border-white/10'
        }`}>
          {recipe.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-title text-lg text-white truncate">{recipe.name}</h4>
          <p className="text-[11px] text-white/60 font-game leading-snug line-clamp-2">{recipe.description}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className={`text-[10px] font-game px-1.5 py-0.5 rounded ${
              levelEnough
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              🔨 工坊 Lv.{recipe.requiredWorkshopLevel}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <div className="text-[10px] text-white/50 font-game mb-1.5">📜 材料需求</div>
        <div className="flex flex-wrap gap-1.5">
          {materialStatus.map((mat, i) => (
            <span
              key={i}
              className={`text-xs font-game px-2 py-0.5 rounded-lg border ${
                mat.enough
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-red-500/15 text-red-300 border-red-500/30'
              }`}
            >
              {RESOURCE_EMOJI[mat.type]} {resources[mat.type]}/{mat.amount}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-3 bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/5">
        <div className="flex items-center gap-1.5 text-xs font-game">
          <span className="text-white/50">📦 产出:</span>
          {'type' in recipe.output ? (
            <span className="text-amber-300">
              {RESOURCE_EMOJI[recipe.output.type as string]} ×{recipe.output.amount}
            </span>
          ) : (
            <span className="text-amber-300">{recipe.emoji} ×{recipe.output.amount}</span>
          )}
        </div>
      </div>

      <button
        onClick={() => craftItem(recipe.id)}
        disabled={!canCraft}
        className={`w-full py-2.5 rounded-lg font-game text-sm transition-all duration-200 ${
          canCraft
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-98'
            : 'bg-white/10 text-white/40 cursor-not-allowed'
        }`}
      >
        {!levelEnough ? `🔒 工坊需 Lv.${recipe.requiredWorkshopLevel}` : !allMaterialsEnough ? '❌ 材料不足' : '🔨 开始制作'}
      </button>
    </div>
  );
}

function CraftingTable() {
  const facilities = useGameStore((s) => s.facilities);
  const [filter, setFilter] = useState<'all' | 'available' | 'locked'>('all');

  const filteredRecipes = RECIPES.filter((r) => {
    const levelEnough = facilities.workshop >= r.requiredWorkshopLevel;
    if (filter === 'available') return levelEnough;
    if (filter === 'locked') return !levelEnough;
    return true;
  });

  return (
    <div className="rounded-2xl p-5 md:p-6 card-shadow" style={{
      background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.15) 0%, rgba(217, 119, 6, 0.1) 50%, rgba(194, 65, 12, 0.15) 100%)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(234, 88, 12, 0.3)',
    }}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-title text-2xl text-white flex items-center gap-2">
          <span className="text-3xl">🔨</span> 道具制作台
        </h3>
        <div className="flex items-center gap-1 bg-orange-900/30 p-1 rounded-lg border border-orange-600/30">
          {([
            { key: 'all', label: '全部' },
            { key: 'available', label: '可制作' },
            { key: 'locked', label: '未解锁' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 rounded-md text-xs font-game transition-all duration-200 ${
                filter === key
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRecipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-3 opacity-50">🔨</div>
          <p className="text-white/60 font-game">
            {filter === 'available' ? '暂无可制作的配方，升级工坊解锁更多！' : '没有符合条件的配方'}
          </p>
        </div>
      )}
    </div>
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
    <div className={`rounded-xl p-4 card-shadow border-2 ${rarityClass(equipment.rarity)}`}>
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
            className={`h-full rounded-full transition-all duration-500 ${
              durPercent >= 70 ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                : durPercent >= 40 ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
                : 'bg-gradient-to-r from-red-500 to-rose-500'
            }`}
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
          className={`w-full py-2.5 rounded-lg font-game text-sm transition-all duration-200 ${
            canRepair
              ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-amber-900 shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 hover:scale-[1.02] active:scale-98'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          }`}
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
  return (
    <div className="page-enter container mx-auto px-4 py-6 space-y-6">
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

      <ResourceGathering />
      <CraftingTable />
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
      `}</style>
    </div>
  );
}
