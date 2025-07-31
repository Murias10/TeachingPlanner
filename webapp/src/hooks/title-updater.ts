import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const titlesMap: Record<string, string> = {
    '/': 'Planificador',
    '/home': 'Planificador | Inicio',
    '/subjects': 'Planificador | Asignaturas',
    '/classrooms': 'Planificador | Aulas',
    '/settings': 'Planificador | Configuración',
    '/courses': 'Planificador | Cursos',
    '/logs': 'Planificador | Registros',
    '/users': 'Planificador | Usuarios',
    '/reports': 'Planificador | Informes',
};

export const TitleUpdater = () => {
    const location = useLocation();

    useEffect(() => {
        document.title = titlesMap[location.pathname] || 'Planificador';
    }, [location]);

    return null;
};
