// Get DOM elements
const plane = document.getElementById("plane");
const countdownContainer = document.getElementById("countdown-container");
const countdownCircle = document.getElementById("countdown-circle");
const countdownNumber = document.getElementById("countdown-number");
const betInput = document.getElementById("betAmount");
const betOptionsGrid = document.querySelector(".bet-options-grid");
const startBtn = document.getElementById("startBtn");
const cashoutBtn = document.getElementById("cashoutBtn");
const playersEl = document.getElementById("players");
const flySound = document.getElementById("flySound");
const explosionSound = document.getElementById("explosionSound");
const autoBetAmountInput = document.getElementById("autoBetAmount");
const autoCashoutMultiplierInput = document.getElementById("autoCashoutMultiplier");
const betTypeSelectorBtns = document.querySelectorAll(".bet-type-btn");
const betSection = document.querySelector(".bet-section");
const autoBetCashoutOptions = document.querySelector(".auto-bet-cashout-options");
const totalBetsEl = document.getElementById("totalBets");
const totalStakesEl = document.getElementById("totalStakes");
const totalWinningsEl = document.getElementById("totalWinnings");
const walletBalanceEl = document.getElementById("walletBalance");
const betBtns = document.querySelectorAll(".bet-options-grid button[data-val]");
const clearBtn = document.querySelector(".clear-bet");

// Game variables
let wallet = 5000;
let bet = 3;
let multiplier = 1;
let crashed = false;
let playing = false;
let placed = false;
let posX = 0;
let posY = 0;
let cycleActive = false;
let cnt = 1;
let ci, gi, pi;
let autoBetMode = false;
let autoCashoutMode = false;
let currentBetMode = 'manual';
let totalBets = 0;
let totalWinnings = 0;

// Fake players data
const names = ["amir**", "yass**", "samir*", "hkhl**", "noura*"];

function randomPlayers() {
    playersEl.innerHTML = "";
    for (let i = 0; i < 5; i++) {
        let name = names[Math.floor(Math.random() * names.length)];
        let mlt = (Math.random() * 5 + 1).toFixed(2);
        let stake = [5, 10, 20, 100][Math.floor(Math.random() * 4)];
        let win = Math.random() < 0.5 ? 0 : (mlt * stake).toFixed(2);
        const div = document.createElement("div");
        div.className = "player " + (win > 0 ? "win" : "lose");
        div.innerHTML = `
            <span>${name}</span>
            <span>${mlt}x</span>
            <span>${stake} MAD</span>
            <span>${win > 0 ? "+" : ""}${win} MAD</span>
        `;
        playersEl.appendChild(div);
    }
}

// Update wallet and stats display
function updateStats() {
    walletBalanceEl.textContent = wallet.toFixed(2) + " MAD";
    totalStakesEl.textContent = totalStakesEl.textContent; // Keep original total stakes
    totalWinningsEl.textContent = totalWinnings.toFixed(2) + " MAD";
    totalBetsEl.textContent = totalBets.toString();
}

// Reset game state
function reset() {
    clearInterval(gi);
    clearInterval(ci);
    crashed = playing = placed = false;
    multiplier = 1;
    posX = 0;
    posY = 0;
    
    // Reset plane position
    plane.style.transform = "translate(0px, 0px)"; // Set initial position to 0,0
    plane.style.display = "block";
    
    // Reset multiplier display
    countdownNumber.textContent = "1.00x"; // Display multiplier in countdown element
    countdownContainer.style.display = 'none'; // Hide countdown container initially
    
    // Reset buttons
    startBtn.disabled = false;
    cashoutBtn.disabled = true;
    
    // Reset countdown
    cnt = 1;
    cycleActive = false;
}

function startCycle() {
    if (cycleActive) return;
    reset();
    cycleActive = true;
    
    countdownContainer.style.display = 'flex'; // Show countdown container for countdown
    countdownNumber.textContent = cnt;
    countdownCircle.style.background = 'conic-gradient(#ff8c00 0%, transparent 0%)'; // Reset circle fill

    ci = setInterval(() => {
        countdownNumber.textContent = cnt;
        const percentage = (cnt / 5) * 100; // Calculate fill percentage
        countdownCircle.style.background = `conic-gradient(#ff8c00 ${percentage}%, transparent ${percentage}%)`;

        if (cnt < 5) {
            cnt++;
        } else {
            clearInterval(ci);
            // countdownContainer.style.display = 'none'; // No need to hide, will show multiplier
            setTimeout(startFly, 500);
        }
    }, 1000);
}

function startFly() {
    playSound(flySound);
    
    // Deduct bet if placed
    if (placed && wallet >= bet) {
        wallet -= bet;
        totalBets++;
        updateStats();
    }
    
    playing = true;
    startBtn.disabled = true;
    cashoutBtn.disabled = false;
    
    gi = setInterval(() => {
        multiplier += 0.01;
        countdownNumber.textContent = multiplier.toFixed(2) + "x"; // Display multiplier
        countdownCircle.style.background = 'conic-gradient(#ff8c00 100%, transparent 0%)'; // Keep circle full during flight

        // Move plane
        posX += 3;
        posY += 2;
        
        // Get game area dimensions to prevent plane from going off-screen
        const gameAreaRect = document.getElementById("game-area").getBoundingClientRect();
        const planeWidth = plane.offsetWidth;
        const planeHeight = plane.offsetHeight;

        // Calculate new position, ensuring it stays within bounds
        let newPlaneX = Math.min(posX, gameAreaRect.width - planeWidth); // Adjust for plane's full width
        let newPlaneY = Math.min(posY, gameAreaRect.height - planeHeight); // Adjust for plane's full height

        plane.style.transform = `translate(${newPlaneX}px, -${newPlaneY}px)`;
        
        // Check for crash
        if (Math.random() < 0.01 * multiplier || newPlaneX >= gameAreaRect.width - planeWidth) { // Crash if reaches edge
            crash();
        }
        
        // Auto cashout if enabled
        if (currentBetMode === 'auto' && autoCashoutMode && 
            multiplier >= parseFloat(autoCashoutMultiplierInput.value)) {
            cashOut();
        }
    }, 50);
}

function crash() {
    crashed = true;
    playing = false;
    cycleActive = false;
    clearInterval(gi);
    
    playSound(explosionSound);
    countdownNumber.textContent = "💥 " + multiplier.toFixed(2) + "x"; // Display crash message
    plane.style.display = "none";
    
    if (placed) {
        placed = false; // Lose stake (already deducted)
    }
    
    startBtn.disabled = false;
    cashoutBtn.disabled = true;
    
    setTimeout(() => {
        randomPlayers();
        startCycle();
    }, 2000);
}

function place() {
    if (!playing && !placed) {
        bet = currentBetMode === 'auto' ? 
            parseInt(autoBetAmountInput.value) || 1 : 
            parseInt(betInput.value) || 1;
            
        if (bet > wallet) {
            alert("رصيد غير كافي");
            return;
        }
        placed = true;
        startBtn.textContent = "PARI PLACÉ";
    }
}

function cashOut() {
    if (playing && placed && !crashed) {
        placed = false;
        playing = false;
        clearInterval(gi);
        
        let win = bet * multiplier;
        wallet += win;
        totalWinnings += win;
        updateStats();
        
        countdownNumber.textContent = "✅ " + multiplier.toFixed(2) + "x"; // Display cashout message
        startBtn.textContent = "PLACER UN PARI";
        startBtn.disabled = false;
        cashoutBtn.disabled = true;
        
        setTimeout(() => {
            randomPlayers();
            startCycle();
        }, 2000);
    }
}

// Event Listeners
startBtn.addEventListener("click", place);
cashoutBtn.addEventListener("click", cashOut);

betOptionsGrid.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON" && e.target.dataset.val) {
        betInput.value = e.target.dataset.val;
    }
});

clearBtn.addEventListener("click", () => {
    betInput.value = "";
});

betTypeSelectorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        betTypeSelectorBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (btn.textContent.includes('AUTO')) {
            currentBetMode = 'auto';
            autoBetCashoutOptions.style.display = 'flex';
            autoBetMode = true;
            autoCashoutMode = true;
        } else {
            currentBetMode = 'manual';
            autoBetCashoutOptions.style.display = 'none';
            autoBetMode = false;
            autoCashoutMode = false;
        }
    });
});

// Initial setup
randomPlayers();
updateStats();
startCycle();

