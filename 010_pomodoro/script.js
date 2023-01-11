let timer;
let isRunning = false;
let timeLeft = 25 * 60;

const timeDisplay = document.getElementById('time');
const startPauseBtn = document.getElementById('start-pause-btn');
const resetBtn = document.getElementById('reset-btn');

function updateTimer() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timeDisplay.textContent = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function startPauseTimer() {
  if (isRunning) {
    clearInterval(timer);
    startPauseBtn.textContent = 'Start';
  } else {
    timer = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        updateTimer();
      } else {
        clearInterval(timer);
        startPauseBtn.textContent = 'Start';
        alert('Time\'s up!');
      }
    }, 1000);
    startPauseBtn.textContent = 'Pause';
  }
  isRunning = !isRunning;
}

function resetTimer() {
  clearInterval(timer);
  timeLeft = 25 * 60;
  updateTimer();
  startPauseBtn.textContent = 'Start';
  isRunning = false;
}

startPauseBtn.addEventListener('click', startPauseTimer);
resetBtn.addEventListener('click', resetTimer);

updateTimer();
