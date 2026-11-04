// Smooth ellipsoids: continuous vertex lighting on GPU, analytic gradients on Canvas.
const softSphereUnits=new Map();
window.softSphereMesh=(shape,color)=>{
 const N=shape.detail||20,M=Math.round(N*.65),o=shape.pts[0],axes=shape.pts.slice(1).map(v=>v.map((n,i)=>n-o[i]));
 if(!softSphereUnits.has(N)){const units=[],vertex=(u,v)=>{const n=[Math.cos(u)*Math.cos(v),Math.sin(v),Math.sin(u)*Math.cos(v)];units.push(...n,.76+.24*Math.max(0,-n[0]*.35+n[1]*.72+n[2]*.45));};for(let j=0;j<M;j++)for(let i=0;i<N;i++){const a=i/N*Math.PI*2,b=(i+1)/N*Math.PI*2,c=-Math.PI/2+j/M*Math.PI,d=-Math.PI/2+(j+1)/M*Math.PI;vertex(a,c);vertex(b,c);vertex(b,d);vertex(a,c);vertex(b,d);vertex(a,d);}softSphereUnits.set(N,units);}
 const units=softSphereUnits.get(N),out=new Array(units.length/4*7);let k=0;for(let i=0;i<units.length;i+=4){const x=units[i],y=units[i+1],z=units[i+2],light=units[i+3];for(let j=0;j<3;j++)out[k++]=o[j]+axes[0][j]*x+axes[1][j]*y+axes[2][j]*z;out[k++]=color[0]*light;out[k++]=color[1]*light;out[k++]=color[2]*light;out[k++]=color[3];}return out;
};
window.drawSoftSphere=(shape,project,ctx,color=shape.col)=>{
 const p=project(shape.pts[0]);if(!p)return;const axes=shape.pts.slice(1).map(v=>project(v));if(axes.some(v=>!v))return;
 let a=0,b=0,d=0;for(const q of axes){const x=q.x-p.x,y=q.y-p.y;a+=x*x;b+=x*y;d+=y*y;}const root=Math.sqrt(Math.max(0,(a-d)**2+4*b*b)),rx=Math.sqrt(Math.max(.01,(a+d+root)/2)),ry=Math.sqrt(Math.max(.01,(a+d-root)/2)),angle=.5*Math.atan2(2*b,a-d);if(rx>innerWidth*2||ry>innerHeight*2)return;
 const rgb=color[0]==='#'?[0,2,4].map(i=>parseInt(color.slice(1+i,3+i),16)):(color.match(/[\d.]+/g)||[]).slice(0,3).map(Number);if(rgb.length!==3)return;
 const tint=k=>'rgb('+rgb.map(v=>Math.max(0,Math.min(255,Math.round(v*k)))).join(',')+')';ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);ctx.scale(rx,ry);const gradient=ctx.createRadialGradient(-.27,-.30,.05,0,0,1.15);gradient.addColorStop(0,tint(1.04));gradient.addColorStop(.55,tint(.94));gradient.addColorStop(1,tint(.76));ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();
};
// Depth-tested triangles keep intersecting furniture and architecture stable.
window.createHallRenderer=(options={})=>{
 const surface=document.createElement('canvas'),gl=surface.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:true,premultipliedAlpha:false});
 if(!gl)return null;
 const vertex=`attribute vec3 position;attribute vec4 color;uniform vec3 camera;uniform vec4 angles;uniform vec2 scale;uniform float sacred;varying vec4 vColor;void main(){vec3 d=position-camera;float zz=d.x*angles.y-d.z*angles.x;float xx=d.x*angles.x+d.z*angles.y;float yy=d.y*angles.z-zz*angles.w;float z=zz*angles.z+d.y*angles.w;gl_Position=vec4(xx*scale.x,yy*scale.y,1.00227531*z-0.50056883,z);vColor=color;if(sacred>.5){float piano=exp(-length((position.xz-vec2(-.7,-10.0))*vec2(.28,.22)));float roof=exp(-length(position-vec3(0.,16.3,-8.0))*.28);vec3 light=vec3(.20,.27,.34)+vec3(.87,.72,.47)*piano+vec3(.32,.35,.33)*roof;vec3 lit=color.rgb*light;if(color.r>.77&&color.g>.77&&color.b>.61)lit=max(lit,color.rgb*.88);float haze=1.-exp(-length(d)*.009);vColor.rgb=mix(lit,vec3(.075,.115,.13),haze*.45);}}`;
 const fragment=`precision mediump float;varying vec4 vColor;void main(){gl_FragColor=vColor;}`;
 function shader(type,source){const item=gl.createShader(type);gl.shaderSource(item,source);gl.compileShader(item);if(!gl.getShaderParameter(item,gl.COMPILE_STATUS))throw new Error('Unable to prepare the hall renderer');return item;}
 const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);gl.useProgram(program);
 const locations={sacred:gl.getUniformLocation(program,'sacred'),position:gl.getAttribLocation(program,'position'),color:gl.getAttribLocation(program,'color'),camera:gl.getUniformLocation(program,'camera'),angles:gl.getUniformLocation(program,'angles'),scale:gl.getUniformLocation(program,'scale')};
 const colors=new Map();function rgba(value){if(colors.has(value))return colors.get(value);let c;if(value[0]==='#'){let h=value.slice(1);if(h.length===3)h=h.split('').map(x=>x+x).join('');c=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255);c.push(h.length===8?parseInt(h.slice(6),16)/255:1);}else{c=(value.match(/[\d.]+/g)||['128','128','128']).map(Number);c=[c[0]/255,c[1]/255,c[2]/255,c.length>3?c[3]:1];}colors.set(value,c);return c;}
 let paint=f=>f.col;
 function vertices(faces){const out=[];for(const f of faces){const c=rgba(paint(f));if(f.sphere){out.push(...window.softSphereMesh(f,c));continue;}for(let i=1;i<f.pts.length-1;i++)for(const p of [f.pts[0],f.pts[i],f.pts[i+1]])out.push(...p,...c);}return new Float32Array(out);}
 const fixed=gl.createBuffer(),dynamic=gl.createBuffer(),alpha=gl.createBuffer();let fixedCount=-1,fixedVertices=0,glass=[];
 function draw(buffer,data,usage){gl.bindBuffer(gl.ARRAY_BUFFER,buffer);if(data)gl.bufferData(gl.ARRAY_BUFFER,data,usage);gl.enableVertexAttribArray(locations.position);gl.vertexAttribPointer(locations.position,3,gl.FLOAT,false,28,0);gl.enableVertexAttribArray(locations.color);gl.vertexAttribPointer(locations.color,4,gl.FLOAT,false,28,12);gl.drawArrays(gl.TRIANGLES,0,data?data.length/7:fixedVertices);}
 return {render(geometry,count,cam,target,ctx,width,height,focal,colorize){
   paint=colorize?(f=>colorize({material:f,hero:f.hero})):f=>f.col;
   if(surface.width!==target.width||surface.height!==target.height){surface.width=target.width;surface.height=target.height;}
   gl.viewport(0,0,surface.width,surface.height);gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);gl.disable(gl.BLEND);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   gl.uniform1f(locations.sacred,options.sacred?1:0);gl.uniform3f(locations.camera,cam.x,cam.y,cam.z);gl.uniform4f(locations.angles,Math.cos(cam.yaw),Math.sin(cam.yaw),Math.cos(cam.pitch),Math.sin(cam.pitch));gl.uniform2f(locations.scale,2*focal/width,2*focal/height);
   if(fixedCount!==count){const opaque=geometry.slice(0,count).filter(f=>rgba(paint(f))[3]>.995);glass=geometry.slice(0,count).filter(f=>rgba(paint(f))[3]<=.995);const data=vertices(opaque);fixedVertices=data.length/7;gl.bindBuffer(gl.ARRAY_BUFFER,fixed);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);fixedCount=count;}
   draw(fixed,null,gl.STATIC_DRAW);const actors=geometry.slice(count);draw(dynamic,vertices(actors.filter(f=>rgba(paint(f))[3]>.995)),gl.DYNAMIC_DRAW);
   const transparent=glass.concat(actors.filter(f=>rgba(paint(f))[3]<=.995));if(transparent.length){const depth=f=>f.pts.reduce((sum,p)=>sum+(p[0]-cam.x)*Math.sin(cam.yaw)+(cam.z-p[2])*Math.cos(cam.yaw),0)/f.pts.length;transparent.sort((a,b)=>depth(b)-depth(a));gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);draw(alpha,vertices(transparent),gl.DYNAMIC_DRAW);gl.depthMask(true);}
   ctx.drawImage(surface,0,0,width,height);
 }};
};

window.createHallPhysics=(blockers,chairs,floorHeight)=>{
 const radius=.23,chairBuckets=new Map();
 const blockerBuckets=new Map();
 const bucketKey=(x,z)=>Math.floor(x/2)+','+Math.floor(z/2);
 chairs.forEach((s,i)=>{for(let x=Math.floor((s.x-1.2)/2);x<=Math.floor((s.x+1.2)/2);x++)for(let z=Math.floor((s.z-1.2)/2);z<=Math.floor((s.z+1.2)/2);z++){const key=x+','+z;if(!chairBuckets.has(key))chairBuckets.set(key,[]);chairBuckets.get(key).push(i);}});
 for(const b of blockers)for(let x=Math.floor((b.x-b.a/2-radius)/2);x<=Math.floor((b.x+b.a/2+radius)/2);x++)for(let z=Math.floor((b.z-b.c/2-radius)/2);z<=Math.floor((b.z+b.c/2+radius)/2);z++){const key=x+','+z;if(!blockerBuckets.has(key))blockerBuckets.set(key,[]);blockerBuckets.get(key).push(b);}
 function blocked(x,z,y,ignoreSeat=-1){
   const ignored=chairs[ignoreSeat];
   for(const b of blockerBuckets.get(bucketKey(x,z))||[]){if(ignored&&Math.hypot(b.x-ignored.x,b.z-ignored.z)<.55&&b.a<1.2&&b.c<1.2&&b.b<1.6)continue;if(b.y+b.b<=y+.36||b.y>=y+1.72)continue;if(x>b.x-b.a/2-radius&&x<b.x+b.a/2+radius&&z>b.z-b.c/2-radius&&z<b.z+b.c/2+radius)return true;}
   for(const i of chairBuckets.get(bucketKey(x,z))||[]){if(i===ignoreSeat)continue;const s=chairs[i];const sy=s.y||0;if(Math.abs(y-sy)>.65)continue;const theta=s.theta||0,dx=x-s.x,dz=z-s.z,localX=dx*Math.cos(theta)-dz*Math.sin(theta),localZ=dx*Math.sin(theta)+dz*Math.cos(theta);if(Math.abs(localX)<(s.halfWidth||.39)+radius&&Math.abs(localZ)<(s.halfDepth||.39)+radius)return true;}
   return false;
 }
 function camera(from,to,options={}){let limit=1;const start=[from.x,from.y,from.z],delta=[to.x-from.x,to.y-from.y,to.z-from.z];for(const b of blockers){if(options.architectureOnly&&b.b<2.5)continue;let near=0,far=1;const lo=[b.x-b.a/2-.20,b.y-.10,b.z-b.c/2-.20],hi=[b.x+b.a/2+.20,b.y+b.b+.10,b.z+b.c/2+.20];for(let i=0;i<3;i++){if(Math.abs(delta[i])<.0001){if(start[i]<lo[i]||start[i]>hi[i]){near=2;break;}}else{let a=(lo[i]-start[i])/delta[i],c=(hi[i]-start[i])/delta[i];if(a>c)[a,c]=[c,a];near=Math.max(near,a);far=Math.min(far,c);}}if(near<=far&&near>0&&near<limit)limit=near;}const t=limit<1?Math.max(0,limit-.035):1;return {x:from.x+delta[0]*t,y:from.y+delta[1]*t,z:from.z+delta[2]*t};}
 return {blocked,camera,floor:floorHeight,move(from,x,z){const height=floorHeight(x,z);if(Math.abs(height-from.y)>.65)return from;if(!blocked(x,z,height))return {x,y:height,z};if(!blocked(x,from.z,from.y))return {x,y:from.y,z:from.z};if(!blocked(from.x,z,from.y))return {x:from.x,y:from.y,z};return from;},exit(from){for(const r of [.75,1.05,1.5,2])for(let i=0;i<24;i++){const angle=i/24*Math.PI*2,x=from.x+Math.cos(angle)*r,z=from.z+Math.sin(angle)*r,y=floorHeight(x,z);if(Math.abs(y-from.y)<.65&&!blocked(x,z,y))return {x,y,z};}return {...from};}};
};

// Keep the desired orbit independent of the collision-corrected camera.
window.createHallCameraRig=(physics,initial)=>{
 let goal={...initial},boom=Infinity;
 return {reset(value){goal={...value};boom=Infinity;},update(from,desired,dt){
  const blend=1-Math.exp(-Math.min(dt,.1)*4);for(const k of ['x','y','z','yaw','pitch'])goal[k]+=(desired[k]-goal[k])*blend;
  const safe=physics.camera(from,goal,{architectureOnly:true}),dx=goal.x-from.x,dy=goal.y-from.y,dz=goal.z-from.z,length=Math.hypot(dx,dy,dz),available=Math.hypot(safe.x-from.x,safe.y-from.y,safe.z-from.z);
  boom=Math.min(available,boom+Math.min(dt,.1)*2);const ratio=length>.0001?Math.min(1,boom/length):1;
  return {...goal,x:from.x+dx*ratio,y:from.y+dy*ratio,z:from.z+dz*ratio};
 }};
};

// Pinch only the scene, leaving interface controls and browser accessibility intact.
window.setupHallZoom=canvas=>{
 const touches=new Map();let pinching=false,startDistance=0,startZoom=1;window.hallZoom=1;
 const distance=()=>{const p=[...touches.values()];return Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);};
 const consume=e=>{e.preventDefault();e.stopImmediatePropagation();};
 canvas.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touches.size>=2){if(!pinching){pinching=true;startDistance=Math.max(1,distance());startZoom=window.hallZoom;canvas.dispatchEvent(new PointerEvent('pointercancel',{pointerId:-1}));}canvas.setPointerCapture(e.pointerId);consume(e);}else if(pinching)consume(e);},true);
 canvas.addEventListener('pointermove',e=>{if(touches.has(e.pointerId))touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(!pinching)return;if(touches.size>=2)window.hallZoom=Math.max(.65,Math.min(3,startZoom*distance()/startDistance));consume(e);},true);
 const end=e=>{if(e.pointerId===-1)return;touches.delete(e.pointerId);if(pinching){consume(e);if(!touches.size)pinching=false;}};
 canvas.addEventListener('pointerup',end,true);canvas.addEventListener('pointercancel',end,true);
 canvas.addEventListener('wheel',e=>{if(!document.body.classList.contains('hasEntered'))return;e.preventDefault();window.hallZoom=Math.max(.65,Math.min(3,window.hallZoom*Math.exp(-e.deltaY*.0015)));},{passive:false});
 addEventListener('blur',()=>{touches.clear();pinching=false;});
};
