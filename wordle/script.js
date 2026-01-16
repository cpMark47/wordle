const params = new URLSearchParams(window.location.search);
let secret = params.get("word");
let attempts = 0;
const maxAttempts = 6;

// If word exists in URL → start game
if (secret) {
  secret = secret.toUpperCase();
  document.getElementById("createBox").style.display = "none";
  document.getElementById("gameBox").style.display = "block";
  createBoard();
}

// Create game link
function createGame() {
  const word = document.getElementById("secretWord").value.toUpperCase();

  if (word.length !== 5) {
    alert("Word must be exactly 5 letters");
    return;
  }

  const link = `${window.location.origin}${window.location.pathname}?word=${word}`;
  document.getElementById("shareLink").innerHTML = 
    `🔗 Share this link with friends:<br><a href="${link}" target="_blank">${link}</a>`;
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

// Submit guess
function submitGuess() {
  const input = document.getElementById("guessInput");
  const guess = input.value.toUpperCase();

  if (guess.length !== 5) {
    alert("Guess must be 5 letters");
    return;
  }

  if (attempts >= maxAttempts) return;

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
    document.getElementById("message").textContent = "🎉 You guessed it!";
    input.disabled = true;
  } else if (attempts === maxAttempts - 1) {
    document.getElementById("message").textContent = `❌ Game Over! Word was ${secret}`;
  }

  attempts++;
  input.value = "";
}
