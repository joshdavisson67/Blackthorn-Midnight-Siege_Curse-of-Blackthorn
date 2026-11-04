import assert from 'node:assert/strict';
import * as T from '../public/game/three.module.js';
import {waveConfig} from '../public/game/core.mjs';
import {LURKER,lurkerPlayerDamage,lurkerEnemyDamage,lurkerPulse} from '../public/game/lurker.mjs';

const near=(v,t,tol)=>Math.abs(v-t)<=tol;

// v179: the Grotesque Lurker and the wave 10 stench finale.
export function verifyLurker(qa,frames,listeners,elements){
  const st=()=>qa.get(),living=()=>st().zombies.filter(e=>!e.dead);
  const clear=()=>{for(const e of living())qa.damageEnemy(e,1e7);frames(3);};
  // Spawns are held but still queued, so the wave never completes under the test.
  const setup=(wave=1)=>{qa.start();for(let i=0;i<wave;i++)qa.startWave();qa.holdSpawns();clear();qa.setHealth(100);};

  // ---- Rules ---------------------------------------------------------------------
  assert(near(LURKER.chargeRange,10.97,.01),'12 yards is 10.97 m');
  assert.equal(lurkerPlayerDamage(.5),75);assert.equal(lurkerPlayerDamage(LURKER.fullRadius),75);
  assert(lurkerPlayerDamage(2.75)>30&&lurkerPlayerDamage(2.75)<45&&lurkerPlayerDamage(4)===0,'The burst fades to nothing at 4 m');
  assert(lurkerEnemyDamage(2)===LURKER.enemyDamage&&lurkerEnemyDamage(3.5)===LURKER.enemyDamage/2&&lurkerEnemyDamage(4.2)===0);
  {const v=[];for(let t=0;t<4;t+=1/60)v.push(lurkerPulse(t,LURKER.blink));const peaks=v.map((x,i)=>i&&x>.97&&v[i-1]<x?i:-1).filter(i=>i>0);
   assert(peaks.length>=4&&peaks.slice(1).every((p,i)=>near((p-peaks[i])/60,LURKER.blink,.04)),'The belly blinks every 0.8 s');}

  // ---- The body ---------------------------------------------------------------------
  setup(1);qa.setPlayer(0,0);
  const L=qa.makeLurker(0,18),walker=qa.makeZombie(3,18),cfg=waveConfig(1);
  assert(L.lurker&&L.templateIndex===10&&L.style==='grotesque lurker','A Lurker wears its own body');
  assert(near(L.speed,cfg.speed*LURKER.speed,1e-9),'It moves at 125% of the standard zombie speed');
  assert(near(L.maxHp,walker.maxHp*LURKER.health,1e-6),'and has half again a walker’s health');
  assert(L.gait.hunch>.3&&L.build.kneeBend>.25&&L.gait.arms==='dangle','Bent double, arms hanging');
  assert.equal(L.lurkerGlow.parts.length,2,'Its belly seam and shell glow');
  const template=st().enemyAssets.templates[10];const glows=[];template.group.traverse(o=>{if(o.isMesh&&o.material.userData.lurkerGlow)glows.push(o.material);});
  assert(L.lurkerGlow.parts.every(o=>!glows.includes(o.material)),'Each Lurker blinks on its own beat (its own glow materials)');
  let boils=0,belly=false;{const T2=st().enemyAssets.templates[10];let verts=0,base=0;T2.group.traverse(o=>{if(o.isMesh)verts+=o.geometry.attributes.position.count;});st().enemyAssets.templates[2].group.traverse(o=>{if(o.isMesh)base+=o.geometry.attributes.position.count;});boils=verts-base;belly=verts>base;}
  assert(belly&&boils>3000,`Boils, a swollen belly and heavy stitches add to the body (${boils} extra vertices)`);
  const seam=L.lurkerGlow.parts.find(o=>o.material.userData.lurkerGlow==='seam').material,glowSeen=[];
  for(let i=0;i<120;i++){frames(1);glowSeen.push(seam.emissiveIntensity);}
  assert(Math.max(...glowSeen)-Math.min(...glowSeen)>1.2,'The glow swells and fades');
  assert(L.attack>1e8&&L.attackTime<0,'It never swings');

  // ---- Lurch, then charge from 12 yards --------------------------------------------------
  {
    setup(1);qa.setPlayer(0,0);qa.setHealth(1e9);const e=qa.makeLurker(0,24);e.life=null;e.flank=0;
    const z0=e.walkPos.z;frames(120);const lurch=(z0-e.walkPos.z)/2;
    assert(near(lurch,e.speed,e.speed*.06),`It lurches in at 125% speed (${lurch.toFixed(2)} m/s)`);
    let chargeAt=null;for(let i=0;i<900&&!e.lurkerCharging;i++){frames(1);if(e.lurkerCharging)chargeAt=Math.hypot(e.walkPos.x,e.walkPos.z);}
    assert(chargeAt&&chargeAt<=LURKER.chargeRange+.05&&chargeAt>LURKER.chargeRange-.6,`and charges once within 12 yards (${chargeAt?.toFixed(2)} m)`);
    const c0=e.walkPos.z;frames(60);const rush=c0-e.walkPos.z;
    assert(near(rush,e.speed*LURKER.charge,e.speed*.15),`at double speed (${rush.toFixed(2)} m/s)`);
    // Frenzy does not stack on it.
    setup(1);qa.setPlayer(0,0);qa.setHealth(1e9);const f=qa.makeLurker(0,24);f.life=null;f.flank=0;qa.triggerFrenzy();qa.holdSpawns();
    const w=qa.makeZombie(2,24);w.life=null;w.flank=0;w.speed=f.speed;const fz=f.walkPos.z,wz=w.walkPos.z;frames(60);
    assert(near(fz-f.walkPos.z,f.speed,f.speed*.06),'Frenzy leaves a Lurker’s pace alone');
    assert((wz-w.walkPos.z)>(fz-f.walkPos.z)*1.3,'while the walkers beside it speed up');
  }

  // ---- Reaching you: it bursts --------------------------------------------------------------
  {
    setup(1);qa.setPlayer(0,0);qa.setHealth(100);const e=qa.makeLurker(0,6);e.life=null;
    const points=st().points,kills=st().kills;for(let i=0;i<600&&!e.dead;i++)frames(1);frames(2);
    assert(e.dead&&!e.group.visible,'A Lurker that reaches you bursts');
    assert.equal(st().health,100-LURKER.playerDamage,'for 75 damage');
    assert.equal(st().kills,kills,'Its own burst is not your kill');assert.equal(st().points,points,'and pays nothing');
  }

  // ---- Killed at range: still bursts, and pays 35% more for what it kills -------------------------
  {
    setup(1);qa.setPlayer(0,0);qa.setHealth(100);
    const e=qa.makeLurker(0,12),victim=qa.makeZombie(1.5,12),far=qa.makeZombie(8,12);for(const z of [e,victim,far]){z.speed=0;z.life=null;}
    frames(2);const before=st().points;qa.damageEnemy(e,1e7,false,{part:'torso',source:'glock'});const afterLurker=st().points;frames(2);
    assert(victim.dead&&!far.dead,'Killing it at range still sets it off, and its blast kills what stands near');
    assert.equal(st().health,100,'You are well clear at 12 m');
    const blastPay=st().points-afterLurker;
    setup(1);qa.setPlayer(0,0);const plain=qa.makeZombie(1.5,12);plain.speed=0;const p0=st().points;qa.damageEnemy(plain,1e7,false,{part:'torso',source:'glock'});const plainPay=st().points-p0;
    assert(near(blastPay-10,(plainPay-10)*LURKER.essenceBonus,1),`Zombies the blast kills pay 35% more essence (${blastPay-10} vs ${plainPay-10})`);
    assert(afterLurker>before,'The Lurker itself pays as usual when you kill it');
    // Shot up close: you take part of the blast.
    setup(1);qa.setPlayer(0,0);qa.setHealth(100);const close=qa.makeLurker(0,2.75);close.speed=0;frames(1);
    qa.damageEnemy(close,1e7,false,{part:'torso',source:'glock'});frames(2);
    assert(near(100-st().health,lurkerPlayerDamage(2.75),1.5),`Popping one at 2.75 m still costs you ${lurkerPlayerDamage(2.75).toFixed(0)} health`);
    // Chain reaction.
    setup(1);qa.setPlayer(0,0);const a=qa.makeLurker(0,14),b=qa.makeLurker(1.6,14);a.speed=b.speed=0;b.hp=b.maxHp=200;frames(1);
    qa.damageEnemy(a,1e7);frames(3);assert(b.dead&&!b.group.visible,'One Lurker’s burst sets off the next');
  }

  // ---- Spawns ----------------------------------------------------------------------------------
  {
    const roll=(fromWave,toWave)=>{let n=0,l=0;qa.start();qa.setHealth(1e9);qa.setPlayer(0,0);while(st().wave<fromWave)qa.startWave();qa.holdSpawns();
      for(let i=0;i<1400&&st().wave<=toWave;i++){clear();if(!qa.spawnEnemy()){qa.startWave();qa.holdSpawns();continue;}n++;if(st().zombies.at(-1).lurker)l++;}return {n,l};};
    const early=roll(1,9);assert(early.n>150&&early.l===0,'No Lurkers in the first nine waves');
    const late=roll(11,30);assert(late.n>400&&near(late.l/late.n,LURKER.spawnChance,.025),`About one spawn in twenty from wave 11 (${late.l} of ${late.n})`);
  }

  // ---- Wave 10: a second frenzied finale, with a stench ----------------------------------------------
  {
    qa.start();qa.setHealth(1e9);qa.setPlayer(0,23);for(let i=0;i<10;i++)qa.startWave();assert.equal(st().wave,10);
    st().nav.rebuild(0,23,0);const count=st().toSpawn;for(let i=0;i<count;i++)qa.spawnEnemy();
    const ordinary=living();assert(ordinary.every(e=>!e.lurker),'The ordinary part of wave 10 has no Lurkers');
    for(const e of ordinary)qa.damageEnemy(e,1e7);frames(8);
    let s=st();assert.equal(s.waveFiveFinale?.wave,10,'Clearing wave 10 starts its finale');assert.equal(s.frenzyWave,10,'and it is frenzied');
    assert(elements.get('banner').textContent.includes('FRENZIED FINALE')&&elements.get('banner').textContent.includes('STENCH'),'A disgusting stench heralds it');
    const lurkers=s.waveFiveFinale.kinds.filter(k=>k==='lurker').length;
    assert(lurkers>=2&&lurkers<=3,`with ${lurkers} Grotesque Lurkers`);assert.equal(s.waveFiveFinale.kinds.length,LURKER.finale.count);
    assert(elements.get('frenzyHud').textContent.includes(`${lurkers} LURKERS`),'The frenzy HUD counts the Lurkers left');
    for(let t=0;t<2400&&st().toSpawn>0;t++){frames(1);qa.setHealth(1e9);}
    s=st();assert.equal(s.waveFiveFinale.enemies.filter(e=>e.lurker).length,lurkers,'Every Lurker on the roster arrives');
    for(const e of living())qa.damageEnemy(e,1e7);for(let t=0;t<20&&st().waveDelay===0;t++)frames(1);
    assert(st().waveDelay>0&&elements.get('banner').textContent.includes('FINALE CLEARED'),'and clearing it ends wave 10');
  }
  assert(elements.get('guideBody')?.innerHTML.includes('Grotesque Lurkers')??true,'The field guide describes them');
  console.log(`PASS: Grotesque Lurker: own hunched, boil-covered body with a stitched, blinking belly (every ${LURKER.blink} s); 125% speed, 1.5× walker health, double-speed charge from 12 yards (frenzy doesn't stack); bursts on reaching you for 75 or when killed, hurting everything within 4 m (sight-checked), chain-reacting, its blast kills paying 35% more essence; 1 in 20 spawns from wave 11; wave 10 ends in a stench-heralded frenzied finale with 2–3 Lurkers.`);
}
