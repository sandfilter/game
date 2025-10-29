/**
 * ==================================================================
 * core/gameLoop.js
 * (已修正：移除了 battleCallbacks 的循环导入)
 * ==================================================================
 */

import { gameState } from './gameState.js';
// (已移除) import { battleGame } from './battleCallbacks.js';
import { addMessage } from '../ui/messageLog.js';
import { closeProgressModal, updateProgressModal } from '../ui/modalProgress.js';
import { updateDungeonProgressDisplay } from '../ui/mainDisplay.js';
import { saveGame } from './saveManager.js';
import { initializeDungeonLists, checkAndApplyLegendaryDropRates } from './initialization.js';
import { TIMING_CONFIG } from '../config/timing-config.js';

// --- 模块变量 ---
// (新增)
let battleGameInstance = null;

// (新增)
/**
 * 注入 battleGame 实例以打破循环依赖
 * @param {object} instance battleGame 实例
 */
export function setBattleGameInstance(instance) {
    battleGameInstance = instance;
}

/**
 * 开始一个新的随机副本
 *
 */
export function startNewDungeon(size) {
    let dungeonPool, dungeonType; //
    let requiredGear = 0; //

    if (size === 5) { dungeonPool = gameState.dungeons5p; dungeonType = "5人地下城"; } //
    else if (size === 10) { dungeonPool = gameState.raids10p; dungeonType = "10人团队副本"; requiredGear = 200; } //
    else { dungeonPool = gameState.raids25p; dungeonType = "25人团队副本"; requiredGear = 213; } //

    if (!Array.isArray(dungeonPool)) { //
         console.error(`无效的副本池，规模: ${size}`); //
         addMessage(`错误：无法加载 ${dungeonType} 列表。`, 'error'); //
         return; //
    }

    if (gameState.gearScore < requiredGear) { //
        addMessage(`需要装备等级达到 ${requiredGear} 才能挑战${dungeonType}。`, 'error'); //
        return; //
    }

    let uncompletedDungeons = dungeonPool.filter(d => d && !d.completed); //

    if (uncompletedDungeons.length === 0) { //
        if (dungeonPool.length > 0) { //
            addMessage(`所有${dungeonType}已完成！`, 'reward'); //
             if (size === 5) { //
                 addMessage(`等待副本重置...`, 'system'); //
             } else { //
                 addMessage(`将自动开始5人地下城。`, 'system'); //
                 setTimeout(() => startNewDungeon(5), TIMING_CONFIG.DUNGEON_START_DELAY); //
             }
        } else { //
            addMessage(`没有可用的${dungeonType}。`, 'error'); //
        }
        return; //
    }

    const selectedDungeon = uncompletedDungeons[Math.floor(Math.random() * uncompletedDungeons.length)]; //
    startSpecificDungeon({ name: selectedDungeon.name, size: selectedDungeon.size }); //
}

/**
 * 开始一个指定的副本
 *
 */
export function startSpecificDungeon(dungeonInfo, isResuming = false) {
    let dungeonRef; //
    
    if (dungeonInfo.size === 5) dungeonRef = gameState.dungeons5p.find(dRef => dRef?.name === dungeonInfo.name); //
    else if (dungeonInfo.size === 10) dungeonRef = gameState.raids10p.find(dRef => dRef?.name === dungeonInfo.name); //
    else dungeonRef = gameState.raids25p.find(dRef => dRef?.name === dungeonInfo.name); //

    if (!dungeonRef) { //
        console.error("startSpecificDungeon 未找到副本引用:", dungeonInfo.name); //
         addMessage(`错误：无法启动副本 ${dungeonInfo.name}。`, 'error'); //
        return; //
    }

    if (dungeonRef.completed && !isResuming) { //
        addMessage('该副本已完成，请重置后再来。', 'error'); //
        return; //
    }

    let requiredGear = 0; //
    if (dungeonRef.size === 10) requiredGear = 200; //
    if (dungeonRef.size === 25) requiredGear = 213; //

    if (gameState.gearScore < requiredGear) { //
        addMessage(`需要装备等级达到 ${requiredGear} 才能挑战 ${dungeonRef.name}。`, 'error'); //
        return; //
    }

    // (修改)
    if (battleGameInstance) { //
        battleGameInstance.stopCurrentBattle(); //
    }
    closeProgressModal(); //

     if (isResuming) { //
         dungeonRef.bossesDefeated = typeof dungeonInfo.bossesDefeated === 'number' ? dungeonInfo.bossesDefeated : 0; //
     } else { //
         dungeonRef.bossesDefeated = 0; //
     }
     dungeonRef.bossesDefeated = Math.max(0, Math.min(dungeonRef.bossesDefeated, dungeonRef.bosses?.length ?? 0)); //

    if (!isResuming) { //
        addMessage(`准备进入 ${dungeonRef.name} (${dungeonRef.size}人)，${TIMING_CONFIG.DUNGEON_START_DELAY / 1000}秒后开始...`, 'system'); //
    }

    setTimeout(() => { //
        gameState.currentDungeon = dungeonRef; //
        
        // (修改)
        if (battleGameInstance) { //
            battleGameInstance.startDungeonRun(dungeonRef); //
        }
        
        updateDungeonProgressDisplay(); //
    }, isResuming ? 0 : TIMING_CONFIG.DUNGEON_START_DELAY); //
}

/**
 * 重置所有副本进度
 *
 */
export function resetAllDungeonProgress() {
    // (修改)
    if (battleGameInstance) { //
        battleGameInstance.stopCurrentBattle(); //
    }
    gameState.currentDungeon = null; //
    
    initializeDungeonLists(); //
    checkAndApplyLegendaryDropRates(); //
    
    addMessage("所有副本进度已重置！新的冒险开始了！", "reward"); //
    
    saveGame(); //
    
    updateDungeonProgressDisplay(); //
    updateProgressModal(); //
}