---
name: graph-view
description: "Visualize PRD/Plan knowledge graphs as interactive force-directed diagrams. Parses Graph + Facts sections from design documents and produces a self-contained HTML visualization."
---

# Graph View

Visualizes PRD and Plan knowledge graphs as interactive force-directed diagrams. Parses the Graph and Facts sections from design documents and produces a self-contained HTML visualization with an auto-opening local HTTP server.

---

## Overview

This skill uses:

- **Extraction script**: `${CLAUDE_PLUGIN_ROOT}/scripts/graph-extract.ts` — parses design documents and extracts graph data (nodes, edges, facts) into JSON
- **HTML template**: `${CLAUDE_PLUGIN_ROOT}/scripts/graph-overview.html` — self-contained force-directed visualization template

### Output Files

| File | Description |
|---|---|
| `<design-dir>/graph-data.json` | Extracted graph data (nodes, edges, facts with version metadata) |
| `<design-dir>/graph-view.html` | Self-contained HTML visualization (embeds the JSON data + template) |

### Auto-Open

After generating the visualization, the skill starts a local HTTP server on `localhost:18910` and opens the graph view in the default browser. This avoids CORS issues with local `file://` access.

---

## Procedures

### Step 1 — Input Collection

1. Parse the version range from the invocation arguments:
   - `/graph-view` — all versions (default: `"*"`)
   - `/graph-view v0.5.*` — all patch versions in v0.5.x
   - `/graph-view v0.5.20` — a specific version only
2. Identify the design directory (default: `design/`)
3. Verify the design directory exists and contains version subdirectories

### Step 2 — Run Script

1. Execute the graph extraction script:
   ```
   bun ${CLAUDE_PLUGIN_ROOT}/scripts/graph-extract.ts <design-dir> "<version-glob>"
   ```
2. The script will:
   - Scan version directories matching the glob pattern
   - Parse PRD and Plan files for `## Graph` and `## Facts` sections
   - Extract nodes (Product, Package, Symbol types) with status (new/modified/existing/delete)
   - Extract edges (relationships between nodes)
   - Extract facts (key-value annotations on nodes)
   - Output `graph-data.json` in the design directory
3. Copy the HTML template to `<design-dir>/graph-view.html`, embedding the JSON data inline
4. Start a local HTTP server:
   ```
   open http://localhost:18910/graph-view.html
   ```
   Or use Python/Bun to serve the directory if a simple file server is needed.

### Step 3 — Report to User

Report the following:

```
## Graph View Generated

- Versions included: <matched-version-list>
- Nodes: <count> (Product: <n>, Package: <n>, Symbol: <n>)
- Edges: <count>
- Facts: <count>

Output:
  Data: <design-dir>/graph-data.json
  View: <design-dir>/graph-view.html

Opened in browser: http://localhost:18910/graph-view.html
```

If no versions matched the glob pattern, report an error:
```
No versions found matching "<glob>" in <design-dir>/
Available versions: <list>
```
