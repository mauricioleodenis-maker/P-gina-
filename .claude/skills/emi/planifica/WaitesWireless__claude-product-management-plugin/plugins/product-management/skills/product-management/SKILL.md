---
name: product-management
description: Write and review product documents (BRD, PRD, engineering requirements, one-pagers, PR/FAQ) and scope projects before committing engineering. Use when the user is scoping a project, writing or reviewing requirements, turning an exec ask into a spec, sizing or cutting scope, writing acceptance criteria or user stories, or prioritizing a backlog.
---

# Product management: scoping and requirements documents

Two jobs live here: **scope a project** (decide what is worth building and how much
of it) and **write the document** (make that decision legible to executives,
engineers, and QA). Scoping comes first. A well formatted document built on an
unexamined ask is worse than no document, because it launders a guess into a
commitment.

## The rule that matters most

**Do not draft until you can state the problem, the customer, and the measure of
success without using the word "better."**

An exec ask arrives as a solution ("build us a customer portal"). The job is to
walk it back to the problem, then forward again to a solution that can be
defended. If these sentences cannot be completed, the draft is not ready to start:

1. Today, **[who]** has to **[do what]**, which costs them **[what]**.
2. We believe **[change]** will cause **[measurable outcome]**.
3. We will know we were right when **[metric]** moves from **[X]** to **[Y]** by **[when]**.
4. We are deliberately not solving **[adjacent problem]** in this effort.

When pieces are missing, ask the user. Ask in one batch, not one at a time, and
propose a default answer for each so the user can correct rather than compose.
If the user cannot answer a question either, that is itself a finding: record it
as an open question with a named owner and a date, and keep drafting around it.
Never silently invent a number. An invented metric that reaches an exec deck is
the most expensive mistake available in this workflow.

## Step 1: Pick the document

Do not write more than the decision needs. Match the document to the audience and
the stage.

| Situation | Write | Length |
|---|---|---|
| Exec ask, still deciding whether to do it at all | One-pager or PR/FAQ | 1 to 6 pages |
| Funding or headcount approval needed, business case must stand alone | BRD | 3 to 8 pages |
| Decision is made, engineering needs to know what to build | PRD | 4 to 10 pages |
| PRD approved, engineering needs to agree on how to build it | Engineering requirements doc / tech spec | engineer authored |
| Small feature on an existing product | One-pager only | 1 page |

The common failure is writing a full PRD for something that needed a one-pager,
and writing nothing at all for the thing that needed a BRD. A second failure is
one document trying to be all three: the exec skips the requirements, the
engineers skip the business case, and nobody reads the middle.

See `references/document-types.md` for what belongs in each, what must stay out,
and how the documents hand off to each other.

## Step 2: Scope before you specify

Scoping is subtraction. Run these in order:

1. **Set the appetite first.** Decide how much time this is worth *before*
   designing the solution, not after estimating it. "This is worth six weeks" is
   a business judgment a PM is qualified to make. Then design to fit. Fixed time,
   variable scope. The reverse (design, estimate, negotiate) produces the
   schedule slip that follows every PM into their performance review.
2. **Name the four risks.** Value, usability, feasibility, viability. Say which
   one is most likely to kill this and how it can be reduced cheaply. Teams
   reflexively test usability because prototypes are satisfying, and leave value
   and viability unexamined until launch.
3. **Hunt rabbit holes.** Walk the main use case in slow motion and look for the
   step where nobody knows what happens. Patch it in the document or declare it
   out of scope. An unnoticed rabbit hole is how a six week project becomes five
   months.
4. **Declare out of bounds explicitly.** A "Not in scope" section with real,
   tempting items is the highest value paragraph in any product document. Empty
   or obvious out of scope lists ("not building a mobile app") signal that no
   scoping happened.
5. **Prioritize what remains** with a framework appropriate to the decision, and
   show the inputs, not just the ranking.

See `references/scoping.md` for the risk taxonomy, the prioritization frameworks
with their actual formulas, appetite setting, and rabbit hole questions.

## Step 3: Draft

Start from the matching file in `templates/`. Templates are a floor, not a
ceiling: delete sections that do not apply to this project rather than filling
them with "N/A" or filler, and add sections the project genuinely needs.

While drafting, hold to the requirement quality bar in
`references/writing-requirements.md`. The short version:

- **Atomic.** One requirement states one thing. "User can upload an avatar" and
  "user can edit their display name," not "build a profile page."
- **Testable.** A requirement QA cannot fail is not a requirement. If the test
  cannot be written, rewrite the requirement.
- **Unambiguous.** One possible reading. Kill "fast," "intuitive," "seamless,"
  "robust," "user friendly," and "as needed."
- **Outcome, not implementation.** Say what must be true, not which library to
  use. Over specifying wastes the judgment of the people who were hired to have
  it. The line: constrain where the business genuinely cares, and nowhere else.
- **Quantified non-functionals.** Performance, scale, availability, security,
  and accessibility get numbers or they get ignored. See the NFR checklist.

## Step 4: Review before circulating

Run `references/review-checklist.md` against the draft and report what fails.
Be a critic here, not a cheerleader. Finding three weak requirements is the
service being asked for. "Looks good" is not. Specifically flag:

- Requirements that cannot be tested
- Any metric with no baseline, no target, or no date
- A "Not in scope" section that costs nothing
- Numbers with no cited source
- Solutions asserted where the problem was never stated
- Dependencies on another team with no named owner

State plainly which findings are blocking and which are polish.

## Working with the exec ask

Projects handed down by an executive team carry an unstated intent that is
usually more useful than the stated ask. Capture both. Write down the literal
request verbatim in the document, then the PM reading of the underlying goal, and
confirm that reading with the requester before scoping to it. This is the
cheapest available correction point. It also protects the PM: when scope is later
disputed, the document shows what was asked and what was understood.

Where the ask conflicts with what the evidence supports, say so in one or two
sentences in the document, then scope the thing that was asked for anyway under a
stated assumption. Overruling an executive is the requester's call. Going on
record is the PM's.

## Style

- Prose over bullet fragments for reasoning and context. Bullets and tables for
  requirements, criteria, and comparisons. A document that is entirely bullets
  hides the fact that nobody thought it through.
- Lead with the conclusion. Executives read the first paragraph and the table.
- Every number gets a source inline, including "PM estimate, low confidence."
- No em dashes. Use commas, colons, parentheses, or two sentences.
- Define each acronym on first use, including the ones that feel obvious.
- Mark the document status (Draft / In review / Approved), owner, and last
  updated date at the top. Treat it as living: outdated documents cause more
  rework than missing ones.

## Reference files

- `references/document-types.md`: BRD, PRD, ERD, one-pager, PR/FAQ. Purpose,
  audience, contents, boundaries, handoffs.
- `references/scoping.md`: appetite, four big risks, rabbit holes, RICE / ICE /
  MoSCoW / Kano / WSJF with formulas and when each is the wrong tool.
- `references/writing-requirements.md`: atomic requirements, user stories and
  INVEST, Given/When/Then acceptance criteria, the NFR checklist, banned words.
- `references/review-checklist.md`: pre circulation self review.
- `templates/`: brd.md, prd.md, erd.md, one-pager.md, prfaq.md.
