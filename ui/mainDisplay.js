/**
 * ==================================================================
 * ui/mainDisplay.js
 * (已修改：移除了 updateStatsDisplay 的 export)
 * ==================================================================
 */

import { elements } from './domElements.js'; //
import { gameState } from '../core/gameState.js'; //
import { saveGame } from '../core/saveManager.js'; //
import { addMessage } from './messageLog.js'; //

// REMOVED export from here
/*export*/ function updateStatsDisplay() { //
   // Function body is now in main.js
   console.warn("updateStatsDisplay in ui/mainDisplay.js should no longer be called directly."); //
}

/**
 * 更新侧边栏的“副本进度区域”
 * (保持不变)
 */
export function updateDungeonProgressDisplay() { //
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