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
        noCoinsTitle: "💀 У ТЕБЯ БОЛЬШЕ НЕТ КОИНОВ. ИДИ ПРОДАЙ ХАТУ МОЖЕТ ОТЫГРАЕШЬСЯ",
        lose: "💀 LOSE",
        neutral: "😐 BREAK EVEN",
        win: "🙂 WIN +0.5x",
        jackpot: "🔥 JACKPOT x2",
        restart: "Restart",
        tryAgain: "НУЖЕН ДОДЕП"
    }
};

const ICONS = [
    '1','2','3','4','5','6','7','8','9','10','11','12','13'
];

const BASE_SPINNING_DURATION = 2.7;
const COLUMN_SPINNING_DURATION = 0.3;

let cols;

let coins = CONFIG.startCoins;
let bet = CONFIG.minBet;

const spinSounds = [
    new Audio('./assets/spin.mp3'),
    new Audio('./assets/spin2.mp3')
];

let soundMode = "random";

window.addEventListener('DOMContentLoaded', () => {
    cols = document.querySelectorAll('.col');
    setInitialItems();
    updateCoinsUI();
    updateBetUI();
});

function updateCoinsUI() {
    document.getElementById("coins").textContent = coins;
}

function updateBetUI() {
    document.getElementById("betValue").textContent = bet;
}

function changeBet(amount) {
    bet += amount;
    if (bet < CONFIG.minBet) bet = CONFIG.minBet;
    if (bet > coins) bet = coins;
    updateBetUI();
}

function spin(btn) {
    if (coins < bet) {
        showResult(-999);
        return;
    }

    coins -= bet;
    updateCoinsUI();

    btn.style.display = "none";
    document.getElementById('app').classList.add('spinning');

    let duration = BASE_SPINNING_DURATION;

    for (let col of cols) {
        duration += COLUMN_SPINNING_DURATION;
        col.style.animationDuration = duration + "s";
    }

    setTimeout(setResult, 1200);

    setTimeout(() => {
        const row = getMiddleRow();
        const result = calculateResult(row);

        coins += Math.floor(bet * result.multiplier);
        updateCoinsUI();

        showResult(result.multiplier);

        document.getElementById('app').classList.remove('spinning');
        btn.style.display = "inline-block";
    }, duration * 1000);
}

function setInitialItems() {
    const ROWS = 5;

    for (let col of cols) {
        let html = "";
        let buffer = "";

        for (let i = 0; i < 60; i++) {
            const icon = getRandomIcon();
            const item = `<div class="icon"><img src="items/${icon}.png"></div>`;
            html += item;
            if (i < ROWS) buffer += item;
        }

        col.innerHTML = html + buffer;
    }
}

function setResult() {
    const ROWS = 5;

    for (let col of cols) {
        const results = Array.from({length: ROWS}, getRandomIcon);
        const imgs = col.querySelectorAll('.icon img');

        for (let i = 0; i < ROWS; i++) {
            imgs[i].src = `items/${results[i]}.png`;
            imgs[imgs.length - ROWS + i].src = `items/${results[i]}.png`;
        }
    }
}

function getMiddleRow() {
    let row = [];
    const ROWS = 5;

    for (let col of cols) {
        const imgs = col.querySelectorAll('.icon img');
        const mid = imgs[(imgs.length - ROWS) / 2 + 2];
        const symbol = mid.src.split('/').pop().replace('.png','');
        row.push(symbol);
    }

    return row;
}

function calculateResult(row) {
    const map = {};
    for (let s of row) map[s] = (map[s] || 0) + 1;

    const max = Math.max(...Object.values(map));
    return {
        multiplier: CONFIG.multipliers[max] ?? -2,
        max
    };
}

function getRandomIcon() {
    return ICONS[Math.floor(Math.random() * ICONS.length)];
}

function showResult(mult) {
    const el = document.getElementById("resultArea");

    let text = mult < 0 ? CONFIG.texts.lose :
               mult === 0 ? CONFIG.texts.neutral :
               mult === 0.5 ? CONFIG.texts.win :
               CONFIG.texts.jackpot;

    el.innerHTML = `<div class="result-box"><h2>${text}</h2></div>`;
}