import { useEffect } from 'react';
import { FilterValues } from '@/components/ClassFilter';
import { isEnglishGroup } from '@/utils/groupFormatUtils';

interface FilterOption {
    category: keyof FilterValues;
    options: string[];
    [key: string]: unknown;
}

/**
 * Gestiona la deselección automática de filtros hijos cuando cambia un filtro padre.
 * Jerarquía: curso → asignatura → tipoGrupo → grupos
 *            idioma → grupos
 *
 * Se debe llamar después del useMemo de filterOptions en cada página.
 */
export function useFilterCascade(
    filters: FilterValues,
    filterOptions: FilterOption[],
    setFilters: (v: FilterValues) => void
) {
    // Deselección en cascada cuando cambian las opciones disponibles
    // (filterOptions se recalcula cuando cambia curso, asignatura o tipoGrupo)
    useEffect(() => {
        if (filterOptions.length === 0) return;

        const getValidSet = (category: keyof FilterValues): Set<string> => {
            const opts = filterOptions.find(fo => fo.category === category)?.options ?? [];
            return new Set(opts);
        };

        let changed = false;
        let next = { ...filters };

        // curso → limpiar asignaturas que ya no están en las opciones disponibles
        const validAsignaturas = getValidSet('asignatura');
        const newAsignatura = filters.asignatura.filter(v => validAsignaturas.has(v));
        if (newAsignatura.length !== filters.asignatura.length) {
            next = { ...next, asignatura: newAsignatura };
            changed = true;
        }

        // asignatura → limpiar tipos de grupo que ya no están disponibles
        const validTipos = getValidSet('tipoGrupo');
        const newTipoGrupo = next.tipoGrupo.filter(v => validTipos.has(v));
        if (newTipoGrupo.length !== next.tipoGrupo.length) {
            next = { ...next, tipoGrupo: newTipoGrupo };
            changed = true;
        }

        // tipoGrupo → limpiar grupos que ya no están disponibles o no coinciden con idioma activo
        const validGrupos = getValidSet('grupos');
        const newGrupos = next.grupos.filter(groupId => {
            if (!validGrupos.has(groupId)) return false;
            if (next.idioma.length > 0) {
                const isEng = isEnglishGroup(groupId);
                return next.idioma.some(lang => lang === 'EN' ? isEng : !isEng);
            }
            return true;
        });
        if (newGrupos.length !== next.grupos.length) {
            next = { ...next, grupos: newGrupos };
            changed = true;
        }

        // limpiar aulas que ya no están disponibles
        const validAulas = getValidSet('aula');
        const newAula = next.aula.filter(v => validAulas.has(v));
        if (newAula.length !== next.aula.length) {
            next = { ...next, aula: newAula };
            changed = true;
        }

        // limpiar tipos de evento que ya no están disponibles
        const validTipoEvento = getValidSet('tipoEvento');
        const newTipoEvento = next.tipoEvento.filter(v => validTipoEvento.has(v));
        if (newTipoEvento.length !== next.tipoEvento.length) {
            next = { ...next, tipoEvento: newTipoEvento };
            changed = true;
        }

        if (changed) setFilters(next);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterOptions]);

    // Limpiar grupos cuyo idioma no coincide cuando cambia el filtro de idioma
    useEffect(() => {
        if (filters.idioma.length === 0 || filters.grupos.length === 0) return;
        const newGrupos = filters.grupos.filter(groupId => {
            const isEng = isEnglishGroup(groupId);
            return filters.idioma.some(lang => lang === 'EN' ? isEng : !isEng);
        });
        if (newGrupos.length !== filters.grupos.length) {
            setFilters({ ...filters, grupos: newGrupos });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.idioma]);
}
