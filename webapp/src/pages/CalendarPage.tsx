import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext";
import { useEffect, useMemo, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useEventsCalendar } from "@/hooks/calendar/useEventsCalendar";
import { CalendarEvent } from "@/types/CalendarEvent";
import ClassFilter, { FilterValues } from "@/components/ClassFilter";
import { BookOpen, DoorOpen, Languages, Users } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useParams } from "react-router-dom";

const localizer = momentLocalizer(moment);

interface MyEvent {
    title: string;
    start: Date;
    end: Date;
    resource?: CalendarEvent;
}

export default function CalendarPage() {

    // Extraer el acrónimo de la URL
    const { acronym, startYear, endYear, semester } = useParams<{ acronym: string, startYear: string, endYear: string, semester: string }>()

    const { setItems } = useBreadcrumbContext();

    console.log('Params:', { acronym, startYear, endYear, semester });

    const calendarId = '2938afeb-dce6-4c03-9451-b099c6347c9e';

    const { data, isLoading } = useEventsCalendar(calendarId);

    // Estado de filtros
    const [filters, setFilters] = useState<FilterValues>({
        tipoGrupo: [],
        asignatura: [],
        aula: [],
        idioma: []
    });

    // Estado para colapsar/expandir filtros
    const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);

    useEffect(() => {
        setItems([
            { label: "Inicio", href: "/home" },
            { label: "Títulos", href: "/degrees" },
            { label: "Cursos", href: `/degrees/${acronym}/courses` },
            { label: "Calendario", href: "" },
        ]);
    }, [setItems]);

    // Extraer opciones únicas de los eventos
    const filterOptions = useMemo(() => {
        if (!data?.events) return [];

        const uniqueTypes = new Set<string>();
        const uniqueSubjects = new Set<string>();
        const uniqueClassrooms = new Set<string>();
        const uniqueLanguages = new Set<string>();

        data.events.forEach(event => {
            event.groups.forEach(group => {
                uniqueTypes.add(group.type);
                uniqueLanguages.add(group.language);
            });

            if (event.subject?.acronym) {
                uniqueSubjects.add(event.subject.acronym);
            }

            event.classrooms.forEach(classroom => {
                uniqueClassrooms.add(classroom.code);
            });
        });

        return [
            {
                category: 'tipoGrupo' as const,
                label: 'Tipo de Grupo',
                options: Array.from(uniqueTypes).sort(),
                icon: Users
            },
            {
                category: 'asignatura' as const,
                label: 'Asignatura',
                options: Array.from(uniqueSubjects).sort(),
                icon: BookOpen
            },
            {
                category: 'aula' as const,
                label: 'Aula',
                options: Array.from(uniqueClassrooms).sort(),
                icon: DoorOpen
            },
            {
                category: 'idioma' as const,
                label: 'Idioma',
                options: Array.from(uniqueLanguages).sort(),
                icon: Languages
            }
        ];
    }, [data?.events]);

    // Filtrar eventos según los filtros activos
    const filteredEvents = useMemo(() => {
        if (!data?.events) return [];

        return data.events.filter(event => {
            const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);
            if (!hasActiveFilters) return true;

            if (filters.tipoGrupo.length > 0) {
                const hasMatchingType = event.groups.some(group =>
                    filters.tipoGrupo.includes(group.type)
                );
                if (!hasMatchingType) return false;
            }

            if (filters.asignatura.length > 0) {
                if (!event.subject?.acronym || !filters.asignatura.includes(event.subject.acronym)) {
                    return false;
                }
            }

            if (filters.aula.length > 0) {
                const hasMatchingClassroom = event.classrooms.some(classroom =>
                    filters.aula.includes(classroom.code)
                );
                if (!hasMatchingClassroom) return false;
            }

            if (filters.idioma.length > 0) {
                const hasMatchingLanguage = event.groups.some(group =>
                    filters.idioma.includes(group.language)
                );
                if (!hasMatchingLanguage) return false;
            }

            return true;
        });
    }, [data?.events, filters]);

    // Transformar eventos filtrados al formato de react-big-calendar
    const events: MyEvent[] = useMemo(() => {
        return filteredEvents.map((event) => {
            const eventDate = moment(event.date).format('YYYY-MM-DD');

            return {
                title: `${event.subject?.acronym || 'Sin asignatura'} - ${event.groups.map(g => `${g.type}${g.number}`).join(', ')}`,
                start: moment(`${eventDate}T${event.startTime}`).toDate(),
                end: moment(`${eventDate}T${event.endTime}`).toDate(),
                resource: event
            };
        });
    }, [filteredEvents]);

    const minDate = data?.startDate
        ? moment(data.startDate).hour(8).minute(0).toDate()
        : moment().hour(8).minute(0).toDate();

    const maxDate = data?.endDate
        ? moment(data.endDate).hour(21).minute(0).toDate()
        : moment().hour(21).minute(0).toDate();

    if (isLoading) {
        return (
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2 p-10">
                <div className="flex items-center justify-center h-full">
                    <LoadingSpinner />
                </div>
            </section>
        );
    }

    if (!data || !data.events.length) {
        return (
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2 p-10">
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No hay eventos para mostrar</p>
                </div>
            </section>
        );
    }

    return (
        <section className="h-full rounded-xl bg-muted/50 m-2 overflow-hidden flex">
            {/* Panel de filtros */}
            <ClassFilter
                filters={filters}
                onFiltersChange={setFilters}
                filterOptions={filterOptions}
                isCollapsed={isFiltersCollapsed}
                onToggleCollapse={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
            />

            {/* Calendario */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header con contador de eventos */}
                {/* <div className="p-4 border-b bg-white flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-semibold">
                                Calendario - Semestre {data.semester}
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Mostrando {events.length} de {data.totalEvents} eventos
                            </p>
                        </div>
                        <div className="text-sm text-gray-600">
                            {moment(data.startDate).format('DD/MM/YYYY')} - {moment(data.endDate).format('DD/MM/YYYY')}
                        </div>
                    </div>
                </div> */}

                {/* Calendario */}
                <div className="flex-1 p-4 overflow-hidden">
                    {events.length > 0 ? (
                        <Calendar
                            defaultView="week"
                            localizer={localizer}
                            events={events}
                            max={maxDate}
                            min={minDate}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: '100%', width: '100%' }}
                            eventPropGetter={(event) => {
                                const calendarEvent = event.resource as CalendarEvent;

                                return {
                                    style: {
                                        backgroundColor: calendarEvent?.cancelled ? '#ef4444' : '#3b82f6',
                                        opacity: calendarEvent?.cancelled ? 0.6 : 1,
                                    }
                                };
                            }}
                            messages={{
                                week: 'Semana',
                                work_week: 'Semana laboral',
                                day: 'Día',
                                month: 'Mes',
                                previous: 'Anterior',
                                next: 'Siguiente',
                                today: 'Hoy',
                                agenda: 'Agenda',
                                date: 'Fecha',
                                time: 'Hora',
                                event: 'Evento',
                                noEventsInRange: 'No hay eventos en este rango',
                                showMore: (total) => `+ Ver más (${total})`
                            }}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <p className="text-gray-500 mb-2">No hay eventos que coincidan con los filtros seleccionados</p>
                                <p className="text-sm text-gray-400">Intenta ajustar los filtros</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}