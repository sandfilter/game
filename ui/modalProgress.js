/**
 * ==================================================================
 * ui/modalProgress.js
 * (已修改：延迟查找模态框内部元素并在打开时绑定关闭按钮事件)
 * (Added innerHTML logging and querySelector)
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
 * (Added innerHTML logging)
 */
export function openProgressModal() { //
    // Log the modal's content *before* trying to find children
    if (elements.progressModal) { //
        console.log("Progress Modal innerHTML on open:", elements.progressModal.innerHTML); // <<< ADDED LOG
    } else { //
        console.error("Progress Modal container not found!"); //
        return; // Can't proceed
    }

    // Find close button ONLY when opening the modal
    // (Ensure we search *within* the modal container for robustness)
    elements.progressModalCloseBtn = elements.progressModal.querySelector('#progressModalCloseBtn'); //
    console.log("Found progressModalCloseBtn on open:", elements.progressModalCloseBtn); //

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
 * (Added querySelector as fallback search)
 */
export function updateProgressModal() { //
     try { //
         // Find list elements just before updating them, search within modal
         if (!elements.dungeon5pList && elements.progressModal) { //
             elements.dungeon5pList = elements.progressModal.querySelector('#dungeon5pList'); //
         }
         if (!elements.dungeon10pList && elements.progressModal) { //
             elements.dungeon10pList = elements.progressModal.querySelector('#dungeon10pList'); //
         }
         if (!elements.dungeon25pList && elements.progressModal) { //
             elements.dungeon25pList = elements.progressModal.querySelector('#dungeon25pList'); //
         }
         // Fallback to global search if still not found (less ideal but helps debug)
         if (!elements.dungeon5pList) elements.dungeon5pList = document.getElementById('dungeon5pList'); //
         if (!elements.dungeon10pList) elements.dungeon10pList = document.getElementById('dungeon10pList'); //
         if (!elements.dungeon25pList) elements.dungeon25pList = document.getElementById('dungeon25pList'); //


         if (!elements.dungeon5pList || !elements.dungeon10pList || !elements.dungeon25pList) { //
             console.error("Could not find dungeon list elements in updateProgressModal. Searched within modal first."); //
             // Log content again if lists aren't found
             if (elements.progressModal) console.log("Progress Modal innerHTML during update:", elements.progressModal.innerHTML); //
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