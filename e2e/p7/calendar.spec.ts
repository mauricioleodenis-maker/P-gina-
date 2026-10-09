import { expect, test } from '@playwright/test';

/** Humo sin credenciales. El flujo completo (crear, arrastrar, deshacer, aceptar) requiere staging con E2E_ADMIN_*. */
test.describe('calendario y solicitudes: proteccion', () => {
  for (const path of ['/admin/calendario', '/admin/solicitudes']) {
    test(`${path} sin sesion redirige a /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test('cron materialize rechaza peticiones sin secreto', async ({ request }) => {
    const res = await request.get('/api/cron/materialize');
    expect([401, 403, 500]).toContain(res.status());
  });
});
