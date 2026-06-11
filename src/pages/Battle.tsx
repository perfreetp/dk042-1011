import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBattle } from '../hooks/useBattle';
import { useGameStore } from '../store/useGameStore';
import { createMonsterFromTemplate } from '../data/monsters';
import { SYNERGY_SKILLS } from '../data/pets';
import { getDiscoveryById } from '../data/discoveries';
import { RESOURCE_NAMES, RESOURCE_EMOJIS, PET_TYPE_COLORS, PET_TYPE_NAMES } from '../utils/formatters';
import { cn } from '../lib/utils';
import type { Pet, Monster, ResourceReward, PetType } from '../types';

type Difficulty = 'easy' | 'normal' | 'hard';

interface DamageNumber {
  id: string;
  targetId: string;
  value: number;
  type: 'damage' | 'heal' | 'crit';
  x: number;
}

interface DifficultyConfig {
  name: string;
  emoji: string;
  description: string;
  recommendedLevel: string;
  monsterCount: number;
  levelMultiplier: number;
  monsterPool: string[];
  isElite?: boolean;
}

const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    name: '简单战斗',
    emoji: '🌱',
    description: '1只低等级怪物，适合新手练习',
    recommendedLevel: 'Lv.1-3',
    monsterCount: 1,
    levelMultiplier: 0.8,
    monsterPool: ['monster-slime', 'monster-slime', 'monster-fire-wolf'],
  },
  normal: {
    name: '普通战斗',
    emoji: '⚔️',
    description: '2只中等怪物，有一定挑战',
    recommendedLevel: 'Lv.3-6',
    monsterCount: 2,
    levelMultiplier: 1.1,
    monsterPool: ['monster-fire-wolf', 'monster-rock-golem', 'monster-harpy', 'monster-sea-serpent'],
  },
  hard: {
    name: '困难战斗',
    emoji: '💀',
    description: '3只高等级怪物+精英，奖励丰厚',
    recommendedLevel: 'Lv.6+',
    monsterCount: 3,
    levelMultiplier: 1.5,
    monsterPool: ['monster-shadow', 'monster-angel', 'monster-kraken', 'monster-phoenix', 'monster-dragon'],
    isElite: true,
  },
};

const getHpBarColor = (current: number, max: number): string => {
  const ratio = current / max;
  if (ratio > 0.6) return 'bg-gradient-to-r from-emerald-400 to-emerald-500';
  if (ratio > 0.3) return 'bg-gradient-to-r from-yellow-400 to-orange-500';
  return 'bg-gradient-to-r from-red-500 to-red-600';
};

export default function Battle() {
  const navigate = useNavigate();
  const gameStore = useGameStore();

  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [autoBattle, setAutoBattle] = useState(false);
  const [speed, setSpeed] = useState<1 | 2>(1);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [hurtTargets, setHurtTargets] = useState<Set<string>>(new Set());
  const [attackers, setAttackers] = useState<Set<string>>(new Set());
  const [showFlash, setShowFlash] = useState(false);
  const [hasFinalized, setHasFinalized] = useState(false);

  const logEndRef = useRef<HTMLDivElement>(null);
  const battleTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const roundDelay = speed === 1 ? 1500 : 750;

  const roundDelayRef = useRef(roundDelay);
  useEffect(() => {
    roundDelayRef.current = roundDelay;
  }, [roundDelay]);

  const {
    battleState,
    initBattle,
    processRound,
    useSynergy: triggerSynergy,
    finalizeBattle,
    resetBattle,
    canUseSynergy,
    isFighting,
    isPlayerWin,
    isEnemyWin,
    isFinished,
  } = useBattle({ roundDelay });

  const teamPets = useMemo(() => {
    return gameStore.team
      .map((id) => gameStore.pets.find((p) => p.id === id))
      .filter((p): p is Pet => p !== undefined);
  }, [gameStore.team, gameStore.pets]);

  const previewMonsters = useMemo(() => {
    if (!selectedDifficulty) return [];
    const config = DIFFICULTY_CONFIGS[selectedDifficulty];
    const monsters: Monster[] = [];
    for (let i = 0; i < config.monsterCount; i++) {
      const templateId = config.monsterPool[i % config.monsterPool.length];
      const monster = createMonsterFromTemplate(
        templateId,
        config.levelMultiplier,
        `preview-${i}`
      );
      if (monster) monsters.push(monster);
    }
    return monsters;
  }, [selectedDifficulty]);

  const synergySkillInfo = useMemo(() => {
    if (battleState.playerTeam.length === 0) return SYNERGY_SKILLS[SYNERGY_SKILLS.length - 1];
    const petTypes = new Set(battleState.playerTeam.filter(p => p.hp > 0).map((p) => p.type));
    let matched = SYNERGY_SKILLS[SYNERGY_SKILLS.length - 1];
    for (const skill of SYNERGY_SKILLS) {
      if (skill.requiredBonds.length === 0) continue;
      const hasAll = skill.requiredBonds.every((type) => petTypes.has(type as PetType));
      if (hasAll && skill.requiredBonds.length > matched.requiredBonds.length) {
        matched = skill;
      }
    }
    return matched;
  }, [battleState.playerTeam]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [battleState.battleLog.length]);

  useEffect(() => {
    if (!isFighting || !autoBattle) {
      if (battleTimer.current) {
        clearInterval(battleTimer.current);
        battleTimer.current = null;
      }
      return;
    }

    battleTimer.current = setInterval(() => {
      processRound();
    }, roundDelayRef.current);

    return () => {
      if (battleTimer.current) {
        clearInterval(battleTimer.current);
        battleTimer.current = null;
      }
    };
  }, [isFighting, autoBattle, processRound]);

  useEffect(() => {
    const lastActions = battleState.actionQueue.slice(-10);
    const newDamageNums: DamageNumber[] = [];
    const newHurt = new Set<string>();
    const newAttackers = new Set<string>();

    const now = Date.now();
    for (const action of lastActions) {
      if (now - action.timestamp > 1500) continue;

      const isCrit = action.damage >= 50 || Math.random() < 0.15;
      newDamageNums.push({
        id: `${action.timestamp}-${action.targetId}-${Math.random()}`,
        targetId: action.targetId,
        value: action.damage,
        type: isCrit ? 'crit' : 'damage',
        x: Math.random() * 30 - 15,
      });
      newHurt.add(action.targetId);
      newAttackers.add(action.actorId);
    }

    if (newDamageNums.length > 0) {
      setDamageNumbers((prev) => [...prev, ...newDamageNums]);
      setHurtTargets(newHurt);
      setAttackers(newAttackers);

      setTimeout(() => {
        setDamageNumbers((prev) =>
          prev.filter((d) => !newDamageNums.some((n) => n.id === d.id))
        );
      }, 1500);

      setTimeout(() => {
        setHurtTargets(new Set());
        setAttackers(new Set());
      }, 600);
    }
  }, [battleState.actionQueue]);

  useEffect(() => {
    if (isFinished && !hasFinalized) {
      setHasFinalized(true);
      setTimeout(() => {
        finalizeBattle();
      }, 500);
    }
  }, [isFinished, hasFinalized, finalizeBattle]);

  const handleStartBattle = () => {
    if (!selectedDifficulty || teamPets.length === 0) return;
    const config = DIFFICULTY_CONFIGS[selectedDifficulty];

    const monsterIds: string[] = [];
    for (let i = 0; i < config.monsterCount; i++) {
      monsterIds.push(config.monsterPool[i % config.monsterPool.length]);
    }

    resetBattle();
    setHasFinalized(false);
    setAutoBattle(false);
    initBattle(teamPets, monsterIds, config.levelMultiplier, selectedDifficulty);

    setTimeout(() => {
      setAutoBattle(true);
    }, 500);
  };

  const handleSynergySkill = () => {
    if (!canUseSynergy) return;
    setShowFlash(true);
    triggerSynergy();
    setTimeout(() => setShowFlash(false), 500);
  };

  const handleReturnToCamp = () => {
    resetBattle();
    navigate('/camp');
  };

  const renderPetCard = (pet: Pet, isEnemy: boolean = false) => {
    const isHurt = hurtTargets.has(pet.id);
    const isAttacking = attackers.has(pet.id);
    const isDefeated = pet.hp <= 0;
    const hpRatio = (pet.hp / pet.maxHp) * 100;
    const damages = damageNumbers.filter((d) => d.targetId === pet.id);

    return (
      <div
        key={pet.id}
        className={cn(
          'relative flex flex-col items-center p-3 md:p-4 rounded-xl border-2 transition-all min-w-[120px] md:min-w-[140px]',
          `type-${pet.type}`,
          isHurt && 'hurt-flash shake-hard',
          !isDefeated && !isEnemy && 'breathe',
          isAttacking && (isEnemy ? 'attack-lunge-left' : 'attack-lunge'),
          isDefeated && 'defeated'
        )}
      >
        <div className="relative">
          <div
            className={cn(
              'text-[3rem] md:text-[4rem] select-none transition-transform',
              isAttacking && 'scale-110'
            )}
          >
            {pet.emoji}
          </div>

          {damages.map((d) => (
            <div
              key={d.id}
              className={cn(
                'absolute left-1/2 -translate-x-1/2 top-0 whitespace-nowrap text-2xl md:text-3xl font-bold pointer-events-none z-20',
                d.type === 'crit' ? 'crit-float text-yellow-300' : 'damage-float text-red-400'
              )}
              style={{ marginLeft: `${d.x}px` }}
            >
              {d.type === 'crit' && '💥'}
              -{d.value}
            </div>
          ))}
        </div>

        <div className="w-full mt-2 text-center">
          <p className="text-white text-sm md:text-base font-game truncate">
            {pet.name}
          </p>
          <p className={cn('text-xs font-game', PET_TYPE_COLORS[pet.type])}>
            {PET_TYPE_NAMES[pet.type]} · Lv.{pet.level}
          </p>
        </div>

        <div className="w-full mt-2">
          <div className="w-full bg-black/40 rounded-full h-2.5 md:h-3 overflow-hidden border border-white/20">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                getHpBarColor(pet.hp, pet.maxHp)
              )}
              style={{ width: `${hpRatio}%` }}
            />
          </div>
          <p className="text-white/80 text-[10px] md:text-xs font-game text-center mt-1">
            {pet.hp} / {pet.maxHp}
          </p>
        </div>

        {!isEnemy && (
          <div className="w-full mt-1">
            <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden border border-cyan-400/30">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${(pet.stamina / 100) * 100}%` }}
              />
            </div>
            <p className="text-cyan-300/70 text-[9px] font-game text-center mt-0.5">
              ⚡ 体力 {pet.stamina}%
            </p>
          </div>
        )}
      </div>
    );
  };

  if (battleState.phase === 'idle') {
    return (
      <div className="page-enter container mx-auto px-4 py-6 md:py-8">
        <div className="glass-card rounded-2xl p-5 md:p-8 card-shadow">
          <h2 className="font-title text-3xl md:text-4xl text-white mb-2 drop-shadow text-center">
            ⚔️ 遭遇战 - 选择战斗目标
          </h2>
          <p className="text-white/80 text-center font-game mb-6 md:mb-8">
            选择难度，挑战怪物，赢取丰厚奖励！
          </p>

          <div className="mb-6 md:mb-8">
            <h3 className="font-title text-xl text-sky-300 mb-3 md:mb-4">🐾 你的队伍</h3>
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              {teamPets.map((pet) => (
                <div
                  key={pet.id}
                  className={cn(
                    'flex flex-col items-center p-3 md:p-4 rounded-xl border-2 breathe',
                    `type-${pet.type}`
                  )}
                >
                  <div className="text-[2.5rem] md:text-[3.5rem]">{pet.emoji}</div>
                  <p className="text-white text-sm md:text-base font-game mt-2 truncate w-full text-center">
                    {pet.name}
                  </p>
                  <p className={cn('text-xs font-game', PET_TYPE_COLORS[pet.type])}>
                    Lv.{pet.level}
                  </p>
                  <div className="w-full mt-2">
                    <div className="w-full bg-black/40 rounded-full h-2 md:h-2.5 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          getHpBarColor(pet.hp, pet.maxHp)
                        )}
                        style={{ width: `${(pet.hp / pet.maxHp) * 100}%` }}
                      />
                    </div>
                    <p className="text-white/70 text-[10px] md:text-xs font-game text-center mt-1">
                      ❤️ {pet.hp}/{pet.maxHp}
                    </p>
                  </div>
                </div>
              ))}
              {teamPets.length === 0 && (
                <div className="col-span-3 text-center text-white/60 py-8 font-game">
                  队伍为空，请先在营地编组队伍！
                </div>
              )}
            </div>
          </div>

          <div className="mb-6 md:mb-8">
            <h3 className="font-title text-xl text-amber-300 mb-3 md:mb-4">🎯 选择难度</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {(Object.keys(DIFFICULTY_CONFIGS) as Difficulty[]).map((diff) => {
                const config = DIFFICULTY_CONFIGS[diff];
                const isSelected = selectedDifficulty === diff;

                return (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className={cn(
                      'p-4 md:p-5 rounded-xl border-2 text-left transition-all hover:scale-[1.02]',
                      isSelected
                        ? 'border-amber-400 bg-amber-400/20 shadow-lg shadow-amber-500/30'
                        : 'border-white/20 bg-white/5 hover:border-white/40'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl md:text-3xl">{config.emoji}</span>
                      <h4 className="font-title text-lg md:text-xl text-white">
                        {config.name}
                      </h4>
                    </div>
                    <p className="text-white/70 text-sm font-game mb-2">
                      {config.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs md:text-sm font-game mb-3">
                      <span className="px-2 py-0.5 rounded-full bg-sky-500/30 text-sky-200 border border-sky-400/30">
                        推荐 {config.recommendedLevel}
                      </span>
                      {config.isElite && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/30 text-red-200 border border-red-400/30">
                          ⭐ 含精英
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] md:text-xs font-game text-amber-300/90">
                      🎁 怪物数: {config.monsterCount} · 倍率: x{config.levelMultiplier}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDifficulty && (
            <div className="mb-6 md:mb-8 bounce-in">
              <h3 className="font-title text-lg text-rose-300 mb-3">👹 敌人预览</h3>
              <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                {previewMonsters.map((m, idx) => (
                  <div
                    key={`preview-${idx}`}
                    className={cn(
                      'flex flex-col items-center p-3 rounded-xl border-2 min-w-[100px]',
                      `type-${m.type}`
                    )}
                  >
                    <div className="text-3xl md:text-4xl">{m.emoji}</div>
                    <p className="text-white text-sm font-game mt-1">{m.name}</p>
                    <p className={cn('text-xs font-game', PET_TYPE_COLORS[m.type])}>
                      {PET_TYPE_NAMES[m.type]}
                    </p>
                    <p className="text-white/70 text-xs font-game">
                      HP: {m.hp} · ATK: {m.attack}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 md:p-4 rounded-xl bg-black/30 border border-amber-400/30">
                <h4 className="font-title text-amber-300 mb-2 text-sm md:text-base">
                  💎 预期奖励预览
                </h4>
                <div className="flex flex-wrap gap-2 text-xs md:text-sm font-game">
                  <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-400/30">
                    💰 金币: ~{Math.round(previewMonsters.reduce((s, m) => s + (m.rewards.find(r => r.type === 'gold')?.amount || 0) * 0.9, 0))}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    ⭐ 经验: ~{Math.round(previewMonsters.reduce((s, m) => s + m.expReward * 0.9, 0))}
                  </span>
                  {DIFFICULTY_CONFIGS[selectedDifficulty].isElite && (
                    <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                      ✨ 稀有发现概率高
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={handleStartBattle}
              disabled={!selectedDifficulty || teamPets.length === 0}
              className={cn(
                'pixel-border px-8 md:px-12 py-3 md:py-4 font-title text-xl md:text-2xl text-white transition-all',
                selectedDifficulty && teamPets.length > 0
                  ? 'bg-gradient-to-r from-red-500 via-orange-500 to-red-500 hover:scale-105 active:scale-95 cursor-pointer'
                  : 'bg-gray-500/50 cursor-not-allowed opacity-60'
              )}
            >
              ⚔️ 开始战斗！
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const rewards = battleState.rewards;
    const expPerPet = teamPets.length > 0 ? Math.floor(rewards.exp / teamPets.length) : 0;

    return (
      <div className="page-enter container mx-auto px-4 py-6 md:py-8">
        <div className="glass-card rounded-2xl p-5 md:p-8 card-shadow text-center">
          <div
            className={cn(
              'font-title text-4xl md:text-6xl mb-4 drop-shadow-lg',
              isPlayerWin ? 'text-amber-300 victory-bounce' : 'text-red-400'
            )}
          >
            {isPlayerWin ? '🎉 战斗胜利！' : '💀 战斗失败...'}
          </div>

          <div className="flex justify-center gap-4 mb-6 md:mb-8">
            {battleState.playerTeam.map((pet) => (
              <div
                key={pet.id}
                className={cn(
                  'flex flex-col items-center p-2 md:p-3 rounded-xl border-2 min-w-[90px] reward-pop',
                  `type-${pet.type}`,
                  pet.hp <= 0 && 'grayscale opacity-60'
                )}
              >
                <div className="text-2xl md:text-3xl">{pet.emoji}</div>
                <p className="text-white text-xs md:text-sm font-game truncate w-full text-center">
                  {pet.name}
                </p>
                <p className="text-white/70 text-[10px] md:text-xs font-game">
                  ❤️ {pet.hp}/{pet.maxHp}
                </p>
                {isPlayerWin && expPerPet > 0 && (
                  <p className="text-sky-300 text-[10px] md:text-xs font-game mt-1">
                    +{expPerPet} EXP
                  </p>
                )}
              </div>
            ))}
          </div>

          {isPlayerWin && (
            <div className="mb-6 md:mb-8">
              <h3 className="font-title text-2xl md:text-3xl text-amber-300 mb-4">
                🎁 战利品
              </h3>

              {rewards.resources.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 max-w-2xl mx-auto">
                  {rewards.resources.map((r: ResourceReward, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 md:p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-400/40 reward-pop"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div className="text-2xl md:text-3xl mb-1">
                        {RESOURCE_EMOJIS[r.type] || '📦'}
                      </div>
                      <p className="text-white/80 text-xs md:text-sm font-game">
                        {RESOURCE_NAMES[r.type]}
                      </p>
                      <p className="text-amber-300 font-title text-lg md:text-xl">
                        +{r.amount}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {rewards.exp > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/10 border border-sky-400/40 max-w-md mx-auto reward-pop" style={{ animationDelay: '300ms' }}>
                  <p className="text-sky-200 font-game text-sm md:text-base mb-2">
                    ⭐ 全队获得经验值
                  </p>
                  <p className="text-sky-300 font-title text-2xl md:text-3xl mb-3">
                    总计 +{rewards.exp} EXP
                  </p>
                  <div className="text-white/70 text-xs md:text-sm font-game">
                    每只宠物获得 +{expPerPet} EXP
                  </div>
                </div>
              )}

              {rewards.discoveries.length > 0 && (
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-400/40 max-w-2xl mx-auto reward-pop" style={{ animationDelay: '400ms' }}>
                  <p className="text-purple-200 font-game text-sm md:text-base mb-3">
                    ✨ 稀有发现
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {rewards.discoveries.map((discoveryId, idx) => {
                      const discovery = getDiscoveryById(discoveryId);
                      if (!discovery) return null;
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/20 border border-purple-400/30"
                        >
                          <span className="text-xl">{discovery.emoji}</span>
                          <div>
                            <p className="text-white text-sm font-game">{discovery.name}</p>
                            <p className="text-purple-300 text-xs font-game">[{discovery.rarity}]</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {isEnemyWin && (
            <div className="mb-6 md:mb-8 max-w-md mx-auto">
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-400/30">
                <p className="text-red-300 font-game mb-2">
                  💔 队伍在战斗中倒下了...
                </p>
                <p className="text-white/70 text-sm font-game">
                  别灰心！宠物们会慢慢恢复，整理装备后再来挑战吧！
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleReturnToCamp}
            className="pixel-border bg-gradient-to-r from-sky-500 to-cyan-500 text-white px-8 md:px-12 py-3 md:py-4 font-title text-xl md:text-2xl hover:scale-105 active:scale-95 transition-all"
          >
            🏕️ 返回营地
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter container mx-auto px-2 md:px-4 py-4 md:py-6 relative">
      {showFlash && (
        <div className="fixed inset-0 bg-white fullscreen-flash pointer-events-none z-50" />
      )}

      <div className="glass-card rounded-2xl p-3 md:p-5 card-shadow">
        <h2 className="font-title text-2xl md:text-3xl text-white mb-3 md:mb-4 drop-shadow text-center">
          ⚔️ 遭遇战 - 第 {battleState.turn} 回合
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="lg:col-span-3 space-y-3 md:space-y-4">
            <div className="p-3 md:p-4 rounded-xl bg-gradient-to-b from-red-900/40 to-red-950/30 border border-red-500/30">
              <h3 className="font-title text-red-300 text-sm md:text-base mb-2 md:mb-3 text-center">
                👹 敌方
              </h3>
              <div className="flex flex-wrap justify-center gap-2 md:gap-4">
                {battleState.enemyTeam.map((monster) =>
                  renderPetCard(monster as unknown as Pet, true)
                )}
              </div>
            </div>

            <div className="flex items-center justify-center py-1 md:py-2">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
              <div className="px-4 md:px-6">
                <span className="font-title text-3xl md:text-5xl text-amber-400 drop-shadow-lg animate-pulse">
                  VS
                </span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
            </div>

            <div className="p-3 md:p-4 rounded-xl bg-gradient-to-b from-sky-900/40 to-sky-950/30 border border-sky-500/30">
              <h3 className="font-title text-sky-300 text-sm md:text-base mb-2 md:mb-3 text-center">
                🐾 己方
              </h3>
              <div className="flex flex-wrap justify-center gap-2 md:gap-4">
                {battleState.playerTeam.map((pet) => renderPetCard(pet, false))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="h-full flex flex-col p-3 md:p-4 rounded-xl bg-black/30 border border-white/10">
              <h3 className="font-title text-amber-300 text-sm md:text-base mb-2 md:mb-3 text-center">
                📜 战斗日志
              </h3>
              <div className="flex-1 overflow-y-auto max-h-[250px] lg:max-h-none space-y-1 pr-1">
                {battleState.battleLog.map((log, idx) => (
                  <div
                    key={idx}
                    className="log-slide-in text-[11px] md:text-xs font-game p-2 rounded-lg bg-white/5 border border-white/10 leading-relaxed"
                  >
                    {log.includes('===') ? (
                      <span className="text-amber-300 font-bold">{log}</span>
                    ) : log.includes('暴击') ? (
                      <span className="text-yellow-300">{log}</span>
                    ) : log.includes('效果拔群') ? (
                      <span className="text-emerald-300">{log}</span>
                    ) : log.includes('效果不佳') ? (
                      <span className="text-gray-400">{log}</span>
                    ) : log.includes('被击败') || log.includes('倒下') ? (
                      <span className="text-red-300">{log}</span>
                    ) : log.includes('胜利') ? (
                      <span className="text-emerald-400 font-bold">{log}</span>
                    ) : log.includes('失败') ? (
                      <span className="text-red-400 font-bold">{log}</span>
                    ) : log.includes('协同技能') || log.includes('释放') ? (
                      <span className="text-purple-300">{log}</span>
                    ) : (
                      <span className="text-white/80">{log}</span>
                    )}
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 md:mt-6 p-3 md:p-5 rounded-xl bg-gradient-to-r from-purple-900/30 via-indigo-900/30 to-purple-900/30 border border-purple-400/30">
          <div className="mb-3 md:mb-4">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <span className="font-title text-sm md:text-lg text-amber-300">
                ⚡ 协同技能能量
              </span>
              <span className="font-game text-white/90 text-sm md:text-base">
                {battleState.synergyEnergy} / {battleState.maxSynergyEnergy}
              </span>
            </div>
            <div className="w-full bg-black/50 rounded-full h-4 md:h-5 overflow-hidden border-2 border-amber-400/50">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  canUseSynergy ? 'synergy-bar' : 'bg-gradient-to-r from-amber-600 via-amber-400 to-amber-500'
                )}
                style={{
                  width: `${(battleState.synergyEnergy / battleState.maxSynergyEnergy) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4">
            <button
              onClick={handleSynergySkill}
              disabled={!canUseSynergy}
              className={cn(
                'px-4 md:px-8 py-2 md:py-3 rounded-xl font-title text-base md:text-xl text-white transition-all border-2',
                canUseSynergy
                  ? 'synergy-pulse bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 border-amber-300 hover:scale-105 active:scale-95 cursor-pointer'
                  : 'bg-gray-600/50 border-gray-500/50 cursor-not-allowed opacity-50'
              )}
            >
              {synergySkillInfo.emoji} {synergySkillInfo.name}
            </button>

            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => setAutoBattle(!autoBattle)}
                className={cn(
                  'px-3 md:px-5 py-2 md:py-2.5 rounded-xl font-game text-xs md:text-sm border-2 transition-all',
                  autoBattle
                    ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200'
                    : 'bg-white/10 border-white/30 text-white/80 hover:bg-white/20'
                )}
              >
                {autoBattle ? '🤖 自动战斗中' : '⏸️ 手动战斗'}
              </button>

              <button
                onClick={() => setSpeed(speed === 1 ? 2 : 1)}
                className="px-3 md:px-5 py-2 md:py-2.5 rounded-xl font-game text-xs md:text-sm bg-sky-500/30 border-2 border-sky-400 text-sky-200 hover:bg-sky-500/50 transition-all"
              >
                {speed === 1 ? '⏩ x1 速度' : '⏩⏩ x2 速度'}
              </button>

              {!autoBattle && (
                <button
                  onClick={processRound}
                  disabled={!isFighting}
                  className="px-3 md:px-5 py-2 md:py-2.5 rounded-xl font-game text-xs md:text-sm bg-red-500/30 border-2 border-red-400 text-red-200 hover:bg-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ⚔️ 下一回合
                </button>
              )}
            </div>
          </div>

          {canUseSynergy && (
            <p className="mt-2 md:mt-3 text-center text-amber-200/80 text-[10px] md:text-xs font-game bounce-in">
              💫 能量已满！点击释放协同技能造成群体伤害！
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
