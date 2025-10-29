/**
 * ==================================================================
 * core/battleCallbacks.js
 * (已修改：接收 updateStatsDisplay 作为回调)
 * ==================================================================
 */

import { AnimatedBattleAdventure } from '../battle/BattleController.js';
import { gameState, FINAL_GEAR_CAP } from './gameState.js';
import { saveGame } from './saveManager.js';
import { startNewDungeon, resetAllDungeonProgress, setBattleGameInstance } from './gameLoop.js';
// (修改：移除 updateStatsDisplay 的导入)
import { updateDungeonProgressDisplay } from '../ui/mainDisplay.js';
import { updateQuestDisplay } from '../ui/questUI.js';
import { addMessage } from '../ui/messageLog.js';
import { questConfig } from './initialization.js';
import { GAME_DATA } from '../data/game-rules.js';
import { GAME_CONFIG } from '../config/battle-config.js';
import { TIMING_CONFIG } from '../config/timing-config.js';
import { callbacks } from '../main.js';

// --- Module Variables ---
export let battleGame = null;
let _addMessage = () => {}; // Store addMessage callback
let _updateStatsDisplay = () => {}; // Store updateStatsDisplay callback

/**
 * 创建 BattleAdventure 实例
 * (修改：接收 updateStatsDisplayCallback)
 */
export function createBattleGame(addMessageCallback, updateStatsDisplayCallback) {
    _addMessage = addMessageCallback || _addMessage; // Store the callback
    _updateStatsDisplay = updateStatsDisplayCallback || _updateStatsDisplay; // Store the callback

    battleGame = new AnimatedBattleAdventure(
        _addMessage, // Pass the stored callback
        giveRewards,
        handleDungeonCompletion
    );
    battleGame.setGameState(gameState);
    setBattleGameInstance(battleGame);
}

/**
 * 副本完成时的回调
 */
function handleDungeonCompletion() { //
    if (!gameState.currentDungeon) { //
         console.warn("handleDungeonCompletion 被调用，但没有当前副本。"); //
         return; //
    }
    const completedDungeonRef = gameState.currentDungeon; //
    completedDungeonRef.completed = true; //
    completedDungeonRef.bossesDefeated = 0; //
    if (gameState.gearScore >= FINAL_GEAR_CAP) { //
        let bonusGold = 0; //
        let rule; //
         const rules = GAME_DATA.游戏数据.副本奖励规则.等级上限奖励; //
        if (completedDungeonRef.size === 10) rule = rules?.["10人副本完成"]; //
        else if (completedDungeonRef.size === 25) rule = rules?.["25人副本完成"]; //
        if (rule && rule.范围) { //
            bonusGold = Math.floor(Math.random() * (rule.范围[1] - rule.范围[0] + 1)) + rule.范围[0]; //
            gameState.gold += bonusGold; //
            _addMessage(`装等已达上限，通关副本获额外 ${bonusGold} 金币！`, 'reward'); // Use stored callback
        }
    }
    const lastDungeonSize = completedDungeonRef.size; //
    gameState.currentDungeon = null; //
    _updateStatsDisplay(); // Use stored callback
    updateDungeonProgressDisplay(); //
    let nextDungeonSize = lastDungeonSize; //
    let requiresResetAndRestart = false; //
    if (lastDungeonSize === 5) { //
        if (gameState.dungeons5p.every(d => d.completed)) { //
            _addMessage("已完成所有5人副本！重置所有副本进度！", "system"); // Use stored callback
            requiresResetAndRestart = true; //
        }
    } else if (lastDungeonSize === 10) { //
        if (gameState.raids10p.every(d => d.completed)) { //
            _addMessage("已完成所有10人团队副本！将自动开始5人地下城。", "system"); // Use stored callback
            nextDungeonSize = 5; //
        }
    } else if (lastDungeonSize === 25) { //
         if (gameState.raids25p.every(d => d.completed)) { //
            _addMessage("已完成所有25人团队副本！将自动开始5人地下城。", "system"); // Use stored callback
            nextDungeonSize = 5; //
        }
    }
    if (requiresResetAndRestart) { //
         resetAllDungeonProgress(); //
         _addMessage(`正在自动匹配下一个5人副本...`, 'system'); // Use stored callback
         setTimeout(() => startNewDungeon(5), TIMING_CONFIG.DUNGEON_START_DELAY); //
    } else { //
         _addMessage(`正在自动匹配下一个${nextDungeonSize}人副本...`, 'system'); // Use stored callback
         setTimeout(() => startNewDungeon(nextDungeonSize), TIMING_CONFIG.DUNGEON_START_DELAY); //
    }
}

/**
 * 给予奖励的回调
 */
function giveRewards(result, defeatedBoss = null) { //
    const { sceneType, winner } = result; //
    if (winner !== '勇士') return; //

    try { //
        if (sceneType === 'monster') { //
            gameState.monstersKilled = (gameState.monstersKilled || 0) + GAME_CONFIG.monsterScene.monsterCount; //
            // Log removed
        } else if (sceneType === 'boss') { //
            const dungeon = gameState.currentDungeon; //
             if (!dungeon || !defeatedBoss || !dungeon.bosses || !Array.isArray(dungeon.bosses) || !dungeon.bosses.some(b => b?.名称 === defeatedBoss?.名称)) { //
                 console.error("giveRewards (Boss): 状态无效。", { dungeonName: dungeon?.name, bossName: defeatedBoss?.名称, bossesDefeated: dungeon?.bossesDefeated }); //
                 if (battleGame) battleGame.stopCurrentBattle(true); //
                 gameState.currentDungeon = null; //
                 updateDungeonProgressDisplay(); //
                 saveGame(); //
                return; //
            };
            const isLastBoss = (dungeon.bossesDefeated + 1) === dungeon.bosses.length; //
            const bossGoldReward = isLastBoss ? 20 : 10; //
            gameState.gold = (gameState.gold || 0) + bossGoldReward; //
            const dungeonSizeKey = `${dungeon.size}人`; //
            const rulesForSize = GAME_DATA.游戏数据.副本奖励规则[dungeonSizeKey]; //
            const rewardRules = rulesForSize ? (isLastBoss ? rulesForSize.最终BOSS : rulesForSize.普通BOSS) : []; //
            let gearIncrease = 0, goldCost = 0; //
            if (gameState.gearScore < FINAL_GEAR_CAP) { //
                for (const rule of rewardRules) { //
                    if (rule && typeof rule.几率 === 'number' && typeof rule.花费金币 === 'number') { //
                        if (Math.random() < rule.几率) { //
                            if (gameState.gold >= rule.花费金币) { //
                                gearIncrease = rule.数值 || 0; //
                                goldCost = rule.花费金币; //
                            } else { //
                                _addMessage('遇到了好装备，但金币不足，真可惜。', 'error'); // Use stored callback
                            }
                            break; //
                        }
                    } else { //
                        console.warn("发现无效的奖励规则:", rule); //
                    }
                }
            }
            gameState.gold -= goldCost; //
            gameState.gold = Math.max(0, gameState.gold); //
            gameState.gearScore = Math.min(FINAL_GEAR_CAP, (gameState.gearScore || 0) + gearIncrease); //
            gameState.gearScore = parseFloat(gameState.gearScore.toFixed(1)); //
            gameState.proficiency = (gameState.proficiency || 0) + 1; //
            gameState.bossesKilled = (gameState.bossesKilled || 0) + 1; //
            dungeon.bossesDefeated++; //
            let badgeReward = 0; //
            let badgeName = ''; //
            if (dungeon.badgeType) { //
                if (dungeon.size === 5) badgeReward = isLastBoss ? 2 : 1; //
                else if (dungeon.size === 10 || dungeon.size === 25) badgeReward = isLastBoss ? 3 : 2; //
                if (badgeReward > 0) { //
                     const badgeKey = dungeon.badgeType; //
                     if (gameState.badges) { //
                         gameState.badges[badgeKey] = (gameState.badges[badgeKey] || 0) + badgeReward; //
                         const badgeNameMap = { heroism: "英雄", valor: "勇气", conquest: "征服", triumph: "凯旋", frost: "寒冰" }; //
                         badgeName = badgeNameMap[badgeKey]; //
                     } else { //
                         badgeReward = 0; //
                     }
                }
            }
            let rewardMessage = `成功击败 ${defeatedBoss.名称}！熟练度+1，获得 ${bossGoldReward} 金币`; //
            if (gearIncrease > 0) rewardMessage += `, 装备等级+${gearIncrease.toFixed(1)}！`; //
            if (goldCost > 0) rewardMessage += ` (花费 ${goldCost} 金币)`; //
            if (badgeReward > 0 && badgeName) { //
                rewardMessage += `，获得 ${badgeReward} ${badgeName}徽章！`; //
            }
            _addMessage(rewardMessage, 'reward'); // Use stored callback
            if (dungeon.size === 25) { //
                handleLegendaryShardDrop(defeatedBoss); //
            }
        }
        _updateStatsDisplay(); // Use stored callback
        updateQuestDisplay(questConfig, callbacks.claimQuest); //
        updateDungeonProgressDisplay(); //
    } catch (error) { //
         console.error("giveRewards 内部发生错误:", error); //
         _addMessage("处理奖励时发生内部错误，战斗已停止。", "error"); // Use stored callback
         if (battleGame) { //
             battleGame.stopCurrentBattle(true); //
         }
         gameState.currentDungeon = null; //
         updateDungeonProgressDisplay(); //
         saveGame(); //
    }
}

/**
 * 处理传说碎片掉落
 */
function handleLegendaryShardDrop(boss) { //
    if (!boss || !gameState.legendaryShards) { //
         console.warn("handleLegendaryShardDrop 缺少 boss 或 gameState.legendaryShards"); //
         return; //
    }
    const shardKeyMap = { //
        "埃提耶什的碎片": "atiyehsuide",
        "瓦兰奈尔的碎片": "walanaiersuide",
        "炉石传说的碎片": "lushichuanshuodesuide",
        "影之碎片": "yingzhisuide",
        "霜之碎片": "shuangzhisuide"
    };
    for (const shardName in shardKeyMap) { //
        if (boss.hasOwnProperty(shardName)) { //
            const dropChance = boss[shardName]; //
            if (typeof dropChance === 'number' && dropChance > 0 && Math.random() < dropChance) { //
                const key = shardKeyMap[shardName]; //
                if (key) { //
                    gameState.legendaryShards[key] = (gameState.legendaryShards[key] || 0) + 1; //
                    _addMessage(`✨ 传说物品掉落！获得 1x [${shardName}]！`, 'legendary'); // Use stored callback
                }
            }
        }
    }
}