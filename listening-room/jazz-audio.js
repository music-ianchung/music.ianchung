// Four user-supplied jazz recordings, displayed as numbers only.
(() => {
  const hall=new URLSearchParams(location.search).get('hall');
  if (hall!=='jazzbar') return;
  const roomName='재즈바';
  const recordings=[
    {url:'jazz-01.m4a',duration:199.6},
    {url:'jazz-02.m4a',duration:193.56},
    {url:'jazz-03.m4a',duration:149.76},
    {url:'jazz-04.m4a',duration:238.8}
  ];
  const originalSetPlay = setPlay;
  const originalStopExternal = window.stopExternal;
  const originalMediaVolume = window.mediaVolume;
  let recording = null, gap = 0, wantsPlay = false, last = performance.now(), pendingSeek=null, applyingSync=false;
  sourceMode = 'jazz-recordings';

  function level() {
    return +$('volume').value / 100 * (window.hallRitual?.duck ?? 1) * (window.hallRitual?.distanceGain ?? 1);
  }
  function status(text, error = false) {
    $('sourcestatus').textContent = text;
    $('sourcestatus').classList.toggle('error', error);
  }
  function progress() {
    if (sourceMode !== 'jazz-recordings') return;
    const duration = recordings[track].duration;
    const time = recording?.currentTime || 0;
    $('seek').max = duration;
    $('seek').value = time;
    $('seek').disabled = !!window.roomPresence?.sharedMusic;
    $('duration').textContent = fmt(duration);
    $('elapsed').textContent = fmt(time);
  }
  function ui(on) {
    externalPlaying = on;
    playing = false;
    $('title').textContent = '';
    $('title').hidden = true;
    $('play').textContent = on ? 'Ⅱ' : '▶';
    $('play').setAttribute('aria-label', on ? '음악 일시정지' : '음악 재생');
    $('playstate').textContent = on ? (gap > 0 ? 'AFTERGLOW · 잔향' : 'NOW PLAYING') : 'PAUSED';
  }
  function release() {
    const previous = recording;
    recording = null;
    wantsPlay = false;
    gap = 0;
    if (previous) {
      previous.pause();
      previous.removeAttribute('src');
      previous.load();previous.remove();
    }
  }
  window.stopExternal = () => {
    release();
    originalStopExternal();
  };
  window.mediaVolume = value => {
    originalMediaVolume(value);
    if (recording) recording.volume = value;
  };

  renderTracks = () => {
    $('tracks').innerHTML = recordings.map((item, i) =>
      `<button class="track ${i === track && sourceMode === 'jazz-recordings' ? 'active' : ''}" data-track="${i}" aria-label="${i + 1}번 연주"><i>${String(i + 1).padStart(2, '0')}</i><span>${fmt(item.duration)}</span></button>`
    ).join('');
    document.querySelectorAll('[data-track]').forEach(button => {
      button.onclick = () => selectTrack(+button.dataset.track);
    });
    if (sourceMode === 'jazz-recordings') {
      $('title').textContent = '';
      $('title').hidden = true;
      progress();
    }
  };

  function load() {
    const current = new Audio();current.id='jazzRecording';current.hidden=true;document.body.append(current);
    recording = current;
    current.preload = 'metadata';
    current.volume = level();
    current.onloadedmetadata = () => {
      if (recording !== current) return;
      if (Number.isFinite(current.duration)) recordings[track].duration = current.duration;
      if(pendingSeek!==null){current.currentTime=Math.min(pendingSeek,current.duration||pendingSeek);pendingSeek=null;}
      renderTracks();
    };
    current.ontimeupdate = () => { if (recording === current) progress(); };
    current.onplay = () => {
      if (recording !== current) return;
      if (!wantsPlay) { current.pause(); return; }
      window.musicRest = false;
      ui(true);
      status(`${roomName}의 연주를 감상하고 있어요.`);
    };
    current.onpause = () => {
      if (recording === current && !current.ended && gap <= 0) ui(false);
    };
    current.onended = () => {
      if (recording !== current || !wantsPlay) return;
      window.roomSoundscapes?.applaud('recording-'+track);
      gap = 8;
      last = performance.now();
      window.musicRest = true;
      ui(true);
      status('잠시 잔향을 느껴요. 곧 다음 연주가 이어집니다.');
      progress();
    };
    current.onerror = () => {
      if (recording !== current) return;
      wantsPlay = false;
      ui(false);
      status('연주를 불러오지 못했어요. 재생 버튼을 눌러 다시 시도해주세요.', true);
      current.remove();recording = null;
    };
    current.src = recordings[track].url;
    return current;
  }

  setPlay = async on => {
    if(!on)window.roomSoundscapes?.stopApplause();
    if (sourceMode !== 'jazz-recordings') {
      $('title').hidden = false;
      return originalSetPlay(on);
    }
    if(on&&window.roomPresence?.sharedMusic&&!applyingSync){const program=window.roomPresence.program();if(program){applyingSync=true;if(program.index!==track)selectTrack(program.index);pendingSeek=program.elapsed;gap=program.gap;applyingSync=false;}}
    wantsPlay = on;
    last = performance.now();
    initAudio();
    audio.resume().catch(() => {});
    if (!on) {
      recording?.pause();
      ui(false);
      return;
    }
    if (gap > 0) { ui(true); return; }
    const current = recording || load();
    if(pendingSeek!==null&&current.readyState>0){current.currentTime=pendingSeek;pendingSeek=null;}
    try {
      await current.play();
      if (recording === current && !wantsPlay) current.pause();
    } catch {
      if (recording !== current || !wantsPlay) return;
      wantsPlay = false;
      ui(false);
      status('아래 재생 버튼을 눌러 연주를 시작해주세요.');
    }
  };

  selectTrack = index => {
    if(window.roomPresence?.sharedMusic&&!applyingSync){window.roomPresence.changeTrack((index+recordings.length)%recordings.length);return;}
    const resume = playing || externalPlaying;
    window.stopExternal();
    silence();
    sourceMode = 'jazz-recordings';
    track = (index + recordings.length) % recordings.length;
    window.musicRest = false;
    renderTracks();
    status(`${roomName}의 연주를 선택했어요.`);
    setPlay(resume);
  };
  $('seek').oninput = event => {
    if (sourceMode !== 'jazz-recordings') { window.mediaSeek?.(+event.target.value); return; }
    if(window.roomPresence?.sharedMusic){progress();return;}
    const resume = externalPlaying;
    recording ||= load();
    const target = +event.target.value;
    gap = 0;
    window.musicRest = false;
    try { recording.currentTime = target; } catch {}
    progress();
    if (resume) setPlay(true);
  };
  $('stopyoutube').onclick = () => {
    window.stopExternal();
    sourceMode = 'jazz-recordings';
    window.musicRest = false;
    renderTracks();
    ui(false);
    status(`${roomName}의 연주로 돌아왔어요. 재생 버튼을 눌러주세요.`);
  };
  // External music can still show its own name; the two hall recordings stay unnamed.
  $('musicform').addEventListener('submit', () => { if (sourceMode !== 'jazz-recordings') $('title').hidden = false; });
  $('musicfile').addEventListener('change', () => { if (sourceMode !== 'jazz-recordings') $('title').hidden = false; });
  setInterval(() => {
    const now = performance.now(), delta = (now - last) / 1000;
    last = now;
    if (sourceMode === 'jazz-recordings' && externalPlaying && gap > 0) {
      gap -= delta;
      if (gap <= 0){if(window.roomPresence?.sharedMusic)window.recordingRoom.sync(window.roomPresence.program());else selectTrack(track + 1);}
    }
  }, 100);
  window.recordingRoom={refresh:progress,async playPersonal(index){window.roomPresence?.listenAlone();await setPlay(false);selectTrack(index);await setPlay(true);return true;},sync(program){
    if(!program||sourceMode!=='jazz-recordings')return;
    const resume=wantsPlay||externalPlaying;applyingSync=true;pendingSeek=program.elapsed;
    try{
      if(program.index!==track)selectTrack(program.index);
      if(program.gap>0){if(gap<=0&&resume)window.roomSoundscapes?.applaud('recording-'+track);gap=program.gap;recording?.pause();window.musicRest=true;if(resume)ui(true);}
      else{gap=0;window.musicRest=false;if(recording?.readyState>0){if(Math.abs(recording.currentTime-program.elapsed)>1.4)recording.currentTime=program.elapsed;pendingSeek=null;if(resume&&recording.paused)setPlay(true);}}
      progress();
    }finally{applyingSync=false;}
  }};
  $('program').querySelector('h2').textContent = '재즈바의 음악';
  $('program').lastElementChild.textContent = `${recordings.length}편의 연주 · 혼자 감상하는 공간`;
  renderTracks();
})();

