import { expect, test } from '@playwright/test';
import { expectNoSeriousA11y } from '../helpers';

const DOCS = ['/aviso-legal', '/privacidad', '/cookies', '/consentimiento-informado'];

for (const path of DOCS) {
  test(`${path}: muestra marca de revision, indice y fecha`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('note')).toContainText('REVISAR_CON_ABOGADO');
    await expect(page.getByRole('navigation', { name: 'Índice del documento' })).toBeVisible();
    await expect(page.locator('time').first()).toBeVisible();
    await expectNoSeriousA11y(page);
  });
}

test('el pie enlaza a todos los textos legales', async ({ page }) => {
  await page.goto('/');
  for (const name of ['Aviso legal', 'Privacidad', 'Cookies', 'Consentimiento informado']) {
    await expect(page.getByRole('contentinfo').getByRole('link', { name })).toBeVisible();
  }
});

test('privacidad menciona AEPD y art. 9.2.h', async ({ page }) => {
  await page.goto('/privacidad');
  await expect(page.getByText('www.aepd.es')).toBeVisible();
  await expect(page.getByText('9.2.h').first()).toBeVisible();
});

test('derechos: validacion y consentimiento obligatorio', async ({ page }) => {
  await page.goto('/privacidad/derechos');
  await page.getByRole('button', { name: 'Enviar solicitud' }).click();
  await expect(page.getByRole('alert').first()).toBeVisible();
});

test('sin banner de cookies cuando analitica esta apagada', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('region', { name: /Medición anónima/ })).toHaveCount(0);
});

test('blog apagado por defecto: 404', async ({ page }) => {
  test.skip(process.env.NEXT_PUBLIC_BLOG_ENABLED === 'true', 'blog activado');
  const res = await page.goto('/blog');
  expect(res?.status()).toBe(404);
});
