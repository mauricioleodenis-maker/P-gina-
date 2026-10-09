import { expect, test } from '@playwright/test';
import { expectNoSeriousA11y, PUBLIC_PATHS } from '../helpers';

for (const path of PUBLIC_PATHS) {
  test(`${path}: carga, un h1, sin errores de consola y axe sin graves`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main#contenido')).toBeVisible();
    expect(errors).toEqual([]);
    await expectNoSeriousA11y(page);
  });
}

test('ruta inexistente: 404 con noindex', async ({ page }) => {
  const res = await page.goto('/esta-ruta-no-existe');
  expect(res?.status()).toBe(404);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test('robots.txt bloquea admin y confirmacion; sitemap sin rutas privadas', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Disallow: /admin');
  expect(robots).toContain('Disallow: /reservar/confirmacion');
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('/aviso-legal');
  expect(sitemap).not.toContain('/admin');
  expect(sitemap).not.toContain('/confirmacion');
});

test('/admin sin sesion redirige a login', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login/);
});

test('sin cookies de terceros ni peticiones a Google/Meta', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (!['localhost', '127.0.0.1'].includes(u.hostname) && !u.hostname.endsWith('cloudflare.com')) external.push(u.hostname);
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(external.filter((h) => /google|gstatic|facebook|doubleclick/.test(h))).toEqual([]);
});
