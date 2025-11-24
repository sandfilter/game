/**
 * ==================================================================
 * ui/messageLog.js
 * (v3.6: 增加安全检查，防止在UI初始化前调用导致崩溃)
 * ==================================================================
 */

import { elements } from './domElements.js';

export function addMessage(message, type) {
    // --- (新增) 安全检查 ---
    if (!elements.messageContainer) {
        console.warn("UI尚未就绪，跳过消息显示:", message);
        return;
    }
    // ---------------------

    const messages = elements.messageContainer.querySelectorAll('.message'); 
    if (messages.length > 200) { 
        messages[0].remove(); 
    }

    const messageElement = document.createElement('div'); 
    messageElement.className = `message ${type}`; 
    const prefixes = { system: '📢 ', combat: '⚔️ ', reward: '⭐ ', error: '❌ ', legendary: '✨ ' }; 
    messageElement.textContent = (prefixes[type] || '') + message; 
    
    elements.messageContainer.appendChild(messageElement); 
    
    if (elements.messageContainer.scrollHeight - elements.messageContainer.scrollTop <= elements.messageContainer.clientHeight + 50) {
        elements.messageContainer.scrollTop = elements.messageContainer.scrollHeight; 
    }
}