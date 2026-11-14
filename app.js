const API_URL = "https://api.quotable.kurokeita.dev/api/quotes/random?maxLength=180";
const INDEX_URL = "quotes-index.json";

const quoteEl = document.getElementById("quote");
const authorEl = document.getElementById("author");
const noteEl = document.getElementById("note");
const categoryEl = document.getElementById("category");
const countEl = document.getElementById("count");
const clockEl = document.getElementById("clock");
const sourceEl = document.getElementById("source");
const button = document.getElementById("spark");
const blockEl = document.getElementById("quote-block");
const searchEl = document.getElementById("search");
const resultsEl = document.getElementById("results");

let clicks = 0;
let lastText = "";

// Live API state
let useApi = true;
let failures = 0;
let nextQuote = null;
let pending = null;

// Offline fallback
let bag = [];

// Search state
let index = null;
let indexPromise = null;
let searchToken = 0;

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

function showQuoteView() {
  resultsEl.hidden = true;
  resultsEl.textContent = "";
  blockEl.hidden = false;
}

button.addEventListener("click", async () => {
  showQuoteView();
  searchEl.value = "";

  const quote = await takeQuote();
  if (!quote) return;

  show(quote);
  countEl.textContent = ++clicks;
  prefetch();
});

/* ---------- search ---------- */

function loadIndex() {
  if (index) return Promise.resolve(index);
  if (indexPromise) return indexPromise;

  indexPromise = fetch(INDEX_URL, { cache: "force-cache" })
    .then((res) => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then((list) => {
      index = list.map((q) => ({ text: q.t, author: q.a, category: q.c }));
      return index;
    })
    .catch(() => {
      index = QUOTES.map((q) => ({ text: q.text, author: q.author, category: q.category }));
      return index;
    });

  return indexPromise;
}

function searchable(entry) {
  return (entry.text + " " + entry.author + " " + entry.category).toLowerCase();
}

function renderResults(matches, query) {
  resultsEl.textContent = "";

  if (!matches.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No quotes match “" + query + "”.";
    resultsEl.append(empty);
    return;
  }

  const count = document.createElement("p");
  count.className = "results-count";
  count.textContent =
    matches.length + (matches.length === 1 ? " result" : " results") +
    (matches.length > 20 ? " · showing first 20" : "");
  resultsEl.append(count);

  const list = document.createElement("ul");
  list.className = "results-list";

  matches.slice(0, 20).forEach((entry) => {
    const item = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "result";

    const text = document.createElement("span");
    text.className = "result-quote";
    text.textContent = entry.text;

    const meta = document.createElement("span");
    meta.className = "result-meta";
    meta.textContent = entry.author + (entry.category ? " · " + entry.category : "");

    btn.append(text, meta);
    btn.addEventListener("click", () => {
      show(entry);
      countEl.textContent = ++clicks;
      searchEl.value = "";
      showQuoteView();
    });

    item.append(btn);
    list.append(item);
  });

  resultsEl.append(list);
}

async function runSearch(raw) {
  const query = raw.trim();
  if (query.length < 2) {
    showQuoteView();
    return;
  }

  const token = ++searchToken;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  blockEl.hidden = true;
  resultsEl.hidden = false;
  resultsEl.textContent = "";

  const loading = document.createElement("p");
  loading.className = "empty";
  loading.textContent = "Searching…";
  resultsEl.append(loading);

  const list = await loadIndex();
  if (token !== searchToken) return;

  const matches = list.filter((entry) => {
    const haystack = searchable(entry);
    return terms.every((term) => haystack.includes(term));
  });

  renderResults(matches, query);
}

let searchTimer = null;

searchEl.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => runSearch(searchEl.value), 140);
});

searchEl.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    searchEl.value = "";
    showQuoteView();
    searchEl.blur();
    return;
  }

  if (event.key === "Enter") {
    const first = resultsEl.querySelector(".result");
    if (first) {
      event.preventDefault();
      first.click();
    }
  }
});

/* ---------- clock ---------- */

function tick() {
  clockEl.textContent = new Date().toLocaleTimeString();
}

prefetch();
tick();
setInterval(tick, 1000);
