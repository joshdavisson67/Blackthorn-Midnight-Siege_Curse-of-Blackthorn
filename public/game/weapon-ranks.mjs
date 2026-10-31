// Weapon upgrade ranks (v159). Each weapon climbs its own ladder, bought in
// order; ranks last for the run. The Glock's ladder is sold at the courtyard
// pistol bench; the Raven SMG's (v161) at either SMG rack once it is owned.
export const WEAPON_RANKS=Object.freeze({
  glock:Object.freeze([
    Object.freeze({rank:1,numeral:'I',name:'Bloodsight',price:2000,effect:'Slide-mounted red dot',flavor:'A crimson eye that never blinks.',dot:true}),
    Object.freeze({rank:2,numeral:'II',name:'Long Vigil',price:4000,effect:'18-round magazine',flavor:'Eighteen rounds for the long night.',mag:18}),
    Object.freeze({rank:3,numeral:'III',name:'Grave Hunger',price:8000,effect:'24-round magazine',flavor:'Twenty-four rounds. The dead keep coming.',mag:24}),
    Object.freeze({rank:4,numeral:'IV',name:'Last Rites',price:16000,effect:'2× damage · 50% faster fire',flavor:'Every shot a sermon.',capstone:true,damage:2,rate:1.5})
  ]),
  // v161: the Raven's ladder. The capstone puts an MP5 in each hand (no
  // optics), firing alternately at twice the rate, with two full magazines
  // reloaded together from the same reserve.
  smg:Object.freeze([
    Object.freeze({rank:1,numeral:'I',name:'Quickened Talons',price:2000,effect:'30% faster reload',flavor:'Fresh steel before the dead draw breath.',reload:.7}),
    Object.freeze({rank:2,numeral:'II',name:'Unkindness',price:4000,effect:'70-round magazine',flavor:'A flock of seventy, and none of them kind.',mag:70}),
    Object.freeze({rank:3,numeral:'III',name:'Black Flock',price:8000,effect:'100-round magazine',flavor:'A hundred wings to blot out the moon.',mag:100}),
    Object.freeze({rank:4,numeral:'IV',name:'Twin Ravens',price:16000,effect:'Dual-wield SMGs · 2× fire rate · two magazines',flavor:'Huginn and Muninn ride again, and both are armed.',capstone:true,dual:true,rate:2})
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
// v160: the reserve grows with the magazine, so it always holds the same number
// of full magazines (the Glock keeps six: 78 / 108 / 144).
export function rankReserve(type,rank,baseMag,baseReserve){return Math.round(baseReserve*rankMagazine(type,rank,baseMag)/baseMag);}
// Damage multiplier on top of every other bonus, including the Soul Forge.
export function rankDamage(type,rank){let k=1;for(const r of earned(type,rank))if(r.damage)k*=r.damage;return k;}
// Fire-rate multiplier: the time between shots is divided by it.
export function rankFireRate(type,rank){let k=1;for(const r of earned(type,rank))if(r.rate)k*=r.rate;return k;}
export function rankHasDot(type,rank){return earned(type,rank).some(r=>r.dot);}
// Reload-time multiplier (the Raven's Quickened Talons: .7, i.e. 30% faster).
export function rankReloadTime(type,rank){let k=1;for(const r of earned(type,rank))if(r.reload)k*=r.reload;return k;}
// Dual-wield capstone: two guns, two magazines; the reserve does not grow.
export function rankDual(type,rank){return earned(type,rank).some(r=>r.dual);}
