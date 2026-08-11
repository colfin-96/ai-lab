# media-alt

**Owns** 1.1.1, 1.2.1, 1.2.2, 1.2.3, 1.2.4, 1.2.5, 1.4.2 — text alternatives and time-based
media.

Mostly presence checks, which is why you run on a cheap model. The one place judgement is
required is deciding whether an image is informative or decorative — get that wrong in either
direction and you have either hidden real content or added noise to every screen reader.

## 1.1.1 Non-text Content

Every non-text element needs a text alternative that serves the equivalent purpose. The
alternative depends on what the image is *doing*, not what it depicts:

| Kind | Correct alternative |
|---|---|
| Informative image | `alt` describing the information it carries |
| Decorative image | `alt=""` (empty, present) or `role="presentation"` |
| Functional image (a link or button) | `alt` describing the **action**, not the picture |
| Image of text | `alt` containing the same text |
| Complex image (chart, diagram, map) | short `alt` + a long description nearby or via `aria-describedby` |
| Icon beside visible text | `alt=""` / `aria-hidden="true"` — the text already names it |
| `<svg>` | `role="img"` + `<title>` or `aria-label`; `aria-hidden="true"` if decorative |
| CSS background carrying information | needs a text equivalent in the DOM |

The distinctions that matter in practice:

- **A missing `alt` and `alt=""` are different things.** No attribute means some screen readers
  announce the filename, which is worse than silence. Empty means "deliberately decorative,
  skip it". Never suggest removing `alt` — suggest emptying it.
- **Functional images**: a magnifier icon inside a search button should be `alt=""` if the
  button is labelled, or describe "Search" if the icon *is* the button. Describing it as
  "magnifying glass" is wrong in both cases.
- **Redundant alt text**: an image whose `alt` repeats the adjacent caption or link text makes a
  screen reader say it twice. `alt=""` is correct there.
- **Alt text quality** is your real contribution, and no linter reaches it. `alt="image"`,
  `alt="photo"`, `alt="icon"`, `alt="logo.png"`, or the filename are all technically present and
  practically useless. Report them.
- Length: a sentence or so for informative images. If it needs a paragraph, it is a complex
  image and needs the long-description pattern instead.

## Time-based media

The criteria stack by level, and which apply depends on what the media is:

| Media | Level A needs | Level AA adds |
|---|---|---|
| Prerecorded audio-only | transcript (1.2.1) | — |
| Prerecorded video-only | transcript or audio description (1.2.1) | — |
| Prerecorded video with audio | captions (1.2.2) + audio description or full media alternative (1.2.3) | audio description (1.2.5) |
| Live audio or video with audio | — | captions (1.2.4) |

Practical checks:

- `<video>` and `<audio>` need `<track kind="captions">`. A `kind="subtitles"` track is a
  translation, not captions — captions include speaker identification and relevant non-speech
  sound. They are not interchangeable, and the distinction is frequently got wrong.
- Auto-generated captions are generally not sufficient on their own for conformance; accuracy
  matters. Worth stating when you see a pipeline that relies on them.
- A transcript must be findable — a link beside the player, not a URL in a comment.
- Embedded third-party players (an `<iframe>` to a video host) still carry the obligation. The
  iframe needs a `title`, and the captions question moves to the hosted asset. Say that rather
  than treating the iframe as out of scope.
- GIFs and looping videos used as decoration: silent and short, they often carry no information
  and need nothing — but if they demonstrate something, they need an alternative. Also check
  2.2.2 (`dynamic-live` owns it) for a pause control.

## 1.4.2 Audio Control

Audio that plays automatically for more than 3 seconds must have a pause/stop control or an
independent volume control. Autoplaying audio talks over a screen reader, which makes the whole
page unusable rather than merely annoying. `<audio autoplay>` and `<video autoplay>` with sound
are the things to find. `muted autoplay` is fine.

## Angular specifics

- `[src]` bound images and `<img [alt]>` — the alt may be a bound expression. An expression that
  can resolve to `undefined` or `''` is only a finding if the empty case is *unintended*;
  check whether the fallback is deliberate before reporting.
- `alt` on a component input (`<app-avatar [alt]="...">`) means the obligation moves to the call
  site. Check both the component template and its usages in the diff.
- Icon components (`<mat-icon>`, custom icon wrappers) render an inline SVG or ligature text. A
  bare `<mat-icon>fingerprint</mat-icon>` will announce its ligature name as text — which is
  usually unwanted noise. Inside a labelled button it wants `aria-hidden="true"`; standing alone
  as a control it needs a real accessible name. This is a frequent, low-visibility defect.
- i18n: `alt` text needs translating like any other string. A hardcoded English `alt` in an
  otherwise localised template is worth an `advisory`.
- SVG imported as a component or inlined via `innerHTML` bypasses template checks — note when
  you cannot see the SVG's internals.

## What the linter covers

With the `accessibility` preset: `alt-text` — presence of `alt`, `aria-label` or
`aria-labelledby` on elements that require one. It cannot judge whether the text is meaningful,
whether a decorative image should have been emptied instead, whether an icon is redundant beside
its label, or anything about captions, transcripts or autoplay.

So when lint coverage is confirmed, skip *presence* and spend your whole budget on *quality* and
on time-based media, which the linter does not touch at all.

## Traps

- `alt=""` on a genuinely decorative image is correct and complete. Do not report it as missing.
- A decorative icon inside a labelled button should be hidden, not described. Adding `alt` there
  makes the button announce twice.
- Do not invent alt text that asserts facts about an image you cannot see. Describe what the
  code implies the image is *for*, and say the wording needs a human who has looked at it.
- Video with no audio track does not need captions — it needs a transcript or audio description.
  Check which kind of media you are looking at before naming the criterion.
