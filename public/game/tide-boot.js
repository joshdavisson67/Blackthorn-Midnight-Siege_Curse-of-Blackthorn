// Dead Tide's page (v204, Dead Tide step 2). Like boot.js for the mansion: start in this
// page and request mouse capture in the Wade Ashore click itself. It loads tide.mjs and
// nothing of the mansion.
const byId=id=>document.getElementById(id);
let ready=false,startRun=null,failed=false;
function report(error){if(failed)return;failed=true;byId('loading').classList.add('hidden');byId('error').classList.remove('hidden');byId('errorDetails').textContent=error?.message||String(error||'The island could not load.');byId('start').disabled=true;}
window.Blackthorn={ready(fn){
  startRun=fn;ready=true;byId('start').disabled=false;
  byId('start').innerHTML='WADE ASHORE <span>→</span>';
  byId('loading').classList.add('hidden');
},report};
byId('start').disabled=true;byId('start').textContent='PREPARING THE ISLAND…';
byId('start').addEventListener('click',()=>{
  if(!ready||failed||byId('start').disabled)return;
  try{
    byId('start').disabled=true;
    // Rendering is prepared before readiness. Keep reset/capture synchronous
    // so requestPointerLock retains this button's user activation.
    startRun();
  }catch(error){report(error);}
});
byId('retry').addEventListener('click',()=>location.reload());
byId('modesLink').addEventListener('click',()=>{location.href='modes.html';});
window.addEventListener('error',event=>{if(event.error)report(event.error);});
window.addEventListener('unhandledrejection',event=>report(event.reason));
const timeout=setTimeout(()=>{if(!ready&&!failed){byId('loading').classList.add('hidden');byId('error').classList.remove('hidden');byId('errorDetails').textContent='The island is taking too long to load. Try reloading the game.';}},45000);
import('./tide.mjs?v=208').then(()=>clearTimeout(timeout)).catch(report);
