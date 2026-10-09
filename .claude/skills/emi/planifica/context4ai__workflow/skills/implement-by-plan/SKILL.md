---
name: implement-by-plan
description: "Execute assigned Agent tasks from the Plan. Loads assigned Phase Nodes and Facts, implements code changes, validates specs with evidence, and writes back Plan deviations."
---
# /implement-by-plan - Execute Assigned Agent Tasks from the Plan

Execute the tasks assigned to a specific Agent number from the Plan (Code-layer graph).

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

---

## TL;DR -- Hard Rules

- **PRD is the sole authority**: Feature definitions defer to the PRD; the Plan is the execution path
- **Only work on the Phase assigned to this Agent** -- no boundary crossing. Role is determined by the Plan assignment table `Role` column (`task`/`e2e`); do not guess
- **Acceptance evidence goes in `agent-<n>-status.md`** -- do not pollute the Plan file
- **Plan writeback**: Update the Plan when deviating, but **spec content changes must never be edited in place -- must use `[-Pn]` + `[+Pnew]` + `supersedes`**
- **Breaking downstream packages**: Whoever breaks it fixes it; append a repair Phase at the end of the Plan
- **verify exemption**: For cross-package breaking changes, typecheck may be deferred (`[verify:deferred-typecheck]`), but unit tests for the current package must pass
- **Do not touch other Agents' code/tests**; if issues are found, record them only -- do not fix

---

## Agent Responsibility Boundaries

### Must Do

- Complete all guide steps for Nodes marked [new]/[modified]/[delete] in the Phase assigned to this Agent in the Plan
- Write tests for new code (corresponding to acceptance criteria marked `[test]` in `[Pn][spec]`)
- Pass quality gates (per the verify level noted in the Plan)
- Update the Plan file when implementation deviates from the Plan

### Must NOT Do

- Complete other Agents' Phases/Tasks
- Fix errors caused by other Agents (record only)
- Modify code outside the scope of this Phase (exception: downstream compilation debt)
- Make unauthorized changes to the PRD (raise `[Requires Human Approval]` when needed)
- Recommend next steps after completion

---

## Input

| Parameter | Required | Description |
|-----------|----------|-------------|
| **Agent number** | Yes | e.g. `1`, `2`, `3` |
| **Plan file path** | Yes | Path to the Plan document |

Before execution, automatically load the PRD and architecture documents referenced at the top of the Plan.

---

<reference>

## Acceptance Criteria Validation Protocol

Every `[Pn][spec]` must have a verification action and evidence; checking it off without these is forbidden.

| Verification Type | Verification Action | Evidence Required |
|-------------------|--------------------|--------------------|
| `[test]` | Run tests | Test output shows pass |
| `[compile]` | `bun run typecheck` | Compilation with no errors |
| `[inspect]` | Read code | File path + line number |
| `[run]` | Execute command | Command output matches expectation |

**Forbidden:**
- Checking off `[test]` without actually running the tests
- Writing vague evidence like "-> confirmed"
- Checking off based on an assumption that "it should pass"

Acceptance evidence is written to `<design-dir>/<version>/agent-<n>-status.md`, keeping the Plan clean:

```markdown
# Agent 1 Acceptance Status

## Phase 1: Refund Service Implementation

### Symbol(class) "RefundService" [new]

- [x] [P1][spec] "Return 400 error when refundAmount > order.totalAmount"
  -> `bun test refundService.test.ts` 8/8 pass

- [x] [guide] "Create refund service, implement refund request and amount validation"
  -> Executed; file src/services/refundService.ts created

### Quality Gate
- [x] `bun run --filter @acme/order-service test` all pass
- [ ] `bun run typecheck` [verify:deferred-typecheck] downstream payment-gateway temporarily fails compilation
```

## Quality Gates

| Role | During Development | Before Completion |
|------|-------------------|-------------------|
| `task` | `/verify fast` | Verify level noted in Plan |
| `e2e` | `/verify fast` | `/verify full` |

**Cross-package breaking change exemption**: Typecheck may be deferred (mark `[verify:deferred-typecheck]`), but unit tests for the current package must pass. The last Agent in the chain runs the full-repo typecheck.

## Plan Writeback Rules

| Deviation Type | Handling |
|---------------|----------|
| Code location changes (file paths, line numbers) | Directly update path information in the Plan |
| Node additions/deletions | Append `[new]`/`[delete]` Node + corresponding Facts in the Plan |
| **Spec content changes** | **NEVER edit in place. Must use `[-Pn]` + `[+Pnew]` + `supersedes`** |
| Major deviation (architecture change) | **Pause**, report to the user, wait for confirmation |
| Plan conflicts with PRD | **Pause**, implement per the PRD |
| Broke a package outside this Phase | **Append a repair Phase at the end of the Plan** |

**Downstream compilation debt**: Packages broken by this Agent must be fixed in place (the sole exemption to "only work on this Phase"), and a repair Phase is appended at the end of the Plan:

```markdown
### Phase N+1: Fix Downstream Compilation Debt (appended by Agent X writeback)
Package: @acme/payment-gateway | Depends on: Phase X
Reason: Agent X modified the @acme/order-service interface, causing payment-gateway compilation failure

[guide] "Fix references to the old interface in payment-gateway"
[Pnew][spec] "payment-gateway typecheck passes"
  > [compile] bun run --filter @acme/payment-gateway typecheck
```

## E2E Test Responsibilities

Role is determined by the Plan Agent assignment table `Role` column (do not infer from "being the last agent"):

```markdown
| Agent | Phase | Package | Role | Depends On | verify Level |
|-------|-------|---------|------|------------|-------------|
| Agent 1 | Phase 1 | @acme/order-service | task | None | `/verify fast` |
| Agent 2 | Phase 2 | @acme/payment-gateway | task | Agent 1 | `/verify` |
| Agent 3 | E2E | e2e | e2e | Agent 2 | `/verify full` |
```

If no `Role` column exists or there is no `e2e` role, all Agents are `task`.

| Role | Responsibility | Does NOT Do |
|------|---------------|-------------|
| `task` | Business code + unit tests | Does not touch `packages/e2e/` |
| `e2e` | Implement E2E tests (per verification type) | Does not modify business code |

**e2e Agent processing by verification type:**

| Verification Type | e2e Agent Action | Output |
|-------------------|-----------------|--------|
| `[AUTO]` | Convert `test.todo` to `test`, write assertions | Executable `bun test` tests |
| `[AGENT]` | Execute verification steps from comments, record results in `agent-<n>-status.md` | Verification evidence in status |
| `[HUMAN]` | Keep `test.todo` placeholder, mark "pending human verification" in status with execution steps | Human verification checklist |

**[AGENT] verification evidence format:**

```markdown
### IT-XXNN-03: Package Export Completeness [AGENT]
- [x] Verification passed
  -> Method: `bun run --filter @acme/order-service typecheck` + read index.ts to confirm exports
  -> Evidence: index.ts:L5-L12 exports RefundService/OrderStatus/RefundReason
```

## Error Handling

**Issues belonging to other Agents** -- do not fix, only record:

```markdown
## Discovered Issues (Not This Agent's Responsibility)

| Issue | Suspected Source | Impact |
|-------|-----------------|--------|
| `TypeError: xxx` | Agent 2 | Blocks this Phase |
```

**Blocking dependencies**: If a prerequisite Agent has not completed --> stop and report the blocking reason.

</reference>

---

<procedures>

## Procedures (Execute in Order)

### Step 1: Input Collection (Inversion -- Ask Before Acting)

**The following inputs must be confirmed. If any item is missing, pause immediately and ask the user:**

| Required Item | Description | When Missing |
|---------------|-------------|--------------|
| Agent number | e.g. `1`, `2`, `3` | Ask which Agent to execute |
| Plan file path | `<design-dir>/<version>/plan.md` | Ask for the Plan path |

After confirming inputs, read the Plan --> locate the Agent split section --> identify the Phases assigned to this Agent --> extract all Nodes and their Facts.

**Prerequisite dependency check**: Inspect the "Depends On" column in the Plan assignment table. If a prerequisite Agent has not completed --> **stop immediately**, report the blocking reason to the user, and do not begin implementation.

### Step 2: Implement Node by Node

For each `[new]`/`[modified]` Node:
1. Read `[guide]` --> understand the implementation steps
2. Read `-> implements: PRD[Sn]` --> open the PRD to confirm the business specification
3. Execute the guide steps
4. Validate each `[Pn][spec]` (per the acceptance validation protocol)
5. Record acceptance results in `agent-<n>-status.md`

For `[delete]` Nodes:
1. Facts expire automatically with the Node -- no need to `[-Pn]` each one
2. Only process Facts that the Plan marks for migration
3. Delete the code
4. Verify tests pass

**The following situations require pausing and confirming with the user before continuing:**
- Implementation reveals a direct conflict between Plan and PRD (cannot satisfy both)
- Need to modify an interface outside this Phase's scope (not compilation debt repair)
- A major architectural deviation is discovered (e.g. a class/interface the Plan expects does not exist at all)

### Step 3: Run Quality Gates

Run `/verify` at the verify level specified in the Plan assignment table.

### Step 4: Plan Writeback

If implementation deviates from the Plan, update the Plan file per the writeback rules.

### Step 5: End Checks (All Must Pass Before Completion)

**Implementation completeness**
- [ ] All guide steps for `[new]`/`[modified]` Nodes in this Phase have been executed
- [ ] All `[delete]` Nodes have been deleted and migration Facts have been processed

**Acceptance evidence**
- [ ] All `[Pn][spec]` have been validated with attached evidence (no "should pass" assumptions)
- [ ] `[test]` specs have actual test output; `[compile]` specs have compilation command output; `[inspect]` specs have file path + line number

**Consistency**
- [ ] Plan and implementation are consistent (deviations have been updated per writeback rules)
- [ ] Quality gates have been executed (errors caused by this Agent are fixed; errors caused by other Agents are recorded in status.md)

**Completion is forbidden if:**
- Any `[Pn][spec]` is checked off without verification
- Plan and implementation are inconsistent but no writeback was done
- Test failures caused by this Agent remain
- verify has not been run

---

## Usage

```bash
/implement-by-plan --agent 1 --plan design/v0.5.0/plan.md

# Shorthand
/implement-by-plan 1 design/v0.5.0/plan.md
```

</procedures>
