// Get DOM elements
const plane = document.getElementById("plane");
const multF = document.getElementById("multiplierFloat");
const countdownEl = document.getElementById("countdown");
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
const betBtns = document.querySelectorAll(".bet-options-grid button[data-val]");
const clearBtn = document.querySelector(".clear-bet");

// Game variables
let wallet = 5000; // Increased wallet amount
let bet = 3;
let multiplier = 1;
let crashed = false;
let playing = false;
let placed = false;
let posX = 0;
let posY = 0;
let cycleActive = false;
let cnt = 1; // Changed countdown start to 1
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
    totalStakesEl.textContent = wallet.toFixed(2) + " MAD";
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
    plane.style.transform = "translate(0, 0)";
    plane.style.display = "block";
    
    // Reset multiplier display
    multF.textContent = "1.00x";
    multF.style.left = "50%";
    multF.style.top = "50%";
    multF.style.transform = "translate(-50%, -50%)";
    
    // Reset buttons
    startBtn.disabled = false;
    cashoutBtn.disabled = true;
    
    // Reset countdown
    cnt = 1; // Reset countdown to 1
    countdownEl.textContent = cnt; // Display only the number
    cycleActive = false;
}

function startCycle() {
    if (cycleActive) return;
    reset();
    cycleActive = true;
    
    ci = setInterval(() => {
        countdownEl.textContent = cnt; 
        if (cnt < 5) { // Countdown from 1 to 5
            cnt++;
        } else {
            clearInterval(ci);
            countdownEl.textContent = "🚀";
            
            // Auto bet if enabled
            if (currentBetMode === 'auto' && autoBetMode) {
                place();
            }
            
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
        multF.textContent = multiplier.toFixed(2) + "x";
        
        // Move plane and keep it within screen bounds
        posX += 3;
        posY += 2;
        
        // Get game area dimensions to prevent plane from going off-screen
        const gameAreaRect = document.getElementById("game-area").getBoundingClientRect();
        const planeWidth = plane.offsetWidth;
        const planeHeight = plane.offsetHeight;

        // Calculate new position, ensuring it stays within bounds
        let newPlaneX = Math.min(posX, gameAreaRect.width - planeWidth / 2); // Adjust for plane's center
        let newPlaneY = Math.min(posY, gameAreaRect.height - planeHeight / 2); // Adjust for plane's center

        plane.style.transform = `translate(${newPlaneX}px, -${newPlaneY}px)`;
        
        // Attach multiplier to plane
        const planeRect = plane.getBoundingClientRect();
        
        multF.style.left = (planeRect.left - gameAreaRect.left + planeRect.width / 2) + "px";
        multF.style.top = (planeRect.top - gameAreaRect.top - 20) + "px";
        multF.style.transform = "translate(-50%, -100%)";
        
        // Check for crash
        if (Math.random() < 0.01 * multiplier || newPlaneX >= gameAreaRect.width - planeWidth / 2) { // Crash if reaches edge
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
    multF.textContent = "💥 " + multiplier.toFixed(2) + "x";
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
        
        multF.textContent = "✅ " + multiplier.toFixed(2) + "x";
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
