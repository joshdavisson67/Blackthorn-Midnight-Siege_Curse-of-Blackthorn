// A shared-scores board (v214, from the mansion's leaderboard.mjs): the board itself, the
// name form, saving a finished run once (retries never count it twice), and keeping
// every unsaved run on this device for later. What a run holds, how it reads and how
// its rows are drawn come from the mode: the mansion (leaderboard.mjs) and Dead Tide
// (tide-leaderboard.mjs) each pass their own. Both pages use the same element ids.
// (v214: the Supabase helper lives here too, so the mansion still loads two leaderboard
// files, as before; leaderboard-supabase.mjs re-exports it for older pages.)

// Shared scores for the GitHub Pages build. Pages only serves static files, so
// the board lives in Supabase instead of the Cloudflare /api/leaderboard route.
// Database setup: supabase/leaderboard.sql. The publishable key is meant to be
// public; players can only call the two leaderboard functions, never the table.
export const SUPABASE_LEADERBOARD=Object.freeze({
  url:'https://rtstwkgwvxcmglxbbbyq.supabase.co',
  key:'sb_publishable_W2ol9-EXp3fHwFwZfDtO4w_cGYfFmH0'
});
export function usesSupabase(location=globalThis.location){return /\.github\.io$/i.test(location?.hostname??'');}
const reply=(data,status)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
// Returns a fetch stand-in for '/api/leaderboard' that answers in the same
// shape as server/leaderboard.mjs, so the leaderboard UI needs no changes.
// `rpc` names the two functions, so Dead Tide's board uses its own
// (supabase/dead-tide-leaderboard.sql).
export function supabaseFetcher({url,key}=SUPABASE_LEADERBOARD,fetcher=(...args)=>fetch(...args),rpc={list:'get_leaderboard',submit:'submit_score'}){
  return async(path,options={})=>{
    const posting=options.method==='POST';
    const body=posting?JSON.stringify({run:JSON.parse(options.body)}):'{}';
    const response=await fetcher(`${url}/rest/v1/rpc/${posting?rpc.submit:rpc.list}`,{
      method:'POST',signal:options.signal,cache:'no-store',body,
      headers:{apikey:key,'Content-Type':'application/json',Accept:'application/json'}
    });
    let data=null;try{data=await response.json();}catch(cause){if(cause?.name==='AbortError')throw cause;}
    if(response.ok)return reply(posting?data:{entries:Array.isArray(data)?data:null},response.status);
    // Messages from our own validation (PT4xx) are written for players; other
    // database errors are not, so they get the original server's wording.
    const own=typeof data?.code==='string'&&/^PT4\d\d$/.test(data.code)&&typeof data.message==='string';
    const fallback=posting?'The score could not be saved. Please retry; this run will only be counted once.':'The leaderboard could not load. Please try again.';
    return reply({error:own?data.message:fallback},own?response.status:503);
  };
}

const cleanName=value=>value.normalize('NFKC').trim().replace(/\s+/gu,' ');
export const formatTime=seconds=>`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
// mode: {endpoint, keys:{pending,queue,name}, refreshInterval, makeStats(input), sameRun(entry,submission),
//   summary(stats), option(run), cells(entry), listed, empty, openOnEnd}
export function createScoreboard({document,fetcher,storage,onOpen=()=>{},onNewRun=()=>{},setTimer=globalThis.setTimeout,clearTimer=globalThis.clearTimeout,requestTimeoutMs=10000,mode}){
  if(storage===undefined){try{storage=globalThis.localStorage;}catch{storage=null;}}
  const {endpoint,keys,refreshInterval}=mode,PENDING_KEY=keys.pending,QUEUE_KEY=keys.queue,NAME_KEY=keys.name;
  const retainedRun=value=>value?.stats&&typeof value.stats.id==='string'&&Number.isSafeInteger(value.stats.score);
  const confirmedScore=(data,submission)=>{const entry=data?.entry;
    return data?.saved===true&&entry&&typeof entry.id==='string'&&typeof submission.id==='string'&&entry.id.toLowerCase()===submission.id.toLowerCase()&&Number.isSafeInteger(entry.rank)&&entry.rank>0&&
      entry.name===cleanName(submission.name)&&mode.sameRun(entry,submission);};
  const el=id=>document.getElementById(id),modal=el('leaderboard'),form=el('scoreForm'),name=el('leaderboardName'),submit=el('leaderboardSubmit'),message=el('scoreSaveStatus'),body=el('leaderboardRows'),listStatus=el('leaderboardStatus'),picker=el('pendingRunPicker');
  const read=key=>{try{return storage?.getItem(key);}catch{return null;}},write=(key,value)=>{try{if(!storage)return false;if(value===null)storage.removeItem(key);else storage.setItem(key,value);return true;}catch{return false;}};
  let runs=[],pending=null,activeId=null,saving=false,storageBacked=false,loadSequence=0,lastSaved=null,returnFocus=null,refreshTimer=null,refreshController=null;
  // Keep the previous single-run key readable by older releases. The queue
  // retains every unsaved death snapshot, including a named, uncertain retry.
  let queued,legacy;
  try{queued=JSON.parse(read(QUEUE_KEY));}catch{}
  try{legacy=JSON.parse(read(PENDING_KEY));}catch{}
  for(const run of [...(Array.isArray(queued?.runs)?queued.runs:[]),legacy])if(retainedRun(run)&&!runs.some(r=>r.stats.id===run.stats.id))runs.push(run);
  const legacyCopy=runs.find(r=>r.stats.id===legacy?.stats?.id);
  if(legacyCopy&&!legacyCopy.submission&&legacy?.submission)legacyCopy.submission=legacy.submission;
  pending=runs.find(r=>r.stats.id===legacy?.stats?.id)||runs.find(r=>r.stats.id===queued?.selectedId)||runs.at(-1)||null;
  name.value=read(NAME_KEY)||'';
  function persist(){
    const queueSaved=write(QUEUE_KEY,runs.length?JSON.stringify({runs,selectedId:pending?.stats.id}):null);
    const legacySaved=write(PENDING_KEY,pending?JSON.stringify(pending):null);
    storageBacked=queueSaved||(runs.length<=1&&legacySaved);
  }
  if(runs.length)persist();
  function captureDraft(){if(pending&&!pending.submission)pending.draftName=name.value;}
  function showMessage(text,error=false){message.textContent=text;message.classList.toggle('saveError',error);}
  function retainedMessage(){return storageBacked?'This run is kept on this device for retry.':'Keep this tab open to retry; browser storage is unavailable.';}
  function renderForm(){
    const stats=pending?.stats;form.classList.toggle('hidden',!stats);el('runSummary').classList.toggle('hidden',!stats);
    el('pendingRunPickerLabel')?.classList.toggle('hidden',runs.length<2);
    if(picker){
      picker.replaceChildren();
      for(const run of runs){const option=document.createElement('option');option.value=run.stats.id;option.textContent=`${mode.option(run.stats)}${run.submission?' · Retry':''}`;option.selected=run===pending;picker.appendChild(option);}
      picker.disabled=saving;
    }
    if(stats){
      el('runSummary').textContent=mode.summary(stats);
      name.value=pending.submission?.name??pending.draftName??read(NAME_KEY)??'';name.readOnly=saving||!!pending.submission;
      submit.disabled=saving;submit.textContent=pending.submission?'RETRY SAVING SCORE':'ADD MY SCORE';
    }
    el('leaderboardNewRun').classList.toggle('hidden',!activeId);
  }
  async function request(options){
    const controller=new AbortController(),abort=()=>controller.abort();let rejectAbort;
    const interrupted=new Promise((_,reject)=>{rejectAbort=reject;}),onAbort=()=>rejectAbort(new DOMException('Connection timed out.','AbortError'));
    controller.signal.addEventListener('abort',onAbort,{once:true});
    const timeout=setTimeout(abort,requestTimeoutMs);
    options.signal?.addEventListener('abort',abort,{once:true});if(options.signal?.aborted)abort();
    try{
      const perform=async()=>{
        if(controller.signal.aborted)throw new DOMException('Request cancelled.','AbortError');
        const response=await fetcher(endpoint,{...options,signal:controller.signal,credentials:'same-origin',cache:'no-store'});
        const access=response.status===401||response.status===403||response.redirected;
        let data;try{data=await response.json();}catch(cause){
          if(cause.name==='AbortError')throw cause;
          const error=new Error(access?'Scores could not be accessed. Reopen the shared game link and retry.':'The score service returned an unexpected response. Please retry.');error.status=response.status;throw error;
        }
        if(!response.ok){const error=new Error(typeof data?.error==='string'?data.error:access?'Scores could not be accessed. Reopen the shared game link and retry.':'Please try again.');error.status=response.status;throw error;}
        return data;
      };
      return await Promise.race([perform(),interrupted]);
    }finally{clearTimeout(timeout);controller.signal.removeEventListener('abort',onAbort);options.signal?.removeEventListener('abort',abort);}
  }
  function cancelTimer(){if(refreshTimer!==null)clearTimer(refreshTimer);refreshTimer=null;}
  function stopRefresh(){cancelTimer();loadSequence++;refreshController?.abort();refreshController=null;el('leaderboardRefresh').disabled=false;}
  function scheduleRefresh(){if(modal.classList.contains('hidden')||document.hidden)return;refreshTimer=setTimer(()=>{refreshTimer=null;refresh();},refreshInterval);}
  async function refresh(){
    cancelTimer();refreshController?.abort();const controller=new AbortController();refreshController=controller;
    const sequence=++loadSequence;listStatus.textContent='Loading shared scores…';el('leaderboardRefresh').disabled=true;
    try{
      const data=await request({method:'GET',signal:controller.signal});if(sequence!==loadSequence)return;
      if(!Array.isArray(data?.entries))throw new Error('The shared leaderboard could not load. Please retry.');
      body.replaceChildren();for(const entry of data.entries){const row=document.createElement('tr');if(entry.id===lastSaved)row.className='myScore';for(const value of mode.cells(entry)){const cell=document.createElement('td');cell.textContent=String(value);row.appendChild(cell);}body.appendChild(row);}
      listStatus.textContent=data.entries.length?mode.listed:mode.empty;
    }catch(error){if(sequence===loadSequence)listStatus.textContent=body.children.length?'Could not refresh. Showing last scores; we’ll retry automatically.':error.name==='AbortError'?'Connection timed out. Use Refresh to try again.':error.message||'Scores could not load. Use Refresh to try again.';}
    finally{if(sequence===loadSequence){refreshController=null;el('leaderboardRefresh').disabled=false;scheduleRefresh();}}
  }
  function open(){returnFocus=document.activeElement;onOpen();modal.classList.remove('hidden');renderForm();if(pending&&!message.textContent)showMessage(pending.error?`${pending.error} ${retainedMessage()}`:'Add your name to share this run. Saving is optional.',!!pending.error);refresh();if(pending)name.focus();else el('leaderboardClose').focus();}
  function close(){captureDraft();if(runs.length)persist();stopRefresh();modal.classList.add('hidden');returnFocus?.focus?.();}
  function startRun(){activeId=globalThis.crypto.randomUUID();lastSaved=null;showMessage('');close();}
  function endRun(input){
    if(!activeId)activeId=globalThis.crypto.randomUUID();captureDraft();
    let run=runs.find(r=>r.stats.id===activeId);
    if(!run){run={stats:{id:activeId,...mode.makeStats(input)},submission:null};runs.push(run);}
    pending=run;persist();showMessage(`Add your name to share this run. Saving is optional.${runs.length>1?(picker?' Earlier unsaved runs are available above.':' Earlier unsaved runs are kept for later.'):''}`);
    if(mode.openOnEnd!==false)open();
    return run.stats;
  }
  async function save(event){
    event?.preventDefault();if(!pending||saving)return;
    const value=cleanName(name.value);
    if(!value||[...value].length>24||/[<>\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯]/u.test(value)){showMessage('Enter a name of 1–24 characters.',true);return;}
    const run=pending;run.draftName=value;run.error=null;if(!run.submission)run.submission={...run.stats,name:value};persist();saving=true;renderForm();submit.textContent='SAVING…';showMessage('Saving your run…');
    try{
      const result=await request({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(run.submission)});
      if(!confirmedScore(result,run.submission))throw new Error('The server did not confirm this score. Please retry the same run.');
      lastSaved=result.entry.id;write(NAME_KEY,result.entry.name);runs=runs.filter(r=>r!==run);
      const selected=pending===run;if(selected)pending=runs.at(-1)||null;persist();
      if(selected)showMessage(`Saved! ${result.entry.name} is ranked #${result.entry.rank}.${runs.length?` ${runs.length} earlier unsaved run${runs.length===1?' remains':'s remain'} available to save.`:''}`);
      if(!modal.classList.contains('hidden'))refresh();
    }catch(error){
      if(error.status===400)run.submission=null;
      run.error=error.name==='AbortError'?'Connection timed out. Retry to save this same run.':error.message||'Could not save.';persist();
      if(pending===run)showMessage(`${run.error} ${retainedMessage()}`,true);
    }finally{saving=false;renderForm();}
  }
  picker?.addEventListener('change',()=>{if(saving)return;const run=runs.find(r=>r.stats.id===picker.value);if(!run)return;captureDraft();pending=run;persist();renderForm();showMessage(run.error?`${run.error} ${retainedMessage()}`:'Add your name to share this run. Saving is optional.',!!run.error);name.focus();});
  name.addEventListener('input',captureDraft);
  form.addEventListener('submit',save);el('leaderboardRefresh').addEventListener('click',refresh);el('leaderboardClose').addEventListener('click',close);el('leaderboardNewRun').addEventListener('click',()=>{close();onNewRun();});
  for(const id of ['leaderboardMenu','leaderboardPause','leaderboardDead'])el(id)?.addEventListener('click',open);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopRefresh();else if(!modal.classList.contains('hidden'))refresh();});
  return {startRun,endRun,open,close,refresh,save,get visible(){return !modal.classList.contains('hidden');},get pending(){return pending?.stats??null;}};
}
