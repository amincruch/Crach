const plane = document.getElementById("plane"),
          multF = document.getElementById("multiplierFloat"),
          walletEl = document.getElementById("wallet-container"),
          countdownEl = document.getElementById("countdown"),
          betInput = document.getElementById("betAmount"),
          betBtns = document.querySelectorAll(".bet-options button"),
          startBtn = document.getElementById("startBtn"),
          cashoutBtn = document.getElementById("cashoutBtn"),
          playersEl = document.getElementById("players"),
          flySound = document.getElementById("flySound"),
          explosionSound = document.getElementById("explosionSound"),
          autoBetAmountInput = document.getElementById("autoBetAmount"),
          autoCashoutMultiplierInput = document.getElementById("autoCashoutMultiplier");

    let wallet = 100, bet=10, multiplier=1, crashed=false,
        playing=false, placed=false, posX=0,posY=0,
        cycleActive=false, cnt=3, ci, gi, pi,
        autoBet = false, autoCashout = false;

    // fake players data
    const names = ["amir**","yass**","samir*","hkhl**","noura*"];
    function randomPlayers(){
      playersEl.innerHTML = "";
      for(let i=0;i<5;i++){
        let name = names[Math.floor(Math.random()*names.length)];
        let mlt = (Math.random()*5).toFixed(2);
        let stake = [5,10,20,1000][Math.floor(Math.random()*4)];
        let win = Math.random()<0.5 ? 0 : (mlt*stake).toFixed(2);
        const div = document.createElement("div");
        div.className="player "+(win>0?"win":"lose");
        div.innerHTML = `<span>${name}</span><span>${win>0?"+":""}${win} MAD</span>`;
        playersEl.appendChild(div);
      }
    }
    // update wallet display
    function updW(){ walletEl.textContent = Math.floor(wallet); }

    // reset
    function reset(){
      clearInterval(gi); clearInterval(ci);
      crashed=playing=placed=false; multiplier=1;
      posX=posY=0;
      plane.style.transform="translate(0,0)"; plane.style.display="block";
      multF.style.transform="translate(10px,10px)"; multF.textContent="1.00x";
      startBtn.disabled=false; cashoutBtn.disabled=true;
      cnt=3; countdownEl.textContent="Next round in "+cnt+"s";
      cycleActive=false;
    }

    function startCycle(){
      if(cycleActive) return;
      reset(); cycleActive=true;
      ci = setInterval(()=>{
        cnt--;
        if(cnt>0){
          countdownEl.textContent="Next round in "+cnt+"s";
        } else {
          clearInterval(ci);
          countdownEl.textContent="🚀";
          if (autoBet) {
            place();
          }
          startFly();
        }
      },1000);
    }

    function startFly(){
      playSound(flySound);
      if(placed && wallet>=bet) wallet-=bet, updW();
      playing=true; startBtn.disabled=true; cashoutBtn.disabled=false;
      gi = setInterval(()=>{
        multiplier+=0.01;
        multF.textContent = multiplier.toFixed(2)+"x";
        posX+=3; posY+=2;
        plane.style.transform = `translate(${posX}px, -${posY}px)`;
        multF.style.transform = `translate(${posX+10}px, ${-posY+10}px)`;
        if(Math.random()<0.01*multiplier || posX>window.innerWidth-150){
          crash();
        }
        if (autoCashout && multiplier >= parseFloat(autoCashoutMultiplierInput.value)) {
          cashOut();
        }
      },50);
    }

    function crash(){
      crashed=true; playing=false; cycleActive=false;
      clearInterval(gi);
      playSound(explosionSound);
      multF.textContent = "💥"+multiplier.toFixed(2)+"x";
      plane.style.display="none";
      if(placed){ placed=false; } // lose stake already deducted
      startBtn.disabled=false; cashoutBtn.disabled=true;
      setTimeout(startCycle,2000);
    }

    function place(){
      if(!playing && !placed){
        bet = parseInt(betInput.value)||1;
        if(bet>wallet){ alert("رصيد غير كافي"); return; }
        placed=true;
      }
    }

    function startAutoBet() {
      autoBet = true;
      place();
    }

    function stopAutoBet() {
      autoBet = false;
    }
    function cashOut(){
      if(playing && placed && !crashed){
        placed=false; playing=false;
        clearInterval(gi);
        let win = bet*multiplier;
        wallet+=win; updW();
        multF.textContent = "✅"+win.toFixed(2)+"$";
        cashoutBtn.disabled=true; startBtn.disabled=false;
      }
    }
    function playSound(s){ s.currentTime=0; s.play(); }

    // handlers
    betBtns.forEach(b=>b.onclick=()=>betInput.value=b.dataset.val);
    startBtn.onclick=place;
    cashoutBtn.onclick=cashOut;

    // Auto Bet/Cashout handlers
    document.getElementById("autoBetAmount").addEventListener("change", (e) => {
      autoBet = e.target.value > 0;
    });
    document.getElementById("autoCashoutMultiplier").addEventListener("change", (e) => {
      autoCashout = e.target.value > 1;
    });

    // init
    updW(); randomPlayers();
    pi = setInterval(randomPlayers,2000);
    startCycle();
