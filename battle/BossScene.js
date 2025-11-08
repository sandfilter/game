/**
 * ==================================================================
 * battle/BossScene.js
 * (已修改：将 gameLoop 从 setInterval 切换回 requestAnimationFrame)
 * (已修改：实现动态战斗速度和勇士属性)
 * (已修正：战斗速度公式)
 * (已修改：更新BOSS HP计算公式，使用线性和难度等级)
 * (已修改：移除控制台日志)
 * (已修改：熟练度加速机制改为递减公式)
 * (已修改：降低 5 人本 BOSS 血量 50%)
 * (已修改：降低 5 人本 BOSS 攻击力 40%)
 * (已修改：将点击伤害从画布移至按钮，并使伤害数字更醒目)
 * ==================================================================
 */

// (修正) 导入基础速度
import { GAME_CONFIG, BASE_BATTLE_SPEED_MULTIPLIER } from '../config/battle-config.js'; 

const clickDamageValue = 100; //

/**
 * Boss 战斗场景
 */
export class AnimatedBossSceneGame { //
    constructor(adventureGame, animationState, currentBossData) { //
        this.adventureGame = adventureGame; // (包含 masterGameState)
        this.animationState = animationState; //
        this.canvas = adventureGame.canvas; //
        this.ctx = adventureGame.ctx; //
        this.currentBossData = currentBossData || { 名称: "未知BOSS" }; //
        this.animationFrameId = null; //
        this.clickBtn = document.getElementById('bossClickBtn'); // (新增) 获取按钮

        // (修改) 绑定到按钮点击事件
        this.handleBtnClick = this.handleBtnClick.bind(this); 
        this.floatingTexts = []; //
        
        // --- 修改：为 rAF 绑定 this ---
        this.animationLoop = this.animationLoop.bind(this);

        this.initGame(); //
        this.startAnimation(); //
    } //
    
    /**
     * 修改：使用 requestAnimationFrame
     */
    startAnimation() { //
        // console.log("BossScene: Starting rAF loop."); // <<< (已注释)
        this.lastFrameTime = performance.now(); // 重置计时器
        this.animationFrameId = requestAnimationFrame(this.animationLoop); //
        this.adventureGame.setAnimationFrameId(this.animationFrameId); //

        // (修改) 显示按钮并绑定事件
        if (this.clickBtn) {
            this.clickBtn.style.display = 'block';
            this.clickBtn.addEventListener('click', this.handleBtnClick);
        }
    } //
    
    /**
     * 修改：使用 cancelAnimationFrame
     */
    stopAnimation() { //
        if (this.animationFrameId) { //
            cancelAnimationFrame(this.animationFrameId); //
            // console.log("BossScene: Stopped rAF loop."); // <<< (已注释)
        }
        this.animationFrameId = null; //

        // (修改) 隐藏按钮并解绑事件
        if (this.clickBtn) {
            this.clickBtn.style.display = 'none';
            this.clickBtn.removeEventListener('click', this.handleBtnClick);
        }
        this.floatingTexts = []; //
    } //
    
    /**
     * (已修改) 更新BOSS HP计算公式
     */
    initGame() { 
        this.heroCount = (this.animationState.heroes && this.animationState.heroes.length > 0) ? this.animationState.heroes.length : this.animationState.heroCount; 
        
        // --- (修改) HP 计算 ---
        const size = this.heroCount;
        // 从 dungeon-data.js 获取难度等级
        const difficulty = this.currentBossData.难度等级 || 1;
        let difficultyMultiplier = 1.0;
        
        // 定义难度系数 (1级=1.0x, 2级=1.25x, 3级=1.5x)
        if (difficulty === 2) difficultyMultiplier = 1.25;
        if (difficulty === 3) difficultyMultiplier = 1.5;
        if (difficulty === 4) difficultyMultiplier = 1.75; // (新增) 奥杜尔难度
        if (difficulty === 5) difficultyMultiplier = 2.0;  // (新增) 奥杜尔难度

        const baseHp = GAME_CONFIG.bossScene.bossBaseHp; 
        
        // 按规模线性缩放
        const scaledHp = (baseHp / 5) * size; 
        
        // --- (新增) 5人本特殊减伤 ---
        let reductionFactor = 1.0;
        if (size === 5) {
            reductionFactor = 0.5; // 5人本 BOSS 血量减半
        }
        
        this.bossMaxHp = Math.floor(scaledHp * difficultyMultiplier * reductionFactor); // 应用难度系数和减伤
        // --- 修改结束 ---

        this.battleStarted = false; 
        this.battleStartTime = 0; 
        this.lastBossAttack = 0; 
        this.bossAttackInterval = GAME_CONFIG.bossScene.bossAttackInterval; 
        this.gameOver = false; 
        this.lastBossDamageTime = 0; 
        this.bossAttacks = []; 
        this.createHeroes(); 
        this.createBoss(); 
        this.setupSurroundPositions(); 
        this.lastFrameTime = performance.now();
    } 

    // (修改) 新的按钮点击处理函数
    handleBtnClick() { 
        if (!this.boss || this.boss.hp <= 0 || this.gameOver) { 
            return;
        }
        // console.log(`Boss clicked via button! Dealing ${clickDamageValue} damage.`); 
        this.boss.hp = Math.max(0, this.boss.hp - clickDamageValue); 
        this.lastBossDamageTime = Date.now() / 1000; 
        
        // 在 BOSS 位置生成浮动文字 (使用更大的字体和醒目的颜色)
        this.floatingTexts.push({ 
            value: clickDamageValue, 
            x: this.boss.x + (Math.random() - 0.5) * 30, 
            y: this.boss.y - 60 + (Math.random() - 0.5) * 20,
            alpha: 1.0, 
            life: 0.8, // 缩短飘字时间使其更紧凑
            color: '#ffcc00', // 金黄色
            fontSize: '36px', // 更大的字体
            isCrit: true // 标记为暴击样式 (可选，用于未来扩展)
        });
    }

    /**
     * (修改) 应用装备等级 (GS) 带来的属性加成
     */
    createHeroes() { 
        // --- (新增) 勇士属性加成 ---
        const gearScore = this.adventureGame.masterGameState?.gearScore ?? 187;
        const gearScoreBonus = Math.max(0, Math.floor(gearScore - 187));
        const finalMaxHp = GAME_CONFIG.hero.maxHp + gearScoreBonus;
        // (BossScene 使用 GAME_CONFIG.hero.damageRange [5, 10])
        const finalBaseDamageRange = GAME_CONFIG.hero.damageRange; 
        // --- 属性加成结束 ---

        if (this.animationState.heroes && this.animationState.heroes.length > 0) { 
            // 重置幸存者
            this.heroes = this.animationState.heroes.map((hero, i) => ({ 
                ...hero, 
                hp: finalMaxHp, // (修改) 重置HP
                maxHp: finalMaxHp, // (修改) 更新MaxHP
                
                // (修改) 重新计算属性 (因为幸存者也应享受GS提升)
                speed: Math.random() * 1 + 2.0, // (BossScene 使用自己的速度范围)
                attackSpeed: Math.random() * 0.7 + 0.8, // (BossScene 使用自己的AS范围)
                damage: this.getRandomIntInRange(finalBaseDamageRange) + gearScoreBonus, // (修改)
                
                // (重置位置)
                x: Math.random() * 250 + 50, y: Math.random() * 500 + 50, 
                targetX: 0, targetY: 0, 
                inPosition: false, 
                wigglePhase: Math.random() * 6.28 
            })); 
        } else { 
            // 创建新英雄
            this.heroes = Array.from({ length: this.heroCount }, (_, i) => ({ 
                emoji: GAME_CONFIG.hero.emojis[Math.floor(Math.random() * GAME_CONFIG.hero.emojis.length)], 
                x: Math.random() * 250 + 50, y: Math.random() * 500 + 50, 
                targetX: 0, targetY: 0, 
                hp: finalMaxHp, // (修改)
                maxHp: finalMaxHp, // (修改)
                speed: Math.random() * 1 + 2.0, 
                attackSpeed: Math.random() * 0.7 + 0.8, 
                damage: this.getRandomIntInRange(finalBaseDamageRange) + gearScoreBonus, // (修改)
                id: i, 
                inPosition: false, 
                wigglePhase: Math.random() * 6.28 
            })); 
        } 
    } 

    createBoss() { /* ... (保持不变) ... */ } //
    // (Implementation omitted)
    createBoss() { 
        const emoji = GAME_CONFIG.bossScene.bossEmojis[Math.floor(Math.random() * GAME_CONFIG.bossScene.bossEmojis.length)];
        
        // 1. 基础伤害
        let baseDamage = Math.floor(Math.random() * GAME_CONFIG.bossScene.bossDamageExtra) + GAME_CONFIG.bossScene.bossDamageBase;

        // 2. 团队规模奖励 (保留原有逻辑: heroCount > 10)
        if (this.heroCount > 10) {
             baseDamage += GAME_CONFIG.bossScene.bossDamageBonus;
        }

        // 3. (新增) 5人本攻击力减免
        if (this.heroCount === 5) {
            // 降低 40% 的伤害
            baseDamage = Math.floor(baseDamage * 0.6); 
        }

        this.boss = {
            ...this.currentBossData,
            emoji: emoji, 
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            hp: this.bossMaxHp,
            maxHp: this.bossMaxHp,
            size: GAME_CONFIG.bossScene.bossSize, 
            damage: Math.max(1, baseDamage), // 确保伤害至少为 1
            attackRange: GAME_CONFIG.bossScene.bossAttackRange, 
            active: false,
            shakeOffsetX: 0,
            shakeOffsetY: 0
         };
         this.boss.名称 = this.boss.名称 || "未知BOSS";
         this.boss.语录 = this.boss.语录 || "";
    }
    setupSurroundPositions() { /* ... (保持不变) ... */ } //
    // (Implementation omitted)
    setupSurroundPositions() { 
        let radius = this.heroCount === 10 ? 160 : this.heroCount === 25 ? 200 : 140; 
        this.heroes.forEach((hero, i) => { 
            const angle = 2 * Math.PI * i / this.heroes.length; 
            hero.targetX = this.boss.x + radius * Math.cos(angle); 
            hero.targetY = this.boss.y + radius * Math.sin(angle); 
        }); 
    } 
    
    /**
     * (已修改：应用新的熟练度公式)
     */
    animationLoop(timestamp) { //
        if (!this.gameOver) { //
            let deltaTimeMs = timestamp - this.lastFrameTime; //
            this.lastFrameTime = timestamp; //
            let deltaTime = deltaTimeMs / (1000 / 60); //
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


            this.updatePositions(deltaTime); //
            this.updateBattle(deltaTime); //
            this.updateFloatingTexts(deltaTime); //
            this.drawCharacters(); //
            this.drawFloatingTexts(); //
            this.checkGameOver(); //
            
            this.animationFrameId = requestAnimationFrame(this.animationLoop); //
        } //
    } //
    
    updatePositions(deltaTime) { /* ... (保持不变) ... */ } //
    // (Implementation omitted)
    updatePositions(deltaTime) { 
        let allInPosition = true; 
        this.heroes.forEach(hero => { 
            if (hero.hp <= 0) return; 
            const dx = hero.targetX - hero.x, dy = hero.targetY - hero.y, distance = Math.hypot(dx, dy); 
            if (distance > 15) { 
                allInPosition = false; 
                const moveDist = Math.min(distance, hero.speed * deltaTime); 
                hero.x += dx / distance * moveDist; 
                hero.y += dy / distance * moveDist; 
            } else hero.inPosition = true; 
        }); 
        if (!this.battleStarted && this.heroes.some(h => h.inPosition && h.hp > 0)) { 
            this.battleStarted = true; 
            this.battleStartTime = Date.now() / 1000; 
            this.boss.active = true; 
        } 
    } 

    /**
     * (已修改：应用新的熟练度公式)
     */
    updateBattle(deltaTime) { 
        if (!this.battleStarted) return; 
        const currentTime = Date.now() / 1000; 
        const attackChancePerFrame = 0.02; 
        const attackChancePerDelta = attackChancePerFrame * deltaTime; 
        this.heroes.forEach(hero => { 
            if (hero.hp > 0 && hero.inPosition && Math.hypot(hero.x - this.boss.x, hero.y - this.boss.y) < this.boss.attackRange) { 
                if (Math.random() < (attackChancePerDelta * hero.attackSpeed)) { 
                    const damageDealt = hero.damage; 
                    this.boss.hp = Math.max(0, this.boss.hp - damageDealt); 
                    this.lastBossDamageTime = currentTime; 
                }
            } 
        }); 

        // (修改) 动态计算速度
        const proficiency = this.adventureGame.masterGameState?.proficiency ?? 0; 
        
        // 新公式: ProficiencyBonus = (3 * proficiency) / (4000 + proficiency)
        const proficiencyBonus = (3 * proficiency) / (4000 + proficiency);
        const speedMultiplier = BASE_BATTLE_SPEED_MULTIPLIER + proficiencyBonus; // <<< (修改)

        if (this.boss.active && this.boss.hp > 0 && currentTime - this.lastBossAttack > (this.bossAttackInterval / speedMultiplier)) { 
            this.lastBossAttack = currentTime; 
            const aliveHeroes = this.heroes.filter(h => h.hp > 0 && h.inPosition); 
            if (aliveHeroes.length > 0) { 
                const targetCount = Math.min(this.heroCount > 10 ? 5 : 3, aliveHeroes.length); 
                const targets = [...aliveHeroes].sort(() => 0.5 - Math.random()).slice(0, targetCount); 
                targets.forEach(hero => { 
                    this.bossAttacks.push({ startTime: currentTime, duration: 0.6, startX: this.boss.x, startY: this.boss.y, targetX: hero.x, targetY: hero.y }); 
                    setTimeout(() => { 
                        hero.hp = Math.max(0, hero.hp - this.boss.damage / targetCount); 
                    }, 300); 
                }); 
            } 
        } 
    } 
    // (修改) 更新浮动文字，支持自定义字体大小
    updateFloatingTexts(deltaTime) { 
        this.floatingTexts = this.floatingTexts.filter(text => { 
            text.y -= 15 * deltaTime; 
            text.alpha -= (1.0 / text.life) * deltaTime; 
            text.life -= deltaTime; 
            return text.life > 0 && text.alpha > 0; 
        }); 
    } 
    checkGameOver() { /* ... (保持不变) ... */ } //
    // (Implementation omitted)
    checkGameOver() { 
        if (!this.battleStarted || this.gameOver) return; 
        const aliveHeroes = this.heroes.filter(h => h.hp > 0).length; 
        if (aliveHeroes === 0 || this.boss.hp <= 0) { 
            this.gameOver = true; 
            this.adventureGame.handleSceneResult({ winner: this.boss.hp <= 0 ? "勇士" : "BOSS", survivors: this.heroes.filter(hero => hero.hp > 0), totalHeroes: this.heroes.length, battleTime: (Date.now() / 1000 - this.battleStartTime) }); 
        } 
    } 
    drawCharacters() { /* ... (保持不变) ... */ } //
    // (Implementation omitted)
    drawCharacters() { 
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); 
        this.drawBossAttacks(); 
        const bossSize = 16 * this.boss.size; 
        const bossShakeX = (Date.now() / 1000 - this.lastBossDamageTime < 0.2) ? (Math.random() - 0.5) * 10 : 0; 
        const bossShakeY = (Date.now() / 1000 - this.lastBossDamageTime < 0.2) ? (Math.random() - 0.5) * 10 : 0; 
        this.drawCharacter(
            this.boss.hp > 0 ? this.boss.emoji : "💀",
            this.boss.x + bossShakeX,
            this.boss.y + bossShakeY,
            bossSize,
            "red"
        ); 
        this.drawHealthBar(
            this.boss.x - 100,
            this.boss.y - 120,
            this.boss.hp,
            this.boss.maxHp,
            "red",
            this.currentBossData.名称 
        ); 
        this.heroes.forEach(hero => { 
            let wiggleX = 0, wiggleY = 0; 
            if (hero.inPosition && hero.hp > 0) { 
                wiggleX = Math.sin(hero.wigglePhase) * 3; 
                wiggleY = Math.cos(hero.wigglePhase * 1.3) * 3; 
                hero.wigglePhase += 0.05; 
            } 
            this.drawCharacter(hero.hp > 0 ? hero.emoji : "💀", hero.x + wiggleX, hero.y + wiggleY, 16, this.getHeroColor(hero)); 
            if (hero.hp > 0) this.drawHealthBar(hero.x - 25, hero.y - 30, hero.hp, hero.maxHp, "blue"); 
        }); 
    } 
    // (修改) 支持自定义字体大小
    drawFloatingTexts() { 
        this.floatingTexts.forEach(text => { 
            this.ctx.save(); 
            this.ctx.globalAlpha = Math.max(0, text.alpha); 
            // 使用自定义字体大小，默认为 24px
            this.ctx.font = `bold ${text.fontSize || '24px'} Arial`; 
            this.ctx.fillStyle = text.color; 
            this.ctx.textAlign = 'center'; 
            this.ctx.textBaseline = 'middle'; 
            this.ctx.shadowColor = 'black';
            this.ctx.shadowBlur = 2;
            this.ctx.shadowOffsetX = 1;
            this.ctx.shadowOffsetY = 1;
            this.ctx.fillText(`-${text.value}`, text.x, text.y); 
            this.ctx.restore(); 
        }); 
    } 
    drawBossAttacks() { /* ... (保持不变) ... */ } //
    // (Implementation omitted)
    drawBossAttacks() { 
        const currentTime = Date.now() / 1000; 
        this.bossAttacks = this.bossAttacks.filter(attack => { 
            const progress = (currentTime - attack.startTime) / attack.duration; 
            if (progress < 1) { 
                const x = attack.startX + (attack.targetX - attack.startX) * progress; 
                const y = attack.startY + (attack.targetY - attack.startY) * progress; 
                this.drawCharacter("⚡", x, y, 16 + 8 * Math.sin(progress * Math.PI), `rgba(255, 255, 0, ${1 - progress})`); 
                return true; 
            } 
            return false; 
        }); 
    } 
    getHeroColor(hero) { /* ... (保持不变) ... */ } //
    // (Implementation omitted)
    getHeroColor(hero) { 
        const hpRatio = hero.hp / hero.maxHp; 
        return hero.hp <= 0 ? GAME_CONFIG.hero.colors.dead : hpRatio > 0.6 ? GAME_CONFIG.hero.colors.healthy : hpRatio > 0.3 ? GAME_CONFIG.hero.colors.injured : hpRatio > 0.3 ? GAME_CONFIG.hero.colors.injured : GAME_CONFIG.hero.colors.critical;
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
    drawHealthBar(x, y, current, max, color, label = "") { /* ... (保持不变) ... */ } //
    // (Implementation omitted)
    drawHealthBar(x, y, current, max, color, label = "") { 
        const width = label ? 200 : 50, height = label ? 10 : 6, ratio = current / max; 
        this.ctx.fillStyle = "gray"; 
        this.ctx.fillRect(x, y, width, height); 
        this.ctx.fillStyle = color; 
        this.ctx.fillRect(x, y, width * ratio, height); 
        this.ctx.strokeStyle = "white"; 
        this.ctx.strokeRect(x, y, width, height); 
        if (label) { 
            this.ctx.font = "bold 14px Arial"; 
            this.ctx.fillStyle = "gold"; 
            this.ctx.textAlign = 'center'; 
            this.ctx.textBaseline = 'bottom'; 
            this.ctx.shadowColor = 'black'; 
            this.ctx.shadowBlur = 1;
            this.ctx.shadowOffsetX = 1;
            this.ctx.shadowOffsetY = 1;
            this.ctx.fillText(label, x + width / 2, y - 2); 
            this.ctx.shadowColor = 'transparent'; 
        } 
    } 
    
    // (新增) 辅助函数
    getRandomIntInRange(range) { 
        return range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1)); 
    } 
}