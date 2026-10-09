import { expect, test } from '@playwright/test';

// Requiere sesion admin con MFA (fixture de P3/Integracion). Sin ella solo se comprueba la redireccion.
test('el area de pacientes exige sesion', async ({ page }) => {
  await page.goto('/admin/pacientes');
  await expect(page).toHaveURL(/\/login/);
});

test('la exportacion de un paciente exige sesion', async ({ request }) => {
  const res = await request.get('/admin/pacientes/00000000-0000-0000-0000-000000000000/export?format=json', { maxRedirects: 0 });
  expect([302, 307, 308, 401, 403]).toContain(res.status());
});

test.skip('crear paciente, nota cifrada y bloqueo a los 5 min (requiere fixture admin aal2)', async () => {});
