/**
 * ==================================================================
 * core/equipmentManager.js (新文件)
 * 职责: 处理装备逻辑 (穿戴、计算装等)。
 * (已修改：移除了 "relic" 槽位)
 * ==================================================================
 */

import { gameState } from './gameState.js';
import { ITEM_DATA } from '../data/item-data.js';

/**
 * 尝试装备一件新物品
 */
export function equipItem(newItemId) {
    const item = ITEM_DATA[newItemId];
    if (!item) {
        console.error(`equipItem 失败：找不到物品 ID ${newItemId}`);
        return null;
    }

    const slot = item.slot;
    // 检查是否是有效的装备槽
    if (!gameState.equipment.hasOwnProperty(slot)) {
        // Handle special cases for rings/trinkets
        if (slot === "trinket1" || slot === "trinket2" || slot === "finger1" || slot === "finger2") {
            // Fall-through to logic below
        } else {
            // (修改) 移除了 relic 相关的 console.error
            console.error(`equipItem 失败：物品槽 ${slot} 在 gameState 中不存在`);
            return null;
        }
    }

    // 检查饰品/戒指的特殊槽位
    let actualSlot = slot;
    if (slot === "trinket1" || slot === "trinket2") {
        actualSlot = findBestSlot(["trinket1", "trinket2"], item.gearScore);
    }
    if (slot === "finger1" || slot === "finger2") {
        actualSlot = findBestSlot(["finger1", "finger2"], item.gearScore);
    }
    
    if (!actualSlot) { // 意味着两个槽位都满了，并且都比新物品好
         return null; // 不是升级
    }

    const currentItemId = gameState.equipment[actualSlot];
    const currentItemGearScore = currentItemId ? (ITEM_DATA[currentItemId]?.gearScore || 0) : 0;

    // 检查是否为升级 (新物品装等 > 当前物品装等)
    if (item.gearScore > currentItemGearScore) {
        gameState.equipment[actualSlot] = newItemId;
        console.log(`装备了新物品 [${item.name}] 到 ${actualSlot} (装等 ${item.gearScore})`);
        return item; // 返回已装备的物品信息
    }

    return null; // 不是升级
}

/**
 * 查找戒指/饰品槽位 (查找空槽或装等最低的槽)
 */
function findBestSlot(slots, newItemGearScore) {
    let slotToReplace = null;
    let lowestGearScore = newItemGearScore; 

    // 优先查找空槽
    for (const slot of slots) {
        if (!gameState.equipment[slot]) {
            return slot; // 找到了一个空槽，立即使用
        }
    }

    // 如果没有空槽，查找装等最低的槽
    for (const slot of slots) {
        const currentItemId = gameState.equipment[slot];
        const currentItemGearScore = currentItemId ? (ITEM_DATA[currentItemId]?.gearScore || 0) : 0;

        // 寻找装等最低的槽位
        if (currentItemGearScore < lowestGearScore) {
            lowestGearScore = currentItemGearScore;
            slotToReplace = slot;
        }
    }
    
    return slotToReplace;
}


/**
 * 根据已装备的物品重新计算平均装备等级
 * (已修改：移除 relic 槽)
 */
export function calculateAverageGearScore() {
    let totalGearScore = 0;
    let equippedItemCount = 0; // 计入平均值的槽位数量

    // (修改) 16个标准槽位 (移除了 relic)
    const slotsToCount = [
        "head", "neck", "shoulder", "back", "chest", "wrist",
        "hands", "waist", "legs", "feet", "finger1", "finger2",
        "trinket1", "trinket2", "mainhand", "offhand"
    ];

    // (已移除) relic 检查
    /*
    if (gameState.equipment.hasOwnProperty("relic")) {
        slotsToCount.push("relic");
    }
    */

    let mainHandItem = null;
    let offHandItem = null;

    for (const slot of slotsToCount) {
        const itemId = gameState.equipment[slot];
        if (itemId) {
            const item = ITEM_DATA[itemId];
            if (item && item.gearScore) {
                totalGearScore += item.gearScore;
                if (slot === "mainhand") mainHandItem = item;
                if (slot === "offhand") offHandItem = item;
            }
        }
        equippedItemCount++; // 无论槽位是否为空，都计入分母 (16)
    }

    // (特殊规则：双持武器时，副手装等计入。持双手武器时，该武器计两次)
    // (我们的简化版：如果主手是双手武器(假设)，或副手为空，则将主手装等再加一次)
    if (mainHandItem && !offHandItem) {
         // 假设没有副手时，主手算两次 (模拟双手武器或单手+空)
         totalGearScore += mainHandItem.gearScore;
         // 注意：分母(equippedItemCount)已经包含了 mainhand 和 offhand (16)，所以这里不用动分母
    }

    const averageGearScore = equippedItemCount > 0 ? (totalGearScore / equippedItemCount) : 0;
    gameState.gearScore = parseFloat(averageGearScore.toFixed(1));
    console.log(`平均装备等级已更新为: ${gameState.gearScore}`);
}