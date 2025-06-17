import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const titlesMap: Record<string, string> = {
    '/': 'Planificador',
    '/about': 'Planificador | About',
    '/home': 'Planificador | Home',
    '/calendars': 'Planificador | Calendars',
};

export const TitleUpdater = () => {
    const location = useLocation();

    useEffect(() => {
        document.title = titlesMap[location.pathname] || 'Planificador';
    }, [location]);

    return null;
};
