/**
 * ==================================================================
 * core/saveManager.js
 * (已修改：更新 localStorage 键名以重置存档)
 * ==================================================================
 */

import { gameState, defaultGameState } from './gameState.js'; 

// 定义存档键名常量，方便以后修改
const SAVE_KEY = 'wowAfkGameSave_v3.2'; // <--- 修改这里，比如改成 v3.2

export function saveGame() { 
    try { 
        const minimalCurrentDungeon = gameState.currentDungeon ? { 
            name: gameState.currentDungeon.name, 
            type: gameState.currentDungeon.type, 
            bossesDefeated: gameState.currentDungeon.bossesDefeated, 
            size: gameState.currentDungeon.size 
        } : null; 

        const minimalDungeons5p = gameState.dungeons5p.map(d => ({ name: d.name, completed: d.completed })); 
        const minimalRaids10p = gameState.raids10p.map(d => ({ name: d.name, completed: d.completed })); 
        const minimalRaids25p = gameState.raids25p.map(d => ({ name: d.name, completed: d.completed })); 

        const savableGameState = { 
            proficiency: gameState.proficiency, 
            proficiencyPurchased: gameState.proficiencyPurchased, 
            gearScore: gameState.gearScore, 
            gold: gameState.gold, 
            equipment: { ...gameState.equipment }, 
            badges: { ...gameState.badges }, 
            legendaryShards: { ...gameState.legendaryShards }, 
            legendaryItemsObtained: { ...gameState.legendaryItemsObtained }, 
            collectibles: [ ...gameState.collectibles ], 
            milestoneQuestsClaimed: { ...gameState.milestoneQuestsClaimed }, 
            
            ascensionLevel: gameState.ascensionLevel, 
            heirloomLevels: { ...gameState.heirloomLevels },

            daily: gameState.daily, 
            lastAtieshResetTime: gameState.lastAtieshResetTime,
            lastValanyrChestTime: gameState.lastValanyrChestTime,
            lastHearthstoneSkillTime: gameState.lastHearthstoneSkillTime,
            luckyChests: gameState.luckyChests, slotCredits: gameState.slotCredits,
            
            monstersKilled: gameState.monstersKilled, 
            bossesKilled: gameState.bossesKilled, 
            currentDungeon: minimalCurrentDungeon, 
            dungeons5p: minimalDungeons5p, 
            raids10p: minimalRaids10p, 
            raids25p: minimalRaids25p 
        };

        // 使用新键名保存
        localStorage.setItem(SAVE_KEY, JSON.stringify(savableGameState)); 
    } catch (e) { 
        console.error("存档失败:", e); 
    }
}

export function loadGame() { 
    let loadedState = null; 
    let loadMessage = { loaded: false, message: '', type: 'system' }; 
    let savedDataRaw = null; 

    try { 
        // 使用新键名读取
        savedDataRaw = localStorage.getItem(SAVE_KEY); 
        if (savedDataRaw) { 
            loadedState = JSON.parse(savedDataRaw); 
            loadMessage = { loaded: true, message: '游戏进度已加载。', type: 'system' }; 
        } 
    } catch (e) { 
        console.error("解析存档数据时出错:", e); 
        localStorage.removeItem(SAVE_KEY); 
        loadMessage = { loaded: false, message: '存档数据损坏，已清除。将开始新游戏。', type: 'error' }; 
        loadedState = null; 
    }

    if (loadedState) {
        Object.assign(gameState, JSON.parse(JSON.stringify(defaultGameState))); 
        
        gameState.proficiency = loadedState.proficiency ?? defaultGameState.proficiency; 
        gameState.proficiencyPurchased = loadedState.proficiencyPurchased ?? defaultGameState.proficiencyPurchased; 
        gameState.gearScore = loadedState.gearScore ?? defaultGameState.gearScore; 
        gameState.gold = loadedState.gold ?? defaultGameState.gold; 
        gameState.monstersKilled = loadedState.monstersKilled ?? defaultGameState.monstersKilled; 
        gameState.bossesKilled = loadedState.bossesKilled ?? defaultGameState.bossesKilled; 
        gameState.ascensionLevel = loadedState.ascensionLevel ?? defaultGameState.ascensionLevel; 
        gameState.heirloomLevels = { ...defaultGameState.heirloomLevels, ...(loadedState.heirloomLevels || {}) };
        gameState.equipment = { ...defaultGameState.equipment, ...(loadedState.equipment || {}) }; 
        gameState.badges = { ...defaultGameState.badges, ...(loadedState.badges || {}) }; 
        gameState.legendaryShards = { ...defaultGameState.legendaryShards, ...(loadedState.legendaryShards || {}) }; 
        gameState.legendaryItemsObtained = { ...defaultGameState.legendaryItemsObtained, ...(loadedState.legendaryItemsObtained || {}) }; 
        gameState.collectibles = Array.isArray(loadedState.collectibles) ? loadedState.collectibles : []; 
        gameState.milestoneQuestsClaimed = { ...defaultGameState.milestoneQuestsClaimed, ...(loadedState.milestoneQuestsClaimed || {}) }; 
        if (loadedState.daily) gameState.daily = loadedState.daily;
        gameState.lastAtieshResetTime = loadedState.lastAtieshResetTime ?? 0;
        gameState.lastValanyrChestTime = loadedState.lastValanyrChestTime ?? 0; 
        gameState.lastHearthstoneSkillTime = loadedState.lastHearthstoneSkillTime ?? 0;
        gameState.luckyChests = loadedState.luckyChests || 0;
        gameState.slotCredits = loadedState.slotCredits || 0; 
        gameState.currentDungeon = loadedState.currentDungeon || null; 
        
        for (const key in defaultGameState.legendaryShards) { if (typeof gameState.legendaryShards[key] !== 'number' || isNaN(gameState.legendaryShards[key])) gameState.legendaryShards[key] = 0; }
        for (const key in defaultGameState.legendaryItemsObtained) { if (typeof gameState.legendaryItemsObtained[key] !== 'boolean') gameState.legendaryItemsObtained[key] = false; }
        if (gameState.equipment.relic) delete gameState.equipment.relic;
    } else {
        try { 
            Object.assign(gameState, JSON.parse(JSON.stringify(defaultGameState))); 
            gameState.dungeons5p = []; 
            gameState.raids10p = []; 
            gameState.raids25p = []; 
            gameState.currentDungeon = null; 
        } catch (e) { 
             console.error("从 defaultGameState 初始化时出错:", e); 
             Object.assign(gameState, JSON.parse(JSON.stringify(defaultGameState))); 
             loadMessage = { loaded: false, message: "无法从默认状态初始化，使用绝对默认值。", type: "error" }; 
        }
        if (!loadMessage.message) { 
            loadMessage = { loaded: false, message: '未找到存档，已使用默认值开始新游戏。', type: 'system' }; 
        }
    }

    gameState.proficiency = Math.max(0, Number(gameState.proficiency) || 0); 
    gameState.proficiencyPurchased = Math.max(0, Number(gameState.proficiencyPurchased) || 0); 
    gameState.gearScore = Math.max(1, Number(gameState.gearScore) || 187); 
    gameState.gold = Math.max(0, Number(gameState.gold) || 0); 
    gameState.monstersKilled = Math.max(0, Number(gameState.monstersKilled) || 0); 
    gameState.bossesKilled = Math.max(0, Number(gameState.bossesKilled) || 0); 
    gameState.equipment = gameState.equipment || {}; 
    gameState.badges = gameState.badges || {}; 
    gameState.legendaryShards = gameState.legendaryShards || {}; 
    gameState.legendaryItemsObtained = gameState.legendaryItemsObtained || {}; 
    gameState.collectibles = gameState.collectibles || []; 
    gameState.milestoneQuestsClaimed = gameState.milestoneQuestsClaimed || {}; 
    gameState.ascensionLevel = Math.max(0, Number(gameState.ascensionLevel) || 0); 
    gameState.heirloomLevels = gameState.heirloomLevels || {};
    if (!gameState.daily) gameState.daily = { ...defaultGameState.daily };
    return { loadMessage, loadedState }; 
}

export function applySavedCompletionStatus(parsedData) { 
    const apply = (list, saved) => { if (list && Array.isArray(saved)) list.forEach(d => { const s = saved.find(sd => sd.name === d.name); d.completed = s && s.completed === true; }); else if (list) list.forEach(d => d.completed = false); };
    apply(gameState.dungeons5p, parsedData?.dungeons5p); apply(gameState.raids10p, parsedData?.raids10p); apply(gameState.raids25p, parsedData?.raids25p); 
}

export function confirmAndClearSave() { 
    if (confirm("此操作将永久删除您的所有游戏进度，无法恢复！确认要清除存档吗？")) { 
        // 使用新键名清除
        localStorage.removeItem(SAVE_KEY); 
        alert("存档已成功清除！游戏将重新开始。"); 
        location.reload(); 
        return true; 
    }
    return false; 
}

 export function exportSave() { 
     try { 
         const s = { 
             proficiency: gameState.proficiency, proficiencyPurchased: gameState.proficiencyPurchased, gearScore: gameState.gearScore, gold: gameState.gold, 
             equipment: { ...gameState.equipment }, badges: { ...gameState.badges }, legendaryShards: { ...gameState.legendaryShards }, legendaryItemsObtained: { ...gameState.legendaryItemsObtained }, 
             collectibles: [ ...gameState.collectibles ], milestoneQuestsClaimed: { ...gameState.milestoneQuestsClaimed }, ascensionLevel: gameState.ascensionLevel, heirloomLevels: { ...gameState.heirloomLevels },
             daily: gameState.daily, lastAtieshResetTime: gameState.lastAtieshResetTime, lastValanyrChestTime: gameState.lastValanyrChestTime, lastHearthstoneSkillTime: gameState.lastHearthstoneSkillTime,
             luckyChests: gameState.luckyChests, slotCredits: gameState.slotCredits,
             monstersKilled: gameState.monstersKilled, bossesKilled: gameState.bossesKilled, 
             dungeons5p: gameState.dungeons5p.map(d => ({ name: d.name, completed: d.completed })), raids10p: gameState.raids10p.map(d => ({ name: d.name, completed: d.completed })), raids25p: gameState.raids25p.map(d => ({ name: d.name, completed: d.completed })), 
             currentDungeon: gameState.currentDungeon ? { name: gameState.currentDungeon.name, size: gameState.currentDungeon.size, bossesDefeated: gameState.currentDungeon.bossesDefeated } : null 
         };
         prompt("存档已导出！请复制以下文本进行备份:", btoa(unescape(encodeURIComponent(JSON.stringify(s))))); 
     } catch (e) { console.error("导出失败:", e); alert("导出失败！"); }
 }

export function importSave() { 
    const r = prompt("请输入您之前导出的存档字符串:"); 
    if (!r) return false; 
    try { 
        const d = JSON.parse(decodeURIComponent(escape(atob(r)))); 
        if (d && typeof d.gearScore === 'number' && d.badges && d.equipment) { 
            // 使用新键名保存导入的数据
            localStorage.setItem(SAVE_KEY, JSON.stringify(d)); 
            alert("存档导入成功！页面即将刷新以应用更改。"); 
            location.reload(); 
            return true; 
        } else { throw new Error("存档数据格式无效或不完整。"); }
    } catch (e) { console.error("导入失败:", e); alert(`导入失败！存档字符串无效或已损坏。\n错误: ${e.message}`); return false; }
}