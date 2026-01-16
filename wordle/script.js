let attempts = 0;
const maxAttempts = 6;
let secret = null;

// --------------------------------------
// Dictionary API Validation
// --------------------------------------
async function isValidWord(word) {
  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`;
    const res = await fetch(url);

    if (!res.ok) return false; // 404 or error
    const data = await res.json();

    return Array.isArray(data); // Valid dictionary response
  } catch (error) {
    console.error("Dictionary API failed:", error);
    return false;
  }
}

// --------------------------------------
// Initialize Game from URL
// --------------------------------------
function initGame() {
  const params = new URLSearchParams(window.location.search);
  const urlWord = params.get("word");

  if (urlWord) {
    secret = urlWord.toUpperCase();

    document.getElementById("createBox").style.display = "none";
    document.getElementById("gameBox").style.display = "block";
    createBoard();
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
    message.textContent = "❌ Not in word list";
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

  if (guess === secret) {
    message.textContent = "🎉 You guessed it!";
    input.disabled = true;
  } else if (attempts === maxAttempts - 1) {
    message.textContent = `❌ Game Over! Word was ${secret}`;
    input.disabled = true;
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
