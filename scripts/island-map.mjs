#!/usr/bin/env node
// A plan of Dead Tide's island (v210 tooling): the ground shaded by height, the sea by depth,
// with everything that blocks (colliders), the palms, rocks and brush, the trails, the station
// pads, the landmarks' names and the spawn network drawn on it. For checking a layout by eye
// without a browser; it draws exactly what island.mjs builds.
//
//   node scripts/island-map.mjs [out.png] [--spawns] [--scale 5]
//
// North is up (as -z is north in the game). Major shoreline zones are red, minor points orange,
// interior zones violet; pads are white squares; colliders are black.
import {writeFileSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),argv=process.argv.slice(2);
const flag=n=>argv.includes('--'+n),opt=(n,d)=>{const i=argv.indexOf('--'+n);return i>=0?Number(argv[i+1]):d;};
const out=argv.find(a=>!a.startsWith('--')&&!/^\d+$/.test(a))||resolve(root,'.tier/island-map.png');
const I=await import('../public/game/island.mjs'),T=await import('../public/game/three.module.js');
const {ISLAND,groundHeight,buildIsland,shoreSpawns}=I;
const scene=new T.Scene(),world=new T.Group();scene.add(world);const island=buildIsland({scene,world});
const S=opt('scale',5),E=92,W=Math.round(2*E*S),px=new Uint8Array(W*W*3);
const set=(i,j,r,g,b,a=1)=>{if(i<0||j<0||i>=W||j>=W)return;const k=(j*W+i)*3;px[k]+=(r-px[k])*a;px[k+1]+=(g-px[k+1])*a;px[k+2]+=(b-px[k+2])*a;};
const X=i=>(i+.5)/S-E,sx=x=>Math.round((x+E)*S-.5);
const lerp=(a,b,t)=>a.map((v,k)=>v+(b[k]-v)*t),clamp=t=>Math.min(1,Math.max(0,t));
// Height bands: sand, scrub, hill green, rock, summit.
const bands=[[0,[188,174,142]],[1.2,[168,160,120]],[2.2,[104,124,84]],[4.5,[86,110,72]],[7,[112,118,92]],[10,[138,134,112]],[14.2,[176,170,150]]];
function landColor(h){for(let k=1;k<bands.length;k++)if(h<=bands[k][0])return lerp(bands[k-1][1],bands[k][1],clamp((h-bands[k-1][0])/(bands[k][0]-bands[k-1][0])));return bands.at(-1)[1];}
for(let j=0;j<W;j++)for(let i=0;i<W;i++){
  const x=X(i),z=X(j),h=groundHeight(x,z);let c;
  if(h<0)c=h<-ISLAND.wade?lerp([24,66,74],[10,34,42],clamp((-h-ISLAND.wade)/1.4)):lerp([120,176,168],[44,104,108],clamp(-h/ISLAND.wade));
  else{c=landColor(h);const gx=groundHeight(x+.4,z)-groundHeight(x-.4,z),gz=groundHeight(x,z+.4)-groundHeight(x,z-.4),shade=clamp(.5-(gx*-.7+gz*-.7)*.9);c=c.map(v=>v*(.62+.55*shade));
    if(Math.abs(h/1%1)<.06&&h>.3)c=c.map(v=>v*.82);}   // a contour every metre
  set(i,j,...c);}
const disc=(x,z,r,c,a=1)=>{const R=Math.max(1,r*S);for(let dj=-Math.ceil(R);dj<=R;dj++)for(let di=-Math.ceil(R);di<=R;di++)if(di*di+dj*dj<=R*R)set(sx(x)+di,sx(z)+dj,...c,a);};
const line=(a,b,c,w=.4,al=1)=>{const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*S*1.5);for(let k=0;k<=n;k++)disc(a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n,w,c,al);};
for(const t of island.trails||[])for(let k=1;k<t.points.length;k++)line(t.points[k-1],t.points[k],[150,128,96],.9,.55);
for(const b of island.brush||[])disc(b.x,b.z,b.size*.8,[52,92,50],.9);
for(const p of island.palms)disc(p.x,p.z,1.3,[38,82,44],.85);
for(const p of island.palms)disc(p.x,p.z,.3,[70,56,40]);
for(const r of island.rocks)disc(r.x,r.z,r.size*.85,[92,96,92]);
for(const p of island.platforms)if(p.r===undefined)for(let j=0;j<W;j++)for(let i=0;i<W;i++){const dx=X(i)-p.x,dz=X(j)-p.z,lx=dx*p.cos-dz*p.sin,lz=dx*p.sin+dz*p.cos;if(Math.abs(lx)<=p.w/2&&Math.abs(lz)<=p.d/2)set(i,j,150,140,120,.8);}
for(const c of island.colliders){if(c.r!==undefined){if(!island.palms.some(p=>p.x===c.x&&p.z===c.z)&&!island.rocks.some(p=>p.x===c.x&&p.z===c.z))disc(c.x,c.z,c.r,[12,12,12]);continue;}
  const reach=Math.hypot(c.w,c.d)/2;for(let j=sx(c.z-reach);j<=sx(c.z+reach);j++)for(let i=sx(c.x-reach);i<=sx(c.x+reach);i++){const dx=X(i)-c.x,dz=X(j)-c.z,lx=dx*c.cos-dz*c.sin,lz=dx*c.sin+dz*c.cos;if(Math.abs(lx)<=c.w/2&&Math.abs(lz)<=c.d/2)set(i,j,12,12,12);}}
for(const s of island.stations||[]){for(let d=-3;d<=3;d++)for(let e=-3;e<=3;e++)set(sx(s.x)+d,sx(s.z)+e,...(Math.max(Math.abs(d),Math.abs(e))===3?[0,0,0]:[255,255,255]));}
if(flag('spawns')){const net=shoreSpawns();
  for(const z of net.major)for(const p of z.points)disc(p[0],p[1],.7,[230,40,40]);
  for(const z of net.minor)for(const p of z.points)disc(p[0],p[1],.6,[255,160,30]);
  for(const z of net.interior)for(const p of z.points)disc(p[0],p[1],.7,[190,90,255]);}
disc(ISLAND.spawn.x,ISLAND.spawn.z,.8,[255,255,0]);
// A 10 m scale bar and a north arrow.
line([-88,86],[-78,86],[255,255,255],.3);line([80,-80],[80,-88],[255,255,255],.3);line([80,-88],[78.5,-85],[255,255,255],.3);line([80,-88],[81.5,-85],[255,255,255],.3);
// PNG, written by hand (no dependencies).
const crcT=new Int32Array(256).map((_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c;});
const crc=b=>{let c=-1;for(const v of b)c=crcT[(c^v)&255]^(c>>>8);return (c^-1)>>>0;};
const chunk=(type,data)=>{const len=Buffer.alloc(4);len.writeUInt32BE(data.length);const td=Buffer.concat([Buffer.from(type),data]),c=Buffer.alloc(4);c.writeUInt32BE(crc(td));return Buffer.concat([len,td,c]);};
const raw=Buffer.alloc((W*3+1)*W);for(let j=0;j<W;j++){raw[j*(W*3+1)]=0;Buffer.from(px.buffer,j*W*3,W*3).copy(raw,j*(W*3+1)+1);}
const head=Buffer.alloc(13);head.writeUInt32BE(W,0);head.writeUInt32BE(W,4);head[8]=8;head[9]=2;
writeFileSync(out,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',head),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));
console.log(out);
