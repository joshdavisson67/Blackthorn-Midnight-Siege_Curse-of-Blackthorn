// The weapon table, the aimed field of view and each weapon's controller rumble (v204,
// Dead Tide step 2), shared by every mode. Moved unchanged from core.mjs and game.js,
// so a mode can load its guns without the mansion's layouts; core.mjs re-exports the
// table and the field of view for the mansion.
export const weapons={
  glock:{name:'GLOCK 21 / .45 PISTOL',mag:13,reserve:78,damage:32,rate:.24,reload:1.8,pellets:1,spread:.018,aimSpread:.002,semiAuto:true},
  lmg:{name:'WARDEN / BELT-FED LMG',mag:100,reserve:500,damage:62,rate:.09,reload:5.2,pellets:1,spread:.021,zoom:3},
  rifle:{name:'M4 / ASSAULT RIFLE',mag:30,reserve:180,damage:36,rate:.12,reload:2.3,pellets:1,spread:.013},
  shotgun:{name:'M12 / COMBAT SHOTGUN',mag:8,reserve:56,damage:25,rate:.626,reload:2.8,pellets:8,spread:.072,semiAuto:true},
  smg:{name:'RAVEN / SUBMACHINE GUN',mag:40,reserve:240,damage:29,rate:.075,reload:2.0,pellets:1,spread:.02},
  bushmaster:{name:'AR-15 / .450 BUSHMASTER',mag:8,reserve:48,damage:72,rate:.25,reload:2.8,pellets:1,spread:.009,aimSpread:.0005,semiAuto:true,zoom:10},
  // v205: the katana cuts instead of firing (katana.mjs). It has no magazine, no reserve
  // and no reload; holding the trigger keeps slashing.
  katana:{name:'TSURU / KATANA',mag:0,reserve:0,damage:150,rate:.48,reload:0,pellets:0,spread:0,melee:true}
};
export function weaponAimFov(type,baseFov=75){
  if(weapons[type].melee)return baseFov;
  const zoom=weapons[type].zoom;
  // Magnification scales the perspective projection, not the angle itself.
  return zoom?2*Math.atan(Math.tan(baseFov*Math.PI/360)/zoom)*180/Math.PI:type==='rifle'?48:56;
}
// How hard a controller rumbles for each weapon's shot: strong motor, weak motor, ms.
export const SHOT_RUMBLE={glock:[.08,.32,55],shotgun:[.75,.5,120],smg:[.05,.22,40],lmg:[.2,.35,55],bushmaster:[.45,.4,80],rifle:[.12,.3,50],katana:[.12,.28,70]};
