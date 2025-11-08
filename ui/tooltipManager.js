/**
 * ==================================================================
 * ui/tooltipManager.js (新文件)
 * 职责: 管理角色面板的物品提示框 (Tooltip)。
 * (已修改：移除了 "relic" 槽位)
 * (已修改：添加对任务列表 (quest) 的 Tooltip 支持)
 * (已修改：添加对物品 description 的支持)
 * (已修改：添加对收藏品 (collectible) 的 Tooltip 支持)
 * ==================================================================
 */

import { elements } from './domElements.js';
import { gameState } from '../core/gameState.js';
import { ITEM_DATA } from '../data/item-data.js';
import { questConfig } from '../core/initialization.js'; // 导入任务配置

/**
 * 获取槽位中文名称
 * (已修改：移除 relic)
 */
export function getSlotDisplayName(slot) {
    const map = {
        "head": "头部", "neck": "颈部", "shoulder": "肩部",
        "back": "背部", "chest": "胸部", "shirt": "衬衣",
        "tabard": "战袍", "wrist": "手腕", "hands": "手套",
        "waist": "腰带", "legs": "腿部", "feet": "脚",
        "finger1": "手指", "finger2": "手指",
        "trinket1": "饰品", "trinket2": "饰品",
        "mainhand": "主手", "offhand": "副手",
        "collectible": "收藏品" // (新增)
    };
    return map[slot] || slot;
}

/**
 * Tooltip 显示处理器 (用于装备)
 */
export function handleTooltipShow(event) {
    const slotElement = event.target.closest('.equip-slot');
    if (!slotElement || !elements.itemTooltip) return;

    const slot = slotElement.dataset.slot;
    if (!slot) return;

    const itemId = gameState.equipment[slot];
    const slotDisplayName = getSlotDisplayName(slot);

    let htmlContent = '';

    if (itemId && ITEM_DATA[itemId]) {
        const item = ITEM_DATA[itemId];
        const rarityClass = `rarity-${item.rarity || 'common'}`;
        
        htmlContent = `
            <div class="tooltip-name ${rarityClass}">${item.name}</div>
            <div class="tooltip-gearscore">装备等级: ${item.gearScore}</div>
            <div class="tooltip-slot">${slotDisplayName}</div>
        `;

        if (item.description) {
            htmlContent += `<div class="tooltip-description">${item.description}</div>`;
        }
        
    } else {
        htmlContent = `
            <div class="tooltip-name rarity-common">空</div>
            <div class="tooltip-slot">${slotDisplayName}</div>
        `;
    }

    elements.itemTooltip.innerHTML = htmlContent;
    elements.itemTooltip.style.display = 'block';
}

/**
 * Tooltip 显示处理器 (用于任务列表)
 */
export function handleQuestTooltipShow(event) {
    const questElement = event.target.closest('.quest-item[data-quest-tooltip="true"]');
    if (!questElement || !elements.itemTooltip) return;

    const questId = questElement.dataset.questId;
    if (!questId || !questConfig[questId]) return;

    const quest = questConfig[questId];
    const description = quest.description || '没有可用的描述。';
    
    let htmlContent = `
        <div class="tooltip-name rarity-common">${quest.name}</div>
        <div class="tooltip-slot">${description}</div>
    `;
    
    elements.itemTooltip.innerHTML = htmlContent;
    elements.itemTooltip.style.display = 'block';
}

/**
 * (新增) Tooltip 显示处理器 (用于收藏品列表)
 */
export function handleCollectibleTooltipShow(event) {
    const collectibleElement = event.target.closest('.collectible-item');
    if (!collectibleElement || !elements.itemTooltip) return;

    const itemId = collectibleElement.dataset.collectibleId;
    if (!itemId || !ITEM_DATA[itemId]) return;

    const item = ITEM_DATA[itemId];
    const rarityClass = `rarity-${item.rarity || 'common'}`;
    let typeName = "收藏品";
    
    if (item.type === 'heirloom') typeName = "传家宝信物";
    else if (item.slot === 'mainhand') typeName = "传说武器";
    else if (item.slot === 'collectible') typeName = "坐骑";

    let htmlContent = `
        <div class="tooltip-name ${rarityClass}">${item.name}</div>
        <div class="tooltip-slot">${typeName}</div>
    `;

    // 如果是信物，显示当前等级
    if (item.type === 'heirloom' && item.heirloomId) {
        const level = gameState.heirloomLevels[item.heirloomId] || 0;
        htmlContent += `<div class="tooltip-gearscore">当前等级: ${level}</div>`;
    }

    if (item.description) {
        htmlContent += `<div class="tooltip-description">${item.description}</div>`;
    }

    elements.itemTooltip.innerHTML = htmlContent;
    elements.itemTooltip.style.display = 'block';
}


/**
 * Tooltip 隐藏处理器 (通用)
 */
export function handleTooltipHide(event) {
    if (elements.itemTooltip) {
        elements.itemTooltip.style.display = 'none';
    }
}

/**
 * Tooltip 移动处理器 (通用)
 */
export function handleTooltipMove(event) {
    if (elements.itemTooltip && elements.itemTooltip.style.display === 'block') {
        const offsetX = 15;
        const offsetY = 10;
        let x = event.clientX + offsetX;
        let y = event.clientY + offsetY;
        
        if (x + elements.itemTooltip.offsetWidth > window.innerWidth) {
            x = event.clientX - elements.itemTooltip.offsetWidth - offsetX;
        }
        if (y + elements.itemTooltip.offsetHeight > window.innerHeight) {
            y = event.clientY - elements.itemTooltip.offsetHeight - offsetY;
        }
        
        elements.itemTooltip.style.left = `${x}px`;
        elements.itemTooltip.style.top = `${y}px`;
    }
}