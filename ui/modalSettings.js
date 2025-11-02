/**
 * ==================================================================
 * ui/modalSettings.js (新文件)
 * 职责: 管理设置弹窗和帮助弹窗的事件监听器。
 * (已修正：依赖 initElements 查找元素)
 * ==================================================================
 */

import { elements } from './domElements.js';
import { addMessage } from './messageLog.js';
import { 
    confirmAndClearSave, 
    exportSave, 
    importSave 
} from '../core/saveManager.js';

/**
 * 初始化所有与设置/帮助弹窗相关的事件监听器
 * (此函数应在 main.js 的 bindEventListeners 中被调用)
 */
export function initSettingsModalListeners() {
    
    // 1. 打开设置弹窗
    if (elements.settingsBtn) {
        elements.settingsBtn.addEventListener('click', () => {
            console.log("Settings button clicked!");
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
    } else {
        console.error("settingsModalCloseBtn is null");
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
    } else {
        console.error("clearSaveBtn is null");
    }

    // 4. 导出存档
    if (elements.exportSaveBtn) {
        elements.exportSaveBtn.addEventListener('click', exportSave);
    } else {
        console.error("exportSaveBtn is null");
    }

    // 5. 导入存档
    if (elements.importSaveBtn) {
        elements.importSaveBtn.addEventListener('click', () => {
            if (!importSave()) { 
                addMessage("导入操作已取消。", "system"); 
            }
        });
    } else {
        console.error("importSaveBtn is null");
    }

    // 6. 打开帮助弹窗 (从设置中)
    if (elements.gameHelpBtn) {
        elements.gameHelpBtn.addEventListener('click', () => {
            elements.helpModal.style.display = 'flex';
            elements.settingsModal.style.display = 'none'; // 同时关闭设置
        });
    } else {
        console.error("gameHelpBtn is null");
    }

    // 7. 关闭帮助弹窗
    if (elements.helpModalCloseBtn) {
        elements.helpModalCloseBtn.addEventListener('click', () => {
            elements.helpModal.style.display = 'none';
        });
    } else {
        console.error("helpModalCloseBtn is null");
    }
}