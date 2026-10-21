import * as THREE from './assets/three.module.js';

// Capture the actual model outlines and colours, including transparent model materials.
// The shader can then bend a duck-shaped reflection rather than an ellipse.
export function bakeFloatAtlas(renderer,floats){
 const cell=256,columns=3,rows=2;
 const target=new THREE.WebGLRenderTarget(cell*columns,cell*rows,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:true,stencilBuffer:false});
 const scene=new THREE.Scene();
 scene.add(new THREE.HemisphereLight(0xe4f5ff,0x657e91,2.2));
 const sun=new THREE.DirectionalLight(0xfff7e4,2.3);sun.position.set(.42,1,-.36).multiplyScalar(5);scene.add(sun);
 const fill=new THREE.DirectionalLight(0xb2dbff,.55);fill.position.set(-3,2,2);scene.add(fill);
 const camera=new THREE.OrthographicCamera(-1,1,1,-1,.01,20);camera.up.set(0,0,-1);
 const previous=renderer.getRenderTarget(),viewport=renderer.getViewport(new THREE.Vector4()),scissor=renderer.getScissor(new THREE.Vector4()),scissorTest=renderer.getScissorTest(),clear=renderer.getClearColor(new THREE.Color()),alpha=renderer.getClearAlpha();
 const rects=[],halves=[],offsets=[];
 try{
  renderer.setRenderTarget(target);renderer.setScissorTest(false);renderer.setClearColor(0x000000,0);renderer.clear();
  for(const [i,f]of floats.entries()){
   const copy=new THREE.Group();for(const child of f.group.children)copy.add(child.clone(true));copy.position.set(0,f.baseY,0);copy.scale.setScalar(f.scale);copy.updateMatrixWorld(true);
   const bounds=new THREE.Box3().setFromObject(copy),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
   const radius=Math.max(size.x,size.z)*.54+.015;
   const x=(i%columns)*cell,y=Math.floor(i/columns)*cell;
   rects.push(new THREE.Vector4(x/target.width,y/target.height,cell/target.width,cell/target.height));halves.push(new THREE.Vector2(radius,radius));offsets.push(new THREE.Vector2(center.x,center.z));
   scene.add(copy);camera.left=camera.bottom=-radius;camera.right=camera.top=radius;camera.position.set(center.x,5,center.z);camera.lookAt(center.x,0,center.z);camera.updateProjectionMatrix();
   // Render-target rectangles are physical pixels. Renderer.setViewport would
   // multiply these by the screen pixel ratio and overlap the atlas cells.
   target.viewport.set(x,y,cell,cell);target.scissor.set(x,y,cell,cell);target.scissorTest=true;renderer.setRenderTarget(target);renderer.render(scene,camera);scene.remove(copy);
  }
 }finally{
  renderer.setRenderTarget(previous);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(scissorTest);renderer.setClearColor(clear,alpha);
 }
 return {texture:target.texture,rects,halves,offsets,dispose:()=>target.dispose()};
}
