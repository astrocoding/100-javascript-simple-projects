(() => {
  const input      = document.getElementById('input');
  const fromBaseEl = document.getElementById('fromBase');
  const toBaseEl   = document.getElementById('toBase');
  const btnConvert = document.getElementById('btnConvert');
  const btnReset   = document.getElementById('btnReset');
  const btnSwap    = document.getElementById('btnSwap');
  const output     = document.getElementById('output');
  const btnCopy    = document.getElementById('btnCopy');

  const lintChips  = document.getElementById('lintChips');
  const detectedBadge = document.getElementById('detectedBadge');

  /* ---------- Util UI ---------- */
  function toast(msg){
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = 'position:fixed;bottom:16px;left:16px;background:#555184;color:#fff;padding:10px 12px;border-radius:10px;z-index:9999;box-shadow:0 8px 18px rgba(0,0,0,.15)';
    document.body.appendChild(el);
    setTimeout(()=>el.remove(), 2200);
  }

  function normSplitRaw(str){
    return str
      .replace(/\s+/g,' ')
      .replace(/,/g,' ')
      .trim()
      .split(' ')
      .filter(Boolean);
  }

  function stripPrefixes(token){
    // Hilangkan 0b / 0o / 0x (untuk deteksi & validasi)
    if (/^0[bB][01]+$/.test(token)) return token.slice(2);
    if (/^0[oO][0-7]+$/.test(token)) return token.slice(2);
    if (/^0[xX][0-9a-fA-F]+$/.test(token)) return token.slice(2);
    return token;
  }

  const re = {
    bin: /^[01]+$/i,
    oct: /^[0-7]+$/i,
    dec: /^-?\d+$/,
    hex: /^[0-9a-f]+$/i
  };
  const baseRadix = { bin:2, oct:8, dec:10, hex:16 };

  function detectBase(tokens){
    let prefType = null;
    let prefCount = { bin:0, oct:0, hex:0 };
    for (const t of tokens){
      if (/^0[bB][01]+$/.test(t)) { prefType = 'bin'; prefCount.bin++; }
      else if (/^0[oO][0-7]+$/.test(t)) { prefType = 'oct'; prefCount.oct++; }
      else if (/^0[xX][0-9a-fA-F]+$/.test(t)) { prefType = 'hex'; prefCount.hex++; }
    }
    const maxPref = Object.entries(prefCount).sort((a,b)=>b[1]-a[1])[0];
    if (maxPref && maxPref[1] > 0) return maxPref[0];

    const stripped = tokens.map(stripPrefixes);
    const all = s => stripped.every(x => re[s].test(x));

    if (all('bin')) return 'bin';
    if (all('oct')) return 'oct';
    if (all('dec')) return 'dec';
    if (all('hex')) return 'hex';

    return null;
  }

  function validateTokens(tokens, base){
    if (base === 'ascii'){
      return tokens.map(t => ({ token:t, ok:true }));
    }
    const checker = re[base];
    return tokens.map(t => {
      const s = stripPrefixes(t);
      return { token:t, ok: checker.test(s) };
    });
  }

  function renderChips(tokens, base, specialHint = ''){
    lintChips.innerHTML = '';
    for (const { token, ok } of validateTokens(tokens, base)){
      const chip = document.createElement('span');
      chip.className = 'chip' + (ok ? '' : ' bad');
      chip.innerHTML = `<span class="chip-label">${escapeHtml(token)}</span>`;
      lintChips.appendChild(chip);
    }
    if (specialHint){
      const note = document.createElement('span');
      note.className = 'chip bad';
      note.textContent = specialHint;
      lintChips.appendChild(note);
    }
  }

  function setDetectedBadge(text){
    detectedBadge.textContent = `Detected: ${text}`;
  }

  function escapeHtml(s){
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function toChunksOf(str, size){
    const out = [];
    for (let i=0;i<str.length;i+=size) out.push(str.slice(i,i+size));
    return out;
  }

  function asciiToInts(str){
    const ints = [];
    for (const ch of str) ints.push(ch.codePointAt(0));
    return ints;
  }
  function intsToAscii(ints){
    try{ return ints.map(n => String.fromCodePoint(n)).join(''); }
    catch{ return null; }
  }

  function binaryStringToIntsForAscii(raw){
    const compact = raw.replace(/\s+/g,'');
    if (!/^[01]*$/.test(compact)) return null;
    if (compact.length % 8 !== 0) return { ints:null, err:'Binary→ASCII harus kelipatan 8 bit' };
    const bytes = toChunksOf(compact, 8);
    return { ints: bytes.map(b => parseInt(b, 2)), err:null };
  }

  function parseIntTokens(tokens, base){
    const radix = baseRadix[base];
    return tokens.map(t => parseInt(stripPrefixes(t), radix));
  }
  function toBaseStrings(ints, base){
    const radix = baseRadix[base];
    return ints.map(n => {
      if (!Number.isFinite(n)) return 'NaN';
      let s = n.toString(radix);
      return base === 'hex' ? s.toUpperCase() : s;
    });
  }

  function convert(inputStr, from, to){
    if (from === 'ascii' && to === 'ascii') return inputStr;

    if (from === 'ascii' && to !== 'ascii'){
      const ints = asciiToInts(inputStr);
      return toBaseStrings(ints, to).join(' ');
    }

    const rawTokens = normSplitRaw(inputStr);
    if (from !== 'ascii' && to === 'ascii'){
      if (rawTokens.length === 0) return '';
      if (from === 'bin'){
        const joined = rawTokens.join('');
        const { ints, err } = binaryStringToIntsForAscii(joined);
        if (!ints) throw new Error(err || 'Input tidak valid untuk Binary→ASCII.');
        const str = intsToAscii(ints);
        if (str == null) throw new Error('Kode karakter di luar rentang Unicode.');
        return str;
      } else {
        for (const { ok, token } of validateTokens(rawTokens, from)){
          if (!ok) throw new Error(`Token '${token}' tidak valid untuk base ${from.toUpperCase()}`);
        }
        const ints = parseIntTokens(rawTokens, from);
        const str = intsToAscii(ints);
        if (str == null) throw new Error('Kode karakter di luar rentang Unicode.');
        return str;
      }
    }

    if (from !== 'ascii' && to !== 'ascii'){
      if (rawTokens.length === 0) return '';
      for (const { ok, token } of validateTokens(rawTokens, from)){
        if (!ok) throw new Error(`Token '${token}' tidak valid untuk base ${from.toUpperCase()}`);
      }
      const ints = parseIntTokens(rawTokens, from);
      return toBaseStrings(ints, to).join(' ');
    }

    return '';
  }

  function realtimeLint(){
    const text = input.value;
    const tokens = normSplitRaw(text);
    const fromSel = fromBaseEl.value;

    let baseForLint = fromSel;
    let detected = '—';

    if (fromSel === 'auto' && tokens.length){
      const guess = detectBase(tokens);
      if (guess){
        baseForLint = guess;
        detected = guess.toUpperCase();
      } else {
        baseForLint = 'dec'; // fallback
        detected = 'Ambiguous';
      }
    } else if (fromSel !== 'auto'){
      detected = fromSel.toUpperCase();
    }

    let specialHint = '';
    if ((fromSel === 'auto' ? baseForLint === 'bin' : fromSel === 'bin') && toBaseEl.value === 'ascii'){
      const joined = tokens.join('');
      if (!/^[01]*$/.test(joined)) {
        specialHint = 'Bukan biner 0/1';
      } else if (joined.length > 0 && joined.length % 8 !== 0) {
        specialHint = 'Panjang bit bukan kelipatan 8';
      }
    }

    renderChips(tokens.map(t => ({token:t})), baseForLint, specialHint);
    setDetectedBadge(detected);
  }

  function doConvert(){
    try{
      let from = fromBaseEl.value;
      const text = input.value;
      const tokens = normSplitRaw(text);

      if (from === 'auto' && tokens.length){
        const guess = detectBase(tokens);
        if (!guess) throw new Error('Tidak dapat mendeteksi basis. Harap pilih From Base secara manual.');
        from = guess;
      }

      const res = convert(text, from, toBaseEl.value);
      output.textContent = res;
      output.scrollTop = 0;
    }catch(e){
      output.textContent = e.message || 'Terjadi kesalahan saat konversi.';
    }
  }

  function doReset(){
    input.value = '';
    output.textContent = '';
    fromBaseEl.value = 'auto';
    toBaseEl.value = 'dec';
    realtimeLint();
    input.focus();
  }

  function doSwap(){
    let from = fromBaseEl.value;
    const tokens = normSplitRaw(input.value);
    if (from === 'auto' && tokens.length){
      const guess = detectBase(tokens);
      if (guess) from = guess;
    }

    const a = from;
    const b = toBaseEl.value;

    fromBaseEl.value = b === 'ascii' ? 'ascii' : b;
    toBaseEl.value   = a === 'auto' ? 'dec' : a;

    if (!input.value.trim()){
      if (fromBaseEl.value === 'ascii'){
        input.value = 'Hello';
      } else if (toBaseEl.value === 'ascii' && fromBaseEl.value === 'bin'){
        input.value = '01001000 01100101 01101100 01101100 01101111';
      } else {
        input.value = '65 66 90';
      }
    }
    realtimeLint();
    doConvert();
  }

  btnConvert.addEventListener('click', doConvert);
  btnReset  .addEventListener('click', doReset);
  btnSwap   .addEventListener('click', doSwap);

  [fromBaseEl, toBaseEl].forEach(el => el.addEventListener('change', () => {
    realtimeLint();
    if (input.value.trim()) doConvert();
  }));

  input.addEventListener('input', () => {
    realtimeLint();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      doConvert();
    }
  });

  btnCopy.addEventListener('click', async () => {
    try{
      await navigator.clipboard.writeText(output.textContent || '');
      toast('Hasil disalin ke clipboard.');
    }catch{
      toast('Gagal menyalin.');
    }
  });

  realtimeLint();
})();