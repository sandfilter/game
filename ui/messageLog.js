/**
 * ==================================================================
 * ui/messageLog.js
 * (拆分自 game-bundle.js)
 *
 * 职责:
 * 1. 包含 addMessage 函数，用于向消息日志添加消息。
 * ==================================================================
 */

import { elements } from './domElements.js';

/**
 * 向消息日志中添加一条新消息
 *
 */
export function addMessage(message, type) {
    const messages = elements.messageContainer.querySelectorAll('.message'); //
    if (messages.length > 200) { //
        messages[0].remove(); //
    }

    const messageElement = document.createElement('div'); //
    messageElement.className = `message ${type}`; //
    const prefixes = { system: '📢 ', combat: '⚔️ ', error: '❌ ', reward: '⭐ ', legendary: '✨ ' }; //
    messageElement.textContent = (prefixes[type] || '') + message; //
    
    elements.messageContainer.appendChild(messageElement); //
    
    // 自动滚动到底部
    //
    if (elements.messageContainer.scrollHeight - elements.messageContainer.scrollTop <= elements.messageContainer.clientHeight + 50) {
        elements.messageContainer.scrollTop = elements.messageContainer.scrollHeight; //
    }
}