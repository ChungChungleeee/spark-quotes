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
| `quotes.js` | The 100 quotes, grouped by category |
| `app.js` | Random draw, click counter, clock |

## How the draw works

Quotes are drawn in a shuffled "bag": each quote appears once before any repeats, and the same quote never appears twice in a row.

## Attribution

Some quotes carry a note such as "Attribution uncertain" or "Commonly attributed". Those caveats are kept from the source collection and shown next to the author.
