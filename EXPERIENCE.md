# EXPERIENCE.md - Caromafla (cómo se comporta)

Skills emi:pages aplicados: accessible-animation, gsap/motion (criterio), scroll-scrubbed-word-reveal y scroll-progress-timeline (criterio de TimelineScroll), motion-principles.

## Principio
El movimiento tranquiliza: lento, suave, sin rebotes, solo `transform` y `opacity`. Nunca decorativo en admin (100-200 ms).

## Mejora progresiva
Todo el contenido es visible sin JS y en SSR. Tras hidratar, `useRevealState` oculta solo lo que está fuera de pantalla y lo revela al entrar (sin parpadeo para lo ya visible). Sin saltos de maquetación (CLS).

## Escenas y primitivas (`src/components/motion`)
| escena | primitiva | notas |
|---|---|---|
| Hero | `SplitText immediate` + `DrawLine immediate` + `Parallax` (<=40 px) | palabras con máscara, 900 ms, stagger 90 ms |
| Cómo trabajo | `TimelineScroll` | línea (scaleY) ligada al scroll, pasos que se iluminan |
| Secciones | `Reveal` (700-900 ms, `delay` para stagger) | |
| Reserva | `MagneticButton` (<=8 px, solo puntero fino) + `BookingCTA` fija móvil | |
| Respiración | `Breathing` (5 s) | pausable |
| Cinta de frases | `Marquee` | pausable (WCAG 2.2.2) |
| Scroll suave | `LenisProvider` (dentro de `MotionProvider`) | solo web pública |
| GSAP | `lib/motion/gsap.ts`: `loadGsap`, `withMotion` (gsap.matchMedia) | import dinámico tras hidratar, para escenas complejas de P4 |
| UI React | `MotionProvider` = `MotionConfig reducedMotion="user"` | usar `motion/react` |

Tiempos: hover 120-180 ms; modal/drawer 220-320 ms; reveal 700-900 ms; ruta 350-500 ms.

## prefers-reduced-motion (obligatorio, por niveles)
- Se elimina: Lenis, parallax, magnético, marquee, respiración, dibujado de trazo, desplazamientos y scrub.
- Se conserva: fundidos de opacidad <= 150 ms, color, foco.
- Implementado en CSS (`globals.css`, `@media (prefers-reduced-motion: reduce)`), en el hook `useReducedMotion`, en `MotionConfig` y en `withMotion`.
- Nada parpadea; las animaciones continuas llevan botón de pausa.

## Teclado y foco
Foco visible 2 px primary con offset; SkipLink; Header oculto no atrapa foco (se muestra al subir; el menú móvil lo mantiene visible); diálogos Radix devuelven el foco; Esc cierra.

## Presupuesto
JS inicial < 150 KB gz sin GSAP; Lenis y GSAP por import dinámico; fuentes autoalojadas con next/font.
