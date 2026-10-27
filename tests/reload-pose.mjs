import assert from 'node:assert/strict';
import {reloadPose,reloadWeight,RELOAD_POSE} from '../public/game/reload-pose.mjs';

// A small deterministic generator so the jittered frame times repeat exactly.
function lcg(seed){let s=seed>>>0;return ()=>((s=(s*1664525+1013904223)>>>0)/2**32);}

export function verifyReloadPose(qa,frames){
  // The curve: rests at both ends, holds in the middle, and both moves ease in and out.
  assert.equal(reloadWeight(0),0);assert.equal(reloadWeight(1),0);assert.equal(reloadWeight(.5),1);
  const h=1e-4,speed=p=>(reloadWeight(p+h)-reloadWeight(p-h))/(2*h);
  for(const p of [h*2,RELOAD_POSE.lower-h*2,RELOAD_POSE.raise+h*2,1-h*2])assert(Math.abs(speed(p))<.02,`Reload pose should start and stop each move at rest (speed ${speed(p).toFixed(3)} at ${p.toFixed(4)})`);
  let last=0;for(let p=0;p<=1;p+=.001){const w=reloadWeight(p);assert(Math.abs(w-last)<.02,'Reload pose must be continuous');last=w;}
  assert.equal(reloadPose(.5).drop,RELOAD_POSE.drop);

  // In game: the same depth at any frame rate, and a smooth return to the hip.
  const game=qa.get(),gun=game.gunRoot;
  game.inventory.smg.owned=true;qa.selectWeapon('smg');qa.setAim?.(0,0);frames(90);
  const hip=gun.position.y;
  const run=(stepFor,label)=>{
    game.inventory.smg.ammo=1;game.inventory.smg.reserve=200;qa.reload();
    assert(qa.get().reloadLeft>0,`${label}: reload should start`);
    const ys=[],ts=[];let time=0;
    while(qa.get().reloadLeft>0||time<qa.get().reloadDuration+.5){const step=stepFor();frames(1,step);time+=step/1000;ys.push(gun.position.y);ts.push(time);if(time>10)break;}
    const depth=hip-Math.min(...ys);
    // Frame-to-frame speed change over the last 30% of the reload and the settle.
    const dur=qa.get().reloadDuration,start=ts.findIndex(t=>t>dur*.7);let jolt=0;
    for(let i=start+2;i<ys.length;i++){const v1=(ys[i]-ys[i-1])/(ts[i]-ts[i-1]),v0=(ys[i-1]-ys[i-2])/(ts[i-1]-ts[i-2]);jolt=Math.max(jolt,Math.abs(v1-v0));}
    return {depth,jolt,end:Math.abs(ys.at(-1)-hip)};
  };
  const r60=run(()=>1000/60,'60 fps'),r120=run(()=>1000/120,'120 fps'),r30=run(()=>1000/30,'30 fps');
  const rand=lcg(7),rj=run(()=>1000/60*(.65+rand()*.7),'jittery 60 fps');
  for(const [label,r] of [['60 fps',r60],['120 fps',r120],['30 fps',r30],['jittery 60 fps',rj]]){
    assert(Math.abs(r.depth-RELOAD_POSE.drop)<.03,`${label}: reload dip should be ${RELOAD_POSE.drop}, got ${r.depth.toFixed(3)}`);
    assert(r.end<.002,`${label}: the gun should settle back at the hip (off by ${r.end.toFixed(4)})`);
    assert(r.jolt<1,`${label}: raising the gun should be smooth (max frame-to-frame speed change ${r.jolt.toFixed(2)} u/s)`);
  }
  console.log(`PASS: reload dips the same ${RELOAD_POSE.drop} at 30/60/120 fps and with jittery frame times, then eases back to the hip without jolts (worst speed change ${Math.max(r60.jolt,r120.jolt,r30.jolt,rj.jolt).toFixed(2)} u/s).`);
}
