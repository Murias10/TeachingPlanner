import { test, expect, Page } from '@playwright/test';
import { loginUI, getAuthToken } from './helpers/auth';
import { API_BASE_URL } from './helpers/constants';

/**
 * Tests E2E de Gestión de Asignaturas (Subjects)
 *
 * Estos tests usan API helpers para crear datos de prueba (degree, course, calendar)
 * en lugar de hacerlo manualmente a través de la UI, haciéndolos más robustos y rápidos.
 */

/**
 * Helper: Generar datos únicos de degree
 * Usa timestamp + random para evitar colisiones en ejecución paralela
 */
function generateDegreeData() {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return {
    name: 'INGENIERÍA DE PRUEBA',
    acronym: `T${timestamp}${random}`.substring(0, 10) // Limitar a 10 chars
  };
}

const SUBJECT_DATA = {
  name: 'BASES DE DATOS',
  acronym: 'BD',
  year: 1,
  siesCode: 'IPRB01-1-001',
  semester: 1
};


/**
 * Helper: Crear degree, course y calendar vía API
 */
async function createTestHierarchy(page: Page, token: string, degreeData: { name: string; acronym: string }) {
  // 1. Crear degree
  console.log('Creating degree:', degreeData);
  const degreeResponse = await page.request.post(`${API_BASE_URL}/degree`, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    data: {
      name: degreeData.name,
      acronym: degreeData.acronym
    }
  });

  if (!degreeResponse.ok()) {
    console.error('Failed to create degree:', degreeResponse.status(), await degreeResponse.text());
    throw new Error(`Failed to create degree: ${degreeResponse.status()}`);
  }

  const degree = await degreeResponse.json();
  console.log('Degree created:', degree);

  // 2. Crear course
  console.log('Creating course for degree:', degree.data.degree.id);
  const courseResponse = await page.request.post(`${API_BASE_URL}/course`, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    data: {
      degree: { id: degree.data.degree.id },  // API expects degree object with id
      startYear: '2026',
      endYear: '2027',
      state: 'PLANIFICADO'
    }
  });

  if (!courseResponse.ok()) {
    console.error('Failed to create course:', courseResponse.status(), await courseResponse.text());
    throw new Error(`Failed to create course: ${courseResponse.status()}`);
  }

  const course = await courseResponse.json();
  console.log('Course created:', course);

  // 3. Crear calendar
  const startDate = new Date('2026-09-01');
  const endDate = new Date('2027-01-30');

  console.log('Creating calendar for course:', course.data.course.id);
  const calendarResponse = await page.request.post(`${API_BASE_URL}/calendar`, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    data: {
      idCourse: course.data.course.id,  // API expects idCourse, not courseId
      semester: 1,
      start: startDate.toISOString(),
      end: endDate.toISOString()
    }
  });

  if (!calendarResponse.ok()) {
    console.error('Failed to create calendar:', calendarResponse.status(), await calendarResponse.text());
    throw new Error(`Failed to create calendar: ${calendarResponse.status()}`);
  }

  const calendar = await calendarResponse.json();
  console.log('Calendar created:', calendar);

  return {
    degreeId: degree.data.degree.id,
    degreeAcronym: degreeData.acronym,
    courseId: course.data.course.id,
    calendarId: calendar.data.calendar.id,
    startYear: 2026,
    endYear: 2027,
    semester: 1
  };
}

/**
 * Helper: Generar acrónimo único (solo letras, sin números)
 */
function generateUniqueAcronym(prefix: string = 'TST'): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomLetters = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  return `${prefix}${randomLetters}`;
}


/**
 * Helper: Crear subject via UI
 */
async function createSubject(page: Page, data: { name: string; acronym: string; year: number; semester: number; siesCode: string }) {
  // Hacer click en el botón crear
  const createButton = page.getByRole('button', { name: /crear|create/i }).first();
  await createButton.click();

  // Esperar a que el drawer se abra
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 3000 });

  // Llenar nombre
  const nameField = page.getByLabel(/subject name|nombre/i);
  await nameField.fill(data.name);

  // Llenar acrónimo (usar pressSequentially para evitar problemas con la validación)
  const acronymField = page.getByLabel(/subject acronym|acrónimo/i);
  await acronymField.click();
  await acronymField.clear();
  await acronymField.pressSequentially(data.acronym, { delay: 50 });

  // Seleccionar año usando getByLabel en lugar de ID
  const yearSelect = page.getByLabel(/año|year/i);
  await yearSelect.click();
  await page.getByRole('option', { name: new RegExp(`^${data.year}`, 'i') }).first().click();

  // Seleccionar semestre usando getByLabel en lugar de ID
  const semesterSelect = page.getByLabel(/semestre|semester/i);
  await semesterSelect.click();
  await page.getByRole('option', { name: new RegExp(`${data.semester}`, 'i') }).first().click();

  // Llenar código SIES
  const siesField = page.getByLabel(/sies code|código sies/i);
  await siesField.fill(data.siesCode);

  // Verificar que el botón save esté habilitado y hacer click
  const saveButton = dialog.getByRole('button', { name: /guardar|save/i });
  await expect(saveButton).toBeEnabled({ timeout: 2000 });

  // Registrar el listener del refetch (GET) ANTES del click para no perdernos la respuesta
  const refetchPromise = page.waitForResponse(
    r => r.url().includes('/subjects/calendar/') && r.request().method() === 'GET',
    { timeout: 15000 }
  );

  await Promise.all([
    page.waitForResponse(r =>
      r.url().includes('/subject') &&
      r.request().method() === 'POST'
    ),
    saveButton.click(),
  ]);

  // Esperar el refetch de React Query (GET subjects/calendar/:id)
  await refetchPromise;

  // Esperar que el drawer se cierre (implica que el POST retornó éxito)
  await expect(dialog).not.toBeVisible({ timeout: 5000 });

  // Usar el filtro de búsqueda para verificar que el subject se creó
  const filterInput = page.getByPlaceholder(/buscar|filter|search/i);
  await filterInput.fill(data.name);

  // La tabla ya tiene datos actualizados — el acrónimo debe ser visible
  await expect(page.locator('table').getByText(data.acronym)).toBeVisible({ timeout: 5000 });

  // Limpiar filtro
  await filterInput.clear();
}

test.describe('Subject Management', () => {
  // NOTE: Tests run in parallel by default, each with their own test data

  let testData: Awaited<ReturnType<typeof createTestHierarchy>>;

  test.beforeAll(async ({ browser }) => {
    // Crear datos de prueba una sola vez para todos los tests
    console.log('Setting up test data...');
    const page = await browser.newPage();
    const token = await getAuthToken(page);
    console.log('Got auth token');
    const degreeData = generateDegreeData();
    console.log('Generated unique degree data:', degreeData);
    testData = await createTestHierarchy(page, token, degreeData);
    console.log('Test data created:', JSON.stringify(testData, null, 2));
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    const token = await getAuthToken(page);
    await page.request.delete(`${API_BASE_URL}/degree/${testData.degreeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await loginUI(page);

    // Navegar directamente a la página de subjects
    const subjectsUrl = `/degrees/${testData.degreeAcronym}/courses/${testData.startYear}/${testData.endYear}/semester/${testData.semester}/subjects`;
    console.log(`Navigating to: ${subjectsUrl}`);

    await page.goto(subjectsUrl);
    await page.waitForLoadState('networkidle');

    // Verificar que navegamos correctamente
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    await expect(page).toHaveURL(new RegExp(subjectsUrl.replace(/\//g, '\\/')), { timeout: 5000 });
  });

  test('should display subjects list', async ({ page }) => {
    // Verificar que estamos en la página correcta
    await expect(page).toHaveURL(
      new RegExp(`/degrees/${testData.degreeAcronym}/courses/${testData.startYear}/${testData.endYear}/semester/${testData.semester}/subjects`)
    );

    // Verificar que existe el toolbar con botón crear
    await expect(page.getByRole('button', { name: /crear|create/i }).first()).toBeVisible();

    // Verificar que existe la tabla
    await expect(page.locator('table')).toBeVisible();
  });

  test('should create new subject successfully', async ({ page }) => {
    const testSubject = {
      name: 'BASES DE DATOS',
      acronym: generateUniqueAcronym('BD'),
      year: 1,
      semester: 1,
      siesCode: `IPRB01-1-${Date.now().toString().slice(-3)}`
    };

    await createSubject(page, testSubject);

    // Verificar que se creó exitosamente (buscar en la tabla específicamente)
    await expect(page.locator('table').getByText(testSubject.name)).toBeVisible({ timeout: 5000 });
    await expect(page.locator('table').getByText(testSubject.acronym)).toBeVisible();
  });

  test('should show error when creating subject with duplicate acronym', async ({ page }) => {
    const uniqueAcronym = generateUniqueAcronym('DUP');

    const firstSubject = {
      name: 'PRIMERA ASIGNATURA',
      acronym: uniqueAcronym,
      year: 1,
      semester: 1,
      siesCode: `IPRB01-1-${Date.now().toString().slice(-3)}`
    };

    await createSubject(page, firstSubject);

    // Asegurar que el drawer anterior se cerró completamente
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 });

    // Intentar crear otro subject con el mismo acrónimo
    await page.getByRole('button', { name: /crear|create/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 });

    await page.getByLabel(/subject name|nombre/i).fill('SEGUNDA ASIGNATURA');
    const acronymField = page.getByLabel(/subject acronym|acrónimo/i);
    await acronymField.click();
    await acronymField.clear();
    await acronymField.pressSequentially(uniqueAcronym, { delay: 50 });
    await page.getByLabel(/año|year/i).click();
    await page.getByRole('option', { name: /1/i }).first().click();
    await page.getByLabel(/semestre|semester/i).click();
    await page.getByRole('option', { name: /1/i }).first().click();
    await page.getByLabel(/sies code|código sies/i).fill(`IPRB01-1-${Date.now().toString().slice(-3)}`);

    const saveButton = page.getByRole('button', { name: /guardar|save/i }).last();
    await expect(saveButton).toBeEnabled({ timeout: 2000 });
    await saveButton.click();

    // El drawer debe seguir abierto (la petición falló por duplicado)
    await expect(saveButton).toBeDisabled({ timeout: 5000 });
    await expect(page.getByRole('dialog')).toBeVisible();

    // Cerrar el drawer manualmente
    await page.getByRole('button', { name: /cancel/i }).click();

    // Verificar que el duplicado no fue creado
    // Debe haber exactamente 1 fila con este acrónimo específico (el primero creado)
    const subjectRows = page.getByRole('row', { name: new RegExp(uniqueAcronym) });
    await expect(subjectRows).toHaveCount(1);
  });

  test('should edit subject successfully', async ({ page }) => {
    const uniqueAcronym = generateUniqueAcronym('EDT');

    await createSubject(page, {
      name: 'BASES DE DATOS',
      acronym: uniqueAcronym,
      year: 1,
      semester: 1,
      siesCode: `IPRB01-1-${Date.now().toString().slice(-3)}`
    });

    // Buscar el botón de editar
    const subjectRow = page.getByRole('row', { name: new RegExp(uniqueAcronym) });
    await subjectRow.getByRole('button', { name: /editar|edit/i }).click();

    // Esperar a que el dialog se abra
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Cambiar el nombre
    const nameInput = page.getByLabel(/nombre|name/i);
    await nameInput.clear();
    await nameInput.fill('SISTEMAS OPERATIVOS');

    // Guardar
    const saveButton = dialog.getByRole('button', { name: /guardar|save/i });
    await saveButton.click();

    // Verificar que se editó (buscar en la tabla para evitar conflictos con el toast)
    await expect(page.locator('table').getByText('SISTEMAS OPERATIVOS')).toBeVisible({ timeout: 5000 });
  });

  test('should delete subject successfully', async ({ page }) => {
    const uniqueAcronym = generateUniqueAcronym('DEL');

    await createSubject(page, {
      name: 'ASIGNATURA A ELIMINAR',
      acronym: uniqueAcronym,
      year: 1,
      semester: 1,
      siesCode: `IPRB01-1-${Date.now().toString().slice(-3)}`
    });

    // Eliminar
    const subjectRow = page.getByRole('row', { name: new RegExp(uniqueAcronym) });
    await subjectRow.getByRole('button', { name: /eliminar|delete|trash/i }).click();

    // Esperar a que aparezca el diálogo de confirmación y confirmar
    const confirmDialog = page.getByRole('alertdialog').or(page.getByRole('dialog'));
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole('button', { name: /eliminar|delete|confirm/i }).click();

    // Verificar que se eliminó
    await expect(page.getByText(uniqueAcronym)).not.toBeVisible({ timeout: 5000 });
  });

  test('should cancel delete operation', async ({ page }) => {
    const uniqueAcronym = generateUniqueAcronym('CAN');

    await createSubject(page, {
      name: 'ASIGNATURA CANCELAR',
      acronym: uniqueAcronym,
      year: 1,
      semester: 1,
      siesCode: `IPRB01-1-${Date.now().toString().slice(-3)}`
    });

    // Intentar eliminar pero cancelar
    const subjectRow = page.getByRole('row', { name: new RegExp(uniqueAcronym) });
    await subjectRow.getByRole('button', { name: /eliminar|delete|trash/i }).click();

    // Esperar a que aparezca el diálogo de confirmación y cancelar
    const confirmDialog = page.getByRole('alertdialog').or(page.getByRole('dialog'));
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole('button', { name: /cancelar|cancel/i }).click();

    // Verificar que el subject sigue visible
    await expect(page.getByText(uniqueAcronym)).toBeVisible();
  });

  test('should validate required fields in create form', async ({ page }) => {
    // Click en crear subject
    const createButton = page.getByRole('button', { name: /crear|create/i }).first();
    await createButton.click();

    // Esperar a que el dialog se abra
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const saveButton = dialog.getByRole('button', { name: /guardar|save/i });

    // Botón debe estar deshabilitado inicialmente
    await expect(saveButton).toBeDisabled();

    // Llenar campos uno por uno y verificar que sigue deshabilitado
    await page.getByLabel(/subject name|nombre/i).fill(SUBJECT_DATA.name);
    await expect(saveButton).toBeDisabled();

    await page.getByLabel(/subject acronym|acrónimo/i).fill(SUBJECT_DATA.acronym);
    await expect(saveButton).toBeDisabled();

    const yearSelect = page.getByLabel(/año|year/i);
    await yearSelect.click();
    await page.getByRole('option', { name: /1/i }).first().click();
    await expect(saveButton).toBeDisabled();

    const semesterSelect = page.getByLabel(/semestre|semester/i);
    await semesterSelect.click();
    await page.getByRole('option', { name: /1/i }).first().click();
    await expect(saveButton).toBeDisabled();

    // Llenar SIES code - ahora debe habilitarse
    await page.getByLabel(/sies code|código sies/i).fill(SUBJECT_DATA.siesCode);
    await expect(saveButton).toBeEnabled();
  });

  test('should enforce uppercase on name field', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /crear|create/i }).first();
    await createButton.click();

    // Esperar a que el dialog se abra
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const nameInput = page.getByLabel(/nombre|name/i);

    // Escribir en minúsculas
    await nameInput.fill('bases de datos');

    // Verificar que se convirtió a mayúsculas
    await expect(nameInput).toHaveValue(/BASES DE DATOS/i);

    // Verificar que solo permite letras y espacios
    await nameInput.fill('');
    await nameInput.pressSequentially('BASES123');

    await expect(nameInput).toHaveValue(/^[A-ZÁÉÍÓÚÑ\s]*$/);
  });

  test('should display correct year options (0-4)', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /crear|create/i }).first();
    await createButton.click();

    // Esperar a que el dialog se abra
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Abrir selector de año
    const yearSelect = page.getByLabel(/año|year/i);
    await yearSelect.click();

    // Verificar que existen las opciones 0-4
    // Las opciones pueden tener texto como "0th", "1st", "2nd", "3rd", "4th"
    const options = page.getByRole('option');
    await expect(options).toHaveCount(5); // Debe haber exactamente 5 opciones
  });

  test('should delete multiple subjects in bulk', async ({ page }) => {
    // Crear dos subjects con acrónimos únicos (solo letras)
    const subjects = [
      { name: 'BASES DE DATOS', acronym: generateUniqueAcronym('BD'), year: 1, semester: 1, siesCode: `IPRB01-1-001` },
      { name: 'REDES DE COMPUTADORES', acronym: generateUniqueAcronym('RC'), year: 1, semester: 1, siesCode: `IPRB01-1-002` }
    ];

    for (const subject of subjects) {
      await createSubject(page, subject);
    }

    // Esperar a que los subjects aparezcan en la tabla
    await expect(page.locator('table').getByText(subjects[0].acronym)).toBeVisible({ timeout: 5000 });
    await expect(page.locator('table').getByText(subjects[1].acronym)).toBeVisible({ timeout: 5000 });

    // Seleccionar ambos subjects usando el checkbox en la fila
    const bdRow = page.getByRole('row', { name: new RegExp(subjects[0].acronym) });
    await bdRow.getByRole('checkbox').check();

    const rcRow = page.getByRole('row', { name: new RegExp(subjects[1].acronym) });
    await rcRow.getByRole('checkbox').check();

    // Eliminar seleccionados
    await page.getByRole('button', { name: /eliminar.*seleccionad|delete.*selected/i }).click();

    // Esperar a que aparezca el diálogo de confirmación y confirmar
    const confirmDialog = page.getByRole('alertdialog').or(page.getByRole('dialog'));
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole('button', { name: /eliminar|delete|confirm/i }).click();

    // Verificar que se eliminaron
    await expect(page.getByText(subjects[0].acronym)).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText(subjects[1].acronym)).not.toBeVisible({ timeout: 5000 });
  });
});
