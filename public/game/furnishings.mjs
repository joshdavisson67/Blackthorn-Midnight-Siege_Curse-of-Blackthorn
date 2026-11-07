import * as T from './three.module.js';

// Shared furniture geometry/materials are built once. All pieces remain static
// and join the estate's existing batches; no lights or runtime model spawning.
export function createFurnishings({world,M,colliders}){
  const geometries=new Map(),records=[];
  const finish=(color,roughness=.8,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const cloth=M.leather.clone();cloth.color.setHex(0x665044);cloth.roughness=.84;
  const linen=M.red.clone();linen.color.setHex(0x856052);linen.roughness=1;
  const pillow=M.leather.clone();pillow.color.setHex(0xd3cbbb);pillow.roughness=1;
  const sage=M.leather.clone();sage.color.setHex(0x69756a);sage.roughness=1;
  const pages=finish(0xcac3ac),iron=finish(0x394044,.7,.5),ivory=finish(0xd5cbb4,.54),soil=finish(0x352c23);
  const lacquer=finish(0x292726,.32),leaf=finish(0x45694b,.94);leaf.side=T.DoubleSide;
  const pottery=finish(0x8b7560,.87),mirror=finish(0x7d9698,.28,.75);
  const books=[0x734a37,0x42584a,0x8b764a,0x40525c,0x68444d].map(c=>finish(c,.88));
  const sphereGeo=new T.SphereGeometry(1,16,10);
  function cached(key,build){if(!geometries.has(key))geometries.set(key,build());return geometries.get(key);}
  function boxGeometry(w,h,d,r,material){
    const tile=material.map?.userData.tileMeters||0,repeat=material.map?.repeat;
    return cached(['box',w,h,d,r,tile,repeat?.x,repeat?.y].join('/'),()=>{
      const segments=r?4:1,g=new T.BoxGeometry(w,h,d,segments,segments,segments);
      if(r){
        const p=g.attributes.position,n=g.attributes.normal,v=new T.Vector3(),core=new T.Vector3();
        for(let i=0;i<p.count;i++){
          v.fromBufferAttribute(p,i);core.set(T.MathUtils.clamp(v.x,-w/2+r,w/2-r),T.MathUtils.clamp(v.y,-h/2+r,h/2-r),T.MathUtils.clamp(v.z,-d/2+r,d/2-r));
          v.sub(core).normalize();n.setXYZ(i,v.x,v.y,v.z);v.multiplyScalar(r).add(core);p.setXYZ(i,v.x,v.y,v.z);
        }
      }
      if(tile){
        const uv=g.attributes.uv,count=(segments+1)**2,faces=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
        for(let face=0;face<6;face++)for(let k=0;k<count;k++){const i=face*count+k;uv.setXY(i,uv.getX(i)*faces[face][0]/tile/repeat.x,uv.getY(i)*faces[face][1]/tile/repeat.y);}
      }
      g.computeBoundingBox();g.computeBoundingSphere();return g;
    });
  }
  function mesh(g,geo,mat,name,x=0,y=0,z=0){const p=new T.Mesh(geo,mat);p.name=name;p.position.set(x,y,z);p.castShadow=!(mat.isMeshBasicMaterial||mat===M.white);p.receiveShadow=!mat.isMeshBasicMaterial;g.add(p);return p;}
  function b(g,x,y,z,w,h,d,mat=M.wood,name='Joinery',r=0){return mesh(g,boxGeometry(w,h,d,Math.min(r,w*.24,h*.24,d*.24),mat),mat,name,x,y,z);}
  function ell(g,x,y,z,sx,sy,sz,mat,name){const p=mesh(g,sphereGeo,mat,name,x,y,z);p.scale.set(sx,sy,sz);return p;}
  function cy(g,x,y,z,r,h,mat=M.gold,name='Turned support',bottom=r){
    return mesh(g,cached(['cyl',r,bottom,h].join('/'),()=>new T.CylinderGeometry(r,bottom,h,16)),mat,name,x,y,z);
  }
  function link(g,a,bp,r,mat,name){const aV=new T.Vector3(...a),bV=new T.Vector3(...bp),v=bV.clone().sub(aV),p=cy(g,...aV.add(bV).multiplyScalar(.5).toArray(),r,v.length(),mat,name);p.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return p;}
  function ring(g,x,y,z,r,tube,mat,name){
    return mesh(g,cached(['ring',r,tube].join('/'),()=>new T.TorusGeometry(r,tube,6,32)),mat,name,x,y,z);
  }
  function place(g,type,x,z,{y=0,rotation=0,collision=true}={}){
    g.name=type;g.position.set(x,y===0?.095:y,z);g.rotation.y=rotation;world.add(g);g.updateMatrixWorld(true);
    const bounds=new T.Box3().setFromObject(g),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
    const collider=collision?{x:center.x,z:center.z,w:size.x+.025,d:size.z+.025,minY:y,maxY:bounds.max.y,furnishing:type}:null;
    if(collider)colliders.push(collider);
    g.userData.furnishing=type;records.push({type,x,z,y,rotation,group:g,bounds:bounds.clone(),collider});
    return g;
  }
  function book(g,x,y,z,index=0,w=.09,h=.3,d=.2){
    b(g,x,y,z,w,h,d,books[index%books.length],'Leather book spine');
    b(g,x+w/2+.002,y,z-.012,.005,h-.022,d-.027,pages,'Exposed page edges');
    for(const side of [-1,1])b(g,x,y+side*h*.33,z+d/2+.003,w*.7,.006,.005,M.gold,'Gilt spine band');
  }
  function lamp(g,x,y,z){
    cy(g,x,y+.025,z,.10,.05,M.gold,'Lamp foot');cy(g,x,y+.20,z,.016,.32,M.gold,'Lamp stem');
    cy(g,x,y+.40,z,.12,.20,pillow,'Linen lampshade',.20);
    cy(g,x,y+.505,z,.032,.012,M.gold,'Shade finial');
  }
  function tabletop(g,w,d,h,desk){
    b(g,0,h-.035,0,w,.07,d,M.wood,'Beveled tabletop',.018);
    for(const sx of [-1,1])for(const sz of [-1,1]){
      cy(g,sx*(w/2-.13),(h-.07)/2,sz*(d/2-.12),.044,h-.07,M.wood,'Tapered table leg',.032);
      b(g,sx*(w/2-.13),h-.15,sz*(d/2-.12),.09,.17,.09,M.wood,'Leg joinery');
    }
    for(const side of [-1,1])b(g,0,h-.13,side*(d/2-.08),w-.20,.14,.045,M.wood,'Table apron');
    if(desk){
      b(g,0,h-.15,d/2-.04,w*.74,.18,.08,M.wood,'Writing desk drawer',.01);
      for(const x of [-w*.22,w*.22])cy(g,x,h-.15,d/2+.011,.018,.018,M.gold,'Drawer pull').rotation.x=Math.PI/2;
      b(g,-.13,h+.008,0,.62,.012,.38,cloth,'Leather writing blotter',.004);
      b(g,.06,h+.019,-.015,.30,.004,.24,pages,'Letter paper');
      cy(g,-w*.32,h+.035,-d*.22,.036,.07,iron,'Ink bottle');cy(g,-w*.32,h+.076,-d*.22,.028,.012,M.gold,'Ink bottle rim');
      b(g,-w*.32-.03,h+.15,-d*.22,.015,.18,.005,pillow,'Quill').rotation.z=-.35;
      lamp(g,w*.32,h,-d*.18);
    }
  }
  function table(x,z,{w=1.8,d=.85,h=.78,desk=false,...opts}={}){
    const g=new T.Group();tabletop(g,w,d,h,desk);return place(g,desk?'Writing desk':'Oak table',x,z,opts);
  }
  function chair(x,z,opts={}){
    const g=new T.Group();
    b(g,0,.43,0,.51,.08,.49,M.wood,'Chair seat frame',.018);b(g,0,.486,-.01,.47,.05,.43,cloth,'Upholstered chair seat',.018);
    for(const sx of [-1,1])for(const sz of [-1,1])cy(g,sx*.21,.205,sz*.20,.025,.41,M.wood,'Chair leg',.020);
    for(const sx of [-1,1])b(g,sx*.23,.80,.22,.05,.71,.055,M.wood,'Chair back stile',.01);
    b(g,0,1.14,.225,.52,.10,.08,M.wood,'Curved top rail',.022);
    for(const x of [-.13,0,.13])b(g,x,.89,.22,.036,.41,.05,M.wood,'Chair back spindle',.008);
    for(const side of [-1,1])b(g,side*.21,.20,0,.024,.025,.40,M.wood,'Chair stretcher');
    return place(g,'Dining chair',x,z,opts);
  }
  function sofa(x,z,opts={}){
    const g=new T.Group();
    for(const sx of [-1,1])for(const sz of [-1,1])cy(g,sx*1.12,.08,sz*.34,.052,.16,M.wood,'Sofa turned foot',.038);
    b(g,0,.29,0,2.58,.28,.89,cloth,'Upholstered sofa base',.055);
    b(g,0,.83,.35,2.51,.67,.25,cloth,'Padded sofa back',.062);
    for(const side of [-1,1]){
      b(g,side*1.19,.61,-.025,.28,.48,.92,cloth,'Rolled sofa arm',.065);
      cy(g,side*1.19,.82,-.03,.145,.85,cloth,'Arm roll').rotation.x=Math.PI/2;
    }
    for(const x of [-.77,0,.77])b(g,x,.505,-.09,.74,.16,.70,cloth,'Separate seat cushion',.043);
    for(const x of [-.86,-.43,0,.43,.86])for(const yy of [.80,1.03])ell(g,x,yy,.212,.015,.015,.009,M.gold,'Tuft button');
    for(const side of [-1,1]){const p=ell(g,side*.87,.73,-.04,.16,.20,.10,linen,'Loose sofa pillow');p.rotation.z=side*.20;}
    return place(g,'Tufted leather sofa',x,z,opts);
  }
  function bookcase(x,z,opts={}){
    const g=new T.Group(),w=2.4,d=.48,h=2.53;
    b(g,0,h/2,-.22,w,h,.045,M.wood,'Thin bookcase back');
    for(const side of [-1,1])b(g,side*(w/2-.046),h/2,0,.092,h,d,M.wood,'Bookcase side stile',.009);
    b(g,0,.12,0,w,.18,d+.04,M.wood,'Bookcase plinth',.016);
    b(g,0,h-.055,0,w+.09,.11,d+.08,M.wood,'Bookcase cornice',.013);
    for(let row=0;row<4;row++){
      const shelf=.32+row*.53;b(g,0,shelf,0,w-.15,.055,d,M.wood,'Open shelf');
      for(let k=0;k<15;k++){
        const height=.25+((k*7+row*3)%5)*.028,width=.082+((k+row)%3)*.012;
        book(g,-1.03+k*.145,shelf+.03+height/2,.075,k+row,width,height,.23);
      }
    }
    return place(g,'Open oak bookcase',x,z,opts);
  }
  function bed(x,z,{kind='double',...opts}={}){
    const g=new T.Group(),hospital=kind==='hospital',single=kind!=='double',w=single?1.04:1.92,d=single?2.12:2.22,frame=hospital?ivory:M.wood;
    for(const sx of [-1,1])for(const sz of [-1,1]){
      cy(g,sx*(w/2-.06),.22,sz*(d/2-.06),.037,.44,frame,'Bed leg');
      if(hospital){const wheel=ring(g,sx*(w/2-.06),.072,sz*(d/2-.06),.052,.013,iron,'Bed caster');wheel.rotation.y=Math.PI/2;}
    }
    b(g,0,.43,0,w,.10,d,frame,'Bed frame',.014);
    b(g,0,.555,0,w-.06,.18,d-.08,pillow,'Rounded mattress',.045);
    b(g,0,.667,.31,w-.10,.060,d*.62,hospital?sage:linen,'Folded coverlet',.018);
    b(g,0,.699,-.29,w-.11,.035,.19,hospital?sage:linen,'Folded blanket hem',.012);
    if(hospital){
      for(const end of [-1,1]){
        for(const side of [-1,1])cy(g,side*(w/2-.03),.62,end*(d/2+.025),.025,1.08,ivory,'Iron bedpost');
        link(g,[-w/2+.03,1.12,end*(d/2+.025)],[w/2-.03,1.12,end*(d/2+.025)],.025,ivory,'Bed end rail');
        for(const xx of [-.28,0,.28])cy(g,xx,.92,end*(d/2+.025),.013,.35,ivory,'Headboard spindle');
      }
    }else{
      b(g,0,.78,-d/2-.018,w+.07,1.05,.09,M.wood,'Paneled headboard',.023);
      b(g,0,.83,-d/2+.032,w-.20,.60,.026,M.wood,'Headboard inset panel',.015);
      b(g,0,.49,d/2+.018,w+.04,.34,.085,M.wood,'Low footboard',.018);
    }
    for(const x of single?[0]:[-.45,.45]){
      const p=ell(g,x,.713,-d*.31,single?.35:.38,.082,.23,pillow,'Linen pillow');p.rotation.y=x*.08;
    }
    return place(g,hospital?'Infirmary iron bed':single?'Single oak bed':'Double oak bed',x,z,opts);
  }
  function cabinet(x,z,{w=1.8,h=1.96,d=.53,...opts}={}){
    const g=new T.Group(),doors=Math.max(2,Math.round(w/.75));
    b(g,0,h/2+.09,0,w,h-.16,d,M.wood,'Cabinet carcass',.014);
    b(g,0,h-.025,0,w+.07,.075,d+.055,M.wood,'Cabinet crown',.013);
    b(g,0,.17,0,w+.04,.10,d+.035,M.wood,'Cabinet lower molding',.011);
    for(const side of [-1,1])for(const zz of [-1,1])cy(g,side*(w/2-.14),.09,zz*(d/2-.08),.041,.18,M.wood,'Cabinet foot');
    for(let i=0;i<doors;i++){
      const dw=(w-.12)/doors,x=-w/2+.06+(i+.5)*dw;
      b(g,x,h*.52+.045,d/2+.014,dw-.025,h-.37,.025,M.wood,'Separate cabinet door',.007);
      b(g,x,h*.52+.045,d/2+.032,dw-.15,h-.52,.016,M.wood,'Raised door panel',.006);
      const pull=cy(g,x+(i%2?-1:1)*dw*.33,h*.53,d/2+.063,.015,.035,M.gold,'Brass cabinet handle');pull.rotation.x=Math.PI/2;
    }
    return place(g,h<1.3?'Paneled sideboard':'Oak wardrobe',x,z,opts);
  }
  function bench(x,z,{w=2.6,back=true,...opts}={}){
    const g=new T.Group();b(g,0,.46,0,w,.095,.47,M.wood,'Bench seat',.02);
    for(const side of [-1,1]){b(g,side*(w/2-.20),.22,0,.105,.44,.40,M.wood,'Bench trestle');b(g,side*(w/2-.20),.045,0,.26,.09,.53,M.wood,'Bench foot',.014);}
    b(g,0,.20,.12,w-.30,.055,.05,M.wood,'Bench stretcher');
    if(back){
      for(const side of [-1,1])b(g,side*(w/2-.13),.74,.22,.12,.80,.10,M.wood,'Bench back stile',.012);
      for(const yy of [.72,.93])b(g,0,yy,.225,w-.12,.16,.06,M.wood,'Bench back rail',.012);
    }
    return place(g,back?'Oak bench':'Piano stool',x,z,opts);
  }
  function grandPiano(x,z,opts={}){
    const g=new T.Group(),outline=new T.Shape();
    outline.moveTo(-.73,.99);outline.lineTo(.73,.99);outline.lineTo(.73,.22);outline.bezierCurveTo(.76,-.22,.18,-.34,.20,-.81);outline.bezierCurveTo(.16,-1.26,-.60,-1.43,-.73,-.95);outline.lineTo(-.73,.99);
    const caseGeo=cached('grand-piano-case',()=>{const geo=new T.ExtrudeGeometry(outline,{depth:.22,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2,curveSegments:14});geo.rotateX(Math.PI/2);return geo;});
    mesh(g,caseGeo,lacquer,'Curved grand piano case',0,1.02,0);
    for(const [xx,zz] of [[-.57,.65],[.57,.65],[-.34,-.99]])cy(g,xx,.40,zz,.05,.80,lacquer,'Piano leg',.037);
    b(g,0,.829,1.0,1.44,.11,.24,lacquer,'Keyboard cheek',.014);
    const keyPitch=.0235;for(let i=0;i<52;i++){
      const xx=(i-25.5)*keyPitch;b(g,xx,.899,1.02,.0223,.018,.18,ivory,'Ivory piano key');
      if(i<51&&[0,2,3,5,6].includes(i%7))b(g,xx+keyPitch/2,.923,.961,.013,.030,.096,lacquer,'Ebony piano key');
    }
    const lid=new T.Group();lid.position.set(-.70,1.048,-.06);lid.rotation.z=.26;g.add(lid);
    const lidGeo=cached('grand-piano-lid',()=>{const geo=new T.ExtrudeGeometry(outline,{depth:.022,bevelEnabled:false,curveSegments:14});geo.rotateX(Math.PI/2);return geo;});
    mesh(lid,lidGeo,lacquer,'Raised curved piano lid',.70,0,.06);
    link(g,[.38,1.01,-.36],[.38,1.34,-.36],.012,M.gold,'Lid prop');
    b(g,0,1.16,.54,.67,.28,.035,lacquer,'Piano music rest').rotation.x=-.20;
    b(g,0,1.17,.56,.42,.23,.004,pages,'Sheet music').rotation.x=-.20;
    for(const xx of [-.085,0,.085])b(g,xx,.10,.57,.025,.035,.16,M.gold,'Piano pedal');
    return place(g,'Curved grand piano',x,z,opts);
  }
  function musicStand(x,z,opts={}){
    const g=new T.Group();cy(g,0,.56,0,.012,1.12,iron,'Music stand stem');
    for(let i=0;i<3;i++){const a=i*Math.PI*2/3;link(g,[0,.22,0],[Math.cos(a)*.26,.027,Math.sin(a)*.26],.012,iron,'Tripod foot');}
    const tray=b(g,0,1.14,0,.48,.30,.014,iron,'Tilted music tray',.008);tray.rotation.x=-.18;
    b(g,0,.989,.034,.48,.018,.035,iron,'Score ledge');const paper=b(g,0,1.143,.011,.35,.24,.004,pages,'Music score');paper.rotation.x=-.18;
    return place(g,'Tripod music stand',x,z,opts);
  }
  function planter(x,z,opts={}){
    const g=new T.Group(),profile=[[.24,.035],[.25,.09],[.28,.47],[.31,.49],[.31,.55],[.28,.56]].map(p=>new T.Vector2(...p));
    mesh(g,cached('terracotta-planter',()=>new T.LatheGeometry(profile,24)),pottery,'Tapered terracotta pot');
    cy(g,0,.53,0,.277,.025,soil,'Recessed potting soil');ring(g,0,.54,0,.296,.018,pottery,'Pot rim').rotation.x=Math.PI/2;
    const leafGeo=cached('arching-leaf',()=>{const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([0,0,0,-.08,.10,.025,.08,.10,.025,-.09,.22,.035,.09,.22,.035,0,.39,.02],3));geo.setAttribute('uv',new T.Float32BufferAttribute([.5,0,0,.25,1,.25,0,.55,1,.55,.5,1],2));geo.setIndex([0,2,1,1,2,3,2,4,3,3,4,5]);geo.computeVertexNormals();return geo;});
    for(let i=0;i<11;i++){
      const a=i*2.39996,height=.87+(i%4)*.16,xx=Math.cos(a)*.22,zz=Math.sin(a)*.22;
      link(g,[0,.54,0],[xx,height,zz],.006,leaf,'Plant stem');
      const p=mesh(g,leafGeo,leaf,'Pointed arching leaf',xx,height-.04,zz);p.rotation.set(.32+(i%3)*.12,a,-.20);p.scale.setScalar(.8+(i%3)*.12);
    }
    return place(g,'Potted conservatory plant',x,z,opts);
  }
  function telescope(x,z,opts={}){
    const g=new T.Group(),direction=new T.Vector3(0,.48,-1).normalize();
    for(let i=0;i<3;i++){const a=i*Math.PI*2/3;link(g,[0,1.05,0],[Math.cos(a)*.46,.04,Math.sin(a)*.46],.032,M.wood,'Telescope tripod leg');}
    cy(g,0,1.13,0,.055,.26,M.gold,'Equatorial mount');const tube=cy(g,0,1.39,-.11,.084,1.45,M.gold,'Brass refractor tube');tube.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction);
    for(const length of [-.65,.52,.69]){
      const pos=direction.clone().multiplyScalar(length).add(new T.Vector3(0,1.39,-.11)),rim=cy(g,...pos.toArray(),length<0?.057:.092,.045,iron,'Optical tube collar');rim.quaternion.copy(tube.quaternion);
    }
    const lensPos=direction.clone().multiplyScalar(.716).add(new T.Vector3(0,1.39,-.11));
    const lens=cy(g,...lensPos.toArray(),.079,.009,mirror,'Objective lens');lens.quaternion.copy(tube.quaternion);
    const eyePos=direction.clone().multiplyScalar(-.79).add(new T.Vector3(0,1.39,-.11));
    const eyepiece=cy(g,...eyePos.toArray(),.027,.17,iron,'Focusing eyepiece');eyepiece.quaternion.copy(tube.quaternion);
    return place(g,'Brass refractor telescope',x,z,opts);
  }
  function bust(x,z,{pedestal=true,...opts}={}){
    const g=new T.Group(),offset=pedestal?1:0;
    if(pedestal){b(g,0,.09,0,.71,.18,.71,M.stone,'Pedestal base',.017);b(g,0,.52,0,.50,.76,.50,M.stone,'Stone pedestal shaft',.01);b(g,0,.96,0,.66,.12,.66,M.stone,'Pedestal cap',.017);}
    else b(g,0,.025,0,.37,.05,.29,M.stone,'Bust foot',.01);
    ell(g,0,offset+.19,0,.28,.20,.15,M.stone,'Sculpted shoulders');cy(g,0,offset+.39,0,.072,.22,M.stone,'Sculpted neck');
    ell(g,0,offset+.62,0,.115,.157,.108,M.stone,'Portrait bust head');ell(g,0,offset+.60,.116,.021,.045,.029,M.stone,'Sculpted nose');
    for(const side of [-1,1]){ell(g,side*.046,offset+.656,.091,.038,.009,.016,M.stone,'Sculpted brow');ell(g,side*.114,offset+.61,0,.015,.031,.019,M.stone,'Sculpted ear');}
    b(g,0,offset+.544,.097,.050,.010,.015,M.stone,'Sculpted lips',.003);
    return place(g,'Classical portrait bust',x,z,opts);
  }
  function globe(x,z,{y=.82,...opts}={}){
    const g=new T.Group();cy(g,0,.036,0,.18,.072,M.wood,'Globe base');cy(g,0,.12,0,.026,.15,M.gold,'Globe support');
    const frame=ring(g,0,.39,0,.256,.011,M.gold,'Globe meridian');frame.rotation.z=-.41;
    const ball=ell(g,0,.39,0,.232,.232,.232,globeMaterial(),'Terrestrial globe');ball.rotation.z=-.41;
    return place(g,'Tabletop terrestrial globe',x,z,{...opts,y,collision:false});
  }
  let globeMat;
  function globeMaterial(){
    if(globeMat)return globeMat;
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const c=canvas.getContext('2d');
    c.fillStyle='#4a6870';c.fillRect(0,0,512,256);c.strokeStyle='#9b986f55';c.lineWidth=1;
    for(let x=0;x<512;x+=32){c.beginPath();c.moveTo(x,0);c.lineTo(x,256);c.stroke();}
    for(let y=16;y<256;y+=32){c.beginPath();c.moveTo(0,y);c.lineTo(512,y);c.stroke();}
    for(const points of [[[38,53],[72,35],[118,58],[130,96],[101,128],[83,98],[58,96]],[[104,134],[136,132],[150,161],[134,204],[117,224],[111,187]],[[238,66],[270,61],[295,89],[283,105],[254,111]],[[249,115],[287,107],[302,138],[284,185],[266,194],[253,154]],[[288,54],[338,38],[400,56],[443,89],[420,119],[378,104],[349,134],[320,111]],[[392,173],[425,161],[449,183],[430,206],[400,201]]]){
      c.fillStyle='#b1a578';c.strokeStyle='#d1bd8a';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();c.stroke();
    }
    const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;
    globeMat=new T.MeshStandardMaterial({map:tex,roughness:.72,color:0xc9c4ad});return globeMat;
  }

  // ---- Stone-house pieces (v187) ------------------------------------------------------------------
  const stone=M.carved||M.stone,ironwork=M.iron||iron,ember=new T.MeshBasicMaterial({color:0xff7a2a}),glow=M.flame||new T.MeshBasicMaterial({color:0xffc77a});
  // Few, shared finishes: soot and charred wood are one; candles are the house's candle wax.
  const charred=finish(0x211a14,.97),soot=charred,wax=M.white||finish(0xe8dcc2,.7);
  const velvet=finish(0x5b1d1f,.92),gilt=M.gold,linenWhite=finish(0xd9d2c0,.95),steel=finish(0x8e959a,.34,.85),pewter=finish(0x6f6a62,.4,.6);
  // Thin decorative pieces (cloth, candles, flames, wall trophies) cast no shadows:
  // each shadowed part is drawn again in every shadow-casting light's pass.
  const unshadowed=g=>{g.traverse(o=>{if(o.isMesh)o.castShadow=false;});return g;};
  // Woven hangings: drawn once per design, then shared.
  const weaves=new Map(),hearths=[];
  function weave(kind){
    if(weaves.has(kind))return weaves.get(kind);
    let mat=null;
    const canvas=typeof document!=='undefined'?document.createElement('canvas'):null,c=canvas?.getContext?.('2d');
    if(c&&typeof c.fillRect==='function'){
      const W=kind==='banner'?256:512,H=kind==='banner'?768:640;canvas.width=W;canvas.height=H;
      const R=n=>{let v=Math.sin(n*12.9898)*43758.5453;return v-Math.floor(v);};
      if(kind==='banner'){
        c.fillStyle='#5e1a1c';c.fillRect(0,0,W,H);c.fillStyle='#b4914e';c.fillRect(0,0,W,22);c.fillRect(0,0,14,H);c.fillRect(W-14,0,14,H);
        // the Blackthorn crest: a thorned shield with a raven's B
        c.save();c.translate(W/2,H*.38);c.fillStyle='#1d2420';c.beginPath();c.moveTo(-80,-95);c.lineTo(80,-95);c.lineTo(80,10);c.quadraticCurveTo(80,95,0,125);c.quadraticCurveTo(-80,95,-80,10);c.closePath();c.fill();
        c.strokeStyle='#c9a560';c.lineWidth=7;c.stroke();c.fillStyle='#c9a560';c.font='bold 120px Georgia,serif';c.textAlign='center';c.textBaseline='middle';c.fillText('B',0,8);
        for(let i=0;i<10;i++){const a=i/10*Math.PI*2;c.save();c.rotate(a);c.fillRect(-3,-150,6,22);c.restore();}c.restore();
        c.fillStyle='#c9a560';c.font='bold 30px Georgia,serif';c.textAlign='center';c.fillText('MDCCCXCIII',W/2,H*.72);
      }else{
        const pal=kind==='hunt'?['#3b4a35','#6d3426','#b08d55','#2a2620','#7b6a48']:['#5a2422','#2f3b46','#b39a63','#1f1c19','#6b5a3c'];
        c.fillStyle=pal[0];c.fillRect(0,0,W,H);
        // millefleur field
        for(let i=0;i<900;i++){c.fillStyle=pal[1+Math.floor(R(i)*4)]+'cc';const x=R(i+.3)*W,y=R(i+.7)*H,r=2+R(i+.9)*5;c.beginPath();c.arc(x,y,r,0,7);c.fill();}
        // central roundel with a stag (hunt) or a tree of life
        c.save();c.translate(W/2,H/2);c.fillStyle=pal[3];c.beginPath();c.ellipse(0,0,150,190,0,0,7);c.fill();c.strokeStyle=pal[2];c.lineWidth=10;c.stroke();
        c.fillStyle=pal[2];
        if(kind==='hunt'){c.beginPath();c.ellipse(0,30,70,34,0,0,7);c.fill();c.fillRect(-55,50,10,70);c.fillRect(-25,50,10,70);c.fillRect(25,50,10,70);c.fillRect(50,50,10,70);c.beginPath();c.moveTo(55,10);c.lineTo(95,-50);c.lineTo(115,-40);c.lineTo(80,20);c.fill();
          c.lineWidth=6;c.strokeStyle=pal[2];for(const s of [-1,1]){c.beginPath();c.moveTo(100,-55);c.lineTo(100+s*25,-120);c.moveTo(100+s*12,-85);c.lineTo(100+s*45,-95);c.stroke();}}
        else{c.fillRect(-12,-20,24,170);for(let i=0;i<7;i++){const a=-Math.PI/2+(i-3)*.42;c.beginPath();c.ellipse(Math.cos(a)*80,-40+Math.sin(a)*90,32,22,a,0,7);c.fill();}}
        c.restore();
        // border
        c.strokeStyle=pal[2];c.lineWidth=26;c.strokeRect(13,13,W-26,H-26);c.strokeStyle=pal[1];c.lineWidth=8;c.strokeRect(34,34,W-68,H-68);
        // age: fading and wear
        for(let i=0;i<3000;i++){c.fillStyle=`rgba(${R(i)>.5?'230,215,180':'0,0,0'},${.03+R(i+.5)*.05})`;c.fillRect(R(i+.1)*W,R(i+.2)*H,2+R(i+.3)*6,1+R(i+.4)*3);}
      }
      const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;
      mat=new T.MeshStandardMaterial({map:tex,roughness:1,side:T.DoubleSide});
    }else mat=new T.MeshStandardMaterial({color:kind==='banner'?0x5e1a1c:0x5a2422,roughness:1,side:T.DoubleSide});
    weaves.set(kind,mat);return mat;
  }
  // A hanging cloth with soft vertical folds (and a swallowtail for banners).
  function clothGeometry(w,h,swallow){
    return cached(['cloth',w,h,swallow].join('/'),()=>{
      const g=new T.PlaneGeometry(w,h,24,16),p=g.attributes.position;
      for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),t=(h/2-y)/h;p.setZ(i,Math.sin(x/w*Math.PI*6)*.022*(.4+t)+Math.sin(x/w*Math.PI*2.3+1)*.012);
        if(swallow&&y<-h/2+w*.5){const notch=(1-Math.abs(x)/(w/2))*w*.5;if(y<-h/2+notch)p.setY(i,-h/2+notch);}}
      g.computeVertexNormals();return g;
    });
  }
  // Wall pieces are placed by their wall face: (x,z) on the face, facing `rotation`.
  function wallPiece(g,type,x,y,z,rotation){g.name=type;g.position.set(x,y,z);g.rotation.y=rotation;world.add(g);g.updateMatrixWorld(true);records.push({type,x,z,y,rotation,group:g,bounds:new T.Box3().setFromObject(g),collider:null,wall:true});return g;}
  function tapestry(x,y,z,{rotation=0,w=2.2,h=2.8,design='tree'}={}){
    const g=new T.Group();mesh(g,clothGeometry(w,h,false),weave(design),'Woven tapestry',0,0,.06);
    cy(g,0,h/2+.04,.08,.022,w+.3,ironwork,'Hanging rod').rotation.z=Math.PI/2;
    for(const s of [-1,1]){ell(g,s*(w/2+.16),h/2+.04,.08,.04,.04,.04,ironwork,'Rod finial');b(g,s*(w/2+.02),h/2+.04,.03,.03,.06,.06,ironwork,'Rod bracket');}
    return wallPiece(unshadowed(g),'Woven tapestry',x,y,z,rotation);
  }
  function banner(x,y,z,{rotation=0,w=.9,h=2.6}={}){
    const g=new T.Group();mesh(g,clothGeometry(w,h,true),weave('banner'),'Heraldic banner',0,0,.04);
    cy(g,0,h/2+.05,.05,.018,w+.24,ironwork,'Banner pole').rotation.z=Math.PI/2;
    for(const s of [-1,1])ell(g,s*(w/2+.12),h/2+.05,.05,.035,.05,.035,gilt,'Pole finial');
    for(let i=0;i<9;i++)cy(g,-w/2+.05+i*(w-.1)/8,-h/2-.06,.04,.006,.12,gilt,'Gold fringe');
    return wallPiece(unshadowed(g),'Heraldic banner',x,y,z,rotation);
  }
  function trophy(x,y,z,{rotation=0}={}){
    const g=new T.Group(),shield=new T.Shape();shield.moveTo(-.32,.38);shield.lineTo(.32,.38);shield.lineTo(.32,0);shield.quadraticCurveTo(.3,-.32,0,-.48);shield.quadraticCurveTo(-.3,-.32,-.32,0);shield.closePath();
    const sg=cached('heater-shield',()=>new T.ExtrudeGeometry(shield,{depth:.04,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:1}));
    for(const s of [-1,1]){const sword=new T.Group();sword.rotation.z=s*.72;sword.position.z=.02;g.add(sword);
      b(sword,0,.25,0,.05,1.15,.012,steel,'Sword blade');b(sword,0,-.36,0,.3,.04,.04,ironwork,'Sword crossguard');cy(sword,0,-.48,0,.02,.2,charred,'Sword grip');ell(sword,0,-.6,0,.04,.04,.04,ironwork,'Sword pommel');}
    mesh(g,sg,velvet,'Heater shield',0,0,.07);b(g,0,.05,.13,.08,.7,.02,gilt,'Shield pale');b(g,0,.12,.13,.6,.08,.02,gilt,'Shield fess');
    return wallPiece(unshadowed(g),'Shield and crossed swords',x,y,z,rotation);
  }
  function fireplace(x,z,{rotation=0,w=2.8,h=2.3,depth=.72,breast=3.4,lit=true,...opts}={}){
    const g=new T.Group(),open=w-1.0,openH=h-.75;
    b(g,0,.05,depth/2+.18,w+.5,.1,.62,stone,'Hearth slab',.01);
    for(const s of [-1,1]){b(g,s*(w/2-.25),openH/2+.05,depth/2-.02,.5,openH+.1,.32,stone,'Fireplace jamb',.02);b(g,s*(w/2-.25),openH+.12,depth/2+.04,.6,.12,.4,stone,'Jamb capital',.02);}
    b(g,0,openH+.42,depth/2-.02,w,.5,.36,stone,'Carved lintel',.02);
    b(g,0,openH+.75,depth/2+.06,w+.24,.12,.54,stone,'Mantel shelf',.02);
    b(g,0,(openH+.81+breast)/2,0,w-.3,breast-openH-.81,depth-.16,stone,'Chimney breast',.02);
    // An open recess: sooty back, cheeks, floor and soffit, so the fire sits inside it.
    b(g,0,openH/2,-.24,open+.1,openH+.1,.06,soot,'Sooty firebox back');
    for(const sd of [-1,1])b(g,sd*(open/2+.03),openH/2,.04,.06,openH,.56,soot,'Firebox cheek');
    b(g,0,.11,.04,open,.03,.56,soot,'Firebox floor');b(g,0,openH-.02,.04,open,.05,.56,soot,'Firebox soffit');
    if(lit){for(const s of [-1,1]){b(g,s*.38,.22,depth/2-.3,.04,.24,.04,ironwork,'Andiron post');ell(g,s*.38,.36,depth/2-.3,.045,.045,.045,ironwork,'Andiron finial');b(g,s*.38,.1,depth/2-.45,.03,.03,.38,ironwork,'Andiron bar');}
      for(const [dz,ry,yy] of [[-.05,.2,.16],[.06,-.15,.16],[0,.05,.28]]){const log=cy(g,0,yy,depth/2-.42+dz,.07,1.0,charred,'Split log');log.rotation.set(0,ry,Math.PI/2);}
      b(g,0,.08,depth/2-.42,1.05,.05,.4,ember,'Glowing embers');}
    for(const s of [-1,1]){cy(g,s*(w/2-.15),openH+.89,depth/2+.08,.035,.06,gilt,'Candlestick foot');cy(g,s*(w/2-.15),openH+1.0,depth/2+.08,.022,.18,wax,'Mantel candle');}
    const placed=place(g,'Stone fireplace',x,z,{...opts,rotation});
    // Where the animated flame goes: inside the firebox, facing out of it.
    if(lit){const at=placed.localToWorld(new T.Vector3(0,.5,depth/2-.36));hearths.push({x:at.x,y:at.y,z:at.z,rotation:placed.rotation.y,w:open*.72,h:.9});}
    return placed;
  }
  function armour(x,z,opts={}){
    const g=new T.Group();
    b(g,0,.11,0,.62,.22,.62,stone,'Armour plinth',.02);const y=.22;
    for(const s of [-1,1]){
      b(g,s*.1,y+.04,.05,.11,.08,.26,steel,'Sabaton',.03);cy(g,s*.1,y+.34,0,.06,.5,steel,'Greave',.055);ell(g,s*.1,y+.62,.02,.075,.07,.075,steel,'Poleyn');
      cy(g,s*.11,y+.86,0,.085,.42,steel,'Cuisse',.068);
      ell(g,s*.25,y+1.42,0,.13,.1,.13,steel,'Pauldron');cy(g,s*.27,y+1.18,0,.05,.38,steel,'Rerebrace',.045);ell(g,s*.27,y+.98,.03,.06,.06,.06,steel,'Couter');
      cy(g,s*.27,y+.8,.08,.045,.34,steel,'Vambrace',.04).rotation.x=-.5;ell(g,s*.27,y+.66,.18,.06,.05,.08,steel,'Gauntlet');
    }
    cy(g,0,y+1.1,0,.18,.22,steel,'Fauld',.21);ell(g,0,y+1.32,.02,.21,.25,.15,steel,'Breastplate');b(g,0,y+1.45,.13,.03,.18,.02,steel,'Breastplate ridge');
    cy(g,0,y+1.56,0,.07,.08,steel,'Gorget',.1);ell(g,0,y+1.72,0,.12,.15,.13,steel,'Great helm');b(g,0,y+1.72,.125,.16,.018,.02,soot,'Visor slit');
    cy(g,0,y+1.9,0,.012,.12,steel,'Helm spike');
    // a halberd held upright in the right hand
    cy(g,.27,y+1.0,.22,.016,2.2,charred,'Halberd haft',.016);b(g,.31,y+2.0,.22,.14,.22,.012,steel,'Halberd blade');
    return place(g,'Suit of armour',x,z,opts);
  }
  function candelabrum(x,z,{arms=4,...opts}={}){
    const g=new T.Group();
    for(let i=0;i<3;i++){const a=i*Math.PI*2/3;link(g,[0,.28,0],[Math.cos(a)*.24,.02,Math.sin(a)*.24],.016,ironwork,'Tripod foot');}
    cy(g,0,.95,0,.022,1.4,ironwork,'Candelabrum shaft',.026);for(const yy of [.4,.9,1.4])ell(g,0,yy,0,.045,.035,.045,ironwork,'Turned knop');
    cy(g,0,1.66,0,.12,.025,ironwork,'Drip pan');cy(g,0,1.8,0,.03,.24,wax,'Candle');ell(g,0,1.96,0,.014,.04,.014,glow,'Candle flame');
    for(let i=0;i<arms;i++){const a=i/arms*Math.PI*2+.4,ex=Math.cos(a)*.26,ez=Math.sin(a)*.26;link(g,[0,1.5,0],[ex,1.6,ez],.012,ironwork,'Candle arm');cy(g,ex,1.61,ez,.05,.02,ironwork,'Candle cup');cy(g,ex,1.71,ez,.026,.18,wax,'Candle');ell(g,ex,1.84,ez,.012,.035,.012,glow,'Candle flame');}
    return place(unshadowed(g),'Iron candelabrum',x,z,opts);
  }
  function chest(x,z,{w=1.2,d=.6,h=.62,...opts}={}){
    const g=new T.Group();b(g,0,h*.42,0,w,h*.72,d,M.wood,'Chest body',.015);
    const lid=cached(['chest-lid',w,d].join('/'),()=>{const geo=new T.CylinderGeometry(d/2,d/2,w,16,1,false,0,Math.PI);geo.rotateZ(Math.PI/2);geo.rotateX(Math.PI/2);geo.scale(1,.55,1);return geo;});
    mesh(g,lid,M.wood,'Domed chest lid',0,h*.78,0);
    for(const xx of [-w*.36,0,w*.36]){b(g,xx,h*.42,d/2+.006,.06,h*.72,.012,ironwork,'Iron strap');b(g,xx,h*.42,-d/2-.006,.06,h*.72,.012,ironwork,'Iron strap');}
    b(g,0,h*.62,d/2+.016,.14,.16,.016,ironwork,'Lock plate');for(const s of [-1,1])ring(g,s*(w/2+.02),h*.55,0,.05,.01,ironwork,'Carrying ring').rotation.y=Math.PI/2;
    return place(g,'Iron-bound chest',x,z,opts);
  }
  function refectory(x,z,{w=3.6,d=.95,h=.8,...opts}={}){
    const g=new T.Group();b(g,0,h-.05,0,w,.1,d,M.wood,'Plank tabletop',.012);
    for(let i=1;i<4;i++)b(g,-w/2+i*w/4,h+.001,0,.006,.002,d,soot,'Board joint');
    for(const s of [-1,1]){b(g,s*(w/2-.35),(h-.1)/2,0,.12,h-.1,d*.6,M.wood,'Trestle leg');b(g,s*(w/2-.35),.05,0,.2,.1,d*.85,M.wood,'Trestle foot',.02);b(g,s*(w/2-.35),h-.16,0,.16,.1,d*.8,M.wood,'Trestle cap');}
    b(g,0,.3,0,w-.7,.1,.08,M.wood,'Trestle stretcher');
    for(const xx of [-w*.3,0,w*.3]){cy(g,xx,h+.04,0,.13,.015,pewter,'Pewter plate');}
    cy(g,w*.15,h+.09,.1,.05,.18,pewter,'Pewter tankard');
    return place(g,'Refectory table',x,z,opts);
  }
  function altar(x,z,{w=2.6,...opts}={}){
    const g=new T.Group();b(g,0,.08,0,w+.6,.16,1.5,stone,'Altar step',.01);
    b(g,0,.6,0,w,.9,1.0,stone,'Stone altar',.02);b(g,0,1.08,0,w+.16,.08,1.12,stone,'Altar mensa',.02);
    b(g,0,1.125,0,w+.1,.012,1.06,linenWhite,'Altar linen');b(g,0,.78,.52,w*.6,.62,.012,velvet,'Embroidered frontal');b(g,0,1.05,.525,w*.6,.04,.014,gilt,'Frontal fringe');
    b(g,0,1.4,-.3,.05,.5,.05,gilt,'Altar cross');b(g,0,1.52,-.3,.28,.05,.05,gilt,'Altar cross arm');
    for(const s of [-1,1]){cy(g,s*w*.36,1.2,-.25,.05,.14,gilt,'Altar candlestick');cy(g,s*w*.36,1.42,-.25,.03,.3,wax,'Altar candle');ell(g,s*w*.36,1.6,-.25,.014,.04,.014,glow,'Candle flame');}
    b(g,.3,1.15,.15,.36,.05,.26,charred,'Open missal');b(g,.3,1.178,.15,.33,.008,.24,pages,'Missal pages');
    return place(g,'Stone altar',x,z,opts);
  }
  function stoneBench(x,z,{w=2.2,...opts}={}){
    const g=new T.Group();b(g,0,.43,0,w,.12,.5,stone,'Stone bench slab',.02);
    for(const s of [-1,1]){b(g,s*(w/2-.3),.2,0,.28,.36,.42,stone,'Carved bench support',.03);ell(g,s*(w/2-.3),.24,.215,.1,.1,.02,stone,'Support boss');}
    return place(g,'Stone bench',x,z,opts);
  }
  function urn(x,z,opts={}){
    const g=new T.Group();b(g,0,.3,0,.6,.6,.6,stone,'Urn plinth',.02);b(g,0,.62,0,.7,.06,.7,stone,'Plinth cap',.02);
    const profile=[[.0,0],[.16,.0],[.12,.08],[.2,.22],[.3,.42],[.27,.6],[.2,.68],[.24,.74],[.0,.74]].map(p=>new T.Vector2(...p));
    mesh(g,cached('stone-urn',()=>new T.LatheGeometry(profile,24)),stone,'Carved stone urn',0,.65,0);
    for(let i=0;i<7;i++){const a=i*2.4;const p=ell(g,Math.cos(a)*.12,1.45+(i%3)*.08,Math.sin(a)*.12,.16,.06,.07,leaf,'Trailing ivy');p.rotation.set(.4,a,.3);}
    return place(g,'Stone urn',x,z,opts);
  }
  function settle(x,z,{w=2.3,...opts}={}){
    const g=new T.Group(),d=.62;
    b(g,0,.45,0,w,.08,d,M.wood,'Settle seat',.015);b(g,0,.24,d/2-.03,w,.38,.04,M.wood,'Settle front panel');
    b(g,0,1.02,-d/2+.04,w,1.08,.07,M.wood,'High panelled back',.015);
    for(let i=0;i<4;i++)b(g,-w/2+w*(i+.5)/4,1.02,-d/2+.08,w/4-.1,.82,.02,M.wood,'Linenfold panel',.008);
    for(const s of [-1,1]){b(g,s*(w/2+.03),.52,0,.07,1.04,d,M.wood,'Settle arm end',.02);b(g,s*(w/2+.03),1.08,.04,.09,.08,d-.06,M.wood,'Arm rest',.02);}
    b(g,0,.51,.0,w-.08,.07,d-.1,velvet,'Seat cushion',.03);b(g,0,1.6,-d/2+.04,w+.1,.1,.12,M.wood,'Carved cresting',.02);
    return place(g,'Oak settle',x,z,opts);
  }
  function armchair(x,z,opts={}){
    const g=new T.Group();
    for(const sx of [-1,1])for(const sz of [-1,1])b(g,sx*.27,.24,sz*.25,.07,.48,.07,M.wood,'Carved chair leg',.012);
    b(g,0,.47,0,.66,.08,.6,M.wood,'Chair seat rail',.015);b(g,0,.53,.02,.58,.08,.52,velvet,'Upholstered seat',.03);
    b(g,0,1.03,-.27,.62,1.06,.08,M.wood,'Tall carved back',.015);b(g,0,1.02,-.225,.48,.78,.04,velvet,'Upholstered back',.02);
    for(const s of [-1,1]){b(g,s*.3,.72,.0,.06,.06,.56,M.wood,'Armrest',.015);b(g,s*.3,.6,.26,.06,.22,.06,M.wood,'Arm support');ell(g,s*.3,1.6,-.27,.05,.07,.05,M.wood,'Back finial');}
    return place(g,'Carved armchair',x,z,opts);
  }
  function lectern(x,z,opts={}){
    const g=new T.Group();b(g,0,.06,0,.6,.12,.5,stone,'Lectern base',.015);cy(g,0,.6,0,.08,1.0,M.wood,'Lectern column',.1);
    const top=b(g,0,1.15,0,.6,.06,.45,M.wood,'Sloped book rest',.01);top.rotation.x=.38;
    const book=b(g,0,1.2,.02,.5,.05,.34,charred,'Great bible');book.rotation.x=.38;const pg=b(g,0,1.23,.03,.46,.01,.31,pages,'Open pages');pg.rotation.x=.38;
    return place(g,'Oak lectern',x,z,opts);
  }
  return {records,geometries,hearths,sofa,bookcase,bed,table,chair,cabinet,bench,grandPiano,musicStand,planter,telescope,bust,globe,
    fireplace,armour,candelabrum,chest,refectory,altar,stoneBench,urn,settle,armchair,lectern,tapestry,banner,trophy};
}
