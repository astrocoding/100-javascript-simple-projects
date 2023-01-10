function checkPalindrome() {
  const inputText = document.getElementById('text-input').value.trim();
  const resultDiv = document.getElementById('result');

  if (inputText === '') {
    resultDiv.textContent = 'Please enter a word or phrase!';
    return;
  }
  // console.log(inputText);

  const normalizedText = inputText.toLowerCase().replace(/[^a-z0-9]/g, '');
  const reversedText = normalizedText.split('').reverse().join('');

  if (normalizedText === reversedText) {
    resultDiv.textContent = `"${inputText}" is a palindrome!`;
  } else {
    resultDiv.textContent = `"${inputText}" is not a palindrome.`;
  }
}
checkBtn = document.getElementById('check-btn');

checkBtn.addEventListener('click', checkPalindrome);