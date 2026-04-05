import { test, expect, Page } from '@playwright/test';
import { loginUI, getAuthToken } from './helpers/auth';
import { TIMEOUTS, API_BASE_URL } from './helpers/constants';

/**
 * Tests E2E de Gestión de Cursos (Courses)
 *
 * REQUISITOS:
 * - Backend services running (gateway_service, planner_service)
 * - Usuario de prueba autenticado con permisos de admin
 *
 * NOTA: El degree de prueba se crea una sola vez vía API en beforeAll.
 * Los tests individuales operan sobre ese degree via UI.
 */

const ALERT_MESSAGES = {
  CREATED: 'successfully created',
  UPDATED: 'successfully updated',
  DELETED: 'successfully deleted',
} as const;

const DIALOG_TITLES = {
  CONFIRM_DELETION: 'Confirm deletion',
} as const;

// ===== HELPERS =====

/**
 * Genera un año académico único basado en el año actual
 */
function getUniqueAcademicYear(): string {
  // El dropdown ofrece currentYear±10 (2016-2036). Usamos los últimos ms del timestamp
  // para distribuir dentro de ese rango evitando colisiones entre workers paralelos.
  const currentYear = new Date().getFullYear();
  const offset = (Date.now() % 21) - 10; // -10 a +10, distribuido por timestamp
  const start = currentYear + offset;
  return `${start}-${start + 1}`;
}

/**
 * Filtra la tabla y busca una fila específica por año académico
 */
async function filterAndFindRow(page: Page, searchText: string) {
  const filterInput = page.getByPlaceholder(/filtrar|filter.*curso|course/i);
  await filterInput.fill(searchText);

  const row = page.getByRole('row', { name: new RegExp(searchText) });
  await expect(row).toBeVisible({ timeout: TIMEOUTS.STANDARD });
  return row;
}

/**
 * Click en el botón de crear curso y espera a que se abra el dialog
 */
async function clickCreateButton(page: Page) {
  const createBtn = page.getByRole('button', { name: /create course/i });
  await createBtn.click();

  // Esperar a que se abra el dialog
  await expect(page.getByRole('heading', { name: /crear.*curso|create course/i })).toBeVisible({ timeout: TIMEOUTS.SHORT });
}

/**
 * Espera y verifica que aparezca una alerta de éxito
 */
async function expectSuccessAlert(page: Page, messagePattern: string) {
  await expect(
    page.getByRole('alert').filter({ hasText: new RegExp(messagePattern, 'i') })
  ).toBeVisible({ timeout: TIMEOUTS.STANDARD });
}

/**
 * Crea un curso con el año académico proporcionado
 */
async function createCourse(page: Page, academicYear: string) {
  await clickCreateButton(page);

  await expect(
    page.getByRole('heading', { name: /crear.*curso|create course/i })
  ).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Seleccionar año académico del dropdown
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: academicYear }).click();

  // El estado por defecto es PLANIFICADO y está deshabilitado
  await Promise.all([
    page.waitForResponse(r =>
      r.url().includes('/course') &&
      r.request().method() === 'POST'
    ),
    page.getByRole('button', { name: /guardar|save.*course/i }).click(),
  ]);

  await expectSuccessAlert(page, ALERT_MESSAGES.CREATED);
  await page.waitForLoadState('networkidle');
}

// ===== TESTS =====

let testDegreeData: { degreeId: string; degreeAcronym: string };

test.describe('Course Management', () => {

  // Crea el degree de prueba UNA sola vez vía API por worker
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const token = await getAuthToken(page);

    const timestamp = Date.now().toString().slice(-6);
    const degreeAcronym = `TST${timestamp}`;

    const response = await page.request.post(`${API_BASE_URL}/degree`, {
      headers: { 'Authorization': `Bearer ${token}` },
      data: {
        name: 'INGENIERÍA DE PRUEBA',
        acronym: degreeAcronym,
      },
    });

    if (!response.ok()) {
      throw new Error(`Failed to create test degree: ${response.status()} ${await response.text()}`);
    }

    const data = await response.json();
    testDegreeData = {
      degreeId: data.data.degree.id,
      degreeAcronym,
    };

    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    const token = await getAuthToken(page);
    await page.request.delete(`${API_BASE_URL}/degree/${testDegreeData.degreeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await page.close();
  });

  // Login UI + navegación antes de cada test
  test.beforeEach(async ({ page }) => {
    await loginUI(page);

    await page.goto(`/degrees/${testDegreeData.degreeAcronym.toLowerCase()}/courses`);
    await page.waitForLoadState('networkidle');
  });

  test('should display courses list', async ({ page }) => {
    // Verificar que existe la tabla con encabezados
    await expect(page.locator('th').filter({ hasText: /course|curso/i })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /state|estado/i })).toBeVisible();
  });

  test('should create new course successfully', async ({ page }) => {
    // Generar año académico único
    const academicYear = getUniqueAcademicYear();

    await createCourse(page, academicYear);

    // Verificar que el curso aparece en la tabla
    const filterInput = page.getByPlaceholder(/filtrar|filter.*curso|course/i);
    await filterInput.fill(academicYear);

    const row = page.getByRole('row', { name: new RegExp(academicYear) });
    await expect(row).toBeVisible({ timeout: TIMEOUTS.STANDARD });
    await expect(row).toContainText(/planificado|planned/i);
  });

  test('should show error when creating course with duplicate year', async ({ page }) => {
    // Crear primer curso
    const academicYear = getUniqueAcademicYear();

    await createCourse(page, academicYear);

    // Intentar crear otro con el mismo año
    await clickCreateButton(page);
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: academicYear }).click();
    await page.getByRole('button', { name: /guardar|save.*course/i }).click();

    // Debe mostrar error - verificar que el drawer sigue abierto (no se creó)
    await expect(page.getByRole('heading', { name: /crear.*curso|create course/i })).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Verificar que solo hay 1 curso con ese año en la tabla (no se duplicó)
    await page.getByRole('button', { name: /cancelar|cancel/i }).click();
    const filterInput = page.getByPlaceholder(/filtrar|filter.*curso|course/i);
    await filterInput.fill(academicYear);
    await expect(page.getByRole('row', { name: new RegExp(academicYear) })).toHaveCount(1);
  });

  test('should edit course state successfully', async ({ page }) => {
    // Crear curso para editar
    const academicYear = getUniqueAcademicYear();

    await createCourse(page, academicYear);

    // Buscar el curso en la tabla
    const filterInput = page.getByPlaceholder(/filtrar|filter.*curso|course/i);
    await filterInput.fill(academicYear);

    const tableRow = page.getByRole('row', { name: new RegExp(academicYear) });
    await expect(tableRow).toBeVisible({ timeout: TIMEOUTS.STANDARD });

    // Abrir el menú de acciones (MoreHorizontal button)
    const moreButton = tableRow.getByRole('button', { name: /open menu/i });
    await moreButton.click();

    // Click en editar del dropdown menu
    await page.getByRole('menuitem', { name: /edit/i }).click();

    // Esperar drawer de edición
    await expect(page.getByRole('heading', { name: /editar.*curso|edit course/i })).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Cambiar estado a ACTIVO (el combobox de estado es el segundo, el primero es el año académico)
    const stateCombobox = page.getByRole('combobox').nth(1);
    await stateCombobox.click();
    await page.getByRole('option', { name: /activo|active/i }).click();

    // Guardar cambios
    await page.getByRole('button', { name: /guardar.*cambios|save.*changes/i }).click();

    // Esperar mensaje de éxito
    await expectSuccessAlert(page, ALERT_MESSAGES.UPDATED);

    // Verificar que el estado cambió
    await filterInput.clear();
    await filterInput.fill(academicYear);

    const updatedRow = page.getByRole('row', { name: new RegExp(academicYear) });
    await expect(updatedRow).toBeVisible({ timeout: TIMEOUTS.STANDARD });
    await expect(updatedRow).toContainText(/activo|active/i);
  });

  test('should delete course successfully', async ({ page }) => {
    // Crear curso para eliminar
    const academicYear = getUniqueAcademicYear();

    await createCourse(page, academicYear);

    // Buscar el curso en la tabla
    const filterInput = page.getByPlaceholder(/filtrar|filter.*curso|course/i);
    await filterInput.fill(academicYear);

    const row = page.getByRole('row', { name: new RegExp(academicYear) });
    await expect(row).toBeVisible({ timeout: TIMEOUTS.STANDARD });

    // Abrir el menú de acciones
    const moreButton = row.getByRole('button', { name: /open menu/i });
    await moreButton.click();

    // Click en delete del dropdown menu
    await page.getByRole('menuitem', { name: /delete/i }).click();

    // Debe aparecer diálogo de confirmación
    const dialog = page.getByRole('alertdialog');
    await expect(
      dialog.getByRole('heading', { name: DIALOG_TITLES.CONFIRM_DELETION })
    ).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Debe mencionar que se eliminarán datos relacionados
    await expect(
      dialog.getByText(/groups|subjects|events|grupos|asignaturas/i)
    ).toBeVisible();

    // Confirmar eliminación
    await dialog.getByRole('button', { name: /confirmar|confirm/i }).click();

    // Esperar mensaje de éxito
    await expectSuccessAlert(page, ALERT_MESSAGES.DELETED);

    // Verificar que el curso ya no aparece en la tabla
    await filterInput.fill(academicYear);

    await expect(
      page.locator('table').getByText(academicYear)
    ).not.toBeVisible({ timeout: TIMEOUTS.SHORT });
  });

  test('should cancel delete operation', async ({ page }) => {
    // Crear curso
    const academicYear = getUniqueAcademicYear();

    await createCourse(page, academicYear);

    // Buscar el curso en la tabla
    const filterInput = page.getByPlaceholder(/filtrar|filter.*curso|course/i);
    await filterInput.fill(academicYear);

    const row = page.getByRole('row', { name: new RegExp(academicYear) });
    await expect(row).toBeVisible({ timeout: TIMEOUTS.STANDARD });

    // Abrir el menú de acciones
    const moreButton = row.getByRole('button', { name: /open menu/i });
    await moreButton.click();

    // Click en delete del dropdown menu
    await page.getByRole('menuitem', { name: /delete/i }).click();

    // Apareció el diálogo
    const dialog = page.getByRole('alertdialog');
    await expect(
      dialog.getByRole('heading', { name: DIALOG_TITLES.CONFIRM_DELETION })
    ).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Click en cancelar
    await dialog.getByRole('button', { name: /cancelar|cancel/i }).click();

    // El curso debe seguir en la tabla
    await expect(
      page.locator('table').getByText(academicYear)
    ).toBeVisible({ timeout: TIMEOUTS.SHORT });
  });

  test('should filter courses by academic year', async ({ page }) => {
    // Crear dos cursos con años diferentes garantizados
    const year1 = getUniqueAcademicYear();
    let year2 = getUniqueAcademicYear();
    // Si colisionan, forzar un año diferente sumando 1 al offset
    if (year1 === year2) {
      const start = Number.parseInt(year1.split('-')[0]) + 1;
      year2 = `${start}-${start + 1}`;
    }

    // Crear primer curso
    await createCourse(page, year1);

    // Crear segundo curso
    await createCourse(page, year2);

    // Filtrar por el primer año
    const filterInput = page.getByPlaceholder(/filtrar|filter.*curso|course/i);
    await filterInput.fill(year1);

    // Solo debe aparecer el primero
    await expect(page.getByRole('row', { name: new RegExp(year1) })).toBeVisible({ timeout: TIMEOUTS.STANDARD });
    await expect(page.getByRole('row', { name: new RegExp(year2) })).not.toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Cambiar filtro al segundo año
    await filterInput.clear();
    await filterInput.fill(year2);

    // Solo debe aparecer el segundo
    await expect(page.getByRole('row', { name: new RegExp(year2) })).toBeVisible({ timeout: TIMEOUTS.STANDARD });
    await expect(page.getByRole('row', { name: new RegExp(year1) })).not.toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Limpiar filtro
    await filterInput.clear();
  });

  test('should validate required fields in create form', async ({ page }) => {
    await clickCreateButton(page);

    await expect(
      page.getByRole('heading', { name: /crear.*curso|create course/i })
    ).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // El botón de guardar debe estar deshabilitado sin año académico
    const saveButton = page.getByRole('button', { name: /guardar|save.*course/i });
    await expect(saveButton).toBeDisabled();

    // Seleccionar año académico
    const academicYear = getUniqueAcademicYear();
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: academicYear }).click();

    // Ahora el botón debe estar habilitado
    await expect(saveButton).toBeEnabled();
  });

  test('should have default state as PLANIFICADO', async ({ page }) => {
    await clickCreateButton(page);

    await expect(
      page.getByRole('heading', { name: /crear.*curso|create course/i })
    ).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Verificar que el estado por defecto es PLANIFICADO y está deshabilitado
    const stateSelect = page.getByRole('combobox').nth(1);
    await expect(stateSelect).toBeDisabled();

    // Verificar que el texto muestra "PLANIFICADO" o "Planned" (usar .first() porque hay múltiples elementos)
    await expect(page.getByText(/planificado|planned/i).first()).toBeVisible();
  });
});
