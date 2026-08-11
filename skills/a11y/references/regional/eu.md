# European Union — EAA, Web Accessibility Directive, EN 301 549

Load when the profile lists `EU` (any EU member state without its own overlay file). Additive on
top of WCAG 2.2 A + AA, which stays the baseline.

**This is orientation, not legal advice.** A code review cannot establish legal conformance. State
findings in terms of the technical standard and let the organisation's own compliance people reach
legal conclusions.

Where a member state has its own overlay (`de.md`), load that too — national transpositions add
detail the EU-level directives do not.

## Two directives, and which one applies depends on the sector

| Sector | Instrument | Applies to |
|---|---|---|
| **Public** | Web Accessibility Directive (WAD), Directive (EU) 2016/2102 | Public sector bodies' websites and mobile applications |
| **Private** | European Accessibility Act (EAA), Directive (EU) 2019/882 | Consumer-facing products and services — e-commerce, banking, e-books, transport, telecoms, and the software that delivers them. Enforceable since **28 June 2025** |

Both are directives, not regulations: they bind member states to transpose them into national law,
and it is the national law that is enforced. The EAA covers **both** sectors in scope terms; the
WAD is the public-sector-specific instrument. A design-system library shipped to customers in both
sectors inherits the stricter of whatever its consumers are subject to.

Neither directive spells out success criteria itself. Both point at the same harmonised standard.

## The technical standard: EN 301 549

Conformance with EN 301 549 creates a legal **presumption of conformity** under both the WAD and
the EAA. That is what makes it the operative technical reference rather than the directives'
own prose.

Clause 9 ("Web") incorporates the WCAG success criteria at **Levels A and AA**. Clause 10 covers
non-web documents, clause 11 non-web software; both also carry WCAG-derived requirements. An
Angular web application is clause 9 territory.

**Version state, as of 2026-08-11:**

| Version | Status | WCAG baseline |
|---|---|---|
| **v3.2.1** (March 2021) | the currently harmonised version, cited in the Official Journal | WCAG 2.1 Level AA verbatim for web content |
| v4.1.0 | draft, public enquiry November 2025 | WCAG 2.2 (normative reference to the December 2024 revision) |
| **v4.1.1** | expected to be cited in the OJEU around **October 2026** | WCAG 2.2 Level AA |

This is comfortable rather than awkward, because **WCAG versions are cumulative**: 2.2 contains all
of 2.1 and 2.0. Auditing against WCAG 2.2 A + AA — what this skill does — satisfies the currently
harmonised 2.1 A + AA requirement as a superset, and lands the repo on the v4 baseline before it
becomes mandatory.

The one criterion in 2.1 and not 2.2 is **4.1.1 Parsing**, which W3C removed as obsolete. Do not
report against it even under a v3.2.1 framing.

The six criteria that arrive with the v4 baseline are exactly the ones new in WCAG 2.2 — two Level
A (3.2.6 Consistent Help, 3.3.7 Redundant Entry) and four Level AA (2.4.11 Focus Not Obscured,
2.5.7 Dragging Movements, 2.5.8 Target Size, 3.3.8 Accessible Authentication). Treat findings
against these as the highest-yield ones under this overlay: they are not yet mandatory, they are
about to be, and almost nothing in existing codebases has been checked against them.

## What the directives add beyond WCAG

Neither adds success criteria for web content. What they add is process and documentation:

- **Accessibility statement** — the WAD requires public sector bodies to publish a detailed,
  regularly updated statement covering non-accessible content, reasons, and alternatives
  (Commission Implementing Decision (EU) 2018/1523 sets the model).
- **Feedback mechanism** — a route for users to report barriers and request accessible
  alternatives, plus an enforcement procedure.
- **EAA conformity documentation** — for products and services in EAA scope: technical
  documentation, EU declaration of conformity, and information on how the product meets the
  requirements.
- **Monitoring and reporting** — member states report to the Commission on a defined methodology
  (Implementing Decision (EU) 2018/1524).

These are organisational deliverables, not code defects. A frontend review can note that no
accessibility statement route appears to exist, but producing and maintaining one is compliance
work. Report the observation, name it out of scope for code, do not file it as a fixable finding.

## Not checkable here

List these in the report footer when this overlay is loaded, so nothing reads as a conformance
certificate:

- The **accessibility statement** and its accuracy
- The **feedback mechanism** and enforcement route
- **EAA conformity documentation** — technical file, EU declaration of conformity
- Whether the organisation is in fact a public sector body under the WAD, or in EAA scope at all
- Which member state's transposition applies, and any national additions beyond the directive
  (see `de.md` for Germany's — BITV 2.0's sign-language and Easy Language duties have no
  EU-level equivalent)
- Whether a **disproportionate burden** exemption has been claimed and documented
- EN 301 549 clauses beyond the web: documentation, support services, hardware, closed
  functionality, real-time communication
- Conformance of third-party embedded content
- Non-web software and document clauses (10, 11) if the codebase also ships those surfaces

## Reporting under this overlay

The web-content delta is WCAG A + AA, so an EU jurisdiction adds no new criteria for the members
to check. What it changes is the *framing*: a Level A or AA failure is a gap against the standard
that carries the presumption of conformity under the directive the organisation is subject to.

For a **library or design system** — as opposed to a deployed site — the framing shifts once more.
The library itself is not the regulated entity; its consumers are. A Level A failure baked into a
shared navigation component propagates into every product built on it, and each of those products
inherits the failure. Say so where it applies: the leverage of fixing it once at the library level
is the argument.

If a finding relates only to a directive's process obligations rather than a WCAG criterion, mark
it `advisory` with a note that it is a regional obligation and not a WCAG failure. The two axes
stay meaningful only if `AA-violation` continues to mean exactly that.

## Sources

- Web Accessibility Directive (EU) 2016/2102 —
  <https://eur-lex.europa.eu/eli/dir/2016/2102/oj>
- European Accessibility Act, Directive (EU) 2019/882 —
  <https://eur-lex.europa.eu/eli/dir/2019/882/oj>
- W3C WAI, EU policies overview — <https://www.w3.org/WAI/policies/european-union/>
- EN 301 549 v3.2.1 (European Commission, Accessible EU Centre) —
  <https://accessible-eu-centre.ec.europa.eu/content-corner/digital-library/en-3015492021-accessibility-requirements-ict-products-and-services_en>
- EN 301 549 overview and version history — <https://en.wikipedia.org/wiki/EN_301_549>
- EN 301 549 v4.1.0 public enquiry / WCAG 2.2 alignment —
  <https://eaacompliance.com/blog-news-en301549-v410-wcag22.html>
- WCAG 2.2 — <https://www.w3.org/TR/WCAG22/>

Verified against these sources on 2026-08-11. The v4.1.1 harmonisation date is an expectation, not
a fact — re-check the Official Journal before relying on it. Legislation changes and EN 301 549 is
revised; re-check before relying on the dates and version claims above.
