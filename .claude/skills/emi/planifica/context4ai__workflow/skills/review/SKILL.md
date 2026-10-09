---
name: review
description: "Audit PRD and Plan consistency. Builds a spec traceability matrix (PRD[Sn] → Plan[Pn]), detects blocking issues (spec gaps, logic conflicts, dependency cycles), and outputs a structured review report."
---
# /review - PRD and Plan Consistency Review

Review the consistency between the PRD (Product-layer graph) and the Plan (Code-layer graph), identifying blocking issues.

## Design Workspace (design-dir)

The default workspace for design documents is `design/`. On startup the Agent checks:

1. `design/` directory exists --> use `design/` as `<design-dir>`
2. `design/` does not exist --> **pause and ask the user for the design workspace path**, explaining the accepted directory structure:
   ```
   <design-dir>/<version>/(prd|plan).md
   Examples: design/v1.0.1/prd.md, design/v0.5.0/plan.md
   ```

**`design/archive/`**: Archived or inactive design documents. When exploring existing graph structures, treat as **low-priority reference** -- read active version directories first and fall back to archive only when relevant context cannot be found in active versions.

All paths below use `<design-dir>` to refer to this directory.

## TL;DR -- Hard Rules

- **Spec end-to-end acceptance**: Every PRD `[Sn]` spec MUST be verifiable through a product interface **already available in this version** (Web UI preferred, CLI as fallback). "Can be verified once a future version ships" does not count. Specs that can only be verified through API calls, reading code, or running tests are NOT product specs and MUST be reported as a blocking issue
- **Core**: Every PRD `[Sn]` spec must be implemented by some Plan `[Pn]` spec
- **Traceability matrix**: Output a `PRD[Sn] -> Plan[Pn]` coverage table, marking each as covered or missing
- **Report only blocking issues**: Logic conflicts, spec gaps, dependency cycles, incomplete Fact changes, Node gaps, specs not end-to-end verifiable
- **Do NOT report**: Abstraction-level differences, naming style, pseudo-code details
- **PRD is the contractual authority** -- when in conflict, the PRD wins

---

## Agent Responsibility Boundaries

- Yes: Review PRD and Plan consistency
- Yes: Output traceability matrix and issue list
- No: Do not fix issues (that is `/fix-plan`)
- No: Do not perform implementation
- No: Do not recommend next steps after completion

---

## Review Modes

| Mode | Input | Review Scope |
|------|-------|--------------|
| **Dual-document review** | PRD + Plan | Spec traceability coverage + logical consistency |
| **Single-document review** | PRD only or Plan only | Internal document consistency (Node/Edge/Fact coherence) |

---

<reference>

## Review Principles

| Document | Layer | Modeling Language | Authority |
|----------|-------|-------------------|-----------|
| PRD | Product layer (What) | Product Node + Edge + Fact (description/spec/warning/decision/principle) | **Contractual authority** |
| Plan | Code layer (How) | Package/Symbol Node + Edge + Fact (guide/spec/warning/example/decision) | Execution guidance |

**Core concept**: Plan `[Pn]` specs must implement PRD `[Sn]` specs. The two are graphs at different layers, not copies of each other.

---

## Mode 1: Dual-Document Review (PRD + Plan)

### 1. Build the Spec Traceability Matrix

Extract all `[Sn][spec]` from the PRD and all `[Pn][spec]` with their `-> implements: PRD[Sn]` relationships from the Plan:

```markdown
### Spec Traceability Matrix

| PRD Spec | Content | Plan Spec | implements | Status |
|----------|---------|-----------|------------|--------|
| [S1] | Refund amount must not exceed original order amount | [P5] | -> PRD[S1] | Covered |
| [S2] | Refund arrives T+1 | [P8] | -> PRD[S2] | Covered |
| [S3] | Refund must be linked to original order | - | - | Missing |
```

### 2. Check Node corresponds Coverage

Every `[new]` story Node in the PRD should have a `corresponds` edge in the Plan linking to a concrete Code-layer Symbol (not a Package):

```markdown
### Node Coverage

| PRD Node | Plan corresponds | Status |
|----------|-----------------|--------|
| Product(story) "Buyer requests refund" [new] | Symbol(class) "RefundService" | Covered |
| Product(story) "Buyer checks refund progress" [new] | - | Missing |
```

### 3. Check Fact Change Completeness

For every Plan Fact with a `[+kind]` marker, verify that a corresponding old Fact `[-kind]` + `supersedes` exists (if it modifies an existing rule):

```markdown
### Fact Change Check

| Plan Fact | Marker | supersedes | Status |
|-----------|--------|------------|--------|
| [+spec] "Refund timeout retry cap is 5" | + | -> [-spec] "Retry cap is 3" | OK |
| [+spec] "Order cache TTL changed to 2h" | + | No supersedes | Is this new or a modification? |
```

### 4. Report Issues

#### Must Report (Blocking)

1. **Spec gap**: A PRD `[Sn]` has no `implements` in the Plan
2. **Logic conflict**: A PRD spec says A while a Plan guide/spec says not-A
3. **Dependency cycle**: Plan Phase dependencies contain a cycle
4. **Incomplete Fact change**: `[+kind]` modifies an existing rule but has no `[-kind]` + `supersedes`
5. **Node gap**: A PRD `[new]` story has no `corresponds` in the Plan
6. **Fact attachment violation**: A spec is attached to a domain/application Node instead of a story; or a principle is attached to a story instead of a domain/application (per the Fact x Product-kind attachment matrix)
7. **Story missing role**: A Product(story) description does not specify a clear role ("As [who]"), making it impossible to determine the acceptance subject for specs
8. **Node deletion Fact handling**: Plan has a `[delete]` Node with specs that `implements: PRD[Sn]` -- if PRD[Sn] is still valid (not deprecated), the traceability chain must be migrated to a new Node (`[-Pn]` + `[+Pnew]` + `supersedes`). Facts that are retired along with the Node do not need `[-Pn]` (Facts expire automatically with their Anchor)

#### Optional (Non-blocking suggestions)

- **Orphan Plan spec (gilding warning)**: A Plan `[Pn][spec]` has no `-> implements: PRD[Sn]` and its content **does not have a `[technical]` marker**. This may be an Agent-added requirement. Only specs explicitly marked `[Pn][spec][technical]` (pure technical specs) are allowed without implements
- corresponds granularity is too coarse (links to a Package instead of a Symbol)
- Spec verification type missing ([test]/[compile]/[inspect]/[run])
- Detail exceeds 100 lines but is not externally linked

#### Do NOT Report

- PRD uses description/principle while Plan uses guide/example -- this is the correct layer-level difference
- Plan does not cover all PRD description/warning entries -- only specs require implements
- Naming style differences (camelCase vs snake_case)
- Plan example code is incomplete -- example <=10 lines is the norm
- PRD spec references an authoritative architecture document instead of listing every field definition -- e.g. `[S1] "Zod schema must match 01-data-model"` is a valid high-level acceptance spec; do not report "spec too vague"

---

## Mode 2: Single-Document Review

### PRD Internal Review

| Check Item | Description |
|------------|-------------|
| Node hierarchy | domain -> application -> story hierarchy is correct. Specs attach only to stories; principles attach only to domain/application |
| Spec verifiability | Every `[Sn]` can be phrased as MUST/SHALL + condition/threshold. Actions must be unambiguous (no "handle/adapt", no "A or B") |
| **Spec end-to-end acceptance** | **Every `[Sn]` must be verifiable through a product interface already available in this version (Web UI preferred, CLI as fallback). "Can be verified in a future version" does not count. Verifiable only through API calls, reading code, or running tests -> not a product spec; should be moved to Plan as a technical spec** |
| Open question closure | All PRD `[Q]` entries have a corresponding `[A]` answer; unanswered `[Q]` entries indicate which `[Sn]` they affect (missing annotation = blocking issue); answered `[A]` entries have materialized as corresponding Facts on the Nodes that `[Q]` annotated -- choices require a `[decision]`, confirmed constraints require `[Sn][spec]` (writing `[A]` without adding Facts = decision/constraint not captured in the graph) |
| Fact attachment | Facts are attached to the correct Node/Edge (not dangling) |
| ID uniqueness | `[S1]` `[S2]` ... the same ID must not appear twice (`[-S4]` deprecated means no new `[+S4]`). Consecutive numbering is not required -- gaps (e.g. S2 deleted leaving S1->S3) are valid |
| Non-goals | Listed as `[decision]` Facts attached to a Node (not standalone text) |
| Fact changes | `[-]` and `[+]` appear in pairs with `supersedes` |

### Plan Internal Review

| Check Item | Description |
|------------|-------------|
| Phase dependencies | No cycles; ordered by depends_on |
| guide + spec | Every [new]/[modified] Node has >=1 guide + >=1 spec (leaf nodes may reuse parent node specs) |
| Spec verification type | Every `[Pn]` has a [test]/[compile]/[inspect]/[run] annotation |
| ID uniqueness | `[P1]` `[P2]` ... the same ID must not appear twice. Consecutive numbering is not required |
| Agent split | Execution graph exists + verify levels specified |
| Plan writeback rules | Agent completion acceptance includes a "Plan writeback" check item |
| Fact changes | `[-]` and `[+]` appear in pairs with `supersedes` |

---

## Output Format

### Dual-Document Review

```markdown
## Review Result: PRD + Plan Consistency

### Spec Traceability Matrix

| PRD | Content | Plan | Status |
|-----|---------|------|--------|
| [S1] | Refund amount must not exceed original order amount | [P5] -> PRD[S1] | Covered |
| [S2] | Refund arrives T+1 | [P8] -> PRD[S2] | Covered |
| [S3] | Refund must be linked to original order | - | Missing |

Coverage: 2/3 (67%)

### Blocking Issues (N)

#### Issue 1: PRD[S3] not implemented by Plan

**PRD**: [S3][spec] "Refund must be linked to original order; standalone refunds not supported"
**Plan**: No corresponding spec
**Suggestion**: Add a `[Pn][spec]` with validation logic in the Plan, implementing PRD[S3]

### Non-Blocking Suggestions (N)

- corresponds granularity: Plan links @acme/order-service -> Product(story "Buyer requests refund"); recommend refining to Symbol level
```

### When No Blocking Issues Exist

```markdown
## Review Result: No Blocking Issues

Spec traceability coverage is 100% (N/N). PRD and Plan are logically consistent; implementation may begin.

### Notes
- Contractual details defer to the PRD
- Plan example code is for reference only
```

</reference>

---

<procedures>

## Procedures (Execute in Order)

### Step 1: Input Collection (Inversion -- Ask Before Acting)

**The following inputs must be confirmed. If any item is missing, pause immediately and ask the user:**

| Review Mode | Required Input | When Missing |
|-------------|---------------|--------------|
| Dual-document review | PRD path + Plan path | Ask which document is missing |
| Single-document review (PRD) | PRD path | Ask whether a Plan is available for joint review |
| Single-document review (Plan) | Plan path | Ask whether a PRD is available for joint review |

After confirming inputs, run the mechanical pre-check script (zero token cost):

```bash
# Dual-document
bun ${CLAUDE_PLUGIN_ROOT}/scripts/review-check.ts <prd_path> <plan_path>

# Single-document
bun ${CLAUDE_PLUGIN_ROOT}/scripts/review-check.ts <prd_or_plan_path>
```

The script checks 5 items: spec ID uniqueness, implements coverage, `[-]`+`[+]` pairing, orphan Facts on [delete] Nodes, orphan Plan specs.

**Script result handling:**
- **Pass** --> continue to Step 2
- **Errors (mechanical issues)** --> STOP. Do not proceed with semantic review. Output the script results to the user and recommend running `/fix-plan` first, then re-running the review
- **Script does not exist / cannot run** --> skip the script, note "pre-check script not executed" in Step 2, and continue with semantic review

### Step 2: Read Documents

Read the PRD and/or Plan files.

### Step 3: Perform Semantic Review by Mode

> Focus only on semantic issues that the script cannot detect (logic conflicts, end-to-end acceptance, Fact attachment violations, etc.); do not re-report mechanical issues already covered by the script (duplicate IDs, missing pairs).

**Dual-document**: Build Spec Traceability Matrix -> check Node corresponds -> check Fact changes -> report issues.

**Single-document**: Check each item from the PRD/Plan internal review checklist.

**The following situations require pausing and confirming with the user before continuing:**
- A direct logic conflict is found between a PRD spec and a Plan spec (when it is unclear which takes precedence)
- A spec could be classified as either a business spec or a technical spec, and the classification affects implements coverage determination

### Step 4: Output Report

Output according to the output format template. List blocking issues if any; otherwise confirm pass.

**Pre-output self-check:**

> STOP: If any item below fails, do not output the report. Go back to the corresponding Step, address the gap, then output.

- [ ] Traceability matrix covers all PRD `[Sn]` with no missing rows (fail -> go back to Step 3 to complete the matrix)
- [ ] Every blocking issue includes a specific location reference (PRD[Sn] / Plan[Pn]) (fail -> go back to Step 3 to add references)
- [ ] Non-blocking suggestions are listed separately from blocking issues with no priority confusion (fail -> go back to Step 4 to reorganize formatting)

---

## Usage

### Quick Path (Recommended)

```bash
# Pre-check script (zero token cost, run first)
bun ${CLAUDE_PLUGIN_ROOT}/scripts/review-check.ts <prd_path> <plan_path>

# After pre-check passes, run semantic review
/review <prd_path> <plan_path>
```

### Single-Document Review

```bash
/review <prd_or_plan_path>
```

</procedures>
