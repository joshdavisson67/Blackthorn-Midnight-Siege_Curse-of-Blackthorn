import * as T from './three.module.js';
import {weapons,weaponAimFov} from './weapon-stats.mjs?v=205';
import {COMBAT} from './combat-feedback.mjs?v=205';
import {INJURY} from './zombie-injuries.mjs?v=178';
import {forgeBonuses} from './soul-forge.mjs?v=205';
import {setPistolDot} from './weapon-models.mjs?v=205';
import {nextRank,rankMagazine,rankReserve,rankDamage,rankFireRate,rankHasDot,rankReloadTime,rankDual,rankAuto,rankRecoil,rankDetonate} from './weapon-ranks.mjs?v=191';
import {GRENADE_THROW} from './grenade-throw.mjs?v=186';
import {POWERUPS} from './powerups.mjs?v=205';
import {KATANA,SLASHES,slashTargets,slashImpact} from './katana.mjs?v=205';

// Weapon runtime (v197, Dead Tide step 1): firing, reloading, ammunition, weapon
// ranks and their effects, the first-person gun on screen, grenades and power-ups,
// for any map. v205: the katana's slashes too (`run.player` is where you stand). Moved from game.js unchanged; scripts/golden-trace.mjs checks the
// mansion plays identically. The run's own values (inventory, the held weapon,
// timers, essence, aim) still live with the mode and are reached through `state`;
// the README's version 197 section lists every field.
export function createWeaponRuntime({level,view,run,state:S,combat}){
  const {colliders,isBlocked,solidMeshes}=level;
  const {camera,gunGroups,bushDot,smgDual,dualGuns,dualMuzzle,flash,reticleHud,weaponRecoil,grenadeThrow,grenadeAssets}=view;
  const {scene,zombies,effects,markPool,rand,tone,noise,notify,rumble,suppressedReport,updateHud,updateReloadHud,player}=run;
  const clamp=T.MathUtils.clamp,dir=new T.Vector3(),grenadeLaunchRay=new T.Raycaster();
  // Weapon ranks set the base magazine (v159) and a reserve that grows with it
  // (v160); the Soul Forge scales both on top.
  function ammoCapacity(k=S.weapon){if(weapons[k].melee)return {mag:0,reserve:0};const inv=S.inventory[k],w=weapons[k],multiplier=forgeBonuses(inv.forgeRank).ammoMultiplier;return {mag:Math.ceil(rankMagazine(k,inv.weaponRank,w.mag)*multiplier)*(rankDual(k,inv.weaponRank)?2:1),reserve:Math.ceil(rankReserve(k,inv.weaponRank,w.mag,w.reserve)*multiplier)};}
  function freshInventory(){return Object.fromEntries(Object.entries(weapons).map(([k,v])=>[k,{ammo:v.mag,reserve:v.reserve,owned:k==='glock',forgeRank:0,weaponRank:0}]));}
  function selectWeapon(k){if(!S.inventory[k].owned||S.reloadLeft>0)return;if(S.weapon!==k){weaponRecoil.reset();camera.fov=S.weaponViewFov=75;camera.updateProjectionMatrix();if(swing.active||k==='katana')drawKatana(k);}S.weapon=k;reticleHud.select(k);S.recoil=.06;flash.position.copy(viewGun(k).userData.muzzle);flash.scale.setScalar(k==='glock'?.58:k==='smg'?.32:1);flash.position.z-=.11*flash.scale.x;for(const t in gunGroups)gunGroups[t].visible=t===k;syncDualSmg();syncBushmasterSight();updateHud();}
  function shoot(){if(S.mode!=='playing'||grenadeThrow.active||S.reloadLeft>0||S.shotTimer>0)return;if(weapons[S.weapon].melee){slash();return;}const inv=S.inventory[S.weapon],w=weapons[S.weapon];if(inv.ammo<=0){S.shotTimer=.25;tone(120,.045,.03,'square');reload();return;}inv.ammo--;S.shotTimer=w.rate/rankFireRate(S.weapon,inv.weaponRank);{const r=run.shotRumble[S.weapon];if(r)rumble(...r);}const id=++S.shotId;if(S.weapon==='glock')gunGroups.glock.userData.slideTime=.12;if(dualOn())fireDualSide();S.flashTime=.045;if(S.weapon==='smg')suppressedReport();else{noise(S.weapon==='shotgun'?.22:.12,.18,S.weapon==='shotgun'?1200:2500);tone(80,.13,.1,'triangle',35);}const active=zombies.filter(e=>!e.dead).map(e=>e.group);const hitObjects=[...solidMeshes,...active];
  camera.rotation.set(clamp(S.lookPitch+weaponRecoil.pitch,-1.3,1.3),S.lookYaw+weaponRecoil.yaw,0);camera.updateMatrixWorld();
  for(let i=0;i<w.pellets;i++){const spread=S.aiming?(w.aimSpread??w.spread*.28):w.spread;dir.set(rand(-spread,spread),rand(-spread,spread),-1).normalize().applyQuaternion(camera.quaternion);run.raycaster.set(camera.position,dir);const hits=run.raycaster.intersectObjects(hitObjects,true);if(hits.length){const h=hits[0],e=h.object.userData.enemy;if(e&&!e.dead){const head=h.object.userData.head;const damage=w.damage*(S.perkOwned.has('eye')?1.5:1)*forgeBonuses(inv.forgeRank).damageMultiplier*rankDamage(S.weapon,inv.weaponRank)*(head?2.6*(e.crushed?INJURY.crushedHeadshot:1):1)*(S.doubleTime>0?2:1);combat.damageEnemy(e,damage,head,{direction:dir.clone(),point:h.point.clone(),part:h.object.userData.part,side:h.object.userData.side,limb:h.object.userData.limb,force:COMBAT[S.weapon].force,source:S.weapon,shotId:id});combat.bloodBurst(h.point,3);}else if(Math.random()<.5){const effect=markPool.acquire();if(effect){effect.mesh.position.copy(h.point);effect.mesh.scale.set(.025,.025,.025);effect.vel.set(0,0,0);effect.life=effect.max=6;effects.push(effect);}}const detonate=rankDetonate(S.weapon,inv.weaponRank);if(detonate)combat.detonateRound(h.point.clone().addScaledVector(dir,-.08),detonate,S.weapon);}}
  weaponRecoil.fire(S.weapon,S.aiming,rankRecoil(S.weapon,inv.weaponRank));if(inv.ammo===0)notify('MAGAZINE EMPTY · PRESS R');updateHud();}
  function reload(){const inv=S.inventory[S.weapon],w=weapons[S.weapon];if(S.mode!=='playing'||grenadeThrow.active||S.reloadLeft>0||inv.ammo>=ammoCapacity().mag||inv.reserve<=0)return;S.reloadDuration=w.reload*forgeBonuses(inv.forgeRank).reloadMultiplier*rankReloadTime(S.weapon,inv.weaponRank)*(S.perkOwned.has('quick')?.5:1);S.reloadLeft=S.reloadDuration;updateReloadHud();tone(330,.12,.06,'square');}
  function finishReload(){const inv=S.inventory[S.weapon],needed=Math.max(0,ammoCapacity().mag-inv.ammo),n=Math.min(needed,inv.reserve);inv.ammo+=n;inv.reserve-=n;tone(500,.1,.05,'square');}
  // Include the missing magazine rounds in reserve, so a normal reload leaves
  // both compartments full. Repeated refills replace this allowance, not stack it.
  function restockTarget(k){const inv=S.inventory[k],capacity=ammoCapacity(k);return capacity.reserve+Math.max(0,capacity.mag-inv.ammo);}
  function restockWeapon(k){S.inventory[k].reserve=restockTarget(k);}
  function ammoFull(k){return S.inventory[k].reserve>=restockTarget(k);}
  function aimHeight(k){const u=viewGun(k).userData;return u.pistolDot&&rankHasDot(k,S.inventory[k].weaponRank)?u.pistolDot.height:u.sightHeight;}
  function applyWeaponRanks(){setPistolDot(gunGroups.glock,rankHasDot('glock',S.inventory.glock.weaponRank));if(gunGroups[S.weapon])gunGroups[S.weapon].visible=true;syncDualSmg();syncBushmasterSight();}
  const RANK_LABEL={glock:'PISTOL',smg:'RAVEN',shotgun:'M12',bushmaster:'BUSHMASTER',rifle:'M4',lmg:'WARDEN'};
  // The Bushmaster's red dot (Rank I) swaps its view model and drops the 10x zoom.
  function bushDotOn(){return rankHasDot('bushmaster',S.inventory.bushmaster?.weaponRank??0);}
  function viewGun(k){return k==='bushmaster'&&bushDotOn()?bushDot:gunGroups[k];}
  function zoomOf(k){return k==='bushmaster'&&bushDotOn()?0:weapons[k].zoom||0;}
  function aimFovOf(k){return k==='bushmaster'&&bushDotOn()?weaponAimFov('rifle'):weaponAimFov(k);}
  function syncBushmasterSight(){const held=S.weapon==='bushmaster',dot=bushDotOn();gunGroups.bushmaster.visible=held&&!dot;bushDot.visible=held&&dot;}
  // Semi-auto weapons fire once per pull until a full-auto rank (v164).
  function holdToFire(){return !weapons[S.weapon].semiAuto||rankAuto(S.weapon,S.inventory[S.weapon].weaponRank);}
  function buyWeaponRank(k){
    const inv=S.inventory[k],next=nextRank(k,inv.weaponRank),before=ammoCapacity(k);if(!next)return false;
    if(S.points<next.price){notify(`NEED ${next.price-S.points} MORE ESSENCE`);tone(110,.2,.03,'square');return false;}
    S.points-=next.price;inv.weaponRank=next.rank;applyWeaponRanks();
    // Bigger magazines (and the twin guns' second magazine) arrive loaded. Magazine
    // ranks add the reserve rounds they need; the twin guns add none (v161).
    if(next.mag||next.dual){const after=ammoCapacity(k);inv.ammo=after.mag;inv.reserve+=Math.max(0,after.reserve-before.reserve);}
    S.reloadLeft=0;selectWeapon(k);
    notify(`${RANK_LABEL[k]} RANK ${next.numeral} · ${next.name.toUpperCase()} · ${next.effect.toUpperCase()}`,4);
    tone(520,.18,.08,'triangle',1040);tone(780,.3,.05,'triangle',1560);
    updateHud();return true;
  }
  // Twin Ravens: swap the held MP5 for the pair while the SMG is out.
  function dualOn(){return S.weapon==='smg'&&rankDual('smg',S.inventory.smg.weaponRank);}
  function syncDualSmg(){const on=dualOn();smgDual.visible=on;if(on)gunGroups.smg.visible=false;}
  function fireDualSide(){
    S.dualSide^=1;const d=dualGuns[S.dualSide];d.kick=1;
    // userData.muzzle already carries the gun's scale; add only its turn and offset.
    dualMuzzle.copy(d.g.userData.muzzle).applyQuaternion(d.g.quaternion).add(d.g.position);
    flash.position.copy(dualMuzzle);flash.position.z-=.11*flash.scale.x;
  }
  function refillAmmo(){
    for(const k in S.inventory)if(S.inventory[k].owned)restockWeapon(k);
    S.grenades=Math.min(4,S.grenades+1);
  }
  function grenade(){
    if(S.mode!=='playing'||grenadeThrow.active||(S.grenades<=0&&S.grenadeTime<=0))return false;
    const unlimited=S.grenadeTime>0;
    if(unlimited&&S.grenadeCooldown>0)return false;
    if(!grenadeThrow.begin())return false;
    // Infinite throws recover for half a second after the arm retracts.
    S.grenadeCooldown=unlimited?GRENADE_THROW.duration+POWERUPS.grenades.cooldown:0;
    if(!unlimited)S.grenades--;S.flashTime=0;updateHud();tone(650,.08,.035,'square');return true;
  }
  // v186: the pin's click as the left hand yanks it.
  function grenadeCue(cue){if(cue==='pin'){tone(1900,.035,.022,'square',1200);tone(3100,.03,.012,'triangle',2400);}}
  function releaseGrenade(position,rotation,firstStep){
    // Sweep from the eye to the releasing hand so nearby walls cannot be bypassed.
    const offset=position.clone().sub(camera.position),distance=offset.length();grenadeLaunchRay.set(camera.position,offset.normalize());grenadeLaunchRay.near=0;grenadeLaunchRay.far=distance+.10;
    const hit=grenadeLaunchRay.intersectObjects(solidMeshes,true)[0];if(hit)position.copy(camera.position).addScaledVector(offset,Math.max(0,Math.min(distance,hit.distance-.11)));
    const delta=position.clone().sub(camera.position),steps=Math.max(1,Math.ceil(delta.length()/.025));
    for(let i=0;i<=steps;i++){
      const p=camera.position.clone().addScaledVector(delta,i/steps);
      if(isBlocked(p.x,p.z,.10,colliders,undefined,p.y-.10,.20)){position.copy(camera.position).addScaledVector(delta,Math.max(0,i-1)/steps);break;}
    }
    const g=grenadeAssets.create();g.userData.lightingTransient=true;g.position.copy(position);g.quaternion.copy(rotation);scene.add(g);
    const velocity=new T.Vector3(0,.23,-1).applyQuaternion(camera.quaternion).normalize().multiplyScalar(11);
    effects.push({mesh:g,vel:velocity,life:1.65,max:1.65,type:'grenade',firstStep});noise(.09,.035,1800);
    // v186: the pin was pulled in the hand; the spoon flips off as it leaves.
    g.getObjectByName('Pin and ring').visible=false;const lever=g.getObjectByName('Spoon');g.updateMatrixWorld(true);
    const spoon=grenadeAssets.createSpoon();lever.matrixWorld.decompose(spoon.position,spoon.quaternion,spoon.scale);lever.visible=false;spoon.userData.lightingTransient=true;scene.add(spoon);
    const side=new T.Vector3(1,0,0).applyQuaternion(camera.quaternion);
    effects.push({mesh:spoon,vel:velocity.clone().multiplyScalar(.35).addScaledVector(side,1.6).add(new T.Vector3(0,2.6,0)),life:2.4,max:2.4,type:'spoon',spin:new T.Vector3(17,9,4),rest:.004});
    tone(2600,.05,.012,'triangle',3400);
  }
  // ---- The katana (v205): three slashes in turn, each cutting everything in the frontal
  // arc within reach as the blade crosses the middle (katana.mjs). The view reads `swing`.
  const swing={active:false,kind:0,time:0,hit:true,id:0,next:0,idle:Infinity};
  function drawKatana(k){swing.active=false;swing.hit=true;swing.idle=Infinity;if(k==='katana'){tone(1900,.16,.018,'triangle',3100);noise(.05,.025,5200);}}
  function slash(){
    if(swing.idle>KATANA.combo)swing.next=0;
    swing.kind=swing.next;swing.next=(swing.next+1)%SLASHES.length;
    swing.active=true;swing.time=0;swing.hit=false;swing.id++;swing.idle=0;
    S.shotTimer=KATANA.swing;S.shotId++;
    noise(.15,.075,1300);tone(260,.13,.016,'sine',120);
    {const r=run.shotRumble.katana;if(r)rumble(...r);}
  }
  function cut(){
    const inv=S.inventory.katana,yaw=S.lookYaw;
    // v206: on a map whose enemies keep floor heights relative to the ground (Dead Tide's island,
    // level.floorOf), the slash measures you on that scale; walls are still tested in the world.
    const lift=level.floorOf?player.y-level.floorOf(player):0,from=lift?{x:player.x,y:player.y-lift,z:player.z}:player;
    const hits=slashTargets({player:from,yaw,zombies,blocked:(x,z,y,height)=>isBlocked(x,z,.04,colliders,undefined,y+lift,height)});
    const damage=KATANA.damage*(S.perkOwned.has('eye')?1.5:1)*forgeBonuses(inv.forgeRank).damageMultiplier*(S.doubleTime>0?2:1);
    for(const {enemy} of hits){const impact=slashImpact(swing.kind,{player,yaw,enemy});combat.damageEnemy(enemy,damage,false,{...impact,shotId:S.shotId});combat.bloodBurst(impact.point,6);}
    if(hits.length){tone(150,.09,.06,'sawtooth',70);noise(.07,.07,2600);rumble(.35,.5,90);}
    return hits.length;
  }
  function updateMelee(dt){
    if(!swing.active){swing.idle+=dt;return;}
    swing.time+=dt;const s=SLASHES[swing.kind];
    if(!swing.hit&&swing.time>=s.hitAt){swing.hit=true;if(S.weapon==='katana'&&S.mode==='playing')cut();}
    if(swing.time>=s.length){swing.active=false;swing.idle=0;}
  }
  function meleeHeld(){return !!weapons[S.weapon].melee;}
  function grantPowerup(type){if(type==='ammo'){refillAmmo();notify('MAX AMMO · RESERVES RESTOCKED');}else if(type==='double'){S.doubleTime=POWERUPS.double.duration;notify('×2 · DOUBLE DAMAGE FOR 20s');}else if(type==='grenades'){S.grenadeTime=POWERUPS.grenades.duration;notify('INFINITE GRENADES · 12s · PRESS G');}}
  return {swing,updateMelee,meleeHeld,ammoCapacity,freshInventory,restockTarget,restockWeapon,ammoFull,refillAmmo,shoot,reload,finishReload,holdToFire,buyWeaponRank,grenade,grenadeCue,releaseGrenade,grantPowerup,dualOn,fireDualSide,selectWeapon,applyWeaponRanks,syncDualSmg,syncBushmasterSight,viewGun,bushDotOn,zoomOf,aimFovOf,aimHeight};
}
