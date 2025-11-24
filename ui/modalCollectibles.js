/**
 * ==================================================================
 * ui/modalCollectibles.js
 * (已修改：区分显示 '坐骑' 和 '玩具')
 * ==================================================================
 */

import { elements } from './domElements.js';
import { gameState } from '../core/gameState.js';
import { ITEM_DATA } from '../data/item-data.js';
import { 
    handleCollectibleTooltipShow, 
    handleTooltipHide, 
    handleTooltipMove 
} from './tooltipManager.js'; 

let isCollectiblesCloseBtnListenerAttached = false;
let isCollectiblesListListenerAttached = false; 

/**
 * 构建收藏品弹窗的HTML
 */
function buildCollectiblesModalHTML() {
    let html = '';

    if (!gameState.collectibles || gameState.collectibles.length === 0) {
        html += '<p>尚未获得任何收藏品。</p>';
        return html;
    }

    html += '<div class="collectibles-list" id="collectiblesList">'; 
    
    gameState.collectibles.forEach(itemId => {
        const item = ITEM_DATA[itemId];
        if (item) {
            const rarityClass = `rarity-${item.rarity || 'common'}`;
            let itemName = item.name;
            let itemType = '';

            if (item.type === 'heirloom' && item.heirloomId) {
                const level = gameState.heirloomLevels[item.heirloomId] || 0;
                if (level > 0) {
                    itemName += ` (等级 ${level})`;
                }
                itemType = '信物';
            }
            else if (item.slot === 'mainhand') {
                itemType = '传说武器';
            }
            else if (item.slot === 'collectible') {
                // (修改) 区分坐骑和玩具
                if (itemId.startsWith('mount_')) {
                    itemType = '坐骑';
                } else {
                    itemType = '玩具';
                }
            }

            // 获取图标
            const iconSpan = item.icon ? `<span style="margin-right: 8px; font-size: 1.4em;">${item.icon}</span>` : '';

            html += `
                <div class="collectible-item ${rarityClass}" data-collectible-id="${itemId}">
                    <div style="display: flex; align-items: center;">
                        ${iconSpan}
                        <span class="collectible-name">${itemName}</span>
                    </div>
                    <span class="collectible-type">${itemType}</span>
                </div>
            `;
        }
    });

    html += '</div>';
    return html;
}

/**
 * 刷新收藏品弹窗的内容
 */
function updateCollectiblesModal() {
     if (!elements.collectiblesModalBody) {
         console.error("Cannot update collectibles modal: collectiblesModalBody not found.");
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
 */
export function openCollectiblesModal() {
    if (elements.collectiblesModalCloseBtn && !isCollectiblesCloseBtnListenerAttached) {
        elements.collectiblesModalCloseBtn.addEventListener('click', () => {
            if (elements.collectiblesModal) {
                elements.collectiblesModal.style.display = 'none';
            }
            handleTooltipHide(); 
        });
        isCollectiblesCloseBtnListenerAttached = true;
    }

    if (elements.collectiblesModalBody && !isCollectiblesListListenerAttached) {
        elements.collectiblesModalBody.addEventListener('mouseover', handleCollectibleTooltipShow);
        elements.collectiblesModalBody.addEventListener('mouseout', handleTooltipHide);
        elements.collectiblesModalBody.addEventListener('mousemove', handleTooltipMove);
        isCollectiblesListListenerAttached = true;
    }

    updateCollectiblesModal();
    if (elements.collectiblesModal) {
        elements.collectiblesModal.style.display = 'flex';
    } else {
        console.error("Collectibles modal element not found!");
    }
}