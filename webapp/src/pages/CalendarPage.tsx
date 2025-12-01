import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext";
import { useEffect, useMemo, useState } from "react";
import { Calendar, momentLocalizer, Components } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useCalendarByCourseAndSemester } from "@/hooks/calendar/useCalendarByCourseAndSemester";
import { CalendarEvent } from "@/types/CalendarEvent";
import ClassFilter, { FilterValues } from "@/components/ClassFilter";
import { BookOpen, DoorOpen, Languages, Users, FileText } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CalendarToolbar from "@/components/calendar/CalendarToolbar";
import CreateEventDialog from "@/components/calendar/CreateEventDialog";
import CreateSolicitudDialog from "@/components/calendar/CreateSolicitudDialog";
import type { RecurrenceConfig } from "@/types/RecurrenceConfig";
import { CalendarEventWrapper } from "@/components/calendar/CalendarEventWrapper";
import VITE_GATEWAY_API_URL from "@/config/api";
import { EventDetailsDrawer } from "@/components/calendar/EventDetailsDrawer";
import { DeleteEventConfirmationDialog } from "@/components/calendar/DeleteEventConfirmationDialog";
import { useCreatePuntualEvent } from "@/hooks/calendar/useCreatePuntualEvent";
import { useDeletePuntualEvent } from "@/hooks/calendar/useDeletePuntualEvent";
import { useFloatingAlert } from "@/hooks/useFloatingAlert";
import { useAuth } from "@/contexts/AuthContext";
import { useCrearSolicitud } from "@/hooks/event-request/useCrearSolicitud";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Bell } from "lucide-react";

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
    const navigate = useNavigate();
    const { triggerAlert } = useFloatingAlert();
    const { user } = useAuth();
    const { mutate: createPuntualEvent } = useCreatePuntualEvent();
    const { deletePuntualEvent, isDeleting: isDeletingEvent } = useDeletePuntualEvent();
    const crearSolicitud = useCrearSolicitud();
    const isAdmin = user?.role === 'ADMIN';

    // Extraer el acrónimo de la URL
    const { acronym, startYear, endYear, semester } = useParams<{ acronym: string, startYear: string, endYear: string, semester: string }>()

    const { setItems } = useBreadcrumbContext();

    const { data, isLoading, calendarId, course, refetch } = useCalendarByCourseAndSemester(
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
    const [dragStartDate, setDragStartDate] = useState<string | null>(null);
    const [dragStartTime, setDragStartTime] = useState<string | null>(null);
    const [dragEndTime, setDragEndTime] = useState<string | null>(null);

    // Estado para el drawer de detalles del evento
    const [isEventDetailsDrawerOpen, setIsEventDetailsDrawerOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>(undefined);

    // Estado para el diálogo de eliminación de evento
    const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<CalendarEvent | undefined>(undefined);

    // Estado para solicitud de eventos
    const [isSolicitudDrawerOpen, setIsSolicitudDrawerOpen] = useState(false);

    // Estado para controlar la fecha actual del calendario
    const [currentDate, setCurrentDate] = useState<Date>(new Date());

    // Función helper para limitar fecha dentro de los rangos del calendario
    const constrainDateToCalendar = (date: Date): Date => {
        if (!data?.startDate || !data?.endDate) return date;

        const start = moment(data.startDate);
        const end = moment(data.endDate);
        const target = moment(date);

        if (target.isBefore(start)) return start.toDate();
        if (target.isAfter(end)) return end.toDate();
        return date;
    };

    // Actualizar la fecha cuando se carguen los datos del calendario
    useEffect(() => {
        if (!data?.startDate || !data?.endDate) return;

        const today = moment();
        const start = moment(data.startDate);
        const end = moment(data.endDate);

        // Si hoy está dentro del rango, mostrar hoy; si no, el inicio
        const initialDate = today.isBetween(start, end, 'day', '[]')
            ? today.toDate()
            : start.toDate();

        setCurrentDate(initialDate);
    }, [data?.startDate, data?.endDate]);

    // Función para controlar la navegación del calendario
    const handleNavigate = (newDate: Date) => {
        setCurrentDate(constrainDateToCalendar(newDate));
    };

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

    // Rango de horas fijo: 9 AM a 9 PM
    const minHour = 9;
    const maxHour = 21;

    const minDate = data?.startDate
        ? moment(data.startDate).hour(minHour).minute(0).toDate()
        : moment().hour(minHour).minute(0).toDate();

    const maxDate = data?.endDate
        ? moment(data.endDate).hour(maxHour).minute(0).toDate()
        : moment().hour(maxHour).minute(0).toDate();

    const handleExportCalendar = async () => {
        if (!calendarId) {
            console.error('No calendar ID available for export');
            return;
        }

        try {
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


        } catch (error) {
            console.error('Error exporting calendar:', error);
            // TODO: Mostrar mensaje de error al usuario
        }
    };

    const handleCreateEvent = () => {
        setDragStartDate(null);
        setDragStartTime(null);
        setDragEndTime(null);
        setIsCreateEventDialogOpen(true);
    };

    const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
        // Permitir drag and drop a ADMIN (para crear eventos) y a TEACHER (para crear solicitudes)
        if (!isAdmin && user?.role !== 'TEACHER') {
            return;
        }

        // Convertir la fecha seleccionada a formato YYYY-MM-DD
        const selectedDate = moment(slotInfo.start).format('YYYY-MM-DD');
        const startTime = moment(slotInfo.start).format('HH:mm');
        const endTime = moment(slotInfo.end).format('HH:mm');

        setDragStartDate(selectedDate);
        setDragStartTime(startTime);
        setDragEndTime(endTime);

        // Si es ADMIN, abrir el diálogo de crear evento
        // Si es TEACHER, abrir el diálogo de crear solicitud
        if (isAdmin) {
            setIsCreateEventDialogOpen(true);
        } else if (user?.role === 'TEACHER') {
            setIsSolicitudDrawerOpen(true);
        }
    };

    const handleDeleteEvents = () => {
        // TODO: Implement delete functionality
        setSelectedEventIds([]);
    };

    const handleSaveEvent = (config: RecurrenceConfig) => {
        // Only handle puntual events for now
        if (config.frequency !== 'no-repeat') {
            triggerAlert({
                title: 'No implementado',
                description: 'Por el momento solo se pueden crear eventos puntuales',
                variant: 'default'
            });
            return;
        }

        // Validar campos requeridos
        if (!config.eventDate || !config.subjectId) {
            triggerAlert({
                title: 'Error',
                description: 'Por favor selecciona una fecha y una asignatura',
                variant: 'destructive'
            });
            return;
        }

        // Validar que al menos un grupo esté seleccionado
        if (!config.groupIds || config.groupIds.length === 0) {
            triggerAlert({
                title: 'Error',
                description: 'Por favor selecciona al menos un grupo',
                variant: 'destructive'
            });
            return;
        }

        // Validar que al menos un aula esté seleccionada
        if (!config.classroomIds || config.classroomIds.length === 0) {
            triggerAlert({
                title: 'Error',
                description: 'Por favor selecciona al menos un aula',
                variant: 'destructive'
            });
            return;
        }

        if (!calendarId) {
            triggerAlert({
                title: 'Error',
                description: 'No se pudo obtener el ID del calendario',
                variant: 'destructive'
            });
            return;
        }

        // Crear el evento puntual
        createPuntualEvent(
            {
                calendarId,
                eventDate: config.eventDate,
                startTime: config.startTime,
                endTime: config.endTime,
                subjectId: config.subjectId,
                groupIds: config.groupIds,
                classroomIds: config.classroomIds || [],
                comment: config.comment
            },
            {
                onSuccess: () => {
                    triggerAlert({
                        title: t('alerts.puntualEvent.success.title'),
                        description: t('alerts.puntualEvent.success.description'),
                        variant: 'success'
                    });
                    setIsCreateEventDialogOpen(false);
                    refetch();
                },
                onError: (error: Error & { statusCode?: number }) => {
                    const statusCode = error.statusCode || 500;
                    const errorKey = statusCode === 400 || statusCode === 409 ? statusCode.toString() : 'default';

                    triggerAlert({
                        title: t(`alerts.puntualEvent.error.${errorKey}.title`),
                        description: t(`alerts.puntualEvent.error.${errorKey}.description`),
                        variant: 'destructive'
                    });
                }
            }
        );
    };

    const handleEditEvent = () => {
        // TODO: Implement event editing logic
    };

    const handleDeleteEvent = (event: CalendarEvent) => {
        // Solo permitir eliminar eventos puntuales
        if (event.type === 'periodic') {
            console.log('Periodic events deletion not yet implemented');
            return;
        }

        setEventToDelete(event);
        setIsDeleteConfirmationOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!eventToDelete || !eventToDelete.puntualEventId) return;

        const result = await deletePuntualEvent(eventToDelete.puntualEventId, refetch);

        if (result.success) {
            triggerAlert({
                title: 'Evento eliminado',
                description: 'El evento ha sido eliminado correctamente',
                variant: 'success'
            });
            setIsDeleteConfirmationOpen(false);
            setEventToDelete(undefined);
        } else {
            triggerAlert({
                title: 'Error al eliminar',
                description: result.message || 'No se pudo eliminar el evento',
                variant: 'destructive'
            });
        }
    };

    const handleDuplicateEvent = () => {
        // TODO: Implement event duplication logic
    };

    const handleViewEventDetails = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setIsEventDetailsDrawerOpen(true);
    };

    const handleToggleCancellation = () => {
        // TODO: Implement toggle cancellation logic
    };

    // Event request handler for creating a new request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSolicitud = async (calendarIdParam: string, _eventType: string, config: any) => {
        // Para eventos puntuales, mapear la configuración al formato esperado por el backend
        let eventData: any = {};

        if (config.frequency === 'no-repeat') {
            // Evento puntual - mapear los datos necesarios
            eventData = {
                eventDate: config.eventDate,
                startTime: config.startTime,
                endTime: config.endTime,
                subjectId: config.subjectId,
                groupIds: config.groupIds,
                classroomIds: config.classroomIds,
                comment: config.comment || '',
                cancelled: false
            };
        } else {
            // Evento recurrente - mapear los datos necesarios
            eventData = {
                startTime: config.startTime,
                endTime: config.endTime,
                subjectId: config.subjectId,
                groupIds: config.groupIds,
                classroomIds: config.classroomIds,
                frequency: config.frequency,
                interval: config.interval,
                weekDays: config.weekDays,
                endsType: config.endsType,
                endsOnDate: config.endsOnDate,
                endsAfterOccurrences: config.endsAfterOccurrences
            };
        }

        const result = await crearSolicitud(calendarIdParam, config.frequency === 'no-repeat' ? 'PUNTUAL' : 'PERIODIC', eventData);

        if (result.success) {
            triggerAlert({
                title: 'Solicitud enviada',
                description: 'Tu solicitud de evento ha sido enviada para aprobación',
                variant: 'success'
            });
            setIsSolicitudDrawerOpen(false);
            setDragStartDate(null);
            setDragStartTime(null);
            setDragEndTime(null);
        } else {
            triggerAlert({
                title: 'Error',
                description: result.message || 'Error al enviar la solicitud',
                variant: 'destructive'
            });
        }
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
                <div className="px-4 py-3 border-b bg-card flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        {isAdmin && (
                            <CalendarToolbar
                                onExport={handleExportCalendar}
                                onCreateEvent={handleCreateEvent}
                                onDeleteEvents={handleDeleteEvents}
                                selectedCount={selectedEventIds.length}
                            />
                        )}
                        {isAdmin && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => navigate(`/degrees/${acronym}/courses/${startYear}/${endYear}/semester/${semester}/calendar/solicitudes`)}
                                            className="h-9 gap-2"
                                        >
                                            <Bell className="w-4 h-4" />
                                            <span className="hidden sm:inline text-xs">Solicitudes</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Ver solicitudes de eventos pendientes</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                    <div className="flex-1" />
                    {user?.role === 'TEACHER' && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsSolicitudDrawerOpen(true)}
                                        className="h-9 gap-2"
                                    >
                                        <FileText className="w-4 h-4" />
                                        <span className="hidden sm:inline text-xs">Solicitar Evento</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Solicitar un nuevo evento</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>

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
                                    date={currentDate}
                                    onNavigate={handleNavigate}
                                    startAccessor="start"
                                    endAccessor="end"
                                    culture="es"
                                    style={{ height: '100%', width: '100%' }}
                                    components={calendarComponents}
                                    onSelectSlot={handleSelectSlot}
                                    selectable={isAdmin || user?.role === 'TEACHER'}
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
                onOpenChange={(open) => {
                    setIsCreateEventDialogOpen(open);
                    if (!open) {
                        setDragStartDate(null);
                        setDragStartTime(null);
                        setDragEndTime(null);
                    }
                }}
                onSave={handleSaveEvent}
                degreeId={course?.degree?.id}
                calendarEvents={data?.events}
                initialDate={dragStartDate}
                initialStartTime={dragStartTime}
                initialEndTime={dragEndTime}
            />

            {/* Event Details Drawer */}
            <EventDetailsDrawer
                open={isEventDetailsDrawerOpen}
                onOpenChange={setIsEventDetailsDrawerOpen}
                event={selectedEvent}
            />

            {/* Delete Event Confirmation Dialog */}
            <DeleteEventConfirmationDialog
                open={isDeleteConfirmationOpen}
                onOpenChange={setIsDeleteConfirmationOpen}
                onConfirm={handleConfirmDelete}
                isLoading={isDeletingEvent}
                subjectName={eventToDelete?.subject?.name || 'esta asignatura'}
            />

            {/* Event Request Dialog - Solo para TEACHER */}
            {!isAdmin && (
                <CreateSolicitudDialog
                    open={isSolicitudDrawerOpen}
                    onOpenChange={(open) => {
                        setIsSolicitudDrawerOpen(open);
                        if (!open) {
                            setDragStartDate(null);
                            setDragStartTime(null);
                            setDragEndTime(null);
                        }
                    }}
                    onSave={handleSolicitud}
                    degreeId={course?.degree?.id}
                    calendarId={calendarId || undefined}
                    calendarEvents={data?.events}
                    initialDate={dragStartDate}
                    initialStartTime={dragStartTime}
                    initialEndTime={dragEndTime}
                />
            )}
        </>
    );
}