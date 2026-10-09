---
name: make-prd
description: "Model product requirements as a Product-layer knowledge graph (domain/application/story Nodes + Edges + Facts). Produces a PRD document with spec traceability for downstream Plan implementation."
---

# /make-prd - Product Requirements Modeling (Product-Layer Graph)

Model requirement descriptions as a Product-layer Node / Edge / Fact knowledge graph.

## Design Workspace (design-dir)

The default workspace for design documents is `design/`. When the Agent starts, check:

1. `design/` directory exists -> use `design/` as `<design-dir>`
2. `design/` does not exist -> **pause and ask the user for the design workspace path**, explaining the accepted directory structure:
   ```
   <design-dir>/<version>/(prd|plan).md
   Examples: design/v1.0.1/prd.md, design/v0.5.0/plan.md
   ```

**`design/archive/`**: Archived or inactive design documents. Treat as **low-priority reference** when exploring existing graph structures -- prioritize reading active version directories, and only fall back to archive when relevant context cannot be found in active versions.

All subsequent paths using `<design-dir>` refer to this directory.

---

## TL;DR -- Hard Rules (Above the Fold)

- **Input**: Requirement description + version number (required); architecture documents (optional)
- **Output**: Product Node tree + Edges + Facts, written to `<design-dir>/<version>/prd.md`
- **Prohibited**: Do not produce Package/Symbol (that belongs to Plan); do not write implementation code
- **Product kind**: domain / application / story (not feature -- Feature is an iteration delivery unit and does not enter the graph)
- **story = long-lived knowledge asset**: Describes who can do what and gain what value. Specs attach only to stories, not to domain/application
- **spec must be end-to-end verifiable**: Each spec must be verifiable through the product interface (Web UI preferred), not solely through API calls or running tests. CLI is an acceptable fallback when no UI exists. If interface-level verification is impossible -> it is a technical spec, leave it for Plan
- **Technical element triage**: When input contains technical proposals, extract only product-layer elements; leave technical constraints for `/make-plan`
- **Minimum output**: Each story Node >= 1 `[description]` + >= 1 `[spec]`
- **Fact numbering**: All specs use `[S1]` `[S2]` ... stable numbering, for Plan implements references
- **content <= 256 characters**, detail is optionally inlined (`>` block); if over 100 lines, link externally to `details/`
- **Non-goals = `[decision]` Facts**, attached to the relevant Node, with version constraints
- **Do not write `corresponds` edges without code context** -- better to omit than to guess
- **Fact changes**: Modifying an existing Fact requires `[-kind]` + `[+kind]` + `supersedes` association
- **PRD can be simple or even absent**: When the input is primarily a technical proposal, the PRD may contain only a few stories; if no stories or product specs can be extracted at all, classify it as a pure technical upgrade -- do not produce a PRD, proceed directly to `/make-plan`

---

## Agent Responsibility Boundaries

- ✅ Model requirements as Product-layer Nodes + Edges + Facts
- ❌ Do not produce Code-layer modeling (Package/Symbol) <- `/make-plan`
- ❌ Do not write implementation code
- ❌ Do not recommend next steps after completion

---

## Input

| Input | Required | Description |
|-------|----------|-------------|
| **Requirement description** | ✅ | Natural language, meeting notes, emails, etc. |
| **Version number** | ✅ | e.g., `v0.5.0` |
| **Architecture documents** | Optional | To understand existing Product/Package structure |

---

<reference>

## Concept Definitions

This methodology models with three layers of Nodes: **Product (business) -> Package (code organization) -> Symbol (code implementation)**. PRD only concerns the Product layer.

### Product Node

A Product is a **business concept**; its grounding is always `concept`. Three kinds by level:

| kind | Definition | Criteria | Examples |
|------|-----------|----------|----------|
| `domain` | Business domain, the organizational partition of the business | Highest level, globally unique | Payments domain, Users domain, Marketing domain |
| `application` | Has an independent product identity + independent user entry point. Supports recursion: capability domains are modeled as child applications | Has its own brand/user base, can exist independently from the parent product | Shopping APP, "Order Management" (capability domain) |
| `story` | User story (long-lived product knowledge asset describing who can do what and gain what value) | "As a [role], I want [goal], so that [value]" | "Buyer places an order", "Buyer requests a refund" |

**Hierarchy**: domain -> application -> story. application contains application (capability domain recursion). Stories do not recurse -- split into sibling stories, each with an independent role and goal.

**story vs Feature (important distinction)**:
- **story** is long-lived knowledge describing the current state of product capabilities. As long as the capability exists, the story remains
- **Feature** is an iteration delivery unit, packaging a set of stories for one version release, then archived after launch. **Feature does not enter the knowledge graph**
- Fact[spec] attaches to stories, not to Features -- rules are long-lived, delivery packages are one-time

**A story must describe end-to-end behavior that users can perform in the current version**. Fact[spec] must be end-to-end verifiable through the product interface available in this version:
- ✅ "Refund amount must not exceed the original order amount" -- buyer encounters this when requesting a refund in the interface (interface exists in this version)
- ✅ "After indexing completes, module status changes to indexed" -- developer sees the status badge change in the Web UI module list
- ✅ "Monorepo sub-packages are automatically detected" -- developer sees all sub-packages in the Web UI module list
- ❌ "Order table must have a status field" -- can only be verified by reading code
- ❌ "Zod schema contains 9 Fact kinds" -- can only be verified via typecheck
- ❌ "curl API returns correct JSON" -- API call is not an interface behavior; describe what the user sees in the interface instead

**Verification priority**: Web UI interface behavior > CLI command interaction > API call. Spec verification descriptions should state what the user sees/does in the interface, not curl commands or API response formats. API-level verification belongs to Plan's technical specs.

**If this version has no interface (Web UI / CLI) to operate, there are no product stories** -> classify as a pure technical upgrade

**Capability domains are expressed as applications**:
```
Product(application) "Shopping APP"
  ├─ Product(application) "Order Management"          ← capability domain
  │    ├─ Product(story) "Buyer places an order"
  │    └─ Product(story) "Buyer cancels an unshipped order"
  ├─ Product(application) "Product Management"          ← capability domain
  │    ├─ Product(story) "Seller lists a new product"
  │    └─ Product(story) "Buyer searches for products"
  └─ Product(application) "After-Sales Service"
```

**Cross-layer story refinement**: A parent application's story can be refined by child application stories via `refines` edges (N:N).

PRD may associate existing Package/Symbol through `corresponds` edges, but **does not create them**. Do not guess without reliable code context -- better to omit, let `/make-plan` fill in the gaps.

- ✅ Acceptable as stories: Buyer places an order, Seller lists a product, Buyer requests a refund
- ❌ Do not create Nodes, demote to Facts: Button color, popup copy, field length, page layout
- ❌ Implementation steps -> leave for Plan's Phase breakdown. Stories face users, Phases face developers

### Edge Types

| type | Meaning | Example |
|------|---------|---------|
| `contains` | Hierarchical containment | domain -> application -> story |
| `depends_on` | Business dependency (function A must exist for function B to be meaningful) | "Buyer requests a refund" depends_on "Buyer places an order" |
| `refines` | Cross-layer story refinement (N:N) | Child application's story refines parent application's story |
| `corresponds` | Same entity from business vs. code perspectives | Product("Buyer places an order") corresponds Package(@acme/order-service) |
| `related_to` | General association | "Buyer requests a refund" related_to "Seller processes a return" |

### Fact Kind and Product Kind Attachment Rules

| kind | domain | application | story | Description |
|------|:------:|:-----------:|:-----:|-------------|
| `description` | ✓ | ✓ | ✓ | Needed at every level for definitions |
| `spec` | - | - | ✓ | **spec attaches only to stories** -- acceptance rules for user stories |
| `warning` | - | ✓ | ✓ | Business risks for capability domains or stories |
| `decision` | - | ✓ | ✓ | Design choices for capability domains or stories |
| `principle` | ✓ | ✓ | - | High-level design philosophy, not attached to specific stories |

PRD **does not use** guide / example / changelog / incident -- those belong to the Code layer or operations/release stages.

**Kind determination priority** (stop at first match, top to bottom): `decision > principle > spec > warning > description`

**spec vs warning**: A spec is a specification (should be); a warning is the consequence of not following the spec (is/will happen). Both can coexist on the same story.

### content + detail Specification

**content** (required): <= 256 characters, one semantic unit per entry. 50-180 characters recommended.

**detail** (optional): Inline using `>` block quotes. If over 100 lines, link externally to `<design-dir>/<version>/details/` directory.

```markdown
# Inline detail (short, recommended)
[spec] "Refund amount must not exceed the original order amount"
  > Refunds including fees are calculated at net amount; fees are non-refundable.

# External detail (over 100 lines)
[spec] "Product detail page display specification"
  > See [details/product-detail-spec.md](./details/product-detail-spec.md)
```

### Fact Change Markers

| Marker | Meaning |
|--------|---------|
| `[+spec]` | Added |
| `[-spec]` | Deprecated |

Do not use `[~spec]`. Modifications are always split into `[-]` + `[+]` + `supersedes`:

```markdown
[+spec] "Refund arrival time changed to T+3"
  → supersedes: [-spec] "Refund arrives T+1 after initiation"
```

The PRD phase primarily uses `supersedes` (old-to-new replacement). Other Fact relationships (implements/refines/conflicts/references) are established by `/make-plan`.

### Technical Element Triage Table

| Information Type | Belongs To | PRD Handling | Example |
|-----------------|-----------|-------------|---------|
| User-perceivable functionality | Product | Create story Node + spec | "Buyer requests a refund" |
| Business rules/constraints | Product | `[Sn][spec]` attached to story | "Refund amount must not exceed original order" |
| Design choices affecting product boundaries | Product | `[decision]` attached to application/story | "Refunds use async queue due to payment gateway callbacks" |
| Business risks | Product | `[warning]` attached to application/story | "During peak sales, refund queue may exceed SLA" |
| Pure implementation choices | Code | **Skip, leave for `/make-plan`** | "Use PostgreSQL", "Use Redis for caching" |
| Implementation steps | Code | **Skip, leave for `/make-plan`** | "Drop old table then create new" |
| Package/module splitting | Code | **Skip, leave for `/make-plan`** | "Split into core/storage/api packages" |
| Interface design details | Code | **Skip, leave for `/make-plan`** | "POST /query input schema" |
| Pure technical constraints | Code | **Skip, leave for `/make-plan`** | "Zero compile errors", "Coverage >= 80%" |
| Code examples | Code | **Skip, leave for `/make-plan`** | Function signatures, class skeletons |

**Design choice triage**: If it affects product behavior, include in PRD; pure library/framework choices go to Plan. **Gray areas default to Plan.**

**Avoid copying architecture-level definitions verbatim**: When an authoritative architecture document exists, write one macro-level acceptance spec referencing it, rather than splitting it field-by-field into multiple specs:

```markdown
# ❌ Wrong: copying field-by-field into specs
[S1][spec] "Order table must contain order_id, status, amount, created_at..."

# ✅ Correct: reference the authoritative document
[S1][spec] "Order data model must be fully consistent with order-schema.md"
```

### Output Format Template

```markdown
# [Project Name] [Version] PRD

> [One-line positioning for this version]

---

## Graph

### Nodes

Product(domain) "E-Commerce"
  └─ Product(application) "Shopping APP"
       ├─ Product(application) "After-Sales Service"      ← capability domain
       │    ├─ Product(story) "Buyer requests a refund" [new]
       │    └─ Product(story) "Buyer checks refund progress" [new]
       └─ Product(application) "Order Management"

Markers: [new] = added this version, [modified] = changed, [delete] = removed this version, unmarked = existing

Source tracing (optional): append `<!-- source: path -->` after the status marker to link a Node to its original document.
Example: `Product(story) "Buyer requests a refund" [new] <!-- source: docs/refund-rfc.md -->`
The path can include a line anchor: `<!-- source: docs/refund-rfc.md#L45 -->`

### Edges

contains: "E-Commerce" → "Shopping APP"
contains: "Shopping APP" → "After-Sales Service"
contains: "After-Sales Service" → "Buyer requests a refund" [new]
depends_on: "Buyer requests a refund" → "Buyer places an order" (grounding=concept) [new]

---

## Facts

### Product(story) "Buyer requests a refund" [new]

[description] "As a buyer, I want to request a refund for a received order to handle product quality issues"

[S1][spec] "Refund amount must not exceed the original order amount"

[S2][spec] "Refund arrives within T+1 after initiation"

[warning] "During peak sales, refund queue may exceed SLA"
  > Double-11 refund volume is 10x normal daily volume; queue depth must be monitored

[decision] "Refunds use async queue instead of synchronous processing due to payment gateway callback dependency"
  > Alternative: synchronous polling of payment gateway. Rejected because polling interval is uncontrollable

---

## Non-Goals (as decision Facts attached to Nodes)

**Non-goal content must include version constraints** ("v1.0 does not implement" rather than just "does not implement").

### Product(application) "After-Sales Service"

[decision] "v1.0 does not implement cross-border refunds because multi-currency settlement dependency is not ready"

---

## Open Questions / Assumptions (optional)

**Only record product-level undecided items** (those affecting user behavior or business rules). Technical implementation questions (schema scope, cleanup strategy, encoding approach) are left for the `/make-plan` phase.

**`[A]` must be materialized as Facts**: return to the Node marked by `[Q]` and add corresponding Facts:
- Made a choice → add `[decision]` (with alternatives and rejection reasons)
- Determined a new constraint → add `[Sn][spec]`
- Both → add both

Writing `[A]` without adding Facts = the decision/constraint is not in the graph; downstream Agents cannot see it.

- **[Q1]** Refund fee policy not yet determined (affects [S1])

---

## Acceptance Criteria Summary

- [ ] [S1] Refund amount must not exceed the original order amount
- [ ] [S2] Refund arrives within T+1 after initiation
```

</reference>

---

<procedures>

## Execution Steps (Execute in Order)

### Step 1: Information Gathering (Inversion -- Ask Before Acting)

> ⛔ **Until all four items below are confirmed, do not read existing PRD content, do not extract any Nodes, and do not proceed to Step 2.**

**The following four items must be confirmed. If any are missing, immediately ask the user -- do not guess:**

| Required Item | Description | If Missing |
|---------------|-------------|------------|
| Version number | e.g., `v0.5.0` | Ask for the version number |
| Core requirements | What this version needs to accomplish | Ask for goals and scope |
| Target users/roles | Who will use this functionality | Ask for roles (affects the verification subject of stories and specs) |
| Prior version status | What the previous version accomplished (to avoid re-creating existing Nodes) | Ask, or read existing PRD |

If the input is a technical proposal/architecture design/RFC, use the "Technical Element Triage Table" to identify Product-layer vs. Code-layer elements. Three possible outcomes:
- **Has user stories** -> produce PRD normally
- **Primarily technical, minor product impact** -> produce a brief PRD, annotated at the top with `> ⚠️ Input is primarily a technical proposal; this PRD only extracts product-layer elements.`
- **Purely technical, no user-perceivable changes** -> do not produce PRD, output `> ⚠️ Pure technical upgrade, no user stories. Proceed directly to /make-plan.`

### Step 2: Explore Existing Graph Structure + Identify Product Nodes (⚠️ Must wait for user confirmation before continuing)

First use `Glob("<design-dir>/*/prd.md")` to find existing PRD files, read the `## Graph` section of the most recent version to understand the existing domain/application/story structure, and avoid re-creating Nodes or missing existing ones. **Do not use global grep; search only within `<design-dir>/*/prd.md`.**

Then extract new/modified Nodes from the current requirements, marking them [new]/[modified]:
- application = product or capability domain
- story = user story (must have role + goal)

**After extraction, present the candidate Node tree to the user and wait for confirmation** (format below). Only proceed to Step 3 after confirmation:

```
The following candidate Node tree for this PRD is proposed. Please confirm:

Product(domain) "E-Commerce"
  └─ Product(application) "Shopping APP"
       └─ Product(application) "After-Sales Service"      ← capability domain [existing]
            ├─ Product(story) "Buyer requests a refund"    [new]
            └─ Product(story) "Buyer checks refund progress" [new]

Questions (if any):
- Should "Buyer requests a refund" distinguish between partial and full refunds, or merge into one story?
- Are there other stories for this version that are missing?

Please confirm to proceed, or let me know what adjustments are needed.
```

**Confirmation paths:**
- User replies "ok"/"confirmed"/"looks good" -> proceed directly to Step 3, no further questions
- User requests adjustments -> modify Node tree and re-present, wait for confirmation again
- User asks a question -> answer, then re-present Node tree

**If unable to determine whether a story should be split, merged, or its hierarchy is uncertain -- ask here, do not decide on your own.**

### Step 3: Establish Edges

Inter-story depends_on + cross-layer refines + corresponds with existing Packages.

### Step 4: Extract Facts

For each Node/Edge, determine the kind one by one. Follow the attachment matrix:
- **story**: >= 1 description + >= 1 spec
- **application**: description + optional warning/decision
- **domain**: description + optional principle

**⚠️ Mandatory check before writing each spec: Can this spec be end-to-end verified through the product interface (Web UI / CLI) available in this version?** Cannot rely on "can be verified after a future version launches"; cannot substitute API calls for interface behavior. If it can only be verified through API or test scripts -- it is a technical spec; do not write it in the PRD, leave it for Plan.

**The following situations require pausing and confirming with the user before continuing:**
- The story's role is unclear, making it impossible to determine the verification subject
- A spec's trigger condition or threshold is ambiguous (e.g., "within a reasonable time" is undefined)
- A business rule potentially conflicts with a spec in an existing PRD

**Specs describe the acceptance end-state, not definition enumerations**: When an authoritative architecture document exists, use one macro-level spec referencing it, rather than splitting field by field.

### Step 5: Non-Goals + Acceptance Summary

Non-goals are attached as `[decision]` to applications, with version constraints. Compile acceptance criteria from all specs.

### Step 6: Pre-Output Checklist (Pass every item before writing the file)

> ⛔ **If any item below fails -> stop file output, return to the corresponding Step to fix, and do not write the file with known issues.**

**Structure** (failure -> return to Step 2)
- [ ] At least 1 `[new]`/`[modified]` story Node
- [ ] Each story Node has >= 1 description + >= 1 spec
- [ ] Node hierarchy is correct (domain -> application -> story)
- [ ] [new]/[modified] markers are complete

**Spec Quality** (failure -> return to Step 4)
- [ ] Specs attach only to stories and can be end-to-end verified through the product interface (Web UI / CLI) (API-level verification does not count as a product spec)
- [ ] Spec actions are unambiguous (no "handle/adapt/optimize", no "A or B")
- [ ] content <= 256 characters, one semantic unit per entry
- [ ] All specs have `[Sn]` numbering with no duplicates

**Fact Completeness** (failure -> return to Step 4/5)
- [ ] Decisions include alternatives and rejection reasons
- [ ] Warnings include trigger conditions and consequences
- [ ] Non-goals are attached as [decision] to applications (not free-floating text)
- [ ] Fact changes have `[-]` + `[+]` + `supersedes`

**Open Questions** (failure -> return to Step 4 to add Facts)
- [ ] Open questions `[Q]` indicate which `[Sn]` they affect
- [ ] Answered `[A]` items have been materialized as corresponding Facts (decision or spec)

**Summary** (failure -> complete before outputting)
- [ ] Acceptance criteria summary covers all specs, with count matching total spec count

</procedures>
