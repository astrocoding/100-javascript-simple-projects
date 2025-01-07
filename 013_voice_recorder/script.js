(() => {
  const btnRecord = document.getElementById('btnRecord');
  const btnPause  = document.getElementById('btnPause');
  const btnStop   = document.getElementById('btnStop');
  const timerEl   = document.getElementById('timer');
  const clipsEl   = document.getElementById('clips');
  const canvas    = document.getElementById('wave');
  const formatSel = document.getElementById('format');
  const ctx       = canvas.getContext('2d');

  let mediaStream = null;
  let mediaRecorder = null;
  let chunks = [];
  let timer = null;
  let seconds = 0;

  // Audio graph + PCM collector (untuk WAV)
  let audioCtx, sourceNode, analyser, dataArray, rafId;
  let procNode;
  let pcmBuffers = [];
  let pcmLength = 0;
  let sampleRate = 44100;

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
    pcmBuffers = [];
    pcmLength = 0;

    // setup audio graph
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    sampleRate = audioCtx.sampleRate;
    sourceNode = audioCtx.createMediaStreamSource(mediaStream);

    // analyser for waveform
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    sourceNode.connect(analyser);
    drawWave();

    // ScriptProcessorNode to grab PCM (mono)
    const bufferSize = 4096;
    procNode = audioCtx.createScriptProcessor(bufferSize, 1, 1);
    sourceNode.connect(procNode);
    procNode.connect(audioCtx.destination);
    procNode.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const copy = new Float32Array(input.length);
      copy.set(input);
      pcmBuffers.push(copy);
      pcmLength += copy.length;
    };

    const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';
    mediaRecorder = new MediaRecorder(mediaStream, { mimeType: mime });
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

    if (procNode){
      try { procNode.disconnect(); } catch {}
      procNode = null;
    }
    if (audioCtx){
      audioCtx.close();
      audioCtx = null;
    }
  }

  function handleStop(){
    const created = new Date();

    const fmt = (formatSel.value || 'webm').toLowerCase();

    let blob, url, filename, mime;
    if (fmt === 'wav'){
      const wavBuffer = encodeWAV(mergePCM(pcmBuffers, pcmLength), sampleRate);
      blob = new Blob([wavBuffer], { type: 'audio/wav' });
      url = URL.createObjectURL(blob);
      filename = `recording-${created.toISOString().replace(/[:.]/g,'-')}.wav`;
      mime = 'audio/wav';
    } else {
      blob = new Blob(chunks, { type: 'audio/webm' });
      url = URL.createObjectURL(blob);
      filename = `recording-${created.toISOString().replace(/[:.]/g,'-')}.webm`;
      mime = 'audio/webm';
    }

    const li = document.createElement('li');
    li.className = 'clip';

    const audio = document.createElement('audio');
    audio.controls = true;
    audio.src = url;
    audio.type = mime;

    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = `${formatTime(seconds)} · ${created.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} · ${fmt.toUpperCase()}`;

    const btnDownload = document.createElement('button');
    btnDownload.className = 'icon-btn';
    btnDownload.title = 'Unduh';
    btnDownload.innerHTML = '<i class="fa-solid fa-download"></i>';
    btnDownload.addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
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
    clipsEl.prepend(li);
  }

  // Gabungkan seluruh PCM chunk jadi satu Float32Array
  function mergePCM(buffers, totalLength){
    const out = new Float32Array(totalLength);
    let offset = 0;
    for (const b of buffers){
      out.set(b, offset);
      offset += b.length;
    }
    return out;
  }

  // Encode PCM Float32 (mono) -> WAV (16-bit PCM)
  function encodeWAV(samples, sampleRate){
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    function writeString(offset, str){
      for (let i = 0; i < str.length; i++){
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    }

    // RIFF header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    // PCM data
    let offset = 44;
    for (let i = 0; i < samples.length; i++){
      let s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
    return buffer;
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