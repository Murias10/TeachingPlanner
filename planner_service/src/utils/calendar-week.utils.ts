/**
 * Utilidades para cálculo de semanas en calendarios académicos
 */

/**
 * Calcula el número de semana relativo al inicio del calendario
 * Usa semanas naturales (lunes a domingo)
 * @param fecha - Fecha a calcular
 * @param calendarioInicio - Fecha de inicio del calendario
 * @returns Número de semana (1, 2, 3, ...)
 */
export function calcularNumeroSemanaDesdeInicio(
  fecha: Date,
  calendarioInicio: Date
): number {
  // Normalizar ambas fechas a medianoche para evitar problemas de hora
  const fechaNorm = new Date(fecha);
  fechaNorm.setHours(0, 0, 0, 0);

  const inicioNorm = new Date(calendarioInicio);
  inicioNorm.setHours(0, 0, 0, 0);

  // Calcular el lunes de la semana de cada fecha
  // getDay() devuelve 0=Domingo, 1=Lunes, ..., 6=Sábado
  // Ajustamos para que lunes sea el día 0 de la semana
  const getLunesSemana = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Si es domingo, retroceder 6 días
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const lunesFecha = getLunesSemana(fechaNorm);
  const lunesInicio = getLunesSemana(inicioNorm);

  // Calcular diferencia en semanas completas
  const diffMs = lunesFecha.getTime() - lunesInicio.getTime();
  const diffSemanas = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));

  // Retornar número de semana (empezando desde 1)
  return diffSemanas + 1;
}

/**
 * Determina si una fecha cae en semana par
 * @param fecha - Fecha a evaluar
 * @param calendarioInicio - Fecha de inicio del calendario
 * @returns true si la semana es par, false si es impar
 */
export function esSemanaPar(fecha: Date, calendarioInicio: Date): boolean {
  const numeroSemana = calcularNumeroSemanaDesdeInicio(fecha, calendarioInicio);
  return numeroSemana % 2 === 0;
}

/**
 * Determina si una fecha cae en semana impar
 * @param fecha - Fecha a evaluar
 * @param calendarioInicio - Fecha de inicio del calendario
 * @returns true si la semana es impar, false si es par
 */
export function esSemanaImpar(fecha: Date, calendarioInicio: Date): boolean {
  const numeroSemana = calcularNumeroSemanaDesdeInicio(fecha, calendarioInicio);
  return numeroSemana % 2 !== 0;
}
