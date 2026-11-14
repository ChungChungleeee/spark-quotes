const quoteEl = document.getElementById("quote");
const authorEl = document.getElementById("author");
const noteEl = document.getElementById("note");
const countEl = document.getElementById("count");
const clockEl = document.getElementById("clock");
const button = document.getElementById("spark");

let clicks = 0;
let bag = [];
let lastIndex = -1;

// Draw each quote once per cycle, in random order, never repeating back-to-back.
function draw() {
  if (bag.length === 0) {
    bag = QUOTES.map((_, i) => i);
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    if (bag[bag.length - 1] === lastIndex) {
      const swapWith = Math.floor(Math.random() * (bag.length - 1));
      [bag[bag.length - 1], bag[swapWith]] = [bag[swapWith], bag[bag.length - 1]];
    }
  }

  lastIndex = bag.pop();
  return QUOTES[lastIndex];
}

function show(quote) {
  quoteEl.textContent = quote.text;
  authorEl.textContent = quote.author;

  if (quote.note) {
    noteEl.textContent = "(" + quote.note + ")";
    noteEl.hidden = false;
  } else {
    noteEl.textContent = "";
    noteEl.hidden = true;
  }
}

button.addEventListener("click", () => {
  show(draw());
  countEl.textContent = ++clicks;
});

function tick() {
  clockEl.textContent = new Date().toLocaleTimeString();
}

tick();
setInterval(tick, 1000);
