const deckKey = 'sdDeck';
const statsKey = 'sdStats';
const settingsKey = 'sdSettings';
let deck = [];
let stats = { drilled: 0, unique: 0 };
let settings = { voice: null, rate: 1, repetitions: 1, shadow: false };
let current = null;

function saveState() {
  localStorage.setItem(deckKey, JSON.stringify(deck));
  localStorage.setItem(statsKey, JSON.stringify(stats));
  localStorage.setItem(settingsKey, JSON.stringify(settings));
}

function loadState() {
  const d = localStorage.getItem(deckKey);
  const s = localStorage.getItem(statsKey);
  const set = localStorage.getItem(settingsKey);
  if (d) deck = JSON.parse(d);
  if (s) stats = JSON.parse(s);
  if (set) settings = { ...settings, ...JSON.parse(set) };
  document.getElementById('repetitions').value = settings.repetitions;
  document.getElementById('rate').value = settings.rate;
  document.getElementById('shadowMode').checked = settings.shadow;
  updateProgress();
}

function updateProgress() {
  const progress = document.getElementById('progress');
  progress.textContent = `Progress: ${stats.unique}/${deck.length}`;
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

function speak(text, rep) {
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
        const delay = settings.shadow ? 700 : 0;
        setTimeout(once, delay);
      }
    };
    speechSynthesis.speak(utter);
  }
  once();
}

function nextItem() {
  const now = Date.now();
  const due = deck.filter(item => !item.next || item.next <= now);
  if (!due.length) {
    document.getElementById('sentence').textContent = 'All done for now';
    document.getElementById('translation').textContent = '';
    current = null;
    return;
  }
  // randomize
  const item = due[Math.floor(Math.random() * due.length)];
  current = item;
  document.getElementById('sentence').textContent = item.text;
  document.getElementById('translation').textContent = item.translation || '';
  speak(item.text, settings.repetitions);
}

function schedule(item, again) {
  if (again) {
    item.interval = 1; // minutes
  } else {
    item.interval = item.interval ? item.interval * 2 : 1;
  }
  item.next = Date.now() + item.interval * 60 * 1000;
  if (!item.reps) item.reps = 0;
  if (item.reps === 0) stats.unique++;
  item.reps++;
  stats.drilled++;
  saveState();
  updateProgress();
}

function handleResult(again) {
  if (!current) return;
  schedule(current, again);
  nextItem();
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  lines.forEach((line, idx) => {
    const [text, translation] = line.split(',');
    if (text) deck.push({ id: idx + 1, text: text.trim(), translation: translation ? translation.trim() : '', interval: 0, next: 0, reps: 0 });
  });
  saveState();
  updateProgress();
  document.getElementById('drill-section').hidden = false;
  nextItem();
}

function importFile(file) {
  const reader = new FileReader();
  reader.onload = e => parseCSV(e.target.result);
  reader.readAsText(file);
}

function fetchCSV(url) {
  fetch(url).then(r => r.text()).then(parseCSV);
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

document.getElementById('againBtn').addEventListener('click', () => handleResult(true));
document.getElementById('goodBtn').addEventListener('click', () => handleResult(false));

document.getElementById('voiceSelect').addEventListener('change', e => {
  const voices = speechSynthesis.getVoices();
  settings.voice = voices[e.target.value] ? voices[e.target.value].name : null;
  saveState();
});

document.getElementById('repetitions').addEventListener('change', e => {
  settings.repetitions = parseInt(e.target.value, 10);
  saveState();
});

document.getElementById('rate').addEventListener('change', e => {
  settings.rate = parseFloat(e.target.value);
  saveState();
});

document.getElementById('shadowMode').addEventListener('change', e => {
  settings.shadow = e.target.checked;
  saveState();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}

window.addEventListener('load', () => {
  loadState();
  populateVoices();
  if (deck.length) {
    document.getElementById('drill-section').hidden = false;
    nextItem();
  }
});
