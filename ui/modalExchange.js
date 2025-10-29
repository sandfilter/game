/**
 * ==================================================================
 * ui/modalExchange.js
 * (已修改：移除重复的 buildExchangeModalHTML 函数定义)
 * ==================================================================
 */

import { elements } from './domElements.js'; //
import { gameState } from '../core/gameState.js'; //
import { GAME_DATA } from '../data/game-rules.js'; //

let isExchangeCloseBtnListenerAttached = false; //
let isExchangeBodyListenerAttached = false; //

/**
 * 构建兑换中心弹窗的HTML
 */
function buildExchangeModalHTML() { //
    let html = '<h3>💰 我的货币</h3>'; //
    html += '<div class="exchange-currency-grid">'; //
    html += `<div class="currency-item"><span>🛡️ 英雄徽章:</span> <span>${gameState.badges?.heroism ?? 0}</span></div>`; //
    html += `<div class="currency-item"><span>🔥 勇气徽章:</span> <span>${gameState.badges?.valor ?? 0}</span></div>`; //
    html += `<div class="currency-item"><span>🏆 征服徽章:</span> <span>${gameState.badges?.conquest ?? 0}</span></div>`; //
    html += `<div class="currency-item"><span>🏅 凯旋徽章:</span> <span>${gameState.badges?.triumph ?? 0}</span></div>`; //
    html += `<div class="currency-item"><span>❄️ 寒冰徽章:</span> <span>${gameState.badges?.frost ?? 0}</span></div>`; //
    html += `<div class="currency-item"><span>🔸 埃提耶什的碎片:</span> <span>${Number(gameState.legendaryShards?.atiyehsuide) || 0}</span></div>`; //
    html += `<div class="currency-item"><span>🔸 瓦兰奈尔的碎片:</span> <span>${Number(gameState.legendaryShards?.walanaiersuide) || 0}</span></div>`; //
    html += `<div class="currency-item"><span>🔸 炉石传说的碎片:</span> <span>${Number(gameState.legendaryShards?.lushichuanshuodesuide) || 0}</span></div>`; //
    html += `<div class="currency-item"><span>🔸 影之碎片:</span> <span>${Number(gameState.legendaryShards?.yingzhisuide) || 0}</span></div>`; //
    html += `<div class="currency-item"><span>🔸 霜之碎片:</span> <span>${Number(gameState.legendaryShards?.shuangzhisuide) || 0}</span></div>`; //
    html += '</div>'; //
    html += '<hr class="exchange-divider">'; //
    html += '<h3>🔄 徽章兑换</h3>'; //
    const rules = GAME_DATA.游戏数据.徽章兑换规则; //
    const badgeKeyMap = { "英雄徽章": "heroism", "勇气徽章": "valor", "征服徽章": "conquest", "凯旋徽章": "triumph", "寒冰徽章": "frost" }; //
    for (const badgeName in rules) { //
        const rule = rules[badgeName]; //
        const currentBadgeKey = badgeKeyMap[badgeName]; //
        // Ensure gameState.badges and the specific key exist before accessing
        const currentBadgeCount = (gameState.badges && gameState.badges[currentBadgeKey]) ? gameState.badges[currentBadgeKey] : 0; //
        const hasBadges = currentBadgeCount >= rule.兑换比例; //
        const disabledState = hasBadges ? '' : 'disabled'; //
        html += `
            <div class="exchange-item">
                <div class="exchange-info">
                    <span class="badge-name">${badgeName}</span>
                    <div>${rule.描述}</div>
                </div>
                <button class="wow-button exchange-btn ${disabledState}" data-badge-key="${currentBadgeKey}" ${disabledState}>
                    兑换
                </button>
            </div>
        `; //
    }
    return html; //
}

// --- REMOVED DUPLICATE DEFINITION ---
/*
function buildExchangeModalHTML() { ... }
*/


/**
 * 打开兑换弹窗
 */
export function openExchangeModal(exchangeCallback) { //
    // Find internal elements only when opening
    if (!elements.exchangeModalCloseBtn) { //
        elements.exchangeModalCloseBtn = document.getElementById('exchangeModalCloseBtn'); //
        console.log("Found exchangeModalCloseBtn on open:", elements.exchangeModalCloseBtn); //
    }
    if (!elements.exchangeModalBody) { //
        elements.exchangeModalBody = document.getElementById('exchangeModalBody'); //
        console.log("Found exchangeModalBody on open:", elements.exchangeModalBody); //
    }

    // Bind close listener only ONCE
    if (elements.exchangeModalCloseBtn && !isExchangeCloseBtnListenerAttached) { //
        elements.exchangeModalCloseBtn.addEventListener('click', () => { //
            elements.exchangeModal.style.display = 'none'; //
        });
        isExchangeCloseBtnListenerAttached = true; //
        console.log("Attached listener to exchangeModalCloseBtn"); //
    } else if (!elements.exchangeModalCloseBtn) { //
         console.error("Could not find exchangeModalCloseBtn to attach listener."); //
    }

    // Attach delegated listener to body ONCE
    if (elements.exchangeModalBody && !isExchangeBodyListenerAttached) { //
        elements.exchangeModalBody.addEventListener('click', (event) => { //
            // Check if an exchange button was clicked
            if (event.target && event.target.classList.contains('exchange-btn')) { //
                const button = event.target; //
                if (!button.hasAttribute('disabled')) { //
                    const badgeKey = button.dataset.badgeKey; //
                    console.log(`Exchange button clicked for key: ${badgeKey}`); //
                    exchangeCallback(badgeKey); // Call main callback
                } else { //
                     console.log(`Exchange button clicked for key: ${button.dataset.badgeKey}, but it's disabled.`); //
                }
            }
        });
        isExchangeBodyListenerAttached = true; //
        console.log("Delegated event listener attached to exchangeModalBody."); //
    } else if (!elements.exchangeModalBody) { //
        console.error("Cannot attach exchange body listener: elements.exchangeModalBody is null."); //
    }


    updateExchangeModal(exchangeCallback); // Update content AFTER attaching listener
    elements.exchangeModal.style.display = 'flex'; //
}

/**
 * 刷新兑换弹窗的内容
 */
export function updateExchangeModal(exchangeCallback) { //
    // Ensure body is found before updating
    if (!elements.exchangeModalBody) { //
        elements.exchangeModalBody = document.getElementById('exchangeModalBody'); //
         if (!elements.exchangeModalBody) { //
             console.error("Cannot update exchange modal: exchangeModalBody not found."); //
             return; //
         }
    }

    try { //
        // Just update the innerHTML, the delegated listener on the body will handle clicks
        elements.exchangeModalBody.innerHTML = buildExchangeModalHTML(); //

    } catch (error) { //
        console.error("更新兑换弹窗时出错:", error); //
    }
}