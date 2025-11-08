/**
 * ==================================================================
 * core/gameLoop.js
 * (已修改：添加了 handleDungeonCompletionFlow 逻辑)
 * (已修改：移除了 FINAL_GEAR_CAP 逻辑)
 * (已修改：25人本装等门槛改为 207)
 * (已修改：移除通关后的延迟以实现无缝切换)
 * (已修改：添加 startNextAvailableDungeon 优先级排队函数)
 * ==================================================================
 */

import { gameState } from './gameState.js'; // <<< (移除 FINAL_GEAR_CAP)
import { addMessage } from '../ui/messageLog.js';
import { closeProgressModal, updateProgressModal } from '../ui/modalProgress.js';
import { updateDungeonProgressDisplay, updateStatsDisplay } from '../ui/mainDisplay.js'; 
import { saveGame } from './saveManager.js';
import { initializeDungeonLists, checkAndApplyLegendaryDropRates } from './initialization.js';
import { TIMING_CONFIG } from '../config/timing-config.js'; 
import { GAME_DATA } from '../data/game-rules.js'; 

// --- 模块变量 ---
let battleGameInstance = null;

/**
 * 注入 battleGame 实例以打破循环依赖
 */
export function setBattleGameInstance(instance) {
    battleGameInstance = instance;
}

/**
 * (新增) 处理副本完成后的游戏流程
 * (已修改：移除 FINAL_GEAR_CAP 奖励逻辑)
 * (已修改：移除 setTimeout 延迟)
 * (已修改：调用 startNextAvailableDungeon 以实现优先级排队)
 */
export function handleDungeonCompletionFlow(completedDungeonRef) {
    // 1. (已移除) 满级金币奖励逻辑 (FINAL_GEAR_CAP 已移除)
    /*
    if (gameState.gearScore >= FINAL_GEAR_CAP) { 
        // ... (bonus gold logic) ...
    }
    */
    
    // 2. 更新UI并重置当前副本状态
    const lastDungeonSize = completedDungeonRef.size; 
    gameState.currentDungeon = null; 
    updateStatsDisplay(); 
    updateDungeonProgressDisplay(); 

    // 3. 决定下一步行动
    let requiresResetAndRestart = false; 
    if (lastDungeonSize === 5) { 
        if (gameState.dungeons5p.every(d => d.completed)) { 
            addMessage("已完成所有5人副本！重置所有副本进度！", "system"); 
            requiresResetAndRestart = true; 
        }
    } else if (lastDungeonSize === 10) { 
        if (gameState.raids10p.every(d => d.completed)) { 
            addMessage("已完成所有10人团队副本！将自动搜索下一个可用副本。", "system"); 
            // (不再需要 nextDungeonSize = 5)
        }
    } else if (lastDungeonSize === 25) { 
         if (gameState.raids25p.every(d => d.completed)) { 
            addMessage("已完成所有25人团队副本！将自动搜索下一个可用副本。", "system"); 
            // (不再需要 nextDungeonSize = 5)
        }
    }

    // 4. (修改) 执行下一步 (移除 setTimeout)
    if (requiresResetAndRestart) { 
         resetAllDungeonProgress(); 
         // (消息已移至 startNextAvailableDungeon 内部)
         startNextAvailableDungeon(); // (修改：移除延迟)
    } else { 
         // (消息已移至 startNextAvailableDungeon 内部)
         startNextAvailableDungeon(); // (修改：移除延迟)
    }
}


/**
 * (新增) 自动按 25 -> 10 -> 5 的优先级开始一个新副本
 */
export function startNextAvailableDungeon() {
    const gearScore = gameState.gearScore ?? 0;
    
    // (门槛值来自 startNewDungeon 函数)
    const req25 = 207; 
    const req10 = 200;

    // 1. 检查 25 人
    if (gearScore >= req25) {
        const uncompleted25 = gameState.raids25p.filter(d => d && !d.completed);
        if (uncompleted25.length > 0) {
            addMessage(`正在自动匹配下一个25人副本...`, 'system');
            startNewDungeon(25); // 使用现有的随机选择器
            return;
        }
        // (如果25人全打完了，自动降级到10人)
    }

    // 2. 检查 10 人
    if (gearScore >= req10) {
        const uncompleted10 = gameState.raids10p.filter(d => d && !d.completed);
        if (uncompleted10.length > 0) {
            addMessage(`正在自动匹配下一个10人副本...`, 'system');
            startNewDungeon(10);
            return;
        }
        // (如果10人全打完了，自动降级到5人)
    }

    // 3. 降级到 5 人 (或 5 人本重置后)
    const uncompleted5 = gameState.dungeons5p.filter(d => d && !d.completed);
    if (uncompleted5.length > 0) {
        addMessage(`正在自动匹配下一个5人副本...`, 'system');
        startNewDungeon(5);
        return;
    }

    // (此情况不应发生，因为 5 人本完成后会重置)
    addMessage(`所有副本均已完成，等待5人副本重置...`, 'system');
}


/**
 * 开始一个新的随机副本 (此函数现在主要由 startNextAvailableDungeon 或 UI 按钮调用)
 * (已修改：25人本装等门槛改为 207)
 */
export function startNewDungeon(size) {
    let dungeonPool, dungeonType; //
    let requiredGear = 0; //

    if (size === 5) { dungeonPool = gameState.dungeons5p; dungeonType = "5人地下城"; } //
    else if (size === 10) { dungeonPool = gameState.raids10p; dungeonType = "10人团队副本"; requiredGear = 200; } //
    else { dungeonPool = gameState.raids25p; dungeonType = "25人团队副本"; requiredGear = 207; } // <<< (修改)

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
                 // (修改：不再自动开始5人，而是调用优先级排队)
                 setTimeout(() => startNextAvailableDungeon(), TIMING_CONFIG.DUNGEON_START_DELAY);
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
 * (已修改：25人本装等门槛改为 207)
 * (已修改：移除 setTimeout 延迟以实现无缝切换)
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
    if (dungeonRef.size === 25) requiredGear = 207; // <<< (修改)

    if (gameState.gearScore < requiredGear) { //
        addMessage(`需要装备等级达到 ${requiredGear} 才能挑战 ${dungeonRef.name}。`, 'error'); //
        return; //
    }

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

    // (修改：移除 "准备进入" 的日志，startDungeonRun 会立即显示 "正在集结")
    /*
    if (!isResuming) { //
        addMessage(`准备进入 ${dungeonRef.name} (${dungeonRef.size}人)，${TIMING_CONFIG.DUNGEON_START_DELAY / 1000}秒后开始...`, 'system'); //
    }
    */

    setTimeout(() => { //
        gameState.currentDungeon = dungeonRef; //
        
        if (battleGameInstance) { //
            // startDungeonRun 会显示 "跑本" 界面并处理自己的内部延迟
            battleGameInstance.startDungeonRun(dungeonRef); //
        }
        
        updateDungeonProgressDisplay(); //
    }, 0); // (修改：延迟改为 0，实现无缝切换)
}

/**
 * 重置所有副本进度
 */
export function resetAllDungeonProgress() {
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