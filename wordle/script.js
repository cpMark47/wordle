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
  const word = document.getElementById("secretWord").value.toUpperCase();
  if (word.length !== 5) return alert("Enter 5-letter word");

  const valid = await isValidWord(word);
  if (!valid) return alert("Invalid word");

  const encoded = btoa(word);
  const link = `${location.origin}${location.pathname}#${encoded}`;
  document.getElementById("shareLink").innerHTML =
    `🔗 Share:<br><a href="${link}">${link}</a>`;
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
    if (guess[i] === secret[i]) cell.classList.add("correct");
    else if (secret.includes(guess[i])) cell.classList.add("present");
    else cell.classList.add("absent");
  });

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

// ---------------- HOME ----------------
function goHome() {
  window.location.href = "../";
}

// ---------------- START ----------------
initGame();
