import { addMessage } from '../ui/messageLog.js'; import { updateStatsDisplay } from '../ui/mainDisplay.js'; import { updateQuestDisplay } from '../ui/questUI.js'; import { updateExchangeModal } from '../ui/modalExchange.js'; import { handleClaimQuest, handleProficiencyPurchase, handleAscension, handleClaimDailyQuest } from './gameActions.js'; import { questConfig } from './initialization.js'; import { callbacks } from './callbackRegistry.js'; 
import { updateChestUI } from '../ui/chestUI.js'; 

export function claimQuestRewardHandler(qid) {
    if (qid.startsWith('d_')) {
        const res = handleClaimDailyQuest(qid);
        if (res.success) { 
            addMessage(res.message, 'reward'); 
            updateStatsDisplay(); 
            updateQuestDisplay(questConfig, callbacks.claimQuest); 
            updateChestUI(); 
        }
        else addMessage(res.message, 'error');
    } else {
        const res = handleClaimQuest(qid);
        if (res.success) { addMessage(res.message, res.rewardType === 'legendary' ? 'legendary' : 'reward'); updateStatsDisplay(); updateQuestDisplay(questConfig, callbacks.claimQuest); }
        else if (res.message !== "任务未完成") addMessage(res.message, 'error');
    }
}

export function buyProficiencyHandler() {
    const res = handleProficiencyPurchase();
    if (res.success) { addMessage(res.message, 'reward'); updateStatsDisplay(); updateExchangeModal(); }
    else addMessage(res.message, 'error');
}
export function ascensionHandler() {
    if (prompt("飞升将重置游戏进度（保留收藏品和信物），并提升信物等级以减少技能冷却时间。\n\n输入“飞升”确认操作：") !== "飞升") { addMessage("飞升取消。", "system"); return; }
    const res = handleAscension();
    if (res.success) { alert(res.message + "\n游戏即将重载！"); location.reload(); }
    else addMessage(res.message, 'error');
}