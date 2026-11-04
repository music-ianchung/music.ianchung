// Walkable routes share the same furniture and floor boundaries as manual movement.
window.createSeatWalker=({physics,chairs,person,dest,bounds,getSeat,onStart,onArrive,onCancel,onNotice})=>{
 const STEP=.20,SPEED=1.1;let route=null,target=-1,settling=-1,serial=0,completion=null,pose=0,departureSeat=-1;
 const inside=(x,z)=>bounds(x,z),floor=(x,z)=>physics.floor(x,z);
 function clear(a,b,ignore=-1){const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.09));let y=a.y;for(let k=1;k<=n;k++){const t=k/n,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,h=floor(x,z);if(!inside(x,z)||Math.abs(h-y)>.64||physics.blocked(x,z,h,ignore))return false;y=h;}return true;}
 function plan(index){const seated=getSeat(),startSeat=seated>=0?seated:([departureSeat,target].find(i=>i>=0&&Math.hypot(chairs[i].x-person.x,chairs[i].z-person.z)<1.4)??-1);const chair=chairs[index];if(!chair)return null;const goal={x:chair.x,y:chair.y||0,z:chair.z-(chair.theta===undefined?.06:0)},candidates=[];
  for(const radius of [.70,.86,1.05])for(let i=0;i<24;i++){const a=i/24*Math.PI*2,x=goal.x+Math.sin(a)*radius,z=goal.z+Math.cos(a)*radius,p={x,y:floor(x,z),z};if(inside(x,z)&&!physics.blocked(x,z,p.y)&&clear(p,goal,index))candidates.push(p);}
  if(!candidates.length)return null;
  const key=(x,z)=>x+','+z,cache=new Map(),node=(x,z)=>{const k=key(x,z);if(cache.has(k))return cache.get(k);const wx=x*STEP,wz=z*STEP,y=floor(wx,wz),v=inside(wx,wz)&&!physics.blocked(wx,wz,y)?{x:wx,y,z:wz,g:Infinity,k,ix:x,iz:z}:null;cache.set(k,v);return v;};
  const goals=new Map();for(const p of candidates){const ix=Math.round(p.x/STEP),iz=Math.round(p.z/STEP);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){const v=node(ix+dx,iz+dz);if(v&&clear(v,p))goals.set(v.k,p);}}
  if(!goals.size)return null;
  const heap=[],push=v=>{heap.push(v);let i=heap.length-1;while(i){const p=(i-1)>>1;if(heap[p].f<=v.f)break;heap[i]=heap[p];i=p;}heap[i]=v;},pop=()=>{const first=heap[0],end=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let j=i*2+1;if(j+1<heap.length&&heap[j+1].f<heap[j].f)j++;if(heap[j].f>=end.f)break;heap[i]=heap[j];i=j;}heap[i]=end;}return first;};
  const starts=[];for(const radius of [0,.25,.5,.8,1.1]){for(let i=0;i<(radius?16:1);i++){const a=i/16*Math.PI*2,v=node(Math.round((person.x+Math.sin(a)*radius)/STEP),Math.round((person.z+Math.cos(a)*radius)/STEP));if(v&&clear(person,v,startSeat))starts.push(v);}if(starts.length)break;}
  if(!starts.length)return null;for(const v of starts){v.g=Math.hypot(v.x-person.x,v.z-person.z);v.f=v.g+Math.hypot(v.x-goal.x,v.z-goal.z);v.prev=null;push({v,f:v.f});}
  let found=null,visited=0;while(heap.length&&visited++<85000){const {v,f}=pop();if(v.closed||f>v.f+.001)continue;v.closed=true;if(goals.has(v.k)){found=v;break;}for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){if(!dx&&!dz)continue;const next=node(v.ix+dx,v.iz+dz);if(!next||next.closed||Math.abs(next.y-v.y)>.64||!clear(v,next))continue;const g=v.g+Math.hypot(dx,dz)*STEP+Math.abs(next.y-v.y)*.20;if(g<next.g){next.g=g;next.prev=v;next.f=g+Math.hypot(next.x-goal.x,next.z-goal.z);push({v:next,f:next.f});}}}
  if(!found)return null;let points=[];for(let v=found;v;v=v.prev)points.push({x:v.x,y:v.y,z:v.z});points.reverse();points.push(goals.get(found.k));
  // Remove grid zigzags only when the whole shortcut stays clear.
  const smooth=[];let from={...person},i=0;while(i<points.length){let j=i;while(j+1<points.length&&clear(from,points[j+1],smooth.length?-1:startSeat))j++;smooth.push(points[j]);from=points[j];i=j+1;}smooth.push(goal);return smooth;
 }
 function cancel(){serial++;if(settling>=0&&target>=0)onArrive?.(target);if(route||target>=0){route=null;target=-1;settling=-1;pose=0;Object.assign(dest,person);onCancel?.();}completion?.(false);completion=null;}
 return {
  plan,clear,cancel,get active(){return !!route;},get target(){return target;},get pose(){return pose;},get settling(){return settling>=0;},
  async go(index){if(index===getSeat()&&!route)return true;const ticket=++serial;const points=plan(index);if(!points){onNotice?.('그 자리로 가는 통로를 찾지 못했어요. 다른 자리를 골라주세요.');return false;}
   if(window.roomPresence&&!await window.roomPresence.claimSeat(index))return false;if(ticket!==serial)return false;
   completion?.(false);if(getSeat()>=0)departureSeat=getSeat();route=points;target=index;settling=-1;pose=0;onStart?.(index);Object.assign(dest,route[0]);
   return new Promise(resolve=>completion=resolve);
  },
  tick(dt,canMove=true){if(!route)return null;if(!canMove)return {moving:false,heading:person.heading};
   if(settling>=0){settling+=dt;pose=Math.min(1,settling/.65);const s=chairs[target],heading=-(s.theta||0),d=Math.atan2(Math.sin(heading-person.heading),Math.cos(heading-person.heading));person.heading+=d*Math.min(1,dt*8);if(pose>=1){const i=target;route=null;target=-1;settling=-1;onArrive?.(i);completion?.(true);completion=null;}return {moving:false,heading:person.heading};}
   let distance=SPEED*dt;while(route.length){const p=route[0],dx=p.x-person.x,dz=p.z-person.z,d=Math.hypot(dx,dz);if(d>distance){const f=distance/d;person.x+=dx*f;person.z+=dz*f;person.y+=(p.y-person.y)*f;person.heading=Math.atan2(dx,-dz);break;}Object.assign(person,{x:p.x,y:p.y,z:p.z});distance-=d;route.shift();if(!route.length){settling=0;pose=0;Object.assign(dest,person);return {moving:false,heading:person.heading};}Object.assign(dest,route[0]);if(distance<=0)break;}
   return {moving:true,heading:person.heading};
  }
 };
};
