# Spark

A small single-page site: click once, get one of 100 quotes.

Plain HTML, CSS and JavaScript. No build step, no dependencies.

## Live

https://chungchungleeee.github.io/spark-quotes/

Also mirrored at https://spark-quotes.netlify.app/

## Run

```sh
python -m http.server 5500
```

Then open http://localhost:5500

To view it on a phone on the same network, use `http://<your-pc-ip>:5500` (the server binds to all interfaces).

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure |
| `style.css` | Black-on-white styling |
| `quotes.js` | Bundled fallback quotes, grouped by category |
| `quotes-index.json` | Static search index: 2,107 quotes with author and category |
| `app.js` | API fetch, prefetch, fallback, search, click counter, clock |

## How the draw works

Each click shows one quote. Quotes are fetched live from the Quotable API (a free, keyless mirror at `api.quotable.kurokeita.dev`); the next one is prefetched so a click feels instant.

Every quote shows a category above it. Live quotes use the API's first tag (e.g. "Wisdom", "Friendship", "Famous Quotes"); bundled quotes use their section from the collection (e.g. "Money and wealth"). The two taxonomies are independent.

If the API is unreachable — offline, blocked, or down — the site falls back to the 100 quotes bundled in `quotes.js`, and the footer label changes to "quotes from the bundled set". A quote is never repeated back-to-back.

## Search

The box under the button filters quotes by keyword, author or category. Typing narrows the list as you go; several words are matched together, so `einstein peace` finds quotes containing both. Matching is case-insensitive and covers the quote text, the author name and the category.

Click a result to make it the quote on the page. `Escape` clears the search and returns to the quote, and `Enter` opens the first result.

Results come 20 at a time, with a **Show 20 more** button underneath (it says how many are left in the last batch). The count above the list keeps track, e.g. `showing 40 of 558 results`.

Search runs against `quotes-index.json`, a snapshot of the API's full catalogue (2,107 quotes, 748 authors, 48 categories) fetched once and shipped with the site. It is loaded lazily on the first search, so the page itself stays small, and the API is never called per keystroke. If the index cannot be fetched, search falls back to the 100 bundled quotes.

The index is a snapshot rather than live data. To rebuild it, page through the API's list endpoint (`/api/quotes?limit=100&page=N`, 100 per page, 21 pages) and write out `{ "t": text, "a": author, "c": category }` for each quote.

## Attribution

Some bundled quotes carry a note such as "Attribution uncertain" or "Commonly attributed". Those caveats are kept from the source collection and shown next to the author.
