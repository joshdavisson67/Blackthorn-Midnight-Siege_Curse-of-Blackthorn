// HUD minimap (v162). North stays up; only your marker turns, with a faded
// view cone. Red is reserved for zombies: every station uses a non-red map
// colour. Zombies show across the whole minimap, on other floors as hollow
// rings, and beyond its edge as red pips on the rim pointing at them.
export const MINIMAP=Object.freeze({size:150,radius:72,scale:2.6,rimPip:66,cone:{radius:44,halfAngle:.55},zombie:'#ff3b30',zombieRage:'#ff8a7a'});

const hexHue=hex=>{
  const n=parseInt(String(hex).replace('#','').slice(0,6),16);if(!Number.isFinite(n))return null;
  const r=(n>>16&255)/255,g=(n>>8&255)/255,b=(n&255)/255,max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
  if(d<1e-6)return {h:0,s:0};
  const h=max===r?((g-b)/d+6)%6:max===g?(b-r)/d+2:(r-g)/d+4,l=(max+min)/2;
  return {h:h*60,s:d/(1-Math.abs(2*l-1))};
};
// Saturated hues near red read as "zombie" on the map.
export function isReddish(hex){const c=hexHue(hex);return !!c&&c.s>.25&&(c.h<25||c.h>330);}
const SAFE={glock:'#f2c661',shotgun:'#f2c661',smg:'#7aaff0',bushmaster:'#f2c661',lmg:'#f2c661',ammo:'#67efbb',upgrade:'#c1a1ff',armor:'#85f4d3',kennel:'#f0dbc1'};
const PERKS={iron:'#f6c6e8'};
// The colour a station uses on the minimap and the estate map: never red.
export function mapColor(s){
  const own=s.type==='perk'?PERKS[s.id]??s.hex:s.hex;
  if(own&&!isReddish(own))return own;
  return SAFE[s.type]??(s.shedWeapon?SAFE.shotgun:'#e8dcc0');
}

export function drawMinimap(c,{width,height,player,yaw,colliders=[],zombies=[],stations=[],bella=null}){
  const M=MINIMAP,sc=M.scale,R=M.radius,toMap=(x,z)=>[(x-player.x)*sc,(z-player.z)*sc];
  c.clearRect(0,0,width,height);c.save();c.scale(width/M.size,height/M.size);c.translate(M.size/2,M.size/2);
  // Disc, rim and compass ticks.
  c.fillStyle='#07111a';c.beginPath();c.arc(0,0,R+2,0,Math.PI*2);c.fill();
  c.save();c.beginPath();c.arc(0,0,R,0,Math.PI*2);c.clip();
  // Walls and furniture on your floor, as soft filled outlines (north-up).
  c.fillStyle='#93a19326';c.strokeStyle='#b7c3ab70';c.lineWidth=.8;
  const reach=R/sc+4;
  for(const w of colliders){
    if(w.disabled||(w.w<.6&&w.d<.6))continue;
    if(player.y+.06>=(w.maxY??3.8)||player.y+1.8<=(w.minY??0))continue;
    if(Math.abs(w.x-player.x)>reach+w.w/2||Math.abs(w.z-player.z)>reach+w.d/2)continue;
    const [x,z]=toMap(w.x,w.z);c.fillRect(x-w.w*sc/2,z-w.d*sc/2,w.w*sc,w.d*sc);c.strokeRect(x-w.w*sc/2,z-w.d*sc/2,w.w*sc,w.d*sc);
  }
  // Stations: small squares in their (non-red) map colours.
  for(const s of stations){
    if(s.used||s.locked||s.secret||Math.abs((s.y||0)-player.y)>1.8)continue;
    const [x,z]=toMap(s.x,s.z);if(Math.hypot(x,z)>R-2)continue;
    c.fillStyle=mapColor(s);c.fillRect(x-2.2,z-2.2,4.4,4.4);c.strokeStyle='#06101a';c.lineWidth=.8;c.strokeRect(x-2.2,z-2.2,4.4,4.4);
  }
  if(bella&&bella.unlocked){const [x,z]=toMap(bella.pos.x,bella.pos.z);if(Math.hypot(x,z)<R-3&&Math.abs(bella.pos.y-player.y)<1.8){c.fillStyle='#9af0d6';c.beginPath();c.arc(x,z,2.6,0,Math.PI*2);c.fill();c.font='bold 7px Arial';c.fillText('B',x+3.5,z+2.5);}}
  // Your view cone and marker: the only thing that turns.
  c.save();c.rotate(-yaw);
  const cone=c.createRadialGradient(0,0,2,0,0,M.cone.radius);cone.addColorStop(0,'rgba(232,228,196,.34)');cone.addColorStop(1,'rgba(232,228,196,0)');
  c.fillStyle=cone;c.beginPath();c.moveTo(0,0);c.arc(0,0,M.cone.radius,-Math.PI/2-M.cone.halfAngle,-Math.PI/2+M.cone.halfAngle);c.closePath();c.fill();
  c.fillStyle='#ece9cf';c.strokeStyle='#06101a';c.lineWidth=1;c.beginPath();c.moveTo(0,-6);c.lineTo(-4.2,4.5);c.lineTo(0,2.4);c.lineTo(4.2,4.5);c.closePath();c.fill();c.stroke();
  c.restore();
  // Zombies on top: red dots in range, hollow rings on other floors.
  let pips=0,shown=0;
  for(const e of zombies){
    if(e.dead)continue;const p=e.group?.position||e.walkPos;if(!p)continue;
    const [x,z]=toMap(p.x,p.z),d=Math.hypot(x,z),r=e.brute?3.2:e.dog?1.8:2.3,otherFloor=Math.abs((e.floorY??p.y)-player.y)>1.8;
    if(d<=R-r){
      shown++;c.beginPath();c.arc(x,z,r,0,Math.PI*2);
      if(otherFloor){c.strokeStyle=M.zombie;c.globalAlpha=.6;c.lineWidth=1;c.stroke();c.globalAlpha=1;}
      else{c.fillStyle=M.zombie;c.fill();if(e.enraged){c.strokeStyle=M.zombieRage;c.lineWidth=.9;c.beginPath();c.arc(x,z,r+1.6,0,Math.PI*2);c.stroke();}}
    }else{
      // Beyond the edge: a pip on the rim pointing toward it.
      pips++;const a=Math.atan2(z,x),k=M.rimPip;c.save();c.translate(Math.cos(a)*k,Math.sin(a)*k);c.rotate(a);c.globalAlpha=otherFloor?.45:.85;c.fillStyle=M.zombie;c.beginPath();c.moveTo(4,0);c.lineTo(-1.5,-2.6);c.lineTo(-1.5,2.6);c.closePath();c.fill();c.restore();
    }
  }
  c.restore();
  c.strokeStyle='#a8b49c66';c.lineWidth=1.2;c.beginPath();c.arc(0,0,R,0,Math.PI*2);c.stroke();
  c.fillStyle='#c9d1bd';c.font='bold 8px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText('N',0,-R+6);
  c.fillStyle='#8b9f95';c.font='6px Arial';c.fillText('E',R-5,0);c.fillText('S',0,R-5);c.fillText('W',-R+5,0);
  c.restore();
  return {shown,pips};
}
