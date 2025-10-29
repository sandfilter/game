/**
 * ==================================================================
 * core/saveManager.js
 * (已修改：移除重复的函数定义)
 * ==================================================================
 */

// Import defaultGameState specifically
import { gameState, defaultGameState } from './gameState.js'; //

/**
 * 存档
 */
export function saveGame() { //
    try { //
        const minimalCurrentDungeon = gameState.currentDungeon ? { //
            name: gameState.currentDungeon.name, //
            type: gameState.currentDungeon.type, //
            bossesDefeated: gameState.currentDungeon.bossesDefeated, //
            size: gameState.currentDungeon.size //
        } : null; //

        const minimalDungeons5p = gameState.dungeons5p.map(d => ({ name: d.name, completed: d.completed })); //
        const minimalRaids10p = gameState.raids10p.map(d => ({ name: d.name, completed: d.completed })); //
        const minimalRaids25p = gameState.raids25p.map(d => ({ name: d.name, completed: d.completed })); //

        const savableGameState = { //
            proficiency: gameState.proficiency, //
            gearScore: gameState.gearScore, //
            gold: gameState.gold, //
            badges: { ...gameState.badges }, //
            legendaryShards: { ...gameState.legendaryShards }, //
            legendaryItemsObtained: { ...gameState.legendaryItemsObtained }, //
            monstersKilled: gameState.monstersKilled, //
            bossesKilled: gameState.bossesKilled, //
            currentDungeon: minimalCurrentDungeon, //
            dungeons5p: minimalDungeons5p, //
            raids10p: minimalRaids10p, //
            raids25p: minimalRaids25p //
        };

        localStorage.setItem('wowAfkGameSave', JSON.stringify(savableGameState)); //
    } catch (e) { //
        console.error("存档失败:", e); //
    }
}


/**
 * 读档
 */
export function loadGame() { //
    console.log("--- loadGame started ---"); //
    let loadedState = null; //
    let loadMessage = { loaded: false, message: '', type: 'system' }; //
    let savedDataRaw = null; //

    // 1. 尝试加载存档
    try { //
        savedDataRaw = localStorage.getItem('wowAfkGameSave'); //
        console.log("Raw saved data from localStorage:", savedDataRaw); //
        if (savedDataRaw) { //
            loadedState = JSON.parse(savedDataRaw); //
            console.log("Parsed loadedState:", loadedState); //
            loadMessage = { loaded: true, message: '游戏进度已加载。', type: 'system' }; //
        } else { //
             console.log("No saved data found in localStorage."); //
        }
    } catch (e) { //
        console.error("解析存档数据时出错:", e); //
        localStorage.removeItem('wowAfkGameSave'); //
        loadMessage = { loaded: false, message: '存档数据损坏，已清除。将开始新游戏。', type: 'error' }; //
        loadedState = null; //
    }

    // 2. 根据是否有存档进行初始化
    if (loadedState) {
        // --- 有存档：合并存档数据到默认结构上 ---
        console.log("Branch: Loading saved game."); //
        Object.assign(gameState, JSON.parse(JSON.stringify(defaultGameState))); // Start with default structure
        // ... (merging logic remains the same) ...
        gameState.proficiency = loadedState.proficiency ?? defaultGameState.proficiency; //
        gameState.gearScore = loadedState.gearScore ?? defaultGameState.gearScore; //
        gameState.gold = loadedState.gold ?? defaultGameState.gold; //
        gameState.monstersKilled = loadedState.monstersKilled ?? defaultGameState.monstersKilled; //
        gameState.bossesKilled = loadedState.bossesKilled ?? defaultGameState.bossesKilled; //
        gameState.badges = { ...defaultGameState.badges, ...(loadedState.badges || {}) }; //
        gameState.legendaryShards = { ...defaultGameState.legendaryShards, ...(loadedState.legendaryShards || {}) }; //
        gameState.legendaryItemsObtained = { ...defaultGameState.legendaryItemsObtained, ...(loadedState.legendaryItemsObtained || {}) }; //
        gameState.currentDungeon = loadedState.currentDungeon || null; //
        for (const key in defaultGameState.legendaryShards) { //
             if (typeof gameState.legendaryShards[key] !== 'number' || isNaN(gameState.legendaryShards[key])) { //
                  console.warn(`存档中 ${key} 的碎片数量丢失或无效，重置为 0。`); //
                  gameState.legendaryShards[key] = 0; //
             }
         }
         for (const key in defaultGameState.legendaryItemsObtained) { //
             if (typeof gameState.legendaryItemsObtained[key] !== 'boolean') { //
                  console.warn(`存档中 ${key} 的获取状态丢失或无效，重置为 false。`); //
                  gameState.legendaryItemsObtained[key] = false; //
             }
         }
        console.log("gameState after merging save:", JSON.parse(JSON.stringify(gameState))); //

    } else {
        // --- 无存档 (或已损坏)：直接从 defaultGameState 初始化新游戏 ---
        console.log("Branch: Initializing new game from defaultGameState."); //
        try { //
            // Simply deep copy defaultGameState
            Object.assign(gameState, JSON.parse(JSON.stringify(defaultGameState))); //
            console.log("gameState after copying defaultGameState:", JSON.parse(JSON.stringify(gameState))); //

            // Ensure lists are empty (they should be in default, but safe)
            gameState.dungeons5p = []; //
            gameState.raids10p = []; //
            gameState.raids25p = []; //
            gameState.currentDungeon = null; //


        } catch (e) { //
             console.error("从 defaultGameState 初始化时出错:", e); //
             // Fallback to absolute default (should be same as defaultGameState now)
             Object.assign(gameState, JSON.parse(JSON.stringify(defaultGameState))); //
             loadMessage = { loaded: false, message: "无法从默认状态初始化，使用绝对默认值。", type: "error" }; //
             console.log("Fell back during defaultGameState init:", JSON.parse(JSON.stringify(gameState))); //
        }
        if (!loadMessage.message) { // Update message if not already set by error
            loadMessage = { loaded: false, message: '未找到存档，已使用默认值开始新游戏。', type: 'system' }; //
        }
    }

    // --- 通用安全检查 (保持不变) ---
    gameState.proficiency = Math.max(0, Number(gameState.proficiency) || 0); //
    gameState.gearScore = Math.max(1, Number(gameState.gearScore) || defaultGameState.gearScore); //
    gameState.gold = Math.max(0, Number(gameState.gold) || 0); //
    gameState.monstersKilled = Math.max(0, Number(gameState.monstersKilled) || 0); //
    gameState.bossesKilled = Math.max(0, Number(gameState.bossesKilled) || 0); //
    gameState.badges = gameState.badges || {}; //
    gameState.legendaryShards = gameState.legendaryShards || {}; //
    gameState.legendaryItemsObtained = gameState.legendaryItemsObtained || {}; //

    console.log("Final gameState before returning from loadGame:", JSON.parse(JSON.stringify(gameState))); //
    console.log("--- loadGame finished ---"); //
    return { loadMessage, loadedState }; //
}

/**
 * 应用已保存的副本完成状态
 */
export function applySavedCompletionStatus(parsedData) { //
    const applyStatus = (list, savedListMinimal) => { //
        if (list && Array.isArray(savedListMinimal)) { //
            list.forEach(dungeonInState => { //
                const savedStatus = savedListMinimal.find(saved => saved.name === dungeonInState.name); //
                if (savedStatus && typeof savedStatus.completed === 'boolean') { //
                    dungeonInState.completed = savedStatus.completed; //
                } else { //
                    dungeonInState.completed = false; //
                }
            });
        }
         else if (list) { //
             list.forEach(d => d.completed = false); //
         }
    };
    applyStatus(gameState.dungeons5p, parsedData?.dungeons5p); //
    applyStatus(gameState.raids10p, parsedData?.raids10p); //
    applyStatus(gameState.raids25p, parsedData?.raids25p); //
}


/**
 * 确认并清除存档
 */
export function confirmAndClearSave() { //
    if (confirm("此操作将永久删除您的所有游戏进度，无法恢复！确认要清除存档吗？")) { //
        localStorage.removeItem('wowAfkGameSave'); //
        alert("存档已成功清除！游戏将重新开始。"); //
        location.reload(); //
        return true; //
    }
    return false; //
}

/**
 * 导出存档
 */
 export function exportSave() { //
     try { //
         const stateToSave = { //
             proficiency: gameState.proficiency, //
             gearScore: gameState.gearScore, //
             gold: gameState.gold, //
             badges: { ...gameState.badges }, //
             legendaryShards: { ...gameState.legendaryShards }, //
             legendaryItemsObtained: { ...gameState.legendaryItemsObtained }, //
             monstersKilled: gameState.monstersKilled, //
             bossesKilled: gameState.bossesKilled, //
             dungeons5p: gameState.dungeons5p.map(d => ({ name: d.name, completed: d.completed })), //
             raids10p: gameState.raids10p.map(d => ({ name: d.name, completed: d.completed })), //
             raids25p: gameState.raids25p.map(d => ({ name: d.name, completed: d.completed })), //
             currentDungeon: gameState.currentDungeon ? { //
                 name: gameState.currentDungeon.name, //
                 size: gameState.currentDungeon.size, //
                 bossesDefeated: gameState.currentDungeon.bossesDefeated //
             } : null //
         };
         const jsonString = JSON.stringify(stateToSave); //
         const saveDataString = btoa(unescape(encodeURIComponent(jsonString))); //
         prompt("存档已导出！请复制以下文本进行备份:", saveDataString); //
     } catch (e) { //
         console.error("导出存档失败:", e); //
         alert("导出存档失败！"); //
     }
 }

/**
 * 导入存档
 */
export function importSave() { //
    const rawSaveData = prompt("请输入您之前导出的存档字符串:"); //
    if (!rawSaveData) { //
        return false; //
    }
    try { //
        const jsonString = decodeURIComponent(escape(atob(rawSaveData))); //
        const importedData = JSON.parse(jsonString); //

        if (importedData && typeof importedData.gearScore === 'number' && importedData.badges) { //
            localStorage.setItem('wowAfkGameSave', jsonString); //
            alert("存档导入成功！页面即将刷新以应用更改。"); //
            location.reload(); //
            return true; //
        } else { //
            throw new Error("存档数据格式无效或不完整。"); //
        }
    } catch (e) { //
        console.error("导入存档失败:", e); //
        alert(`导入失败！存档字符串无效或已损坏。\n错误: ${e.message}`); //
        return false; //
    }
}

// --- REMOVED DUPLICATE FUNCTION DEFINITIONS ---
/*
export function saveGame() { ... }
export function applySavedCompletionStatus(parsedData) { ... }
export function confirmAndClearSave() { ... }
export function exportSave() { ... }
export function importSave() { ... }
*/