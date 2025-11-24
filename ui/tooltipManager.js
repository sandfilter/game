import { elements } from './domElements.js'; import { gameState } from '../core/gameState.js'; import { ITEM_DATA } from '../data/item-data.js'; import { questConfig } from '../core/initialization.js'; 
export function getSlotDisplayName(slot) { const map = { "head":"头部", "neck":"颈部", "shoulder":"肩部", "back":"背部", "chest":"胸部", "shirt":"衬衣", "tabard":"战袍", "wrist":"手腕", "hands":"手套", "waist":"腰带", "legs":"腿部", "feet":"脚", "finger1":"手指", "finger2":"手指", "trinket1":"饰品", "trinket2":"饰品", "mainhand":"主手", "offhand":"副手", "collectible":"收藏品" }; return map[slot] || slot; }
export function handleTooltipShow(e) {
    const el = e.target.closest('.equip-slot'); if (!el || !elements.itemTooltip) return;
    const slot = el.dataset.slot, itemId = gameState.equipment[slot], name = getSlotDisplayName(slot);
    let html = '';
    if (itemId && ITEM_DATA[itemId]) {
        const item = ITEM_DATA[itemId], rarity = `rarity-${item.rarity||'common'}`;
        html = `<div class="tooltip-name ${rarity}">${item.name}</div><div class="tooltip-gearscore">装备等级: ${item.gearScore}</div><div class="tooltip-slot">${name}</div>`;
        if (item.description) html += `<div class="tooltip-description">${item.description}</div>`;
    } else { html = `<div class="tooltip-name rarity-common">空</div><div class="tooltip-slot">${name}</div>`; }
    elements.itemTooltip.innerHTML = html; elements.itemTooltip.style.display = 'block';
}
export function handleQuestTooltipShow(e) {
    const el = e.target.closest('.quest-item'); if (!el || !elements.itemTooltip) return;
    const qId = el.dataset.questId, type = el.dataset.questTooltip;
    let name='', desc='';
    if (type === 'daily') {
        const dq = gameState.daily?.quests?.find(q => q.id === qId);
        if (dq) { name = dq.name; desc = dq.description; }
    } else {
        const q = questConfig[qId];
        if (q) { name = q.name; desc = q.description || '没有可用的描述。'; }
    }
    if (name) {
        elements.itemTooltip.innerHTML = `<div class="tooltip-name rarity-common">${name}</div><div class="tooltip-slot">${desc}</div>`;
        elements.itemTooltip.style.display = 'block';
    }
}
export function handleCollectibleTooltipShow(e) {
    const el = e.target.closest('.collectible-item'); if (!el || !elements.itemTooltip) return;
    const itemId = el.dataset.collectibleId; if (!itemId || !ITEM_DATA[itemId]) return;
    const item = ITEM_DATA[itemId], rarity = `rarity-${item.rarity||'common'}`;
    
    // (修改) 区分类型逻辑
    let type = "收藏品";
    if (item.type === 'heirloom') type = "传家宝信物";
    else if (item.slot === 'mainhand') type = "传说武器";
    else if (item.slot === 'collectible') {
        if (itemId.startsWith('mount_')) type = "坐骑";
        else type = "玩具";
    }

    let html = `<div class="tooltip-name ${rarity}">${item.name}</div><div class="tooltip-slot">${type}</div>`;
    if (item.type==='heirloom'&&item.heirloomId) html += `<div class="tooltip-gearscore">当前等级: ${gameState.heirloomLevels[item.heirloomId]||0}</div>`;
    if (item.description) html += `<div class="tooltip-description">${item.description}</div>`;
    elements.itemTooltip.innerHTML = html; elements.itemTooltip.style.display = 'block';
}
export function handleTooltipHide() { if (elements.itemTooltip) elements.itemTooltip.style.display = 'none'; }
export function handleTooltipMove(e) {
    if (elements.itemTooltip && elements.itemTooltip.style.display === 'block') {
        const offX=15, offY=10; let x=e.clientX+offX, y=e.clientY+offY;
        if (x+elements.itemTooltip.offsetWidth>window.innerWidth) x=e.clientX-elements.itemTooltip.offsetWidth-offX;
        if (y+elements.itemTooltip.offsetHeight>window.innerHeight) y=e.clientY-elements.itemTooltip.offsetHeight-offY;
        elements.itemTooltip.style.left=`${x}px`; elements.itemTooltip.style.top=`${y}px`;
    }
}