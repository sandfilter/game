/**
 * ==================================================================
 * ui/modalSettings.js
 * 职责: 管理设置弹窗和帮助弹窗的事件监听器。
 * (已修改：飞升按钮判定加入“炉石传说·真尼玛好玩”)
 * ==================================================================
 */

import { elements } from './domElements.js';
import { addMessage } from './messageLog.js';
import { 
    confirmAndClearSave, 
    exportSave, 
    importSave 
} from '../core/saveManager.js';
import { gameState } from '../core/gameState.js'; 

export function initSettingsModalListeners(ascensionCallback) {
    
    // 1. 打开设置弹窗
    if (elements.settingsBtn) {
        elements.settingsBtn.addEventListener('click', () => {
            
            // --- (修改) 飞升按钮可见性检查 ---
            // 拥有任意一把传说武器即可飞升
            const hasLegendary = 
                gameState.legendaryItemsObtained["埃提耶什·守护者的传说之杖"] ||
                gameState.legendaryItemsObtained["瓦兰奈尔·远古王者之锤"] ||
                gameState.legendaryItemsObtained["炉石传说·真尼玛好玩"]; // (新增)

            if (elements.ascendBtn) {
                elements.ascendBtn.style.display = hasLegendary ? 'block' : 'none';
            }
            // --- 检查结束 ---

            elements.settingsModal.style.display = 'flex';
        });
    } else {
        console.error("settingsBtn is null");
    }

    // 2. 关闭设置弹窗
    if (elements.settingsModalCloseBtn) {
        elements.settingsModalCloseBtn.addEventListener('click', () => {
            elements.settingsModal.style.display = 'none';
        });
    }

    // 3. 清除存档
    if (elements.clearSaveBtn) {
        elements.clearSaveBtn.addEventListener('click', () => {
            if (confirmAndClearSave()) {
                // 页面将重载
            } else { 
                addMessage("清除存档操作已取消。", "system"); 
            }
        });
    }

    // 4. 导出存档
    if (elements.exportSaveBtn) {
        elements.exportSaveBtn.addEventListener('click', exportSave);
    }

    // 5. 导入存档
    if (elements.importSaveBtn) {
        // (注意：HTML中此按钮已被隐藏，但逻辑保留以防万一)
        elements.importSaveBtn.addEventListener('click', () => {
            if (!importSave()) { 
                addMessage("导入操作已取消。", "system"); 
            }
        });
    }

    // 6. 打开帮助弹窗
    if (elements.gameHelpBtn) {
        elements.gameHelpBtn.addEventListener('click', () => {
            elements.helpModal.style.display = 'flex';
            elements.settingsModal.style.display = 'none'; 
        });
    }

    // 7. 关闭帮助弹窗
    if (elements.helpModalCloseBtn) {
        elements.helpModalCloseBtn.addEventListener('click', () => {
            elements.helpModal.style.display = 'none';
        });
    }
    
    // 8. 飞升按钮
    if (elements.ascendBtn) {
        elements.ascendBtn.addEventListener('click', () => {
            if (ascensionCallback) {
                ascensionCallback();
            }
        });
    }
}