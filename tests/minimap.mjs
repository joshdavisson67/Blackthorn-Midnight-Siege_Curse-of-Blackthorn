import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {drawMinimap,mapColor,isReddish,MINIMAP} from '../public/game/minimap.mjs';

// A 2D context that records what is drawn and under which rotation.
function recorder(){
  const log=[];let rot=0,turned=false;const stack=[];
  const c={fillStyle:'',strokeStyle:'',globalAlpha:1,lineWidth:1,font:'',textAlign:'',textBaseline:'',
    clearRect(){},scale(){},translate(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},clip(){},fillText(t){log.push({op:'text',t});},
    save(){stack.push([rot,turned]);},restore(){[rot,turned]=stack.pop()??[0,false];},rotate(a){rot+=a;turned=true;log.push({op:'rotate',a});},
    arc(x,y,r){log.push({op:'arc',x,y,r,rot,turned});},fill(){log.push({op:'fill',style:c.fillStyle,rot,turned});},stroke(){log.push({op:'stroke',style:c.strokeStyle,rot,turned});},
    fillRect(x,y,w,h){log.push({op:'fillRect',x,y,w,h,style:c.fillStyle,rot,turned});},strokeRect(){},
    createRadialGradient(){return {addColorStop(){}};}};
  return {c,log};
}

export function verifyMinimap(qa,frames){
  const player={x:0,y:0,z:0},wall={x:6,z:-4,w:3,d:1,minY:0,maxY:3};
  const near={group:{position:{x:5,z:8}},floorY:0},far={group:{position:{x:80,z:0}},floorY:0},upstairs={group:{position:{x:-6,z:2}},floorY:5.4},brute={group:{position:{x:-3,z:-3}},floorY:0,brute:true};
  const draw=yaw=>{const r=recorder();const out=drawMinimap(r.c,{width:330,height:330,player,yaw,colliders:[wall],zombies:[near,far,upstairs,brute],stations:[{type:'perk',id:'iron',hex:'#ef7969',x:2,z:2,y:0},{type:'glock',hex:'#ef7969',x:-2,z:4,y:0}]});return {...r,out};};
  const a=draw(0),b=draw(1.3);
  // North-up: walls, stations and zombies land in the same place whatever the facing.
  const fixed=l=>l.filter(e=>(e.op==='fillRect'||e.op==='arc')&&!e.turned).map(e=>JSON.stringify([e.op,+(e.x??0).toFixed(4),+(e.y??0).toFixed(4)]));
  assert.deepEqual(fixed(a.log),fixed(b.log),'The map itself does not rotate');
  assert(a.log.filter(e=>e.op==='fillRect').every(e=>!e.turned),'Walls and stations are drawn unrotated');
  const turns=b.log.filter(e=>e.op==='rotate');
  assert(turns.some(t=>Math.abs(t.a+1.3)<1e-9),'Your marker turns with your view');
  assert(b.log.some(e=>e.op==='fill'&&Math.abs(e.rot+1.3)<1e-9),'The view cone and arrow are drawn in the turned frame');
  // Zombies: red everywhere on the map, hollow on other floors, pips beyond the edge.
  assert.equal(a.out.shown,3,'Zombies show across the whole minimap, not only close by');
  assert.equal(a.out.pips,1,'A zombie off the map edge gets a rim pip');
  const zombieFills=a.log.filter(e=>e.op==='fill'&&e.style===MINIMAP.zombie);assert(zombieFills.length>=3,'Zombies are red');
  assert(a.log.some(e=>e.op==='stroke'&&e.style===MINIMAP.zombie),'Zombies on another floor are hollow red rings');
  const reach=MINIMAP.radius/MINIMAP.scale;assert(reach>25,`The minimap covers about ${reach.toFixed(0)} m around you`);
  // Stations are never red, here or in the real estate.
  const stationFills=a.log.filter(e=>e.op==='fillRect'&&e.w<6);
  assert(stationFills.length===2&&stationFills.every(e=>!isReddish(e.style)),'Red-coded stations are recoloured on the map');
  assert(isReddish('#ef7969')&&isReddish(MINIMAP.zombie)&&!isReddish('#e6bf61')&&!isReddish('#7aaff0'));
  qa.start();
  const all=qa.get().interactables;assert(all.length>30);
  for(const s of all)assert(!isReddish(mapColor(s)),`${s.name||s.type} is not red on the map (${mapColor(s)})`);
  // The live HUD map draws without errors while playing.
  frames(12);
  // v163: on PC the map grows with the screen; the touch layout keeps 92px.
  const css=readFileSync(new URL('../public/game/style.css',import.meta.url),'utf8');
  const size=css.match(/#hud\{[^}]*--hud-map-size:clamp\((\d+)px,calc\((\d+)vh \+ (\d+)px\),(\d+)px\)/);assert(size,'The PC minimap size scales with the screen');
  const [lo,vh,add,hi]=size.slice(1).map(Number),mapAt=h=>Math.min(hi,Math.max(lo,vh*h/100+add));
  assert(Math.abs(mapAt(969)/165-1.25)<.04,`About 25% larger on a 1080p monitor (${mapAt(969).toFixed(0)}px)`);
  assert.equal(mapAt(1329),260,'Up to 260px on 1440p');assert.equal(mapAt(600),165,'Never smaller than before');
  assert(css.includes('body.touch-playing #hud{--hud-map-size:92px'),'Phones keep the compact map');
  assert(css.includes('.topHud{top:var(--hud-top-inset);left:38px;right:calc(var(--hud-map-size) + 61px)}')&&css.includes('.topHud{left:20px;right:calc(var(--hud-map-size) + 25px)}'),'The wave column makes room for the bigger map');
  console.log(`PASS: north-up minimap with only the player marker turning (view cone), red zombies across the full ${reach.toFixed(0)} m view plus rim pips beyond it and hollow rings on other floors, and no red station among ${all.length} on the minimap or estate map; the PC map scales to ${mapAt(969).toFixed(0)}px at 1080p and ${hi}px at 1440p while phones keep 92px.`);
}
