(()=>{
const C=canvas,X=ctx;let width,height,focal;const blockers=[];let buildingWorld=true,remoteAvatarActive=false;const geo=[],chairs=[],lights=[];
const cam={x:0,y:5.4,z:43,yaw:0,pitch:-.12},dest={x:0,y:0,z:36},person={x:0,y:0,z:36,heading:0};
let lookYaw=0,lookPitch=-.12,moving=false,seat=-1,drag=null,dragged=false,quiet=false;const keys={},hits=[];let stargazing=false,gazeSnapshot=null,gazePending=false;
function face(pts,col){geo.push({pts,col});}function box(x,y,z,a,b,c,cols){if(buildingWorld&&a>=.25&&c>=.25&&b>.12)blockers.push({x,y,z,a,b,c});if(typeof cols==='string')cols=[cols,cols,cols];let l=x-a/2,r=x+a/2,n=z-c/2,f=z+c/2;face([[l,y,n],[r,y,n],[r,y+b,n],[l,y+b,n]],cols[0]);face([[r,y,f],[l,y,f],[l,y+b,f],[r,y+b,f]],cols[1]||cols[0]);face([[l,y,f],[l,y,n],[l,y+b,n],[l,y+b,f]],cols[1]||cols[0]);face([[r,y,n],[r,y,f],[r,y+b,f],[r,y+b,n]],cols[0]);face([[l,y+b,n],[r,y+b,n],[r,y+b,f],[l,y+b,f]],cols[2]||cols[0]);}
function resize(){width=innerWidth;height=innerHeight;let d=Math.min(devicePixelRatio||1,1.6);C.width=width*d;C.height=height*d;X.setTransform(d,0,0,d,0,0);focal=height/(2*Math.tan((width<680?75:67)*Math.PI/360));}addEventListener('resize',resize);resize();
function view(p){let dx=p[0]-cam.x,dy=p[1]-cam.y,dz=cam.z-p[2],c=Math.cos(cam.yaw),s=Math.sin(cam.yaw),xx=dx*c-dz*s,zz=dx*s+dz*c,cp=Math.cos(cam.pitch),sp=Math.sin(cam.pitch);return[xx,dy*cp-zz*sp,zz*cp+dy*sp];}
function project(v){return{x:width/2+v[0]/v[2]*focal,y:height*.5-v[1]/v[2]*focal,d:v[2]};}
function clip(vs){let out=[];for(let i=0;i<vs.length;i++){let a=vs[i],b=vs[(i+1)%vs.length],aa=a[2]>.12,bb=b[2]>.12;if(aa)out.push(a);if(aa!==bb){let t=(.12-a[2])/(b[2]-a[2]);out.push(a.map((v,j)=>v+(b[j]-v)*t));}}return out;}
function point(p){let v=view(p);return v[2]>.12?project(v):null;}
function glow(p,r,a){let pp=point(p);if(!pp)return;let rr=r*focal/pp.d;if(rr<.1)return;let g=X.createRadialGradient(pp.x,pp.y,0,pp.x,pp.y,rr);g.addColorStop(0,`rgba(255,230,165,${a})`);g.addColorStop(.13,`rgba(255,210,130,${a*.5})`);g.addColorStop(1,'rgba(255,201,109,0)');X.fillStyle=g;X.fillRect(pp.x-rr,pp.y-rr,rr*2,rr*2);}


function rod(a,b,r,col){let dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],len=Math.hypot(dx,dy,dz),up=[dx/len,dy/len,dz/len],side=Math.abs(up[1])<.9?[up[2],0,-up[0]]:[1,0,0],n=Math.hypot(...side);side=side.map(x=>x/n);let f=[side[1]*up[2]-side[2]*up[1],side[2]*up[0]-side[0]*up[2],side[0]*up[1]-side[1]*up[0]],pt=(v,u)=>v.map((x,i)=>x+(side[i]*Math.cos(u)+f[i]*Math.sin(u))*r);for(let i=0;i<5;i++)face([pt(a,i/5*Math.PI*2),pt(b,i/5*Math.PI*2),pt(b,(i+1)/5*Math.PI*2),pt(a,(i+1)/5*Math.PI*2)],col);}
// A hundred-metre glass conservatory. The roof stays transparent to the sky.
for(let z=-58;z<48;z+=4)for(let x=-32;x<32;x+=4){face([[x,0,z],[x+4,0,z],[x+4,0,z+4],[x,0,z+4]],Math.abs(x)<3?'#394942':'#263b34');face([[x,.004,z],[x+.025,.004,z],[x+.025,.004,z+4],[x,.004,z+4]],'#4b574744');}
for(let z=-58;z<=48;z+=10){for(let side of [-1,1]){box(side*30,0,z,.18,19,.18,'#3b5651');rod([side*30,19,z],[0,32,z],.095,'#435f59');for(let x=6;x<=24;x+=6)rod([side*x,32-x/30*13,z],[side*x,32-x/30*13,z+10],.04,'#38554f');}rod([-30,19,z],[30,19,z],.055,'#38534f');}
for(let side of [-1,1]){for(let h of [1,7,13,19])rod([side*30,h,-58],[side*30,h,48],.05,'#3b5651');for(let z=-58;z<48;z+=10){face([[side*30,1,z],[side*30,19,z],[side*30,19,z+10],[side*30,1,z+10]],'#8dd5bf05');face([[side*30,19,z],[0,32,z],[0,32,z+10],[side*30,19,z+10]],'#9dcfc606');}}
for(let z of [-58,48])for(let x=-30;x<=30;x+=6){box(x,0,z,.10,32-Math.abs(x)/30*13,.10,'#3d5751');}rod([-30,7,-58],[30,7,-58],.06,'#45645b');
// Low plants and broad leaves leave every table its own breathing space.
function plant(x,z,h,seed){box(x,.02,z,1,.48,1,['#233a32','#30483b','#4f5940']);for(let i=0;i<6;i++){let a=i*2.4+seed,dx=Math.sin(a)*(.6+i*.10),dz=Math.cos(a)*(.6+i*.10),y=.48+h*(.65+(i%3)*.15);rod([x,.45,z],[x+dx*.45,y,z+dz*.45],.022,'#486b4f');face([[x,.55,z],[x+dx*.8-.22,y-.18,z+dz*.8],[x+dx*1.2,y+.15,z+dz*1.2],[x+dx*.8+.22,y-.18,z+dz*.8]],i%2?'#3c6250':'#294d40');}}
for(let z=-50;z<43;z+=7)for(let side of [-1,1]){plant(side*28,z,2.4+(Math.sin(z)*.5+.5)*2,z);plant(side*25,z+2,1.1,z+1);}
for(let z of [-42,-18,6,30])for(let x of [-18,-10,10,18])plant(x,z+3,1.3,x+z);
// A reflecting pool at the far end, lit only around its rim.
box(0,.015,-44,15,.13,10,'#3b5148');face([[-7,.16,-49],[7,.16,-49],[7,.16,-39],[-7,.16,-39]],'#203c3e');for(let x of [-6,6])for(let z of [-47,-41]){box(x,.17,z,.18,.16,.18,'#e0bf82');lights.push([x,.42,z,.025]);}
function table(x,z,index){chairs.push({x,z:z+1.7,label:`테이블 ${String(index+1).padStart(2,'0')}`});box(x,.55,z+1.7,.9,.18,.85,['#45564b','#35483f','#667260']);box(x,.72,z+2.04,.9,.65,.11,'#526455');for(let dx of [-.34,.34])for(let dz of [-.30,.30])box(x+dx,.02,z+1.7+dz,.06,.55,.06,'#465145');
box(x,1.26,z,2.7,.14,1.55,['#554a3c','#3e3f32','#77694e']);for(let dx of [-1.02,1.02])for(let dz of [-.52,.52])box(x+dx,.02,z+dz,.075,1.24,.075,'#444638');
// Individual cassette deck: window, two reels, play key and a tiny amber light.
box(x-.30,1.4,z+.17,.78,.31,.43,['#a7987a','#7b7560','#c2b392']);box(x-.30,1.45,z+.395,.49,.16,.012,'#243c37');for(let dx of [-.13,.13])box(x-.30+dx,1.49,z+.41,.075,.065,.012,'#aaac8a');for(let dx of [-.20,-.08,.04,.16])box(x-.30+dx,1.72,z+.13,.075,.025,.09,dx<-.1?'#b8c5a1':'#5b6658');
// Headphones rest beside the deck; the visitor can put them on.
for(let dx of [-.16,.16])box(x+.63+dx,1.42,z+.25,.12,.10,.20,'#283b36');rod([x+.47,1.50,z+.25],[x+.63,1.59,z+.04],.035,'#6e8679');rod([x+.63,1.59,z+.04],[x+.79,1.50,z+.25],.035,'#6e8679');
box(x+.87,1.4,z-.37,.20,.03,.20,'#847654');box(x+.87,1.43,z-.37,.04,.44,.04,'#9c906c');box(x+.87,1.79,z-.37,.43,.23,.43,['#b39e72','#a99467','#d6bc87']);lights.push([x+.87,1.91,z-.37,.045]);}
let number=0;for(let z=-34;z<=30;z+=12)for(let x of [-22,-14,-6,6,14,22])table(x,z,number++);
// A quiet bench by the glass and a cushion beside the pool.
box(27,.58,35,3,.16,1,'#4f6254');box(27,.74,35.45,3,.8,.10,'#455c4e');box(-3,.18,-36,1.5,.18,1.3,'#77826a');
const worldGeometryCount=geo.length;buildingWorld=false;const depthRenderer=window.createHallRenderer?.(),physics=window.createHallPhysics?.(blockers,chairs,(x,z)=>0);

const seatWalk=window.createSeatWalker({physics,chairs,person,dest,bounds:(x,z)=>x>=-28&&x<=28&&z>=-37&&z<=43,getSeat:()=>seat,
 onStart(i){seat=-1;window.hallRitual.restPose=null;window.hallRitual.distanceGain=1;window.applyRoomVolume?.();window.onGreenhouseDesk?.(-1);Object.keys(keys).forEach(k=>keys[k]=false);$('seatlabel').textContent='선택한 자리로 천천히 걸어가는 중…';},
 onArrive(i){seat=i;moving=false;lookYaw=0;lookPitch=-.22;person.heading=-(chairs[i].theta||0);$('seatlabel').textContent=chairs[i].label+' · 나만의 자리';window.onGreenhouseDesk?.(i);},
 onCancel(){$('seatlabel').textContent='다른 자리를 고르거나 천천히 걸어보세요';},onNotice(text){$('toast').textContent=text;$('toast').style.opacity=1;setTimeout(()=>$('toast').style.opacity=0,3500);}
});

function ellipsoid(x,y,z,rx,ry,rz,col){geo.push({sphere:true,detail:remoteAvatarActive?14:24,pts:[[x,y,z],[x+rx,y,z],[x,y+ry,z],[x,y,z+rz]],col});}

function avatar(t,visitor=null,append=false){
const saved=visitor?{person:{...person},seat,moving}:null;if(visitor){Object.assign(person,{x:visitor.x,y:visitor.y,z:visitor.z,heading:visitor.heading});seat=visitor.seat;moving=visitor.moving;}remoteAvatarActive=!!visitor;
if(!append)geo.length=worldGeometryCount;const start=geo.length,E=visitor?{...window.hallRitual,mood:visitor.mood,restPose:visitor.restPose,carriedCandle:false,gesture:visitor.gesture}:{...window.hallRitual,gesture:window.roomPresence?.ownGesture()},sitting=(seat>=0||(!visitor&&seatWalk.settling)||E?.restPose==='blanket')&&!moving;
const stride=moving?Math.sin(t*.008)*.07:0,bob=moving?Math.abs(Math.sin(t*.008))*.015:Math.sin(t*.0017)*.008;
const action=window.roomPresence?.actionPose(visitor);if(['tea','blanket'].includes(action?.kind))E.carriedCandle=false;
const pose=visitor?(sitting?1:0):seatWalk.settling?seatWalk.pose:(sitting?1:0),torso=.81+.27*pose,head=1.36+.28*pose,cream='#f0e7d2',shadow='#d6c9aa',sage='#a8b8a0';
// A soft little visitor: one round hood, one bean body, tiny mittens and feet.
for(const [x,k] of [[-.145,1],[.145,-1]]){ellipsoid(x,.32+.40*pose,stride*k*(1-pose)-.16*pose,.105+.01*pose,.21-.105*pose,.115+.125*pose,cream);if(pose>.01)ellipsoid(x,.32+.16*pose,-.34*pose,.095*pose,.19*pose,.095*pose,cream);ellipsoid(x,.13+.14*pose,-.045-.345*pose+stride*k*(1-pose),.135-.005*pose,.09-.005*pose,.17-.01*pose,shadow);}
ellipsoid(0,torso+bob,.025,.32,.34,.26,cream);
ellipsoid(0,torso-.19+bob,.025,.31,.18,.255,cream);
window.drawComfortArms?.({ellipsoid,face,torso,head,bob,stride,E,action,t});
const headStart=geo.length;
ellipsoid(0,head+bob,.015,.435,.40,.365,cream);
// Small round ears read as a cozy hood, including from behind.
for(const x of [-.30,.30]){ellipsoid(x,head+.29+bob,.025,.115,.13,.105,cream);ellipsoid(x,head+.30+bob,-.065,.054,.065,.025,'#dfcfb5');}
ellipsoid(0,head-.035+bob,-.285,.315,.245,.115,'#fff2dc');
for(const x of [-.105,.105])ellipsoid(x,head-.005+bob,-.397,.027,.034,.018,'#51483e');
for(const x of [-.19,.19])ellipsoid(x,head-.085+bob,-.378,.052,.028,.014,'#dcae9d');
ellipsoid(0,head-.085+bob,-.403,.021,.014,.012,'#8a7260');
if(action?.kind==='nod'||action?.kind==='tea'){const p=action.progress,angle=action.kind==='nod'?-(Math.sin(p*Math.PI*2)**2)*.16*Math.sin(p*Math.PI):-Math.sin(p*Math.PI)*.10;for(let i=headStart;i<geo.length;i++)geo[i].pts=geo[i].pts.map(([x,y,z])=>{const yy=y-(head-.24);return[x,head-.24+yy*Math.cos(angle)-z*Math.sin(angle),yy*Math.sin(angle)+z*Math.cos(angle)];});}
ellipsoid(0,torso+.25+bob,-.005,.295,.07,.265,sage);
ellipsoid(.12,torso+.10+bob,-.245,.065,.16,.045,sage);
if(E?.restPose==='blanket'&&!moving)window.drawComfortBlanket?.({face,action});
if(E?.carriedCandle)box(-.43,.82,-.07,.12,.22,.12,['#ac956b','#806d4a','#e5d0a0']);
if(E?.restPose==='lean'&&!moving)for(let i=start;i<geo.length;i++)geo[i].pts=geo[i].pts.map(([x,y,z])=>[x,y,z+Math.max(0,y-.2)*.12]);
if(E?.mood){const px=.45,py=torso-.12+bob,pz=-.05,settled=E.settled;if(E.mood==='stone'){ellipsoid(px,py,pz,.11,.085,.095,'#8c887b');if(settled)ellipsoid(px,py+.065,pz,.09,.035,.075,'#83a16a');}else if(E.mood==='water')ellipsoid(px,py,pz,.10,.085,.085,settled?'#bfd9cf':'#84a8a1');else if(E.mood==='leaf')face([[px-.08,py,pz],[px,py+.15,pz],[px+.08,py,pz],[px,py-.05,pz+.025]],settled?'#b3c88b':'#b49e66');else for(let k=0;k<4;k++)ellipsoid(px+Math.sin(k*2)*.05,py+k*.02,pz+Math.cos(k*2)*.03,settled?.06:.08,.021,.03,settled?'#dec89c':'#a48b6e');}
if(visitor?visitor.headphones:window.greenhouseListening?.headphones){for(const x of [-.43,.43])ellipsoid(x,head-.02+bob,.015,.085,.14,.11,'#303e3b');for(let j=0;j<12;j++){let a=j/12*Math.PI,b=(j+1)/12*Math.PI;face([[Math.cos(a)*.46,head+.04+bob+Math.sin(a)*.39,.015],[Math.cos(b)*.46,head+.04+bob+Math.sin(b)*.39,.015],[Math.cos(b)*.49,head+.04+bob+Math.sin(b)*.42,.015],[Math.cos(a)*.49,head+.04+bob+Math.sin(a)*.42,.015]],'#52665e');}}
const facing=window.comfortFacing?.(person.heading,action,moving)??person.heading,co=Math.cos(facing),si=Math.sin(facing);for(let i=start;i<geo.length;i++){geo[i].pts=geo[i].pts.map(([x,y,z])=>[person.x+x*co-z*si,y+person.y,person.z+x*si+z*co]);geo[i].hero=true;}
if(saved){Object.assign(person,saved.person);seat=saved.seat;moving=saved.moving;}remoteAvatarActive=false;
}

function personalCandleGeometry(){let c=window.hallRitual?.candle;if(!c)return;if(Date.now()-c.created>1200000){window.hallRitual.candle=null;return;}let start=geo.length;box(c.x,c.y,c.z,.16,.26,.16,['#bda97c','#948057','#e2c797']);box(c.x,c.y+.26,c.z,.012,.05,.012,'#705331');for(let i=start;i<geo.length;i++)geo[i].hero=true;}
function personalLight(t){let E=window.hallRitual;if(!E)return;let c=E.candle;if(!c&&E.carriedCandle&&!['tea','blanket'].includes(window.roomPresence?.ownGesture())){let co=Math.cos(person.heading),si=Math.sin(person.heading);c={x:person.x-.43*co+.07*si,y:person.y+1.07,z:person.z-.43*si-.07*co,held:true};}if(!c)return;let xyz=[c.x,c.y+(c.held?0:.31),c.z],p=point(xyz);if(!p)return;X.save();X.globalCompositeOperation='screen';let power=.24+(E.blessing||0)*.35;glow(xyz,1.0,power);let r=Math.max(1,.04*focal/p.d);X.fillStyle='#ffe7b2';X.beginPath();X.ellipse(p.x,p.y,r*.65,r*2.1*(1+Math.sin(t*.003)*.12),0,0,Math.PI*2);X.fill();X.restore();}

const starField=Array.from({length:720},(_,i)=>{let a=i*2.399963,y=.12+(Math.sin(i*91.31)*.5+.5)*1.35,r=180;return [Math.cos(a)*Math.cos(y)*r,Math.sin(y)*r,Math.sin(a)*Math.cos(y)*r];});
const slow=matchMedia('(prefers-reduced-motion: reduce)').matches;
function sky(t){let g=X.createLinearGradient(0,0,0,height);g.addColorStop(0,'#030d1b');g.addColorStop(.58,'#133037');g.addColorStop(1,'#182a28');X.fillStyle=g;X.fillRect(0,0,width,height);
for(let i=0;i<starField.length;i++){let q=point(starField[i]);if(!q)continue;X.fillStyle=`rgba(224,238,224,${.32+(Math.sin(i*8+(slow?0:t*.00028))*.5+.5)*.5})`;X.beginPath();X.arc(q.x,q.y,i%23===0?1.6:.7,0,Math.PI*2);X.fill();}
const time=slow?0:t*.00005;X.save();X.globalCompositeOperation='screen';for(let layer=0;layer<2;layer++)for(let j=0;j<60;j++){let x=-135+j*4.5,z=-145-layer*12,y=51+(stargazing?70:0)+layer*10+Math.sin(x*.027+time+layer)*12+Math.sin(x*.08+time*.3)*3;let top=point([x,y,z]),bottom=point([x,y+22+Math.sin(j*.15)*8,z]);if(!top||!bottom)continue;let gg=X.createLinearGradient(0,top.y,0,bottom.y);gg.addColorStop(0,layer===1?'#a997cb24':'#72c9aa45');gg.addColorStop(.35,layer===1?'#a997cb11':'#6ccaa42b');gg.addColorStop(1,'#76c5aa00');let nx=x+4.55,ny=51+(stargazing?70:0)+layer*10+Math.sin(nx*.027+time+layer)*12+Math.sin(nx*.08+time*.3)*3,nt=point([nx,ny,z]),nb=point([nx,ny+22+Math.sin((j+1)*.15)*8,z]);if(!nt||!nb)continue;X.fillStyle=gg;X.beginPath();X.moveTo(top.x,top.y);X.lineTo(nt.x,nt.y);X.lineTo(nb.x,nb.y);X.lineTo(bottom.x,bottom.y);X.fill();}
let moon=point([-70,70,-150]);if(moon){let rad=7*focal/moon.d,mg=X.createRadialGradient(moon.x,moon.y,rad*.5,moon.x,moon.y,rad*5);mg.addColorStop(0,'#c6e0d333');mg.addColorStop(1,'#c6e0d300');X.fillStyle=mg;X.fillRect(moon.x-rad*5,moon.y-rad*5,rad*10,rad*10);X.fillStyle='#d5e2c9';X.beginPath();X.arc(moon.x,moon.y,rad,0,Math.PI*2);X.fill();}X.restore();}
let old=0;function draw(t){focal=height/(2*Math.tan((width<680?75:67)*Math.PI/360))*(window.hallZoom||1);if(t-old<40){requestAnimationFrame(draw);return;}let frameDelta=(t-old)/1000,dt=Math.min(frameDelta,.10);old=t;const speed=1.85*dt;if(keys.ArrowUp||keys.w)walk(0,-speed);if(keys.ArrowDown||keys.s)walk(0,speed);if(keys.ArrowLeft||keys.a)walk(-speed,0);if(keys.ArrowRight||keys.d)walk(speed,0);let lerp=1-Math.exp(-dt*4),dx=dest.x-person.x,dz=dest.z-person.z;const navigation=seatWalk.tick(Math.min(frameDelta,.5),window.hallRitual?.phase==='listening');moving=navigation?navigation.moving:Math.hypot(dx,dz)>.04;if(!navigation){person.x+=dx*lerp;person.z+=dz*lerp;person.y+=(dest.y-person.y)*lerp;}if(navigation)person.heading=navigation.heading;else if(moving)person.heading=Math.atan2(dx,-dz);else if(seat>=0)person.heading=0;let distance=stargazing?0:innerWidth<680?7.4:6.7;cam.x+=(person.x-Math.sin(lookYaw)*distance-cam.x)*lerp;cam.z+=(person.z+Math.cos(lookYaw)*distance-cam.z)*lerp;cam.y+=(person.y+(stargazing?1.55:seat>=0?4.7:5.4)-cam.y)*lerp;cam.yaw+=(lookYaw-cam.yaw)*lerp;cam.pitch+=(lookPitch-cam.pitch)*lerp;if(physics&&!stargazing)Object.assign(cam,physics.camera({x:person.x,y:person.y+1.6,z:person.z},cam));window.roomPresence?.frame(person,seatWalk.target>=0?seatWalk.target:seat,moving);if(stargazing)geo.length=worldGeometryCount;else{avatar(t);for(const visitor of window.roomPresence?.peers()||[])avatar(t,visitor,true);personalCandleGeometry();}sky(t);
if(depthRenderer)depthRenderer.render(geo,worldGeometryCount,cam,C,X,width,height,focal);else{let surfaces=[];for(const g of geo){if(g.sphere){const q=point(g.pts[0]);if(q)surfaces.push({sphere:g,depth:q.d});continue;}let v=clip(g.pts.map(view));if(v.length<3)continue;let ps=v.map(project);if(ps.every(p=>p.x<0)||ps.every(p=>p.x>width)||ps.every(p=>p.y<0)||ps.every(p=>p.y>height))continue;surfaces.push({ps,col:g.col,depth:v.reduce((n,p)=>n+p[2],0)/v.length});}surfaces.sort((a,b)=>b.depth-a.depth);for(const g of surfaces){if(g.sphere){window.drawSoftSphere(g.sphere,point,X);continue;}X.beginPath();g.ps.forEach((p,i)=>i?X.lineTo(p.x,p.y):X.moveTo(p.x,p.y));X.closePath();X.fillStyle=g.col;X.fill();}
}
X.save();X.globalCompositeOperation='screen';for(const l of stargazing?[]:lights){glow(l,1.3,.18);let q=point(l);if(q){let r=Math.max(.5,l[3]*focal/q.d);X.fillStyle='#ffe0a0';X.beginPath();X.arc(q.x,q.y,r,0,Math.PI*2);X.fill();}}X.restore();if(!stargazing)personalLight(t);
let vignette=X.createRadialGradient(width/2,height*.45,height*.25,width/2,height*.5,Math.max(width,height)*.75);vignette.addColorStop(0,'#00101900');vignette.addColorStop(1,'#000d1266');X.fillStyle=vignette;X.fillRect(0,0,width,height);
hits.length=0;if(!stargazing){chairs.forEach((s,i)=>{let p=point([s.x,1,s.z-.8]);if(p)hits.push({...p,i,r:Math.max(13,1.3*focal/p.d)});});let label=point([person.x,person.y+2.20,person.z]);if(label){X.fillStyle='#dce5ca';X.font='10px sans-serif';X.textAlign='center';X.fillText(window.roomPresence?.nickname||'나',label.x,label.y);}window.roomPresence?.paintLabels(point,X);window.roomPresence?.paintSeats(X,hits);}requestAnimationFrame(draw);}requestAnimationFrame(draw);
function leaveDesk(){if(seat>=0){seat=-1;window.onGreenhouseDesk?.(-1);}window.hallRitual.restPose=null;window.hallRitual.distanceGain=1;window.applyRoomVolume?.();}
function settleSeat(){Object.assign(person,{x:dest.x,y:dest.y,z:dest.z,heading:seat>=0?-(chairs[seat]?.theta||0):person.heading});moving=false;const distance=(innerWidth<680?7.4:6.7);Object.assign(cam,{x:person.x-Math.sin(lookYaw)*distance,z:person.z+Math.cos(lookYaw)*distance,y:person.y+4.7,yaw:lookYaw,pitch:lookPitch});Object.keys(keys).forEach(k=>keys[k]=false);}
function leaveSeat(){if(seat<0)return;const exit=physics?.exit(person)||{x:person.x+.8,y:person.y,z:person.z};seat=-1;Object.assign(dest,exit);Object.assign(person,exit);}
window.onRoomSeatConflict=()=>{seatWalk.cancel();if(stargazing)endStargazing();leaveSeat();$('seatlabel').textContent='다른 빈자리를 골라주세요';};window.roomSpawn=e=>{Object.assign(person,{x:e.x,y:e.y,z:e.z});Object.assign(dest,{x:e.x,y:e.y,z:e.z});cam.x=e.x;};window.roomSeatNearest=()=>window.greenhouseScene?.sitNearest();
function walk(x,z){if(stargazing)return;seatWalk.cancel();if(window.hallRitual?.phase!=='listening')return;leaveSeat();window.onGreenhouseDesk?.(-1);leaveDesk();dest.y=0;dest.x=Math.max(-28,Math.min(28,dest.x+x*Math.cos(lookYaw)-z*Math.sin(lookYaw)));dest.z=Math.max(-37,Math.min(43,dest.z+z*Math.cos(lookYaw)+x*Math.sin(lookYaw)));const step=physics?.move(person,dest.x,dest.z);if(step)Object.assign(dest,step);$('seatlabel').textContent='테이블을 누르면 나만의 감상이 시작돼요';}
async function sit(i){if(stargazing)endStargazing();return seatWalk.go(i);}
addEventListener('keydown',e=>{if((['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||e.target.isContentEditable)||$('instructions').open||window.hallRitual?.phase!=='listening')return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)){e.preventDefault();keys[e.key]=true;}});addEventListener('keyup',e=>keys[e.key]=false);addEventListener('blur',()=>Object.keys(keys).forEach(k=>keys[k]=false));for(const [id,k] of [['forward','ArrowUp'],['back','ArrowDown'],['left','ArrowLeft'],['right','ArrowRight']]){let el=$(id);el.onpointerdown=e=>{e.preventDefault();el.setPointerCapture(e.pointerId);keys[k]=true;};el.onpointerup=el.onpointercancel=()=>keys[k]=false;}
C.onpointerdown=e=>{if(window.hallRitual?.phase!=='listening')return;drag={x:e.clientX,y:e.clientY,yaw:lookYaw,pitch:lookPitch};dragged=false;C.setPointerCapture(e.pointerId);};C.onpointermove=e=>{if(!drag)return;let dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>5)dragged=true;if(dragged){lookYaw=drag.yaw-dx*.003;lookPitch=Math.max(stargazing?.55:-.55,Math.min(stargazing?1.48:.38,drag.pitch+dy*.0025));}};C.onpointerup=e=>{if(!stargazing&&!dragged&&drag){if(quiet){quiet=false;document.body.classList.remove('quiet');}else if(window.hallRitual?.placingCandle){window.onCandlePlaced?.({x:person.x+.6,y:.03,z:person.z-.5});}else{let hit=hits.filter(p=>Math.hypot(p.x-e.clientX,p.y-e.clientY)<p.r).sort((a,b)=>a.d-b.d)[0];if(hit)sit(hit.i);else{const p=window.floorTapPoint(e.clientX,e.clientY,cam,width,height,focal,physics.floor);if(p)seatWalk.goPoint(p);}}}drag=null;};C.onpointercancel=()=>drag=null;
$('reset').onclick=()=>{seatWalk.cancel();leaveDesk();dest.x=0;dest.z=36;dest.y=0;lookYaw=0;lookPitch=-.12;$('seatlabel').textContent='테이블을 누르면 나만의 감상이 시작돼요';};$('programtoggle').onclick=()=>{let open=$('program').hidden;$('program').hidden=!open;$('programtoggle').setAttribute('aria-expanded',open);};$('closeprogram').onclick=()=>{$('program').hidden=true;$('programtoggle').setAttribute('aria-expanded','false');};$('hideui').onclick=()=>{quiet=true;document.body.classList.add('quiet');$('program').hidden=true;};$('fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.().catch(()=>{});};
let snapshot=null;function save(){if(!snapshot)snapshot={dest:{...dest},yaw:lookYaw,pitch:lookPitch,seat};Object.keys(keys).forEach(k=>keys[k]=false);}
window.hallScene={async rest(mode){seatWalk.cancel();if(mode==='blanket'){if(await sit(33))window.hallRitual.restPose='blanket';}else{leaveDesk();Object.assign(dest,mode==='balcony'?{x:0,y:0,z:-35}:{x:27,y:0,z:35});lookYaw=mode==='balcony'?0:-.9;lookPitch=.06;$('seatlabel').textContent=mode==='balcony'?'물가에서 바라보는 오로라':'유리창 옆 벤치';}},placeCandle(where){window.onCandlePlaced?.({x:where==='stage'?3:person.x+.65,y:.03,z:where==='stage'?-37:person.z-.4});},breathe(){seatWalk.cancel();save();},quietFarewell(){seatWalk.cancel();save();},curtain(){seatWalk.cancel();save();},restore(){if(snapshot){Object.assign(dest,snapshot.dest);lookYaw=snapshot.yaw;lookPitch=snapshot.pitch;seat=snapshot.seat;snapshot=null;}}};
window.greenhouseScene={stargaze:startStargazing,sitNearest(){let distances=chairs.map((s,i)=>({i,d:Math.hypot(s.x-person.x,s.z-person.z)}));distances=distances.filter(s=>!window.roomPresence?.occupiedSeat(s.i));distances.sort((a,b)=>a.d-b.d);return distances.length?sit(distances[0].i):Promise.resolve(false);}};

const gazeDock=document.createElement('section');gazeDock.id='stargazingView';gazeDock.hidden=true;gazeDock.setAttribute('aria-label','누워서 별 보기');gazeDock.innerHTML='<div><small>UNDER THE SAME SKY</small><p>아무것도 하지 않아도 괜찮은 밤.</p><span>드래그로 하늘 둘러보기</span></div><button id="riseFromStars">천천히 일어나기</button>';document.body.append(gazeDock);
async function startStargazing(){
 if(stargazing||gazePending||window.hallRitual?.phase!=='listening')return;
 gazePending=true;
 try{if(seat<0&&!await window.greenhouseScene.sitNearest())return;
 gazeSnapshot={yaw:lookYaw,pitch:lookPitch,rest:window.hallRitual.restPose};
 stargazing=true;moving=false;drag=null;Object.assign(dest,{x:person.x,y:person.y,z:person.z});Object.keys(keys).forEach(k=>keys[k]=false);
 window.hallRitual.restPose='lean';lookYaw=0;lookPitch=1.08;
 $('restPanel').hidden=true;$('program').hidden=true;$('candlePanel').hidden=true;window.hallRitual.placingCandle=false;
 document.body.classList.remove('quiet','placingCandle');document.body.classList.add('stargazing');gazeDock.hidden=false;
 C.setAttribute('aria-label','누워서 바라보는 별빛 청음실의 밤하늘. 드래그로 별과 오로라를 둘러보세요.');$('riseFromStars').focus();
 }finally{gazePending=false;}
}
function endStargazing(){if(!stargazing)return;stargazing=false;drag=null;lookYaw=gazeSnapshot?.yaw??0;lookPitch=gazeSnapshot?.pitch??-.22;window.hallRitual.restPose=gazeSnapshot?.rest??null;gazeSnapshot=null;document.body.classList.remove('stargazing');gazeDock.hidden=true;C.setAttribute('aria-label','별빛 청음실. 테이블에 앉아 헤드폰으로 듣거나 누워서 별을 바라보세요.');settleSeat();$('stargazeButton').focus();}
$('riseFromStars').onclick=endStargazing;addEventListener('keydown',e=>{if(stargazing&&e.key==='Escape'){e.preventDefault();endStargazing();}});

document.title='잠시, 음악 — 별빛 청음실';C.setAttribute('aria-label','별빛 청음실. 테이블에 앉아 헤드폰으로 듣거나 누워서 별을 바라보세요.');document.querySelector('.place>span').textContent='STARLIGHT LISTENING ROOM';document.querySelector('.topright>span').textContent='36 TABLES · UNDER THE STARS';$('seatlabel').textContent='테이블을 누르면 나만의 감상이 시작돼요';$('welcome').querySelector('h1').innerHTML='별빛 청음실,<br>나만의 작은 밤.';$('welcome').querySelector('h1+p').textContent='넓은 밤하늘 아래, 한 테이블의 온기를 나에게.';
})();

window.setupHallZoom?.(canvas);
