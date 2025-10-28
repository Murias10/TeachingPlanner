import { useMemo } from "react";
import { useCoursesByDegreeAcronym } from "@/hooks/course/useCoursesByDegreeAcronym";
import { useEventsCalendar } from "@/hooks/calendar/useEventsCalendar";

/**
 * Hook personalizado para obtener un calendario específico basado en los parámetros del curso
 *
 * @param acronym - Acrónimo del grado (ej: "GIT", "CCH")
 * @param startYear - Año de inicio del curso (ej: "2024")
 * @param endYear - Año de fin del curso (ej: "2025")
 * @param semester - Número del semestre (ej: "1" o "2")
 * @returns Objeto con los datos del calendario, estado de carga, error y el calendarId
 */
export function useCalendarByCourseAndSemester(
    acronym: string | null,
    startYear: string | null,
    endYear: string | null,
    semester: string | null
) {
    // Paso 1: Obtener todos los cursos del grado por acrónimo
    const { data: courses = [], isLoading: isLoadingCourses, error: coursesError } = useCoursesByDegreeAcronym(acronym);

    // Paso 2: Encontrar el curso específico que coincida con startYear y endYear
    const course = useMemo(() => {
        if (!courses.length || !startYear || !endYear) return null;

        return courses.find(c =>
            c.startYear.toString() === startYear &&
            c.endYear.toString() === endYear
        );
    }, [courses, startYear, endYear]);

    // Paso 3: Encontrar el calendario dentro del curso que coincida con el semestre
    const calendarId = useMemo(() => {
        if (!course || !semester) return null;

        const semesterNum = parseInt(semester, 10);
        const calendar = course.calendars?.find(cal => cal.semester === semesterNum);

        return calendar?.id || null;
    }, [course, semester]);

    // Paso 4: Obtener los eventos del calendario
    const { data, isLoading: isLoadingEvents, error: eventsError } = useEventsCalendar(calendarId);

    // Combinar estados de carga y errores
    const isLoading = isLoadingCourses || isLoadingEvents;
    const error = coursesError || eventsError;

    return {
        data,
        isLoading,
        error,
        calendarId,
        course
    };
}
