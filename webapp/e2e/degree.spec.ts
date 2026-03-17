import { test, expect, Page } from '@playwright/test';
import { loginUI, getAuthToken } from './helpers/auth';
import { TIMEOUTS, API_BASE_URL } from './helpers/constants';

/**
 * Tests E2E de Gestión de Titulaciones (Degrees)
 *
 * REQUISITOS:
 * - Backend services running (gateway_service, planner_service)
 * - Usuario de prueba autenticado con permisos de admin
 * - Base de datos de prueba limpia o con datos conocidos
 */

const ALERT_MESSAGES = {
  CREATED: 'Degree created',
  UPDATED: 'Degree updated',
  DELETED: 'Degree deleted',
} as const;

const DIALOG_TITLES = {
  CONFIRM_DELETION: 'Confirm deletion',
} as const;

// ===== HELPERS =====

// IDs de degrees creados durante la suite — se limpian en afterAll
const createdIds: string[] = [];

/**
 * Genera un timestamp único de 4 dígitos
 */
function getUniqueId(): string {
  return Date.now().toString().slice(-6);
}

/**
 * Filtra la tabla y busca una fila específica por nombre
 */
async function filterAndFindRow(page: Page, name: string) {
  const filterInput = page.getByPlaceholder(/filtrar|filter.*nombre|name/i);
  await filterInput.fill(name);

  const row = page.getByRole('row', { name: new RegExp(name) });
  await expect(row).toBeVisible({ timeout: TIMEOUTS.STANDARD });
  return row;
}

/**
 * Click en el botón de crear titulación y espera a que se abra el dialog
 */
async function clickCreateButton(page: Page) {
  const createBtn = page.getByRole('button', { name: /create degree/i });
  await createBtn.click();

  // Esperar a que se abra el dialog
  await expect(page.getByRole('heading', { name: /crear.*titulación|create degree/i })).toBeVisible({ timeout: TIMEOUTS.SHORT });
}

/**
 * Espera y verifica que aparezca una alerta de éxito
 */
async function expectSuccessAlert(page: Page, message: string) {
  await expect(
    page.getByRole('alert').filter({ hasText: message })
  ).toBeVisible({ timeout: TIMEOUTS.STANDARD });
}

/**
 * Crea una titulación con los datos proporcionados
 */
async function createDegree(page: Page, name: string, acronym: string) {
  await clickCreateButton(page);

  await expect(
    page.getByRole('heading', { name: /crear.*titulación|create degree/i })
  ).toBeVisible({ timeout: TIMEOUTS.SHORT });

  await page.getByLabel(/nombre.*titulación|degree name/i).fill(name);
  await page.getByLabel(/acrónimo|acronym/i).fill(acronym);

  // Interceptar la respuesta para capturar el ID del degree creado
  const [response] = await Promise.all([
    page.waitForResponse(r =>
      r.url().includes('/degree') &&
      r.request().method() === 'POST' &&
      r.status() === 201
    ),
    page.getByRole('button', { name: /guardar|save.*degree/i }).click(),
  ]);

  const data = await response.json();
  createdIds.push(data.data.degree.id);

  await expectSuccessAlert(page, ALERT_MESSAGES.CREATED);
  await page.waitForLoadState('networkidle');
}

// ===== TESTS =====

test.describe('Degree Management', () => {
  // Limpieza: eliminar via API todos los degrees creados durante la suite
  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    const token = await getAuthToken(page);

    for (const id of createdIds) {
      await page.request.delete(`${API_BASE_URL}/degree/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    await page.close();
  });

  // Setup: Login antes de cada test
  test.beforeEach(async ({ page }) => {
    await loginUI(page);

    // Navegar directamente a degrees
    await page.goto('/degrees');
    await expect(page).toHaveURL('/degrees', { timeout: TIMEOUTS.SHORT });

    // Esperar a que la tabla cargue
    await page.waitForLoadState('networkidle');

    // Scroll hacia arriba para asegurar que el toolbar esté visible
    await page.evaluate(() => window.scrollTo(0, 0));
  });

  test('should display degrees list', async ({ page }) => {
    // Verificar que estamos en la página de degrees
    await expect(page).toHaveURL('/degrees');

    // Verificar que existe la tabla con encabezados
    await expect(page.locator('th').filter({ hasText: /name|nombre/i })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /acronym|acrónimo/i })).toBeVisible();
  });

  test('should create new degree successfully', async ({ page }) => {
    // Generar datos únicos para evitar conflictos
    const uniqueId = getUniqueId();
    // Usar un nombre único y menos común
    const uniqueName = `INGENIERÍA AEROESPACIAL AVANZADA`;
    const uniqueAcronym = `IAA${uniqueId}`;

    await createDegree(page, uniqueName, uniqueAcronym);

    // Verificar que la titulación aparece en la tabla usando el filtro
    const filterInput = page.getByPlaceholder(/filtrar|filter.*nombre|name/i);
    await filterInput.fill(uniqueName);
    

    const row = page.getByRole('row', { name: new RegExp(uniqueAcronym) });
    await expect(row).toBeVisible({ timeout: TIMEOUTS.STANDARD });
    await expect(row).toContainText(uniqueName);
  });

  test('should show error when creating degree with duplicate acronym', async ({ page }) => {
    // Crear primera titulación
    const uniqueId = getUniqueId();
    const firstName = `FÍSICA`;
    const duplicateAcronym = `FIS${uniqueId}`;

    await createDegree(page, firstName, duplicateAcronym);

    // Intentar crear otra con el mismo acrónimo
    await clickCreateButton(page);
    await page.getByLabel(/nombre.*titulación|degree name/i).fill(`ASTRONOMÍA`);
    await page.getByLabel(/acrónimo|acronym/i).fill(duplicateAcronym);
    await page.getByRole('button', { name: /guardar|save.*degree/i }).click();

    // Verificar que aparece el error (selector CSS directo para evitar problemas con animación)
    await expect(
      page.locator('[role="alert"]').filter({ hasText: /error.*degree|ya existe|already exists/i })
    ).toBeAttached({ timeout: TIMEOUTS.SHORT });

    // Verificar también que el drawer sigue abierto (no se creó el duplicado)
    await expect(page.getByRole('heading', { name: /crear.*titulación|create degree/i })).toBeVisible();
  });

  test('should edit degree successfully', async ({ page }) => {
    // Crear titulación para editar
    const uniqueId = getUniqueId();
    const originalName = `INGENIERÍA QUÍMICA`;
    const originalAcronym = `IQ${uniqueId}`;
    const newName = `INGENIERÍA BIOMÉDICA`;
    const newAcronym = `IB${uniqueId}`;

    await createDegree(page, originalName, originalAcronym);

    // Buscar la titulación en la tabla usando filtro
    const filterInput = page.getByPlaceholder(/filtrar|filter.*nombre|name/i);
    await filterInput.fill(originalName);
    

    const tableRow = page.getByRole('row', { name: new RegExp(originalAcronym) });
    await expect(tableRow).toBeVisible({ timeout: TIMEOUTS.STANDARD });

    // Click en botón de editar usando aria-label
    const editButton = tableRow.getByRole('button', { name: 'Edit' });
    await editButton.click({ timeout: TIMEOUTS.STANDARD });

    // Esperar drawer de edición
    await expect(
      page.getByRole('heading', { name: /editar.*titulación|edit degree/i })
    ).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Cambiar nombre y acrónimo
    const nameInput = page.getByLabel(/nombre.*titulación|degree name/i);
    await nameInput.clear();
    await nameInput.fill(newName);

    const acronymInput = page.getByLabel(/acrónimo|acronym/i);
    await acronymInput.clear();
    await acronymInput.fill(newAcronym);

    // Guardar cambios
    await page.getByRole('button', { name: /guardar.*cambios|save.*changes/i }).click();

    // Esperar mensaje de éxito
    await expectSuccessAlert(page, ALERT_MESSAGES.UPDATED);

    // Verificar que los cambios se aplicaron usando el filtro
    await page.waitForLoadState('networkidle');
    await filterInput.clear();
    await filterInput.fill(newName);
    

    const updatedRow = page.getByRole('row', { name: new RegExp(newAcronym) });
    await expect(updatedRow).toBeVisible({ timeout: TIMEOUTS.STANDARD });
    await expect(updatedRow).toContainText(newName);
  });

  test('should delete degree successfully', async ({ page }) => {
    // Crear titulación para eliminar
    const uniqueId = getUniqueId();
    const deleteName = `MEDICINA`;
    const deleteAcronym = `MED${uniqueId}`;

    await createDegree(page, deleteName, deleteAcronym);

    // Buscar la titulación en la tabla usando filtro
    const filterInput = page.getByPlaceholder(/filtrar|filter.*nombre|name/i);
    await filterInput.fill(deleteName);
    

    const row = page.getByRole('row', { name: new RegExp(deleteAcronym) });
    await expect(row).toBeVisible({ timeout: TIMEOUTS.STANDARD });

    // Click en botón de eliminar usando aria-label
    const deleteButton = row.getByRole('button', { name: 'Delete' });
    await deleteButton.click({ timeout: TIMEOUTS.STANDARD });

    // Debe aparecer diálogo de confirmación
    const dialog = page.getByRole('alertdialog');
    await expect(
      dialog.getByRole('heading', { name: DIALOG_TITLES.CONFIRM_DELETION })
    ).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Debe mencionar que se eliminarán datos relacionados
    await expect(
      dialog.getByText(/courses|subjects|cursos/i)
    ).toBeVisible();

    // Confirmar eliminación
    await page.getByRole('button', { name: /confirmar|confirm/i }).click();

    // Esperar mensaje de éxito
    await expectSuccessAlert(page, ALERT_MESSAGES.DELETED);

    // Verificar que la titulación ya no aparece en la tabla
    await page.waitForLoadState('networkidle');
    await filterInput.fill(deleteName);
    

    await expect(
      page.locator('table').getByText(deleteAcronym)
    ).not.toBeVisible({ timeout: TIMEOUTS.SHORT });
  });

  test('should cancel delete operation', async ({ page }) => {
    // Crear titulación con nombre único
    const uniqueId = getUniqueId();
    const cancelName = `CRIMINOLOGÍA FORENSE`;
    const cancelAcronym = `CFO${uniqueId}`;

    await createDegree(page, cancelName, cancelAcronym);

    // Buscar la titulación en la tabla (filtrar por nombre, luego buscar por acrónimo específico)
    const filterInput = page.getByPlaceholder(/filtrar|filter.*nombre|name/i);
    await filterInput.fill(cancelName);
    

    // Buscar la fila específica con este acrónimo único
    const row = page.getByRole('row', { name: new RegExp(cancelAcronym) });
    await expect(row).toBeVisible({ timeout: TIMEOUTS.STANDARD });

    // Click en botón de eliminar
    const deleteButton = row.getByRole('button', { name: /delete/i });
    await deleteButton.click({ timeout: TIMEOUTS.STANDARD });

    // Apareció el diálogo
    await expect(
      page.getByRole('heading', { name: DIALOG_TITLES.CONFIRM_DELETION })
    ).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Click en cancelar
    await page.getByRole('button', { name: /cancelar|cancel/i }).click();

    // La titulación debe seguir en la tabla (verificar con el acrónimo)
    await expect(
      page.getByRole('row', { name: new RegExp(cancelAcronym) })
    ).toBeVisible({ timeout: TIMEOUTS.SHORT });
  });

  test('should filter degrees by name', async ({ page }) => {
    // Crear dos titulaciones con acrónimos únicos
    // Los nombres son fijos para testear el filtro por nombre, los acrónimos son únicos
    const uniqueId1 = getUniqueId();
    const uniqueId2 = getUniqueId();
    const name1 = `ARQUEOLOGÍA MEDIEVAL`;
    const acronym1 = `AMV${uniqueId1}`;
    const name2 = `BIOTECNOLOGÍA MARINA`;
    const acronym2 = `BTM${uniqueId2}`;

    // Crear primera titulación
    await createDegree(page, name1, acronym1);
    await page.waitForLoadState('networkidle');

    // Crear segunda titulación
    await createDegree(page, name2, acronym2);
    await page.waitForLoadState('networkidle');

    // Scroll hacia arriba para asegurar que el filtro esté visible
    await page.evaluate(() => window.scrollTo(0, 0));
    

    // Filtrar por nombre único (incluye ID único → exactamente 1 resultado)
    const filterInput = page.getByPlaceholder(/filtrar|filter.*nombre|name/i);
    await filterInput.fill(name1);

    // Solo debe aparecer la primera
    await expect(page.getByRole('row', { name: new RegExp(acronym1) })).toBeVisible({ timeout: TIMEOUTS.STANDARD });
    await expect(page.getByRole('row', { name: new RegExp(acronym2) })).not.toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Cambiar filtro a la segunda
    await filterInput.clear();
    await filterInput.fill(name2);

    // Solo debe aparecer la segunda
    await expect(page.getByRole('row', { name: new RegExp(acronym2) })).toBeVisible({ timeout: TIMEOUTS.STANDARD });
    await expect(page.getByRole('row', { name: new RegExp(acronym1) })).not.toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Limpiar filtro
    await filterInput.clear();
    
  });

  test('should validate required fields in create form', async ({ page }) => {
    await clickCreateButton(page);

    await expect(
      page.getByRole('heading', { name: /crear.*titulación|create degree/i })
    ).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // El botón de guardar debe estar deshabilitado sin campos
    const saveButton = page.getByRole('button', { name: /guardar|save.*degree/i });
    await expect(saveButton).toBeDisabled();

    // Llenar solo el nombre
    await page.getByLabel(/nombre.*titulación|degree name/i).fill('INGENIERÍA');
    await expect(saveButton).toBeDisabled();

    // Llenar solo el acrónimo (después de limpiar nombre)
    await page.getByLabel(/nombre.*titulación|degree name/i).clear();
    await page.getByLabel(/acrónimo|acronym/i).fill('ING');
    await expect(saveButton).toBeDisabled();

    // Llenar ambos campos
    await page.getByLabel(/nombre.*titulación|degree name/i).fill('INGENIERÍA COMPLETA');
    await expect(saveButton).toBeEnabled();
  });

  test('should enforce uppercase on acronym field', async ({ page }) => {
    await clickCreateButton(page);

    const acronymInput = page.getByLabel(/acrónimo|acronym/i);

    // Intentar escribir en minúsculas
    await acronymInput.fill('abc');

    // Debe convertirse a mayúsculas
    await expect(acronymInput).toHaveValue('ABC');

    // Intentar mezclar mayúsculas y minúsculas
    await acronymInput.clear();
    await acronymInput.fill('AbC123');

    // Debe convertirse a mayúsculas
    await expect(acronymInput).toHaveValue('ABC123');
  });
});
