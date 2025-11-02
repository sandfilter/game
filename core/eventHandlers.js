/**
 * ==================================================================
 * core/eventHandlers.js (新文件)
 * 职责: 包含处理UI事件（如领奖、兑换）的回调函数实现。
 * ==================================================================
 */

import { addMessage } from '../ui/messageLog.js';
import { updateStatsDisplay } from '../ui/mainDisplay.js';
import { updateQuestDisplay } from '../ui/questUI.js';
import { updateExchangeModal } from '../ui/modalExchange.js';

import { handleClaimQuest, handleBadgeExchange } from './gameActions.js';
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
 */
export function exchangeBadgeHandler(badgeKey) {
    console.log(`exchangeBadgeHandler called with key: ${badgeKey}`);
    const result = handleBadgeExchange(badgeKey);
    if (result.success) {
        addMessage(result.message, 'reward');
        updateStatsDisplay(); 
        
        // 同样，我们将 callbacks.handleExchange (此函数) 传递回去
        // 以便 updateExchangeModal 可以将其重新绑定
        updateExchangeModal(callbacks.handleExchange); 
    } else {
        console.log(`handleBadgeExchange failed for ${badgeKey}: ${result.message}`);
        addMessage(result.message, 'error');
    }
}