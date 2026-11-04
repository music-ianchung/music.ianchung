// The chamber recordings have no displayed track titles.
(() => {
  const hall=new URLSearchParams(location.search).get('hall');
  if (hall==='greenhouse') return;
  const roomName=hall==='vineyard'?'빈야드홀':'체임버홀';

  const recordings = hall==='vineyard' ? [
    {url:'vineyard-01.m4a',duration:319.56},
    {url:'vineyard-02.m4a',duration:319.24},
    {url:'vineyard-03.m4a',duration:319.68}
  ] : [
    { url: 'chamber-01.m4a', duration: 319 },
    { url: 'chamber-02.m4a', duration: 319.6 }
  ];
  const originalSetPlay = setPlay;
  const originalStopExternal = window.stopExternal;
  const originalMediaVolume = window.mediaVolume;
  let recording = null, gap = 0, wantsPlay = false, last = performance.now();
  sourceMode = 'chamber';

  function level() {
    return +$('volume').value / 100 * (window.hallRitual?.duck ?? 1) * (window.hallRitual?.distanceGain ?? 1);
  }
  function status(text, error = false) {
    $('sourcestatus').textContent = text;
    $('sourcestatus').classList.toggle('error', error);
  }
  function progress() {
    if (sourceMode !== 'chamber') return;
    const duration = recordings[track].duration;
    const time = recording?.currentTime || 0;
    $('seek').max = duration;
    $('seek').value = time;
    $('seek').disabled = false;
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
      previous.load();
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
      `<button class="track ${i === track && sourceMode === 'chamber' ? 'active' : ''}" data-track="${i}" aria-label="${i + 1}번 연주"><i>${String(i + 1).padStart(2, '0')}</i><span>${fmt(item.duration)}</span></button>`
    ).join('');
    document.querySelectorAll('[data-track]').forEach(button => {
      button.onclick = () => selectTrack(+button.dataset.track);
    });
    if (sourceMode === 'chamber') {
      $('title').textContent = '';
      $('title').hidden = true;
      progress();
    }
  };

  function load() {
    const current = new Audio();
    recording = current;
    current.preload = 'metadata';
    current.volume = level();
    current.onloadedmetadata = () => {
      if (recording !== current) return;
      if (Number.isFinite(current.duration)) recordings[track].duration = current.duration;
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
      recording = null;
    };
    current.src = recordings[track].url;
    return current;
  }

  setPlay = async on => {
    if (sourceMode !== 'chamber') {
      $('title').hidden = false;
      return originalSetPlay(on);
    }
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
    const resume = playing || externalPlaying;
    window.stopExternal();
    silence();
    sourceMode = 'chamber';
    track = (index + recordings.length) % recordings.length;
    window.musicRest = false;
    renderTracks();
    status(`${roomName}의 연주를 선택했어요.`);
    setPlay(resume);
  };
  $('seek').oninput = event => {
    if (sourceMode !== 'chamber') { window.mediaSeek?.(+event.target.value); return; }
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
    sourceMode = 'chamber';
    window.musicRest = false;
    renderTracks();
    ui(false);
    status(`${roomName}의 연주로 돌아왔어요. 재생 버튼을 눌러주세요.`);
  };
  // External music can still show its own name; the two hall recordings stay unnamed.
  $('musicform').addEventListener('submit', () => { if (sourceMode !== 'chamber') $('title').hidden = false; });
  $('musicfile').addEventListener('change', () => { if (sourceMode !== 'chamber') $('title').hidden = false; });
  setInterval(() => {
    const now = performance.now(), delta = (now - last) / 1000;
    last = now;
    if (sourceMode === 'chamber' && externalPlaying && gap > 0) {
      gap -= delta;
      if (gap <= 0) selectTrack(track + 1);
    }
  }, 100);
  $('program').querySelector('h2').textContent = '연주 목록';
  $('program').lastElementChild.textContent = `${recordings.length}편의 연주 · 혼자 감상하는 공간`;
  renderTracks();
})();
