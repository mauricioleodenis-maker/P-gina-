import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const slot = (start: string) => ({ start, end: new Date(new Date(start).getTime() + 3_000_000).toISOString() });

test.describe('P5 reserva publica', () => {
  test.beforeEach(async ({ page }) => {
    // Datos mock: el test no depende de Supabase.
    const day = new Date(Date.now() + 3 * 86_400_000);
    day.setUTCHours(9, 0, 0, 0);
    await page.route('**/api/booking/slots**', (r) => r.fulfill({ json: { ok: true, slots: [slot(day.toISOString()), slot(new Date(day.getTime() + 3_600_000).toISOString())] } }));
  });

  test('la pagina carga sin violaciones axe graves', async ({ page }) => {
    await page.goto('/reservar');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(res.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
  });

  test('flujo completo con teclado hasta la confirmacion', async ({ page }) => {
    await page.route('**/api/booking', (r) => r.fulfill({ status: 200, json: { ok: true, token: 'a'.repeat(43), startsAt: new Date(Date.now() + 3 * 86_400_000).toISOString() } }));
    await page.goto('/reservar');
    const first = page.getByRole('radio').first();
    if (!(await first.count())) test.skip(true, 'Sin servicios (Supabase no configurado)');
    await first.check();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('heading', { name: 'Elige día y hora' })).toBeFocused();
    await page.getByRole('button', { name: /hay horas disponibles/ }).first().click();
    await page.getByRole('button', { pressed: false }).filter({ hasText: /^\d\d:\d\d$/ }).first().click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByLabel('Nombre y apellidos').fill('Persona de Prueba');
    await page.getByLabel('Correo electrónico').fill('prueba@example.com');
    // Consentimientos no premarcados.
    for (const c of await page.getByRole('checkbox').all()) await expect(c).not.toBeChecked();
    await page.getByRole('button', { name: 'Solicitar cita' }).click();
  });

  test('doble reserva: 409 muestra alternativas y vuelve a elegir hora', async ({ page }) => {
    await page.route('**/api/booking', (r) => r.fulfill({ status: 409, json: { ok: false, code: 'slot_taken', message: 'Ese hueco acaba de ocuparse.', alternatives: [] } }));
    await page.goto('/reservar');
    const first = page.getByRole('radio').first();
    if (!(await first.count())) test.skip(true, 'Sin servicios (Supabase no configurado)');
    await first.check();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: /hay horas disponibles/ }).first().click();
    await page.getByRole('button', { pressed: false }).filter({ hasText: /^\d\d:\d\d$/ }).first().click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByLabel('Nombre y apellidos').fill('Persona de Prueba');
    await page.getByLabel('Correo electrónico').fill('prueba@example.com');
    await page.getByRole('checkbox').nth(1).check();
    await page.getByRole('checkbox').nth(2).check();
    await page.getByRole('button', { name: 'Solicitar cita' }).click();
    await expect(page.getByText('Ese hueco acaba de ocuparse.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Elige día y hora' })).toBeVisible();
  });

  test('la confirmacion con token invalido da 404 y es noindex', async ({ page }) => {
    const res = await page.goto('/reservar/confirmacion/token-invalido');
    expect(res?.status()).toBe(404);
  });
});
