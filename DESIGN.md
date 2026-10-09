# DESIGN.md - Caromafla (cómo se ve)

Fuente: docs/plan/07-diseno-motion.md. Skills emi:pages aplicados: design-system, design-taste-frontend, frontend-design, impeccable, accessible-animation.

## Principios
Calma, calidez, consultorio luminoso. Editorial suave, papel cálido. Sin gradientes morado-azul, glassmorphism, tarjetas idénticas de 3 columnas con iconos, emojis-icono, blobs ni fotos stock de siluetas. Ilustración orgánica de líneas (SVG) y grano de papel sutil hasta tener fotos reales (TODO_REAL).

## Tokens (`src/app/globals.css`, `@theme`)
| capa | token | valor |
|---|---|---|
| primitivo/semántico | bg / surface | #FAF6F0 / #F2EBE1 |
| | ink / ink-soft | #2B2622 / #5E544B |
| | primary / primary-strong / primary-ink | #5F7A64 / #4D6652 / #FFFFFF |
| | accent / accent-strong | #C98B6B / #A8694A (accent-strong para texto y fondos con texto blanco) |
| | sand / night | #E3D3BD / #1F2A25 |
| | ok / warn / danger (admin) | #3F7D58 / #B7791F / #B23A3A |
| tipografía | `--font-serif` Fraunces, `--font-sans` DM Sans | vía next/font (raíz) |
| forma | radios 10/16/22/28 px; sombras `soft`, `lift` | |
| movimiento | `--ease-calm` (0.2,0,0,1), `--ease-out-soft` (0.22,1,0.36,1) | |

Contraste: ink sobre bg > 12:1; ink-soft > 6:1; primary-ink sobre primary ~4,5:1 (texto >= 17 px/medio); texto de acento sobre bg usa accent-strong. Verificar en Integración con axe.

## Tipografía
Titulares Fraunces, tamaños fluidos (`.text-display` 44-96 px, `.text-title` 32-56 px), interlineado 1,05-1,15, cursiva de acento en UNA palabra (`.accent-italic`, `SplitText accent`). Cuerpo DM Sans 17 px / 1,6, medida 68ch (`.measure`). Cifras tabulares con `.tabular` (ingresos).

## Layout
Contenedor 1200 px (`.container-site`), gutter 16/32 px, mobile first, objetivos táctiles >= 44 px (`min-h-11`). Footer sobre `night`.

## Componentes (`src/components/ui`)
Button/ButtonLink (primary, secondary, ghost, accent, danger; sm/md/lg), Card, Badge (tonos), Input/Textarea/Field (etiqueta, ayuda, error con `role=alert`), Select (Radix), Dialog (centrado o cajón lateral), Toast (provider + `useToast`), Table (con `caption` sr-only y celdas numéricas), Accordion (Radix, altura animada por CSS). Shell público: Header (se oculta al bajar), Footer (colegiación, legal, aviso de crisis 112/024), BookingCTA (fija móvil, oculta en /reservar), WhatsAppButton (solo con número), SkipLink.

## Marca
Wordmark serif "Caromafla" + punto de acento (provisional). Logo real: TODO_REAL.
