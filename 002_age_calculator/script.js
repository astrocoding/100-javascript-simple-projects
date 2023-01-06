document.getElementById('calculateButton').addEventListener('click', () => {
  const birthDate = new Date(document.getElementById('birthDate').value);
  const today = new Date();

  if (!birthDate || birthDate > today) {
    document.getElementById('result').textContent = "Please enter a valid birth date!";
    return; // Exit the function
  }

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  document.getElementById('result').textContent = `You are ${age} years old!`;
})