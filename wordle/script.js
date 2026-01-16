let attempts = 0;
const maxAttempts = 6;
let secret = null;

// --------------------------------------
// Funny Messages
// --------------------------------------
const funnyMessages = [
  "😂 Nice try, but English says no!",
  "🤨 That word just invented itself!",
  "🧐 Even the dictionary is confused!",
  "🚫 Not a word, my guy!",
  "🤔 Creative… but not real.",
  "😅 That’s from another universe!",
  "📚 Dictionary be like: I don’t know her.",
  "🙃 Close… but also very far.",
  "🛑 Fake word detected!",
  "🤣 Shakespeare didn’t write that one either!"
];

// --------------------------------------
// Dictionary API Validation
// --------------------------------------
async function isValidWord(word) {
  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`;
    const res = await fetch(url);
    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data);
  } catch (error) {
    console.error("Dictionary API failed:", error);
    return false;
  }
}

// --------------------------------------
// Storage Helpers (per word)
// --------------------------------------
function getStorageKey(word) {
  return `custom_wordle_state_${word}`;
}

function saveGameState() {
  if (!secret) return;

  const board = document.getElementById("board");
  const rows = [];

  for (let i = 0; i < attempts; i++) {
    const cells = board.children[i].children;
    let guess = "";
    let classes = [];

    for (let j = 0; j < 5; j++) {
      guess += cells[j].textContent;
      classes.push(cells[j].className);
    }

    rows.push({ guess, classes });
  }

  const state = {
    secret,
    attempts,
    rows
  };

  localStorage.setItem(getStorageKey(secret), JSON.stringify(state));
}

function clearGameState() {
  if (!secret) return;
  localStorage.removeItem(getStorageKey(secret));
}

// --------------------------------------
// Initialize / Restore Game
// --------------------------------------
function initGame() {
  const params = new URLSearchParams(window.location.search);
  const urlWord = params.get("word");

  if (!urlWord) return;

  secret = urlWord.toUpperCase();

  const savedState = localStorage.getItem(getStorageKey(secret));

  document.getElementById("createBox").style.display = "none";
  document.getElementById("gameBox").style.display = "block";
  createBoard();

  // Restore previous game if exists
  if (savedState) {
    const state = JSON.parse(savedState);
    attempts = state.attempts;

    const board = document.getElementById("board");

    state.rows.forEach((rowData, i) => {
      const cells = board.children[i].children;
      for (let j = 0; j < 5; j++) {
        cells[j].textContent = rowData.guess[j];
        cells[j].className = rowData.classes[j];
      }
    });
  }
}

// --------------------------------------
// Create Board
// --------------------------------------
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

// --------------------------------------
// Create Shareable Game
// --------------------------------------
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
  if (!valid) {
    alert("❌ Not a valid dictionary word!");
    shareBox.textContent = "";
    return;
  }

  const link = `${window.location.origin}${window.location.pathname}?word=${word}`;
  shareBox.innerHTML = `🔗 Share this link:<br><a href="${link}" target="_blank">${link}</a>`;
}

// --------------------------------------
// Submit Guess
// --------------------------------------
async function submitGuess() {
  const input = document.getElementById("guessInput");
  const message = document.getElementById("message");
  const guess = input.value.trim().toUpperCase();

  if (guess.length !== 5) {
    alert("Guess must be exactly 5 letters");
    return;
  }

  if (attempts >= maxAttempts) return;

  input.disabled = true;
  message.textContent = "⏳ Checking word...";

  const valid = await isValidWord(guess);
  if (!valid) {
    const randomMsg = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
    message.textContent = randomMsg;
    input.disabled = false;
    return;
  }

  const board = document.getElementById("board");
  const row = board.children[attempts];
  const cells = row.children;

  for (let i = 0; i < 5; i++) {
    cells[i].textContent = guess[i];

    if (guess[i] === secret[i]) {
      cells[i].classList.add("correct");
    } else if (secret.includes(guess[i])) {
      cells[i].classList.add("present");
    } else {
      cells[i].classList.add("absent");
    }
  }

  // Save progress after each valid guess
  saveGameState();

  if (guess === secret) {
    message.textContent = "🎉 You guessed it!";
    input.disabled = true;
    clearGameState();
  } else if (attempts === maxAttempts - 1) {
    message.textContent = `❌ Game Over! Word was ${secret}`;
    input.disabled = true;
    clearGameState();
  } else {
    message.textContent = "";
    input.disabled = false;
  }

  attempts++;
  input.value = "";
}

// --------------------------------------
// Start Game
// --------------------------------------
initGame();

function goHome() {
  window.location.href = "../";
}

