import type { Pet, Monster, PetType, BattleState, BattleAction, Skill, SynergySkill, Rarity, ResourceReward } from '../types';
import { SYNERGY_SKILLS } from '../data/pets';
import { DISCOVERY_TEMPLATES } from '../data/discoveries';
import { randomFloat, randomInt, randomChoice, clamp, weightedRandomChoice } from './random';

const TYPE_CHART: Record<PetType, Record<PetType, number>> = {
  fire: { fire: 1, water: 0.5, earth: 1, wind: 2, light: 1, dark: 1 },
  water: { fire: 2, water: 1, earth: 0.5, wind: 1, light: 1, dark: 1 },
  earth: { fire: 1, water: 2, earth: 1, wind: 0.5, light: 1, dark: 1 },
  wind: { fire: 0.5, water: 1, earth: 2, wind: 1, light: 1, dark: 1 },
  light: { fire: 1, water: 1, earth: 1, wind: 1, light: 1, dark: 2 },
  dark: { fire: 1, water: 1, earth: 1, wind: 1, light: 2, dark: 1 },
};

export const getTypeMultiplier = (attackerType: PetType, defenderType: PetType): number => {
  return TYPE_CHART[attackerType]?.[defenderType] ?? 1;
};

export const calculateDamage = (
  attack: number,
  defense: number,
  attackerType: PetType,
  defenderType: PetType,
  skillMultiplier: number = 1
): { damage: number; isCritical: boolean; multiplier: number } => {
  const typeMultiplier = getTypeMultiplier(attackerType, defenderType);
  const isCritical = Math.random() < 0.1;
  const critMultiplier = isCritical ? 1.5 : 1;
  const randomMultiplier = randomFloat(0.9, 1.1);

  const baseDamage = attack * skillMultiplier;
  const reducedDamage = baseDamage - defense * 0.5;
  const finalDamage = Math.max(
    1,
    Math.floor(reducedDamage * typeMultiplier * critMultiplier * randomMultiplier)
  );

  return {
    damage: finalDamage,
    isCritical,
    multiplier: typeMultiplier,
  };
};

interface Combatant {
  id: string;
  name: string;
  speed: number;
  type: 'pet' | 'monster';
  instance: Pet | Monster;
}

export const sortBySpeed = (pets: Pet[], monsters: Monster[]): Combatant[] => {
  const combatants: Combatant[] = [
    ...pets.map((p) => ({ id: p.id, name: p.name, speed: p.speed, type: 'pet' as const, instance: p })),
    ...monsters.map((m) => ({ id: m.id, name: m.name, speed: m.speed, type: 'monster' as const, instance: m })),
  ];

  return combatants.sort((a, b) => {
    if (b.speed !== a.speed) return b.speed - a.speed;
    return Math.random() - 0.5;
  });
};

const findAliveTargets = (team: (Pet | Monster)[], excludeId?: string): (Pet | Monster)[] => {
  return team.filter((t) => t.hp > 0 && t.id !== excludeId);
};

const selectTarget = (targets: (Pet | Monster)[]): Pet | Monster | null => {
  const alive = targets.filter((t) => t.hp > 0);
  if (alive.length === 0) return null;

  const lowHpTargets = alive.filter((t) => t.hp < t.maxHp * 0.3);
  if (lowHpTargets.length > 0 && Math.random() < 0.6) {
    return randomChoice(lowHpTargets);
  }

  return randomChoice(alive);
};

const isPet = (c: Pet | Monster): c is Pet => {
  return 'mood' in c;
};

const isMonster = (c: Pet | Monster): c is Monster => {
  return 'templateId' in c;
};

export interface BattleRoundResult {
  actions: BattleAction[];
  logs: string[];
  updatedPets: Pet[];
  updatedMonsters: Monster[];
  battleEnded: boolean;
  winner: 'player' | 'enemy' | null;
  synergyEnergyGain: number;
}

export const executeBattleRound = (
  pets: Pet[],
  monsters: Monster[],
  turn: number
): BattleRoundResult => {
  const actions: BattleAction[] = [];
  const logs: string[] = [];
  let updatedPets = pets.map((p) => ({ ...p, skills: p.skills.map((s) => ({ ...s })) }));
  let updatedMonsters = monsters.map((m) => ({ ...m }));
  let synergyEnergyGain = 0;

  const order = sortBySpeed(updatedPets, updatedMonsters);

  logs.push(`=== 第 ${turn} 回合开始 ===`);

  for (const combatant of order) {
    if (combatant.type === 'pet') {
      const petIndex = updatedPets.findIndex((p) => p.id === combatant.id);
      const pet = updatedPets[petIndex];
      if (!pet || pet.hp <= 0) continue;

      const aliveMonsters = findAliveTargets(updatedMonsters);
      if (aliveMonsters.length === 0) break;

      const availableSkills = pet.skills.filter(
        (s) => s.currentCooldown <= 0 && Math.random() < 0.3
      );

      let actionType: 'attack' | 'skill' = 'attack';
      let usedSkill: Skill | null = null;
      let skillMultiplier = 1;

      if (availableSkills.length > 0) {
        usedSkill = randomChoice(availableSkills);
        actionType = 'skill';
        skillMultiplier = usedSkill.damage / pet.attack;
        if (skillMultiplier < 1) skillMultiplier = 1 + (usedSkill.damage / 100);
      }

      const target = selectTarget(aliveMonsters) as Monster;
      const { damage, isCritical, multiplier } = calculateDamage(
        pet.attack,
        target.defense,
        pet.type,
        target.type,
        skillMultiplier
      );

      const monsterIndex = updatedMonsters.findIndex((m) => m.id === target.id);
      updatedMonsters[monsterIndex] = {
        ...updatedMonsters[monsterIndex],
        hp: Math.max(0, updatedMonsters[monsterIndex].hp - damage),
      };

      actions.push({
        actorId: pet.id,
        actorType: 'pet',
        targetId: target.id,
        actionType,
        skillId: usedSkill?.id,
        damage,
        timestamp: Date.now(),
      });

      const critText = isCritical ? '【暴击!】' : '';
      const effText = multiplier > 1 ? '效果拔群!' : multiplier < 1 ? '效果不佳...' : '';
      const skillText = usedSkill ? `使用 ${usedSkill.emoji}${usedSkill.name}` : '发动攻击';

      logs.push(
        `${pet.emoji}${pet.name} ${skillText} 对 ${target.emoji}${target.name} 造成 ${damage} 点伤害! ${critText}${effText}`
      );

      if (usedSkill) {
        const skillIndex = updatedPets[petIndex].skills.findIndex((s) => s.id === usedSkill.id);
        if (skillIndex >= 0) {
          updatedPets[petIndex].skills[skillIndex].currentCooldown = usedSkill.cooldown;
        }
      }

      synergyEnergyGain += isCritical ? 8 : 5;

      if (updatedMonsters[monsterIndex].hp <= 0) {
        logs.push(`💀 ${target.emoji}${target.name} 被击败了!`);
      }
    } else {
      const monsterIndex = updatedMonsters.findIndex((m) => m.id === combatant.id);
      const monster = updatedMonsters[monsterIndex];
      if (!monster || monster.hp <= 0) continue;

      const alivePets = findAliveTargets(updatedPets);
      if (alivePets.length === 0) break;

      const target = selectTarget(alivePets) as Pet;
      const { damage, isCritical, multiplier } = calculateDamage(
        monster.attack,
        target.defense,
        monster.type,
        target.type
      );

      const petIndex = updatedPets.findIndex((p) => p.id === target.id);
      updatedPets[petIndex] = {
        ...updatedPets[petIndex],
        hp: Math.max(0, updatedPets[petIndex].hp - damage),
      };

      actions.push({
        actorId: monster.id,
        actorType: 'monster',
        targetId: target.id,
        actionType: 'attack',
        damage,
        timestamp: Date.now(),
      });

      const critText = isCritical ? '【暴击!】' : '';
      const effText = multiplier > 1 ? '效果拔群!' : multiplier < 1 ? '效果不佳...' : '';

      logs.push(
        `${monster.emoji}${monster.name} 攻击 ${target.emoji}${target.name} 造成 ${damage} 点伤害! ${critText}${effText}`
      );

      if (updatedPets[petIndex].hp <= 0) {
        logs.push(`💔 ${target.emoji}${target.name} 倒下了!`);
      }
    }
  }

  updatedPets = updatedPets.map((p) => ({
    ...p,
    skills: p.skills.map((s) => ({
      ...s,
      currentCooldown: Math.max(0, s.currentCooldown - 1),
    })),
  }));

  const alivePets = updatedPets.filter((p) => p.hp > 0);
  const aliveMonsters = updatedMonsters.filter((m) => m.hp > 0);

  const battleEnded = alivePets.length === 0 || aliveMonsters.length === 0;
  const winner = aliveMonsters.length === 0 ? 'player' : alivePets.length === 0 ? 'enemy' : null;

  if (battleEnded) {
    if (winner === 'player') {
      logs.push('🎉 战斗胜利!');
    } else {
      logs.push('😢 战斗失败...');
    }
  }

  return {
    actions,
    logs,
    updatedPets,
    updatedMonsters,
    battleEnded,
    winner,
    synergyEnergyGain,
  };
};

export interface SynergyResult {
  success: boolean;
  skill?: SynergySkill;
  damage: number;
  logs: string[];
  updatedMonsters: Monster[];
  actions: BattleAction[];
}

export const executeSynergySkill = (
  pets: Pet[],
  monsters: Monster[],
  synergyEnergy: number,
  maxSynergyEnergy: number
): SynergyResult => {
  const logs: string[] = [];
  const actions: BattleAction[] = [];

  if (synergyEnergy < maxSynergyEnergy) {
    logs.push('协同能量不足!');
    return { success: false, damage: 0, logs, updatedMonsters: monsters, actions };
  }

  const alivePets = pets.filter((p) => p.hp > 0);
  if (alivePets.length < 2) {
    logs.push('存活宠物不足，无法释放协同技能!');
    return { success: false, damage: 0, logs, updatedMonsters: monsters, actions };
  }

  const petTypes = new Set(alivePets.map((p) => p.type));
  let matchedSkill: SynergySkill | null = null;

  for (const skill of SYNERGY_SKILLS) {
    if (skill.requiredBonds.length === 0) {
      if (!matchedSkill || matchedSkill.requiredBonds.length > 0) {
        matchedSkill = skill;
      }
      continue;
    }
    const hasAll = skill.requiredBonds.every((type) =>
      petTypes.has(type as PetType)
    );
    if (hasAll && (!matchedSkill || skill.requiredBonds.length > matchedSkill.requiredBonds.length)) {
      matchedSkill = skill;
    }
  }

  if (!matchedSkill) {
    matchedSkill = SYNERGY_SKILLS[SYNERGY_SKILLS.length - 1];
  }

  const baseDamage = matchedSkill.damage;
  const teamAttackBonus = alivePets.reduce((sum, p) => sum + p.attack, 0) * 0.3;
  const totalDamage = Math.floor(baseDamage + teamAttackBonus);

  const aliveMonsters = monsters.filter((m) => m.hp > 0);
  let updatedMonsters = [...monsters];

  logs.push(`⚡ 释放协同技能【${matchedSkill.emoji}${matchedSkill.name}】!`);
  logs.push(`📖 ${matchedSkill.description}`);

  for (const target of aliveMonsters) {
    const randomMult = randomFloat(0.8, 1.2);
    const damage = Math.floor(totalDamage * randomMult / aliveMonsters.length);
    const monsterIndex = updatedMonsters.findIndex((m) => m.id === target.id);

    updatedMonsters[monsterIndex] = {
      ...updatedMonsters[monsterIndex],
      hp: Math.max(0, updatedMonsters[monsterIndex].hp - damage),
    };

    actions.push({
      actorId: `synergy-${matchedSkill!.id}`,
      actorType: 'pet',
      targetId: target.id,
      actionType: 'synergy',
      skillId: matchedSkill!.id,
      damage,
      timestamp: Date.now(),
    });

    logs.push(`💥 对 ${target.emoji}${target.name} 造成 ${damage} 点伤害!`);

    if (updatedMonsters[monsterIndex].hp <= 0) {
      logs.push(`💀 ${target.emoji}${target.name} 被击败了!`);
    }
  }

  return {
    success: true,
    skill: matchedSkill,
    damage: totalDamage,
    logs,
    updatedMonsters,
    actions,
  };
};

const getMonsterRarity = (monster: Monster): Rarity => {
  const exp = monster.expReward;
  if (exp >= 400) return 'legendary';
  if (exp >= 200) return 'epic';
  if (exp >= 50) return 'rare';
  return 'common';
};

const getDiscoveryDropRate = (monsterRarity: Rarity, difficulty: 'easy' | 'normal' | 'hard' = 'normal'): number => {
  const baseRates: Record<Rarity, number> = {
    common: 0.05,
    rare: 0.1,
    epic: 0.2,
    legendary: 0.4,
  };

  const difficultyMultipliers: Record<string, number> = {
    easy: 0.5,
    normal: 1,
    hard: 1.5,
  };

  return baseRates[monsterRarity] * difficultyMultipliers[difficulty];
};

export const rollBattleDiscovery = (
  monsters: Monster[],
  luck: number = 0,
  difficulty: 'easy' | 'normal' | 'hard' = 'normal'
): string[] => {
  const discoveries: string[] = [];
  const monsterOrTreasureDiscoveries = DISCOVERY_TEMPLATES.filter(
    (d) => d.category === 'monster' || d.category === 'treasure'
  );

  if (monsterOrTreasureDiscoveries.length === 0) {
    return discoveries;
  }

  for (const monster of monsters) {
    const monsterRarity = getMonsterRarity(monster);
    let dropRate = getDiscoveryDropRate(monsterRarity, difficulty);
    dropRate = Math.min(1, dropRate * (1 + luck * 0.01));

    if (Math.random() < dropRate) {
      const eligibleDiscoveries = monsterOrTreasureDiscoveries.filter(
        (d) => !discoveries.includes(d.id)
      );

      if (eligibleDiscoveries.length > 0) {
        const weightedDiscoveries = eligibleDiscoveries.map((d) => {
          const rarityWeights: Record<Rarity, number> = {
            common: 50,
            rare: 30,
            epic: 15,
            legendary: 5,
          };
          return {
            item: d.id,
            weight: rarityWeights[d.rarity],
          };
        });

        const discoveryId = weightedRandomChoice(weightedDiscoveries);
        discoveries.push(discoveryId);
      }
    }
  }

  return discoveries;
};

export interface BattleRewards {
  exp: number;
  resources: ResourceReward[];
  discoveries: string[];
}

export const calculateBattleRewards = (
  monsters: Monster[],
  victory: boolean,
  luck: number = 0,
  difficulty: 'easy' | 'normal' | 'hard' = 'normal'
): BattleRewards => {
  if (!victory) {
    return { exp: 0, resources: [], discoveries: [] };
  }

  let totalExp = 0;
  const resourceMap = new Map<string, number>();

  for (const monster of monsters) {
    totalExp += monster.expReward;

    for (const reward of monster.rewards) {
      const variance = randomInt(80, 120) / 100;
      const amount = Math.floor(reward.amount * variance);
      const current = resourceMap.get(reward.type) || 0;
      resourceMap.set(reward.type, current + amount);
    }
  }

  const resources = Array.from(resourceMap.entries()).map(([type, amount]) => ({
    type: type as ResourceReward['type'],
    amount,
  }));

  const discoveries = rollBattleDiscovery(monsters, luck, difficulty);

  return { exp: Math.floor(totalExp), resources, discoveries };
};
