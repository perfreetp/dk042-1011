import { useState, useCallback, useEffect, useRef } from 'react';
import type { Pet, Monster, BattleState, BattleAction, ResourceReward } from '../types';
import {
  executeBattleRound,
  executeSynergySkill,
  calculateBattleRewards,
} from '../utils/battleSystem';
import { createMonsterFromTemplate } from '../data/monsters';
import { useGameStore } from '../store/useGameStore';
import { randomChoice } from '../utils/random';
import { getIslandById } from '../data/islands';
import { getDiscoveryById } from '../data/discoveries';

interface UseBattleOptions {
  autoStart?: boolean;
  roundDelay?: number;
}

export const useBattle = (options: UseBattleOptions = {}) => {
  const { autoStart = false, roundDelay = 1500 } = options;
  const roundTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessing = useRef<boolean>(false);

  const [usedLuckyCharmInBattle, setUsedLuckyCharmInBattle] = useState<boolean>(false);

  const [battleState, setBattleState] = useState<BattleState>({
    playerTeam: [],
    enemyTeam: [],
    turn: 0,
    phase: 'idle',
    actionQueue: [],
    battleLog: [],
    synergyEnergy: 0,
    maxSynergyEnergy: 100,
    rewards: {
      exp: 0,
      resources: [],
      discoveries: [],
    },
    difficulty: 'normal',
  });

  const gameStore = useGameStore();

  const confirmUseLuckyCharm = useCallback((): boolean => {
    const success = useGameStore.getState().removeItem('lucky-charm', 1);
    if (success) {
      setUsedLuckyCharmInBattle(true);
      useGameStore.getState().addLog('🍀 战斗前消耗了1个幸运符，发现概率大幅提升！', 'success');
      return true;
    }
    return false;
  }, []);

  const initBattle = useCallback(
    (
      playerPets: Pet[],
      monsterTemplateIds: string[],
      levelMultiplier: number = 1,
      difficulty: 'easy' | 'normal' | 'hard' = 'normal',
      useLuckyCharm?: boolean
    ) => {
      if (playerPets.length === 0 || monsterTemplateIds.length === 0) {
        return;
      }

      if (useLuckyCharm !== undefined) {
        setUsedLuckyCharmInBattle(!!useLuckyCharm);
      }

      const alivePets = playerPets
        .filter((p) => p.hp > 0)
        .map((p) => ({
          ...p,
          skills: p.skills.map((s) => ({ ...s, currentCooldown: 0 })),
        }));

      if (alivePets.length === 0) {
        return;
      }

      const selectedTemplates = [...monsterTemplateIds];

      const enemies: Monster[] = selectedTemplates
        .map((id, idx) =>
          createMonsterFromTemplate(id, levelMultiplier, `monster-instance-${idx}-${Date.now()}`)
        )
        .filter((m): m is Monster => m !== null);

      setBattleState({
        playerTeam: alivePets,
        enemyTeam: enemies,
        turn: 0,
        phase: 'fighting',
        actionQueue: [],
        battleLog: ['⚔️ 战斗开始！'],
        synergyEnergy: 0,
        maxSynergyEnergy: 100,
        rewards: {
          exp: 0,
          resources: [],
          discoveries: [],
        },
        difficulty,
      });
    },
    []
  );

  const getDifficultyFromLevel = (level: number): 'easy' | 'normal' | 'hard' => {
    if (level <= 2) return 'easy';
    if (level <= 5) return 'normal';
    return 'hard';
  };

  const initBattleFromIsland = useCallback(
    (islandId: string, teamPetIds: string[], pets: Pet[], useLuckyCharm?: boolean) => {
      const island = getIslandById(islandId);
      if (!island || island.monsters.length === 0) {
        return false;
      }

      const teamPets = teamPetIds
        .map((id) => pets.find((p) => p.id === id))
        .filter((p): p is Pet => p !== undefined && p.hp > 0);

      if (teamPets.length === 0) {
        return false;
      }

      const levelMultiplier = 1 + (island.level - 1) * 0.2;
      const monsterCount = Math.min(island.monsters.length, 1 + Math.floor(island.level / 3));
      const selectedMonsters: string[] = [];
      for (let i = 0; i < monsterCount; i++) {
        selectedMonsters.push(randomChoice(island.monsters));
      }

      const difficulty = getDifficultyFromLevel(island.level);
      initBattle(teamPets, selectedMonsters, levelMultiplier, difficulty, useLuckyCharm);
      return true;
    },
    [initBattle]
  );

  const processRound = useCallback(() => {
    if (isProcessing.current) return;

    setBattleState((prev) => {
      if (prev.phase !== 'fighting') return prev;

      isProcessing.current = true;

      const result = executeBattleRound(prev.playerTeam, prev.enemyTeam, prev.turn + 1);

      const newSynergyEnergy = Math.min(
        prev.maxSynergyEnergy,
        prev.synergyEnergy + result.synergyEnergyGain
      );

      let newPhase: BattleState['phase'] = prev.phase;
      let finalRewards = prev.rewards;
      const extraLogs: string[] = [];

      if (result.battleEnded && result.winner) {
        newPhase = result.winner === 'player' ? 'playerWin' : 'enemyWin';

        if (result.winner === 'player') {
          const rewards = calculateBattleRewards(prev.enemyTeam, true, 0, prev.difficulty, usedLuckyCharmInBattle);
          finalRewards = {
            exp: rewards.exp,
            resources: rewards.resources,
            discoveries: rewards.discoveries,
          };

          if (rewards.discoveries.length > 0) {
            for (const discoveryId of rewards.discoveries) {
              const discovery = getDiscoveryById(discoveryId);
              if (discovery) {
                extraLogs.push(`✨ 发现了 ${discovery.emoji}${discovery.name}！`);
              }
            }
          }
        }
      }

      const finalState = {
        ...prev,
        playerTeam: result.updatedPets,
        enemyTeam: result.updatedMonsters,
        turn: prev.turn + 1,
        phase: newPhase,
        actionQueue: [...prev.actionQueue, ...result.actions],
        battleLog: [...prev.battleLog, ...result.logs, ...extraLogs],
        synergyEnergy: newSynergyEnergy,
        rewards: finalRewards,
      };

      return finalState;
    });

    setTimeout(() => {
      isProcessing.current = false;
    }, 100);
  }, [usedLuckyCharmInBattle]);

  const useSynergy = useCallback((): boolean => {
    let success = false;

    setBattleState((prev) => {
      if (prev.phase !== 'fighting') return prev;
      if (prev.synergyEnergy < prev.maxSynergyEnergy) return prev;

      const result = executeSynergySkill(
        prev.playerTeam,
        prev.enemyTeam,
        prev.synergyEnergy,
        prev.maxSynergyEnergy
      );

      if (!result.success) {
        return {
          ...prev,
          battleLog: [...prev.battleLog, ...result.logs],
        };
      }

      let newPhase: BattleState['phase'] = prev.phase;
      let finalRewards = prev.rewards;
      const extraLogs: string[] = [];

      const aliveMonsters = result.updatedMonsters.filter((m) => m.hp > 0);
      const alivePets = prev.playerTeam.filter((p) => p.hp > 0);

      if (aliveMonsters.length === 0) {
        newPhase = 'playerWin';
        const rewards = calculateBattleRewards(prev.enemyTeam, true, 0, prev.difficulty, usedLuckyCharmInBattle);
        finalRewards = {
          exp: rewards.exp,
          resources: rewards.resources,
          discoveries: rewards.discoveries,
        };

        if (rewards.discoveries.length > 0) {
          for (const discoveryId of rewards.discoveries) {
            const discovery = getDiscoveryById(discoveryId);
            if (discovery) {
              extraLogs.push(`✨ 发现了 ${discovery.emoji}${discovery.name}！`);
            }
          }
        }
      } else if (alivePets.length === 0) {
        newPhase = 'enemyWin';
      }

      success = true;

      return {
        ...prev,
        enemyTeam: result.updatedMonsters,
        phase: newPhase,
        actionQueue: [...prev.actionQueue, ...result.actions],
        battleLog: [...prev.battleLog, ...result.logs, ...extraLogs],
        synergyEnergy: 0,
        rewards: finalRewards,
      };
    });

    return success;
  }, [usedLuckyCharmInBattle]);

  const autoBattle = useCallback(() => {
    if (roundTimer.current) {
      clearTimeout(roundTimer.current);
      roundTimer.current = null;
    }

    const runBattle = () => {
      const currentState = battleState;

      if (currentState.phase !== 'fighting') {
        return;
      }

      processRound();

      setBattleState((latest) => {
        if (latest.phase === 'fighting') {
          roundTimer.current = setTimeout(runBattle, roundDelay);
        }
        return latest;
      });
    };

    roundTimer.current = setTimeout(runBattle, 500);
  }, [battleState, processRound, roundDelay]);

  const finalizeBattle = useCallback(() => {
    if (roundTimer.current) {
      clearTimeout(roundTimer.current);
      roundTimer.current = null;
    }

    const state = battleState;
    let battleRecordId: string | undefined;
    const itemsGained: string[] = [];

    if (state.phase === 'playerWin') {
      for (const monster of state.enemyTeam) {
        if (monster.hp <= 0 && monster.toolDrops && monster.toolDrops.length > 0) {
          for (const drop of monster.toolDrops) {
            const roll = Math.random();
            if (roll < drop.probability) {
              itemsGained.push(drop.itemId);
            }
          }
        }
      }

      if (itemsGained.length > 0) {
        for (const itemId of itemsGained) {
          gameStore.addItem(itemId, 1);
        }
      }

      if (state.rewards.resources.length > 0) {
        gameStore.addResources(state.rewards.resources);
      }

      if (state.rewards.exp > 0) {
        const expPerPet = Math.floor(state.rewards.exp / state.playerTeam.length);
        state.playerTeam.forEach((pet) => {
          gameStore.addPetExp(pet.id, expPerPet);
        });
      }

      if (state.rewards.discoveries.length > 0) {
        state.rewards.discoveries.forEach((discoveryId) => {
          gameStore.addDiscovery(discoveryId);
        });
      }

      state.playerTeam.forEach((pet) => {
        if (pet.hp > 0 && pet.hp < pet.maxHp * 0.5) {
          gameStore.addLog(`${pet.emoji}${pet.name} 受了轻伤`, 'warning');
        }
      });

      battleRecordId = gameStore.createBattleRecord({
        difficulty: state.difficulty,
        teamPetIds: state.playerTeam.map((p) => p.id),
        teamPetSnapshots: state.playerTeam.map((p) => ({
          id: p.id,
          name: p.name,
          emoji: p.emoji,
          level: p.level,
        })),
        monsters: state.enemyTeam.map((m) => ({
          templateId: m.templateId,
          name: m.name,
          emoji: m.emoji,
          defeated: m.hp <= 0,
        })),
        discoveries: state.rewards.discoveries,
        expGained: state.rewards.exp,
        resources: state.rewards.resources,
        usedLuckyCharm: usedLuckyCharmInBattle,
        won: true,
      });
    } else if (state.phase === 'enemyWin') {
      gameStore.addLog('战斗失败...队伍需要休息', 'danger');

      gameStore.createBattleRecord({
        difficulty: state.difficulty,
        teamPetIds: state.playerTeam.map((p) => p.id),
        teamPetSnapshots: state.playerTeam.map((p) => ({
          id: p.id,
          name: p.name,
          emoji: p.emoji,
          level: p.level,
        })),
        monsters: state.enemyTeam.map((m) => ({
          templateId: m.templateId,
          name: m.name,
          emoji: m.emoji,
          defeated: m.hp <= 0,
        })),
        discoveries: state.rewards.discoveries,
        expGained: state.rewards.exp,
        resources: state.rewards.resources,
        usedLuckyCharm: usedLuckyCharmInBattle,
        won: false,
      });

      state.playerTeam.forEach((pet) => {
        if (pet.hp <= 0) {
          gameStore.healPet(pet.id, Math.floor(pet.maxHp * 0.1));
        }
      });
    }

    const finalPets = state.playerTeam;
    useGameStore.setState((prev) => ({
      pets: prev.pets.map((storePet) => {
        const battlePet = finalPets.find((bp) => bp.id === storePet.id);
        if (battlePet) {
          return {
            ...storePet,
            hp: battlePet.hp,
            stamina: Math.max(0, storePet.stamina - 20),
            mood: Math.max(0, storePet.mood - 10),
          };
        }
        return storePet;
      }),
    }));

    return { phase: state.phase, battleRecordId, itemsGained };
  }, [battleState, gameStore, usedLuckyCharmInBattle]);

  const resetBattle = useCallback(() => {
    if (roundTimer.current) {
      clearTimeout(roundTimer.current);
      roundTimer.current = null;
    }
    isProcessing.current = false;

    setUsedLuckyCharmInBattle(false);

    setBattleState({
      playerTeam: [],
      enemyTeam: [],
      turn: 0,
      phase: 'idle',
      actionQueue: [],
      battleLog: [],
      synergyEnergy: 0,
      maxSynergyEnergy: 100,
      rewards: {
        exp: 0,
        resources: [],
        discoveries: [],
      },
      difficulty: 'normal',
    });
  }, []);

  useEffect(() => {
    if (
      autoStart &&
      battleState.phase === 'fighting' &&
      battleState.turn === 0 &&
      !isProcessing.current
    ) {
      autoBattle();
    }
  }, [autoStart, battleState.phase, battleState.turn, autoBattle]);

  useEffect(() => {
    return () => {
      if (roundTimer.current) {
        clearTimeout(roundTimer.current);
      }
    };
  }, []);

  return {
    battleState,
    initBattle,
    initBattleFromIsland,
    processRound,
    useSynergy,
    autoBattle,
    finalizeBattle,
    resetBattle,
    confirmUseLuckyCharm,
    usedLuckyCharmInBattle,
    canUseSynergy: battleState.synergyEnergy >= battleState.maxSynergyEnergy && battleState.phase === 'fighting',
    isFighting: battleState.phase === 'fighting',
    isPlayerWin: battleState.phase === 'playerWin',
    isEnemyWin: battleState.phase === 'enemyWin',
    isFinished: battleState.phase === 'playerWin' || battleState.phase === 'enemyWin',
  };
};

export default useBattle;
