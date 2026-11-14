const API_URL = "https://api.quotable.kurokeita.dev/api/quotes/random?maxLength=180";

const quoteEl = document.getElementById("quote");
const authorEl = document.getElementById("author");
const noteEl = document.getElementById("note");
const categoryEl = document.getElementById("category");
const countEl = document.getElementById("count");
const clockEl = document.getElementById("clock");
const sourceEl = document.getElementById("source");
const button = document.getElementById("spark");

let clicks = 0;
let lastText = "";

// Live API state
let useApi = true;
let failures = 0;
let nextQuote = null;
let pending = null;

// Offline fallback
let bag = [];

function shuffle(items) {
  const list = items.slice();
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function setSource(text) {
  sourceEl.textContent = text;
}

async function fetchQuote() {
  try {
    const res = await fetch(API_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
    const raw = data.quote || (Array.isArray(data) ? data[0] : data);
    const text = raw && (raw.content || raw.text);
    if (!text) throw new Error("unexpected response");

    const author =
      raw.author && raw.author.name
        ? raw.author.name
        : typeof raw.author === "string" && raw.author
          ? raw.author
          : "Unknown";

    const tags = Array.isArray(raw.tags)
      ? raw.tags.map((tag) => (tag && tag.name ? tag.name : tag)).filter(Boolean)
      : [];
    const specific = tags.find((tag) => String(tag).toLowerCase() !== "famous quotes");
    const category = specific ? String(specific) : tags.length ? String(tags[0]) : "";

    failures = 0;
    return { text, author, category };
  } catch (err) {
    failures += 1;
    if (failures >= 2) {
      useApi = false;
      setSource("quotes from the bundled set");
    }
    return null;
  }
}

function prefetch() {
  if (!useApi) return Promise.resolve(null);
  if (!pending) {
    pending = fetchQuote().then((quote) => {
      pending = null;
      nextQuote = quote;
      return quote;
    });
  }
  return pending;
}

function takeFromBundle() {
  if (!bag.length) bag = shuffle(QUOTES);
  return bag.pop();
}

async function takeQuote() {
  for (let attempt = 0; attempt < 2; attempt++) {
    let quote = nextQuote;
    nextQuote = null;

    if (!quote && useApi) quote = await prefetch();
    if (!quote) quote = takeFromBundle();

    if (quote.text !== lastText) return quote;
  }
  return takeFromBundle();
}

function show(quote) {
  lastText = quote.text;
  quoteEl.textContent = quote.text;
  authorEl.textContent = quote.author || "Unknown";

  if (quote.category) {
    categoryEl.textContent = quote.category;
    categoryEl.hidden = false;
  } else {
    categoryEl.textContent = "";
    categoryEl.hidden = true;
  }

  if (quote.note) {
    noteEl.textContent = "(" + quote.note + ")";
    noteEl.hidden = false;
  } else {
    noteEl.textContent = "";
    noteEl.hidden = true;
  }
}

button.addEventListener("click", async () => {
  const quote = await takeQuote();
  if (!quote) return;

  show(quote);
  countEl.textContent = ++clicks;
  prefetch();
});

function tick() {
  clockEl.textContent = new Date().toLocaleTimeString();
}

prefetch();
tick();
setInterval(tick, 1000);
