(() => {
  // DOM Elements
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const cameraStatus = document.getElementById('cameraStatus');
  const photoPreview = document.getElementById('photoPreview');
  const capturedPhoto = document.getElementById('capturedPhoto');
  const symmetryOverlay = document.getElementById('symmetryOverlay');
  
  // Control elements
  const startCameraBtn = document.getElementById('startCameraBtn');
  const stopCameraBtn = document.getElementById('stopCameraBtn');
  const cameraSelect = document.getElementById('cameraSelect');
  const captureBtn = document.getElementById('captureBtn');
  const retakeBtn = document.getElementById('retakeBtn');
  const saveBtn = document.getElementById('saveBtn');
  const clearGalleryBtn = document.getElementById('clearGalleryBtn');
  
  // Mode buttons
  const modeButtons = document.querySelectorAll('.mode-btn');
  const normalMode = document.getElementById('normalMode');
  const mirrorMode = document.getElementById('mirrorMode');
  const reverseMode = document.getElementById('reverseMode');
  const symmetryMode = document.getElementById('symmetryMode');
  
  // Settings
  const photoQuality = document.getElementById('photoQuality');
  const photoFormat = document.getElementById('photoFormat');
  const photoGallery = document.getElementById('photoGallery');
  const toastContainer = document.getElementById('toastContainer');
  
  // State
  let currentStream = null;
  let availableCameras = [];
  let currentMode = 'normal';
  let photoCount = 0;
  
  // Initialize app
  init();
  
  async function init() {
    try {
      // Load saved photos
      loadGallery();
      
      // Get available cameras
      await getCameras();
      
      // Setup event listeners
      setupEventListeners();
      
      // Check if device has camera
      if (availableCameras.length === 0) {
        showToast('Tidak ada kamera yang terdeteksi', 'warning');
        startCameraBtn.disabled = true;
      }
      
    } catch (error) {
      console.error('Error initializing app:', error);
      showToast('Error menginisialisasi aplikasi', 'error');
    }
  }
  
  async function getCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      availableCameras = devices.filter(device => device.kind === 'videoinput');
      
      // Populate camera select
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
      
      // Select first camera by default
      if (availableCameras.length > 0) {
        cameraSelect.value = availableCameras[0].deviceId;
      }
      
    } catch (error) {
      console.error('Error getting cameras:', error);
      showToast('Error mendapatkan daftar kamera', 'error');
    }
  }
  
  function setupEventListeners() {
    // Camera controls
    startCameraBtn.addEventListener('click', startCamera);
    stopCameraBtn.addEventListener('click', stopCamera);
    cameraSelect.addEventListener('change', switchCamera);
    
    // Photo controls
    captureBtn.addEventListener('click', capturePhoto);
    retakeBtn.addEventListener('click', retakePhoto);
    saveBtn.addEventListener('click', savePhoto);
    clearGalleryBtn.addEventListener('click', clearGallery);
    
    // Mode buttons
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
    
    // Handle camera permission changes
    navigator.permissions?.query({ name: 'camera' })
      .then(permissionStatus => {
        permissionStatus.addEventListener('change', handlePermissionChange);
      });
  }
  
  async function startCamera() {
    try {
      // Stop current stream if exists
      if (currentStream) {
        stopCamera();
      }
      
      const selectedCameraId = cameraSelect.value;
      
      // Get camera constraints
      const constraints = {
        video: {
          deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false
      };
      
      // Request camera access
      currentStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Set video source
      video.srcObject = currentStream;
      
      // Update UI
      cameraStatus.classList.add('hidden');
      startCameraBtn.disabled = true;
      stopCameraBtn.disabled = false;
      captureBtn.disabled = false;
      
      // Apply current mode
      applyMode();
      
      showToast('Kamera berhasil diaktifkan', 'success');
      
    } catch (error) {
      console.error('Error starting camera:', error);
      
      let message = 'Error mengakses kamera';
      if (error.name === 'NotAllowedError') {
        message = 'Akses kamera ditolak. Silakan izinkan akses kamera.';
      } else if (error.name === 'NotFoundError') {
        message = 'Kamera tidak ditemukan.';
      } else if (error.name === 'NotReadableError') {
        message = 'Kamera sedang digunakan aplikasi lain.';
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
    
    // Hide symmetry overlay
    symmetryOverlay.classList.remove('active');
    
    showToast('Kamera dihentikan', 'success');
  }
  
  async function switchCamera() {
    if (currentStream) {
      await startCamera();
    }
  }
  
  function setMode(mode) {
    currentMode = mode;
    
    // Update active button
    modeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    // Apply mode if camera is active
    if (currentStream) {
      applyMode();
    }
  }
  
  function applyMode() {
    // Reset all transformations
    video.className = 'camera-video';
    symmetryOverlay.classList.remove('active');
    
    // Apply mode-specific transformations
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
        // No additional classes needed
        break;
    }
  }
  
  function capturePhoto() {
    if (!currentStream) {
      showToast('Kamera tidak aktif', 'warning');
      return;
    }
    
    try {
      // Set canvas size to video dimensions
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      const ctx = canvas.getContext('2d');
      
      // Apply transformations based on mode
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
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
      
      // Draw symmetry line for symmetry mode
      if (currentMode === 'symmetry') {
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(videoWidth / 2, 0);
        ctx.lineTo(videoWidth / 2, videoHeight);
        ctx.stroke();
      }
      
      ctx.restore();
      
      // Get photo data
      const quality = parseFloat(photoQuality.value);
      const format = photoFormat.value;
      const photoDataUrl = canvas.toDataURL(format, quality);
      
      // Show preview
      capturedPhoto.src = photoDataUrl;
      photoPreview.classList.add('active');
      
      // Store photo data for saving
      capturedPhoto.dataset.photoData = photoDataUrl;
      
      showToast('Foto berhasil diambil!', 'success');
      
    } catch (error) {
      console.error('Error capturing photo:', error);
      showToast('Error mengambil foto', 'error');
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
      // Save to gallery
      addToGallery(photoData);
      
      // Download photo
      const link = document.createElement('a');
      link.download = `photo_${Date.now()}.${getFileExtension()}`;
      link.href = photoData;
      link.click();
      
      // Hide preview
      retakePhoto();
      
      showToast('Foto berhasil disimpan!', 'success');
      
    } catch (error) {
      console.error('Error saving photo:', error);
      showToast('Error menyimpan foto', 'error');
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
      <img src="${photoData}" alt="Photo ${photoCount}">
      <button class="delete-btn" onclick="deletePhoto(this)">
        <i class="fa-solid fa-times"></i>
      </button>
    `;
    
    // Add click to view full size
    galleryItem.addEventListener('click', (e) => {
      if (!e.target.classList.contains('delete-btn')) {
        viewPhoto(photoData);
      }
    });
    
    photoGallery.appendChild(galleryItem);
    
    // Save to localStorage
    saveGallery();
  }
  
  function viewPhoto(photoData) {
    const modal = document.createElement('div');
    modal.className = 'photo-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1001;
      cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.src = photoData;
    img.style.cssText = `
      max-width: 90%;
      max-height: 90%;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    `;
    
    modal.appendChild(img);
    document.body.appendChild(modal);
    
    modal.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  }
  
  function deletePhoto(button) {
    const galleryItem = button.parentElement;
    galleryItem.remove();
    saveGallery();
    showToast('Foto dihapus', 'success');
  }
  
  function clearGallery() {
    if (photoGallery.children.length === 0) {
      showToast('Gallery sudah kosong', 'warning');
      return;
    }
    
    if (confirm('Hapus semua foto dari gallery?')) {
      photoGallery.innerHTML = '';
      photoCount = 0;
      saveGallery();
      showToast('Gallery berhasil dikosongkan', 'success');
    }
  }
  
  function saveGallery() {
    const photos = Array.from(photoGallery.children).map(item => {
      const img = item.querySelector('img');
      return img.src;
    });
    
    localStorage.setItem('cameraAppPhotos', JSON.stringify(photos));
  }
  
  function loadGallery() {
    try {
      const savedPhotos = localStorage.getItem('cameraAppPhotos');
      if (savedPhotos) {
        const photos = JSON.parse(savedPhotos);
        photos.forEach(photoData => {
          addToGallery(photoData);
        });
      }
    } catch (error) {
      console.error('Error loading gallery:', error);
    }
  }
  
  function handleKeyboard(e) {
    // Prevent shortcuts when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
      return;
    }
    
    switch (e.key.toLowerCase()) {
      case ' ': // Spacebar to capture
        e.preventDefault();
        if (!captureBtn.disabled) {
          capturePhoto();
        }
        break;
      case 'enter': // Enter to start/stop camera
        e.preventDefault();
        if (currentStream) {
          stopCamera();
        } else {
          startCamera();
        }
        break;
      case 'escape': // Escape to retake photo
        e.preventDefault();
        if (photoPreview.classList.contains('active')) {
          retakePhoto();
        }
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
  
  function handlePermissionChange() {
    // Refresh camera list when permissions change
    getCameras();
  }
  
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = getToastIcon(type);
    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <i class="fa-solid ${icon}"></i>
        <span>${message}</span>
      </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
          if (toast.parentElement) {
            toastContainer.removeChild(toast);
          }
        }, 300);
      }
    }, 3000);
  }
  
  function getToastIcon(type) {
    switch (type) {
      case 'success': return 'fa-check-circle';
      case 'error': return 'fa-exclamation-circle';
      case 'warning': return 'fa-exclamation-triangle';
      default: return 'fa-info-circle';
    }
  }
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (currentStream) {
      stopCamera();
    }
  });
  
  // Handle visibility change (tab switching)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && currentStream) {
      // Optionally pause camera when tab is not visible
      // This can help with performance and battery life
    }
  });

  // Export deletePhoto function to global scope for onclick handler
  window.deletePhoto = deletePhoto;
})();
