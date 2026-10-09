---
name: erd
description: >
  Create or update an Engineering Requirements Document (ERD) — the
  documentation-first technical design that translates an approved PRD into
  functional and non-functional requirements, back-of-the-envelope capacity
  estimates, data models and schemas, architecture and technology choices,
  interface pseudo-code, client-side logic, logging and alerts, single points of
  failure, and security considerations. Use this skill whenever the user has an
  approved PRD and asks for an implementation plan, integration plan, engineering
  plan, technical design, or ERD — the engineering-side spec that comes after PRD
  sign-off and before code is written. Writes a structured Markdown document.
  ERD here means Engineering Requirements Document (a technical design doc), not
  an entity-relationship diagram.
---

# Engineering Requirements Document (ERD)

> **ERD here means *Engineering Requirements Document*** — the technical design /
> implementation plan written before code. It is **not** an entity-relationship
> diagram (though it will contain data models).

Translate an **approved PRD into an Engineering Requirements Document (ERD)**: a
documentation-first technical design that pins down functional and non-functional
requirements, capacity estimates, data models, architecture, interface logic,
logging/alerts, failure points, and security — *before* a line of feature code is
written.

## Philosophy — Why This Structure

The core claim: **writing the technical design down first is the most efficient
way to avoid bugs, performance issues, crashes, and technical debt.** Thinking
through schemas, load, failure, and security on paper is far cheaper than
discovering them in production.

- **The devil is in the details.** Depth of thought in the ERD converts directly
  into product reliability. Estimate the load, name the indexes, write the
  pseudo-code.
- **One ERD per product, updated in place**, versioned via Git — same discipline
  as the PRD.
- **Document every non-obvious decision** with its reasoning. Use the form:
  *"I decided to do `<X>` like `<Y>` because of `<Z>`."* The rationale is what
  makes the design reviewable.
- **Default to async** for inter-service communication, and justify any tool
  choice that diverges from the existing systems.

## Prerequisite — The Approved PRD

The ERD is written *against* an approved PRD; that dependency is the point.
Before drafting:

1. **Locate the approved PRD.** Ask for or find the PRD this ERD serves (a file or
   a link). Confirm it is approved — the ERD is the step *after* product sign-off,
   and building it against a moving PRD wastes the effort.
2. **If no PRD exists**, say so and offer to create one first with the `prd`
   skill. Only proceed without one if the user explicitly asks; in that case, stub
   the *Product Requirements* section and flag it as unverified.
3. **Ingest it.** Pull the PRD summary into section 1, and carry its
   *out-of-scope* list and constraints forward into the ERD's own out-of-scope and
   constraints. The ERD restates product context in engineering terms — it does
   not silently assume the reader has the PRD open.

## Workflow

1. **Ingest the PRD** and link the UI/UX design files.
2. **Clarify ambiguity** against the product docs — walk every feature and edge
   case, and classify each open item as a functional requirement, a
   consideration, a constraint, or a discrete engineering problem.
3. **Gather technical context** before writing: read the relevant existing code,
   schemas, services, and infra so the design extends reality rather than an
   imagined system. Note what already exists and what must change.
4. **Draft the ERD** using the section template below.
5. **Pick the output format** (see *Output Format*). Default to Markdown.
6. **Keep it single and versioned**, updating in place for changes.

## ERD Template

Compose the sections below in order, including the depth each system warrants.

1. **Product Requirements** — a high-level summary lifted from the PRD
   (copy-paste if available), a **link to the PRD**, and a **link to the UI/UX
   design** files.

2. **Functional Requirements of the System**
   - **2.1 Clarify ambiguity** — understand each feature from the product docs;
     enumerate edge cases; identify third-party and internal-system dependencies;
     classify each as a functional requirement, consideration, constraint, or
     engineering problem.
   - **2.2 Write functional requirements clearly** — translate product
     requirements into technical ones; describe the high-level APIs for each user
     journey; detail engineering edge- and corner-case handling.
   - **2.3 Out of scope** — copy the product-level exclusions from the PRD and add
     everything factored out during solution design, from the engineering side.
   - **2.4 System considerations and constraints** — what the system cannot do and
     why; decisions in the *"I decided `<X>` like `<Y>` because `<Z>`"* form;
     functional and non-functional considerations.
   - **2.5 Specific engineering problems to solve** — non-product technical needs
     surfaced by the design.

3. **Non-Functional Requirements** — availability, capacity, reliability,
   scalability, security (high level), maintainability, manageability. State the
   expected system load (from discussion with the PM) and the data requirements:
   access speed, encryption, and consistency model (strong vs. eventual).

4. **Back-of-the-Envelope Estimate**
   - **4.1 Load estimation** — requests/operations per second; database storage
     and cache size; read:write ratio; media storage patterns and sizes.
   - **4.2 Sync vs. async communication** — identify what genuinely needs
     synchronous calls; default the rest to async between services.

5. **Data Models and Low-Level Design**
   - **5.1 Schemas** — SQL and/or NoSQL schemas; relationships between them; data
     types and validation (max length, disallowed characters, precision).
   - **5.2 Read/write patterns** — per schema, document end-user read/write
     patterns; choose partition keys and secondary indexes; identify secondary
     models (data shaped for a different access pattern); decide whether large
     documents should be decomposed.

6. **Architecture Diagram with Tools and Technologies**
   - **6.1 Extension to an existing system** — link the existing system's docs; a
     diagram of data flow between new and existing components; major changes that
     ripple into existing systems; how each specific engineering problem is
     solved.
   - **6.2 New system** — a diagram of all components and their communication with
     clear data flow; mark shared components (databases, file systems, media
     storage); label the stack explicitly — language/framework, databases, queues,
     file systems, media storage, third-party tools, utility libraries — and
     justify any choice that diverges from existing systems.

7. **Business Logic of the Interfaces** — for each interface, the business logic
   as line-by-line **pseudo-code**, from validation through output. Send it to
   peers/leads for review. If there are more than ~five interfaces, split them
   into sub-documents and link them.

8. **Client-Side Logic and Interactions**
   - **8.1 Compare interfaces with the design file** — confirm every user journey
     in the design is covered by an API interface.
   - **8.2 Error-case coverage** — confirm every API error response has a
     corresponding UI/UX state in the design.
   - **8.3 Analytics and tracking events** — verify the analytics from the product
     spec; document which events fire client-side vs. server-side.
   - **8.4 Critical client-side validations and security** — essential client
     validations and security checks.

9. **Application- and Infra-Level Logging and Alerts** — what to log at the
   application level, what to log at the infrastructure level, and what to alert
   on at each level.

10. **Single Points of Failure** — identify critical failure points; discuss
    criticality with technical leads; document disaster response and recovery.

11. **Security Considerations** — enumerate plausible security failures in the
    proposed solution; propose a mitigation for each; flag anything needing
    dedicated security expertise.

12. **API Documentation** — link the complete API and interface documentation.

## Output Format

Write the ERD as **Markdown** by default — portable, diff-friendly, and easy to
keep in Git next to the code it describes. Use headings per section, tables for
schemas and estimates, and fenced code blocks for interface pseudo-code.

If the user asks for a different format (for example HTML, or a doc for their
wiki), produce that instead — the template above is the source of truth; the
format is just presentation. When the destination is unclear, default to Markdown
and mention they can ask for another format.

## Relationship Recap

**PRD → ERD → implementation.** The PRD (the `prd` skill) defines *what and why*
and is signed off by product. This ERD translates that into *how*, in enough
technical detail that building it becomes execution rather than discovery. Keep
the boundary clean: product intent lives in the PRD and is referenced here;
engineering decisions live here and are not back-filled into the PRD.
