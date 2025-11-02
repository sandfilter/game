/**
 * ==================================================================
 * ui/mainDisplay.js
 * (已修改：从 main.js 移回 updateStatsDisplay 的完整实现)
 * (已修改：25人本装等门槛改为 207)
 * ==================================================================
 */

import { elements } from './domElements.js'; //
import { gameState } from '../core/gameState.js'; //
import { saveGame } from '../core/saveManager.js'; //
import { addMessage } from './messageLog.js'; //

/**
 * 更新顶部状态栏和角色面板装等/熟练度
 * (已修改：25人本装等门槛改为 207)
 */
export function updateStatsDisplay() {
    try {
        const currentGearScore = (gameState.gearScore ?? 0).toFixed(1);
        const currentProficiency = gameState.proficiency ?? 0;
        const currentGold = gameState.gold ?? 0;

        // 更新顶部状态栏
        elements.displays.gearScore.textContent = currentGearScore;
        elements.displays.gold.textContent = currentGold;
        elements.displays.proficiency.textContent = currentProficiency;
        elements.displays.atiyehStaffIcon.style.display = gameState.legendaryItemsObtained?.["埃提耶什·守护者的传说之杖"] ? 'flex' : 'none';
        elements.dungeon10Btn.classList.toggle('disabled', (gameState.gearScore ?? 0) < 200);
        elements.dungeon25Btn.classList.toggle('disabled', (gameState.gearScore ?? 0) < 207); // <<< (修改)

        // 更新角色面板 (如果元素存在)
        if (elements.charGearScoreDisplay) {
            elements.charGearScoreDisplay.textContent = currentGearScore;
        }
        if (elements.charProficiencyDisplay) {
            elements.charProficiencyDisplay.textContent = currentProficiency;
        }
        if (elements.charGoldDisplay) {
            elements.charGoldDisplay.textContent = currentGold;
        }

        saveGame(); // 触发存档

    } catch (error) {
        console.error("更新状态显示时出错:", error);
        addMessage("更新状态显示时出错。", "error");
    }
}

/**
 * 更新侧边栏的“副本进度区域”
 * (保持不变)
 */
export function updateDungeonProgressDisplay() { //
     // ... Function content unchanged ...
     elements.bossList.innerHTML = ''; //
     if (gameState.currentDungeon && gameState.currentDungeon.bosses) { //
        elements.dungeonProgressTitle.textContent = gameState.currentDungeon.name; //
        const bosses = Array.isArray(gameState.currentDungeon.bosses) ? gameState.currentDungeon.bosses : []; //
        const defeatedCount = Number(gameState.currentDungeon.bossesDefeated) || 0; //
        bosses.forEach((boss, index) => { //
            const li = document.createElement('li'); //
            li.textContent = boss?.名称 || '未知 Boss'; //
            li.className = 'boss-item'; //
            if (index < defeatedCount) { //
                 li.textContent += ' √'; //
                 li.classList.add('completed'); //
            } else if (index === defeatedCount) { //
                 li.classList.add('current'); //
            }
            elements.bossList.appendChild(li); //
        });
     } else { //
        elements.dungeonProgressTitle.textContent = '副本进度区域'; //
        elements.bossList.innerHTML = '<li class="boss-item">正在等待进入副本...</li>'; //
     }
}