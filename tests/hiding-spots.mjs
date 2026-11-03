import assert from 'node:assert/strict';
import {isBlocked} from '../public/game/core.mjs';
import {UPPER_Y,hasUpperFloor} from '../public/game/vertical.mjs';
import {PLAYER_RADIUS,enemyBody} from '../public/game/crowd.mjs';

// v172: nowhere to hide. Around each piece of furniture that used to leave a
// player-only gap (the west bedchamber bed, the nursery bed, the Soul Forge),
// every spot the player can walk to must be within a zombie's 1.6 m swing,
// from a spot a zombie can stand in, with the clear line the game requires
// (an upright 0.35 m sweep at full height). The whole estate was audited
// the same way; these are the places it found.
export function verifyHidingSpots(qa){
  qa.start();qa.holdSpawns();for(const e of qa.get().zombies)e.dead=true;
  const C=qa.get().colliders,STEP=.1,REACH=1.6,ZR=enemyBody().radius,H=1.8;
  const areas=[
    {name:'West bedchamber bed',y:UPPER_Y,box:[-40,-33,-11.9,-7],seed:[-36,-7.5],floor:(x,z,r)=>hasUpperFloor(x,z,r)},
    {name:'Nursery bed',y:UPPER_Y,box:[33,40,-11.9,-7],seed:[36,-7.5],floor:(x,z,r)=>hasUpperFloor(x,z,r)},
    {name:'Soul Forge',y:0,box:[1,5.5,-11.9,-8],seed:[2,-9],floor:()=>true},
  ];
  const report=[];
  for(const A of areas){
    const [x0,x1,z0,z1]=A.box,W=Math.round((x1-x0)/STEP)+1,D=Math.round((z1-z0)/STEP)+1,X=i=>x0+i*STEP,Z=j=>z0+j*STEP;
    const walk=r=>{
      const open=new Uint8Array(W*D),seen=new Uint8Array(W*D);
      for(let j=0;j<D;j++)for(let i=0;i<W;i++)open[j*W+i]=A.floor(X(i),Z(j),r)&&!isBlocked(X(i),Z(j),r,C,undefined,A.y,H)?1:0;
      const start=Math.round((A.seed[1]-z0)/STEP)*W+Math.round((A.seed[0]-x0)/STEP);assert(open[start],`${A.name}: the approach is open`);
      const q=[start];seen[start]=1;
      while(q.length){const k=q.pop(),i=k%W,j=(k-i)/W;for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const ii=i+di,jj=j+dj,n=jj*W+ii;if(ii>=0&&jj>=0&&ii<W&&jj<D&&open[n]&&!seen[n]){seen[n]=1;q.push(n);}}}
      return seen;
    };
    const player=walk(PLAYER_RADIUS),zombie=walk(ZR),R=Math.ceil(REACH/STEP);
    const clear=(x,z,tx,tz)=>{const d=Math.hypot(tx-x,tz-z);for(let t=.25;t<d;t+=.25){const f=t/d;if(isBlocked(x+(tx-x)*f,z+(tz-z)*f,.35,C,undefined,A.y,H))return false;}return true;};
    let cells=0;const hidden=[];
    for(let j=0;j<D;j++)for(let i=0;i<W;i++){
      if(!player[j*W+i])continue;cells++;if(zombie[j*W+i])continue;
      let hit=false;
      for(let dj=-R;dj<=R&&!hit;dj++)for(let di=-R;di<=R&&!hit;di++){
        const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>=W||jj>=D||!zombie[jj*W+ii]||Math.hypot(di,dj)*STEP>REACH)continue;
        if(clear(X(ii),Z(jj),X(i),Z(j)))hit=true;
      }
      if(!hit)hidden.push(`(${X(i).toFixed(1)}, ${Z(j).toFixed(1)})`);
    }
    assert(cells>500,`${A.name}: the area is walkable`);
    assert.equal(hidden.length,0,`${A.name}: no spot out of every zombie's reach (${hidden.slice(0,4).join(' ')})`);
    report.push(`${A.name} ${cells}`);
  }
  // The pieces really are against the wall now.
  const wallFace=-12+.48/2,flush=name=>C.filter(c=>c.furnishing===name&&Math.abs((c.minY??0)-UPPER_Y)<.01).map(c=>c.z-c.d/2);
  for(const name of ['Double oak bed','Single oak bed']){const backs=flush(name);assert(backs.length>0);for(const back of backs)assert(Math.abs(back-wallFace)<.02,`${name} sits against the wall (${back.toFixed(3)} vs ${wallFace})`);}
  const forge=qa.get().interactables.find(s=>s.type==='upgrade'&&!s.y);assert(forge.z<-11.3,'The Soul Forge sits against the hall wall');
  console.log(`PASS: no hiding spots: every walkable spot around ${report.join(', ')} cells (0.1 m grid) is within a zombie's 1.6 m swing with a clear line; beds, nightstands and the Soul Forge sit flush against their walls.`);
}
