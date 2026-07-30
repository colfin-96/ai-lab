# Example: raw notes → posted summary

## Raw input

```
* Web CoP notes 260730
   * Prime: status stays as discussed - primeng21 works for us and we won't buy
     prime 22 for now, we won't switch to another library or to another approach.
     still too early to make a decision. We wait until october and then reevaluate.
     Until then, use prime21
   * Angular update will be delayed until we have more clarity on prime and we
     need to check for compatibility
   * Tim showed A2UI - component generation on the fly, PR will follow
   * Janik showed https://impeccable.style/
*
```

## Posted output

```
Web CoP Summary - 30 July 2026
Topics:

• PrimeNG:
    ◦ Unchanged: PrimeNG 21 still covers our needs and stays the version to use.
    ◦ No PrimeNG 22 purchase and no switch to another library or approach for now — too early to decide.
    ◦ We re-evaluate in October.
• Angular update:
    ◦ Delayed until the PrimeNG direction is clear, including a compatibility check.
• A2UI (Tim):
    ◦ Generates components on the fly. A PR will follow.
• Impeccable (Janik):
    ◦ https://impeccable.style/ — a free design skill for AI coding agents (Claude, Copilot, Cursor) with automated checks and commands like /polish and /audit to catch generic "AI slop" UI.
```

The indentation above is four U+00A0 non-breaking spaces, not plain spaces.

## What the rewrite did

- Four flat note lines → four topics, nine bullets total, no sub-bullets.
- Merged the two PrimeNG "we won't …" clauses into one bullet; kept the October
  date as its own bullet because dates are decisions.
- Cut meeting-speak: "the status stays as discussed" → "Unchanged:".
- Fetched impeccable.style and replaced the bare link with one sentence on what
  it is — the notes alone did not say.
- Attribution moved into the heading (`A2UI (Tim):`) so the bullet is content only.
- Dropped the trailing empty bullet. Added no rationale that was not in the notes.
