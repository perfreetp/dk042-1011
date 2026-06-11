import { useState, useMemo } from 'react';
import { useGameStore } from '../store/useGameStore';
import { ITEMS, getItemById } from '../data/items';
import type { Pet, Egg, PetType, Rarity, Item } from '../types';

const TYPE_EMOJI: Record<PetType, string> = {
  fire: '🔥',
  water: '💧',
  earth: '🪨',
  wind: '💨',
  light: '✨',
  dark: '🌑',
};

const TYPE_NAMES: Record<PetType, string> = {
  fire: '火',
  water: '水',
  earth: '土',
  wind: '风',
  light: '光',
  dark: '暗',
};

const RARITY_NAMES: Record<Rarity, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

const rarityClass = (rarity: Rarity) => `rarity-${rarity}`;

const moodEmoji = (mood: number) => {
  if (mood >= 80) return '😊';
  if (mood >= 60) return '🙂';
  if (mood >= 40) return '😐';
  if (mood >= 20) return '😟';
  return '😢';
};

const progressBarColor = (value: number, max: number) => {
  const percent = (value / max) * 100;
  if (percent >= 70) return 'bg-emerald-500';
  if (percent >= 40) return 'bg-amber-500';
  return 'bg-red-500';
};

interface ItemSelectModalProps {
  items: Item[];
  inventory: Record<string, number>;
  onSelect: (itemId: string) => void;
  onClose: () => void;
  title: string;
}

function ItemSelectModal({ items, inventory, onSelect, onClose, title }: ItemSelectModalProps) {
  const availableItems = items.filter((item) => (inventory[item.id] || 0) > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-card rounded-2xl p-5 card-shadow w-full max-w-md mx-4 bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-title text-2xl text-white">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 text-white/80 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {availableItems.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {availableItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(item.id);
                  onClose();
                }}
                className={`w-full ${rarityClass(item.rarity)} rounded-xl p-3 text-left card-shadow hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-game text-white font-bold">{item.name}</span>
                      <span className="text-xs font-game text-white/80 bg-black/30 px-2 py-0.5 rounded-full">
                        ×{inventory[item.id]}
                      </span>
                    </div>
                    <p className="text-xs text-white/70 mt-0.5">{item.description}</p>
                  </div>
                  <span className="text-white/60 text-lg">→</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-5xl mb-3 opacity-50">📦</div>
            <p className="text-white/60 font-game">背包里没有可用的道具</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EggCard({ egg }: { egg: Egg }) {
  const accelerateHatch = useGameStore((s) => s.accelerateHatch);
  const hatchEgg = useGameStore((s) => s.hatchEgg);
  const spendResource = useGameStore((s) => s.spendResource);
  const addLog = useGameStore((s) => s.addLog);
  const resources = useGameStore((s) => s.resources);
  const inventory = useGameStore((s) => s.inventory);
  const useItem = useGameStore((s) => s.useItem);

  const isReady = egg.progress >= 100;
  const herbCost = 3;
  const acceleratorCount = inventory['hatch-accelerator'] || 0;

  const handleHerbAccelerate = () => {
    if (resources.herb < herbCost) {
      addLog('草药不足！需要 3 草药加速孵化', 'warning');
      return;
    }
    if (isReady) {
      addLog('这颗蛋已经可以孵化了！', 'info');
      return;
    }
    spendResource('herb', herbCost);
    accelerateHatch(egg.id, 10);
  };

  const handleAccelerator = () => {
    if (acceleratorCount <= 0) {
      addLog('孵化加速器不足！', 'warning');
      return;
    }
    if (isReady) {
      addLog('这颗蛋已经可以孵化了！', 'info');
      return;
    }
    useItem('hatch-accelerator', egg.id);
  };

  const handleHatch = () => {
    hatchEgg(egg.id);
  };

  return (
    <div className={`${rarityClass(egg.rarity)} rounded-xl p-4 card-shadow transition-all duration-300`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-4xl">{egg.emoji}</span>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs font-game text-white/90 bg-black/20 px-2 py-0.5 rounded-full">
            {RARITY_NAMES[egg.rarity]}
          </span>
          <span className="text-lg">{TYPE_EMOJI[egg.type]}</span>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-white/80 mb-1 font-game">
          <span>孵化进度</span>
          <span>{egg.progress}%</span>
        </div>
        <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isReady ? 'bg-gradient-to-r from-amber-400 to-yellow-300 glow' : 'bg-gradient-to-r from-pink-400 to-purple-400'
            }`}
            style={{ width: `${Math.min(100, egg.progress)}%` }}
          />
        </div>
      </div>

      {isReady ? (
        <button
          onClick={handleHatch}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-900 font-title text-lg shadow-lg hover:shadow-amber-500/50 hover:scale-105 active:scale-95 transition-all duration-200 glow"
        >
          🐣 孵化！
        </button>
      ) : (
        <div className="space-y-2">
          <button
            onClick={handleHerbAccelerate}
            disabled={resources.herb < herbCost}
            className="w-full py-2 rounded-lg bg-white/20 text-white font-game text-sm hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-102 active:scale-98 transition-all duration-200"
          >
            🌿 ×{herbCost} 草药加速 +10%
          </button>
          <button
            onClick={handleAccelerator}
            disabled={acceleratorCount <= 0}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-violet-500/80 to-purple-500/80 text-white font-game text-sm hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-102 active:scale-98 transition-all duration-200"
          >
            ⚡ 孵化器 ×{acceleratorCount} +30%
          </button>
        </div>
      )}
    </div>
  );
}

function PetCard({ pet, isSelected, inTeam, onClick }: {
  pet: Pet;
  isSelected: boolean;
  inTeam: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`${rarityClass(pet.rarity)} rounded-xl p-3 card-shadow cursor-pointer transition-all duration-300 ${
        isSelected ? 'ring-4 ring-amber-300 scale-105' : 'hover:scale-102'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{pet.emoji}</span>
        <div className="flex flex-col items-end gap-0.5">
          {inTeam && (
            <span className="text-[10px] font-game text-white bg-emerald-500 px-1.5 py-0.5 rounded-full">
              ✓ 队伍
            </span>
          )}
          <span className="text-xs font-game text-white/90 bg-black/20 px-1.5 py-0.5 rounded-full">
            Lv.{pet.level}
          </span>
        </div>
      </div>

      <h4 className="font-game text-white text-sm font-bold truncate mb-1">{pet.name}</h4>

      <div className="mb-1">
        <div className="flex justify-between text-[10px] text-white/70 mb-0.5">
          <span>HP</span>
          <span>{pet.hp}/{pet.maxHp}</span>
        </div>
        <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full ${progressBarColor(pet.hp, pet.maxHp)}`}
            style={{ width: `${(pet.hp / pet.maxHp) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-white/80 mt-1">
        <span className="font-game">{TYPE_EMOJI[pet.type]} {TYPE_NAMES[pet.type]}</span>
        <span className="text-lg" title={`心情 ${pet.mood}`}>{moodEmoji(pet.mood)}</span>
      </div>

      <div className="text-[10px] font-game text-white/70 mt-1 text-right">
        {RARITY_NAMES[pet.rarity]}
      </div>
    </div>
  );
}

interface PetDetailProps {
  pet: Pet;
  onOpenPotionModal: () => void;
  onOpenSnackModal: () => void;
}

function PetDetail({ pet, onOpenPotionModal, onOpenSnackModal }: PetDetailProps) {
  const feedPet = useGameStore((s) => s.feedPet);
  const restPet = useGameStore((s) => s.restPet);
  const resources = useGameStore((s) => s.resources);
  const team = useGameStore((s) => s.team);
  const addPetToTeam = useGameStore((s) => s.addPetToTeam);
  const removePetFromTeam = useGameStore((s) => s.removePetFromTeam);
  const inventory = useGameStore((s) => s.inventory);

  const inTeam = team.includes(pet.id);

  const healItemsCount = useMemo(() => {
    return ITEMS.filter((item) => item.effect?.type === 'heal')
      .reduce((sum, item) => sum + (inventory[item.id] || 0), 0);
  }, [inventory]);

  const moodStaminaItemsCount = useMemo(() => {
    return ITEMS.filter((item) => item.effect?.type === 'moodBoost' || item.effect?.type === 'staminaBoost')
      .reduce((sum, item) => sum + (inventory[item.id] || 0), 0);
  }, [inventory]);

  return (
    <div className="glass-card rounded-2xl p-5 card-shadow">
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/10">
        <div className={`${rarityClass(pet.rarity)} w-20 h-20 rounded-2xl flex items-center justify-center text-5xl shrink-0`}>
          {pet.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-title text-2xl text-white truncate">{pet.name}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-xs font-game text-white/80 bg-white/10 px-2 py-0.5 rounded-full">
              {TYPE_EMOJI[pet.type]} {TYPE_NAMES[pet.type]}系
            </span>
            <span className={`text-xs font-game text-white px-2 py-0.5 rounded-full ${rarityClass(pet.rarity)}`}>
              {RARITY_NAMES[pet.rarity]}
            </span>
            <span className="text-xs font-game text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full">
              Lv.{pet.level}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-red-500/20 rounded-xl p-3 text-center border border-red-500/30">
          <div className="text-2xl mb-1">❤️</div>
          <div className="text-[10px] font-game text-white/60">HP</div>
          <div className="font-title text-xl text-white">{pet.maxHp}</div>
        </div>
        <div className="bg-orange-500/20 rounded-xl p-3 text-center border border-orange-500/30">
          <div className="text-2xl mb-1">⚔️</div>
          <div className="text-[10px] font-game text-white/60">攻击</div>
          <div className="font-title text-xl text-white">{pet.attack}</div>
        </div>
        <div className="bg-blue-500/20 rounded-xl p-3 text-center border border-blue-500/30">
          <div className="text-2xl mb-1">🛡️</div>
          <div className="text-[10px] font-game text-white/60">防御</div>
          <div className="font-title text-xl text-white">{pet.defense}</div>
        </div>
        <div className="bg-green-500/20 rounded-xl p-3 text-center border border-green-500/30">
          <div className="text-2xl mb-1">💨</div>
          <div className="text-[10px] font-game text-white/60">速度</div>
          <div className="font-title text-xl text-white">{pet.speed}</div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <div className="flex justify-between text-sm text-white/80 mb-1 font-game">
            <span>❤️ 生命值</span>
            <span>{pet.hp} / {pet.maxHp}</span>
          </div>
          <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressBarColor(pet.hp, pet.maxHp)}`}
              style={{ width: `${(pet.hp / pet.maxHp) * 100}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm text-white/80 mb-1 font-game">
            <span>{moodEmoji(pet.mood)} 心情值</span>
            <span>{pet.mood} / 100</span>
          </div>
          <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressBarColor(pet.mood, 100)}`}
              style={{ width: `${pet.mood}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm text-white/80 mb-1 font-game">
            <span>⚡ 体力值</span>
            <span>{pet.stamina} / 100</span>
          </div>
          <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressBarColor(pet.stamina, 100)}`}
              style={{ width: `${pet.stamina}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-game text-white text-sm mb-2 flex items-center gap-1">
          <span>🎯</span> 技能列表
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {pet.skills.map((skill) => (
            <div
              key={skill.id}
              className="bg-white/10 rounded-lg p-2.5 border border-white/10 hover:bg-white/15 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{skill.emoji}</span>
                <span className="font-game text-white text-sm font-bold">{skill.name}</span>
                <span className="ml-auto text-[10px] font-game text-white/60 bg-black/30 px-1.5 rounded">
                  CD:{skill.cooldown}
                </span>
              </div>
              <p className="text-[11px] text-white/70 leading-snug">{skill.description}</p>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-white/60 font-game">
                <span>💥 伤害: {skill.damage}</span>
                <span>{TYPE_EMOJI[skill.type]} {TYPE_NAMES[skill.type]}系</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => feedPet(pet.id)}
          disabled={resources.herb < 5}
          className="py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-game shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
        >
          <div className="text-base mb-0.5">🍖 喂食</div>
          <div className="text-[10px] text-white/80">🌿-5 / 心情+25 体力+15</div>
        </button>
        <button
          onClick={() => restPet(pet.id)}
          className="py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-game shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <div className="text-base mb-0.5">💤 休息</div>
          <div className="text-[10px] text-white/80">恢复HP+30% 体力+40</div>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={onOpenPotionModal}
          disabled={healItemsCount <= 0}
          className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-game shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
        >
          <div className="text-base mb-0.5">🧪 药水</div>
          <div className="text-[10px] text-white/80">治疗类 ×{healItemsCount}</div>
        </button>
        <button
          onClick={onOpenSnackModal}
          disabled={moodStaminaItemsCount <= 0}
          className="py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-game shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
        >
          <div className="text-base mb-0.5">🍰 零食</div>
          <div className="text-[10px] text-white/80">心情体力类 ×{moodStaminaItemsCount}</div>
        </button>
      </div>

      {inTeam ? (
        <button
          onClick={() => removePetFromTeam(pet.id)}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-game shadow-lg hover:scale-102 active:scale-98 transition-all duration-200"
        >
          🚫 移出队伍
        </button>
      ) : (
        <button
          onClick={() => addPetToTeam(pet.id)}
          disabled={team.length >= 3}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-game shadow-lg hover:scale-102 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
        >
          {team.length >= 3 ? '⚠️ 队伍已满（最多3只）' : '✅ 加入队伍'}
        </button>
      )}
    </div>
  );
}

function TeamBuilder({ selectedPetId }: { selectedPetId: string | null }) {
  const pets = useGameStore((s) => s.pets);
  const team = useGameStore((s) => s.team);
  const addPetToTeam = useGameStore((s) => s.addPetToTeam);
  const removePetFromTeam = useGameStore((s) => s.removePetFromTeam);

  const teamPets = team.map((id) => pets.find((p) => p.id === id)).filter(Boolean) as Pet[];

  const slots = [0, 1, 2];

  return (
    <div className="glass-card rounded-2xl p-5 card-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-title text-xl text-white flex items-center gap-2">
          <span>⚔️</span> 远征编队
        </h3>
        <span className="text-xs font-game text-white/70 bg-white/10 px-2.5 py-1 rounded-full">
          {team.length} / 3
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {slots.map((i) => {
          const pet = teamPets[i];
          if (pet) {
            return (
              <div
                key={i}
                className={`${rarityClass(pet.rarity)} rounded-xl p-3 text-center card-shadow relative`}
              >
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                  {i + 1}
                </div>
                <div className="text-3xl mb-1">{pet.emoji}</div>
                <div className="text-xs font-game text-white truncate font-bold">{pet.name}</div>
                <div className="text-[10px] text-white/70 font-game">Lv.{pet.level}</div>
              </div>
            );
          }
          return (
            <div
              key={i}
              className="rounded-xl p-3 text-center border-2 border-dashed border-white/20 bg-white/5 min-h-[100px] flex flex-col items-center justify-center"
            >
              <div className="text-3xl mb-1 opacity-30">➕</div>
              <div className="text-[10px] font-game text-white/40">空位 {i + 1}</div>
            </div>
          );
        })}
      </div>

      {selectedPetId && (
        <div className="pt-3 border-t border-white/10">
          {team.includes(selectedPetId) ? (
            <button
              onClick={() => removePetFromTeam(selectedPetId)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-game shadow-lg hover:scale-102 active:scale-98 transition-all duration-200"
            >
              🚫 移出队伍
            </button>
          ) : (
            <button
              onClick={() => addPetToTeam(selectedPetId)}
              disabled={team.length >= 3}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-game shadow-lg hover:scale-102 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
            >
              {team.length >= 3 ? '⚠️ 队伍已满（最多3只）' : '✅ 加入队伍'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface QuickItemBarProps {
  onUseItem: (itemId: string) => void;
  disabled: boolean;
}

function QuickItemBar({ onUseItem, disabled }: QuickItemBarProps) {
  const inventory = useGameStore((s) => s.inventory);

  const quickItems = [
    { id: 'heal-potion', emoji: '🧪', name: '治疗药水', color: 'from-emerald-500 to-teal-500' },
    { id: 'mood-snack', emoji: '🍰', name: '美味零食', color: 'from-pink-500 to-rose-500' },
    { id: 'energy-drink', emoji: '🥤', name: '能量饮料', color: 'from-amber-500 to-orange-500' },
  ];

  return (
    <div className="glass-card rounded-2xl p-4 card-shadow">
      <h3 className="font-title text-lg text-white mb-3 flex items-center gap-2">
        <span>🎒</span> 道具快捷栏
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {quickItems.map((item) => {
          const count = inventory[item.id] || 0;
          const itemData = getItemById(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onUseItem(item.id)}
              disabled={disabled || count <= 0}
              className={`py-3 rounded-xl bg-gradient-to-b ${item.color} text-white font-game shadow-lg hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 flex flex-col items-center`}
              title={itemData?.description || ''}
            >
              <span className="text-2xl mb-1">{item.emoji}</span>
              <span className="text-[10px]">×{count}</span>
            </button>
          );
        })}
      </div>
      {disabled && (
        <p className="text-[11px] text-white/50 text-center mt-2 font-game">请先选择一只宠物</p>
      )}
    </div>
  );
}

export default function Hut() {
  const eggs = useGameStore((s) => s.eggs);
  const pets = useGameStore((s) => s.pets);
  const inventory = useGameStore((s) => s.inventory);
  const useItem = useGameStore((s) => s.useItem);
  const addLog = useGameStore((s) => s.addLog);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(pets[0]?.id ?? null);
  const team = useGameStore((s) => s.team);

  const [showPotionModal, setShowPotionModal] = useState(false);
  const [showSnackModal, setShowSnackModal] = useState(false);
  const [showQuickItemModal, setShowQuickItemModal] = useState(false);
  const [quickItemId, setQuickItemId] = useState<string | null>(null);

  const selectedPet = pets.find((p) => p.id === selectedPetId) ?? null;

  const healItems = useMemo(
    () => ITEMS.filter((item) => item.effect?.type === 'heal'),
    []
  );

  const snackItems = useMemo(
    () => ITEMS.filter((item) => item.effect?.type === 'moodBoost' || item.effect?.type === 'staminaBoost'),
    []
  );

  const handleUsePotion = (itemId: string) => {
    if (selectedPetId) {
      useItem(itemId, selectedPetId);
    }
  };

  const handleUseSnack = (itemId: string) => {
    if (selectedPetId) {
      useItem(itemId, selectedPetId);
    }
  };

  const handleQuickItem = (itemId: string) => {
    if (!selectedPetId) {
      addLog('请先选择一只宠物！', 'warning');
      return;
    }
    const count = inventory[itemId] || 0;
    if (count <= 0) {
      addLog('道具数量不足！', 'warning');
      return;
    }
    setQuickItemId(itemId);
    setShowQuickItemModal(true);
  };

  const confirmQuickItem = () => {
    if (quickItemId && selectedPetId) {
      useItem(quickItemId, selectedPetId);
    }
    setShowQuickItemModal(false);
    setQuickItemId(null);
  };

  const quickItemData = quickItemId ? getItemById(quickItemId) : null;

  return (
    <div className="page-enter container mx-auto px-4 py-6 space-y-6">
      <div className="glass-card rounded-2xl p-6 card-shadow">
        <h2 className="font-title text-3xl md:text-4xl text-white mb-2 drop-shadow flex items-center gap-3">
          <span className="text-4xl">🏠</span> 宠物小屋
        </h2>
        <p className="text-white/80 text-base leading-relaxed font-game">
          这里是你可爱宠物们温馨的家。孵化新伙伴、照顾你的宠物、编组最强远征队！
        </p>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🥚</span>
          <h3 className="font-title text-2xl text-white">孵化巢</h3>
          <span className="text-xs font-game text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
            {eggs.length} 个蛋
          </span>
        </div>
        {eggs.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {eggs.map((egg) => (
              <EggCard key={egg.id} egg={egg} />
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-xl p-8 text-center">
            <div className="text-5xl mb-3 opacity-50">🥚</div>
            <p className="text-white/60 font-game">暂时没有宠物蛋，去远征中获取吧！</p>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🐾</span>
            <h3 className="font-title text-2xl text-white">宠物列表</h3>
            <span className="text-xs font-game text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
              {pets.length} 只宠物
            </span>
          </div>
          {pets.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {pets.map((pet) => (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  isSelected={selectedPetId === pet.id}
                  inTeam={team.includes(pet.id)}
                  onClick={() => setSelectedPetId(pet.id)}
                />
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-xl p-8 text-center">
              <div className="text-5xl mb-3 opacity-50">🐾</div>
              <p className="text-white/60 font-game">还没有宠物，快去孵化一个吧！</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <TeamBuilder selectedPetId={selectedPetId} />
          <QuickItemBar
            onUseItem={handleQuickItem}
            disabled={!selectedPetId}
          />
          {selectedPet && (
            <PetDetail
              pet={selectedPet}
              onOpenPotionModal={() => setShowPotionModal(true)}
              onOpenSnackModal={() => setShowSnackModal(true)}
            />
          )}
        </div>
      </div>

      {showPotionModal && selectedPetId && (
        <ItemSelectModal
          items={healItems}
          inventory={inventory}
          title="🧪 选择治疗药水"
          onSelect={handleUsePotion}
          onClose={() => setShowPotionModal(false)}
        />
      )}

      {showSnackModal && selectedPetId && (
        <ItemSelectModal
          items={snackItems}
          inventory={inventory}
          title="🍰 选择零食"
          onSelect={handleUseSnack}
          onClose={() => setShowSnackModal(false)}
        />
      )}

      {showQuickItemModal && quickItemData && selectedPet && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowQuickItemModal(false)}
        >
          <div
            className="glass-card rounded-2xl p-5 card-shadow w-full max-w-sm mx-4 bounce-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-title text-2xl text-white text-center mb-4">确认使用</h3>
            <div className="text-center mb-4">
              <div className="text-6xl mb-2">{quickItemData.emoji}</div>
              <div className="font-game text-white text-lg font-bold">{quickItemData.name}</div>
              <div className="text-sm text-white/70 mt-1">{quickItemData.description}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 mb-4">
              <div className="text-center text-white/80 text-sm font-game">
                对 <span className="text-white font-bold">{selectedPet.emoji} {selectedPet.name}</span> 使用？
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowQuickItemModal(false)}
                className="py-2.5 rounded-xl bg-white/10 text-white font-game hover:bg-white/20 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmQuickItem}
                className={`py-2.5 rounded-xl ${rarityClass(quickItemData.rarity)} text-white font-game hover:scale-105 active:scale-95 transition-all duration-200`}
              >
                确认使用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
