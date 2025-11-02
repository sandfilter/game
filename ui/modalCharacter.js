/**
 * ==================================================================
 * ui/modalCharacter.js (新文件)
 * 职责: 管理角色信息弹窗的打开、关闭和UI更新。
 * (已修正：移除延迟查找逻辑)
 * ==================================================================
 */

import { elements } from './domElements.js';
import { gameState } from '../core/gameState.js';
import { ITEM_DATA } from '../data/item-data.js';
import { handleTooltipHide } from './tooltipManager.js'; // 导入 tooltip 隐藏功能

let isCharacterCloseBtnListenerAttached = false;

/**
 * 打开角色面板
 * (已修正：移除延迟查找)
 */
export function openCharacterModal() {
    // 1. (已移除) 延迟查找关闭按钮 (现在由 initElements 负责)
    
    // 2. 仅绑定一次关闭事件
    if (elements.characterModalCloseBtn && !isCharacterCloseBtnListenerAttached) {
        elements.characterModalCloseBtn.addEventListener('click', () => {
            if (elements.characterModal) {
                elements.characterModal.style.display = 'none';
            }
            handleTooltipHide(); // 关闭面板时也隐藏 tooltip
        });
        isCharacterCloseBtnListenerAttached = true;
        console.log("Attached listener to characterModalCloseBtn");
    } else if (!elements.characterModalCloseBtn) {
        // (这个错误现在只会在 initElements 失败时出现)
        console.error("Could not find characterModalCloseBtn to attach listener.");
    }

    // 3. 更新内容并显示
    updateCharacterPanelUI();
    if (elements.characterModal) {
        elements.characterModal.style.display = 'flex';
    } else {
        console.error("Character modal element not found!");
    }
}

/**
 * (已修改：更新所有新属性)
 * (从 main.js 移动而来)
 */
function updateCharacterPanelUI() {
    // 1. 更新属性
    if (elements.charGearScoreDisplay) {
        elements.charGearScoreDisplay.textContent = (gameState.gearScore ?? 0).toFixed(1);
    }
    if (elements.charProficiencyDisplay) {
        elements.charProficiencyDisplay.textContent = gameState.proficiency ?? 0;
    }
    if (elements.charGoldDisplay) {
        elements.charGoldDisplay.textContent = gameState.gold ?? 0;
    }
    
    // 更新徽章
    if (elements.charAbyssCrystalDisplay) elements.charAbyssCrystalDisplay.textContent = gameState.badges?.abyssCrystal ?? 0;
    if (elements.charHeroismDisplay) elements.charHeroismDisplay.textContent = gameState.badges?.heroism ?? 0;
    if (elements.charValorDisplay) elements.charValorDisplay.textContent = gameState.badges?.valor ?? 0;
    if (elements.charConquestDisplay) elements.charConquestDisplay.textContent = gameState.badges?.conquest ?? 0;
    if (elements.charTriumphDisplay) elements.charTriumphDisplay.textContent = gameState.badges?.triumph ?? 0;
    if (elements.charFrostDisplay) elements.charFrostDisplay.textContent = gameState.badges?.frost ?? 0;

    // 更新碎片
    if (elements.charAtiyehsuideDisplay) elements.charAtiyehsuideDisplay.textContent = gameState.legendaryShards?.atiyehsuide ?? 0;
    if (elements.charWalanaiersuideDisplay) elements.charWalanaiersuideDisplay.textContent = gameState.legendaryShards?.walanaiersuide ?? 0;
    if (elements.charLushichuanshuodesuideDisplay) elements.charLushichuanshuodesuideDisplay.textContent = gameState.legendaryShards?.lushichuanshuodesuide ?? 0;
    if (elements.charYingzhisuideDisplay) elements.charYingzhisuideDisplay.textContent = gameState.legendaryShards?.yingzhisuide ?? 0;
    if (elements.charShuangzhisuideDisplay) elements.charShuangzhisuideDisplay.textContent = gameState.legendaryShards?.shuangzhisuide ?? 0;


    // (新增) 定义 getDefaultForSlot 的辅助函数
    const getDefaultForSlot = (slot) => {
        const map = {
            "head": "<span>👑</span><br>头部", "neck": "<span>💎</span><br>颈部", "shoulder": "<span>💪</span><br>肩部",
            "back": "<span>🎒</span><br>背部", "chest": "<span>👕</span><br>胸部", "shirt": "<span>👔</span><br>衬衣",
            "tabard": "<span>🚩</span><br>战袍", "wrist": "<span>⌚</span><br>手腕", "hands": "<span>🧤</span><br>手套",
            "waist": "<span>〰️</span><br>腰带", "legs": "<span>👖</span><br>腿部", "feet": "<span>👢</span><br>脚",
            "finger1": "<span>💍</span><br>手指1", "finger2": "<span>💍</span><br>手指2",
            "trinket1": "<span>✨</span><br>饰品1", "trinket2": "<span>✨</span><br>饰品2",
            "mainhand": "<span>⚔️</span><br>主手", "offhand": "<span>🛡️</span><br>副手"
        };
        return map[slot] || `<span>${slot}</span>`;
    };

    // 2. 更新装备格子
    for (const slot in gameState.equipment) {
        if (Object.hasOwnProperty.call(gameState.equipment, slot)) {
            const itemId = gameState.equipment[slot];
            
            const slotElement = document.querySelector(`.equip-slot[data-slot="${slot}"]`);
            if (!slotElement) {
                // (跳过 relic 槽位，因为它在 HTML 中不存在)
                continue;
            }

            slotElement.classList.remove("rare", "epic", "uncommon", "legendary");

            if (itemId && ITEM_DATA[itemId]) {
                const item = ITEM_DATA[itemId];
                if (item) {
                    slotElement.innerHTML = `<span>${item.name}</span><br>(装等 ${item.gearScore})`;
                    if (item.rarity) {
                        slotElement.classList.add(item.rarity);
                    }
                }
            } else {
                slotElement.innerHTML = getDefaultForSlot(slot);
            }
        }
    }
}