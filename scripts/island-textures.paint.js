// Dead Tide's island textures (v215, the art pass), painted on canvases in a browser page by
// scripts/island-textures.mjs. Everything here is seeded, so every run paints the same pixels.
// Opaque textures tile seamlessly: their noise is periodic and their strokes wrap. The alpha
// cards (fronds, ferns, grass, vines, leaves) are single sprites on a transparent ground.
// Nothing is copied from elsewhere: noise, cells and strokes only.
(()=>{
'use strict';
// ---- Noise ---------------------------------------------------------------------------------
const hash=(x,y,s)=>{let h=(Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(s,1442695041))|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;};
const wrap=(a,p)=>((a%p)+p)%p;
// Value noise with period p (in lattice cells), smoothed.
function vnoise(x,y,p,s){const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
  const a=hash(wrap(xi,p),wrap(yi,p),s),b=hash(wrap(xi+1,p),wrap(yi,p),s),c=hash(wrap(xi,p),wrap(yi+1,p),s),d=hash(wrap(xi+1,p),wrap(yi+1,p),s);
  return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;}
// Fractal noise over a [0,1) square that tiles: `p` cells across at the first octave.
function fbm(u,v,p,oct=5,s=1){let t=0,a=.5,n=0;for(let i=0;i<oct;i++){const f=1<<i;t+=a*vnoise(u*p*f,v*p*f,p*f,s+i*31);n+=a;a*=.5;}return t/n;}
// Anisotropic fractal noise (px cells across, py down), tiling in both directions.
function afbm(u,v,px,py,oct=4,s=1){let t=0,a=.5,n=0;for(let i=0;i<oct;i++){const f=1<<i;t+=a*vnoise2(u*px*f,v*py*f,px*f,py*f,s+i*31);n+=a;a*=.5;}return t/n;}
function vnoise2(x,y,p,q,s){const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
  const a=hash(wrap(xi,p),wrap(yi,q),s),b=hash(wrap(xi+1,p),wrap(yi,q),s),c=hash(wrap(xi,p),wrap(yi+1,q),s),d=hash(wrap(xi+1,p),wrap(yi+1,q),s);
  return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;}
// Cells (Worley), periodic: nearest and second-nearest feature distances, and the nearest cell's id.
function cells(u,v,p,s,jitter=.9){const x=u*p,y=v*p,xi=Math.floor(x),yi=Math.floor(y);let f1=9,f2=9,id=0;
  for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const cx=xi+i,cy=yi+j,wx=wrap(cx,p),wy=wrap(cy,p);
    const fx=cx+.5+(hash(wx,wy,s)-.5)*jitter,fy=cy+.5+(hash(wx,wy,s+7)-.5)*jitter,d=Math.hypot(fx-x,fy-y);
    if(d<f1){f2=f1;f1=d;id=wy*p+wx;}else if(d<f2)f2=d;}
  return {f1,f2,id};}
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const shade=(c,k)=>[c[0]*k,c[1]*k,c[2]*k];
let seed=1;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};

// ---- Canvases ---------------------------------------------------------------------------------
function canvas(n){const c=document.createElement('canvas');c.width=c.height=n;return c;}
// Paint every pixel from f(u, v) -> [r, g, b] (0-255).
function pixels(n,f){const c=canvas(n),x=c.getContext('2d'),img=x.createImageData(n,n),d=img.data;
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const k=(j*n+i)*4,col=f((i+.5)/n,(j+.5)/n);d[k]=clamp(col[0],0,255);d[k+1]=clamp(col[1],0,255);d[k+2]=clamp(col[2],0,255);d[k+3]=255;}
  x.putImageData(img,0,0);return c;}
// Draw something nine times round the tile so strokes crossing an edge come back on the other side.
function wrapped(c,draw){const x=c.getContext('2d'),n=c.width;for(const dx of [-n,0,n])for(const dy of [-n,0,n]){x.save();x.translate(dx,dy);draw(x,n);x.restore();}}
// Per-pixel pass over an existing canvas.
function post(c,f){const x=c.getContext('2d'),n=c.width,img=x.getImageData(0,0,n,n),d=img.data;
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const k=(j*n+i)*4,o=f((i+.5)/n,(j+.5)/n,[d[k],d[k+1],d[k+2]]);d[k]=clamp(o[0],0,255);d[k+1]=clamp(o[1],0,255);d[k+2]=clamp(o[2],0,255);}
  x.putImageData(img,0,0);return c;}
const rgb=(c,a=1)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;

// ---- Ground ---------------------------------------------------------------------------------------
// Pale coral sand: broad drifts, wind ripples, grain, and specks of shell and dark grit.
function sand(n){
  seed=11;
  const c=pixels(n,(u,v)=>{
    const broad=fbm(u,v,3,4,5),ripple=Math.sin(2*Math.PI*(u*21+v*7)+fbm(u,v,4,3,9)*7),grain=hash(Math.floor(u*n),Math.floor(v*n),3)-.5;
    let col=mix([196,183,152],[214,202,174],broad);col=shade(col,1+ripple*.035+grain*.09);
    const damp=smooth(.58,.75,fbm(u,v,5,4,13));col=mix(col,[160,148,122],damp*.35);
    return col;});
  wrapped(c,(x,n)=>{seed=12;for(let i=0;i<1700;i++){const px=rand()*n,py=rand()*n,r=.6+rand()*1.6,t=rand();x.fillStyle=t<.5?'rgba(70,62,50,.45)':t<.85?'rgba(245,238,222,.55)':'rgba(200,150,130,.45)';x.beginPath();x.ellipse(px,py,r,r*(.5+rand()*.5),rand()*3,0,7);x.fill();}});
  return c;}
// Grass and jungle floor: tufted greens over leaf litter and soil.
function grass(n){
  seed=21;
  const c=pixels(n,(u,v)=>{const g=fbm(u,v,4,5,21),l=fbm(u,v,6,4,23),grain=hash(Math.floor(u*n),Math.floor(v*n),5)-.5;
    let col=mix([40,58,30],[70,92,44],g);col=mix(col,[86,74,48],smooth(.55,.75,l)*.6);return shade(col,1+grain*.12);});
  wrapped(c,(x,n)=>{seed=22;x.lineCap='round';
    // Fallen leaves first, then the blades over them.
    for(let i=0;i<500;i++){const px=rand()*n,py=rand()*n,len=3+rand()*6,t=rand();x.fillStyle=t<.5?'rgba(96,78,46,.7)':t<.8?'rgba(120,98,52,.6)':'rgba(70,84,40,.7)';x.save();x.translate(px,py);x.rotate(rand()*6.3);x.beginPath();x.ellipse(0,0,len,len*.38,0,0,7);x.fill();x.restore();}
    for(let i=0;i<16000;i++){const px=rand()*n,py=rand()*n,a=rand()*6.3,len=3+rand()*9,t=rand();
      x.strokeStyle=t<.3?'rgba(110,140,64,.55)':t<.6?'rgba(54,82,34,.6)':t<.85?'rgba(80,110,48,.55)':'rgba(140,150,80,.4)';x.lineWidth=.7+rand()*.9;
      x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+Math.cos(a)*len*.5+rand()*2,py+Math.sin(a)*len*.5,px+Math.cos(a)*len,py+Math.sin(a)*len);x.stroke();}});
  return c;}
// Earth and mud: brown soil, damp darker patches, pebbles and twigs.
function dirt(n){
  seed=31;
  const c=pixels(n,(u,v)=>{const b=fbm(u,v,4,5,31),wet=smooth(.5,.72,fbm(u,v,3,4,33)),grain=hash(Math.floor(u*n),Math.floor(v*n),7)-.5,peb=cells(u,v,40,35,.9);
    let col=mix([92,76,56],[124,104,78],b);col=mix(col,[62,52,40],wet*.55);
    const stone=smooth(.24,.16,peb.f1)*(hash(peb.id,1,36)>.84?1:0);col=mix(col,mix([116,106,92],[82,74,62],hash(peb.id,2,37)),stone*.7);
    return shade(col,1+grain*.14-(stone>0?0:smooth(.3,.42,peb.f1)*0));});
  wrapped(c,(x,n)=>{seed=32;x.lineCap='round';for(let i=0;i<160;i++){const px=rand()*n,py=rand()*n,a=rand()*6.3,len=6+rand()*16;x.strokeStyle='rgba(58,44,30,.55)';x.lineWidth=1+rand();x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(a)*len,py+Math.sin(a)*len);x.stroke();}});
  return c;}
// Bare rock: weathered grey stone, its few cracks wandering, with lichen and moss.
function rock(n){
  return pixels(n,(u,v)=>{const b=fbm(u,v,4,6,41),wu=u+(fbm(u,v,3,3,42)-.5)*.18,wv=v+(fbm(u,v,3,3,49)-.5)*.18;
    const c1=cells(wrap(wu,1),wrap(wv,1),5,43,1),grain=hash(Math.floor(u*n),Math.floor(v*n),9)-.5,strata=Math.sin(2*Math.PI*(v*6+u*2)+fbm(u,v,4,4,46)*5);
    let col=mix([84,84,80],[140,138,130],b);col=shade(col,.92+.16*hash(c1.id,3,45)+strata*.04);
    const crack=smooth(.035,0,c1.f2-c1.f1)*smooth(.35,.6,fbm(u,v,6,3,44));col=shade(col,1-crack*.6);
    const lichen=smooth(.64,.76,fbm(u,v,8,4,47));col=mix(col,[150,156,112],lichen*.4);
    const moss=smooth(.66,.8,fbm(u,v,5,4,48));col=mix(col,[62,80,46],moss*.5);
    return shade(col,1+grain*.12);});}

// ---- Built things -------------------------------------------------------------------------------------
// Weathered concrete: board-formed lifts, pits, water stains run down from every lift line.
function concrete(n){
  seed=51;
  return pixels(n,(u,v)=>{const b=fbm(u,v,4,5,51),streak=afbm(u,v,24,3,4,53),pits=hash(Math.floor(u*n*.5),Math.floor(v*n*.5),55),grain=hash(Math.floor(u*n),Math.floor(v*n),11)-.5;
    let col=mix([118,118,110],[156,154,144],b);
    const lift=(v*4)%1,line=smooth(.012,.0,Math.min(lift,1-lift));col=shade(col,1-line*.3);       // the formwork's lift lines
    col=shade(col,1-smooth(.5,.8,streak)*.3*(.4+.6*lift));                                   // stains running down from each lift
    if(pits>.985)col=shade(col,.55);
    col=mix(col,[70,80,58],smooth(.7,.85,fbm(u,v,6,4,57))*.4);                                // moss and damp
    return shade(col,1+grain*.08);});}
// Camouflage over concrete: olive and faded peach in hard-edged blots, chipped to the concrete.
function camo(n){
  const base=concrete(n);
  return post(base,(u,v,c)=>{const n1=fbm(u,v,3,4,61),edge=fbm(u,v,24,3,63)*.06,chip=fbm(u,v,28,4,65),wear=fbm(u,v,5,3,66);
    const peach=[206,150,112],olive=[90,94,58];
    let paint=n1+edge<.5?peach:olive;paint=shade(paint,.86+.24*fbm(u,v,7,4,67));
    const k=chip>.62+.12*wear?0:.92;       // chips where the paint has flaked
    const lum=(c[0]+c[1]+c[2])/3/140;       // the concrete's own stains show through
    return mix(c,shade(paint,.75+.35*lum),k);});}
// Ruin stone: ashlar courses of grey limestone, chipped edges, moss in the joints and on top.
function stone(n){
  seed=71;const rows=4;
  // Each course: blocks of random widths that tile across.
  const courses=Array.from({length:rows},(_,r)=>{const widths=[];let left=1;while(left>.001){let w=.18+hash(r,widths.length,73)*.22;if(left-w<.12)w=left;widths.push(w);left-=w;}
    const off=hash(r,9,74);let x=off,starts=[];for(const w of widths){starts.push([x,w]);x+=w;}return starts;});
  return pixels(n,(u,v)=>{const r=Math.floor(v*rows),fv=v*rows-r,course=courses[r];
    let bi=0,fu=0,w=1;for(let i=0;i<course.length;i++){const [s,wd]=course[i],d=wrap(u-s,1);if(d<wd){bi=i;fu=d/wd;w=wd;break;}}
    const id=r*31+bi,edgeU=Math.min(fu,1-fu)*w*rows,edgeV=Math.min(fv,1-fv),edge=Math.min(edgeU,edgeV);
    const b=fbm(u,v,6,5,75),grain=hash(Math.floor(u*n),Math.floor(v*n),13)-.5,pit=hash(Math.floor(u*n*.5),Math.floor(v*n*.5),14),weather=fbm(u,v,16,4,15);
    let col=mix([98,98,90],[154,150,138],b*.6+weather*.4);col=shade(col,.8+.32*hash(id,1,76));if(pit>.97)col=shade(col,.62);
    col=mix(col,[92,84,70],smooth(.6,.8,fbm(u,v,10,3,16))*.35);                  // iron-brown weathering
    const chip=fbm(u,v,30,3,77)*.04;const joint=smooth(.022+chip,.006,edge);
    col=shade(col,1-smooth(.12,.02,edge)*.16);                                   // worn arrises
    col=mix(col,[58,60,52],joint*.85);                                           // the joints
    const moss=smooth(.6,.76,fbm(u,v,5,4,78)+smooth(.3,0,fv)*.14+joint*.18);col=mix(col,mix([44,64,32],[70,92,44],fbm(u,v,14,3,82)),moss*.7);   // moss: in patches, on top of each course and in its joints
    const cc=cells(u,v,9,79,1),crack=smooth(.018,0,cc.f2-cc.f1)*(hash(cc.id,4,80)>.82?1:0);col=shade(col,1-crack*.45);
    return shade(col,1+grain*.1);});}
// Paving: irregular flags with grass and soil in the gaps.
function paving(n){
  return pixels(n,(u,v)=>{const c=cells(u,v,6,81,.85),gap=c.f2-c.f1,b=fbm(u,v,8,5,83),grain=hash(Math.floor(u*n),Math.floor(v*n),15)-.5;
    let col=mix([112,110,100],[150,146,132],b);col=shade(col,.85+.25*hash(c.id,1,84));
    col=shade(col,1-smooth(.14,.05,gap)*.2);
    const crack=smooth(.025,0,cells(u,v,17,85,1).f2-cells(u,v,17,85,1).f1)*(hash(c.id,3,86)>.55?1:0);col=shade(col,1-crack*.45);
    col=mix(col,[56,82,38],smooth(.62,.78,fbm(u,v,6,4,87))*.6);                // moss creeping over the flags
    col=mix(col,mix([46,64,30],[70,58,40],fbm(u,v,20,3,88)),smooth(.07,.035,gap));   // grass and soil between them
    return shade(col,1+grain*.1);});}
// Rusted steel plate: deep rust, brighter where it is flaking, streaks running down from every
// seam, a little old dark paint left; the plates' seams and rivets.
function rust(n){
  seed=91;
  const c=pixels(n,(u,v)=>{const b=fbm(u,v,5,6,91),streak=afbm(u,v,36,2,4,93),fine=afbm(u,v,90,6,3,94),blot=fbm(u,v,9,4,95),grain=hash(Math.floor(u*n),Math.floor(v*n),17)-.5;
    let col=mix([64,34,22],[112,58,32],b);col=mix(col,[150,82,40],smooth(.62,.82,blot)*.6);
    col=shade(col,1-smooth(.4,.75,streak)*.42);col=mix(col,[168,96,48],smooth(.74,.88,streak)*.45);col=shade(col,.92+.16*fine);
    const paint=smooth(.68,.72,fbm(u,v,4,4,97));col=mix(col,mix([38,38,36],[56,54,50],b),paint*.75*(1-smooth(.6,.8,blot)));   // what's left of the dark paint
    const plateV=(v*2)%1,plateU=(u*2+Math.floor(v*2)*.5)%1,seam=smooth(.005,0,Math.min(plateV,1-plateV))+smooth(.005,0,Math.min(plateU,1-plateU));col=shade(col,1-clamp(seam)*.45);
    col=shade(col,1-smooth(.06,0,plateV)*.18);                                     // rust weeping below each seam
    return shade(col,1+grain*.14);});
  wrapped(c,(x,n)=>{// rivets along the seams
    for(let row=0;row<2;row++)for(let k=0;k<32;k++){const px=k/32*n,py=row*n/2+n*.012;x.fillStyle='rgba(40,20,12,.7)';x.beginPath();x.arc(px,py,1.6,0,7);x.fill();x.fillStyle='rgba(190,120,70,.5)';x.beginPath();x.arc(px-.4,py-.4,.8,0,7);x.fill();}});
  return c;}
// Weathered timber: grey boards, raised grain, gaps, butt joints and nails.
function wood(n){
  seed=101;const boards=6;
  const joints=Array.from({length:boards},(_,b)=>hash(b,1,102));
  const c=pixels(n,(u,v)=>{const b=Math.floor(v*boards),fv=v*boards-b,j=joints[b],run=wrap(u-j,1),seg=run<.55?0:1,id=b*2+seg;
    const tone=hash(id,3,103),grain=afbm(u,v,2,boards*14,5,105+id),fine=hash(Math.floor(u*n),Math.floor(v*n),19)-.5;
    let col=mix([96,86,72],[150,140,124],tone*.7+grain*.3);col=shade(col,.82+.36*grain);
    col=mix(col,[78,64,46],smooth(.55,.75,fbm(u,v,4,4,107))*.35);              // darker, damper wood
    const gap=smooth(.05,0,Math.min(fv,1-fv)),butt=smooth(.004,0,Math.min(Math.abs(run-.55),run,1-run));col=shade(col,1-gap*.75-butt*.6);
    return shade(col,1+fine*.1);});
  wrapped(c,(x,n)=>{for(let b=0;b<boards;b++)for(const at of [joints[b]+.02,joints[b]+.53,joints[b]+.57,joints[b]+1.0-.02]){const px=wrap(at,1)*n;for(const off of [.3,.7]){x.fillStyle='rgba(44,34,26,.8)';x.beginPath();x.arc(px,(b+off)/boards*n,1.5,0,7);x.fill();}}});
  return c;}
// Thatch: courses of straw laid downward, each course shading the one below.
function thatch(n){
  seed=111;const courses=5;
  const c=pixels(n,(u,v)=>{const fv=(v*courses)%1,b=fbm(u,v,8,3,111);let col=mix([92,74,44],[150,124,76],b);return shade(col,.6+.5*fv);});
  wrapped(c,(x,n)=>{x.lineCap='round';for(let k=0;k<courses;k++)for(let i=0;i<1400;i++){const px=rand()*n,top=k/courses*n-n*.04+rand()*n*.05,len=n/courses*(.8+rand()*.5),lean=(rand()-.5)*8,t=rand();
    x.strokeStyle=t<.4?'rgba(178,150,96,.55)':t<.75?'rgba(120,98,60,.6)':'rgba(70,56,36,.6)';x.lineWidth=.8+rand()*1.2;x.beginPath();x.moveTo(px,top);x.quadraticCurveTo(px+lean*.4,top+len*.5,px+lean,top+len);x.stroke();}});
  return c;}
// Canvas: a coarse weave, faded olive, mildewed and stained.
function cloth(n){
  return pixels(n,(u,v)=>{const weave=.5+.25*Math.sin(u*n*Math.PI*.5)+.25*Math.sin(v*n*Math.PI*.5),b=fbm(u,v,4,5,121),stain=smooth(.6,.78,fbm(u,v,5,4,123)),mildew=smooth(.68,.8,fbm(u,v,12,3,125));
    let col=mix([104,102,74],[138,132,98],b);col=shade(col,.9+.12*weave);col=mix(col,[70,66,48],stain*.45);col=mix(col,[52,60,40],mildew*.5);return col;});}
// A palm's trunk: rings of old leaf bases, grey-brown, with fibre between.
function bark(n){
  return pixels(n,(u,v)=>{const ring=(v*10+fbm(u,v,4,3,131)*.3)%1,scar=Math.abs(Math.sin((u*8+(Math.floor(v*10)%2)*.5)*Math.PI)),b=fbm(u,v,6,5,133),fibre=afbm(u,v,40,6,3,135);
    let col=mix([78,68,56],[128,114,94],b);col=shade(col,.75+.35*smooth(0,.6,ring)*(1-.25*scar));col=shade(col,1-smooth(.92,1,ring)*.45);col=mix(col,[60,50,40],smooth(.55,.75,fibre)*.3);return col;});}

// ---- Cards with alpha ---------------------------------------------------------------------------
// A leaflet: a slim leaf from (x0, y0) along angle a, length len, width w.
function leaf(x,x0,y0,a,len,w,fill,vein){x.save();x.translate(x0,y0);x.rotate(a);x.beginPath();x.moveTo(0,0);x.quadraticCurveTo(len*.45,-w,len,0);x.quadraticCurveTo(len*.45,w,0,0);x.fillStyle=fill;x.fill();
  if(vein){x.strokeStyle=vein;x.lineWidth=Math.max(.6,w*.12);x.beginPath();x.moveTo(0,0);x.lineTo(len*.95,0);x.stroke();}x.restore();}
// A palm frond: the rachis runs left (base) to right (tip) across the middle; leaflets either side, swept toward the tip.
function frond(n){
  seed=141;const c=canvas(n),x=c.getContext('2d'),mid=n/2;
  for(let i=0;i<64;i++){const t=.06+i/64*.92,px=t*n,len=n*.44*Math.sin(Math.PI*Math.min(1,t*1.1))*(.75+rand()*.3),w=n*.022*(1-t*.4),brown=rand()<.12;
    for(const side of [-1,1]){const a=side*(1.05-.55*t)+(rand()-.5)*.15;const g=60+rand()*40;
      leaf(x,px,mid,a,len,w,brown?`rgb(${120+rand()*30|0},${100+rand()*20|0},${54})`:`rgb(${36+rand()*18|0},${g|0},${30+rand()*16|0})`,'rgba(140,170,90,.5)');}}
  x.strokeStyle='rgb(112,120,70)';x.lineWidth=n*.012;x.lineCap='round';x.beginPath();x.moveTo(0,mid);x.quadraticCurveTo(n*.5,mid-n*.01,n,mid);x.stroke();
  return c;}
// A fern frond: pinnae either side of the stem, each a row of overlapping lobed leaflets.
function fern(n){
  seed=151;const c=canvas(n),x=c.getContext('2d'),mid=n/2;
  for(let i=0;i<34;i++){const t=.04+i/34*.94,px=t*n,len=n*.34*Math.sin(Math.PI*Math.min(1,t*1.05))*(.85+rand()*.2);
    for(const side of [-1,1]){const a=side*(1.2-.55*t)+(rand()-.5)*.08;x.save();x.translate(px,mid);x.rotate(a);
      for(let k=0;k<10;k++){const s=k/10,w=len*.075*(1-s*.7),g=78+rand()*34;
        for(const sd of [-1,1])leaf(x,len*s,0,sd*1.05,w*2.1,w*.75,`rgb(${44+rand()*14|0},${g|0},${34+rand()*12|0})`,null);}
      x.strokeStyle='rgb(66,92,42)';x.lineWidth=Math.max(1,n*.003);x.beginPath();x.moveTo(0,0);x.lineTo(len,0);x.stroke();x.restore();}}
  x.strokeStyle='rgb(70,96,44)';x.lineWidth=n*.008;x.beginPath();x.moveTo(0,mid);x.lineTo(n,mid);x.stroke();
  return c;}
// A grass tuft: blades rising from the bottom middle, fanning out.
function tuft(n){
  seed=161;const c=canvas(n),x=c.getContext('2d');x.lineCap='round';
  for(let i=0;i<140;i++){const base=n*(.3+rand()*.4),a=(rand()-.5)*1.3,len=n*(.45+rand()*.5),bend=(rand()-.5)*n*.25,t=rand();
    x.strokeStyle=t<.35?'rgb(92,124,56)':t<.7?'rgb(64,96,40)':t<.9?'rgb(128,140,74)':'rgb(150,132,80)';x.lineWidth=n*(.006+rand()*.01);
    const tx=base+Math.sin(a)*len+bend,ty=n-Math.cos(a)*len;x.beginPath();x.moveTo(base,n);x.quadraticCurveTo(base+Math.sin(a)*len*.4,n-Math.cos(a)*len*.6,tx,ty);x.stroke();}
  return c;}
// Hanging vines with ivy leaves and a few pale flowers, from the top edge down.
function vines(n){
  seed=171;const c=canvas(n),x=c.getContext('2d');x.lineCap='round';
  for(let s=0;s<9;s++){let px=n*(.06+s/9*.88+(rand()-.5)*.05),py=0;const len=n*(.45+rand()*.55),steps=40;
    x.strokeStyle='rgb(58,70,36)';x.lineWidth=n*.006;x.beginPath();x.moveTo(px,py);const pts=[];
    for(let k=0;k<steps;k++){px+=(rand()-.5)*n*.012+Math.sin(k*.4+s)*n*.004;py+=len/steps;x.lineTo(px,py);pts.push([px,py]);}x.stroke();
    for(const [lx,ly] of pts){if(rand()<.7){const a=rand()*6.3,r=n*(.014+rand()*.012);x.fillStyle=`rgb(${40+rand()*20|0},${78+rand()*30|0},${34+rand()*14|0})`;x.save();x.translate(lx,ly);x.rotate(a);x.beginPath();
      // an ivy leaf: three lobes
      for(let k=0;k<3;k++){x.ellipse(Math.cos(k*2.1)*r*.5,Math.sin(k*2.1)*r*.5,r,r*.7,k*2.1,0,7);}x.fill();x.restore();}
      if(rand()<.06){x.fillStyle=rand()<.5?'rgb(236,232,210)':'rgb(222,204,120)';x.beginPath();x.arc(lx+(rand()-.5)*n*.02,ly,n*.008,0,7);x.fill();}}}
  return c;}
// A spray of broad tropical leaves, for bushes.
function leaves(n){
  seed=181;const c=canvas(n),x=c.getContext('2d');
  for(let i=0;i<34;i++){const a=rand()*6.3,r=n*(.08+rand()*.3),cx=n/2+Math.cos(a)*r*.6,cy=n/2+Math.sin(a)*r*.6,len=n*(.14+rand()*.14),g=70+rand()*45;
    leaf(x,cx,cy,a+(rand()-.5)*.8,len,len*.32,`rgb(${30+rand()*20|0},${g|0},${28+rand()*16|0})`,'rgba(120,160,90,.55)');}
  return c;}

// Stencilled lettering for Bunker B-01's lintel: its number on the left, its year on the right,
// in black paint, flaked (design spec 10.4, after the reference's "USED 1942").
function stencil(n){
  seed=191;const c=document.createElement('canvas');c.width=n;c.height=n/4;const x=c.getContext('2d'),h=n/4;
  x.fillStyle='rgb(22,22,20)';x.font=`bold ${Math.round(h*.62)}px "DejaVu Sans Mono","Liberation Mono",monospace`;x.textBaseline='middle';
  x.textAlign='left';x.fillText('B-01',h*.25,h*.54);x.textAlign='right';x.fillText('1942',n-h*.25,h*.54);
  // Stencil bridges: thin gaps cut through each letter, then flaking.
  x.globalCompositeOperation='destination-out';
  for(const cx of [h*.25,n-h*.25-h*1.55])for(let k=0;k<4;k++){x.fillRect(cx+h*(.18+k*.37),h*.2,h*.035,h*.7);}
  for(let i=0;i<260;i++){x.beginPath();x.arc(rand()*n,rand()*h,.6+rand()*2.4,0,7);x.fill();}
  x.globalCompositeOperation='source-over';
  return c;}
const OPAQUE={sand:[sand,1024],grass:[grass,1024],dirt:[dirt,1024],rock:[rock,1024],concrete:[concrete,512],camo:[camo,512],stone:[stone,512],paving:[paving,512],rust:[rust,512],wood:[wood,512],thatch:[thatch,512],cloth:[cloth,512],bark:[bark,512]};
const CARDS={frond:[frond,512],fern:[fern,512],tuft:[tuft,256],vines:[vines,512],leaves:[leaves,512],stencil:[stencil,512]};
window.paintIslandTextures=(quality=.86)=>{
  const out={};
  for(const [name,[f,n]] of Object.entries(OPAQUE))out[name]=f(n).toDataURL('image/webp',quality);
  for(const [name,[f,n]] of Object.entries(CARDS))out[name]=f(n).toDataURL('image/webp',quality);
  return out;
};
})();
