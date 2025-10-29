/**
 * ==================================================================
 * core/initialization.js
 * (拆分自 game-bundle.js)
 *
 * 职责:
 * 1. 初始化副本列表 (initializeDungeonLists)。
 * 2. 初始化任务配置 (initializeQuests)。
 * 3. 处理传说物品掉率 (checkAndApplyLegendaryDropRates)。
 * 4. 导出 questConfig 供其他模块使用。
 * ==================================================================
 */

import { gameState } from './gameState.js';
import { DUNGEON_DATA } from '../data/dungeon-data.js';
import { QUEST_DATA } from '../data/quest-data.js';

// --- 模块变量 ---
//
export let questConfig = {}; //

/**
 * 初始化副本列表
 *
 */
export function initializeDungeonLists() {
    const badgeKeyMap = { "英雄徽章": "heroism", "勇气徽章": "valor", "征服徽章": "conquest", "凯旋徽章": "triumph", "寒冰徽章": "frost" }; //
    
    const mapDungeon = (d, type, size) => ({ //
        ...JSON.parse(JSON.stringify(d)), //
        completed: false,       //
        bossesDefeated: 0,  //
        type,                   //
        size,                   //
        badgeType: badgeKeyMap[d.徽章类型] || null, //
        name: d.副本名称, //
        bosses: Array.isArray(d.BOSS) ? JSON.parse(JSON.stringify(d.BOSS)) : [] //
    });

    gameState.dungeons5p = DUNGEON_DATA["5人副本"].map(d => mapDungeon(d, '5p', 5)); //
    gameState.raids10p = DUNGEON_DATA["团队副本"].map(r => mapDungeon(r, 'raid', 10)); //
    gameState.raids25p = DUNGEON_DATA["团队副本"].map(r => mapDungeon(r, 'raid', 25)); //
    
    console.log("副本列表已从 DUNGEON_DATA 初始化。"); //
}

/**
 * 初始化任务配置
 *
 */
export function initializeQuests() {
     questConfig = {}; //
     QUEST_DATA.forEach(q => { //
        const id = q.任务条件.目标; //
        let getProgressFunction; //

        if (id.includes('.')) { //
            const keys = id.split('.'); //
            getProgressFunction = (state) => { //
                const value = state?.[keys[0]]?.[keys[1]]; //
                return typeof value === 'number' && !isNaN(value) ? value : 0; //
            }
        } else { //
            getProgressFunction = (state) => { //
                 const value = state?.[id]; //
                 return typeof value === 'number' && !isNaN(value) ? value : 0; //
             };
        }

        questConfig[id] = { //
            id: id, //
            name: q.任务名称, //
            target: q.任务条件.数量, //
            reward: q.任务奖励, //
            getProgress: getProgressFunction //
        };
     });
     console.log("任务已初始化:", questConfig); //
}

/**
 * 检查并应用传说物品掉率
 *
 */
export function checkAndApplyLegendaryDropRates() {
    try {
         if (!gameState || !gameState.legendaryItemsObtained || !gameState.raids25p) { //
             console.error("无法应用掉率：gameState 或其嵌套属性丢失。"); //
             return; //
         }

        if (gameState.legendaryItemsObtained["埃提耶什·守护者的传说之杖"]) { //
            const shardName = "埃提耶什的碎片"; //
            const naxx25 = gameState.raids25p.find(r => r?.name === "纳克萨玛斯"); //
            if (naxx25 && naxx25.bosses) { //
                 naxx25.bosses.forEach(b => { if (b && b.hasOwnProperty(shardName)) b[shardName] = 0; }); //
                 console.log("已获得埃提耶什，NAXX(25)的碎片掉率已设为0。"); //
            }
        }
         
    } catch (error) {
         console.error("应用传说物品掉率时出错:", error); //
    }
}