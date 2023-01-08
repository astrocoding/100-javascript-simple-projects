let startTime, updatedTime, diff, tInterval;
let running = false;

const timeDisplay = document.getElementById('timeDisplay');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const resetButton = document.getElementById('resetButton');

function startTimer() {
  if (!running) {
    startTime = new Date().getTime();
    tInterval = setInterval(updateTimer, 1000);
    running = true;
    //startButton.textContent = "Stop";
    startButton.disable = true;
    pauseButton.disable = false;
    resetButton.disable = false;
    pauseButton.style.backgroundColor = "#F44336";
  } else {
    stopTimer();
  }
}

function stopTimer() {
  clearInterval(tInterval);
  running = false;
  startButton.textContent = "Start";
  pauseButton.disable = false;
  resetButton.disable = false;
}

function updateTimer() {
  updatedTime = new Date().getTime();
  diff = updatedTime - startTime;

  let hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  let minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  let seconds = Math.floor((diff % (1000 * 60)) / 1000);

  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  timeDisplay.textContent = `${hours}:${minutes}:${seconds}`;
}

function resetTimer() {
  clearInterval(tInterval);
  timeDisplay.textContent = "00:00:00";
  startButton.textContent = "Start";
  pauseButton.disabled = true;
  resetButton.disabled = true;
  running = false;
}

startButton.addEventListener('click', startTimer);
pauseButton.addEventListener('click', stopTimer);
resetButton.addEventListener('click', resetTimer);