/**
 * Utilidad para calcular las fechas afectadas por un patrón personalizado
 */

export type CustomFrequencyUnit = 'day' | 'week' | 'month';
export type EndsType = 'never' | 'on' | 'after';
export type MonthlyPatternType = 'all-days' | 'day-of-month' | 'day-of-week';
export type WeekOccurrence = 'first' | 'second' | 'third' | 'fourth' | 'last';

export interface CustomPatternConfig {
    calendarStart: Date; // Inicio del calendario completo (necesario para calcular semanas naturales)
    startDate: Date; // Inicio del patrón personalizado
    endDate: Date; // Fin del calendario
    interval: number;
    unit: CustomFrequencyUnit;
    weekDays: string[];
    endsType: EndsType;
    endsOnDate?: string; // YYYY-MM-DD, usado cuando endsType === 'on'
    endsAfterOccurrences?: number; // Número de eventos, usado cuando endsType === 'after'
    // Monthly pattern fields
    monthlyPatternType?: MonthlyPatternType; // 'day-of-month' or 'day-of-week'
}

/**
 * Mapeo de letras de días a índices de JavaScript Date (0 = Domingo)
 */
const DAY_LETTER_TO_JS_INDEX: Record<string, number> = {
    D: 0,
    L: 1,
    M: 2,
    X: 3,
    J: 4,
    V: 5,
    S: 6
} as const;

const JS_INDEX_TO_LETTER: Record<number, string> = {
    0: 'D',
    1: 'L',
    2: 'M',
    3: 'X',
    4: 'J',
    5: 'V',
    6: 'S'
} as const;

/**
 * Agrega días a una fecha
 */
function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Agrega semanas a una fecha
 */
function addWeeks(date: Date, weeks: number): Date {
    return addDays(date, weeks * 7);
}

/**
 * Agrega meses a una fecha
 */
function addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

/**
 * Verifica si una fecha es un día de la semana especificado
 */
function isDayOfWeek(date: Date, weekDayLetter: string): boolean {
    const dayIndex = DAY_LETTER_TO_JS_INDEX[weekDayLetter];
    return date.getDay() === dayIndex;
}

/**
 * Formatea una fecha a YYYY-MM-DD
 */
export function formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Errores personalizados para validación de patrones
 */
class PatternValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PatternValidationError';
    }
}

const MIN_INTERVAL = 1;
const MIN_WEEKDAYS = 1;

/**
 * Valida que el intervalo sea positivo
 */
function validateInterval(interval: number): void {
    if (interval < MIN_INTERVAL) {
        throw new PatternValidationError(`El intervalo debe ser al menos ${MIN_INTERVAL}`);
    }
}

/**
 * Valida que haya al menos un día de la semana seleccionado
 */
function validateWeekDays(weekDays: string[]): void {
    if (weekDays.length < MIN_WEEKDAYS) {
        throw new PatternValidationError('Debe seleccionar al menos un día de la semana');
    }
}

/**
 * Valida que el rango de fechas sea válido
 */
function validateDateRange(startDate: Date, endDate: Date): void {
    if (startDate > endDate) {
        throw new PatternValidationError(
            `La fecha de inicio (${formatDateToYYYYMMDD(startDate)}) debe ser anterior ` +
            `a la fecha de fin (${formatDateToYYYYMMDD(endDate)})`
        );
    }
}

/**
 * Valida la configuración del patrón personalizado
 */
function validatePatternConfig(config: CustomPatternConfig): void {
    const { startDate, endDate, interval, weekDays } = config;

    validateInterval(interval);
    validateWeekDays(weekDays);
    validateDateRange(startDate, endDate);
}

/**
 * Calcula las fechas afectadas por un patrón semanal (similar a esSemanaPar)
 * Respeta las semanas naturales del calendario
 */
function calculateWeeklyPattern(
    calendarStart: Date,
    patternStart: Date,
    endDate: Date,
    interval: number,
    weekDays: string[]
): string[] {
    const dates: string[] = [];

    // Calcular el número de semana desde el inicio del calendario
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weeksSinceCalendarStart = Math.floor(
        (patternStart.getTime() - calendarStart.getTime()) / msPerWeek
    );

    // Empezar desde el inicio de la semana que contiene patternStart
    let currentWeek = weeksSinceCalendarStart;
    let weekStartDate = new Date(calendarStart);
    weekStartDate.setDate(weekStartDate.getDate() + currentWeek * 7);

    while (weekStartDate <= endDate) {
        // Solo incluir esta semana si cumple el patrón (cada X semanas)
        if ((currentWeek - weeksSinceCalendarStart) % interval === 0) {
            // Buscar días de esta semana que coincidan con weekDays
            for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
                const checkDate = new Date(weekStartDate);
                checkDate.setDate(checkDate.getDate() + dayOffset);

                // Solo incluir si está dentro del rango del patrón
                if (checkDate >= patternStart && checkDate <= endDate) {
                    const dayOfWeek = checkDate.getDay();
                    const weekDayLetter = JS_INDEX_TO_LETTER[dayOfWeek];

                    if (weekDays.includes(weekDayLetter)) {
                        dates.push(formatDateToYYYYMMDD(checkDate));
                    }
                }
            }
        }

        // Avanzar a la siguiente semana
        currentWeek++;
        weekStartDate.setDate(weekStartDate.getDate() + 7);
    }

    return dates;
}

interface MonthlyPatternDetails {
    dayOfMonth: number;
    weekOccurrence: WeekOccurrence;
    weekDay: string;
}

const WEEK_OCCURRENCE_MAP: WeekOccurrence[] = ['first', 'second', 'third', 'fourth'];
const DAYS_IN_WEEK = 7;

/**
 * Calcula cuántas veces ha ocurrido un día de la semana hasta una fecha dada en el mes
 * (ej: si es el segundo martes del mes, devuelve 2)
 */
function countWeekdayOccurrencesUpToDate(date: Date, targetDayOfWeek: number): number {
    let occurrenceCount = 0;
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    let currentDate = new Date(firstDayOfMonth);

    while (currentDate <= date) {
        if (currentDate.getDay() === targetDayOfWeek) {
            occurrenceCount++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return occurrenceCount;
}

/**
 * Verifica si una fecha es la última ocurrencia de su día de la semana en el mes
 */
function isLastOccurrenceInMonth(date: Date): boolean {
    const nextWeekDate = new Date(date);
    nextWeekDate.setDate(nextWeekDate.getDate() + DAYS_IN_WEEK);
    return nextWeekDate.getMonth() !== date.getMonth();
}

/**
 * Convierte un número de ocurrencia a su tipo correspondiente
 */
function mapOccurrenceNumberToType(occurrenceNumber: number): WeekOccurrence {
    const index = occurrenceNumber - 1;
    return WEEK_OCCURRENCE_MAP[index] || 'first';
}

/**
 * Calcula automáticamente los detalles del patrón mensual desde la fecha de inicio
 */
function calculateMonthlyPatternDetails(startDate: Date): MonthlyPatternDetails {
    const dayOfMonth = startDate.getDate();
    const dayOfWeek = startDate.getDay();
    const weekDay = JS_INDEX_TO_LETTER[dayOfWeek];

    const occurrenceNumber = countWeekdayOccurrencesUpToDate(startDate, dayOfWeek);
    const isLastOccurrence = isLastOccurrenceInMonth(startDate);

    const weekOccurrence: WeekOccurrence = isLastOccurrence
        ? 'last'
        : mapOccurrenceNumberToType(occurrenceNumber);

    return {
        dayOfMonth,
        weekOccurrence,
        weekDay
    };
}

/**
 * Verifica si una fecha es válida y está dentro del rango especificado
 */
function isDateWithinRange(date: Date, startDate: Date, endDate: Date): boolean {
    return date >= startDate && date <= endDate;
}

/**
 * Verifica si un día del mes es válido para el mes/año dado
 * (ej: el 31 de febrero no es válido)
 */
function isValidDayOfMonth(date: Date, expectedMonth: number): boolean {
    return date.getMonth() === expectedMonth;
}

/**
 * Crea una fecha para un día específico del mes si es válida y está en el rango
 * Retorna null si el día no existe en ese mes (ej: 31 de febrero) o está fuera del rango
 */
function createMonthDayIfValid(
    year: number,
    month: number,
    dayOfMonth: number,
    patternStart: Date,
    endDate: Date
): Date | null {
    const date = new Date(year, month, dayOfMonth);

    if (!isValidDayOfMonth(date, month)) {
        return null;
    }

    if (!isDateWithinRange(date, patternStart, endDate)) {
        return null;
    }

    return date;
}

/**
 * Mapeo de ocurrencias a números ordinales
 */
const OCCURRENCE_TO_NUMBER: Record<Exclude<WeekOccurrence, 'last'>, number> = {
    'first': 1,
    'second': 2,
    'third': 3,
    'fourth': 4
} as const;

/**
 * Encuentra la última ocurrencia de un día de la semana en un mes
 */
function findLastWeekdayInMonth(year: number, month: number, targetDayIndex: number): Date | null {
    let date = new Date(year, month + 1, 0); // Último día del mes

    while (date.getMonth() === month) {
        if (date.getDay() === targetDayIndex) {
            return date;
        }
        date.setDate(date.getDate() - 1);
    }

    return null;
}

/**
 * Encuentra la n-ésima ocurrencia de un día de la semana en un mes
 */
function findNthWeekdayInMonth(
    year: number,
    month: number,
    targetDayIndex: number,
    nthOccurrence: number
): Date | null {
    let count = 0;
    let date = new Date(year, month, 1);

    while (date.getMonth() === month) {
        if (date.getDay() === targetDayIndex) {
            count++;
            if (count === nthOccurrence) {
                return date;
            }
        }
        date.setDate(date.getDate() + 1);
    }

    return null;
}

/**
 * Obtiene el día de la semana específico en el mes (ej: primer lunes, último viernes)
 * y verifica que esté dentro del rango especificado
 */
function getWeekdayOccurrenceInMonth(
    year: number,
    month: number,
    weekDayLetter: string,
    occurrence: WeekOccurrence,
    patternStart: Date,
    endDate: Date
): Date | null {
    const targetDayIndex = DAY_LETTER_TO_JS_INDEX[weekDayLetter];

    const foundDate = occurrence === 'last'
        ? findLastWeekdayInMonth(year, month, targetDayIndex)
        : findNthWeekdayInMonth(year, month, targetDayIndex, OCCURRENCE_TO_NUMBER[occurrence]);

    if (!foundDate) {
        return null;
    }

    return isDateWithinRange(foundDate, patternStart, endDate) ? foundDate : null;
}

/**
 * Calcula las fechas afectadas por un patrón mensual
 * Respeta los meses naturales del calendario
 * Los detalles del patrón (día del mes o día de la semana) se calculan automáticamente desde patternStart
 */
function calculateMonthlyPattern(
    patternStart: Date,
    endDate: Date,
    interval: number,
    monthlyPatternType?: MonthlyPatternType
): string[] {
    const dates: string[] = [];

    // Calcular detalles del patrón desde la fecha de inicio
    const patternDetails = calculateMonthlyPatternDetails(patternStart);

    let currentMonth = new Date(patternStart.getFullYear(), patternStart.getMonth(), 1);
    let monthCount = 0;

    while (currentMonth <= endDate) {
        // Solo incluir este mes si cumple el patrón (cada X meses)
        if (monthCount % interval === 0) {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth();

            if (monthlyPatternType === 'day-of-month') {
                // Patrón: día específico del mes (ej: cada mes el día 15)
                const date = createMonthDayIfValid(year, month, patternDetails.dayOfMonth, patternStart, endDate);
                if (date) {
                    dates.push(formatDateToYYYYMMDD(date));
                }
            } else if (monthlyPatternType === 'day-of-week') {
                // Patrón: día de la semana específico (ej: primer lunes, último viernes)
                const date = getWeekdayOccurrenceInMonth(
                    year,
                    month,
                    patternDetails.weekDay,
                    patternDetails.weekOccurrence,
                    patternStart,
                    endDate
                );
                if (date) {
                    dates.push(formatDateToYYYYMMDD(date));
                }
            }
        }

        // Avanzar al siguiente mes
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        monthCount++;
    }

    return dates;
}

/**
 * Obtiene la función para agregar intervalos según la unidad
 */
function getIntervalAdder(unit: CustomFrequencyUnit, interval: number): (date: Date) => Date {
    const adders: Record<CustomFrequencyUnit, (date: Date) => Date> = {
        day: (date) => addDays(date, interval),
        week: (date) => addWeeks(date, interval),
        month: (date) => addMonths(date, interval)
    };

    return adders[unit];
}

/**
 * Calcula todas las fechas afectadas por un patrón personalizado
 *
 * @param config - Configuración del patrón personalizado
 * @returns Array de fechas en formato YYYY-MM-DD
 */
export function calculateAffectedDates(config: CustomPatternConfig): string[] {
    validatePatternConfig(config);

    const {
        calendarStart,
        startDate,
        endDate,
        interval,
        unit,
        weekDays,
        endsType,
        endsOnDate,
        endsAfterOccurrences,
        monthlyPatternType
    } = config;
    let affectedDates: string[] = [];

    // Calcular fechas según el tipo de unidad
    if (unit === 'day') {
        // Para días, simplemente iterar cada X días
        const addInterval = getIntervalAdder(unit, interval);
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            for (const weekDay of weekDays) {
                if (isDayOfWeek(currentDate, weekDay)) {
                    affectedDates.push(formatDateToYYYYMMDD(currentDate));
                }
            }
            currentDate = addInterval(currentDate);
        }
    } else if (unit === 'week') {
        // Para semanas, usar patrón semanal natural
        affectedDates = calculateWeeklyPattern(calendarStart, startDate, endDate, interval, weekDays);
    } else if (unit === 'month') {
        // Para meses, usar patrón mensual natural
        affectedDates = calculateMonthlyPattern(
            startDate,
            endDate,
            interval,
            monthlyPatternType
        );
    }

    // Eliminar duplicados y ordenar
    affectedDates = Array.from(new Set(affectedDates)).sort();

    // Aplicar límites de finalización
    if (endsType === 'on' && endsOnDate) {
        const endLimit = new Date(endsOnDate);
        affectedDates = affectedDates.filter(dateStr => new Date(dateStr) <= endLimit);
    }

    if (endsType === 'after' && endsAfterOccurrences && endsAfterOccurrences > 0) {
        affectedDates = affectedDates.slice(0, endsAfterOccurrences);
    }

    return affectedDates;
}

/**
 * Inicializa el contador de días por día de la semana
 */
function initializeDatesByWeekDay(): Record<string, number> {
    return {
        L: 0,
        M: 0,
        X: 0,
        J: 0,
        V: 0,
        S: 0,
        D: 0
    };
}

/**
 * Cuenta las ocurrencias de cada día de la semana
 */
function countDatesByWeekDay(dates: string[]): Record<string, number> {
    const datesByWeekDay = initializeDatesByWeekDay();

    for (const dateStr of dates) {
        const date = new Date(dateStr + 'T12:00:00');
        const dayIndex = date.getDay();
        const letter = JS_INDEX_TO_LETTER[dayIndex];
        if (letter) {
            datesByWeekDay[letter]++;
        }
    }

    return datesByWeekDay;
}

/**
 * Calcula un resumen estadístico de las fechas afectadas
 */
export function getAffectedDatesSummary(dates: string[]): {
    totalDates: number;
    firstDate: string | null;
    lastDate: string | null;
    datesByWeekDay: Record<string, number>;
} {
    if (dates.length === 0) {
        return {
            totalDates: 0,
            firstDate: null,
            lastDate: null,
            datesByWeekDay: {}
        };
    }

    return {
        totalDates: dates.length,
        firstDate: dates[0],
        lastDate: dates[dates.length - 1],
        datesByWeekDay: countDatesByWeekDay(dates)
    };
}

/**
 * Mapeo de letras de días a nombres en español
 */
const WEEKDAY_NAMES_ES: Record<string, string> = {
    'L': 'lunes',
    'M': 'martes',
    'X': 'miércoles',
    'J': 'jueves',
    'V': 'viernes',
    'S': 'sábado',
    'D': 'domingo'
} as const;

/**
 * Mapeo de ocurrencias a nombres ordinales en español
 */
const OCCURRENCE_NAMES_ES: Record<WeekOccurrence, string> = {
    'first': 'primer',
    'second': 'segundo',
    'third': 'tercer',
    'fourth': 'cuarto',
    'last': 'último'
} as const;

export interface MonthlyPatternLabels {
    dayOfMonth: string;
    dayOfWeek: string;
}

/**
 * Genera las etiquetas descriptivas para los dos patrones mensuales posibles
 * basándose en la fecha de inicio seleccionada
 */
export function getMonthlyPatternLabels(startDate: Date): MonthlyPatternLabels {
    const patternDetails = calculateMonthlyPatternDetails(startDate);

    const weekdayName = WEEKDAY_NAMES_ES[patternDetails.weekDay];
    const occurrenceName = OCCURRENCE_NAMES_ES[patternDetails.weekOccurrence];

    const dayOfMonthLabel = `el ${patternDetails.dayOfMonth} de cada mes`;
    const dayOfWeekLabel = `el ${occurrenceName} ${weekdayName} de cada mes`;

    return {
        dayOfMonth: dayOfMonthLabel,
        dayOfWeek: dayOfWeekLabel
    };
}
