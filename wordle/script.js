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
// Dictionary API Validation with Timeout
// --------------------------------------
async function isValidWord(word) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`;
    const res = await fetch(url, { signal: controller.signal });

    clearTimeout(timeout);

    if (!res.ok) return false;

    const data = await res.json();
    return Array.isArray(data);
  } catch (error) {
    console.error("Dictionary API failed:", error);
    return null; // null = API failed, not invalid word
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

  const state = { secret, attempts, rows };
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

  document.getElementById("createBox").style.display = "none";
  document.getElementById("gameBox").style.display = "block";
  createBoard();

  const savedState = localStorage.getItem(getStorageKey(secret));

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

  if (valid === null) {
    alert("⚠️ Dictionary service unavailable. Try again later.");
    shareBox.textContent = "";
    return;
  }

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

  // API failed → don't freeze
  if (valid === null) {
    message.textContent = "⚠️ Dictionary service is down. Try again.";
    input.disabled = false;
    return;
  }

  // Invalid word → funny message
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

  // Save progress
  saveGameState();

  // Game end conditions
  if (guess === secret) {
    message.textContent = "🎉 You guessed it!";
    input.disabled = true;
    clearGameState();
    document.getElementById("homeBtn").style.display = "inline-block";
  } else if (attempts === maxAttempts - 1) {
    message.textContent = `❌ Game Over! Word was ${secret}`;
    input.disabled = true;
    clearGameState();
    document.getElementById("homeBtn").style.display = "inline-block";
  } else {
    message.textContent = "";
    input.disabled = false;
  }

  attempts++;
  input.value = "";
}

// --------------------------------------
// Go to Home
// --------------------------------------
function goHome() {
  window.location.href = "../";
}

// --------------------------------------
// Start Game
// --------------------------------------
initGame();
