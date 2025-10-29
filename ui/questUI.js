/**
 * ==================================================================
 * ui/questUI.js
 * (已修改：使用事件委托处理任务领取按钮点击)
 * ==================================================================
 */

import { elements } from './domElements.js'; //
import { gameState } from '../core/gameState.js'; //

// Flag to ensure listener is attached only once
let isQuestListListenerAttached = false;

/**
 * 构建任务列表的HTML (保持不变)
 */
function buildQuestListHTML(questConfig) { //
    let html = ''; //
    Object.values(questConfig).forEach(quest => { //
        const progress = quest.getProgress(gameState); //
        const isComplete = progress >= quest.target; //
        if (quest.reward.类型 === '传说物品' && gameState.legendaryItemsObtained[quest.reward.物品名称]) { //
            return; //
        }
        html += `
            <div class="quest-item">
                <div>${quest.name}</div>
                <div class="quest-progress">
                    <span>${progress} / ${quest.target}</span>
                    <button class="quest-claim-btn" data-quest-id="${quest.id}" ${isComplete ? '' : 'disabled'}>领取</button>
                </div>
            </div>`; //
    });
    return html; //
}

/**
 * 刷新任务列表的显示
 * (已修改：使用事件委托)
 */
export function updateQuestDisplay(questConfig, claimRewardCallback) { //
    try { //
        // Update the HTML content
        elements.questList.innerHTML = buildQuestListHTML(questConfig); //

        // Attach the delegated event listener only ONCE
        if (elements.questList && !isQuestListListenerAttached) {
            elements.questList.addEventListener('click', (event) => {
                // Check if the clicked element is a claim button
                if (event.target && event.target.classList.contains('quest-claim-btn')) {
                    const button = event.target;
                    // Check if the button is disabled
                    if (!button.hasAttribute('disabled')) {
                        const questId = button.dataset.questId;
                        console.log(`Quest claim button clicked for ID: ${questId}`); // <<< Log click
                        claimRewardCallback(questId); // Call the main callback
                    } else {
                        console.log(`Quest claim button clicked for ID: ${questId}, but it's disabled.`); // <<< Log disabled click
                    }
                }
            });
            isQuestListListenerAttached = true;
            console.log("Delegated event listener attached to questList.");
        } else if (!elements.questList) {
             console.error("Cannot attach quest list listener: elements.questList is null.");
        }

    } catch (error) { //
         console.error("更新任务显示时出错:", error); //
    }
}