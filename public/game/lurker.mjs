import * as T from './three.module.js';
import {ENEMY_SURFACE,markEnemySurface} from './enemy-surfaces.mjs?v=134';

// v179: the Grotesque Lurker. A hunched, bloated zombie covered in cancerous
// boils, its belly slit and crudely stitched shut over something that glows.
// It lurches toward you, charges from 12 yards and bursts when it reaches you,
// or when it dies, hurting everything nearby. Zombies its blast kills pay
// you 35% more essence.
export const LURKER=Object.freeze({
  speed:1.25,            // × the wave's standard zombie speed
  charge:2,              // charging: +100% movement speed
  chargeRange:12*.9144,  // 12 yards, in metres
  health:1.5,            // × walker health
  trigger:1.45,fuse:.32, // bursts this close to you, after a short swell
  blastRadius:4,fullRadius:1.5,playerDamage:75,
  enemyDamage:450,enemyFullRadius:3,
  essenceBonus:1.35,
  spawnChance:1/20,fromWave:11,
  blink:.8,chargeBlink:.3,
  finale:Object.freeze({wave:10,count:20,lurkers:Object.freeze([2,3]),brutes:Object.freeze([3,13]),slots:Object.freeze([6,12,17])}),
});

// Player damage from a burst at distance d (full up close, fading to the edge).
export function lurkerPlayerDamage(d){
  const L=LURKER;if(d>=L.blastRadius)return 0;
  return d<=L.fullRadius?L.playerDamage:L.playerDamage*(1-(d-L.fullRadius)/(L.blastRadius-L.fullRadius));
}
export function lurkerEnemyDamage(d){const L=LURKER;return d>=L.blastRadius?0:L.enemyDamage*(d<=L.enemyFullRadius?1:.5);}

// The abdomen's blink: a quick swell every `period` seconds, then a slow fade.
export function lurkerPulse(t,period){const u=(t%period)/period;return u<.12?u/.12:Math.exp(-(u-.12)*5.5);}

function seeded(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function colorize(g,fn){const p=g.attributes.position,c=new Float32Array(p.count*3),col=new T.Color();for(let i=0;i<p.count;i++){fn(col,p.getX(i),p.getY(i),p.getZ(i),i);c[i*3]=col.r;c[i*3+1]=col.g;c[i*3+2]=col.b;}g.setAttribute('color',new T.BufferAttribute(c,3));return g;}
function blob(rng,seg=12,rough=.18){const g=new T.SphereGeometry(1,seg,Math.round(seg*.75)),p=g.attributes.position;const k=[];for(let i=0;i<6;i++)k.push(rng()*6.28);
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=1+rough*(Math.sin(x*3.1+k[0])*Math.sin(y*2.7+k[1])*.6+Math.sin(z*4.3+k[2])*.4);p.setXYZ(i,x*n,y*n,z*n);}g.computeVertexNormals();return g;}

// Adds boils, the bloated stitched belly and its glow to a lurker rig, before
// the rig is baked and batched with the other enemy templates.
export function addLurkerFeatures(rig,seed=179){
  const rng=seeded(seed),{spine,head,arms,legs,root}=rig,res=rig.resources;
  const mat=(color,roughness,tile)=>{const m=new T.MeshStandardMaterial({color,roughness,vertexColors:true});if(tile)markEnemySurface(m,tile);res.materials.add(m);return m;};
  const skin=mat(0xffffff,.7,ENEMY_SURFACE.skin),wound=mat(0xffffff,.45,ENEMY_SURFACE.wound),thread=mat(0xffffff,.9,ENEMY_SURFACE.leather);
  const add=(parent,geo,m,pos,scale=[1,1,1],rot=[0,0,0],name)=>{res.geometries.add(geo);const o=new T.Mesh(geo,m);o.position.set(...pos);o.scale.set(...scale);o.rotation.set(...rot);o.castShadow=o.receiveShadow=true;if(name)o.name=name;parent.add(o);return o;};
  // Measure the torso in the spine's own space.
  rig.group.updateMatrixWorld(true);const inv=new T.Matrix4().copy(spine.matrixWorld).invert(),box=new T.Box3();
  spine.children.forEach(c=>{if(c.isMesh){c.geometry.computeBoundingBox();box.union(c.geometry.boundingBox.clone().applyMatrix4(c.matrixWorld).applyMatrix4(inv));}});
  const front=box.max.z,back=box.min.z,half=(box.max.x-box.min.x)/2;

  // ---- The belly: a swollen gut pushing through the gown, slit and stitched ----
  const bellyC=new T.Vector3(0,.15,front-.05),bellyS=[.165,.16,.15];
  const belly=colorize(blob(rng,18,.06),(c,x,y,z)=>{const mott=.85+.15*Math.sin(x*23+y*17)*Math.sin(z*19);c.setHex(0x8a8466).multiplyScalar(mott);if(y<-.4)c.lerp(new T.Color(0x5e4a45),.4);});
  add(spine,belly,skin,bellyC.toArray(),bellyS,[0,0,0],'Lurker belly');
  // The cut runs across the belly's face: two torn lips with the glow showing
  // between them, pulled together by heavy black stitches.
  const unit=[];for(let i=0;i<=16;i++){const a=-.85+1.7*i/16,yy=.5+.06*Math.sin(a*2.2),r=Math.sqrt(1-yy*yy);unit.push(new T.Vector3(Math.sin(a)*r,yy,Math.cos(a)*r));}
  const onBelly=v=>new T.Vector3(bellyC.x+v.x*bellyS[0],bellyC.y+v.y*bellyS[1],bellyC.z+v.z*bellyS[2]);
  const path=new T.CatmullRomCurve3(unit.map(onBelly));
  const frame=t=>{const p=path.getPointAt(t),tan=path.getTangentAt(t),n=p.clone().sub(bellyC).normalize(),across=new T.Vector3().crossVectors(n,tan).normalize();return {p,tan,n,across};};
  const lip=sign=>new T.CatmullRomCurve3(Array.from({length:21},(_,k)=>{const f=frame(k/20),gape=.012*Math.sin(Math.PI*k/20)+.004;return f.p.clone().addScaledVector(f.across,sign*gape).addScaledVector(f.n,.006);}));
  for(const sign of [-1,1])add(spine,colorize(new T.TubeGeometry(lip(sign),40,.011,6,false),(c,x,y,z,i)=>c.setHex(i%3?0x5a1310:0x7a1d16)),wound,[0,0,0],[1,1,1],[0,0,0],'Belly wound');
  for(let i=1;i<=9;i++){const {p,tan,n,across}=frame(i/10);
    const g=colorize(new T.CylinderGeometry(.0055,.0055,.062,5),c=>c.setHex(0x17120e));const st=add(spine,g,thread,p.clone().addScaledVector(n,.016).toArray());st.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),across.clone().addScaledVector(tan,(rng()-.5)*.45).normalize());
    for(const sgn of [-1,1])add(spine,colorize(new T.SphereGeometry(.0085,6,4),c=>c.setHex(0x0f0b08)),thread,p.clone().addScaledVector(across,sgn*.031).addScaledVector(n,.012).toArray());}
  // The glow: a seam deep in the wound and a faint shell through the gut.
  const glowMat=new T.MeshStandardMaterial({color:0x2b3a10,emissive:0x9be04a,emissiveIntensity:.6,roughness:.4});glowMat.userData.lurkerGlow='seam';res.materials.add(glowMat);
  const seam=new T.TubeGeometry(new T.CatmullRomCurve3(Array.from({length:21},(_,k)=>{const f=frame(k/20);return f.p.clone().addScaledVector(f.n,.003);})),40,.01,5,false);res.geometries.add(seam);
  const sm=new T.Mesh(seam,glowMat);sm.name='Lurker glow seam';spine.add(sm);
  const shellMat=new T.MeshBasicMaterial({color:0x86c43c,transparent:true,opacity:.12,depthWrite:false,blending:T.AdditiveBlending});shellMat.userData.lurkerGlow='shell';res.materials.add(shellMat);
  // Only the front half, so the glow sits in the gut rather than ringing the waist.
  const shell=new T.SphereGeometry(1,16,12,0,Math.PI);res.geometries.add(shell);const sh=new T.Mesh(shell,shellMat);sh.name='Lurker glow shell';sh.position.copy(bellyC);sh.scale.set(bellyS[0]*1.03,bellyS[1]*1.03,bellyS[2]*1.05);sh.castShadow=false;spine.add(sh);

  // ---- Boils: clustered on the hump, shoulders, neck, head and arms ----
  const boil=(parent,pos,r)=>{const g=colorize(blob(rng,10,.22),(c,x,y,z)=>{const top=Math.max(0,y);c.setHex(0x5c2632).lerp(new T.Color(0x9c5a4c),Math.min(1,top*1.1));if(top>.86)c.lerp(new T.Color(0xd4bd6e),.85);});
    add(parent,g,skin,pos,[r,r*(.8+rng()*.3),r],[rng()*.6-.3,rng()*6.28,rng()*.6-.3],'Lurker boil');};
  for(let i=0;i<11;i++){const x=(rng()-.5)*half*1.4,y=.1+rng()*.45;boil(spine,[x,y,back+.03+Math.abs(x)*.12],.025+rng()*.045);}
  for(const s of [-1,1]){boil(spine,[s*half*.8,.52+rng()*.05,-.06],.035+rng()*.025);boil(spine,[s*.07,.62,.02],.025+rng()*.012);}
  for(let i=0;i<4;i++){const s=i%2?1:-1;boil(spine,[s*half*(.55+rng()*.25),.05+rng()*.2,front-.13],.03+rng()*.03);}
  for(let i=0;i<4;i++){const s=i%2?1:-1;boil(head,[s*(.06+rng()*.05),.07+rng()*.06,-.05-rng()*.05],.025+rng()*.025);}
  for(const [j,arm] of arms.entries()){const s=j?1:-1;for(let i=0;i<2;i++)boil(arm.pivot,[s*.045,-.06-i*.11,(rng()-.5)*.06],.025+rng()*.02);}
  for(const leg of legs)boil(leg.pivot,[(rng()-.5)*.06,-.14,.06],.025+rng()*.015);
  void root;
  return rig;
}

// Each spawned lurker gets its own copy of the two glow materials so it can
// blink on its own beat.
export function setupLurkerGlow(e){
  const parts=[];e.group.traverse(o=>{if(o.isMesh&&o.material?.userData?.lurkerGlow){o.material=o.material.clone();parts.push(o);}});
  e.lurkerGlow={parts,t:Math.random()*LURKER.blink};return e;
}
export function updateLurkerGlow(e,dt){
  const g=e.lurkerGlow;if(!g)return 0;g.t+=dt*(e.lurkerFuse>0?3:1);
  const pulse=lurkerPulse(g.t,e.lurkerCharging?LURKER.chargeBlink:LURKER.blink),swell=e.lurkerFuse>0?1:0;
  for(const o of g.parts){const m=o.material;if(m.userData.lurkerGlow==='seam')m.emissiveIntensity=.3+2.4*pulse+swell*2.5;else m.opacity=.025+.1*pulse+swell*.22;}
  return pulse;
}
export function disposeLurkerGlow(e){for(const o of e.lurkerGlow?.parts||[])o.material.dispose();if(e.lurkerGlow)e.lurkerGlow.parts=[];}
