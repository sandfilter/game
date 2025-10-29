/**
 * ==================================================================
 * battle/MonsterScene.js
 * (拆分自 battle-animation.js)
 *
 * 职责:
 * 1. 包含 AnimatedMonsterSceneGame 类。
 * 2. 处理所有小怪场景的动画和战斗逻辑。
 * ==================================================================
 */

import { GAME_CONFIG, BATTLE_SPEED_MULTIPLIER } from '../config/battle-config.js';

/**
 * 小怪战斗场景
 * (已修改：后台运行 + HP缩放 + 攻击逻辑)
 *
 */
export class AnimatedMonsterSceneGame { //
    constructor(adventureGame, animationState) { //
        this.adventureGame = adventureGame; //
        this.animationState = animationState; //
        this.canvas = adventureGame.canvas; //
        this.ctx = adventureGame.ctx; //
        this.animationFrameId = null; // (将存储 Interval ID)
        this.resetGame(); //
        this.lastFrameTime = performance.now(); //
        this.startAnimation(); //
    } //
    
    // ⬇️ MODIFIED: 替换为 setInterval ⬇️
    startAnimation() { //
        this.animationFrameId = setInterval(() => { //
            const timestamp = performance.now(); // 手动获取时间戳
            this.gameLoop(timestamp); //
        }, 1000 / 60); // 尝试以 60fps 运行
        
        this.adventureGame.setAnimationFrameId(this.animationFrameId); //
    } //
    // ⬇️ MODIFIED: 替换为 clearInterval ⬇️
    stopAnimation() { //
        if (this.animationFrameId) clearInterval(this.animationFrameId); //
        this.animationFrameId = null; //
    } //
    
    resetGame() { //
        this.gameOver = false; //
        this.battleStarted = false; //
        this.battleStartTime = 0; //
        this.currentTargetIndex = 0; //
        this.lastMonsterAttackTime = 0; //
        this.createHeroes(); //
        this.createMonsters(); //
    } //
    createHeroes() { //
        if (this.animationState.heroes && this.animationState.heroes.length > 0) { //
            this.heroes = this.animationState.heroes.map(hero => ({ ...hero, hp: GAME_CONFIG.hero.maxHp, x: 10 + Math.random() * 200, y: this.canvas.height / 3 + (Math.random() - 0.5) * 100, targetX: 0, targetY: 0, inPosition: false, wigglePhase: Math.random() * Math.PI * 2 })); //
        } else { //
            this.heroes = []; //
            for (let i = 0; i < this.animationState.heroCount; i++) { //
                this.heroes.push({ id: i, emoji: GAME_CONFIG.hero.emojis[Math.floor(Math.random() * GAME_CONFIG.hero.emojis.length)], x: 10 + i * 20, y: this.canvas.height / 3, targetX: 0, targetY: 0, hp: GAME_CONFIG.hero.maxHp, maxHp: GAME_CONFIG.hero.maxHp, speed: this.getRandomInRange(GAME_CONFIG.hero.speedRange), attackSpeed: this.getRandomInRange(GAME_CONFIG.hero.attackSpeedRange), damage: this.getRandomIntInRange(GAME_CONFIG.hero.damageRange), inPosition: false, wigglePhase: Math.random() * Math.PI * 2, targetMonster: null }); //
            } //
        } //
    } //
    
    // ⬇️ MODIFIED: 增加了基于副本规模的 HP 缩放 ⬇️
    createMonsters() { //
        this.monsters = []; //
        const positions = [[-200, 0], [-100, -100], [0, -100], [100, 0], [200, 100], [300, 100], [400, 0]]; //
        const offsetX = this.canvas.width / 2 - 100; //
        const offsetY = this.canvas.height / 2; //

        // === ⬇️ 新增：获取副本规模并定义血量倍率 ⬇️ ===
        const heroCount = this.animationState.heroCount; //
        let hpMultiplier = 1.0; // 默认倍率 (5人本)
        
        if (heroCount === 10) { //
            hpMultiplier = 1.5; // 10人本血量倍率
        } else if (heroCount === 25) { //
            hpMultiplier = 3.0; // 25人本血量倍率
        }
        // === ⬆️ 新增结束 ⬆️ ===

        positions.map(([dx, dy]) => [offsetX + dx, offsetY + dy]).forEach(([x, y], index) => { //
            const isElite = GAME_CONFIG.monsterScene.eliteIndices.includes(index); //
            
            // === ⬇️ 修改：计算动态血量 ⬇️ ===
            const baseHp = isElite ? GAME_CONFIG.monsterScene.eliteMaxHp : GAME_CONFIG.monsterScene.monsterMaxHp; //
            const finalHp = Math.floor(baseHp * hpMultiplier); // 应用倍率并取整
            // === ⬆️ 修改结束 ⬆️ ===

            this.monsters.push({ //
                isElite, //
                x, y, //
                emoji: isElite ? GAME_CONFIG.monsterScene.eliteEmojis[Math.floor(Math.random() * GAME_CONFIG.monsterScene.eliteEmojis.length)] : GAME_CONFIG.monsterScene.monsterEmojis[Math.floor(Math.random() * GAME_CONFIG.monsterScene.monsterEmojis.length)], //
                
                // === ⬇️ 修改：使用动态血量 ⬇️ ===
                hp: finalHp, //
                maxHp: finalHp, //
                // === ⬆️ 修改结束 ⬆️ ===

                size: isElite ? GAME_CONFIG.monsterScene.eliteSize : GAME_CONFIG.monsterScene.monsterSize, //
                damage: isElite ? GAME_CONFIG.monsterScene.eliteDamage : GAME_CONFIG.monsterScene.monsterDamage, //
                attackRange: GAME_CONFIG.monsterScene.monsterAttackRange //
            }); //
        }); //
    } //
    
    // ⬇️ MODIFIED: 应用 BATTLE_SPEED_MULTIPLIER ⬇️
    gameLoop(timestamp) { //
        let deltaTime = (timestamp - this.lastFrameTime) / 16.67; //
        this.lastFrameTime = timestamp; //

        // === ⬇️ MODIFIED: 应用战斗速度倍率 ⬇️ ===
        deltaTime *= (typeof BATTLE_SPEED_MULTIPLIER !== 'undefined' ? BATTLE_SPEED_MULTIPLIER : 1.0); //
        // === ⬆️ MODIFIED END ⬆️ ===

        if (!this.gameOver) { //
            this.update(deltaTime); //
            this.render(); //
        } //
    } //
    
    // ⬇️ MODIFIED: 修改了英雄攻击逻辑 + 小怪攻击间隔 ⬇️
    update(deltaTime) { //
        if (!this.battleStarted) { //
            this.battleStarted = true; //
            this.battleStartTime = performance.now(); //
        } //
        while (this.currentTargetIndex < this.monsters.length && this.monsters[this.currentTargetIndex].hp <= 0) this.currentTargetIndex++; //
        const currentTarget = this.monsters[this.currentTargetIndex]; //
        
        this.heroes.forEach(hero => { //
            if (hero.hp <= 0) return; //
            if (currentTarget) { //
                hero.targetMonster = this.currentTargetIndex; //
                hero.targetX = currentTarget.x - 60; //
                hero.targetY = currentTarget.y; //
                const dx = hero.targetX - hero.x, dy = hero.targetY - hero.y, distance = Math.hypot(dx, dy); //
                if (distance > 15) { //
                    hero.inPosition = false; //
                    const moveDistance = Math.min(distance, hero.speed * deltaTime); //
                    hero.x += (dx / distance) * moveDistance; //
                    hero.y += (dy / distance) * moveDistance; //
                } else { //
                    hero.inPosition = true; //
                } //
            } else hero.targetMonster = null; //
        }); //

        const currentTime = performance.now(); //

        // === ⬇️ 修改：将基于“帧”的攻击 转换为 基于“时间”的攻击 ⬇️ ===
        const attackChancePerFrame = 0.02; // 这是原代码的概率
        const attackChancePerDelta = attackChancePerFrame * deltaTime; //
        // === ⬆️ 修改结束 ⬆️ ===

        if (currentTarget && currentTarget.hp > 0) { //
            this.heroes.forEach(hero => { //
                if (hero.hp > 0 && hero.inPosition && hero.targetMonster === this.currentTargetIndex) { //
                    
                    // ⬇️ 修改这行：使用新的概率 ⬇️
                    if (Math.random() < (attackChancePerDelta * hero.attackSpeed)) { //
                        currentTarget.hp = Math.max(0, currentTarget.hp - hero.damage); //
                    } //
                } //
            }); //
        } //

        // === ⬇️ MODIFIED: 应用倍率来缩短小怪攻击间隔 ⬇️ ===
        const speedMultiplier = (typeof BATTLE_SPEED_MULTIPLIER !== 'undefined' ? BATTLE_SPEED_MULTIPLIER : 1.0); //
        if (currentTarget && currentTarget.hp > 0 && currentTime - this.lastMonsterAttackTime > (GAME_CONFIG.monsterScene.monsterAttackInterval / speedMultiplier)) { //
            this.lastMonsterAttackTime = currentTime; //
            const nearbyHeroes = this.heroes.filter(hero => hero.hp > 0 && Math.hypot(hero.x - currentTarget.x, hero.y - currentTarget.y) < currentTarget.attackRange); //
            if (nearbyHeroes.length > 0) { //
                const targetHero = nearbyHeroes[Math.floor(Math.random() * nearbyHeroes.length)]; //
                targetHero.hp = Math.max(0, targetHero.hp - currentTarget.damage); //
            } //
        } //
        this.checkGameOver(); //
    } //

    checkGameOver() { //
        if (!this.battleStarted || this.gameOver) return; //
        const hasAliveHeroes = this.heroes.some(hero => hero.hp > 0); //
        const hasAliveMonsters = this.monsters.some(monster => monster.hp > 0); //
        if (!hasAliveHeroes || !hasAliveMonsters) { //
            this.gameOver = true; //
            this.adventureGame.handleSceneResult({ winner: hasAliveHeroes ? "勇士" : "怪物", survivors: this.heroes.filter(hero => hero.hp > 0), totalHeroes: this.heroes.length, battleTime: (performance.now() - this.battleStartTime) / 1000 }); //
        } //
    } //
    render() { //
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); //
        this.monsters.forEach((monster, index) => { //
            const { x, y, hp, size, isElite, emoji } = monster; //
            let color = (hp > 0) ? ((index === this.currentTargetIndex) ? "yellow" : (isElite ? "red" : "orange")) : "#555"; //
            this.drawCharacter(hp > 0 ? emoji : "💀", x, y, size, color); //
            this.drawHealthBar(x - 50, y - 40, monster.hp, monster.maxHp, isElite ? "red" : "orange", isElite ? "精英" : "小怪"); //
        }); //
        this.heroes.forEach(hero => { //
            let displayX = hero.x, displayY = hero.y; //
            if (hero.inPosition && hero.hp > 0) { //
                displayX += Math.sin(hero.wigglePhase) * 3; //
                displayY += Math.cos(hero.wigglePhase * 1.3) * 3; //
                hero.wigglePhase += 0.05; //
            } //
            this.drawCharacter(hero.hp > 0 ? hero.emoji : "💀", displayX, displayY, GAME_CONFIG.hero.size, this.getHeroColor(hero)); //
            if (hero.hp > 0) this.drawHealthBar(hero.x - 25, hero.y - 30, hero.hp, hero.maxHp, "#2196F3"); //
        }); //
    } //
    drawCharacter(emoji, x, y, size, color) { //
        this.ctx.font = `${size}px Arial`; //
        this.ctx.fillStyle = color; //
        this.ctx.textAlign = "center"; //
        this.ctx.textBaseline = "middle"; //
        this.ctx.fillText(emoji, x, y); //
    } //
    drawHealthBar(x, y, current, maxHp, color, label = "") { //
        const width = label ? 100 : 50, height = label ? 10 : 6, ratio = current / maxHp; //
        this.ctx.fillStyle = "#333"; //
        this.ctx.fillRect(x, y, width, height); //
        this.ctx.fillStyle = color; //
        this.ctx.fillRect(x, y, width * ratio, height); //
        this.ctx.strokeStyle = "#AAA"; //
        this.ctx.strokeRect(x, y, width, height); //
        if (label) { //
            this.ctx.fillStyle = "white"; //
            this.ctx.font = "12px Arial"; //
            this.ctx.textAlign = "center"; //
            this.ctx.textBaseline = "bottom"; //
            this.ctx.fillText(label, x + width / 2, y - 2); //
        } //
    } //
    getHeroColor(hero) { //
        const hpRatio = hero.hp / hero.maxHp; //
        return hero.hp <= 0 ? GAME_CONFIG.hero.colors.dead : hpRatio > 0.6 ? GAME_CONFIG.hero.colors.healthy : hpRatio > 0.3 ? GAME_CONFIG.hero.colors.injured : GAME_CONFIG.hero.colors.critical; //
    } //
    getRandomInRange(range) { //
        return range[0] + Math.random() * (range[1] - range[0]); //
    } //
    getRandomIntInRange(range) { //
        return range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1)); //
    } //
}