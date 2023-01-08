const generateBtn = document.getElementById('generate-btn');
const copyBtn = document.getElementById('copy-btn');
const passwordField = document.getElementById('password');

// Kriteria password
const characters = {
  low: 'abcdefghijklmnopqrstuvwxyz',
  medium: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  strong: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-='
};

function generatePassword(strength) {
  const charSet = characters[strength];
  let password = '';
  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * charSet.length);
    password += charSet[randomIndex];
  }
  return password;
}

generateBtn.addEventListener('click', () => {
  const selectedStrength = document.querySelector('input[name="strength"]:checked').value;
  const password = generatePassword(selectedStrength);
  passwordField.value = password;
});

copyBtn.addEventListener('click', () => {
  if (passwordField.value) {
    passwordField.select();
    document.execCommand('copy');
    alert('Password copied to clipboard!');
  }
});
