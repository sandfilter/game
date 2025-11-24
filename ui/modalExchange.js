import { elements } from './domElements.js'; import { gameState } from '../core/gameState.js'; import { GAME_DATA } from '../data/game-rules.js'; import { getProficiencyCost } from '../core/gameActions.js'; 
let isCloseAttached = false, isBodyAttached = false; 
function buildHTML() { 
    let h = '<h3>💰 我的货币</h3><div class="exchange-currency-grid">'; 
    const b = gameState.badges || {}, s = gameState.legendaryShards || {};
    h += `<div><span>🛡️ 英雄:</span> ${b.heroism||0}</div><div><span>🔥 勇气:</span> ${b.valor||0}</div><div><span>🏆 征服:</span> ${b.conquest||0}</div><div><span>🏅 凯旋:</span> ${b.triumph||0}</div><div><span>❄️ 寒冰:</span> ${b.frost||0}</div><div><span>💎 深渊:</span> ${b.abyssCrystal||0}</div>`;
    h += `<div><span>🔸 埃提耶什:</span> ${s.atiyehsuide||0}</div><div><span>🔸 瓦兰奈尔:</span> ${s.walanaiersuide||0}</div><div><span>🔸 炉石:</span> ${s.lushichuanshuodesuide||0}</div><div><span>🔸 影之:</span> ${s.yingzhisuide||0}</div><div><span>🔸 霜之:</span> ${s.shuangzhisuide||0}</div></div><hr class="exchange-divider"><h3>🔄 货币兑换</h3>`;
    const map = { "英雄徽章":"heroism", "勇气徽章":"valor", "征服徽章":"conquest", "凯旋徽章":"triumph", "寒冰徽章":"frost", "深渊水晶":"abyssCrystal" };
    for (const n in GAME_DATA.游戏数据.徽章兑换规则) { 
        const r = GAME_DATA.游戏数据.徽章兑换规则[n], k = map[n]; if (!k) continue;
        const c = b[k] || 0, d1 = c>=r.兑换比例?'':'disabled';
        h += `<div class="exchange-item"><div class="exchange-info"><span class="badge-name">${n}</span><div>${r.描述}</div></div><div class="exchange-button-group"><button class="wow-button exchange-btn ${d1}" data-k="${k}" data-a="1" ${d1}>兑换</button>`;
        if (k==='abyssCrystal') { const d50 = c>=r.兑换比例*50?'':'disabled'; h += `<button class="wow-button exchange-btn ${d50}" data-k="${k}" data-a="50" ${d50}>兑换50</button>`; }
        h += `</div></div>`; 
    }
    const cost = getProficiencyCost(), canBuy = gameState.gold >= cost ? '' : 'disabled';
    h += `<hr class="exchange-divider"><h3>⭐ 强化</h3><div class="exchange-item"><div class="exchange-info"><span class="badge-name">购买熟练度</span><div>花费 ${cost} 金币。</div></div><button class="wow-button ${canBuy}" id="buyProficiencyBtn" ${canBuy}>购买</button></div>`;
    return h; 
}
export function openExchangeModal(cbEx, cbBuy) { 
    if (elements.exchangeModalCloseBtn && !isCloseAttached) { elements.exchangeModalCloseBtn.addEventListener('click', () => elements.exchangeModal.style.display = 'none'); isCloseAttached = true; }
    if (elements.exchangeModalBody && !isBodyAttached) { 
        elements.exchangeModalBody.addEventListener('click', (e) => { 
            const btn = e.target.closest('button'); if (!btn || btn.hasAttribute('disabled')) return;
            if (btn.classList.contains('exchange-btn')) { if(cbEx) cbEx(btn.dataset.k, parseInt(btn.dataset.a)||1); }
            else if (btn.id === 'buyProficiencyBtn') { if(cbBuy) cbBuy(); }
        });
        isBodyAttached = true; 
    }
    updateExchangeModal(); elements.exchangeModal.style.display = 'flex'; 
}
export function updateExchangeModal() { if (elements.exchangeModalBody) elements.exchangeModalBody.innerHTML = buildHTML(); }