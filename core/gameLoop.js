import { gameState } from './gameState.js'; import { addMessage } from '../ui/messageLog.js'; import { closeProgressModal, updateProgressModal } from '../ui/modalProgress.js'; import { updateDungeonProgressDisplay, updateStatsDisplay } from '../ui/mainDisplay.js'; import { saveGame } from './saveManager.js'; import { initializeDungeonLists, checkAndApplyLegendaryDropRates } from './initialization.js'; import { TIMING_CONFIG } from '../config/timing-config.js'; 

let battleGameInstance = null;
export function setBattleGameInstance(instance) { battleGameInstance = instance; }

export function handleDungeonCompletionFlow(completedDungeonRef) {
    gameState.currentDungeon = null; updateStatsDisplay(); updateDungeonProgressDisplay(); 
    let requiresResetAndRestart = false, size = completedDungeonRef.size; 
    if (size === 5 && gameState.dungeons5p.every(d => d.completed)) { addMessage("所有5人本已通关！重置进度！", "system"); requiresResetAndRestart = true; }
    else if ((size === 10 && gameState.raids10p.every(d => d.completed)) || (size === 25 && gameState.raids25p.every(d => d.completed))) addMessage(`所有${size}人本已通关！搜索下一个。`, "system"); 
    if (requiresResetAndRestart) resetAllDungeonProgress(); 
    startNextAvailableDungeon(); 
}

export function startNextAvailableDungeon() {
    const gs = gameState.gearScore ?? 0;
    if (gs >= 207 && gameState.raids25p.some(d => !d.completed)) { addMessage(`自动匹配25人副本...`, 'system'); startNewDungeon(25); return; }
    if (gs >= 200 && gameState.raids10p.some(d => !d.completed)) { addMessage(`自动匹配10人副本...`, 'system'); startNewDungeon(10); return; }
    if (gameState.dungeons5p.some(d => !d.completed)) { addMessage(`自动匹配5人副本...`, 'system'); startNewDungeon(5); return; }
    addMessage(`无可用副本，等待重置...`, 'system');
}

export function startNewDungeon(size) {
    let pool, type, req = 0;
    if (size === 5) { pool = gameState.dungeons5p; type = "5人地下城"; }
    else if (size === 10) { pool = gameState.raids10p; type = "10人团队副本"; req = 200; }
    else { pool = gameState.raids25p; type = "25人团队副本"; req = 207; }
    if (!pool) return;
    if (gameState.gearScore < req) { addMessage(`需要装等 ${req} 挑战${type}。`, 'error'); return; }
    let available = pool.filter(d => d && !d.completed);
    if (available.length === 0) {
        addMessage(`所有${type}已完成！`, 'reward');
        if (size !== 5) setTimeout(() => startNextAvailableDungeon(), TIMING_CONFIG.DUNGEON_START_DELAY);
        return;
    }
    const target = available[Math.floor(Math.random() * available.length)];
    startSpecificDungeon({ name: target.name, size: target.size });
}

export function startSpecificDungeon(dungeonInfo, isResuming = false) {
    let dRef;
    if (dungeonInfo.size === 5) dRef = gameState.dungeons5p.find(d => d?.name === dungeonInfo.name);
    else if (dungeonInfo.size === 10) dRef = gameState.raids10p.find(d => d?.name === dungeonInfo.name);
    else dRef = gameState.raids25p.find(d => d?.name === dungeonInfo.name);

    if (!dRef) { addMessage(`错误：无法启动 ${dungeonInfo.name}。`, 'error'); return; }
    if (dRef.completed && !isResuming) { addMessage('该副本已完成，请重置。', 'error'); return; }

    let req = 0; if (dRef.size === 10) req = 200; if (dRef.size === 25) req = 207;
    if (gameState.gearScore < req) { addMessage(`装等需 ${req} 挑战 ${dRef.name}。`, 'error'); return; }

    if (battleGameInstance) battleGameInstance.stopCurrentBattle();
    closeProgressModal();

    if (isResuming) dRef.bossesDefeated = typeof dungeonInfo.bossesDefeated === 'number' ? dungeonInfo.bossesDefeated : (dRef.bossesDefeated || 0);
    dRef.bossesDefeated = Math.max(0, Math.min(dRef.bossesDefeated, dRef.bosses?.length ?? 0));

    setTimeout(() => {
        gameState.currentDungeon = dRef;
        if (battleGameInstance) battleGameInstance.startDungeonRun(dRef);
        updateDungeonProgressDisplay();
    }, 0);
}

export function resetAllDungeonProgress() {
    if (battleGameInstance) battleGameInstance.stopCurrentBattle();
    gameState.currentDungeon = null; 
    initializeDungeonLists(); checkAndApplyLegendaryDropRates(); 
    addMessage("所有副本进度已重置！", "reward"); 
    saveGame(); updateDungeonProgressDisplay(); updateProgressModal(); 
}