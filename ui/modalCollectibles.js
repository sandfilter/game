/**
 * ==================================================================
 * ui/modalCollectibles.js (新文件)
 * 职责: 管理收藏品弹窗的打开、关闭和UI更新。
 * (已修正：移除延迟查找逻辑)
 * ==================================================================
 */

import { elements } from './domElements.js';
import { gameState } from '../core/gameState.js';
import { ITEM_DATA } from '../data/item-data.js';

let isCollectiblesCloseBtnListenerAttached = false;

/**
 * 构建收藏品弹窗的HTML
 */
function buildCollectiblesModalHTML() {
    let html = '';

    if (!gameState.collectibles || gameState.collectibles.length === 0) {
        html += '<p>尚未获得任何收藏品。</p>';
        return html;
    }

    // (样式将在下一步的 game.css 中添加)
    html += '<div class="collectibles-list">';
    
    gameState.collectibles.forEach(itemId => {
        const item = ITEM_DATA[itemId];
        if (item) {
            const rarityClass = `rarity-${item.rarity || 'common'}`;
            html += `
                <div class="collectible-item ${rarityClass}">
                    <span class="collectible-name">${item.name}</span>
                    <span class="collectible-type">${item.slot === 'mainhand' ? '传说武器' : '坐骑'}</span>
                </div>
            `;
        }
    });

    html += '</div>';
    return html;
}

/**
 * 刷新收藏品弹窗的内容
 * (已修正：移除延迟查找)
 */
function updateCollectiblesModal() {
    // (已移除) 延迟查找 body
     if (!elements.collectiblesModalBody) {
         console.error("Cannot update collectibles modal: collectiblesModalBody not found (initElements failed?).");
         return; 
     }

    try {
        elements.collectiblesModalBody.innerHTML = buildCollectiblesModalHTML();
    } catch (error) {
        console.error("更新收藏品弹窗时出错:", error);
    }
}

/**
 * 打开收藏品弹窗
 * (已修正：移除延迟查找)
 */
export function openCollectiblesModal() {
    // 1. (已移除) 延迟查找关闭按钮 (现在由 initElements 负责)
    
    // 2. 仅绑定一次关闭事件
    if (elements.collectiblesModalCloseBtn && !isCollectiblesCloseBtnListenerAttached) {
        elements.collectiblesModalCloseBtn.addEventListener('click', () => {
            if (elements.collectiblesModal) {
                elements.collectiblesModal.style.display = 'none';
            }
        });
        isCollectiblesCloseBtnListenerAttached = true;
        console.log("Attached listener to collectiblesModalCloseBtn");
    } else if (!elements.collectiblesModalCloseBtn) {
        // (这个错误现在只会在 initElements 失败时出现)
        console.error("Could not find collectiblesModalCloseBtn to attach listener.");
    }

    // 3. 更新内容并显示
    updateCollectiblesModal();
    if (elements.collectiblesModal) {
        elements.collectiblesModal.style.display = 'flex';
    } else {
        console.error("Collectibles modal element not found!");
    }
}