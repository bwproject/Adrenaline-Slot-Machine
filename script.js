const ICONS = [
    '1','2','3','4','5','6','7','8','9','10','11','12','13'
];

const BASE_SPINNING_DURATION = 2.7;
const COLUMN_SPINNING_DURATION = 0.35;

let cols;

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

const introSound = new Audio('./assets/0.mp3');
let introPlayed = false;

// PRE-GENERATED RESULT
let pendingRow = null;

const params = new URLSearchParams(window.location.search);
const GAME_MODE = params.get('mode') || 'normal';

function getRandomIcon() {
    return ICONS[Math.floor(Math.random() * ICONS.length)];
}

function randomDuration() {
    return Math.floor(Math.random() * 12) / 100;
}

// More natural easing per reel stop (casino inertia feel)
function getReelDelay(i) {
    const base = BASE_SPINNING_DURATION;
    const stagger = i * COLUMN_SPINNING_DURATION;

    // add inertia randomness + slight slowdown curve
    const inertia = Math.pow(i + 1, 1.15) * 0.08;
    const jitter = (Math.random() * 0.15);

    return (base + stagger + inertia + jitter) * 1000;
}

function generateRowByMode() {
    const count = cols.length;

    if (GAME_MODE === 'hard') {
        const type = Math.random();
        if (type < 0.6) {
            return Array.from({length: count}, () => getRandomIcon());
        } else {
            const symbol = getRandomIcon();
            const row = Array.from({length: count}, () => getRandomIcon());
            for (let i = 0; i < 2; i++) row[i] = symbol;
            return row;
        }
    }

    if (GAME_MODE === 'stream') {
        const symbol = getRandomIcon();
        const matchCount = 3 + Math.floor(Math.random() * 3);
        const row = Array.from({length: count}, () => symbol);
        for (let i = matchCount; i < count; i++) row[i] = getRandomIcon();
        return row;
    }

    if (Math.random() < 0.5) {
        const symbol = getRandomIcon();
        return Array.from({length: count}, () => symbol);
    }

    return Array.from({length: count}, () => getRandomIcon());
}

function prepareNextSpin() {
    pendingRow = generateRowByMode();
}

function calculateResult(row) {
    let map = {};
    for (let s of row) map[s] = (map[s] || 0) + 1;
    let max = Math.max(...Object.values(map));

    if (max < 3) return { multiplier: -1, max };
    if (max === 3) return { multiplier: 0, max };
    if (max === 4) return { multiplier: 0.5, max };
    return { multiplier: 2, max };
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

function finalizeColumn(colIndex) {
    const col = cols[colIndex];
    const symbol = pendingRow[colIndex];
    const icons = col.querySelectorAll('.icon img');

    for (let i = 0; i < icons.length; i++) {
        icons[i].src = 'items/' + symbol + '.png';
    }

    // small bounce visual effect per reel stop
    col.style.transform = "translateY(0) scale(1.02)";
    setTimeout(() => {
        col.style.transform = "translateY(0) scale(1)";
    }, 120);
}

window.addEventListener('DOMContentLoaded', function() {
    cols = document.querySelectorAll('.col');
    setInitialItems();
    updateCoinsUI();
    updateBetUI();
    prepareNextSpin();

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

    elem.style.display = "none";

    const app = document.getElementById('app');
    if (app) app.classList.add('spinning');

    const row = pendingRow;

    let totalDelay = 0;

    for (let i = 0; i < cols.length; i++) {
        const delay = getReelDelay(i);

        totalDelay = Math.max(totalDelay, delay);

        setTimeout(() => {
            finalizeColumn(i);
        }, delay);
    }

    setTimeout(() => {
        if (app) app.classList.remove('spinning');
        elem.style.display = "inline-block";

        const result = calculateResult(row);

        coins += Math.floor(bet * result.multiplier);
        updateCoinsUI();

        showResult(result.multiplier);

        prepareNextSpin();
    }, totalDelay + 500);
}

function showResult(multiplier) {
    const el = document.getElementById('resultArea');
    if (!el) return;

    let text = "";
    let cls = "";

    if (multiplier === -999) {
        el.innerHTML = `<div class="result-box lose"><h2>💀 NO COINS</h2><button onclick="resetGame()" class="btn btn-warning">Restart</button></div>`;
        return;
    }

    if (multiplier < 0) { text = "💀 LOSE"; cls = "lose"; }
    else if (multiplier === 0) { text = "😐 BREAK EVEN"; cls = "neutral"; }
    else if (multiplier === 0.5) { text = "🙂 WIN +0.5x"; cls = "win"; }
    else { text = "🔥 JACKPOT x2"; cls = "jackpot"; }

    el.innerHTML = `<div class="result-box ${cls}"><h2>${text}</h2><div class="result-buttons"><button onclick="resetGame()" class="btn btn-warning">Try Again</button></div></div>`;
}

function resetGame() {
    const el = document.getElementById('resultArea');
    if (el) el.innerHTML = "";
}
