console.log('DEV BUILD: changed at 22:15');
document.title = 'Glossika Dev – ' + new Date().toLocaleTimeString();


const settingsKey = 'sdSettings';
const studyIndexKey = 'sdStudyIndex';
let deck = [];
let settings = { voice: null, rate: 1, repetitions: 1 };
let studyIndex = 0;
let isPlaying = false;
let isPaused = false;
let currentResolve = null;
let currentRejected = false;

function saveStudyIndex() {
  localStorage.setItem(studyIndexKey, studyIndex);
}

function loadStudyIndex() {
  const idx = parseInt(localStorage.getItem(studyIndexKey), 10);
  studyIndex = isNaN(idx) ? 0 : idx;
}


function saveSettings() {
  localStorage.setItem(settingsKey, JSON.stringify(settings));
}

function loadSettings() {
  const set = localStorage.getItem(settingsKey);
  if (set) settings = { ...settings, ...JSON.parse(set) };
  document.getElementById('repetitions').value = settings.repetitions;
  document.getElementById('rate').value = settings.rate;
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
  loadStudyIndex();
  const lines = text.split(/\r?\n/);
  lines.forEach(line => {
    if (!line.trim()) return;
    const parts = line.split(',');
    if (parts.length >= 3) {
      const [word, sentence, translation] = parts;
      deck.push({ word, text: sentence, translation });
    }
  });
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
  const subset = deck.slice(studyIndex, studyIndex + 5);
  if (!subset.length) return;
  let idx = 0;
  function next() {
    if (idx >= subset.length) {
      studyIndex += subset.length;
      saveStudyIndex();
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

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function speakAsync(text, lang) {
  return new Promise((resolve, reject) => {
    const utter = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === lang) || null;
    utter.voice = voice;
    utter.rate = parseFloat(document.getElementById('rate').value);
    utter.onend = () => resolve();
    utter.onerror = (e) => {
      console.error('SpeechSynthesisUtterance error', e);
      reject(e);
    };
    speechSynthesis.speak(utter);
  });
}

async function playStudy() {
  if (!deck.length) return;
  if (isPlaying) return;
  isPlaying = true;
  isPaused = false;
  document.getElementById('playAll').disabled = true;
  document.getElementById('pauseBtn').disabled = false;
  document.getElementById('skipBtn').disabled = false;
  // enable Stop button when playing
  const stopBtn = document.getElementById('stopBtn');
  if (stopBtn) stopBtn.disabled = false;

  const reps = parseInt(document.getElementById('repetitions').value, 10) || 1;
  const rounds = reps;
  const sourceLang = document.getElementById('sourceLang').value || settings.sourceLang;
  const targetLang = document.getElementById('targetLang').value || settings.targetLang;

  try {
    for (let r = 0; r < rounds; r++) {
      const sequence = shuffleArray(deck);
      for (let i = 0; i < sequence.length; i++) {
        if (!isPlaying) break;
        // wait while paused
        while (isPaused) {
          await new Promise(res => setTimeout(res, 200));
        }

        const item = sequence[i];
        document.getElementById('word').textContent = '';
        document.getElementById('sentence').textContent = item.chinese;
        document.getElementById('translation').textContent = item.english;
        updateProgress();

        try {
          await speakAsync(item.chinese, sourceLang);
        } catch (e) { console.warn('tts error', e); }

        // small pause between source and target
        await new Promise(res => setTimeout(res, 300));
        try {
          await speakAsync(item.english, targetLang);
        } catch (e) { console.warn('tts error', e); }

        // pause between sentences
        await new Promise(res => setTimeout(res, 400));
      }
      // after each round increment studyIndex by full deck length (or clamp)
      studyIndex = Math.min(deck.length, studyIndex + deck.length);
      saveStudyIndex();
      updateProgress();
    }
    celebrate();
  } finally {
    isPlaying = false;
    isPaused = false;
    document.getElementById('playAll').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('skipBtn').disabled = true;
    if (stopBtn) stopBtn.disabled = true;
    currentResolve = null;
    currentRejected = false;
  }
}

function stopNow() {
  // immediately stop playback entirely
  if (!isPlaying && !isPaused) return;
  isPlaying = false;
  isPaused = false;
  try { speechSynthesis.cancel(); } catch (e) {}
  currentResolve = null;
  // reset controls
  document.getElementById('playAll').disabled = false;
  const pauseBtn = document.getElementById('pauseBtn');
  if (pauseBtn) { pauseBtn.disabled = true; pauseBtn.textContent = 'Pause'; }
  document.getElementById('skipBtn').disabled = true;
  const stopBtn = document.getElementById('stopBtn');
  if (stopBtn) stopBtn.disabled = true;
}

// Event listeners
const fileInput = document.getElementById('csvFile');
fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) importFile(file);
});

const fetchBtn = document.getElementById('fetchCsv');
if (fetchBtn) {
  fetchBtn.addEventListener('click', () => {
    const urlInput = document.getElementById('csvUrl');
    if (urlInput && urlInput.value) fetchCSV(urlInput.value);
  });
}

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

document.getElementById('studyBtn').addEventListener('click', startStudy);

// hook Stop button (may be absent if HTML not updated)
const stopButtonElement = document.getElementById('stopBtn');
if (stopButtonElement) stopButtonElement.addEventListener('click', stopNow);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}

window.addEventListener('load', () => {
  loadSettings();
  populateVoices();
  loadStudyIndex();
});
