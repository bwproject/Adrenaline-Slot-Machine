const ICONS = [
    '1','2','3','4','5','6','7','8','9','10','11','12','13'
];

const BASE_SPINNING_DURATION = 2.7;
const COLUMN_SPINNING_DURATION = 0.3;

var cols;

// AUDIO
const spinSounds = [
    new Audio('./assets/spin.mp3'),
    new Audio('./assets/spin2.mp3')
];

let soundUnlocked = false;
let soundMode = "random";

let coins = 100;

let bet = 10;
const MIN_SPIN = 10;

// INTRO SOUND
const introSound = new Audio('./assets/0.mp3');
let introPlayed = false;

function setSound(mode) {
    soundMode = mode;
}

function updateCoinsUI() {
    const el = document.getElementById("coins");
    if (el) el.textContent = coins;
}

function updateBetUI() {
    const el = document.getElementById("betValue");
    if (el) el.textContent = bet;
}

function changeBet(amount) {
    bet += amount;

    if (bet < MIN_SPIN) bet = MIN_SPIN;
    if (bet > coins) bet = coins;

    updateBetUI();
}

const stats = {
    totalSpins: 0,
    wins: 0,
    losses: 0,
    payout: 0,
    symbols: {
        1:0,2:0,3:0,4:0,5:0,6:0,7:0,
        8:0,9:0,10:0,11:0,12:0,13:0
    }
};

function playSpinSound() {
    let sound;

    if (soundMode === "sound1") sound = spinSounds[0];
    else if (soundMode === "sound2") sound = spinSounds[1];
    else sound = spinSounds[Math.floor(Math.random() * spinSounds.length)];

    sound.volume = 0.4;
    sound.loop = true;

    if (!soundUnlocked) {
        sound.play().then(() => {
            sound.pause();
            sound.currentTime = 0;
            soundUnlocked = true;
        }).catch(() => {});
        return;
    }

    sound.currentTime = 0;
    sound.play().catch(() => {});
}

function stopSpinSound() {
    for (let s of spinSounds) {
        s.pause();
        s.currentTime = 0;
    }
}

window.addEventListener('DOMContentLoaded', function() {
    cols = document.querySelectorAll('.col');
    setInitialItems();
    updateStats();
    updateCoinsUI();
    updateBetUI();

    // INTRO SOUND (play once)
    if (!introPlayed) {
        introSound.volume = 0.5;
        introSound.play().catch(() => {});
        introPlayed = true;
    }
});

function setInitialItems() {
    let baseItemAmount = 40;

    for (let i = 0; i < cols.length; i++) {
        let col = cols[i];
        let amountOfItems = baseItemAmount + (i * 3);
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
    if (coins < bet) {
        showResult(-999);
        return;
    }

    coins -= bet;
    updateCoinsUI();

    playSpinSound();

    elem.style.display = "none";

    let app = document.getElementById('app');
    if (app) app.classList.add('spinning');

    let duration = BASE_SPINNING_DURATION + randomDuration();

    for (let col of cols) {
        duration += COLUMN_SPINNING_DURATION + randomDuration();
        col.style.animationDuration = duration + "s";
    }

    window.setTimeout(setResult, BASE_SPINNING_DURATION * 1000 / 2);

    window.setTimeout(function () {
        stopSpinSound();

        if (app) app.classList.remove('spinning');
        elem.style.display = "inline-block";

        stats.totalSpins++;

        let row = getMiddleRow();
        let result = calculateResult(row);

        const multiplier = result.multiplier;

        coins += Math.floor(bet * multiplier);
        updateCoinsUI();

        stats.payout += multiplier;

        if (multiplier > 0) stats.wins++;
        else stats.losses++;

        const appEl = document.getElementById('app');
        if (appEl) {
            appEl.classList.remove('win','lose','jackpot','neutral');

            if (multiplier < 0) appEl.classList.add('lose');
            else if (multiplier === 0) appEl.classList.add('neutral');
            else if (multiplier === 0.5) appEl.classList.add('win');
            else if (multiplier === 2) appEl.classList.add('jackpot');

            setTimeout(() => {
                appEl.classList.remove('win','lose','jackpot','neutral');
            }, 1200);
        }

        showResult(multiplier);
        updateStats();

    }.bind(elem), duration * 1000);
}

function setResult() {
    for (let col of cols) {
        let results = [getRandomIcon(), getRandomIcon(), getRandomIcon()];
        let icons = col.querySelectorAll('.icon img');

        for (let x = 0; x < 3; x++) {
            icons[x].src = 'items/' + results[x] + '.png';
            icons[(icons.length - 3) + x].src = 'items/' + results[x] + '.png';
        }
    }
}

function getMiddleRow() {
    let row = [];

    for (let col of cols) {
        let icons = col.querySelectorAll('.icon img');
        let middle = icons[icons.length - 2].getAttribute('src');
        let symbol = middle.split('/').pop().replace('.png', '');

        row.push(symbol);
        stats.symbols[symbol]++;
    }

    return row;
}

function calculateResult(row) {
    let map = {};

    for (let s of row) {
        map[s] = (map[s] || 0) + 1;
    }

    let max = Math.max(...Object.values(map));

    if (max < 3) return { multiplier: -1, max };
    if (max === 3) return { multiplier: 0, max };
    if (max === 4) return { multiplier: 0.5, max };
    return { multiplier: 2, max };
}

function showResult(multiplier) {
    const el = document.getElementById('resultArea');
    if (!el) return;

    if (multiplier === -999) {
        el.innerHTML = `<div class="result-box lose"><h2>💀 NO COINS</h2><button onclick="resetGame()" class="btn btn-warning">Restart</button></div>`;
        return;
    }

    let text = "";
    let cls = "";

    if (multiplier < 0) { text = "💀 LOSE"; cls = "lose"; }
    else if (multiplier === 0) { text = "😐 BREAK EVEN"; cls = "neutral"; }
    else if (multiplier === 0.5) { text = "🙂 WIN +0.5x"; cls = "win"; }
    else { text = "🔥 JACKPOT x2"; cls = "jackpot"; }

    el.innerHTML = `
        <div class="result-box ${cls}">
            <h2>${text}</h2>
            <div class="result-buttons">
                <button onclick="resetGame()" class="btn btn-warning">Try Again</button>
            </div>
        </div>
    `;
}

function resetGame() {
    const el = document.getElementById('resultArea');
    if (el) el.innerHTML = "";
    const btn = document.querySelector('.start-button');
    if (btn) btn.style.display = "inline-block";
}

function updateStats() {
    const el = document.getElementById('statsContent');
    if (!el) return;

    let symbols = Object.entries(stats.symbols)
        .map(([k,v]) => `${k}: ${v}`)
        .join('<br>');

    el.innerHTML = `
        Spins: ${stats.totalSpins}<br>
        Wins: ${stats.wins}<br>
        Losses: ${stats.losses}<br>
        Payout: ${stats.payout.toFixed(1)}x<br>
        <hr>
        ${symbols}
    `;
}

function getRandomIcon() {
    return ICONS[Math.floor(Math.random() * ICONS.length)];
}

function randomDuration() {
    return Math.floor(Math.random() * 10) / 100;
}
