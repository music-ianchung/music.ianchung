(() => {
  if (new URLSearchParams(location.search).get('hall') !== 'greenhouse') return;
  const state = window.greenhouseListening = { headphones: false, desk: -1, sound: 'music' };
  const names = {music:'카세트 · 음악', forest:'밤숲', ocean:'파도', rain:'빗소리', silence:'고요'};
  const panel = document.createElement('aside');
  panel.id = 'listeningDesk';
  panel.setAttribute('aria-label', '나만의 테이블');
  panel.innerHTML = `<button id="deskOpen" aria-expanded="false">⌁ 나만의 테이블</button><div id="deskControls" hidden><small>ONE TABLE, YOUR OWN NIGHT</small><h2 id="deskName">아직 비어 있는 나의 자리</h2><button id="nearestDesk">가까운 테이블에 앉기</button><button id="headphones" aria-pressed="false" disabled>헤드폰 쓰기</button><div class="deskSounds" role="group" aria-label="감상할 소리">${Object.entries(names).map(([key,name])=>`<button data-sound="${key}" aria-pressed="${key==='music'}">${name}</button>`).join('')}</div><div class="tapeWindow" aria-hidden="true"><i></i><span>CASSETTE / SIDE A</span><i></i></div><button id="tapePlay" disabled>카세트 재생</button><p id="deskStatus" role="status">테이블을 눌러 앉아보세요. 이곳의 소리는 나에게만 들려요.</p></div>`;
  document.body.append(panel);
  const basePlay = setPlay, baseSelect = selectTrack, baseStop = window.stopExternal, baseVolume = window.mediaVolume;
  let nature = null, natureGain = null, timer = null, time = 0;
  function level() { return +$('volume').value/100 * (window.hallRitual?.duck ?? 1) * (window.hallRitual?.distanceGain ?? 1); }
  function stopNature() {
    clearInterval(timer); timer=null;
    if (nature) { nature.forEach(n=>{try{n.stop();n.disconnect();}catch{}}); nature=null; }
    natureGain?.disconnect(); natureGain=null;
  }
  window.stopExternal = () => { stopNature(); baseStop(); };
  window.mediaVolume = value => { baseVolume(value); if(natureGain&&audio)natureGain.gain.setTargetAtTime(value*.22,audio.currentTime,.5); };
  function render() {
    $('deskName').textContent=state.desk<0?'아직 비어 있는 나의 자리':`테이블 ${String(state.desk+1).padStart(2,'0')}`;
    $('nearestDesk').hidden=state.desk>=0;
    $('headphones').disabled=state.desk<0;
    $('headphones').setAttribute('aria-pressed',state.headphones);
    $('headphones').textContent=state.headphones?'헤드폰 벗기':'헤드폰 쓰기';
    $('tapePlay').disabled=!state.headphones||state.sound==='silence';
    $('tapePlay').textContent=(playing||externalPlaying)?'잠시 멈추기':'재생';
    panel.classList.toggle('tapeRunning',state.headphones&&state.sound==='music'&&playing);
    document.querySelectorAll('[data-sound]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.sound===state.sound));
    if(state.desk<0)$('deskStatus').textContent='테이블을 눌러 앉아보세요. 이곳의 소리는 나에게만 들려요.';
    else $('deskStatus').textContent=state.headphones?`${names[state.sound]} · 나만의 감상 중`:'헤드폰을 쓰면 나만의 감상이 시작돼요.';
  }
  function natureUI(on) {
    externalPlaying=on;playing=false;
    $('play').textContent=on?'Ⅱ':'▶';$('play').setAttribute('aria-label',on?'음악 일시정지':'음악 재생');
    $('playstate').textContent=on?'NATURE · 자연의 소리':'PAUSED';
    $('title').textContent=state.sound==='silence'?'고요':names[state.sound];
    $('seek').disabled=true;$('elapsed').textContent='';$('duration').textContent='';
  }
  function startNature() {
    stopNature();initAudio();audio.resume().catch(()=>{});
    const length=audio.sampleRate*8,buffer=audio.createBuffer(2,length,audio.sampleRate);
    for(let c=0;c<2;c++){let out=buffer.getChannelData(c),brown=0;for(let i=0;i<length;i++){brown=(brown+.035*(Math.random()*2-1))/1.035;out[i]=brown*3;}}
    const noise=audio.createBufferSource();noise.buffer=buffer;noise.loop=true;
    const filter=audio.createBiquadFilter();filter.type=state.sound==='forest'?'bandpass':'lowpass';filter.frequency.value=state.sound==='forest'?1700:state.sound==='rain'?2400:650;filter.Q.value=.5;
    natureGain=audio.createGain();natureGain.gain.value=0;noise.connect(filter);filter.connect(natureGain);natureGain.connect(audio.destination);natureGain.gain.setTargetAtTime(level()*.22,audio.currentTime,1.2);noise.start();nature=[noise];
    let rustle=audio.createGain();rustle.gain.value=.6;filter.disconnect();filter.connect(rustle);rustle.connect(natureGain);
    time=0;timer=setInterval(()=>{time+=.12;if(!natureGain)return;let swell=state.sound==='ocean'?.30+.60*(.5+.5*Math.sin(time*.44)):state.sound==='forest'?.4+.16*Math.sin(time*.22):.72;rustle.gain.setTargetAtTime(swell,audio.currentTime,.3);
      if(state.sound==='forest'&&Math.random()<.055){const bird=audio.createOscillator(),g=audio.createGain();bird.type='sine';bird.frequency.setValueAtTime(1700+Math.random()*1300,audio.currentTime);bird.frequency.exponentialRampToValueAtTime(1400,audio.currentTime+.22);g.gain.setValueAtTime(.015,audio.currentTime);g.gain.exponentialRampToValueAtTime(.00001,audio.currentTime+.25);bird.connect(g);g.connect(natureGain);bird.start();bird.stop(audio.currentTime+.26);bird.onended=()=>{bird.disconnect();g.disconnect();};}
    },120);
    natureUI(true);
  }
  setPlay = async on => {
    if(on&&!state.headphones){await basePlay(false);stopNature();$('playstate').textContent='YOUR OWN QUIET';render();return;}
    if(state.sound==='music'){
      stopNature();if(sourceMode==='nature'){sourceMode='sketch';renderTracks();updateProgress();}
      $('title').hidden=false;$('seek').disabled=false;await basePlay(on);
    } else {
      if(playing){await basePlay(false);silence();}
      sourceMode='nature';window.musicRest=!on||state.sound==='silence';
      if(on&&state.sound!=='silence')startNature();else{stopNature();natureUI(false);if(state.sound==='silence')$('playstate').textContent='JUST THE NIGHT';}
    }
    render();
  };
  selectTrack = i => {state.sound='music';stopNature();baseSelect(i);render();};
  function choose(key){const wasOn=state.headphones;setPlay(false);window.stopExternal();state.sound=key;if(key==='music'){sourceMode='sketch';renderTracks();updateProgress();}setPlay(wasOn);render();}
  window.onGreenhouseDesk = index => {
    if(index<0){setPlay(false);state.desk=-1;state.headphones=false;render();return;}
    state.desk=index;state.headphones=true;setPlay(true);render();
  };
  $('deskOpen').onclick=()=>{const open=$('deskControls').hidden;$('deskControls').hidden=!open;$('deskOpen').setAttribute('aria-expanded',open);};
  $('nearestDesk').onclick=()=>window.greenhouseScene?.sitNearest();
  $('headphones').onclick=()=>{if(state.desk<0)return;state.headphones=!state.headphones;setPlay(state.headphones);render();};
  $('tapePlay').onclick=()=>setPlay(!(playing||externalPlaying));
  document.querySelectorAll('[data-sound]').forEach(b=>b.onclick=()=>choose(b.dataset.sound));
  $('rain').onclick=()=>choose('rain');
  const setup=window.setupRituals;
  window.setupRituals=()=>{setup();
    $('candlePanel').querySelector('h2').textContent='작은 빛을, 어디에 둘까요?';
    document.querySelector('[data-candle="stage"]').textContent='물가에';
    document.querySelector('[data-rest="balcony"]').innerHTML='오로라 바라보기<small>물가에서, 조금 느리게</small>';
    document.querySelector('[data-rest="lean"]').innerHTML='유리창 옆 벤치<small>잎사귀 사이에서</small>';
    $('stageExit').textContent='이 자리에서 조용히 마치기';
    $('instructions').querySelector('h2').textContent='별 아래, 나만의 자리.';
    const paras=$('instructions').querySelectorAll('p');paras[0].textContent='드래그로 별과 오로라를 둘러보고, 방향키 또는 WASD로 걸어보세요. 테이블이나 의자를 누르면 자리에 앉아 헤드폰을 씁니다. 왼쪽 아래 「나만의 테이블」에서 가까운 자리를 고를 수도 있어요.';paras[1].textContent='테이블에서 카세트 음악, 밤숲, 파도, 빗소리, 고요를 선택하세요. 헤드폰을 벗으면 소리가 멈춥니다. 이곳은 각자의 기기에서 혼자 감상하는 공간이며, 다른 사람에게 소리가 전달되지 않아요.';paras[2].textContent='밤숲과 파도, 빗소리는 이 공간을 위해 합성한 자연 소리예요. 숨 고르기와 쉬는 자리도 편안하게 이용해보세요.';
  };
  const syncInert=()=>{panel.inert=!document.body.classList.contains('hasEntered')||document.body.classList.contains('arrivalActive')||document.body.classList.contains('ritualActive')||document.body.classList.contains('quiet');};
  new MutationObserver(syncInert).observe(document.body,{attributes:true,attributeFilter:['class']});syncInert();
  $('musicform').addEventListener('submit',()=>{state.sound='music';stopNature();render();},true);
  $('musicfile').addEventListener('change',()=>{state.sound='music';stopNature();render();},true);
  render();
})();
