/**
 * ==================================================================
 * core/gameState.js
 * (已修改：移除了 "relic" 装备槽)
 * (已修改：添加 collectibles 数组)
 * ==================================================================
 */

import { GAME_DATA } from '../data/game-rules.js'; //

// --- 默认游戏状态 ---
export const defaultGameState = { //
    proficiency: 0, //
    gold: 0, //

    equipment: { //
        "head": "starter_head",
        "neck": "starter_neck",
        "shoulder": "starter_shoulder",
        "back": "starter_back",
        "chest": "starter_chest",
        "shirt": "starter_shirt",
        "tabard": "starter_tabard",
        "wrist": "starter_wrist",
        "hands": "starter_hands",
        "waist": "starter_waist",
        "legs": "starter_legs",
        "feet": "starter_feet",
        "finger1": "starter_ring",
        "finger2": "starter_ring",
        "trinket1": "starter_trinket",
        "trinket2": "starter_trinket",
        "mainhand": "starter_mainhand",
        "offhand": "starter_offhand"
    },

    gearScore: 187, //

    badges: { //
        heroism: 0,
        valor: 0,
        conquest: 0,
        triumph: 0,
        frost: 0,
        abyssCrystal: 0
    },
    legendaryShards: { //
        atiyehsuide: 0,
        walanaiersuide: 0,
        lushichuanshuodesuide: 0,
        yingzhisuide: 0,
        shuangzhisuide: 0
    },
    legendaryItemsObtained: { //
        "埃提耶什·守护者的传说之杖": false,
        "瓦兰奈尔·远古王者之锤": false,
        "炉石传说·真尼玛好玩": false,
        "影之哀伤": false,
        "霜之哀伤": false
    },
    // --- (新增) 收藏品数组 ---
    collectibles: [], // (用于存放坐骑、传说物品等的 ItemID)
    
    // --- 跟踪里程碑任务 ---
    milestoneQuestsClaimed: {
        "gearScore_200": false,
        "gearScore_207": false
    },
    monstersKilled: 0, //
    bossesKilled: 0, //
    dungeons5p: [], //
    raids10p: [],   //
    raids25p: [],   //
    currentDungeon: null //
};

// --- 核心状态对象 ---
export let gameState = { ...defaultGameState }; //

// --- (已移除) 装备等级上限 ---

// --- 辅助工具函数 (保持不变) ---
export function isObject(item) { //
  return (item && typeof item === 'object' && !Array.isArray(item)); //
}
export function deepMerge(target, source) { //
  let output = Object.assign({}, target); //
  if (isObject(target) && isObject(source)) { //
    Object.keys(source).forEach(key => { //
      if (isObject(source[key])) { //
        if (!(key in target)) //
          Object.assign(output, { [key]: source[key] }); //
        else //
          output[key] = deepMerge(target[key], source[key]); //
      } else { //
        Object.assign(output, { [key]: source[key] }); //
      }
    });
  }
  return output; //
}