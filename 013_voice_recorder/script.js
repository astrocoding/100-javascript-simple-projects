(() => {
  const btnRecord = document.getElementById('btnRecord');
  const btnPause  = document.getElementById('btnPause');
  const btnStop   = document.getElementById('btnStop');
  const timerEl   = document.getElementById('timer');
  const clipsEl   = document.getElementById('clips');
  const canvas    = document.getElementById('wave');
  const ctx       = canvas.getContext('2d');

  let mediaStream = null;
  let mediaRecorder = null;
  let chunks = [];
  let timer = null;
  let seconds = 0;

  // Audio graph for waveform
  let audioCtx, sourceNode, analyser, dataArray, rafId;

  function formatTime(sec){
    const m = String(Math.floor(sec/60)).padStart(2,'0');
    const s = String(sec%60).padStart(2,'0');
    return `${m}:${s}`;
  }

  function startTimer(){
    seconds = 0;
    timerEl.textContent = '00:00';
    timer = setInterval(() => {
      seconds++;
      timerEl.textContent = formatTime(seconds);
    }, 1000);
  }

  function stopTimer(){
    clearInterval(timer);
    timer = null;
  }

  function drawWave(){
    if (!analyser) return;
    const { width, height } = canvas;
    ctx.clearRect(0,0,width,height);

    analyser.getByteTimeDomainData(dataArray);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#4da562';
    ctx.beginPath();

    const slice = width / dataArray.length;
    let x = 0;
    for (let i=0; i<dataArray.length; i++){
      const v = dataArray[i] / 128.0;
      const y = (v * height)/2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += slice;
    }
    ctx.lineTo(width, height/2);
    ctx.stroke();

    rafId = requestAnimationFrame(drawWave);
  }

  async function initStream(){
    if (mediaStream) return;
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  }

  async function startRecording(){
    await initStream();
    chunks = [];

    // setup audio graph
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    sourceNode = audioCtx.createMediaStreamSource(mediaStream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    sourceNode.connect(analyser);
    drawWave();

    mediaRecorder = new MediaRecorder(mediaStream);
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    mediaRecorder.onstop = handleStop;
    mediaRecorder.start();

    btnRecord.disabled = true;
    btnPause.disabled = false;
    btnStop.disabled = false;
    btnPause.innerHTML = '<i class="fa-solid fa-pause"></i><span>Jeda</span>';
    startTimer();
  }

  function pauseResume(){
    if (!mediaRecorder) return;
    if (mediaRecorder.state === 'recording'){
      mediaRecorder.pause();
      btnPause.innerHTML = '<i class="fa-solid fa-play"></i><span>Lanjut</span>';
      stopTimer();
      if (audioCtx && audioCtx.state === 'running') audioCtx.suspend();
    } else if (mediaRecorder.state === 'paused'){
      mediaRecorder.resume();
      btnPause.innerHTML = '<i class="fa-solid fa-pause"></i><span>Jeda</span>';
      startTimer();
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    }
  }

  function stopRecording(){
    if (!mediaRecorder) return;
    mediaRecorder.stop();
    btnRecord.disabled = false;
    btnPause.disabled = true;
    btnStop.disabled = true;
    stopTimer();
    cancelAnimationFrame(rafId);
    rafId = null;
    if (audioCtx) audioCtx.close();
    audioCtx = null;
  }

  function handleStop(){
    const blob = new Blob(chunks, { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    const created = new Date();

    const li = document.createElement('li');
    li.className = 'clip';

    const audio = document.createElement('audio');
    audio.controls = true;
    audio.src = url;

    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = `${formatTime(seconds)} · ${created.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;

    const btnDownload = document.createElement('button');
    btnDownload.className = 'icon-btn';
    btnDownload.title = 'Unduh';
    btnDownload.innerHTML = '<i class="fa-solid fa-download"></i>';
    btnDownload.addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${created.toISOString().replace(/[:.]/g,'-')}.webm`;
      a.click();
    });

    const btnDelete = document.createElement('button');
    btnDelete.className = 'icon-btn danger';
    btnDelete.title = 'Hapus';
    btnDelete.innerHTML = '<i class="fa-solid fa-trash"></i>';
    btnDelete.addEventListener('click', () => {
      URL.revokeObjectURL(url);
      li.remove();
    });

    li.append(audio, badge, btnDownload, btnDelete);
    clipsEl.prepend(li); // yang baru di atas
  }

  btnRecord.addEventListener('click', startRecording);
  btnPause .addEventListener('click', pauseResume);
  btnStop  .addEventListener('click', stopRecording);

  // Keyboard shortcuts: R = rekam/stop, P = jeda/lanjut
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'r'){
      if (btnRecord.disabled) stopRecording();
      else startRecording();
    }
    if (k === 'p' && !btnPause.disabled) pauseResume();
  });
})();