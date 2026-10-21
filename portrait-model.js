import * as THREE from './assets/three.module.js';

// An original solid toy model based on the user's illustrated character.
// Local +Z is the face; rotating the complete doll presents it to the pool camera.
export function createPortraitModel(clipPlane){
 const doll=new THREE.Group();doll.name='LuoXin portrait doll';
 const mat=(color,roughness=.55)=>new THREE.MeshStandardMaterial({color,roughness,metalness:0,clippingPlanes:clipPlane?[clipPlane]:[]});
 const skin=mat(0xffeccb),hair=mat(0x303034,.43),blue=mat(0x91c9ea),white=mat(0xfffdf3),ink=mat(0x222127),blush=mat(0xf5ba92),mouth=mat(0x87362f),tongue=mat(0xea8060);
 const sphere=new THREE.SphereGeometry(1,40,28);
 function ellipsoid(parent,material,x,y,z,sx,sy,sz){const m=new THREE.Mesh(sphere,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
 function relief(parent,shape,material,depth,z,bevel=.009){const geom=new THREE.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:28,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:5});const m=new THREE.Mesh(geom,material);m.position.z=z;parent.add(m);return m;}
 function line(parent,points,r,material){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const m=new THREE.Mesh(new THREE.TubeGeometry(curve,24,r,10,false),material);parent.add(m);return m;}
 const torso=new THREE.Shape();torso.moveTo(-.074,-.045);torso.quadraticCurveTo(-.12,-.06,-.128,-.115);torso.lineTo(-.145,-.255);torso.quadraticCurveTo(0,-.28,.145,-.255);torso.lineTo(.128,-.115);torso.quadraticCurveTo(.12,-.06,.074,-.045);torso.closePath();
 relief(doll,torso,blue,.10,-.055,.018);
 ellipsoid(doll,skin,0,-.028,.005,.048,.058,.052);
 // Two rounded legs and small white shoes keep the body readable as a toy.
 for(const side of [-1,1]){
  ellipsoid(doll,skin,side*.067,-.292,.005,.035,.065,.038);
  ellipsoid(doll,white,side*.069,-.345,.023,.047,.031,.058);
  const sleeve=ellipsoid(doll,blue,side*.142,-.091,0,.060,.062,.067);sleeve.rotation.z=side*.40;
 }
 // A bent waving arm and a relaxed opposite hand.
 line(doll,[[-.168,-.084,.005],[-.211,-.04,.024],[-.224,.035,.045]],.036,skin);
 const hand=ellipsoid(doll,skin,-.229,.079,.054,.049,.063,.039);hand.rotation.z=.14;
 ellipsoid(doll,skin,-.183,.065,.073,.023,.033,.024);
 line(doll,[[.17,-.10,.009],[.196,-.17,.023],[.184,-.208,.045]],.033,skin);
 ellipsoid(doll,skin,.178,-.216,.056,.044,.037,.035);
 // Bob silhouette: a smooth solid mass behind the cheeks, with turned-under ends.
 const bob=new THREE.Shape();bob.moveTo(-.205,-.009);bob.bezierCurveTo(-.23,.08,-.225,.26,-.18,.319);bob.bezierCurveTo(-.12,.414,-.018,.415,.015,.389);bob.bezierCurveTo(.12,.421,.232,.327,.228,.177);bob.bezierCurveTo(.227,.083,.208,.026,.22,-.016);bob.quadraticCurveTo(.158,-.035,.11,.003);bob.lineTo(-.115,.003);bob.quadraticCurveTo(-.158,-.032,-.205,-.009);bob.closePath();
 relief(doll,bob,hair,.105,-.085,.019);
 ellipsoid(doll,skin,-.188,.13,.043,.042,.054,.046);ellipsoid(doll,skin,.188,.13,.043,.042,.054,.046);
 ellipsoid(doll,skin,0,.17,.051,.183,.183,.105);
 // Swept fringe with a long tapered lock; the opposite cheek stays open.
 const fringe=new THREE.Shape();fringe.moveTo(-.188,.229);fringe.bezierCurveTo(-.168,.345,-.081,.396,.015,.364);fringe.bezierCurveTo(.13,.385,.194,.307,.189,.242);fringe.bezierCurveTo(.117,.263,.074,.293,.051,.332);fringe.bezierCurveTo(.025,.258,-.013,.229,-.066,.222);fringe.bezierCurveTo(-.025,.261,-.006,.300,-.002,.333);fringe.bezierCurveTo(-.071,.258,-.134,.252,-.188,.229);fringe.closePath();
 relief(doll,fringe,hair,.027,.105,.010);
 // Small temple locks frame the face without hiding the eye expression.
 const lock=new THREE.Shape();lock.moveTo(-.182,.251);lock.quadraticCurveTo(-.19,.16,-.164,.092);lock.quadraticCurveTo(-.205,.104,-.206,.19);lock.lineTo(-.20,.25);lock.closePath();relief(doll,lock,hair,.025,.073,.008);
 const rightLock=new THREE.Shape();rightLock.moveTo(.176,.27);rightLock.quadraticCurveTo(.171,.181,.183,.115);rightLock.quadraticCurveTo(.206,.176,.192,.28);rightLock.closePath();relief(doll,rightLock,hair,.025,.084,.008);
 // Three colourful clips sit above the left temple, as in the supplied drawing.
 line(doll,[[-.145,.278,.153],[-.158,.331,.149]],.007,mat(0xe66c96,.38));
 line(doll,[[-.116,.288,.159],[-.103,.340,.147]],.0065,mat(0xf4d965,.38));
 line(doll,[[-.169,.322,.161],[-.101,.292,.166]],.007,mat(0x67c8ec,.38));
 // Blush patches follow the curved face instead of cutting through its surface.
 function cheek(cx){const positions=[],indices=[],segments=32,rings=6;for(let r=0;r<=rings;r++)for(let i=0;i<=segments;i++){const t=i/segments*Math.PI*2,x=cx+Math.cos(t)*.040*r/rings,y=.116+Math.sin(t)*.031*r/rings,z=.051+.105*Math.sqrt(Math.max(.001,1-(x/.183)**2-((y-.17)/.183)**2))+.0015;positions.push(x,y,z);}for(let r=0;r<rings;r++)for(let i=0;i<segments;i++){const a=r*(segments+1)+i,b=a+segments+1;indices.push(a,b,a+1,b,b+1,a+1);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();const patch=new THREE.Mesh(g,blush);doll.add(patch);}
 // Face details are convex relief meshes, following the face's ellipsoid.
 for(const side of [-1,1]){
  cheek(side*.11);
  ellipsoid(doll,ink,side*.066,.178,.151,.014,.021,.007);
  ellipsoid(doll,white,side*.066-.003,.186,.158,.004,.005,.002);
  line(doll,[[side*.043,.226,.149],[side*.064,.234,.142],[side*.086,.228,.136]],.004,ink);
  line(doll,[[side*.199,.148,.079],[side*.184,.153,.091],[side*.175,.143,.095]],.0035,ink);
 }
 ellipsoid(doll,skin,0,.143,.163,.012,.010,.010);
 ellipsoid(doll,mouth,0,.092,.152,.050,.040,.009);
 ellipsoid(doll,tongue,0,.072,.160,.036,.018,.003);
 ellipsoid(doll,white,0,.118,.159,.030,.008,.003);
 // Two petal collar halves: bevelled, solid and separate from the dress.
 for(const side of [-1,1]){
  const collar=new THREE.Shape();collar.moveTo(side*.008,-.046);collar.quadraticCurveTo(side*.052,-.046,side*.082,-.070);collar.lineTo(side*.049,-.143);collar.quadraticCurveTo(side*.035,-.154,side*.025,-.12);collar.closePath();relief(doll,collar,white,.009,.061,.005);
 }
 ellipsoid(doll,white,0,-.177,.069,.007,.007,.003);
 // Recline face-up; the slight turn gives depth while retaining the facial likeness.
 const pose=new THREE.Group();pose.add(doll);pose.rotation.set(-Math.PI/2,-.05,-.10);pose.updateMatrixWorld(true);
 let bounds=new THREE.Box3().setFromObject(pose,true);const size=bounds.getSize(new THREE.Vector3());pose.scale.setScalar(.72/Math.max(size.x,size.z));pose.updateMatrixWorld(true);
 bounds=new THREE.Box3().setFromObject(pose,true);pose.position.sub(bounds.getCenter(new THREE.Vector3()));pose.updateMatrixWorld(true);
 bounds=new THREE.Box3().setFromObject(pose,true);const half=bounds.getSize(new THREE.Vector3()).multiplyScalar(.5);
 return {group:pose,half,baseY:half.y*.84};
}
