import { gameState } from './gameState.js'; import { DUNGEON_DATA } from '../data/dungeon-data.js'; import { saveGame } from './saveManager.js'; import { addMessage } from '../ui/messageLog.js';

const POOL = {
    boss: { prefix:"d_boss", name:"日常: 讨伐首领", desc:"今日累计击败任意BOSS", targets:[10, 20], reward:{ luckyChests: 1 } },
    crystal: { prefix:"d_crystal", name:"日常: 筹集水晶", desc:"今日累计获得深渊水晶", targets:[10], reward:{ luckyChests: 1 } },
    dungeon: { prefix:"d_dg", name:"日常: 通关", desc:"通关指定5人副本", reward:{ luckyChests: 1 } }
};

// 强制刷新日常任务
export function forceDailyReset(isAuto = false) {
    generateDailyQuests();
    gameState.daily.lastReset = Date.now();
    gameState.daily.stats = { bosses:0, gold:0, crystals:0, dungeons:{} }; 
    saveGame();
    
    if (isAuto) {
        console.log("每日重置(4AM)...");
        addMessage("🌞 凌晨4点已过，日常任务已刷新！", "system");
    } else {
        console.log("强制重置日常任务...");
        addMessage("🌞 日常任务已强制刷新！", "system");
    }
}

export function checkDailyReset() {
    const now = new Date(), last = gameState.daily.lastReset || 0;
    const resetHour = 4, nowShift = new Date(now.getTime() - resetHour * 3600000), lastShift = new Date(last - resetHour * 3600000);

    if (nowShift.toDateString() !== lastShift.toDateString()) {
        forceDailyReset(true); 
        return true;
    }
    return false;
}

function generateDailyQuests() {
    const quests = [];
    
    // 1. 必出：指定5人本任务
    const pool = DUNGEON_DATA["5人副本"];
    if (pool?.length) {
        const target = pool[Math.floor(Math.random() * pool.length)].副本名称;
        quests.push({ 
            id: `${POOL.dungeon.prefix}_${Date.now()}_1`, 
            type: 'dungeon', 
            targetName: target, 
            name: `${POOL.dungeon.name}: ${target}`, 
            description: `${POOL.dungeon.desc}`, 
            target: 1, 
            claimed: false, 
            reward: POOL.dungeon.reward 
        });
    }

    // 2. 必出：讨伐首领任务 (随机取目标数)
    const tBoss = POOL.boss;
    const valBoss = tBoss.targets[Math.floor(Math.random() * tBoss.targets.length)];
    quests.push({ 
        id: `${tBoss.prefix}_${Date.now()}_2`, 
        type: 'boss', 
        name: tBoss.name, 
        description: `${tBoss.desc} (${valBoss})`, 
        target: valBoss, 
        claimed: false, 
        reward: tBoss.reward 
    });

    // 3. 必出：筹集水晶任务
    const tCrystal = POOL.crystal;
    const valCrystal = tCrystal.targets[Math.floor(Math.random() * tCrystal.targets.length)];
    quests.push({ 
        id: `${tCrystal.prefix}_${Date.now()}_3`, 
        type: 'crystal', 
        name: tCrystal.name, 
        description: `${tCrystal.desc} (${valCrystal})`, 
        target: valCrystal, 
        claimed: false, 
        reward: tCrystal.reward 
    });

    gameState.daily.quests = quests;
}

export function getDailyProgress(q) {
    if (!q) return 0;
    if (q.type === 'boss') return gameState.daily.stats.bosses || 0;
    if (q.type === 'crystal') return gameState.daily.stats.crystals || 0; 
    if (q.type === 'dungeon') return gameState.daily.stats.dungeons[q.targetName] || 0;
    return 0;
}