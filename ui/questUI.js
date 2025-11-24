/**
 * ==================================================================
 * ui/questUI.js
 * (v3.5: 支持显示和领取日常任务)
 * ==================================================================
 */

import { elements } from './domElements.js'; 
import { gameState } from '../core/gameState.js'; 
import { getDailyProgress } from '../core/dailySystem.js'; // (新增)
import { handleClaimDailyQuest } from '../core/gameActions.js'; // (新增)
import { addMessage } from './messageLog.js'; // (新增)
import { updateStatsDisplay } from './mainDisplay.js'; // (新增)

let isListenerAttached = false; 

function buildQuestListHTML(questConfig) { 
    let html = ''; 
    // --- (新增) 日常任务区域 ---
    if (gameState.daily && gameState.daily.quests && gameState.daily.quests.length > 0) {
        html += '<div class="quest-section-header">📅 日常任务 (凌晨4点刷新)</div>';
        gameState.daily.quests.forEach(dq => {
            if (dq.claimed) return; // 已领取不显示
            const progress = getDailyProgress(dq);
            const isComplete = progress >= dq.target;
            html += `
            <div class="quest-item daily-quest" data-quest-tooltip="daily" data-quest-id="${dq.id}">
                <div>${dq.name}</div>
                <div class="quest-progress">
                    <span>${progress} / ${dq.target}</span>
                    <button class="quest-claim-btn daily-claim-btn" data-quest-id="${dq.id}" ${isComplete ? '' : 'disabled'}>领取</button>
                </div>
            </div>`;
        });
    }
    // -------------------------
    html += '<div class="quest-section-header">📜 主线任务</div>';
    Object.values(questConfig).forEach(q => { 
        const p = q.getProgress(gameState), isC = p >= q.target; 
        if ((q.reward.类型==='传说物品'&&gameState.legendaryItemsObtained[q.reward.物品名称]) || (q.milestoneId&&gameState.milestoneQuestsClaimed[q.milestoneId])) return;
        html += `<div class="quest-item" data-quest-tooltip="main" data-quest-id="${q.id}"><div>${q.name}</div><div class="quest-progress"><span>${p} / ${q.target}</span><button class="quest-claim-btn main-claim-btn" data-quest-id="${q.id}" ${isC?'':'disabled'}>领取</button></div></div>`; 
    });
    return html; 
}

export function updateQuestDisplay(questConfig, mainClaimCallback) { 
    try { 
        elements.questList.innerHTML = buildQuestListHTML(questConfig); 
        if (elements.questList && !isListenerAttached) { 
            elements.questList.addEventListener('click', (e) => { 
                const btn = e.target; 
                if (btn && btn.classList.contains('quest-claim-btn') && !btn.hasAttribute('disabled')) { 
                    const qId = btn.dataset.questId;
                    // --- 分辨是日常还是主线 ---
                    if (btn.classList.contains('daily-claim-btn')) {
                        const res = handleClaimDailyQuest(qId);
                        if (res.success) { addMessage(res.message, 'reward'); updateStatsDisplay(); updateQuestDisplay(questConfig, mainClaimCallback); }
                        else { addMessage(res.message, 'error'); }
                    } else {
                        mainClaimCallback(qId); 
                    }
                }
            });
            isListenerAttached = true; 
        } 
    } catch (e) { console.error("Update quest display error:", e); }
}