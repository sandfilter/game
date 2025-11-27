import { elements } from './domElements.js'; import { gameState } from '../core/gameState.js'; import { saveGame } from '../core/saveManager.js'; import { addMessage } from './messageLog.js'; import { ITEM_DATA } from '../data/item-data.js'; 
import { handleAtieshPortal, handleValanyrChest, handleHearthstoneSkill } from '../core/gameActions.js'; 
import { callbacks } from '../core/callbackRegistry.js'; 

export function updateStatsDisplay() {
    try {
        const currentGearScore = (gameState.gearScore ?? 0).toFixed(1);
        elements.displays.gearScore.textContent = currentGearScore;
        elements.displays.gold.textContent = gameState.gold ?? 0;
        elements.displays.proficiency.textContent = gameState.proficiency ?? 0;
        updateSpecialItemsDisplay();
        elements.dungeon10Btn.classList.toggle('disabled', (gameState.gearScore ?? 0) < 200);
        elements.dungeon25Btn.classList.toggle('disabled', (gameState.gearScore ?? 0) < 207);
        if (elements.charGearScoreDisplay) elements.charGearScoreDisplay.textContent = currentGearScore;
        if (elements.charProficiencyDisplay) elements.charProficiencyDisplay.textContent = gameState.proficiency ?? 0;
        if (elements.charGoldDisplay) elements.charGoldDisplay.textContent = gameState.gold ?? 0;
        saveGame(); 
    } catch (error) { console.error("更新状态出错:", error); }
}

function updateSpecialItemsDisplay() {
    const container = elements.specialItemsContainer; if (!container) return;
    container.innerHTML = '';
    if (gameState.collectibles && Array.isArray(gameState.collectibles)) {
        gameState.collectibles.forEach(itemId => {
            const item = ITEM_DATA[itemId];
            if (item && item.rarity === 'legendary' && item.slot === 'mainhand') {
                const itemDiv = document.createElement('div'); itemDiv.className = 'status-item';
                itemDiv.innerHTML = `<span class="status-icon">${item.icon || '⭐'}</span><span class="legendary">${item.name}</span>`;
                
                // 埃提耶什
                if (item.name === "埃提耶什·守护者的传说之杖") {
                    const skillBtn = createSkillIcon('atiesh-skill-icon', '🌀');
                    
                    // 计算属性
                    const level = Math.min(10, gameState.heirloomLevels?.atiyeh_staff || 0);
                    const cd = Math.max(0, 33 - level * 3);

                    skillBtn.addEventListener('click', (e) => { e.stopPropagation(); const r = handleAtieshPortal(); addMessage(r.message, r.success?'legendary':'error'); });
                    // 修改：动态显示信物等级
                    skillBtn.addEventListener('mouseenter', () => showSkillTooltip('卡拉赞传送门', `立即重置所有副本进度。<br>信物等级: ${level}`, cd, gameState.lastAtieshResetTime));
                    attachTooltipMove(skillBtn); itemDiv.appendChild(skillBtn);
                }
                // 瓦兰奈尔
                else if (item.name === "瓦兰奈尔·远古王者之锤") {
                    const skillBtn = createSkillIcon('valanyr-skill-icon', '🎁');
                    
                    // 计算属性
                    const level = Math.min(10, gameState.heirloomLevels?.valanyr_hammer || 0);
                    const cd = Math.max(0, 33 - level * 3);
                    const amount = 5 + level * 5;

                    skillBtn.addEventListener('click', (e) => { e.stopPropagation(); const r = handleValanyrChest(); addMessage(r.message, r.success?'legendary':'error'); if(r.success && callbacks.updateChestUI) callbacks.updateChestUI(); });
                    // 修改：动态显示获得数量和信物等级
                    skillBtn.addEventListener('mouseenter', () => showSkillTooltip('远古王者的赐福', `立即获得 ${amount} 个幸运宝箱。<br>信物等级: ${level}`, cd, gameState.lastValanyrChestTime));
                    attachTooltipMove(skillBtn); itemDiv.appendChild(skillBtn);
                }
                // 炉石传说
                else if (item.name === "炉石传说·真尼玛好玩") {
                    const skillBtn = createSkillIcon('hearthstone-skill-icon', '🎴');

                    // 计算属性
                    const level = Math.min(10, gameState.heirloomLevels?.hearthstone_card || 0);
                    const cd = Math.max(0, 33 - level * 3);
                    const amount = 10 + level * 10;

                    skillBtn.addEventListener('click', (e) => { e.stopPropagation(); const r = handleHearthstoneSkill(); addMessage(r.message, r.success?'legendary':'error'); if(r.success && callbacks.updateChestUI) callbacks.updateChestUI(); });
                    // 修改：动态显示获得数量和信物等级
                    skillBtn.addEventListener('mouseenter', () => showSkillTooltip('回合制游戏', `立即获得 ${amount} 个水果机积分。<br>信物等级: ${level}`, cd, gameState.lastHearthstoneSkillTime));
                    attachTooltipMove(skillBtn); itemDiv.appendChild(skillBtn);
                }

                container.appendChild(itemDiv);
            }
        });
    }
}

function createSkillIcon(cls, icon) {
    const s = document.createElement('span'); s.className = cls; s.textContent = icon; return s;
}
function showSkillTooltip(title, desc, cdMin, lastTime) {
    const tooltip = elements.itemTooltip; if(!tooltip) return;
    const COOLDOWN = cdMin * 60 * 1000, now = Date.now(), elapsed = now - (lastTime || 0);
    let statusHTML = elapsed < COOLDOWN ? `<span style="color: #ff4444;">冷却中 (剩余 ${Math.ceil((COOLDOWN - elapsed) / 60000)} 分钟)</span>` : `<span style="color: #00ff00;">就绪 (点击使用)</span>`;
    tooltip.innerHTML = `<div class="tooltip-name legendary">${title}</div><div class="tooltip-description">${desc}<br>冷却时间: ${cdMin}分钟<br>状态: ${statusHTML}</div>`;
    tooltip.style.display = 'block';
}
function attachTooltipMove(el) {
    el.addEventListener('mousemove', (e) => {
        const t = elements.itemTooltip; if(!t) return;
        const offX=15, offY=10; let x=e.clientX+offX, y=e.clientY+offY;
        if (x+t.offsetWidth>window.innerWidth) x=e.clientX-t.offsetWidth-offX;
        if (y+t.offsetHeight>window.innerHeight) y=e.clientY-t.offsetHeight-offY;
        t.style.left=`${x}px`; t.style.top=`${y}px`;
    });
    el.addEventListener('mouseleave', () => { if(elements.itemTooltip) elements.itemTooltip.style.display = 'none'; });
}

export function updateDungeonProgressDisplay() { 
     elements.bossList.innerHTML = ''; 
     if (gameState.currentDungeon && gameState.currentDungeon.bosses) { 
        elements.dungeonProgressTitle.textContent = gameState.currentDungeon.name; 
        const bosses = Array.isArray(gameState.currentDungeon.bosses) ? gameState.currentDungeon.bosses : []; 
        const defeatedCount = Number(gameState.currentDungeon.bossesDefeated) || 0; 
        bosses.forEach((boss, index) => { 
            const li = document.createElement('li'); li.textContent = boss?.名称 || '未知 Boss'; li.className = 'boss-item'; 
            if (index < defeatedCount) { li.textContent += ' √'; li.classList.add('completed'); } else if (index === defeatedCount) { li.classList.add('current'); }
            elements.bossList.appendChild(li); 
        });
     } else { elements.dungeonProgressTitle.textContent = '副本进度区域'; elements.bossList.innerHTML = '<li class="boss-item">正在等待进入副本...</li>'; }
}