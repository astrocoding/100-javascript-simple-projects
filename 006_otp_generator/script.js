function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000); // 6 digit OTP
  document.getElementById('otp').value = otp;
}

function copyOTP() {
  const otpInput = document.getElementById('otp');
  otpInput.select();
  otpInput.setSelectionRange(0, 99999);
  document.execCommand('copy');
  alert('OTP Copied to Clipboard!');
}

document.getElementById('generate-btn').addEventListener('click', generateOTP);
document.getElementById('copy-btn').addEventListener('click', copyOTP);