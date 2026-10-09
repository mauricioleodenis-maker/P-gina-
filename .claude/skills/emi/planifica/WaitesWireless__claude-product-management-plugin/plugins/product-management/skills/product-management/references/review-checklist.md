# Pre circulation review checklist

Run this before sending a document to anyone. Report findings honestly, marking
each as **blocking** (the document will cause wrong work if circulated) or
**polish** (it will hold up, but it could be better).

Being a soft critic here is not kindness. The review either happens now, in
private, or later, in a room with an executive.

## Problem and justification

- [ ] The problem is stated before any solution appears
- [ ] The problem is described from the customer's side, not as an internal
      inconvenience
- [ ] There is evidence the problem is real: ticket volume, interview quotes,
      churn data, lost deals, a measurement. Not "stakeholders have requested"
- [ ] The cost of doing nothing is stated
- [ ] Every number has a source inline, including estimates labeled as estimates

## Success metrics

- [ ] At least one metric, at most three
- [ ] Each has a baseline (what it is today)
- [ ] Each has a target (what it should be)
- [ ] Each has a date (by when)
- [ ] Each is instrumented, or a task exists to instrument it. A metric nobody
      can measure on launch day is decoration
- [ ] At least one counter-metric, so the team notices if this makes something
      else worse
- [ ] None of them are output metrics disguised as outcomes. "Shipped the
      feature" and "80% of tickets closed" measure activity, not value

## Scope

- [ ] "Not in scope" exists and contains at least one thing someone actually
      wanted. An out of scope list that costs nothing means no scoping occurred
- [ ] An appetite or time budget is stated
- [ ] Phasing, if any, has real dates and not just "phase two"
- [ ] Every requirement traces to a stated objective
- [ ] Priority is marked per requirement (MoSCoW or equivalent), and Must is not
      more than about sixty percent of the effort

## Requirements

- [ ] Every requirement is numbered
- [ ] Every requirement is atomic: one thing, no hidden "and"
- [ ] Every requirement is testable. Pick three at random and try to write the
      test. If it cannot be written, it is blocking
- [ ] No banned words: fast, intuitive, seamless, robust, user friendly, simple,
      appropriate, as needed, support, handle, improve, optimize
- [ ] No implementation detail unless it is a business constraint with its reason
      attached
- [ ] Acceptance criteria present for each requirement or story
- [ ] Empty, loading, error, and permission denied states are specified
- [ ] Boundary cases specified: zero, one, maximum, over maximum
- [ ] What happens to existing data is addressed. Migration is the most commonly
      missed requirement in the entire document

## Non-functional requirements

- [ ] Performance targets carry a percentile, not an average
- [ ] Scale targets reflect the largest realistic customer, not the test fixture
- [ ] Security and authorization addressed, including who can see whose data
- [ ] Availability target stated, with what happens when it is not met
- [ ] Accessibility standard named
- [ ] Every NFR has a number or a named standard. None say "should be secure"

## Risk and reality

- [ ] The four big risks (value, usability, feasibility, viability) each have a
      line
- [ ] The riskiest assumption is named as such
- [ ] The tech lead has seen a sketch and answered "is this possible in [the
      appetite]," not just "is this possible"
- [ ] Rabbit holes identified and either patched, cut, or declared out of bounds
- [ ] Dependencies on other teams each have a named human and a date. "Platform
      team" is not a name
- [ ] Every open question has an owner and a resolve-by date
- [ ] Rollback or kill switch described. How does this get turned off at 2am

## Document hygiene

- [ ] Status, owner, approvers, and last updated date at the top
- [ ] Executive summary is three to five sentences and leads with the conclusion
- [ ] Acronyms defined on first use
- [ ] Reader can answer "what am I being asked to approve" within thirty seconds
- [ ] Change log at the bottom if the document has been revised
- [ ] Links to the parent document (PRD to BRD, ERD to PRD) are present
- [ ] No em dashes

## The three questions to ask last

Read the document once more as each of these readers:

1. **The executive.** "What am I approving, what will it cost, and what do I get?"
   If this takes more than thirty seconds to find, restructure the top.
2. **The engineer.** "What exactly am I building, and what am I not?" If there is
   a requirement they would have to come ask about, write the answer now.
3. **The QA engineer.** "How do I prove this works?" If a requirement cannot be
   turned into a test case, it is not a requirement yet.

If the document survives all three, circulate it.
