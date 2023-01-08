function playClock() {
  const now = new Date();

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const dayName = dayNames[now.getDay()];
  const date = now.getDate();
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  document.getElementById('day-name').textContent = dayName;
  document.getElementById('date').textContent = date;
  document.getElementById('month').textContent = month;
  document.getElementById('year').textContent = year;

  document.getElementById('time').textContent = `${hours}:${minutes}:${seconds}`;
}

// Perbaharui jam setiap detik
setInterval(playClock, 1000);

playClock();