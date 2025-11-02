/**
 * ==================================================================
 * ui/questUI.js
 * (已修改：移除了重复的 updateQuestDisplay 函数定义)
 * (已修改：添加 title 属性以显示任务描述)
 * ==================================================================
 */

import { elements } from './domElements.js'; //
import { gameState } from '../core/gameState.js'; //

let isQuestListListenerAttached = false; //

/**
 * 构建任务列表的HTML
 * (已修改：添加里程碑检查 和 title 属性)
 */
function buildQuestListHTML(questConfig) { //
    let html = ''; //
    Object.values(questConfig).forEach(quest => { //
        const progress = quest.getProgress(gameState); //
        const isComplete = progress >= quest.target; //

        // 检查是否为已领取的传说物品
        if (quest.reward.类型 === '传说物品' && gameState.legendaryItemsObtained[quest.reward.物品名称]) { //
            return; //
        }

        // --- 新增：检查是否为已领取的里程碑任务 ---
        if (quest.milestoneId && gameState.milestoneQuestsClaimed[quest.milestoneId]) { //
            return; // 如果已领取，则不显示
        }
        
        // (修改) 添加 title 属性 (用于悬停显示描述)
        html += `
            <div class="quest-item" title="${quest.description || ''}">
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
        if (elements.questList && !isQuestListListenerAttached) { //
            elements.questList.addEventListener('click', (event) => { //
                // Check if the clicked element is a claim button
                if (event.target && event.target.classList.contains('quest-claim-btn')) { //
                    const button = event.target; //
                    // Check if the button is disabled
                    if (!button.hasAttribute('disabled')) { //
                        const questId = button.dataset.questId; //
                        console.log(`Quest claim button clicked for ID: ${questId}`); //
                        claimRewardCallback(questId); // Call the main callback //
                    } else { //
                        console.log(`Quest claim button clicked for ID: ${button.dataset.questId}, but it's disabled.`); //
                    }
                }
            });
            isQuestListListenerAttached = true; //
            console.log("Delegated event listener attached to questList."); //
        } else if (!elements.questList) { //
             console.error("Cannot attach quest list listener: elements.questList is null."); //
        }

    } catch (error) { //
         console.error("更新任务显示时出错:", error); //
    }
}