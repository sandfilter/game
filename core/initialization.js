/**
 * ==================================================================
 * core/initialization.js
 * (已修改：questConfig 现在包含 description)
 * (已修改：修正了团本掉落表 (lootTable_10/25) 的映射逻辑)
 * ==================================================================
 */

import { gameState } from './gameState.js'; //
import { DUNGEON_DATA } from '../data/dungeon-data.js'; //
import { QUEST_DATA } from '../data/quest-data.js'; //

// --- 模块变量 ---
export let questConfig = {}; //

/**
 * 初始化副本列表
 * (已修改：修正了团本掉落表 (lootTable_10/25) 的映射逻辑)
 */
export function initializeDungeonLists() { //
    const badgeKeyMap = { "英雄徽章": "heroism", "勇气徽章": "valor", "征服徽章": "conquest", "凯旋徽章": "triumph", "寒冰徽章": "frost" }; //
    
    const mapDungeon = (d, type, size) => ({ //
        completed: false, //
        bossesDefeated: 0, //
        type, //
        size, //
        badgeType: badgeKeyMap[d.徽章类型] || null, //
        name: d.副本名称, //
        
        // (修改) 确保 BOSS 数据被正确深拷贝和映射
        bosses: Array.isArray(d.BOSS) ? d.BOSS.map(b => {
            const bossData = { ...b }; // 浅拷贝 BOSS 属性
            
            // (修改) 为团本BOSS分配正确的掉落表
            if (type === 'raid') {
                // 如果是10人，使用 lootTable_10，否则使用 lootTable_25
                bossData.lootTable = (size === 10) ? (b.lootTable_10 || []) : (b.lootTable_25 || []);
            }
            // (5人本的 lootTable (b.lootTable) 会被自动保留)
            
            // (移除不再需要的表，清理内存)
            delete bossData.lootTable_10;
            delete bossData.lootTable_25;
            
            return bossData;
        }) : []
    });
    
    gameState.dungeons5p = DUNGEON_DATA["5人副本"].map(d => mapDungeon(d, '5p', 5)); //
    gameState.raids10p = DUNGEON_DATA["团队副本"].map(r => mapDungeon(r, 'raid', 10)); //
    gameState.raids25p = DUNGEON_DATA["团队副本"].map(r => mapDungeon(r, 'raid', 25)); //
    console.log("副本列表已从 DUNGEON_DATA 初始化。"); //
}


/**
 * 初始化任务配置
 * (已修改：添加 description)
 */
export function initializeQuests() { //
     questConfig = {}; //
     QUEST_DATA.forEach(q => { //
        
        const id = q.里程碑ID || q.任务条件.目标; //
        
        let getProgressFunction; //
        const targetPath = q.任务条件.目标; //

        if (targetPath.includes('.')) { //
            const keys = targetPath.split('.'); //
            getProgressFunction = (state) => { //
                const value = state?.[keys[0]]?.[keys[1]]; //
                return typeof value === 'number' && !isNaN(value) ? value : 0; //
            }
        } else { //
            getProgressFunction = (state) => { //
                 const value = state?.[targetPath]; //
                 return typeof value === 'number' && !isNaN(value) ? value : 0; //
             };
        }

        questConfig[id] = { //
            id: id, 
            name: q.任务名称, 
            description: q.任务描述 || '', // <<< (新增)
            target: q.任务条件.数量, 
            reward: q.任务奖励, 
            getProgress: getProgressFunction, 
            milestoneId: q.里程碑ID || null 
        };
     });
     console.log("任务已初始化:", questConfig); //
}

/**
 * 检查并应用传说物品掉率
 */
export function checkAndApplyLegendaryDropRates() { //
    try { //
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
    } catch (error) { //
         console.error("应用传说物品掉率时出错:", error); //
    }
}