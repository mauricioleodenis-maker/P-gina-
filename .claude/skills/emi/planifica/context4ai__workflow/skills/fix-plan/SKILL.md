---
name: fix-plan
description: "Fix issues identified by /review. Handles 11 repair categories (spec gaps, logic conflicts, Node gaps, dependency cycles, etc.) with strict Fact change rules and spec ID immutability."
---
# /fix-plan - PRD and Plan Issue Repair

Fix issues in the PRD (Product-layer graph) and Plan (Code-layer graph) based on `/review` results.

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

- **Input**: `/review` results + PRD + Plan
- **PRD is the contractual authority**: Downstream changes to the Plan can be made directly; **upstream changes to the PRD require human approval**
- **Fix = graph operations**: Add/delete/modify Nodes, Edges, and Facts -- not free-form text editing
- **Fact changes must use `[-]` + `[+]` + `supersedes`** -- do not use `[~]`
- **Spec IDs are identity IDs, never reused**: Modification = `[-Sn]` + `[+Snew]` + `supersedes`
- **Re-run `/review` after fixing to verify**

---

## Agent Responsibility Boundaries

- Yes: Fix PRD and Plan issues based on review results
- Yes: Add missing specs, Nodes, Edges, and Facts
- Yes: Resolve logic conflicts
- No: Do not make changes beyond the scope of review results
- No: Do not recommend next steps after completion

---

<reference>

## Layer Hierarchy

| Layer | Modeling Language | Authority |
|-------|-------------------|-----------|
| Product (PRD) | Product(domain/application/story) + Fact (specs attach only to stories) | **Contractual authority** |
| Code (Plan) | Package/Symbol Node + guide/spec/warning/example/decision | Execution guidance |

When in conflict, the PRD wins. **Modifying the PRD requires human approval** (raise `[Requires Human Approval]`).

## Repair Categories (11 Types)

### 1. Spec Gap (PRD[Sn] Not Implemented)
Fix the Plan: add `[Pn][spec]` + `-> implements: PRD[Sn]`. Create a new Symbol Node to host it if needed.

### 2. Logic Conflict (PRD Says A, Plan Says Not-A)
Fix the Plan per the PRD: `[-kind]` to deprecate the conflicting Fact + `[+kind]` to add the correct one + `supersedes`.

### 3. Node Gap (PRD [new] Story Has No corresponds)
Fix the Plan: add a Code-layer Node + `corresponds` edge (prefer Symbol-level) + guide + spec.

### 4. Incomplete Fact Change (`[+]` Without Corresponding `[-]`)
Fix the Plan: add the missing `[-kind]` + `supersedes`.

### 5. Dependency Cycle
Fix the Plan: identify the critical Edge in the cycle and split the Phase or adjust the dependency direction.

### 6. Node Deletion Fact Handling
When a Node is marked `[delete]`, its Facts expire automatically with the Anchor -- no need to `[-Pn]` each one individually. **Only when a Fact must be migrated to a new Node**: `[-Pn]` + `[+Pnew]` + `supersedes`.

### 7. Gilding Warning (Orphan Plan Spec)
A `[Pn]` has no `implements` and no `[technical]` marker: if it adds a business rule --> delete it or backfill the PRD (requires human confirmation); if it is a pure technical constraint --> add the `[technical]` marker.

### 8. PRD Internal Conflict
This is an upstream modification -- human approval required. `[-Sn]` + `[+Snew]` + `supersedes`. Must also evaluate whether related `[Pn]` in the Plan need to be rewritten.

### 9. Open Question Answer Not Materialized as Fact
An `[A]` answer exists but the Node lacks a corresponding Fact: if a choice was made --> add `[decision]`; if a new constraint was determined --> add `[Sn][spec]`.

### 10. Fact Attachment Violation
A spec is attached to a domain/application Node --> migrate it to the corresponding story. A principle is attached to a story --> promote it to the application level. Correct per the Fact x Product-kind attachment matrix.

### 11. Story Missing Role
A Product(story) description does not specify a clear role --> rewrite as "As [role], I want [goal], so that [value]" format. If the role cannot be determined, the Node may not be a story but rather an application (capability domain).

## Spec Numbering Rules

| Operation | Rule |
|-----------|------|
| Add | Use the next available number |
| Deprecate | `[-Sn]`, number is retired |
| Modify | `[-Sn]` + `[+Snew]` + `supersedes` |
| Reuse | **Never allowed** |

## Fact Cross-Node Migration

`[-Pn]` is written under the original Node, `[+Pnew]` is written under the new Node, linked by `supersedes`.

## Output Format

```markdown
## Repair Report

### Fix 1/N: PRD[S3] Not Implemented
**Type**: Spec gap
**Fix Location**: Plan
**Action**: [Specific Node/Edge/Fact modifications]

---

## Post-Fix Verification
- [ ] Re-run `/review` with no blocking issues
- [ ] Spec coverage is 100%
- [ ] All Fact changes have `[-]` + `[+]` + `supersedes`
- [ ] IDs are unique (no reuse)
```

</reference>

---

<procedures>

## Procedures (Execute in Order)

### Step 1: Input Collection (Inversion -- Ask Before Acting)

**The following inputs must be confirmed. If any item is missing, pause immediately and ask the user:**

| Required Item | Description | When Missing |
|---------------|-------------|--------------|
| `/review` results | Blocking issue list | Ask for the review results path, or run `/review` first |
| PRD file path | Product-layer graph | Ask for the PRD path |
| Plan file path | Code-layer graph | Ask for the Plan path (may be omitted if only Plan issues exist) |

If only the review results are available but PRD/Plan file paths are missing, attempt to infer them from the file references in the review results; if inference fails, ask.

### Step 2: Prioritize Issues

| Priority | Type | Rationale |
|----------|------|-----------|
| P0 | Dependency cycles, logic conflicts | Block execution |
| P1 | Spec gaps, Node gaps | Incomplete functionality |
| P2 | Incomplete Fact changes, PRD conflicts, `[A]` not materialized | Consistency issues |

### Step 3: Fix One by One

Process each issue per its repair category. For every fix, clearly state: fix location (PRD/Plan) + operation type + complete content.

**The following situations require pausing and confirming with the user before continuing:**
- PRD needs to be modified (upstream change) --> raise `[Requires Human Approval]` and wait for human confirmation
- The fix direction for an issue is ambiguous (e.g. both "delete" and "add PRD spec" are reasonable approaches)
- Fixing an issue introduces new spec IDs but the starting number is uncertain (to avoid collision with existing IDs)

### Step 4: Re-run Verification (Must Pass to Complete)

After all fixes, re-run `/review`:

**Pass criteria:**
- [ ] Spec traceability coverage is 100%
- [ ] No blocking issues
- [ ] All Fact changes have `[-]` + `[+]` + `supersedes`
- [ ] IDs are unique (no reuse)

**Result handling:**
- **Verification passes** --> output the repair report, done
- **Issues remain** --> go back to Step 3 and continue fixing remaining issues
- **Pending `[Requires Human Approval]`** --> pause; do not run verification; wait for human confirmation before continuing

</procedures>
