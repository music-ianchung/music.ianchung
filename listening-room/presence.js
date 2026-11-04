(() => {
  const hall=['vineyard','greenhouse'].includes(new URLSearchParams(location.search).get('hall'))?new URLSearchParams(location.search).get('hall'):'chamber';
  const endpoint=location.hostname==='terminal.local'?location.origin+'/api/presence':'https://ian-listening-room-together.delap.chatgpt.site/api/presence';
  let id=null,secret='',nick='',connection='idle',solo=false,pollTimer=null,joining=false,ownReaction=null;
  let local={x:0,y:0,z:hall==='greenhouse'?36:13,heading:0,seat:-1,moving:false},people=[],programState=null,offset=0,lastProgramAt=0;
  const peers=new Map();let queue=Promise.resolve(),shared=hall!=='greenhouse',lastFrame=performance.now();
  try{nick=localStorage.getItem('listening-room-nickname')||'';secret=sessionStorage.getItem('listening-room-guest')||'';}catch{}
  const nicknameBox=document.createElement('div');nicknameBox.id='nicknameBox';
  nicknameBox.innerHTML='<label for="visitorName">이곳에서 불릴 이름</label><input id="visitorName" maxlength="12" autocomplete="off" spellcheck="false" placeholder="닉네임 · 1~12자"><p id="nicknameMessage" role="status">함께 있는 사람들에게 이 이름이 보여요.</p><button id="soloEntry" hidden>지금은 혼자 들어갈게요</button>';
  $('tuning').parentNode.insertBefore(nicknameBox,$('tuning'));$('visitorName').value=nick;
  const bar=document.createElement('aside');bar.id='presenceBar';bar.setAttribute('aria-label','함께 머무는 사람들');
  bar.innerHTML='<button id="peopleToggle" aria-expanded="false">함께 머무는 중</button><div id="peoplePanel" hidden><strong>같은 공간에 머무는 이름들</strong><ul id="peopleList"></ul><p id="presenceNote" role="status"></p></div><button id="freeSeat" aria-label="가까운 빈자리에 앉기">빈자리</button><div class="quietGestures" role="group" aria-label="조용한 인사"><button data-greet="wave" aria-label="손인사">👋</button><button data-greet="nod" aria-label="고개 끄덕이기">⌒</button><button data-greet="heart" aria-label="따뜻한 마음 보내기">♡</button></div>';
  if(hall!=='greenhouse')bar.insertAdjacentHTML('beforeend','<button id="sharedListening" aria-pressed="true">함께 듣기</button>');
  document.body.append(bar);
  function notice(text){$('toast').textContent=text;$('toast').style.opacity=1;clearTimeout(notice.timer);notice.timer=setTimeout(()=>$('toast').style.opacity=0,3500);}
  function cleanName(){const value=$('visitorName').value.normalize('NFC').trim().replace(/\s+/g,' ');return [...value].length>=1&&[...value].length<=12&&!/[<>\p{C}]/u.test(value)?value:null;}
  function ui(){
    const online=connection==='online';
    $('peopleToggle').textContent=online?`함께 ${people.length}명`:solo?'혼자 머무는 중':connection==='connecting'?'연결하는 중…':'다시 연결하는 중…';
    $('presenceNote').textContent=online?(hall==='greenhouse'?'소리는 각자의 헤드폰에서만 들려요.':'함께 듣기에서는 곡 전환이 모두에게 적용돼요. 일시정지는 나에게만 적용됩니다.'):'연결이 돌아오면 다른 분들의 모습이 다시 보여요.';
    $('peopleList').replaceChildren();
    for(const person of people){const li=document.createElement('li');li.textContent=person.nick+(person.id===id?' · 나':'')+(person.seat!==null?' · '+(person.seat+1)+'번':'');$('peopleList').append(li);}
    document.querySelectorAll('[data-greet]').forEach(b=>b.disabled=!online);
    if(hall!=='greenhouse')$('program').lastElementChild.textContent=(hall==='chamber'?'2':'3')+'편의 연주 · '+(online?'같은 공간에 함께':'혼자 감상하는 공간');
    if($('sharedListening')){$('sharedListening').setAttribute('aria-pressed',online&&shared);$('sharedListening').textContent=online&&shared?'함께 듣기':'혼자 듣기';}
  }
  async function request(kind,extra={}){
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
    try{
      const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(secret?{Authorization:'Bearer '+secret}:{})},body:JSON.stringify({kind,...extra}),signal:controller.signal,cache:'no-store'});
      const data=await response.json();if(!response.ok){const error=new Error(data.error||'잠시 후 다시 시도해주세요.');error.code=data.code;error.status=response.status;throw error;}return data;
    }finally{clearTimeout(timeout);}
  }
  function command(kind,extra={}){const job=queue.then(()=>request(kind,typeof extra==='function'?extra():extra));queue=job.catch(()=>{});return job;}
  function receive(data){
    if(!data.people)return;
    connection='online';offset=Date.now()-data.serverNow;people=data.people;
    const active=new Set();
    for(const person of people){if(person.id===id)continue;active.add(person.id);const before=peers.get(person.id);const target={...person,seat:person.seat??-1,moving:!!person.moving,restPose:person.rest,headphones:!!person.headphones};if(before)Object.assign(before.target,target);else peers.set(person.id,{x:person.x,y:person.y,z:person.z,heading:person.heading,target});}
    for(const key of peers.keys())if(!active.has(key))peers.delete(key);
    if(data.program){programState=data.program;lastProgramAt=performance.now();if(shared)window.recordingRoom?.sync(currentProgram());}
    ui();
  }
  function currentProgram(){
    if(!programState)return null;
    const durations=hall==='chamber'?[319.013,319.613]:[319.573,319.253,319.693];
    let index=programState.index,time=programState.gap>0?durations[index]+8-programState.gap:programState.elapsed;
    time+=(performance.now()-lastProgramAt)/1000;
    while(time>=durations[index]+8){time-=durations[index]+8;index=(index+1)%durations.length;}
    return {index,elapsed:Math.min(time,durations[index]),gap:time>durations[index]?durations[index]+8-time:0};
  }
  function state(){return {...local,mood:window.hallRitual?.mood,rest:window.hallRitual?.restPose,headphones:!!window.greenhouseListening?.headphones};}
  async function heartbeat(){
    if(solo||!id)return;
    try{receive(await command('heartbeat',()=>({state:state()})));}
    catch(error){connection='reconnecting';ui();if(error.code==='seat_taken'){window.onRoomSeatConflict?.();notice(error.message);}if(error.status===401){id=null;secret='';try{await join(nick);}catch{}}}
    finally{clearTimeout(pollTimer);if(!solo&&id)pollTimer=setTimeout(heartbeat,connection==='online'?950:3000);}
  }
  async function join(name){
    connection='connecting';ui();const data=await command('join',{hall,nickname:name});
    id=data.id;if(data.token)secret=data.token;nick=name;solo=false;connection='online';
    try{localStorage.setItem('listening-room-nickname',nick);sessionStorage.setItem('listening-room-guest',secret);}catch{}
    receive(data);const self=data.people.find(p=>p.id===id);if(self)window.roomSpawn?.(self);clearTimeout(pollTimer);pollTimer=setTimeout(heartbeat,950);
  }
  function leave(){
    clearTimeout(pollTimer);if(!id)return;
    fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+secret},body:JSON.stringify({kind:'leave'}),keepalive:true}).catch(()=>{});
    id=null;secret='';people=[];peers.clear();connection='idle';try{sessionStorage.removeItem('listening-room-guest');}catch{}
  }
  const room=window.roomPresence={
    get nickname(){return nick||'나';},get connected(){return connection==='online'&&!solo;},get sharedMusic(){return shared&&connection==='online'&&!solo;},
    program:currentProgram,
    frame(person,seat,moving){local={x:person.x,y:person.y,z:person.z,heading:person.heading,seat,moving};},
    peers(){const now=performance.now(),dt=Math.min(.2,(now-lastFrame)/1000);lastFrame=now;const blend=1-Math.exp(-dt*7);return [...peers.values()].map(p=>{for(const key of ['x','y','z'])p[key]+=(p.target[key]-p[key])*blend;const delta=Math.atan2(Math.sin(p.target.heading-p.heading),Math.cos(p.target.heading-p.heading));p.heading+=delta*blend;return {...p.target,x:p.x,y:p.y,z:p.z,heading:p.heading,gesture:p.target.gesture_until>Date.now()-offset?p.target.gesture:null};}).sort((a,b)=>Math.hypot(a.x-local.x,a.z-local.z)-Math.hypot(b.x-local.x,b.z-local.z)).slice(0,12);},
    occupiedSeat(index){return people.find(p=>p.id!==id&&p.seat===index);},
    async claimSeat(index){if(solo||!id)return true;try{receive(await command('heartbeat',()=>({state:{...state(),seat:index}})));local.seat=index;return true;}catch(error){notice(error.message);return false;}},
    ownGesture(){return ownReaction?.until>Date.now()?ownReaction.kind:null;},
    paintLabels(point,ctx){ctx.save();ctx.textAlign='center';ctx.font='10px sans-serif';for(const person of people){if(person.id===id)continue;const smooth=peers.get(person.id),p=point([(smooth?.x??person.x),(smooth?.y??person.y)+2.25,(smooth?.z??person.z)]);if(!p)continue;ctx.fillStyle='#e3e5ce';ctx.shadowColor='#071713';ctx.shadowBlur=4;ctx.fillText(person.nick,p.x,p.y);if(person.gesture_until>Date.now()-offset){ctx.font='18px sans-serif';ctx.fillText({wave:'👋',nod:'⌒',heart:'♡'}[person.gesture]||'',p.x,p.y-20);ctx.font='10px sans-serif';}}const own=room.ownGesture(),self=point([local.x,local.y+2.65,local.z]);if(own&&self){ctx.font='20px sans-serif';ctx.fillText({wave:'👋',nod:'⌒',heart:'♡'}[own],self.x,self.y);}ctx.restore();},
    paintSeats(ctx,hits){ctx.save();ctx.strokeStyle='#dabd83';ctx.fillStyle='#dabd83';for(const hit of hits){if(!room.occupiedSeat(hit.i))continue;ctx.beginPath();ctx.arc(hit.x,hit.y,Math.min(6,hit.r*.28),0,Math.PI*2);ctx.stroke();}ctx.restore();},
    async changeTrack(index){if(!room.sharedMusic)return false;try{receive(await command('music',{index}));}catch(error){notice(error.message);}return true;}
  };
  $('freeSeat').onclick=()=>window.roomSeatNearest?.();
  $('peopleToggle').onclick=()=>{const show=$('peoplePanel').hidden;$('peoplePanel').hidden=!show;$('peopleToggle').setAttribute('aria-expanded',show);};
  document.querySelectorAll('[data-greet]').forEach(button=>button.onclick=async()=>{if(!room.connected)return;try{receive(await command('gesture',()=>({gesture:button.dataset.greet,state:state()})));ownReaction={kind:button.dataset.greet,until:Date.now()+4000};}catch(error){notice(error.message);}});
  if($('sharedListening'))$('sharedListening').onclick=()=>{shared=!shared;if(shared)window.recordingRoom?.sync(currentProgram());window.recordingRoom?.refresh();ui();};
  for(const field of ['musicform','musicfile'])$(field).addEventListener(field==='musicform'?'submit':'change',()=>{shared=false;ui();});
  const setup=window.setupRituals;
  window.setupRituals=()=>{setup();for(const p of $('instructions').querySelectorAll('p'))p.innerHTML=p.innerHTML.replace('현재는 혼자 감상하는 공간입니다.','닉네임을 정하고 함께 머물 수 있어요. 빈자리 버튼으로 가까운 자리를 고르고, 작은 인사로 마음을 전해보세요.');const enter=$('enter').onclick;
    $('enter').onclick=async()=>{
      if($('enter').disabled||joining)return;
      const name=cleanName();if(!name){$('nicknameMessage').textContent='닉네임을 1~12자로 적어주세요.';$('visitorName').focus();return;}
      joining=true;$('enter').disabled=true;$('nicknameMessage').textContent='같은 공간에 머무는 분들과 연결하고 있어요…';
      initAudio();audio.resume().catch(()=>{});
      try{await join(name);$('enter').disabled=false;enter();}
      catch(error){connection='reconnecting';ui();$('nicknameMessage').textContent=error.message;$('soloEntry').hidden=false;$('enter').disabled=false;}
      finally{joining=false;}
    };
    $('soloEntry').onclick=()=>{const name=cleanName();if(!name){$('visitorName').focus();return;}leave();nick=name;solo=true;connection='idle';shared=false;ui();enter();};
  };
  addEventListener('pagehide',leave);
  $('leaveHall').addEventListener('click',leave);
  $('returnHall').addEventListener('click',()=>{if(!solo&&!id&&nick)join(nick).catch(()=>notice('다시 연결하지 못했어요. 새로 입장해주세요.'));});
  const syncVisibility=()=>{bar.inert=!document.body.classList.contains('hasEntered')||document.body.classList.contains('arrivalActive')||document.body.classList.contains('ritualActive')||document.body.classList.contains('quiet');};
  new MutationObserver(syncVisibility).observe(document.body,{attributes:true,attributeFilter:['class']});syncVisibility();ui();
})();
