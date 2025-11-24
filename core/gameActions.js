import { questConfig, checkAndApplyLegendaryDropRates } from './initialization.js'; 
import { gameState, defaultGameState } from './gameState.js'; 
import { equipItem, calculateAverageGearScore } from './equipmentManager.js'; 
import { addReminder } from '../ui/reminderManager.js'; 
import { ITEM_DATA } from '../data/item-data.js'; 
import { saveGame } from './saveManager.js'; 
import { getDailyProgress } from './dailySystem.js'; 
import { resetAllDungeonProgress } from './gameLoop.js'; 

export function getProficiencyCost() { return Math.floor(1000 * Math.pow(1.15, gameState.proficiencyPurchased || 0)); }
export function handleProficiencyPurchase() {
    const cost = getProficiencyCost();
    if (gameState.gold < cost) return { success: false, message: `金币不足，需要 ${cost} 金币。` };
    gameState.gold -= cost; gameState.proficiency += 1; gameState.proficiencyPurchased = (gameState.proficiencyPurchased || 0) + 1;
    return { success: true, message: `成功购买 1 点熟练度，花费 ${cost} 金币。` };
}

export function handleClaimDailyQuest(questId) {
    const quest = gameState.daily?.quests?.find(q => q.id === questId);
    if (!quest) return { success: false, message: "日常任务不存在或已过期。" };
    if (quest.claimed) return { success: false, message: "该奖励已领取。" };
    if (getDailyProgress(quest) < quest.target) return { success: false, message: "日常任务尚未完成。" };
    quest.claimed = true;
    if (quest.reward.gold) gameState.gold += quest.reward.gold;
    if (quest.reward.badge) { for (const badge in quest.reward.badge) { gameState.badges[badge] = (gameState.badges[badge] || 0) + quest.reward.badge[badge]; } }
    if (quest.reward.luckyChests) gameState.luckyChests = (gameState.luckyChests || 0) + quest.reward.luckyChests;
    saveGame();
    return { success: true, message: `日常完成！获得 [幸运宝箱] x${quest.reward.luckyChests}！`, rewardType: 'reward' };
}

export function handleAtieshPortal() {
    const level = Math.min(10, gameState.heirloomLevels?.atiyeh_staff || 0);
    const reduction = level * 5 * 60 * 1000;
    const COOLDOWN = Math.max(10 * 60 * 1000, 60 * 60 * 1000 - reduction); 
    const now = Date.now(); const last = gameState.lastAtieshResetTime || 0;
    if (now - last < COOLDOWN) { const remaining = Math.ceil((COOLDOWN - (now - last)) / 60000); return { success: false, message: `🌀 传送门能量不稳定，需要等待冷却 (剩余 ${remaining} 分钟)。` }; }
    resetAllDungeonProgress(); gameState.lastAtieshResetTime = now; saveGame();
    return { success: true, message: "🌀 埃提耶什开启了传送门！所有副本进度已强制重置！" };
}

export function handleValanyrChest() {
    const level = Math.min(10, gameState.heirloomLevels?.valanyr_hammer || 0);
    const reduction = level * 60 * 1000;
    const COOLDOWN = Math.max(5 * 60 * 1000, 15 * 60 * 1000 - reduction); 
    const now = Date.now(); const last = gameState.lastValanyrChestTime || 0;
    if (now - last < COOLDOWN) { const remaining = Math.ceil((COOLDOWN - (now - last)) / 60000); return { success: false, message: `⏳ 远古王者的赐福正在冷却 (剩余 ${remaining} 分钟)。` }; }
    gameState.luckyChests = (gameState.luckyChests || 0) + 1;
    gameState.lastValanyrChestTime = now; saveGame();
    return { success: true, message: "👑 远古王者赐予你 1 个 [幸运宝箱]！" };
}

export function handleHearthstoneSkill() {
    const level = Math.min(10, gameState.heirloomLevels?.hearthstone_card || 0);
    const reduction = level * 60 * 1000;
    const COOLDOWN = Math.max(5 * 60 * 1000, 15 * 60 * 1000 - reduction); 
    const now = Date.now(); 
    const last = gameState.lastHearthstoneSkillTime || 0;
    if (now - last < COOLDOWN) { 
        const remaining = Math.ceil((COOLDOWN - (now - last)) / 60000); 
        return { success: false, message: `⏳ 炉石技能冷却中 (剩余 ${remaining} 分钟)。` }; 
    }
    gameState.slotCredits = (gameState.slotCredits || 0) + 1;
    gameState.lastHearthstoneSkillTime = now; 
    saveGame();
    return { success: true, message: "🎴 这是一个回合制游戏！获得 1 个水果机积分！" };
}

export function handleClaimQuest(questId) {
    const quest = questConfig[questId]; if (!quest) return { success: false, message: "未找到任务" };
    if (quest.getProgress(gameState) >= quest.target) {
        if (quest.reward.类型 === '金币') {
            if (quest.milestoneId) { if (gameState.milestoneQuestsClaimed[quest.milestoneId]) return { success: false, message: "奖励已被领取。" }; gameState.milestoneQuestsClaimed[quest.milestoneId] = true; }
            gameState.gold += quest.reward.数量; return { success: true, rewardType: 'gold', message: `任务“${quest.name}”完成！获得 ${quest.reward.数量} 金币奖励！` };
        } else if (quest.reward.类型 === '传说物品') {
            const itemName = quest.reward.物品名称; gameState.legendaryItemsObtained[itemName] = true;
            const keys = quest.id.split('.'); if (gameState[keys[0]] && typeof gameState[keys[0]][keys[1]] !== 'undefined') gameState[keys[0]][keys[1]] = Math.max(0, gameState[keys[0]][keys[1]] - quest.target);
            const itemId = itemName==="埃提耶什·守护者的传说之杖"?"atiyeh_legendary_staff_232":(itemName==="瓦兰奈尔·远古王者之锤"?"valanyr_hammer_245":(itemName==="炉石传说·真尼玛好玩"?"hearthstone_legendary_weapon_258":null));
            if (itemId && ITEM_DATA[itemId]) {
                if (!gameState.collectibles.includes(itemId)) gameState.collectibles.push(itemId);
                equipItem(itemId); calculateAverageGearScore(); addReminder(`制造了 [${ITEM_DATA[itemId].name}]`, '✨', ITEM_DATA[itemId].rarity);
            }
            checkAndApplyLegendaryDropRates(); return { success: true, rewardType: 'legendary', message: `恭喜！你制造了 [${itemName}]！` };
        }
    }
    return { success: false, message: "任务未完成" };
}

export function handleAscension() {
    const map = [
        { k:"埃提耶什·守护者的传说之杖", h:"atiyeh_staff", i:"talisman_atiyeh", n:"守护者的传承" },
        { k:"瓦兰奈尔·远古王者之锤", h:"valanyr_hammer", i:"talisman_valanyr", n:"远古王者的赠礼" },
        { k:"炉石传说·真尼玛好玩", h:"hearthstone_card", i:"talisman_hearthstone", n:"Sol君的祝福" }
    ];
    const upgrades = map.filter(d => gameState.legendaryItemsObtained[d.k]);
    if (upgrades.length === 0) return { success: false, message: "飞升失败：无传说物品。" };
    
    const perms = gameState.collectibles.filter(id => ITEM_DATA[id] && ITEM_DATA[id].slot === 'collectible');
    const al = gameState.ascensionLevel || 0, hl = { ...defaultGameState.heirloomLevels, ...gameState.heirloomLevels };
    
    Object.assign(gameState, JSON.parse(JSON.stringify(defaultGameState)));
    gameState.collectibles = perms; gameState.ascensionLevel = al + 1; gameState.heirloomLevels = hl;
    
    const log = []; 
    upgrades.forEach(d => { 
        gameState.heirloomLevels[d.h] = (gameState.heirloomLevels[d.h] || 0) + 1; 
        if (!gameState.collectibles.includes(d.i)) gameState.collectibles.push(d.i); 
        log.push(`[${d.n}] Lv${gameState.heirloomLevels[d.h]}`); 
    });
    
    saveGame();
    return { success: true, message: `飞升成功！(第 ${gameState.ascensionLevel} 次)\n信物已升级：${log.join(", ")}` };
}