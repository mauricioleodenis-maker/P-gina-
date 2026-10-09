# 07 - Brief de diseño y movimiento (para emi:pages)

Marca: **Caromafla** (nombre real de la psicóloga: TODO). Dominio: caromafla.online.
Método: spines de `bmad-ux` (DESIGN.md = cómo se ve / EXPERIENCE.md = cómo se comporta), emi:planifica. Las decisiones marcadas TODO las confirma la cliente.

## 1. Dirección visual
- Sensación: calma, confianza, calidez humana. Un consultorio luminoso, no una startup.
- Referencia mental: editorial suave, papel cálido, luz de tarde, plantas, cerámica. Cero stock de manos en cabeza.
- Anti-patrones (IA genérica): gradientes morado-azul, glassmorphism en todo, tarjetas idénticas de 3 columnas con iconos, emojis como iconos, "Transformamos tu vida", blobs aleatorios, sombras pesadas, hero con foto stock de siluetas.
- Fotografía: reales de la consulta y la psicóloga (TODO: sesión fotográfica). Mientras tanto, ilustración orgánica de líneas (SVG propias) y texturas de papel/grano sutil.
- Forma: radios generosos (16-28px), formas orgánicas asimétricas puntuales (arcos, óvalos), mucho espacio en blanco, ritmo vertical amplio.
- Voz (microcopy): cercana, en segunda persona, sin jerga clínica ni promesas de cura. Cumplir deontología: no garantizar resultados.

## 2. Paleta (tokens, contraste AA verificado al implementar)
| token | valor | uso |
|---|---|---|
| bg | #FAF6F0 (crema) | fondo |
| surface | #F2EBE1 | secciones alternas |
| ink | #2B2622 | texto principal (>12:1) |
| ink-soft | #5E544B | texto secundario (>6:1) |
| primary | #5F7A64 (salvia profunda) | CTA, enlaces |
| primary-ink | #FFFFFF | texto sobre primary |
| accent | #C98B6B (terracota suave) | detalles, subrayados, hover |
| sand | #E3D3BD | líneas, bordes |
| night | #1F2A25 | modo oscuro fondo / footer |
- Modo oscuro opcional en admin (TODO), público solo claro.
- Admin: misma base con neutros más fríos y semánticos: ok #3F7D58, aviso #B7791F, error #B23A3A. Gráficos: serie primaria salvia, secundaria terracota, terciaria arena oscura; nunca solo color (etiquetas y patrones). Skill dataviz para la paleta.

## 3. Tipografía
- Titulares: serif cálida con carácter, p. ej. **Fraunces** (variable, eje "soft") o Newsreader. Tamaños fluidos con clamp(), 48-96px en hero, interlineado 1.05-1.15.
- Cuerpo y UI: **Inter** o **DM Sans**, 17-18px, interlineado 1.6, medida 60-70 caracteres.
- Admin: DM Sans + números tabulares (font-variant-numeric: tabular-nums) en ingresos.
- Carga con next/font, sin FOUT, subset latin.
- Acento itálico en una palabra por titular (no más).

## 4. Layout
- Rejilla de 12 columnas, contenedor 1200px, gutter 16px móvil / 32px escritorio. Mobile first (la mayoría reservará desde el móvil).
- Secciones públicas: Hero, Cómo trabajo (3 pasos en línea de tiempo, no tarjetas), Sobre mí (retrato + texto), Terapias/servicios (lista editorial con hover), Tarifas (tabla clara), Opiniones solo si hay consentimiento (TODO), Reserva (CTA fija), FAQ, Contacto, Footer con aviso legal, privacidad, cookies, colegiación (TODO nº colegiada).
- Admin: shell con sidebar colapsable + topbar, densidad media, atajos de teclado, tablas con filtros guardados.

## 5. Movimiento
Principio: el movimiento tranquiliza. Lento, suave, sin rebotes. Nunca decorativo en el admin.

### Herramientas
- **Lenis** para scroll suave (solo web pública; apagado en admin y con reduced-motion).
- **GSAP + ScrollTrigger** para coreografía de scroll, texto y secuencias.
- **Motion (framer-motion)** para UI de React: AnimatePresence, layout, modales, drawers, transiciones de ruta, micro-interacciones.
- CSS puro para hover/focus. View Transitions API para rutas donde sea posible.
- Lazy load de GSAP por sección (dynamic import) para no penalizar LCP.

### Ritmo y tiempos
| contexto | duración | easing |
|---|---|---|
| hover/focus | 120-180ms | cubic-bezier(0.2,0,0,1) |
| modal/drawer/tab | 220-320ms | ease-out entrada, ease-in salida (más corta) |
| reveal de sección | 700-900ms | power3.out (GSAP), stagger 80-120ms |
| transición de ruta | 350-500ms | ease-in-out |
| scroll-scrub | progreso | linear |
Frecuencia: cuanto más se repite, más corto y sutil (admin: solo 100-200ms).

### Escenas públicas
1. Hero: titular con revelado por palabras/máscara (SplitText o equivalente), retrato con entrada tipo cortina suave, línea orgánica SVG que se dibuja (stroke-dashoffset). Parallax leve (<=40px).
2. Cómo trabajo: línea de tiempo que se dibuja con el scroll (scroll-progress-timeline), pasos que se iluminan.
3. Sobre mí: párrafo con revelado palabra a palabra ligado al scroll (scroll-scrubbed-word-reveal), texto legible aunque falle JS.
4. Servicios: lista editorial; al pasar el cursor aparece imagen/ilustración que sigue al puntero (solo puntero fino); en móvil, acordeón.
5. Tarifas/FAQ: acordeones con altura animada (Motion layout).
6. Reserva: CTA fija inferior en móvil, botón magnético sutil en escritorio, selector de hueco con transición de calendario suave.
7. Respiración: elemento decorativo opcional (círculo que respira 4-6s) en hero o página "ansiedad", pausable.
8. Cursor personalizado: NO (accesibilidad). Page loader: NO (retrasa); solo transición de ruta.

### Escenas admin (sobrias)
- Dashboard: números con conteo suave una vez, gráficos que dibujan en 600ms.
- Calendario: arrastrar y soltar con feedback, cambio de vista día/semana/mes con deslizamiento corto.
- Toasts, skeletons en lugar de spinners, estados vacíos amables.

### Accesibilidad del movimiento (obligatorio)
- `prefers-reduced-motion: reduce`: desactivar Lenis, parallax, scrub y movimiento grande; dejar fundidos de opacidad <=150ms. Implementar con gsap.matchMedia() y MotionConfig reducedMotion="user".
- Nada parpadea más de 3 veces/s. Animaciones decorativas pausables.
- Contenido visible sin JS (progressive enhancement), sin saltos de maquetación (CLS<0.1), solo transform/opacity.
- Foco visible siempre (anillo 2px primary + offset), objetivos táctiles >=44px, WCAG 2.2 AA.
- Presupuesto: LCP<2.5s, INP<200ms, JS inicial público <150KB gz sin GSAP (cargado tras hidratar).

## 6. Componentes
Público: Header (se oculta al bajar, aparece al subir), Hero, SplitHeading, RevealOnScroll, TimelineScroll, ServiceList, PriceTable, Accordion, BookingCTA, BookingWizard (servicio -> hueco -> datos -> consentimiento RGPD), ContactForm (con honeypot y límite), Footer, CookieBanner (solo si hay cookies no técnicas; preferible analítica sin cookies).
Admin: AppShell, Sidebar, CommandPalette (Cmd+K), DataTable, PatientCard, PatientForm, ClinicalNoteEditor (cifrado, bloqueo por inactividad), Calendar (día/semana/mes + recurrencia), AppointmentDrawer, PaymentForm, InvoiceView, StatCard, Chart (línea/barras/donut), EmptyState, Toast, ConfirmDialog.
Base: shadcn/ui + Radix sobre Tailwind v4, tokens CSS variables (tres capas: primitivo -> semántico -> componente).

## 7. Skills de emi:pages por parte
| parte | skill (INDEX pages) |
|---|---|
| Dirección y anti-slop | design-taste-frontend, high-end-visual-design, frontend-design (anthropics), minimalist-ui (editorial cálido) |
| Sistema de diseño y tokens | design-system, tailwind-theme-builder, ui-styling, shadcn-ui |
| Marca y voz | brand (ui-ux-pro-max), brand-guidelines solo como referencia de método |
| Estructura de vistas y UX | ui-ux-pro-max, impeccable (shape, polish, harden, adapt) |
| Animación scroll | gsap, scroll-progress-timeline, scroll-scrubbed-word-reveal, scroll-world-storytelling (opcional) |
| Animación UI React | framer-motion, motion-principles, motion-director, page-transition-animation |
| Accesibilidad | accessible-animation, a11y-audit |
| Reglas de producto React | react-patterns |
| SEO local | seo-local-business (schema.org MedicalBusiness/Psychologist, Google Business, NAP) |
| Referencias visuales | imagegen-frontend-web / image-to-code (generar referencias antes de codificar) |
| Revisión final | design-review, impeccable audit/critique, webapp-testing (Playwright) |
No usar: 3D/WebGL pesado (threejs, vantajs, globe), brutalist-ui, banners; no encajan con calma ni con presupuesto de rendimiento.

## 8. Entregables para emi:pages
1. DESIGN.md + EXPERIENCE.md (spines) con los tokens de arriba.
2. Tokens CSS/Tailwind y fuentes.
3. Librería de componentes con Storybook ligero o página /ui interna (TODO opcional).
4. Páginas públicas con animaciones y versión reduced-motion.
5. Shell y vistas del admin con datos de ejemplo.
6. Informe de auditoría: contraste, foco, reduced-motion, Lighthouse móvil >=90.

## 9. Abiertos (TODO)
Nombre y colegiación real, fotos, logo (propuesta: wordmark serif "Caromafla" con trazo orgánico), testimonios, tarifas, textos legales, decisión sobre modo oscuro y blog.
