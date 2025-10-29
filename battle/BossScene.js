/**
 * ==================================================================
 * battle/BossScene.js
 * (已修改：显示 Boss 名称)
 * ==================================================================
 */

import { GAME_CONFIG, BATTLE_SPEED_MULTIPLIER } from '../config/battle-config.js'; //

const clickDamageValue = 100; //

/**
 * Boss 战斗场景
 * (已修改：后台运行 + 攻击逻辑 + HP缩放 + 点击伤害 + 调整伤害跳字 + 显示 Boss 名称)
 *
 */
export class AnimatedBossSceneGame { //
    // (修改：添加 currentBossData 参数)
    constructor(adventureGame, animationState, currentBossData) { //
        this.adventureGame = adventureGame; //
        this.canvas = adventureGame.canvas; //
        this.ctx = adventureGame.ctx; //
        this.animationFrameId = null; //
        this.animationState = animationState; //
        // --- Added: Store current boss data ---
        this.currentBossData = currentBossData || { 名称: "未知BOSS" }; // Store boss info

        this.handleCanvasClick = this.handleCanvasClick.bind(this); //
        this.floatingTexts = []; //

        this.initGame(); //
        this.startAnimation(); //
    } //

    // ... (startAnimation, stopAnimation, initGame, handleCanvasClick, createHeroes, createBoss, setupSurroundPositions, animationLoop, updatePositions, updateBattle, updateFloatingTexts, checkGameOver - 保持不变) ...
    // --- Start: Unchanged methods ---
    startAnimation() { //
        this.animationFrameId = setInterval(() => { //
            this.animationLoop(); //
        }, 1000 / 60); //
        this.adventureGame.setAnimationFrameId(this.animationFrameId); //
        this.canvas.addEventListener('click', this.handleCanvasClick); //
        console.log("Boss scene click listener added."); //
    }
    stopAnimation() { //
        if (this.animationFrameId) clearInterval(this.animationFrameId); //
        this.animationFrameId = null; //
        this.canvas.removeEventListener('click', this.handleCanvasClick); //
        console.log("Boss scene click listener removed."); //
        this.floatingTexts = []; //
    }
    initGame() { //
        this.heroCount = (this.animationState.heroes && this.animationState.heroes.length > 0) ? this.animationState.heroes.length : this.animationState.heroCount; //
        let baseHp = GAME_CONFIG.bossScene.bossBaseHp; //
        let hpPerHero = GAME_CONFIG.bossScene.bossHpPerHero; //
        let scalingHeros = (this.heroCount - 5); //
        if (this.heroCount === 25) { //
            hpPerHero = hpPerHero * 2; //
        }
        this.bossMaxHp = baseHp + (scalingHeros * hpPerHero); //
        this.battleStarted = false; //
        this.battleStartTime = 0; //
        this.lastBossAttack = 0; //
        this.bossAttackInterval = GAME_CONFIG.bossScene.bossAttackInterval; //
        this.gameOver = false; //
        this.lastBossDamageTime = 0; //
        this.bossAttacks = []; //
        this.createHeroes(); //
        this.createBoss(); //
        this.setupSurroundPositions(); //
        this.lastFrameTime = performance.now(); //
    }
     handleCanvasClick(event) { //
        if (!this.boss || this.boss.hp <= 0 || this.gameOver) { //
            return; //
        }
        const rect = this.canvas.getBoundingClientRect(); //
        const clickX = event.clientX - rect.left; //
        const clickY = event.clientY - rect.top; //
        const bossDrawSize = 16 * this.boss.size; //
        const halfSize = bossDrawSize / 2; //
        const bossLeft = this.boss.x - halfSize; //
        const bossRight = this.boss.x + halfSize; //
        const bossTop = this.boss.y - halfSize; //
        const bossBottom = this.boss.y + halfSize; //
        if (clickX >= bossLeft && clickX <= bossRight && clickY >= bossTop && clickY <= bossBottom) { //
            console.log(`Boss clicked! Dealing ${clickDamageValue} damage.`); //
            this.boss.hp = Math.max(0, this.boss.hp - clickDamageValue); //
            this.lastBossDamageTime = Date.now() / 1000; //
            this.floatingTexts.push({ //
                value: clickDamageValue, //
                x: clickX, //
                y: clickY, //
                alpha: 1.0, //
                life: 1.5,  //
                color: 'red' //
            });
        }
    }
    createHeroes() { //
        if (this.animationState.heroes && this.animationState.heroes.length > 0) { //
            this.heroes = this.animationState.heroes.map((hero, i) => ({ ...hero, hp: GAME_CONFIG.hero.maxHp, x: Math.random() * 250 + 50, y: Math.random() * 500 + 50, targetX: 0, targetY: 0, inPosition: false, wigglePhase: Math.random() * 6.28 })); //
        } else { //
            this.heroes = Array.from({ length: this.heroCount }, (_, i) => ({ emoji: GAME_CONFIG.hero.emojis[Math.floor(Math.random() * GAME_CONFIG.hero.emojis.length)], x: Math.random() * 250 + 50, y: Math.random() * 500 + 50, targetX: 0, targetY: 0, hp: 100, maxHp: 100, speed: Math.random() * 1 + 2.0, attackSpeed: Math.random() * 0.7 + 0.8, damage: Math.floor(Math.random() * 6) + 5, id: i, inPosition: false, wigglePhase: Math.random() * 6.28 })); //
        } //
    }
     createBoss() { //
        // Use the name from the passed data, but keep other generated properties
        const emoji = GAME_CONFIG.bossScene.bossEmojis[Math.floor(Math.random() * GAME_CONFIG.bossScene.bossEmojis.length)];
        this.boss = {
            ...this.currentBossData, // Include name and quote from data
            emoji: emoji, // Overwrite emoji if needed
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            hp: this.bossMaxHp,
            maxHp: this.bossMaxHp,
            size: GAME_CONFIG.bossScene.bossSize, // Use config size
            damage: Math.floor(Math.random() * GAME_CONFIG.bossScene.bossDamageExtra) + GAME_CONFIG.bossScene.bossDamageBase + (this.heroCount > 10 ? GAME_CONFIG.bossScene.bossDamageBonus : 0), // Use config damage calculation
            attackRange: GAME_CONFIG.bossScene.bossAttackRange, // Use config range
            active: false,
            shakeOffsetX: 0,
            shakeOffsetY: 0
         };
         // Ensure essential properties exist even if data is minimal
         this.boss.名称 = this.boss.名称 || "未知BOSS";
         this.boss.语录 = this.boss.语录 || "";
    }
     setupSurroundPositions() { //
        let radius = this.heroCount === 10 ? 160 : this.heroCount === 25 ? 200 : 140; //
        this.heroes.forEach((hero, i) => { //
            const angle = 2 * Math.PI * i / this.heroes.length; //
            hero.targetX = this.boss.x + radius * Math.cos(angle); //
            hero.targetY = this.boss.y + radius * Math.sin(angle); //
        }); //
    }
    animationLoop() { //
        if (!this.gameOver) { //
            const timestamp = performance.now(); //
            let deltaTime = (timestamp - this.lastFrameTime) / 16.67; //
            this.lastFrameTime = timestamp; //
            deltaTime *= (typeof BATTLE_SPEED_MULTIPLIER !== 'undefined' ? BATTLE_SPEED_MULTIPLIER : 1.0); //
            this.updatePositions(deltaTime); //
            this.updateBattle(deltaTime); //
            this.updateFloatingTexts(deltaTime); //
            this.drawCharacters(); //
            this.drawFloatingTexts(); //
            this.checkGameOver(); //
        } //
    }
    updatePositions(deltaTime) { //
        let allInPosition = true; //
        this.heroes.forEach(hero => { //
            if (hero.hp <= 0) return; //
            const dx = hero.targetX - hero.x, dy = hero.targetY - hero.y, distance = Math.hypot(dx, dy); //
            if (distance > 15) { //
                allInPosition = false; //
                const moveDist = Math.min(distance, hero.speed * deltaTime); //
                hero.x += dx / distance * moveDist; //
                hero.y += dy / distance * moveDist; //
            } else hero.inPosition = true; //
        }); //
        if (!this.battleStarted && this.heroes.some(h => h.inPosition && h.hp > 0)) { //
            this.battleStarted = true; //
            this.battleStartTime = Date.now() / 1000; //
            this.boss.active = true; //
        } //
    }
    updateBattle(deltaTime) { //
        if (!this.battleStarted) return; //
        const currentTime = Date.now() / 1000; //
        const attackChancePerFrame = 0.02; //
        const attackChancePerDelta = attackChancePerFrame * deltaTime; //
        this.heroes.forEach(hero => { //
            if (hero.hp > 0 && hero.inPosition && Math.hypot(hero.x - this.boss.x, hero.y - this.boss.y) < this.boss.attackRange) { //
                if (Math.random() < (attackChancePerDelta * hero.attackSpeed)) { //
                    const damageDealt = hero.damage; //
                    this.boss.hp = Math.max(0, this.boss.hp - damageDealt); //
                    this.lastBossDamageTime = currentTime; //
                    // Hero damage text removed
                }
            } //
        }); //
        const speedMultiplier = (typeof BATTLE_SPEED_MULTIPLIER !== 'undefined' ? BATTLE_SPEED_MULTIPLIER : 1.0); //
        if (this.boss.active && this.boss.hp > 0 && currentTime - this.lastBossAttack > (this.bossAttackInterval / speedMultiplier)) { //
            this.lastBossAttack = currentTime; //
            const aliveHeroes = this.heroes.filter(h => h.hp > 0 && h.inPosition); //
            if (aliveHeroes.length > 0) { //
                const targetCount = Math.min(this.heroCount > 10 ? 5 : 3, aliveHeroes.length); //
                const targets = [...aliveHeroes].sort(() => 0.5 - Math.random()).slice(0, targetCount); //
                targets.forEach(hero => { //
                    this.bossAttacks.push({ startTime: currentTime, duration: 0.6, startX: this.boss.x, startY: this.boss.y, targetX: hero.x, targetY: hero.y }); //
                    setTimeout(() => { //
                        hero.hp = Math.max(0, hero.hp - this.boss.damage / targetCount); //
                    }, 300); //
                }); //
            } //
        } //
    }
     updateFloatingTexts(deltaTime) { //
        this.floatingTexts = this.floatingTexts.filter(text => { //
            text.y -= 15 * deltaTime; //
            text.alpha -= (1.0 / text.life) * deltaTime; //
            text.life -= deltaTime; //
            return text.life > 0 && text.alpha > 0; //
        }); //
    }
    checkGameOver() { //
        if (!this.battleStarted || this.gameOver) return; //
        const aliveHeroes = this.heroes.filter(h => h.hp > 0).length; //
        if (aliveHeroes === 0 || this.boss.hp <= 0) { //
            this.gameOver = true; //
            this.adventureGame.handleSceneResult({ winner: this.boss.hp <= 0 ? "勇士" : "BOSS", survivors: this.heroes.filter(hero => hero.hp > 0), totalHeroes: this.heroes.length, battleTime: (Date.now() / 1000 - this.battleStartTime) }); //
        } //
    }
    // --- End: Unchanged methods ---


    /**
     * Draw characters and health bars
     * (已修改：传递 boss 名称给 drawHealthBar)
     */
    drawCharacters() { //
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); //
        this.drawBossAttacks(); //
        const bossSize = 16 * this.boss.size; //
        const bossShakeX = (Date.now() / 1000 - this.lastBossDamageTime < 0.2) ? (Math.random() - 0.5) * 10 : 0; //
        const bossShakeY = (Date.now() / 1000 - this.lastBossDamageTime < 0.2) ? (Math.random() - 0.5) * 10 : 0; //

        // Draw Boss Character
        this.drawCharacter(
            this.boss.hp > 0 ? this.boss.emoji : "💀",
            this.boss.x + bossShakeX,
            this.boss.y + bossShakeY,
            bossSize,
            "red"
        ); //

        // --- Modification: Pass Boss Name to Health Bar ---
        this.drawHealthBar(
            this.boss.x - 100, // x position
            this.boss.y - 120, // y position
            this.boss.hp,      // current hp
            this.boss.maxHp,   // max hp
            "red",             // color
            this.currentBossData.名称 // Pass the name as the label
        ); //

        // Draw Heroes
        this.heroes.forEach(hero => { //
            let wiggleX = 0, wiggleY = 0; //
            if (hero.inPosition && hero.hp > 0) { //
                wiggleX = Math.sin(hero.wigglePhase) * 3; //
                wiggleY = Math.cos(hero.wigglePhase * 1.3) * 3; //
                hero.wigglePhase += 0.05; //
            } //
            this.drawCharacter(hero.hp > 0 ? hero.emoji : "💀", hero.x + wiggleX, hero.y + wiggleY, 16, this.getHeroColor(hero)); //
            if (hero.hp > 0) this.drawHealthBar(hero.x - 25, hero.y - 30, hero.hp, hero.maxHp, "blue"); // No label for heroes
        }); //
    } //

    // ... (drawFloatingTexts, drawBossAttacks, getHeroColor, drawCharacter, drawHealthBar - 保持不变) ...
    // --- Start: Unchanged methods ---
    drawFloatingTexts() { //
        this.floatingTexts.forEach(text => { //
            this.ctx.save(); //
            this.ctx.globalAlpha = Math.max(0, text.alpha); //
            this.ctx.font = 'bold 24px Arial'; //
            this.ctx.fillStyle = text.color; //
            this.ctx.textAlign = 'center'; //
            this.ctx.textBaseline = 'middle'; //
            this.ctx.shadowColor = 'black'; //
            this.ctx.shadowBlur = 2; //
            this.ctx.shadowOffsetX = 1; //
            this.ctx.shadowOffsetY = 1; //
            this.ctx.fillText(`-${text.value}`, text.x, text.y); //
            this.ctx.restore(); //
        }); //
    }
    drawBossAttacks() { //
        const currentTime = Date.now() / 1000; //
        this.bossAttacks = this.bossAttacks.filter(attack => { //
            const progress = (currentTime - attack.startTime) / attack.duration; //
            if (progress < 1) { //
                const x = attack.startX + (attack.targetX - attack.startX) * progress; //
                const y = attack.startY + (attack.targetY - attack.startY) * progress; //
                this.drawCharacter("⚡", x, y, 16 + 8 * Math.sin(progress * Math.PI), `rgba(255, 255, 0, ${1 - progress})`); //
                return true; //
            } //
            return false; //
        }); //
    }
    getHeroColor(hero) { //
        const hpRatio = hero.hp / hero.maxHp; //
        return hero.hp <= 0 ? "#777777" : hpRatio > 0.6 ? "#66B3FF" : hpRatio > 0.3 ? "#FFA500" : "#FF6347"; //
    }
    drawCharacter(emoji, x, y, size, color) { //
        this.ctx.font = `${size}px Arial`; //
        this.ctx.fillStyle = color; //
        this.ctx.textAlign = "center"; //
        this.ctx.textBaseline = "middle"; //
        this.ctx.fillText(emoji, x, y); //
    }
    /**
     * Draw Health Bar
     * (已修改：调整标签文本样式)
     */
    drawHealthBar(x, y, current, max, color, label = "") { //
        const width = label ? 200 : 50, height = label ? 10 : 6, ratio = current / max; //
        this.ctx.fillStyle = "gray"; //
        this.ctx.fillRect(x, y, width, height); //
        this.ctx.fillStyle = color; //
        this.ctx.fillRect(x, y, width * ratio, height); //
        this.ctx.strokeStyle = "white"; //
        this.ctx.strokeRect(x, y, width, height); //
        if (label) { //
            // --- Modifications for Boss Name ---
            this.ctx.font = "bold 14px Arial"; // Slightly larger and bold
            this.ctx.fillStyle = "gold";      // Gold color for name
            this.ctx.textAlign = 'center';    // Center align
            this.ctx.textBaseline = 'bottom'; // Position above the bar
            this.ctx.shadowColor = 'black';   // Add shadow
            this.ctx.shadowBlur = 1;
            this.ctx.shadowOffsetX = 1;
            this.ctx.shadowOffsetY = 1;
            this.ctx.fillText(label, x + width / 2, y - 2); // Draw name
            this.ctx.shadowColor = 'transparent'; // Reset shadow
        } //
    }
    // --- End: Unchanged methods ---
}