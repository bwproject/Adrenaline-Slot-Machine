const ICONS = Array.from({ length: 13 }, (_, i) => `items/${i + 1}.jpg`);

const BASE_SPINNING_DURATION = 2.7;
const COLUMN_SPINNING_DURATION = 0.3;

let cols;

let audioCtx;
let speeds = [];
let positions = [];
let running = false;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playTone(freq, time = 0.08, type = "sine") {
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = 0.05;

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + time);
}

function soundSpin() { playTone(120, 0.05); }
function soundStop() { playTone(220, 0.08); }
function soundWin() {
  playTone(520, 0.1);
  setTimeout(() => playTone(660, 0.1), 120);
  setTimeout(() => playTone(880, 0.15), 240);
}

window.addEventListener('DOMContentLoaded', () => {
  cols = document.querySelectorAll('.col');

  speeds = Array(cols.length).fill(0);
  positions = Array(cols.length).fill(0);

  setInitialItems();
});

function setInitialItems() {
  let baseItemAmount = 40;

  for (let i = 0; i < cols.length; ++i) {
    let col = cols[i];
    let amountOfItems = baseItemAmount + (i * 3);

    let elms = '';
    let firstThreeElms = '';

    for (let x = 0; x < amountOfItems; x++) {
      let icon = getRandomIcon();
      let item = `<div class="icon" data-item="${icon}"><img src="${icon}" />`;

      elms += item;
      if (x < 3) firstThreeElms += item;
    }

    col.innerHTML = elms + firstThreeElms;
  }
}

function spin(elem) {
  if (running) return;
  running = true;

  initAudio();
  soundSpin();

  elem.disabled = true;
  document.getElementById('container').classList.add('spinning');

  speeds = speeds.map(() => 35 + Math.random() * 25);

  let stopTimes = [1200, 1700, 2200, 2700, 3200];

  stopTimes.forEach((t, i) => setTimeout(() => stopReel(i), t));

  requestAnimationFrame(updateReels);
}

function updateReels() {
  if (!running) return;

  const itemHeight = 100;

  cols.forEach((col, i) => {
    positions[i] += speeds[i];

    if (positions[i] > itemHeight * 3) positions[i] = 0;

    col.style.transform = `translateY(${positions[i]}px)`;
  });

  requestAnimationFrame(updateReels);
}

function stopReel(i) {
  speeds[i] *= 0.2;

  setTimeout(() => {
    speeds[i] = 0;
    soundStop();

    if (speeds.every(s => s === 0)) {
      finishSpin();
    }
  }, 350);
}

function finishSpin() {
  running = false;

  document.getElementById('container').classList.remove('spinning');

  setResult();

  let win = checkWin();
  if (win) soundWin();

  const btn = document.querySelector('.start-button');
  if (btn) btn.disabled = false;
}

function setResult() {
  for (let col of cols) {
    let results = [
      getRandomIcon(),
      getRandomIcon(),
      getRandomIcon()
    ];

    let icons = col.querySelectorAll('.icon img');

    for (let x = 0; x < 3; x++) {
      if (icons[x]) icons[x].src = results[x];
      if (icons[(icons.length - 3) + x]) icons[(icons.length - 3) + x].src = results[x];
    }
  }
}

function checkWin() {
  let grid = [];

  document.querySelectorAll('.col').forEach(col => {
    let imgs = col.querySelectorAll('.icon img');
    grid.push([
      imgs[0].src,
      imgs[1].src,
      imgs[2].src
    ]);
  });

  for (let row = 0; row < 3; row++) {
    let first = grid[0][row];
    if (grid.every(col => col[row] === first)) return true;
  }

  return false;
}

function getRandomIcon() {
  return ICONS[Math.floor(Math.random() * ICONS.length)];
}

function randomDuration() {
  return Math.floor(Math.random() * 10) / 100;
}