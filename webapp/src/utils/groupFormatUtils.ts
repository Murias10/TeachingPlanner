/**
 * Utilidades para manejo de formatos de grupos
 * Convierte entre formatos internos y de visualización
 */

interface GroupFormatParts {
  acronym: string;
  number: number;
  type: string;
  isEnglish: boolean;
}

/**
 * Genera el ID interno de un grupo
 * Español: "XXX-G#-TYPE"
 * Inglés: "XXX-G#-I-TYPE"
 */
export const generateGroupId = (
  acronym: string,
  number: number,
  type: string,
  isEnglish: boolean
): string => {
  const langSuffix = isEnglish ? '-I' : '';
  return `${acronym}-G${number}${langSuffix}-${type}`;
};

/**
 * Parsea un ID de grupo y retorna sus componentes
 */
export const parseGroupId = (groupId: string): GroupFormatParts => {
  const parts = groupId.split('-');
  const acronym = parts[0];
  const numberStr = parts[1].replace('G', '');
  const number = parseInt(numberStr, 10);

  // Detectar si es inglés por cantidad de partes
  const isEnglish = parts.length === 4;
  const type = isEnglish ? parts[3] : parts[2];

  return { acronym, number, type, isEnglish };
};

/**
 * Convierte un ID de grupo al formato de visualización
 * "XXX-G#-TYPE" → "XXX.TYPE.#"
 * "XXX-G#-I-TYPE" → "XXX.TYPE.I-#"
 */
export const formatGroupForDisplay = (groupId: string): string => {
  const parts = groupId.split('-');

  if (parts.length === 4) {
    // Formato con idioma: "XXX-G#-I-TYPE"
    const [subject, groupNum] = [parts[0], parts[1]];
    const type = parts[3];
    const groupNumber = groupNum.replace('G', '');
    return `${subject}.${type}.I-${groupNumber}`;
  } else if (parts.length === 3) {
    // Formato sin idioma: "XXX-G#-TYPE"
    const [subject, groupNum, type] = parts;
    const groupNumber = groupNum.replace('G', '');
    return `${subject}.${type}.${groupNumber}`;
  }

  return groupId; // Fallback
};

/**
 * Extrae el acrónimo de la asignatura de un ID de grupo
 */
export const getGroupAcronym = (groupId: string): string => {
  return groupId.split('-')[0];
};
