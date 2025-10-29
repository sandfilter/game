/**
 * ==================================================================
 * battle-config.js
 * (拆分自 battle.js)
 *
 * 职责:
 * 1. 存放 GAME_CONFIG (供战斗动画使用)。
 * 2. 存放 BATTLE_SPEED_MULTIPLIER (战斗速度)。
 * ==================================================================
 */

// 战斗速度倍率 (1.0 = 正常速度, 2.0 = 两倍速)
//
export const BATTLE_SPEED_MULTIPLIER = 4.0;

// --- 动画配置 ---
//
export const GAME_CONFIG = { 
    canvas: { width: 900, height: 600 }, //
    hero: { //
        baseCount: 10, //
        emojis: ["⚔️", "🛡️", "🧙", "🏹", "🪓", "🗡️", "🧝", "🤺", "🦸", "🧚"], //
        maxHp: 100, //
        speedRange: [2.0, 3.0], //
        attackSpeedRange: [0.8, 1.5], //
        damageRange: [5, 10], //
        size: 16, //
        colors: { healthy: '#66B3FF', injured: '#FFA500', critical: '#FF6347', dead: '#777777' } //
    }, 
    monsterScene: { //
        monsterCount: 7, //
        monsterEmojis: ["👹", "👺", "👻", "🤡", "🎃", "🐉", "🦇"], //
        monsterMaxHp: 100, //
        monsterDamage: 10, //
        monsterAttackInterval: 2000, //
        monsterSize: 16, //
        monsterAttackRange: 150, //
        eliteIndices: [3, 6], //
        eliteEmojis: ["👾", "🤖", "🦂", "🦑", "🐲"], //
        eliteMaxHp: 200, //
        eliteDamage: 15, //
        eliteSize: 24 //
    }, 
    bossScene: { //
        possibleHeroCounts: [5, 10, 25], //
        bossEmojis: ["👹", "🐉", "👾", "🤖"], //
        bossBaseHp: 1000, //
        bossHpPerHero: 60, //
        bossSize: 10, //
        bossAttackInterval: 2.5, //
        bossAttackRange: 220, //
        bossDamageBase: 20, //
        bossDamageExtra: 16, //
        bossDamageBonus: 10 //
    } 
};