const ICONS = Array.from({ length: 13 }, (_, i) => `items/${i + 1}.jpg`);

const BASE_SPINNING_DURATION = 2.7;
const COLUMN_SPINNING_DURATION = 0.3;

var cols;

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

function getRandomIcon() {
  return ICONS[Math.floor(Math.random() * ICONS.length)];
}

function randomDuration() {
  return Math.floor(Math.random() * 10) / 100;
}