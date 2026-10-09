# Engineering Requirements / Technical Design: [Name]

| | |
|---|---|
| **Status** | Draft / In review / Approved |
| **Author** | [Tech lead] |
| **Reviewers** | [Names] |
| **Last updated** | [YYYY-MM-DD] |
| **Parent PRD** | [Link] |

*Normally authored by the tech lead. A PM uses this template to know what to
expect and what to push on during review.*

---

## 1. Summary

What is being built, in three to five sentences, at a level a senior engineer on
another team could follow.

## 2. Requirements covered

| PRD requirement | How this design satisfies it |
|---|---|
| FR-1 | |
| NFR-1 | |

Every requirement in the PRD appears here, or the gap is stated explicitly with
a reason. This table is the main thing a PM checks.

## 3. Current state

How the relevant part of the system works today, and why it does not meet the
requirement. Include what already exists that can be reused.

## 4. Proposed design

Architecture, with a diagram. Components, responsibilities, and how they
interact.

### Data model

New tables, columns, and relationships. Changes to existing ones.

### Migrations

What happens to existing data, how long the migration takes, whether it can run
online, and whether it is reversible.

### API contracts

| Endpoint | Method | Request | Response | Error cases |
|---|---|---|---|---|

Include status codes, pagination, and auth requirements. Note any change that is
observable to an existing caller, since that is a compatibility break.

### Sequence for the primary flow

Step by step, including what happens between services.

## 5. Alternatives considered

| Option | Why rejected |
|---|---|

A design doc with no rejected alternatives usually means only one option was
considered.

## 6. Non-functional analysis

Address each NFR from the PRD with actual reasoning, not acknowledgment.

| NFR | Target | How this design meets it | Confidence |
|---|---|---|---|
| NFR-1 | p95 < 300ms | [Expected query cost, caching, measured comparable] | |

If a target cannot be met, say so now. That is a scope conversation, and it is
much cheaper before the build than after.

## 7. Security and privacy

- Authentication and authorization model. Who can access what, enforced where.
- Data classification: what sensitive data is involved.
- Encryption in transit and at rest.
- Audit logging.
- Tenant isolation, if multi-tenant.
- New attack surface introduced.

## 8. Failure modes

| What fails | Detection | User impact | Behavior | Recovery |
|---|---|---|---|---|

Include partial failure and degraded operation, not only total outage.

## 9. Observability

- Metrics emitted, and where they are visible
- Log events and correlation strategy
- Alerts, with thresholds and who is paged
- The query someone runs at 3am to find out what went wrong

## 10. Rollout and rollback

- Feature flag or deployment strategy
- Migration ordering and backward compatibility during deploy
- Rollback procedure and how long it takes
- What cannot be rolled back (data migrations, external calls) and how that is
  handled

## 11. Testing

- Unit, integration, and end to end coverage
- How the NFR targets get verified, specifically
- What will be tested manually and why
- What is honestly out of reach to test, and the risk that leaves

## 12. Work breakdown

| Task | Estimate | Dependency | Owner |
|---|---|---|---|

Broken down far enough to be believable. A single line reading "build feature:
6 weeks" is not an estimate.

## 13. Open technical questions

| Question | Owner | Resolve by | Blocks |
|---|---|---|---|

## 14. Change log

| Date | Change | Author |
|---|---|---|
