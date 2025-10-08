// // hooks/useClassFilters.ts
// import { useMemo, useState } from 'react';
// import { FilterValues } from '@/components/ClassFilter';
// import { BookOpen, GraduationCap, Building2, Globe } from 'lucide-react';
// import { Subject } from '@/types/Subject';

// export function useClassFilters(subjects: Subject[]) {
//     const [filters, setFilters] = useState<FilterValues>({
//         tipoGrupo: [],
//         asignatura: [],
//         aula: [],
//         idioma: []
//     });

//     // Extraer opciones únicas de los datos
//     const filterOptions = useMemo(() => {
//         const asignaturas = [...new Set(subjects.map(s => s.nombre))].sort();
//         const aulas = [...new Set(subjects.map(s => s.aula))].sort();
//         const idiomas = [...new Set(subjects.map(s => s.idioma))].sort();
//         const tiposGrupo = [...new Set(subjects.map(s => s.tipo))].sort();

//         return [
//             {
//                 category: 'tipoGrupo' as const,
//                 label: 'Tipo de Grupo',
//                 options: tiposGrupo,
//                 icon: BookOpen
//             },
//             {
//                 category: 'asignatura' as const,
//                 label: 'Asignatura',
//                 options: asignaturas,
//                 icon: GraduationCap
//             },
//             {
//                 category: 'aula' as const,
//                 label: 'Aula',
//                 options: aulas,
//                 icon: Building2
//             },
//             {
//                 category: 'idioma' as const,
//                 label: 'Idioma',
//                 options: idiomas,
//                 icon: Globe
//             }
//         ];
//     }, [subjects]);

//     // Aplicar filtros
//     const filteredSubjects = useMemo(() => {
//         return subjects.filter(subject => {
//             if (filters.tipoGrupo.length > 0 && !filters.tipoGrupo.includes(subject.tipo)) return false;
//             if (filters.asignatura.length > 0 && !filters.asignatura.includes(subject.nombre)) return false;
//             if (filters.aula.length > 0 && !filters.aula.includes(subject.aula)) return false;
//             if (filters.idioma.length > 0 && !filters.idioma.includes(subject.idioma)) return false;
//             return true;
//         });
//     }, [subjects, filters]);

//     return {
//         filters,
//         setFilters,
//         filterOptions,
//         filteredSubjects
//     };
// }