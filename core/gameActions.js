/**
 * ==================================================================
 * core/gameActions.js
 * (已修改：移除了 FINAL_GEAR_CAP 逻辑)
 * (已修改：完成橙杖任务时自动装备并添加收藏)
 * ==================================================================
 */

import { questConfig, checkAndApplyLegendaryDropRates } from './initialization.js'; //
import { gameState } from './gameState.js'; //
import { GAME_DATA } from '../data/game-rules.js'; //
import { equipItem, calculateAverageGearScore } from './equipmentManager.js'; // <<< (新增导入)

/**
 * 处理任务领奖逻辑
 * (已修改：添加橙杖奖励)
 */
export function handleClaimQuest(questId) { //
    const quest = questConfig[questId]; //
    if (!quest) { //
        return { success: false, message: "未找到任务" }; //
    }

    if (quest.getProgress(gameState) >= quest.target) { //
        
        if (quest.reward.类型 === '金币') { //
            
            if (quest.milestoneId) { //
                if (gameState.milestoneQuestsClaimed[quest.milestoneId]) { //
                    return { success: false, message: "奖励已被领取。" }; //
                }
                gameState.milestoneQuestsClaimed[quest.milestoneId] = true; //
            }

            gameState.gold += quest.reward.数量; //
            
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
            
            // --- (新增) 橙杖奖励逻辑 ---
            if (itemName === "埃提耶什·守护者的传说之杖") {
                const itemId = "atiyeh_legendary_staff_232"; // (来自 item-data.js)
                
                // 1. 添加到收藏品 (如果尚未拥有)
                if (!gameState.collectibles.includes(itemId)) {
                    gameState.collectibles.push(itemId);
                }
                // 2. 自动装备
                equipItem(itemId);
                // 3. 立即重算装等
                calculateAverageGearScore();
            }
            // --- 奖励逻辑结束 ---

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
 */
export function handleBadgeExchange(badgeKey) { //
    const badgeNameMap = { heroism: "英雄徽章", valor: "勇气徽章", conquest: "征服徽章", triumph: "凯旋徽章", frost: "寒冰徽章", abyssCrystal: "深渊水晶" }; //
    const badgeName = badgeNameMap[badgeKey]; //
    if (!badgeName) { //
        return { success: false, message: "无效的徽章类型" }; //
    }

    const rule = GAME_DATA.游戏数据.徽章兑换规则[badgeName]; //
    if (!rule) { //
        return { success: false, message: "未找到兑换规则" }; //
    }

    const currentBadgeCount = (gameState.badges && gameState.badges[badgeKey]) ? gameState.badges[badgeKey] : 0; //
    const hasBadges = currentBadgeCount >= rule.兑换比例; //

    if (!hasBadges) { //
        return { success: false, message: `兑换失败：${badgeName}数量不足。` }; //
    }

    const canUpgradeGear = rule.提升装备等级 && rule.提升装备等级 > 0; //

    if (canUpgradeGear) { //
        // 1. 它可以提升装备 -> 兑换装备等级
        gameState.badges[badgeKey] -= rule.兑换比例; //
        const newGearScore = gameState.gearScore + rule.提升装备等级; //
        gameState.gearScore = newGearScore; //
        gameState.gearScore = parseFloat(gameState.gearScore.toFixed(1)); //
        return { //
            success: true, //
            message: `成功兑换 ${rule.提升装备等级.toFixed(1)} 点装备等级，花费 ${rule.兑换比例} ${badgeName}。` //
        };
    } else { //
        // 2. 它不能提升装备 (如深渊水晶) -> 兑换金币
        if (!rule.金币兑换) { //
             return { success: false, message: `兑换失败：${badgeName} 没有金币兑换规则。` }; //
        }
        
        gameState.badges[badgeKey] -= rule.兑换比例; //
        gameState.gold += rule.金币兑换; //
        
        let message; //
        if (canUpgradeGear) { //
             message = `装备等级已达上限。成功兑换 ${rule.金币兑换} 金币，花费 ${rule.兑换比例} ${badgeName}。`; //
        } else { //
             // 是深渊水晶
             message = `成功兑换 ${rule.金币兑换} 金币，花费 ${rule.兑换比例} ${badgeName}。`; //
        }
        return { success: true, message: message }; //
    }
}