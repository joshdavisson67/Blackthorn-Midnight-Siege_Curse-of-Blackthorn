import * as T from './three.module.js';
import {EVENT_RULES} from './world-events.mjs?v=170';
export const EVENT_VISUAL_BUDGET=Object.freeze({markers:3,essence:16,lights:0,textures:0});
export function createWorldEventVisuals(world){
  const root=new T.Group();root.name='Pooled world event effects';root.userData.dynamic=true;world.add(root);
  const slabGeometry=new T.BoxGeometry(1.08,.035,1.72),ringGeometry=new T.RingGeometry(.44,.50,24);
  // Grave essence (v170): a little headstone instead of a crystal. A pale,
  // softly glowing round-topped slab on a plinth, with a gold cross on both
  // faces, so it reads as a pickup and keeps its glow through a blackout.
  const coinGeometry=(()=>{const w=.13,h=.20,shape=new T.Shape();shape.moveTo(-w,-.17);shape.lineTo(w,-.17);shape.lineTo(w,h-w);shape.absarc(0,h-w,w,0,Math.PI,false);shape.lineTo(-w,-.17);
    const g=new T.ExtrudeGeometry(shape,{depth:.05,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:2,curveSegments:14});g.translate(0,0,-.025);g.computeVertexNormals();return g;})();
  const plinthGeometry=new T.BoxGeometry(.34,.06,.12),crossBar=new T.BoxGeometry(.13,.03,.012),crossPost=new T.BoxGeometry(.03,.19,.012);
  const stone=new T.MeshStandardMaterial({color:0x283734,roughness:1}),coinMaterial=new T.MeshStandardMaterial({color:0xc9c6b8,emissive:0x8a6a2a,emissiveIntensity:.55,roughness:.82,metalness:.05});
  const crossMaterial=new T.MeshStandardMaterial({color:0xf6c45a,emissive:0xd09a2c,emissiveIntensity:1.25,roughness:.36,metalness:.45});
  const plinthMaterial=new T.MeshStandardMaterial({color:0x6d6f68,emissive:0x3a2e14,emissiveIntensity:.35,roughness:.95});
  const markers=Array.from({length:EVENT_VISUAL_BUDGET.markers},(_,i)=>{
    const group=new T.Group(),slab=new T.Mesh(slabGeometry,stone),ring=new T.Mesh(ringGeometry,new T.MeshBasicMaterial({color:0xacf4c3,transparent:true,opacity:.8,depthWrite:false,side:T.DoubleSide}));
    group.name=`Awakening grave ${i+1}`;group.visible=false;slab.position.y=.075;ring.rotation.x=-Math.PI/2;ring.position.y=.13;ring.scale.set(.88,1.45,1);group.add(slab,ring);root.add(group);
    group.traverse(o=>{o.userData.dynamic=true;});return {group,slab,ring,x:0,z:0};
  });
  const coins=Array.from({length:EVENT_VISUAL_BUDGET.essence},(_,i)=>{
    const mesh=new T.Mesh(coinGeometry,coinMaterial);mesh.name='Grave bonus essence';mesh.visible=false;mesh.userData.dynamic=true;root.add(mesh);
    const plinth=new T.Mesh(plinthGeometry,plinthMaterial);plinth.name='Headstone plinth';plinth.position.y=-.20;mesh.add(plinth);
    for(const side of [-1,1]){const post=new T.Mesh(crossPost,crossMaterial),bar=new T.Mesh(crossBar,crossMaterial);post.name=bar.name='Gold grave cross';post.position.set(0,.02,side*.043);bar.position.set(0,.06,side*.043);mesh.add(post,bar);}
    mesh.traverse(o=>{o.userData.dynamic=true;});
    return {mesh,type:'essence',value:EVENT_RULES.graveBonus,y:0,life:0,phase:i*.7,eventPool:true};
  });
  function clearMarkers(){for(const m of markers)m.group.visible=false;}
  return {
    root,markers,coins,geometries:[slabGeometry,ringGeometry,coinGeometry,plinthGeometry,crossBar,crossPost],
    mark(graves){clearMarkers();graves.forEach((grave,i)=>{const m=markers[i];m.x=grave.x;m.z=grave.z;m.group.position.set(m.x,0,m.z);m.group.visible=true;});},
    update(event){
      if(event.id!=='awakening'||(event.phase!=='warning'&&event.phase!=='active')){clearMarkers();return;}
      const warning=event.phase==='warning',fade=warning?1:Math.max(0,1-event.age/6);
      for(let i=0;i<markers.length;i++){
        const m=markers[i];if(!m.group.visible)continue;
        m.group.position.set(m.x+Math.sin(event.age*23+i)*.018*fade,0,m.z+Math.cos(event.age*19+i)*.012*fade);
        m.slab.rotation.z=Math.sin(event.age*21+i)*.016*fade;
        m.ring.material.opacity=fade*(.5+.35*Math.sin(event.age*6+i)**2);
      }
    },
    dropEssence(x,z,y,pickups){
      let coin=coins.find(p=>p.life<=0);
      if(!coin){coin=coins.reduce((a,b)=>a.life<b.life?a:b);const index=pickups.indexOf(coin);if(index>=0)pickups.splice(index,1);}
      coin.y=y;coin.life=30;coin.mesh.position.set(x,y+.8,z);coin.mesh.visible=true;pickups.push(coin);return coin;
    },
    release(coin){coin.life=0;coin.mesh.visible=false;},
    clearMarkers,
    reset(){clearMarkers();for(const coin of coins){coin.life=0;coin.mesh.visible=false;}},
    warm(){
      const saved=markers.map(m=>m.group.visible),coinVisible=coins[0].mesh.visible;
      for(const m of markers)m.group.visible=true;coins[0].mesh.visible=true;
      return ()=>{markers.forEach((m,i)=>m.group.visible=saved[i]);coins[0].mesh.visible=coinVisible;};
    },
  };
}
