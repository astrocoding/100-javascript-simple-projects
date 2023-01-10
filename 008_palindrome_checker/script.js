function checkPalindrome() {
  const inputText = document.getElementById('text-input').value.trim();
  const resultDiv = document.getElementById('result');

  if (inputText === '') {
    resultDiv.innerHTML = 'Please enter a word or phrase!';
    return;
  }

  const normalizedText = inputText.toLowerCase().replace(/[^a-z0-9]/g, '');
  const reversedText = normalizedText.split('').reverse().join('');

  if (normalizedText === reversedText) {
    resultDiv.textContent = `"${inputText}" is a palindrome!`;
  } else {
    resultDiv.textContent = `"${inputText}" is not a palindrome!`;
  }
}

document.getElementById('check-btn').addEventListener('click', checkPalindrome);