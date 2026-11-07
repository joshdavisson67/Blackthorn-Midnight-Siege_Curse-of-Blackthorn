import * as T from './three.module.js';

export const GRENADE_THROW={release:.42,duration:.84};

// The held grenade and every projectile share the same warmed model.
// v185: a Mk 2 "pineapple" with real relief. The body is one sculpted mesh:
// eight columns and five rows of raised segments cut by grooves, painted in
// vertex colours (olive drab with grime in the grooves, chipped segment edges,
// per-segment variation and a handling shine). On top: a threaded neck, a
// shouldered fuse, a cupped spoon lever that hugs the body, a split pin with a
// pull ring, a yellow HE band and a base plug. Built once; throws share it.
export const GRENADE_MODEL=Object.freeze({radius:.034,halfHeight:.046,columns:8,rows:5,groove:.0021,relief:.0029});
const hash=(a,b)=>{let h=Math.imul(a*73856093^b*19349663,0x27d4eb2d);h^=h>>>15;return (h>>>0)/4294967296;};
function pineappleBody(){
  const G=GRENADE_MODEL,geo=new T.SphereGeometry(1,128,96),pos=geo.attributes.position,colors=new Float32Array(pos.count*3);
  const paint=new T.Color(0x4f573a),grime=new T.Color(0x15180f),chip=new T.Color(0x7a7a72),rust=new T.Color(0x5c3a20),shine=new T.Color(0x6b7553),c=new T.Color(),band=.8;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),ring=Math.hypot(x,z),theta=Math.atan2(z,x)+Math.PI/G.columns*.5;
    let rx=G.radius,ry=G.halfHeight,knob=1,col=0,row=-1,edge=1;
    if(Math.abs(y)<band){
      const cu=(theta/(Math.PI*2)*G.columns+G.columns)%G.columns,rv=(y+band)/(band*2)*G.rows;col=Math.floor(cu);row=Math.min(G.rows-1,Math.floor(rv));
      const u=cu-col,v=rv-row,width=Math.PI*2*G.radius*ring/G.columns,height=G.halfHeight*band*2/G.rows;
      const e=Math.min(Math.min(u,1-u)*width,Math.min(v,1-v)*height);edge=T.MathUtils.clamp(e/G.groove,0,1);
      knob=T.MathUtils.smoothstep(e,G.groove*.35,G.groove*1.25)+.25*Math.sin(Math.PI*u)*Math.sin(Math.PI*v)*T.MathUtils.smoothstep(e,G.groove,G.groove*2.5);
    }else{
      // Smooth shoulders above and below the segments, flattened where the
      // fuse neck and base plug seat.
      knob=1;if(y>0)ry*=1-.12*T.MathUtils.smoothstep(y,.86,1);else ry*=1-.08*T.MathUtils.smoothstep(-y,.9,1);
    }
    const out=(knob-1)*G.relief;pos.setXYZ(i,x*(rx+out*ring),y*ry+out*y*.6,z*(rx+out*ring));
    // Paint: per-segment hue, grime in the grooves, chips on the edges, wear on top.
    const n=hash(col+11,row+31),speck=hash(i,7);
    c.copy(paint).multiplyScalar(.9+n*.2);c.r*=.97+hash(col,row)*.06;
    if(row>=0){
      // Grooves hold grime and a little rust; segment edges are chipped to bare
      // steel; segment faces are rubbed lighter where hands grip.
      const blot=hash(Math.floor((theta+4)*22),Math.floor((y+2)*40)),wornEdge=edge<.98&&knob>.5;
      if(knob<.55)c.lerp(blot<.3?rust:grime,.85*(1-knob/.55));
      else if(wornEdge&&(speck<.3+.35*hash(col*3,row*5)||blot<.18))c.lerp(chip,.7+.3*speck);
      else if(blot>.975&&speck>.5)c.lerp(rust,.35);
      else c.lerp(shine,.45*T.MathUtils.smoothstep(knob,1,1.2));
    }else c.multiplyScalar(y>0?.95:.82).lerp(grime,y<0?.2:0);
    if(y<-.55)c.lerp(grime,.25*(-.55-y)/.45);
    colors[i*3]=c.r;colors[i*3+1]=c.g;colors[i*3+2]=c.b;
  }
  geo.setAttribute('color',new T.BufferAttribute(colors,3));geo.computeVertexNormals();return geo;
}
// A thin strip swept along a curve in the XZ=0 plane, cupped across its width
// (the spoon lever). `width(t)` sets the width; the cup bows away from the body.
function sweepStrip(points,width,thick,cup){
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),N=28,M=6,vs=[],idx=[],tan=new T.Vector3(),nrm=new T.Vector3(),side=new T.Vector3(0,0,1);
  for(let i=0;i<=N;i++){
    const t=i/N,c=curve.getPoint(t);curve.getTangent(t,tan);nrm.set(tan.y,-tan.x,0).normalize();const w=width(t);
    for(const face of [0,1])for(let j=0;j<=M;j++){const s=j/M*2-1,bow=cup*(1-s*s);const p=c.clone().addScaledVector(side,s*w/2).addScaledVector(nrm,bow-face*thick);vs.push(p.x,p.y,p.z);}
  }
  const row=(M+1)*2,at=(i,face,j)=>i*row+face*(M+1)+j;
  for(let i=0;i<N;i++)for(let j=0;j<M;j++){
    idx.push(at(i,0,j),at(i+1,0,j),at(i,0,j+1),at(i+1,0,j),at(i+1,0,j+1),at(i,0,j+1));
    idx.push(at(i,1,j),at(i,1,j+1),at(i+1,1,j),at(i+1,1,j),at(i,1,j+1),at(i+1,1,j+1));
  }
  for(let i=0;i<N;i++)for(const j of [0,M]){const a=at(i,0,j),b=at(i+1,0,j),c2=at(i,1,j),d=at(i+1,1,j);if(j===0)idx.push(a,c2,b,b,c2,d);else idx.push(a,b,c2,b,d,c2);}
  for(const i of [0,N])for(let j=0;j<M;j++){const a=at(i,0,j),b=at(i,0,j+1),c2=at(i,1,j),d=at(i,1,j+1);if(i===0)idx.push(a,b,c2,b,d,c2);else idx.push(a,c2,b,b,c2,d);}
  const uv=[];for(let i=0;i<=N;i++)for(const face of [0,1])for(let j=0;j<=M;j++)uv.push(j/M,i/N);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vs,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
export function createGrenadeAssets(batch){
  const template=new T.Group();template.name='Fragmentation grenade';
  const body=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.74,metalness:.28});
  const darkSteel=new T.MeshStandardMaterial({color:0x4a4e44,roughness:.48,metalness:.72});
  const lever=new T.MeshStandardMaterial({color:0x5c614d,roughness:.42,metalness:.62});
  const bright=new T.MeshStandardMaterial({color:0xa7aba2,roughness:.26,metalness:.92});
  const yellow=new T.MeshStandardMaterial({color:0xc9a43a,roughness:.62,metalness:.1});
  // v186: the spoon and the pin with its ring are their own groups, so the
  // pin can be pulled from the held grenade and the spoon can fly off in flight.
  const spoon=new T.Group(),pin=new T.Group();spoon.name='Spoon';pin.name='Pin and ring';template.add(spoon,pin);
  function part(geo,material,position,name,rotation=null,scale=null,parent=template){const m=new T.Mesh(geo,material);m.position.set(...position);if(rotation)m.rotation.set(...rotation);if(scale)m.scale.set(...scale);m.name=name;m.castShadow=true;parent.add(m);return m;}
  part(pineappleBody(),body,[0,0,0],'Pineapple grenade body');
  // Threaded neck and the fuse: a shouldered striker housing with a domed cap.
  const neck=[];for(let k=0;k<=10;k++)neck.push(new T.Vector2(k%2?.0118:.0108,.038+k*.0011));
  part(new T.LatheGeometry([new T.Vector2(0,.037),new T.Vector2(.0108,.037),...neck,new T.Vector2(.0108,.0495),new T.Vector2(0,.0495)],24),darkSteel,[0,0,0],'Threaded fuse neck');
  part(new T.LatheGeometry([new T.Vector2(0,.049),new T.Vector2(.0132,.049),new T.Vector2(.0134,.0525),new T.Vector2(.0126,.0545),new T.Vector2(.0098,.0555),new T.Vector2(.0096,.064),new T.Vector2(.0085,.0675),new T.Vector2(.0055,.0698),new T.Vector2(0,.0705)],24),darkSteel,[0,0,0],'Fuse striker housing');
  part(new T.CylinderGeometry(.0024,.0024,.026,10),darkSteel,[-.003,.0625,0],'Lever pivot pin',[Math.PI/2,0,0]);
  for(const zs of [-1,1])part(new T.BoxGeometry(.008,.011,.0016),lever,[-.003,.0625,zs*.0118],'Lever pivot ear',null,null,spoon);
  // The spoon: over the fuse head, then down the side of the body.
  const hug=y=>GRENADE_MODEL.radius*Math.sqrt(Math.max(0,1-(y/GRENADE_MODEL.halfHeight)**2))+.0026;
  part(sweepStrip([[-.006,.0655,0],[-.001,.0718,0],[.008,.0712,0],[.0145,.0655,0],[.0168,.057,0],[.0186,.049,0],[hug(.036),.036,0],[hug(.026),.026,0],[hug(.014),.014,0],[hug(0),0,0],[hug(-.012),-.012,0],[hug(-.019)-.0006,-.019,0]],t=>.0168-t*.0048,.0016,.0011),lever,[0,0,0],'Safety lever',null,null,spoon);
  // Split pin through the fuse, splayed on the far side, and the pull ring.
  part(new T.CylinderGeometry(.0011,.0011,.034,8),bright,[.004,.0545,0],'Safety pin',[Math.PI/2,0,0],null,pin);
  for(const s of [-1,1])part(new T.CylinderGeometry(.0009,.0009,.008,6),bright,[.004+s*.002,.0545,-.019],'Split pin leg',[Math.PI/2,0,s*.5],null,pin);
  part(new T.TorusGeometry(.0042,.0011,6,14),bright,[.004,.0545,.0205],'Pin eye',[0,Math.PI/2,0],null,pin);
  part(new T.TorusGeometry(.0118,.0016,8,30),bright,[-.004,.0465,.0305],'Pull ring',[.2,Math.PI/2-.35,0],null,pin);
  // Yellow high-explosive band around the neck, and the threaded base plug.
  part(new T.TorusGeometry(.0125,.0014,6,28),yellow,[0,.0395,0],'HE band',[Math.PI/2,0,0]);
  part(new T.CylinderGeometry(.0068,.0074,.004,16),darkSteel,[0,-.0435,0],'Base filler plug');
  part(new T.TorusGeometry(.0071,.0007,4,16),darkSteel,[0,-.0452,0],'Base plug thread',[Math.PI/2,0,0]);
  if(batch)batch(template);
  return {template,create:()=>template.clone(true),createSpoon:()=>spoon.clone(true),createPin:()=>pin.clone(true)};
}

// ---- The throwing arms (v186) ------------------------------------------------------------------
// A field-jacket sleeve with folds, a seam and a buttoned cuff over a tactical
// glove (leather palm, hard knuckle guard, velcro strap) on a jointed hand:
// four three-jointed fingers and a thumb that wrap the grenade. The left hand
// comes in to pull the pin. Everything is built once and only posed per frame.
const smooth=t=>t*t*(3-2*t);
function roundedBox(w,h,d,r,seg=3){
  const g=new T.BoxGeometry(w,h,d,seg*2,seg*2,seg*2),p=g.attributes.position,v=new T.Vector3(),q=new T.Vector3(),hx=w/2-r,hy=h/2-r,hz=d/2-r;
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);q.set(T.MathUtils.clamp(v.x,-hx,hx),T.MathUtils.clamp(v.y,-hy,hy),T.MathUtils.clamp(v.z,-hz,hz));v.sub(q);if(v.lengthSq()>0)v.setLength(r);q.add(v);p.setXYZ(i,q.x,q.y,q.z);}
  g.computeVertexNormals();return g;
}
// A fabric tube from y=0 to y=length: tapered, slightly flattened, with
// wandering folds that bunch toward one end, a seam, and darker fold valleys.
function fabricTube(length,r0,r1,{seed=1,folds=.0032,bunch=1,seamAt=-1.9,color=0x2e3322}={}){
  const g=new T.CylinderGeometry(1,1,1,22,30,true),p=g.attributes.position,colors=new Float32Array(p.count*3),base=new T.Color(color),c=new T.Color();
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),t=y+.5,th=Math.atan2(z,x);
    const wave=Math.sin(Math.PI*2*(t*4.6+.32*Math.sin(th*1+seed)+.12*Math.sin(th*3-seed*2)))*(.55+.45*Math.sin(th*2+seed*3));
    const amp=folds*(.6+bunch*1.6*smooth(T.MathUtils.clamp((t-.6)/.4,0,1)));
    const dth=Math.atan2(Math.sin(th-seamAt),Math.cos(th-seamAt)),seam=.0011*Math.exp(-((dth/.07)**2));
    const r=r0+(r1-r0)*t+amp*wave+seam;
    p.setXYZ(i,x*r,t*length,z*r*.9);
    c.copy(base).multiplyScalar(.8+.2*(wave*.5+.5)-.25*Math.exp(-((dth/.03)**2)));colors[i*3]=c.r;colors[i*3+1]=c.g;colors[i*3+2]=c.b;
  }
  g.setAttribute('color',new T.BufferAttribute(colors,3));g.computeVertexNormals();return g;
}
// Finger lengths (proximal, middle, distal) and their place on the knuckles.
const FINGERS=[
  {name:'Index',x:-.028,z:-.090,len:[.040,.025,.020],r:.0094,splay:-.07},
  {name:'Middle',x:-.009,z:-.093,len:[.045,.028,.021],r:.0097,splay:-.015},
  {name:'Ring',x:.010,z:-.091,len:[.042,.026,.020],r:.0093,splay:.04},
  {name:'Little',x:.027,z:-.084,len:[.033,.020,.018],r:.0084,splay:.1},
];
function buildArm(mat,side){
  const root=new T.Group(),upper=new T.Group(),forearm=new T.Group(),hand=new T.Group();root.name=`${side} throwing arm`;upper.name=`${side} upper arm`;forearm.name=`${side} forearm`;hand.name=`${side} hand`;root.add(upper,forearm,hand);
  const mesh=(parent,geo,m,pos=[0,0,0],rot=null,name='')=>{const o=new T.Mesh(geo,m);o.position.set(...pos);if(rot)o.rotation.set(...rot);o.name=name;parent.add(o);return o;};
  const UPPER=.39,FORE=.38;
  // Sleeve: the upper arm bunches at the elbow; the forearm ends in a cuff with a tab.
  mesh(upper,fabricTube(UPPER,.062,.055,{seed:1.3,bunch:1.2}),mat.fabric,[0,0,0],null,'Jacket upper sleeve');
  mesh(upper,new T.SphereGeometry(.057,18,12),mat.fabricPlain,[0,UPPER,0],null,'Elbow');
  mesh(forearm,fabricTube(FORE-.03,.054,.046,{seed:4.1,bunch:.4,folds:.0028}),mat.fabric,[0,0,0],null,'Jacket forearm sleeve');
  mesh(forearm,fabricTube(.045,.049,.05,{seed:2.2,folds:.0012,bunch:0}),mat.fabric,[0,FORE-.072,0],null,'Sleeve cuff');
  mesh(forearm,roundedBox(.026,.05,.006,.0025),mat.fabricPlain,[.034,FORE-.06,.036],[0,.75,0],'Cuff tab');
  mesh(forearm,new T.CylinderGeometry(.0055,.0055,.003,12),mat.button,[.037,FORE-.048,.039],[Math.PI/2,0,.75],'Cuff button');
  // Glove: gauntlet and strap at the wrist, then the hand (fingers along -z, palm down).
  mesh(hand,new T.CylinderGeometry(.044,.040,.05,20,1,true),mat.glove,[0,0,.022],[Math.PI/2,0,0],'Glove gauntlet');
  mesh(hand,new T.CylinderGeometry(.0455,.0455,.02,20),mat.strap,[0,0,.014],[Math.PI/2,0,0],'Velcro wrist strap');
  mesh(hand,roundedBox(.03,.008,.024,.003),mat.strap,[.012,.043,.014],null,'Strap tab');
  mesh(hand,roundedBox(.084,.031,.088,.012),mat.glove,[0,0,-.046],null,'Glove back');
  mesh(hand,roundedBox(.078,.009,.08,.004),mat.palm,[0,-.013,-.048],null,'Leather palm');
  mesh(hand,roundedBox(.076,.013,.026,.006),mat.armor,[0,.016,-.084],[-.12,0,0],'Knuckle guard');
  mesh(hand,roundedBox(.05,.006,.036,.003),mat.armor,[.004,.0165,-.045],null,'Back-of-hand plate');
  const fingers=FINGERS.map(f=>{
    const joints=[];let parent=hand,z=0;
    f.len.forEach((len,k)=>{
      const j=new T.Group();j.name=`${f.name} joint ${k+1}`;j.position.set(k?0:f.x,k?0:-.003,k?-f.len[k-1]:f.z);if(!k)j.rotation.y=f.splay;parent.add(j);
      const r=f.r*(1-k*.07);mesh(j,new T.CapsuleGeometry(r,Math.max(.001,len-r*1.2),4,10),mat.glove,[0,0,-len/2],[Math.PI/2,0,0],`${f.name} phalanx ${k+1}`);
      if(k===0)mesh(j,roundedBox(r*1.7,.006,len*.62,.0025),mat.armor,[0,r*.85,-len*.5],null,'Finger pad');
      joints.push(j);parent=j;z+=len;
    });
    return {...f,joints};
  });
  const thumbBase=new T.Group();thumbBase.name='Thumb base';thumbBase.position.set(-.036,-.008,-.022);hand.add(thumbBase);
  const thumb=[];{let parent=thumbBase;[.036,.03,.025].forEach((len,k)=>{const j=new T.Group();j.name=`Thumb joint ${k+1}`;j.position.z=k?-[.036,.03][k-1]:0;parent.add(j);const r=[.0125,.0108,.0098][k];mesh(j,new T.CapsuleGeometry(r,Math.max(.001,len-r*1.1),4,10),k===0?mat.palm:mat.glove,[0,0,-len/2],[Math.PI/2,0,0],`Thumb phalanx ${k+1}`);thumb.push(j);parent=j;});}
  return {root,upper,forearm,hand,fingers,thumb,thumbBase,upperLength:UPPER,foreLength:FORE};
}
// Finger poses: [proximal, middle, distal] curl per finger, and the thumb.
const GRIP={fingers:[[1.05,1.15,.75],[1.0,1.2,.8],[1.05,1.2,.8],[1.15,1.15,.75]],thumb:{base:[-.15,-.95,.55],curl:[.25,.45]}};
const OPEN={fingers:[[.05,.06,.04],[.02,.05,.03],[.06,.08,.05],[.1,.12,.08]],thumb:{base:[0,-.55,.25],curl:[.05,.05]}};
const RELAX={fingers:[[.35,.45,.3],[.4,.5,.3],[.5,.55,.35],[.6,.6,.4]],thumb:{base:[0,-.7,.35],curl:[.2,.25]}};
const PINCH={fingers:[[.65,.75,.45],[1.1,1.2,.8],[1.2,1.25,.85],[1.25,1.25,.8]],thumb:{base:[-.1,-.85,.45],curl:[.35,.5]}};
function setFingers(arm,a,b,k,stagger=0){
  arm.fingers.forEach((f,i)=>{const u=T.MathUtils.clamp(k*(1+stagger)-i*stagger*.25,0,1),e=smooth(u);f.joints.forEach((j,n)=>{j.rotation.x=-T.MathUtils.lerp(a.fingers[i][n],b.fingers[i][n],e);});});
  const e=smooth(T.MathUtils.clamp(k,0,1));arm.thumbBase.rotation.set(...a.thumb.base.map((v,n)=>T.MathUtils.lerp(v,b.thumb.base[n],e)));
  arm.thumb[1].rotation.x=-T.MathUtils.lerp(a.thumb.curl[0],b.thumb.curl[0],e);arm.thumb[2].rotation.x=-T.MathUtils.lerp(a.thumb.curl[1],b.thumb.curl[1],e);
}

// Right arm key poses, camera space: wrist (w), hand rotation (r), elbow pole
// (p), shoulder (s, the torso turning), and how far the gun is lowered.
// Up from below; present the grenade for the pin; draw back beside the head
// with the elbow high; whip forward elbow-first and flick the wrist at release;
// follow through across the body; drop away.
const RIGHT=[
  {t:0,   w:[.30,-.84,-.30],f:[-.3,.7,-.6], b:[.5,.3,.7],  p:[1,-.4,.1], s:[.38,-.44,-.08],lower:0},
  {t:.08, w:[.21,-.33,-.42],f:[-.65,.45,-.6],b:[.2,.4,.75],p:[1,-.6,0],  s:[.37,-.43,-.09],lower:.75},
  {t:.15, w:[.16,-.19,-.40],f:[-.85,.2,-.45],b:[.15,-.5,-.85],p:[1,-.7,.1],s:[.36,-.42,-.09],lower:1},
  {t:.21, w:[.18,-.17,-.37],f:[-.85,.25,-.4],b:[.2,-.45,-.85],p:[1,-.6,.1],s:[.37,-.42,-.06],lower:1},
  {t:.31, w:[.34,.03,-.2], f:[.1,.75,.65],  b:[.25,-.25,.95],p:[.9,.75,.45],s:[.43,-.38,.03],lower:1},
  {t:.365,w:[.30,.14,-.29], f:[0,.95,.25],   b:[.3,-.05,.95],p:[.8,.6,.1], s:[.40,-.39,-.03],lower:1},
  {t:GRENADE_THROW.release,w:[.15,.06,-.56],f:[-.05,.45,-.9],b:[.15,.9,.4],p:[1,-.05,-.35],s:[.34,-.42,-.15],lower:1},
  {t:.5,  w:[-.02,-.16,-.58],f:[-.35,-.4,-.85],b:[.1,.9,-.35],p:[.9,-.4,-.3],s:[.30,-.45,-.18],lower:.95},
  {t:.61, w:[-.08,-.42,-.47],f:[-.4,-.7,-.55],b:[.25,.6,-.75],p:[.6,-.8,0], s:[.31,-.46,-.15],lower:.8},
  {t:GRENADE_THROW.duration,w:[.14,-.86,-.28],f:[-.2,-.8,-.5],b:[.35,.45,-.8],p:[1,-.4,.1],s:[.38,-.44,-.08],lower:0},
];
// The left hand (mirrored space: +x is the player's left) reaches in, pinches
// the ring and yanks the pin out, then drops away.
const PIN=Object.freeze({reach:.09,grab:.165,yank:.235,gone:.32});
const LEFT_SHOULDER=new T.Vector3(.33,-.56,-.02);
// Left hand orientations (fingers, back of hand) in mirrored space: reach, pinch, yank, drop.
const LEFT_ROT=[[[-.3,.7,-.6],[.85,.1,.45]],[[-.4,.62,-.65],[.9,.1,.35]],[[-.4,.62,-.65],[.9,.1,.35]],[[-.2,.3,-.9],[.85,.35,.2]],[[0,-.6,-.75],[.6,.5,-.5]]];
// Camera sway from the body: lean back on the draw, settle for release (aim is
// exact at release), dip into the follow-through.
const SWAY=[[0,0,0,0],[.2,.004,.004,0],[.3,.03,.018,-.03],[.37,0,0,0],[.465,0,0,0],[.54,-.026,-.012,.022],[.7,-.008,-.004,.006],[GRENADE_THROW.duration,0,0,0]];

function hermite(keys,time,get){
  let i=0;while(i<keys.length-2&&time>keys[i+1].t)i++;
  const a=keys[i],b=keys[i+1],before=keys[Math.max(0,i-1)],after=keys[Math.min(keys.length-1,i+2)];
  const u=T.MathUtils.clamp((time-a.t)/(b.t-a.t),0,1),u2=u*u,u3=u2*u,span=b.t-a.t,av=get(a),bv=get(b);
  const m0=(bv-get(before))/Math.max(1e-6,b.t-before.t),m1=(get(after)-av)/Math.max(1e-6,after.t-a.t);
  return (2*u3-3*u2+1)*av+(u3-2*u2+u)*span*m0+(-2*u3+3*u2)*bv+(u3-u2)*span*m1;
}
function stepped(table,time,n){let i=0;while(i<table.length-2&&time>table[i+1][0])i++;const a=table[i],b=table[i+1],u=smooth(T.MathUtils.clamp((time-a[0])/(b[0]-a[0]),0,1));return a[n]+(b[n]-a[n])*u;}

export function createGrenadeThrow(assets,batch){
  const root=new T.Group();root.name='Grenade throwing arms';
  const fabricMat=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.96});
  const mat={fabric:fabricMat,fabricPlain:new T.MeshStandardMaterial({color:0x2a2f1f,roughness:.96}),button:new T.MeshStandardMaterial({color:0x2b2519,roughness:.45}),
    glove:new T.MeshStandardMaterial({color:0x2a2e27,roughness:.78}),palm:new T.MeshStandardMaterial({color:0x5c4a37,roughness:.86}),
    armor:new T.MeshStandardMaterial({color:0x17191a,roughness:.42,metalness:.08}),strap:new T.MeshStandardMaterial({color:0x39402f,roughness:.93})};
  const right=buildArm(mat,'Right'),leftMirror=new T.Group(),left=buildArm(mat,'Left');
  leftMirror.name='Left arm (mirrored)';leftMirror.scale.x=-1;leftMirror.add(left.root);root.add(right.root,leftMirror);
  const {upper,forearm,hand}=right;
  // The held grenade: fuse toward the thumb, spoon against the palm.
  const held=assets.create();held.name='Held grenade';held.position.set(-.004,-.05,-.062);held.rotation.set(.15,0,1.3);hand.add(held);
  const heldPin=held.getObjectByName('Pin and ring');
  const pinch=new T.Group();pinch.name='Left pinch';pinch.position.set(-.03,-.022,-.098);left.hand.add(pinch);
  const pulledPin=assets.createPin?.()||new T.Group();pulledPin.name='Pulled pin';pinch.add(pulledPin);pulledPin.visible=false;
  if(batch)batch(root);
  root.traverse(o=>{o.layers.set(1);if(o.isMesh){o.castShadow=false;o.receiveShadow=false;o.frustumCulled=false;o.renderOrder=0;}});

  const shoulder=new T.Vector3(),wrist=new T.Vector3(),elbow=new T.Vector3(),pole=new T.Vector3();
  const handX=new T.Vector3(),handY=new T.Vector3(),handZ=new T.Vector3(),direction=new T.Vector3(),bend=new T.Vector3(),xAxis=new T.Vector3(),yAxis=new T.Vector3(),zAxis=new T.Vector3(),basis=new T.Matrix4(),handQ=new T.Quaternion();
  const sway={pitch:0,yaw:0,roll:0};
  // Two-bone IK with an explicit elbow pole; each bone gets a full basis
  // (along the bone, toward the elbow bend) so sleeves never spin.
  function solve(arm,sh,wr,pl,fingers,back,outElbow){
    direction.copy(wr).sub(sh);const distance=T.MathUtils.clamp(direction.length(),.05,arm.upperLength+arm.foreLength-.001);direction.normalize();wr.copy(sh).addScaledVector(direction,distance);
    const along=(arm.upperLength**2-arm.foreLength**2+distance**2)/(2*distance),height=Math.sqrt(Math.max(0,arm.upperLength**2-along**2));
    bend.copy(pl).addScaledVector(direction,-pl.dot(direction));if(bend.lengthSq()<1e-8)bend.set(1,0,0);bend.normalize();
    outElbow.copy(sh).addScaledVector(direction,along).addScaledVector(bend,height);
    const place=(bone,from,to)=>{yAxis.copy(to).sub(from).normalize();xAxis.copy(bend).addScaledVector(yAxis,-bend.dot(yAxis)).normalize();zAxis.crossVectors(xAxis,yAxis);basis.makeBasis(xAxis,yAxis,zAxis);bone.position.copy(from);bone.quaternion.setFromRotationMatrix(basis);};
    place(arm.upper,sh,outElbow);place(arm.forearm,outElbow,wr);
    // Hand: keyed in camera space as where the fingers point and where the back
    // of the hand faces (hand -z and +y), so grips read clearly on screen.
    handZ.set(...fingers).normalize().negate();handY.set(...back);handY.addScaledVector(handZ,-handY.dot(handZ)).normalize();handX.crossVectors(handY,handZ);
    basis.makeBasis(handX,handY,handZ);handQ.setFromRotationMatrix(basis);arm.hand.position.copy(wr);arm.hand.quaternion.copy(handQ);
  }
  const key=(keys,field,time)=>[0,1,2].map(n=>hermite(keys,time,k=>k[field][n]));
  let active=false,time=0,released=false,lower=0,pinPulled=false;
  // Left-hand keys are solved once at load from where the ring actually is.
  const leftKeys=[];const leftElbow=new T.Vector3(),tmp=new T.Vector3(),tmpQ=new T.Quaternion(),pinRelative=new T.Matrix4();
  function poseRight(seconds){
    const w=key(RIGHT,'w',seconds),pl=key(RIGHT,'p',seconds),sh=key(RIGHT,'s',seconds);
    shoulder.set(...sh);wrist.set(...w);pole.set(...pl);solve(right,shoulder,wrist,pole,key(RIGHT,'f',seconds),key(RIGHT,'b',seconds),elbow);
    // Fingers: grip, then peel open from the index at release, relax after.
    const open=(seconds-(GRENADE_THROW.release-.02))/.08;
    if(open<=0)setFingers(right,GRIP,GRIP,0);else if(open<1)setFingers(right,GRIP,OPEN,open,.6);else setFingers(right,OPEN,RELAX,(seconds-GRENADE_THROW.release-.06)/.25);
    lower=T.MathUtils.clamp(hermite(RIGHT,seconds,k=>k.lower),0,1);
    sway.pitch=stepped(SWAY,seconds,1);sway.yaw=stepped(SWAY,seconds,2);sway.roll=stepped(SWAY,seconds,3);
  }
  // The pull ring's grip point, in the grenade's own space (the pin group sits at its origin).
  const RING_GRIP=new T.Vector3(-.004,.0465,.041);
  function ringInLeftSpace(seconds){poseRight(seconds);root.updateMatrixWorld(true);const ring=RING_GRIP.clone().applyMatrix4(heldPin.matrixWorld);const local=root.worldToLocal(ring);local.x*=-1;return local;}
  {
    // Where the ring sits while the grenade is presented, and the pinch's
    // offset in the left hand, give the left wrist targets for the grab.
    root.updateMatrixWorld(true);const ringGrab=ringInLeftSpace(PIN.grab),ringReach=ringInLeftSpace(PIN.reach+.04);
    const leftPose=(w,rot)=>{const wr=w.clone();solve(left,LEFT_SHOULDER.clone(),wr,new T.Vector3(1,-.6,.2),rot[0],rot[1],leftElbow);return wr;};
    const wristFor=(target,rot)=>{let w=target.clone().add(new T.Vector3(0,0,.1));for(let i=0;i<4;i++){leftPose(w,rot);left.root.updateMatrixWorld(true);const p=left.root.worldToLocal(pinch.getWorldPosition(new T.Vector3()));w.add(target.clone().sub(p));}return w;};
    setFingers(left,PINCH,PINCH,0);
    const grab=wristFor(ringGrab,LEFT_ROT[1]),reach=wristFor(ringReach.clone().add(new T.Vector3(.04,-.09,.05)),LEFT_ROT[0]);
    const k=(t,w,[f,b])=>({t,w,f,b});
    leftKeys.push(k(PIN.reach-.04,[.34,-.86,-.24],LEFT_ROT[0]),k(PIN.reach+.03,reach.toArray(),LEFT_ROT[0]),k(PIN.grab,grab.toArray(),LEFT_ROT[1]),k(PIN.grab+.02,grab.toArray(),LEFT_ROT[2]),
      k(PIN.yank,grab.clone().add(new T.Vector3(.12,-.05,.07)).toArray(),LEFT_ROT[3]),k(PIN.gone,[.36,-.9,-.18],LEFT_ROT[4]));
    // The pulled pin keeps the exact pose it had on the grenade at the grab.
    poseRight(PIN.grab);leftPose(new T.Vector3(...grab.toArray()),LEFT_ROT[1]);root.updateMatrixWorld(true);
    pinRelative.copy(pinch.matrixWorld).invert().multiply(heldPin.matrixWorld);pinRelative.decompose(pulledPin.position,pulledPin.quaternion,pulledPin.scale);
  }
  function poseLeft(seconds){
    const show=seconds>leftKeys[0].t&&seconds<PIN.gone;left.root.visible=show;if(!show)return;
    const w=new T.Vector3(...key(leftKeys,'w',seconds));solve(left,LEFT_SHOULDER.clone(),w,new T.Vector3(1,-.6,.2),key(leftKeys,'f',seconds),key(leftKeys,'b',seconds),leftElbow);
    const close=(seconds-(PIN.grab-.035))/.035;setFingers(left,RELAX,PINCH,close);
  }
  function pose(seconds){
    poseRight(seconds);poseLeft(seconds);
    const pulled=seconds>=PIN.grab;heldPin.visible=!pulled;pulledPin.visible=pulled&&seconds<PIN.gone;
  }
  function cancel(){active=false;time=0;released=false;lower=0;pinPulled=false;root.visible=false;held.visible=true;pose(0);sway.pitch=sway.yaw=sway.roll=0;heldPin.visible=true;}
  cancel();
  return {root,hand,held,upper,forearm,shoulder,wrist,elbow,upperLength:right.upperLength,foreLength:right.foreLength,right,left,heldPin,pulledPin,sway,PIN,
    get active(){return active;},get time(){return time;},get lower(){return lower;},get released(){return released;},get pinPulled(){return pinPulled;},
    begin(){if(active)return false;active=true;time=0;released=false;pinPulled=false;held.visible=true;pose(0);root.visible=true;return true;},
    update(dt,onRelease,onCue){
      if(!active)return;const next=Math.min(GRENADE_THROW.duration,time+Math.max(0,dt));
      if(!pinPulled&&next>=PIN.grab){pinPulled=true;onCue?.('pin');}
      if(!released&&next>=GRENADE_THROW.release){
        pose(GRENADE_THROW.release);root.updateWorldMatrix(true,true);const position=held.getWorldPosition(new T.Vector3()),rotation=held.getWorldQuaternion(new T.Quaternion());
        released=true;held.visible=false;onRelease(position,rotation,next-GRENADE_THROW.release);
      }
      time=next;pose(time);if(time>=GRENADE_THROW.duration){active=false;root.visible=false;lower=0;sway.pitch=sway.yaw=sway.roll=0;}
    },warm(){held.visible=true;pose(PIN.grab+.01);left.root.visible=true;root.visible=true;},cancel};
}
