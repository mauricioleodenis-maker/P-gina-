import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export const PUBLIC_PATHS = [
  '/', '/sobre-mi', '/servicios', '/tarifas', '/contacto',
  '/aviso-legal', '/privacidad', '/privacidad/derechos', '/cookies', '/consentimiento-informado',
] as const;

/** Falla si axe encuentra violaciones serias o criticas (WCAG 2.x A/AA). */
export async function expectNoSeriousA11y(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.nodes.length} nodos`)).toEqual([]);
}
