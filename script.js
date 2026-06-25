const ICONS = [
    '1','2','3','4','5','6','7','8','9','10','11','12','13'
];

// =====================
// CONFIG
// =====================
const BASE_SPINNING_DURATION = 2.7;
const COLUMN_SPINNING_DURATION = 0.3;
const MIN_SPIN = 50;
const DEFAULT_COINS = 1000;
const DEFAULT_BET = 50;

// =====================
// TEXTS
// =====================
const TEXTS = {
    noCoins: "💀 NO COINS",
    restart: "Restart",
    tryAgain: "Try Again"
};

const RESULT_TEXTS = {
    lose: "💀 LOSE",
    draw: "😐 BREAK EVEN",
    win: "🙂 WIN +0.5x",
    jackpot: "🔥 JACKPOT x2"
};

// =====================
// AUDIO
// =====================
const spinSounds = [
    new Audio('./assets/spin.mp3'),
    new Audio('./assets/spin2.mp3')
];

const introSound = new Audio('./assets/0.mp3');

let soundUnlocked = false;
let soundMode = "random";
let introPlayed = false;

var cols;

// =====================
// URL PARAMS
// =====================
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);

    const coinsParam = parseInt(params.get("coins"));
    const betParam = parseInt(params.get("betValue"));

    return {
        coins: (!isNaN(coinsParam) && coinsParam > 0) ? coinsParam : DEFAULT_COINS,
        bet: (!isNaN(betParam) && betParam >= MIN_SPIN) ? betParam : DEFAULT_BET
    };
}

const urlData = getUrlParams();

let coins = urlData.coins;
let bet = Math.min(urlData.bet, coins);

// =====================
// STATS
// =====================
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

// =====================
// URL SYNC
// =====================
function syncUrl() {
    const url = new URL(window.location);
    url.searchParams.set("coins", coins);
    url.searchParams.set("betValue", bet);
    window.history.replaceState({}, "", url);
}

// =====================
// UI
// =====================
function updateCoinsUI() {
    const el = document.getElementById("coins");
    if (el) el.textContent = coins;
    syncUrl();
}

function updateBetUI() {
    const el = document.getElementById("betValue");
    if (el) el.textContent = bet;
    syncUrl();
}

function changeBet(amount) {
    bet += amount;

    if (bet < MIN_SPIN) bet = MIN_SPIN;
    if (bet > coins) bet = coins;

    updateBetUI();
}

// =====================
// INIT
// =====================
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

// =====================
// SLOT CORE
// =====================
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

        showResult(multiplier);
        updateStats();

    }.bind(elem), duration * 1000);
}

// =====================
// RESULT
// =====================
function showResult(multiplier) {
    const el = document.getElementById('resultArea');
    if (!el) return;

    if (multiplier === -999) {
        el.innerHTML = `
            <div class="result-box lose">
                <h2>${TEXTS.noCoins}</h2>
                <button onclick="resetGame()" class="btn btn-warning">${TEXTS.restart}</button>
            </div>`;
        return;
    }

    let text = "";
    let cls = "";

    if (multiplier < 0) { text = RESULT_TEXTS.lose; cls = "lose"; }
    else if (multiplier === 0) { text = RESULT_TEXTS.draw; cls = "neutral"; }
    else if (multiplier === 0.5) { text = RESULT_TEXTS.win; cls = "win"; }
    else { text = RESULT_TEXTS.jackpot; cls = "jackpot"; }

    el.innerHTML = `
        <div class="result-box ${cls}">
            <h2>${text}</h2>
            <div class="result-buttons">
                <button onclick="resetGame()" class="btn btn-warning">${TEXTS.tryAgain}</button>
            </div>
        </div>
    `;
}

// =====================
// LOGIC (original intact)
// =====================
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

// =====================
// HELPERS
// =====================
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

function resetGame() {
    const el = document.getElementById('resultArea');
    if (el) el.innerHTML = "";
    const btn = document.querySelector('.start-button');
    if (btn) btn.style.display = "inline-block";
}