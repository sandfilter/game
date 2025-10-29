/**
 * ==================================================================
 * main.js
 * (已修改：移除重复的 initGame 函数定义)
 * ==================================================================
 */

// --- 导入 UI 模块 ---
import { elements, initElements } from './ui/domElements.js';
import { addMessage } from './ui/messageLog.js';
import { updateDungeonProgressDisplay } from './ui/mainDisplay.js'; // updateStatsDisplay is now defined here
import { updateQuestDisplay } from './ui/questUI.js';
import { openProgressModal, closeProgressModal } from './ui/modalProgress.js';
import { openExchangeModal, updateExchangeModal } from './ui/modalExchange.js';

// --- 导入核心逻辑模块 ---
import { gameState } from './core/gameState.js';
import {
    loadGame,
    applySavedCompletionStatus,
    saveGame,
    confirmAndClearSave,
    exportSave,
    importSave
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
import {
    handleClaimQuest,
    handleBadgeExchange
} from './core/gameActions.js';


export const callbacks = {
    claimQuest: null,
    handleExchange: null
};

/**
 * 游戏初始化总函数
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
        // Pass updateStatsDisplay as callback
        createBattleGame(addMessage, updateStatsDisplay);
        console.log("Data lists initialized.");

        setTimeout(() => {
            console.log("--- setTimeout callback executing ---");
            try {
                console.log("Calling initElements...");
                initElements();
                console.log("initElements finished.");

                if (loadMessageResult) {
                    addMessage(loadMessageResult.message, loadMessageResult.type);
                }

                console.log("Calling bindEventListeners...");
                bindEventListeners();
                console.log("bindEventListeners finished.");

                console.log("Updating initial UI displays...");
                updateStatsDisplay(); // Call initial update
                updateQuestDisplay(questConfig, callbacks.claimQuest);
                updateDungeonProgressDisplay();
                console.log("Initial UI displays updated.");

                if (gameState.currentDungeon) {
                     console.log("Resuming dungeon...");
                    addMessage(`恢复进行中的副本 ${gameState.currentDungeon.name}...`, 'system');
                    if (gameState.currentDungeon.name) {
                         const resumeInfo = {
                             name: gameState.currentDungeon.name,
                             size: gameState.currentDungeon.size,
                             bossesDefeated: gameState.currentDungeon.bossesDefeated
                         };
                        setTimeout(() => startSpecificDungeon(resumeInfo, true), 100);
                     } else {
                         console.error("存档中的 currentDungeon 无效:", gameState.currentDungeon);
                         gameState.currentDungeon = null;
                         saveGame();
                     }
                }
                console.log("--- setTimeout callback finished ---");

            } catch (deferredError) {
                 console.error("Error during deferred initialization/binding/UI update:", deferredError);
                 try { addMessage("UI setup failed. Please check console.", "error"); } catch(e){}
            }
        }, 0);

    } catch (error) {
         console.error("游戏初始化期间发生严重错误:", error);
    }
    console.log("initGame finished (timeout scheduled)");
}

/**
 * 绑定所有事件监听器
 */
function bindEventListeners() {
    console.log("--- bindEventListeners starting ---");
    const el = elements;

    console.log("Value of el.settingsBtn before listener:", el.settingsBtn);
    if (!el.settingsBtn) {
        console.error("bindEventListeners called but settingsBtn is still null!");
    } else {
         el.settingsBtn.addEventListener('click', () => {
            console.log("Settings button clicked!");
            el.settingsModal.style.display = 'flex';
        });
        console.log("settingsBtn listener added.");
    }

    // 角色按钮监听
    if(el.characterBtn) {
        el.characterBtn.addEventListener('click', () => {
            if(el.charGearScoreDisplay) {
                el.charGearScoreDisplay.textContent = (gameState.gearScore ?? 187).toFixed(1);
            }
            el.characterModal.style.display = 'flex';
        });
        console.log("characterBtn listener added.");
    } else {
        console.error("characterBtn is null");
    }
    if(el.characterModalCloseBtn) {
        el.characterModalCloseBtn.addEventListener('click', () => {
            el.characterModal.style.display = 'none';
        });
        console.log("characterModalCloseBtn listener added.");
    } else {
        console.error("characterModalCloseBtn is null");
    }

    // --- 其他按钮监听 ---
    if(el.dungeon5Btn) el.dungeon5Btn.addEventListener('click', () => startNewDungeon(5)); else console.error("dungeon5Btn is null");
    if(el.dungeon10Btn) el.dungeon10Btn.addEventListener('click', () => startNewDungeon(10)); else console.error("dungeon10Btn is null");
    if(el.dungeon25Btn) el.dungeon25Btn.addEventListener('click', () => startNewDungeon(25)); else console.error("dungeon25Btn is null");
    if(el.viewProgressBtn) el.viewProgressBtn.addEventListener('click', openProgressModal); else console.error("viewProgressBtn is null");
    if(el.exchangeBtn) el.exchangeBtn.addEventListener('click', () => openExchangeModal(callbacks.handleExchange)); else console.error("exchangeBtn is null");
    if(el.clearSaveBtn) el.clearSaveBtn.addEventListener('click', () => {
        if (confirmAndClearSave()) {} else { addMessage("清除存档操作已取消。", "system"); }
    }); else console.error("clearSaveBtn is null");
    if(el.exportSaveBtn) el.exportSaveBtn.addEventListener('click', exportSave); else console.error("exportSaveBtn is null");
    if(el.importSaveBtn) el.importSaveBtn.addEventListener('click', () => {
        if (!importSave()) { addMessage("导入操作已取消。", "system"); }
    }); else console.error("importSaveBtn is null");
    if(el.settingsModalCloseBtn) el.settingsModalCloseBtn.addEventListener('click', () => {
        el.settingsModal.style.display = 'none';
    }); else console.error("settingsModalCloseBtn is null");
    if(el.gameHelpBtn) el.gameHelpBtn.addEventListener('click', () => {
        el.helpModal.style.display = 'flex';
        el.settingsModal.style.display = 'none';
    }); else console.error("gameHelpBtn is null");
    if(el.helpModalCloseBtn) el.helpModalCloseBtn.addEventListener('click', () => {
        el.helpModal.style.display = 'none';
    }); else console.error("helpModalCloseBtn is null");

    console.log("--- bindEventListeners finished ---");
}


/**
 * 更新顶部状态栏和角色面板装等
 */
function updateStatsDisplay() {
    try {
        const currentGearScore = (gameState.gearScore ?? 187).toFixed(1);

        // 更新顶部状态栏
        elements.displays.gearScore.textContent = currentGearScore;
        elements.displays.gold.textContent = gameState.gold ?? 0;
        elements.displays.proficiency.textContent = gameState.proficiency ?? 0;
        elements.displays.atiyehStaffIcon.style.display = gameState.legendaryItemsObtained?.["埃提耶什·守护者的传说之杖"] ? 'flex' : 'none';
        elements.dungeon10Btn.classList.toggle('disabled', (gameState.gearScore ?? 0) < 200);
        elements.dungeon25Btn.classList.toggle('disabled', (gameState.gearScore ?? 0) < 213);

        // 更新角色面板装等 (如果元素存在)
        if (elements.charGearScoreDisplay) {
            elements.charGearScoreDisplay.textContent = currentGearScore;
        }

        saveGame(); // 触发存档

    } catch (error) {
        console.error("更新状态显示时出错:", error);
        addMessage("更新状态显示时出错。", "error");
    }
}


/**
 * 任务领奖的事件处理函数
 */
function claimQuestReward(questId) {
    console.log(`claimQuestReward called with ID: ${questId}`); //
    const result = handleClaimQuest(questId);
    if (result.success) {
        addMessage(result.message, result.rewardType === 'legendary' ? 'legendary' : 'reward');
        updateStatsDisplay();
        updateQuestDisplay(questConfig, callbacks.claimQuest);
    } else {
        console.log(`handleClaimQuest failed for ${questId}: ${result.message}`); //
        if (result.message !== "任务未完成") {
           addMessage(result.message, 'error');
        }
    }
}

/**
 * 徽章兑换的事件处理函数
 */
function handleExchange(badgeKey) {
    console.log(`handleExchange called with key: ${badgeKey}`); //
    const result = handleBadgeExchange(badgeKey);
    if (result.success) {
        addMessage(result.message, 'reward');
        updateStatsDisplay();
        updateExchangeModal(callbacks.handleExchange);
    } else {
        console.log(`handleBadgeExchange failed for ${badgeKey}: ${result.message}`); //
        addMessage(result.message, 'error');
    }
}


/**
 * 全局错误捕获
 */
window.onerror = function(message, source, lineno, colno, error) {
  console.error("未捕获的全局错误:", message, "在", source, lineno, colno, error);
  try {
      addMessage(`发生意外错误: ${message}。请检查控制台。`, "error");
  } catch (e) { console.error("Error handler failed to add message:", e); }

   if (battleGame) {
       try {
           battleGame.stopCurrentBattle(true);
           addMessage("战斗已因错误停止。", "error");
       } catch(e) { console.error("Error handler failed to stop battle:", e); }
   }
   if (gameState) {
        gameState.currentDungeon = null;
        try {
            if (elements.dungeonProgressTitle) {
                 updateDungeonProgressDisplay();
            }
            saveGame();
        } catch (e) {
            console.error("Error handler failed to update UI or save:", e);
        }
   }
  return true;
};


// --- 游戏启动 ---
document.addEventListener('DOMContentLoaded', initGame);
callbacks.claimQuest = claimQuestReward;
callbacks.handleExchange = handleExchange;

// --- REMOVED DUPLICATE initGame DEFINITION ---
/*
function initGame() { ... }
*/