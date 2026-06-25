const ICONS = [
    '1','2','3','4','5','6','7','8','9','10','11','12','13'
];

const BASE_SPINNING_DURATION = 2.7;
const COLUMN_SPINNING_DURATION = 0.3;

var cols;

const spinSounds = [
    new Audio('./assets/spin.mp3'),
    new Audio('./assets/spin2.mp3')
];

let soundUnlocked = false;
let soundMode = 'random';

const MIN_SPIN = 10;

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);

    const coinsValue = parseInt(params.get('coins'));
    const betValue = parseInt(params.get('betValue'));

    return {
        coins: !isNaN(coinsValue) && coinsValue > 0 ? coinsValue : 100,
        bet: !isNaN(betValue) && betValue >= MIN_SPIN ? betValue : 10
    };
}

const urlData = getUrlParams();
let coins = urlData.coins;
let bet = Math.min(urlData.bet, coins);

function updateUrl() {
    const url = new URL(window.location);
    url.searchParams.set('coins', coins);
    url.searchParams.set('betValue', bet);
    window.history.replaceState({}, '', url);
}

const introSound = new Audio('./assets/0.mp3');
let introPlayed = false;

function setSound(mode) {
    soundMode = mode;
}

function updateCoinsUI() {
    const el = document.getElementById('coins');
    if (el) el.textContent = coins;
    updateUrl();
}

function updateBetUI() {
    const el = document.getElementById('betValue');
    if (el) el.textContent = bet;
    updateUrl();
}

function changeBet(amount) {
    bet += amount;

    if (bet < MIN_SPIN) bet = MIN_SPIN;
    if (bet > coins) bet = coins;

    updateBetUI();
}
