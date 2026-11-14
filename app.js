const API_URL = "https://api.quotable.kurokeita.dev/api/quotes/random?maxLength=180";
const INDEX_URL = "quotes-index.json";

const feedEl = document.getElementById("feed");
const searchEl = document.getElementById("search");
const resultsEl = document.getElementById("results");
const navUp = document.getElementById("nav-up");
const navDown = document.getElementById("nav-down");

// ── Quote fetching ──────────────────────────────────────────

let useApi = true;
let failures = 0;
let nextQuote = null;
let pending = null;
let bag = [];
let lastText = "";

function shuffle(items) {
  const list = items.slice();
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
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
      raw.author && raw.author.name ? raw.author.name
      : typeof raw.author === "string" && raw.author ? raw.author
      : "Unknown";

    const tags = Array.isArray(raw.tags)
      ? raw.tags.map((t) => (t && t.name ? t.name : t)).filter(Boolean)
      : [];
    const specific = tags.find((t) => String(t).toLowerCase() !== "famous quotes");
    const category = specific ? String(specific) : tags.length ? String(tags[0]) : "";

    failures = 0;
    return { text, author, category };
  } catch {
    failures++;
    if (failures >= 2) useApi = false;
    return null;
  }
}

function prefetch() {
  if (!useApi) return Promise.resolve(null);
  if (!pending) {
    pending = fetchQuote().then((q) => { pending = null; nextQuote = q; return q; });
  }
  return pending;
}

function takeFromBundle() {
  if (!bag.length) bag = shuffle(QUOTES);
  return bag.pop();
}

async function takeQuote() {
  for (let attempt = 0; attempt < 2; attempt++) {
    let q = nextQuote;
    nextQuote = null;
    if (!q && useApi) q = await prefetch();
    if (!q) q = takeFromBundle();
    if (q.text !== lastText) return q;
  }
  return takeFromBundle();
}

// ── Slide / feed ────────────────────────────────────────────

const slides = [];   // array of { el, quote }
let current = 0;     // index of active slide
let transitioning = false;

function buildCard(quote) {
  const card = document.createElement("div");
  card.className = "quote-card";

  const cat = document.createElement("p");
  cat.className = "card-category";
  cat.textContent = quote.category || "";
  cat.hidden = !quote.category;

  const q = document.createElement("blockquote");
  q.className = "card-quote";
  q.textContent = quote.text;

  const who = document.createElement("p");
  who.className = "card-author";
  who.textContent = quote.author || "Unknown";

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "card-btn";
  copyBtn.textContent = "Copy";
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(`"${quote.text}" — ${quote.author}`).then(() => {
      copyBtn.textContent = "Copied!";
      copyBtn.classList.add("copied");
      setTimeout(() => { copyBtn.textContent = "Copy"; copyBtn.classList.remove("copied"); }, 2000);
    });
  });

  const shareBtn = document.createElement("button");
  shareBtn.type = "button";
  shareBtn.className = "card-btn";
  shareBtn.textContent = "Share";
  shareBtn.addEventListener("click", () => {
    const text = `"${quote.text}" — ${quote.author}`;
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text).then(() => {
        shareBtn.textContent = "Copied!";
        setTimeout(() => { shareBtn.textContent = "Share"; }, 2000);
      });
    }
  });

  const likeBtn = document.createElement("button");
  likeBtn.type = "button";
  likeBtn.className = "icon-btn";
  likeBtn.setAttribute("aria-label", "Like");
  likeBtn.innerHTML = `<i data-lucide="heart"></i>`;
  likeBtn.addEventListener("click", () => {
    likeBtn.classList.toggle("active");
  });

  const bookmarkBtn = document.createElement("button");
  bookmarkBtn.type = "button";
  bookmarkBtn.className = "icon-btn";
  bookmarkBtn.setAttribute("aria-label", "Bookmark");
  bookmarkBtn.innerHTML = `<i data-lucide="bookmark"></i>`;
  bookmarkBtn.addEventListener("click", () => {
    bookmarkBtn.classList.toggle("active");
  });

  const iconGroup = document.createElement("div");
  iconGroup.className = "icon-group";
  iconGroup.append(likeBtn, bookmarkBtn);

  actions.append(copyBtn, shareBtn, iconGroup);
  setTimeout(() => lucide.createIcons({ nameAttr: "data-lucide", rootElement: actions }), 0);

  card.append(cat, q, who, actions);
  return card;
}

function createSlide(quote, position) {
  const slide = document.createElement("div");
  slide.className = "slide " + position;
  slide.append(buildCard(quote));
  feedEl.append(slide);
  return { el: slide, quote };
}

function updateNavButtons() {
  navUp.disabled = current === 0;
}

async function goTo(direction) {
  if (transitioning) return;

  if (direction === "up" && current === 0) return;

  transitioning = true;

  if (direction === "down") {
    // fetch next quote and append a new slide below
    const quote = await takeQuote();
    lastText = quote.text;
    const newSlide = createSlide(quote, "below");
    slides.push(newSlide);

    // force reflow so transition fires
    newSlide.el.getBoundingClientRect();

    // move current up, new one into view
    slides[current].el.className = "slide above";
    newSlide.el.className = "slide active";
    current = slides.length - 1;
    prefetch();
  } else {
    // go back up
    slides[current].el.className = "slide below";
    slides[current - 1].el.className = "slide active";
    current--;
  }

  updateNavButtons();

  setTimeout(() => { transitioning = false; }, 460);
}

// ── Keyboard navigation ──────────────────────────────────────

document.addEventListener("keydown", (e) => {
  if (document.activeElement === searchEl) return;
  if (e.key === "ArrowDown") { e.preventDefault(); goTo("down"); }
  if (e.key === "ArrowUp")   { e.preventDefault(); goTo("up"); }
});

navDown.addEventListener("click", () => goTo("down"));
navUp.addEventListener("click", () => goTo("up"));

// ── Touch / swipe ────────────────────────────────────────────

let touchStartY = 0;

feedEl.addEventListener("touchstart", (e) => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

feedEl.addEventListener("touchend", (e) => {
  const diff = touchStartY - e.changedTouches[0].clientY;
  if (Math.abs(diff) < 40) return;
  goTo(diff > 0 ? "down" : "up");
}, { passive: true });

// ── Search ───────────────────────────────────────────────────

const PAGE_SIZE = 20;
let index = null;
let indexPromise = null;
let searchToken = 0;
let matchList = [];
let shown = 0;
let resultsCountEl = null;
let resultsListEl = null;
let moreEl = null;

function loadIndex() {
  if (index) return Promise.resolve(index);
  if (indexPromise) return indexPromise;
  indexPromise = fetch(INDEX_URL, { cache: "force-cache" })
    .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
    .then((list) => { index = list.map((q) => ({ text: q.t, author: q.a, category: q.c })); return index; })
    .catch(() => { index = QUOTES.map((q) => ({ text: q.text, author: q.author, category: q.category })); return index; });
  return indexPromise;
}

function resultItem(entry) {
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
    // show selected quote as a new slide
    lastText = entry.text;
    const newSlide = createSlide(entry, "below");
    slides.push(newSlide);
    newSlide.el.getBoundingClientRect();
    slides[current].el.className = "slide above";
    newSlide.el.className = "slide active";
    current = slides.length - 1;
    updateNavButtons();

    searchEl.value = "";
    resultsEl.hidden = true;
    resultsEl.textContent = "";
  });

  item.append(btn);
  return item;
}

function updateResultsCount() {
  const total = matchList.length;
  const noun = total === 1 ? "result" : "results";
  resultsCountEl.textContent =
    shown < total ? "showing " + shown + " of " + total + " " + noun : total + " " + noun;
}

function appendResults() {
  const chunk = matchList.slice(shown, shown + PAGE_SIZE);
  chunk.forEach((entry) => resultsListEl.append(resultItem(entry)));
  shown += chunk.length;
  updateResultsCount();
  const remaining = matchList.length - shown;
  if (remaining > 0) {
    moreEl.hidden = false;
    moreEl.textContent = "Show " + Math.min(PAGE_SIZE, remaining) + " more";
  } else {
    moreEl.hidden = true;
  }
}

function renderResults(found, query) {
  matchList = found;
  shown = 0;
  resultsEl.textContent = "";

  if (!found.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No quotes match \u201c" + query + "\u201d.";
    resultsEl.append(empty);
    return;
  }

  resultsCountEl = document.createElement("p");
  resultsCountEl.className = "results-count";

  resultsListEl = document.createElement("ul");
  resultsListEl.className = "results-list";

  moreEl = document.createElement("button");
  moreEl.type = "button";
  moreEl.className = "more";
  moreEl.addEventListener("click", appendResults);

  resultsEl.append(resultsCountEl, resultsListEl, moreEl);
  appendResults();
}

async function runSearch(raw) {
  const query = raw.trim();
  if (query.length < 2) {
    resultsEl.hidden = true;
    resultsEl.textContent = "";
    return;
  }

  const token = ++searchToken;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  resultsEl.hidden = false;
  resultsEl.textContent = "";

  const loading = document.createElement("p");
  loading.className = "empty";
  loading.textContent = "Searching…";
  resultsEl.append(loading);

  const list = await loadIndex();
  if (token !== searchToken) return;

  const found = list.filter((entry) => {
    const haystack = (entry.text + " " + entry.author + " " + entry.category).toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });

  renderResults(found, query);
}

let searchTimer = null;

searchEl.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => runSearch(searchEl.value), 140);
});

searchEl.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    searchEl.value = "";
    resultsEl.hidden = true;
    resultsEl.textContent = "";
    searchEl.blur();
  }
  if (e.key === "Enter") {
    const first = resultsEl.querySelector(".result");
    if (first) { e.preventDefault(); first.click(); }
  }
});

// ── Boot ─────────────────────────────────────────────────────

async function init() {
  // Render Lucide icons
  lucide.createIcons();

  // Dark mode toggle
  const themeToggle = document.getElementById("theme-toggle");
  const html = document.documentElement;
  themeToggle.addEventListener("click", () => {
    const isDark = html.getAttribute("data-theme") === "dark";
    html.setAttribute("data-theme", isDark ? "light" : "dark");
    themeToggle.innerHTML = isDark ? `<i data-lucide="moon"></i>` : `<i data-lucide="sun"></i>`;
    lucide.createIcons({ rootElement: themeToggle });
  });

  // ── Panel (categories / authors) ──────────────────────────
  const panelEl    = document.getElementById("panel");
  const panelTitle = document.getElementById("panel-title");
  const panelBody  = document.getElementById("panel-body");
  const panelClose = document.getElementById("panel-close");

  function closePanel() {
    panelEl.hidden = true;
    document.querySelectorAll(".sidebar-btn").forEach(b => b.classList.remove("active"));
    document.querySelector(".sidebar-btn[title='Home']").classList.add("active");
  }

  panelClose.addEventListener("click", closePanel);
  lucide.createIcons({ rootElement: panelClose });

  function loadQuoteFromPanel(quote) {
    lastText = quote.text;
    const newSlide = createSlide(quote, "below");
    slides.push(newSlide);
    newSlide.el.getBoundingClientRect();
    slides[current].el.className = "slide above";
    newSlide.el.className = "slide active";
    current = slides.length - 1;
    updateNavButtons();
    closePanel();
  }

  // Level 1: show list of categories or authors
  function showGroupList(title, groupBy) {
    panelTitle.textContent = title;
    panelBody.textContent = "";
    document.getElementById("panel-back").hidden = true;

    const map = new Map();
    QUOTES.forEach(q => {
      const key = q[groupBy] || "Unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(q);
    });

    const sorted = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const ul = document.createElement("ul");
    ul.className = "group-quotes";

    sorted.forEach(([key, quotes]) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "group-quote-btn group-list-item";

      const label = document.createElement("span");
      label.textContent = key;

      const count = document.createElement("span");
      count.className = "group-count";
      count.textContent = quotes.length + " quote" + (quotes.length !== 1 ? "s" : "");

      btn.append(label, count);
      btn.addEventListener("click", () => showQuoteList(title, groupBy, key, quotes));
      li.append(btn);
      ul.append(li);
    });

    panelBody.append(ul);
    panelEl.hidden = false;
  }

  // Level 2: show quotes inside a selected category or author
  function showQuoteList(parentTitle, groupBy, key, quotes) {
    panelTitle.textContent = key;
    panelBody.textContent = "";

    const backBtn = document.getElementById("panel-back");
    backBtn.hidden = false;
    backBtn.onclick = () => showGroupList(parentTitle, groupBy);

    const ul = document.createElement("ul");
    ul.className = "group-quotes";

    quotes.forEach(q => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "group-quote-btn";
      btn.textContent = q.text;
      btn.addEventListener("click", () => loadQuoteFromPanel(q));
      li.append(btn);
      ul.append(li);
    });

    panelBody.append(ul);
  }

  // Wire sidebar buttons
  document.querySelector(".sidebar-btn[title='Categories']").addEventListener("click", () => {
    document.querySelectorAll(".sidebar-btn").forEach(b => b.classList.remove("active"));
    document.querySelector(".sidebar-btn[title='Categories']").classList.add("active");
    showGroupList("Categories", "category");
  });

  document.querySelector(".sidebar-btn[title='Authors']").addEventListener("click", () => {
    document.querySelectorAll(".sidebar-btn").forEach(b => b.classList.remove("active"));
    document.querySelector(".sidebar-btn[title='Authors']").classList.add("active");
    showGroupList("Authors", "author");
  });

  document.querySelector(".sidebar-btn[title='Home']").addEventListener("click", closePanel);

  // ── First quote ───────────────────────────────────────────
  const first = await takeQuote();
  lastText = first.text;
  const firstSlide = createSlide(first, "active");
  slides.push(firstSlide);
  updateNavButtons();
  prefetch();
}

init();
