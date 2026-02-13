import { test, expect, Page } from '@playwright/test';

/**
 * Tests E2E de Gestión de Aulas (Classrooms)
 *
 * REQUISITOS:
 * - Backend services running (gateway_service, planner_service)
 * - Usuario de prueba autenticado con permisos de admin
 * - Base de datos de prueba limpia o con datos conocidos
 */

// ===== CONSTANTES =====
const TIMEOUTS = {
  STANDARD: 10000,
  SHORT: 5000,
  FILTER_APPLY: 500,
  DRAWER_ANIMATION: 500,
  NETWORK_IDLE: 1000,
} as const;

const TEST_CREDENTIALS = {
  email: process.env.TEST_USER_EMAIL || 'admin@test.com',
  password: process.env.TEST_USER_PASSWORD || 'Admin123!',
} as const;

const ALERT_MESSAGES = {
  CREATED: 'Classroom created',
  EDITED: 'Classroom edited',
  DELETED: 'Classroom deleted',
} as const;

const DIALOG_TITLES = {
  CONFIRM_DELETION: 'Confirm deletion',
} as const;

// ===== HELPERS =====

/**
 * Filtra la tabla y busca una fila específica por código
 */
async function filterAndFindRow(page: Page, code: string) {
  const filterInput = page.getByPlaceholder(/filtrar|filter.*código|code/i);
  await filterInput.fill(code);
  await page.waitForTimeout(TIMEOUTS.FILTER_APPLY);

  const row = page.locator(`tr:has-text("${code}")`);
  await expect(row).toBeVisible({ timeout: TIMEOUTS.STANDARD });
  return row;
}

/**
 * Click en el botón de crear aula
 */
async function clickCreateButton(page: Page) {
  const createBtn = page.getByRole('button', { name: /create classroom/i });
  await createBtn.waitFor({ state: 'visible', timeout: TIMEOUTS.STANDARD });
  await createBtn.click();
  await page.waitForTimeout(TIMEOUTS.DRAWER_ANIMATION);
}

/**
 * Espera y verifica que aparezca una alerta de éxito
 */
async function expectSuccessAlert(page: Page, message: string) {
  await expect(
    page.getByRole('alert').filter({ hasText: message })
  ).toBeVisible({ timeout: TIMEOUTS.STANDARD });
}

test.describe('Classroom Management', () => {
  // Setup: Login antes de cada test
  test.beforeEach(async ({ page }) => {
    const testEmail = TEST_CREDENTIALS.email;
    const testPassword = TEST_CREDENTIALS.password;

    // Navegar a página inicial
    await page.goto('/');

    // Click en "Iniciar sesión"
    await page.getByRole('button', { name: /iniciar sesión|login/i }).click();
    await page.waitForLoadState('networkidle');

    // Login
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/contraseña|password/i).fill(testPassword);
    await page.getByRole('button', { name: /iniciar sesión|login|sign in/i }).last().click();

    // Esperar redirección a home
    await expect(page).toHaveURL('/home', { timeout: TIMEOUTS.STANDARD });

    // Navegar directamente a classrooms
    await page.goto('/classrooms');
    await expect(page).toHaveURL('/classrooms', { timeout: TIMEOUTS.SHORT });

    // Esperar a que la tabla cargue
    await page.waitForLoadState('networkidle');

    // Scroll hacia arriba para asegurar que el toolbar esté visible
    await page.evaluate(() => window.scrollTo(0, 0));
  });

  test('should display classrooms list', async ({ page }) => {
    // Verificar que estamos en la página de classrooms
    await expect(page).toHaveURL('/classrooms');

    // Verificar que existe la tabla con encabezados
    await expect(page.locator('th').filter({ hasText: /code|código/i })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /gis url/i })).toBeVisible();
  });

  test('should create new classroom successfully', async ({ page }) => {
    // Generar código único para evitar conflictos
    const uniqueCode = `TEST-${Date.now()}`;
    const testGisUrl = 'http://gis.example.com/test-room';

    // Click en botón "Create classroom"
    await clickCreateButton(page);

    // Esperar a que se abra el drawer/dialog
    await expect(
      page.getByRole('heading', { name: /crear aula|create classroom/i })
    ).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Llenar formulario
    await page.getByLabel(/código|code/i).fill(uniqueCode);
    await page.getByLabel(/gis.*url/i).fill(testGisUrl);

    // Click en guardar
    await page.getByRole('button', { name: /guardar|save/i }).click();

    // Esperar mensaje de éxito
    await expectSuccessAlert(page, ALERT_MESSAGES.CREATED);

    // Esperar a que el drawer se cierre y la tabla se actualice
    await page.waitForLoadState('networkidle');

    // Verificar que el aula aparece en la tabla
    await filterAndFindRow(page, uniqueCode);
  });

  test('should show error when creating classroom with duplicate code', async ({ page }) => {
    // Primero, crear un aula
    const duplicateCode = `DUP-${Date.now()}`;

    await clickCreateButton(page);
    await page.getByLabel(/código|code/i).fill(duplicateCode);
    await page.getByLabel(/gis.*url/i).fill('http://example.com/1');
    await page.getByRole('button', { name: /guardar|save/i }).click();

    // Esperar mensaje de éxito
    await expectSuccessAlert(page, ALERT_MESSAGES.CREATED);

    // Esperar a que el drawer se cierre y la tabla se actualice
    await page.waitForTimeout(TIMEOUTS.NETWORK_IDLE);

    // Intentar crear otra con el mismo código
    await clickCreateButton(page);
    await page.getByLabel(/código|code/i).fill(duplicateCode);
    await page.getByLabel(/gis.*url/i).fill('http://example.com/2');
    await page.getByRole('button', { name: /guardar|save/i }).click();

    // Debe mostrar error de duplicado
    await expect(
      page.locator('text=/ya existe|already exists|código/i')
    ).toBeVisible({ timeout: TIMEOUTS.STANDARD });
  });

  test('should edit classroom successfully', async ({ page }) => {
    // Crear aula para editar
    const originalCode = `EDIT-${Date.now()}`;
    const newGisUrl = 'http://updated-gis.example.com';

    // Crear aula
    await clickCreateButton(page);
    await page.getByLabel(/código|code/i).fill(originalCode);
    await page.getByLabel(/gis.*url/i).fill('http://original.com');
    await page.getByRole('button', { name: /guardar|save/i }).click();
    await expectSuccessAlert(page, ALERT_MESSAGES.CREATED);

    // Esperar a que el drawer se cierre y la tabla se actualice
    await page.waitForLoadState('networkidle');

    // Buscar la fila en la tabla
    const tableRow = await filterAndFindRow(page, originalCode);

    // Click en botón de editar usando aria-label
    const editButton = tableRow.getByRole('button', { name: 'Edit' });
    await editButton.click({ timeout: TIMEOUTS.STANDARD });

    // Esperar drawer de edición
    await expect(
      page.getByRole('heading', { name: /editar aula|edit classroom/i })
    ).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // El código debe estar deshabilitado (no editable)
    const codeInput = page.getByLabel(/código|code/i);
    await expect(codeInput).toBeDisabled();

    // Cambiar GIS URL
    await page.getByLabel(/gis.*url/i).clear();
    await page.getByLabel(/gis.*url/i).fill(newGisUrl);

    // Guardar cambios
    await page.getByRole('button', { name: /guardar|save.*cambios|changes/i }).click();

    // Esperar mensaje de éxito
    await expectSuccessAlert(page, ALERT_MESSAGES.EDITED);
  });

  test('should delete classroom without events', async ({ page }) => {
    // Crear aula para eliminar
    const deleteCode = `DELETE-${Date.now()}`;

    await clickCreateButton(page);
    await page.getByLabel(/código|code/i).fill(deleteCode);
    await page.getByLabel(/gis.*url/i).fill('http://delete-me.com');
    await page.getByRole('button', { name: /guardar|save/i }).click();
    await expectSuccessAlert(page, ALERT_MESSAGES.CREATED);

    // Esperar a que el drawer se cierre y la tabla se actualice
    await page.waitForLoadState('networkidle');

    // Buscar la fila en la tabla
    const row = await filterAndFindRow(page, deleteCode);

    // Click en botón de eliminar usando aria-label
    const deleteButton = row.getByRole('button', { name: 'Delete' });
    await deleteButton.click({ timeout: TIMEOUTS.STANDARD });

    // Debe aparecer diálogo de confirmación
    await expect(
      page.getByRole('heading', { name: DIALOG_TITLES.CONFIRM_DELETION })
    ).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Debe mencionar que se eliminarán los eventos relacionados
    await expect(
      page.getByText(/all events held in that classroom/i)
    ).toBeVisible();

    // Confirmar eliminación
    await page.getByRole('button', { name: /confirmar|confirm/i }).click();

    // Esperar mensaje de éxito
    await expectSuccessAlert(page, ALERT_MESSAGES.DELETED);

    // Verificar que el aula ya no aparece en la tabla
    await page.waitForLoadState('networkidle');
    const filterInput = page.getByPlaceholder(/filtrar|filter.*código|code/i);
    await filterInput.fill(deleteCode);
    await page.waitForTimeout(TIMEOUTS.FILTER_APPLY);

    await expect(
      page.locator('table').getByText(deleteCode)
    ).not.toBeVisible({ timeout: TIMEOUTS.SHORT });
  });

  test('should delete classroom with related events (force delete)', async ({ page }) => {
    /**
     * NOTA: Este test requiere crear un aula con eventos asociados.
     * En un entorno real, necesitarías:
     * 1. Crear un calendario
     * 2. Crear un evento que use este aula
     * 3. Luego intentar eliminar el aula
     *
     * Por simplicidad, este test verifica el comportamiento del diálogo.
     */

    // Crear aula (en un test real, aquí crearías también eventos)
    const classroomCode = `WITH-EVENTS-${Date.now()}`;

    await clickCreateButton(page);
    await page.getByLabel(/código|code/i).fill(classroomCode);
    await page.getByLabel(/gis.*url/i).fill('http://with-events.com');
    await page.getByRole('button', { name: /guardar|save/i }).click();
    await expectSuccessAlert(page, ALERT_MESSAGES.CREATED);

    // Esperar a que el drawer se cierre y la tabla se actualice
    await page.waitForLoadState('networkidle');

    // Buscar la fila en la tabla
    const row = await filterAndFindRow(page, classroomCode);

    // Click en botón de eliminar usando aria-label
    const deleteButton = row.getByRole('button', { name: 'Delete' });
    await deleteButton.click({ timeout: TIMEOUTS.STANDARD });

    // Verificar que el diálogo siempre advierte sobre eliminar eventos
    await expect(
      page.getByRole('heading', { name: /confirmar eliminación|confirm deletion/i })
    ).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // El mensaje debe advertir sobre eventos relacionados
    await expect(
      page.getByText(/all events held in that classroom/i)
    ).toBeVisible();

    // Confirmar
    await page.getByRole('button', { name: /confirmar|confirm/i }).click();

    // Esperar mensaje de éxito
    await expectSuccessAlert(page, ALERT_MESSAGES.DELETED);
  });

  test('should cancel delete operation', async ({ page }) => {
    // Crear aula
    const cancelCode = `CANCEL-${Date.now()}`;

    await clickCreateButton(page);
    await page.getByLabel(/código|code/i).fill(cancelCode);
    await page.getByLabel(/gis.*url/i).fill('http://cancel.com');
    await page.getByRole('button', { name: /guardar|save/i }).click();
    await expectSuccessAlert(page, ALERT_MESSAGES.CREATED);

    // Esperar a que el drawer se cierre y la tabla se actualice
    await page.waitForLoadState('networkidle');

    // Buscar la fila en la tabla
    const row = await filterAndFindRow(page, cancelCode);

    // Click en botón de eliminar usando aria-label
    const deleteButton = row.getByRole('button', { name: 'Delete' });
    await deleteButton.click({ timeout: TIMEOUTS.STANDARD });

    // Apareció el diálogo
    await expect(
      page.getByRole('heading', { name: DIALOG_TITLES.CONFIRM_DELETION })
    ).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Click en cancelar
    await page.getByRole('button', { name: /cancelar|cancel/i }).click();

    // El aula debe seguir en la tabla
    await expect(
      page.locator('table').getByText(cancelCode)
    ).toBeVisible({ timeout: TIMEOUTS.SHORT });
  });

  test('should filter classrooms by code', async ({ page }) => {
    // Crear dos aulas con códigos diferentes
    const code1 = `FILTER-A-${Date.now()}`;
    const code2 = `FILTER-B-${Date.now()}`;

    // Crear primera aula
    await clickCreateButton(page);
    await page.getByLabel(/código|code/i).fill(code1);
    await page.getByLabel(/gis.*url/i).fill('http://a.com');
    await page.getByRole('button', { name: /guardar|save/i }).click();
    await expectSuccessAlert(page, ALERT_MESSAGES.CREATED);

    // Esperar a que el drawer se cierre y la tabla se actualice
    await page.waitForLoadState('networkidle');

    // Crear segunda aula
    await clickCreateButton(page);
    await page.getByLabel(/código|code/i).fill(code2);
    await page.getByLabel(/gis.*url/i).fill('http://b.com');
    await page.getByRole('button', { name: /guardar|save/i }).click();
    await expectSuccessAlert(page, ALERT_MESSAGES.CREATED);

    // Esperar a que el drawer se cierre y la tabla se actualice
    await page.waitForLoadState('networkidle');

    // Buscar el input de filtro y filtrar por el código completo del primero
    const filterInput = page.getByPlaceholder(/filtrar|filter.*código|code/i);
    await filterInput.fill(code1);
    await page.waitForTimeout(TIMEOUTS.FILTER_APPLY);

    // Solo debe aparecer el primero
    await expect(page.locator(`tr:has-text("${code1}")`)).toBeVisible({ timeout: TIMEOUTS.STANDARD });
    await expect(page.locator(`tr:has-text("${code2}")`)).not.toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Cambiar filtro al segundo código
    await filterInput.clear();
    await filterInput.fill(code2);
    await page.waitForTimeout(TIMEOUTS.FILTER_APPLY);

    // Solo debe aparecer el segundo
    await expect(page.locator(`tr:has-text("${code2}")`)).toBeVisible({ timeout: TIMEOUTS.STANDARD });
    await expect(page.locator(`tr:has-text("${code1}")`)).not.toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Limpiar filtro para terminar el test
    await filterInput.clear();
    await page.waitForTimeout(TIMEOUTS.FILTER_APPLY);
  });
});
