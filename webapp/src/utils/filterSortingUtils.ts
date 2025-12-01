/**
 * Utilidades para ordenamiento de filtros
 * Maneja la lógica de ordenamiento alfabético y por grupos
 */

import { GROUP_TYPE_ORDER } from '@/constants/groupTypes';

/**
 * Ordena un array de strings alfabéticamente respetando la localización española
 */
export const sortAlphabetically = (arr: string[]): string[] =>
  arr.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

/**
 * Ordena grupos por: acrónimo → tipo → idioma → número
 * Formato esperado:
 * - Sin idioma: "XXX-G#-TYPE" (español)
 * - Con idioma: "XXX-G#-I-TYPE" (inglés)
 */
export const sortGruposByAcronymTypeNumber = (arr: string[]): string[] => {
  return arr.sort((a, b) => {
    const partsA = a.split('-');
    const partsB = b.split('-');

    const acronymA = partsA[0];
    const acronymB = partsB[0];

    // Extraer número removiendo "G"
    const numberStrA = partsA[1].replace('G', '');
    const numberStrB = partsB[1].replace('G', '');
    const numberA = parseInt(numberStrA, 10);
    const numberB = parseInt(numberStrB, 10);

    // Detectar si es inglés (presencia de "-I" entre número y tipo)
    const isEnglishA = partsA.length === 4;
    const isEnglishB = partsB.length === 4;
    const typeA = isEnglishA ? partsA[3] : partsA[2];
    const typeB = isEnglishB ? partsB[3] : partsB[2];

    // 1. Ordenar por acrónimo
    const acronymComparison = acronymA.localeCompare(acronymB, 'es', { sensitivity: 'base' });
    if (acronymComparison !== 0) {
      return acronymComparison;
    }

    // 2. Ordenar por tipo
    const typeOrderA = GROUP_TYPE_ORDER[typeA as keyof typeof GROUP_TYPE_ORDER] ?? 999;
    const typeOrderB = GROUP_TYPE_ORDER[typeB as keyof typeof GROUP_TYPE_ORDER] ?? 999;
    if (typeOrderA !== typeOrderB) {
      return typeOrderA - typeOrderB;
    }

    // 3. Ordenar por idioma (español antes que inglés)
    if (isEnglishA !== isEnglishB) {
      return isEnglishA ? 1 : -1;
    }

    // 4. Ordenar por número
    return numberA - numberB;
  });
};
