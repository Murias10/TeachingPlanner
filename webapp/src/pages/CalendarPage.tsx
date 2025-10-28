import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext";
import { useEffect, useMemo, useState } from "react";
import { Calendar, momentLocalizer, Components } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useCalendarByCourseAndSemester } from "@/hooks/calendar/useCalendarByCourseAndSemester";
import { CalendarEvent } from "@/types/CalendarEvent";
import ClassFilter, { FilterValues } from "@/components/ClassFilter";
import { BookOpen, DoorOpen, Languages, Users } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CalendarToolbar from "@/components/calendar/CalendarToolbar";
import CreateEventDialog from "@/components/calendar/CreateEventDialog";
import type { RecurrenceConfig } from "@/types/RecurrenceConfig";
import { ProtectedComponent } from "@/components/ProtectedComponent";
import { CalendarEventWrapper } from "@/components/calendar/CalendarEventWrapper";
import VITE_GATEWAY_API_URL from "@/config/api";

// Configurar moment para usar español y que la semana empiece en lunes
moment.locale('es', {
    week: {
        dow: 1, // Lunes es el primer día de la semana (0 = domingo, 1 = lunes)
        doy: 4  // Usada para calcular la primera semana del año
    }
});

const localizer = momentLocalizer(moment);

interface MyEvent {
    title: string;
    start: Date;
    end: Date;
    resource?: CalendarEvent;
}

// Colores pastel suaves y únicos para asignaturas (con buen contraste para texto blanco)
const SUBJECT_COLORS = [
    '#FFB3BA', // Pastel red
    '#FFCAB0', // Pastel coral
    '#FFDAB9', // Pastel peach
    '#B4F0E0', // Pastel mint
    '#D8BFD8', // Pastel thistle
    '#DDA0DD', // Pastel plum
    '#FFB6C1', // Pastel light pink
    '#FFC0CB', // Pastel pink
    '#F08080', // Pastel light coral
    '#E6E6FA', // Pastel lavender
    '#E1D5E7', // Pastel light purple
    '#FFD4A3', // Pastel orange
    '#C9E4CA', // Pastel sage green
    '#A8D5BA', // Pastel green
    '#FFD6E8', // Pastel rose
    '#C8D4E6', // Pastel slate blue
    '#E8C8E8', // Pastel mauve
    '#FFE0D4', // Pastel apricot
    '#D4E8FF', // Pastel periwinkle
    '#E8D4C8', // Pastel tan
];

// Map para almacenar asignaturas vistas y sus colores asignados
const subjectColorMap = new Map<string, string>();

// Función para generar un color único y consistente basado en la asignatura
const getSubjectColor = (subjectAcronym: string | undefined): string => {
    if (!subjectAcronym) return '#9CA3AF'; // Color gris por defecto

    // Si ya hemos asignado un color a esta asignatura, devolverlo
    if (subjectColorMap.has(subjectAcronym)) {
        return subjectColorMap.get(subjectAcronym)!;
    }

    // Asignar el siguiente color disponible
    const colorIndex = subjectColorMap.size % SUBJECT_COLORS.length;
    const assignedColor = SUBJECT_COLORS[colorIndex];
    subjectColorMap.set(subjectAcronym, assignedColor);

    return assignedColor;
};

export default function CalendarPage() {

    const { t } = useTranslation()

    // Extraer el acrónimo de la URL
    const { acronym, startYear, endYear, semester } = useParams<{ acronym: string, startYear: string, endYear: string, semester: string }>()

    const { setItems } = useBreadcrumbContext();

    console.log('Params:', { acronym, startYear, endYear, semester });

    const { data, isLoading, calendarId } = useCalendarByCourseAndSemester(
        acronym || null,
        startYear || null,
        endYear || null,
        semester || null
    );

    // Estado de filtros
    const [filters, setFilters] = useState<FilterValues>({
        tipoGrupo: [],
        asignatura: [],
        aula: [],
        idioma: []
    });

    // Estado para colapsar/expandir filtros
    const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);

    // Estado para el diálogo de crear evento
    const [isCreateEventDialogOpen, setIsCreateEventDialogOpen] = useState(false);
    const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);

    useEffect(() => {
        setItems([
            { label: t("breadcrumb.home"), href: "/home" },
            { label: t("breadcrumb.degrees"), href: "/degrees" },
            { label: t("breadcrumb.courses"), href: `/degrees/${acronym}/courses` },
            { label: t("breadcrumb.calendar"), href: "" },
        ]);
    }, [setItems, acronym, t]);

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
            const startMoment = moment(`${eventDate}T${event.startTime}`);

            // Calcular el end basándose en la duración real del evento (en horas)
            const endMoment = startMoment.clone().add(event.duration, 'hours');

            return {
                title: `${event.subject?.acronym || 'Sin asignatura'}.${event.groups.map(g => {
                    const lang = g.language === 'EN' ? 'I-' : '';
                    return `${g.type}.${lang}${g.number}`;
                }).join(', ')}`,
                start: startMoment.toDate(),
                end: endMoment.toDate(),
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

    const handleExportCalendar = async () => {
        if (!calendarId) {
            console.error('No calendar ID available for export');
            return;
        }

        try {
            console.log('Exporting calendar:', calendarId);

            // Llamar al endpoint de exportación
            const response = await fetch(`${VITE_GATEWAY_API_URL}/calendar/${calendarId}/export`);

            if (!response.ok) {
                throw new Error(`Error exporting calendar: ${response.status}`);
            }

            // Obtener el blob del ZIP
            const blob = await response.blob();

            // Crear URL del blob
            const url = window.URL.createObjectURL(blob);

            // Crear elemento <a> temporal para descargar
            const link = document.createElement('a');
            link.href = url;

            // Obtener el nombre del archivo desde el header Content-Disposition
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `${acronym} ${startYear}-${endYear} s${semester}.zip`;

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }

            link.download = filename;

            // Agregar al DOM, hacer clic y remover
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Liberar el URL del blob
            window.URL.revokeObjectURL(url);

            console.log('Calendar exported successfully');
        } catch (error) {
            console.error('Error exporting calendar:', error);
            // TODO: Mostrar mensaje de error al usuario
        }
    };

    const handleCreateEvent = () => {
        setIsCreateEventDialogOpen(true);
    };

    const handleDeleteEvents = () => {
        console.log('Deleting events:', selectedEventIds);
        // TODO: Implement delete functionality
        setSelectedEventIds([]);
    };

    const handleSaveEvent = (config: RecurrenceConfig) => {
        console.log('Creating event with config:', config);
        // TODO: Implement event creation logic
    };

    const handleEditEvent = (event: CalendarEvent) => {
        console.log('Editing event:', event);
        // TODO: Implement event editing logic
    };

    const handleDeleteEvent = (event: CalendarEvent) => {
        console.log('Deleting event:', event);
        // TODO: Implement event deletion logic
    };

    const handleDuplicateEvent = (event: CalendarEvent) => {
        console.log('Duplicating event:', event);
        // TODO: Implement event duplication logic
    };

    const handleViewEventDetails = (event: CalendarEvent) => {
        console.log('Viewing event details:', event);
        // TODO: Implement event details view
    };

    const handleToggleCancellation = (event: CalendarEvent) => {
        console.log('Toggling cancellation for event:', event);
        // TODO: Implement toggle cancellation logic
    };

    // Custom event component with context menu
    const EventComponent = ({ event }: { event: MyEvent }) => (
        <CalendarEventWrapper
            event={event}
            onEdit={handleEditEvent}
            onDelete={handleDeleteEvent}
            onDuplicate={handleDuplicateEvent}
            onViewDetails={handleViewEventDetails}
            onToggleCancellation={handleToggleCancellation}
        />
    );

    const calendarComponents: Components<MyEvent> = {
        event: EventComponent,
    };

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
                    <p className="text-muted-foreground">No hay eventos para mostrar</p>
                </div>
            </section>
        );
    }

    return (
        <>
            <section className="h-full bg-muted/50 overflow-hidden flex flex-col">
                {/* Toolbar */}
                <ProtectedComponent requiredRoles={["ADMIN"]} hideIfNoAccess={true}>
                    <div className="px-4 py-3 border-b bg-card">
                        <CalendarToolbar
                            onExport={handleExportCalendar}
                            onCreateEvent={handleCreateEvent}
                            onDeleteEvents={handleDeleteEvents}
                            selectedCount={selectedEventIds.length}
                        />
                    </div>
                </ProtectedComponent>

                {/* Main content */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Panel de filtros */}
                    <ClassFilter
                        filters={filters}
                        onFiltersChange={setFilters}
                        filterOptions={filterOptions}
                        isCollapsed={isFiltersCollapsed}
                        onToggleCollapse={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
                    />

                    {/* Calendario */}
                    <div className="flex-1 flex flex-col min-w-0 m-2 bg-card rounded-2xl shadow-lg border">
                        {/* Header con contador de eventos */}
                        <div className="flex items-center justify-between px-8 py-4 border-b">
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">
                                    Calendario - Semestre {data.semester}
                                </h1>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Mostrando {events.length} de {data.totalEvents} eventos
                                </p>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {moment(data.startDate).format('DD/MM/YYYY')} - {moment(data.endDate).format('DD/MM/YYYY')}
                            </div>
                        </div>

                        {/* Calendario */}
                        <div className="flex-1 p-4 overflow-hidden bg-white rounded-b-2xl">
                    {events.length > 0 ? (
                        <Calendar
                            defaultView="work_week"
                            views={['week', 'work_week', 'day', 'month']}
                            localizer={localizer}
                            events={events}
                            max={maxDate}
                            min={minDate}
                            startAccessor="start"
                            endAccessor="end"
                            culture="es"
                            style={{ height: '100%', width: '100%' }}
                            components={calendarComponents}
                            eventPropGetter={(event) => {
                                const calendarEvent = event.resource as CalendarEvent;

                                // Obtener el color basado en la asignatura
                                const backgroundColor = calendarEvent?.cancelled
                                    ? '#ef4444'
                                    : getSubjectColor(calendarEvent?.subject?.acronym);

                                return {
                                    style: {
                                        backgroundColor: backgroundColor,
                                        opacity: calendarEvent?.cancelled ? 0.6 : 1,
                                        border: '1px solid white',
                                        borderRadius: '10px',
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
                                <p className="text-muted-foreground mb-2">No hay eventos que coincidan con los filtros seleccionados</p>
                                <p className="text-sm text-muted-foreground/70">Intenta ajustar los filtros</p>
                            </div>
                        </div>
                    )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Create Event Dialog */}
            <CreateEventDialog
                open={isCreateEventDialogOpen}
                onOpenChange={setIsCreateEventDialogOpen}
                onSave={handleSaveEvent}
            />
        </>
    );
}