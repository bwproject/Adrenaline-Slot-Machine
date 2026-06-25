// ===================== CONFIG =====================

// ICONS
const ICONS = [
    '1','2','3','4','5','6','7','8','9','10','11','12','13'
];

// GAME BALANCE
const BASE_SPINNING_DURATION = 2.7;
const COLUMN_SPINNING_DURATION = 0.3;

const START_COINS = 100;
const START_BET = 10;
const MIN_BET = 10;

// RESULT MULTIPLIERS
const RESULT = {
    LOSE: -1,
    NO_COINS: -999,
    DRAW: 0,
    WIN: 0.5,
    JACKPOT: 2
};

// TEXTS
const TEXT = {
    NO_COINS_TITLE: "💀 NO COINS",
    LOSE: "💀 LOSE",
    DRAW: "😐 BREAK EVEN",
    WIN: "🙂 WIN +0.5x",
    JACKPOT: "🔥 JACKPOT x2",
    TRY_AGAIN: "Try Again",
    RESTART: "Restart"
};

// AUDIO
const AUDIO = {
    SPIN: [
        new Audio('./assets/spin.mp3'),
        new Audio('./assets/spin2.mp3')
    ],
    INTRO: new Audio('./assets/0.mp3'),
    SPIN_VOLUME: 0.4,
    INTRO_VOLUME: 0.5
};

// ==================================================

var cols;

// STATE
let soundUnlocked = false;
let soundMode = "random";

let coins = START_COINS;
let bet = START_BET;

// INTRO
let introPlayed = false;

// ---------------- AUDIO ----------------

function playSpinSound() {
    let sound;

    if (soundMode === "sound1") sound = AUDIO.SPIN[0];
    else if (soundMode === "sound2") sound = AUDIO.SPIN[1];
    else sound = AUDIO.SPIN[Math.floor(Math.random() * AUDIO.SPIN.length)];

    sound.volume = AUDIO.SPIN_VOLUME;
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
    for (let s of AUDIO.SPIN) {
        s.pause();
        s.currentTime = 0;
    }
}

// ---------------- UI ----------------

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

    if (bet < MIN_BET) bet = MIN_BET;
    if (bet > coins) bet = coins;

    updateBetUI();
}

// ---------------- STATS ----------------

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

// ---------------- INIT ----------------

window.addEventListener('DOMContentLoaded', function() {
    cols = document.querySelectorAll('.col');
    setInitialItems();
    updateStats();
    updateCoinsUI();
    updateBetUI();

    if (!introPlayed) {
        AUDIO.INTRO.volume = AUDIO.INTRO_VOLUME;
        AUDIO.INTRO.play().catch(() => {});
        introPlayed = true;
    }
});

// ---------------- SLOT SETUP ----------------

function setInitialItems() {
    let baseItemAmount = 40;

    for (let i = 0; i < cols.length; i++) {
        let col = cols[i];
        let amountOfItems = baseItemAmount + (i * 3);
        let elms = '';
        let firstThreeElms = '';

        for (let x = 0; x < amountOfItems; x++) {
            let icon = getRandomIcon();
            let item = `<div class="icon" data-item="${icon}"><img src="items/${icon}.png"></div>`;
            elms += item;
            if (x < 3) firstThreeElms += item;
        }

        col.innerHTML = elms + firstThreeElms;
    }
}

// ---------------- SPIN ----------------

function spin(elem) {
    if (coins < bet) {
        showResult(RESULT.NO_COINS);
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

// ---------------- RESULT LOGIC ----------------

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

    if (max < 3) return { multiplier: RESULT.LOSE, max };
    if (max === 3) return { multiplier: RESULT.DRAW, max };
    if (max === 4) return { multiplier: RESULT.WIN, max };
    return { multiplier: RESULT.JACKPOT, max };
}

// ---------------- UI RESULT ----------------

function showResult(multiplier) {
    const el = document.getElementById('resultArea');
    if (!el) return;

    if (multiplier === RESULT.NO_COINS) {
        el.innerHTML = `
            <div class="result-box lose">
                <h2>${TEXT.NO_COINS_TITLE}</h2>
                <button onclick="resetGame()" class="btn btn-warning">${TEXT.RESTART}</button>
            </div>
        `;
        return;
    }

    let text = "";
    let cls = "";

    if (multiplier < 0) { text = TEXT.LOSE; cls = "lose"; }
    else if (multiplier === 0) { text = TEXT.DRAW; cls = "neutral"; }
    else if (multiplier === 0.5) { text = TEXT.WIN; cls = "win"; }
    else { text = TEXT.JACKPOT; cls = "jackpot"; }

    el.innerHTML = `
        <div class="result-box ${cls}">
            <h2>${text}</h2>
            <div class="result-buttons">
                <button onclick="resetGame()" class="btn btn-warning">${TEXT.TRY_AGAIN}</button>
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

// ---------------- STATS ----------------

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

// ---------------- UTILS ----------------

function getRandomIcon() {
    return ICONS[Math.floor(Math.random() * ICONS.length)];
}

function randomDuration() {
    return Math.floor(Math.random() * 10) / 100;
}