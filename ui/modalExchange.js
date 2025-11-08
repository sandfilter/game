/**
 * ==================================================================
 * ui/modalExchange.js
 * (已修改：移除了重复的 openExchangeModal 函数定义)
 * (已修正：移除延迟查找逻辑)
 * (已修改：添加金币购买熟练度的UI和逻辑)
 * (已修改：添加 "兑换50" 按钮及逻辑)
 * ==================================================================
 */

import { elements } from './domElements.js'; //
import { gameState } from '../core/gameState.js'; //
import { GAME_DATA } from '../data/game-rules.js'; //
import { getProficiencyCost } from '../core/gameActions.js'; // <<< (新增)

let isExchangeCloseBtnListenerAttached = false; //
let isExchangeBodyListenerAttached = false; //

/**
 * 构建兑换中心弹窗的HTML
 * (已修改：添加金币购买熟练度)
 * (已修改：添加 "兑换50" 按钮)
 */
function buildExchangeModalHTML() { //
    
    let html = '<h3>💰 我的货币</h3>'; //
    html += '<div class="exchange-currency-grid">'; //
    
    html += `<div class="currency-item"><span>🛡️ 英雄徽章:</span> <span>${gameState.badges?.heroism ?? 0}</span></div>`; //
    html += `<div class="currency-item"><span>🔥 勇气徽章:</span> <span>${gameState.badges?.valor ?? 0}</span></div>`; //
    html += `<div class="currency-item"><span>🏆 征服徽章:</span> <span>${gameState.badges?.conquest ?? 0}</span></div>`; //
    html += `<div class="currency-item"><span>🏅 凯旋徽章:</span> <span>${gameState.badges?.triumph ?? 0}</span></div>`; //
    html += `<div class="currency-item"><span>❄️ 寒冰徽章:</span> <span>${gameState.badges?.frost ?? 0}</span></div>`; //
    html += `<div class="currency-item"><span>💎 深渊水晶:</span> <span>${gameState.badges?.abyssCrystal ?? 0}</span></div>`; //

    html += `<div class="currency-item"><span>🔸 埃提耶什的碎片:</span> <span>${Number(gameState.legendaryShards?.atiyehsuide) || 0}</span></div>`; //
    html += `<div class="currency-item"><span>🔸 瓦兰奈尔的碎片:</span> <span>${Number(gameState.legendaryShards?.walanaiersuide) || 0}</span></div>`; //
    html += `<div class="currency-item"><span>🔸 炉石传说的碎片:</span> <span>${Number(gameState.legendaryShards?.lushichuanshuodesuide) || 0}</span></div>`; //
    html += `<div class="currency-item"><span>🔸 影之碎片:</span> <span>${Number(gameState.legendaryShards?.yingzhisuide) || 0}</span></div>`; //
    html += `<div class="currency-item"><span>🔸 霜之碎片:</span> <span>${Number(gameState.legendaryShards?.shuangzhisuide) || 0}</span></div>`; //
    
    html += '</div>'; //
    
    html += '<hr class="exchange-divider">'; //
    
    html += '<h3>🔄 货币兑换 (徽章 → 金币)</h3>'; //
    
    const rules = GAME_DATA.游戏数据.徽章兑换规则; //
    const badgeKeyMap = { "英雄徽章": "heroism", "勇气徽章": "valor", "征服徽章": "conquest", "凯旋徽章": "triumph", "寒冰徽章": "frost", "深渊水晶": "abyssCrystal" }; //

    for (const badgeName in rules) { //
        const rule = rules[badgeName]; //
        const currentBadgeKey = badgeKeyMap[badgeName]; //
        if (!currentBadgeKey) continue; // 安全检查

        const currentBadgeCount = (gameState.badges && gameState.badges[currentBadgeKey]) ? gameState.badges[currentBadgeKey] : 0; //
        
        // --- (修改) 检查 "兑换1" ---
        const cost1 = rule.兑换比例;
        const disabledState1 = (currentBadgeCount >= cost1) ? '' : 'disabled'; //
        const isCrystal = (currentBadgeKey === 'abyssCrystal');

        html += `
            <div class="exchange-item">
                <div class="exchange-info">
                    <span class="badge-name">${badgeName}</span>
                    <div>${rule.描述}</div>
                </div>
                
                <div class="exchange-button-group">
                    <button class="wow-button exchange-btn ${disabledState1}" data-badge-key="${currentBadgeKey}" data-amount="1" ${disabledState1}>
                        兑换
                    </button>
        `;
        
        // --- (修改) 如果是深渊水晶，添加 "兑换50" 按钮 ---
        if (isCrystal) {
            const cost50 = rule.兑换比例 * 50;
            const disabledState50 = (currentBadgeCount >= cost50) ? '' : 'disabled';
            html += `
                    <button class="wow-button exchange-btn ${disabledState50}" data-badge-key="${currentBadgeKey}" data-amount="50" ${disabledState50}>
                        兑换50
                    </button>
            `;
        }
        
        html += `
                </div>
            </div>
        `; //
    }
    
    // --- (新增) 金币消耗UI ---
    html += '<hr class="exchange-divider">'; //
    html += '<h3>⭐ 强化 (金币 → 熟练度)</h3>'; //
    
    const proficiencyCost = getProficiencyCost();
    const hasEnoughGold = gameState.gold >= proficiencyCost;
    const goldDisabledState = hasEnoughGold ? '' : 'disabled';

    html += `
        <div class="exchange-item">
            <div class="exchange-info">
                <span class="badge-name">购买熟练度</span>
                <div>花费 ${proficiencyCost} 金币 购买 1 点熟练度。</div>
            </div>
            <button class="wow-button ${goldDisabledState}" id="buyProficiencyBtn" ${goldDisabledState}>
                购买
            </button>
        </div>
    `;
    // --- 新增结束 ---

    return html; //
}


/**
 * 打开兑换弹窗
 * (已修正：移除延迟查找)
 * (已修改：接受 buyProficiencyCallback 并更新监听器)
 * (已修改：监听器传递 amount)
 */
export function openExchangeModal(exchangeCallback, buyProficiencyCallback) { //
    // (已移除) 延迟查找
    // ...

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
            const button = event.target.closest('button'); // 查找最近的按钮
            if (!button) return; //

            // --- (修改) 检查是哪个按钮 ---

            // 1. 检查徽章兑换按钮
            if (button.classList.contains('exchange-btn')) { //
                if (!button.hasAttribute('disabled')) { //
                    const badgeKey = button.dataset.badgeKey; //
                    const amount = parseInt(button.dataset.amount) || 1; // <<< (修改)
                    console.log(`Exchange button clicked for key: ${badgeKey}, amount: ${amount}`); //
                    if (exchangeCallback) exchangeCallback(badgeKey, amount); // Call main callback <<< (修改)
                } else { //
                     console.log(`Exchange button clicked for key: ${button.dataset.badgeKey}, but it's disabled.`); //
                }
            }
            
            // 2. 检查购买熟练度按钮
            else if (button.id === 'buyProficiencyBtn') { //
                if (!button.hasAttribute('disabled')) { //
                    console.log(`Buy proficiency button clicked.`); //
                    if (buyProficiencyCallback) buyProficiencyCallback(); // Call new callback
                } else {
                     console.log(`Buy proficiency button clicked, but it's disabled.`); //
                }
            }
            // --- 修改结束 ---
        });
        isExchangeBodyListenerAttached = true; //
        console.log("Delegated event listener attached to exchangeModalBody."); //
    } else if (!elements.exchangeModalBody) { //
        console.error("Cannot attach exchange body listener: elements.exchangeModalBody is null."); //
    }


    updateExchangeModal(); // Update content AFTER attaching listener
    elements.exchangeModal.style.display = 'flex'; //
}

/**
 * 刷新兑换弹窗的内容
 * (已修正：移除延迟查找)
 * (已修改：移除不再需要的回调参数)
 */
export function updateExchangeModal() { //
    // (已移除) 延迟查找
    if (!elements.exchangeModalBody) { //
         console.error("Cannot update exchange modal: exchangeModalBody not found (initElements failed?)."); //
         return; //
     }

    try { //
        // Just update the innerHTML, the delegated listener on the body will handle clicks
        elements.exchangeModalBody.innerHTML = buildExchangeModalHTML(); //

    } catch (error) { //
        console.error("更新兑换弹窗时出错:", error); //
    }
}