import * as T from './three.module.js';
import {weaponSurfaces} from './weapon-surfaces.mjs?v=153';

// The katana (v205), a melee weapon for every mode. Modelled on the reference sword:
// a curved Damascus blade with a groove (bohi) and a wavy temper line, a brass collar
// (habaki), a round black guard (tsuba), a grip bound in black cord over white ray-skin
// diamonds, and a matte black scabbard (saya) painted with cranes and pine, bound with
// a black-and-white cord and resting on a red rosewood stand. Every finish is painted
// once from pixel formulas, the way weapon-surfaces.mjs paints the guns: no image
// fetches, no per-frame texture work.
//
// It slashes everything in a frontal arc in front of you. The arc is deliberately
// narrower than a half circle so later upgrades have room to widen it. Three slashes
// play in turn: a diagonal cut down from the right, a rising cut from the left and an
// overhead cut.
export const KATANA=Object.freeze({
  price:2500,
  damage:150,      // each slash, to every enemy it reaches
  swing:.48,       // seconds between slashes (hold to keep slashing)
  reach:3.66,      // 4 yards, from you to the nearest part of what it cuts
  arc:100,         // degrees, centred on where you look
  floor:1.5,       // enemies further above or below your feet than this are out of reach
  combo:1.2,       // seconds without a slash before the set starts again
  force:1.3,       // how hard a slash throws a body
  stagger:42
});
// The three slashes. Times are seconds into the slash: the wind-up, the cut itself
// (damage lands as the blade crosses the middle of the view), a brief follow-through,
// then the blade returns to rest. Each cut is a few keys: where the hand is in the view
// (x right, y up, -z ahead, metres from the eye) and which way the blade points; the
// edge always leads the way the blade is moving. `direction` is the way a cut throws a
// body, in the same frame.
export const SLASHES=Object.freeze([
  Object.freeze({name:'diagonal cut',windup:.09,cut:.13,hold:.05,length:.5,direction:[-.75,-.35,-.55],keys:[
    [[.3,.06,-.36],[.3,.85,.42]],[[.18,-.06,-.44],[-.45,.62,-.64]],[[.04,-.16,-.47],[-.84,.12,-.53]],[[-.14,-.24,-.44],[-.62,-.5,-.6]]]}),
  Object.freeze({name:'rising cut',windup:.09,cut:.13,hold:.05,length:.5,direction:[.8,.25,-.55],keys:[
    [[-.26,-.22,-.40],[-.82,-.15,.55]],[[-.15,-.2,-.46],[-.86,.05,-.5]],[[.02,-.18,-.48],[-.05,.32,-.95]],[[.17,-.13,-.45],[.82,.34,-.46]],[[.26,-.08,-.38],[.7,.48,.53]]]}),
  Object.freeze({name:'overhead cut',windup:.1,cut:.13,hold:.05,length:.5,direction:[0,-.6,-.8],keys:[
    [[.07,.08,-.34],[-.06,.95,.3]],[[.06,-.05,-.45],[-.08,.8,-.6]],[[.05,-.15,-.5],[-.12,.36,-.92]],[[.02,-.27,-.5],[-.3,-.1,-.95]]]})
].map(s=>Object.freeze({...s,hitAt:s.windup+s.cut*.5})));
export const KATANA_STATION=Object.freeze({name:'TSURU KATANA',type:'katana',price:KATANA.price,hex:'#cfe4df',
  modelCaption:'MELEE · THREE-CUT SLASH · SOUL FORGE READY'});

// ---- Who a slash reaches ---------------------------------------------------------------------
// Everything alive within reach, inside the arc and on your floor, with no wall between.
// `blocked(x,z,y,height)` is the mode's collision test; a sample every 25cm at chest
// height keeps a slash from passing through walls and doors, but not over tables.
export function slashTargets({player,yaw,zombies,blocked}){
  const fx=-Math.sin(yaw),fz=-Math.cos(yaw),half=KATANA.arc*Math.PI/360,hits=[];
  for(const e of zombies){
    if(e.dead||e.waking)continue;
    const p=e.walkPos;if(Math.abs(p.y-player.y)>KATANA.floor)continue;
    const dx=p.x-player.x,dz=p.z-player.z,d=Math.hypot(dx,dz),r=e.radius??.35;
    if(d-r>KATANA.reach)continue;
    // The body's edge counts: something half inside the arc is cut.
    const angle=d>1e-6?Math.acos(Math.max(-1,Math.min(1,(dx*fx+dz*fz)/d))):0,slack=d>r?Math.asin(r/d):Math.PI;
    if(angle-slack>half)continue;
    let clear=true;const span=Math.max(0,d-r),steps=Math.floor(span/.25);
    for(let i=1;i<=steps&&clear;i++){const t=i*.25/d;if(blocked(player.x+dx*t,player.z+dz*t,player.y+.85,.35))clear=false;}
    if(clear)hits.push({enemy:e,distance:d,angle});
  }
  return hits.sort((a,b)=>a.distance-b.distance);
}
// Where a slash meets a body, and which way it throws it. A Gravewarden facing you
// takes the cut on its shield.
export function slashImpact(kind,{player,yaw,enemy}){
  const s=SLASHES[kind],c=Math.cos(yaw),n=Math.sin(yaw),[x,y,z]=s.direction;
  const direction=new T.Vector3(x*c+z*n,y,-x*n+z*c).normalize();
  const point=enemy.group.position.clone().add(new T.Vector3(0,enemy.dog?.45:1.15,0));
  let part='torso';
  if(enemy.shield){const f=enemy.group.rotation.y,tx=player.x-enemy.walkPos.x,tz=player.z-enemy.walkPos.z,l=Math.hypot(tx,tz)||1;if((Math.sin(f)*tx+Math.cos(f)*tz)/l>.5)part='shield';}
  return {direction,point,part,side:kind===1?1:-1,force:KATANA.force,stagger:KATANA.stagger,source:'katana'};
}

// ---- Finishes --------------------------------------------------------------------------------
const clampByte=v=>Math.max(0,Math.min(255,Math.round(v)));
function noise(x,y){let n=Math.imul(x,374761393)+Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
function pixels(width,height,paint){
  const data=new Float32Array(width*height*3);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){const c=paint(x,y,noise(x,y)-.5),at=(y*width+x)*3;data[at]=c[0];data[at+1]=c[1];data[at+2]=c[2];}
  return {width,height,data};
}
function finish(name,{width,height,data},{repeat=[1,1]}={}){
  const bytes=new Uint8Array(width*height*4);
  for(let i=0;i<width*height;i++){bytes[i*4]=clampByte(data[i*3]);bytes[i*4+1]=clampByte(data[i*3+1]);bytes[i*4+2]=clampByte(data[i*3+2]);bytes[i*4+3]=255;}
  const map=new T.DataTexture(bytes,width,height,T.RGBAFormat,T.UnsignedByteType);
  map.name=name;map.colorSpace=T.SRGBColorSpace;// Every map repeats, as every other texture in the game does: one sampler state, so
  // software renderers reuse their existing pixel routines.
  map.wrapS=map.wrapT=T.RepeatWrapping;
  map.repeat.set(...repeat);map.minFilter=T.LinearMipmapLinearFilter;map.magFilter=T.LinearFilter;map.generateMipmaps=true;map.anisotropy=4;map.needsUpdate=true;
  return map;
}
// Antialiased shapes painted onto a pixel sheet (signed distances, half-pixel edge).
function painter(sheet){
  const {width,height,data}=sheet;
  function fill(x0,y0,x1,y1,color,distance){
    for(let y=Math.max(0,Math.floor(y0)),ye=Math.min(height-1,Math.ceil(y1));y<=ye;y++)for(let x=Math.max(0,Math.floor(x0)),xe=Math.min(width-1,Math.ceil(x1));x<=xe;x++){
      const a=Math.max(0,Math.min(1,.5-distance(x+.5,y+.5)));if(!a)continue;const at=(y*width+x)*3;
      for(let k=0;k<3;k++)data[at+k]=data[at+k]*(1-a)+color[k]*a;
    }
  }
  return {
    capsule(ax,ay,bx,by,r,color){const dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy||1;
      fill(Math.min(ax,bx)-r-1,Math.min(ay,by)-r-1,Math.max(ax,bx)+r+1,Math.max(ay,by)+r+1,color,(px,py)=>{const t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l2));return Math.hypot(px-ax-dx*t,py-ay-dy*t)-r;});},
    ellipse(cx,cy,rx,ry,turn,color){const c=Math.cos(turn),s=Math.sin(turn),m=Math.max(rx,ry);
      fill(cx-m-1,cy-m-1,cx+m+1,cy+m+1,color,(px,py)=>{const u=(px-cx)*c+(py-cy)*s,v=-(px-cx)*s+(py-cy)*c;return (Math.hypot(u/rx,v/ry)-1)*Math.min(rx,ry);});},
    circle(cx,cy,r,color){this.ellipse(cx,cy,r,r,0,color);}
  };
}
const WHITE=[236,234,226],INK=[24,24,26],CROWN=[196,34,40],PINE=[78,168,156],BARK=[92,62,40];
// A crane: body, neck, head with its red crown, tail and trailing legs, and two wings of
// white feathers with black tips. `wings` are [root angle, spread] pairs in radians.
function crane(p,x,y,{size=1,heading=-.25,wings=[[-2.2,.9],[-1.4,.9]]}={}){
  const k=size,c=Math.cos(heading),s=Math.sin(heading),at=(u,v)=>[x+(u*c-v*s)*k,y+(u*s+v*c)*k];
  for(const [root,spread] of wings){const [wx,wy]=at(-2,-1.5);
    for(let i=0;i<10;i++){const a=root+heading+(i/9-.5)*spread,l=(15+5*Math.sin(i/9*Math.PI))*k,ex=wx+Math.cos(a)*l,ey=wy+Math.sin(a)*l;
      p.capsule(wx,wy,ex,ey,2.5*k,WHITE);p.capsule(wx+Math.cos(a)*l*.7,wy+Math.sin(a)*l*.7,ex,ey,1.9*k,INK);}}
  const [tx,ty]=at(-12,1),[t2x,t2y]=at(-17,3);p.capsule(tx,ty,t2x,t2y,2.4*k,INK);
  for(const dy of [0,1.6]){const [lx,ly]=at(-9,2+dy),[l2x,l2y]=at(-25,5+dy);p.capsule(lx,ly,l2x,l2y,.6*k,[150,148,140]);}
  const [bx,by]=at(0,0);p.ellipse(bx,by,11*k,5*k,heading,WHITE);
  const [nx,ny]=at(9,-1),[hx,hy]=at(22,-6);p.capsule(nx,ny,hx,hy,1.6*k,WHITE);p.capsule(...at(16,-4),hx,hy,1.4*k,INK);
  p.ellipse(hx,hy,2.6*k,2.1*k,heading,WHITE);p.circle(...at(22.3,-7.4),1.2*k,CROWN);p.capsule(...at(24,-6),...at(29,-5),.75*k,[170,160,128]);
}
// A tuft of pine needles fanned from one point.
function pine(p,x,y,{from=-2.6,to=-.5,length=8,count=9}={}){
  for(let i=0;i<count;i++){const a=from+(to-from)*i/(count-1),l=length*(.8+.25*Math.sin(i*1.7));
    p.capsule(x,y,x+Math.cos(a)*l,y+Math.sin(a)*l,.55,i%3?PINE:[96,190,176]);}
  p.circle(x,y,1,BARK);
}
let surfaces=null;
export function katanaSurfaces(){
  if(surfaces)return surfaces;
  // The blade: along its length (u) and from the back (v=0) to the edge (v=1). A dark
  // back, the groove with bright rims, folded-steel waves over the flat, a frosted
  // wavy temper line and a bright edge, and the line where the point begins.
  const blade=finish('katana-blade',pixels(512,64,(x,y,n)=>{
    const s=x/511,v=y/63;let value;
    if(v<.06)value=158+n*8;
    else if(v<.28){
      const groove=s>.06&&s<.86&&v>.095&&v<.245,end=s>=.86&&Math.hypot((s-.86)*7,(v-.17)/.075*.07)<.07&&v>.095&&v<.245;
      if(groove||end){const rim=Math.min(v-.095,.245-v);value=rim<.012?232:126+n*10;}else value=200+n*8;
    }else{
      // Folded steel: fine flowing contours, warped twice so they swirl like the reference.
      const warp=.55*Math.sin(Math.PI*2*(v*3.1+s*2.3))+.3*Math.sin(Math.PI*2*(s*7.7-v*5.3)),wave=Math.sin(Math.PI*2*(s*44+warp*2.2+v*1.5));
      const temper=.74+.045*Math.sin(Math.PI*2*s*9)+.02*Math.sin(Math.PI*2*s*23+1.3);
      const frost=Math.max(0,Math.min(1,(v-temper)/.035+.5));
      value=(184+wave*30)*(1-frost)+(232+wave*8)*frost+n*9;
      if(v>.965)value=246;
    }
    if(Math.abs(s-.935)<.0025&&v>.05)value=238;
    if(s>.935&&v>.28)value=Math.max(value,224+n*8);
    return [value*.97,value,value*1.035];
  }));
  // The grip: one diamond of white ray skin between crossing black cord, repeated
  // twelve times along it and once on each face.
  const grip=finish('katana-grip',pixels(64,64,(x,y,n)=>{
    const dx=Math.abs(x+.5-32)/21,dy=Math.abs(y+.5-32)/27,inside=dx+dy;
    if(inside<.92){const bump=noise(x>>1,y>>1)>.62?-26:0;const v=226+bump+n*10;return [v,v*.985,v*.94];}
    if(inside<1.02)return [40,40,42];
    const weave=10*Math.sin((x+y)*1.1)*(x+y&8?1:-1)+n*10,ridge=Math.abs(x+.5-32)<3&&(y<5||y>58)?22:0;
    return [22+weave+ridge,22+weave+ridge,25+weave+ridge];
  }),{repeat:[2,12]});
  // The scabbard: matte black lacquer with cranes and pine painted on both faces.
  const sheet=pixels(1024,128,(x,y,n)=>[17+n*4,17+n*4,19+n*4]);
  const face=painter(sheet);
  const both=(fn)=>{fn(face,0);fn({capsule:(ax,ay,bx,by,r,c)=>face.capsule(ax,128-ay,bx,128-by,r,c),ellipse:(cx,cy,rx,ry,t,c)=>face.ellipse(cx,128-cy,rx,ry,-t,c),circle(cx,cy,r,c){face.ellipse(cx,128-cy,r,r,0,c);}},1);};
  both(p=>{
    p.capsule(262,44,300,40,1.1,BARK);p.capsule(300,40,336,34,.9,BARK);
    pine(p,276,43);pine(p,300,40,{from:-2.9,to:-1});pine(p,318,37,{from:-2.2,to:-.2});pine(p,336,34,{from:-1.8,to:.2,length:7});
    crane(p,396,34,{size:1.2,heading:-.35,wings:[[-2.35,1],[-1.55,1.1]]});
    pine(p,560,44,{from:-2.4,to:-.6});pine(p,584,36,{from:-2.8,to:-1.2,length:7});
    crane(p,716,29,{size:1.12,heading:-.12,wings:[[-2.7,.8],[-.55,.7]]});
    p.capsule(828,46,906,36,.9,BARK);pine(p,846,42);pine(p,872,32,{from:-2,to:0});pine(p,898,40,{from:-2.8,to:-.8});pine(p,930,34,{from:-1.6,to:.4,length:7});
  });
  const saya=finish('katana-saya',sheet);
  // The cord: black with white flecks.
  const cord=finish('katana-cord',pixels(64,16,(x,y,n)=>{const fleck=((x>>2)+(y>>2))%2===0&&noise(x>>2,y>>2)>.62;const v=fleck?214:22+n*10;return [v,v,v];}),{repeat:[10,1]});
  // The stand: red rosewood with dark streaked grain.
  const wood=finish('katana-rosewood',pixels(128,128,(x,y,n)=>{
    const grain=Math.sin(y*.42+2.6*Math.sin(x*.045+y*.02)+n*.8),band=.5+.5*Math.sin(y*.09+Math.sin(x*.02)*1.4);
    const v=.78+.14*grain-.18*Math.max(0,grain)**6+.08*band;return [128*v,44*v,30*v];
  }),{repeat:[1,1]});
  const textures=Object.freeze([blade,grip,saya,cord,wood]);
  surfaces=Object.freeze({blade,grip,saya,cord,wood,textures,bytes:Math.ceil(textures.reduce((sum,t)=>sum+t.image.width*t.image.height*4*4/3,0))});
  return surfaces;
}

// ---- The sword -------------------------------------------------------------------------------
// Proportions (m): blade 0.71 with 6.5cm of curve, grip 0.27, guard 7.8cm across,
// scabbard 0.75. Built with the guard at y=0 and the blade along +y, its edge toward -z;
// the model's origin is where the hand holds it, 7cm below the guard.
const BLADE=Object.freeze({length:.71,base:.031,tip:.0215,thick:.0072,thin:.005,bend:.065,point:.05,start:.0055});
const SAYA=Object.freeze({length:.75,rz:[.0205,.0168],rx:[.0136,.0112]});
const GRIP_AT=.07;
// The blade's back (spine) line and edge line at fraction s along it, in z.
function bladeLines(s){
  const {length,base,tip,bend,point}=BLADE,k=Math.max(0,(s-(1-point/length))/(point/length)),w0=base+(tip-base)*s;
  const back=base/2+bend*s*s-w0*.25*k*k,edge=base/2+bend*s*s-w0*(1-.75*(1-Math.sqrt(Math.max(0,1-k*k))));
  return {back,edge,k};
}
function bladeGeometry(){
  const {length,thick,thin,start}=BLADE,N=48,P=[[0,0],[.35,.06],[.5,.28],[0,1],[-.5,.28],[-.35,.06]],faces=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0]];
  const pos=[],uv=[],idx=[];
  const rings=[];for(let i=0;i<=N;i++){const a=i/N,s=1-(1-a)**1.25,{back,edge,k}=bladeLines(s),w=back-edge,t=(thick+(thin-thick)*s)*Math.max(.04,1-k**1.6);
    rings.push({s,y:start+s*length,pts:P.map(([x,f])=>[x*t,back-f*w])});}
  for(const [a,b] of faces){const base=pos.length/3;
    for(const r of rings)for(const j of [a,b]){pos.push(r.pts[j][0],r.y,r.pts[j][1]);uv.push(r.s,P[j][1]);}
    for(let i=0;i<N;i++){const o=base+i*2;idx.push(o,o+1,o+2,o+1,o+3,o+2);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  return g;
}
// The scabbard: an oval tube along the blade's curve, closed at the end.
function sayaGeometry(){
  const N=40,M=20,{length,rz,rx}=SAYA,pos=[],uv=[],idx=[];
  for(let i=0;i<=N;i++){const s=i/N,cap=Math.max(0,(s-.975)/.025),shrink=Math.sqrt(Math.max(0,1-cap*cap)),c=BLADE.bend*(s*length/BLADE.length)**2,z0=c;
    const r1=(rz[0]+(rz[1]-rz[0])*s)*Math.max(.05,shrink),r2=(rx[0]+(rx[1]-rx[0])*s)*Math.max(.05,shrink);
    for(let j=0;j<=M;j++){const a=j/M*Math.PI*2;pos.push(Math.sin(a)*r2,BLADE.start+s*length,z0+Math.cos(a)*r1);uv.push(s,j/M);}}
  for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*(M+1)+j,b=a+M+1;idx.push(a,a+1,b,a+1,b+1,b);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
function sayaCentre(y){const s=(y-BLADE.start)/SAYA.length;return BLADE.bend*(s*SAYA.length/BLADE.length)**2;}
let kit=null;
function katanaKit(){
  if(kit)return kit;
  // Every painted finish pairs its colour map with the guns' metal finish as roughness,
  // exactly as the guns do (in hand and on their racks): the sword compiles to the guns'
  // shader programs, and software renderers reuse the guns' texture routines, so nothing
  // new is compiled while the first frame draws. The finish barely changes roughness.
  const S=katanaSurfaces(),std=(o)=>new T.MeshStandardMaterial(o),finish=weaponSurfaces().metalFinish;
  const m={blade:std({map:S.blade,roughnessMap:finish,metalness:.6,roughness:.3}),brass:std({color:0xc9a049,metalness:.88,roughness:.3}),iron:std({color:0x1c1d1f,metalness:.62,roughness:.42}),
    grip:std({map:S.grip,roughnessMap:finish,metalness:.05,roughness:.78}),saya:std({map:S.saya,roughnessMap:finish,metalness:.08,roughness:.52}),
    cord:std({map:S.cord,roughnessMap:finish,metalness:0,roughness:.93}),wood:std({map:S.wood,roughnessMap:finish,metalness:0,roughness:.5})};
  for(const [k,v] of Object.entries(m))v.name='Katana '+k;
  const lathe=(pts,segments=20)=>new T.LatheGeometry(pts.map(([r,y])=>new T.Vector2(r,y)),segments);
  const geo={blade:bladeGeometry(),saya:sayaGeometry(),
    grip:lathe([[1,-.255],[.985,-.2],[.955,-.136],[.97,-.07],[1,-.0175]]),
    cap:lathe([[0,-.2835],[.55,-.2825],[.86,-.279],[1,-.27],[1,-.255]],16),
    collar:new T.CylinderGeometry(1,1,1,20),disc:new T.CylinderGeometry(1,1,1,36),box:new T.BoxGeometry(1,1,1),
    ring:new T.TorusGeometry(1,.16,6,28),knob:new T.SphereGeometry(1,10,8),cone:new T.ConeGeometry(1,1,10)};
  kit={m,geo};return kit;
}
function part(parent,geometry,material,name,{p=[0,0,0],s=[1,1,1],r=[0,0,0]}={}){
  const o=new T.Mesh(geometry,material);o.name=name;o.position.set(...p);o.scale.set(...s);o.rotation.set(...r);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
}
// The sword itself. `sheathed` puts it in its scabbard with the cord tied round it.
export function createKatanaModel({sheathed=false,brass=null}={}){
  const {m:kitMaterials,geo}=katanaKit(),m={...kitMaterials,...(brass?{brass}:{})},root=new T.Group(),body=new T.Group();root.name=sheathed?'Sheathed katana':'Katana';body.name='Katana body';body.position.y=GRIP_AT;root.add(body);
  const wz=BLADE.base/2;
  // The grip is oval: 2.5cm through, 3.3cm from edge to back, held around the blade's middle.
  part(body,geo.grip,m.grip,'Cord-bound grip',{s:[.0125,1,.0165]});
  part(body,geo.cap,m.iron,'Pommel cap',{s:[.0128,1,.0168]});
  part(body,geo.collar,m.iron,'Grip collar',{p:[0,-.0115,0],s:[.0132,.012,.0172]});
  for(const side of [-1,1])part(body,geo.knob,m.brass,'Grip ornament',{p:[side*.0128,-.118,.001],s:[.0028,.0115,.005]});
  part(body,geo.disc,m.iron,'Round guard',{s:[.039,.0068,.039]});
  for(const y of [-.0042,.0042])part(body,geo.disc,m.brass,'Guard washer',{p:[0,y,0],s:[.0145,.0025,.0205]});
  if(!sheathed){
    part(body,geo.box,m.brass,'Blade collar',{p:[0,.0215,0],s:[.0108,.032,.0345]});
    part(body,geo.blade,m.blade,'Damascus blade',{p:[0,0,0]});
    const tip=new T.Vector3(0,GRIP_AT+BLADE.start+BLADE.length,BLADE.base/2+BLADE.bend-.004);
    root.userData.muzzle=tip;root.userData.tip=tip;
  }else{
    part(body,geo.saya,m.saya,'Lacquered scabbard');
    // The mouth, the knob the cord threads through (black horn, drawn with the iron), and
    // the end cap. The blade's collar sits hidden inside the mouth.
    part(body,geo.collar,m.iron,'Scabbard mouth',{p:[0,BLADE.start+.006,sayaCentre(.012)],s:[SAYA.rx[0]+.0008,.012,SAYA.rz[0]+.0008]});
    part(body,geo.knob,m.iron,'Cord knob',{p:[0,.13,sayaCentre(.13)+SAYA.rz[0]-.001],s:[.006,.012,.006]});
    // The black-and-white cord, wound round the scabbard and hanging in two tassels.
    for(let i=0;i<6;i++){const y=.066+i*.0125,c=sayaCentre(y),f=(y-BLADE.start)/SAYA.length,r1=SAYA.rz[0]+(SAYA.rz[1]-SAYA.rz[0])*f+.0022,r2=SAYA.rx[0]+(SAYA.rx[1]-SAYA.rx[0])*f+.0022;
      part(body,geo.ring,m.cord,'Wound cord',{p:[0,y,c],s:[r2,r1,.022],r:[Math.PI/2+(i%2?.22:-.22),0,0]});}
    for(const [y,l] of [[.08,.075],[.122,.062]]){const c=sayaCentre(y)-SAYA.rz[0];
      part(body,geo.collar,m.cord,'Hanging cord',{p:[.004,y,c-l/2],s:[.0028,l,.0028],r:[Math.PI/2,0,0]});
      part(body,geo.cone,m.cord,'Tassel',{p:[.004,y,c-l-.012],s:[.0075,.026,.0075],r:[Math.PI/2,0,0]});}
  }
  root.userData.body=body;root.userData.weaponType='katana';
  return root;
}
// The stand: a rosewood base with two notched uprights holding the sheathed sword
// level, handle to the left and the cranes facing out. Its origin is the base's
// underside; `length` is how far it spans.
export function createKatanaStand({brass=null}={}){
  const {m,geo}=katanaKit(),g=new T.Group();g.name='Rosewood katana stand';
  const woodUV=geometry=>{const p=geometry.attributes.position,uv=geometry.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)*7+p.getZ(i)*3,p.getY(i)*7+p.getZ(i)*2);uv.needsUpdate=true;return geometry;};
  const plank=woodUV(new T.BoxGeometry(.84,.034,.17).translate(0,.017,0));part(g,plank,m.wood,'Stand base');
  const sword=createKatanaModel({sheathed:true,brass});
  // The sword along the stand (tip to the right, edge down, painted face out).
  sword.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(new T.Vector3(0,0,1),new T.Vector3(1,0,0),new T.Vector3(0,1,0)));
  const middle=(GRIP_AT-.2835+GRIP_AT+BLADE.start+SAYA.length)/2,rest=.215;
  sword.position.set(-middle,rest,0);g.add(sword);
  for(const x of [-.08,.37]){
    // Where the scabbard's underside sits over this upright.
    const y=x+middle-GRIP_AT,under=rest+sayaCentre(y)-(SAYA.rz[0]+(SAYA.rz[1]-SAYA.rz[0])*((y-BLADE.start)/SAYA.length));
    const shape=new T.Shape(),h=under-.034,r=.019;
    shape.moveTo(-.05,0);shape.lineTo(.05,0);shape.lineTo(.05,h+.012);shape.quadraticCurveTo(.046,h+.04,.034,h+.042);shape.lineTo(r,h+r*.9);
    shape.absarc(0,h+r,r,0,-Math.PI,true);shape.lineTo(-.034,h+.042);shape.quadraticCurveTo(-.046,h+.04,-.05,h+.012);shape.closePath();
    const upright=woodUV(new T.ExtrudeGeometry(shape,{depth:.036,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:1,curveSegments:10}).translate(0,0,-.018));
    part(g,upright,m.wood,'Stand upright',{p:[x,.034,0],r:[0,Math.PI/2,0]});
  }
  // The stand is small and indoors: it receives shadows but casts none, so it never joins
  // the moonlight's estate-wide shadow pass (the bench under it casts, like every station).
  // Parts in the bench's own brass cast with it, so they join its batch.
  g.traverse(o=>{if(o.isMesh)o.castShadow=!!brass&&o.material===brass;});
  g.userData.sword=sword;return g;
}

// ---- The slashes -----------------------------------------------------------------------------
// Where the sword sits in the view (relative to the guns' hip position) at rest and through
// each slash. Positions follow a smooth curve through the keys; the blade turns from key to
// key, edge first.
const HIP=new T.Vector3(.28,-.26,-.48),_b=new T.Vector3(),_n=new T.Vector3(),_x=new T.Vector3(),_m=new T.Matrix4();
function bladeTurn(blade,edge,out=new T.Quaternion()){
  _b.copy(blade).normalize();_n.copy(edge).addScaledVector(_b,-edge.dot(_b)).normalize().negate();_x.crossVectors(_b,_n);
  return out.setFromRotationMatrix(_m.makeBasis(_x,_b,_n));
}
const REST=Object.freeze({p:new T.Vector3(.31,-.24,-.47).sub(HIP),q:bladeTurn(new T.Vector3(-.1,.86,-.5),new T.Vector3(0,-.5,-1))});
const CUTS=SLASHES.map(s=>{
  const p=s.keys.map(([c])=>new T.Vector3(...c).sub(HIP)),b=s.keys.map(([,d])=>new T.Vector3(...d).normalize());
  // Each key's edge faces where the blade is heading next (the last, where it came from).
  const q=b.map((d,i)=>{const ahead=i<b.length-1?b[i+1].clone().sub(d):d.clone().sub(b[i-1]);return bladeTurn(d,ahead);});
  for(let i=1;i<q.length;i++)if(q[i].dot(q[i-1])<0)q[i].set(-q[i].x,-q[i].y,-q[i].z,-q[i].w);
  const last=p.length-1,held=p[last].clone().addScaledVector(p[last].clone().sub(p[last-1]),.12);
  return {slash:s,p,q,held};});
const ease=t=>t*t*(3-2*t),easeOut=t=>1-(1-t)*(1-t),_a=new T.Vector3(),_c=new T.Vector3();
// A Catmull-Rom point between key i and i+1.
function curve(p,i,t,out){const p0=p[Math.max(0,i-1)],p1=p[i],p2=p[Math.min(p.length-1,i+1)],p3=p[Math.min(p.length-1,i+2)],t2=t*t,t3=t2*t;
  return out.set(0,0,0).addScaledVector(p1,2).addScaledVector(_a.copy(p2).sub(p0),t).addScaledVector(_c.copy(p0).multiplyScalar(2).addScaledVector(p1,-5).addScaledVector(p2,4).sub(p3),t2)
    .addScaledVector(_a.copy(p1).multiplyScalar(3).sub(p0).addScaledVector(p2,-3).add(p3),t3).multiplyScalar(.5);}
export function katanaRest(){return REST;}
// t: seconds into slash `kind`; from: the pose the slash started from.
export function katanaPose(kind,t,from,out={p:new T.Vector3(),q:new T.Quaternion()}){
  const c=CUTS[kind],s=c.slash,start=from??REST,n=c.p.length-1;
  if(t<s.windup){const k=easeOut(t/s.windup);out.p.lerpVectors(start.p,c.p[0],k);out.q.slerpQuaternions(start.q,c.q[0],k);return out;}
  if(t<s.windup+s.cut){const u=ease((t-s.windup)/s.cut)*n,i=Math.min(n-1,Math.floor(u)),f=u-i;curve(c.p,i,f,out.p);out.q.slerpQuaternions(c.q[i],c.q[i+1],f);return out;}
  if(t<s.windup+s.cut+s.hold){const k=(t-s.windup-s.cut)/s.hold;out.p.lerpVectors(c.p[n],c.held,easeOut(k));out.q.copy(c.q[n]);return out;}
  const k=ease(Math.min(1,(t-s.windup-s.cut-s.hold)/Math.max(.001,s.length-s.windup-s.cut-s.hold)));
  out.p.lerpVectors(c.held,REST.p,k);out.q.slerpQuaternions(c.q[n],REST.q,k);return out;
}
