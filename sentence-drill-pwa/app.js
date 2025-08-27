const settingsKey = 'sdSettings';
let deck = [];
let settings = { voice: null, rate: 1, repetitions: 1, batchSize: 5 };
let studyIndex = 0;


function saveSettings() {
  localStorage.setItem(settingsKey, JSON.stringify(settings));
}

function loadSettings() {
  const set = localStorage.getItem(settingsKey);
  if (set) settings = { ...settings, ...JSON.parse(set) };
  document.getElementById('repetitions').value = settings.repetitions;
  document.getElementById('rate').value = settings.rate;
  document.getElementById('batchSize').value = settings.batchSize;
}

function populateVoices() {
  const voices = speechSynthesis.getVoices();
  const select = document.getElementById('voiceSelect');
  select.innerHTML = '';
  voices.forEach((v, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${v.name} (${v.lang})`;
    if (settings.voice && settings.voice === v.name) opt.selected = true;
    select.appendChild(opt);
  });
}

speechSynthesis.onvoiceschanged = populateVoices;

function speak(text, rep, onComplete) {
  let count = 0;
  function once() {
    const utter = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    const voiceIndex = document.getElementById('voiceSelect').value;
    utter.voice = voices[voiceIndex] || null;
    utter.rate = parseFloat(document.getElementById('rate').value);
    utter.onend = () => {
      count++;
      if (count < rep) {
        setTimeout(once, 0);
      } else if (onComplete) {
        onComplete();
      }
    };
    speechSynthesis.speak(utter);
  }
  once();
}

function updateProgress() {
  const progress = document.getElementById('progress');
  progress.textContent = `Completed ${Math.min(studyIndex, deck.length)}/${deck.length}`;

}

function parseCSV(text) {
  deck = [];
  studyIndex = 0;
  const lines = text.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (!line.trim()) return;

  document.getElementById('drill-section').hidden = false;
  updateProgress();
}

function importFile(file) {
  const reader = new FileReader();
  reader.onload = e => parseCSV(e.target.result);
  reader.readAsText(file);
}

function fetchCSV(url) {
  fetch(url).then(r => r.text()).then(parseCSV);
}

function celebrate() {
  confetti();
  const messages = ['Nice job!', "You're getting there!"];
  const msg = messages[Math.floor(Math.random() * messages.length)];
  const msgEl = document.getElementById('message');
  msgEl.textContent = msg;
  msgEl.hidden = false;
  setTimeout(() => {
    msgEl.hidden = true;
  }, 3000);
}

function startStudy() {
  if (!deck.length) return;

  const reps = parseInt(document.getElementById('repetitions').value, 10);
  const batch = parseInt(document.getElementById('batchSize').value, 10);
  const subset = deck.slice(studyIndex, studyIndex + batch);
  if (!subset.length) return;
  let idx = 0;
  function next() {
    if (idx >= subset.length) {
      studyIndex += subset.length;
      updateProgress();
      celebrate();
      return;
    }
    const item = subset[idx];
    document.getElementById('word').textContent = item.word;
    document.getElementById('sentence').textContent = item.text;
    document.getElementById('translation').textContent = item.translation;
    speak(item.text, reps, () => {
      idx++;
      next();
    });
  }
  next();
}

// Event listeners
const fileInput = document.getElementById('csvFile');
fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) importFile(file);
});

document.getElementById('fetchCsv').addEventListener('click', () => {
  const url = document.getElementById('csvUrl').value;
  if (url) fetchCSV(url);
});

document.getElementById('voiceSelect').addEventListener('change', e => {
  const voices = speechSynthesis.getVoices();
  settings.voice = voices[e.target.value] ? voices[e.target.value].name : null;
  saveSettings();
});

document.getElementById('repetitions').addEventListener('change', e => {
  settings.repetitions = parseInt(e.target.value, 10);
  saveSettings();
});

document.getElementById('rate').addEventListener('change', e => {
  settings.rate = parseFloat(e.target.value);
  saveSettings();
});

document.getElementById('batchSize').addEventListener('change', e => {
  settings.batchSize = parseInt(e.target.value, 10);
  saveSettings();
});

document.getElementById('studyBtn').addEventListener('click', startStudy);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}

window.addEventListener('load', () => {
  loadSettings();
  populateVoices();
});
