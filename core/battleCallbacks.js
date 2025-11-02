/**
 * ==================================================================
 * core/battleCallbacks.js
 * (已修正：isLastBoss 变量作用域)
 * (已修改：添加对 "collectible" 物品类型的处理)
 * ==================================================================
 */

import { AnimatedBattleAdventure } from '../battle/BattleController.js'; //
import { gameState } from './gameState.js'; //
import { saveGame } from './saveManager.js'; //
import { setBattleGameInstance, handleDungeonCompletionFlow } from './gameLoop.js'; 
import { updateDungeonProgressDisplay } from '../ui/mainDisplay.js'; //
import { updateQuestDisplay } from '../ui/questUI.js'; //
import { addMessage } from '../ui/messageLog.js'; //
import { questConfig } from './initialization.js'; //
import { GAME_CONFIG } from '../config/battle-config.js'; //
import { callbacks } from './callbackRegistry.js'; //
import { equipItem, calculateAverageGearScore } from './equipmentManager.js'; //
import { ITEM_DATA } from '../data/item-data.js'; //

// --- Module Variables ---
export let battleGame = null; //
let _addMessage = () => {}; //
let _updateStatsDisplay = () => {}; //

/**
 * 创建 BattleAdventure 实例
 */
export function createBattleGame(addMessageCallback, updateStatsDisplayCallback) { //
    _addMessage = addMessageCallback || _addMessage; //
    _updateStatsDisplay = updateStatsDisplayCallback || _updateStatsDisplay; //

    battleGame = new AnimatedBattleAdventure( //
        _addMessage, //
        giveRewards, //
        handleDungeonCompletion //
    );
    battleGame.setGameState(gameState); //
    setBattleGameInstance(battleGame); //
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
    handleDungeonCompletionFlow(completedDungeonRef); 
}


/**
 * 给予奖励的回调
 * (已修正：isLastBoss 作用域)
 */
function giveRewards(result, defeatedBoss = null) { //
    const { sceneType, winner } = result; //
    if (winner !== '勇士') return; //

    try { //
        if (sceneType === 'monster') { //
            gameState.monstersKilled = (gameState.monstersKilled || 0) + GAME_CONFIG.monsterScene.monsterCount; //
        
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

            // --- (修正) isLastBoss 必须在这里定义 ---
            const isLastBoss = (dungeon.bossesDefeated + 1) === dungeon.bosses.length; //
            // --- 修正结束 ---

            // --- (修改) 金币奖励逻辑 ---
            let bossGoldReward = 0; // 默认0金币
            if (dungeon.size > 5) { // 仅限10人和25人
                // (isLastBoss 已在上方定义)
                bossGoldReward = isLastBoss ? 20 : 10; //
                gameState.gold += bossGoldReward; //
            }
            // --- 金币奖励逻辑结束 ---

            let rewardMessage = `成功击败 ${defeatedBoss.名称}！熟练度+1`; //
            if (bossGoldReward > 0) {
                 rewardMessage += `，获得 ${bossGoldReward} 金币`; //
            }
            
            let gotAnUpgrade = false; //

            let lootTableToUse = null;
            if (dungeon.size === 10 && defeatedBoss.lootTable_10) {
                lootTableToUse = defeatedBoss.lootTable_10;
            } else if (dungeon.size === 25 && defeatedBoss.lootTable_25) {
                lootTableToUse = defeatedBoss.lootTable_25;
            } else if (defeatedBoss.lootTable) {
                lootTableToUse = defeatedBoss.lootTable;
            }

            if (lootTableToUse && Array.isArray(lootTableToUse)) { 
                lootTableToUse.forEach(loot => { 
                    if (Math.random() < loot.dropRate) { 
                        const item = ITEM_DATA[loot.itemId]; 
                        if (item) { 
                            
                            // --- (新增) 收藏品处理 ---
                            if (item.type === 'collectible') {
                                if (!gameState.collectibles.includes(loot.itemId)) {
                                    gameState.collectibles.push(loot.itemId);
                                    // 单独发送一条传奇消息
                                    _addMessage(`✨ 收藏品掉落！获得 1x [${item.name}]！`, 'legendary');
                                } else {
                                    // (如果重复获得，可以选择分解或发消息，暂时忽略)
                                }
                            }
                            // --- (修改) 装备处理 ---
                            else if (item.slot) { // 确保它是一个装备
                                const equippedItem = equipItem(loot.itemId); 
                                if (equippedItem) { 
                                    rewardMessage += `，⭐获得了 [${item.name}] (升级!)`; 
                                    gotAnUpgrade = true; 
                                } else { 
                                    gameState.badges.abyssCrystal = (gameState.badges.abyssCrystal || 0) + 1; 
                                    rewardMessage += `，获得了 [${item.name}] (已分解，💎深渊水晶+1)`; 
                                }
                            }
                            // --- 逻辑结束 ---
                        }
                    }
                });
            }

            if (gotAnUpgrade) { 
                calculateAverageGearScore(); 
            }
            
            gameState.proficiency += 1; 
            gameState.bossesKilled += 1; 
            dungeon.bossesDefeated++; 

            // --- 徽章和传说碎片逻辑 (保持不变) ---
            let badgeReward = 0; 
            let badgeName = ''; 
            if (dungeon.badgeType) { 
                // (修正) 此处现在可以安全访问 isLastBoss
                if (dungeon.size === 5) badgeReward = isLastBoss ? 2 : 1; 
                else if (dungeon.size === 10 || dungeon.size === 25) badgeReward = isLastBoss ? 3 : 2; 
                if (badgeReward > 0) { 
                     const badgeKey = dungeon.badgeType; 
                     if (gameState.badges) { 
                         gameState.badges[badgeKey] = (gameState.badges[badgeKey] || 0) + badgeReward; 
                         const badgeNameMap = { heroism: "英雄", valor: "勇气", conquest: "征服", triumph: "凯旋", frost: "寒冰" }; 
                         badgeName = badgeNameMap[badgeKey]; 
                         rewardMessage += `，获得 ${badgeReward} ${badgeName}徽章！`; 
                     }
                }
            }
            
            // (只在有内容时发送 Boss 击杀消息)
            if (rewardMessage !== `成功击败 ${defeatedBoss.名称}！熟练度+1`) {
                _addMessage(rewardMessage, 'reward'); 
            }

            if (dungeon.size === 25) { 
                handleLegendaryShardDrop(defeatedBoss); 
            }
        }
        
        _updateStatsDisplay(); 
        updateQuestDisplay(questConfig, callbacks.claimQuest); 
        updateDungeonProgressDisplay(); 
        
    } catch (error) { 
         console.error("giveRewards 内部发生错误:", error); 
         _addMessage("处理奖励时发生内部错误，战斗已停止。", "error"); 
         if (battleGame) { 
             battleGame.stopCurrentBattle(true); 
         }
         gameState.currentDungeon = null; 
         updateDungeonProgressDisplay(); 
         saveGame(); 
    }
}


/**
 * 处理传说碎片掉落
 */
function handleLegendaryShardDrop(boss) { 
    if (!boss || !gameState.legendaryShards) { 
         console.warn("handleLegendaryShardDrop 缺少 boss 或 gameState.legendaryShards"); 
         return; 
    }
    const shardKeyMap = { 
        "埃提耶什的碎片": "atiyehsuide",
        "瓦兰奈尔的碎片": "walanaiersuide",
        "炉石传说的碎片": "lushichuanshuodesuide",
        "影之碎片": "yingzhisuide",
        "霜之碎片": "shuangzhisuide"
    };
    for (const shardName in shardKeyMap) { 
        if (boss.hasOwnProperty(shardName)) { 
            const dropChance = boss[shardName]; 
            if (typeof dropChance === 'number' && dropChance > 0 && Math.random() < dropChance) { 
                const key = shardKeyMap[shardName]; 
                if (key) { 
                    gameState.legendaryShards[key] = (gameState.legendaryShards[key] || 0) + 1; 
                    _addMessage(`✨ 传说物品掉落！获得 1x [${shardName}]！`, 'legendary'); 
                }
            }
        }
    }
}