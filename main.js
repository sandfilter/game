/**
 * ==================================================================
 * main.js
 * (已修改：...提取了多个模块...)
 * (已修正：移除了 initGame 中的 setTimeout(0) 包装器以修复初始化时序问题)
 * =GA
 */

// --- 导入 UI 模块 ---
import { elements, initElements } from './ui/domElements.js';
import { addMessage } from './ui/messageLog.js';
import { 
    updateDungeonProgressDisplay, 
    updateStatsDisplay 
} from './ui/mainDisplay.js'; 
import { updateQuestDisplay } from './ui/questUI.js';
import { openProgressModal, closeProgressModal } from './ui/modalProgress.js';
import { openExchangeModal, updateExchangeModal } from './ui/modalExchange.js';
import { openCharacterModal } from './ui/modalCharacter.js'; 
import { 
    handleTooltipShow, 
    handleTooltipHide, 
    handleTooltipMove 
} from './ui/tooltipManager.js';
import { initSettingsModalListeners } from './ui/modalSettings.js';
import { openCollectiblesModal } from './ui/modalCollectibles.js';

// --- 导入核心逻辑模块 ---
import { gameState } from './core/gameState.js';
import {
    loadGame,
    applySavedCompletionStatus,
    saveGame,
} from './core/saveManager.js';
import {
    initializeDungeonLists,
    initializeQuests,
    checkAndApplyLegendaryDropRates,
    questConfig
} from './core/initialization.js';
import {
    createBattleGame,
    battleGame 
} from './core/battleCallbacks.js';
import {
    startNewDungeon,
    startSpecificDungeon
} from './core/gameLoop.js';
import { ITEM_DATA } from './data/item-data.js';
import { 
    claimQuestRewardHandler, 
    exchangeBadgeHandler 
} from './core/eventHandlers.js';
import { callbacks } from './core/callbackRegistry.js';

// --- 导入服务 (Services) ---
import { requestAndManageWakeLock } from './services/wakeLock.js';
import { registerGlobalErrorHandler } from './services/errorHandler.js';


/**
 * 游戏初始化总函数
 * (已修正：移除 setTimeout)
 */
function initGame() {
    let loadMessageResult;
    console.log("initGame started");

    try {
        const { loadMessage, loadedState } = loadGame();
        loadMessageResult = loadMessage;
        console.log("Game state loaded:", loadMessageResult);

        initializeDungeonLists();
        if (loadedState) {
            applySavedCompletionStatus(loadedState);
        }
        initializeQuests();
        checkAndApplyLegendaryDropRates();
        createBattleGame(addMessage, updateStatsDisplay); 
        console.log("Data lists initialized.");

        // --- (修正) 移除了 setTimeout(..., 0) 包装器 ---
        
        console.log("--- Executing sequential UI initialization ---");
        try {
            console.log("Calling initElements...");
            initElements(); // <<< 立即执行
            console.log("initElements finished.");

            if (loadMessageResult) {
                addMessage(loadMessageResult.message, loadMessageResult.type);
            }

            console.log("Calling bindEventListeners...");
            bindEventListeners(); // <<< 立即执行
            console.log("bindEventListeners finished.");

            console.log("Updating initial UI displays...");
            updateStatsDisplay(); 
            updateQuestDisplay(questConfig, callbacks.claimQuest);
            updateDungeonProgressDisplay();
            console.log("Initial UI displays updated.");

            requestAndManageWakeLock();

            if (gameState.currentDungeon) {
                 console.log("Resuming dungeon...");
                addMessage(`恢复进行中的副本 ${gameState.currentDungeon.name}...`, 'system');
                if (gameState.currentDungeon.name) {
                     const resumeInfo = {
                         name: gameState.currentDungeon.name,
                         size: gameState.currentDungeon.size,
                         bossesDefeated: gameState.currentDungeon.bossesDefeated
                     };
                    // (保留 setTimeout 以确保战斗在UI之后开始)
                    setTimeout(() => startSpecificDungeon(resumeInfo, true), 100);
                 } else {
                     console.error("存档中的 currentDungeon 无效:", gameState.currentDungeon);
                     gameState.currentDungeon = null;
                     saveGame();
                 }
            }
            
            registerGlobalErrorHandler();
            console.log("Global error handler registered.");

            console.log("--- Sequential UI initialization finished ---");

        } catch (deferredError) {
             console.error("Error during sequential initialization/binding/UI update:", deferredError);
             try { addMessage("UI setup failed. Please check console.", "error"); } catch(e){}
        }
        // --- 修正结束 ---

    } catch (error) {
         console.error("游戏初始化期间发生严重错误:", error);
         try {
             document.body.innerHTML = `<h1>初始化失败</h1><p>游戏加载时发生严重错误: ${error.message}</p><p>请清除存档或联系管理员。</p>`;
         } catch(e) {}
    }
    console.log("initGame finished");
}

/**
 * 绑定所有事件监听器
 */
function bindEventListeners() {
    console.log("--- bindEventListeners starting ---");
    const el = elements;

    // --- 初始化设置/帮助弹窗的监听器 ---
    initSettingsModalListeners();
    console.log("Settings/Help listeners initialized.");

    // 角色按钮监听
    if(el.characterBtn) {
        el.characterBtn.addEventListener('click', openCharacterModal);
        console.log("characterBtn listener added.");
    } else {
        console.error("characterBtn is null");
    }

    // Tooltip 监听器
    if (el.characterModalBody) {
        el.characterModalBody.addEventListener('mouseover', handleTooltipShow);
        el.characterModalBody.addEventListener('mouseout', handleTooltipHide);
        el.characterModalBody.addEventListener('mousemove', handleTooltipMove);
        console.log("Tooltip listeners added to characterModalBody.");
    } else {
        console.error("characterModalBody is null");
    }

    // --- 地下城与核心功能按钮监听 ---
    if(el.dungeon5Btn) el.dungeon5Btn.addEventListener('click', () => startNewDungeon(5)); else console.error("dungeon5Btn is null");
    if(el.dungeon10Btn) el.dungeon10Btn.addEventListener('click', () => startNewDungeon(10)); else console.error("dungeon10Btn is null");
    if(el.dungeon25Btn) el.dungeon25Btn.addEventListener('click', () => startNewDungeon(25)); else console.error("dungeon25Btn is null");
    if(el.viewProgressBtn) el.viewProgressBtn.addEventListener('click', openProgressModal); else console.error("viewProgressBtn is null");
    if(el.exchangeBtn) el.exchangeBtn.addEventListener('click', () => openExchangeModal(callbacks.handleExchange)); else console.error("exchangeBtn is null");
    
    // --- (新增) 收藏品按钮监听 ---
    if(el.collectiblesBtn) {
        el.collectiblesBtn.addEventListener('click', openCollectiblesModal);
        console.log("collectiblesBtn listener added.");
    } else {
        console.error("collectiblesBtn is null");
    }

    console.log("--- bindEventListeners finished ---");
}

// --- 游戏启动 ---
document.addEventListener('DOMContentLoaded', initGame);
callbacks.claimQuest = claimQuestRewardHandler;
callbacks.handleExchange = exchangeBadgeHandler;