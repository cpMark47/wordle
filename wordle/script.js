let attempts = 0;
const maxAttempts = 6;
let secret = null;
let currentGameId = null;


// ---------------- FUNNY MESSAGES ----------------
const funnyMessages = [
  "😂 English says no!",
  "🤨 That word just invented itself!",
  "🧐 Dictionary is confused!",
  "🚫 Fake word detected!",
  "😅 From another universe!",
  "🤣 Shakespeare didn’t write that!"
];

// ---------------- KEYBOARD STATE ----------------
let keyboardState = {};


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
  return `wordle_${currentGameId}`;
}

function loadKeyboardState() {
  keyboardState =
    JSON.parse(localStorage.getItem(`keyboard_${currentGameId}`)) || {};
}

function saveKeyboardState() {
  localStorage.setItem(
    `keyboard_${currentGameId}`,
    JSON.stringify(keyboardState)
  );
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

  localStorage.setItem(
    key(),
    JSON.stringify({ attempts, rows, gameOver })
  );
}

// ---------------- INIT GAME ----------------
function initGame() {
  if (!location.hash) {
    // No hash → show Create Game
    document.getElementById("createBox").style.display = "block";
    document.getElementById("gameBox").style.display = "none";
    return;
  }

  // Hash present → Play Game
  try {
    const hash = location.hash.substring(1);
const [gameId, encodedWord] = hash.split(".");

if (!gameId || !encodedWord) return;

secret = atob(encodedWord).toUpperCase();
currentGameId = gameId;
    loadKeyboardState();


  } catch {
    return;
  }

  document.getElementById("createBox").style.display = "none";
  document.getElementById("gameBox").style.display = "block";

  createBoard();
  createKeyboard();
  restoreKeyboard();

  const saved = localStorage.getItem(key());
 if (!saved) {
  attempts = 0;
  keyboardState = {};
  saveKeyboardState();
  return;
}


  const state = JSON.parse(saved);
  attempts = state.attempts;

  state.rows.forEach((row, i) => {
    const cells =
      document.getElementById("board").children[i].children;
    row.guess.split("").forEach((ch, j) => {
      cells[j].textContent = ch;
      cells[j].className = row.classes[j];
    });
  });

  if (state.gameOver) {
    document.getElementById("guessInput").disabled = true;
    document.getElementById("homeBtn").style.display = "block";
    document.getElementById("board").classList.add("win");
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

// ---------------- KEYBOARD ----------------
function createKeyboard() {
  document.querySelectorAll(".key-row").forEach(row => {
    const keys = row.dataset.keys.split(" ");
    row.innerHTML = "";

    keys.forEach(k => {
      const key = document.createElement("div");
      key.className = "key";
      key.textContent = k;
      key.onclick = () => handleKey(k);
      row.appendChild(key);
    });
  });
}

function handleKey(k) {
  const input = document.getElementById("guessInput");
  if (input.disabled) return;

  if (k === "ENTER") submitGuess();
  else if (k === "⌫") input.value = input.value.slice(0, -1);
  else if (input.value.length < 5) input.value += k;
}

function updateKeyboard(letter, state) {
  const current = keyboardState[letter];

  if (current === "correct") return;
  if (current === "present" && state === "absent") return;

  keyboardState[letter] = state;
  saveKeyboardState();
  restoreKeyboard();
}


function restoreKeyboard() {
  document.querySelectorAll(".key").forEach(k => {
    k.classList.remove("correct", "present", "absent");
    const state = keyboardState[k.textContent];
    if (state) k.classList.add(state);
  });
}


// ---------------- COLOR LOGIC ----------------
function colorGuess(row, guess) {
  const secretArr = secret.split("");
  const guessArr = guess.split("");

  const letterCount = {};
  secretArr.forEach(
    c => (letterCount[c] = (letterCount[c] || 0) + 1)
  );

  // GREEN pass
  for (let i = 0; i < 5; i++) {
    row.children[i].textContent = guess[i];
    if (guessArr[i] === secretArr[i]) {
      row.children[i].classList.add("correct");
      updateKeyboard(guessArr[i], "correct");
      letterCount[guessArr[i]]--;
      guessArr[i] = null;
    }
  }

  // YELLOW / GREY pass
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === null) continue;

    if (letterCount[guessArr[i]] > 0) {
      row.children[i].classList.add("present");
      updateKeyboard(guessArr[i], "present");
      letterCount[guessArr[i]]--;
    } else {
      row.children[i].classList.add("absent");
      updateKeyboard(guessArr[i], "absent");
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
    msg.textContent =
      funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
    input.disabled = false;
    return;
  }

  const row = document.getElementById("board").children[attempts];
  colorGuess(row, guess);

  attempts++;

  if (guess === secret || attempts === maxAttempts) {
    msg.textContent =
      guess === secret ? "🎉 You won!" : `❌ Word was ${secret}`;
    saveState(true);
    document.getElementById("homeBtn").style.display = "block";
    document.getElementById("board").classList.add("win");
    input.disabled = true;
    return;
  }

  saveState();
  input.value = "";
  input.disabled = false;
  msg.textContent = "";
}

// ---------------- SHARE ----------------
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    const msg = document.getElementById("copiedMsg");
    msg.style.display = "block";
    setTimeout(() => (msg.style.display = "none"), 2000);
  });
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


  // Encode word so it doesn't appear in URL
  // Generate unique game id
const gameId = Date.now();

// Encode word
const encodedWord = btoa(word);

// Final link
const link =
  `${window.location.origin}${window.location.pathname}#${gameId}.${encodedWord}`;


  // Click-to-copy UI
  shareBox.innerHTML = `
    <span id="copyLink"
          style="cursor:pointer; color:#6aaa64; font-weight:bold;">
      🔗 Tap to copy game link
    </span>
    <div id="copiedMsg"
         style="display:none; color:#aaa; font-size:14px; margin-top:6px;">
      ✅ Link copied!
    </div>
  `;

  document.getElementById("copyLink").onclick =
    () => copyToClipboard(link);
}


// ---------------- HOME ----------------
function goHome() {
  window.location.href = "../";
}

// ---------------- START ----------------
initGame();




