# PRD: [Product or feature name]

| | |
|---|---|
| **Status** | Draft / In review / Approved |
| **Owner** | [Name] |
| **Last updated** | [YYYY-MM-DD] |
| **Approvers** | [Name, role] |
| **Parent BRD** | [Link, or "none"] |
| **Target release** | [Date or cycle] |

---

## 1. Summary

Three to five sentences. What we are building, for whom, why now, and what
success looks like. An executive who reads only this paragraph should be able to
repeat the gist accurately.

## 2. Problem

What is wrong today, from the customer's point of view. Include evidence:
support ticket volume, interview quotes, usage data, lost deals, time wasted.

State the cost of doing nothing.

**Requested by:** [If this came from an exec ask, quote the request verbatim
here, then state the underlying goal as understood, and note that the reading
was confirmed with the requester on [date].]

## 3. Objective and success metrics

The business objective this serves, in one sentence.

| Metric | Baseline (today) | Target | By when | How measured |
|---|---|---|---|---|
| [Primary metric] | | | | [Event, dashboard, or report] |
| [Secondary] | | | | |
| [Counter-metric] | | | | |

Include at least one counter-metric: the thing that must *not* get worse.

## 4. Users

| User type | What they are trying to do | Pain today | Volume |
|---|---|---|---|
| [Specific role] | | | [How many] |

## 5. Scope

**Appetite:** [e.g. six weeks, two engineers]

### In scope
Capability level, not feature level. Three to six bullets.

### Explicitly not in scope

| Not doing | Why | Revisit when |
|---|---|---|
| [Something people actually asked for] | | |

If nothing in this table is tempting, scoping has not happened yet.

## 6. Requirements

Priority: M = Must, S = Should, C = Could, W = Won't (this release).

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| FR-1 | [One atomic, testable statement] | M | See AC-1 |
| FR-2 | | S | |

### Acceptance criteria

**AC-1 (FR-1)**

```
Given [starting state and preconditions]
 When [one action]
 Then [observable result]
  And [additional observable result]
```

### States and edge cases

| Situation | Expected behavior |
|---|---|
| Empty state (no data yet) | |
| Loading | |
| Error / failure | |
| Permission denied | |
| Boundary: zero / one / maximum / over maximum | |
| Concurrent edit by two users | |
| Existing data / migration | |

## 7. Non-functional requirements

| ID | Category | Requirement | Source of the number |
|---|---|---|---|
| NFR-1 | Performance | [p95 target] | |
| NFR-2 | Scale | | |
| NFR-3 | Security | | |
| NFR-4 | Availability | | |
| NFR-5 | Accessibility | | |

## 8. User flows

Describe the primary flow step by step, or link to designs. Cover the entry
point, the main path, and how the user knows it worked.

## 9. Constraints and assumptions

| ID | Type | Statement | Reason / risk if wrong |
|---|---|---|---|
| C-1 | Constraint | | |
| A-1 | Assumption | | |

## 10. Dependencies

| What | Team | Named owner | Needed by | Status |
|---|---|---|---|---|

"Platform team" is not a named owner. Use a person.

## 11. Risks

| Risk | Type (value / usability / feasibility / viability) | Likelihood | Mitigation | Owner |
|---|---|---|---|---|

Name which risk is most likely to kill this.

## 12. Open questions

| ID | Question | Owner | Resolve by | Status |
|---|---|---|---|---|
| OQ-1 | | | | Open |

## 13. Rollout

- **Release approach:** [all at once / percentage rollout / beta cohort]
- **Feature flag:** [name, or why there is not one]
- **Rollback plan:** [how this gets turned off, and how fast]
- **Comms:** [who needs to know: support, sales, customers, docs]
- **Support readiness:** [what support needs to know and when they get it]

## 14. Change log

| Date | Change | Approved by |
|---|---|---|
