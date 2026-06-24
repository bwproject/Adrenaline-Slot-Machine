const ICONS = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13',
];

/**
 * @type {number} The minimum spin time in seconds
 */
const BASE_SPINNING_DURATION = 2.7;

/**
 * @type {number} The additional duration to the base duration for each row (in seconds).
 * It makes the typical effect that the first reel ends, then the second, and so on...
 */
const COLUMN_SPINNING_DURATION = 0.3;


var cols;

const spinSound = document.getElementById('spinSound');
let soundUnlocked = false;

function playSpinSound() {
    if (!spinSound) return;

    spinSound.volume = 0.4;
    spinSound.loop = true;

    if (!soundUnlocked) {
        spinSound.play().then(() => {
            spinSound.pause();
            spinSound.currentTime = 0;
            soundUnlocked = true;
        }).catch(() => {});
        return;
    }

    spinSound.currentTime = 0;
    spinSound.play().catch(() => {});
}

function stopSpinSound() {
    if (!spinSound) return;

    spinSound.pause();
    spinSound.currentTime = 0;
}

window.addEventListener('DOMContentLoaded', function(event) {
    cols = document.querySelectorAll('.col');

    setInitialItems();
});

function setInitialItems() {
    let baseItemAmount = 40;

    for (let i = 0; i < cols.length; ++i) {
        let col = cols[i];
        let amountOfItems = baseItemAmount + (i * 3); // Increment the amount for each column
        let elms = '';
        let firstThreeElms = '';

        for (let x = 0; x < amountOfItems; x++) {
            let icon = getRandomIcon();
            let item = '<div class="icon" data-item="' + icon + '"><img src="items/' + icon + '.png"></div>';
            elms += item;

            if (x < 3) firstThreeElms += item;
        }
        col.innerHTML = elms + firstThreeElms;
    }
}

function spin(elem) {
    playSpinSound();

    let duration = BASE_SPINNING_DURATION + randomDuration();

    for (let col of cols) {
        duration += COLUMN_SPINNING_DURATION + randomDuration();
        col.style.animationDuration = duration + "s";
    }

    elem.setAttribute('disabled', true);

    document.getElementById('container').classList.add('spinning');

    window.setTimeout(setResult, BASE_SPINNING_DURATION * 1000 / 2);

    window.setTimeout(function () {
        stopSpinSound();
        document.getElementById('container').classList.remove('spinning');
        elem.removeAttribute('disabled');
    }.bind(elem), duration * 1000);
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
            icons[x].setAttribute('src', 'items/' + results[x] + '.png');
            icons[(icons.length - 3) + x].setAttribute('src', 'items/' + results[x] + '.png');
        }
    }
}

function getRandomIcon() {
    return ICONS[Math.floor(Math.random() * ICONS.length)];
}

function randomDuration() {
    return Math.floor(Math.random() * 10) / 100;
}