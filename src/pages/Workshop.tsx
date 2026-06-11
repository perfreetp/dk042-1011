import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { RECIPES } from '../data/recipes';
import { ITEMS, getItemById } from '../data/items';
import type { Recipe, Equipment, ResourceType, Rarity, Item, Pet, Egg } from '../types';

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

interface CollectAnim {
  type: string;
  amount: number;
  key: number;
}

const COLLECT_COOLDOWN = 3000;

function ResourceGathering() {
  const resources = useGameStore((s) => s.resources);
  const facilities = useGameStore((s) => s.facilities);
  const collectResource = useGameStore((s) => s.collectResource);
  const getWarehouseCapacity = useGameStore((s) => s.getWarehouseCapacity);
  const [collectAnim, setCollectAnim] = useState<CollectAnim | null>(null);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
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
    if (resources[point.type] >= capacity) return;

    setCooldowns((prev) => ({ ...prev, [point.type]: now + COLLECT_COOLDOWN }));

    setTimeout(() => {
      const amount = collectResource(point.type);
      setCollectAnim({ type: point.type, amount, key: Date.now() });

      setTimeout(() => setCollectAnim(null), 1500);
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
          const onCooldown = isOnCooldown(point.type);
          const cooldownPercent = getCooldownPercent(point.type);
          const showAnim = collectAnim?.type === point.type;
          const isFull = current >= capacity;

          return (
            <div
              key={point.type}
              className={`relative rounded-2xl p-5 ${point.bgColor} border-2 ${point.borderColor} overflow-hidden transition-all duration-300 ${!onCooldown && !isFull ? 'hover:scale-[1.02]' : ''}`}
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

              {onCooldown && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-1 opacity-60">{point.emoji}</div>
                    <div className="font-game text-white/80 text-sm">冷却中...</div>
                    <div className="w-20 h-2 bg-black/40 rounded-full mt-2 overflow-hidden mx-auto">
                      <div
                        className={`h-full bg-gradient-to-r ${point.gradient} transition-all duration-100`}
                        style={{ width: `${100 - cooldownPercent}%` }}
                      />
                    </div>
                  </div>
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
                  disabled={onCooldown || isFull}
                  className={`w-full py-3 rounded-xl bg-gradient-to-r ${point.gradient} text-white font-title text-lg shadow-lg ${point.shadowColor} hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 relative overflow-hidden`}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isFull ? '📦 仓库已满' : onCooldown ? '⏱️ 冷却中' : `${point.emoji} 采集`}
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

interface CraftAnim {
  recipeId: string;
  key: number;
  itemEmoji?: string;
  itemName?: string;
  amount: number;
}

function RecipeCard({ recipe, onCraft }: { recipe: Recipe; onCraft: (recipeId: string) => void }) {
  const resources = useGameStore((s) => s.resources);
  const facilities = useGameStore((s) => s.facilities);

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
            {outputItem && (
              <span className="text-[10px] font-game px-1.5 py-0.5 rounded bg-white/10 text-white/70 border border-white/10">
                {ITEM_TYPE_NAMES[outputItem.type]}
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
        <div className="text-[10px] text-white/50 font-game mb-1">📦 产出</div>
        <div className="flex items-center gap-1.5 text-sm font-game">
          {outputItem ? (
            <span className="text-amber-300 flex items-center gap-1">
              <span className="text-lg">{outputItem.emoji}</span>
              {outputItem.name} ×{recipe.output.amount}
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
        onClick={() => onCraft(recipe.id)}
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
            { key: 'tool', label: '工具' },
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
          <RecipeCard key={recipe.id} recipe={recipe} onCraft={handleCraft} />
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
                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 text-left ${
                      canUse
                        ? 'bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20'
                        : 'bg-white/5 border border-white/5 opacity-50 cursor-not-allowed'
                    }`}
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
                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 text-left ${
                      canUse
                        ? 'bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20'
                        : 'bg-white/5 border border-white/5 opacity-50 cursor-not-allowed'
                    }`}
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

function InventoryBag() {
  const inventory = useGameStore((s) => s.inventory);
  const useItem = useGameStore((s) => s.useItem);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const ownedItems = ITEMS.filter((item) => (inventory[item.id] || 0) > 0);
  const totalTypes = ownedItems.length;

  const gridSize = Math.max(12, Math.ceil(totalTypes / 4) * 4);
  const emptySlots = Array.from({ length: Math.max(0, gridSize - totalTypes) }, (_, i) => i);

  const handleItemClick = (item: Item) => {
    if (item.type === 'consumable' && item.effect) {
      setSelectedItem(item);
    }
  };

  const handleUseItem = (targetId: string) => {
    if (!selectedItem) return;
    useItem(selectedItem.id, targetId);
    setSelectedItem(null);
  };

  return (
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

          return (
            <div
              key={item.id}
              className="relative group"
            >
              <div
                className={`aspect-square rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition-all duration-200 hover:scale-105 ${rarityClass(item.rarity)}`}
                style={{ background: undefined }}
                onClick={() => handleItemClick(item)}
              >
                <div
                  className="w-full h-full rounded-lg flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                  }}
                >
                  <span className="text-2xl md:text-3xl">{item.emoji}</span>
                </div>
              </div>

              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-game px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-lg">
                ×{count}
              </div>

              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-10">
                <div className="bg-black/90 backdrop-blur-sm rounded-lg p-2 border border-white/20 text-center whitespace-nowrap">
                  <div className="font-title text-white text-sm">{item.name}</div>
                  <div className="text-[10px] text-white/60 font-game">
                    {RARITY_NAMES[item.rarity]} · {ITEM_TYPE_NAMES[item.type]}
                  </div>
                  <div className="text-[10px] text-white/70 font-game mt-1 max-w-[150px] whitespace-normal">
                    {item.description}
                  </div>
                  {isConsumable && (
                    <div className="text-[10px] text-amber-300 font-game mt-1">点击使用</div>
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

      {selectedItem && (
        <UseItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUse={handleUseItem}
        />
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
      <InventoryBag />
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
