---
name: emi
description: Emi (Everything Mind Intelligence) reúne en un solo skill 75 colecciones de skills sin modificar, organizadas en tres áreas. emi:pages sirve para diseñar y construir sitios web con criterio visual, animación (GSAP, Motion), 3D, componentes, marca y Figma. emi:planifica sirve para specs, PRDs, tareas, ADRs, memoria e investigación. emi:writing sirve para escribir, revisar, probar y asegurar código, más backend (Stripe, Cloudflare, Supabase, Postgres), subagentes, hooks y reglas. Úsalo para cualquier tarea de diseño web, planificación o programación, o cuando el usuario diga "emi", "emi:pages", "emi:planifica" o "emi:writing".
---

# Emi: Everything Mind Intelligence

Emi es un enrutador. No contiene reglas propias: dentro de cada subcarpeta están los skills originales de 25 repositorios, copiados sin cambios con sus licencias. Tu trabajo es encontrar el skill adecuado, leerlo y seguirlo.

## Las tres áreas

| Modo | Carpeta | Úsalo para |
|---|---|---|
| `emi:pages` | `pages/` | Sitios web y landing pages: dirección visual, anti-"AI slop", design systems, animación (GSAP, Framer Motion, scroll), 3D (Three.js), imágenes y assets, componentes (shadcn, Magic UI, 21st.dev), Astro y Tailwind, tokens y Figma |
| `emi:planifica` | `planifica/` | Antes de programar: specs (spec-kit, OpenSpec, BMAD), brainstorm y planes (superpowers), PRDs y tareas, ADRs, memoria entre sesiones, documentación actual (context7), investigación profunda |
| `emi:writing` | `writing/` | Escribir código: TDD, debugging, code review, seguridad (Trail of Bits), pruebas e2e (Playwright), subagentes, hooks, comandos, Stripe, Cloudflare, Supabase, Postgres |

Si el usuario nombra un modo (`emi:pages`, `emi:planifica`, `emi:writing`), usa esa área. Si no, elige el área por la tarea. Un proyecto web completo suele recorrer las tres: planifica, después pages y por último writing.

## Cómo encontrar y usar un skill

1. Abre el `INDEX.md` del área. Cada fila tiene el nombre del skill, la ruta a su `SKILL.md` y su descripción. Los índices son largos (writing tiene más de 2.500 skills), así que busca con Grep en vez de leerlos enteros:
   - `Grep pattern="gsap|scroll" path=".claude/skills/emi/pages/INDEX.md"`
   - `Grep pattern="tdd|test-driven" -i path=".claude/skills/emi/writing/INDEX.md"`
2. Lee el `SKILL.md` que elegiste, con la ruta relativa a la carpeta del área.
3. Sigue sus instrucciones tal como están. Si menciona archivos de `references/`, `scripts/` o `assets/`, están en su misma carpeta; resuelve las rutas desde ahí.
4. Si dos skills se contradicen, gana el que encaje mejor con lo que pidió el usuario. No mezcles reglas de skills distintos sin decirlo.

Prefiere los skills que se usan como punto de partida en cada área:

- **pages:** `nextlevelbuilder__ui-ux-pro-max-skill` para el sistema de diseño, `Leonxlnx__taste-skill` y `pbakaus__impeccable` para la dirección visual y la crítica, `anthropics__skills/skills/frontend-design` para decidir antes de codear, y `AThevon__genjutsu` para el movimiento.
- **planifica:** `obra__superpowers` (brainstorming, writing-plans), `github__spec-kit`, `Fission-AI__OpenSpec` y `bmad-code-org__BMAD-METHOD`.
- **writing:** `obra__superpowers-lab`, `LerianStudio__ring` (TDD, debugging, review), `trailofbits__skills` (seguridad) y `wshobson__agents`.

## Notas

- Algunos skills dependen de herramientas externas (CLIs, servidores MCP, claves de API). Si un skill pide algo que no está instalado, dilo al usuario en lugar de improvisar.
- Las licencias originales están en la carpeta de cada repositorio (`<owner>__<repo>/LICENSE`).
