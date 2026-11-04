import assert from 'node:assert/strict';
import * as T from '../public/game/three.module.js';
import {CRAWL} from '../public/game/zombies.mjs';
import {INJURY,PROP_KINDS,rollInjury,applyInjury,clearInjury} from '../public/game/zombie-injuries.mjs';

const near=(v,target,tol)=>Math.abs(v-target)<=tol;
const visibleMeshes=node=>{let n=0;node.traverse(o=>{if(o.isMesh&&o.visible)n++;});return n;};
const shown=node=>{let all=true;node.traverse(o=>{if(o.isMesh&&!o.visible)all=false;});return all;};
const ownMesh=node=>node.children.find(o=>o.isMesh&&!o.material.userData?.enemyEyes);

// v178: battle-worn spawns from hidden joints, shared wound caps and props,
// and crushed skulls prepared at load. No per-spawn geometry.
export function verifyZombieInjuries(qa,frames){
  // ---- Odds ----------------------------------------------------------------------
  {
    const N=6000,walkers=Array.from({length:N},(_,i)=>rollInjury(10007+i*7919));
    const rate=f=>walkers.filter(f).length/N;
    assert(near(rate(r=>r.major),INJURY.major,.025),`About one walker in four has a major injury (${rate(r=>r.major).toFixed(3)})`);
    assert(near(rate(r=>r.props.length),INJURY.prop,.025),`About one in five has something through it (${rate(r=>r.props.length).toFixed(3)})`);
    assert(near(rate(r=>r.legless),INJURY.legless,.012),`About one in twenty-five spawns legless (${rate(r=>r.legless).toFixed(3)})`);
    const both=rate(r=>r.major&&r.props.length);assert(near(both,INJURY.major*INJURY.prop,.015),`The rolls are independent, so some have both (${both.toFixed(3)})`);
    const withProps=walkers.filter(r=>r.props.length);assert(near(withProps.filter(r=>r.props.length===2).length/withProps.length,INJURY.twoProps,.05),'A few carry two');
    for(const [kind] of INJURY.kinds)assert(walkers.some(r=>r.major===kind),`Some arrive with: ${kind}`);
    for(const kind of PROP_KINDS)assert(walkers.some(r=>r.props.some(p=>p.kind===kind)),`Some have a ${kind} in them`);
    for(const joint of ['chest','thigh','arm','head'])assert(walkers.some(r=>r.props.some(p=>p.joint===joint)),`Props go into the ${joint}`);
    assert(walkers.every(r=>r.props.every(p=>!(p.joint==='arm'&&r.major&&['arm','forearm'].includes(r.major)&&p.side===r.side))),'Nothing is stuck in a missing arm');
    assert.deepEqual(rollInjury(424242),rollInjury(424242),'Injuries are reproducible from the zombie seed');
    const brutes=Array.from({length:2000},(_,i)=>rollInjury(77+i*31,{brute:true}));
    assert(brutes.every(r=>!r.major&&!r.legless)&&near(brutes.filter(r=>r.props.length).length/2000,INJURY.prop,.03),'Brutes stay whole but can have things stuck in them');
    const ferals=Array.from({length:2000},(_,i)=>rollInjury(55+i*13,{feral:true}));
    assert(ferals.every(r=>!r.legless)&&ferals.some(r=>r.major),'Ferals can be maimed but never spawn legless');
    assert(Array.from({length:500},(_,i)=>rollInjury(i,{dog:true})).every(r=>!r.major&&!r.props.length&&!r.legless),'Dogs are untouched');
  }

  qa.start();qa.holdSpawns();qa.setHealth(1e9);for(const z of qa.get().zombies)qa.damageEnemy(z,1e7);frames(2);
  const kit=qa.get().enemyAssets.injuries;
  const blank={major:null,side:0,skullVariant:0,legless:null,props:[]};
  const fresh=(x=0,z=10)=>{const e=qa.makeZombie(x,z);e.speed=0;e.attack=100;return e;};
  const ray=new T.Raycaster();

  // ---- Missing arm or forearm --------------------------------------------------------
  {
    const e=fresh();const hand=e.arms[1].hand,before=visibleMeshes(e.group);
    applyInjury(e,{...blank,major:'forearm',side:1},kit);
    assert(!shown(e.arms[1].forearm)&&!e.arms[1].hand.children.some(o=>o.isMesh&&o.visible),'The forearm and hand are gone');
    assert(ownMesh(e.arms[1].pivot).visible,'The upper arm stays');
    assert(e.injuryMeshes.some(m=>m.name==='Forearm stump'&&m.parent===e.arms[1].pivot),'A stump caps the elbow and moves with the upper arm');
    assert.equal(e.armless,1);
    qa.get().scene.updateMatrixWorld(true);const at=new T.Vector3();hand.getWorldPosition(at);
    ray.set(at.clone().add(new T.Vector3(0,0,3)),new T.Vector3(0,0,-1));
    assert(ray.intersectObject(e.group,true).every(h=>h.object.visible&&!h.object.userData.injury),'Shots pass through where the hand used to be');
    const w=fresh(2);applyInjury(w,{...blank,major:'arm',side:0},kit);
    assert(!shown(w.arms[0].pivot)&&shown(w.arms[1].pivot),'A whole arm can be missing');
    assert(w.injuryMeshes.some(m=>m.name==='Shoulder stump'&&m.parent===w.spine),'with a stump at the shoulder');
    clearInjury(e);assert(shown(e.group)&&visibleMeshes(e.group)===before&&!e.injuryMeshes&&!e.armless,'Clearing an injury restores the rig');
  }

  // ---- Missing jaw ---------------------------------------------------------------------
  {
    const e=fresh(4);e.gait={...e.gait,attack:'biter'};applyInjury(e,{...blank,major:'jaw'},kit);
    assert(!shown(e.jaw)&&e.injuryMeshes.some(m=>m.name==='Torn throat'&&m.parent===e.head),'The jaw is gone, leaving a torn throat');
    assert(ownMesh(e.head).visible,'The skull and upper teeth stay');
    assert(e.jawless&&e.gait.attack==='grabber','Without a jaw it can no longer bite, so it grabs');
  }

  // ---- Crushed skull ----------------------------------------------------------------------
  {
    const a=fresh(6),b=fresh(8);
    const variant=kit.crushed.get(a.templateIndex);assert(variant&&variant.length===INJURY.skullVariants,'Each walker body has crushed skulls ready from loading');
    const original=ownMesh(a.head).geometry;applyInjury(a,{...blank,major:'skull',skullVariant:1},kit);
    const crushed=ownMesh(a.head).geometry;
    assert(crushed!==original&&crushed.userData.crushedHead&&a.crushed,'The head swaps to its caved-in copy');
    assert(crushed.index===original.index&&crushed.attributes.uv===original.attributes.uv,'The copy shares the head’s other buffers');
    const {hit,dir,depth}=crushed.userData.dent,p0=original.attributes.position,p1=crushed.attributes.position,c0=original.attributes.color,c1=crushed.attributes.color;
    let moved=0,deepest=0,stained=0;
    for(let i=0;i<p0.count;i++){const dx=p1.getX(i)-p0.getX(i),dy=p1.getY(i)-p0.getY(i),dz=p1.getZ(i)-p0.getZ(i),d=Math.hypot(dx,dy,dz);if(d>1e-6){moved++;deepest=Math.max(deepest,-(dx*dir.x+dy*dir.y+dz*dir.z));if(Math.abs(c1.getX(i)-c0.getX(i))+Math.abs(c1.getY(i)-c0.getY(i))+Math.abs(c1.getZ(i)-c0.getZ(i))>.06)stained++;}}
    assert(moved>40&&moved<p0.count*.25,`A dent, not a squashed head (${moved} of ${p0.count} vertices)`);
    assert(deepest>depth*.6&&deepest<=depth*1.25,`caved in by about ${(depth*100).toFixed(1)} cm`);
    assert(stained>moved*.5,'and stained with blood and broken bone');
    if(b.templateIndex===a.templateIndex){applyInjury(b,{...blank,major:'skull',skullVariant:1},kit);assert.equal(ownMesh(b.head).geometry,crushed,'Two crushed skulls of one body share the same buffers');}
    clearInjury(a);assert.equal(ownMesh(a.head).geometry,original);
  }

  // ---- Props --------------------------------------------------------------------------------
  {
    let n=0;
    for(let round=0;round<3;round++)for(const kind of PROP_KINDS)for(const joint of ['chest','thigh','arm','head']){
      const e=fresh(-6+(n%6)*2,6+Math.floor(n/6)%4*2);n++;if(n%12===0){for(const z of qa.get().zombies)qa.damageEnemy(z,1e7);frames(2);}
      applyInjury(e,{...blank,props:[{kind,joint,side:1,a:.5,b:.5,c:.2,d:.5,spin:0}]},kit);
      const m=e.injuryMeshes[0],parent=joint==='head'?e.head:joint==='arm'?e.arms[1].pivot:joint==='thigh'?e.legs[1].pivot:e.spine;
      assert.equal(m.parent,parent,`${kind} in the ${joint} rides that joint`);
      assert(m.geometry===kit.props[kind]&&m.material===kit.material,'Props share one geometry per kind and one material');
      assert(!m.raycast.length&&m.raycast(new T.Raycaster(),[])===undefined,'Props never catch bullets');
      // Ends of the prop in the joint's space, against the body it went into.
      const body=ownMesh(parent).geometry;body.computeBoundingBox();const box=body.boundingBox.clone(),g=m.geometry;g.computeBoundingBox();
      const axis=new T.Vector3(0,1,0).applyQuaternion(m.quaternion),top=m.position.clone().addScaledVector(axis,g.boundingBox.max.y),bottom=m.position.clone().addScaledVector(axis,g.boundingBox.min.y);
      if(['stake','rebar','pipe','bolt'].includes(kind))assert(!box.containsPoint(top)&&!box.containsPoint(bottom),`A ${kind} in the ${joint} sticks out both sides`);
      else{assert(!box.containsPoint(top),`A ${kind} in the ${joint} sticks out`);assert(box.clone().expandByScalar(.02).distanceToPoint(bottom)<.06,`and is driven into the body`);}
    }
  }

  // ---- Natural spawns ---------------------------------------------------------------------------
  {
    qa.start();for(let i=0;i<6;i++)qa.startWave();qa.holdSpawns();qa.setHealth(1e9);qa.setPlayer(0,0);
    const seen=[],geos=new Set();
    for(let i=0;i<320;i++){
      for(const z of qa.get().zombies)if(!z.dead)qa.damageEnemy(z,1e7);frames(1);
      if(!qa.spawnEnemy()){qa.startWave();qa.holdSpawns();continue;}const e=qa.get().zombies.at(-1);seen.push(e);
      e.group.traverse(o=>{if(o.isMesh)geos.add(o.geometry);});
    }
    const walkers=seen.filter(e=>!e.dog&&!e.brute),injured=walkers.filter(e=>e.injury?.major).length/walkers.length;
    assert(walkers.length>150&&injured>.15&&injured<.35,`Wave spawns arrive maimed about one time in four (${(injured*100).toFixed(0)}% of ${walkers.length})`);
    const impaled=seen.filter(e=>e.injury?.props.length).length/seen.length;assert(impaled>.12&&impaled<.3,`and impaled about one time in five (${(impaled*100).toFixed(0)}%)`);
    assert(seen.filter(e=>e.dog).every(e=>!e.injury),'Dogs spawn whole');
    for(const e of seen.filter(e=>e.injury?.legless))assert(e.crawling&&e.crawl===1&&e.bodyHeight===CRAWL.height,'Legless spawns arrive crawling');
    const kitGeos=new Set([...Object.values(kit.props),...Object.values(kit.caps),...[...kit.crushed.values()].flat()]);
    const templateGeos=new Set();for(const r of qa.get().enemyAssets.templates)r.group.traverse(o=>{if(o.isMesh)templateGeos.add(o.geometry);});
    assert([...geos].every(g=>kitGeos.has(g)||templateGeos.has(g)),'No spawn creates geometry of its own');
  }

  // ---- Light gameplay effects -----------------------------------------------------------------
  {
    const firstHit=injury=>{qa.start();qa.holdSpawns();qa.setHealth(1e4);qa.setPlayer(0,23);const e=qa.makeZombie(0,22.1);e.life=null;if(injury)applyInjury(e,injury,kit);e.attack=0;
      for(let i=0;i<180&&qa.get().health===1e4;i++)frames(1);return 1e4-qa.get().health;};
    const whole=firstHit(null),oneArm=firstHit({...blank,major:'forearm',side:0});
    assert(whole>0&&near(oneArm/whole,INJURY.oneArmDamage,.01),`A one-armed zombie hits ${INJURY.oneArmDamage*100}% as hard (${oneArm.toFixed(1)} vs ${whole.toFixed(1)})`);
    const headshot=injury=>{qa.start();qa.holdSpawns();qa.setHealth(1e9);qa.setPlayer(0,20);qa.selectWeapon('glock');frames(1);
      const e=qa.makeZombie(0,17.2);e.speed=0;e.attack=100;e.life=null;if(injury)applyInjury(e,injury,kit);frames(10);
      for(let t=0;t<16;t++){qa.get().scene.updateMatrixWorld(true);const h=new T.Vector3();e.head.getWorldPosition(h);h.y+=.1;const c=qa.get().camera.position,d=h.clone().sub(c);
        qa.setAim(Math.atan2(-d.x,-d.z),Math.atan2(d.y,Math.hypot(d.x,d.z)));frames(1);const hp=e.hp;qa.get().inventory.glock.ammo=13;qa.shoot();frames(14);
        if(qa.get().combatHud&&hp-e.hp>0&&e.flinchPart==='head')return hp-e.hp;}
      return 0;};
    const plain=headshot(null),cracked=headshot({...blank,major:'skull'});
    assert(plain>0&&cracked>0,'Headshots land on both');
    assert(near(cracked/plain,INJURY.crushedHeadshot,.02),`A crushed skull takes ${INJURY.crushedHeadshot}× headshot damage (${(cracked/plain).toFixed(3)})`);
  }
  console.log(`PASS: battle-worn spawns: about 1 in 4 walkers arrive missing a forearm, arm or jaw or with a crushed skull, 1 in 5 impaled (stake, rebar, pipe, bolt, knife, pitchfork, glass) through chest, thigh, arm or head, 1 in 25 legless and crawling; hidden parts stop catching bullets, stumps and props ride their joints, crushed skulls are shared copies made at load; one-armed hits ${INJURY.oneArmDamage*100}%, no-jaw never bites, crushed skulls take ${INJURY.crushedHeadshot}× headshots; brutes only impaled, dogs untouched, no per-spawn geometry.`);
}
