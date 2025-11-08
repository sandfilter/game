/**
 * ==================================================================
 * core/eventHandlers.js (新文件)
 * 职责: 包含处理UI事件（如领奖、兑换）的回调函数实现。
 * (已修改：添加 buyProficiencyHandler)
 * (已修改：exchangeBadgeHandler 支持 amount 参数)
 * (已修改：添加 ascensionHandler)
 * ==================================================================
 */

import { addMessage } from '../ui/messageLog.js';
import { updateStatsDisplay } from '../ui/mainDisplay.js';
import { updateQuestDisplay } from '../ui/questUI.js';
import { updateExchangeModal } from '../ui/modalExchange.js';

import { 
    handleClaimQuest, 
    handleBadgeExchange, 
    handleProficiencyPurchase,
    handleAscension // <<< (新增)
} from './gameActions.js';
import { questConfig } from './initialization.js';
import { callbacks } from './callbackRegistry.js'; // 导入共享的回调

/**
 * 任务领奖的事件处理函数
 * (从 main.js 移来)
 */
export function claimQuestRewardHandler(questId) {
    console.log(`claimQuestRewardHandler called with ID: ${questId}`);
    const result = handleClaimQuest(questId);
    if (result.success) {
        addMessage(result.message, result.rewardType === 'legendary' ? 'legendary' : 'reward');
        updateStatsDisplay(); 
        
        // 我们将 callbacks.claimQuest (即此函数自身) 传递回去
        // 以便 updateQuestDisplay 可以将其重新绑定到新生成的按钮上
        updateQuestDisplay(questConfig, callbacks.claimQuest); 
    } else {
        console.log(`handleClaimQuest failed for ${questId}: ${result.message}`);
        if (result.message !== "任务未完成") {
           addMessage(result.message, 'error');
        }
    }
}

/**
 * 徽章兑换的事件处理函数
 * (从 main.js 移来)
 * (已修改：支持 amount 参数)
 */
export function exchangeBadgeHandler(badgeKey, amount) { // <<< (修改)
    console.log(`exchangeBadgeHandler called with key: ${badgeKey}, amount: ${amount}`);
    const result = handleBadgeExchange(badgeKey, amount); // <<< (修改)
    if (result.success) {
        addMessage(result.message, 'reward');
        updateStatsDisplay(); 
        
        // 同样，我们将 callbacks.handleExchange (此函数) 传递回去
        // 以便 updateExchangeModal 可以将其重新绑定
        updateExchangeModal(); // (不再需要传递回调，因为监听器是持久的)
    } else {
        console.log(`handleBadgeExchange failed for ${badgeKey}: ${result.message}`);
        addMessage(result.message, 'error');
    }
}

/**
 * (新增) 购买熟练度的事件处理函数
 */
export function buyProficiencyHandler() {
    console.log(`buyProficiencyHandler called`);
    const result = handleProficiencyPurchase();
    if (result.success) {
        addMessage(result.message, 'reward');
        updateStatsDisplay(); 
        updateExchangeModal(); // 刷新兑换中心的UI（更新金币和花费）
    } else {
        console.log(`handleProficiencyPurchase failed: ${result.message}`);
        addMessage(result.message, 'error');
    }
}

/**
 * (新增) 飞升的事件处理函数
 */
export function ascensionHandler() {
    console.log(`ascensionHandler called`);
    
    // 添加一个严格的确认框
    const confirmation = prompt(
        "飞升将重置您的所有进度（装备、金币、徽章、碎片和任务），以换取永久的熟练度加成。\n\n" +
        "您的收藏品（坐骑和信物）将被保留。\n\n" +
        "请输入“飞升”以确认："
    );

    if (confirmation !== "飞升") {
        addMessage("飞升操作已取消。", "system");
        return;
    }

    const result = handleAscension();
    
    if (result.success) {
        // 消息日志可能来不及显示，主要依靠 alert
        addMessage(result.message, 'legendary');
        alert(result.message + "\n游戏即将重新加载！");
        location.reload(); // 重新加载页面以应用重置
    } else {
        addMessage(result.message, 'error');
    }
}