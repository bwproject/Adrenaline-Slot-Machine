// ========================
// 🎰 GAME CONFIG (EDIT HERE)
// ========================

const CONFIG = {
    startCoins: 1000,
    minBet: 50,

    multipliers: {
        5: 2.0,
        4: 0.5,
        3: 0,
        2: -0.5,
        1: -2.0,
        0: -2.0
    },

    texts: {
        noCoinsTitle: "💀 NO COINS",
        lose: "💀 LOSE",
        neutral: "😐 BREAK EVEN",
        win: "🙂 WIN +0.5x",
        jackpot: "🔥 JACKPOT x2",
        restart: "Restart",
        tryAgain: "Try Again"
    }
};

// ========================

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

// ========================

let coins = CONFIG.startCoins;
let bet = CONFIG.minBet;

// INTRO SOUND
const introSound = new Audio('./assets/0.mp3');
let introPlayed = false;

// ========================
// UI
// ========================

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

    if (bet < CONFIG.minBet) bet = CONFIG.minBet;
    if (bet > coins) bet = coins;

    updateBetUI();
}

// ========================
// STATS
// ========================

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

// ========================
// SOUND
// ========================

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

// ========================
// INIT
// ========================

window.addEventListener('DOMContentLoaded', function() {
    cols = document.querySelectorAll('.col');
    setInitialItems();
    updateStats();
    updateCoinsUI();
    updateBetUI();

    if (!introPlayed) {
        introSound.volume = 0.5;
        introSound.play().catch(() => {});
        introPlayed = true;
    }
});

// ========================
// SLOT SETUP
// ========================

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

// ========================
// SPIN
// ========================

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

// ========================
// RESULT GENERATION
// ========================

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

// ========================
// NEW RESULT LOGIC
// ========================

function calculateResult(row) {
    let map = {};

    for (let s of row) {
        map[s] = (map[s] || 0) + 1;
    }

    const max = Math.max(...Object.values(map));

    const multiplier = CONFIG.multipliers[max] ?? -2.0;

    return { multiplier, max };
}

// ========================
// ROW CHECK
// ========================

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

// ========================
// UI RESULT
// ========================

function showResult(multiplier) {
    const el = document.getElementById('resultArea');
    if (!el) return;

    if (multiplier === -999) {
        el.innerHTML = `
        <div class="result-box lose">
            <h2>${CONFIG.texts.noCoinsTitle}</h2>
            <button onclick="resetGame()" class="btn btn-warning">
                ${CONFIG.texts.restart}
            </button>
        </div>`;
        return;
    }

    let text = "";
    let cls = "";

    if (multiplier < 0) {
        text = CONFIG.texts.lose;
        cls = "lose";
    }
    else if (multiplier === 0) {
        text = CONFIG.texts.neutral;
        cls = "neutral";
    }
    else if (multiplier === 0.5) {
        text = CONFIG.texts.win;
        cls = "win";
    }
    else {
        text = CONFIG.texts.jackpot;
        cls = "jackpot";
    }

    el.innerHTML = `
        <div class="result-box ${cls}">
            <h2>${text}</h2>
            <button onclick="resetGame()" class="btn btn-warning">
                ${CONFIG.texts.tryAgain}
            </button>
        </div>
    `;
}

// ========================
// RESET
// ========================

function resetGame() {
    const el = document.getElementById('resultArea');
    if (el) el.innerHTML = "";
    const btn = document.querySelector('.start-button');
    if (btn) btn.style.display = "inline-block";
}

// ========================
// STATS UI
// ========================

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

// ========================
// HELPERS
// ========================

function getRandomIcon() {
    return ICONS[Math.floor(Math.random() * ICONS.length)];
}

function randomDuration() {
    return Math.floor(Math.random() * 10) / 100;
}