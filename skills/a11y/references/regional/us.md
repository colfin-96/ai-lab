# United States — Section 508, ADA

Load when the profile lists `US`. Additive on top of WCAG 2.2 A + AA, which stays the baseline.

**This is orientation, not legal advice.** A code review cannot establish legal conformance, and
US web accessibility obligations for private companies rest substantially on litigation and
settlement practice rather than a codified technical standard. State findings against the
technical standard and leave legal conclusions to the organisation's own counsel.

## Which regime applies depends on who the buyer is

This is why `init` asks about sector, and it is not inferable from code.

| Situation | Regime | Technical standard |
|---|---|---|
| Sold to or used by **US federal agencies** | Section 508 (Revised 2017 standards) | WCAG 2.0 Level A + AA, incorporated by reference |
| **State or local government** web content and mobile apps | ADA Title II final rule (DOJ, 24 April 2024) | WCAG 2.1 Level AA |
| **Private sector** — employers, places of public accommodation | ADA Titles I and III | No codified technical standard; WCAG 2.1 AA is the de facto reference in DOJ settlements and litigation |

**All three are satisfied by the WCAG 2.2 A + AA target this skill audits**, because WCAG
versions are cumulative — 2.2 contains all of 2.1, which contains all of 2.0. The single
exception is 4.1.1 Parsing, which existed in 2.0 and 2.1 and was removed as obsolete in 2.2. It
is deliberately absent from the criteria map; do not report against it. If a Section 508 audit
formally demands 4.1.1, that is a documentation question for the compliance team, not a code
defect to fix.

Note the direction of the version numbers: the *older* standard (Section 508, WCAG 2.0) is the
easier target, and the newer ones tighten it. Auditing at 2.2 is a superset of all of them, so
there is nothing to relax.

## ADA Title II compliance dates

The 2024 DOJ rule adopted WCAG 2.1 Level AA for state and local government web content and
mobile applications. An interim final rule subsequently extended the deadlines by one year:

| Entity | Deadline |
|---|---|
| Public entities with population ≥ 50,000 | 26 April 2027 |
| Public entities with population < 50,000, and special district governments | 26 April 2028 |

Dates move. Verify before relying on them in anything that matters.

## Section 508 additions beyond WCAG

The Revised 508 Standards incorporate WCAG 2.0 A + AA for electronic content and software, and
then add material that WCAG does not cover:

- **Chapter 3 — Functional Performance Criteria.** Outcome-based requirements: operation without
  vision, with limited vision, without perception of colour, without hearing, with limited
  hearing, without speech, with limited manipulation, with limited reach and strength, and with
  limited cognitive ability. These apply where the WCAG criteria do not fully address a feature,
  and they are assessed against the product as a whole rather than element by element.
- **Chapter 4 — Hardware.** Closed functionality, volume control, display screens, status
  indicators, operable parts, two-way voice communication. Irrelevant to a web app; relevant to a
  kiosk or embedded build.
- **Chapter 6 — Support documentation and services.** Documentation of accessibility features
  must itself be accessible, and support channels must accommodate users with disabilities.

**Non-web exemption worth knowing:** non-web documents and non-web software are exempt from four
success criteria — 2.4.1 Bypass Blocks, 2.4.5 Multiple Ways, 3.2.3 Consistent Navigation, and
3.2.4 Consistent Identification. This matters only for genuinely non-web deliverables (a PDF, a
desktop application). A web application does not get the exemption, so do not apply it to
`consistency`'s findings on a web target.

## Not checkable here

List these in the report footer when this overlay is loaded:

- Functional Performance Criteria as whole-product outcomes — a per-diff review cannot establish
  that a product is operable without vision end to end
- An **Accessibility Conformance Report** / VPAT, and whether its claims match reality
- Accessibility of support documentation and support channels (Chapter 6)
- Hardware and closed-functionality requirements (Chapter 4)
- Whether the entity is in scope of Title II, Title III, or federal procurement at all
- Conformance of third-party embedded content and vendor components
- Alternative-means-of-access arrangements and any undue-burden determinations

## Reporting under this overlay

The web-content delta is exactly WCAG A + AA, so a US jurisdiction adds no new criteria for the
members to check. What it changes is the framing: a Level A or AA failure is a gap against the
standard a procurement clause or a Title II obligation points to, and if the profile also lists
`DE`, both overlays are satisfied by the same fix — say so rather than filing twice.

Where a finding relates only to a Section 508 addition rather than a WCAG criterion, mark it
`advisory` and note it as a regional obligation. `AA-violation` needs to keep meaning exactly
what it says.

## Sources

- US Access Board, ICT Accessibility Standards — <https://www.access-board.gov/ict/>
- DOJ final rule, Title II web and mobile accessibility (Federal Register, 24 April 2024) —
  <https://www.federalregister.gov/documents/2024/04/24/2024-07758/nondiscrimination-on-the-basis-of-disability-accessibility-of-web-information-and-services-of-state>
- WCAG 2.2 — <https://www.w3.org/TR/WCAG22/>

Verified against these sources on 2026-08-11. The compliance dates in particular have already
been amended once — re-check before relying on them.
