/**
 * ==================================================================
 * core/gameState.js
 * (已修改：移除重复的 isObject 和 deepMerge 函数定义)
 * ==================================================================
 */

// Import only needed parts if rules are used elsewhere in this file (currently not)
import { GAME_DATA } from '../data/game-rules.js'; // Keep for FINAL_GEAR_CAP calculation


// --- 默认游戏状态 ---
// Define EXACTLY what a new game should start with here.
export const defaultGameState = { //
    proficiency: 0, //
    gearScore: 200, // Starting gear score
    gold: 99999,        // Starting gold
    // --- Set desired STARTING badge counts ---
    badges: { //
        heroism: 99, // Example: Start with 0
        valor: 99, //
        conquest: 99, //
        triumph: 99, //
        frost: 99 //
        // If you wanted 99: heroism: 99, valor: 99, etc.
    },
    // --- Set desired STARTING shard counts ---
    legendaryShards: { //
        atiyehsuide: 99, // Example: Start with 0
        walanaiersuide: 99, //
        lushichuanshuodesuide: 99, //
        yingzhisuide: 99, //
        shuangzhisuide: 99 //
        // If you wanted 99: atiyehsuide: 99, walanaiersuide: 99, etc.
    },
    legendaryItemsObtained: { //
        "埃提耶什·守护者的传说之杖": false, //
        "瓦兰奈尔·远古王者之锤": false, //
        "炉石传说·真尼玛好玩": false, //
        "影之哀伤": false, //
        "霜之哀伤": false //
    },
    monstersKilled: 0, //
    bossesKilled: 0, //
    dungeons5p: [], // Always start empty, populated later
    raids10p: [],   // Always start empty, populated later
    raids25p: [],   // Always start empty, populated later
    currentDungeon: null //
};

// --- 核心状态对象 ---
export let gameState = { ...defaultGameState }; // Initial state before loading

// --- 装备等级上限 (Still requires GAME_DATA.游戏数据) ---
const gearCaps = Object.values(GAME_DATA.游戏数据.阶段数据).map(d => d.装备等级上限); //
export const FINAL_GEAR_CAP = Math.max(...gearCaps); //


// --- 辅助工具函数 ---
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

// --- REMOVED DUPLICATE DEFINITIONS ---
/*
export function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}
export function deepMerge(target, source) {
  // ... Implementation ...
}
*/