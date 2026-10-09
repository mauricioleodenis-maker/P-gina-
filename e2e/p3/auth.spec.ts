import { expect, test } from '@playwright/test';

/**
 * Humo de auth sin credenciales reales. El flujo completo (login + TOTP) necesita un proyecto
 * Supabase de staging con usuario de prueba: E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD / E2E_ADMIN_TOTP_SECRET.
 */
test.describe('proteccion del panel', () => {
  test('/admin sin sesion redirige a /login con next', async ({ page }) => {
    await page.goto('/admin/pacientes');
    await expect(page).toHaveURL(/\/login\?.*next=%2Fadmin%2Fpacientes|\/login\?error=config/);
  });

  test('/admin responde con noindex, no-store y CSP con nonce', async ({ request }) => {
    const res = await request.get('/admin', { maxRedirects: 0 });
    expect([302, 307]).toContain(res.status());
    expect(res.headers()['x-robots-tag']).toContain('noindex');
    expect(res.headers()['cache-control']).toContain('no-store');
    expect(res.headers()['content-security-policy']).toMatch(/nonce-/);
  });

  test('/login muestra el formulario accesible', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Iniciar sesion' })).toBeVisible();
    await expect(page.getByLabel('Correo electronico')).toBeVisible();
    await expect(page.getByLabel('Contrasena')).toBeVisible();
    await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/);
  });

  test('credenciales vacias no avanzan', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('flujo completo (staging)', () => {
  test.skip(!process.env.E2E_ADMIN_EMAIL, 'Requiere usuario de prueba en staging');

  test('login con contrasena incorrecta muestra error generico', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Correo electronico').fill(process.env.E2E_ADMIN_EMAIL!);
    await page.getByLabel('Contrasena').fill('incorrecta-1234');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('alert')).toContainText('incorrectos');
  });
});
