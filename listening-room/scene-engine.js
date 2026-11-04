// Depth-tested triangles keep intersecting furniture and architecture stable.
window.createHallRenderer=()=>{
 const surface=document.createElement('canvas'),gl=surface.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:true,premultipliedAlpha:false});
 if(!gl)return null;
 const vertex=`attribute vec3 position;attribute vec4 color;uniform vec3 camera;uniform vec4 angles;uniform vec2 scale;varying vec4 vColor;void main(){vec3 d=position-camera;float zz=d.x*angles.y-d.z*angles.x;float xx=d.x*angles.x+d.z*angles.y;float yy=d.y*angles.z-zz*angles.w;float z=zz*angles.z+d.y*angles.w;gl_Position=vec4(xx*scale.x,yy*scale.y,1.000667*z-0.200067,z);vColor=color;}`;
 const fragment=`precision mediump float;varying vec4 vColor;void main(){gl_FragColor=vColor;}`;
 function shader(type,source){const item=gl.createShader(type);gl.shaderSource(item,source);gl.compileShader(item);if(!gl.getShaderParameter(item,gl.COMPILE_STATUS))throw new Error('Unable to prepare the hall renderer');return item;}
 const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);gl.useProgram(program);
 const locations={position:gl.getAttribLocation(program,'position'),color:gl.getAttribLocation(program,'color'),camera:gl.getUniformLocation(program,'camera'),angles:gl.getUniformLocation(program,'angles'),scale:gl.getUniformLocation(program,'scale')};
 const colors=new Map();function rgba(value){if(colors.has(value))return colors.get(value);let c;if(value[0]==='#'){let h=value.slice(1);if(h.length===3)h=h.split('').map(x=>x+x).join('');c=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255);c.push(h.length===8?parseInt(h.slice(6),16)/255:1);}else{c=(value.match(/[\d.]+/g)||['128','128','128']).map(Number);c=[c[0]/255,c[1]/255,c[2]/255,c.length>3?c[3]:1];}colors.set(value,c);return c;}
 let paint=f=>f.col;
 function vertices(faces){const out=[];for(const f of faces){const c=rgba(paint(f));for(let i=1;i<f.pts.length-1;i++)for(const p of [f.pts[0],f.pts[i],f.pts[i+1]])out.push(...p,...c);}return new Float32Array(out);}
 const fixed=gl.createBuffer(),dynamic=gl.createBuffer(),alpha=gl.createBuffer();let fixedCount=-1,fixedVertices=0,glass=[];
 function draw(buffer,data,usage){gl.bindBuffer(gl.ARRAY_BUFFER,buffer);if(data)gl.bufferData(gl.ARRAY_BUFFER,data,usage);gl.enableVertexAttribArray(locations.position);gl.vertexAttribPointer(locations.position,3,gl.FLOAT,false,28,0);gl.enableVertexAttribArray(locations.color);gl.vertexAttribPointer(locations.color,4,gl.FLOAT,false,28,12);gl.drawArrays(gl.TRIANGLES,0,data?data.length/7:fixedVertices);}
 return {render(geometry,count,cam,target,ctx,width,height,focal,colorize){
   paint=colorize?(f=>colorize({material:f,hero:f.hero})):f=>f.col;
   if(surface.width!==target.width||surface.height!==target.height){surface.width=target.width;surface.height=target.height;}
   gl.viewport(0,0,surface.width,surface.height);gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);gl.disable(gl.BLEND);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   gl.uniform3f(locations.camera,cam.x,cam.y,cam.z);gl.uniform4f(locations.angles,Math.cos(cam.yaw),Math.sin(cam.yaw),Math.cos(cam.pitch),Math.sin(cam.pitch));gl.uniform2f(locations.scale,2*focal/width,2*focal/height);
   if(fixedCount!==count){const opaque=geometry.slice(0,count).filter(f=>rgba(paint(f))[3]>.995);glass=geometry.slice(0,count).filter(f=>rgba(paint(f))[3]<=.995);const data=vertices(opaque);fixedVertices=data.length/7;gl.bindBuffer(gl.ARRAY_BUFFER,fixed);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);fixedCount=count;}
   draw(fixed,null,gl.STATIC_DRAW);const actors=geometry.slice(count);draw(dynamic,vertices(actors.filter(f=>rgba(paint(f))[3]>.995)),gl.DYNAMIC_DRAW);
   const transparent=glass.concat(actors.filter(f=>rgba(paint(f))[3]<=.995));if(transparent.length){const depth=f=>f.pts.reduce((sum,p)=>sum+(p[0]-cam.x)*Math.sin(cam.yaw)+(cam.z-p[2])*Math.cos(cam.yaw),0)/f.pts.length;transparent.sort((a,b)=>depth(b)-depth(a));gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);draw(alpha,vertices(transparent),gl.DYNAMIC_DRAW);gl.depthMask(true);}
   ctx.drawImage(surface,0,0,width,height);
 }};
};

window.createHallPhysics=(blockers,chairs,floorHeight)=>{
 const radius=.23;
 function blocked(x,z,y){
   for(const b of blockers){if(b.y+b.b<=y+.36||b.y>=y+1.72)continue;if(x>b.x-b.a/2-radius&&x<b.x+b.a/2+radius&&z>b.z-b.c/2-radius&&z<b.z+b.c/2+radius)return true;}
   for(const s of chairs){const sy=s.y||0;if(Math.abs(y-sy)>.65)continue;const theta=s.theta||0,dx=x-s.x,dz=z-s.z,localX=dx*Math.cos(theta)-dz*Math.sin(theta),localZ=dx*Math.sin(theta)+dz*Math.cos(theta);if(Math.abs(localX)<.39+radius&&Math.abs(localZ)<.39+radius)return true;}
   return false;
 }
 function camera(from,to){let limit=1;const start=[from.x,from.y,from.z],delta=[to.x-from.x,to.y-from.y,to.z-from.z];for(const b of blockers){let near=0,far=1;const lo=[b.x-b.a/2-.20,b.y-.10,b.z-b.c/2-.20],hi=[b.x+b.a/2+.20,b.y+b.b+.10,b.z+b.c/2+.20];for(let i=0;i<3;i++){if(Math.abs(delta[i])<.0001){if(start[i]<lo[i]||start[i]>hi[i]){near=2;break;}}else{let a=(lo[i]-start[i])/delta[i],c=(hi[i]-start[i])/delta[i];if(a>c)[a,c]=[c,a];near=Math.max(near,a);far=Math.min(far,c);}}if(near<=far&&near>0&&near<limit)limit=near;}const t=limit<1?Math.max(.15,limit-.06):1;return {x:from.x+delta[0]*t,y:from.y+delta[1]*t,z:from.z+delta[2]*t};}
 return {blocked,camera,move(from,x,z){const height=floorHeight(x,z);if(Math.abs(height-from.y)>.65)return from;if(!blocked(x,z,height))return {x,y:height,z};if(!blocked(x,from.z,from.y))return {x,y:from.y,z:from.z};if(!blocked(from.x,z,from.y))return {x:from.x,y:from.y,z};return from;},exit(from){for(const r of [.75,1.05,1.5,2])for(let i=0;i<24;i++){const angle=i/24*Math.PI*2,x=from.x+Math.cos(angle)*r,z=from.z+Math.sin(angle)*r,y=floorHeight(x,z);if(Math.abs(y-from.y)<.65&&!blocked(x,z,y))return {x,y,z};}return {...from};}};
};
