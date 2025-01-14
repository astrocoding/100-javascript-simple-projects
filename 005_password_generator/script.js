(() => {
  // Character Sets
  const CHAR_SETS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  };

  // DOM Elements
  const passwordOutput = document.getElementById('passwordOutput');
  const copyBtn = document.getElementById('copyBtn');
  const copyBtnText = document.getElementById('copyBtnText');
  const refreshBtn = document.getElementById('refreshBtn');
  const lengthSlider = document.getElementById('lengthSlider');
  const lengthValue = document.getElementById('lengthValue');
  const strengthBanner = document.getElementById('strengthBanner');
  const strengthText = document.getElementById('strengthText');
  const toastContainer = document.getElementById('toastContainer');

  const checkboxes = {
    uppercase: document.getElementById('includeUppercase'),
    lowercase: document.getElementById('includeLowercase'),
    numbers: document.getElementById('includeNumbers'),
    symbols: document.getElementById('includeSymbols')
  };

  // Initialize
  init();

  function init() {
    setupEventListeners();
    generatePassword();
  }

  function setupEventListeners() {
    // Slider change
    lengthSlider.addEventListener('input', () => {
      lengthValue.textContent = lengthSlider.value;
      generatePassword();
    });

    // Checkbox toggles
    Object.values(checkboxes).forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        ensureAtLeastOneChecked(checkbox);
        generatePassword();
      });
    });

    // Refresh button
    refreshBtn.addEventListener('click', () => {
      generatePassword();
      rotateRefreshIcon();
    });

    // Copy button
    copyBtn.addEventListener('click', copyToClipboard);

    // Click on password field to select all
    passwordOutput.addEventListener('click', () => {
      passwordOutput.select();
    });
  }

  function ensureAtLeastOneChecked(changedCheckbox) {
    const checkedCount = Object.values(checkboxes).filter(cb => cb.checked).length;
    if (checkedCount === 0) {
      changedCheckbox.checked = true;
      showToast('Pilih setidaknya satu jenis karakter!', 'warning');
    }
  }

  function generatePassword() {
    const length = parseInt(lengthSlider.value, 10);
    let validChars = '';
    const guaranteedChars = [];

    // Build valid character pool & include guaranteed characters
    if (checkboxes.uppercase.checked) {
      validChars += CHAR_SETS.uppercase;
      guaranteedChars.push(getRandomChar(CHAR_SETS.uppercase));
    }
    if (checkboxes.lowercase.checked) {
      validChars += CHAR_SETS.lowercase;
      guaranteedChars.push(getRandomChar(CHAR_SETS.lowercase));
    }
    if (checkboxes.numbers.checked) {
      validChars += CHAR_SETS.numbers;
      guaranteedChars.push(getRandomChar(CHAR_SETS.numbers));
    }
    if (checkboxes.symbols.checked) {
      validChars += CHAR_SETS.symbols;
      guaranteedChars.push(getRandomChar(CHAR_SETS.symbols));
    }

    if (!validChars) return;

    const remainingLength = length - guaranteedChars.length;
    const resultArr = [...guaranteedChars];

    for (let i = 0; i < remainingLength; i++) {
      resultArr.push(getRandomChar(validChars));
    }

    // Shuffle array for uniform distribution
    shuffleArray(resultArr);

    const finalPassword = resultArr.join('');
    passwordOutput.value = finalPassword;

    updateStrengthMeter(finalPassword, length);
  }

  function getRandomChar(str) {
    if (window.crypto && window.crypto.getRandomValues) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      return str[array[0] % str.length];
    }
    return str[Math.floor(Math.random() * str.length)];
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function updateStrengthMeter(password, length) {
    let score = 0;
    const checkedTypes = Object.values(checkboxes).filter(cb => cb.checked).length;

    if (length >= 8) score += 1;
    if (length >= 12) score += 1;
    if (length >= 16) score += 1;
    if (checkedTypes >= 3) score += 1;
    if (checkedTypes === 4 && length >= 12) score += 1;

    strengthBanner.className = 'strength-banner';

    if (score <= 1) {
      strengthBanner.classList.add('weak');
      strengthText.textContent = 'Weak: Easy to guess, try adding symbols & length.';
    } else if (score === 2 || score === 3) {
      strengthBanner.classList.add('moderate');
      strengthText.textContent = 'Moderate: Not bad, but not Fort Knox either.';
    } else if (score === 4) {
      strengthBanner.classList.add('strong');
      strengthText.textContent = 'Strong: Fort Knox level security!';
    } else {
      strengthBanner.classList.add('very-strong');
      strengthText.textContent = 'Unbreakable: Maximum security unlocked!';
    }
  }

  async function copyToClipboard() {
    const text = passwordOutput.value;
    if (!text) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        passwordOutput.select();
        document.execCommand('copy');
      }

      // Visual feedback
      copyBtnText.textContent = 'Copied!';
      copyBtn.style.background = '#10b981';

      setTimeout(() => {
        copyBtnText.textContent = 'Copy';
        copyBtn.style.background = '';
      }, 1800);

      showToast('Password berhasil disalin!', 'success');
    } catch (error) {
      console.error('Copy failed:', error);
      showToast('Gagal menyalin password', 'error');
    }
  }

  function rotateRefreshIcon() {
    const icon = refreshBtn.querySelector('i');
    if (icon) {
      icon.style.transition = 'transform 0.4s ease';
      icon.style.transform = 'rotate(360deg)';
      setTimeout(() => {
        icon.style.transition = 'none';
        icon.style.transform = 'rotate(0deg)';
      }, 400);
    }
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toastContainer.removeChild(toast);
      }
    }, 2500);
  }
})();
