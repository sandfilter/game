/**
 * ==================================================================
 * ui/reminderManager.js (新文件)
 * 职责: 管理右下角的待办提醒 (Toast 通知)。
 * (已修改：点击后立即消失，无淡出动画)
 * ==================================================================
 */

let reminderContainer = null;
let reminderCounter = 0;

/**
 * 初始化提醒管理器
 * @param {HTMLElement} containerElement - 'reminderContainer' DOM 元素
 */
export function initReminderManager(containerElement) {
    if (!containerElement) {
        console.error("ReminderManager: 容器元素未找到!");
        return;
    }
    reminderContainer = containerElement;
    console.log("ReminderManager 已初始化。");
}

/**
 * 添加一个新的提醒
 * @param {string} message - 要显示的消息 (例如 "获得了 [最后的笑容]")
 * @param {string} icon - (可选) 显示的图标 (例如 '⭐', '✨')
 * @param {string} rarity - (可选) 稀有度 (例如 'epic', 'legendary')
 */
export function addReminder(message, icon = '⭐', rarity = 'common') {
    if (!reminderContainer) return;

    reminderCounter++;
    const reminderId = `reminder-${reminderCounter}`;
    
    // 1. 创建提醒元素
    const reminder = document.createElement('div');
    reminder.id = reminderId;
    reminder.className = `reminder-item ${rarity}`; // 使用稀有度
    
    const iconSpan = icon ? `<span class="reminder-icon">${icon}</span>` : '';
    
    reminder.innerHTML = `
        ${iconSpan}
        <span class="reminder-message">${message}</span>
        <span class="reminder-close" data-target="${reminderId}">✓</span>
    `;

    // 2. 添加到容器
    reminderContainer.appendChild(reminder);

    // 3. 绑定关闭事件
    const closeButton = reminder.querySelector('.reminder-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            dismissReminder(reminderId);
        });
    }
}

/**
 * 使一个提醒消失
 * (已修改：立即移除，无等待)
 * @param {string} reminderId - 要移除的提醒的 ID
 */
function dismissReminder(reminderId) {
    const reminder = document.getElementById(reminderId);
    if (!reminder) return;

    // 直接从 DOM 中移除
    if (reminder.parentNode) {
        reminder.parentNode.removeChild(reminder);
    }
}

// --- (用于测试) ---
// 将 addReminder 暴露到全局，以便在控制台测试
window.testReminder = addReminder;