import { GAME_CONFIG, BASE_BATTLE_SPEED_MULTIPLIER } from '../config/battle-config.js'; 
export class AnimatedMonsterSceneGame { 
    constructor(adventureGame, animationState) { 
        // console.log("MonsterScene v2.6 Loaded"); 
        this.adventureGame = adventureGame; this.animationState = animationState; 
        this.canvas = adventureGame.canvas; this.ctx = adventureGame.ctx; 
        this.animationFrameId = null; this.particles = []; 
        this.gameLoop = this.gameLoop.bind(this); 
        this.resetGame(); this.lastFrameTime = performance.now(); this.startAnimation(); 
    } 
    startAnimation() { this.lastFrameTime = performance.now(); this.animationFrameId = requestAnimationFrame(this.gameLoop); this.adventureGame.setAnimationFrameId(this.animationFrameId); } 
    stopAnimation() { if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId); this.animationFrameId = null; this.particles = []; } 
    resetGame() { this.gameOver = false; this.battleStarted = false; this.battleStartTime = 0; this.currentTargetIndex = 0; this.lastMonsterAttackTime = 0; this.createHeroes(); this.createMonsters(); } 
    createExplosion(x, y, color, count=10) { for(let i=0;i<count;i++) this.particles.push({x, y, vx:(Math.random()-0.5)*150, vy:(Math.random()-0.5)*150, life:Math.random()*0.5+0.5, maxLife:1.0, color, size:Math.random()*4+2}); }
    updateParticles(dt) { this.particles = this.particles.filter(p => { p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt; return p.life>0; }); }
    drawParticles() { this.particles.forEach(p => { this.ctx.save(); this.ctx.globalAlpha=p.life/p.maxLife; this.ctx.fillStyle=p.color; this.ctx.fillRect(p.x-p.size/2, p.y-p.size/2, p.size, p.size); this.ctx.restore(); }); }
    createHeroes() { 
        const gs=this.adventureGame.masterGameState?.gearScore??187, hp=GAME_CONFIG.hero.maxHp+Math.max(0, Math.floor(gs-187)), dmgR=GAME_CONFIG.hero.damageRange;
        const mkH=(i)=>({emoji:GAME_CONFIG.hero.emojis[Math.floor(Math.random()*GAME_CONFIG.hero.emojis.length)], x:10+(i!==undefined?i*20:Math.random()*200), y:this.canvas.height/3+(i!==undefined?0:(Math.random()-0.5)*100), targetX:0, targetY:0, hp, maxHp:hp, speed:this.rand(GAME_CONFIG.hero.speedRange), attackSpeed:this.rand(GAME_CONFIG.hero.attackSpeedRange), damage:this.randInt(dmgR)+Math.max(0, Math.floor(gs-187)), inPosition:false, wigglePhase:Math.random()*6.28, lastHitTime:0, isDead:false});
        this.heroes=(this.animationState.heroes?.length>0)?this.animationState.heroes.map((h,i)=>({...h, ...mkH(), id:i, x:h.x, y:h.y, hp, maxHp:hp})):Array.from({length:this.animationState.heroCount},(_,i)=>({...mkH(i), id:i}));
    } 
    createMonsters() { 
        this.monsters = []; const pos=[[-200,0],[-100,-100],[0,-100],[100,0],[200,100],[300,100],[400,0]], offX=this.canvas.width/2-100, offY=this.canvas.height/2, mult=this.animationState.heroCount/5; 
        pos.forEach(([dx,dy],i) => { const isE=GAME_CONFIG.monsterScene.eliteIndices.includes(i), base=isE?GAME_CONFIG.monsterScene.eliteMaxHp:GAME_CONFIG.monsterScene.monsterMaxHp; this.monsters.push({isElite:isE, x:offX+dx, y:offY+dy, emoji:isE?GAME_CONFIG.monsterScene.eliteEmojis[Math.floor(Math.random()*GAME_CONFIG.monsterScene.eliteEmojis.length)]:GAME_CONFIG.monsterScene.monsterEmojis[Math.floor(Math.random()*GAME_CONFIG.monsterScene.monsterEmojis.length)], hp:Math.floor(base*mult), maxHp:Math.floor(base*mult), size:isE?GAME_CONFIG.monsterScene.eliteSize:GAME_CONFIG.monsterScene.monsterSize, damage:isE?GAME_CONFIG.monsterScene.eliteDamage:GAME_CONFIG.monsterScene.monsterDamage, attackRange:GAME_CONFIG.monsterScene.monsterAttackRange, lastHitTime:0, isDead:false}); }); 
    } 
    gameLoop(ts) { 
        let dt=(ts-this.lastFrameTime)/(1000/60); if(dt>10)dt=1; this.lastFrameTime=ts;
        const prof=this.adventureGame.masterGameState?.proficiency??0, spd=BASE_BATTLE_SPEED_MULTIPLIER+(3*prof)/(4000+prof);
        this.updateParticles((ts-this.lastFrameTime)/1000); 
        if(!this.gameOver) { this.update(dt*spd); this.render(ts); this.drawParticles(); this.animationFrameId=requestAnimationFrame(this.gameLoop); }
        else if(this.particles.length>0) { this.render(ts); this.drawParticles(); this.animationFrameId=requestAnimationFrame(this.gameLoop); }
    } 
    update(dt) { 
        if(!this.battleStarted) { this.battleStarted=true; this.battleStartTime=performance.now(); } 
        while(this.currentTargetIndex<this.monsters.length&&this.monsters[this.currentTargetIndex].hp<=0) this.currentTargetIndex++; 
        const cur=this.monsters[this.currentTargetIndex], chance=0.02*dt; 
        this.heroes.forEach(h=>{ if(h.hp<=0)return; if(cur){ h.targetMonster=this.currentTargetIndex; h.targetX=cur.x-60; h.targetY=cur.y; const dx=h.targetX-h.x, dy=h.targetY-h.y, dist=Math.hypot(dx,dy); if(dist>15){h.inPosition=false; const mv=Math.min(dist, h.speed*dt); h.x+=(dx/dist)*mv; h.y+=(dy/dist)*mv;}else h.inPosition=true; }else h.targetMonster=null; }); 
        if(cur&&cur.hp>0) this.heroes.forEach(h=>{ if(h.hp>0&&h.inPosition&&h.targetMonster===this.currentTargetIndex){ if(Math.random()<chance*h.attackSpeed){cur.hp=Math.max(0,cur.hp-h.damage); cur.lastHitTime=performance.now();} } }); 
        if(cur&&cur.hp>0&&performance.now()-this.lastMonsterAttackTime>(GAME_CONFIG.monsterScene.monsterAttackInterval/(BASE_BATTLE_SPEED_MULTIPLIER+(3*(this.adventureGame.masterGameState?.proficiency??0))/(4000+(this.adventureGame.masterGameState?.proficiency??0))))) { 
            this.lastMonsterAttackTime=performance.now(); const targets=this.heroes.filter(h=>h.hp>0&&Math.hypot(h.x-cur.x,h.y-cur.y)<cur.attackRange); 
            if(targets.length>0){ const t=targets[Math.floor(Math.random()*targets.length)]; t.hp=Math.max(0,t.hp-cur.damage); t.lastHitTime=performance.now(); } 
        } 
        this.monsters.forEach(m=>{if(m.hp<=0&&!m.isDead){m.isDead=true; this.createExplosion(m.x,m.y,m.isElite?'#ff4400':'#ff9900');}});
        this.heroes.forEach(h=>{if(h.hp<=0&&!h.isDead){h.isDead=true; this.createExplosion(h.x,h.y,'#66B3FF');}});
        this.checkGameOver(); 
    } 
    checkGameOver() { if(!this.battleStarted||this.gameOver)return; if(!this.heroes.some(h=>h.hp>0)||!this.monsters.some(m=>m.hp>0)){ this.gameOver=true; this.adventureGame.handleSceneResult({winner:this.heroes.some(h=>h.hp>0)?"勇士":"怪物", survivors:this.heroes.filter(h=>h.hp>0), totalHeroes:this.heroes.length, battleTime:(performance.now()-this.battleStartTime)/1000}); } } 
    render(ts) { 
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height); 
        this.monsters.forEach((m,i)=>{ const col=(m.hp>0)?((i===this.currentTargetIndex)?"yellow":(m.isElite?"red":"orange")):"#555"; this.drawChar(m.hp>0?m.emoji:"💀", m.x, m.y, m.size, col, (ts-m.lastHitTime)<50); this.drawBar(m.x-50, m.y-40, m.hp, m.maxHp, m.isElite?"red":"orange", m.isElite?"精英":"小怪"); }); 
        this.heroes.forEach(h=>{ let dx=h.x, dy=h.y; if(h.inPosition&&h.hp>0){dx+=Math.sin(h.wigglePhase)*3; dy+=Math.cos(h.wigglePhase*1.3)*3; h.wigglePhase+=0.05;} this.drawChar(h.hp>0?h.emoji:"💀", dx, dy, GAME_CONFIG.hero.size, this.getHeroColor(h), (ts-h.lastHitTime)<50); if(h.hp>0) this.drawBar(h.x-25, h.y-30, h.hp, h.maxHp, "#2196F3"); }); 
    } 
    drawChar(emoji, x, y, size, color, isHit=false) { this.ctx.save(); this.ctx.font=`${size}px Arial`; this.ctx.textAlign="center"; this.ctx.textBaseline="middle"; if(isHit){this.ctx.globalCompositeOperation='source-atop'; this.ctx.fillStyle='rgba(255,255,255,0.8)'; this.ctx.fillText(emoji,x,y);}else{this.ctx.fillStyle=color; this.ctx.fillText(emoji,x,y);} this.ctx.restore(); } 
    drawBar(x, y, cur, max, color, lbl="") { const w=lbl?100:50, h=lbl?10:6, r=cur/max; this.ctx.fillStyle="#333"; this.ctx.fillRect(x,y,w,h); this.ctx.fillStyle=color; this.ctx.fillRect(x,y,w*r,h); this.ctx.strokeStyle="#AAA"; this.ctx.strokeRect(x,y,w,h); if(lbl){this.ctx.fillStyle="white"; this.ctx.font="12px Arial"; this.ctx.textAlign="center"; this.ctx.textBaseline="bottom"; this.ctx.fillText(lbl,x+w/2,y-2);} }
    getHeroColor(h) { const r=h.hp/h.maxHp; return h.hp<=0?GAME_CONFIG.hero.colors.dead:r>0.6?GAME_CONFIG.hero.colors.healthy:r>0.3?GAME_CONFIG.hero.colors.injured:GAME_CONFIG.hero.colors.critical; }
    rand(r) { return r[0]+Math.random()*(r[1]-r[0]); } randInt(r) { return r[0]+Math.floor(Math.random()*(r[1]-r[0]+1)); }
}