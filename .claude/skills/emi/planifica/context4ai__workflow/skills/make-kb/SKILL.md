---
name: make-kb
description: "Extract structured knowledge graphs from existing materials (documents, code, or both). Produces a source-traced knowledge base with domain/application/story Nodes, optionally extended with Package/Symbol Nodes from code."
---

# /make-kb - Knowledge Base Generation (Source-Traced Graph)

Extract structured knowledge graphs from **existing materials** — documents, code, or both — with `<!-- source: path -->` traceability on every Node.

**Difference from `/make-prd` and `/make-plan`**:
- `/make-prd` designs a PRD **forward** from requirement descriptions (new features, RFCs)
- `/make-plan` designs a Plan **forward** from a PRD
- `/make-kb` works **backward** from existing artifacts — it reads what already exists and organizes it into a structured graph. The output represents **current state**, not planned changes

**Applicable to both technical and non-technical projects:**
- Technical: codebase architecture, API documentation, system design docs
- Non-technical: business processes, organizational knowledge, policy documents, research notes, operational runbooks

---

## TL;DR -- Hard Rules

- **Input**: File/directory paths + version number (required)
- **Output**: `<design-dir>/<version>/prd.md` (knowledge graph), optionally `plan.md` (code graph when code is provided)
- **Every Node must have `<!-- source: path -->` or `<!-- source: path#LN -->`** pointing to the originating file
- **All Nodes default to `[existing]`** — this is a snapshot, not a change plan
- **Do not fabricate source paths** — every `<!-- source: -->` must point to a file the Agent has actually read
- **Code layer is optional** — docs-only produces prd.md; adding code produces plan.md with `corresponds` edges linking the two layers
- **Adapt the graph depth to the material** — a small doc may only need domain + a few stories; a large project may need the full three-layer hierarchy

---

## Design Workspace (design-dir)

The default workspace for design documents is `design/`. When the Agent starts, check:

1. `design/` directory exists -> use `design/` as `<design-dir>`
2. `design/` does not exist -> **pause and ask the user for the design workspace path**, explaining the accepted directory structure:
   ```
   <design-dir>/<version>/(prd|plan).md
   Examples: design/v1.0.1/prd.md, design/v0.5.0/plan.md
   ```

---

## Source Annotation Format

Every Node line in the output **must** include a source annotation as an HTML comment after the status marker:

```markdown
Product(domain) "Supply Chain" [existing] <!-- source: docs/overview.md -->
Product(application) "Inventory Management" [existing] <!-- source: docs/inventory-sop.md#L12 -->
Product(story) "Warehouse clerk checks stock levels" [existing] <!-- source: docs/inventory-sop.md#L45 -->
Package(library) "@acme/indexer" [existing] <!-- source: packages/indexer/package.json -->
Symbol(function) "buildIndex" [existing] <!-- source: packages/indexer/src/index.ts#L120 -->
```

**Rules:**
- Path is relative to the project root (or absolute if scanning external files)
- `#LN` line anchor is optional but encouraged for precision
- For code Symbols, link to the definition site (function/class declaration line)
- For Packages, link to the package entry point or manifest
- For Product Nodes from docs, link to the section/paragraph that describes the concept

---

## Agent Responsibility Boundaries

- ✅ Read provided materials and extract knowledge graph Nodes + Edges + Facts
- ✅ Annotate every Node with `<!-- source: path -->`
- ✅ When code is provided, extract Code-layer Nodes and link to Product layer via `corresponds`
- ❌ Do not modify any source files
- ❌ Do not write implementation code
- ❌ Do not recommend next steps after completion

---

## Input

| Input | Required | Description |
|-------|----------|-------------|
| **Paths** | ✅ | One or more file/directory paths to scan |
| **Version number** | ✅ | e.g., `v1.0.0` |
| **Scope hint** | Optional | Focus area or filter (e.g., "only the auth module", "just the onboarding docs") |

**Examples:**
```
/make-kb docs/ v1.0.0
/make-kb docs/sop/ v1.0.0 -- non-technical: operational runbooks
/make-kb research/ v1.0.0 -- research notes and reports
/make-kb src/ docs/rfc.md v1.0.0 -- technical: code + docs
/make-kb packages/indexer/ v0.5.0 -- code only
```

---

<reference>

## Concept Definitions

The knowledge graph uses a layered Node model. **Only the Product layer is required**; the Code layer is added only when code is provided as input.

### Product Layer (always produced → prd.md)

Product Nodes represent **knowledge concepts** — business domains, capabilities, processes, or user behaviors. Three kinds by level:

| kind | Definition | Criteria | Examples |
|------|-----------|----------|----------|
| `domain` | Knowledge domain, the top-level organizational partition | Highest level, globally unique | Payments domain, Supply Chain, Research Program |
| `application` | A capability area with an independent identity. Supports recursion: sub-areas modeled as child applications | Has its own scope and stakeholders | "Inventory Management", "User Onboarding", "Data Pipeline" |
| `story` | A concrete behavior or process — who does what and gains what value | Has a role/actor + goal + value/outcome | "Clerk checks stock levels", "Analyst generates quarterly report", "Developer indexes a repo" |

**Hierarchy**: domain → application → story. application may contain child applications. Stories do not recurse — split into sibling stories.

**story is a knowledge asset, not a to-do item**: It describes a current capability or process that exists in the material being analyzed. The "role" can be any actor — end user, employee, system, developer, operator.

**For technical projects with a product interface**: spec should describe behavior verifiable through the interface (Web UI / CLI). For non-technical projects or projects without an interface: spec describes observable outcomes or measurable criteria from the source material.

### Code Layer (optional, only when code is provided → plan.md)

#### Package Node

| kind | Definition | Example |
|------|-----------|---------|
| `app` | Frontend/client application | @acme/shop-web |
| `service` | Backend service (independently deployable) | @acme/order-service |
| `lib` | Dependency library | @acme/shared-utils |
| `cli` | Command-line tool | @acme/shop-cli |

#### Symbol Node

| kind | Definition | Example |
|------|-----------|---------|
| `function` | Function | createOrder |
| `class` | Class | OrderService |
| `interface` | Interface | IPaymentGateway |
| `type` | Type alias | OrderStatus |
| `enum` | Enum | RefundReason |
| `variable` | Variable/constant | MAX_RETRY |
| `component` | UI component | ProductCard |
| `method` | Method | OrderService.refund() |
| `endpoint` | HTTP/RPC entry point | POST /orders |
| `hook` | Hook | useCart |

**Symbol contains Symbol**: Classes/components contain methods/props, one level only.

### Edge Types

| type | Meaning | Example |
|------|---------|---------|
| `contains` | Hierarchical containment | domain→application→story, Package→Symbol |
| `depends_on` | Dependency (A must exist for B) | "Refund" depends_on "Order" |
| `corresponds` | Same entity across layers | Product("Place order") corresponds Symbol(createOrder) |
| `imports` | Import dependency (code layer) | Symbol-level runtime imports |
| `calls` | Function call (code layer) | Symbol-level call relationships |
| `refines` | Story refinement (N:N) | Child story refines parent story |
| `related_to` | General association | Loose coupling between entities |

### Fact Kinds

**Product layer:**

| kind | Attaches to | Description |
|------|------------|-------------|
| `description` | domain, application, story | Definition — needed at every level |
| `spec` | story only | Observable outcome or acceptance criterion, `[Sn]` numbered |
| `warning` | application, story | Risks or caveats noted in the source material |
| `decision` | application, story | Choices made (include alternatives + rejection reason if available) |
| `principle` | domain, application | Guiding philosophy or policy |

**Code layer (when applicable):**

| kind | Description |
|------|-------------|
| `guide` | Description of current behavior or implementation approach |
| `spec` | Acceptance criteria with verification type: `[test]`, `[compile]`, `[inspect]`, `[run]` |
| `warning` | Technical risks |
| `decision` | Technology choices |
| `example` | Code snippet (content = natural language, detail = code ≤ 10 lines) |

### Content Rules

- **content** (required): ≤ 256 characters, one semantic unit per entry
- **detail** (optional): Inline using `>` block quotes; if over 100 lines, link to `<design-dir>/<version>/details/`
- **Fact numbering**: PRD uses `[S1][S2]...`, Plan uses `[P1][P2]...`

</reference>

---

## Output Format Templates

### PRD Output (knowledge graph from docs)

```markdown
# [Project/Topic Name] [Version] Knowledge Base

> Extracted from existing documentation

---

## Graph

### Nodes

Product(domain) "Supply Chain" [existing] <!-- source: docs/overview.md -->
  └─ Product(application) "Inventory Management" [existing] <!-- source: docs/inventory-sop.md -->
       ├─ Product(story) "Clerk checks stock levels" [existing] <!-- source: docs/inventory-sop.md#L30 -->
       ├─ Product(story) "Clerk submits restock request" [existing] <!-- source: docs/inventory-sop.md#L85 -->
       └─ Product(story) "Manager approves restock orders" [existing] <!-- source: docs/approval-policy.md#L12 -->

### Edges

contains: "Supply Chain" → "Inventory Management"
depends_on: "Manager approves restock orders" → "Clerk submits restock request" (grounding=concept)

---

## Facts

### Product(domain) "Supply Chain" [existing]

[description] "End-to-end management of goods from procurement to delivery"

[principle] "All inventory changes must be auditable with timestamps and actor identity"

### Product(story) "Clerk checks stock levels" [existing]

[description] "As a warehouse clerk, I want to check current stock levels so I can identify items that need restocking"

[S1][spec] "Stock levels display shows real-time quantities for all warehouse locations"

[S2][spec] "Items below restock threshold are highlighted with a warning indicator"

### Product(story) "Manager approves restock orders" [existing]

[description] "As a warehouse manager, I want to review and approve restock requests so spending stays within budget"

[S3][spec] "Pending restock requests appear in the manager's approval queue within 5 minutes of submission"

[decision] "Approval threshold set at $5,000 — orders below this amount auto-approve"
  > Alternative: all orders require manual approval. Rejected to reduce bottleneck for routine restocks.

---

## Acceptance Criteria Summary

- [ ] [S1] Stock levels display shows real-time quantities for all warehouse locations
- [ ] [S2] Items below restock threshold are highlighted with a warning indicator
- [ ] [S3] Pending restock requests appear in the manager's approval queue within 5 minutes
```

### Plan Output (from code, optional)

```markdown
# Plan: [Project Name] [Version] Knowledge Base

> Extracted from existing codebase

## Nodes

### Package: @acme/inventory-service (kind=service) [existing] <!-- source: packages/inventory-service/package.json -->

#### Symbol: InventoryService (kind=class, visibility=exported) [existing] <!-- source: packages/inventory-service/src/service.ts#L15 -->

[P1][guide] "Handles stock level queries and restock order management"

[P1][spec] "getStockLevels() returns current quantities for all locations"
  > [test] Unit test in inventory-service.test.ts
  -> implements: PRD[S1]

##### contains:

- Symbol: getStockLevels (kind=method, visibility=public) [existing] <!-- source: packages/inventory-service/src/service.ts#L42 -->

- Symbol: submitRestock (kind=method, visibility=public) [existing] <!-- source: packages/inventory-service/src/service.ts#L98 -->

## Edges

- InventoryService.submitRestock --corresponds--> PRD/"Clerk submits restock request": "restock implementation"

## Coverage Matrix

| PRD Spec | Plan Spec | Status |
|----------|-----------|--------|
| PRD[S1] | [P1] getStockLevels returns current quantities | Covered |
```

---

<procedures>

## Execution Steps

### Step 1: Input Parsing & Classification

Parse the invocation arguments to determine:

1. **Version number** (required — ask if missing)
2. **Input paths** — classify each as:
   - **Document**: `.md`, `.txt`, `.rst`, `.adoc`, `.pdf`, or directories containing these
   - **Code**: `.ts`, `.js`, `.py`, `.go`, `.rs`, `.java`, `.tsx`, `.jsx`, or directories containing these (look for `package.json`, `Cargo.toml`, `go.mod`, `pyproject.toml` as package indicators)
   - **Mixed directory**: contains both docs and code — scan both

If no paths given, ask the user for paths.

**Determine output mode:**
- Has docs (no code) → produce `prd.md` only
- Has code (no docs) → produce `plan.md` only
- Has both → produce `prd.md` + `plan.md` + `corresponds` edges

### Step 2: Scan & Read Sources

**For documents:**
1. Use `Glob` to discover document files in provided paths
2. Read each document, noting its file path and line numbers for key sections
3. Identify key concepts: domains, capabilities/processes, user/actor behaviors, rules, decisions, principles

**For code (if provided):**
1. Use `Glob` to discover source files and package manifests
2. Read package manifests first to understand package structure
3. Read key source files (entry points, main modules, exported APIs)
4. Identify: packages, modules, exported functions/classes/types, inter-package dependencies

**Do not read every file exhaustively** — focus on:
- README files, entry points, public API surfaces
- Package manifests (package.json, etc.)
- Directory structure for hierarchy
- Exported symbols in index/main files

### Step 3: Extract Product-Layer Graph (from docs)

Extract Product-layer Nodes following the concept definitions above:

1. Identify **domain** nodes for top-level knowledge/business domains
2. Identify **application** nodes for capability areas or sub-systems
3. Identify **story** nodes — each must have an actor/role + goal + outcome
4. For each story: extract at least 1 `[description]` + 1 `[spec]` Fact
5. Attach `<!-- source: path#LN -->` to every Node

**Spec quality rules:**
- Specs attach only to stories, not to domain/application
- For technical projects with interfaces: spec should describe behavior verifiable through the interface
- For non-technical projects: spec describes an observable outcome or measurable criterion from the source material
- content ≤ 256 characters, one semantic unit per entry
- Use `[S1][S2]...` numbering sequentially

**Adapt depth to material size:**
- Small material (1-3 docs): domain + stories may be sufficient, skip application layer if not warranted
- Large material: use full domain → application → story hierarchy

**All Nodes use `[existing]` status** since this is a snapshot of current state.

**Present the candidate Node tree to the user and wait for confirmation** before proceeding.

### Step 4: Extract Code-Layer Graph (from code, if provided)

If code was provided, extract Code-layer Nodes:

1. **Package** nodes for each package/module
   - Use correct kind: `app`/`service`/`lib`/`cli`
   - Link to manifest or entry point via `<!-- source: -->`
2. **Symbol** nodes for key exported functions, classes, types
   - Use correct kind from the Symbol table
   - Link to definition line via `<!-- source: path#LN -->`
   - Mark visibility: `exported`/`public`/`internal`
3. Edges:
   - `contains` for package→symbol hierarchy
   - `depends_on` for inter-package dependencies
   - `imports`/`calls` for symbol-level relationships
4. For `[existing]` symbols: a `[guide]` describing current behavior is sufficient

**Focus on the public API surface** — skip internal implementation details, test files, config files.

### Step 5: Cross-Layer Linking (when both docs and code provided)

Establish `corresponds` edges between Product and Code layers:
- Match stories to the packages/symbols that implement them
- Use naming conventions, README descriptions, and code comments as evidence
- **Prefer Symbol-level mappings** over Package-level
- **Only create `corresponds` edges when the mapping is clear** — better to omit than to guess

### Step 6: Generate Output

1. Write `<design-dir>/<version>/prd.md` following the PRD output format template above
2. If code was provided, also write `<design-dir>/<version>/plan.md` following the Plan output format template
3. The `corresponds` edges go in plan.md (if it exists), otherwise in prd.md

### Step 7: Pre-Output Checklist

> Every item must pass before writing the file.

**Source tracing:**
- [ ] Every Node has a `<!-- source: path -->` annotation
- [ ] Every source path points to a file that was actually read (no fabricated paths)

**Product layer:**
- [ ] Node hierarchy is logical (domain → application → story, depth adapted to material)
- [ ] Each story has ≥ 1 `[description]` + ≥ 1 `[spec]`
- [ ] Specs attach only to stories
- [ ] content ≤ 256 characters per Fact
- [ ] Fact numbering `[Sn]` is sequential with no duplicates

**Code layer (if applicable):**
- [ ] Package kind is correct (app/service/lib/cli)
- [ ] Symbol kind and visibility are correct
- [ ] Symbol containment is one level only (class→method, no deeper)

**Cross-layer (if applicable):**
- [ ] `corresponds` edges only exist when mapping is evident (not guessed)
- [ ] `corresponds` edges target Symbol-level (not Package-level)

</procedures>
