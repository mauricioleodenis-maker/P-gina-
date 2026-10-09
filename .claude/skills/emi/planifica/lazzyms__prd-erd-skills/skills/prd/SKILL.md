---
name: prd
description: >
  Create or update a Product Requirements Document (PRD) — a structured product
  spec covering the problem, supporting evidence, success metrics, audience and
  personas, what gets built, user journeys, scope, milestones, and go-to-market.
  Use this skill whenever the user asks to write, structure, scope, or refine a
  PRD, product requirements, a product spec, a feature brief, or a research plan
  — or describes a new product or feature that should be planned before
  engineering starts. Writes a structured Markdown document. This is the
  product-side planning step that precedes the Engineering Requirements Document
  (ERD).
---

# Product Requirements Document (PRD)

Turn a product idea, feature request, or research question into a **Product
Requirements Document (PRD)**: a single, detailed, versioned document that
captures the problem, who has it, how success is measured, exactly what gets
built, and how and when it ships. The PRD is the product-side source of truth.
Engineering later writes an Engineering Requirements Document (ERD) *against*
this PRD, so gaps and hand-waving here become bugs and rework later.

## Philosophy — Why This Structure

A structured, planning-first approach prevents the expensive problems —
miscommunication, scope creep, and quality misses — that show up late in
fast-moving teams. The reasoning is worth internalizing, because it tells you
when to bend the template:

- **The document is cheap; the rework it prevents is not.** A little structure up
  front saves disproportionate pain downstream.
- **The devil is in the details.** Depth of thought here compounds into long-term
  product success. When unsure whether to spell something out, spell it out.
- **One PRD per product, updated in place.** Do not spawn a new doc per feature;
  extend the product's existing PRD and lean on version history so the evolution
  stays legible.
- **Separate facts from assumptions.** Mark what is known, what is assumed, and
  what is still an open question. Decisions made on assumptions should say so.
- **Write down the considerations you weighed**, especially for experimental
  bets — the rejected options are as informative as the chosen one.

## When To Use / When To Hand Off

Use this skill when the user wants to **define or refine what to build and why**:
writing or updating a PRD, product spec, feature brief, or research plan; scoping
a new product or feature; or turning a rough idea into something an engineer
could be briefed on.

Hand off to the **`erd` skill** once the PRD is approved and the question shifts
to *how to build it* — implementation plan, technical design, data model,
architecture. The PRD answers **what and why**; the ERD answers **how**. Don't
pull engineering-design detail into the PRD; reference it as a forward link.

## Workflow

1. **Capture intent.** Clarify the product/feature, audience, and scope only where
   ambiguity is genuinely blocking. If a useful assumption is low-risk, state it
   in the PRD (labeled as an assumption) rather than stalling to ask.
2. **Gather evidence before writing.** This is what makes the *Why* and *Success*
   sections real instead of decorative. Read relevant code, docs, analytics,
   tickets, or prior PRDs; for external claims, use reliable sources and cite
   them. Come to the draft with data, not vibes.
3. **Draft the PRD** using the section template below. Compose the sections the
   product actually needs in the order given; include the optional sections only
   when they carry weight. Be concrete — name metrics, personas, edge cases, and
   dates rather than gesturing at them.
4. **Pick the output format** (see *Output Format*). Default to Markdown.
5. **Keep it single and versioned.** If a PRD for this product already exists,
   update it in place and note what changed rather than creating a parallel doc.

## PRD Template

Compose the sections below in this order. The first nine are the spine of nearly
every PRD; the rest are included when they earn their place. Each section says
what it is *for* — use that to judge depth, and skip a section only when it truly
does not apply (say so explicitly rather than leaving a silent gap).

1. **[Product / Feature Title]** — the high-level name of what is being built.

2. **Description — What is it?** A high-level elevator pitch a non-product or
   non-technical reader could skim and immediately get. One short paragraph.

3. **Problem — What problem is this solving?** Why this is being built, *who*
   faces the problem (the persona), and which actors — users or system
   participants — are affected. A PRD that can't name the problem crisply isn't
   ready.

4. **Why — How do we know this is a real problem?** The data or stated
   assumptions backing the problem, plus any requirements handed over from other
   teams. Distinguish hard data from assumption explicitly.

5. **Success — How do we know if we've solved it?** The objective measurement
   approach: specific metrics with precise definitions — what is counted, over
   what window, for whom. Vague success criteria are the most common PRD failure;
   make these measurable.

6. **Audience — Who are we building for?** Detailed persona definitions, plus the
   targeting/retention information they imply (notifications, lifecycle messaging,
   segments).

7. **What — What does this look like in the product?** The heart of the PRD.
   Cover, as sub-sections:
   - **Key features** — described in as much detail as you can muster.
   - **User journeys** — every meaningful user state and path, including entry
     and exit.
   - **Design link** — reference to the design source of truth (e.g. Figma).
   - **Product copy** — the actual messaging and microcopy.
   - **Out of scope** — explicit exclusions, so "not now" is on the record.
   - **Future considerations** — features deliberately deferred to later.
   - **Constraints and dependencies** — technical or feature limitations that
     shape the solution.
   - **Edge / corner cases** — specific state transitions and how they resolve.

8. **How — What is the experiment plan?** For experimental features: the
   investigation method and the control mechanism (e.g. feature flag, holdout).
   Skip for non-experimental work, but say you're skipping it.

9. **When — When does it ship?** Project phases with milestones and tentative
   dates. A single milestone/metric is fine if that's the honest picture.

10. **Open Questions** *(optional)* — raw unresolved questions and lines of
    thought to revisit. Better recorded than lost.

11. **Non-Visual Product Requirements** *(optional)* — push notifications,
    emails, and other messaging systems; copy exploration for them.

12. **Third-Party Tools** — external services this depends on and what each is
    relied on for.

13. **Is Seeding Required?** *(optional)* — manual intervention needed from
    growth, content, ops, or other teams to make the feature usable at launch.

14. **Go To Market** *(optional)* — GTM strategy, risk assessment with
    mitigations, and a launch checklist.

15. **Glossary** — definitions for new or specialized terminology so every reader
    shares the same vocabulary.

## Output Format

Write the PRD as **Markdown** by default. Markdown is portable, diff-friendly, and
easy to version in Git — which fits a living product document that gets updated in
place. Use clear headings for each section, tables for metrics and scope, and
labels such as `Known` / `Assumption` / `Risk` / `Open Question` to keep certainty
visible.

If the user asks for a different format (for example HTML, a slide outline, or a
doc to paste into their wiki), produce that instead — the template above is the
source of truth; the format is just presentation. When the destination is unclear,
default to Markdown and mention they can ask for another format.

## Handoff To The ERD

Close the PRD by pointing forward: once it's approved, the **`erd` skill** picks
it up to produce the Engineering Requirements Document — the technical design,
data models, architecture, and interface logic built *against* this PRD. When the
user signals approval and asks for an implementation plan, technical design, or
ERD, that skill takes over and will ingest this document.
