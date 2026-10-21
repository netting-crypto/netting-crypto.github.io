import * as THREE from './assets/three.module.js';

// Two render targets hold height and velocity; the surface never depends on a water photograph.
export class WaveField {
  constructor(renderer,size=256){
    this.renderer=renderer;this.size=size;this.span=3.1;
    const options={type:THREE.HalfFloatType,format:THREE.RGBAFormat,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:false,stencilBuffer:false};
    this.front=new THREE.WebGLRenderTarget(size,size,options);this.back=this.front.clone();
    this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    this.uniforms={field:{value:this.front.texture},pixel:{value:new THREE.Vector2(1/size,1/size)},worldPixel:{value:this.span*2/size},center:{value:new THREE.Vector2()},radius:{value:.02},force:{value:0}};
    const vertexShader='varying vec2 uv0;void main(){uv0=uv;gl_Position=vec4(position.xy,0.,1.);}';
    this.stepMaterial=new THREE.ShaderMaterial({uniforms:this.uniforms,vertexShader,fragmentShader:`precision highp float;
uniform sampler2D field;uniform vec2 pixel;uniform float worldPixel;varying vec2 uv0;
void main(){vec2 state=texture2D(field,uv0).rg;
float left=texture2D(field,uv0-vec2(pixel.x,0.)).r,right=texture2D(field,uv0+vec2(pixel.x,0.)).r;
float down=texture2D(field,uv0-vec2(0.,pixel.y)).r,up=texture2D(field,uv0+vec2(0.,pixel.y)).r;
float velocity=(state.g+((left+right+down+up)*.25-state.r)*1.55)*.993;
float edge=min(min(uv0.x,1.-uv0.x),min(uv0.y,1.-uv0.y)),damping=smoothstep(0.,.055,edge);
vec2 gradient=vec2(right-left,down-up)/(2.*worldPixel);
gl_FragColor=vec4((state.r+velocity)*mix(.87,1.,damping),velocity*mix(.7,1.,damping),gradient);}`});
    this.dropMaterial=new THREE.ShaderMaterial({uniforms:this.uniforms,vertexShader,fragmentShader:`precision highp float;uniform sampler2D field;uniform vec2 center;uniform float radius,force;varying vec2 uv0;void main(){vec4 s=texture2D(field,uv0);float d=length(uv0-center)/radius;float bump=d<1.?(1.+cos(d*3.14159265))*.5:0.;s.r+=force*bump;gl_FragColor=s;}`});
    this.quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.stepMaterial);this.scene.add(this.quad);
    const previous=renderer.getRenderTarget(),color=renderer.getClearColor(new THREE.Color()),alpha=renderer.getClearAlpha();renderer.setClearColor(0,0);for(const target of [this.front,this.back]){renderer.setRenderTarget(target);renderer.clear();}renderer.setRenderTarget(previous);renderer.setClearColor(color,alpha);
  }
  pass(material){this.quad.material=material;this.uniforms.field.value=this.front.texture;const before=this.renderer.getRenderTarget();this.renderer.setRenderTarget(this.back);this.renderer.render(this.scene,this.camera);this.renderer.setRenderTarget(before);[this.front,this.back]=[this.back,this.front];}
  step(){this.pass(this.stepMaterial);}
  drop(x,z,radius=.075,strength=-.012){this.uniforms.center.value.set(x/(this.span*2)+.5,.5-z/(this.span*2));this.uniforms.radius.value=radius/(this.span*2);this.uniforms.force.value=strength;this.pass(this.dropMaterial);}
  get texture(){return this.front.texture;}
}

const waveDirections=[[8,34,0],[31,22,1.3],[54,27,2.1],[79,36,.4],[101,39,4],[124,24,2.7],[148,29,5.1],[170,31,.9]];
const waveTerms=waveDirections.map(([angle,frequency,phase])=>{const a=angle*Math.PI/180,k=frequency/1.7;return `s+=vec2(${Math.cos(a).toFixed(7)},${Math.sin(a).toFixed(7)})*${(.81/k).toFixed(7)}*cos(dot(p,vec2(${Math.cos(a).toFixed(7)},${Math.sin(a).toFixed(7)}))*${k.toFixed(7)}-time*${(.6*Math.sqrt(k)).toFixed(7)}+${phase.toFixed(7)});`;}).join('\n');
const waveGLSL=`
const float SPAN=3.1;
uniform sampler2D waveMap;
uniform float time;
vec2 waterUV(vec2 p){return vec2(p.x,-p.y)/(2.*SPAN)+.5;}
float heightAt(vec2 p){return texture2D(waveMap,waterUV(p)).r;}
vec2 rippleSlope(vec2 p){return texture2D(waveMap,waterUV(p)).ba;}
vec2 chopNormal(vec2 world){vec2 p=vec2(world.x,-world.y),s=vec2(0.);
 ${waveTerms}
 return s;
}
vec2 rippleNormal(vec2 p){vec2 s=rippleSlope(p);return normalize(vec3(-s.x,1.,-s.y)).xz;}
vec3 normalFromXZ(vec2 v){v=clamp(v,vec2(-.999),vec2(.999));float squared=min(dot(v,v),.999);return normalize(vec3(v.x,sqrt(max(.001,1.-squared)),v.y));}
`;

export class CausticField {
 constructor(renderer,waves){
  this.renderer=renderer;this.waves=waves;
  const compact=innerWidth<860,resolution=compact?768:1024,segments=compact?420:560;
  this.target=new THREE.WebGLRenderTarget(resolution,resolution,{type:THREE.HalfFloatType,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:false,stencilBuffer:false});this.target.texture.wrapS=this.target.texture.wrapT=THREE.MirroredRepeatWrapping;
  this.temporary=this.target.clone();
  this.uniforms={waveMap:{value:waves.texture},time:{value:0},depth:{value:1.5},sun:{value:new THREE.Vector3(.42,1,-.36).normalize()}};
  const material=new THREE.ShaderMaterial({uniforms:this.uniforms,side:THREE.DoubleSide,blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,blendSrc:THREE.OneFactor,blendDst:THREE.OneFactor,depthTest:false,depthWrite:false,vertexShader:`precision highp float;
${waveGLSL}
uniform float depth;uniform vec3 sun;varying float gathered;
vec3 landing(vec2 p){vec3 start=vec3(p.x,heightAt(p),p.y);vec3 n=normalFromXZ(rippleNormal(p)*.5+chopNormal(p));vec3 ray=refract(-sun,n,1./1.333);return start+ray*((-depth-start.y)/ray.y);}
void main(){vec2 p=position.xy*SPAN;float epsilon=${(6.2/segments).toFixed(9)};
 vec2 a=landing(p+vec2(epsilon,0.)).xz-landing(p-vec2(epsilon,0.)).xz;
 vec2 b=landing(p+vec2(0.,epsilon)).xz-landing(p-vec2(0.,epsilon)).xz;
 float area=abs(a.x*b.y-a.y*b.x);gathered=clamp(4.*epsilon*epsilon/max(area,.0000001),0.,4.);
 vec3 dest=landing(p);gl_Position=vec4(dest.x/SPAN,-dest.z/SPAN,0.,1.);
}`,fragmentShader:'precision highp float;varying float gathered;void main(){gl_FragColor=vec4(vec3(gathered),1.);}' });
  this.scene=new THREE.Scene();this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2,segments,segments),material));this.camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  this.blurUniforms={source:{value:null},direction:{value:new THREE.Vector2()}};
  const blurMaterial=new THREE.ShaderMaterial({uniforms:this.blurUniforms,depthTest:false,depthWrite:false,vertexShader:'varying vec2 uv0;void main(){uv0=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`precision highp float;varying vec2 uv0;uniform sampler2D source;uniform vec2 direction;void main(){vec3 value=texture2D(source,uv0).rgb*.4;value+=(texture2D(source,uv0-direction).rgb+texture2D(source,uv0+direction).rgb)*.24;value+=(texture2D(source,uv0-2.*direction).rgb+texture2D(source,uv0+2.*direction).rgb)*.06;gl_FragColor=vec4(value,1.);}`});
  this.blurScene=new THREE.Scene();this.blurScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),blurMaterial));
 }
 update(time){
  this.uniforms.waveMap.value=this.waves.texture;this.uniforms.time.value=time;
  const before=this.renderer.getRenderTarget(),color=this.renderer.getClearColor(new THREE.Color()),alpha=this.renderer.getClearAlpha();
  this.renderer.setClearColor(0,1);this.renderer.setRenderTarget(this.target);this.renderer.clear();this.renderer.render(this.scene,this.camera);
  this.blurUniforms.source.value=this.target.texture;this.blurUniforms.direction.value.set(1/this.target.width,0);this.renderer.setRenderTarget(this.temporary);this.renderer.render(this.blurScene,this.camera);
  this.blurUniforms.source.value=this.temporary.texture;this.blurUniforms.direction.value.set(0,1/this.target.height);this.renderer.setRenderTarget(this.target);this.renderer.render(this.blurScene,this.camera);
  this.renderer.setRenderTarget(before);this.renderer.setClearColor(color,alpha);
 }
 get texture(){return this.target.texture;}
}

export function createPoolBackdrop(waves,caustics){
 const uniforms={waveMap:{value:waves.texture},causticMap:{value:caustics.texture},time:{value:0},eye:{value:new THREE.Vector3(0,6,0)},viewport:{value:new THREE.Vector2(1280,800)},halfPool:{value:new THREE.Vector2(2.3,1.35)},halfFloor:{value:new THREE.Vector2(2.5,1.42)},depth:{value:1.5},night:{value:0},radius:{value:.09},sun:{value:new THREE.Vector3(.42,1,-.36).normalize()},textMap:{value:null},textHalf:{value:new THREE.Vector2(1.45,.72)},reveal:{value:1},lineReveal:{value:new THREE.Vector3(0,0,0)},titleTurn:{value:0},nameMap:{value:null},floatAtlas:{value:new THREE.DataTexture(new Uint8Array([0,0,0,0]),1,1)},atlasReady:{value:0},atlasRect:{value:Array.from({length:5},()=>new THREE.Vector4())},atlasHalf:{value:Array.from({length:5},()=>new THREE.Vector2(.3,.3))},atlasOffset:{value:Array.from({length:5},()=>new THREE.Vector2())},objectYaw:{value:new Array(5).fill(0)},objectScale:{value:new Array(5).fill(1)},projectionMap:{value:new THREE.DataTexture(new Uint8Array([0,0,0,255]),1,1)},projectionCenter:{value:new THREE.Vector2(99,99)},projectionHalf:{value:new THREE.Vector2(.40,.25)},projectionAmount:{value:0},objectPosition:{value:Array.from({length:5},()=>new THREE.Vector3(99,99,99))},objectSize:{value:Array.from({length:5},()=>new THREE.Vector3(.2,.3,.2))},objectColor:{value:[new THREE.Vector3(.04,.05,.07),new THREE.Vector3(.18,.48,.7),new THREE.Vector3(.05,.07,.12),new THREE.Vector3(1,.72,.01),new THREE.Vector3(1,1,1)]}};
 uniforms.projectionMap.value.needsUpdate=true;uniforms.floatAtlas.value.needsUpdate=true;
 const material=new THREE.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,extensions:{derivatives:true},vertexShader:'varying vec2 screenUV;void main(){screenUV=uv;gl_Position=vec4(position.xy,.99999,1.);}',fragmentShader:`
precision highp float;
varying vec2 screenUV;
${waveGLSL}
uniform sampler2D causticMap,textMap,nameMap,projectionMap,floatAtlas;
uniform vec3 lineReveal;uniform float titleTurn,atlasReady,objectYaw[5],objectScale[5];uniform vec4 atlasRect[5];uniform vec2 atlasHalf[5],atlasOffset[5];
uniform vec2 projectionCenter,projectionHalf;uniform float projectionAmount;
uniform vec3 eye,sun;
uniform vec2 viewport,halfPool,halfFloor,textHalf;
uniform float depth,night,radius,reveal;
uniform vec3 objectPosition[5],objectSize[5],objectColor[5];
float hash(vec2 v){return fract(sin(dot(v,vec2(127.1,311.7)))*43758.5453123);}
float roundedBox(vec2 p,vec2 halfSize,float r){vec2 q=abs(p)-halfSize+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
vec3 deck(vec2 p){
 vec2 cell=p/.2;vec2 f=abs(fract(cell+.5)-.5);float line=1.-smoothstep(.004,.012,min(f.x,f.y));
 vec3 base=mix(vec3(.957,.953,.941),vec3(.255,.263,.282),night);base*=1.-line*mix(.10,.20,night);
 float dist=roundedBox(p,halfPool,radius);float rim=1.-smoothstep(.18,.225,dist);float shadow=exp(-max(dist,0.)*40.)*.18;
 vec2 g=normalize(p+vec2(.001));float directional=dot(g,normalize(sun.xz));
 base=mix(base,base*(.96+.10*directional)+vec3(.045)*pow(max(0.,-directional),2.),rim*.75);base*=1.-shadow;
 return base;
}
vec4 sampleFloat(int index,vec2 offset){
 float yaw=objectYaw[index],c=cos(yaw),s=sin(yaw);vec2 local=vec2(c*offset.x-s*offset.y,s*offset.x+c*offset.y)/max(objectScale[index],.001);
 vec2 uv=(local-atlasOffset[index])/(atlasHalf[index]*2.)+.5;uv.y=1.-uv.y;
 if(any(lessThan(uv,vec2(.003)))||any(greaterThan(uv,vec2(.997))))return vec4(0.);
 return texture2D(floatAtlas,atlasRect[index].xy+uv*atlasRect[index].zw);
}
float shadowAt(vec3 p){
 float shade=0.;vec3 l=-refract(-sun,vec3(0.,1.,0.),1./1.333);
 for(int i=0;i<5;i++){vec3 center=objectPosition[i];vec2 q=p.xz+l.xz/l.y*(center.y-p.y)-center.xz;vec2 h=objectSize[i].xz;float edge=length(q/max(h,vec2(.01)));float fall=1.-smoothstep(.65,1.35,edge);if(atlasReady>.5)fall=sampleFloat(i,q).a;shade=max(shade,fall*.84);}
 vec2 atSurface=p.xz+l.xz/l.y*(-p.y);float walls=1.-smoothstep(-.025,.06,roundedBox(atSurface,halfPool,radius));
 return (1.-shade)*mix(.38,1.,walls);
}
float illumination(vec3 p){
 vec3 l=refract(-sun,vec3(0.,1.,0.),1./1.333);vec2 q=p.xz+l.xz/l.y*(-depth-p.y);
 return texture2D(causticMap,waterUV(q)).r;
}
vec4 lamps(vec3 p,vec3 normal){vec3 light=vec3(0.);float lens=0.;for(int i=0;i<6;i++){float side=i<3?-1.:1.;float x=(float(i)-floor(float(i)/3.)*3.-1.)*halfPool.x*.67;vec3 lamp=vec3(x,-.48,side*halfPool.y);vec3 v=lamp-p;float d2=dot(v,v);vec3 l=normalize(v);float facing=max(dot(normal,l),0.);light+=vec3(1.,.84,.66)*facing*.60/(1.+d2*1.1);if(dot(normal,vec3(0.,0.,-side))>.5)lens+=exp(-d2/.0035)*.75+exp(-d2/.03)*.22;}return vec4(light,lens);}
vec3 floorColor(vec3 p){
 float tileSize=viewport.x<860.?.006:.010;vec2 tile=floor(p.xz/tileSize);vec2 f=fract(p.xz/tileSize);float grout=1.-smoothstep(.055,.13,min(min(f.x,1.-f.x),min(f.y,1.-f.y)));
 float mottle=1.+.05*sin(p.x*3.4+p.z*2.1)+.04*sin(-p.x*2.3+p.z*4.4+1.7);vec3 color=vec3(.86,.95,.97)*mottle;
 vec2 textUV=(tile+.5)*tileSize/(textHalf*2.)+.5;textUV.y=1.-textUV.y;
 if(all(greaterThan(textUV,vec2(0.)))&&all(lessThan(textUV,vec2(1.)))){float row=1.-textUV.y;float progress=row<.44?lineReveal.x:(row<.63?lineReveal.y:lineReveal.z);float ink=texture2D(textMap,textUV).r;float facing=sin(progress*1.5707963);if(row<.44){ink=mix(ink,texture2D(nameMap,textUV).r,step(.5,titleTurn));facing*=abs(cos(titleTurn*3.14159265));}float tileFace=1.-smoothstep(.47*facing,.5*facing+.001,abs(f.x-.5));if(ink>.5&&progress>.001)color=mix(color*.94,vec3(.055,.15,.28)*(.9+.2*hash(tile+2.)),(1.-grout)*tileFace);}
 vec2 projected=(p.xz-projectionCenter)/(projectionHalf*2.)+.5;projected.y=1.-projected.y;if(projectionAmount>.001&&all(greaterThan(projected,vec2(0.)))&&all(lessThan(projected,vec2(1.)))){float e=min(min(projected.x,1.-projected.x),min(projected.y,1.-projected.y));vec3 image=texture2D(projectionMap,projected).rgb;color=mix(color*.35,image*1.35,projectionAmount*smoothstep(0.,.06,e));}
 float c=illumination(p);float web=1.+(clamp(c,.55,3.)-1.)*.62;float shadow=shadowAt(p);vec3 energy=mix(vec3(.28,.58,.64),vec3(.07,.24,.31),night)+mix(vec3(1.,.97,.9)*web*.95*shadow,vec3(.20,.23,.29)*web*.95*shadow,night);
 energy+=night*lamps(p,vec3(0.,1.,0.)).rgb;float ao=smoothstep(0.,.32,min(halfFloor.x-abs(p.x),halfFloor.y-abs(p.z)));return color*energy*mix(.75,1.,ao);
}
vec3 wallColor(vec3 p,vec3 n){
 vec3 sl=-refract(-sun,vec3(0.,1.,0.),1./1.333);float diffuse=max(dot(n,sl),0.);float k=clamp(-p.y/depth,0.,1.);float web=mix(1.,1.+(clamp(illumination(p),.55,3.)-1.)*.62,k);vec3 c=vec3(.30,.86,.96);
 vec3 energy=mix(vec3(.28,.58,.64),vec3(.07,.24,.31),night)*(1.-k*.2)+mix(vec3(1.,.97,.9),vec3(.20,.23,.29),night)*diffuse*web*1.1*shadowAt(p);vec4 lamp=lamps(p,n);energy+=night*lamp.rgb;c*=energy;return c+night*lamp.a*vec3(1.,.84,.66);
}
float wallDistance(float p,float py,float r,float ry,float lip,float lean){float s=r>=0.?1.:-1.;return (lip-s*p-lean*py)/(s*r+lean*ry);}
vec3 underwater(vec3 origin,vec3 ray){
 float t=(-depth-origin.y)/ray.y;vec2 lean=(halfFloor-halfPool)/depth;
 float tx=wallDistance(origin.x,origin.y,ray.x,ray.y,halfPool.x,lean.x),tz=wallDistance(origin.z,origin.y,ray.z,ray.y,halfPool.y,lean.y);
 bool wall=false;vec3 n=vec3(0.,1.,0.);if(tx>0.&&tx<t){t=tx;n=vec3(-sign(ray.x),0.,0.);wall=true;}if(tz>0.&&tz<t){t=tz;n=vec3(0.,0.,-sign(ray.z));wall=true;}
 vec3 point=origin+ray*t;vec3 color=wall?wallColor(point,n):floorColor(point);
 float path=t+(-point.y)/.94;vec3 absorption=mix(vec3(.52,.27,.07),vec3(.52,.15,.07),night);vec3 trans=exp(-absorption*path);vec3 glow=mix(vec3(.02,.26,.38),vec3(.01,.20,.25),night);return color*trans+glow*(1.-exp(-path*.35));
}
void main(){
 vec2 ndc=screenUV*2.-1.;float tanFov=.30573068;vec3 ray=normalize(vec3(ndc.x*viewport.x/viewport.y*tanFov,-1.,-ndc.y*tanFov));vec3 surface=eye+ray*(-eye.y/ray.y);float dist=roundedBox(surface.xz,halfPool,radius);
 if(dist>0.){gl_FragColor=vec4(deck(surface.xz),1.);return;}
 vec3 n=normalFromXZ(rippleNormal(surface.xz)+chopNormal(surface.xz)*.1470588);n=normalize(n-ray*max(0.,.25-dot(n,-ray))*1.5);vec3 refracted=refract(ray,n,1./1.333);vec3 transmitted=underwater(surface,refracted);
 float fresnel=.02+.98*pow(1.-max(dot(-ray,n),0.),5.);vec3 reflected=mix(vec3(.55,.78,.88),vec3(.025,.06,.105),night);vec3 mirrored=reflect(ray,n);
 for(int i=0;i<5;i++){vec3 pos=objectPosition[i];float tr=(pos.y-surface.y)/max(mirrored.y,.001);vec2 q=(surface+mirrored*tr).xz-pos.xz;float silhouette=1.-smoothstep(.7,1.25,length(q/max(objectSize[i].xz,vec2(.01))));if(atlasReady>.5){vec4 model=sampleFloat(i,q);reflected=mix(reflected,model.rgb*mix(1.,.36,night),model.a*.9);}else reflected=mix(reflected,objectColor[i],silhouette*.5);}
 vec3 c=mix(transmitted,reflected,fresnel);float sparkle=pow(max(dot(reflect(-sun,n),-ray),0.),180.);c+=mix(1.,.18,night)*sparkle*vec3(1.,.98,.88)*.8;
 vec2 glintCell=floor(surface.xz*30.),localFacet=fract(surface.xz*30.)-.5;float seed=hash(glintCell),seed2=hash(glintCell+vec2(19.,71.));
 float angle=seed*6.2831853+sin(time*.18+seed2*6.)*.3;vec2 facet=vec2(cos(angle),sin(angle))*(.02+.04*seed2);
 vec3 glintNormal=normalFromXZ(rippleNormal(surface.xz)+chopNormal(surface.xz)*.3529412+facet);
 float alignment=pow(max(dot(reflect(-sun,glintNormal),-ray),0.),700.);float point=exp(-dot(localFacet,localFacet)*180.)+.35*exp(-dot(localFacet,localFacet)*30.);
 c+=vec3(1.,.97,.9)*alignment*point*step(.4,seed)*3.2*mix(1.,.12,night);
 float lip=1.-smoothstep(0.,.045,-dist);c*=1.-lip*.16;
 float peak=max(c.r,max(c.g,c.b));float extra=max(peak-.78,0.);float mapped=min(peak,.78)+extra/(1.+extra/.22);vec3 hue=c*(mapped/max(peak,.00001));vec3 excess=max(c-vec3(.78),vec3(0.));vec3 channels=min(c,vec3(.78))+excess/(vec3(1.)+excess/.22);gl_FragColor=vec4(clamp(mix(channels,hue,.2),0.,1.),1.);
}`});
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);mesh.frustumCulled=false;mesh.renderOrder=-100;return{mesh,uniforms};
}
