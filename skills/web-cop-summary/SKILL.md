---
name: web-cop-summary
description: >-
  Turn raw Web CoP (Community of Practice) meeting notes into a Teams-ready
  summary in the user's established house style — "Web CoP Summary - DD Month
  YYYY", a "Topics:" line, and short grouped bullets stating what was decided.
  Use whenever the user pastes notes from a Web CoP / web
  community of practice / frontend guild meeting and wants them formatted,
  summarized, cleaned up, or made ready to post in Teams — including phrasings
  like "format my web cop notes", "write the CoP summary", "make this postable",
  or when they paste bullet notes and reference a previous summary as the target
  style. Do not use for generic meeting minutes unrelated to the Web CoP.
---

# Web CoP Summary Formatter

Convert raw, shorthand meeting notes into the summary message the user posts in
Microsoft Teams after each Web CoP.

The output is short. A colleague skims it in under a minute and knows what was
decided. Brevity beats completeness: if a bullet does not change what someone
does or knows, cut it.

## Input

The user pastes raw notes. They may include:

- A date line (e.g. `Web CoP notes 260730` → 30 July 2026, `YYMMDD`).
- Nested bullets of varying depth and quality.
- Trailing empty bullets — drop them silently.
- Presenter names and URLs.

If the date is not derivable from the notes, ask for it. Never guess.

## Look up shared links

Every URL in the notes gets fetched before writing. A bare link in the summary is
useless to anyone who was not in the meeting. Replace it with one sentence saying
what the thing is, then the link. If the fetch fails, say the link could not be
checked rather than describing it from the domain name.

## Output format

Teams does **not** convert Markdown on paste. Pasting `* item` puts a literal
asterisk in the message. So the summary uses real Unicode bullet characters and
non-breaking-space indentation, which paste through unchanged:

- `•` (U+2022) for top-level topics, no indent.
- `◦` (U+25E6) for nested points, indented with four non-breaking spaces
  (U+00A0) — regular spaces get collapsed by the composer.
- Never `*`, `-`, `+`, or a numbered list.

Skeleton (the indentation below is four U+00A0 characters):

```
Web CoP Summary - 30 July 2026
Topics:

• Topic heading:
    ◦ Point about the topic.
    ◦ Another point.
• Next topic heading:
    ◦ Point.
```

Rules for the skeleton:

- Title line: `Web CoP Summary - DD Month YYYY` — day without leading zero,
  month spelled out in English, hyphen with spaces around it.
- `Topics:` on its own line, then one blank line.
- Every top-level bullet is a topic heading ending in a colon.
- Standalone one-liners (a demo, a link) still get a top-level topic heading with
  the detail nested underneath — do not put loose sentences at top level.
- Two levels only. A third level would need a third marker and reads badly in
  Teams; fold it into the parent bullet instead.
- No bold, no headings, no horizontal rules.
- URLs bare, not Markdown links. Teams attaches a link-preview card to the
  message — tell the user they can dismiss it with the × on the card.

Emit the message inside a fenced block so the copy button yields plain text.
After the block, remind the user: paste into Teams with **Ctrl+Shift+V**
(Cmd+Shift+V on macOS) to paste unformatted — a normal paste can carry the code
font over from the source.

If the user would rather have native Teams list formatting, they have to type it
in the composer: typing `- ` at the start of a line auto-converts to a real
bullet list, and Tab indents. That cannot be achieved by pasting.

## Length budget

- One to two sentences per bullet. Never a paragraph.
- Two to four bullets per topic. A topic needing more is really two topics.
- Sub-bullets only when a point genuinely qualifies the one above it — most
  topics have none.
- A demo or a shared link is one bullet, not a group of three.

## Rewriting rules

1. **Group before writing.** Merge fragments that belong to one subject into a
   single topic, even if they were separate lines in the notes. Order topics by
   weight: decisions and things affecting everyone's daily work first, demos and
   link-shares last.
2. **Compress, don't expand.** Shorthand becomes a clean sentence, not a longer
   one: `lib v3 works for us` → "Version 3 still covers our needs." Expand
   abbreviated product names to their proper spelling, and keep that spelling
   consistent across the message. Cut hedging and meeting-speak — "it was
   discussed that", "we came to the conclusion that", "at this point in time".
3. **One decision per bullet, stated flat.** What was decided, plus the date if
   there is one. Merge related decisions into one bullet when they share a
   subject ("no upgrade purchase and no library switch for now").
4. **Status-update carry-overs.** When a topic already appeared in an earlier
   summary, lead with the status ("Unchanged: …") and skip the background.
5. **Attribute demos in the heading**, e.g. `<Tool name> (<presenter>):`, so the
   bullet below can be pure content. Use whatever name form the notes use —
   first names if that is the team's habit.
6. **Add nothing.** No invented rationale, no numbers, no action owners that
   aren't in the notes. If a note is too cryptic to compress safely, keep it
   close to verbatim and list it under "Unclear from the notes" after the
   summary (outside the message body) so the user can fill it in.

## Procedure

1. Parse the date; ask if absent.
2. Fetch every URL in the notes.
3. Cluster raw bullets into topics; discard empties.
4. Draft each topic: heading, then its two to four bullets.
5. Cut pass — delete every bullet that does not change what a reader does or
   knows, then shorten what remains.
6. Emit the message in a fenced block so the user can copy it cleanly.
7. Below the block, list any open questions or notes you could not compress.

See `references/example-summary.md` for a full input → output pair.
