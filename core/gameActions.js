/**
 * ==================================================================
 * core/gameActions.js
 * (已修改：移除了 FINAL_GEAR_CAP 逻辑)
 * (已修改：完成橙杖任务时自动装备并添加收藏)
 * (已修改：简化 handleBadgeExchange 逻辑)
 * (已修改：添加 handleProficiencyPurchase 作为金币消耗途径)
 * (已修改：handleBadgeExchange 支持 amount 参数)
 * (已修改：添加 Reminder 触发器到 handleClaimQuest)
 * (已修改：修正熟练度花费BUG，使用 proficiencyPurchased)
 * (已修改：熟练度花费改为指数级增长 (15% 递增))
 * (已修改：handleBadgeExchange 中增加 amount 的安全解析和调试日志)
 * (已修改：添加 handleAscension 飞升重置函数，初始熟练度修正为 200)
 * (已修改：添加瓦兰奈尔橙锤领取逻辑)
 * (已修改：飞升逻辑支持同时升级所有已拥有的传家宝信物)
 * (已修改：飞升时正确清除传说武器，只保留信物和坐骑)
 * ==================================================================
 */

import { questConfig, checkAndApplyLegendaryDropRates } from './initialization.js'; //
import { gameState, defaultGameState } from './gameState.js'; // 
import { GAME_DATA } from '../data/game-rules.js'; //
import { equipItem, calculateAverageGearScore } from './equipmentManager.js'; //
import { addReminder } from '../ui/reminderManager.js'; //
import { ITEM_DATA } from '../data/item-data.js'; //
import { saveGame } from './saveManager.js'; //

/**
 * (修改) 金币购买熟练度的消耗公式
 * 基础 1000 金币，每购买一次，花费增加 15%。
 * Cost = 1000 * (1.15 ^ proficiencyPurchased)
 */
export function getProficiencyCost() {
    const baseCost = 1000;
    const purchasedCount = gameState.proficiencyPurchased || 0; 
    
    // 使用指数增长公式，并向下取整确保价格是整数
    const cost = baseCost * Math.pow(1.15, purchasedCount);
    
    return Math.floor(cost); 
}

/**
 * (修改) 处理金币购买熟练度的逻辑
 * (现在会增加总熟练度 和 已购买熟练度)
 */
export function handleProficiencyPurchase() {
    const cost = getProficiencyCost();
    
    if (gameState.gold < cost) {
        return { success: false, message: `金币不足，需要 ${cost} 金币。` };
    }

    gameState.gold -= cost;
    gameState.proficiency += 1; // 增加总熟练度 (用于战斗)
    gameState.proficiencyPurchased = (gameState.proficiencyPurchased || 0) + 1; // 增加已购买熟练度 (用于花费)

    return { 
        success: true, 
        message: `成功购买 1 点熟练度，花费 ${cost} 金币。` 
    };
}


/**
 * 处理任务领奖逻辑
 * (已修改：添加橙杖/橙锤奖励和提醒)
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
            
            // --- (修改) 传说武器通用处理逻辑 ---
            let itemId = null;
            if (itemName === "埃提耶什·守护者的传说之杖") {
                itemId = "atiyeh_legendary_staff_232";
            } else if (itemName === "瓦兰奈尔·远古王者之锤") {
                itemId = "valanyr_hammer_245";
            }

            if (itemId && ITEM_DATA[itemId]) {
                const item = ITEM_DATA[itemId];
                // 1. 添加到收藏品
                if (!gameState.collectibles.includes(itemId)) {
                    gameState.collectibles.push(itemId);
                }
                // 2. 自动装备
                equipItem(itemId);
                // 3. 立即重算装等
                calculateAverageGearScore();
                // 4. 触发提醒
                addReminder(`制造了 [${item.name}]`, '✨', item.rarity);
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
 * (已修改：移除装等提升逻辑，只保留金币兑换)
 * (已修改：支持 amount 参数，并增加安全解析和调试日志)
 * (已修改：应用飞升信物金币加成)
 */
export function handleBadgeExchange(badgeKey, amount = 1) { 
    // --- (修改) 安全解析 amount，确保至少为 1 的整数 ---
    amount = Math.floor(parseInt(amount)) || 1; 
    
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
    
    // --- (修改) 计算总花费 ---
    const totalCost = rule.兑换比例 * amount;

    // --- (新增) 调试日志 ---
    console.log(`[Exchange Check] ${badgeName}兑换。数量: ${amount}, 基础花费: ${rule.兑换比例}, 总花费: ${totalCost}`);

    const hasBadges = currentBadgeCount >= totalCost; //
    // --- 修改结束 ---

    if (!hasBadges) { //
        return { success: false, message: `兑换失败：${badgeName}数量不足 (需要 ${totalCost}，拥有 ${currentBadgeCount})。` }; //
    }

    // --- 始终执行金币兑换 ---
    if (!rule.金币兑换) { //
            return { success: false, message: `兑换失败：${badgeName} 没有金币兑换规则。` }; //
    }
    
    // --- (修改) 计算总收益 (应用飞升加成) ---
    let totalGold = rule.金币兑换 * amount;
    
    // 应用瓦兰奈尔信物加成 (每级+10%)
    const valanyrLevel = gameState.heirloomLevels?.valanyr_hammer || 0;
    if (valanyrLevel > 0) {
        const bonusMultiplier = 1 + (valanyrLevel * 0.10);
        totalGold = Math.floor(totalGold * bonusMultiplier);
    }
    
    gameState.badges[badgeKey] -= totalCost; //
    gameState.gold += totalGold; //
    // --- 修改结束 ---
    
    let message = `成功兑换 ${totalGold} 金币，花费 ${totalCost} ${badgeName}。`; //
    
    return { success: true, message: message }; //
}


/**
 * (修改) 处理飞升逻辑
 * (支持同时升级所有已拥有的传家宝信物)
 * (已修改：飞升时移除传说武器，保留信物和坐骑)
 */
export function handleAscension() {
    // 1. 定义信物映射关系
    const heirloomMapping = [
        { 
            weaponKey: "埃提耶什·守护者的传说之杖", 
            heirloomId: "atiyeh_staff", 
            itemId: "talisman_atiyeh", 
            name: "守护者的传承" 
        },
        { 
            weaponKey: "瓦兰奈尔·远古王者之锤", 
            heirloomId: "valanyr_hammer", 
            itemId: "talisman_valanyr", 
            name: "远古王者的赠礼" 
        }
    ];

    // 2. 找出本次飞升可以升级的信物
    const upgradesToApply = heirloomMapping.filter(def => gameState.legendaryItemsObtained[def.weaponKey]);

    if (upgradesToApply.length === 0) {
        return { success: false, message: "飞升失败：你没有可以用于飞升的传说物品。" };
    }
    
    // --- 3. 保存需要保留的数据 (并进行过滤) ---
    // 过滤掉所有 "mainhand" (武器) 类型的收藏品，只保留 "collectible" (坐骑/信物)
    const permanentCollectibles = gameState.collectibles.filter(id => {
        const item = ITEM_DATA[id];
        // 保留信物和坐骑，移除武器
        return item && item.slot === 'collectible';
    });

    const currentAscensionLevel = gameState.ascensionLevel || 0;
    const currentHeirloomLevels = { ...defaultGameState.heirloomLevels, ...gameState.heirloomLevels };

    // --- 4. 执行重置 ---
    const freshState = JSON.parse(JSON.stringify(defaultGameState));
    Object.assign(gameState, freshState);

    // --- 5. 恢复保留的数据 ---
    gameState.collectibles = permanentCollectibles;
    gameState.ascensionLevel = currentAscensionLevel + 1;
    gameState.heirloomLevels = currentHeirloomLevels;
    
    // --- 6. 应用升级并记录日志 ---
    let upgradeLog = [];
    upgradesToApply.forEach(def => {
        // 升级信物等级
        gameState.heirloomLevels[def.heirloomId] = (gameState.heirloomLevels[def.heirloomId] || 0) + 1;
        // 确保拥有信物外观
        if (!gameState.collectibles.includes(def.itemId)) {
            gameState.collectibles.push(def.itemId);
        }
        upgradeLog.push(`[${def.name}] (等级 ${gameState.heirloomLevels[def.heirloomId]})`);
    });

    // --- 7. 应用飞升加成 ---
    // (橙杖：每级+200初始熟练度)
    const atiyehLevel = gameState.heirloomLevels["atiyeh_staff"] || 0;
    gameState.proficiency = atiyehLevel * 200; 
    
    // --- 8. 立即存档 ---
    saveGame();
    
    return { 
        success: true, 
        message: `飞升成功！(第 ${gameState.ascensionLevel} 次)\n已升级信物：${upgradeLog.join(", ")}\n初始熟练度 +${gameState.proficiency}！` 
    };
}