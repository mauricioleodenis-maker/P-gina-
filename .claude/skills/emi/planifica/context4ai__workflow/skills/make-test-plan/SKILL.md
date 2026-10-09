---
name: make-test-plan
description: "Generate E2E test skeletons from PRD + Plan. Creates version test index (README.md) and bone-skeleton test files with test.todo placeholders, categorized by verification type (AUTO/AGENT/HUMAN)."
---

# Make Test Plan

Generates E2E test skeleton files from a PRD (Product Requirements Document) and Plan. Creates a version test index (`README.md`) and bone-skeleton test files using `test.todo(...)` placeholders, categorized by verification type.

---

## Agent Responsibility Boundaries

The agent's role when running `/make-test-plan` is strictly limited to:

1. **Generate** test skeleton files with `test.todo(...)` placeholders
2. **Create** a version test index (`README.md`) documenting all planned tests
3. **Categorize** each test by verification type (AUTO / AGENT / HUMAN)
4. **Update** the Plan file with E2E coverage references

The agent MUST NOT:

- Implement test assertions or actual test logic — only `test.todo(...)` placeholders
- Modify feature source code
- Run or execute any tests
- Make decisions about feature implementation

---

## Three Verification Types

Tests are categorized by how they can be verified. The guiding principle is to **minimize HUMAN tests** — prefer AUTO whenever possible, fall back to AGENT, and only use HUMAN as a last resort.

| Type | Symbol | Meaning | Who Verifies |
|---|---|---|---|
| **AUTO** | `[A]` | Fully automatable with deterministic assertions | CI / `/verify` |
| **AGENT** | `[G]` | Requires agent judgment (visual diff, semantic check, heuristic) | AI agent during `/verify` |
| **HUMAN** | `[H]` | Requires human interaction, subjective evaluation, or physical device | Human tester |

### Preference Order: AUTO > AGENT > HUMAN

When deciding the verification type for a test:

1. **Can the assertion be expressed as a deterministic code check?** (string match, status code, DOM state, data comparison) → **AUTO**
2. **Can an AI agent evaluate it with sufficient confidence?** (visual layout, semantic content quality, heuristic rules) → **AGENT**
3. **Does it require physical interaction, subjective judgment, or real-world side effects?** (UX feel, hardware behavior, payment flow) → **HUMAN**

---

## E2E Implementation Ownership

The test lifecycle spans multiple skills and roles:

| Stage | Responsible Skill / Role | Output |
|---|---|---|
| 1. Skeleton generation | `/make-test-plan` (this skill) | `test.todo(...)` placeholder files |
| 2. Assertion implementation | Developer / `/implement-by-plan` | `test(...)` with real assertions |
| 3. Feature code implementation | Developer / `/implement-by-plan` | Feature source code that makes tests pass |
| 4. Verification | `/verify` | Pass/fail results |

This skill handles **Stage 1 only**.

---

<project-config>

## Project-Specific Configuration

> **Note:** This section contains project-specific settings. Users should customize these values to match their project structure.

### Directories

```
design_dir: design/           # Where PRD and Plan documents live
e2e_dir: e2e/                 # Root directory for E2E test files
```

### Test Framework

```
framework: <test-framework>   # e.g., bun:test, vitest, playwright
file_extension: .test.ts      # Test file extension
```

### Docker Isolation

E2E tests that interact with external services or require environment isolation should be tagged for Docker execution:

```
docker_tag: @docker           # Tag in test description for Docker-required tests
docker_compose: e2e/docker-compose.yml
```

</project-config>

---

## Stable / Native Split Rules

E2E tests are split into two categories based on their runtime requirements:

| Category | Directory | Criteria | Runs In |
|---|---|---|---|
| **Stable** | `e2e/stable/` | Pure logic, API calls, data transforms, DOM assertions — no native modules | Standard runtime |
| **Native** | `e2e/native/` | Requires native modules, OS-specific APIs, file system, network sockets, Docker | Native runtime or Docker |

### Decision Rule

- If the test can run in a pure JS/TS runtime without native dependencies → **Stable**
- If the test requires native bindings, OS APIs, Docker, or hardware access → **Native**
- When in doubt, prefer **Stable** — it can always be moved to Native later

---

## Procedures

### Step 0 — Input Collection

1. Identify the target version (from arguments or prompt the user)
2. Locate the PRD document: `<design_dir>/<version>/PRD.md`
3. Locate the Plan document: `<design_dir>/<version>/Plan.md`
4. Verify both documents exist. If either is missing, report the error and stop

### Step 1 — Analyze PRD

1. Read the PRD document
2. Extract all user-facing features and requirements
3. For each feature, identify:
   - Feature name and ID (from PRD graph nodes)
   - Expected user behavior / acceptance criteria
   - Edge cases mentioned in the PRD
4. Build a feature list for test coverage mapping

### Step 2 — Analyze Plan

1. Read the Plan document
2. Extract all implementation tasks
3. For each task, identify:
   - Task name and ID (from Plan graph nodes)
   - Which PRD feature(s) it implements
   - Technical approach and components involved
   - Any existing E2E references already in the Plan
4. Build a task-to-feature mapping

### Step 3 — Generate Version Directory and Files

1. Create the version test directory: `<e2e_dir>/<version>/`
2. Generate the version test index: `<e2e_dir>/<version>/README.md`
3. Generate skeleton test files (one per feature or feature group)

#### README.md Format

```markdown
# E2E Test Plan — <version>

Generated from: PRD <version> + Plan <version>
Generated at: <timestamp>

## Coverage Matrix

| # | Feature | Test File | Type | Stable/Native | Status |
|---|---|---|---|---|---|
| 1 | <feature-name> | `<test-file>` | AUTO | Stable | todo |
| 2 | <feature-name> | `<test-file>` | AGENT | Stable | todo |
| 3 | <feature-name> | `<test-file>` | HUMAN | — | manual |

## Verification Type Summary

- AUTO: <count> tests
- AGENT: <count> tests
- HUMAN: <count> tests (manual verification required)
- Total: <count>
```

#### Skeleton Test File Format

```typescript
/**
 * E2E: <feature-name>
 * PRD: <prd-node-reference>
 * Plan: <plan-task-reference>
 * Type: AUTO | AGENT | HUMAN
 * Layer: stable | native
 */
import { describe, test } from "<test-framework>";

describe("<feature-name>", () => {
  test.todo("<test-case-description-1>");

  test.todo("<test-case-description-2>");

  test.todo("<edge-case-description>");
});
```

#### Naming Rules

- Test files: `<feature-id>-<feature-name-kebab>.test.ts`
- Use lowercase kebab-case for file names
- Prefix with feature ID for ordering
- Group related small features into a single file if they share context

### Step 4 — Scan Plan for Existing E2E Content

1. Search the Plan document for any pre-existing E2E test descriptions or references
2. If found, incorporate them into the skeleton (as `test.todo` descriptions, NOT as implementations)
3. Do not duplicate — if the Plan already specifies a test case, use its description verbatim

### Step 5 — Update Plan File

1. Add an "E2E Coverage" section to the Plan (or update it if one exists)
2. List all generated test files with their verification types
3. Mark each Plan task with its corresponding test file reference
4. This creates traceability: Plan task → test file → PRD feature

---

## File Format Specifications

### Docker Isolation Tagging

For tests that require Docker isolation, include the docker tag in the test description:

```typescript
describe("<feature-name> @docker", () => {
  test.todo("<test-requiring-docker>");
});
```

### Skeleton vs Implementation

A skeleton file contains ONLY:
- File header comment (PRD/Plan references, type, layer)
- Import statement
- `describe` block(s)
- `test.todo(...)` calls

A skeleton file MUST NOT contain:
- Actual assertions (`expect`, `assert`)
- Setup/teardown logic (`beforeEach`, `afterAll`)
- Helper functions or utilities
- Import of application code

---

## Output Checklist

After running `/make-test-plan`, verify the following:

### Structure
- [ ] Version directory created: `<e2e_dir>/<version>/`
- [ ] README.md index file created
- [ ] All skeleton test files created with correct naming

### Content
- [ ] Every PRD feature has at least one corresponding test
- [ ] Every test has a verification type assigned (AUTO/AGENT/HUMAN)
- [ ] Every test has a stable/native classification
- [ ] HUMAN tests are minimized — justify each one
- [ ] `test.todo(...)` descriptions are clear and actionable

### Coverage
- [ ] No PRD feature is left uncovered
- [ ] Edge cases from PRD are represented as test cases
- [ ] Plan tasks map to test files (traceability)

### Plan Review
- [ ] Existing E2E content in Plan was incorporated (not duplicated)
- [ ] No contradictions between Plan and generated test plan

### Plan Update
- [ ] Plan file updated with E2E Coverage section
- [ ] Plan tasks annotated with test file references
