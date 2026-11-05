(() => {
 if(new URLSearchParams(location.search).get('hall')!=='greenhouse')return;
 // Public listener streams, provided by the broadcasters. No audio is relayed or recorded.
 const stations=[
  {key:'classical',label:'클래식',name:'181.FM · Classical Music',country:'미국',description:'오케스트라와 실내악의 깊은 울림',url:'https://www.181.fm/',streams:['https://listen.181fm.com/181-classical_128k.mp3','https://listen.181fm.com/181-classical_64k.aac']},
  {key:'pop',label:'팝',name:'181.FM · The Heart',country:'미국',description:'익숙한 팝과 부드러운 러브송',url:'https://www.181.fm/',streams:['https://listen.181fm.com/181-heart_128k.mp3','https://listen.181fm.com/181-heart_64k.aac']},
  {key:'newage',label:'뉴에이지',name:'1st Greek New Age Radio',country:'그리스',description:'뉴에이지·앰비언트·우주를 닮은 소리',url:'https://newageradio.gr/',streams:['https://stream.newageradio.gr/listen/hq/radio.mp3','https://stream.newageradio.gr/listen/hq/radio.aac']},
  {key:'country',label:'컨트리',name:'181.FM · Kickin’ Country',country:'미국',description:'따뜻한 목소리와 컨트리 기타',url:'https://www.181.fm/',streams:['https://listen.181fm.com/181-kickincountry_128k.mp3','https://listen.181fm.com/181-kickincountry_64k.aac']},
  {key:'folk',label:'포크',name:'Folk Alley',country:'미국',description:'어쿠스틱 기타와 오래 머무는 이야기',url:'https://folkalley.com/',streams:['https://freshgrass.streamguys1.com/folkalley-128mp3']},
  {key:'jazz',label:'재즈',name:'181.FM · Jazz Mix',country:'미국',description:'재즈가 흐르는 작은 밤',url:'https://www.181.fm/',streams:['https://listen.181fm.com/181-jazzmix_128k.mp3','https://listen.181fm.com/181-jazzmix_64k.aac']},
  {key:'christmas',label:'캐롤',name:'181.FM · Christmas Classics',country:'미국',description:'트리 아래, 오래 사랑받은 크리스마스 음악',url:'https://www.181.fm/',streams:['https://listen.181fm.com/181-xtraditional_128k.mp3','https://listen.181fm.com/181-xtraditional_64k.aac']}
 ];
 const state=window.greenhouseListening={headphones:false,desk:-1,sound:'radio',station:null};
 const panel=document.createElement('aside');panel.id='listeningDesk';panel.setAttribute('aria-label','나만의 라디오 테이블');
 panel.innerHTML=`<button id="deskOpen" aria-expanded="false">⌁ 나만의 라디오</button><div id="deskControls" hidden><small>YOUR TABLE, YOUR FREQUENCY</small><h2 id="deskName">아직 비어 있는 나의 자리</h2><button id="nearestDesk">가까운 테이블에 앉기</button><button id="headphones" aria-pressed="false" disabled>헤드폰 쓰기</button><p class="radioPrompt">오늘은, 어떤 음악에 머물까요.</p><div class="deskSounds radioGenres" role="group" aria-label="라디오 장르">${stations.map(s=>`<button data-radio="${s.key}" aria-pressed="false" disabled>${s.label}</button>`).join('')}</div><div class="radioStation"><small id="radioLocation">LIVE RADIO</small><strong id="radioStationName">일곱 갈래의 음악, 나만의 주파수</strong><p id="radioDescription">자리에 앉은 뒤 장르를 골라주세요.</p><a id="radioOfficial" target="_blank" rel="noopener noreferrer" hidden>방송국 공식 사이트 ↗</a></div><div class="tapeWindow" aria-hidden="true"><i></i><span>RADIO / LIVE</span><i></i></div><button id="tapePlay" disabled>라디오 재생</button><p id="deskStatus" role="status">테이블에 앉으면 일곱 장르를 고를 수 있어요.</p><p class="radioNote">무료 라이브 방송 · 광고나 안내가 나올 수 있어요.<br>재생을 누르면 해당 방송국에 직접 연결돼요.</p></div>`;
 document.body.append(panel);
 const baseStop=window.stopExternal,baseVolume=window.mediaVolume;let radio=null,serial=0,timer=null,wants=false,phase='idle',message='';
 const selected=()=>stations.find(s=>s.key===state.station);
 function level(){return Math.max(0,Math.min(1,+$('volume').value/100*(window.hallRitual?.duck??1)*(window.hallRitual?.distanceGain??1)));}
 function openDesk(){$('deskControls').hidden=false;$('deskOpen').setAttribute('aria-expanded','true');}
 function render(){
  const station=selected(),active=phase==='playing';playing=false;externalPlaying=active;window.musicRest=!active;sourceMode='radio';
  $('deskName').textContent=state.desk<0?'아직 비어 있는 나의 자리':`테이블 ${String(state.desk+1).padStart(2,'0')}`;
  $('nearestDesk').hidden=state.desk>=0;$('headphones').disabled=state.desk<0;$('headphones').textContent=state.headphones?'헤드폰 벗기':'헤드폰 쓰기';$('headphones').setAttribute('aria-pressed',state.headphones);
  panel.querySelectorAll('[data-radio]').forEach(b=>{b.disabled=state.desk<0;b.setAttribute('aria-pressed',b.dataset.radio===state.station);});
  $('radioLocation').textContent=station?station.country+' · LIVE RADIO':'LIVE RADIO';$('radioStationName').textContent=station?.name||'일곱 갈래의 음악, 나만의 주파수';$('radioDescription').textContent=station?.description||'자리에 앉은 뒤 장르를 골라주세요.';
  $('radioOfficial').hidden=!station;if(station)$('radioOfficial').href=station.url;
  $('tapePlay').disabled=state.desk<0||!state.headphones||!station;$('tapePlay').textContent=phase==='loading'?'연결 멈추기':active?'잠시 멈추기':phase==='error'?'다시 연결하기':'라디오 재생';
  $('deskStatus').textContent=message||(state.desk<0?'테이블에 앉으면 일곱 장르를 고를 수 있어요.':!station?'장르를 누르면 헤드폰으로 라디오가 흘러요.':!state.headphones?'헤드폰을 쓰면 선택한 방송을 다시 들을 수 있어요.':'재생을 누르면 현재 방송에 연결돼요.');
  panel.classList.toggle('tapeRunning',active);$('play').textContent=wants?'Ⅱ':'▶';$('play').setAttribute('aria-label',wants?'음악 일시정지':'음악 재생');$('playstate').textContent=active?'LIVE RADIO':phase==='loading'?'CONNECTING':phase==='error'?'CONNECTION PAUSED':'YOUR OWN QUIET';
  $('title').hidden=false;$('title').textContent=station?.name||'별빛 라디오';$('seek').disabled=true;$('elapsed').textContent='';$('duration').textContent='';
 }
 function stopRadio(){serial++;clearTimeout(timer);timer=null;wants=false;if(radio){radio.onplaying=radio.onerror=radio.onended=radio.onwaiting=radio.onstalled=null;radio.pause();radio.removeAttribute('src');radio.load();radio.remove();radio=null;}phase='idle';message='';render();}
 window.stopExternal=()=>{stopRadio();baseStop();};
 window.mediaVolume=value=>{baseVolume(value);if(radio)radio.volume=Math.max(0,Math.min(1,value));};
 function connect(attempt=0){
  const station=selected();if(!station||state.desk<0||!state.headphones)return;
  const ticket=++serial;clearTimeout(timer);if(radio){radio.onplaying=radio.onerror=radio.onended=radio.onwaiting=radio.onstalled=null;radio.pause();radio.removeAttribute('src');radio.load();radio.remove();}
  wants=true;phase='loading';message=attempt?'다른 음질로 다시 연결하고 있어요…':'방송에 연결하고 있어요…';render();
  const current=radio=new Audio();current.id='radioStream';current.hidden=true;panel.append(current);current.preload='none';current.setAttribute('playsinline','');current.volume=level();
  const valid=()=>ticket===serial&&radio===current&&wants&&state.headphones&&state.desk>=0;
  const failed=()=>{if(!valid())return;clearTimeout(timer);if(attempt+1<station.streams.length){connect(attempt+1);return;}stopRadio();phase='error';message='방송 연결이 원활하지 않아요. 다시 연결하거나 다른 장르를 골라주세요.';render();};
  current.onplaying=()=>{if(!valid()){current.pause();return;}clearTimeout(timer);phase='playing';message=station.label+' · 나만의 라이브 감상 중';render();};
  const buffering=()=>{if(!valid())return;phase='loading';message='방송 신호를 기다리고 있어요…';render();clearTimeout(timer);timer=setTimeout(failed,16000);};
  current.onerror=current.onended=failed;current.onwaiting=current.onstalled=buffering;timer=setTimeout(failed,16000);current.src=station.streams[attempt];
  current.play().catch(error=>{if(!valid())return;if(error.name==='NotAllowedError'){stopRadio();message='재생 버튼을 한 번 눌러 방송을 시작해주세요.';render();}else if(error.name!=='AbortError')failed();});
 }
 setPlay=async on=>{if(!on){stopRadio();return;}if(!selected()||state.desk<0||!state.headphones){render();if(state.desk>=0)openDesk();return;}if(radio&&wants)return;connect();};
 function choose(key){const station=stations.find(s=>s.key===key);if(!station||state.desk<0)return false;stopRadio();baseStop();silence();playing=false;state.station=key;state.sound=key;state.headphones=true;window.dispatchEvent(new CustomEvent('nightSilence',{detail:false}));render();connect();return true;}
 selectTrack=index=>choose(stations[((index%stations.length)+stations.length)%stations.length].key);
 window.onGreenhouseDesk=index=>{if(index<0){stopRadio();state.desk=-1;state.headphones=false;render();return;}state.desk=index;state.headphones=true;message='';render();openDesk();};
 window.greenhousePlayPersonal=async index=>{if(state.desk<0&&!await window.greenhouseScene?.sitNearest())return false;return choose(stations[index]?.key);};
 $('deskOpen').onclick=()=>{const open=$('deskControls').hidden;$('deskControls').hidden=!open;$('deskOpen').setAttribute('aria-expanded',open);};
 $('nearestDesk').onclick=()=>window.greenhouseScene?.sitNearest();$('headphones').onclick=()=>{if(state.desk<0)return;if(state.headphones){stopRadio();state.headphones=false;render();}else{state.headphones=true;message='';render();if(selected())connect();}};
 $('tapePlay').onclick=()=>setPlay(!wants);$('play').onclick=()=>setPlay(!wants);panel.querySelectorAll('[data-radio]').forEach(b=>b.onclick=()=>choose(b.dataset.radio));
 for(const id of ['prev','next','rain','seek'])$(id).hidden=true;
 $('program').hidden=true;$('program').inert=true;$('tracks').replaceChildren();$('programtoggle').title='라디오 고르기';$('programtoggle').setAttribute('aria-label','라디오 고르기');
 $('volume').addEventListener('input',()=>{if(radio)radio.volume=level();});
 addEventListener('pagehide',stopRadio);
  const setup=window.setupRituals;
  window.setupRituals=()=>{setup();
    $('candlePanel').querySelector('h2').textContent='작은 빛을, 어디에 둘까요?';
    document.querySelector('[data-candle="stage"]').textContent='물가에';
    document.querySelector('[data-rest="balcony"]').innerHTML='오로라 바라보기<small>물가에서, 조금 느리게</small>';
    document.querySelector('[data-rest="lean"]').innerHTML='유리창 옆 벤치<small>잎사귀 사이에서</small>';
    const gazeButton=document.createElement('button');gazeButton.id='stargazeButton';gazeButton.textContent='☾ 누워서 별 보기';gazeButton.onclick=()=>window.greenhouseScene?.stargaze();$('restButton').before(gazeButton);const gazeRest=document.createElement('button');gazeRest.textContent='누워서 별 보기';gazeRest.onclick=()=>window.greenhouseScene?.stargaze();$('restPanel').append(gazeRest);
    $('programtoggle').onclick=()=>{ $('deskControls').hidden=false;$('deskOpen').setAttribute('aria-expanded','true'); };
    $('stageExit').textContent='이 자리에서 조용히 마치기';
    $('instructions').querySelector('h2').textContent='별 아래, 나만의 자리.';
    const paras=$('instructions').querySelectorAll('p');paras[0].textContent='드래그로 별과 오로라를 둘러보고, 방향키 또는 WASD로 걸어보세요. 테이블이나 의자를 누르면 자리에 앉아 헤드폰을 씁니다. 왼쪽 아래 「나만의 테이블」에서 가까운 자리를 고를 수도 있어요.';paras[1].textContent='테이블에 앉아 클래식·팝·뉴에이지·컨트리·포크·재즈·캐롤 중 하나를 누르면 해외 라디오가 재생돼요. 헤드폰을 벗으면 음악이 멈추고 작은 밤 공기와 풀벌레 소리가 남아요. 이곳은 각자의 기기에서 혼자 감상하는 공간이며, 다른 사람에게 소리가 전달되지 않아요.';paras[2].textContent='라디오는 각 방송국의 실시간 편성이며 광고나 안내가 포함될 수 있어요. 밤 공기와 풀벌레 소리는 작게 합성해 흐릅니다. 「누워서 별 보기」를 누르면 아바타 없이 내 눈으로 밤하늘을 바라봐요. 음악은 계속 들을 수 있고, 「천천히 일어나기」 또는 Esc로 원래 자리로 돌아와요.';
  };

 const syncInert=()=>{panel.inert=!document.body.classList.contains('hasEntered')||document.body.classList.contains('arrivalActive')||document.body.classList.contains('ritualActive')||document.body.classList.contains('quiet');};
 new MutationObserver(syncInert).observe(document.body,{attributes:true,attributeFilter:['class']});syncInert();render();
})();

