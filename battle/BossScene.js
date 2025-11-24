import { GAME_CONFIG, BASE_BATTLE_SPEED_MULTIPLIER } from '../config/battle-config.js'; 
export class AnimatedBossSceneGame { 
    constructor(adventureGame, animationState, currentBossData) { 
        // console.log("BossScene v3.3 Loaded"); 
        this.adventureGame = adventureGame; this.animationState = animationState; 
        this.canvas = adventureGame.canvas; this.ctx = adventureGame.ctx; 
        this.currentBossData = currentBossData || { 名称: "未知BOSS" }; 
        this.animationFrameId = null; this.animationArea = document.getElementById('animationArea');
        this.skillBar = document.getElementById('commanderSkillBar');
        this.btnAttack = document.getElementById('skillAttackBtn'); this.btnHeroism = document.getElementById('skillHeroismBtn'); this.btnArmy = document.getElementById('skillArmyBtn');
        this.cdHeroism = document.getElementById('cdHeroism'); this.cdArmy = document.getElementById('cdArmy');
        this.particles = []; this.ghouls = []; this.floatingTexts = [];
        this.handleAttackClick = this.handleAttackClick.bind(this); this.handleHeroismClick = this.handleHeroismClick.bind(this); this.handleArmyClick = this.handleArmyClick.bind(this); this.animationLoop = this.animationLoop.bind(this);
        this.initGame(); this.startAnimation(); 
    } 
    startAnimation() { 
        this.lastFrameTime = performance.now(); this.animationFrameId = requestAnimationFrame(this.animationLoop); 
        this.adventureGame.setAnimationFrameId(this.animationFrameId); 
        if (this.skillBar) { this.skillBar.style.display = 'flex'; this.btnAttack.addEventListener('click', this.handleAttackClick); this.btnHeroism.addEventListener('click', this.handleHeroismClick); this.btnArmy.addEventListener('click', this.handleArmyClick); }
    } 
    stopAnimation() { 
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId); 
        this.animationFrameId = null; 
        if (this.skillBar) { this.skillBar.style.display = 'none'; this.btnAttack.removeEventListener('click', this.handleAttackClick); this.btnHeroism.removeEventListener('click', this.handleHeroismClick); this.btnArmy.removeEventListener('click', this.handleArmyClick); }
        if (this.animationArea) this.animationArea.classList.remove('heroism-active');
        this.floatingTexts = []; this.particles = []; this.ghouls = [];
    } 
    initGame() { 
        this.heroCount = (this.animationState.heroes?.length > 0) ? this.animationState.heroes.length : this.animationState.heroCount; 
        const diff = this.currentBossData.难度等级 || 1;
        const diffMult = diff===5?2.0:(diff===4?1.75:(diff===3?1.5:(diff===2?1.25:1.0)));
        // (已修改) 5人本修正系数由 0.5 改为 1.0，不再削弱血量
        this.bossMaxHp = Math.floor((GAME_CONFIG.bossScene.bossBaseHp/5)*this.heroCount*diffMult*(this.heroCount===5?1.0:1.0)); 
        this.battleStarted = false; this.battleStartTime = 0; this.lastBossAttack = 0; 
        this.bossAttackInterval = GAME_CONFIG.bossScene.bossAttackInterval; 
        this.gameOver = false; this.lastBossDamageTime = 0; this.bossAttacks = []; 
        this.createHeroes(); this.createBoss(); this.setupSurroundPositions(); 
        this.lastFrameTime = performance.now();
        this.heroismActive = false; this.heroismEndTime = 0;
        this.isHeroismUsedInDungeon = this.adventureGame.masterGameState.currentDungeon.heroismUsed || false;
        this.lastArmyTime = this.adventureGame.masterGameState.lastArmyTime || 0;
    } 
    handleAttackClick() {
        if (!this.boss || this.boss.hp <= 0 || this.gameOver) return;
        const dmg = Math.max(10, Math.floor((this.adventureGame.masterGameState?.gearScore||0) * 0.5));
        // console.log(`猛击造成伤害: ${dmg}`); 
        this.boss.hp = Math.max(0, this.boss.hp - dmg); this.lastBossDamageTime = Date.now()/1000; 
        this.tryTriggerBossShake(); 
        this.boss.isCriticallyHit = Math.random()<0.2; 
        if (this.boss.isCriticallyHit && (performance.now()-this.boss.lastShakeStartTime<50)) this.boss.critTime = performance.now(); 
        this.addFloatingText(dmg, this.boss.x, this.boss.y-40, this.boss.isCriticallyHit?'#ff0000':'#ffcc00', this.boss.isCriticallyHit?'36px':'32px');
    }
    handleHeroismClick() {
        if (this.isHeroismUsedInDungeon || this.heroismActive || this.gameOver) return;
        this.heroismActive = true; this.heroismEndTime = Date.now()+10000; 
        this.isHeroismUsedInDungeon = true; this.adventureGame.masterGameState.currentDungeon.heroismUsed = true;
        if (this.animationArea) this.animationArea.classList.add('heroism-active');
        this.addFloatingText("嗜血!", this.canvas.width/2, this.canvas.height/2, '#ff0000', '48px', 1.5);
    }
    handleArmyClick() {
        const now = Date.now(); if (now-this.lastArmyTime<600000 || this.gameOver) return; 
        this.lastArmyTime = now; this.adventureGame.masterGameState.lastArmyTime = now; 
        for(let i=0;i<10;i++) this.ghouls.push({x:Math.random()*this.canvas.width, y:this.canvas.height+20, speed:Math.random()*50+100, life:15.0, maxLife:15.0, wigglePhase:Math.random()*6.28});
        this.addFloatingText("亡者大军!", this.canvas.width/2, this.canvas.height/2+50, '#8e7cc3', '40px', 1.5);
    }
    tryTriggerBossShake() { if (performance.now()-this.boss.lastShakeStartTime>2000) this.boss.lastShakeStartTime = performance.now(); }
    addFloatingText(val, x, y, col, size='32px', life=0.8) { this.floatingTexts.push({value:val, x:x+(Math.random()-0.5)*50, y:y+(Math.random()-0.5)*30, alpha:1.0, life, color:col, fontSize:size, velocityY:-2}); }
    createExplosion(x, y, color, count=15) { for(let i=0;i<count;i++) this.particles.push({x, y, vx:(Math.random()-0.5)*300, vy:(Math.random()-0.5)*300, life:Math.random()*0.5+0.5, maxLife:1.0, color, size:Math.random()*4+2}); }
    updateParticles(dt) { this.particles = this.particles.filter(p => { p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt; return p.life>0; }); }
    drawParticles() { this.particles.forEach(p => { this.ctx.save(); this.ctx.globalAlpha=p.life/p.maxLife; this.ctx.fillStyle=p.color; this.ctx.fillRect(p.x-p.size/2, p.y-p.size/2, p.size, p.size); this.ctx.restore(); }); }
    updateGhouls(dt) {
        this.ghouls = this.ghouls.filter(g => {
            g.life-=dt; if(g.life<=0) return false;
            const dx=this.boss.x-g.x, dy=this.boss.y-g.y, dist=Math.hypot(dx,dy);
            if(dist>30) { g.x+=(dx/dist)*g.speed*dt; g.y+=(dy/dist)*g.speed*dt; }
            else { this.boss.hp=Math.max(0, this.boss.hp-Math.floor(Math.random()*20+30)); this.lastBossDamageTime=Date.now()/1000; this.createExplosion(g.x, g.y, '#5e506b', 8); return false; }
            return true;
        });
    }
    updateCooldowns() {
        if(this.isHeroismUsedInDungeon) { this.btnHeroism.disabled=true; this.cdHeroism.style.height='100%'; this.btnHeroism.textContent='已使用'; }
        else { this.btnHeroism.disabled=false; this.cdHeroism.style.height='0%'; this.btnHeroism.textContent=this.heroismActive?'嗜血中!':'🩸 嗜血'; }
        const el=Date.now()-this.lastArmyTime;
        if(el<600000) { this.btnArmy.disabled=true; this.cdArmy.style.height=`${100-(el/6000)}%`; this.btnArmy.textContent=`${Math.ceil((600000-el)/1000)}s`; }
        else { this.btnArmy.disabled=false; this.cdArmy.style.height='0%'; this.btnArmy.textContent='🧟 亡者大军'; }
    }
    createHeroes() { 
        const gs=this.adventureGame.masterGameState?.gearScore??187, hp=GAME_CONFIG.hero.maxHp+Math.max(0, Math.floor(gs-187)), dmgR=GAME_CONFIG.hero.damageRange; 
        const mkH=(i)=>({emoji:GAME_CONFIG.hero.emojis[Math.floor(Math.random()*GAME_CONFIG.hero.emojis.length)], x:Math.random()*250+50, y:Math.random()*500+50, targetX:0, targetY:0, hp, maxHp:hp, speed:Math.random()+2.0, attackSpeed:Math.random()*0.7+0.8, damage:this.randInt(dmgR)+Math.max(0, Math.floor(gs-187)), id:i, inPosition:false, wigglePhase:Math.random()*6.28, lastHitTime:0, isCriticallyHit:false, isDead:false});
        this.heroes=(this.animationState.heroes?.length>0)?this.animationState.heroes.map((h,i)=>({...h, hp, maxHp:hp, lastHitTime:0, isDead:false})):Array.from({length:this.heroCount},(_,i)=>mkH(i));
    } 
    createBoss() { 
        const base=Math.floor(Math.random()*GAME_CONFIG.bossScene.bossDamageExtra)+GAME_CONFIG.bossScene.bossDamageBase;
        const dmg=Math.max(1,(this.heroCount>10?base+GAME_CONFIG.bossScene.bossDamageBonus:base)*(this.heroCount===5?0.6:1.0));
        this.boss={...this.currentBossData, emoji:GAME_CONFIG.bossScene.bossEmojis[Math.floor(Math.random()*GAME_CONFIG.bossScene.bossEmojis.length)], x:this.canvas.width/2, y:this.canvas.height/2, hp:this.bossMaxHp, maxHp:this.bossMaxHp, size:GAME_CONFIG.bossScene.bossSize, damage:dmg, attackRange:GAME_CONFIG.bossScene.bossAttackRange, active:false, lastShakeStartTime:-2000, isCriticallyHit:false, critTime:0, lastHitTime:0, isDead:false};
        this.boss.名称=this.boss.名称||"未知BOSS"; this.boss.语录=this.boss.语录||"";
    }
    setupSurroundPositions() { const r=this.heroCount===10?160:(this.heroCount===25?200:140); this.heroes.forEach((h,i)=>{const a=2*Math.PI*i/this.heroes.length; h.targetX=this.boss.x+r*Math.cos(a); h.targetY=this.boss.y+r*Math.sin(a);}); } 
    animationLoop(ts) { 
        if(!this.gameOver||this.particles.length>0||this.ghouls.length>0) { 
            let dt=(ts-this.lastFrameTime)/(1000/60); if(dt>10)dt=1; this.lastFrameTime=ts;
            const prof=this.adventureGame.masterGameState?.proficiency??0, spd=BASE_BATTLE_SPEED_MULTIPLIER+(3*prof)/(4000+prof);
            this.updateParticles((ts-this.lastFrameTime)/1000); 
            if(!this.gameOver) { this.updatePositions(dt*spd); this.updateBattle(dt*spd, ts); this.updateFloatingTexts(dt*spd); this.updateGhouls((ts-this.lastFrameTime)/1000); this.checkGameOver(); this.updateCooldowns(); }
            this.drawCharacters(ts); this.drawFloatingTexts(); this.drawParticles(); 
            if(!this.gameOver||this.particles.length>0||this.ghouls.length>0) this.animationFrameId=requestAnimationFrame(this.animationLoop); 
        } 
    } 
    updatePositions(dt) { 
        if(!this.battleStarted&&this.heroes.some(h=>h.inPosition&&h.hp>0)) { this.battleStarted=true; this.battleStartTime=Date.now()/1000; this.boss.active=true; }
        this.heroes.forEach(h=>{ if(h.hp<=0)return; const dx=h.targetX-h.x, dy=h.targetY-h.y, dist=Math.hypot(dx,dy); if(dist>15){h.inPosition=false; const mv=Math.min(dist, h.speed*dt); h.x+=(dx/dist)*mv; h.y+=(dy/dist)*mv;}else h.inPosition=true; }); 
    } 
    updateBattle(dt, ts) { 
        if(!this.battleStarted) return; 
        if(this.heroismActive&&Date.now()>this.heroismEndTime) { this.heroismActive=false; if(this.animationArea) this.animationArea.classList.remove('heroism-active'); }
        const chance=0.02*dt*(this.heroismActive?2:1);
        this.heroes.forEach(h=>{ if(h.hp>0&&h.inPosition&&Math.hypot(h.x-this.boss.x,h.y-this.boss.y)<this.boss.attackRange) { if(Math.random()<chance*h.attackSpeed){this.boss.hp=Math.max(0,this.boss.hp-h.damage); this.lastBossDamageTime=Date.now()/1000; this.tryTriggerBossShake();} } }); 
        if(this.boss.hp<=0&&!this.boss.isDead) { this.boss.isDead=true; this.createExplosion(this.boss.x, this.boss.y, '#ff4400', 50); }
        const prof=this.adventureGame.masterGameState?.proficiency??0, spd=BASE_BATTLE_SPEED_MULTIPLIER+(3*prof)/(4000+prof);
        if(this.boss.active&&this.boss.hp>0&&Date.now()/1000-this.lastBossAttack>(this.bossAttackInterval/spd)) { 
            this.lastBossAttack=Date.now()/1000; 
            const targets=this.heroes.filter(h=>h.hp>0&&h.inPosition).sort(()=>0.5-Math.random()).slice(0,Math.min(this.heroCount>10?5:3,this.heroes.length)); 
            targets.forEach(h=>{ this.bossAttacks.push({startTime:Date.now()/1000, duration:0.6, startX:this.boss.x, startY:this.boss.y, targetX:h.x, targetY:h.y}); setTimeout(()=>{ h.hp=Math.max(0,h.hp-this.boss.damage/targets.length); h.lastHitTime=performance.now(); if(h.hp<=0&&!h.isDead){h.isDead=true; this.createExplosion(h.x,h.y,'#66B3FF',15);} },300); }); 
        } 
    } 
    updateFloatingTexts(dt) { this.floatingTexts=this.floatingTexts.filter(t=>{t.y+=(t.velocityY||-1)*dt; t.alpha-=dt/0.8; t.life-=dt; return t.life>0;}); }
    checkGameOver() { if(!this.battleStarted||this.gameOver)return; if(this.heroes.filter(h=>h.hp>0).length===0||this.boss.hp<=0) { this.gameOver=true; this.adventureGame.handleSceneResult({winner:this.boss.hp<=0?"勇士":"BOSS", survivors:this.heroes.filter(h=>h.hp>0), totalHeroes:this.heroes.length, battleTime:(Date.now()/1000-this.battleStartTime)}); } } 
    drawCharacters(ts) { 
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height); 
        const shakeT=ts-this.boss.lastShakeStartTime, isShaking=shakeT<500; 
        let shake=isShaking?(Math.random()-0.5)*15:0; if(this.boss.isCriticallyHit&&(ts-this.boss.critTime<500)) shake*=2;
        const isBossHit=isShaking&&((shakeT<50)||(shakeT>150&&shakeT<200)||(shakeT>300&&shakeT<350));
        this.drawChar(this.boss.hp>0?this.boss.emoji:"💀", this.boss.x+shake, this.boss.y+shake, 16*this.boss.size, "red", isBossHit); 
        this.drawBar(this.boss.x-100, this.boss.y-120, this.boss.hp, this.boss.maxHp, "red", this.currentBossData.名称); 
        this.heroes.forEach(h=>{ 
            let wx=0, wy=0; if(h.hp>0&&h.inPosition){wx=Math.sin(h.wigglePhase)*3; wy=Math.cos(h.wigglePhase*1.3)*3; h.wigglePhase+=0.05;}
            this.drawChar(h.hp>0?h.emoji:"💀", h.x+wx, h.y+wy, 16, this.getHeroColor(h), (ts-h.lastHitTime)<75); 
            if(h.hp>0) this.drawBar(h.x-25, h.y-30, h.hp, h.maxHp, "blue"); 
        });
        this.ghouls.forEach(g=>{ g.wigglePhase+=0.2; this.drawChar("🧟", g.x+Math.sin(g.wigglePhase)*2, g.y, 20, "#8e7cc3"); });
        this.drawBossAttacks(); 
    } 
    drawFloatingTexts() { this.floatingTexts.forEach(t=>{ this.ctx.save(); this.ctx.globalAlpha=Math.max(0,t.alpha); this.ctx.font=`bold ${t.fontSize||'24px'} Arial`; this.ctx.fillStyle=t.color; this.ctx.textAlign='center'; this.ctx.textBaseline='middle'; this.ctx.shadowColor='black'; this.ctx.shadowBlur=4; this.ctx.shadowOffsetX=2; this.ctx.shadowOffsetY=2; this.ctx.fillText(`-${t.value}`,t.x,t.y); this.ctx.restore(); }); }
    drawChar(emoji, x, y, size, color, isHit=false) { this.ctx.save(); this.ctx.font=`${size}px Arial`; this.ctx.textAlign="center"; this.ctx.textBaseline="middle"; if(isHit){this.ctx.filter='brightness(400%) saturate(0%)';this.ctx.fillText(emoji,x,y);}else{this.ctx.fillStyle=color;this.ctx.fillText(emoji,x,y);} this.ctx.restore(); } 
    drawBar(x, y, cur, max, color, lbl="") { const w=lbl?200:50, h=lbl?10:6, r=Math.max(0,cur/max); this.ctx.fillStyle="#333"; this.ctx.fillRect(x,y,w,h); this.ctx.fillStyle=color; this.ctx.fillRect(x,y,w*r,h); this.ctx.strokeStyle="white"; this.ctx.strokeRect(x,y,w,h); if(lbl){this.ctx.font="bold 14px Arial"; this.ctx.fillStyle="gold"; this.ctx.textAlign='center'; this.ctx.textBaseline='bottom'; this.ctx.shadowColor='black'; this.ctx.shadowBlur=2; this.ctx.fillText(lbl,x+w/2,y-3);} }
    drawBossAttacks() { const now=Date.now()/1000; this.bossAttacks=this.bossAttacks.filter(a=>{ const p=(now-a.startTime)/a.duration; if(p<1){this.drawChar("⚡", a.startX+(a.targetX-a.startX)*p, a.startY+(a.targetY-a.startY)*p, 16+8*Math.sin(p*Math.PI), `rgba(255,255,0,${1-p})`); return true;} return false; }); }
    getHeroColor(h) { const r=h.hp/h.maxHp; return h.hp<=0?GAME_CONFIG.hero.colors.dead:r>0.6?GAME_CONFIG.hero.colors.healthy:r>0.3?GAME_CONFIG.hero.colors.injured:GAME_CONFIG.hero.colors.critical; }
    randInt(r) { return r[0]+Math.floor(Math.random()*(r[1]-r[0]+1)); }
}