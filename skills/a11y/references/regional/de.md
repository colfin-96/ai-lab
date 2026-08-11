# Germany — BITV 2.0, BFSG, EN 301 549

Load when the profile lists `DE`. Additive on top of WCAG 2.2 A + AA, which stays the baseline.

**This is orientation, not legal advice.** A code review cannot establish legal conformance.
State findings in terms of the technical standard and let the organisation's own compliance
people reach legal conclusions.

## Which law applies depends on the sector

This is why `init` asks, and it is not inferable from code.

| Sector | Law | Applies to |
|---|---|---|
| **Public** | BITV 2.0 | Public bodies (*öffentliche Stellen*) — websites, mobile apps, electronic administrative processes, graphical user interfaces (§ 2(1)) |
| **Private** | BFSG | Private-sector products and services — online shops, banking, e-commerce platforms, consumer software. In force since **28 June 2025** |

The BFSG is Germany's transposition of the European Accessibility Act. Both routes point at the
same technical standard.

## The technical standard: EN 301 549

Neither law spells out criteria itself. BITV 2.0 § 3(2) requires conformance with the harmonised
standards published in the EU Official Journal, and § 3(3) adds that anything those standards do
not cover must follow the state of the art. In practice this means **EN 301 549**, whose clause 9
("Web") incorporates the WCAG success criteria at **Levels A and AA**.

EN 301 549 has tracked WCAG 2.1; the version aligned with the BFSG moves to WCAG 2.2. This is
comfortable rather than awkward, because **WCAG versions are cumulative**: 2.2 contains all of
2.1 and 2.0. Targeting WCAG 2.2 A + AA — what this skill audits — satisfies the 2.1 A + AA
requirement as a superset. The one criterion that existed in 2.1 and not 2.2 is 4.1.1 Parsing,
which W3C removed as obsolete; do not report against it.

So for web code, **WCAG 2.2 A + AA is the whole of the technical delta.** There is nothing extra
for the seven members to check on the web-content side.

Other clauses that may apply depending on what is being built: clause 11 (non-web software),
clause 12 (documentation and support services), clause 5 (generic requirements, including closed
functionality). An Angular web application is clause 9 territory; an Electron desktop build or an
embedded UI reaches clause 11.

## BITV 2.0 additions beyond WCAG — public sector only

§ 4 requires, **on the home page**, explanations in German Sign Language (*Deutsche
Gebärdensprache*, DGS) and in Easy Language (*Leichte Sprache*), covering the content of the
offering and how to navigate it. Anlage 2 sets out the details:

- **DGS video** (Anlage 2, Part 1) — minimum 320 × 240 pixels, minimum 25 frames per second,
  static background, facial expression clearly visible.
- **Leichte Sprache** (Anlage 2, Part 2) — thirteen requirements, including no abbreviations,
  short sentences with clear structure, and a font size of at least 1.2 em.

These are **content deliverables, not code defects.** A frontend review can observe that no DGS
video or Easy Language page appears to exist, and can check the font-size requirement in CSS —
but producing a sign-language video and Easy Language copy is editorial work requiring qualified
people. Report the observation, name it as out of scope for code, and do not file it as a fixable
finding.

## Not checkable here

List these in the report footer when this overlay is loaded, so nothing reads as a conformance
certificate:

- Presence and quality of a DGS video and Easy Language content (public sector, BITV § 4)
- Whether Easy Language copy actually meets Anlage 2's linguistic requirements — a human
  judgement about German prose
- The **accessibility statement** (*Erklärung zur Barrierefreiheit*) and its accuracy
- The reporting and enforcement mechanism (*Feedback-Mechanismus* / Schlichtungsstelle route)
- Whether the organisation is in fact a public body, or in scope of the BFSG at all
- EN 301 549 clauses beyond the web: documentation, support services, hardware, closed
  functionality
- Conformance of third-party embedded content

## Reporting under this overlay

Because the web-content delta is exactly WCAG A + AA, a DE jurisdiction does not add new
criteria for the members to check. What it changes is the *framing*: a Level A or AA failure is
not merely a quality issue but a gap against the standard the applicable law points to. Where a
finding matters more under this overlay, say why — that is the whole value of loading it.

If a finding relates only to a BITV addition rather than a WCAG criterion, mark it `advisory`
with a note that it is a regional obligation and not a WCAG failure. The two axes stay
meaningful only if `AA-violation` continues to mean exactly that.

## Sources

- BITV 2.0 — <https://www.gesetze-im-internet.de/bitv_2_0/BJNR184300011.html>
- BFSG (Barrierefreiheitsstärkungsgesetz) — <https://bfsg-gesetz.de/>
- Bundesfachstelle Barrierefreiheit, BFSG FAQ —
  <https://www.bundesfachstelle-barrierefreiheit.de/DE/Fachwissen/Produkte-und-Dienstleistungen/Barrierefreiheitsstaerkungsgesetz/FAQ/faq_node.html>
- WCAG 2.2 — <https://www.w3.org/TR/WCAG22/>

Verified against these sources on 2026-08-11. Legislation changes and EN 301 549 is revised;
re-check before relying on the dates and version claims above.
