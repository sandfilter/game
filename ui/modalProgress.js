/**
 * ==================================================================
 * ui/modalProgress.js
 * (已修正：移除延迟查找逻辑)
 * ==================================================================
 */

import { elements } from './domElements.js'; //
import { gameState } from '../core/gameState.js'; //
import { DUNGEON_DATA } from '../data/dungeon-data.js'; //
import { TIMING_CONFIG } from '../config/timing-config.js'; //
import { startSpecificDungeon } from '../core/gameLoop.js'; //

let progressModalInterval; //
let isProgressCloseBtnListenerAttached = false; // Flag to prevent multiple bindings

/**
 * 打开副本进度弹窗
 * (已修正：移除延迟查找)
 */
export function openProgressModal() { //
    // (已移除) 延迟查找
    // elements.progressModalCloseBtn = elements.progressModal.querySelector('#progressModalCloseBtn'); 

    // Bind listener only ONCE
    if (elements.progressModalCloseBtn && !isProgressCloseBtnListenerAttached) { //
        elements.progressModalCloseBtn.addEventListener('click', closeProgressModal); //
        isProgressCloseBtnListenerAttached = true; //
        console.log("Attached listener to progressModalCloseBtn"); //
    } else if (!elements.progressModalCloseBtn) { //
         console.error("Could not find progressModalCloseBtn to attach listener."); //
    }

    updateProgressModal(); // This will now also search within the modal
    elements.progressModal.style.display = 'flex'; // Make visible *before* interval

    if (progressModalInterval) clearInterval(progressModalInterval); //
    progressModalInterval = setInterval(updateProgressModal, TIMING_CONFIG.MODAL_REFRESH_INTERVAL); //
}

/**
 * 关闭副本进度弹窗
 */
export function closeProgressModal() { //
    if (elements.progressModal) { //
        elements.progressModal.style.display = 'none'; //
    }
    if (progressModalInterval) { //
         clearInterval(progressModalInterval); //
         progressModalInterval = null; //
    }
}

/**
 * 刷新副本进度弹窗的内容
 * (已修正：移除延迟查找)
 */
export function updateProgressModal() { //
     try { //
         // (已移除) 延迟查找
         // if (!elements.dungeon5pList && elements.progressModal) { ... }
         // ...

         if (!elements.dungeon5pList || !elements.dungeon10pList || !elements.dungeon25pList) { //
             console.error("Could not find dungeon list elements in updateProgressModal (initElements failed?)."); //
             return; //
         }

         const createListItem = (dungeonInfo) => { //
             let dungeonRef; //
             if (dungeonInfo.size === 5) dungeonRef = gameState.dungeons5p.find(dRef => dRef?.name === dungeonInfo.name); //
             else if (dungeonInfo.size === 10) dungeonRef = gameState.raids10p.find(dRef => dRef?.name === dungeonInfo.name); //
             else dungeonRef = gameState.raids25p.find(dRef => dRef?.name === dungeonInfo.name); //
             const li = document.createElement('li'); //
             li.textContent = dungeonInfo.name + (dungeonRef?.completed ? ' √' : ''); //
             if (dungeonRef?.completed) li.classList.add('completed'); //
             if (gameState.currentDungeon && gameState.currentDungeon.name === dungeonInfo.name && gameState.currentDungeon.size === dungeonInfo.size) { //
                 li.classList.add('current'); //
             }
             li.addEventListener('click', () => startSpecificDungeon(dungeonInfo)); //
             return li; //
         };

         const populateList = (listElement, baseDungeonData) => { //
            if (!listElement) return; //
             listElement.innerHTML = ''; //
             baseDungeonData.forEach(dInfo => listElement.appendChild(createListItem(dInfo))); //
         };

         const base5p = DUNGEON_DATA["5人副本"].map(d => ({name: d.副本名称, size: 5})); //
         const base10p = DUNGEON_DATA["团队副本"].map(d => ({name: d.副本名称, size: 10})); //
         const base25p = DUNGEON_DATA["团队副本"].map(d => ({name: d.副本名称, size: 25})); //

         populateList(elements.dungeon5pList, base5p); //
         populateList(elements.dungeon10pList, base10p); //
         populateList(elements.dungeon25pList, base25p); //
     } catch (error) { //
         console.error("更新进度弹窗时出错:", error); //
     }
}