import * as T from './three.module.js';

// v185: grenade explosions. A white-hot flash, a churning fireball that cools
// from white through orange to deep red around churning black soot, rolling
// smoke that rises and lingers,
// sparks and dirt thrown out on gravity, a dust shockwave and skirt along the
// ground, and a scorch mark left behind. Everything is made once at load and
// recycled: an explosion only moves, scales and recolours existing objects.
export const EXPLOSION_FX=Object.freeze({
  slots:6,fire:14,soot:7,smoke:11,dust:6,sparks:44,debris:22,scorches:10,
  fireLife:[.45,.8],smokeLife:[2.4,3.6],flash:.12,ring:.6,
  scorchHold:12,scorchFade:4,groundReach:.9,
  // v191: small pooled bursts for the M4's detonating rounds, separate from the
  // six grenade slots so rapid fire never steals a grenade's fireball.
  pops:12,popFire:4,popSmoke:2,
});

function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
// Small value noise for the procedural sprite textures.
function makeNoise(seed){
  const r=rng(seed),n=32,grid=new Float32Array(n*n);for(let i=0;i<grid.length;i++)grid[i]=r();
  const at=(x,y)=>grid[((y%n+n)%n)*n+((x%n+n)%n)],s=t=>t*t*(3-2*t);
  const value=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=s(x-xi),fy=s(y-yi);return at(xi,yi)*(1-fx)*(1-fy)+at(xi+1,yi)*fx*(1-fy)+at(xi,yi+1)*(1-fx)*fy+at(xi+1,yi+1)*fx*fy;};
  return (x,y,oct=4)=>{let sum=0,amp=.5,f=1;for(let o=0;o<oct;o++){sum+=value(x*f,y*f)*amp;f*=2.03;amp*=.5;}return sum;};
}
function dataTexture(size,paint,color=true){
  const px=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const [r,g,b,a]=paint(x/(size-1),y/(size-1)),i=(y*size+x)*4;px[i]=r;px[i+1]=g;px[i+2]=b;px[i+3]=a;}
  const t=new T.DataTexture(px,size,size,T.RGBAFormat,T.UnsignedByteType);t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;
  t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.generateMipmaps=true;t.wrapS=t.wrapT=T.ClampToEdgeWrapping;t.needsUpdate=true;return t;
}
const clamp01=v=>Math.max(0,Math.min(1,v)),byte=v=>Math.round(clamp01(v)*255);
// Four billows per texture (2×2 atlas), so neighbouring puffs never match.
function billowAtlas(seed,{soft,core,grain}){
  const noise=makeNoise(seed);
  return dataTexture(128,(u,v)=>{
    const q=(u<.5?0:1)+(v<.5?0:2),lu=(u*2)%1,lv=(v*2)%1,dx=lu-.5,dy=lv-.5,d=Math.hypot(dx,dy)*2;
    const n=noise(lu*5+q*7.3,lv*5+q*3.1),edge=1-d+(n-.5)*soft,a=clamp01(edge*2.2)*clamp01((.98-d)*10);
    const lum=core?clamp01(.55+(1-d)*.5+(n-.5)*grain):clamp01(.62+(n-.5)*grain+(.35-dy)*.25);
    return [byte(lum),byte(lum),byte(lum),byte(a*Math.pow(clamp01(.35+n),.6))];
  });
}

export function createExplosionFx(parent){
  // Everything is flagged dynamic so the estate's static batching never merges it.
  const F=EXPLOSION_FX,root=new T.Group();root.name='Explosion effects';root.userData.dynamic=root.userData.lightingTransient=true;parent.add(root);
  const fireTex=billowAtlas(91,{soft:.9,core:true,grain:.6}),smokeTex=billowAtlas(17,{soft:1.1,core:false,grain:.9});
  const soft=dataTexture(64,(u,v)=>{const d=Math.hypot(u-.5,v-.5)*2,a=Math.pow(clamp01(1-d),2.2);return [255,255,255,byte(a)];});
  const ringNoise=makeNoise(5),ring=dataTexture(128,(u,v)=>{const dx=u-.5,dy=v-.5,d=Math.hypot(dx,dy)*2,ang=Math.atan2(dy,dx),n=ringNoise(Math.cos(ang)*3+5,Math.sin(ang)*3+5,3);
    const band=Math.exp(-(((d-.8)/.13)**2))*clamp01((n-.3)*2.6)+clamp01(.8-d)*.12*n;return [255,255,255,byte(band*clamp01((1-d)*12))];});
  const scorchNoise=makeNoise(29),scorch=dataTexture(128,(u,v)=>{const dx=u-.5,dy=v-.5,d=Math.hypot(dx,dy)*2,ang=Math.atan2(dy,dx);
    // Irregular char: an uneven blast outline, a few ragged streaks and a dark core.
    const n=scorchNoise(u*7,v*7,4),n2=scorchNoise(u*3+9,v*3+4,3),spokes=scorchNoise(Math.cos(ang)*2.4+3,Math.sin(ang)*2.4+3,3),fine=scorchNoise(Math.cos(ang)*9+20,Math.sin(ang)*9+20,2);
    const reach=.34+.55*Math.pow(spokes,1.7)+.12*fine+(n-.5)*.22,core=clamp01((.42-d)*3);
    const a=clamp01(clamp01((reach-d)*2.6)*(.62+n*.7)+core*.55),lum=.025+n2*.06;return [byte(lum),byte(lum*.93),byte(lum*.86),byte(a)];});
  // Each sprite owns its material (made here, once) and a quarter of an atlas.
  const quarter=(tex,i)=>{const t=tex.clone();t.repeat.set(.5,.5);t.offset.set((i%2)*.5,(i>>1)*.5);t.needsUpdate=true;return t;};
  const fireMaps=[0,1,2,3].map(i=>quarter(fireTex,i)),smokeMaps=[0,1,2,3].map(i=>quarter(smokeTex,i));
  const sprite=(map,blending,order)=>{const m=new T.Sprite(new T.SpriteMaterial({map,transparent:true,depthWrite:false,blending,opacity:0,fog:true}));m.visible=false;m.renderOrder=order;m.raycast=()=>{};m.userData.lightingTransient=true;m.userData.dynamic=true;root.add(m);return m;};
  const flat=(map,blending,order,size)=>{const m=new T.Mesh(new T.PlaneGeometry(size,size),new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,blending,opacity:0,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,fog:true}));m.rotation.x=-Math.PI/2;m.visible=false;m.renderOrder=order;m.raycast=()=>{};m.castShadow=m.receiveShadow=false;m.userData.lightingTransient=true;m.userData.dynamic=true;root.add(m);return m;};
  const points=(count,size,blending,order)=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(count*3),3));g.setAttribute('color',new T.BufferAttribute(new Float32Array(count*3),3));
    const m=new T.Points(g,new T.PointsMaterial({size,map:soft,alphaTest:.05,sizeAttenuation:true,vertexColors:true,transparent:true,depthWrite:false,blending,fog:true}));m.frustumCulled=false;m.visible=false;m.renderOrder=order;m.raycast=()=>{};m.userData.lightingTransient=true;m.userData.dynamic=true;root.add(m);return m;};
  const particle=(mesh)=>({mesh,pos:new T.Vector3(),vel:new T.Vector3(),age:0,life:1,delay:0,size0:1,size1:1,spin:0,map:0});
  const slots=Array.from({length:F.slots},(_,s)=>({
    id:s,active:false,age:0,ground:false,floorY:0,origin:new T.Vector3(),anchor:Object.assign(new T.Object3D(),{name:'Explosion light anchor'}),
    flash:sprite(soft,T.AdditiveBlending,13),
    fire:Array.from({length:F.fire},(_,i)=>particle(sprite(fireMaps[i%4],T.AdditiveBlending,12))),
    soot:Array.from({length:F.soot},(_,i)=>particle(sprite(smokeMaps[(i+1)%4],T.NormalBlending,11))),
    smoke:Array.from({length:F.smoke},(_,i)=>particle(sprite(smokeMaps[i%4],T.NormalBlending,10))),
    dust:Array.from({length:F.dust},(_,i)=>particle(sprite(smokeMaps[(i+2)%4],T.NormalBlending,9))),
    ring:flat(ring,T.NormalBlending,8,1),
    sparks:points(F.sparks,.1,T.AdditiveBlending,14),sparkState:Array.from({length:F.sparks},()=>({pos:new T.Vector3(),vel:new T.Vector3(),life:1,heat:1})),
    debris:points(F.debris,.07,T.NormalBlending,9),debrisState:Array.from({length:F.debris},()=>({pos:new T.Vector3(),vel:new T.Vector3(),life:1,rest:false})),
  }));
  const scorches=Array.from({length:F.scorches},()=>({mesh:flat(scorch,T.NormalBlending,1,1),age:-1}));
  // v191: detonating-round pops: a flash, a small fireball and a wisp of smoke.
  const pops=Array.from({length:F.pops},()=>({active:false,age:0,flash:sprite(soft,T.AdditiveBlending,13),
    fire:Array.from({length:F.popFire},(_,i)=>particle(sprite(fireMaps[i%4],T.AdditiveBlending,12))),
    smoke:Array.from({length:F.popSmoke},(_,i)=>particle(sprite(smokeMaps[(i+1)%4],T.NormalBlending,10)))}));
  let nextPop=0,popCount=0;
  let next=0,nextScorch=0,count=0;
  const random=rng(0xb0071);
  const R=(a,b)=>a+(b-a)*random();

  function burst(pos,{floorY=-Infinity}={}){
    // Reuse the oldest slot when every one is busy.
    let slot=slots.find(s=>!s.active);if(!slot){slot=slots[next];}next=(slots.indexOf(slot)+1)%slots.length;
    slot.active=true;slot.age=0;slot.origin.copy(pos);slot.ground=pos.y-floorY<F.groundReach;slot.floorY=slot.ground?floorY:pos.y-10;slot.anchor.position.set(pos.x,pos.y+.35,pos.z);count++;
    const up=slot.ground?.15:-1;
    for(const p of slot.fire){
      const th=R(0,Math.PI*2),y=R(up,1),h=Math.sqrt(1-y*y);p.vel.set(Math.cos(th)*h,y*.85+.2,Math.sin(th)*h).multiplyScalar(R(3.4,7.8));
      p.pos.copy(pos).addScaledVector(p.vel,.03);p.age=0;p.delay=R(0,.06);p.life=R(...F.fireLife);p.size0=R(.6,1);p.size1=R(2.3,3.8);p.spin=R(-2,2);p.heat=R(.75,1.1);
      p.mesh.material.rotation=R(0,Math.PI*2);p.mesh.visible=false;
    }
    for(const p of slot.soot){
      const th=R(0,Math.PI*2),y=R(up,1),h=Math.sqrt(1-y*y);p.vel.set(Math.cos(th)*h,y*.6+.5,Math.sin(th)*h).multiplyScalar(R(1.6,3.4));
      p.pos.copy(pos).addScaledVector(p.vel,.05);p.age=0;p.delay=R(.04,.14);p.life=R(1,1.7);p.size0=R(.6,.9);p.size1=R(2.2,3.1);p.spin=R(-1,1);
      p.mesh.material.rotation=R(0,Math.PI*2);p.mesh.visible=false;
    }
    for(const p of slot.smoke){
      const th=R(0,Math.PI*2),out=R(.4,1.6);p.vel.set(Math.cos(th)*out,R(1,2.6),Math.sin(th)*out);
      p.pos.set(pos.x+Math.cos(th)*R(0,.6),pos.y+R(.1,.7),pos.z+Math.sin(th)*R(0,.6));p.age=0;p.delay=R(.06,.26);p.life=R(...F.smokeLife);p.size0=R(.9,1.4);p.size1=R(3.3,4.8);p.spin=R(-.35,.35);
      p.mesh.material.rotation=R(0,Math.PI*2);p.mesh.visible=false;
    }
    for(const p of slot.dust){
      const th=random()*Math.PI*2;p.vel.set(Math.cos(th),0,Math.sin(th)).multiplyScalar(R(5,8));p.pos.set(pos.x,slot.floorY+.35,pos.z);
      p.age=0;p.delay=R(.02,.07);p.life=R(1.2,1.8);p.size0=R(.6,.9);p.size1=R(2.4,3.2);p.spin=R(-.5,.5);p.mesh.visible=false;
    }
    for(const s of slot.sparkState){
      const th=R(0,Math.PI*2),y=R(slot.ground?.05:-1,1),h=Math.sqrt(1-y*y);s.vel.set(Math.cos(th)*h,y,Math.sin(th)*h).multiplyScalar(R(6,15));s.vel.y+=2;
      s.pos.copy(pos);s.life=R(.3,.85);s.heat=1;
    }
    for(const s of slot.debrisState){
      const th=R(0,Math.PI*2),y=R(.35,1);const h=Math.sqrt(1-y*y);s.vel.set(Math.cos(th)*h,y,Math.sin(th)*h).multiplyScalar(R(3.5,8.5));
      s.pos.copy(pos);s.life=R(1.2,2);s.rest=false;
    }
    slot.flash.position.copy(pos).y+=.3;slot.flash.visible=true;
    slot.ring.visible=slot.ground;slot.ring.position.set(pos.x,slot.floorY+.03,pos.z);slot.ring.rotation.z=random()*Math.PI*2;
    slot.sparks.visible=slot.debris.visible=true;
    if(slot.ground){
      const sc=scorches[nextScorch++%scorches.length];sc.age=0;sc.mesh.visible=true;sc.mesh.position.set(pos.x,slot.floorY+.012+(nextScorch%5)*.0015,pos.z);
      sc.mesh.rotation.z=random()*Math.PI*2;const size=R(3.2,4);sc.mesh.scale.set(size,size,1);sc.mesh.material.opacity=.85;
    }
    return slot;
  }

  function pop(pos){
    const p=pops.find(o=>!o.active)||pops[nextPop];nextPop=(pops.indexOf(p)+1)%pops.length;p.active=true;p.age=0;popCount++;
    p.flash.position.copy(pos);p.flash.visible=true;
    for(const f of p.fire){const th=R(0,Math.PI*2),y=R(-.3,1),h=Math.sqrt(1-y*y);f.vel.set(Math.cos(th)*h,y*.8+.3,Math.sin(th)*h).multiplyScalar(R(1.6,3.4));f.pos.copy(pos);f.age=0;f.delay=R(0,.03);f.life=R(.22,.36);f.size0=R(.25,.4);f.size1=R(.9,1.4);f.heat=R(.8,1.05);f.mesh.material.rotation=R(0,Math.PI*2);f.mesh.visible=false;}
    for(const m of p.smoke){m.vel.set(R(-.4,.4),R(.8,1.4),R(-.4,.4));m.pos.copy(pos);m.age=0;m.delay=R(.05,.12);m.life=R(.8,1.2);m.size0=R(.35,.5);m.size1=R(1.2,1.7);m.mesh.material.rotation=R(0,Math.PI*2);m.mesh.visible=false;}
    return p;
  }
  const fireColor=new T.Color(),smokeColor=new T.Color();
  const FIRE=[[0,2.6,2.2,1.5],[.1,2.3,1.2,.32],[.3,1.5,.48,.09],[.6,.7,.15,.035],[1,.1,.02,.01]];
  function ramp(table,k,out){for(let i=1;i<table.length;i++)if(k<=table[i][0]){const a=table[i-1],b=table[i],f=(k-a[0])/(b[0]-a[0]);return out.setRGB(a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f,a[3]+(b[3]-a[3])*f);}const l=table.at(-1);return out.setRGB(l[1],l[2],l[3]);}
  function step(p,dt,drag,lift){p.vel.multiplyScalar(Math.exp(-dt*drag));p.vel.y+=lift*dt;p.pos.addScaledVector(p.vel,dt);}

  function update(dt){
    if(!(dt>0))return;
    for(const slot of slots){
      if(!slot.active)continue;slot.age+=dt;const t=slot.age;let alive=false;
      // Flash: a white-hot blink, larger than the fireball, gone in an eighth of a second.
      {const k=t/F.flash;slot.flash.visible=k<1;if(k<1){alive=true;const s=.6+Math.sqrt(k)*4.2;slot.flash.scale.set(s,s,1);slot.flash.material.opacity=Math.pow(1-k,1.6);slot.flash.material.color.setRGB(3,2.7,2.1);}}
      for(const p of slot.fire){
        p.age+=dt;const a=p.age-p.delay;if(a<0||a>p.life){p.mesh.visible=false;if(a<0)alive=true;continue;}alive=true;
        const k=a/p.life;step(p,dt,5.5,a>.12?2.4:0);if(p.pos.y<slot.floorY+.2){p.pos.y=slot.floorY+.2;p.vel.y=Math.abs(p.vel.y)*.2;}
        p.mesh.visible=true;p.mesh.position.copy(p.pos);const s=p.size0+(p.size1-p.size0)*(1-Math.pow(1-k,2.4));p.mesh.scale.set(s,s,1);
        p.mesh.material.rotation+=p.spin*dt;ramp(FIRE,Math.min(1,k/p.heat),p.mesh.material.color);p.mesh.material.opacity=Math.min(1,a*30)*Math.pow(1-k,.8)*.85;
      }
      // Soot: black smoke boiling up through the fireball.
      for(const p of slot.soot){
        p.age+=dt;const a=p.age-p.delay;if(a<0||a>p.life){p.mesh.visible=false;if(a<0)alive=true;continue;}alive=true;
        const k=a/p.life;step(p,dt,3,1.6);p.mesh.visible=true;p.mesh.position.copy(p.pos);const s=p.size0+(p.size1-p.size0)*(1-Math.pow(1-k,2));p.mesh.scale.set(s,s,1);
        p.mesh.material.rotation+=p.spin*dt;const ember=Math.max(0,1-a/.35);p.mesh.material.color.setRGB(.018+.3*ember,.016+.08*ember,.014);
        p.mesh.material.opacity=Math.min(1,a/.1)*Math.pow(1-k,1.2)*.9;
      }
      for(const p of slot.smoke){
        p.age+=dt;const a=p.age-p.delay;if(a<0||a>p.life){p.mesh.visible=false;if(a<0)alive=true;continue;}alive=true;
        const k=a/p.life;step(p,dt,1.4,.55);p.mesh.visible=true;p.mesh.position.copy(p.pos);
        const s=p.size0+(p.size1-p.size0)*(1-Math.pow(1-k,2));p.mesh.scale.set(s,s,1);p.mesh.material.rotation+=p.spin*dt;
        // Lit orange from beneath while the fireball burns, then sooty grey.
        const warm=Math.max(0,1-a/.55);smokeColor.setRGB(.085+.45*warm,.08+.16*warm,.075+.03*warm);p.mesh.material.color.copy(smokeColor);
        p.mesh.material.opacity=Math.min(1,a/.3)*Math.pow(1-k,1.3)*.86;
      }
      for(const p of slot.dust){
        p.age+=dt;const a=p.age-p.delay;if(!slot.ground||a<0||a>p.life){p.mesh.visible=false;if(slot.ground&&a<0)alive=true;continue;}alive=true;
        const k=a/p.life;step(p,dt,3.2,.3);p.mesh.visible=true;p.mesh.position.copy(p.pos);const s=p.size0+(p.size1-p.size0)*(1-Math.pow(1-k,2));p.mesh.scale.set(s,s*.62,1);
        p.mesh.material.rotation+=p.spin*dt;p.mesh.material.color.setRGB(.36,.32,.26);p.mesh.material.opacity=Math.min(1,a/.08)*Math.pow(1-k,1.6)*.65;
      }
      if(slot.ring.visible){const k=t/F.ring;if(k>=1)slot.ring.visible=false;else{alive=true;const s=.6+(1-Math.pow(1-k,3))*7.5;slot.ring.scale.set(s,s,1);slot.ring.material.color.setRGB(.3,.27,.22);slot.ring.material.opacity=.7*Math.pow(1-k,1.3);}}
      {
        const pos=slot.sparks.geometry.attributes.position,col=slot.sparks.geometry.attributes.color;let any=false;
        slot.sparkState.forEach((s,i)=>{s.life-=dt;if(s.life<=0){col.setXYZ(i,0,0,0);return;}any=true;s.vel.multiplyScalar(Math.exp(-dt*1.6));s.vel.y-=9.8*dt;s.pos.addScaledVector(s.vel,dt);
          if(s.pos.y<slot.floorY+.02){s.pos.y=slot.floorY+.02;s.vel.y=Math.abs(s.vel.y)*.35;s.vel.x*=.6;s.vel.z*=.6;}
          const h=Math.min(1,s.life*2.2);pos.setXYZ(i,s.pos.x,s.pos.y,s.pos.z);col.setXYZ(i,2.4*h,1.25*h*h,.35*h*h*h);});
        pos.needsUpdate=col.needsUpdate=true;slot.sparks.visible=any;alive||=any;
      }
      {
        const pos=slot.debris.geometry.attributes.position,col=slot.debris.geometry.attributes.color;let any=false;
        slot.debrisState.forEach((s,i)=>{s.life-=dt;if(s.life<=0){pos.setXYZ(i,0,-1e4,0);return;}any=true;
          if(!s.rest){s.vel.y-=9.8*dt;s.pos.addScaledVector(s.vel,dt);if(s.pos.y<slot.floorY+.02){s.pos.y=slot.floorY+.02;if(Math.abs(s.vel.y)<1.6)s.rest=true;s.vel.y=Math.abs(s.vel.y)*.25;s.vel.x*=.4;s.vel.z*=.4;}}
          pos.setXYZ(i,s.pos.x,s.pos.y,s.pos.z);const shade=.07+.05*((i*37)%7)/7;col.setXYZ(i,shade*1.15,shade,shade*.8);});
        slot.debris.material.opacity=1;pos.needsUpdate=col.needsUpdate=true;slot.debris.visible=any;alive||=any;
      }
      if(!alive){slot.active=false;slot.flash.visible=slot.ring.visible=slot.sparks.visible=slot.debris.visible=false;for(const p of [...slot.fire,...slot.soot,...slot.smoke,...slot.dust])p.mesh.visible=false;}
    }
    for(const p of pops){
      if(!p.active)continue;p.age+=dt;let alive=false;
      {const k=p.age/.08;p.flash.visible=k<1;if(k<1){alive=true;const sz=.3+Math.sqrt(k)*1.6;p.flash.scale.set(sz,sz,1);p.flash.material.opacity=Math.pow(1-k,1.6);p.flash.material.color.setRGB(3,2.5,1.8);}}
      for(const f of p.fire){f.age+=dt;const a=f.age-f.delay;if(a<0||a>f.life){f.mesh.visible=false;if(a<0)alive=true;continue;}alive=true;
        const k=a/f.life;step(f,dt,6,1.5);f.mesh.visible=true;f.mesh.position.copy(f.pos);const sz=f.size0+(f.size1-f.size0)*(1-Math.pow(1-k,2.4));f.mesh.scale.set(sz,sz,1);
        ramp(FIRE,Math.min(1,k/f.heat),f.mesh.material.color);f.mesh.material.opacity=Math.min(1,a*40)*Math.pow(1-k,.8)*.85;}
      for(const m of p.smoke){m.age+=dt;const a=m.age-m.delay;if(a<0||a>m.life){m.mesh.visible=false;if(a<0)alive=true;continue;}alive=true;
        const k=a/m.life;step(m,dt,1.6,.4);m.mesh.visible=true;m.mesh.position.copy(m.pos);const sz=m.size0+(m.size1-m.size0)*(1-Math.pow(1-k,2));m.mesh.scale.set(sz,sz,1);
        m.mesh.material.color.setRGB(.2,.19,.18);m.mesh.material.opacity=Math.min(1,a/.08)*Math.pow(1-k,1.3)*.55;}
      if(!alive){p.active=false;p.flash.visible=false;for(const o of [...p.fire,...p.smoke])o.mesh.visible=false;}
    }
    for(const sc of scorches){if(sc.age<0)continue;sc.age+=dt;const fade=sc.age-F.scorchHold;if(fade>F.scorchFade){sc.age=-1;sc.mesh.visible=false;continue;}sc.mesh.material.opacity=.85*(fade>0?1-fade/F.scorchFade:1);}
  }
  function clear(){for(const p of pops){p.active=false;p.flash.visible=false;for(const o of [...p.fire,...p.smoke])o.mesh.visible=false;}for(const slot of slots){slot.active=false;slot.age=0;slot.flash.visible=slot.ring.visible=slot.sparks.visible=slot.debris.visible=false;for(const p of [...slot.fire,...slot.soot,...slot.smoke,...slot.dust])p.mesh.visible=false;}for(const sc of scorches){sc.age=-1;sc.mesh.visible=false;}}
  // Show one of everything, for shader warm-up at load.
  function warmGroup(){const g=new T.Group();const s=slots[0];for(const o of [s.flash,s.fire[0].mesh,s.soot[0].mesh,s.smoke[0].mesh,s.ring,s.sparks,s.debris,scorches[0].mesh]){const c=o.clone();c.visible=true;if(c.material)c.material=o.material;g.add(c);}return g;}
  return {root,burst,pop,update,clear,warmGroup,slots,scorches,pops,get active(){return slots.filter(s=>s.active).length;},get bursts(){return count;},get popping(){return pops.filter(p=>p.active).length;},get popped(){return popCount;}};
}
