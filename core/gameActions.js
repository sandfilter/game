/**
 * ==================================================================
 * core/gameActions.js
 * (拆分自 game-bundle.js)
 *
 * 职责:
 * 1. 处理任务领奖逻辑 (handleClaimQuest)。
 * 2. 处理徽章兑换逻辑 (handleBadgeExchange)。
 * ==================================================================
 */

import { questConfig, checkAndApplyLegendaryDropRates } from './initialization.js';
import { gameState, FINAL_GEAR_CAP } from './gameState.js';
import { GAME_DATA } from '../data/game-rules.js';

/**
 * 处理任务领奖逻辑
 *
 */
export function handleClaimQuest(questId) {
    const quest = questConfig[questId]; //
    if (!quest) { //
        return { success: false, message: "未找到任务" }; //
    }

    if (quest.getProgress(gameState) >= quest.target) { //
        if (quest.reward.类型 === '金币') { //
            gameState.gold += quest.reward.数量; //
            
            if (quest.id === 'monstersKilled') gameState.monstersKilled -= quest.target; //
            else if (quest.id === 'bossesKilled') gameState.bossesKilled -= quest.target; //
             
             if(gameState.monstersKilled < 0) gameState.monstersKilled = 0; //
             if(gameState.bossesKilled < 0) gameState.bossesKilled = 0; //


            return { //
                success: true, //
                rewardType: 'gold', //
                message: `任务“${quest.name}”完成！获得 ${quest.reward.数量} 金币奖励！` //
            };

        } else if (quest.reward.类型 === '传说物品') { //
            const itemName = quest.reward.物品名称; //
            gameState.legendaryItemsObtained[itemName] = true; //

            const keys = quest.id.split('.'); //
            if (gameState[keys[0]] && typeof gameState[keys[0]][keys[1]] !== 'undefined') { //
                 gameState[keys[0]][keys[1]] -= quest.target; //
                 if (gameState[keys[0]][keys[1]] < 0) gameState[keys[0]][keys[1]] = 0; //
            }

            checkAndApplyLegendaryDropRates(); //

            return { //
                success: true, //
                rewardType: 'legendary', //
                message: `恭喜！你制造了 [${itemName}]！` //
            };
        }
    }
    return { success: false, message: "任务未完成" }; //
}

/**
 * 处理徽章兑换逻辑
 * @param {string} badgeKey - 徽章的key (e.g., 'heroism')
 * @returns {object} - { success: boolean, message: string }
 *
 */
export function handleBadgeExchange(badgeKey) {
    const badgeNameMap = { heroism: "英雄徽章", valor: "勇气徽章", conquest: "征服徽章", triumph: "凯旋徽章", frost: "寒冰徽章" }; //
    const badgeName = badgeNameMap[badgeKey]; //
    if (!badgeName) { //
        return { success: false, message: "无效的徽章类型" }; //
    }

    // 1. 查找规则
    //
    const rule = GAME_DATA.游戏数据.徽章兑换规则[badgeName]; //
    // 2. 检查数量
    //
    const hasBadges = gameState.badges[badgeKey] >= rule.兑换比例; //

    if (!hasBadges) { //
        return { success: false, message: `兑换失败：${badgeName}数量不足。` }; //
    }

    if (gameState.gearScore < FINAL_GEAR_CAP) { //
        // 未满级：换装备
        //
        gameState.badges[badgeKey] -= rule.兑换比例; //
        const newGearScore = gameState.gearScore + rule.提升装备等级; //
        gameState.gearScore = Math.min(newGearScore, FINAL_GEAR_CAP); // 不能超过上限
        gameState.gearScore = parseFloat(gameState.gearScore.toFixed(1)); // 修正精度
        return { //
            success: true, //
            message: `成功兑换 ${rule.提升装备等级.toFixed(1)} 点装备等级，花费 ${rule.兑换比例} ${badgeName}。` //
        };
    } else { //
        // 已满级：换金币
        //
        gameState.badges[badgeKey] -= rule.兑换比例; //
        gameState.gold += rule.金币兑换; //
        return { //
            success: true, //
            // === ⬇️ BUG修复：将 rule.比例 修正为 rule.兑换比例 ⬇️ ===
            message: `装备等级已达上限。成功兑换 ${rule.金币兑换} 金币，花费 ${rule.兑换比例} ${badgeName}。` //
        };
    }
}