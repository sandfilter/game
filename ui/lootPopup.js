/**
 * ==================================================================
 * ui/lootPopup.js (新文件)
 * 职责: 管理屏幕中央的史诗级掉落弹窗动画。
 * ==================================================================
 */

import { elements } from './domElements.js';

let popupTimeout = null;

/**
 * 显示掉落弹窗
 * @param {string} name - 物品名称
 * @param {string} icon - 物品图标 (emoji)
 * @param {string} rarity - 稀有度 ('epic' 或 'legendary')
 */
export function showLootPopup(name, icon, rarity) {
    if (!elements.lootPopup) return;

    // 如果有正在显示的弹窗，先清除它的定时器
    if (popupTimeout) {
        clearTimeout(popupTimeout);
        popupTimeout = null;
        elements.lootPopup.classList.remove('active');
        // 稍微等待一点时间让它重置，如果需要连续显示的话（这里简单处理，直接覆盖）
    }

    // 构建弹窗内容
    // 包含一个背景光效层和一个内容层
    elements.lootPopup.innerHTML = `
        <div class="loot-popup-content">
            <div class="loot-flash-bg ${rarity}"></div>
            <span class="loot-icon-large">${icon}</span>
            <div class="loot-name-large ${rarity}">${name}</div>
        </div>
    `;

    // 强制浏览器重绘以确保动画能重新触发 (如果在短时间内连续调用)
    void elements.lootPopup.offsetWidth;

    // 激活弹窗
    elements.lootPopup.classList.add('active');

    // 3.5秒后自动关闭 (配合CSS动画时间)
    popupTimeout = setTimeout(() => {
        if (elements.lootPopup) {
            elements.lootPopup.classList.remove('active');
        }
        popupTimeout = null;
    }, 3500);
}