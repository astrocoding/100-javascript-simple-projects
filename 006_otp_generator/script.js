function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000); // 6 digit OTP
  document.getElementById('otp').value = otp;

  document.getElementById('otp').disabled = false;
}

function copyOTP() {
  const otpInput = document.getElementById('otp');

  if (otpInput.value !== '') {
    otpInput.select();
    otpInput.setSelectionRange(0, 99999);
    document.execCommand('copy');
    alert('OTP Copied to Clipboard!');
  } else {
    alert('Please Generate OTP First!');
    document.getElementById('copy-btn').disabled = true;
  }
}

function checkOTP() {
  const otpInput = document.getElementById('otp');
  const copyBtn = document.getElementById('copy-btn');

  copyBtn.disabled = otpInput.value === '';
}

document.getElementById('generate-btn').addEventListener('click', generateOTP);
document.getElementById('copy-btn').addEventListener('click', copyOTP);
document.getElementById('otp').addEventListener('input', checkOTP);