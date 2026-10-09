# Índice de planifica

Cada fila apunta a un `SKILL.md` original, sin modificar. La ruta es relativa a esta carpeta.


## github/spec-kit (2 skills)
Origen: https://github.com/github/spec-kit

| skill | ruta | descripción |
|---|---|---|
| code-review | `github__spec-kit/.github/skills/code-review/SKILL.md` | Reviews Spec Kit code changes for consistency with applicable design documents, positive and negative test coverage, regression evidence for bug fixes, and cons |
| add-community-extension | `github__spec-kit/.github/skills/add-community-extension/SKILL.md` | Add a community extension to the Spec Kit catalog from a GitHub issue submission. USE FOR: processing extension submission issues, validating catalog entries, u |

## Fission-AI/OpenSpec (16 skills)
Origen: https://github.com/Fission-AI/OpenSpec

| skill | ruta | descripción |
|---|---|---|
| openspec-explore | `Fission-AI__OpenSpec/skills/openspec-explore/SKILL.md` | Enter OpenSpec explore mode - a thinking partner for exploring ideas, investigating problems, and clarifying requirements in a project that uses OpenSpec. Use w |
| openspec-propose | `Fission-AI__OpenSpec/skills/openspec-propose/SKILL.md` | Propose a new OpenSpec change with all artifacts generated in one step. Use when the user wants to quickly describe what they want to build and get a complete p |
| openspec-onboard | `Fission-AI__OpenSpec/skills/openspec-onboard/SKILL.md` | Guided onboarding for OpenSpec - walk through a complete workflow cycle with narration and real codebase work. Also use when the user says "openspec onboard" or |
| openspec-ff-change | `Fission-AI__OpenSpec/skills/openspec-ff-change/SKILL.md` | Fast-forward through OpenSpec artifact creation. Use when the user wants to quickly create all artifacts needed for implementation without stepping through each |
| openspec-sync-specs | `Fission-AI__OpenSpec/skills/openspec-sync-specs/SKILL.md` | Sync delta specs from an OpenSpec change to main specs. Use when the user wants to update main specs with changes from a delta spec, without archiving the chang |
| openspec-new-change | `Fission-AI__OpenSpec/skills/openspec-new-change/SKILL.md` | Start a new OpenSpec change using the experimental artifact workflow. Use when the user wants to create a new feature, fix, or modification with a structured st |
| openspec-apply-change | `Fission-AI__OpenSpec/skills/openspec-apply-change/SKILL.md` | Implement tasks from an OpenSpec change. Use when the user wants to start implementing, continue implementation, or work through tasks. Also use when the user s |
| openspec-update-change | `Fission-AI__OpenSpec/skills/openspec-update-change/SKILL.md` | Update an OpenSpec change by revising its existing planning artifacts and keeping them coherent with one another. Use when the user wants to revise a change's p |
| openspec-verify-change | `Fission-AI__OpenSpec/skills/openspec-verify-change/SKILL.md` | Verify implementation matches OpenSpec change artifacts. Use when the user wants to validate that implementation is complete, correct, and coherent before archi |
| openspec-archive-change | `Fission-AI__OpenSpec/skills/openspec-archive-change/SKILL.md` | Archive a completed OpenSpec change in the experimental workflow. Use when the user wants to finalize and archive a change after implementation is complete. Als |
| openspec-continue-change | `Fission-AI__OpenSpec/skills/openspec-continue-change/SKILL.md` | Continue working on an OpenSpec change by creating the next artifact. Use when the user wants to progress their change, create the next artifact, or continue th |
| openspec-bulk-archive-change | `Fission-AI__OpenSpec/skills/openspec-bulk-archive-change/SKILL.md` | Archive multiple completed OpenSpec changes at once. Use when archiving several parallel changes. Also use for a plural archive request - "openspec bulk-archive |
| release-openspec | `Fission-AI__OpenSpec/.agents/skills/release-openspec/SKILL.md` | - |
| write-openspec-docs | `Fission-AI__OpenSpec/.agents/skills/write-openspec-docs/SKILL.md` | Switches into OpenSpec docs-writing mode; loads the house style guide and drafts or revises pages in its voice (action-first, no preamble, scannable). Use when  |
| draft-openspec-docs | `Fission-AI__OpenSpec/.agents/skills/draft-openspec-docs/SKILL.md` | Collaborative page-drafting mode for the OpenSpec docs. Builds a scratch plan inside the target page (purpose, structure, numbered draft steps), iterates on it  |
| verify-openspec-docs | `Fission-AI__OpenSpec/.agents/skills/verify-openspec-docs/SKILL.md` | Fact-checks OpenSpec user documentation with a fresh-context subagent that re-runs commands and checks claims against source. Manually triggered; not part of th |

## bmad-code-org/BMAD-METHOD (36 skills)
Origen: https://github.com/bmad-code-org/BMAD-METHOD

| skill | ruta | descripción |
|---|---|---|
| bmad | `bmad-code-org__BMAD-METHOD/skills/bmad/SKILL.md` | Answers BMad questions and recommends the next skill from what is installed. Use when the user asks bmad for help, what to do next or where to start; to set up, |
| bmad-ux | `bmad-code-org__BMAD-METHOD/skills/bmad-ux/SKILL.md` | Capture the user''s UX vision in two documents: DESIGN.md for how the product looks and EXPERIENCE.md for how it behaves. Use when the user says "lets create UX |
| bmad-prd | `bmad-code-org__BMAD-METHOD/skills/bmad-prd/SKILL.md` | Create, update, or validate a PRD. Use when the user wants help producing, editing, or validating a PRD |
| bmad-spec | `bmad-code-org__BMAD-METHOD/skills/bmad-spec/SKILL.md` | Condense any input — an idea, brief, PRD, transcript, or mixed notes — into a short spec: one kernel file plus supporting files that downstream skills build fro |
| bmad-eval | `bmad-code-org__BMAD-METHOD/skills/bmad-eval/SKILL.md` | Runs the evals of a BMad skill through the agent harness the user works in and reports what they show: baseline against the bare model, variant against a stripp |
| bmad-prfaq | `bmad-code-org__BMAD-METHOD/skills/bmad-prfaq/SKILL.md` | Test a product concept with Amazon's Working Backwards method: write the press release for the finished product first, then answer hard customer and stakeholder |
| bmad-build | `bmad-code-org__BMAD-METHOD/skills/bmad-build/SKILL.md` | Turns implementation work into working code, reviewed and verified. Use when the user delegates a feature, story, bug fix, or meaningful change; a bare story or |
| bmad-review | `bmad-code-org__BMAD-METHOD/skills/bmad-review/SKILL.md` | Runs one or more installed review lenses — adversarial critique, edge cases, verification gaps, structure, prose — and reports triaged findings. Use when, and o |
| bmad-ticket | `bmad-code-org__BMAD-METHOD/skills/bmad-ticket/SKILL.md` | Create and manage tickets — initiatives, epics, stories, bugs. Use when the user says "create a new initiative", "slice this initiative", "split this epic up",  |
| bmod-method | `bmad-code-org__BMAD-METHOD/skills/bmod-method/SKILL.md` | Required bmod metadata. Never invoke this skill. |
| bmad-agent-pm | `bmad-code-org__BMAD-METHOD/skills/bmad-agent-pm/SKILL.md` | Product manager for PRD creation and requirements discovery. Use when the user asks to talk to John or requests the product manager |
| bmad-toolsmith | `bmad-code-org__BMAD-METHOD/skills/bmad-toolsmith/SKILL.md` | Smithy the Toolsmith builds, converts, reviews, packages, validates and migrates BMad skills, agents and modules. Use when the user wants a skill, agent, person |
| bmod-toolsmith | `bmad-code-org__BMAD-METHOD/skills/bmod-toolsmith/SKILL.md` | Required bmod metadata. Never invoke this skill. |
| bmad-agent-dev | `bmad-code-org__BMAD-METHOD/skills/bmad-agent-dev/SKILL.md` | Senior software engineer who implements stories and code changes. Use when the user asks to talk to Amelia or requests the developer agent |
| bmad-customize | `bmad-code-org__BMAD-METHOD/skills/bmad-customize/SKILL.md` | Authors and updates customization overrides for installed BMad skills. Use when the user says 'customize bmad', 'override a skill', 'change agent behavior', or  |
| bmad-deep-recon | `bmad-code-org__BMAD-METHOD/skills/bmad-deep-recon/SKILL.md` | Research a topic to support a decision, three ways: draft a research prompt for the user to run in their own tool (ChatGPT, Gemini, Grok, Perplexity, …), turn a |
| bmad-party-mode | `bmad-code-org__BMAD-METHOD/skills/bmad-party-mode/SKILL.md` | Orchestrates lively group discussions between installed BMAD agents or custom personas, and helps author custom parties. Use when the user requests party mode,  |
| bmod-core-tools | `bmad-code-org__BMAD-METHOD/skills/bmod-core-tools/SKILL.md` | Required bmod metadata. Never invoke this skill. |
| bmad-forge-idea | `bmad-code-org__BMAD-METHOD/skills/bmad-forge-idea/SKILL.md` | Test a half-formed idea in a questioning conversation, with different personas probing its weak points, until the user can act on it or drop it with confidence. |
| bmad-build-auto | `bmad-code-org__BMAD-METHOD/skills/bmad-build-auto/SKILL.md` | One iteration of an unattended development loop. Use when invoked by name |
| bmad-walkthrough | `bmad-code-org__BMAD-METHOD/skills/bmad-walkthrough/SKILL.md` | Guide a human review of a commit, PR, file, or directory. Use when invoked by name |
| bmad-code-review | `bmad-code-org__BMAD-METHOD/skills/bmad-code-review/SKILL.md` | Review code changes with several independent reviewers in parallel, then triage and present the findings. Use when the user says "run code review" or "review th |
| bmad-architecture | `bmad-code-org__BMAD-METHOD/skills/bmad-architecture/SKILL.md` | Work out and record the architecture decisions that keep separately built parts of a system consistent, in a short architecture document. Creates, updates, or v |
| bmad-retrospective | `bmad-code-org__BMAD-METHOD/skills/bmad-retrospective/SKILL.md` | Review a finished epic folder in the ticket tree against the evidence it left behind — the epic file, each ticket plan, diffs, commits — and produce a retrospec |
| bmad-brainstorming | `bmad-code-org__BMAD-METHOD/skills/bmad-brainstorming/SKILL.md` | Facilitate a brainstorming session using diverse creative techniques. Use when the user says 'help me brainstorm' or 'help me ideate |
| bmad-agent-analyst | `bmad-code-org__BMAD-METHOD/skills/bmad-agent-analyst/SKILL.md` | Business analyst for market research, competitive analysis, and requirements. Use when the user asks to talk to Mary or requests the business analyst |
| bmad-product-brief | `bmad-code-org__BMAD-METHOD/skills/bmad-product-brief/SKILL.md` | Create, update, or validate a product brief. Use when the user wants help producing, editing, or validating a brief |
| bmad-correct-course | `bmad-code-org__BMAD-METHOD/skills/bmad-correct-course/SKILL.md` | Assess the impact of a significant change during sprint execution across the PRD, epics, architecture, and UX documents, and produce a sprint change proposal. U |
| bmad-agent-architect | `bmad-code-org__BMAD-METHOD/skills/bmad-agent-architect/SKILL.md` | System architect and technical design leader. Use when the user asks to talk to Winston or requests the architect |
| bmad-project-context | `bmad-code-org__BMAD-METHOD/skills/bmad-project-context/SKILL.md` | Set up, adopt, refresh, or audit a repository''s agent instructions (the AGENTS.md block) so AI agents work well in that repo. Also records observed agent mista |
| bmad-agent-ux-designer | `bmad-code-org__BMAD-METHOD/skills/bmad-agent-ux-designer/SKILL.md` | UX designer and UI specialist. Use when the user asks to talk to Sally or requests the UX designer |
| bmad-advanced-elicitation | `bmad-code-org__BMAD-METHOD/skills/bmad-advanced-elicitation/SKILL.md` | Push the LLM to reconsider, refine, and improve its recent output. Use when user asks for deeper critique or mentions a known deeper critique method, e.g. socra |
| bmad-qa-generate-e2e-tests | `bmad-code-org__BMAD-METHOD/skills/bmad-qa-generate-e2e-tests/SKILL.md` | Generate automated API and end-to-end tests for implemented features. Use when the user says "create qa automated tests for [feature] |
| with-trigger | `bmad-code-org__BMAD-METHOD/tools/tests/fixtures/validate-skills/with-trigger/SKILL.md` | Generates a thing and writes it to disk. Use when the user asks to scaffold a thing. |
| missing-trigger | `bmad-code-org__BMAD-METHOD/tools/tests/fixtures/validate-skills/missing-trigger/SKILL.md` | Generates a thing and writes it to disk for the user. |
| deprecated-shim | `bmad-code-org__BMAD-METHOD/tools/tests/fixtures/validate-skills/deprecated-shim/SKILL.md` | DEPRECATED — consolidated into bmad-foo; this skill will be removed in v7 in favor of `bmad-foo`. |

## gemini-cli-extensions/conductor (6 skills)
Origen: https://github.com/gemini-cli-extensions/conductor

| skill | ruta | descripción |
|---|---|---|
| conductor-setup | `gemini-cli-extensions__conductor/skills/conductor-setup/SKILL.md` | Scaffolds the project and sets up the Conductor environment. Use this whenever a project needs to be initialized or if the Conductor configuration is missing. |
| conductor-review | `gemini-cli-extensions__conductor/skills/conductor-review/SKILL.md` | Reviews the completed track work against guidelines and the plan. Acts as a Principal Software Engineer to ensure quality and compliance. |
| conductor-status | `gemini-cli-extensions__conductor/skills/conductor-status/SKILL.md` | Displays the current progress of the project by parsing the Tracks Registry and individual track plans. |
| conductor-revert | `gemini-cli-extensions__conductor/skills/conductor-revert/SKILL.md` | Reverts previous work (tracks, phases, or tasks) by identifying associated commits and performing Git reverts. |
| conductor-new-track | `gemini-cli-extensions__conductor/skills/conductor-new-track/SKILL.md` | Plans a new track (feature or bug fix), generates spec/plan documents, and updates the registry. |
| conductor-implement | `gemini-cli-extensions__conductor/skills/conductor-implement/SKILL.md` | Executes the tasks defined in the specified track's plan. Use this to start or continue working on a feature, bug fix, or chore. |

## sudokar/openspec-plus (6 skills)
Origen: https://github.com/sudokar/openspec-plus

| skill | ruta | descripción |
|---|---|---|
| openspec-plus-tdd | `sudokar__openspec-plus/skills/openspec-plus-tdd/SKILL.md` | MANDATORY skill that activates whenever code is written to implement an OpenSpec change task. Triggers: openspec-plus-apply is active, /opsx-apply is running, t |
| openspec-plus-spec | `sudokar__openspec-plus/skills/openspec-plus-spec/SKILL.md` | MANDATORY skill that activates whenever the OpenSpec specification phase begins. Triggers: /opsx-new or /opsx-continue runs; openspec-new-change, openspec-conti |
| openspec-plus-apply | `sudokar__openspec-plus/skills/openspec-plus-apply/SKILL.md` | MANDATORY skill that activates whenever the OpenSpec apply phase begins. Triggers: /opsx-apply runs, the openspec-apply-change vanilla skill is referenced or ac |
| openspec-plus-tasks | `sudokar__openspec-plus/skills/openspec-plus-tasks/SKILL.md` | MANDATORY skill that activates whenever the OpenSpec tasks phase begins. Triggers: /opsx-new or /opsx-continue runs; openspec-new-change, openspec-continue-chan |
| openspec-plus-design | `sudokar__openspec-plus/skills/openspec-plus-design/SKILL.md` | MANDATORY skill that activates whenever the OpenSpec design phase begins. Triggers: /opsx-new or /opsx-continue runs; openspec-new-change, openspec-continue-cha |
| openspec-plus-proposal | `sudokar__openspec-plus/skills/openspec-plus-proposal/SKILL.md` | MANDATORY skill that activates whenever the OpenSpec proposal phase begins. Triggers: /opsx-new or /opsx-continue runs; openspec-new-change, openspec-continue-c |

## hllj/sdd-superpowers (21 skills)
Origen: https://github.com/hllj/sdd-superpowers

| skill | ruta | descripción |
|---|---|---|
| sdd-init | `hllj__sdd-superpowers/skills/sdd-init/SKILL.md` | Use when starting a new project that has no CLAUDE.md and no docs/specs/ directory |
| sdd-plan | `hllj__sdd-superpowers/skills/sdd-plan/SKILL.md` | Use when a feature spec exists and needs to become a technical implementation plan |
| sdd-tasks | `hllj__sdd-superpowers/skills/sdd-tasks/SKILL.md` | Retired — do not use. See sdd-superpowers:sdd-execute. |
| using-git | `hllj__sdd-superpowers/skills/using-git/SKILL.md` | Use when any git operation is needed in an SDD project — branch creation, commits, merge commit validation, showing the convention, or setting up an isolated gi |
| sdd-review | `hllj__sdd-superpowers/skills/sdd-review/SKILL.md` | Use when a spec needs a completeness check before planning, or when implementation claims to be complete and needs spec-alignment validation |
| sdd-execute | `hllj__sdd-superpowers/skills/sdd-execute/SKILL.md` | Use when a plan is approved and implementation should begin |
| sdd-specify | `hllj__sdd-superpowers/skills/sdd-specify/SKILL.md` | Use when a user describes a new feature, idea, or problem without an existing spec — before any planning, research, or code |
| sdd-workflow | `hllj__sdd-superpowers/skills/sdd-workflow/SKILL.md` | Use when starting any conversation in an SDD project |
| session-wrap | `hllj__sdd-superpowers/skills/session-wrap/SKILL.md` | Use when ending a session to capture memory candidates and narrative lessons before context is lost |
| writing-skills | `hllj__sdd-superpowers/skills/writing-skills/SKILL.md` | Use when creating new skills, editing existing skills, or verifying skills work before deployment |
| sdd-brainstorm | `hllj__sdd-superpowers/skills/sdd-brainstorm/SKILL.md` | Use when an idea is fuzzy, exploratory, has competing approaches, or needs a technology/architecture decision investigated before specification |
| sdd-spec-update | `hllj__sdd-superpowers/skills/sdd-spec-update/SKILL.md` | Use when a user describes a change, addition, or correction to an approved spec — during or before implementation |
| sdd-integrations | `hllj__sdd-superpowers/skills/sdd-integrations/SKILL.md` | Use when a user wants to connect their own custom Claude Code skill (e.g. a Jira or Confluence skill) to a point in the SDD lifecycle, or asks what custom skill |
| systematic-debugging | `hllj__sdd-superpowers/skills/systematic-debugging/SKILL.md` | Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes |
| receiving-code-review | `hllj__sdd-superpowers/skills/receiving-code-review/SKILL.md` | Use when receiving code review feedback, before implementing review suggestions |
| requesting-code-review | `hllj__sdd-superpowers/skills/requesting-code-review/SKILL.md` | Use when the user asks for a code review directly, before merging to main, or after completing a major feature |
| test-driven-development | `hllj__sdd-superpowers/skills/test-driven-development/SKILL.md` | Use when implementing any feature or bugfix, before writing implementation code |
| subagent-driven-development | `hllj__sdd-superpowers/skills/subagent-driven-development/SKILL.md` | Use when executing implementation plans with independent tasks in the current session |
| dispatching-parallel-agents | `hllj__sdd-superpowers/skills/dispatching-parallel-agents/SKILL.md` | Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies |
| verification-before-completion | `hllj__sdd-superpowers/skills/verification-before-completion/SKILL.md` | Use when about to claim work is complete, fixed, or passing |
| finishing-a-development-branch | `hllj__sdd-superpowers/skills/finishing-a-development-branch/SKILL.md` | Use when implementation is complete, all tests pass, and a decision is needed on how to integrate the work |

## obra/superpowers (15 skills)
Origen: https://github.com/obra/superpowers

| skill | ruta | descripción |
|---|---|---|
| brainstorming | `obra__superpowers/skills/brainstorming/SKILL.md` | You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirem |
| writing-plans | `obra__superpowers/skills/writing-plans/SKILL.md` | Use when you have a spec or requirements for a multi-step task, before touching code |
| writing-skills | `obra__superpowers/skills/writing-skills/SKILL.md` | Use when creating new skills, editing existing skills, or verifying skills work before deployment |
| executing-plans | `obra__superpowers/skills/executing-plans/SKILL.md` | Use when executing an implementation plan in the current session as the implementer yourself — your human partner chose inline execution, or no subagent tool is |
| using-superpowers | `obra__superpowers/skills/using-superpowers/SKILL.md` | Use when starting any conversation - establishes how to find and use skills, requiring skill invocation before ANY response including clarifying questions |
| using-git-worktrees | `obra__superpowers/skills/using-git-worktrees/SKILL.md` | Use when starting feature work that needs isolation from current workspace or before executing implementation plans - ensures an isolated workspace exists via n |
| systematic-debugging | `obra__superpowers/skills/systematic-debugging/SKILL.md` | Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes |
| receiving-code-review | `obra__superpowers/skills/receiving-code-review/SKILL.md` | Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical  |
| diagnosing-superpowers | `obra__superpowers/skills/diagnosing-superpowers/SKILL.md` | Use when a superpowers session went wrong and your human partner wants to know why — repeated work, ignored plans, stumbles, poor results, a skill that didn't f |
| requesting-code-review | `obra__superpowers/skills/requesting-code-review/SKILL.md` | Use when completing tasks, implementing major features, or before merging to verify work meets requirements |
| test-driven-development | `obra__superpowers/skills/test-driven-development/SKILL.md` | Use when implementing any feature or bugfix, before writing implementation code |
| subagent-driven-development | `obra__superpowers/skills/subagent-driven-development/SKILL.md` | Use when executing implementation plans with independent tasks in the current session |
| dispatching-parallel-agents | `obra__superpowers/skills/dispatching-parallel-agents/SKILL.md` | Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies |
| verification-before-completion | `obra__superpowers/skills/verification-before-completion/SKILL.md` | Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output be |
| finishing-a-development-branch | `obra__superpowers/skills/finishing-a-development-branch/SKILL.md` | Use when implementation is complete, all tests pass, and you need to decide how to integrate the work |

## automazeio/ccpm (1 skills)
Origen: https://github.com/automazeio/ccpm

| skill | ruta | descripción |
|---|---|---|
| ccpm | `automazeio__ccpm/skill/ccpm/SKILL.md` | CCPM - spec-driven project management: PRD → Epic → GitHub Issues → parallel agents → shipped code. Use this skill for anything in the software delivery lifecyc |

## lazzyms/prd-erd-skills (2 skills)
Origen: https://github.com/lazzyms/prd-erd-skills

| skill | ruta | descripción |
|---|---|---|
| erd | `lazzyms__prd-erd-skills/skills/erd/SKILL.md` |  |
| prd | `lazzyms__prd-erd-skills/skills/prd/SKILL.md` |  |

## Vann4799/ai-prd-generator (1 skills)
Origen: https://github.com/Vann4799/ai-prd-generator

| skill | ruta | descripción |
|---|---|---|
| prd-generator | `Vann4799__ai-prd-generator/skills/prd-generator/SKILL.md` | - |

## WaitesWireless/claude-product-management-plugin (1 skills)
Origen: https://github.com/WaitesWireless/claude-product-management-plugin

| skill | ruta | descripción |
|---|---|---|
| product-management | `WaitesWireless__claude-product-management-plugin/plugins/product-management/skills/product-management/SKILL.md` | Write and review product documents (BRD, PRD, engineering requirements, one-pagers, PR/FAQ) and scope projects before committing engineering. Use when the user  |

## jhagberg/skill-adr-rfcs (1 skills)
Origen: https://github.com/jhagberg/skill-adr-rfcs

| skill | ruta | descripción |
|---|---|---|
| adr-rfc | `jhagberg__skill-adr-rfcs/adr-rfc/SKILL.md` | Writes and reviews Architecture Decision Records (ADRs, MADR 4.0 format in docs/decisions/) and exploratory RFCs (in docs/rfcs/). Use when the user asks to writ |

## EvolveHQ/docflow (14 skills)
Origen: https://github.com/EvolveHQ/docflow

| skill | ruta | descripción |
|---|---|---|
| audit | `EvolveHQ__docflow/plugins/docflow/skills/audit/SKILL.md` | Audit a documentation-led repo against its own conventions — contiguous ADR numbering, INDEX sync, plan/ coverage, required sections, status validity, cross-ref |
| rollup | `EvolveHQ__docflow/plugins/docflow/skills/rollup/SKILL.md` | Generate the federation roll-up catalogue for a multi-repo product — aggregate every member repo's ADR metadata into one derived, product-wide view, run from th |
| new-adr | `EvolveHQ__docflow/plugins/docflow/skills/new-adr/SKILL.md` | Author a new ADR — record a DECISION (what the system must do, or how it is built) in a documentation-led repo. Picks the next contiguous number, chooses the sh |
| new-plan | `EvolveHQ__docflow/plugins/docflow/skills/new-plan/SKILL.md` | Queue a UNIT OF WORK in the plan/todo queue of a documentation-led repo, tracing to an existing ADR — names the owning ADR(s), scope, exit criteria mapped to ac |
| ship-item | `EvolveHQ__docflow/plugins/docflow/skills/ship-item/SKILL.md` | Ship a plan/todo item in a documentation-led repo — run the verify gate, integrate per the repo's model (fast-forward or PR), git mv todo→done with a shipped fo |
| bootstrap | `EvolveHQ__docflow/plugins/docflow/skills/bootstrap/SKILL.md` | Scaffold or retrofit documentation-led conventions (AGENTS.md, CLAUDE.md, CONVENTIONS.md, ADR catalogue, plan/ queue, _agent/ coordination) into a repo. Use whe |
| agent-wave | `EvolveHQ__docflow/plugins/docflow/skills/agent-wave/SKILL.md` | Run a bounded wave over the plan/todo queue in a documentation-led repo, using available parallel agents or sequential execution. Establishes width, budget and  |
| brainstorm | `EvolveHQ__docflow/plugins/docflow/skills/brainstorm/SKILL.md` | Decompose a problem, feature, or goal into candidate ADRs and plan items for a documentation-led repo — one decision per ADR, dependency edges, suggested orderi |
| workspace-sync | `EvolveHQ__docflow/plugins/docflow/skills/workspace-sync/SKILL.md` | Reconcile returned WORKSPACE receipts and maintain delivery observations from checked native evidence, observing member pull requests, merges, required checks,  |
| add-convention | `EvolveHQ__docflow/plugins/docflow/skills/add-convention/SKILL.md` | Assess and add a CONVENTION (a reusable rule, practice, or naming/process standard) to a documentation-led repo — decides FIRST whether it is worth codifying at |
| workspace-scope | `EvolveHQ__docflow/plugins/docflow/skills/workspace-scope/SKILL.md` | Record a WORKSPACE outcome and its authority: ideas, decisions, work, deliveries, criteria, grants and recommendations, accepting a decision or recording a gran |
| workspace-setup | `EvolveHQ__docflow/plugins/docflow/skills/workspace-setup/SKILL.md` | Create or deliberately adopt a multi-repository Docflow WORKSPACE with a registry and portable memory. Use for workspace-setup or establishing a workspace home. |
| workspace-status | `EvolveHQ__docflow/plugins/docflow/skills/workspace-status/SKILL.md` | Read-only briefing and fresh-session recovery for a WORKSPACE: priorities, owners, current authority, delivery progress, blockers and next actions. Use for work |
| workspace-dispatch | `EvolveHQ__docflow/plugins/docflow/skills/workspace-dispatch/SKILL.md` | Dispatch an already scoped WORKSPACE outcome: check current grants, native claims, dependencies and resources, write a bounded brief and hand it to a native hos |

## upstash/context7 (5 skills)
Origen: https://github.com/upstash/context7

| skill | ruta | descripción |
|---|---|---|
| find-docs | `upstash__context7/skills/find-docs/SKILL.md` | - |
| context7-mcp | `upstash__context7/skills/context7-mcp/SKILL.md` | This skill should be used when the user asks about libraries, frameworks, API references, or needs code examples. Activates for setup questions, code generation |
| context7-cli | `upstash__context7/skills/context7-cli/SKILL.md` | Use the ctx7 CLI to fetch library documentation and configure Context7 MCP. Activate when the user mentions "ctx7" or "context7", needs current docs for any lib |
| context7-docs | `upstash__context7/packages/pi/skills/context7-docs/SKILL.md` | - |
| context7-mcp | `upstash__context7/plugins/agent-plugins/context7/skills/context7-mcp/SKILL.md` | Fetches current, version-specific library documentation and code examples through the Context7 MCP server. Use whenever the user asks about a library, framework |

## thedotmack/claude-mem (30 skills)
Origen: https://github.com/thedotmack/claude-mem

| skill | ruta | descripción |
|---|---|---|
| openclaw | `thedotmack__claude-mem/openclaw/SKILL.md` |  |
| do | `thedotmack__claude-mem/plugin/skills/do/SKILL.md` | Execute a phased implementation plan using subagents. Use when asked to execute, run, or carry out a plan — especially one created by make-plan. |
| handoff | `thedotmack__claude-mem/plugin/skills/handoff/SKILL.md` | Generate a HANDOFF.md that captures goal, current state, files touched, failed attempts, and next steps — so a fresh Claude session can continue exactly where t |
| standup | `thedotmack__claude-mem/plugin/skills/standup/SKILL.md` | Facilitate a read-only standup across git worktrees, branches, or PRs to compare changes and produce one consolidation plan. |
| babysit | `thedotmack__claude-mem/plugin/skills/babysit/SKILL.md` | Watch a pull request or review cycle until it is ready to merge. Use when asked to babysit, monitor, or keep checking PR comments, reviews, and CI until all act |
| what-the | `thedotmack__claude-mem/plugin/skills/what-the/SKILL.md` | What the? Use when the user wants a plain-English breakdown of something technical — the who, what, where, why, and when. |
| mem-setup | `thedotmack__claude-mem/cowork/skills/mem-setup/SKILL.md` |  |
| design-is | `thedotmack__claude-mem/plugin/skills/design-is/SKILL.md` | Audit a design against Dieter Rams' ten "Good design is..." principles, then hand off a /make-plan prompt for one of three outcomes — new design, refine design, |
| make-plan | `thedotmack__claude-mem/plugin/skills/make-plan/SKILL.md` | Create a detailed, phased implementation plan with documentation discovery. Use when asked to plan a feature, task, or multi-step implementation — especially be |
| ccs-align | `thedotmack__claude-mem/plugin/skills/ccs-align/SKILL.md` | Run the CCS Align seat's hourly breathing cycle — prove the local claude-mem worker is healthy, pull needle observations through search → timeline → get_observa |
| mem-search | `thedotmack__claude-mem/cowork/skills/mem-search/SKILL.md` |  |
| pathfinder | `thedotmack__claude-mem/plugin/skills/pathfinder/SKILL.md` | Map a codebase into feature-grouped flowcharts, identify duplicated concerns across features, and propose a unified architecture. Use when asked to "find the id |
| mem-search | `thedotmack__claude-mem/plugin/skills/mem-search/SKILL.md` | Search claude-mem persistent cross-session memory through enforced progressive disclosure. Use for previous decisions, solutions, work history, and before savin |
| cloud-sync | `thedotmack__claude-mem/plugin/skills/cloud-sync/SKILL.md` | Set up or check claude-mem cloud sync with cmem.ai Pro. Use when the user says "set up cloud sync", "sync my memories", "cmem pro", "cloud backup", "sync status |
| wowerpoint | `thedotmack__claude-mem/plugin/skills/wowerpoint/SKILL.md` | Turn one document into a kawaii NotebookLM slide-deck PDF. Use for "wowerpoint this", "make a deck about <file>", "turn this report into slides", or any request |
| oh-my-issues | `thedotmack__claude-mem/plugin/skills/oh-my-issues/SKILL.md` | Cluster a GitHub issue backlog by root cause into a small set of plan-master issues, redirect children with a standardized comment, and bundle architectural-fix |
| mode-creator | `thedotmack__claude-mem/plugin/skills/mode-creator/SKILL.md` | Interactively create, install, activate, and verify custom claude-mem modes, including domain-specific observation types, concept tags, optional Telegram alerts |
| version-bump | `thedotmack__claude-mem/plugin/skills/version-bump/SKILL.md` | Automated semantic versioning and release workflow for Claude Code plugins. Handles version increments across package.json, marketplace.json, plugin.json manife |
| how-it-works | `thedotmack__claude-mem/plugin/skills/how-it-works/SKILL.md` | Explain how claude-mem captures observations, when memory injection kicks in, and where data lives. Use when the user asks "how does claude-mem work?" or "what  |
| smart-explore | `thedotmack__claude-mem/plugin/skills/smart-explore/SKILL.md` | Token-optimized structural code search using tree-sitter AST parsing. Use instead of reading full files when you need to understand code structure, find functio |
| weekly-digests | `thedotmack__claude-mem/plugin/skills/weekly-digests/SKILL.md` | Generate a serial week-by-week narrative digest of a project's full claude-mem timeline. Splits the timeline into per-ISO-week files, then runs one consecutive  |
| learn-codebase | `thedotmack__claude-mem/plugin/skills/learn-codebase/SKILL.md` | Prime a codebase by reading every source file in full. Use when starting work on a new or unfamiliar project, or when the user asks to "learn the codebase", "re |
| timeline-report | `thedotmack__claude-mem/plugin/skills/timeline-report/SKILL.md` | Generate a "Journey Into [Project]" narrative report analyzing a project's entire development history from claude-mem's timeline. Use when asked for a timeline  |
| knowledge-agent | `thedotmack__claude-mem/plugin/skills/knowledge-agent/SKILL.md` | Build and query AI-powered knowledge bases from claude-mem observations. Use when users want to create focused "brains" from their observation history, ask ques |
| Agent Cost Report | `thedotmack__claude-mem/cowork/skills/agent-cost-report/SKILL.md` | - |
| claude-mem-install | `thedotmack__claude-mem/claude-mem-cursor/skills/install/SKILL.md` | - |
| claude-mem-install | `thedotmack__claude-mem/claude-mem-grok-bot/skills/install/SKILL.md` | - |
| mem-search | `thedotmack__claude-mem/claude-mem-cursor/skills/mem-search/SKILL.md` | - |
| mem-search | `thedotmack__claude-mem/claude-mem-grok-bot/skills/mem-search/SKILL.md` | - |
| host-observer | `thedotmack__claude-mem/claude-mem-grok-bot/skills/host-observer/SKILL.md` | - |

## coleam00/context-engineering-intro (1 skills)
Origen: https://github.com/coleam00/context-engineering-intro

| skill | ruta | descripción |
|---|---|---|
| build-with-agent-team | `coleam00__context-engineering-intro/use-cases/build-with-agent-team/SKILL.md` | Build a project using Claude Code Agent Teams with tmux split panes. Takes a plan document path and optional team size. Use when you want multiple agents collab |

## exa-labs/exa-mcp-server (2 skills)
Origen: https://github.com/exa-labs/exa-mcp-server

| skill | ruta | descripción |
|---|---|---|
| search | `exa-labs__exa-mcp-server/skills/search/SKILL.md` | Deep research powered by Exa. Use for lead generation, literature reviews, deep dives, competitive analysis, or any query where one search falls short, includin |
| Exa Agent | `exa-labs__exa-mcp-server/skills/exa-agent/SKILL.md` | Use Exa Agent for multi-step web research, list-building, enrichment, structured output, run continuation, and coverage validation. Exa Agent can access additio |

## Socialpranker/deepdive (1 skills)
Origen: https://github.com/Socialpranker/deepdive

| skill | ruta | descripción |
|---|---|---|
| deepdive | `Socialpranker__deepdive/_root/SKILL.md` | Meta-research под вопрос или решение: веб-поиск, источники, Q&A отчёт с цитатами по файлам для повторного использования. Использовать для деск-ресёрча, валидаци |

## spec-kitty/spec-kitty (49 skills)
Origen: https://github.com/spec-kitty/spec-kitty

| skill | ruta | descripción |
|---|---|---|
| spec-kitty | `spec-kitty__spec-kitty/src/charter/offering/skills/spec-kitty/SKILL.md` | - |
| spk-run-next | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-run-next/SKILL.md` | Drive the canonical spec-kitty next control loop and route query, step, blocked, decision_required, and terminal results. |
| spk-start-here | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-start-here/SKILL.md` | Start here for Spec Kitty. Orient CLI users and supported agent-harness users; choose the right command, skill family, and recovery path. |
| spk-gate-accept | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-gate-accept/SKILL.md` | Run the Spec Kitty accept gate for a completed mission and verify final readiness before merge. |
| spk-mission-plan | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-mission-plan/SKILL.md` | Operate the Spec Kitty plan phase: convert a completed spec into architecture, data flow, risks, and implementation strategy. |
| spk-admin-upgrade | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-admin-upgrade/SKILL.md` | Upgrade Spec Kitty installations and repair generated commands, skills, migrations, and compatibility shims. |
| spk-mission-types | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-mission-types/SKILL.md` | Explain Spec Kitty mission types, step contracts, action indices, and when to choose each mission workflow. |
| spk-mission-tasks | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-mission-tasks/SKILL.md` | Operate Spec Kitty task and work-package authoring, including tasks outline, package slicing, and finalization. |
| adversarial-squad | `spec-kitty__spec-kitty/src/charter/offering/skills/adversarial-squad/SKILL.md` | - |
| spk-run-review-wp | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-run-review-wp/SKILL.md` | Review a Spec Kitty work package through the runtime review surface and approve or reject with structured feedback. |
| spk-meta-skill-map | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-meta-skill-map/SKILL.md` | Discover the Spec Kitty 3.2.0 spk skill hierarchy, naming convention, legacy aliases, and the correct skill for a user intent. |
| spk-mission-specify | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-mission-specify/SKILL.md` | Operate the Spec Kitty specify phase: turn user intent into a mission spec while preserving scope, ambiguity, and acceptance criteria. |
| spk-practice-show-me | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-practice-show-me/SKILL.md` | Explain Spec Kitty work with compact, checkable visuals. Use for specs, plans, architecture, control flow, diffs, status boards, or whenever prose obscures stru |
| spk-charter-glossary | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-charter-glossary/SKILL.md` | - |
| spk-mission-research | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-mission-research/SKILL.md` | Operate pre-spec or in-mission research workflows while keeping findings tied to mission decisions. |
| spk-gate-consolidate | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-gate-consolidate/SKILL.md` | Consolidate an accepted Spec Kitty mission safely, preserving git invariants, mission state, and post-merge follow-through. |
| spk-start-command-map | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-start-command-map/SKILL.md` | Map Spec Kitty slash commands and CLI entry points to spk skills. Use when choosing /spec-kitty.* commands or explaining command-skill boundaries. |
| spk-admin-setup-doctor | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-admin-setup-doctor/SKILL.md` | Install, verify, and repair Spec Kitty commands, skills, agent paths, runtime prerequisites, and common setup failures. |
| spk-admin-agent-config | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-admin-agent-config/SKILL.md` | Configure Spec Kitty agent profiles, host-specific paths, command installation, and model/tool routing. |
| spk-admin-git-workflow | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-admin-git-workflow/SKILL.md` | Operate Spec Kitty git workflows, worktrees, safe commits, merge preflights, stale state checks, and recovery. |
| spk-charter-governance | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-charter-governance/SKILL.md` | - |
| spk-gate-retrospective | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-gate-retrospective/SKILL.md` | Create or verify Spec Kitty mission retrospectives after merge and surface process learnings without blocking completed work. |
| spk-practice-bulk-edit | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-practice-bulk-edit/SKILL.md` | - |
| spk-run-verdict-capture | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-run-verdict-capture/SKILL.md` | Set a Spec Kitty work-package review verdict through the deterministic event-log seam, so every agent harness records approve/reject the same way. |
| spk-gate-mission-review | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-gate-mission-review/SKILL.md` | Run post-merge Spec Kitty mission review for spec-to-code fidelity, FR coverage, drift, risk, and final verdict. |
| spec-kitty-git-workflow | `spec-kitty__spec-kitty/src/charter/offering/skills/spec-kitty-git-workflow/SKILL.md` | - |
| spec-kitty-setup-doctor | `spec-kitty__spec-kitty/src/charter/offering/skills/spec-kitty-setup-doctor/SKILL.md` | - |
| spk-start-agent-surface | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-start-agent-surface/SKILL.md` | Choose the correct Spec Kitty workflow for Codex CLI, Claude Code, and supported slash-command or command-skill harnesses. |
| spk-start-first-feature | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-start-first-feature/SKILL.md` | Guide a first Spec Kitty feature from setup through specify, plan, tasks, implementation, review, accept, merge, and retrospective. |
| spec-kitty-runtime-next | `spec-kitty__spec-kitty/src/charter/offering/skills/spec-kitty-runtime-next/SKILL.md` | - |
| spk-run-blocked-recovery | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-run-blocked-recovery/SKILL.md` | Recover from Spec Kitty blocked runtime states, missing artifacts, failed guards, stale worktrees, and decision-required loops. |
| spk-meta-skill-authoring | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-meta-skill-authoring/SKILL.md` | Author future Spec Kitty spk skills using the 3.2.0 naming convention, lifecycle families, and doctrine/command boundaries. |
| spk-charter-spdd-reasons | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-charter-spdd-reasons/SKILL.md` | - |
| spk-charter-profile-load | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-charter-profile-load/SKILL.md` | - |
| spk-run-implement-review | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-run-implement-review/SKILL.md` | Orchestrate Spec Kitty work-package implementation and review loops until all packages are done, approved, or correctly rejected. |
| spec-kitty-mission-system | `spec-kitty__spec-kitty/src/charter/offering/skills/spec-kitty-mission-system/SKILL.md` | - |
| spec-kitty-runtime-review | `spec-kitty__spec-kitty/src/charter/offering/skills/spec-kitty-runtime-review/SKILL.md` | - |
| spk-mission-documentation | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-mission-documentation/SKILL.md` | Operate documentation-oriented Spec Kitty missions and ensure docs stay tied to shipped behavior and doctrine. |
| spec-kitty-mission-review | `spec-kitty__spec-kitty/src/charter/offering/skills/spec-kitty-mission-review/SKILL.md` | - |
| spk-run-program-orchestrate | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-run-program-orchestrate/SKILL.md` | Orchestrate multi-repo, multi-mission Spec Kitty programs across dependencies, parallel agents, review gates, merge, and post-merge closeout. |
| spec-kitty-implement-review | `spec-kitty__spec-kitty/src/charter/offering/skills/spec-kitty-implement-review/SKILL.md` | - |
| spec-kitty-program-orchestrate | `spec-kitty__spec-kitty/src/charter/offering/skills/spec-kitty-program-orchestrate/SKILL.md` | - |
| spk-integrate-orchestrator-api | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-integrate-orchestrator-api/SKILL.md` | Use Spec Kitty orchestrator-api from external systems, respecting host boundaries, state contracts, and workflow commands. |
| spk-practice-semantic-compression | `spec-kitty__spec-kitty/src/charter/offering/skills/spk-practice-semantic-compression/SKILL.md` | Invoke Randy Reducer and semantic-compression doctrine for behavior-preserving code reduction. |
| spec-kitty-orchestrator-api-operator | `spec-kitty__spec-kitty/src/charter/offering/skills/spec-kitty-orchestrator-api-operator/SKILL.md` | - |
| spk-doctrine-charter | `spec-kitty__spec-kitty/tests/fixtures/charter_pack_cutover/static/removed_skills/spk-doctrine-charter/SKILL.md` | Run Spec Kitty charter interview, generation, context loading, and synchronization workflows. |
| spk-doctrine-show-me | `spec-kitty__spec-kitty/tests/fixtures/charter_pack_cutover/static/removed_skills/spk-doctrine-show-me/SKILL.md` | Explain Spec Kitty work with compact, checkable visuals. Use for specs, plans, architecture, control flow, diffs, status boards, or whenever prose obscures stru |
| spk-doctrine-glossary | `spec-kitty__spec-kitty/tests/fixtures/charter_pack_cutover/static/removed_skills/spk-doctrine-glossary/SKILL.md` | Curate and apply Spec Kitty glossary terminology, aliases, conflicts, semantic drift checks, and domain-model pressure-tests. |
| acme-triage | `spec-kitty__spec-kitty/tests/fixtures/charter_pack_cutover/static/project_pack_skills/.claude/skills/acme-triage/SKILL.md` | Pack skill triage. |

## zhu1090093659/spec_driven_develop (3 skills)
Origen: https://github.com/zhu1090093659/spec_driven_develop

| skill | ruta | descripción |
|---|---|---|
| review-spd | `zhu1090093659__spec_driven_develop/plugins/spec-driven-develop/skills/review-spd/SKILL.md` | - |
| deep-discuss | `zhu1090093659__spec_driven_develop/plugins/spec-driven-develop/skills/deep-discuss/SKILL.md` | - |
| spec-driven-develop | `zhu1090093659__spec_driven_develop/plugins/spec-driven-develop/skills/spec-driven-develop/SKILL.md` | - |

## iamtouchskyer/opc (1 skills)
Origen: https://github.com/iamtouchskyer/opc

| skill | ruta | descripción |
|---|---|---|
| opc | `iamtouchskyer__opc/_root/SKILL.md` | OPC — One Person Company. Digraph-based task pipeline with independent multi-role evaluation. Builds, reviews, analyzes, and brainstorms with specialist agents. |

## V-Songbird/foreman (5 skills)
Origen: https://github.com/V-Songbird/foreman

| skill | ruta | descripción |
|---|---|---|
| init | `V-Songbird__foreman/skills/init/SKILL.md` | Bootstraps a project's ROADMAP.jsonl and .foreman/config.json from the user's goals and the repository, or appends to an existing roadmap. Asks only what the re |
| survey | `V-Songbird__foreman/skills/survey/SKILL.md` | Advanced surface, normally reached through the `foreman` entrance's Reconcile and pick mode, which hands it a near-term set of ids to scope the pass to. Ground- |
| roadmap | `V-Songbird__foreman/skills/roadmap/SKILL.md` | Ongoing entry point for a project's ROADMAP.jsonl. Pick the next task to work on (ranks candidates deterministically by dependencies and file-touch collisions,  |
| foreman | `V-Songbird__foreman/skills/foreman/SKILL.md` | The one entrance to Foreman, which keeps a project's plan and task history. Say what you want in plain language and this routes it to one of the six things Fore |
| craft-prompt | `V-Songbird__foreman/skills/craft-prompt/SKILL.md` | Advanced surface, separate from Foreman's core roadmap job — a standalone prompt builder for work that has no roadmap entry behind it. Use on an explicit prompt |

## andreaserradev-gbj/dev-workflow (8 skills)
Origen: https://github.com/andreaserradev-gbj/dev-workflow

| skill | ruta | descripción |
|---|---|---|
| dev-plan | `andreaserradev-gbj__dev-workflow/plugins/dev-workflow/skills/dev-plan/SKILL.md` | - |
| dev-wiki | `andreaserradev-gbj__dev-workflow/plugins/dev-workflow/skills/dev-wiki/SKILL.md` | - |
| dev-wrapup | `andreaserradev-gbj__dev-workflow/plugins/dev-workflow/skills/dev-wrapup/SKILL.md` | - |
| dev-review | `andreaserradev-gbj__dev-workflow/plugins/dev-workflow/skills/dev-review/SKILL.md` | - |
| dev-resume | `andreaserradev-gbj__dev-workflow/plugins/dev-workflow/skills/dev-resume/SKILL.md` | - |
| dev-dashboard | `andreaserradev-gbj__dev-workflow/plugins/dev-workflow/skills/dev-dashboard/SKILL.md` | - |
| dev-checkpoint | `andreaserradev-gbj__dev-workflow/plugins/dev-workflow/skills/dev-checkpoint/SKILL.md` | - |
| dev-dashboard-tui | `andreaserradev-gbj__dev-workflow/plugins/dev-workflow/skills/dev-dashboard-tui/SKILL.md` | - |

## context4ai/workflow (10 skills)
Origen: https://github.com/context4ai/workflow

| skill | ruta | descripción |
|---|---|---|
| design | `context4ai__workflow/skills/design/SKILL.md` | Frontend page design system guide. Auto-loads C4A design tokens, component specs, and page templates when developing frontend pages. Includes layout structure r |
| review | `context4ai__workflow/skills/review/SKILL.md` | Audit PRD and Plan consistency. Builds a spec traceability matrix (PRD[Sn] → Plan[Pn]), detects blocking issues (spec gaps, logic conflicts, dependency cycles), |
| verify | `context4ai__workflow/skills/verify/SKILL.md` | Unified quality gate. Executes typecheck, lint, unit tests, and E2E tests with configurable scope (fast/standard/full). Filters known runtime noise, persists lo |
| make-kb | `context4ai__workflow/skills/make-kb/SKILL.md` | Extract structured knowledge graphs from existing materials (documents, code, or both). Produces a source-traced knowledge base with domain/application/story No |
| fix-plan | `context4ai__workflow/skills/fix-plan/SKILL.md` | Fix issues identified by /review. Handles 11 repair categories (spec gaps, logic conflicts, Node gaps, dependency cycles, etc.) with strict Fact change rules an |
| make-prd | `context4ai__workflow/skills/make-prd/SKILL.md` | Model product requirements as a Product-layer knowledge graph (domain/application/story Nodes + Edges + Facts). Produces a PRD document with spec traceability f |
| make-plan | `context4ai__workflow/skills/make-plan/SKILL.md` | Model implementation plans as a Code-layer knowledge graph (Package/Symbol Nodes + Edges + Facts organized by Phase). Maps PRD specs to Plan specs via implement |
| graph-view | `context4ai__workflow/skills/graph-view/SKILL.md` | Visualize PRD/Plan knowledge graphs as interactive force-directed diagrams. Parses Graph + Facts sections from design documents and produces a self-contained HT |
| make-test-plan | `context4ai__workflow/skills/make-test-plan/SKILL.md` | Generate E2E test skeletons from PRD + Plan. Creates version test index (README.md) and bone-skeleton test files with test.todo placeholders, categorized by ver |
| implement-by-plan | `context4ai__workflow/skills/implement-by-plan/SKILL.md` | Execute assigned Agent tasks from the Plan. Loads assigned Phase Nodes and Facts, implements code changes, validates specs with evidence, and writes back Plan d |

## tanRdev/auto-adr (1 skills)
Origen: https://github.com/tanRdev/auto-adr

| skill | ruta | descripción |
|---|---|---|
| adr | `tanRdev__auto-adr/skills/adr/SKILL.md` | Generate an Architecture Decision Record from the current conversation, documenting the problem, decision, and files modified |
