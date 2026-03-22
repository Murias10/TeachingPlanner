import { FilterValues } from '@/components/ClassFilter';
import { CalendarEvent } from '@/types/CalendarEvent';
import { generateGroupId } from '@/utils/groupFormatUtils';

interface FilterOption {
    category: keyof FilterValues;
    options: string[];
    [key: string]: unknown;
}

/**
 * Devuelve los valores activos de una categoría de filtro:
 * los que están seleccionados Y existen en las opciones del calendario actual.
 * Si ninguno existe → devuelve [] (la categoría no filtra nada).
 *
 * Esto permite que valores persistidos de otro calendario no bloqueen la vista
 * cuando no tienen correspondencia en el calendario actual.
 */
/**
 * Filtra una lista de CalendarEvent aplicando los filtros activos,
 * con posibilidad de excluir categorías específicas (para uso en crossfilter).
 *
 * @param exclude - categorías a ignorar al filtrar (la categoría calcula sus propias opciones)
 * @param getYearLabel - función para convertir año numérico a etiqueta (depende de página/i18n)
 */
export function applyFilters(
    events: CalendarEvent[],
    filters: FilterValues,
    subjectYearMap: Map<string, number>,
    getYearLabel: (year: number) => string,
    exclude: (keyof FilterValues)[] = []
): CalendarEvent[] {
    const isBlocker = (event: CalendarEvent) => event.eventType === 'BLOCKER';

    return events.filter(event => {
        // tipoEvento: 'CANCELADO' es especial (mapea a event.cancelled)
        if (!exclude.includes('tipoEvento') && filters.tipoEvento.length > 0) {
            const cancelled = event.cancelled;
            const matchesCancelado = cancelled && filters.tipoEvento.includes('CANCELADO');
            const matchesType = !cancelled && filters.tipoEvento.includes(event.eventType);
            if (!matchesCancelado && !matchesType) return false;
        }
        // curso — los eventos BLOCKER no tienen asignatura, se excluyen del filtro de curso
        if (!exclude.includes('curso') && filters.curso.length > 0) {
            if (!isBlocker(event)) {
                const year = subjectYearMap.get(event.subject?.acronym || '');
                if (year === undefined) return false;
                if (!filters.curso.includes(getYearLabel(year))) return false;
            }
        }
        // asignatura — los eventos BLOCKER no tienen asignatura, se excluyen del filtro
        if (!exclude.includes('asignatura') && filters.asignatura.length > 0) {
            if (!isBlocker(event)) {
                if (!event.subject?.acronym || !filters.asignatura.includes(event.subject.acronym)) return false;
            }
        }
        // tipoGrupo — los eventos BLOCKER no tienen grupos, se excluyen del filtro
        if (!exclude.includes('tipoGrupo') && filters.tipoGrupo.length > 0) {
            if (!isBlocker(event)) {
                if (!event.groups.some(g => filters.tipoGrupo.includes(g.type))) return false;
            }
        }
        // grupos — los eventos BLOCKER no tienen grupos, se excluyen del filtro
        if (!exclude.includes('grupos') && filters.grupos.length > 0) {
            if (!isBlocker(event)) {
                const hasMatch = event.groups.some(g => {
                    if (!event.subject?.acronym) return false;
                    const id = generateGroupId(event.subject.acronym, g.number, g.type, g.language === 'EN');
                    return filters.grupos.includes(id);
                });
                if (!hasMatch) return false;
            }
        }
        // aula
        if (!exclude.includes('aula') && filters.aula.length > 0) {
            if (!event.classrooms.some(c => filters.aula.includes(c.code))) return false;
        }
        // idioma — los eventos BLOCKER no tienen grupos/idioma, se excluyen del filtro
        if (!exclude.includes('idioma') && filters.idioma.length > 0) {
            if (!isBlocker(event)) {
                if (!event.groups.some(g => filters.idioma.includes(g.language))) return false;
            }
        }
        return true;
    });
}

export const getActiveValues = (
    category: keyof FilterValues,
    filters: FilterValues,
    filterOptions: FilterOption[]
): string[] => {
    const selected = filters[category];
    if (selected.length === 0) return [];
    const validOptions = filterOptions.find(fo => fo.category === category)?.options ?? [];
    const validSet = new Set(validOptions);
    return selected.filter(v => validSet.has(v));
};
