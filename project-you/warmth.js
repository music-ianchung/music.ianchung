(() => {
  'use strict';
  const url = 'https://ianchungmusic.com/project-you/';
  const lines = [
    'All those miles have brought you here.',
    'You were never lost.',
    'Moments pass but leave their light.',
    'You made it past, you gave your all.',
    "You've lived your life, you've stood so strong.",
    "Now you're home in love."
  ];
  const el = id => document.getElementById(id);
  let index = 0;
  const logo = new Image();
  logo.src = 'project-you-logo.png';
  const setStatus = (id, text) => { el(id).textContent = text; };
  async function copy(text, status, fallback, field) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(status, 'Copied — ready to send.');
    } catch {
      el(fallback).hidden = false;
      el(field).value = text;
      el(field).focus();
      el(field).select();
      setStatus(status, 'Select and copy the message below.');
    }
  }
  async function share(text, status, fallback, field) {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Project YOU — Music for someone.', text, url });
        setStatus(status, 'Thank you for passing it on.');
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }
    await copy(text + '\n' + url, status, fallback, field);
  }
  el('another-line').addEventListener('click', () => {
    index = (index + 1) % lines.length;
    el('reminder-line').textContent = lines[index];
    setStatus('reminder-status', '');
    el('reminder-fallback').hidden = true;
  });
  el('share-reminder').addEventListener('click', () => share(lines[index], 'reminder-status', 'reminder-fallback', 'reminder-copy'));
  el('send-song').addEventListener('click', () => share(el('song-message').value.trim() || 'A song for you.', 'song-share-status', 'song-fallback', 'song-copy'));
  el('copy-song').addEventListener('click', () => copy(url, 'song-share-status', 'song-fallback', 'song-copy'));
  el('save-card').addEventListener('click', async () => {
    const button = el('save-card');
    const selectedLine = lines[index];
    button.disabled = true;
    try {
      await document.fonts.ready;
      const canvas = document.createElement('canvas');
      canvas.width = 1080; canvas.height = 1350;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#4a3934'; ctx.fillRect(0, 0, 1080, 1350);
      const glow = ctx.createRadialGradient(830, 240, 0, 830, 240, 800);
      glow.addColorStop(0, 'rgba(224,153,88,.32)');
      glow.addColorStop(1, 'rgba(224,153,88,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, 1080, 1350);
      if (logo.complete && logo.naturalWidth) {
        const w = 190, h = w * logo.naturalHeight / logo.naturalWidth;
        ctx.save(); ctx.filter = 'brightness(0) invert(1)'; ctx.globalAlpha = .8;
        ctx.drawImage(logo, (1080-w)/2, 140, w, h); ctx.restore();
      }
      ctx.fillStyle = '#f3e7d7'; ctx.textAlign = 'center';
      ctx.font = '22px "DM Sans", sans-serif';
      ctx.fillText('A LITTLE REMINDER FOR YOU', 540, 430);
      ctx.font = 'italic 76px "Cormorant Garamond", Georgia, serif';
      const rows = []; let row = '';
      for (const word of selectedLine.split(' ')) {
        const candidate = row ? row + ' ' + word : word;
        if (ctx.measureText(candidate).width > 800 && row) { rows.push(row); row = word; }
        else row = candidate;
      }
      if (row) rows.push(row);
      rows.forEach((text, n) => ctx.fillText(text, 540, 680 + (n-(rows.length-1)/2)*96));
      ctx.strokeStyle = 'rgba(243,231,215,.25)';
      ctx.beginPath(); ctx.moveTo(420, 1010); ctx.lineTo(660, 1010); ctx.stroke();
      ctx.font = '28px "Cormorant Garamond", Georgia, serif';
      ctx.fillText('Music for someone.', 540, 1090);
      ctx.font = '20px "DM Sans", sans-serif';
      ctx.fillText('ianchungmusic.com/project-you', 540, 1180);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Card unavailable');
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl; a.download = 'project-you-reminder.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      setStatus('reminder-status', 'Your card is ready. On mobile, use Save Image if it opens in a new view.');
    } catch {
      setStatus('reminder-status', 'The card could not be saved. You can still share the line.');
    } finally { button.disabled = false; }
  });

  // Set this only to the approved, publicly releasable song file.
  // Prefer a same-origin MP3/M4A. External audio must allow CORS.
  const PROJECT_AUDIO_URL = '';
  if (!PROJECT_AUDIO_URL) return;
  const audio = el('project-audio'), orb = document.querySelector('.ambient-orb');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let enabled = !reduced.matches, context, analyser, samples, frame, energy = 0;
  audio.crossOrigin = 'anonymous'; audio.src = PROJECT_AUDIO_URL;
  el('project-player').hidden = false;
  document.body.classList.add('has-project-audio');
  const toggle = el('light-toggle');
  function label() {
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.textContent = 'Music-responsive light: ' + (enabled ? 'on' : 'off');
  }
  function stop() {
    cancelAnimationFrame(frame); frame = null; energy = 0;
    orb.style.setProperty('--music-brightness', '1');
  }
  function tick() {
    if (!enabled || reduced.matches || audio.paused || audio.ended || document.hidden || !analyser) { stop(); return; }
    analyser.getByteTimeDomainData(samples);
    let sum = 0;
    for (const value of samples) sum += ((value - 128) / 128) ** 2;
    energy += (Math.min(1, Math.sqrt(sum / samples.length) * 5) - energy) * .035;
    orb.style.setProperty('--music-brightness', String(1 + energy * .16));
    frame = requestAnimationFrame(tick);
  }
  async function start() {
    if (!enabled || reduced.matches || document.hidden) return;
    try {
      if (!context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        context = new AudioContext();
        analyser = context.createAnalyser(); analyser.fftSize = 1024;
        const source = context.createMediaElementSource(audio);
        source.connect(analyser); analyser.connect(context.destination);
        samples = new Uint8Array(analyser.fftSize);
      }
      await context.resume(); stop(); tick();
    } catch { enabled = false; label(); stop(); }
  }
  audio.addEventListener('play', start);
  audio.addEventListener('pause', stop);
  audio.addEventListener('ended', stop);
  audio.addEventListener('error', () => { stop(); setStatus('audio-status', 'This recording is temporarily unavailable. Please try again later.'); });
  toggle.addEventListener('click', () => { enabled = !enabled; label(); if (enabled && !audio.paused) start(); else stop(); });
  reduced.addEventListener('change', () => { enabled = !reduced.matches; label(); if (!enabled) stop(); else if (!audio.paused) start(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (!audio.paused) start(); });
  label();
})();
