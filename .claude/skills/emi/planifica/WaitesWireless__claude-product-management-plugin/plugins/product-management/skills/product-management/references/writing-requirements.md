# Writing requirements that survive contact with engineering

A requirement has one job: make it impossible for two competent people to build
different things from the same sentence.

## The five properties

Every requirement must be:

1. **Atomic.** One requirement, one thing. If it contains "and," suspect it.
2. **Testable.** Someone can write a test that passes or fails. If the test
   cannot be written, the requirement is an aspiration.
3. **Unambiguous.** Exactly one reading.
4. **Necessary.** Traceable to a stated objective. If it maps to nothing, it is
   scope creep and it is the first thing to cut.
5. **Implementation free.** States what must be true, not how to achieve it.

### Atomic, in practice

Bad:

> Build a user profile page where users can manage their account.

That is an epic wearing a requirement's clothes. Nobody can estimate it, test it,
or partially deliver it.

Good:

> - FR-1: A user can upload a profile image.
> - FR-2: A user can edit their display name.
> - FR-3: A user can change the email address on their account.
> - FR-4: A change to the account email requires confirmation from the new address before it takes effect.

Four requirements that can each be estimated, built, tested, and cut
independently. FR-4 is the one that would have been missed in the epic version,
and it is the one with a security consequence.

Atomic requirements are also what makes a document usable as input to an AI
coding tool or a ticket generator. A vague epic produces vague output from both
humans and machines.

### Testable, in practice

| Not testable | Testable |
|---|---|
| The system should be fast | A search returns results within 500ms at the 95th percentile with 10,000 records in scope |
| The UI should be intuitive | A new user completes first-time setup without opening help, in 8 of 10 moderated tests |
| Errors should be handled gracefully | On a failed save, the system preserves the user's input, shows the reason, and offers retry |
| The report should be accurate | Report totals match the source ledger to the cent for any date range up to 24 months |

### Banned words

These words mean different things to every reader. When one appears, the
requirement is not finished:

fast, slow, intuitive, user friendly, seamless, robust, scalable, flexible,
efficient, simple, easy, appropriate, sufficient, reasonable, as needed, etc.,
and so on, support (as in "support multiple formats," which ones), handle
(as in "handle errors," how), optimize, improve, enhance, streamline.

"Improve" is the worst offender because it sounds like a measurement. Improve
from what, to what, measured how, by when.

### Implementation free, and its limit

Say what must be true:

> FR-7: Session tokens expire after 30 minutes of inactivity.

Not how:

> FR-7: Use Redis with a 30 minute TTL to store session tokens.

The exception is a genuine business constraint, and it goes in a Constraints
section with its reason attached:

> C-2: Authentication must use the existing Okta tenant. Procurement will not
> approve an additional identity vendor this fiscal year.

The reason matters. A constraint without a reason gets ignored or worked around.
A constraint with a reason gets designed around correctly, and gets revisited
properly when the reason expires.

---

## User stories

Format:

> As a **[specific user type]**, I want **[capability]** so that **[benefit]**.

The "so that" clause is the entire value of the format and it is the one people
drop. It is what lets an engineer propose a cheaper way to deliver the same
benefit. Without it, the story is a feature request with extra words.

Be specific about the user. "As a user" is useless. "As a maintenance technician
covering three plants" tells the reader something.

### INVEST

A good story is:

- **Independent.** Can be built without waiting on another story. Where
  dependency is unavoidable, state it.
- **Negotiable.** Describes intent, leaving room for the team to propose how.
- **Valuable.** Delivers something a user or the business can perceive. "Set up
  the database" is a task, not a story. Tasks belong to engineering, and putting
  them in the PRD is how a PM accidentally writes the tech spec.
- **Estimable.** The team can size it. If they cannot, it needs a spike or it
  needs splitting.
- **Small.** Fits comfortably in a sprint. A story that spans two sprints has
  not been split.
- **Testable.** It has acceptance criteria.

### Splitting stories that are too big

By workflow step, by user role, by data type, by platform, by CRUD operation, by
happy path versus edge cases, or by rule variation. The one that does not work:
splitting by technical layer ("build the API" then "build the UI"), because
neither half delivers value and both must land to ship anything.

---

## Acceptance criteria

The contract between PM, engineering, and QA. Written before development starts,
during refinement, not weeks ahead when the context is thin. Most stories need
one to three criteria. A story with twelve is several stories.

### Given / When / Then (Gherkin)

```
Scenario: Technician acknowledges an active alarm

  Given a sensor has an active alarm
    And the technician has the Operator role
   When the technician acknowledges the alarm
   Then the alarm state changes to Acknowledged
    And the acknowledging user and timestamp are recorded
    And the alarm stops appearing in the unacknowledged queue
```

- **Given:** the starting state and preconditions.
- **When:** one action. If there are two, split the scenario.
- **Then:** the observable result. Observable is the key word. "Then the record
  is updated" is weak unless the update is visible somewhere. Say where.

Describe behavior, never implementation. No table names, no function names, no
"then the API returns 200." What does the *user* observe.

### Checklist form

For simple requirements, a checklist is fine and faster to read:

> **AC:**
> - Email field rejects entries without a valid format, inline, before submit
> - Duplicate email shows "An account with this email already exists"
> - Password must be at least 12 characters
> - Successful submission redirects to the dashboard

Use Given/When/Then for anything with state or conditions, checklists for
straightforward validation. Mixing both in one document is fine.

### Cover the unhappy paths

The most common gap in a PRD by a wide margin. For every feature, specify:

- **Empty state.** What does a new user with no data see?
- **Loading state.** What shows while waiting, and after how long?
- **Error state.** What breaks, what does the user see, what can they do next?
- **Permission denied.** What does an unauthorized user see? Hidden or disabled
  with an explanation? These are different products.
- **Boundaries.** Zero items, one item, the maximum, one over the maximum.
- **Concurrency.** Two users editing the same thing.
- **Partial success.** Half the batch worked. Now what?
- **Offline or degraded.** Relevant for field and mobile use.

Writing these is where a PM earns the role. Engineers will implement *something*
for each of these whether specified or not, and the unspecified version will be
whatever was easiest at 5pm on a Friday.

---

## Non-functional requirements

Quality attributes. Unquantified, they are ignored, because "the system should be
secure" cannot be built or tested. Every NFR needs a number, a distribution, or a
pass/fail standard.

### Checklist with examples of the right shape

**Performance**
- Page or view loads in under 2 seconds at the 95th percentile on a 4G connection
- API responds within 300ms at p95, 800ms at p99, under normal load
- A report over 12 months of data generates in under 10 seconds

Always state the percentile. An average response time hides the experience of
the customers who are angriest.

**Scalability**
- Supports 5,000 concurrent sessions without degradation beyond stated targets
- Handles 50,000 sensor readings per minute at steady state
- Tenant with 100,000 records performs within the same targets as one with 1,000

**Availability and reliability**
- 99.9% monthly uptime, excluding announced maintenance windows
- Recovery Time Objective 4 hours, Recovery Point Objective 15 minutes
- No single point of failure in the request path

**Security**
- All data encrypted in transit (TLS 1.3) and at rest (AES-256)
- Authentication via existing SSO, MFA required for administrative roles
- Authorization enforced server side on every request, not in the client
- Audit log for every create, update, and delete on regulated data, retained 7 years
- Passes OWASP Top 10 review before release

**Privacy and compliance**
- Personal data retained no longer than 24 months after account closure
- Data residency confined to the customer's stated region
- Export and deletion available on request within 30 days

**Usability and accessibility**
- WCAG 2.2 Level AA
- Full keyboard operability, visible focus indicators
- Contrast ratio at least 4.5:1 for body text
- Supported browsers: current and previous major version of Chrome, Edge,
  Safari, Firefox

**Maintainability and operability**
- Structured logs with correlation IDs across services
- Alerting on error rate above 1% over 5 minutes
- Feature flag allows disabling without a deploy
- Rollback possible within 15 minutes

**Localization**
- Copy externalized from code, no hardcoded strings
- Dates, times, numbers, and currency render per user locale
- Layout tolerates 30% text expansion

### Where the numbers come from

Never invent them. In order of preference: current production measurements
(what is it today, and what would users notice), contractual or regulatory
obligations, competitor benchmarks, industry standards. If a number is a guess,
label it: "NFR-3: p95 under 500ms. Source: PM estimate, needs validation against
current baseline." A labeled guess invites correction. An unlabeled guess becomes
a commitment.

---

## Traceability

Number everything: FR-1, NFR-1, C-1 (constraint), A-1 (assumption), OQ-1 (open
question). It costs nothing and it pays off four times:

- The ERD can state which requirement each component satisfies
- The test plan can show coverage
- Tickets can reference the source
- Scope negotiations become specific ("we are cutting FR-7 and FR-11") instead of
  vague, which is the difference between a decision and an argument

Keep a change log at the bottom of every living document: date, what changed,
who approved it. When someone says "that was never in the spec," the change log
answers in five seconds and without heat.
