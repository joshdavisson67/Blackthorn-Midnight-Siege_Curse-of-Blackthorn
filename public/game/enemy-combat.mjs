import * as T from './three.module.js';
import {CRAWL,reactToHit,noteLegDamage,beginZombieDeath} from './zombies.mjs?v=183';
import {registerStagger} from './combat-feedback.mjs?v=184';
import {enrageNearby} from './enrage.mjs?v=130';
import {LURKER,lurkerPlayerDamage,lurkerEnemyDamage} from './lurker.mjs?v=179';
import {choosePowerup} from './powerups.mjs?v=190';
import {EXPLOSION_FX} from './explosion-fx.mjs?v=191';
import {dropOpacity,fadeMaterials} from './drop-fade.mjs?v=169';

// Enemy combat (v196, Dead Tide step 1): hits, kills, blasts, drops and pickups for
// any map. Moved from game.js unchanged; scripts/golden-trace.mjs checks the mansion
// plays identically. A mode passes its map (level), its session (run) and its own
// rewards and extras (rules); the README's version 196 section lists every field.
export const GRENADE_BLAST_RADIUS=12,GRENADE_DAMAGE=450;
export function createCombat({level,run,rules}){
  const {supportBelow,floorHeight,solidMeshes,visibleFloor}=level;
  const {player,zombies,scene,rand,rng,tone,noise,notify,rumble,sphere,effects,bloodPool,explosionFx,blastLight,powerupAssets,pickups,enemyAssets,
    addPoints,addKill,hurtPlayer,kick,killHeal,hitFeedback,collect,releasePickup}=run;
  const lurkerBursts=[];
  // A lurker bursts: everything within 4 m with a clear line takes the blast.
  function lurkerBurst(e){
    // Where it stood when it went off (the ragdoll may already be moving).
    const at=e.lurkerAt||e.walkPos,ground=new T.Vector3(at.x,Math.abs(at.y)>.1?at.y:floorHeight(at.x,at.z),at.z),pos=ground.clone().add(new T.Vector3(0,.9,0));
    noise(.9,.4,420);tone(42,.9,.22,'sawtooth',22);tone(90,.35,.12,'square',30);
    {const d=Math.hypot(pos.x-player.x,pos.z-player.z);if(d<16)rumble(1-d/16,.9*(1-d/16),360);}
    const s=sphere(pos.x,pos.y-.2,pos.z,.42,.42,.42,new T.MeshBasicMaterial({color:0x9dff4a,transparent:true,opacity:.8}));
    effects.push({mesh:s,vel:new T.Vector3(),life:.4,max:.4,type:'blast'});
    bloodBurst(pos,26);e.group.visible=false;if(e.ragdoll)e.ragdoll.life=Math.min(e.ragdoll.life,e.death+.05);
    for(const o of zombies){
      if(o===e||o.dead)continue;const d=Math.hypot(o.walkPos.x-at.x,o.walkPos.z-at.z),dmg=lurkerEnemyDamage(d);
      if(dmg>0&&Math.abs(o.walkPos.y-e.walkPos.y)<2.2&&blastLine(pos,o.group.position.clone().add(new T.Vector3(0,.9,0))))
        damageEnemy(o,dmg,false,{direction:o.group.position.clone().sub(ground),part:'torso',force:2.4*(1-d/12),source:'lurker'});
    }
    const pd=lurkerPlayerDamage(Math.hypot(player.x-at.x,player.z-at.z));
    if(pd>0&&Math.abs(player.y-e.walkPos.y)<2.2&&blastLine(pos,player.clone().add(new T.Vector3(0,.9,0))))hurtPlayer(pd,pos);
  }
  function killZombie(e,headshot=false,impact={}){if(e.dead)return;e.dead=true;e.death=0;killHeal(impact);rules.onKill(e,impact);const massKill=impact.source==='nuke';if(massKill)e.hp=0;
  // v179: a lurker that reaches you bursts by itself (no essence); zombies its
  // blast kills pay 35% more.
  const selfBurst=impact.source==='lurkerSelf';if(e.lurker&&!e.lurkerBurst){e.lurkerBurst=true;e.lurkerAt=e.walkPos.clone();lurkerBursts.push(e);}
  const reward=selfBurst?0:addPoints(rules.killReward(headshot?(e.brute?200:75):e.brute?110:50)*(impact.source==='lurker'?LURKER.essenceBonus:1));if(!selfBurst)addKill();if(e.bonusEssence)rules.bonusDrop(e);const enraged=massKill?0:enrageNearby(e,zombies,Math.random,enemyAssets.enrage);if(!massKill&&!selfBurst){if(headshot){notify(`HEADSHOT +${reward}`);}else tone(280,.06,.025,'triangle');}if(!selfBurst&&Math.random()<.13)dropPickup(e.group.position.x,e.group.position.z,choosePowerup(Math.random()),e.floorY);bloodBurst(e.group.position.clone().add(new T.Vector3(0,e.dog?.55:1.4,0)),massKill?4:10);beginZombieDeath(e,{...impact,source:massKill?'grenade':impact.source,part:headshot?'head':impact.part},rng);
  if(enraged&&e.walkPos.distanceToSquared(player)<324)notify(`BLOOD RAGE · ${enraged} NEARBY ${enraged===1?'ENEMY':'ENEMIES'} ENRAGED`);
  const corpses=zombies.filter(z=>z.dead&&z.ragdoll.life>z.death);if(corpses.length>14){const oldest=corpses.reduce((a,b)=>a.death>b.death?a:b);oldest.ragdoll.life=oldest.death;}
  }
  function damageEnemy(e,amount,headshot=false,impact={}){if(e.dead||e.waking)return;amount=rules.hitAmount(e,amount,impact);e.hp-=amount;if(impact.part==='leg'&&!headshot&&noteLegDamage(e,amount,impact.side)){e.bodyHeight=CRAWL.height;tone(55,.18,.05,'sine',38);noise(.12,.05,260);}addPoints(10);hitFeedback(headshot,impact);const reaction=headshot&&impact.part!=='head'?{...impact,part:'head'}:impact;reactToHit(e,reaction);if(!e.elite)registerStagger(e,reaction);if(e.hp<=0)killZombie(e,headshot,reaction);}
  function bloodBurst(pos,count){for(let i=0;i<count;i++){const sx=rand(.01,.025),sy=rand(.01,.03),sz=rand(.01,.025),vx=rand(-1.4,1.4),vy=rand(.5,2),vz=rand(-1.4,1.4),effect=bloodPool.acquire();if(!effect)continue;effect.mesh.position.copy(pos);effect.mesh.scale.set(sx,sy,sz);effect.vel.set(vx,vy,vz);effect.life=effect.max=.6;effects.push(effect);}}
  function dropPickup(x,z,type,y=0){const m=powerupAssets.create(type);m.userData.lightingTransient=true;m.position.set(x,y+.85,z);scene.add(m);pickups.push({mesh:m,type,y,life:20,phase:rand(0,6)});}
  function blastLine(from,to){const delta=to.clone().sub(from),len=delta.length();return new T.Raycaster(from,delta.normalize(),.05,Math.max(.05,len-.15)).intersectObjects(solidMeshes,true).length===0;}
  // v184: Bella's cart launcher bursts like a grenade but never hurts the player.
  function explode(pos,{source='grenade',safe=false}={}){
    noise(.6,.35,700);tone(65,.65,.2,'sine',25);
    {const d=Math.hypot(pos.x-player.x,pos.z-player.z);if(d<14)rumble(1-d/14,.8*(1-d/14),320);}
    // v185: a pooled fireball, smoke, sparks, dust and scorch (explosion-fx.mjs).
    // The blast effect itself only anchors the combat light's flash.
    const support=supportBelow(pos.x,pos.z,pos.y+.3),fx=explosionFx.burst(pos,{floorY:pos.y-support<EXPLOSION_FX.groundReach?visibleFloor(pos.x,pos.z,support):support});
    effects.push({mesh:fx.anchor,vel:new T.Vector3(),life:.35,max:.35,type:'blast',pool:blastLight,burst:fx});
    for(const e of zombies){
      const d=e.group.position.distanceTo(pos);
      if(d<GRENADE_BLAST_RADIUS&&!e.dead&&blastLine(pos,e.group.position.clone().add(new T.Vector3(0,.9,0)))){
        // Full damage through 75% of the radius; the outer quarter takes half.
        const damage=GRENADE_DAMAGE*(d<=GRENADE_BLAST_RADIUS*.75?1:.5);
        damageEnemy(e,damage,false,{direction:e.group.position.clone().sub(pos),part:'torso',force:2.7*(1-d/18),source,blast:true});
      }
    }
    if(!safe&&player.distanceTo(pos)<3&&blastLine(pos,player.clone().add(new T.Vector3(0,.9,0))))hurtPlayer(25,pos);
    kick();
  }
  // v191: the M4 capstone's detonating rounds. Each round bursts where it strikes:
  // a 5 m blast for 33% of a grenade (full through 75% of the radius, half beyond),
  // through the same line-of-blast check, never hurting the player.
  function detonateRound(pos,{radius,fraction},source){
    explosionFx.pop(pos);noise(.07,.06,1400);tone(150,.09,.025,'sine',70);
    for(const e of zombies){
      if(e.dead)continue;const d=e.group.position.distanceTo(pos);
      if(d<radius&&blastLine(pos,e.group.position.clone().add(new T.Vector3(0,.9,0))))damageEnemy(e,GRENADE_DAMAGE*fraction*(d<=radius*.75?1:.5),false,{direction:e.group.position.clone().sub(pos),part:'torso',force:1.2*(1-d/radius),source,blast:true});
    }
  }
  function updatePickups(dt){for(let i=pickups.length-1;i>=0;i--){const p=pickups[i];p.life-=dt;
  // v169: the last five seconds fade out and in, faster for the final two.
  {const fade=dropOpacity(p.life);if(fade<1&&p.life>0&&!p.fade)p.fade=fadeMaterials(p.mesh);if(p.fade)p.fade.set(fade);}if(p.mesh.userData.model)p.mesh.userData.model.rotation.y+=dt*.65;p.mesh.position.y=(p.y||0)+.8+Math.sin(run.elapsed*2+p.phase)*.15;if(p.eventPool)p.mesh.rotation.y+=dt*1.4;if(run.playing&&p.life>0&&Math.abs((p.y||0)-player.y)<1.2&&Math.hypot(p.mesh.position.x-player.x,p.mesh.position.z-player.z)<1.2){collect(p);tone(660,.4,.1,'triangle',1200);p.life=0;}if(p.life<=0){p.fade?.dispose();p.fade=null;if(p.eventPool)releasePickup(p);else scene.remove(p.mesh);pickups.splice(i,1);}}}
  return {damageEnemy,killZombie,bloodBurst,blastLine,explode,detonateRound,lurkerBurst,lurkerBursts,dropPickup,updatePickups};
}
