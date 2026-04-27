import type { TFunction } from 'i18next';
import type { ConflictEntry } from '@/types/conflict.types';

export interface ConflictI18nKeys {
    both: string;
    group: string;
    classroom: string;
}

/**
 * Construye el mensaje de error de conflicto a partir del primer conflicto detectado.
 * Retorna undefined si first es undefined (sin conflicto conocido).
 *
 * startTime/endTime del conflicto se incluyen siempre en la interpolación.
 * Si el caller necesita sobreescribirlos (e.g. con tiempos del formulario),
 * los pasa en `vars` y tendrán prioridad por el spread.
 */
export function buildConflictDescription(
    first: ConflictEntry | undefined,
    keys: ConflictI18nKeys,
    vars: Record<string, string>,
    t: TFunction
): string | undefined {
    if (!first) return undefined;

    const groupNames = first.groupNames.join(', ');
    const classroomNames = first.classroomNames.join(', ');
    const startTime = first.startTime?.substring(0, 5) ?? '';
    const endTime = first.endTime?.substring(0, 5) ?? '';

    const interpolation = {
        startTime,
        endTime,
        groupNames,
        classroomNames,
        names: groupNames || classroomNames,
        ...vars,
    };

    if (groupNames && classroomNames) return t(keys.both, interpolation);
    if (groupNames) return t(keys.group, interpolation);
    return t(keys.classroom, interpolation);
}
