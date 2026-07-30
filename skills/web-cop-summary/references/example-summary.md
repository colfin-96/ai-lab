# Example: raw notes → posted summary

Fictional meeting, used only to show the transformation.

## Raw input

```
* Web CoP notes 260412
   * charts: status stays as discussed - chartlib v4 works for us and we won't buy
     the v5 licence for now, we won't switch to another lib or another approach.
     still too early to decide. wait until september then reevaluate. until then v4
   * node 24 bump delayed until we have more clarity on charts, need compat check
   * Alex showed a codegen demo - components on the fly, PR will follow
   * Sam showed https://example.com/design-linter
*
```

## Posted output

```
Web CoP Summary - 12 April 2026
Topics:

• Chart library:
    ◦ Unchanged: chartlib v4 still covers our needs and stays the version to use.
    ◦ No v5 licence purchase and no switch to another library or approach for now — too early to decide.
    ◦ We re-evaluate in September.
• Node 24 upgrade:
    ◦ Delayed until the chart library direction is clear, including a compatibility check.
• Component codegen (Alex):
    ◦ Generates components on the fly. A PR will follow.
• Design linter (Sam):
    ◦ https://example.com/design-linter — one sentence on what the tool actually is, written after fetching the page.
```

The indentation above is four U+00A0 non-breaking spaces, not plain spaces.

## What the rewrite did

- Four flat note lines → four topics, seven bullets total, no third level.
- Merged the two "we won't …" clauses into one bullet; kept the September date
  as its own bullet because dates are decisions.
- Cut meeting-speak: "status stays as discussed" → "Unchanged:".
- Fetched the shared link and replaced the bare URL with one sentence on what it
  is — the notes alone did not say.
- Attribution moved into the heading (`Component codegen (Alex):`) so the bullet
  is content only.
- Dropped the trailing empty bullet. Added no rationale that was not in the notes.
