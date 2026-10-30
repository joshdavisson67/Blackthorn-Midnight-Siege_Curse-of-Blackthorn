// Weapon upgrade ranks (v159). Each weapon climbs its own ladder, bought in
// order; ranks last for the run. The Glock's ladder is sold at the courtyard
// pistol bench. Other weapons will join one at a time.
export const WEAPON_RANKS=Object.freeze({
  glock:Object.freeze([
    Object.freeze({rank:1,numeral:'I',name:'Bloodsight',price:2000,effect:'Slide-mounted red dot',flavor:'A crimson eye that never blinks.',dot:true}),
    Object.freeze({rank:2,numeral:'II',name:'Long Vigil',price:4000,effect:'18-round magazine',flavor:'Eighteen rounds for the long night.',mag:18}),
    Object.freeze({rank:3,numeral:'III',name:'Grave Hunger',price:8000,effect:'24-round magazine',flavor:'Twenty-four rounds. The dead keep coming.',mag:24}),
    Object.freeze({rank:4,numeral:'IV',name:'Last Rites',price:16000,effect:'2× damage · 50% faster fire',flavor:'Every shot a sermon.',capstone:true,damage:2,rate:1.5})
  ])
});

export function rankLadder(type){return WEAPON_RANKS[type]||[];}
export function maxRank(type){return rankLadder(type).length;}
export function rankInfo(type,rank){return rankLadder(type)[rank-1]||null;}
export function nextRank(type,rank=0){return rankLadder(type)[rank]||null;}
// Ranks earned so far, oldest first.
function earned(type,rank){return rankLadder(type).slice(0,Math.max(0,rank));}
// Base magazine before the Soul Forge's capacity bonus is applied.
export function rankMagazine(type,rank,base){let mag=base;for(const r of earned(type,rank))if(r.mag)mag=r.mag;return mag;}
// Damage multiplier on top of every other bonus, including the Soul Forge.
export function rankDamage(type,rank){let k=1;for(const r of earned(type,rank))if(r.damage)k*=r.damage;return k;}
// Fire-rate multiplier: the time between shots is divided by it.
export function rankFireRate(type,rank){let k=1;for(const r of earned(type,rank))if(r.rate)k*=r.rate;return k;}
export function rankHasDot(type,rank){return earned(type,rank).some(r=>r.dot);}
