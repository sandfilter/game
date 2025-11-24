/**
 * ==================================================================
 * ui/reminderManager.js
 * (已修改：集成 lootPopup，史诗/传说物品自动触发中央弹窗)
 * ==================================================================
 */

import { showLootPopup } from './lootPopup.js'; // (新增) 导入弹窗模块

let reminderContainer = null;
let reminderCounter = 0;

export function initReminderManager(containerElement) {
    if (!containerElement) {
        console.error("ReminderManager: 容器元素未找到!");
        return;
    }
    reminderContainer = containerElement;
    console.log("ReminderManager 已初始化。");
}

export function addReminder(message, icon = '⭐', rarity = 'common') {
    // --- (新增) 自动触发史诗级弹窗 ---
    if (rarity === 'epic' || rarity === 'legendary') {
        // 从消息中提取物品名称 (假设消息格式为 "获得了 [物品名称]")
        const match = message.match(/\[(.*?)\]/);
        const itemName = match ? match[1] : message;
        showLootPopup(itemName, icon, rarity);
    }
    // -------------------------------

    if (!reminderContainer) return;

    reminderCounter++;
    const reminderId = `reminder-${reminderCounter}`;
    
    const reminder = document.createElement('div');
    reminder.id = reminderId;
    reminder.className = `reminder-item ${rarity}`;
    
    const iconSpan = icon ? `<span class="reminder-icon">${icon}</span>` : '';
    
    reminder.innerHTML = `
        ${iconSpan}
        <span class="reminder-message">${message}</span>
        <span class="reminder-close" data-target="${reminderId}">✓</span>
    `;

    reminderContainer.appendChild(reminder);

    const closeButton = reminder.querySelector('.reminder-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            dismissReminder(reminderId);
        });
    }
}

function dismissReminder(reminderId) {
    const reminder = document.getElementById(reminderId);
    if (!reminder) return;

    if (reminder.parentNode) {
        reminder.parentNode.removeChild(reminder);
    }
}

window.testReminder = addReminder;