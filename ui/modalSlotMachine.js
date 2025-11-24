import { elements } from './domElements.js'; import { gameState } from '../core/gameState.js'; import { SLOT_CONFIG, exchangeCurrencyForCredit, exchangeCreditForCollectible, calculateSlotResult, settleSlotGame } from '../services/slotMachineSystem.js'; import { addMessage } from './messageLog.js'; import { showLootPopup } from './lootPopup.js';

let isListenerAttached = false, bets = {}, isSpinning = false, lightTimer = null, trackItems = [], currentLight = 0;
function resetBets() { SLOT_CONFIG.PAYOUT_ORDER.forEach(k => bets[k] = 0); }

function buildSlotMachineHTML() {
    const layout = SLOT_CONFIG.TRACK_LAYOUT, payouts = SLOT_CONFIG.PAYOUTS;
    const pos = []; for(let i=0;i<8;i++) pos.push([1,i+1]); for(let i=1;i<5;i++) pos.push([i+1,8]); for(let i=0;i<8;i++) pos.push([6,8-i]); for(let i=1;i<5;i++) pos.push([6-i,1]);
    let trackHTML = layout.map((k, i) => `<div class="slot-track-item" style="grid-row:${pos[i][0]}; grid-column:${pos[i][1]};" data-index="${i}">${payouts[k].i}</div>`).join('');
    let betHTML = SLOT_CONFIG.PAYOUT_ORDER.map(k => `<div class="slot-bet-btn" data-symbol="${k}"><div class="slot-bet-val" id="bet-val-${k}">00</div><div class="slot-bet-icon">${payouts[k].i}</div><div class="slot-bet-rate">x${payouts[k].p}</div></div>`).join('');
    
    const rates = SLOT_CONFIG.EXCHANGE_RATES, map = { heroism: "英雄徽章", valor: "勇气徽章", conquest: "征服徽章", triumph: "凯旋徽章", frost: "寒冰徽章", abyssCrystal: "深渊水晶", gold: "金币" };
    let exHTML = Object.keys(rates).map(t => `<div class="slot-exchange-row"><div class="ex-info"><span>${map[t]}</span><span>1=${rates[t]}</span></div><div class="ex-btns"><button class="slot-exchange-btn" data-t="${t}" data-a="1">换1</button><button class="slot-exchange-btn" data-t="${t}" data-a="50">换50</button></div></div>`).join('');

    // (修改) 更新按钮文本
    return `<div class="slot-machine-wrapper"><div class="slot-side-panel"><div class="slot-side-title">资产</div><div class="asset-list" id="slotAssetList"></div><div class="slot-side-title">兑换</div><div class="exchange-list">${exHTML}</div><div class="collectible-exchange-section"><button class="collectible-exchange-btn" id="btnExchangeCollectible">✨ 500积分兑换收藏品盲盒</button></div></div><div class="slot-game-area"><div class="title-bar"><div class="game-title">欢乐水果机</div></div><div class="slot-track-container">${trackHTML}<div class="slot-center-panel"><div class="slot-credits-display" id="slotCreditsDisplay">000000</div><div class="slot-message-display" id="slotMessage">请下注</div></div></div><div class="slot-controls"><div class="slot-bet-area">${betHTML}</div><div class="slot-action-row"><button class="slot-action-btn" id="btnSlotDouble">加倍</button><button class="slot-action-btn" id="btnSlotHalf">减半</button><button class="slot-action-btn" id="btnSlotAllIn">ALL+1</button><button class="slot-action-btn" id="btnSlotClear">清空</button><button class="slot-action-btn" id="btnSlotStart">启动</button></div></div></div></div>`;
}

function updateAssetList() {
    const l = document.getElementById('slotAssetList'); if (!l) return;
    const b = gameState.badges || {}, s = gameState.legendaryShards || {};
    const d = [{n:"💰 金币",v:gameState.gold},{n:"🛡️ 英雄徽章",v:b.heroism},{n:"🔥 勇气徽章",v:b.valor},{n:"🏆 征服徽章",v:b.conquest},{n:"🏅 凯旋徽章",v:b.triumph},{n:"❄️ 寒冰徽章",v:b.frost},{n:"💎 深渊水晶",v:b.abyssCrystal},{n:"🔸 埃提耶什的碎片",v:s.atiyehsuide},{n:"🔸 瓦兰奈尔的碎片",v:s.walanaiersuide},{n:"🔸 炉石传说的碎片",v:s.lushichuanshuodesuide}];
    l.innerHTML = d.map(i => `<div class="asset-item"><span class="asset-name">${i.n}</span><span class="asset-val">${i.v||0}</span></div>`).join('');
}

export function initSlotMachineUI() {
    if (!elements.exchangeModalBody) return;
    elements.exchangeModalBody.innerHTML = buildSlotMachineHTML(); resetBets();
    trackItems = Array.from(document.querySelectorAll('.slot-track-item'));
    const credDisp = document.getElementById('slotCreditsDisplay'), msgDisp = document.getElementById('slotMessage');
    const update = () => { credDisp.textContent = String(gameState.slotCredits||0).padStart(6,'0'); for(let k in bets) document.getElementById(`bet-val-${k}`).textContent = String(bets[k]).padStart(2,'0'); updateAssetList(); };
    
    document.querySelectorAll('.slot-bet-btn').forEach(b => b.addEventListener('click', () => { 
        if(isSpinning) return; 
        let total = Object.values(bets).reduce((a,b)=>a+b,0);
        if(total + 1 > gameState.slotCredits) { msgDisp.textContent = "积分不足"; msgDisp.style.color = "#f44"; return; }
        bets[b.dataset.symbol]++; update(); 
    }));

    document.getElementById('btnSlotClear').addEventListener('click', () => { if(!isSpinning) { for(let k in bets) bets[k]=0; update(); msgDisp.textContent="已清空"; msgDisp.style.color = "#adf"; } });
    
    document.getElementById('btnSlotAllIn').addEventListener('click', () => {
        if(isSpinning) return;
        let cost = SLOT_CONFIG.PAYOUT_ORDER.length, total = Object.values(bets).reduce((a,b)=>a+b,0);
        if(total + cost > gameState.slotCredits) { msgDisp.textContent = "积分不足全加"; msgDisp.style.color = "#f44"; return; }
        SLOT_CONFIG.PAYOUT_ORDER.forEach(k => bets[k]++); update(); msgDisp.textContent = "ALL+1"; msgDisp.style.color = "#ffd700";
    });

    document.getElementById('btnSlotDouble').addEventListener('click', () => {
        if(isSpinning) return;
        let total = Object.values(bets).reduce((a,b)=>a+b,0);
        if(total * 2 > gameState.slotCredits) { msgDisp.textContent = "积分不足加倍"; msgDisp.style.color = "#f44"; return; }
        for(let k in bets) bets[k] *= 2; update(); msgDisp.textContent = "已加倍"; msgDisp.style.color = "#0f0";
    });

    document.getElementById('btnSlotHalf').addEventListener('click', () => { if(!isSpinning) { for(let k in bets) bets[k] = Math.floor(bets[k]/2); update(); msgDisp.textContent = "已减半"; msgDisp.style.color = "#adf"; } });

    document.getElementById('btnSlotStart').addEventListener('click', () => {
        if(isSpinning) return;
        let total = Object.values(bets).reduce((a,b)=>a+b,0);
        if(total === 0) { msgDisp.textContent = "请下注"; msgDisp.style.color = "#f44"; return; }
        if(total > gameState.slotCredits) { msgDisp.textContent = "积分不足"; msgDisp.style.color = "#f44"; return; }
        
        gameState.slotCredits -= total; isSpinning = true; update();
        msgDisp.textContent = "Good Luck!"; msgDisp.style.color = "#adf";
        
        const res = calculateSlotResult(bets), dur = Math.random()*1000 + 1500, start = Date.now();
        let speed = 60;
        const run = () => {
            lightTimer = setTimeout(() => {
                trackItems.forEach(e => e.classList.remove('active'));
                trackItems[currentLight].classList.add('active');
                const elap = Date.now() - start;
                if(elap > dur * 0.6) { speed = 60 + (elap - dur*0.6)*0.1; if(speed>150) speed=150; }
                
                if(elap < dur || currentLight !== res.finalIndex) {
                    currentLight = (currentLight + 1) % 24; run();
                } else {
                    isSpinning = false;
                    if(res.winnings > 0) {
                        msgDisp.textContent = `赢得 ${res.winnings}!`; msgDisp.style.color = "#0f0";
                        settleSlotGame(res.winnings);
                        let b = 0, t = setInterval(() => { trackItems[currentLight].style.filter = b++%2?'brightness(2.5)':'none'; if(b>10){clearInterval(t); trackItems[currentLight].style.filter='none'; update();} }, 100);
                    } else { msgDisp.textContent = "未中奖"; msgDisp.style.color = "#aaa"; update(); }
                }
            }, speed);
        };
        run();
    });

    document.querySelectorAll('.slot-exchange-btn').forEach(b => b.addEventListener('click', () => {
        if(isSpinning) return;
        const r = exchangeCurrencyForCredit(b.dataset.t, parseInt(b.dataset.a));
        if(r.success) { update(); msgDisp.textContent = "兑换成功"; msgDisp.style.color = "#0f0"; } 
        else { msgDisp.textContent = r.message; msgDisp.style.color = "#f44"; }
    }));

    document.getElementById('btnExchangeCollectible').addEventListener('click', () => {
        if(isSpinning) return;
        const r = exchangeCreditForCollectible();
        if(r.success) { update(); addMessage(r.message,'legendary'); showLootPopup(r.item.name, r.item.icon||'🎁','epic'); }
        else { msgDisp.textContent = r.message; msgDisp.style.color = "#f44"; }
    });
    update();
}

export function openSlotMachineModal() {
    const m = elements.exchangeModal; if(!m) return;
    if(elements.exchangeModalCloseBtn && !isListenerAttached) { elements.exchangeModalCloseBtn.addEventListener('click', ()=>{ m.style.display='none'; if(lightTimer) clearTimeout(lightTimer); isSpinning=false; }); isListenerAttached=true; }
    initSlotMachineUI(); m.style.display='flex';
}