import assert from 'node:assert/strict';
import * as T from '../public/game/three.module.js';
import {MAUSOLEUM,SARCOPHAGUS,inMausoleum} from '../public/game/graveyard-layout.mjs';
import {moveActor} from '../public/game/vertical.mjs';
import {createMausoleumNuke} from '../public/game/mausoleum-nuke.mjs';

// v190: The Last Dawn is gone from the mausoleum. Speaking to the grave in the
// sarcophagus wakes Sir Blackthorn instead: free, once per run, after wave 20.
// The nuke's model is kept in mausoleum-nuke.mjs for later use.
export function verifyGraveSummon(qa,frames,listeners,elements){
  // ---- The saved nuke asset still builds, but the game no longer places it -------------------
  {
    const world=new T.Group(),colliders=[],solidMeshes=[],interactables=[];
    const device=createMausoleumNuke({world,colliders,solidMeshes,interactables,label:()=>new T.MeshBasicMaterial()});
    assert(device.details.some(p=>p.name==='Radiation warning emblem')&&device.details.some(p=>p.name==='Red activation button'),'The nuke model is preserved');
    assert.equal(interactables[0].type,'nuke');
  }
  qa.start();
  const st=qa.get(),graveyard=st.graveyard,s=graveyard.grave;
  assert(!st.interactables.some(o=>o.type==='nuke'),'No nuke in the game');assert(!('nuke' in graveyard));
  let nukeMeshes=0;st.world.traverse(o=>{if(/Last Dawn|atomic|Radiation/i.test(o.name||''))nukeMeshes++;});assert.equal(nukeMeshes,0,'and no nuke model in the tomb');
  assert.equal(s.type,'sarcophagus');assert.equal(s.price,0);assert(inMausoleum(s.x,s.z)&&s.x===SARCOPHAGUS.x&&s.z===SARCOPHAGUS.z,'The grave is the sarcophagus');
  assert(s.locked&&!s.used);
  // Locked until wave 20 is complete.
  qa.setPlayer(s.x-1.6,s.z);qa.interact();assert(!qa.speakToGrave()&&!s.used&&qa.get().boss.stage==='dormant','Teleporting into the sealed tomb cannot wake him');
  for(let i=0;i<20;i++)qa.startWave();qa.holdSpawns();assert(s.locked,'The grave stays silent during wave 20');
  qa.startWave();qa.holdSpawns();qa.setHealth(1e6);frames(110);
  assert(graveyard.open&&!s.locked,'Clearing wave 20 opens the tomb');
  // Both lanes round the coffin and the rear passage stay walkable.
  for(const x of [MAUSOLEUM.x-2.4,MAUSOLEUM.x+2.4]){
    const p=new T.Vector3(x,0,-17.3);
    for(let i=0;i<90;i++)moveActor(p,0,.055,qa.get().colliders,{radius:.32,allowFall:false});
    assert(p.z>-12.5,'Both walking lanes round the coffin stay open');
  }
  qa.get().nav.rebuild(MAUSOLEUM.x,MAUSOLEUM.frontZ+2);
  for(const x of [MAUSOLEUM.x-2,MAUSOLEUM.x,MAUSOLEUM.x+2])assert(qa.get().nav.direction(x,-17,0).reachable,'Rear tomb passage stays connected');
  // Not through the tomb wall.
  qa.setPlayer(MAUSOLEUM.x+MAUSOLEUM.w/2+.6,s.z);qa.interact();assert(!s.used,'The grave cannot be woken through the tomb wall');
  // Beside the coffin: a free prompt, and talking wakes him.
  qa.setPlayer(s.x-1.6,s.z);qa.setPoints(0);frames(1);
  const prompt=elements.get('interaction').innerHTML;assert(prompt.includes('SIR BLACKTHORN’S GRAVE')&&prompt.includes('FREE'),'The grave offers a free summoning');
  const walker=qa.makeZombie(0,20);
  listeners.keydown({code:'KeyE',repeat:false});listeners.keyup({code:'KeyE'});
  assert(s.used&&qa.get().boss.stage==='waking','Speaking to the grave wakes Sir Blackthorn');
  assert.equal(qa.get().points,0,'It costs nothing');assert(!walker.dead,'and kills nothing, unlike the old nuke');
  assert(elements.get('toast').textContent.includes('THE GRAVE ANSWERS'));
  qa.damageEnemy(walker,1e9);
  assert(!qa.speakToGrave(),'Once per run');
  qa.start();assert(s.locked&&!s.used&&qa.get().boss.stage==='dormant','A new run seals the grave again');
  console.log('PASS: grave summoning — no nuke in the tomb (its model is kept for later), the sarcophagus grave unlocks once wave 20 is cleared, cannot be reached through the walls, wakes Sir Blackthorn for free once per run, tomb lanes stay clear, and fresh runs reseal it.');
}
