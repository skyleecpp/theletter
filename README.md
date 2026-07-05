# five pillars — a gated, growing letter

A small site with two parts:

1. **The gate** — a hand-doodled Flappy Bird clone. The visitor must fly past
   5 pillars to unlock the rest of the site.
2. **The book** — a handwritten-style letter made of pages. Each page is
   either text or an image, has its own reply box, and new pages can be
   added just by editing `pages.json`.

## Files

```
index.html    the page shell (game + book markup)
style.css     the doodle/notebook look
script.js     game logic + book logic
pages.json    the letter's content — edit this to add pages
images/       put page images here
```

## Adding a new page

Open `pages.json` and append an object to the array. No other file needs to
change.

Text page:
```json
{
  "id": "page-4",
  "type": "text",
  "title": "page four",
  "content": "Whatever you want to say. Use \n\n for a paragraph break.",
  "replyPrompt": "what do you want to say back?"
}
```

Image page:
```json
{
  "id": "page-5",
  "type": "image",
  "title": "page five",
  "src": "images/your-photo.jpg",
  "caption": "optional caption under the photo",
  "replyPrompt": "what does this make you think of?"
}
```

`id` must be unique — it's the key used for storing that page's reply.

## About the reply boxes and the CSV — please read

This is a static site (it's meant to be hosted on **GitHub Pages**), and
static sites cannot write files on a server — there's no server. So the
"log everything to a CSV" part works like this out of the box:

- Every reply is saved in the visitor's own browser (`localStorage`).
- A **"download all replies (.csv)"** button lets *that visitor* export
  everything they've written, as a CSV file, onto their own computer.
- Nothing is sent anywhere automatically, and you (the site owner) won't
  see replies unless the visitor sends you that exported file.

**If you want every reply to land in one place automatically** (e.g. so you
personally collect all responses without asking people to export/send a
file), you need a small external endpoint, since GitHub Pages itself can't
receive form submissions. Two easy, free options:

- **Formspree** (formspree.io) — create a free form, drop its endpoint URL
  into `script.js` where `saveReply()` is called, and `fetch()`-POST the
  reply alongside saving it locally.
- **Google Form** — same idea: a hidden Google Form whose entry IDs you post
  to via `fetch()`, with responses landing in a Google Sheet you can export
  as CSV any time.

I left `saveReply()` as a single, small function in `script.js` specifically
so this is a one-function edit if you want to wire it up later — happy to
do that for you if you tell me which service you'd rather use.

## Deploying to GitHub Pages

1. Push this folder to a GitHub repo.
2. Repo → **Settings → Pages** → set source to the branch (e.g. `main`) and
   folder `/ (root)`.
3. Your site will be live at `https://<username>.github.io/<repo>/`.

That's it — no build step, no dependencies.

## Tuning the game

At the top of `script.js` (Part 1):

- `PILLARS_TO_WIN` — how many pillars to pass (currently 5)
- `GRAVITY`, `FLAP_VEL` — how floaty/snappy the bird feels
- `GAP_H`, `PIPE_SPEED` — how hard the pillars are
