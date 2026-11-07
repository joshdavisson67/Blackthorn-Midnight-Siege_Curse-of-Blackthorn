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
  function part(geo,material,position,name,rotation=null,scale=null){const m=new T.Mesh(geo,material);m.position.set(...position);if(rotation)m.rotation.set(...rotation);if(scale)m.scale.set(...scale);m.name=name;m.castShadow=true;template.add(m);return m;}
  part(pineappleBody(),body,[0,0,0],'Pineapple grenade body');
  // Threaded neck and the fuse: a shouldered striker housing with a domed cap.
  const neck=[];for(let k=0;k<=10;k++)neck.push(new T.Vector2(k%2?.0118:.0108,.038+k*.0011));
  part(new T.LatheGeometry([new T.Vector2(0,.037),new T.Vector2(.0108,.037),...neck,new T.Vector2(.0108,.0495),new T.Vector2(0,.0495)],24),darkSteel,[0,0,0],'Threaded fuse neck');
  part(new T.LatheGeometry([new T.Vector2(0,.049),new T.Vector2(.0132,.049),new T.Vector2(.0134,.0525),new T.Vector2(.0126,.0545),new T.Vector2(.0098,.0555),new T.Vector2(.0096,.064),new T.Vector2(.0085,.0675),new T.Vector2(.0055,.0698),new T.Vector2(0,.0705)],24),darkSteel,[0,0,0],'Fuse striker housing');
  part(new T.CylinderGeometry(.0024,.0024,.026,10),darkSteel,[-.003,.0625,0],'Lever pivot pin',[Math.PI/2,0,0]);
  for(const zs of [-1,1])part(new T.BoxGeometry(.008,.011,.0016),lever,[-.003,.0625,zs*.0118],'Lever pivot ear');
  // The spoon: over the fuse head, then down the side of the body.
  const hug=y=>GRENADE_MODEL.radius*Math.sqrt(Math.max(0,1-(y/GRENADE_MODEL.halfHeight)**2))+.0026;
  part(sweepStrip([[-.006,.0655,0],[-.001,.0718,0],[.008,.0712,0],[.0145,.0655,0],[.0168,.057,0],[.0186,.049,0],[hug(.036),.036,0],[hug(.026),.026,0],[hug(.014),.014,0],[hug(0),0,0],[hug(-.012),-.012,0],[hug(-.019)-.0006,-.019,0]],t=>.0168-t*.0048,.0016,.0011),lever,[0,0,0],'Safety lever');
  // Split pin through the fuse, splayed on the far side, and the pull ring.
  part(new T.CylinderGeometry(.0011,.0011,.034,8),bright,[.004,.0545,0],'Safety pin',[Math.PI/2,0,0]);
  for(const s of [-1,1])part(new T.CylinderGeometry(.0009,.0009,.008,6),bright,[.004+s*.002,.0545,-.019],'Split pin leg',[Math.PI/2,0,s*.5]);
  part(new T.TorusGeometry(.0042,.0011,6,14),bright,[.004,.0545,.0205],'Pin eye',[0,Math.PI/2,0]);
  part(new T.TorusGeometry(.0118,.0016,8,30),bright,[-.004,.0465,.0305],'Pull ring',[.2,Math.PI/2-.35,0]);
  // Yellow high-explosive band around the neck, and the threaded base plug.
  part(new T.TorusGeometry(.0125,.0014,6,28),yellow,[0,.0395,0],'HE band',[Math.PI/2,0,0]);
  part(new T.CylinderGeometry(.0068,.0074,.004,16),darkSteel,[0,-.0435,0],'Base filler plug');
  part(new T.TorusGeometry(.0071,.0007,4,16),darkSteel,[0,-.0452,0],'Base plug thread',[Math.PI/2,0,0]);
  if(batch)batch(template);
  return {template,create:()=>template.clone(true)};
}

// Camera-space key poses: bring up the grenade, draw back, throw, and retract.
const keys=[
  {t:0,w:[.32,-.74,-.34],r:[.10,-.10,.10],lower:0},
  {t:.12,w:[.23,-.18,-.43],r:[-.10,.08,-.12],lower:.80},
  {t:.28,w:[.31,.12,-.36],r:[-.32,.12,.10],lower:1},
  {t:GRENADE_THROW.release,w:[.14,.06,-.57],r:[.12,-.08,-.15],lower:1},
  {t:.57,w:[0,-.13,-.61],r:[.33,-.12,-.42],lower:.87},
  {t:GRENADE_THROW.duration,w:[.30,-.78,-.31],r:[.08,0,.18],lower:0},
];
function sample(time,field,axis){
  let i=0;while(i<keys.length-2&&time>keys[i+1].t)i++;
  const a=keys[i],b=keys[i+1],before=keys[Math.max(0,i-1)],after=keys[Math.min(keys.length-1,i+2)];
  const value=k=>axis===undefined?k[field]:k[field][axis],u=T.MathUtils.clamp((time-a.t)/(b.t-a.t),0,1),u2=u*u,u3=u2*u;
  const av=value(a),bv=value(b),m0=(bv-value(before))/(b.t-before.t),m1=(value(after)-av)/(after.t-a.t),span=b.t-a.t;
  return (2*u3-3*u2+1)*av+(u3-2*u2+u)*span*m0+(-2*u3+3*u2)*bv+(u3-u2)*span*m1;
}

export function createGrenadeThrow(assets,batch){
  const root=new T.Group();root.name='Grenade throwing arm';
  const upper=new T.Group(),forearm=new T.Group(),hand=new T.Group();upper.name='Throwing upper arm';forearm.name='Throwing forearm';hand.name='Throwing hand';root.add(upper,forearm,hand);
  const sleeve=new T.MeshStandardMaterial({color:0x465044,roughness:.94});
  const seam=new T.MeshStandardMaterial({color:0x65705c,roughness:.96});
  const glove=new T.MeshStandardMaterial({color:0x303a32,roughness:.87});
  const pad=new T.MeshStandardMaterial({color:0x171f1c,roughness:.84});
  const ellipsoid=new T.SphereGeometry(1,14,10),box=new T.BoxGeometry(1,1,1);
  function part(parent,geo,mat,pos,scale,name){const m=new T.Mesh(geo,mat);m.name=name;m.position.set(...pos);if(scale)m.scale.set(...scale);parent.add(m);return m;}
  part(upper,new T.CylinderGeometry(.052,.063,1,20),sleeve,[0,0,0],null,'Sleeved upper arm');
  part(forearm,new T.CylinderGeometry(.037,.054,1,20),sleeve,[0,0,0],null,'Tapered sleeve');
  part(forearm,new T.CylinderGeometry(.040,.043,.16,20),pad,[0,.42,0],null,'Glove wrist cuff');
  part(forearm,box,seam,[0,.28,-.047],[.045,.018,.004],'Sleeve seam');
  part(forearm,box,pad,[.048,-.13,0],[.008,.19,.058],'Sleeve reinforcement');
  part(hand,ellipsoid,glove,[0,-.002,-.035],[.043,.027,.061],'Gloved palm');
  part(hand,ellipsoid,pad,[0,.023,-.038],[.037,.008,.048],'Padded glove back');
  const fingers=[],tips=[];
  for(let i=0;i<4;i++){
    const finger=new T.Group(),tip=new T.Group();finger.name='Throwing finger';tip.name='Finger tip joint';finger.position.set((i-1.5)*.018,-.008,-.079);hand.add(finger);tip.position.z=-.028;finger.add(tip);
    part(finger,ellipsoid,glove,[0,0,-.014],[.008,.009,.020],'Finger segment');
    part(tip,ellipsoid,glove,[0,0,-.012],[.0075,.008,.017],'Finger tip');
    part(hand,ellipsoid,pad,[(i-1.5)*.018,.016,-.080],[.010,.008,.012],'Glove knuckle pad');fingers.push(finger);tips.push(tip);
  }
  const thumb=new T.Group();thumb.name='Throwing thumb';thumb.position.set(-.043,-.008,-.043);thumb.rotation.y=-.6;hand.add(thumb);
  part(thumb,ellipsoid,glove,[0,-.011,-.014],[.011,.019,.025],'Thumb grip');
  part(thumb,ellipsoid,glove,[.004,-.027,-.036],[.010,.011,.019],'Thumb tip');
  const held=assets.create();held.name='Held grenade';held.position.set(0,-.052,-.086);held.rotation.z=-.12;hand.add(held);
  if(batch)batch(root);
  root.traverse(o=>{o.layers.set(1);if(o.isMesh){o.castShadow=false;o.receiveShadow=false;o.frustumCulled=false;o.renderOrder=0;}});
  const shoulder=new T.Vector3(.38,-.42,-.08),wrist=new T.Vector3(),elbow=new T.Vector3(),direction=new T.Vector3(),bend=new T.Vector3(),axis=new T.Vector3(0,1,0);
  const pole=new T.Vector3(1,-.15,-.15),boneDirection=new T.Vector3(),handAxis=new T.Vector3(0,0,-1),wristRotation=new T.Quaternion(),wristEuler=new T.Euler(),upperLength=.39,foreLength=.38;
  let active=false,time=0,released=false,lower=0;
  function connect(group,from,to){group.position.copy(from).add(to).multiplyScalar(.5);boneDirection.copy(to).sub(from);group.scale.y=boneDirection.length();group.quaternion.setFromUnitVectors(axis,boneDirection.normalize());}
  function pose(seconds){
    wrist.set(sample(seconds,'w',0),sample(seconds,'w',1),sample(seconds,'w',2));direction.copy(wrist).sub(shoulder);
    const distance=T.MathUtils.clamp(direction.length(),.02,upperLength+foreLength-.001);direction.normalize();wrist.copy(shoulder).addScaledVector(direction,distance);
    const along=(upperLength*upperLength-foreLength*foreLength+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,upperLength*upperLength-along*along));
    bend.copy(pole).addScaledVector(direction,-pole.dot(direction)).normalize();elbow.copy(shoulder).addScaledVector(direction,along).addScaledVector(bend,height);
    connect(upper,shoulder,elbow);connect(forearm,elbow,wrist);hand.position.copy(wrist);hand.quaternion.setFromUnitVectors(handAxis,boneDirection);
    wristEuler.set(sample(seconds,'r',0),sample(seconds,'r',1),sample(seconds,'r',2));hand.quaternion.multiply(wristRotation.setFromEuler(wristEuler));
    const open=T.MathUtils.smoothstep(seconds,GRENADE_THROW.release,GRENADE_THROW.release+.10);
    fingers.forEach(f=>f.rotation.x=T.MathUtils.lerp(-.94,.08,open));tips.forEach(f=>f.rotation.x=T.MathUtils.lerp(-1.0,-.06,open));thumb.rotation.z=T.MathUtils.lerp(.14,-.48,open);
    lower=T.MathUtils.clamp(sample(seconds,'lower'),0,1);
  }
  function cancel(){active=false;time=0;released=false;lower=0;root.visible=false;held.visible=true;pose(0);}
  cancel();
  return {root,hand,held,upper,forearm,shoulder,wrist,elbow,upperLength,foreLength,
    get active(){return active;},get time(){return time;},get lower(){return lower;},get released(){return released;},
    begin(){if(active)return false;active=true;time=0;released=false;held.visible=true;pose(0);root.visible=true;return true;},
    update(dt,onRelease){
      if(!active)return;const next=Math.min(GRENADE_THROW.duration,time+Math.max(0,dt));
      if(!released&&next>=GRENADE_THROW.release){
        pose(GRENADE_THROW.release);root.updateWorldMatrix(true,true);const position=held.getWorldPosition(new T.Vector3()),rotation=held.getWorldQuaternion(new T.Quaternion());
        released=true;held.visible=false;onRelease(position,rotation,next-GRENADE_THROW.release);
      }
      time=next;pose(time);if(time>=GRENADE_THROW.duration){active=false;root.visible=false;lower=0;}
    },warm(){held.visible=true;pose(.12);root.visible=true;},cancel};
}
