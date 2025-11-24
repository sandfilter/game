/**
 * ==================================================================
 * services/slotMachineSystem.js
 * 职责: 定义水果机配置、兑换汇率、核心结果计算。
 * (已修改：将水果图标替换为收藏品图标)
 * ==================================================================
 */

import { gameState } from '../core/gameState.js';
import { saveGame } from '../core/saveManager.js';
import { ITEM_DATA } from '../data/item-data.js';
import { updateStatsDisplay } from '../ui/mainDisplay.js';

export const SLOT_CONFIG = {
    EXCHANGE_RATES: {
        heroism: 50, valor: 45, conquest: 40, triumph: 35, frost: 30, abyssCrystal: 60, gold: 200
    },
    PAYOUT_ORDER: ['BAR', '77', '⭐️', '🍉', '🔔', '🍋', '🍊', '🍎'],
    
    // (修改) 图标替换为收藏品
    PAYOUTS: {
        '🍎': { p: 3,  i: '🥚' }, // 龙蛋
        '🍊': { p: 5,  i: '🎭' }, // 眼罩
        '🍋': { p: 6,  i: '📓' }, // 写真集
        '🔔': { p: 8,  i: '🚁' }, // 飞机头
        '🍉': { p: 10,  i: '🐲' }, // 奥妮克希亚
        '⭐️': { p: 15, i: '🍗' }, // 橙杖
        '77': { p: 25, i: '🔨' }, // 橙锤
        'BAR':{ p: 35, i: '🎴' }  // 炉石
    },
    
    TRACK_LAYOUT: [
        'BAR',  '🍎', '🍊', '🍋', '🔔', '🍉', '⭐️', '77', // Top
        '🍎',   '🍊', '🍋', '🔔',                         // Right
        '🍎',   '🍊', '🍋', '🔔', '🍎', '🍊', '🍋', '🔔', // Bottom
        '🍎',   '🍊', '🍉', '⭐️'                          // Left
    ]
};

export function exchangeCurrencyForCredit(type, amount = 1) {
    const cost = SLOT_CONFIG.EXCHANGE_RATES[type] * amount;
    if (!cost) return { success: false, message: "无效类型" };

    let current = (type === 'gold') ? (gameState.gold || 0) : (gameState.badges[type] || 0);

    if (current < cost) {
        return { success: false, message: "货币不足" };
    }

    if (type === 'gold') gameState.gold -= cost;
    else gameState.badges[type] -= cost;

    gameState.slotCredits = (gameState.slotCredits || 0) + amount;
    
    saveGame();
    updateStatsDisplay(); 
    return { success: true, message: "兑换成功" };
}

export function exchangeCreditForCollectible() {
    const COST = 500; 
    if ((gameState.slotCredits || 0) < COST) return { success: false, message: `积分不足 (需${COST})` };

    const all = Object.keys(ITEM_DATA).filter(k => ITEM_DATA[k].type === 'collectible' && ITEM_DATA[k].slot === 'collectible');
    const unowned = all.filter(id => !gameState.collectibles.includes(id));

    if (unowned.length === 0) return { success: false, message: "已拥有所有可兑换的玩具/坐骑！" };

    gameState.slotCredits -= COST;
    const rewardId = unowned[Math.floor(Math.random() * unowned.length)];
    
    gameState.collectibles.push(rewardId);
    saveGame();
    updateStatsDisplay();

    return { success: true, message: `获得: [${ITEM_DATA[rewardId].name}]`, item: ITEM_DATA[rewardId] };
}

export function calculateSlotResult(bets) {
    const idx = Math.floor(Math.random() * SLOT_CONFIG.TRACK_LAYOUT.length);
    const key = SLOT_CONFIG.TRACK_LAYOUT[idx];
    let win = 0;
    if (bets[key] > 0) win = bets[key] * SLOT_CONFIG.PAYOUTS[key].p;
    return { finalIndex: idx, winnings: win };
}

export function settleSlotGame(winnings) {
    if(winnings > 0) {
        gameState.slotCredits = (gameState.slotCredits || 0) + winnings;
        saveGame();
        updateStatsDisplay();
    }
}