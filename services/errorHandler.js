/**
 * ==================================================================
 * services/errorHandler.js (新文件)
 * 职责: 设置全局 window.onerror 错误处理器，以安全地处理意外崩溃。
 * ==================================================================
 */

import { addMessage } from '../ui/messageLog.js';
import { elements } from '../ui/domElements.js';
import { updateDungeonProgressDisplay } from '../ui/mainDisplay.js';
import { battleGame } from '../core/battleCallbacks.js';
import { gameState } from '../core/gameState.js';
import { saveGame } from '../core/saveManager.js';

/**
 * 注册全局错误处理器
 * (从 main.js 移来)
 */
export function registerGlobalErrorHandler() {
    window.onerror = function(message, source, lineno, colno, error) {
        console.error("未捕获的全局错误:", message, "在", source, lineno, colno, error);
        
        // 1. 尝试向UI发送消息
        try {
            addMessage(`发生意外错误: ${message}。请检查控制台。`, "error");
        } catch (e) { 
            console.error("Error handler failed to add message:", e); 
        }

        // 2. 尝试停止战斗 (battleGame 可能未初始化)
        if (battleGame) {
            try {
                battleGame.stopCurrentBattle(true);
                addMessage("战斗已因错误停止。", "error");
            } catch(e) { 
                console.error("Error handler failed to stop battle:", e); 
            }
        }
        
        // 3. 尝试重置游戏状态并保存 (gameState 和 elements 可能未初始化)
        if (gameState) {
            gameState.currentDungeon = null;
            try {
                // 检查 elements 是否已初始化
                if (elements.dungeonProgressTitle) {
                    updateDungeonProgressDisplay();
                }
                saveGame();
            } catch (e) {
                console.error("Error handler failed to update UI or save:", e);
            }
        }
        
        return true; // 阻止浏览器默认的错误处理
    };
}