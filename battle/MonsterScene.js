/**
 * ==================================================================
 * battle/MonsterScene.js
 * (已修改：将 gameLoop 从 setInterval 切换回 requestAnimationFrame)
 * (已修改：实现动态战斗速度和勇士属性)
 * (已修正：战斗速度公式)
 * (已修改：更新怪物HP计算公式)
 * (已修改：移除控制台日志)
 * (已修改：熟练度加速机制改为递减公式)
 * ==================================================================
 */

// (修正) 导入基础速度
import { GAME_CONFIG, BASE_BATTLE_SPEED_MULTIPLIER } from '../config/battle-config.js'; 

/**
 * 小怪战斗场景
 */
export class AnimatedMonsterSceneGame { //
    constructor(adventureGame, animationState) { //
        this.adventureGame = adventureGame; // (包含 masterGameState)
        this.animationState = animationState; //
        this.canvas = adventureGame.canvas; //
        this.ctx = adventureGame.ctx; //
        this.animationFrameId = null; //
        
        // --- 修改：为 rAF 绑定 this ---
        this.gameLoop = this.gameLoop.bind(this);
        
        this.resetGame(); //
        this.lastFrameTime = performance.now(); //
        this.startAnimation(); //
    } //
    
    /**
     * 修改：使用 requestAnimationFrame
     */
    startAnimation() { //
        // console.log("MonsterScene: Starting rAF loop."); // <<< (已注释)
        this.lastFrameTime = performance.now(); // 重置计时器
        this.animationFrameId = requestAnimationFrame(this.gameLoop); //
        this.adventureGame.setAnimationFrameId(this.animationFrameId); //
    } //
    
    /**
     * 修改：使用 cancelAnimationFrame
     */
    stopAnimation() { //
        if (this.animationFrameId) { //
            cancelAnimationFrame(this.animationFrameId); //
            // console.log("MonsterScene: Stopped rAF loop."); // <<< (已注释)
        }
        this.animationFrameId = null; //
    } //
    
    resetGame() { /* ... (保持不变) ... */ } //
    // (Implementation omitted)
    resetGame() { 
        this.gameOver = false; 
        this.battleStarted = false; 
        this.battleStartTime = 0; 
        this.currentTargetIndex = 0; 
        this.lastMonsterAttackTime = 0; 
        this.createHeroes(); 
        this.createMonsters(); 
    } 
    
    /**
     * (修改) 应用装备等级 (GS) 带来的属性加成
     */
    createHeroes() { 
        // --- (新增) 勇士属性加成 ---
        const gearScore = this.adventureGame.masterGameState?.gearScore ?? 187;
        const gearScoreBonus = Math.max(0, Math.floor(gearScore - 187));
        const finalMaxHp = GAME_CONFIG.hero.maxHp + gearScoreBonus;
        const finalBaseDamageRange = GAME_CONFIG.hero.damageRange;
        // --- 属性加成结束 ---

        if (this.animationState.heroes && this.animationState.heroes.length > 0) { 
            // 重置幸存者
            this.heroes = this.animationState.heroes.map(hero => ({ 
                ...hero, 
                hp: finalMaxHp, // (修改) 重置HP
                maxHp: finalMaxHp, // (修改) 更新MaxHP
                // (修改) 重新计算属性 (因为幸存者也应享受GS提升)
                speed: this.getRandomInRange(GAME_CONFIG.hero.speedRange), 
                attackSpeed: this.getRandomInRange(GAME_CONFIG.hero.attackSpeedRange), 
                damage: this.getRandomIntInRange(finalBaseDamageRange) + gearScoreBonus, // (修改) 
                
                // (重置位置)
                x: 10 + Math.random() * 200, y: this.canvas.height / 3 + (Math.random() - 0.5) * 100, 
                targetX: 0, targetY: 0, 
                inPosition: false, 
                wigglePhase: Math.random() * Math.PI * 2 
            })); 
        } else { 
            // 创建新英雄
            this.heroes = []; 
            for (let i = 0; i < this.animationState.heroCount; i++) { 
                this.heroes.push({ 
                    id: i, 
                    emoji: GAME_CONFIG.hero.emojis[Math.floor(Math.random() * GAME_CONFIG.hero.emojis.length)], 
                    x: 10 + i * 20, y: this.canvas.height / 3, 
                    targetX: 0, targetY: 0, 
                    hp: finalMaxHp, // (修改)
                    maxHp: finalMaxHp, // (修改)
                    speed: this.getRandomInRange(GAME_CONFIG.hero.speedRange), 
                    attackSpeed: this.getRandomInRange(GAME_CONFIG.hero.attackSpeedRange), 
                    damage: this.getRandomIntInRange(finalBaseDamageRange) + gearScoreBonus, // (修改)
                    inPosition: false, 
                    wigglePhase: Math.random() * Math.PI * 2, 
                    targetMonster: null 
                }); 
            } 
        } 
    } 

    /**
     * (已修改) 更新怪物HP计算公式
     */
    createMonsters() { 
        this.monsters = []; 
        const positions = [[-200, 0], [-100, -100], [0, -100], [100, 0], [200, 100], [300, 100], [400, 0]]; 
        const offsetX = this.canvas.width / 2 - 100; 
        const offsetY = this.canvas.height / 2; 
        
        const heroCount = this.animationState.heroCount;
        
        // --- (修改) HP计算 ---
        // 将 GAME_CONFIG 中的血量视为 5 人本的基础血量
        // (5/5 = 1.0x, 10/5 = 2.0x, 25/5 = 5.0x)
        const hpMultiplier = heroCount / 5; 
        // --- 修改结束 ---

        positions.map(([dx, dy]) => [offsetX + dx, offsetY + dy]).forEach(([x, y], index) => { 
            const isElite = GAME_CONFIG.monsterScene.eliteIndices.includes(index); 
            const baseHp = isElite ? GAME_CONFIG.monsterScene.eliteMaxHp : GAME_CONFIG.monsterScene.monsterMaxHp;
            
            // (修改) 应用新的 HP 乘数
            const finalHp = Math.floor(baseHp * hpMultiplier); 
            
            this.monsters.push({ 
                isElite, 
                x, y, 
                emoji: isElite ? GAME_CONFIG.monsterScene.eliteEmojis[Math.floor(Math.random() * GAME_CONFIG.monsterScene.eliteEmojis.length)] : GAME_CONFIG.monsterScene.monsterEmojis[Math.floor(Math.random() * GAME_CONFIG.monsterScene.monsterEmojis.length)], 
                hp: finalHp, 
                maxHp: finalHp, 
                size: isElite ? GAME_CONFIG.monsterScene.eliteSize : GAME_CONFIG.monsterScene.monsterSize, 
                damage: isElite ? GAME_CONFIG.monsterScene.eliteDamage : GAME_CONFIG.monsterScene.monsterDamage, 
                attackRange: GAME_CONFIG.monsterScene.monsterAttackRange 
            }); 
        }); 
    } 
    
    /**
     * (已修改：应用新的熟练度公式)
     */
    gameLoop(timestamp) { //
        // --- 修改：rAF DeltaTime 计算 ---
        let deltaTimeMs = timestamp - this.lastFrameTime; //
        this.lastFrameTime = timestamp; //
        let deltaTime = deltaTimeMs / (1000 / 60); 
        if (deltaTime > 10) {
            deltaTime = 1; // Cap delta time
        }

        // --- (修改) 应用动态战斗速度倍率（新公式） ---
        const proficiency = this.adventureGame.masterGameState?.proficiency ?? 0;
        
        // 新公式: ProficiencyBonus = (3 * proficiency) / (4000 + proficiency)
        const proficiencyBonus = (3 * proficiency) / (4000 + proficiency);
        const dynamicSpeedMultiplier = BASE_BATTLE_SPEED_MULTIPLIER + proficiencyBonus; // 基础速度 + 加成速度
        
        deltaTime *= dynamicSpeedMultiplier;
        // --- 速度修改结束 ---

        if (!this.gameOver) { //
            this.update(deltaTime); //
            this.render(); //
            
            this.animationFrameId = requestAnimationFrame(this.gameLoop); //
        } //
    } //
    
    /**
     * (已修改：应用新的熟练度公式)
     */
    update(deltaTime) { 
        if (!this.battleStarted) { 
            this.battleStarted = true; 
            this.battleStartTime = performance.now(); 
        } 
        while (this.currentTargetIndex < this.monsters.length && this.monsters[this.currentTargetIndex].hp <= 0) this.currentTargetIndex++; 
        const currentTarget = this.monsters[this.currentTargetIndex]; 
        this.heroes.forEach(hero => { 
            if (hero.hp <= 0) return; 
            if (currentTarget) { 
                hero.targetMonster = this.currentTargetIndex; 
                hero.targetX = currentTarget.x - 60; 
                hero.targetY = currentTarget.y; 
                const dx = hero.targetX - hero.x, dy = hero.targetY - hero.y, distance = Math.hypot(dx, dy); 
                if (distance > 15) { 
                    hero.inPosition = false; 
                    const moveDistance = Math.min(distance, hero.speed * deltaTime); 
                    hero.x += (dx / distance) * moveDistance; 
                    hero.y += (dy / distance) * moveDistance; 
                } else { 
                    hero.inPosition = true; 
                } 
            } else hero.targetMonster = null; 
        }); 
        const currentTime = performance.now(); 
        const attackChancePerFrame = 0.02; 
        const attackChancePerDelta = attackChancePerFrame * deltaTime;
        if (currentTarget && currentTarget.hp > 0) { 
            this.heroes.forEach(hero => { 
                if (hero.hp > 0 && hero.inPosition && hero.targetMonster === this.currentTargetIndex) { 
                    if (Math.random() < (attackChancePerDelta * hero.attackSpeed)) { 
                        currentTarget.hp = Math.max(0, currentTarget.hp - hero.damage); 
                    } 
                } 
            }); 
        } 
        
        // (修改) 动态计算速度
        const proficiency = this.adventureGame.masterGameState?.proficiency ?? 0;
        
        // 新公式: ProficiencyBonus = (3 * proficiency) / (4000 + proficiency)
        const proficiencyBonus = (3 * proficiency) / (4000 + proficiency);
        const speedMultiplier = BASE_BATTLE_SPEED_MULTIPLIER + proficiencyBonus; // <<< (修改)

        if (currentTarget && currentTarget.hp > 0 && currentTime - this.lastMonsterAttackTime > (GAME_CONFIG.monsterScene.monsterAttackInterval / speedMultiplier)) { 
            this.lastMonsterAttackTime = currentTime; 
            const nearbyHeroes = this.heroes.filter(hero => hero.hp > 0 && Math.hypot(hero.x - currentTarget.x, hero.y - currentTarget.y) < currentTarget.attackRange); 
            if (nearbyHeroes.length > 0) { 
                const targetHero = nearbyHeroes[Math.floor(Math.random() * nearbyHeroes.length)]; 
                targetHero.hp = Math.max(0, targetHero.hp - currentTarget.damage); 
            } 
        } 
        this.checkGameOver(); 
    } 
    
    checkGameOver() { /* ... (保持不变) ... */ } //
    // (Implementation omitted)
    checkGameOver() { 
        if (!this.battleStarted || this.gameOver) return; 
        const hasAliveHeroes = this.heroes.some(hero => hero.hp > 0); 
        const hasAliveMonsters = this.monsters.some(monster => monster.hp > 0); 
        if (!hasAliveHeroes || !hasAliveMonsters) { 
            this.gameOver = true; 
            this.adventureGame.handleSceneResult({ winner: hasAliveHeroes ? "勇士" : "怪物", survivors: this.heroes.filter(hero => hero.hp > 0), totalHeroes: this.heroes.length, battleTime: (performance.now() - this.battleStartTime) / 1000 }); 
        } 
    } 
    render() { /* ... (保持不变) ... */ } //
    // (Implementation omitted)
    render() { 
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); 
        this.monsters.forEach((monster, index) => { 
            const { x, y, hp, size, isElite, emoji } = monster; 
            let color = (hp > 0) ? ((index === this.currentTargetIndex) ? "yellow" : (isElite ? "red" : "orange")) : "#555"; 
            this.drawCharacter(hp > 0 ? emoji : "💀", x, y, size, color); 
            this.drawHealthBar(x - 50, y - 40, monster.hp, monster.maxHp, isElite ? "red" : "orange", isElite ? "精英" : "小怪"); 
        }); 
        this.heroes.forEach(hero => { 
            let displayX = hero.x, displayY = hero.y; 
            if (hero.inPosition && hero.hp > 0) { 
                displayX += Math.sin(hero.wigglePhase) * 3; 
                displayY += Math.cos(hero.wigglePhase * 1.3) * 3; 
                hero.wigglePhase += 0.05; 
            } 
            this.drawCharacter(hero.hp > 0 ? hero.emoji : "💀", displayX, displayY, GAME_CONFIG.hero.size, this.getHeroColor(hero)); 
            if (hero.hp > 0) this.drawHealthBar(hero.x - 25, hero.y - 30, hero.hp, hero.maxHp, "#2196F3"); 
        }); 
    } 
    drawCharacter(emoji, x, y, size, color) { /* ... (保持不变) ... */ } //
    // (Implementation omitted)
    drawCharacter(emoji, x, y, size, color) { 
        this.ctx.font = `${size}px Arial`; 
        this.ctx.fillStyle = color; 
        this.ctx.textAlign = "center"; 
        this.ctx.textBaseline = "middle"; 
        this.ctx.fillText(emoji, x, y); 
    } 
    drawHealthBar(x, y, current, maxHp, color, label = "") { /* ... (保持不变) ... */ } //
    // (Implementation omitted)
    drawHealthBar(x, y, current, maxHp, color, label = "") { 
        const width = label ? 100 : 50, height = label ? 10 : 6, ratio = current / maxHp; 
        this.ctx.fillStyle = "#333"; 
        this.ctx.fillRect(x, y, width, height); 
        this.ctx.fillStyle = color; 
        this.ctx.fillRect(x, y, width * ratio, height); 
        this.ctx.strokeStyle = "#AAA"; 
        this.ctx.strokeRect(x, y, width, height); 
        if (label) { 
            this.ctx.fillStyle = "white"; 
            this.ctx.font = "12px Arial"; 
            this.ctx.textAlign = "center"; 
            this.ctx.textBaseline = "bottom"; 
            this.ctx.fillText(label, x + width / 2, y - 2); 
        } 
    } 
    getHeroColor(hero) { /* ... (保持不变) ... */ } //
    // (Implementation omitted)
    getHeroColor(hero) { 
        const hpRatio = hero.hp / hero.maxHp; 
        return hero.hp <= 0 ? GAME_CONFIG.hero.colors.dead : hpRatio > 0.6 ? GAME_CONFIG.hero.colors.healthy : hpRatio > 0.3 ? GAME_CONFIG.hero.colors.injured : hpRatio > 0.3 ? GAME_CONFIG.hero.colors.injured : GAME_CONFIG.hero.colors.critical;
    } 
    getRandomInRange(range) { /* ... (保持不变) ... */ } //
    // (Implementation omitted)
    getRandomInRange(range) { 
        return range[0] + Math.random() * (range[1] - range[0]); 
    } 
    getRandomIntInRange(range) { /* ... (保持不变) ... */ } //
    // (Implementation omitted)
    getRandomIntInRange(range) { 
        return range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1)); 
    } 
}