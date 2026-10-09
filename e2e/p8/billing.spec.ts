import { expect, test } from '@playwright/test';

/** Humo sin credenciales: rutas de ingresos/facturas protegidas. Flujo completo con E2E_ADMIN_* en staging. */
test.describe('ingresos protegidos', () => {
  for (const path of ['/admin/ingresos', '/admin/ingresos/facturas']) {
    test(`${path} sin sesion redirige a /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }
  test('PDF y CSV no son publicos', async ({ request }) => {
    for (const url of ['/api/invoices/00000000-0000-0000-0000-000000000000/pdf', '/api/invoices/export?type=payments']) {
      const res = await request.get(url, { maxRedirects: 0 });
      expect([302, 307, 401, 403]).toContain(res.status());
    }
  });
});
