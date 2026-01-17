let attempts = 0;
const maxAttempts = 6;
let secret = null;

// ---------------- FUNNY MESSAGES ----------------
const funnyMessages = [
  "😂 English says no!",
  "🤨 That word just invented itself!",
  "🧐 Dictionary is confused!",
  "🚫 Fake word detected!",
  "😅 From another universe!",
  "🤣 Shakespeare didn’t write that!"
];

// ---------------- DICTIONARY CHECK ----------------
async function isValidWord(word) {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`,
      { signal: controller.signal }
    );
    if (!res.ok) return false;
    return Array.isArray(await res.json());
  } catch {
    return null;
  }
}

// ---------------- STORAGE ----------------
function key() {
  return `wordle_${secret}`;
}

function saveState(gameOver = false) {
  const rows = [];
  const board = document.getElementById("board");

  for (let i = 0; i < attempts; i++) {
    const cells = board.children[i].children;
    rows.push({
      guess: [...cells].map(c => c.textContent).join(""),
      classes: [...cells].map(c => c.className)
    });
  }

  localStorage.setItem(key(), JSON.stringify({ attempts, rows, gameOver }));
}

// ---------------- INIT GAME ----------------
function initGame() {
  if (!location.hash) return;

  try {
    secret = atob(location.hash.substring(1)).toUpperCase();
  } catch {
    return;
  }

  document.getElementById("createBox").style.display = "none";
  document.getElementById("gameBox").style.display = "block";

  createBoard();

  const saved = localStorage.getItem(key());
  if (!saved) return;

  const state = JSON.parse(saved);
  attempts = state.attempts;

  state.rows.forEach((row, i) => {
    const cells = document.getElementById("board").children[i].children;
    row.guess.split("").forEach((ch, j) => {
      cells[j].textContent = ch;
      cells[j].className = row.classes[j];
    });
  });

  if (state.gameOver) {
    document.getElementById("guessInput").disabled = true;
    document.getElementById("homeBtn").style.display = "block";
  }
}

// ---------------- BOARD ----------------
function createBoard() {
  const board = document.getElementById("board");
  board.innerHTML = "";

  for (let i = 0; i < maxAttempts; i++) {
    const row = document.createElement("div");
    row.className = "row";

    for (let j = 0; j < 5; j++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      row.appendChild(cell);
    }
    board.appendChild(row);
  }
}

// ---------------- CREATE GAME ----------------
async function createGame() {
  const input = document.getElementById("secretWord");
  const shareBox = document.getElementById("shareLink");
  const word = input.value.trim().toUpperCase();

  if (word.length !== 5) {
    alert("Word must be exactly 5 letters");
    return;
  }

  shareBox.textContent = "⏳ Checking word...";

  const valid = await isValidWord(word);
  if (valid === null) {
    alert("⚠️ Dictionary service unavailable.");
    shareBox.textContent = "";
    return;
  }

  if (!valid) {
    alert("❌ Not a valid dictionary word!");
    shareBox.textContent = "";
    return;
  }

  // Encode word
  const encoded = btoa(word);
  const link = `${window.location.origin}${window.location.pathname}#${encoded}`;

  // Click-to-copy UI
  shareBox.innerHTML = `
    <span id="copyLink" style="cursor:pointer; color:#6aaa64; font-weight:bold;">
      🔗 Tap to copy link
    </span>
    <div id="copiedMsg" style="display:none; color:#aaa; font-size:14px; margin-top:6px;">
      ✅ Link copied!
    </div>
  `;

  document.getElementById("copyLink").onclick = () => copyToClipboard(link);
}

function colorGuess(row, guess, secret) {
  const secretArr = secret.split("");
  const guessArr = guess.split("");

  // Count letters in secret
  const letterCount = {};
  for (let ch of secretArr) {
    letterCount[ch] = (letterCount[ch] || 0) + 1;
  }

  // First pass: GREEN
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === secretArr[i]) {
      row.children[i].classList.add("correct");
      letterCount[guessArr[i]]--;
      guessArr[i] = null; // mark used
    }
  }

  // Second pass: YELLOW / GRAY
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === null) continue;

    if (letterCount[guessArr[i]] > 0) {
      row.children[i].classList.add("present");
      letterCount[guessArr[i]]--;
    } else {
      row.children[i].classList.add("absent");
    }
  }
}



// ---------------- SUBMIT GUESS ----------------
async function submitGuess() {
  const input = document.getElementById("guessInput");
  const msg = document.getElementById("message");
  const guess = input.value.toUpperCase();

  if (guess.length !== 5) return;

  input.disabled = true;
  msg.textContent = "⏳ Checking...";

  const valid = await isValidWord(guess);
  if (valid === null) {
    msg.textContent = "⚠️ Dictionary offline";
    input.disabled = false;
    return;
  }

  if (!valid) {
    msg.textContent = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
    input.disabled = false;
    return;
  }

  const row = document.getElementById("board").children[attempts];
  [...row.children].forEach((cell, i) => {
    cell.textContent = guess[i];
  });

  colorGuess(row, guess, secret);

  attempts++;

  if (guess === secret || attempts === maxAttempts) {
    msg.textContent = guess === secret ? "🎉 You won!" : `❌ Word was ${secret}`;
    saveState(true);
    document.getElementById("homeBtn").style.display = "block";
    return;
  }

  saveState();
  input.value = "";
  input.disabled = false;
  msg.textContent = "";
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    const msg = document.getElementById("copiedMsg");
    msg.style.display = "block";

    setTimeout(() => {
      msg.style.display = "none";
    }, 2000);
  });
}


// ---------------- HOME ----------------
function goHome() {
  window.location.href = "../";
}

// ---------------- START ----------------
initGame();


