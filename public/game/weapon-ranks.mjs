// Weapon upgrade ranks (v159). Each weapon climbs its own ladder, bought in
// order; ranks last for the run. The Glock's ladder is sold at the courtyard
// pistol bench; the Raven SMG's (v161) at either SMG rack once it is owned;
// the M12 shotgun's (v164) at any of its three racks once it is owned; the
// .450 Bushmaster's (v165) at its east-study rack once it is owned; the M4's
// (v191) at the tool-shed rack and the Warden LMG's (v191) at its cellar exhibit.
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
  ]),
  // v164: the M12's ladder, sold at any shotgun rack once it is owned. The M12
  // is semi-auto until the capstone, which turns it into a full-auto
  // drum-fed storm firing twice as fast.
  shotgun:Object.freeze([
    Object.freeze({rank:1,numeral:'I',name:'Gravedigger’s Haste',price:2000,effect:'30% faster reload',flavor:'Shells in before the soil settles.',reload:.7}),
    Object.freeze({rank:2,numeral:'II',name:'Coffin Nails',price:4000,effect:'16-round magazine',flavor:'Sixteen nails. Sixteen coffins.',mag:16}),
    Object.freeze({rank:3,numeral:'III',name:'Charnel Feast',price:8000,effect:'24-round magazine',flavor:'Twenty-four shells, and the charnel house still hungers.',mag:24}),
    Object.freeze({rank:4,numeral:'IV',name:'Requiem Storm',price:16000,effect:'Full-auto · 2× fire rate',flavor:'Hold the trigger. Let the requiem play.',capstone:true,auto:true,rate:2})
  ]),
  // v165: the .450 Bushmaster's ladder, sold at its east-study rack once it
  // is owned. Rank I trades the 10x scope for a red dot and a faster trigger;
  // the capstone all but removes recoil and doubles damage.
  bushmaster:Object.freeze([
    Object.freeze({rank:1,numeral:'I',name:'Blood Moon',price:2000,effect:'Red dot replaces the 10× scope · 50% faster fire',flavor:'The moon turns red, and so does everything beneath it.',dot:true,rate:1.5}),
    Object.freeze({rank:2,numeral:'II',name:'Bone Orchard',price:4000,effect:'16-round magazine',flavor:'Sixteen rounds to plant a bone orchard.',mag:16}),
    Object.freeze({rank:3,numeral:'III',name:'Ossuary',price:8000,effect:'24-round magazine',flavor:'Twenty-four rounds. The ossuary is never full.',mag:24}),
    Object.freeze({rank:4,numeral:'IV',name:'Executioner’s Calm',price:16000,effect:'Almost no recoil · 2× damage',flavor:'The hand is still. The verdict is final.',capstone:true,recoil:.05,damage:2})
  ]),
  // v191: the M4's ladder, sold at the tool-shed rack once it is owned. The
  // capstone's rounds burst where they strike: a 5 m blast for a third of a
  // grenade (33% of 450), which never hurts you.
  rifle:Object.freeze([
    Object.freeze({rank:1,numeral:'I',name:'Iron Psalm',price:2000,effect:'APC rounds · 25% more damage',flavor:'Armor-piercing, and soul-piercing.',damage:1.25}),
    Object.freeze({rank:2,numeral:'II',name:'Night Watch',price:4000,effect:'40-round magazine',flavor:'Forty rounds to keep the watch till dawn.',mag:40}),
    Object.freeze({rank:3,numeral:'III',name:'Long Wake',price:8000,effect:'50-round magazine',flavor:'Fifty rounds. The wake runs all night.',mag:50}),
    Object.freeze({rank:4,numeral:'IV',name:'Hellfire Litany',price:16000,effect:'Detonating rounds · 5 m blasts at 33% of a grenade',flavor:'Every round a funeral pyre.',capstone:true,detonate:Object.freeze({radius:5,fraction:.33})})
  ]),
  // v191: the Warden LMG's ladder, sold at its cellar exhibit once it is owned.
  // The capstone fires a third faster and mends 2 health for every kill it makes.
  lmg:Object.freeze([
    Object.freeze({rank:1,numeral:'I',name:'Steady Vigil',price:2000,effect:'40% more stability · less recoil',flavor:'The Warden plants its feet and does not flinch.',recoil:.6}),
    Object.freeze({rank:2,numeral:'II',name:'Iron Procession',price:4000,effect:'150-round belt',flavor:'A hundred and fifty mourners, marching in step.',mag:150}),
    Object.freeze({rank:3,numeral:'III',name:'Endless Cortège',price:8000,effect:'200-round belt',flavor:'Two hundred rounds. The procession never ends.',mag:200}),
    Object.freeze({rank:4,numeral:'IV',name:'Wrath of the Warden',price:16000,effect:'33% faster fire · +2 health per kill',flavor:'It feeds on the fallen, and grows only hungrier.',capstone:true,rate:1.33,heal:2})
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
// Full-auto capstone (v164): a semi-auto weapon fires while the trigger is held.
export function rankAuto(type,rank){return earned(type,rank).some(r=>r.auto);}
// Recoil multiplier (v165, Bushmaster capstone: .05, effectively none).
export function rankRecoil(type,rank){let k=1;for(const r of earned(type,rank))if(r.recoil!==undefined)k*=r.recoil;return k;}
// Detonating rounds (v191, M4 capstone): {radius, fraction of a grenade} or null.
export function rankDetonate(type,rank){return earned(type,rank).find(r=>r.detonate)?.detonate||null;}
// Health restored per kill made with the weapon (v191, LMG capstone: 2).
export function rankKillHeal(type,rank){let h=0;for(const r of earned(type,rank))if(r.heal)h+=r.heal;return h;}
