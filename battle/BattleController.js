/**
 * ==================================================================
 * battle/BattleController.js
 * (已修改：场景转换时间引用 TIMING_CONFIG.DUNGEON_START_DELAY)
 * ==================================================================
 */

import { GAME_CONFIG } from '../config/battle-config.js'; //
import { AnimatedMonsterSceneGame } from './MonsterScene.js'; //
import { AnimatedBossSceneGame } from './BossScene.js'; //
// --- 新增：导入 TIMING_CONFIG ---
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
        this.resultScreen.style.display = 'flex'; //
        
        // --- 修改：使用 TIMING_CONFIG ---
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

        if (this.currentScene === 'monster') { //
            this.sceneIndicator.textContent = `${this.masterGameState.currentDungeon.name} - 小怪 ${this.animationState.currentWave} 波`; //
            this.sceneGame = new AnimatedMonsterSceneGame(this, this.animationState); //
        } else { // Boss Scene
            isBossScene = true; //
            const currentBoss = this.masterGameState.currentDungeon.bosses[this.masterGameState.currentDungeon.bossesDefeated]; //

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
            this.sceneGame = new AnimatedBossSceneGame(this, this.animationState, currentBoss); // Pass currentBoss data
        }

        if (this.instructionsEl) { //
            this.instructionsEl.textContent = instructionText; //
            this.instructionsEl.style.display = 'block'; //
            this.instructionsEl.classList.toggle('boss-quote', isBossScene && instructionText !== defaultInstruction); //
        }
    } //

    handleSceneResult(result) { //
        if (this.sceneGame) this.sceneGame.stopAnimation(); //
        if (this.animationFrameId) clearInterval(this.animationFrameId); //
        this.animationFrameId = null; //

        const rewardResult = { sceneType: this.currentScene, winner: result.winner }; //
        const defeatedBoss = (this.currentScene === 'boss' && result.winner === '勇士') //
            ? this.masterGameState.currentDungeon.bosses[this.masterGameState.currentDungeon.bossesDefeated] //
            : null; //

        if (result.winner === '勇士') { //
            this.giveRewards(rewardResult, defeatedBoss); //
        }

        this.animationState.lastSceneResult = result; //
        this.animationState.heroes = result.survivors; //

        if (result.winner !== '勇士') { //
            this.log(`场景结束: ${result.winner} 胜利!`, 'system'); //
        }

        this.log(`勇士存活: ${result.survivors.length}/${result.totalHeroes} | 战斗用时: ${result.battleTime.toFixed(1)}秒`, 'combat'); //
        this.battleResultEl.textContent = `${result.winner}胜利!`; //
        this.survivorsCountEl.textContent = `勇士存活: ${result.survivors.length}/${result.totalHeroes}`; //
        this.battleTimeEl.textContent = `战斗用时: ${result.battleTime.toFixed(1)}秒`; //
        this.resultScreen.style.display = 'flex'; //

        if (this.currentScene === 'boss' && result.winner === '勇士') { //
            if (this.masterGameState.currentDungeon.bossesDefeated >= this.masterGameState.currentDungeon.bosses.length) { //
                this.log(`副本 ${this.masterGameState.currentDungeon.name} 已通关！`, 'reward'); //
                this.countdownEl.textContent = '副本已通关！等待逻辑处理...'; //
                if (this.instructionsEl) this.instructionsEl.style.display = 'none'; //
                this.dungeonCompletionCallback(); //
                return; //
            }
        }

        if (result.winner !== '勇士') { //
            this.log(`战斗失败！正在等待新的指令...`, 'error'); //
            this.countdownEl.textContent = '战斗失败！'; //
             if (this.instructionsEl) this.instructionsEl.style.display = 'none'; //
            return; //
        }

        const nextScene = this.currentScene === 'monster' ? 'boss' : 'monster'; //
        const nextSceneText = nextScene === 'monster' ? '小怪场景' : 'BOSS场景'; //
        
        // --- 修改：使用 TIMING_CONFIG ---
        let countdown = TIMING_CONFIG.DUNGEON_START_DELAY / 1000; //
        
        this.countdownEl.textContent = `勇士正在恢复和跑图中，${countdown}秒后进入${nextSceneText}`; //

        this.countdownInterval = setInterval(() => { //
            countdown--; //
            this.countdownEl.textContent = `勇士正在恢复和跑图中，${countdown}秒后进入${nextSceneText}`; //
            if (countdown <= 0) { //
                clearInterval(this.countdownInterval); //
                this.countdownInterval = null; //
                this.currentScene = nextScene; //
                if (nextScene === 'monster') this.animationState.currentWave++; //
                this.startCurrentScene(); //
            } //
        }, 1000); //
    } //

    setAnimationFrameId(id) { //
        this.animationFrameId = id; //
    } //
}