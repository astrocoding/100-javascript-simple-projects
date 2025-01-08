(() => {
  const LS_KEY = 'mvr_clips_v1';

  function loadAll() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveAll(list) {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  }

  function genId() {
    return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  }

  function dataURLToBlob(dataURL) {
    const [meta, b64] = dataURL.split(',');
    const mime = (meta.match(/data:(.*);base64/) || [])[1] || 'application/octet-stream';
    const bin = atob(b64);
    const len = bin.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  async function saveClip({ blob, mime, duration, createdISO, filename }) {
    const dataURL = await blobToDataURL(blob);

    const item = {
      id: genId(),
      mime,
      duration,
      createdISO,
      filename,
      dataURL
    };

    let list = loadAll();
    list.push(item);
    try {
      saveAll(list);
    } catch (e) {
      list.shift();
      try {
        saveAll(list);
      } catch {
        console.warn('Gagal menyimpan ke LocalStorage (kemungkinan quota penuh).');
      }
    }
    return item.id;
  }

  function removeClip(id) {
    const list = loadAll().filter(it => it.id !== id);
    saveAll(list);
  }

  async function restoreClips() {
    const list = loadAll();
    return list.map(it => ({
      id: it.id,
      blob: dataURLToBlob(it.dataURL),
      mime: it.mime,
      duration: it.duration,
      createdISO: it.createdISO,
      filename: it.filename
    }));
  }

  window.MVRStorage = {
    saveClip,
    removeClip,
    restoreClips
  };
})();