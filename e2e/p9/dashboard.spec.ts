import { expect, test } from '@playwright/test';

// Requiere sesion admin con MFA (fixture de P3/Integracion). Sin ella solo se comprueba la redireccion.
test('el dashboard exige sesion', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login/);
});

test('la bandeja de mensajes exige sesion', async ({ page }) => {
  await page.goto('/admin/mensajes');
  await expect(page).toHaveURL(/\/login/);
});

test.skip('KPIs, alertas y marcar mensaje como gestionado (requiere fixture admin aal2)', async () => {});
