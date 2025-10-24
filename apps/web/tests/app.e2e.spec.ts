import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'qa@prestaya.io';

async function login(page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard', { timeout: 5000 });
}

test.describe('PrestaYa workflows', () => {
  test('login, create loan, charge, historial overview', async ({ page }) => {
    await login(page);

    await expect(page.locator('text=Préstamos activos')).toBeVisible();

    await page.click('text=Crear Préstamo');
    await expect(page.locator('text=Crear préstamo')).toBeVisible();

    await page.fill('#borrowerName', 'Cliente Playwright');
    await page.fill('#borrowerPhone', '+541100000101');
    await page.fill('#principal', '2000');
    await page.fill('#interestRate', '10');
    await page.fill('#installments', '5');
    await page.selectOption('#frequency', 'weekly');
    const createResponsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/mock/loans') && response.request().method() === 'POST'
    );
    await page.click('button:has-text("Guardar préstamo")');
    const createResponse = await createResponsePromise;
    const { id: newLoanId } = await createResponse.json();
    await expect(page.locator('text=Préstamo creado correctamente')).toBeVisible();

    await page.waitForURL('/dashboard', { timeout: 5000 });
    await page.click('text=Cobrar');
    await expect(page).toHaveURL(/\/charge/);
    await page.selectOption('select', newLoanId);

    await page.fill('#amount', '440');
    await page.click('button:has-text("Confirmar Cobro")');
    await expect(page.locator('text=Cobranza registrada')).toBeVisible();

    await page.click('text=Historial');
    await expect(page.locator('text=Historial diario')).toBeVisible();

    await page.click('text=Usuarios');
    await expect(page.locator('text=Usuarios de la organización')).toBeVisible();
  });
});
