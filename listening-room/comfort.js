// Small embodied rituals; all geometry stays inside the existing avatar renderer.
(()=>{
 const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
 window.comfortFacing=(heading,action,moving)=>{if(moving||!action?.kind||!Number.isFinite(action.heading))return heading;const weight=smooth(action.progress/.15)*smooth((1-action.progress)/.18),delta=Math.atan2(Math.sin(action.heading-heading),Math.cos(action.heading-heading));return heading+delta*weight;};
 window.drawComfortArms=({ellipsoid,face,torso,head,bob,stride,E,action,t})=>{
  const p=action?.progress||0,kind=action?.kind,cream='#f0e7d2';
  if(kind==='tea'){
   const sip=smooth((p-.22)/.16)*(1-smooth((p-.62)/.18)),cupY=torso+.08+sip*.32,z=-.36;
   for(const x of [-.19,.19]){ellipsoid(x,torso+.01+sip*.13,z+.09,.11,.17,.12,cream);ellipsoid(x*.66,cupY,z,.09,.09,.095,cream);}
   const N=12;for(let i=0;i<N;i++){const a=i/N*Math.PI*2,b=(i+1)/N*Math.PI*2;face([[Math.cos(a)*.13,cupY-.09,z+Math.sin(a)*.13],[Math.cos(b)*.13,cupY-.09,z+Math.sin(b)*.13],[Math.cos(b)*.15,cupY+.09,z+Math.sin(b)*.15],[Math.cos(a)*.15,cupY+.09,z+Math.sin(a)*.15]],i<6?'#b99b74':'#d0b38c');face([[0,cupY+.092,z],[Math.cos(a)*.126,cupY+.092,z+Math.sin(a)*.126],[Math.cos(b)*.126,cupY+.092,z+Math.sin(b)*.126]],'#6f5137');}
   ellipsoid(.163,cupY,z,.042,.065,.05,'#b99b74');for(let j=0;j<3;j++){const x=Math.sin(t*.0008+j)*.025,h=.15+j*.08;face([[x-.008,cupY+h,z],[x+.008,cupY+h,z],[x+.024,cupY+h+.10,z+.015],[x+.010,cupY+h+.11,z+.015]],'#ecdfc426');}return;
  }
  if(kind==='blanket'&&p<.42){const lift=Math.sin(clamp(p/.42)*Math.PI)*.13;for(const x of [-.29,.29])ellipsoid(x,torso-.09+lift,-.27,.10,.16,.11,cream);return;}
  for(const [x,k] of [[-.36,1],[.36,-1]]){
   if(kind==='wave'&&k===-1){const envelope=smooth(p/.15)*smooth((1-p)/.2),swing=Math.sin(p*Math.PI*8)*.10*envelope,y=torso-.08+bob+envelope*.48;ellipsoid(x+.06*envelope,y,-.02,.10,.19,.11,cream);ellipsoid(x+.10*envelope+swing,y+.19*envelope,-.04,.095,.10,.10,cream);}
   else{const held=k===1&&E?.carriedCandle,y=held?.94:torso-.08+bob,z=held?-.07:-stride*k*.55;ellipsoid(x,y,z,.105,.185,.115,cream);ellipsoid(x,y-.125,z-.035,.10,.105,.105,cream);}
  }
 };
 window.drawComfortBlanket=({face,action})=>{const unfold=action?.kind==='blanket'?smooth(action.progress/.35):1,width=.12+.30*unfold,length=.12+.55*unfold;for(let row=0;row<5;row++)for(let col=0;col<8;col++){const x=-width+col/8*width*2,xx=-width+(col+1)/8*width*2,z=.12-row/5*length,zz=.12-(row+1)/5*length,top=(x,z)=>.88-Math.max(0,-z-.12)*.83-Math.abs(x)*.08;face([[x,top(x,z),z],[xx,top(xx,z),z],[xx,top(xx,zz),zz],[x,top(x,zz),zz]],(row+col)%3===0?'#9eaf9f':col%2?'#aebcac':'#bac5b3');}};
 const panel=document.createElement('aside');panel.id='comfortPanel';panel.hidden=true;panel.setAttribute('aria-label','조금 쉬기');panel.innerHTML='<button id="closeComfort" aria-label="조금 쉬기 닫기">×</button><small>A SMALL KINDNESS TO YOURSELF</small><h2>몸도, 잠시 쉬어가요.</h2><button id="warmTea">따뜻한 찻잔 감싸기<span>두 손에 온기를, 한 모금 천천히</span></button><button id="softBlanket" aria-pressed="false">담요 덮기<span>무릎 위에 작은 포근함</span></button><p id="comfortStatus" role="status">빈자리에서 편안하게 쉬어가요.</p>';document.body.append(panel);
 const setup=window.setupRituals;window.setupRituals=()=>{setup();const button=document.createElement('button');button.id='comfortButton';button.textContent='조금 쉬기';button.onclick=()=>{const active=window.hallRitual?.restPose==='blanket';$('softBlanket').setAttribute('aria-pressed',active);$('softBlanket').firstChild.textContent=active?'담요 개어두기':'담요 덮기';const open=panel.hidden;panel.hidden=!open;if(open){$('restPanel').hidden=true;$('candlePanel').hidden=true;$('program').hidden=true;if($('recommendPanel'))$('recommendPanel').hidden=true;}};$('restButton').before(button);};
 $('closeComfort').onclick=()=>panel.hidden=true;
 async function settle(){if(window.hallRitual?.phase!=='listening')return false;if(window.roomPresence?.ownState().moving){$('comfortStatus').textContent='자리에 도착하면 편안히 쉬어가요.';return false;}if(window.roomPresence?.ownState().seat<0){$('comfortStatus').textContent='가까운 자리로 천천히 걸어갈게요.';if(!await window.roomSeatNearest?.())return false;}return true;}
 $('warmTea').onclick=async()=>{if(!await settle())return;panel.hidden=true;await window.roomPresence?.act('tea');};
 $('softBlanket').onclick=async()=>{if(!await settle())return;const E=window.hallRitual,on=E.restPose!=='blanket';E.restPose=on?'blanket':null;E.distanceGain=1;window.applyRoomVolume?.();$('softBlanket').setAttribute('aria-pressed',on);$('softBlanket').firstChild.textContent=on?'담요 개어두기':'담요 덮기';panel.hidden=true;if(on)await window.roomPresence?.act('blanket');};
 const sync=()=>{if(document.body.classList.contains('quiet')||document.body.classList.contains('ritualActive')||document.body.classList.contains('stargazing'))panel.hidden=true;};new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
})();
