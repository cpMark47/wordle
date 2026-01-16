let attempts = 0;
const maxAttempts = 6;
let secret = null;

// Check word using free dictionary API
async function isValidWord(word) {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
    return res.ok; // true if valid, false if 404
  } catch (err) {
    console.error("Dictionary API error:", err);
    return false;
  }
}

// Initialize if word is in URL
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

// Create empty board
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

// Create shareable game link
async function createGame() {
  const word = document.getElementById("secretWord").value.toUpperCase();
  const shareBox = document.getElementById("shareLink");

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

// Submit guess
async function submitGuess() {
  const input = document.getElementById("guessInput");
  const message = document.getElementById("message");
  const guess = input.value.toUpperCase();

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

// Start game if URL contains word
initGame();
