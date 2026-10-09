---
name: design
description: "Frontend page design system guide. Auto-loads C4A design tokens, component specs, and page templates when developing frontend pages. Includes layout structure references, component selection trees, and key design rules."
---

# Design

A frontend page design system guide for the C4A project. This skill auto-loads when creating or modifying frontend pages, providing design tokens, component specs, page templates, layout references, and key design rules.

---

## When This Skill Triggers

This skill should be loaded whenever the agent is:

- Creating a new frontend page or view
- Modifying the layout or visual structure of an existing page
- Adding or changing UI components on a page
- Working on styling, theming, or responsive behavior
- Reviewing frontend code for design system compliance

---

## Design System File Hierarchy

### Required Reads (Always Load)

These files MUST be read before any frontend page work:

| File | Path | Contents |
|---|---|---|
| **DESIGN.md** | `${CLAUDE_PLUGIN_ROOT}/design/ui/reference/DESIGN.md` | Full design system specification — colors, typography, elevation, layout, components, interaction rules, do's and don'ts |
| **_tokens.css** | `${CLAUDE_PLUGIN_ROOT}/design/ui/templates/_tokens.css` | CSS custom properties (all `--c4a-*` tokens) for dark and light themes |

### On-Demand Reads (Load When Relevant)

| File | Path | When to Load |
|---|---|---|
| **design-guide.md** | `${CLAUDE_PLUGIN_ROOT}/design/ui/reference/design-guide.md` | When making template selection decisions or implementing detailed card/spacing/typography patterns |
| **Component specs** | `${CLAUDE_PLUGIN_ROOT}/design/ui/components/<name>.md` | When using a specific component type (see component list below) |
| **Page templates** | `${CLAUDE_PLUGIN_ROOT}/design/ui/templates/<template>.html` | When creating a page that matches a template pattern |
| **_base.css** | `${CLAUDE_PLUGIN_ROOT}/design/ui/templates/_base.css` | When implementing structural CSS classes |

### Component Spec Files

| File | Components Covered |
|---|---|
| `buttons.md` | Primary, Secondary, Ghost buttons |
| `badges-status.md` | Badges, tags, status indicators |
| `cards.md` | Card structures, padding, spacing |
| `dialogs.md` | Modals, error dialogs, dialog shell |
| `dropdowns-menus.md` | Dropdown menus, select triggers |
| `empty-states.md` | Standard empty state, dashed placeholder |
| `forms.md` | Input, select, toggle, selection cards, labels |
| `navigation.md` | Sidebar, breadcrumbs, tabs |
| `tables.md` | Data tables, table containers |

---

## HTML Page Templates (13 Templates)

All templates are located at `${CLAUDE_PLUGIN_ROOT}/design/ui/templates/` and reference `_tokens.css` (color variables) + `_base.css` (structural classes).

| # | File | Layout Description |
|---|---|---|
| t00 | `t00-home.html` | Product landing page — hero section + feature cards + steps + CTA + footer |
| t01 | `t01-dashboard-home.html` | Dashboard overview — icon sidebar + status cards + statistics grid |
| t02 | `t02-sql-editor.html` | Three-column editor — query list + tabbed editor with add/remove + results panel |
| t03 | `t03-content-list.html` | Content list — dual sidebar + search bar + data table |
| t04 | `t04-settings-form.html` | Settings form — dual sidebar + tabs + form cards with full-width dividers |
| t05 | `t05-settings-split.html` | Split settings — dual sidebar + left/right split layout (no card wrappers, flat) |
| t06 | `t06-empty-placeholder.html` | Empty placeholder — dual sidebar + dashed-border empty state |
| t07 | `t07-overview-monitor.html` | Overview monitor — dual sidebar + large visualization card + stats + request table |
| t08 | `t08-card-grid.html` | Card grid — dual sidebar + two-column card grid with empty data placeholders |
| t09 | `t09-marketplace.html` | Marketplace — dual sidebar + search + preview image cards + install list |
| t10 | `t10-three-entry.html` | Three-entry page — dual sidebar + three equal-width entry cards + template row list |
| t11 | `t11-realtime.html` | Realtime / guide — dual sidebar + empty content hero + three equal-width guide cards |
| t12 | `t12-detail-page.html` | Detail page — dual sidebar + header with metadata + tabbed content sections |

### Theme Switching

To switch between dark and light themes in templates, change the `data-theme` attribute on the `<html>` element:
- Dark: `<html data-theme="dark">`
- Light: `<html data-theme="light">`

---

## Layout Structure Combinations Reference

Common page patterns and which template(s) to combine:

| Pattern | Description | Template(s) |
|---|---|---|
| **Standard content page** | Search/filter bar + data table in a card | t03 |
| **Form settings** | Card-wrapped form sections with dividers, Save button at bottom | t04 |
| **Split settings** | Left column (5/12) for descriptions + right column (7/12) for form controls, no card wrappers | t05 |
| **Detail page** | Header with title + metadata badges + tabbed content below | t12 |
| **Three-entry** | Three equal-width entry cards at top + list/grid below | t10 |
| **Stat card dashboard** | Status card row + statistics number grid + charts | t01 |
| **Empty state** | Centered title + description + CTA button (text + buttons only, no icons) | t06 |
| **Guide page** | Hero section with empty content + three guide cards below | t11 |
| **Monitor card** | Large visualization card + stat summary row + request/event table | t07, t08 |

### Mixed Layouts

Templates t04 and t05 can be mixed on the same page when some settings sections are simple (card-wrapped toggles) and others are complex (split layout with descriptions).

---

## Form Element Combinations

| Need | Pattern | Reference |
|---|---|---|
| Simple on/off | Toggle switch inside a settings card row | t04 |
| Text input with label | `font-mono text-xs uppercase` label + bordered input | forms.md |
| Selection from options | Selection cards with accent border on selected state | forms.md |
| Dropdown select | Select trigger with strong border + dropdown menu | dropdowns-menus.md |
| Multi-step wizard | Step indicator (dot + line) + form content per step | t04 or standalone |
| Configuration section | Card with title area + `border-t` divider + content + bottom action bar | cards.md |

---

## Page Selection Decision Tree

Use this tree to choose the right template for a new page:

```
What is the primary content of this page?
|
+-- Data list (entities, sources, files)
|   --> Use t03 (content-list)
|       Header + search bar + data table in a rounded bordered card
|
+-- Configuration / settings (toggles, form controls)
|   |
|   +-- Simple settings (toggle lists, enable/disable)
|   |   --> Use t04 (settings-form)
|   |       Card-wrapped sections + internal dividers + Save button
|   |
|   +-- Settings needing detailed explanations
|   |   --> Use t05 (settings-split)
|   |       Left 5/12 description + right 7/12 form, flat layout + hr dividers
|   |       Only standalone alerts/warnings get card wrappers
|   |
|   +-- Mixed (some simple, some complex)
|       --> Mix t04 and t05 on the same page
|
+-- Dashboard / overview (stats, charts)
|   --> Use t01 (dashboard-home)
|       Status card grid + stat number grid + charts
|
+-- Three-column (nav tree + list + detail/editor)
|   --> Use t02 (sql-editor / three-column)
|       Suited for graph browsers, file browsers, query editors
|
+-- Empty / onboarding
|   --> Use t06 (empty-placeholder)
|       Centered title + description + CTA button
|
+-- Detail view
|   --> Use t12 (detail-page)
|       Header with metadata + tabbed content sections
|
+-- Other (marketplace, monitoring, guide)
    --> Reference the matching template (t07, t08, t09, t10, t11)
```

---

## Development Workflow

Follow these 7 steps when creating or modifying a frontend page:

### Step 1 — Read Design System

Read the required files (DESIGN.md and _tokens.css) to ensure the design system rules are loaded.

### Step 2 — Identify Page Type

Use the Page Selection Decision Tree above to determine which template matches the page being built.

### Step 3 — Read the Template

Read the corresponding HTML template file to understand the layout structure, class names, and patterns used.

### Step 4 — Read Relevant Component Specs

Based on which UI components the page needs (buttons, tables, forms, etc.), read the relevant component spec files from `${CLAUDE_PLUGIN_ROOT}/design/ui/components/`.

### Step 5 — Implement the Page

Build the page following the template structure:
- Use `c4a-*` CSS tokens for all colors — never hardcode hex values
- Follow the typography hierarchy (primary / secondary / muted)
- Apply correct spacing from the spacing reference table
- Use the component patterns from the spec files

### Step 6 — Theme Verification

Verify the page works in both dark and light themes:
- Toggle `data-theme` between `"dark"` and `"light"`
- Check that all text has sufficient contrast
- Ensure code blocks use `data-theme="dark"` even in light mode
- Verify borders and surfaces create clear visual hierarchy in both themes

### Step 7 — Design Compliance Check

Review against the key design rules (below) and the Do's and Don'ts in DESIGN.md.

---

## Key Design Rules Summary

These are the most critical rules from the design system. Violations of these rules are the most common mistakes:

1. **Always use `c4a-*` tokens** — Never use Tailwind built-in color classes (`text-red-400`, `bg-amber-500`) or hardcoded hex values. All colors must come from CSS custom properties.

2. **Surface stacking for depth** — Use tonal surface tiers (`bg-base` → `bg-surface` → `bg-elevated`) instead of drop shadows. Shadows are secondary.

3. **Borders for structure** — Cards and containers use `border-default` borders for separation. Inside cards, use `border-t` / `border-r` dividers (not nested color blocks). Set card `padding: 0` with padding on child elements so dividers span full width.

4. **Typography hierarchy must be dramatic** — Titles vs body, large numbers vs small labels must differ significantly in size, weight, and color. Never use the same size/weight for a heading and its body text.

5. **Three text tiers** — `text-primary` for page titles and data values only. `text-secondary` for subtitles, card content, sidebar items (the workhorse). `text-muted` for timestamps, helper text, placeholders.

6. **Code blocks force dark mode** — In light mode, code/terminal blocks get `data-theme="dark"` for local dark scope. All `c4a-*` tokens inside automatically read dark values.

7. **No spinners or skeleton screens** — Use terminal-style text pulse: `animate-pulse font-mono text-xs uppercase tracking-tight text-c4a-text-muted`.

8. **No JS animation libraries** — Pure CSS transitions only. No Framer Motion, GSAP, or similar.

9. **Uppercase via CSS only** — Never hardcode uppercase in content strings. Always use `text-transform: uppercase` for i18n compatibility.

10. **Brand orange with restraint** — `c4a-accent` (#ef6f2e) is the sole interactive highlight. Use it only for primary buttons, active states, and selected elements. Do not overuse.

11. **Badges are border-only** — Transparent background with fine border + text color. No filled backgrounds on badges.

12. **Empty states are text-only** — Title + description + CTA button. No icons in empty states.

13. **Consistent form controls** — All form inputs share `border-c4a-border-strong` + `bg-c4a-bg-surface`. Focus state uses accent border. Labels use `font-mono text-xs uppercase tracking-tight text-c4a-text-secondary`.

14. **Expand/collapse arrows** — Use `ChevronRight` with `rotate-90` transition on expand. Never swap between ChevronDown/ChevronRight icons.

15. **Responsive: two-tier** — Wide/narrow only, CSS-first (media query / container query). No JS breakpoints. Narrow: collapse splits, full-width stack.
