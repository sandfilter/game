/**
 * ==================================================================
 * ui/chestUI.js (新文件)
 * 职责: 管理幸运宝箱的UI显示（图标、角标）和交互。
 * ==================================================================
 */

import { elements } from './domElements.js';
import { gameState } from '../core/gameState.js';
import { openLuckyChest } from '../services/chestSystem.js';

let isChestListenerAttached = false;

export function initChestUI() {
    if (elements.chestBtn && !isChestListenerAttached) {
        elements.chestBtn.addEventListener('click', () => {
            openLuckyChest();
        });
        isChestListenerAttached = true;
    }
    updateChestUI();
}

export function updateChestUI() {
    const count = gameState.luckyChests || 0;
    
    if (elements.chestBadge) {
        elements.chestBadge.textContent = count;
        // 如果数量为0，可以隐藏角标或者变灰，这里选择只要是0就显示0
        elements.chestBadge.style.display = count > 0 ? 'flex' : 'none';
    }

    if (elements.chestBtn) {
        // 如果没有宝箱，可以给按钮加个灰度滤镜，或者保持高亮提示去获取
        if (count > 0) {
            elements.chestBtn.classList.add('has-chests');
            elements.chestBtn.classList.remove('disabled');
        } else {
            elements.chestBtn.classList.remove('has-chests');
            // elements.chestBtn.classList.add('disabled'); // 可选：没宝箱时禁用点击
        }
    }
}