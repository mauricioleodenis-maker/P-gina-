# Document types: what each one is for

The confusion between these documents is the most common source of wasted PM
effort. Each answers a different question for a different reader. The chain runs
**why** (BRD) to **what** (PRD) to **how** (ERD).

## The chain

| Doc | Question | Owner | Primary reader | Approves |
|---|---|---|---|---|
| One-pager / PR-FAQ | Should we do this at all? | PM | Exec, peers | Go / no-go |
| BRD (Business Requirements Document) | Why is this worth money? | PM or BA | Exec, finance, sponsor | Funding |
| PRD (Product Requirements Document) | What must it do? | PM | Engineering, design, QA | Scope |
| ERD / tech spec | How will we build it? | Tech lead | Engineering, architecture | Design |
| Test plan | How do we prove it works? | QA | QA, PM | Release |

A useful discipline: each document should be traceable to the one above it.
Every PRD requirement should map to a BRD objective. Every ERD component should
map to a PRD requirement. Anything that maps to nothing is scope creep with good
manners, and it is the easiest thing to cut in a scope negotiation.

Not every project needs the full chain. A small feature on an existing product
needs a one-pager and acceptance criteria, nothing else. Reserve the full chain
for work that crosses teams, needs budget, or carries real risk.

---

## One-pager

The default. Most work should start and end here.

**Contains:** problem, who has it and how often, proposed solution in three
sentences, success metric with baseline and target, appetite (time budget), what
is explicitly out of scope, open questions with owners.

**Deliberately excludes:** detailed requirements, wireframes, architecture,
anything that takes more than a couple of hours to write.

**Why it works:** it is cheap enough to throw away. The point of a one-pager is
to be killable. If a document takes two weeks to write, nobody will kill it in
review, and a bad idea proceeds because of sunk cost.

---

## PR/FAQ (Working Backwards)

Amazon's method for new products and major bets. Write the launch announcement
before building anything, then answer the hard questions it raises. Used to
develop Kindle, Prime, and AWS.

**Structure, roughly six pages:**

*Press release, one page, written as if the product already shipped:*

1. **Heading.** Product name and audience, one sentence.
2. **Subheading.** The specific customer segment and the key benefit, one sentence.
3. **Summary paragraph.** Date, availability, what it is, the value proposition.
4. **Problem paragraph.** The customer problem, in customer language, not internal
   language. Include the size of the affected population.
5. **Solution paragraph.** How it solves the problem, and why it beats the
   alternatives customers use today.
6. **Quotes and getting started.** One internal spokesperson quote, one
   hypothetical customer quote describing the benefit in their own words, and
   how a customer actually starts using it.

*Customer FAQ:* price, how it works, how to get support, where to buy, what
happens to their existing setup. Straightforward questions where the details
matter a lot.

*Internal FAQ:* the honest one. Competitive landscape, total addressable market,
unit economics, upfront investment, time to profitability, technical and legal
obstacles, third party dependencies, what has to be true for this to work, and
what would make it fail.

**The discipline:** if the press release is boring, the product is boring. If the
customer quote sounds like marketing rather than a person, the benefit is not
real yet. Rewrite the press release, not the product description. A first draft
should take a few hours, not a few days, so several concepts can be compared.

**When to use it:** new products, new markets, major platform bets. Overkill for
incremental features.

---

## BRD: Business Requirements Document

The business case. Strategic and financial, not technical. Its reader controls a
budget.

**Contains:**

- Executive summary, three to five sentences, conclusion first
- Business problem or opportunity, with evidence
- Business objectives, each measurable
- Success metrics with baseline, target, and date
- Scope at the capability level (not the feature level)
- Stakeholders and who signs off
- Cost estimate and expected return
- Assumptions, constraints, dependencies
- Risks with mitigation and owner
- Alternatives considered, including do nothing

**Deliberately excludes:** UI, user flows, field level requirements, architecture.
If it describes a screen, it belongs in the PRD.

**Common failure:** a BRD that is a feature list with a cover page. If the
document cannot survive the question "what happens to revenue or cost if we do
nothing," it is not a business case.

---

## PRD: Product Requirements Document

The core PM artifact. Translates the approved business objective into what the
product must do. Its readers are engineers, designers, and QA, and they will
read it looking for the specific thing they must build or test.

**Contains:**

- Status, owner, last updated, approvers
- Problem statement and the objective it serves (link to the BRD)
- Target users and the jobs they are trying to do
- Success metrics, with instrumentation named (which event, which dashboard)
- User stories or use cases, prioritized (MoSCoW works well here)
- Functional requirements, atomic and numbered for traceability
- Acceptance criteria per requirement
- Non-functional requirements with numbers
- User flows and states, including empty, loading, error, and permission denied
- Out of scope, explicitly
- Dependencies, each with a named owner and a date
- Open questions, each with a named owner and a date
- Release and rollout plan, including how it gets turned off

**Deliberately excludes:** database schema, class design, library choices, API
implementation. Say what the system must do, not how it does it. The exception is
a genuine business constraint ("must use the existing SSO provider because
procurement will not approve another vendor"), which belongs in constraints and
should say why.

**On numbering:** number every functional requirement (FR-1, FR-2) and every
non-functional one (NFR-1). It costs nothing and makes the ERD, the test plan,
the tickets, and the scope negotiation traceable. When someone asks "is FR-12
still in," the conversation takes ten seconds.

**Living document:** the PRD changes as the team learns. Keep a change log at the
bottom with date, what changed, and who approved it. An outdated PRD causes more
rework than a missing one, and the change log is what makes a mid-project scope
change a decision rather than an argument.

---

## ERD: Engineering Requirements Document (tech spec, design doc)

How the system will be built. **Usually written by the tech lead, not the PM.**
Know what good looks like so it can be reviewed, and know which parts to push on.

**Typically contains:**

- Summary and the PRD requirements it satisfies
- Current state and why it does not suffice
- Proposed architecture, with a diagram
- Data model and migrations
- API contracts, request and response shapes, error cases
- Third party and internal service dependencies
- Security and privacy considerations, data handling, authorization model
- Performance and scale analysis against the PRD numbers
- Failure modes, degradation behavior, and rollback plan
- Observability: what gets logged, what gets alerted on
- Alternatives considered and why they were rejected
- Testing approach
- Work breakdown and estimate
- Open technical questions

**What a PM reviews it for:** does every PRD requirement appear somewhere; are
the non-functional numbers actually addressed rather than acknowledged; is the
rollback plan real; are the estimates broken down far enough to be believable;
does the alternatives section show that more than one option was considered.

**What a PM does not review it for:** taste in technology. If the reason for a
technical choice is not understood, ask for the reason. Do not substitute
judgment.

---

## How they hand off

The handoff is where projects break. Two practices prevent most of it:

1. **Walk the document, do not send it.** Send the draft, then hold a review.
   Comments on a shared document tell you what people noticed. A review tells
   you what they misunderstood, and misunderstanding is what causes rework.
2. **Close the loop on every open question before the next document starts.**
   An open question in a PRD becomes an assumption in the ERD, which becomes a
   defect in QA, which becomes a surprise at launch. If a question cannot be
   closed, write the assumption explicitly and mark the requirement at risk.
