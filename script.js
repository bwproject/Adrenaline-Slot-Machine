const ICONS = Array.from({ length: 13 }, (_, i) => `items/${i + 1}.jpg`);

const BASE_SPINNING_DURATION = 2.7;
const COLUMN_SPINNING_DURATION = 0.3;

var cols;
let audioCtx;

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

function soundSpin() {
  playTone(120, 0.05);
}

function soundStop() {
  playTone(220, 0.08);
}

function soundWin() {
  playTone(520, 0.1);
  setTimeout(() => playTone(660, 0.1), 120);
  setTimeout(() => playTone(880, 0.15), 240);
}

window.addEventListener('DOMContentLoaded', () => {
  cols = document.querySelectorAll('.col');
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
  initAudio();
  soundSpin();

  let duration = BASE_SPINNING_DURATION + randomDuration();

  for (let col of cols) {
    duration += COLUMN_SPINNING_DURATION + randomDuration();
    col.style.animationDuration = duration + 's';
  }

  elem.setAttribute('disabled', true);
  document.getElementById('container').classList.add('spinning');

  window.setTimeout(setResult, (BASE_SPINNING_DURATION * 1000) / 2);

  window.setTimeout(() => {
    document.getElementById('container').classList.remove('spinning');
    elem.removeAttribute('disabled');

    soundStop();

    let win = checkWin();
    if (win) soundWin();

  }, duration * 1000);
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
      icons[x].src = results[x];
      icons[(icons.length - 3) + x].src = results[x];
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
    let win = grid.every(col => col[row] === first);
    if (win) return true;
  }

  return false;
}

function getRandomIcon() {
  return ICONS[Math.floor(Math.random() * ICONS.length)];
}

function randomDuration() {
  return Math.floor(Math.random() * 10) / 100;
}