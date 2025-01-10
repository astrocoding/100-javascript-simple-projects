(() => {
  const input     = document.getElementById('input');
  const fromBase  = document.getElementById('fromBase');
  const toBase    = document.getElementById('toBase');
  const btnConvert= document.getElementById('btnConvert');
  const btnReset  = document.getElementById('btnReset');
  const btnSwap   = document.getElementById('btnSwap');
  const output    = document.getElementById('output');
  const btnCopy   = document.getElementById('btnCopy');

  /* ---------- Util UI ---------- */
  function toast(msg){
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = 'position:fixed;bottom:16px;left:16px;background:#555184;color:#fff;padding:10px 12px;border-radius:10px;z-index:9999;box-shadow:0 8px 18px rgba(0,0,0,.15)';
    document.body.appendChild(el);
    setTimeout(()=>el.remove(), 2200);
  }

  function normSplit(str){
    // Pisah spasi/koma/baris → array string non-kosong
    return str
      .replace(/\s+/g,' ')       // rapikan spasi berlebih
      .replace(/,/g,' ')         // koma jadi spasi
      .trim()
      .split(' ')
      .filter(Boolean);
  }

  function toChunksOf(str, size){
    const out = [];
    for (let i=0;i<str.length;i+=size){
      out.push(str.slice(i, i+size));
    }
    return out;
  }

  function isValidForBase(token, base){
    const maps = {
      bin: /^[01]+$/i,
      oct: /^[0-7]+$/i,
      dec: /^-?\d+$/,
      hex: /^[0-9a-f]+$/i
    };
    return maps[base].test(token);
  }

  /* ---------- Konversi Inti ---------- */
  const baseRadix = { bin:2, oct:8, dec:10, hex:16 };

  function parseFromBaseTokens(tokens, base){
    // tokens: ["1010","1111"] → [10,15] (Integer)
    const radix = baseRadix[base];
    return tokens.map(t => parseInt(t, radix));
  }

  function toTargetBaseStrings(ints, base){
    const radix = baseRadix[base];
    return ints.map(n => {
      if (!Number.isFinite(n)) return 'NaN';
      let s = n.toString(radix);
      if (base === 'hex') s = s.toUpperCase();
      return s;
    });
  }

  function asciiToInts(str){
    const ints = [];
    for (const ch of str){
      ints.push(ch.codePointAt(0));
    }
    return ints;
  }

  function intsToAscii(ints){
    try{
      return ints.map(n => String.fromCodePoint(n)).join('');
    }catch{
      return null; // invalid codepoint
    }
  }

  function binaryStringToIntsForAscii(raw){
    // Bisa: "01001000 01101001" atau "0100100001101001"
    const compact = raw.replace(/\s+/g,'');
    if (!/^[01]*$/.test(compact)) return null;
    // auto pad kiri agar kelipatan 8 (opsional—di sini kita **tidak pad**; jika tak kelipatan, tolak)
    if (compact.length % 8 !== 0) return null;
    const bytes = toChunksOf(compact, 8);
    return bytes.map(b => parseInt(b, 2));
  }

  function tokensToIntsForAscii(tokens, srcBase){
    if (srcBase === 'bin'){
      // tokens bisa ["01001000","01101001"] atau satu token panjang → gabung lalu pecah per 8
      const joined = tokens.join('');
      const ints = binaryStringToIntsForAscii(joined);
      return ints; // bisa null jika invalid
    }
    const radix = baseRadix[srcBase];
    const ints = [];
    for (const t of tokens){
      if (!isValidForBase(t, srcBase)) return null;
      const v = parseInt(t, radix);
      if (!Number.isFinite(v)) return null;
      ints.push(v);
    }
    return ints;
  }

  function convert(inputStr, from, to){
    // ASCII ↔ basis lain
    if (from === 'ascii' && to === 'ascii'){
      return inputStr; // identitas
    }

    // 1) FROM ASCII → TO basis
    if (from === 'ascii' && to !== 'ascii'){
      const ints = asciiToInts(inputStr);
      return toTargetBaseStrings(ints, to).join(' ');
    }

    const tokens = normSplit(inputStr);

    // 2) FROM basis → TO ASCII
    if (from !== 'ascii' && to === 'ascii'){
      if (tokens.length === 0) return '';
      const ints = tokensToIntsForAscii(tokens, from);
      if (!ints) throw new Error('Input tidak valid untuk dikonversi ke ASCII.\n• Binary ke ASCII harus kelipatan 8 bit.\n• Pastikan token sesuai base sumber.');
      const str = intsToAscii(ints);
      if (str == null) throw new Error('Kode karakter di luar rentang Unicode.');
      return str;
    }

    // 3) FROM basis → TO basis
    if (from !== 'ascii' && to !== 'ascii'){
      if (tokens.length === 0) return '';
      // validasi token terhadap base sumber
      for (const t of tokens){
        if (!isValidForBase(t, from)) {
          throw new Error(`Token '${t}' tidak valid untuk base ${from.toUpperCase()}`);
        }
      }
      const ints = parseFromBaseTokens(tokens, from);
      return toTargetBaseStrings(ints, to).join(' ');
    }

    return '';
  }

  /* ---------- Event handlers ---------- */
  function doConvert(){
    try{
      const res = convert(input.value, fromBase.value, toBase.value);
      output.textContent = res;
      output.scrollTop = 0;
    }catch(e){
      output.textContent = e.message || 'Terjadi kesalahan saat konversi.';
    }
  }

  function doReset(){
    input.value = '';
    output.textContent = '';
    fromBase.value = 'dec';
    toBase.value = 'hex';
    input.focus();
  }

  function doSwap(){
    const a = fromBase.value;
    fromBase.value = toBase.value;
    toBase.value = a;

    // Jika swap ASCII dan basis lain & input kosong, beri contoh
    if (!input.value.trim()){
      if (fromBase.value === 'ascii'){
        input.value = 'Hello';
      } else if (toBase.value === 'ascii' && fromBase.value === 'bin'){
        input.value = '01001000 01100101 01101100 01101100 01101111';
      } else {
        input.value = '65 66 90';
      }
    }
    doConvert();
  }

  /* ---------- Bind ---------- */
  btnConvert.addEventListener('click', doConvert);
  btnReset  .addEventListener('click', doReset);
  btnSwap   .addEventListener('click', doSwap);

  [fromBase, toBase].forEach(el => el.addEventListener('change', () => {
    // auto convert jika input ada
    if (input.value.trim()) doConvert();
  }));

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

  // Convert awal (kalau ada placeholder dimodif user)
})();