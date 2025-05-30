import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const titlesMap: Record<string, string> = {
    '/': 'Planificador Docente | Home',
    '/about': 'Planificador Docente | About',
    '/page': 'Planificador Docente | Page',
};

export const TitleUpdater = () => {
    const location = useLocation();

    useEffect(() => {
        document.title = titlesMap[location.pathname] || 'Mi App';
    }, [location]);

    return null;
};
