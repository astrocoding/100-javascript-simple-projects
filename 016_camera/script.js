(() => {
  // DOM Elements
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const cameraStatus = document.getElementById('cameraStatus');
  const photoPreview = document.getElementById('photoPreview');
  const capturedPhoto = document.getElementById('capturedPhoto');
  const symmetryOverlay = document.getElementById('symmetryOverlay');

  // Control buttons
  const startCameraBtn = document.getElementById('startCameraBtn');
  const stopCameraBtn = document.getElementById('stopCameraBtn');
  const cameraSelect = document.getElementById('cameraSelect');
  const captureBtn = document.getElementById('captureBtn');
  const retakeBtn = document.getElementById('retakeBtn');
  const saveBtn = document.getElementById('saveBtn');
  const clearGalleryBtn = document.getElementById('clearGalleryBtn');

  // Modal elements
  const confirmModal = document.getElementById('confirmModal');
  const confirmTitle = document.getElementById('confirmTitle');
  const confirmMessage = document.getElementById('confirmMessage');
  const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
  const acceptConfirmBtn = document.getElementById('acceptConfirmBtn');

  // Mode buttons & settings
  const modeButtons = document.querySelectorAll('.mode-btn');
  const photoQuality = document.getElementById('photoQuality');
  const photoFormat = document.getElementById('photoFormat');
  const photoGallery = document.getElementById('photoGallery');
  const toastContainer = document.getElementById('toastContainer');

  // App State
  let currentStream = null;
  let availableCameras = [];
  let currentMode = 'normal';
  let photoCount = 0;
  let onConfirmCallback = null;

  // Initialize Application
  init();

  async function init() {
    try {
      loadGallery();
      await getCameras();
      setupEventListeners();

      if (availableCameras.length === 0) {
        showToast('Tidak ada kamera yang terdeteksi', 'warning');
        startCameraBtn.disabled = true;
      }
    } catch (error) {
      console.error('Error initializing app:', error);
      showToast('Error menginisialisasi aplikasi kamera', 'error');
    }
  }

  async function getCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      availableCameras = devices.filter(device => device.kind === 'videoinput');

      cameraSelect.innerHTML = '';

      if (availableCameras.length === 0) {
        cameraSelect.innerHTML = '<option value="">Tidak ada kamera</option>';
        return;
      }

      availableCameras.forEach((camera, index) => {
        const option = document.createElement('option');
        option.value = camera.deviceId;
        option.textContent = camera.label || `Kamera ${index + 1}`;
        cameraSelect.appendChild(option);
      });

      if (availableCameras.length > 0) {
        cameraSelect.value = availableCameras[0].deviceId;
      }
    } catch (error) {
      console.error('Error getting cameras:', error);
      showToast('Gagal mendapatkan daftar kamera', 'error');
    }
  }

  function setupEventListeners() {
    startCameraBtn.addEventListener('click', startCamera);
    stopCameraBtn.addEventListener('click', stopCamera);
    cameraSelect.addEventListener('change', switchCamera);

    captureBtn.addEventListener('click', capturePhoto);
    retakeBtn.addEventListener('click', retakePhoto);
    saveBtn.addEventListener('click', savePhoto);
    clearGalleryBtn.addEventListener('click', clearGallery);

    // Modal listeners
    cancelConfirmBtn.addEventListener('click', closeConfirmModal);
    acceptConfirmBtn.addEventListener('click', () => {
      if (typeof onConfirmCallback === 'function') {
        onConfirmCallback();
      }
      closeConfirmModal();
    });

    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) {
        closeConfirmModal();
      }
    });

    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });

    document.addEventListener('keydown', handleKeyboard);

    // Event delegation for photo gallery item clicks & deletion
    photoGallery.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.delete-btn');
      if (deleteBtn) {
        const item = deleteBtn.closest('.gallery-item');
        if (item) {
          showConfirmModal({
            title: 'Hapus Foto',
            message: 'Apakah Anda yakin ingin menghapus foto ini dari galeri?',
            onConfirm: () => {
              item.remove();
              saveGallery();
              showToast('Foto telah dihapus', 'success');
            }
          });
        }
        return;
      }

      const item = e.target.closest('.gallery-item');
      if (item) {
        const img = item.querySelector('img');
        if (img) viewPhoto(img.src);
      }
    });

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' })
        .then(permissionStatus => {
          permissionStatus.addEventListener('change', () => getCameras());
        }).catch(() => {});
    }
  }

  async function startCamera() {
    try {
      if (currentStream) {
        stopCamera();
      }

      const selectedCameraId = cameraSelect.value;
      const constraints = {
        video: {
          deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false
      };

      currentStream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = currentStream;

      cameraStatus.classList.add('hidden');
      startCameraBtn.disabled = true;
      stopCameraBtn.disabled = false;
      captureBtn.disabled = false;

      applyMode();
      showToast('Kamera berhasil diaktifkan', 'success');
    } catch (error) {
      console.error('Error starting camera:', error);
      let message = 'Gagal mengakses kamera';
      if (error.name === 'NotAllowedError') {
        message = 'Akses kamera ditolak oleh pengguna.';
      } else if (error.name === 'NotFoundError') {
        message = 'Perangkat kamera tidak ditemukan.';
      } else if (error.name === 'NotReadableError') {
        message = 'Kamera sedang digunakan oleh aplikasi lain.';
      }
      showToast(message, 'error');
    }
  }

  function stopCamera() {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      currentStream = null;
    }

    video.srcObject = null;
    cameraStatus.classList.remove('hidden');
    startCameraBtn.disabled = false;
    stopCameraBtn.disabled = true;
    captureBtn.disabled = true;

    symmetryOverlay.classList.remove('active');
    showToast('Kamera dihentikan', 'info');
  }

  async function switchCamera() {
    if (currentStream) {
      await startCamera();
    }
  }

  function setMode(mode) {
    currentMode = mode;
    modeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    if (currentStream) {
      applyMode();
    }
  }

  function applyMode() {
    video.className = 'camera-video';
    symmetryOverlay.classList.remove('active');

    switch (currentMode) {
      case 'mirror':
        video.classList.add('mirror');
        break;
      case 'reverse':
        video.classList.add('reverse');
        break;
      case 'symmetry':
        video.classList.add('symmetry');
        symmetryOverlay.classList.add('active');
        break;
      case 'normal':
      default:
        break;
    }
  }

  function capturePhoto() {
    if (!currentStream) {
      showToast('Kamera tidak aktif', 'warning');
      return;
    }

    try {
      const videoWidth = video.videoWidth || 1280;
      const videoHeight = video.videoHeight || 720;

      canvas.width = videoWidth;
      canvas.height = videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.save();

      switch (currentMode) {
        case 'mirror':
          ctx.scale(-1, 1);
          ctx.translate(-videoWidth, 0);
          break;
        case 'reverse':
          ctx.scale(1, -1);
          ctx.translate(0, -videoHeight);
          break;
        case 'symmetry':
          ctx.scale(-1, 1);
          ctx.translate(-videoWidth, 0);
          break;
      }

      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

      if (currentMode === 'symmetry') {
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(videoWidth / 2, 0);
        ctx.lineTo(videoWidth / 2, videoHeight);
        ctx.stroke();
      }

      ctx.restore();

      const quality = parseFloat(photoQuality.value);
      const format = photoFormat.value;
      const photoDataUrl = canvas.toDataURL(format, quality);

      capturedPhoto.src = photoDataUrl;
      photoPreview.classList.add('active');
      capturedPhoto.dataset.photoData = photoDataUrl;

      showToast('Foto berhasil diambil', 'success');
    } catch (error) {
      console.error('Error capturing photo:', error);
      showToast('Gagal mengambil foto', 'error');
    }
  }

  function retakePhoto() {
    photoPreview.classList.remove('active');
    capturedPhoto.src = '';
    delete capturedPhoto.dataset.photoData;
  }

  function savePhoto() {
    const photoData = capturedPhoto.dataset.photoData;
    if (!photoData) {
      showToast('Tidak ada foto untuk disimpan', 'warning');
      return;
    }

    try {
      addToGallery(photoData);

      const link = document.createElement('a');
      link.download = `camera_photo_${Date.now()}.${getFileExtension()}`;
      link.href = photoData;
      link.click();

      retakePhoto();
      showToast('Foto berhasil disimpan', 'success');
    } catch (error) {
      console.error('Error saving photo:', error);
      showToast('Gagal menyimpan foto', 'error');
    }
  }

  function getFileExtension() {
    const format = photoFormat.value;
    switch (format) {
      case 'image/png': return 'png';
      case 'image/webp': return 'webp';
      case 'image/jpeg':
      default: return 'jpg';
    }
  }

  function addToGallery(photoData) {
    photoCount++;

    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';
    galleryItem.innerHTML = `
      <img src="${photoData}" alt="Foto ${photoCount}">
      <button class="delete-btn" type="button" title="Hapus foto">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    photoGallery.appendChild(galleryItem);
    saveGallery();
  }

  function viewPhoto(photoData) {
    const modal = document.createElement('div');
    modal.className = 'photo-modal';
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.92);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1001;
      cursor: pointer;
      padding: 20px;
      backdrop-filter: blur(8px);
    `;

    const img = document.createElement('img');
    img.src = photoData;
    img.style.cssText = `
      max-width: 92%;
      max-height: 90%;
      border-radius: 12px;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6);
      border: 2px solid rgba(255, 255, 255, 0.2);
    `;

    modal.appendChild(img);
    document.body.appendChild(modal);

    modal.addEventListener('click', () => {
      if (modal.parentElement) {
        document.body.removeChild(modal);
      }
    });
  }

  /* Custom Confirmation Modal Functionality (No Native confirm/prompt) */
  function showConfirmModal({ title, message, onConfirm }) {
    if (confirmTitle) confirmTitle.textContent = title || 'Konfirmasi Hapus';
    if (confirmMessage) confirmMessage.textContent = message || 'Apakah Anda yakin ingin melanjutkan?';

    onConfirmCallback = onConfirm;
    confirmModal.style.display = 'flex';
    cancelConfirmBtn.focus();
  }

  function closeConfirmModal() {
    confirmModal.style.display = 'none';
    onConfirmCallback = null;
  }

  function clearGallery() {
    if (photoGallery.children.length === 0) {
      showToast('Galeri foto sudah kosong', 'warning');
      return;
    }

    showConfirmModal({
      title: 'Hapus Semua Foto',
      message: 'Apakah Anda yakin ingin menghapus semua foto dari galeri?',
      onConfirm: () => {
        photoGallery.innerHTML = '';
        photoCount = 0;
        saveGallery();
        showToast('Galeri berhasil dikosongkan', 'success');
      }
    });
  }

  function saveGallery() {
    const photos = Array.from(photoGallery.children).map(item => {
      const img = item.querySelector('img');
      return img ? img.src : null;
    }).filter(Boolean);

    try {
      localStorage.setItem('cameraAppPhotos', JSON.stringify(photos));
    } catch {
      // Ignore quota error if storage is full
    }
  }

  function loadGallery() {
    try {
      const savedPhotos = localStorage.getItem('cameraAppPhotos');
      if (savedPhotos) {
        const photos = JSON.parse(savedPhotos);
        photos.forEach(photoData => addToGallery(photoData));
      }
    } catch (error) {
      console.error('Error loading gallery:', error);
    }
  }

  function handleKeyboard(e) {
    if (e.key === 'Escape') {
      if (confirmModal.style.display === 'flex') {
        closeConfirmModal();
        return;
      }
      if (photoPreview.classList.contains('active')) {
        retakePhoto();
        return;
      }
    }

    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
      return;
    }

    switch (e.key.toLowerCase()) {
      case ' ':
        e.preventDefault();
        if (!captureBtn.disabled) capturePhoto();
        break;
      case 'enter':
        e.preventDefault();
        if (currentStream) stopCamera(); else startCamera();
        break;
      case '1':
        e.preventDefault();
        setMode('normal');
        break;
      case '2':
        e.preventDefault();
        setMode('mirror');
        break;
      case '3':
        e.preventDefault();
        setMode('reverse');
        break;
      case '4':
        e.preventDefault();
        setMode('symmetry');
        break;
    }
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = getToastIcon(type);

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <i class="fa-solid ${icon}"></i>
        <span>${message}</span>
      </div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'slideOut 0.25s ease forwards';
        setTimeout(() => {
          if (toast.parentElement) {
            toastContainer.removeChild(toast);
          }
        }, 250);
      }
    }, 2800);
  }

  function getToastIcon(type) {
    switch (type) {
      case 'success': return 'fa-circle-check';
      case 'error': return 'fa-circle-exclamation';
      case 'warning': return 'fa-triangle-exclamation';
      default: return 'fa-circle-info';
    }
  }

  window.addEventListener('beforeunload', () => {
    if (currentStream) stopCamera();
  });
})();
