(()=>{
const C=canvas,X=ctx;let width,height,focal;const blockers=[];let buildingWorld=true,remoteAvatarActive=false;const geo=[],chairs=[],lights=[];
const cam={x:0,y:5.4,z:26,yaw:0,pitch:-.12},dest={x:0,y:0,z:20},person={x:0,y:0,z:20,heading:0};
let lookYaw=0,lookPitch=-.12,moving=false,seat=-1,drag=null,dragged=false,quiet=false;const keys={},hits=[];let stargazing=false,gazeSnapshot=null,gazePending=false;
function face(pts,col){geo.push({pts,col});}function box(x,y,z,a,b,c,cols){if(buildingWorld&&a>=.25&&c>=.25&&b>.12)blockers.push({x,y,z,a,b,c});if(typeof cols==='string')cols=[cols,cols,cols];let l=x-a/2,r=x+a/2,n=z-c/2,f=z+c/2;face([[l,y,n],[r,y,n],[r,y+b,n],[l,y+b,n]],cols[0]);face([[r,y,f],[l,y,f],[l,y+b,f],[r,y+b,f]],cols[1]||cols[0]);face([[l,y,f],[l,y,n],[l,y+b,n],[l,y+b,f]],cols[1]||cols[0]);face([[r,y,n],[r,y,f],[r,y+b,f],[r,y+b,n]],cols[0]);face([[l,y+b,n],[r,y+b,n],[r,y+b,f],[l,y+b,f]],cols[2]||cols[0]);}
function resize(){width=innerWidth;height=innerHeight;let d=Math.min(devicePixelRatio||1,1.6);C.width=width*d;C.height=height*d;X.setTransform(d,0,0,d,0,0);focal=height/(2*Math.tan((width<680?75:67)*Math.PI/360));}addEventListener('resize',resize);resize();
function view(p){let dx=p[0]-cam.x,dy=p[1]-cam.y,dz=cam.z-p[2],c=Math.cos(cam.yaw),s=Math.sin(cam.yaw),xx=dx*c-dz*s,zz=dx*s+dz*c,cp=Math.cos(cam.pitch),sp=Math.sin(cam.pitch);return[xx,dy*cp-zz*sp,zz*cp+dy*sp];}
function project(v){return{x:width/2+v[0]/v[2]*focal,y:height*.5-v[1]/v[2]*focal,d:v[2]};}
function clip(vs){let out=[];for(let i=0;i<vs.length;i++){let a=vs[i],b=vs[(i+1)%vs.length],aa=a[2]>.12,bb=b[2]>.12;if(aa)out.push(a);if(aa!==bb){let t=(.12-a[2])/(b[2]-a[2]);out.push(a.map((v,j)=>v+(b[j]-v)*t));}}return out;}
function point(p){let v=view(p);return v[2]>.12?project(v):null;}
function glow(p,r,a){let pp=point(p);if(!pp)return;let rr=r*focal/pp.d;if(rr<.1)return;let g=X.createRadialGradient(pp.x,pp.y,0,pp.x,pp.y,rr);g.addColorStop(0,`rgba(255,230,165,${a})`);g.addColorStop(.13,`rgba(255,210,130,${a*.5})`);g.addColorStop(1,'rgba(255,201,109,0)');X.fillStyle=g;X.fillRect(pp.x-rr,pp.y-rr,rr*2,rr*2);}


function rod(a,b,r,col){let dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],len=Math.hypot(dx,dy,dz),up=[dx/len,dy/len,dz/len],side=Math.abs(up[1])<.9?[up[2],0,-up[0]]:[1,0,0],n=Math.hypot(...side);side=side.map(x=>x/n);let f=[side[1]*up[2]-side[2]*up[1],side[2]*up[0]-side[0]*up[2],side[0]*up[1]-side[1]*up[0]],pt=(v,u)=>v.map((x,i)=>x+(side[i]*Math.cos(u)+f[i]*Math.sin(u))*r);for(let i=0;i<5;i++)face([pt(a,i/5*Math.PI*2),pt(b,i/5*Math.PI*2),pt(b,(i+1)/5*Math.PI*2),pt(a,(i+1)/5*Math.PI*2)],col);}
// AFTER HOURS: walnut, velvet, brass and the warmth of a small quintet stage.
function cylinder(x,y,z,r,h,col,top=col){const N=20;for(let j=0;j<N;j++){const a=j/N*Math.PI*2,b=(j+1)/N*Math.PI*2;face([[x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x+Math.cos(b)*r,y,z+Math.sin(b)*r],[x+Math.cos(b)*r,y+h,z+Math.sin(b)*r],[x+Math.cos(a)*r,y+h,z+Math.sin(a)*r]],col);face([[x,y+h,z],[x+Math.cos(a)*r,y+h,z+Math.sin(a)*r],[x+Math.cos(b)*r,y+h,z+Math.sin(b)*r]],top);}}
for(let z=-14;z<26;z+=2)for(let x=-14;x<14;x+=2)face([[x,0,z],[x+2,0,z],[x+2,0,z+2],[x,0,z+2]],['#33251e','#3c2b21','#39281f'][Math.abs(x+z)%3]);
box(-14,0,6,.3,9,40,'#322822');box(14,0,6,.3,9,40,'#322822');box(0,0,-14,28,9,.3,'#29201e');box(0,0,26,28,9,.3,'#302621');box(0,9,6,28,.12,40,'#1c1918');
for(const side of [-1,1])for(let z=-12;z<=24;z+=4){box(side*13.8,.12,z,.12,1.15,3.8,'#493428');box(side*13.7,3.2,z,.08,.8,.23,'#9c7b48');lights.push([side*13.4,3.5,z,.05]);}
for(let z=-10;z<26;z+=5)box(0,8.75,z,28,.25,.24,'#332820');
// Burgundy curtains frame a low, intimate stage with generous aisles outside it.
box(0,0,-9.2,18,.78,8,['#4b3327','#2a231d','#684a35']);
for(let x=-10;x<=10;x+=.5)box(x,.8,-13.5,.46,7,.35,[x%1?'#4c2427':'#3c1f23','#2a181c','#613035']);
box(0,7.75,-13.2,20,.22,.4,'#9a7547');
for(const x of [-8,-4,0,4,8]){cylinder(x,7.5,-8,.24,.35,'#ad8d53');lights.push([x,7.45,-8,.06]);}
for(let x=-8;x<=8;x+=2){cylinder(x,.80,-5.5,.075,.14,'#a08353','#f8ce82');lights.push([x,1.0,-5.5,.024]);}
// The long bar and its back-lit bottle shelves.
box(11.4,0,5.6,2.2,1.65,22,['#3d2b22','#2b231e','#6b4e35']);box(11.25,1.65,5.6,2.65,.18,22.4,['#86643e','#654b30','#b28a55']);
for(const y of [2.4,3.8,5.2]){box(13.55,y,4,.35,.12,19,'#8d6a3e');for(let j=0;j<14;j++){const z=-4.5+j*1.25;cylinder(13.4,y+.12,z,.12,.42,['#34584b','#76513a','#5a4e36'][j%3]);cylinder(13.4,y+.54,z,.055,.18,'#a18b63');}lights.push([13.2,y+.20,4,.035]);}
for(const z of [-3,2,7,12,16]){cylinder(10.5,1.84,z,.16,.06,'#b79d6b');cylinder(10.5,1.90,z,.05,.48,'#8e7850');cylinder(10.5,2.36,z,.30,.28,'#b49157','#e3bd7e');lights.push([10.5,2.5,z,.035]);}
// Round tables and chairs, built without duplicate collision boxes for the seats.
function loungeSeat(x,z,heading,kind,label){const start=geo.length,old=buildingWorld;buildingWorld=false;const theta=-heading;chairs.push({x,y:kind==='bar'?.42:0,z,theta,kind,label,halfWidth:kind==='bar'?.29:.40,halfDepth:kind==='bar'?.29:.38});
 cylinder(0,kind==='bar'?.94:.52,0,kind==='bar'?.32:.43,.18,kind==='bar'?'#503432':'#64353b','#85535a');
 if(kind==='table'){box(0,.7,.32,.84,.60,.10,['#583036','#42252b','#89545b']);for(const dx of [-.32,.32])for(const dz of [-.27,.27])box(dx,.02,dz,.065,.51,.065,'#5d4934');}
 else{cylinder(0,.02,0,.065,.92,'#9a794a');cylinder(0,.02,0,.31,.05,'#6e5738');}
 for(let i=start;i<geo.length;i++)geo[i].pts=geo[i].pts.map(([px,py,pz])=>[x+px*Math.cos(heading)-pz*Math.sin(heading),py,z+px*Math.sin(heading)+pz*Math.cos(heading)]);buildingWorld=old;
}
const tablePlaces=[[-7,2],[-1,3],[-7,10],[-1,12],[3,19]];
for(let i=0;i<tablePlaces.length;i++){const [x,z]=tablePlaces[i];cylinder(x,.04,z,.11,1.14,'#655039');cylinder(x,1.18,z,1.02,.10,'#614732','#a47b51');cylinder(x,1.28,z,.99,.025,'#a47b51','#9a714a');blockers.push({x,y:0,z,a:2.04,b:1.31,c:2.04});
 cylinder(x,1.32,z,.13,.18,'#dbbc83','#f8dfab');lights.push([x,1.60,z,.03]);
 for(let j=0;j<4;j++){const a=j/4*Math.PI*2,sx=x+Math.sin(a)*1.88,sz=z+Math.cos(a)*1.88; loungeSeat(sx,sz,Math.atan2(x-sx,sz-z),'table',`테이블 ${String(i+1).padStart(2,'0')} · ${j+1}번`);}
}
for(let i=0;i<10;i++)loungeSeat(8, -3+i*2,Math.PI/2,'bar',`바 좌석 ${String(i+1).padStart(2,'0')}`);
// Piano, double bass and a compact drum kit.
const piano=[[-6.8,.9,-8.7],[-3.5,.9,-8.7],[-3.5,.9,-11.8],[-5.2,.9,-12.3],[-6.8,.9,-10.9]];
face(piano.map(([x,y,z])=>[x,2.15,z]),'#151719');for(let i=0;i<piano.length;i++){const a=piano[i],b=piano[(i+1)%piano.length];face([[a[0],1.7,a[2]],[b[0],1.7,b[2]],[b[0],2.15,b[2]],[a[0],2.15,a[2]]],'#242120');}
face([[-6.8,2.2,-8.7],[-3.5,2.2,-8.7],[-3.5,3.5,-11.8],[-5.2,3.65,-12.3],[-6.8,3.1,-10.9]],'#29251f');
for(let j=0;j<22;j++){box(-6.75+j*.145,1.92,-8.4,.135,.10,.5,'#dfd8c3');if(j%7!==2&&j%7!==6)box(-6.68+j*.145,2.02,-8.57,.07,.07,.22,'#242323');}
for(const [x,z] of [[-6.4,-8.7],[-3.8,-8.7],[-5,-11.4]])cylinder(x,.8,z,.065,1.0,'#332c22');
box(-5.3,.8,-7.4,1.2,.6,.5,'#292324');
function ball(x,y,z,rx,ry,rz,col){geo.push({sphere:true,detail:18,pts:[[x,y,z],[x+rx,y,z],[x,y+ry,z],[x,y,z+rz]],col});}
ball(4.0,1.8,-10,.70,.85,.22,'#8d552d');ball(4.0,2.3,-10,.53,.56,.19,'#9d6337');rod([4,2.2,-10],[4,3.1,-10],.075,'#493225');for(let i=0;i<4;i++)rod([3.94+i*.04,1.2,-9.74],[3.94+i*.04,3.0,-9.74],.009,'#c6ad78');rod([4,1,-10],[4,.8,-10],.028,'#bba37b');
cylinder(.2,.8,-11,.61,.72,'#724532','#d2b785');cylinder(-.9,1.2,-10.3,.40,.46,'#764a34','#d6c5a2');cylinder(1.2,1.25,-10.4,.42,.48,'#764a34','#d6c5a2');
for(const [x,z] of [[-1.5,-11.3],[1.7,-11.8],[.2,-9.4]]){rod([x,.8,z],[x,2.8,z],.025,'#a89976');cylinder(x,2.8,z,.65,.025,'#ae8c4c','#c5a564');}
for(const x of [-2.3,6.1]){rod([x,.8,-7.1],[x,2.4,-7.1],.022,'#8b8270');rod([x,2.4,-7.1],[x+.3,2.55,-7.1],.026,'#b6aa8b');}
// The quintet performs in gentle loops; music is supplied separately by Ian.
function jazzBand(t){const time=matchMedia('(prefers-reduced-motion: reduce)').matches?0:t*.001;
 const artists=[[-5.3,-7.9,'piano'],[0,-12,'drums'],[5.0,-10.5,'bass'],[-2,-7.5,'sax'],[6.1,-7.8,'trumpet']];
 for(let i=0;i<artists.length;i++){const [x,z,kind]=artists[i],bob=Math.sin(time*1.7+i)*.025,base=.80;
 ball(x,base+.72+bob,z,.30,.40,.24,'#252b29');ball(x,base+1.35+bob,z,.29,.30,.27,'#e6ceb0');ball(x,base+1.57+bob,z+.03,.30,.15,.27,'#302c28');
 for(const dx of [-.12,.12]){ball(x+dx,base+.22,z,.11,.28,.12,'#292d2b');ball(x+dx,base+.04,z-.05,.13,.07,.18,'#252622');}
 const lift=kind==='piano'?.75:kind==='drums'?.78:1.0;
 for(const dx of [-.31,.31]){const beat=Math.sin(time*(kind==='drums'?3.5:2.1)+i+dx*4)*.06;ball(x+dx,base+lift+beat,z-.21,.10,.20,.10,'#303731');ball(x+dx,base+lift-.12+beat,z-.35,.09,.09,.09,'#e6ceb0');if(kind==='drums')rod([x+dx,base+lift-.1+beat,z-.35],[x+dx*.9,base+.6-beat,z+.6],.012,'#c4b18a');}
 if(kind==='sax'){rod([x+.08,base+1.28,z-.30],[x+.26,base+.54,z-.52],.065,'#bb9451');rod([x+.26,base+.54,z-.52],[x+.52,base+.62,z-.55],.085,'#c5a25e');ball(x+.52,base+.65,z-.55,.12,.12,.10,'#d2af66');}
 if(kind==='trumpet'){rod([x,base+1.21,z-.29],[x+.05,base+1.16,z-.95],.06,'#ba9659');ball(x+.05,base+1.16,z-1.0,.17,.17,.065,'#c9a863');}
 }
}

// Quilted velvet backs and softly rounded seats replace hard chair silhouettes.
for(const chair of chairs){if(chair.kind!=='table')continue;const heading=-(chair.theta||0),co=Math.cos(heading),si=Math.sin(heading),at=(x,y,z)=>[chair.x+x*co-z*si,y,chair.z+x*si+z*co];
 for(const x of [-.29,0,.29]){const q=at(x,.97,.36);ball(...q,.19,.31,.095,'#77464a');const b=at(x,.99,.245);ball(...b,.025,.025,.015,'#ac8270');}
}
// Woven rugs beneath the tables, leaving the walking aisles untouched.
for(const [x,z] of tablePlaces){const N=36;for(let j=0;j<N;j++){const a=j/N*Math.PI*2,b=(j+1)/N*Math.PI*2;face([[x,.012,z],[x+Math.cos(a)*2.55,.012,z+Math.sin(a)*2.55],[x+Math.cos(b)*2.55,.012,z+Math.sin(b)*2.55]],j%2?'#503b35':'#554038');}for(let j=0;j<36;j++){const a=j/36*Math.PI*2,b=(j+1)/36*Math.PI*2;face([[x+Math.cos(a)*2.38,.016,z+Math.sin(a)*2.38],[x+Math.cos(b)*2.38,.016,z+Math.sin(b)*2.38],[x+Math.cos(b)*2.48,.016,z+Math.sin(b)*2.48],[x+Math.cos(a)*2.48,.016,z+Math.sin(a)*2.48]],'#8d6b4c');}}
// Picture mouldings, amber sconces and old record sleeves along the brick walls.
for(const side of [-1,1])for(let z=-8;z<24;z+=6){box(side*13.73,2,z,.12,2.65,2.0,'#916e45');box(side*13.63,2.12,z,.06,2.40,1.76,'#282526');for(let k=0;k<5;k++)box(side*13.58,2.4+k*.36,z+(k%2?-.32:.24),.025,.10,.65,['#c3a172','#927259','#745250'][k%3]);}
for(const side of [-1,1])for(let z=-9;z<25;z+=6){cylinder(side*12.8,2.65,z,.30,.45,'#bc9b64','#e3c18a');lights.push([side*12.8,2.88,z,.05]);}
// Books, old vinyl and green leaves soften the back of the room.
for(let j=0;j<18;j++)box(-13.5,.04,-12+j*2,.16,.16,1.82,j%2?'#644434':'#583c30');
for(const [x,z] of [[-12,-3],[-12,18],[12,22]]){cylinder(x,.02,z,.45,.7,'#6a4f36');for(let j=0;j<9;j++){const a=j*2.4;ball(x+Math.sin(a)*.45,1.0+(j%3)*.38,z+Math.cos(a)*.45,.23,.48,.14,j%2?'#526451':'#3d5645');}}
// Subtle exposed-brick courses and low linen pendants give the room a lived-in feel.
for(const side of [-1,1])for(let row=0;row<14;row++)for(let z=-13+(row%2)*.7;z<25;z+=1.4){const x=side*13.82,y=1.5+row*.43;face([[x,y,z],[x,y+.395,z],[x,y+.395,z+1.34],[x,y,z+1.34]],['#3b2f29','#40312a','#382c27'][(row+Math.abs(Math.round(z)))%3]);}
for(const [x,z] of tablePlaces){rod([x,8.8,z],[x,4.6,z],.018,'#756149');for(let j=0;j<20;j++){const a=j/20*Math.PI*2,b=(j+1)/20*Math.PI*2;face([[x+Math.cos(a)*.24,4.9,z+Math.sin(a)*.24],[x+Math.cos(b)*.24,4.9,z+Math.sin(b)*.24],[x+Math.cos(b)*.58,4.45,z+Math.sin(b)*.58],[x+Math.cos(a)*.58,4.45,z+Math.sin(a)*.58]],j%2?'#b69b70':'#c2a87b');}lights.push([x,4.44,z,.045]);}
// A small French Quarter stage: antique brass arch, iron scrolls and velvet swags.
for(let j=0;j<36;j++){const a=j/36*Math.PI,b=(j+1)/36*Math.PI;rod([Math.cos(a)*9.3,4.3+Math.sin(a)*3.25,-12.95],[Math.cos(b)*9.3,4.3+Math.sin(b)*3.25,-12.95],.065,'#987849');}
for(const side of [-1,1]){rod([side*9.3,.8,-12.95],[side*9.3,4.3,-12.95],.075,'#987849');for(let j=0;j<7;j++){const y=1.2+j*.44;for(let k=0;k<14;k++){const a=k/14*Math.PI*2,b=(k+1)/14*Math.PI*2;rod([side*(9.0+Math.cos(a)*.24),y+Math.sin(a)*.20,-12.85],[side*(9.0+Math.cos(b)*.24),y+Math.sin(b)*.20,-12.85],.018,'#685f47');}}}
for(let x=-8.5;x<9;x+=1.7){ball(x,7.0,-13.05,.97,.48,.18,'#623035');ball(x,6.88,-12.90,.87,.20,.11,'#804346');for(let j=0;j<7;j++)ball(x-.74+j*.245,6.73+Math.abs(j-3)*.025,-12.72,.035,.075,.035,'#b79862');}
for(let x=-8.6;x<9;x+=.52){box(x,.10,-5.16,.12,.51,.08,'#987447');ball(x,.65,-5.14,.075,.075,.055,'#b79459');}
// Aged pedestal tables with turned feet and a mellow brass rim.
for(const [x,z] of tablePlaces){cylinder(x,1.285,z,1.035,.025,'#b29762','#b29762');cylinder(x,1.313,z,.99,.012,'#8c6646','#8c6646');for(let j=0;j<3;j++){const a=j/3*Math.PI*2;rod([x,.20,z],[x+Math.cos(a)*.72,.07,z+Math.sin(a)*.72],.065,'#624a32');}cylinder(x,.32,z,.20,.21,'#695039');}
const worldGeometryCount=geo.length;buildingWorld=false;const depthRenderer=window.createHallRenderer?.(),physics=window.createHallPhysics?.(blockers,chairs,(x,z)=>0);

const cameraRig=window.createHallCameraRig(physics,cam);
const seatWalk=window.createSeatWalker({physics,chairs,person,dest,bounds:(x,z)=>x>=-12.9&&x<=12.9&&z>=-4.5&&z<=23.5,getSeat:()=>seat,
 onStart(i){setGroove(false);seat=-1;window.hallRitual.restPose=null;window.hallRitual.distanceGain=1;window.applyRoomVolume?.();Object.keys(keys).forEach(k=>keys[k]=false);$('seatlabel').textContent='선택한 자리로 천천히 걸어가는 중…';},
 onArrive(i){seat=i;moving=false;lookYaw=0;lookPitch=-.13;person.heading=-(chairs[i].theta||0);$('seatlabel').textContent=chairs[i].label+' · 나만의 자리';},
 onCancel(){$('seatlabel').textContent='다른 자리를 고르거나 천천히 걸어보세요';},onNotice(text){$('toast').textContent=text;$('toast').style.opacity=1;setTimeout(()=>$('toast').style.opacity=0,3500);}
});

function ellipsoid(x,y,z,rx,ry,rz,col){geo.push({sphere:true,detail:remoteAvatarActive?14:24,pts:[[x,y,z],[x+rx,y,z],[x,y+ry,z],[x,y,z+rz]],col});}

let grooveOn=false,grooveGain=0;
function setGroove(on){grooveOn=on;const b=document.getElementById('grooveButton');if(b){b.setAttribute('aria-pressed',String(on));b.textContent=on?'리듬 쉬기':'리듬 타기';}}
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
if(!visitor){const music=document.getElementById('jazzRecording'),active=grooveOn&&!moving&&music&&!music.paused&&!music.ended&&window.hallRitual?.phase==='listening'&&!action?.kind;grooveGain+=(Number(active)-grooveGain)*.12;const index=Math.max(0,Math.min(3,Number((music?.currentSrc||'').match(/jazz-0(\d)/)?.[1]||1)-1)),bpm=[104.17,150,87.21,85.23][index],phase=(music?.currentTime||0)*bpm/60*Math.PI,strength=matchMedia('(prefers-reduced-motion: reduce)').matches?.35:1,roll=Math.sin(phase)*.075*grooveGain*strength;
 for(let i=start;i<geo.length;i++)geo[i].pts=geo[i].pts.map(([x,y,z])=>{const weight=Math.max(0,Math.min(1,(y-.65)/.8));return[x+Math.sin(phase)*.045*grooveGain*weight,(y-.65)*Math.cos(roll*weight)-x*Math.sin(roll*weight)+.65,z+Math.sin(phase*2)*.018*grooveGain*weight];});}
const facing=window.comfortFacing?.(person.heading,action,moving)??person.heading,co=Math.cos(facing),si=Math.sin(facing);for(let i=start;i<geo.length;i++){geo[i].pts=geo[i].pts.map(([x,y,z])=>[person.x+x*co-z*si,y+person.y,person.z+x*si+z*co]);geo[i].hero=true;}
if(saved){Object.assign(person,saved.person);seat=saved.seat;moving=saved.moving;}remoteAvatarActive=false;
}

function personalCandleGeometry(){let c=window.hallRitual?.candle;if(!c)return;if(Date.now()-c.created>1200000){window.hallRitual.candle=null;return;}let start=geo.length;box(c.x,c.y,c.z,.16,.26,.16,['#bda97c','#948057','#e2c797']);box(c.x,c.y+.26,c.z,.012,.05,.012,'#705331');for(let i=start;i<geo.length;i++)geo[i].hero=true;}
function personalLight(t){let E=window.hallRitual;if(!E)return;let c=E.candle;if(!c&&E.carriedCandle&&!['tea','blanket'].includes(window.roomPresence?.ownGesture())){let co=Math.cos(person.heading),si=Math.sin(person.heading);c={x:person.x-.43*co+.07*si,y:person.y+1.07,z:person.z-.43*si-.07*co,held:true};}if(!c)return;let xyz=[c.x,c.y+(c.held?0:.31),c.z],p=point(xyz);if(!p)return;X.save();X.globalCompositeOperation='screen';let power=.24+(E.blessing||0)*.35;glow(xyz,1.0,power);let r=Math.max(1,.04*focal/p.d);X.fillStyle='#ffe7b2';X.beginPath();X.ellipse(p.x,p.y,r*.65,r*2.1*(1+Math.sin(t*.003)*.12),0,0,Math.PI*2);X.fill();X.restore();}

const slow=matchMedia('(prefers-reduced-motion: reduce)').matches;
function sky(t){X.fillStyle='#171719';X.fillRect(0,0,width,height);}
let old=0;function draw(t){focal=height/(2*Math.tan((width<680?75:67)*Math.PI/360))*(window.hallZoom||1);if(t-old<40){requestAnimationFrame(draw);return;}let frameDelta=(t-old)/1000,dt=Math.min(frameDelta,.10);old=t;const speed=1.85*dt;if(keys.ArrowUp||keys.w)walk(0,-speed);if(keys.ArrowDown||keys.s)walk(0,speed);if(keys.ArrowLeft||keys.a)walk(-speed,0);if(keys.ArrowRight||keys.d)walk(speed,0);let lerp=1-Math.exp(-dt*4),dx=dest.x-person.x,dz=dest.z-person.z;const navigation=seatWalk.tick(Math.min(frameDelta,.5),window.hallRitual?.phase==='listening');moving=navigation?navigation.moving:Math.hypot(dx,dz)>.04;if(!navigation){person.x+=dx*lerp;person.z+=dz*lerp;person.y+=(dest.y-person.y)*lerp;}if(navigation)person.heading=navigation.heading;else if(moving)person.heading=Math.atan2(dx,-dz);else if(seat>=0)person.heading=-(chairs[seat]?.theta||0);let distance=innerWidth<680?6.5:6.7;Object.assign(cam,cameraRig.update({x:person.x,y:person.y+1.6,z:person.z},{x:person.x-Math.sin(lookYaw)*distance,z:person.z+Math.cos(lookYaw)*distance,y:person.y+(seat>=0?4.1:4.8),yaw:lookYaw,pitch:lookPitch},dt));window.roomPresence?.frame(person,seatWalk.target>=0?seatWalk.target:seat,moving);if(stargazing)geo.length=worldGeometryCount;else{avatar(t);for(const visitor of window.roomPresence?.peers()||[])avatar(t,visitor,true);personalCandleGeometry();}jazzBand(t);sky(t);
if(depthRenderer)depthRenderer.render(geo,worldGeometryCount,cam,C,X,width,height,focal);else{let surfaces=[];for(const g of geo){if(g.sphere){const q=point(g.pts[0]);if(q)surfaces.push({sphere:g,depth:q.d});continue;}let v=clip(g.pts.map(view));if(v.length<3)continue;let ps=v.map(project);if(ps.every(p=>p.x<0)||ps.every(p=>p.x>width)||ps.every(p=>p.y<0)||ps.every(p=>p.y>height))continue;surfaces.push({ps,col:g.col,depth:v.reduce((n,p)=>n+p[2],0)/v.length});}surfaces.sort((a,b)=>b.depth-a.depth);for(const g of surfaces){if(g.sphere){window.drawSoftSphere(g.sphere,point,X);continue;}X.beginPath();g.ps.forEach((p,i)=>i?X.lineTo(p.x,p.y):X.moveTo(p.x,p.y));X.closePath();X.fillStyle=g.col;X.fill();}
}
const jazzSign=point([0,5.8,-13.15]);if(jazzSign){X.save();X.fillStyle='#c9a96d';X.font=`${Math.max(8,1.15*focal/jazzSign.d)}px Georgia`;X.textAlign='center';X.shadowColor='#b99043';X.shadowBlur=10;X.fillText('AFTER HOURS',jazzSign.x,jazzSign.y);X.restore();}
X.save();X.globalCompositeOperation='screen';for(const l of stargazing?[]:lights){glow(l,1.3,.18);let q=point(l);if(q){let r=Math.max(.5,l[3]*focal/q.d);X.fillStyle='#ffe0a0';X.beginPath();X.arc(q.x,q.y,r,0,Math.PI*2);X.fill();}}X.restore();if(!stargazing){personalLight(t);X.save();X.globalCompositeOperation='screen';X.restore();}
let vignette=X.createRadialGradient(width/2,height*.45,height*.25,width/2,height*.5,Math.max(width,height)*.75);vignette.addColorStop(0,'#00101900');vignette.addColorStop(1,'#000d1266');X.fillStyle=vignette;X.fillRect(0,0,width,height);
hits.length=0;if(!stargazing){chairs.forEach((s,i)=>{let p=point([s.x,1,s.z]);if(p)hits.push({...p,i,r:Math.max(13,1.3*focal/p.d)});});let label=point([person.x,person.y+2.20,person.z]);if(label){X.fillStyle='#dce5ca';X.font='10px sans-serif';X.textAlign='center';X.fillText(window.roomPresence?.nickname||'나',label.x,label.y);}window.roomPresence?.paintLabels(point,X);window.roomPresence?.paintSeats(X,hits);}requestAnimationFrame(draw);}requestAnimationFrame(draw);
function leaveDesk(){if(seat>=0){seat=-1;}window.hallRitual.restPose=null;window.hallRitual.distanceGain=1;window.applyRoomVolume?.();}
function settleSeat(){Object.assign(person,{x:dest.x,y:dest.y,z:dest.z,heading:seat>=0?-(chairs[seat]?.theta||0):person.heading});moving=false;const distance=(innerWidth<680?7.4:6.7);Object.assign(cam,{x:person.x-Math.sin(lookYaw)*distance,z:person.z+Math.cos(lookYaw)*distance,y:person.y+4.7,yaw:lookYaw,pitch:lookPitch});cameraRig.reset(cam);Object.keys(keys).forEach(k=>keys[k]=false);}
function leaveSeat(){if(seat<0)return;const exit=physics?.exit(person)||{x:person.x+.8,y:person.y,z:person.z};seat=-1;Object.assign(dest,exit);Object.assign(person,exit);}
window.onRoomSeatConflict=()=>{seatWalk.cancel();leaveSeat();$('seatlabel').textContent='다른 빈자리를 골라주세요';};window.roomSpawn=e=>{Object.assign(person,{x:e.x,y:e.y,z:e.z});Object.assign(dest,{x:e.x,y:e.y,z:e.z});Object.assign(cam,{x:e.x,y:e.y+4.8,z:e.z+6.7,yaw:lookYaw,pitch:lookPitch});cameraRig.reset(cam);};window.roomSeatNearest=()=>window.jazzBarScene?.sitNearest();
function walk(x,z){if(stargazing)return;setGroove(false);seatWalk.cancel();if(window.hallRitual?.phase!=='listening')return;leaveSeat();leaveDesk();dest.y=0;dest.x=Math.max(-12.9,Math.min(12.9,dest.x+x*Math.cos(lookYaw)-z*Math.sin(lookYaw)));dest.z=Math.max(-4.5,Math.min(23.5,dest.z+z*Math.cos(lookYaw)+x*Math.sin(lookYaw)));const step=physics?.move(person,dest.x,dest.z);if(step)Object.assign(dest,step);$('seatlabel').textContent='테이블이나 바 좌석을 눌러 앉아보세요';}
async function sit(i){return seatWalk.go(i);}
addEventListener('keydown',e=>{if((['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||e.target.isContentEditable)||$('instructions').open||window.hallRitual?.phase!=='listening')return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)){e.preventDefault();keys[e.key]=true;}});addEventListener('keyup',e=>keys[e.key]=false);addEventListener('blur',()=>Object.keys(keys).forEach(k=>keys[k]=false));for(const [id,k] of [['forward','ArrowUp'],['back','ArrowDown'],['left','ArrowLeft'],['right','ArrowRight']]){let el=$(id);el.onpointerdown=e=>{e.preventDefault();el.setPointerCapture(e.pointerId);keys[k]=true;};el.onpointerup=el.onpointercancel=()=>keys[k]=false;}
C.onpointerdown=e=>{if(window.hallRitual?.phase!=='listening')return;drag={x:e.clientX,y:e.clientY,yaw:lookYaw,pitch:lookPitch};dragged=false;C.setPointerCapture(e.pointerId);};C.onpointermove=e=>{if(!drag)return;let dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>5)dragged=true;if(dragged){lookYaw=drag.yaw-dx*.003;lookPitch=Math.max(stargazing?.55:-.55,Math.min(stargazing?1.48:.38,drag.pitch+dy*.0025));}};C.onpointerup=e=>{if(!stargazing&&!dragged&&drag){if(quiet){quiet=false;document.body.classList.remove('quiet');}else if(window.hallRitual?.placingCandle){window.onCandlePlaced?.({x:person.x+.6,y:.03,z:person.z-.5});}else{let hit=hits.filter(p=>Math.hypot(p.x-e.clientX,p.y-e.clientY)<p.r).sort((a,b)=>a.d-b.d)[0];if(hit)sit(hit.i);else{const p=window.floorTapPoint(e.clientX,e.clientY,cam,width,height,focal,physics.floor);if(p)seatWalk.goPoint(p);}}}drag=null;};C.onpointercancel=()=>drag=null;
$('reset').onclick=()=>{seatWalk.cancel();leaveDesk();dest.x=0;dest.z=20;dest.y=0;lookYaw=0;lookPitch=-.12;$('seatlabel').textContent='테이블이나 바 좌석을 눌러 앉아보세요';};$('programtoggle').onclick=()=>{let open=$('program').hidden;$('program').hidden=!open;$('programtoggle').setAttribute('aria-expanded',open);};$('closeprogram').onclick=()=>{$('program').hidden=true;$('programtoggle').setAttribute('aria-expanded','false');};$('hideui').onclick=()=>{quiet=true;document.body.classList.add('quiet');$('program').hidden=true;};$('fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.().catch(()=>{});};
let snapshot=null;function save(){if(!snapshot)snapshot={dest:{...dest},yaw:lookYaw,pitch:lookPitch,seat};Object.keys(keys).forEach(k=>keys[k]=false);}
window.hallScene={async rest(mode){const ok=await window.jazzBarScene.sitNearest(mode==='balcony'?'bar':'table');if(ok&&mode==='blanket')window.hallRitual.restPose='blanket';},placeCandle(where){window.onCandlePlaced?.({x:where==='stage'?0:person.x+.6,y:.03,z:where==='stage'?-4.5:person.z-.4});},breathe(){seatWalk.cancel();save();},quietFarewell(){seatWalk.cancel();save();},curtain(){seatWalk.cancel();save();},restore(){if(snapshot){Object.assign(dest,snapshot.dest);lookYaw=snapshot.yaw;lookPitch=snapshot.pitch;seat=snapshot.seat;snapshot=null;}}};
window.jazzBarScene={sitNearest(kind){const list=chairs.map((s,i)=>({s,i,d:Math.hypot(s.x-person.x,s.z-person.z)})).filter(v=>(!kind||v.s.kind===kind)&&!window.roomPresence?.occupiedSeat(v.i)).sort((a,b)=>a.d-b.d);return list.length?sit(list[0].i):Promise.resolve(false);}};
const grooveButton=document.createElement('button');grooveButton.id='grooveButton';grooveButton.textContent='리듬 타기';grooveButton.setAttribute('aria-pressed','false');grooveButton.onclick=()=>{const on=!grooveOn;if(on){seatWalk.cancel();moving=false;Object.assign(dest,person);Object.keys(keys).forEach(k=>keys[k]=false);}setGroove(on);};$('restButton').before(grooveButton);
const seatPanel=document.createElement('aside');seatPanel.id='jazzSeats';seatPanel.setAttribute('aria-label','재즈바 좌석');seatPanel.innerHTML='<small>AFTER HOURS</small><button id="jazzTableSeat">테이블에 앉기</button><button id="jazzBarSeat">바에 앉기</button>';document.body.append(seatPanel);
$('jazzTableSeat').onclick=()=>window.jazzBarScene.sitNearest('table');$('jazzBarSeat').onclick=()=>window.jazzBarScene.sitNearest('bar');
const syncSeatPanel=()=>{seatPanel.inert=!document.body.classList.contains('hasEntered')||document.body.classList.contains('arrivalActive')||document.body.classList.contains('ritualActive')||document.body.classList.contains('quiet');};new MutationObserver(syncSeatPanel).observe(document.body,{attributes:true,attributeFilter:['class']});syncSeatPanel();
document.title='잠시, 음악 — 애프터아워즈 재즈바';C.setAttribute('aria-label','테이블과 바 좌석, 작은 퀸텟 무대가 있는 재즈바');document.querySelector('.place>span').textContent='AFTER HOURS · JAZZ QUINTET';document.querySelector('.topright>span').textContent='20 TABLE SEATS · 10 AT THE BAR';$('seatlabel').textContent='테이블이나 바 좌석을 눌러 앉아보세요';$('welcome').querySelector('h1').innerHTML='밤이 조금 더,<br>깊어지는 자리.';$('welcome').querySelector('h1+p').textContent='낮은 조명과 다섯 연주자, 나만의 늦은 밤.';
const originalSetup=window.setupRituals;window.setupRituals=()=>{originalSetup();document.querySelector('[data-rest="balcony"]').textContent='바에서 쉬기';document.querySelector('[data-rest="lean"]').textContent='테이블에서 쉬기';$('stageExit').textContent='무대 곁에서 조용히 마치기';$('instructions').querySelector('h2').textContent='밤이 깊어도, 편안하게.';const ps=$('instructions').querySelectorAll('p');ps[0].textContent='화면을 드래그해 둘러보고 방향키나 WASD로 걸어보세요. 바닥을 누르면 걸어가고, 의자를 누르면 그 자리까지 걸어가 앉아요.';ps[1].textContent='테이블에 앉기 또는 바에 앉기로 가까운 빈자리를 찾을 수 있어요. 무대에서는 피아노, 콘트라베이스, 드럼, 색소폰, 트럼펫의 퀸텟이 함께해요.';ps[2].textContent='네 편의 재즈 연주가 이어집니다. 함께 듣기에서는 같은 곡을 같은 시간에 듣고, 혼자 듣기로 나만의 감상을 할 수 있어요. 연주 목록에서 번호를 눌러 곡을 고르거나 추천 쪽지를 건네보세요.';};
})();
window.setupHallZoom?.(canvas);
