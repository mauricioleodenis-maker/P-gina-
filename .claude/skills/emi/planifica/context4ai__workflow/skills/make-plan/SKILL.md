---
name: make-plan
description: "Model implementation plans as a Code-layer knowledge graph (Package/Symbol Nodes + Edges + Facts organized by Phase). Maps PRD specs to Plan specs via implements relationships and assigns Agents for execution."
---

# /make-plan - Implementation Plan Modeling (Code-Layer Graph)

Based on the PRD (Product-layer graph), model the implementation plan as a Code-layer Node / Edge / Fact graph.

## Design Workspace (design-dir)

The default workspace for design documents is `design/`. When the Agent starts, it checks:

1. `design/` directory exists -> use `design/` as `<design-dir>`
2. `design/` does not exist -> **pause and ask the user for the design workspace path**, explaining the accepted organizational structure:
   ```
   <design-dir>/<version>/(prd|plan).md
   Examples: design/v1.0.1/prd.md, design/v0.5.0/plan.md
   ```

**`design/archive/`**: Archived or inactive design documents. When exploring existing graph structures, treat as **low-priority reference** -- prioritize reading active version directories, and only fall back to archive when relevant context cannot be found in active versions.

All subsequent paths using `<design-dir>` refer to this directory.

---

## TL;DR -- First-Screen Hard Rules

- **Input**: PRD + core architecture docs (required)
- **Output**: Package/Symbol Node tree + Edges + Facts (organized by Phase), written to `<design-dir>/<version>/plan.md`
- **Prohibited**: Do not produce Product Nodes (that belongs to PRD); example code <=10 lines
- **Minimum output**: Every [new]/[modified] Node >= 1 `[guide]` + >= 1 `[spec]` (leaf nodes may reuse parent's)
- **Spec numbering**: Plan uses `[P1]` `[P2]` ...; implements uses `-> implements: PRD[S3]`
- **Coverage requirement**: Every PRD `[Sn]` spec must be implemented by at least 1 Plan spec
- **Internal must be listed too**: Plan is a change manifest not a repository snapshot; internal Symbols are marked `visibility=internal`
- **corresponds should target Symbol-level**, do not coarsely connect to Package
- **Fact changes**: Modifying old Facts requires `[-kind]` + `[+kind]` + `supersedes` association
- **content <= 256 chars**, detail is optional inline (`>` block); over 100 lines link to `details/`
- **Code exploration must use tools** (Glob/Grep/Read); never fabricate file paths

---

## Agent Responsibility Boundaries

- Allowed: Model the implementation plan as Code-layer Nodes + Edges + Facts
- Allowed: Establish corresponds / implements relationships between Code-layer and Product-layer
- Not allowed: Produce Product-layer modeling <- `/make-prd`
- Not allowed: Write complete implementation code (example Fact code <= 10 lines)
- Not allowed: Recommend next steps after completion

---

## Input

| Input | Required | Description |
|-------|----------|-------------|
| **PRD** | Yes | Product-layer graph produced by `/make-prd` |
| **Core architecture docs** | Yes | Design documents most relevant to the PRD |

Optional: other architecture docs, background documents, historical Plans.


<reference>

## Concept Definitions

This methodology models using three layers of Nodes: **Product (business) -> Package (code organization) -> Symbol (code implementation)**. Plan focuses on the Package and Symbol layers. The Product kinds in PRD are domain / application / story (not feature). Plan connects to PRD stories via `corresponds` and `implements` relationships.

### Package Node

A code organizational unit with exports, boundaries, and dependency contracts. The kind expresses its runtime role.

| kind | Definition | Identification | Example |
|------|-----------|----------------|---------|
| `app` | Frontend/client application | Has build config (vite/next/webpack) | @acme/shop-web |
| `service` | Backend service (independently deployable, has a port) | Has entry point + framework dependency | @acme/order-service |
| `lib` | Dependency library (imported by others) | Has exports/main, no startup script | @acme/shared-utils |
| `cli` | Command-line tool | Has bin field | @acme/shop-cli |

**Package contains Package**: A monorepo root package containing sub-packages is valid.

**Isolation rule**: Package unique key is `(language, name, source_id)`. Same-named packages in different repos do not interfere with each other. Public-domain packages marked canonical have source_id=null and are globally shared.

### Symbol Node

| kind | Definition | Example |
|------|-----------|---------|
| `function` | Function | createOrder |
| `class` | Class | OrderService |
| `interface` | Interface | IPaymentGateway |
| `type` | Type alias | OrderStatus |
| `enum` | Enum | RefundReason |
| `variable` | Variable/constant | MAX_REFUND_DAYS |
| `component` | UI component | ProductCard |
| `prop` | Property/field | totalAmount |
| `method` | Method | OrderService.refund() |
| `endpoint` | HTTP/RPC entry point | POST /orders |
| `config` | Configuration item | payment.yaml |
| `hook` | Hook | useCart |
| `process` | Multi-step process orchestration | Refund approval workflow |

**Symbol contains Symbol**: Classes/components contain properties/methods, only one level deep without recursion:

```
OrderService (kind=class)
  +-- contains -> createOrder (kind=method)
  +-- contains -> refund (kind=method)
  +-- contains -> status (kind=prop)
```

**visibility**: exported / public / protected / internal. The graph only includes exported + direct members; internal is stored as digest.

**Warning: Plan is a change manifest, not a repository snapshot**: Even internal Symbols must be listed in the Plan's Nodes tree (marked `visibility=internal`).

### Edge Types

| type | Meaning | Usage in Plan |
|------|---------|---------------|
| `contains` | Hierarchical containment (Package->Package/Symbol, Symbol->Symbol) | Annotate modification scope |
| `depends_on` | Package-level dependency | Determine Phase execution order |
| `corresponds` | Two perspectives of the same thing (Code <-> Product) | Link to Product layer |
| `imports` | Import dependency (runtime) | Annotate interface contracts |
| `calls` | Function call | Annotate call chain changes |

Others (imports_type/extends/implements/param_type/return_type/of_type/related_to) are used as needed. **corresponds should target Symbol-level first**.

### Fact kind

| kind | Role in Plan | content | detail |
|------|-------------|---------|--------|
| `guide` | **Implementation steps** (required) | Imperative sentence, step summary | Full steps |
| `spec` | **Acceptance criteria** (required) | Object + condition + value | Verification method |
| `warning` | Technical risk | Trigger condition + consequence | Mitigation approach |
| `example` | Code snippet | **Natural language description** (no code) | Code (<= 10 lines) |
| `decision` | Technology choice | What was chosen + why | Alternative comparison |

Plan **does not use** description / principle / incident / changelog.

### spec Verification Types

| Marker | Applicable scenario | Example |
|--------|-------------------|---------|
| `[test]` | Run tests | `[test] CRUD operations pass unit tests` |
| `[compile]` | Compilation check | `[compile] TypeScript compiles with no errors` |
| `[inspect]` | Code inspection | `[inspect] New field added to type definition` |
| `[run]` | Execute command | `[run] Migration script completes with data integrity` |

### Business spec vs Technical spec

| Category | Format | implements |
|----------|--------|------------|
| Business spec (default) | `[Pn][spec] "description"` | **Must** have `-> implements: PRD[Sn]` |
| Technical spec | `[Pn][spec][technical] "description"` | Allowed to have no implements |

```markdown
# Business spec (default, must have implements)
[P5][spec] "refundAmount > order.totalAmount returns 400 error"
  > [test] Boundary value unit test
  -> implements: PRD[S1]

# Technical spec (explicit marker, may have no implements)
[P6][spec][technical] "TypeScript compiles with no errors"
  > [compile] bun run typecheck
```

**Only specs with the `[technical]` marker are allowed to have no implements.**

### kind Determination Priority

The same information may fit multiple kinds. Match from top to bottom and stop at the first hit:

```
example > guide > decision > spec > warning > description
```

### content + detail Specification

**content** (required): <= 256 chars, one semantic unit per entry. guide uses imperative mood. spec must include verification type.

**detail** (optional): inline with `>` block quote. Over 100 lines -> link to `<design-dir>/<version>/details/`.

**example content/detail division**: content is **natural language description** (what to do), detail is **the code itself** (<= 10 lines).

### Fact Change Markers

`[+spec]` new, `[-spec]` deprecated. No `[~]`. Modifications always use `[-]` + `[+]` + `supersedes`:

```markdown
[+spec] "Refund timeout retry limit changed to 5"
  -> supersedes: [-spec] "Refund timeout retry limit was 3"
```

Fact relationships primarily use `implements` (Plan spec -> PRD spec) and `supersedes` (old-new replacement).

### Output Format Template

```markdown
# Plan: <title> <version>

> Phase count: N | Agent count: M | Total spec count: X (business: Y, technical: Z)

## Metadata

- PRD: `<design-dir>/<version>/prd.md`
- Scope: <one-sentence description of change scope>
- Baseline: <commit hash or version tag>

## Nodes

### Package: <package-name> (kind=<kind>) [new|modified|existing] <!-- source: path/to/package -->

#### Symbol: <symbol-name> (kind=<kind>, visibility=<vis>) [new|modified|existing] <!-- source: src/file.ts#L42 -->

[P1][guide] "Implementation step summary"
  > Detailed implementation steps

[P1][spec] "Object + condition + expected value"
  > [test] Verification method description
  -> implements: PRD[S1]

##### contains:

- Symbol: <child-symbol> (kind=<kind>, visibility=<vis>) [new|modified]

  [P1][guide] "Implementation step summary"

  [P1][spec] "Object + condition + expected value"
    > [test] Verification method
    -> implements: PRD[S2]

### Package: <another-package> (kind=<kind>) [existing]

#### Symbol: <symbol-name> (kind=<kind>, visibility=<vis>) [modified]

[P2][guide] "Implementation step summary"

[P2][spec][technical] "Technical acceptance criterion"
  > [compile] Verification command

## Edges

- <package-A> --depends_on--> <package-B>: "dependency description"
- <symbol-X> --calls--> <symbol-Y>: "call relationship description"
- <symbol-Z> --corresponds--> PRD/<story-name>: "mapping description"
- <symbol-W> --imports--> <symbol-V>: "import relationship"

## Phases

### Phase 1: <phase-title>

**Goal**: <one-sentence phase goal>

**Scope**: <list of Packages/Symbols involved>

**Entry criteria**: <preconditions, e.g., "Phase 0 completed" or "None">

**Exit criteria**:
- [P1] All specs pass

**Depends on**: None | Phase N

### Phase 2: <phase-title>

**Goal**: <one-sentence phase goal>

**Scope**: <list of Packages/Symbols involved>

**Entry criteria**: Phase 1 completed

**Exit criteria**:
- [P2] All specs pass

**Depends on**: Phase 1

## Agents

| Agent | Phase | Package/Symbol Scope | Responsibility |
|-------|-------|---------------------|----------------|
| agent-1 | Phase 1 | <package-A>/<symbol-X> | <responsibility summary> |
| agent-2 | Phase 2 | <package-B>/<symbol-Y> | <responsibility summary> |

## Execution Graph

```mermaid
graph LR
  P1[Phase 1: title] --> P2[Phase 2: title]
  P2 --> P3[Phase 3: title]
```

## Coverage Matrix

| PRD Spec | Plan Spec | Status |
|----------|-----------|--------|
| PRD[S1] | [P1] spec description | Covered |
| PRD[S2] | [P1] spec description | Covered |
| PRD[S3] | [P2] spec description | Covered |
```

</reference>

---

<procedures>

## Execution Steps (Execute in Order)

### Step 1: Locate and Read PRD

1. Check for existing PRD files in `<design-dir>`:
   - Use Glob to scan `<design-dir>/*/prd.md`
   - If multiple versions exist, select the latest active version (ignore `archive/`)
   - If no PRD found -> **stop and ask the user to provide the PRD path**

2. Read and parse the PRD:
   - Identify all Product Nodes (domain / application / story)
   - Extract all `[Sn]` specs -- these must all be covered by Plan specs
   - Note the PRD version for metadata

3. Confirmation checkpoint:
   ```
   Found PRD: <path>
   Version: <version>
   Stories: <count>
   Specs to cover: [S1], [S2], ..., [Sn]
   Proceed? (y/n)
   ```

### Step 2: Explore the Codebase

**Must use tools** (Glob/Grep/Read) for all code exploration. Never fabricate file paths or assume code structure.

1. Identify relevant packages:
   - Use Glob to find `package.json`, `Cargo.toml`, `go.mod`, or equivalent manifests
   - Map each manifest to a Package Node with the appropriate kind (app/service/lib/cli)
   - Note existing dependency relationships between packages

2. Identify relevant symbols:
   - Use Grep to search for key types, functions, classes mentioned in the PRD
   - Use Read to examine specific files for detailed structure
   - Map exported symbols and their visibility

3. Identify existing architecture patterns:
   - Look for existing design docs, type definitions, and interface contracts
   - Note the tech stack, frameworks, and conventions in use

4. Build a mental model of the current codebase structure:
   - Which packages exist and how they relate
   - Which symbols need to be created vs modified
   - Where the change boundaries lie

### Step 3: Design the Node Tree

Build the Package/Symbol Node tree based on the PRD requirements and codebase exploration.

1. For each PRD story, determine:
   - Which Package(s) are affected
   - Which Symbol(s) need to be created [new] or changed [modified]
   - Which existing Symbols are referenced but unchanged [existing]

2. Node annotation rules:
   - Every [new] or [modified] Node must have >= 1 `[guide]` and >= 1 `[spec]`
   - Leaf nodes may reuse parent's guide/spec if logically appropriate
   - Internal symbols must be listed with `visibility=internal`
   - Use the correct Symbol kind (function/class/interface/type/enum/variable/component/prop/method/endpoint/config/hook/process)

3. Containment hierarchy:
   - Package contains Package (for monorepo structures)
   - Package contains Symbol (top-level exports)
   - Symbol contains Symbol (class->method/prop, one level only)

### Step 4: Define Edges

1. **contains** edges: Implicit from the Node tree hierarchy (no need to list separately unless clarifying scope)

2. **depends_on** edges: Package-level dependencies that determine Phase ordering
   - Check actual `package.json` / `import` statements
   - New dependencies introduced by the plan

3. **corresponds** edges: Map Code-layer symbols to Product-layer stories
   - **Prefer Symbol-level mappings** over Package-level
   - Every PRD story should have at least one `corresponds` edge

4. **imports** edges: Runtime import dependencies between symbols across packages

5. **calls** edges: Function/method call relationships that are introduced or changed

### Step 5: Write Facts (guide + spec + others)

1. **guide Facts** (required for every [new]/[modified] Node):
   - Use imperative mood: "Add field X to interface Y", "Implement retry logic with exponential backoff"
   - content <= 256 chars
   - detail (optional) provides full step-by-step instructions in `>` block

2. **spec Facts** (required for every [new]/[modified] Node):
   - Format: `[Pn][spec] "object + condition + expected value"`
   - Must include verification type in detail: `[test]`, `[compile]`, `[inspect]`, or `[run]`
   - Business specs (default) **must** have `-> implements: PRD[Sn]`
   - Technical specs must be explicitly marked `[Pn][spec][technical]`

3. **Other Facts** (as needed):
   - `warning`: Technical risks with trigger conditions and consequences
   - `example`: Natural language description in content, code (<= 10 lines) in detail
   - `decision`: Technology choices with rationale

4. **Fact changes** for modified Nodes:
   - Never use `[~]` modifier
   - Always use `[-kind]` + `[+kind]` + `supersedes` for modifications

5. **Coverage check**: Every PRD `[Sn]` must be implemented by at least one Plan `[Pn][spec]`

### Step 6: Organize Phases and Assign Agents

1. **Phase design**:
   - Group related changes into Phases based on dependency order
   - Each Phase has: goal, scope, entry criteria, exit criteria, dependencies
   - Use `depends_on` edges to determine Phase ordering
   - Phases should be executable in the declared order (respecting dependencies)

2. **Agent assignment**:
   - Assign each Phase/scope to an Agent
   - Each Agent has a clear Package/Symbol scope and responsibility
   - Minimize cross-Agent dependencies within a Phase

3. **Execution graph**:
   - Create a Mermaid graph showing Phase dependencies
   - Verify no circular dependencies exist

4. **Coverage matrix**:
   - List every PRD spec and its corresponding Plan spec(s)
   - Verify 100% coverage -- every PRD `[Sn]` has at least one Plan spec

### Step 7: Write and Validate the Plan

1. Write the plan to `<design-dir>/<version>/plan.md` using the output format template

2. **Validation checklist** (verify all before finalizing):

   | # | Check | Rule |
   |---|-------|------|
   | 1 | Every [new]/[modified] Node has >= 1 guide + >= 1 spec | Minimum output rule |
   | 2 | Every business spec has `-> implements: PRD[Sn]` | implements requirement |
   | 3 | Every PRD `[Sn]` is covered by >= 1 Plan spec | Coverage requirement |
   | 4 | No Product Nodes in the plan | Product layer belongs to PRD |
   | 5 | Example code <= 10 lines | Code length limit |
   | 6 | content <= 256 chars per Fact | Content length limit |
   | 7 | Internal symbols listed with `visibility=internal` | Change manifest rule |
   | 8 | corresponds edges target Symbol-level (not Package) | Granularity rule |
   | 9 | Fact modifications use `[-]` + `[+]` + `supersedes` | Change marker rule |
   | 10 | No fabricated file paths (all verified by tools) | Tool usage rule |
   | 11 | Phases have no circular dependencies | Execution order rule |
   | 12 | Coverage matrix shows 100% PRD spec coverage | Coverage rule |

3. If any check fails, fix the issue before finalizing.

4. Present a summary to the user:
   ```
   Plan written to: <design-dir>/<version>/plan.md
   - Phases: N
   - Agents: M
   - Nodes: X (new: A, modified: B, existing: C)
   - Specs: Y (business: P, technical: Q)
   - PRD coverage: 100% (all Sn specs covered)
   ```

</procedures>
