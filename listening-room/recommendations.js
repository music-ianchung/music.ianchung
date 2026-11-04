(()=>{
 const hall=new URLSearchParams(location.search).get('hall'),count=hall==='chamber'||!hall?2:3;
 const radio=hall==='greenhouse',radioNames=['클래식','팝','뉴에이지'],itemName=index=>radio?radioNames[index]+' 라디오':'연주 '+String(index+1).padStart(2,'0')+'번';
 const toggle=document.createElement('button');toggle.id='recommendToggle';toggle.textContent='추천 쪽지';toggle.setAttribute('aria-expanded','false');$('presenceBar').append(toggle);
 const panel=document.createElement('aside');panel.id='recommendPanel';panel.hidden=true;panel.setAttribute('aria-label','곡 추천 쪽지');
 panel.innerHTML='<button id="closeRecommendations" aria-label="곡 추천 쪽지 닫기">×</button><small>A LITTLE MUSIC, FROM SOMEONE</small><h2>지금, 어떤 곡이 좋을까요.</h2><p class="recommendIntro">함께 있는 이름에서 추천을 부탁할 수 있어요.<br>답하지 않고 조용히 쉬어가도 괜찮아요.</p><div id="recommendList"></div><p id="recommendStatus" role="status"></p>';document.body.append(panel);
 if(radio){panel.querySelector('h2').textContent='지금, 어떤 라디오가 좋을까요.';panel.setAttribute('aria-label','라디오 추천 쪽지');}
 let latest=[],selfId=null,signature='';
 function button(label,action){const b=document.createElement('button');b.textContent=label;b.onclick=async()=>{b.disabled=true;try{await action();}catch{}finally{if(b.isConnected)b.disabled=false;}};return b;}
 function render(){const incoming=latest.filter(r=>r.recipient_id===selfId&&r.status==='pending').length+latest.filter(r=>r.requester_id===selfId&&r.status==='replied').length;toggle.textContent=incoming?'추천 쪽지 · '+incoming:'추천 쪽지';
  const digest=JSON.stringify([selfId,latest]);if(digest===signature)return;signature=digest;const list=$('recommendList');list.replaceChildren();
  if(!latest.length){const p=document.createElement('p');p.className='recommendEmpty';p.textContent='아직 도착한 쪽지는 없어요.';list.append(p);return;}
  for(const item of latest){const card=document.createElement('section');card.className='recommendCard';const title=document.createElement('p'),actions=document.createElement('div');actions.className='recommendActions';
   if(item.recipient_id===selfId){
    if(item.status==='pending'){title.textContent=item.requester_nick+'님이 곡 추천을 부탁했어요.';const hint=document.createElement('span');hint.textContent=radio?'세 가지 추천 채널 중 하나를 골라 건네주세요.':'이 공간의 연주 중 하나를 골라 건네주세요.';card.append(title,hint);
     for(let i=0;i<count;i++)actions.append(button(itemName(i)+' 추천',()=>window.roomPresence.recommend('recommend_reply',{requestId:item.id,index:i})));
     actions.append(button('지금은 쉬어갈게요',()=>window.roomPresence.recommend('recommend_dismiss',{requestId:item.id})));
    }else{title.textContent=item.requester_nick+'님께 '+itemName(item.track_index)+' 추천을 건넸어요.';card.append(title);}
   }else if(item.status==='replied'){
    title.textContent=item.recipient_nick+'님이 '+itemName(item.track_index)+' 추천을 보냈어요.';const hint=document.createElement('span');hint.textContent='선택하면 나에게만 재생돼요.';card.append(title,hint);
    actions.append(button('추천곡 나만 듣기',async()=>{const played=await window.roomPresence.listenRecommended(item.track_index);if(played!==false){$('recommendStatus').textContent='추천받은 연주를 나만 듣고 있어요.';await window.roomPresence.recommend('recommend_close',{requestId:item.id});}}));
    actions.append(button('마음에 담고 접기',()=>window.roomPresence.recommend('recommend_close',{requestId:item.id})));
   }else{title.textContent=item.recipient_nick+'님께 조용히 추천을 부탁했어요.';card.append(title);actions.append(button('요청 접기',()=>window.roomPresence.recommend('recommend_close',{requestId:item.id})));}
   card.append(actions);list.append(card);
  }
 }
 addEventListener('roomSnapshot',event=>{latest=event.detail.recommendations||[];selfId=event.detail.selfId;render();});
 toggle.onclick=()=>{panel.hidden=!panel.hidden;if(!panel.hidden){$('peoplePanel').hidden=true;$('peopleToggle').setAttribute('aria-expanded','false');if($('comfortPanel'))$('comfortPanel').hidden=true;}toggle.setAttribute('aria-expanded',!panel.hidden);};$('closeRecommendations').onclick=()=>{panel.hidden=true;toggle.setAttribute('aria-expanded','false');};
 new MutationObserver(()=>{if(document.body.classList.contains('quiet')||document.body.classList.contains('ritualActive')||document.body.classList.contains('stargazing')){panel.hidden=true;toggle.setAttribute('aria-expanded','false');}}).observe(document.body,{attributes:true,attributeFilter:['class']});render();
})();

