# Plan Document Templates

Templates for the three documents generated in Phase 3 (Task Decomposition). Output to `docs/plan/`.

---

## task-breakdown.md

```markdown
# Task Breakdown

## Overview
- **Total Phases**: N
- **Total Tasks**: N
- **Planned Delivery Batches / PRs**: N
- **Estimated Total Effort**: S/M/L/XL

## S.U.P.E.R Design Constraints

> All tasks in this plan must produce code that conforms to S.U.P.E.R architecture principles. The following constraints apply globally:

- **S (Single Purpose)**: Each new module/file/function solves exactly one problem. If a task spans multiple responsibilities, decompose it further.
- **U (Unidirectional Flow)**: Data flows input → processing → output. Dependencies point inward. No circular imports.
- **P (Ports over Implementation)**: Define interface contracts (schemas, types) before implementation. All cross-module I/O must be serializable.
- **E (Environment-Agnostic)**: No hardcoded config. All env-specific values from environment variables or config files.
- **R (Replaceable Parts)**: Each component must be replaceable without cascading changes. Validate with the replacement test: "Can I swap this with a different implementation by only touching this module?"

## Testing and Governance Constraints

> These constraints apply to every task unless the task explicitly states why they are not applicable.

- **Tests by default**: Feature work, behavior changes, API/schema/migration changes, parsing, routing, permissions, caching, and persistence changes must add or update relevant automated tests.
- **Explicit test exemption**: Pure documentation/config tasks may mark tests as not applicable, but the acceptance criteria must explain why and name the closest validation command to run.
- **Agent instruction updates**: If a task changes how future agents must work in the repository, update the resolved instruction surfaces such as `AGENTS.md`, `CLAUDE.md`, or existing platform rule files.
- **Memory updates**: If a task introduces a durable rule, invariant, recurring gotcha, command, or project convention, update the resolved native memory surface or explicitly selected repo fallback.
- **Issue/PR separation**: Issues are atomic task and telemetry records. Delivery batches are implementation, integration validation, and PR units. Default to one coherent batch PR per phase; every split and every single-Issue batch must have a recorded rationale unless the phase contains only one Issue.

## Phase 1: <Phase Name>
**Goal**: What this phase achieves
**Prerequisite**: What must be done before this phase
**S.U.P.E.R Focus**: Which S.U.P.E.R principles are most relevant to this phase (e.g., "P — defining interface contracts before implementing modules")

| # | Task | Priority | Effort | Depends On | Lane | Delivery Batch | S.U.P.E.R | Test Expectation | Memory Impact | Acceptance Criteria |
|:--|:-----|:---------|:-------|:-----------|:-----|:---------------|:----------|:-----------------|:--------------|:--------------------|
| 1 |      | P0       | M      | —          | A    | P1-B1          | S, P      | Add/update tests | Update resolved memory surface if new invariant emerges |                     |
| 2 |      | P1       | S      | —          | B    | P1-B1          | U, E      | Not applicable: docs-only | None |                     |
| 3 |      | P1       | S      | 1          | A    | P1-B1          | R         | Add/update regression tests | Update resolved instruction surfaces if workflow rule changes |                     |

> **S.U.P.E.R column**: Lists which S.U.P.E.R principles are the primary design drivers for this task. The agent implementing this task must pay special attention to these principles. Every task's acceptance criteria implicitly includes: "Passes the S.U.P.E.R Quick Check for the listed principles."
> **Test Expectation column**: Must name the expected test work or the explicit no-test rationale plus closest validation command.
> **Memory Impact column**: Must state whether the task can affect the resolved memory surface or any resolved instruction surface.
> **Delivery Batch column**: Every task belongs to exactly one planned PR batch. The batch may contain several Issues even though each task becomes its own Issue.

### Parallel Lanes
| Lane | Tasks | Combined Effort | Merge Risk | Key Files |
|:-----|:------|:----------------|:-----------|:----------|
| A    | 1, 3  | M               | Low        |           |
| B    | 2     | S               | Low        |           |

> Tasks in different lanes have no mutual dependencies and can be executed simultaneously by separate `task-executor` sub-agents. Lane agents return commits; they do not open task-level PRs. Merge risk indicates the likelihood of file conflicts before integration into the delivery batch branch.

### Delivery Batches

| Batch | Tasks / Issues | Execution Waves | Goal and Grouping Rationale | Integration Branch | Combined Validation | Depends On | Split / Single-Issue Rationale |
|:------|:---------------|:----------------|:----------------------------|:-------------------|:--------------------|:-----------|:-------------------------------|
| P1-B1 | 1, 2, 3 / #TBD | W1: Lane A (T1 → T3) + Lane B (T2) | One coherent architecture and review unit | `batch/p1-b1-<slug>` | targeted tests + full affected build/smoke | — | Default phase-level batch |

> Review the complete phase task set before defining batches. Prefer one reviewable phase-level batch. Split only for a concrete reviewability, independent release/rollback, ownership, risk-isolation, hard dependency, or repository/user policy boundary; do not split mechanically by Issue count.

## Phase 2: <Phase Name>
<!-- Same structure as Phase 1 -->
```

---

## dependency-graph.md

````markdown
# Task Dependency Graph

```mermaid
graph TD
    subgraph Phase1 [Phase 1: Foundation]
        subgraph P1B1 [Delivery Batch P1-B1]
            T1_1[Task 1.1: Description]
            T1_2[Task 1.2: Description]
            T1_1 --> T1_2
        end
    end

    subgraph Phase2 [Phase 2: Core]
        subgraph P2B1 [Delivery Batch P2-B1]
            T2_1[Task 2.1: Description]
            T2_2[Task 2.2: Description]
        end
    end

    P1B1 --> P2B1
```
````

---

## milestones.md

```markdown
# Milestones

| # | Milestone | Target Phase | Criteria | Status |
|:--|:----------|:-------------|:---------|:-------|
| 1 |           | After Phase 1|          | Pending |
| 2 |           | After Phase 3|          | Pending |
```
