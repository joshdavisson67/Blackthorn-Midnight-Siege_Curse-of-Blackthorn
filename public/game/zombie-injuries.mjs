import * as T from './three.module.js';

// v178: battle-worn spawns. A natural spawn may arrive missing an arm or its
// jaw, with its skull caved in, or (rarely) with its lower legs gone and
// crawling, and separately with something driven through it. Nothing is
// modelled per zombie: parts are hidden on its own joints, crushed skulls are
// prepared once per body at load, and wound caps and props are a handful of
// shared meshes built here once.
export const INJURY=Object.freeze({
  major:.25,      // chance of one major injury (walkers and ferals)
  prop:.2,        // separate chance of something stuck through it (brutes too)
  twoProps:.15,   // of those, the share with two
  legless:.04,    // walkers only: spawns already crawling, lower legs gone
  kinds:Object.freeze([['forearm',.22],['arm',.18],['jaw',.3],['skull',.3]]),
  oneArmDamage:.8,      // a one-armed zombie hits a little softer
  crushedHeadshot:1.25, // a caved-in skull gives way to headshots
  skullVariants:2,
});
export const PROP_KINDS=Object.freeze(['stake','rebar','pipe','bolt','knife','pitchfork','shard']);
const THROUGH=new Set(['stake','rebar','pipe','bolt']);

function seeded(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const pickWeighted=(r,list)=>{let x=r()*list.reduce((s,[,w])=>s+w,0);for(const [k,w] of list){x-=w;if(x<=0)return k;}return list[list.length-1][0];};

// Rolled from the zombie's own seed: reproducible, and no other dice change.
export function rollInjury(seed,{brute=false,feral=false,dog=false}={}){
  const r=seeded(seed^0x7f4a7c15),out={major:null,side:r()<.5?0:1,skullVariant:Math.floor(r()*INJURY.skullVariants),legless:null,props:[]};
  if(dog)return out;
  const rolls=[r(),r(),r(),r()];
  if(!brute&&rolls[0]<INJURY.major)out.major=pickWeighted(r,INJURY.kinds);
  if(!brute&&!feral&&rolls[1]<INJURY.legless){const both=r()<.4;out.legless=both?[true,true]:out.side?[false,true]:[true,false];}
  if(rolls[2]<INJURY.prop){
    const count=rolls[3]<INJURY.twoProps?2:1;
    for(let i=0;i<count;i++){
      // Where it went in: mostly the chest, sometimes a thigh, an arm or the head.
      let joint=pickWeighted(r,[['chest',.5],['thigh',.2],['arm',.15],['head',.15]]);
      const side=r()<.5?0:1;
      if(joint==='arm'&&(out.major==='arm'||out.major==='forearm')&&side===out.side)joint='chest';
      if(joint==='thigh'&&out.legless)joint='chest';
      const kinds=joint==='head'?['bolt','knife','shard','rebar']:joint==='arm'?['bolt','knife','shard','rebar']:PROP_KINDS;
      out.props.push({kind:kinds[Math.floor(r()*kinds.length)],joint,side,a:r(),b:r(),c:r(),d:r(),spin:r()*Math.PI*2});
    }
  }
  return out;
}

// ---- Shared geometry ---------------------------------------------------------------
function paintGeo(g,color){const c=new T.Color(color),n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b;}g.setAttribute('color',new T.BufferAttribute(a,3));return g;}
function merge(parts){
  const list=parts.map(g=>{const n=g.index?g.toNonIndexed():g;for(const k of Object.keys(n.attributes))if(!['position','normal','color'].includes(k))n.deleteAttribute(k);return n;});
  const out=new T.BufferGeometry();
  for(const k of ['position','normal','color']){const size=3,total=list.reduce((s,g)=>s+g.attributes[k].count,0),arr=new Float32Array(total*size);let o=0;for(const g of list){arr.set(g.attributes[k].array,o);o+=g.attributes[k].array.length;}out.setAttribute(k,new T.BufferAttribute(arr,size));}
  out.computeBoundingBox();out.computeBoundingSphere();return out;
}
// Darken the part of a shaft that has been through a body.
function bloody(g,y0,y1,blood=0x7a1010){const p=g.attributes.position,c=g.attributes.color,b=new T.Color(blood);for(let i=0;i<p.count;i++){const y=p.getY(i);if(y>y0&&y<y1){const t=1-Math.abs((y-(y0+y1)/2)/((y1-y0)/2));c.setXYZ(i,c.getX(i)+(b.r-c.getX(i))*t*.85,c.getY(i)+(b.g-c.getY(i))*t*.85,c.getZ(i)+(b.b-c.getZ(i))*t*.85);}}return g;}
function lump(r,scale,color,seed){const g=new T.SphereGeometry(1,12,9),p=g.attributes.position,rn=seeded(seed);for(let i=0;i<p.count;i++){const k=.62+rn()*.6;p.setXYZ(i,p.getX(i)*k,p.getY(i)*k,p.getZ(i)*k);}g.scale(...scale);g.computeVertexNormals();paintGeo(g,color);
  // Mottled: clotted dark patches through the red.
  const c=g.attributes.color;for(let i=0;i<c.count;i++){const m=.45+rn()*.75;c.setXYZ(i,c.getX(i)*m,c.getY(i)*m,c.getZ(i)*m);}return g;}
function cyl(rTop,rBottom,len,color,seg=7,open=false){const g=new T.CylinderGeometry(rTop,rBottom,len,seg,1,open);return paintGeo(g,color);}
const at=(g,x,y,z,rx=0,ry=0,rz=0)=>{g.rotateX(rx);g.rotateY(ry);g.rotateZ(rz);g.translate(x,y,z);return g;};

function buildProps(){
  const wood=0x6a4a2e,darkWood=0x3c2a1a,rust=0x7c4526,steel=0xc4cacd,pipe=0x6d7173,bone=0xe2d6b6,glass=0xb4d4cf;
  return {
    // Through-props: centred on the origin along +Y; a bloodied middle.
    stake:bloody(merge([cyl(.03,.035,.72,wood),at(cyl(0,.03,.14,darkWood),0,-.43,0,Math.PI)]),-.18,.18),
    rebar:bloody(merge([cyl(.013,.013,.56,rust,6),at(cyl(.013,.013,.46,rust,6),0,.48,.045,.2)]),-.16,.16),
    pipe:bloody(merge([cyl(.03,.03,.64,pipe,9,true),at(new T.TorusGeometry(.03,.006,4,9),0,.32,0,Math.PI/2)].map(g=>g.attributes.color?g:paintGeo(g,pipe))),-.15,.15),
    bolt:bloody(merge([cyl(.008,.008,.5,darkWood,5),at(cyl(0,.016,.06,steel,6),0,-.28,0,Math.PI),...[0,1,2].map(i=>at(paintGeo(new T.PlaneGeometry(.032,.08),i?0xe8e2d0:0xb01e1e),0,.2,0,0,i*Math.PI/1.5,0))]),-.13,.11),
    // Embedded props: +Y points out of the body; what went in runs along -Y.
    knife:merge([at(paintGeo(new T.BoxGeometry(.034,.2,.004),steel),0,-.08,0),at(paintGeo(new T.BoxGeometry(.05,.014,.024),darkWood),0,.025,0),at(paintGeo(new T.BoxGeometry(.028,.13,.024),0x3a2414),0,.1,0)]),
    pitchfork:merge([at(paintGeo(new T.BoxGeometry(.2,.028,.028),rust),0,0,0),...[-.075,0,.075].map(x=>bloody(at(cyl(.008,.004,.28,rust,5),x,-.14,0),-.28,-.02)),at(cyl(.022,.022,.32,wood,6),0,.17,0),at(cyl(0,.022,.06,darkWood,6),0,.36,0)]),
    shard:merge([at(paintGeo(new T.ConeGeometry(.05,.22,3),glass),0,0,0,0,0,.08),at(paintGeo(new T.ConeGeometry(.035,.15,3),glass),.04,-.01,.012,0,.6,-.25)]),
  };
}
function buildCaps(){
  const blood=0x6e1410,dark=0x2a0504,bone=0xcdbf9c;
  return {
    // An arm or leg stump: torn flesh round a jutting bone, pointing down -Y.
    stump:merge([lump(1,[.062,.032,.062],blood,11),at(lump(1,[.05,.022,.05],dark,12),0,-.018,0),at(lump(1,[.03,.03,.024],blood,14),.035,-.03,.01),at(cyl(.016,.02,.075,bone,6),.006,-.045,0),at(lump(1,[.022,.014,.022],bone,13),.006,-.083,0)]),
    // Where the jaw was: a ragged, open throat under the upper teeth.
    throat:merge([lump(1,[.08,.04,.07],blood,21),at(lump(1,[.055,.03,.05],dark,22),0,-.015,.02),at(lump(1,[.025,.04,.02],dark,23),.02,-.05,.03),at(cyl(.013,.013,.045,bone,6),.042,-.018,-.01,0,0,1.2),at(cyl(.013,.013,.045,bone,6),-.042,-.018,-.01,0,0,-1.2)]),
  };
}

// A caved-in copy of a head: vertices near a point on the crown pushed in,
// stained with blood. Only position, normal and color are new; the rest of
// the head's buffers are shared with the original.
function crushHead(source,variant){
  source.computeBoundingBox();const b=source.boundingBox,hw=(b.max.x-b.min.x)/2,cx=(b.min.x+b.max.x)/2,cz=(b.min.z+b.max.z)/2;
  const centre=new T.Vector3(cx,b.max.y-hw*1.05,cz),dir=new T.Vector3(variant?.55:-.5,.75,variant?.15:-.42).normalize();
  const pos=source.attributes.position;let best=-1,bestDot=-Infinity;const v=new T.Vector3();
  for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i).sub(centre);const d=v.dot(dir);if(d>bestDot){bestDot=d;best=i;}}
  const hit=new T.Vector3().fromBufferAttribute(pos,best),R=hw*.7,depth=hw*.42;
  const g=new T.BufferGeometry();g.setIndex(source.index);for(const [k,a] of Object.entries(source.attributes))g.setAttribute(k,a);
  for(const k of ['position','normal','color','rageColor'])if(source.attributes[k])g.setAttribute(k,source.attributes[k].clone());
  const p=g.attributes.position,col=g.attributes.color,rage=g.attributes.rageColor,blood=new T.Color(0x7a0e0b),boneRim=new T.Color(0xcfc2a0),near=[];
  for(let i=0;i<p.count;i++){
    v.fromBufferAttribute(p,i);const d=v.distanceTo(hit);if(d>R)continue;
    const t=1-(d/R)**2,k=t*t,jag=.8+.4*(Math.sin(i*12.9898)*.5+.5);
    v.addScaledVector(dir,-depth*k*jag);p.setXYZ(i,v.x,v.y,v.z);near.push(i);
    // Blood pooled in the crater, a ring of broken bone round its edge.
    const rim=Math.max(0,1-Math.abs(t-.28)/.16)*.75,s=Math.min(1,Math.pow(t,.5)*1.1),tint=rim>s*.6?boneRim:blood,amt=Math.max(rim,s);
    for(const a of [col,rage])if(a)a.setXYZ(i,a.getX(i)+(tint.r-a.getX(i))*amt,a.getY(i)+(tint.g-a.getY(i))*amt,a.getZ(i)+(tint.b-a.getZ(i))*amt);
  }
  // Fresh normals only where the bone gave way.
  const tmp=new T.BufferGeometry();tmp.setIndex(source.index);tmp.setAttribute('position',p);tmp.computeVertexNormals();
  for(const i of near)g.attributes.normal.setXYZ(i,tmp.attributes.normal.getX(i),tmp.attributes.normal.getY(i),tmp.attributes.normal.getZ(i));
  g.computeBoundingBox();g.computeBoundingSphere();g.userData.crushedHead=true;g.userData.dent={hit,dir,depth};return g;
}

const headMesh=rig=>rig.head.children.find(o=>o.isMesh&&!o.material.userData.enemyEyes);

// Built once at load: shared caps, props and crushed heads per walker body.
export function createInjuryKit(templates,walkerIndices){
  const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.62,metalness:.08});material.name='Injury props and wounds';
  const wet=new T.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:0});wet.name='Open wounds';
  const props=buildProps(),caps=buildCaps(),crushed=new Map();
  for(const i of walkerIndices){const head=headMesh(templates[i]);if(head)crushed.set(i,Array.from({length:INJURY.skullVariants},(_,v)=>crushHead(head.geometry,v)));}
  // One of everything, for shader and buffer warm-up during loading.
  const group=new T.Group();group.name='Injury kit';
  for(const g of [...Object.values(props)])group.add(new T.Mesh(g,material));for(const g of Object.values(caps))group.add(new T.Mesh(g,wet));
  for(const [i,list] of crushed)for(const g of list)group.add(new T.Mesh(g,headMesh(templates[i]).material));
  return {material,wet,props,caps,crushed,group};
}

// ---- Applying an injury to a spawned zombie --------------------------------------------
const noHit=()=>{};
function hide(node,e){node.traverse(o=>{if(o.isMesh){o.visible=false;o.userData.injuryHidden=true;o.raycast=noHit;}});(e.injuryHidden??=[]).push(node);}
function attach(e,parent,geometry,material,pos,quat,scale=1,name='Injury'){
  const m=new T.Mesh(geometry,material);m.name=name;m.position.copy(pos);if(quat)m.quaternion.copy(quat);m.scale.setScalar(scale);
  m.castShadow=true;m.receiveShadow=true;m.raycast=noHit;m.userData.injury=true;m.matrixAutoUpdate=true;parent.add(m);(e.injuryMeshes??=[]).push(m);return m;
}
const up=new T.Vector3(0,1,0);
function jointMesh(node){return node.children.find(o=>o.isMesh&&!o.material.userData?.enemyEyes);}

export function applyInjury(e,injury,kit){
  e.injury=injury;if(!injury||!kit)return e;
  const side=injury.side,q=new T.Quaternion();
  if(injury.major==='forearm'){
    const arm=e.arms[side];hide(arm.forearm,e);
    attach(e,arm.pivot,kit.caps.stump,kit.wet,arm.forearm.position,null,1,'Forearm stump');e.armless=1;
  }else if(injury.major==='arm'){
    const arm=e.arms[side];hide(arm.pivot,e);
    q.setFromUnitVectors(new T.Vector3(0,-1,0),new T.Vector3(side?1:-1,-.35,0).normalize());
    const cap=attach(e,arm.pivot.parent,kit.caps.stump,kit.wet,arm.pivot.position.clone().add(new T.Vector3(side?.005:-.005,-.03,0)),q,1,'Shoulder stump');cap.scale.set(1.35,.8,1.35);e.armless=1;
  }else if(injury.major==='jaw'){
    hide(e.jaw,e);attach(e,e.head,kit.caps.throat,kit.wet,e.jaw.position.clone().add(new T.Vector3(0,.01,.02)),null,1,'Torn throat');e.jawless=true;
    if(e.gait?.attack==='biter')e.gait={...e.gait,attack:'grabber'};
  }else if(injury.major==='skull'){
    const head=jointMesh(e.head),list=kit.crushed.get(e.templateIndex);
    if(head&&list){e.injuryHead={mesh:head,geometry:head.geometry};head.geometry=list[injury.skullVariant%list.length];e.crushed=true;}
  }
  if(injury.legless)for(const j of [0,1])if(injury.legless[j]){const leg=e.legs[j];hide(leg.calf,e);attach(e,leg.pivot,kit.caps.stump,kit.wet,leg.calf.position,null,1.25,'Leg stump');}
  for(const p of injury.props){
    const parent=p.joint==='head'?e.head:p.joint==='arm'?e.arms[p.side].pivot:p.joint==='thigh'?e.legs[p.side].pivot:e.spine;
    const body=jointMesh(parent);if(!body)continue;
    body.geometry.computeBoundingBox?.();const bb=body.geometry.boundingBox||new T.Box3(new T.Vector3(-.1,-.1,-.1),new T.Vector3(.1,.1,.1));
    const c=bb.getCenter(new T.Vector3()),h=bb.getSize(new T.Vector3()).multiplyScalar(.5);
    // Chests take props front to back; limbs and heads across.
    const dir=p.joint==='chest'?new T.Vector3((p.a-.5)*.9,(p.b-.5)*.6,p.c<.5?1:-1):p.joint==='head'?new T.Vector3(p.c<.5?1:-1,(p.b-.3)*.8,(p.a-.5)*1.4):new T.Vector3((p.side?1:-1)*(.4+p.a*.6),(p.b-.5)*.5,(p.c-.5)*1.6);dir.normalize();
    const along=Math.abs(dir.x)*h.x+Math.abs(dir.y)*h.y+Math.abs(dir.z)*h.z;
    const centre=c.clone().add(new T.Vector3((p.d-.5)*h.x*.5,(p.b-.5)*h.y*(p.joint==='chest'?.5:.6),(p.a-.5)*h.z*.3));
    q.setFromUnitVectors(up,dir);q.multiply(new T.Quaternion().setFromAxisAngle(up,p.spin));
    const geo=kit.props[p.kind];
    if(THROUGH.has(p.kind)){
      // Driven clean through: both ends stick out (a bolt mostly out the back).
      // Slide it along its axis so both ends clear this body, whatever its size.
      geo.boundingBox||geo.computeBoundingBox();const {min,max}=geo.boundingBox,lo=along+.02-max.y,hi=-along-.02-min.y,want=p.kind==='bolt'?-along*.35:0;
      const shift=lo<=hi?Math.min(hi,Math.max(lo,want)):(lo+hi)/2;
      attach(e,parent,geo,kit.material,centre.clone().addScaledVector(dir,shift),q,1,`Impaled ${p.kind}`);
    }else{
      // Driven in, not through: on a thin limb it sits further out so the
      // point stops short of the far side.
      geo.boundingBox||geo.computeBoundingBox();const inner=-geo.boundingBox.min.y;
      attach(e,parent,geo,kit.material,centre.clone().addScaledVector(dir,along*.82+Math.max(0,inner-along*1.5)),q,1,`Embedded ${p.kind}`);
    }
  }
  return e;
}

// Removes every trace (used if a rig is repurposed, and by tests).
export function clearInjury(e){
  for(const m of e.injuryMeshes||[])m.parent?.remove(m);
  for(const node of e.injuryHidden||[])node.traverse(o=>{if(o.isMesh&&o.userData.injuryHidden){o.visible=true;delete o.userData.injuryHidden;delete o.raycast;}});
  if(e.injuryHead){e.injuryHead.mesh.geometry=e.injuryHead.geometry;}
  e.injuryMeshes=e.injuryHidden=e.injuryHead=null;e.injury=null;e.armless=0;e.jawless=false;e.crushed=false;
}
