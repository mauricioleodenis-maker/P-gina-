import { expect, test } from '@playwright/test';

for (const path of ['/', '/sobre-mi', '/servicios', '/tarifas', '/contacto']) {
  test(`${path} carga con un h1 y sin errores`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}

test('contacto exige consentimiento', async ({ page }) => {
  await page.goto('/contacto');
  await page.getByLabel('Nombre').fill('Prueba');
  await page.getByLabel('Correo electrónico').fill('prueba@example.com');
  await page.getByLabel('Mensaje').fill('Hola');
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  await expect(page.getByRole('alert').first()).toBeVisible();
});

test('detalle de servicio inexistente da 404', async ({ page }) => {
  const res = await page.goto('/servicios/no-existe');
  expect(res?.status()).toBe(404);
});
