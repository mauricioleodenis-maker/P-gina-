# Scoping: deciding what to build and how much

Scoping is the part of product management that actually changes outcomes.
Documentation quality is worth maybe ten percent. Deciding to cut the right
forty percent of a project is worth the rest.

## Appetite: set the time budget before designing

The standard sequence is: design the solution, estimate it, discover it is too
big, then negotiate. That sequence fails because by the time the estimate exists,
everyone is attached to the design.

Invert it. Decide what the problem is *worth* first, then design something that
fits.

> "This problem is worth six weeks of two engineers. What can we build in six
> weeks that meaningfully improves it?"

This is a business judgment, not an engineering one, and it is squarely the PM's
call. It gives the team a fixed time and a variable scope, which means trade-off
decisions can be made continuously during the build instead of in one painful
renegotiation at the end.

Setting an appetite requires being able to answer: what does this problem cost us
per month today? If the answer is unknown, that is the first thing to go find
out, and it is usually a one hour question for finance or support.

**Appetite is not an estimate.** An estimate says "this will take six weeks." An
appetite says "we will spend at most six weeks." The first is a prediction that
will be wrong. The second is a constraint that shapes the design.

---

## The four big risks

Before committing engineering time, name which of these is most likely to kill
the project, and reduce it cheaply.

| Risk | The question | Cheap test |
|---|---|---|
| **Value** | Will anyone use or buy it? | Customer interviews, fake door, sales pipeline evidence, existing support ticket volume |
| **Usability** | Can they figure out how to use it? | Prototype tested with five real users |
| **Feasibility** | Can engineering build it in the time available? | Technical spike, or a sketch shown to the tech lead |
| **Viability** | Can the rest of the business support it? | Conversations with legal, finance, support, sales, ops |

The trap: teams gravitate to usability because prototypes are tangible and
satisfying to make. Value and viability are harder and scarier, so they go
unexamined until launch. For most new initiatives, **value is the risk most
likely to kill it.**

Viability is the one that ambushes new PMs specifically. A feature that works
perfectly can still die because support cannot staff it, legal will not allow
the data retention, finance cannot recognize the revenue, or sales cannot explain
it. Ask the boring departments early.

Write the answer into the document as one line per risk: the risk, why it is or
is not serious here, and what will be done about it.

---

## Hunting rabbit holes

A rabbit hole is a part of the project where the team gets stuck for a week on
something nobody anticipated. Finding them before the work starts is most of the
value a PM adds during scoping.

**Walk the primary use case in slow motion.** Step by step, literally narrate
what the user does and what the system does. Rabbit holes hide in the steps
everyone skips over because they seem obvious.

**Ask these directly:**

- Does this require technical work we have never done before?
- Are we assuming the parts fit together in a way nobody has verified?
- Are we assuming a design solution exists that we have not actually come up with?
- Is there a hard decision we should settle now so it does not trip up the team
  mid build?
- What happens to data that already exists? Migration is the most commonly
  missed rabbit hole.
- What happens on failure, timeout, partial success, or permission denied?
- Who else's system does this touch, and have we asked them?

**Ask the tech lead the right question.** Not "is this possible?" (the answer is
always yes) but **"is this possible in six weeks?"** The constraint is what
surfaces the real answer. Show a rough sketch rather than a finished document,
so the response is about the shape of the problem rather than the wording.

**Then patch what you found.** Three moves, in order of preference:

1. **Cut it back.** Remove the exciting but non-essential element. Color coding,
   animation, the configurable version of a thing that could be hardcoded.
2. **Declare it out of bounds.** State explicitly that a case is not supported.
   Narrow the project to the core win.
3. **Specify the tricky spot.** Where a decision cannot be avoided, make it in
   the document so the team does not have to make it under time pressure.

**No gold plating.** If a detail is not necessary to the core value, cut it now
rather than letting the team discover mid build that it costs two weeks.

---

## Prioritization frameworks

Use these to make a decision defensible, not to outsource the decision. The score
is an argument, not an answer. When the score disagrees with judgment,
interrogate the inputs, and if judgment still wins, say so in writing and
explain why.

### RICE

Created at Intercom. Best for comparing a large set of candidate initiatives
where a transparent, numerical ranking is needed to settle stakeholder debate.

```
RICE = (Reach x Impact x Confidence) / Effort
```

- **Reach:** how many people or events per time period, in real units.
  "1,200 accounts per quarter," not a score out of ten. Use a real number from a
  real source.
- **Impact:** per person effect, on a fixed scale. Standard is 3 = massive,
  2 = high, 1 = medium, 0.5 = low, 0.25 = minimal.
- **Confidence:** percentage. 100% = supported by data, 80% = some evidence,
  50% = informed guess. Below 50%, do not score it, go get evidence instead.
- **Effort:** person-months. Whole numbers, and one person-month minimum.

The Confidence term is the useful part, and the one people skip. It stops a
compelling guess from outranking a modest certainty.

### ICE

```
ICE = Impact x Confidence x Ease
```

Each scored 1 to 10. Faster and cruder than RICE. Fine for ranking a backlog of
small improvements. Do not use it for decisions worth more than a few weeks of
work: the 1 to 10 scales are too subjective to survive scrutiny.

### MoSCoW

Buckets, not scores. From the Dynamic Systems Development Method.

- **Must have:** the release is not viable without it. Legal, safety, and "the
  core promise does not work" items.
- **Should have:** important, painful to omit, but the release still ships.
- **Could have:** nice, first to be cut when time runs short.
- **Won't have (this time):** explicitly excluded, and recorded so it is not
  relitigated every week.

The best tool for **release scoping** and for converging a cross-functional group
quickly. Use it inside a PRD to mark each requirement.

Two rules keep it honest. First, if more than about sixty percent of effort is in
Must, no prioritization has occurred: force the ranking. Second, the "Won't have"
list must be written down. It is the single most useful line item, because it is
the one people otherwise argue about repeatedly.

### Kano

Classifies features by how customer satisfaction responds to them:

- **Basic (must-be):** absence causes anger, presence earns nothing. Security,
  uptime, data not being lost.
- **Performance (linear):** more is better, proportionally. Speed, capacity.
- **Excitement (delighters):** absence is not noticed, presence delights.
- **Indifferent:** nobody cares. The most common category, and the hardest to
  admit.

Useful during **discovery** to understand what kind of value a feature carries.
Note that delighters decay into basics over time as they become expected.

### Weighted Shortest Job First (WSJF)

From SAFe. Sequences work by economic urgency.

```
WSJF = Cost of Delay / Job Size

Cost of Delay = User/Business Value + Time Criticality + Risk Reduction or Opportunity Enablement
```

Each component scored on a relative scale (commonly a modified Fibonacci
sequence: 1, 2, 3, 5, 8, 13, 20). Best when sequencing a queue of already
approved work, particularly where some items have deadlines or regulatory dates.
The Time Criticality term is what makes it better than RICE for deadline driven
portfolios.

### Value vs Effort (2x2)

Plot on two axes, do the high value / low effort quadrant first. Crude, fast,
and perfectly adequate for a roadmap conversation in a meeting. It is a
simplified RICE without the Confidence term, which means it systematically
overrates exciting guesses.

### Opportunity Solution Tree

Not a scoring framework. A structure for connecting work to outcomes:

```
Desired outcome
  |- Opportunity (a customer need, pain, or desire)
  |    |- Solution
  |    |- Solution
  |- Opportunity
       |- Solution
```

Use it when the problem is that the team has a list of solutions and no agreement
on what they are for. Building the tree exposes the solutions that connect to no
opportunity, and the opportunities nobody is addressing.

### Choosing

| Situation | Use |
|---|---|
| Large backlog, stakeholders disagree, need a defensible ranking | RICE |
| Quick gut check on small items | ICE or Value vs Effort |
| Deciding what ships in this release | MoSCoW |
| Understanding what kind of value a feature has | Kano |
| Sequencing approved work with deadlines | WSJF |
| Team has solutions but no agreed outcome | Opportunity Solution Tree |

Combining them is normal and often better than picking one: Kano during
discovery to understand the value type, RICE to rank the shortlist, MoSCoW to
settle the release.

---

## Scope negotiation

When the ask exceeds the appetite (it will), these are the moves, best first:

1. **Cut scope, keep quality and date.** Ship the core win completely. Default
   move. A narrow thing that works beats a broad thing that half works.
2. **Phase it.** Ship the must-haves now with a written commitment to phase two.
   Only credible if phase two is actually scheduled. An uncommitted phase two is
   a cut with extra steps, so say so honestly rather than using it as comfort.
3. **Move the date.** Acceptable when the date is internal and the scope is
   genuinely irreducible.
4. **Add people.** Almost never works inside a single project. Ramp-up cost
   exceeds the benefit on anything shorter than a quarter.
5. **Cut quality.** Not a real option. It is a loan at a punishing interest rate,
   and the repayment lands on whoever maintains the system next.

Present the trade-off as a choice with a recommendation, not as a problem. "We
can ship A and B by the 15th, or A, B, and C by the 30th. I recommend the first
because C serves eleven accounts and A serves four hundred." That is a PM doing
the job. "We are behind" is not.
