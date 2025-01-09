(() => {
  const video = document.getElementById('video');
  const overlayPlay = document.getElementById('overlayPlay');

  const btnPlay = document.getElementById('btnPlay');
  const btnPrev10 = document.getElementById('btnPrev10');
  const btnNext10 = document.getElementById('btnNext10');

  const curTime = document.getElementById('curTime');
  const durTime = document.getElementById('durTime');

  const seek = document.getElementById('seek');
  const bufferedBar = document.getElementById('bufferedBar');
  const thumb = document.getElementById('thumb');

  const resSelect = document.getElementById('resSelect');
  const btnSpeedDown = document.getElementById('btnSpeedDown');
  const btnSpeedUp = document.getElementById('btnSpeedUp');
  const speedLabel = document.getElementById('speedLabel');
  const btnShare = document.getElementById('btnShare');

  const sources = {
    "1080": "media/sample.mp4",
    "720":  "media/sample_720p.mp4",
    "360":  "media/sample_360p.mp4"
  };

  let seeking = false;

  /* ---------- Utils ---------- */
  const pad = n => String(n).padStart(2,'0');
  function fmt(t){
    if (!isFinite(t) || t < 0) return '00:00';
    const h = Math.floor(t/3600);
    const m = Math.floor((t%3600)/60);
    const s = Math.floor(t%60);
    return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }
  function updatePlayBtn(){
    const icon = btnPlay.querySelector('i');
    const text = btnPlay.querySelector('span');
    if (video.paused){
      icon.className = 'fa-solid fa-play';
      if (text) text.textContent = 'Play';
      overlayPlay.style.display = 'inline-grid';
    } else {
      icon.className = 'fa-solid fa-pause';
      if (text) text.textContent = 'Pause';
      overlayPlay.style.display = 'none';
    }
  }
  function updateSpeedLabel(){
    speedLabel.textContent = `${video.playbackRate.toFixed(1)}×`;
  }
  function setThumbByPercent(pct){
    pct = Math.max(0, Math.min(100, pct));
    thumb.style.left = pct + '%';
  }
  function updateBufferedBar(){
    try{
      if (video.buffered.length){
        const end = video.buffered.end(video.buffered.length - 1);
        const pct = video.duration ? (end / video.duration) * 100 : 0;
        bufferedBar.style.width = `${Math.min(100, pct)}%`;
      }
    }catch{}
  }
  function setSeekFromTime(t){
    if (!isFinite(video.duration) || video.duration <= 0) return;
    const pct = (t / video.duration) * 100;
    seek.value = Math.round(pct * 10);
    setThumbByPercent(pct);
  }
  function getTimeFromSeek(){
    if (!isFinite(video.duration) || video.duration <= 0) return 0;
    const pct = Number(seek.value) / 10; // karena max 1000
    return (pct / 100) * video.duration;
  }

  /* ---------- Init ---------- */
  // Disable resolusi yang file-nya tidak ada (optional ping via HEAD)
  // Cara sederhana: kita coba preload lewat Image hack? Lebih aman manual—biarkan user menambahkan file.
  // Kita hanya disable secara optimistik saat error change.
  resSelect.addEventListener('change', async () => {
    const want = resSelect.value;
    const src = sources[want];

    if (!src){
      return;
    }
    const wasPlaying = !video.paused && !video.ended;
    const t = video.currentTime;

    // Ganti source
    video.pause();
    video.src = src;
    try{
      await video.load();
      // Tunggu metadata
      await video.play().catch(()=>{});
      video.pause();
      video.currentTime = Math.min(t, isFinite(video.duration) ? video.duration - 0.1 : t);
      if (wasPlaying) await video.play();
    }catch(e){
      // Jika gagal (file tidak ada), kembalikan ke sebelumnya
      alert('Resolusi tidak tersedia. Pastikan file videonya ada.');
      // revert
      const cur = Object.entries(sources).find(([k,v]) => v === video.currentSrc) || ["1080", sources["1080"]];
      resSelect.value = cur[0];
    }
  });

  overlayPlay.addEventListener('click', () => video.paused ? video.play() : video.pause());
  btnPlay.addEventListener('click', () => video.paused ? video.play() : video.pause());
  btnPrev10.addEventListener('click', () => { video.currentTime = Math.max(0, video.currentTime - 10); });
  btnNext10.addEventListener('click', () => { video.currentTime = Math.min(video.duration || 0, video.currentTime + 10); });

  btnSpeedDown.addEventListener('click', () => {
    video.playbackRate = Math.max(.25, (video.playbackRate - 0.25));
    updateSpeedLabel();
  });
  btnSpeedUp.addEventListener('click', () => {
    video.playbackRate = Math.min(3, (video.playbackRate + 0.25));
    updateSpeedLabel();
  });

  // Seek (drag)
  seek.addEventListener('input', () => {
    seeking = true;
    const t = getTimeFromSeek();
    setThumbByPercent((Number(seek.value)/10)/1); // update pos
    curTime.textContent = fmt(t);
  });
  seek.addEventListener('change', () => {
    const t = getTimeFromSeek();
    video.currentTime = t;
    seeking = false;
  });

  // Share
  btnShare.addEventListener('click', async () => {
    const t = Math.floor(video.currentTime || 0);
    const url = new URL(location.href);
    url.searchParams.set('t', String(t));
    const shareData = {
      title: document.title,
      text: 'Tonton video ini',
      url: url.toString()
    };
    try{
      if (navigator.share){
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast('Link disalin ke clipboard.');
      }
    }catch{}
  });

  // Restore start time jika ada query ?t=detik
  (function applyStartFromQuery(){
    const u = new URL(location.href);
    const t = parseInt(u.searchParams.get('t') || '0', 10);
    if (t > 0) {
      video.addEventListener('loadedmetadata', () => {
        video.currentTime = Math.min(video.duration || t, t);
      }, { once:true });
    }
  })();

  // Video events
  video.addEventListener('play', updatePlayBtn);
  video.addEventListener('pause', updatePlayBtn);
  video.addEventListener('loadedmetadata', () => {
    durTime.textContent = fmt(video.duration);
    setSeekFromTime(0);
    updateBufferedBar();
  });
  video.addEventListener('timeupdate', () => {
    if (!seeking){
      curTime.textContent = fmt(video.currentTime);
      setSeekFromTime(video.currentTime);
    }
    updateBufferedBar();
  });
  video.addEventListener('progress', updateBufferedBar);

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.target && ['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (k === ' ') { e.preventDefault(); video.paused ? video.play() : video.pause(); }
    if (k === 'arrowleft')  { video.currentTime = Math.max(0, video.currentTime - 10); }
    if (k === 'arrowright') { video.currentTime = Math.min(video.duration || 0, video.currentTime + 10); }
    if (k === '[') { video.playbackRate = Math.max(.25, video.playbackRate - .25); updateSpeedLabel(); }
    if (k === ']') { video.playbackRate = Math.min(3, video.playbackRate + .25); updateSpeedLabel(); }
  });

  // Mini toast
  function toast(msg){
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = 'position:fixed;bottom:16px;left:16px;background:#5c4fb8;color:#fff;padding:10px 12px;border-radius:10px;z-index:9999;box-shadow:0 6px 16px rgba(0,0,0,.15);';
    document.body.appendChild(el);
    setTimeout(()=>el.remove(), 2200);
  }

  // Init
  updatePlayBtn();
  updateSpeedLabel();
})();