/**
 * ==================================================================
 * battle/BattleController.js
 * (已修改：移除了副本内部场景切换的等待界面)
 * (已修改：移除了副本通关时的等待界面)
 * ==================================================================
 */

import { GAME_CONFIG } from '../config/battle-config.js'; //
import { AnimatedMonsterSceneGame } from './MonsterScene.js'; //
import { AnimatedBossSceneGame } from './BossScene.js'; //
import { TIMING_CONFIG } from '../config/timing-config.js'; //

/**
 * 动画战斗控制器
 *
 */
export class AnimatedBattleAdventure { //

    constructor(logCallback, rewardCallback, dungeonCompletionCallback) { //
        this.log = logCallback || (() => {}); //
        this.giveRewards = rewardCallback || (() => {}); //
        this.dungeonCompletionCallback = dungeonCompletionCallback || (() => {}); //

        this.canvas = document.getElementById('gameCanvas'); //
        this.ctx = this.canvas.getContext('2d'); //
        this.resultScreen = document.getElementById('resultScreen'); //
        this.battleResultEl = document.getElementById('battleResult'); //
        this.survivorsCountEl = document.getElementById('survivorsCount'); //
        this.battleTimeEl = document.getElementById('battleTime'); //
        this.countdownEl = document.getElementById('countdown'); //
        this.sceneIndicator = document.getElementById('sceneIndicator'); //
        this.instructionsEl = document.querySelector('.instructions'); //

        this.canvas.width = GAME_CONFIG.canvas.width; //
        this.canvas.height = GAME_CONFIG.canvas.height; //

        this.currentScene = 'monster'; //

        this.animationState = { //
            heroes: [], //
            currentWave: 1, //
            lastSceneResult: null, //
            heroCount: 10 //
        }; //

        this.masterGameState = null; //
        this.sceneGame = null; //
        this.animationFrameId = null; //
        this.countdownInterval = null; //
    } //

    setGameState(state) { //
        this.masterGameState = state; //
    }

    stopCurrentBattle() { //
        if (this.countdownInterval) { //
            clearInterval(this.countdownInterval); //
            this.countdownInterval = null; //
        }
        if (this.sceneGame) { //
            this.sceneGame.stopAnimation(); //
        }
        if (this.animationFrameId) { //
            clearInterval(this.animationFrameId); //
            this.animationFrameId = null; //
        }
        this.sceneGame = null; //
        this.resultScreen.style.display = 'none'; //
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); //
        this.sceneIndicator.textContent = '选择地下城开始'; //

        if (this.instructionsEl) { //
            this.instructionsEl.style.display = 'none'; //
        }
    }

    startDungeonRun(dungeon) { //
        this.stopCurrentBattle(); //
        this.animationState.heroCount = dungeon.size; //
        this.animationState.heroes = []; //
        this.log(`正在集结一支 ${dungeon.size} 人的队伍，进入 ${dungeon.name}...`, 'system'); //
        this.battleResultEl.textContent = "正在组织人员和跑本"; //
        this.survivorsCountEl.textContent = `勇士数量: ${dungeon.size}人`; //
        this.battleTimeEl.textContent = ""; //
        
        // --- 副本开始前的等待界面 (保留) ---
        this.resultScreen.style.display = 'flex'; //
        
        let countdown = TIMING_CONFIG.DUNGEON_START_DELAY / 1000; //

        this.countdownEl.textContent = `准备进入新副本，${countdown}秒后开始`; //
        this.countdownInterval = setInterval(() => { //
            countdown--; //
            this.countdownEl.textContent = `准备进入新副本，${countdown}秒后开始`; //
            if (countdown <= 0) { //
                clearInterval(this.countdownInterval); //
                this.countdownInterval = null; //
                this.animationState.currentWave = 1; //
                this.currentScene = 'monster'; //
                this.startCurrentScene(); //
            } //
        }, 1000); //
    } //

    startCurrentScene() { //
        this.resultScreen.style.display = 'none'; //
        if (this.animationFrameId) clearInterval(this.animationFrameId); //
        this.animationFrameId = null; //

        if (!this.masterGameState || !this.masterGameState.currentDungeon) { //
             console.error("Cannot start scene: masterGameState or currentDungeon is missing."); //
             return; //
        }

        const defaultInstruction = "勇士将自动攻击敌人，击败所有敌人进入下一场景"; //
        let instructionText = defaultInstruction; //
        let isBossScene = false; //
        let currentBoss = null; //

        if (this.currentScene === 'monster') { //
            this.sceneIndicator.textContent = `${this.masterGameState.currentDungeon.name} - 小怪 ${this.animationState.currentWave} 波`; //
            this.sceneGame = new AnimatedMonsterSceneGame(this, this.animationState); //
        } else { // Boss Scene
            isBossScene = true; //
            const bossIndex = Math.max(0, Math.min(this.masterGameState.currentDungeon.bossesDefeated, this.masterGameState.currentDungeon.bosses.length - 1)); //
            currentBoss = this.masterGameState.currentDungeon.bosses[bossIndex]; //

            if (!currentBoss) { //
                 console.error("无法启动Boss战，找不到Boss数据！", this.masterGameState.currentDungeon); //
                 this.log("启动Boss战失败，数据错误。", "error"); //
                 return; //
            }
            this.sceneIndicator.textContent = `${this.masterGameState.currentDungeon.name} - BOSS: ${currentBoss.名称}`; //
            instructionText = currentBoss.语录 ? `"${currentBoss.语录}"` : defaultInstruction; //

            if (currentBoss.语录) { //
                this.log(`BOSS ${currentBoss.名称}: "${currentBoss.语录}"`, 'combat'); //
            }
            this.sceneGame = new AnimatedBossSceneGame(this, this.animationState, currentBoss); //
        }

        if (this.instructionsEl) { //
            this.instructionsEl.textContent = instructionText; //
            this.instructionsEl.style.display = 'block'; //
            this.instructionsEl.classList.toggle('boss-quote', isBossScene && instructionText !== defaultInstruction); //
        }
    } //

    /**
     * Handle scene result
     * (已修改：移除场景间（非通关/非失败）的等待界面)
     * (已修改：移除副本通关时的等待界面)
     */
    handleSceneResult(result) { //
        // 1. 停止动画，发放奖励
        if (this.sceneGame) this.sceneGame.stopAnimation(); //
        if (this.animationFrameId) clearInterval(this.animationFrameId); //
        this.animationFrameId = null; //

        const rewardResult = { sceneType: this.currentScene, winner: result.winner }; //
        const defeatedBoss = (this.currentScene === 'boss' && result.winner === '勇士') //
            ? this.masterGameState.currentDungeon.bosses[this.masterGameState.currentDungeon.bossesDefeated]
            : null;

        if (result.winner === '勇士') { //
            this.giveRewards(rewardResult, defeatedBoss); //
        }

        // 2. 更新状态和日志
        this.animationState.lastSceneResult = result; //
        this.animationState.heroes = result.survivors; //

        if (result.winner !== '勇士') { //
            this.log(`场景结束: ${result.winner} 胜利!`, 'system'); //
        }
        this.log(`勇士存活: ${result.survivors.length}/${result.totalHeroes} | 战斗用时: ${result.battleTime.toFixed(1)}秒`, 'combat'); //

        // 3. 更新结果屏幕上的文本（即使不显示，也先准备好）
        this.battleResultEl.textContent = `${result.winner}胜利!`; //
        this.survivorsCountEl.textContent = `勇士存活: ${result.survivors.length}/${result.totalHeroes}`; //
        this.battleTimeEl.textContent = `战斗用时: ${result.battleTime.toFixed(1)}秒`; //
        
        // 4. 检查游戏状态
        if (result.winner === '勇士') {
            // --- 成功路径 ---
            if (this.currentScene === 'boss') { 
                if (this.masterGameState.currentDungeon.bossesDefeated >= this.masterGameState.currentDungeon.bosses.length) {
                    
                    // === (修改) 副本通关 (移除等待界面，直接调用回调) ===
                    
                    // this.resultScreen.style.display = 'flex'; // <<< (已移除)
                    this.log(`副本 ${this.masterGameState.currentDungeon.name} 已通关！`, 'reward'); 
                    // this.countdownEl.textContent = '副本已通关！等待逻辑处理...'; // <<< (已移除)
                    if (this.instructionsEl) this.instructionsEl.style.display = 'none'; //
                    
                    this.dungeonCompletionCallback(); // (立即调用)
                    return; // 停止
                }
            }

            // === 场景切换 (移除等待界面) ===
            // (小怪 -> BOSS, 或 BOSS 1 -> 小怪)
            console.log("场景切换，立即开始下一场。");
            const nextScene = this.currentScene === 'monster' ? 'boss' : 'monster'; //
            this.currentScene = nextScene; //
            if (nextScene === 'monster') this.animationState.currentWave++; //
            
            // (修改：不再设置倒计时，而是立即开始)
            this.startCurrentScene(); //
            return; 

        } else {
            // --- 失败路径 (保留等待界面) ---
            this.resultScreen.style.display = 'flex'; // <<< 显示等待界面
            this.log(`团灭了！正在重新跑本再战...`, 'error'); //
            if (this.instructionsEl) this.instructionsEl.style.display = 'none'; //

            let countdown = TIMING_CONFIG.DUNGEON_START_DELAY / 1000; //
            this.countdownEl.textContent = `团灭了！${countdown}秒后重新挑战...`; //
            this.animationState.heroes = []; //

            this.countdownInterval = setInterval(() => { //
                countdown--; //
                this.countdownEl.textContent = `团灭了！${countdown}秒后重新挑战...`; //
                if (countdown <= 0) { //
                    clearInterval(this.countdownInterval); //
                    this.countdownInterval = null; //
                    console.log(`Retrying scene: ${this.currentScene}`); //
                    this.startCurrentScene(); //
                }
            }, 1000); //
        }
    } //

    setAnimationFrameId(id) { //
        this.animationFrameId = id; //
    } //
}