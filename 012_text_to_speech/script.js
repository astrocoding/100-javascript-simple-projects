const textInput = document.getElementById("textInput");
const voiceSelect = document.getElementById("voiceSelect");
const speakBtn = document.getElementById("speakBtn");
const stopBtn = document.getElementById("stopBtn");

let voices = [];
let utterance;

function loadVoices() {
  voices = speechSynthesis.getVoices();
  voiceSelect.innerHTML = "";
  voices.forEach((voice, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  });
}

function speak() {
  if (speechSynthesis.speaking) speechSynthesis.cancel();
  const text = textInput.value.trim();
  if (!text) return;

  utterance = new SpeechSynthesisUtterance(text);
  const selected = voices[voiceSelect.value];
  if (selected) utterance.voice = selected;
  speechSynthesis.speak(utterance);
}

function stop() {
  speechSynthesis.cancel();
}

speechSynthesis.onvoiceschanged = loadVoices;
speakBtn.addEventListener("click", speak);
stopBtn.addEventListener("click", stop);

loadVoices();