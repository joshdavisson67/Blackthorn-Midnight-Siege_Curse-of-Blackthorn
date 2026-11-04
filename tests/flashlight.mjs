import assert from 'node:assert/strict';

// v182: the flashlight is 25% brighter, reaches 25% further and is 15% wider.
export function verifyFlashlight(qa,listeners){
  qa.start();const {flashlight}=qa.get();
  const near=(v,t)=>Math.abs(v-t)<1e-9;
  assert(near(flashlight.intensity,22*1.25),`25% brighter (${flashlight.intensity})`);
  assert(near(flashlight.distance,28*1.25),`casts 25% further (${flashlight.distance} m)`);
  assert(near(flashlight.angle,.5*1.15),`and 15% wider (${flashlight.angle.toFixed(3)} rad)`);
  assert(near(flashlight.penumbra,.35)&&near(flashlight.decay,1.1),'with the same soft edge and falloff');
  // Light falls off the same way, so the brighter beam alone carries about as
  // far again before it fades to the old edge's level.
  const level=(i,d)=>i/Math.pow(d,flashlight.decay),edge=level(22,28);
  assert(level(flashlight.intensity,28*1.2)>edge*.98,'the brighter beam is still as strong 20% further out');
  listeners.keydown({code:'KeyF'});assert.equal(flashlight.intensity,0);
  listeners.keydown({code:'KeyF'});assert(near(flashlight.intensity,22*1.25),'Switching it back on restores the brighter beam');
  console.log(`PASS: flashlight ${flashlight.intensity} intensity (+25%), ${flashlight.distance} m reach (+25%), ${flashlight.angle.toFixed(3)} rad cone (+15%); toggling restores it.`);
}
