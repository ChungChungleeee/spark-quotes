# Spark

A small single-page site: click once, get one of 100 quotes.

Plain HTML, CSS and JavaScript. No build step, no dependencies.

## Live

https://chungchungleeee.github.io/spark-quotes/

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
| `app.js` | API fetch, prefetch, fallback, click counter, clock |

## How the draw works

Each click shows one quote. Quotes are fetched live from the Quotable API (a free, keyless mirror at `api.quotable.kurokeita.dev`); the next one is prefetched so a click feels instant.

If the API is unreachable — offline, blocked, or down — the site falls back to the 100 quotes bundled in `quotes.js`, and the footer label changes to "quotes from the bundled set". A quote is never repeated back-to-back.

## Attribution

Some bundled quotes carry a note such as "Attribution uncertain" or "Commonly attributed". Those caveats are kept from the source collection and shown next to the author.
