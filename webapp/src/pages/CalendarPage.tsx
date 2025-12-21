import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext";
import { useEffect, useMemo, useState } from "react";
import { Calendar, momentLocalizer, Components } from "react-big-calendar";
import moment from "moment";
import { format } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useCalendarByCourseAndSemester } from "@/hooks/calendar/useCalendarByCourseAndSemester";
import { usePendingRequestsAsEvents } from "@/hooks/calendar/usePendingRequestsAsEvents";
import { useSubjectsWithEventsAndGroupsByCourseAndSemester } from "@/hooks/subject/useSubjectsWithEventsAndGroupsByCourseIdAndSemester";
import { CalendarEvent } from "@/types/CalendarEvent";
import ClassFilter, { FilterValues } from "@/components/ClassFilter";
import { FileText, BookOpen, DoorOpen, Languages, Users, GraduationCap } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CalendarToolbar from "@/components/calendar/CalendarToolbar";
import CreateEventDialog from "@/components/calendar/CreateEventDialog";
import EditEventDialog from "@/components/calendar/EditEventDialog";
import CreateSolicitudDialog from "@/components/calendar/CreateSolicitudDialog";
import type { RecurrenceConfig } from "@/types/RecurrenceConfig";
import { CalendarEventWrapper } from "@/components/calendar/CalendarEventWrapper";
import VITE_GATEWAY_API_URL from "@/config/api";
import { EventDetailsDrawer } from "@/components/calendar/EventDetailsDrawer";
import { DeleteEventConfirmationDialog } from "@/components/calendar/DeleteEventConfirmationDialog";
import { useCreatePuntualEvent } from "@/hooks/calendar/useCreatePuntualEvent";
import { useCreatePeriodicEvent } from "@/hooks/calendar/useCreatePeriodicEvent";
import { useUpdatePuntualEvent } from "@/hooks/calendar/useUpdatePuntualEvent";
import { useDeletePuntualEvent } from "@/hooks/calendar/useDeletePuntualEvent";
import { useFloatingAlertContext } from "@/contexts/useFloatingAlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCrearSolicitud } from "@/hooks/event-request/useCrearSolicitud";
import { useDeleteRequest } from "@/hooks/event-request/useDeleteRequest";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Bell } from "lucide-react";
import { generateGoogleCalendarCSV, downloadCSV } from "@/utils/csvExport";
import { generateGroupId } from "@/utils/groupFormatUtils";
import { sortAlphabetically, sortGruposByAcronymTypeNumber } from "@/utils/filterSortingUtils";

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

// Constantes
const ACADEMIC_YEAR_LABELS = {
    0: 'Optativas',
    1: '1º',
    2: '2º',
    3: '3º',
    4: '4º'
} as const;

// Helper: Mapear año numérico a etiqueta
const getYearLabel = (year: number): string => {
    return ACADEMIC_YEAR_LABELS[year as keyof typeof ACADEMIC_YEAR_LABELS] || `${year}º`;
};

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

// Función para oscurecer un color hex para mejorar el contraste
const darkenColor = (hex: string, amount: number = 0.6): string => {
    // Convertir hex a RGB
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    // Oscurecer multiplicando por el amount (0.6 = 60% del brillo original)
    const newR = Math.round(r * amount);
    const newG = Math.round(g * amount);
    const newB = Math.round(b * amount);

    // Convertir de vuelta a hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

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
    const { triggerAlert } = useFloatingAlertContext();
    const { user } = useAuth();
    const { mutate: createPuntualEvent } = useCreatePuntualEvent();
    const { mutate: createPeriodicEvent } = useCreatePeriodicEvent();
    const { mutate: updatePuntualEvent } = useUpdatePuntualEvent();
    const { deletePuntualEvent, isDeleting: isDeletingEvent } = useDeletePuntualEvent();
    const crearSolicitud = useCrearSolicitud();
    const deleteRequest = useDeleteRequest();
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

    // Obtener eventos de solicitudes pendientes
    const { data: pendingData, isLoading: isLoadingPending, refetch: refetchPendingRequests } = usePendingRequestsAsEvents(calendarId);

    // Obtener asignaturas para el mapping de años
    const { data: subjectsData } = useSubjectsWithEventsAndGroupsByCourseAndSemester(
        course?.id || null,
        semester ? parseInt(semester, 10) : null
    );

    // Crear mapping de acronym → year
    const subjectYearMap = useMemo(() => {
        const map = new Map<string, number>();
        subjectsData?.forEach(subject => {
            if (subject.acronym && subject.year !== undefined) {
                map.set(subject.acronym, subject.year);
            }
        });
        return map;
    }, [subjectsData]);

    // Combinar eventos normales con eventos pendientes
    const allEvents = useMemo(() => {
        const normalEvents = data?.events || [];
        const pendingEvents = pendingData?.events || [];
        return [...normalEvents, ...pendingEvents];
    }, [data?.events, pendingData?.events]);

    // Obtener fechas lectivas
    const lectiveDates = useMemo(() => {
        return new Set(data?.lectiveDates || []);
    }, [data?.lectiveDates]);

    // Estado de filtros
    const [filters, setFilters] = useState<FilterValues>({
        tipoGrupo: [],
        asignatura: [],
        grupos: [],
        aula: [],
        idioma: [],
        curso: []
    });

    // Estado para colapsar/expandir filtros
    const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);

    // Estado para el diálogo de crear evento
    const [isCreateEventDialogOpen, setIsCreateEventDialogOpen] = useState(false);
    const [dragStartDate, setDragStartDate] = useState<string | null>(null);
    const [dragStartTime, setDragStartTime] = useState<string | null>(null);
    const [dragEndTime, setDragEndTime] = useState<string | null>(null);

    // Estado para el diálogo de editar evento
    const [isEditEventDialogOpen, setIsEditEventDialogOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);

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
            { label: t("breadcrumb.degrees"), href: "/degrees" },
            { label: t("breadcrumb.courses"), href: `/degrees/${acronym}/courses` },
            { label: t("breadcrumb.calendar"), href: "" },
        ]);
    }, [setItems, acronym, t]);

    // Calcular grupos disponibles basado en asignaturas y tipos seleccionados
    const availableGrupos = useMemo(() => {
        if (allEvents.length === 0) return new Set<string>();

        const grupos = new Set<string>();

        allEvents.forEach(event => {
            // Si hay asignaturas seleccionadas, solo usar esas
            const shouldIncludeBySubject = filters.asignatura.length === 0 ||
                filters.asignatura.includes(event.subject?.acronym || '');

            if (shouldIncludeBySubject && event.subject?.acronym) {
                event.groups.forEach(group => {
                    // Si hay tipos seleccionados, solo usar esos
                    const shouldIncludeByType = filters.tipoGrupo.length === 0 ||
                        filters.tipoGrupo.includes(group.type);

                    if (shouldIncludeByType && event.subject?.acronym) {
                        const groupId = generateGroupId(
                            event.subject.acronym,
                            group.number,
                            group.type,
                            group.language === 'EN'
                        );
                        grupos.add(groupId);
                    }
                });
            }
        });

        return grupos;
    }, [allEvents, filters.asignatura, filters.tipoGrupo]);

    // Sincronización bidireccional: Si desmarco una asignatura, desmarcar sus grupos
    useEffect(() => {
        const groupsToRemove = filters.grupos.filter(groupId => {
            const parts = groupId.split('-');
            const subjectAcronym = parts[0];
            return !filters.asignatura.length || !filters.asignatura.includes(subjectAcronym);
        });

        if (groupsToRemove.length > 0) {
            setFilters(prev => ({
                ...prev,
                grupos: prev.grupos.filter(g => !groupsToRemove.includes(g))
            }));
        }
    }, [filters.asignatura]);

    // Sincronización bidireccional: Si se desmarcan todos los grupos de una asignatura, desmarcar la asignatura
    useEffect(() => {
        if (filters.asignatura.length === 0 || filters.grupos.length === 0) return;

        const subjectsWithGroups = new Set(filters.grupos.map(g => g.split('-')[0]));
        const subjectsToRemove = filters.asignatura.filter(
            subject => !subjectsWithGroups.has(subject)
        );

        if (subjectsToRemove.length > 0) {
            setFilters(prev => ({
                ...prev,
                asignatura: prev.asignatura.filter(s => !subjectsToRemove.includes(s))
            }));
        }
    }, [filters.grupos]);

    // Extraer opciones únicas de los eventos
    const filterOptions = useMemo(() => {
        if (allEvents.length === 0) return [];

        const uniqueTypes = new Set<string>();
        const uniqueSubjects = new Set<string>();
        const uniqueClassrooms = new Set<string>();
        const uniqueLanguages = new Set<string>();
        const uniqueYears = new Set<number>();

        allEvents.forEach(event => {
            event.groups.forEach(group => {
                uniqueTypes.add(group.type);
                uniqueLanguages.add(group.language);
            });

            if (event.subject?.acronym) {
                uniqueSubjects.add(event.subject.acronym);

                // Obtener el año desde el mapping de asignaturas
                const year = subjectYearMap.get(event.subject.acronym);
                if (year !== undefined && year !== null) {
                    uniqueYears.add(year);
                }
            }

            event.classrooms.forEach(classroom => {
                uniqueClassrooms.add(classroom.code);
            });
        });

        // Mapear años a etiquetas usando la función helper
        const yearLabels = Array.from(uniqueYears).sort().map(getYearLabel);

        return [
            {
                category: 'curso' as const,
                label: 'Curso',
                options: yearLabels,
                icon: GraduationCap
            },
            {
                category: 'tipoGrupo' as const,
                label: 'Tipo de Grupo',
                options: sortAlphabetically(Array.from(uniqueTypes)),
                icon: Users
            },
            {
                category: 'asignatura' as const,
                label: 'Asignatura',
                options: sortAlphabetically(Array.from(uniqueSubjects)),
                icon: BookOpen
            },
            {
                category: 'grupos' as const,
                label: 'Grupos',
                options: sortGruposByAcronymTypeNumber(Array.from(availableGrupos)),
                icon: Users
            },
            {
                category: 'aula' as const,
                label: 'Aula',
                options: sortAlphabetically(Array.from(uniqueClassrooms)),
                icon: DoorOpen
            },
            {
                category: 'idioma' as const,
                label: 'Idioma',
                options: sortAlphabetically(Array.from(uniqueLanguages)),
                icon: Languages
            }
        ];
    }, [allEvents, availableGrupos, subjectYearMap]);

    // Filtrar eventos según los filtros activos
    const filteredEvents = useMemo(() => {
        if (allEvents.length === 0) return [];

        return allEvents.filter(event => {
            const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);
            if (!hasActiveFilters) return true;

            // Filtro por tipo de grupo
            if (filters.tipoGrupo.length > 0) {
                const hasMatchingType = event.groups.some(group =>
                    filters.tipoGrupo.includes(group.type)
                );
                if (!hasMatchingType) return false;
            }

            // Filtro por asignatura
            if (filters.asignatura.length > 0) {
                if (!event.subject?.acronym || !filters.asignatura.includes(event.subject.acronym)) {
                    return false;
                }
            }

            // Filtro por grupos
            if (filters.grupos.length > 0) {
                const hasMatchingGroup = event.groups.some(group => {
                    const groupId = generateGroupId(
                        event.subject?.acronym || '',
                        group.number,
                        group.type,
                        group.language === 'EN'
                    );
                    return filters.grupos.includes(groupId);
                });
                if (!hasMatchingGroup) return false;
            }

            // Filtro por aula
            if (filters.aula.length > 0) {
                const hasMatchingClassroom = event.classrooms.some(classroom =>
                    filters.aula.includes(classroom.code)
                );
                if (!hasMatchingClassroom) return false;
            }

            // Filtro por idioma
            if (filters.idioma.length > 0) {
                const hasMatchingLanguage = event.groups.some(group =>
                    filters.idioma.includes(group.language)
                );
                if (!hasMatchingLanguage) return false;
            }

            // Filtro por curso (año de la asignatura)
            if (filters.curso.length > 0) {
                if (!event.subject?.acronym) return false;

                // Obtener el año desde el mapping de asignaturas
                const subjectYear = subjectYearMap.get(event.subject.acronym);
                if (subjectYear === undefined) return false;

                // Convertir el año a etiqueta usando helper
                const yearLabel = getYearLabel(subjectYear);
                if (!filters.curso.includes(yearLabel)) return false;
            }

            return true;
        });
    }, [allEvents, filters, subjectYearMap]);

    // Transformar eventos filtrados al formato de react-big-calendar
    const events: MyEvent[] = useMemo(() => {
        return filteredEvents.map((event) => {
            const eventDate = moment(event.date).format('YYYY-MM-DD');
            const startMoment = moment(`${eventDate}T${event.startTime}`);

            // Calcular el end basándose en la duración real del evento (en horas)
            const endMoment = startMoment.clone().add(event.duration, 'hours');

            // Formatear el nombre del grupo
            const groupName = `${event.subject?.acronym || 'Sin asignatura'}.${event.groups.map(g => {
                const lang = g.language === 'EN' ? 'I-' : '';
                return `${g.type}.${lang}${g.number}`;
            }).join(', ')}`;

            // Formatear la hora en formato 24h (HH:MM)
            const timeStr = startMoment.format('HH:mm');

            return {
                title: `${groupName} - ${timeStr}`,
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

    const handleExportToCSV = () => {
        try {
            // Filtrar eventos pendientes y cancelados (solo exportar eventos normales activos)
            const eventsToExport = filteredEvents.filter(
                event => !event.isPending && !event.cancelled
            );

            if (eventsToExport.length === 0) {
                console.warn('No hay eventos para exportar');
                triggerAlert({
                    title: 'Sin eventos',
                    description: 'No hay eventos para exportar con los filtros actuales',
                    variant: 'warning'
                });
                return;
            }

            // Generar CSV en formato de Google Calendar
            const csvContent = generateGoogleCalendarCSV(eventsToExport);

            // Generar nombre del archivo descriptivo
            const filename = `${acronym}_${startYear}-${endYear}_S${semester}_calendar.csv`;

            // Descargar archivo
            downloadCSV(csvContent, filename);

            triggerAlert({
                title: 'Exportación exitosa',
                description: `Se han exportado ${eventsToExport.length} eventos a CSV para Google Calendar`,
                variant: 'success'
            });

        } catch (error) {
            console.error('Error exporting calendar to CSV:', error);
            triggerAlert({
                title: 'Error al exportar',
                description: error instanceof Error ? error.message : 'Error desconocido al exportar el calendario',
                variant: 'destructive'
            });
        }
    };

    const handleCreateEvent = () => {
        setDragStartDate(null);
        setDragStartTime(null);
        setDragEndTime(null);
        setIsCreateEventDialogOpen(true);
    };

    const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
        // Permitir drag and drop a ADMIN (para crear eventos) y a PROFESSOR (para crear solicitudes)
        if (!isAdmin && user?.role !== 'PROFESSOR') {
            return;
        }

        // Convertir la fecha seleccionada a formato YYYY-MM-DD
        const selectedDate = moment(slotInfo.start).format('YYYY-MM-DD');

        // Validar que el día sea lectivo
        if (!lectiveDates.has(selectedDate)) {
            triggerAlert({
                title: 'Día no lectivo',
                description: 'No puedes crear eventos en días no lectivos',
                variant: 'destructive'
            });
            return;
        }

        const startTime = moment(slotInfo.start).format('HH:mm');
        const endTime = moment(slotInfo.end).format('HH:mm');

        setDragStartDate(selectedDate);
        setDragStartTime(startTime);
        setDragEndTime(endTime);

        // Si es ADMIN, abrir el diálogo de crear evento
        // Si es PROFESSOR, abrir el diálogo de crear solicitud
        if (isAdmin) {
            setIsCreateEventDialogOpen(true);
        } else if (user?.role === 'PROFESSOR') {
            setIsSolicitudDrawerOpen(true);
        }
    };

    const handleSaveEvent = (config: RecurrenceConfig) => {
        // Validaciones comunes
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

        // Manejar eventos puntuales
        if (config.frequency === 'no-repeat') {
            if (!config.eventDate || !config.subjectId) {
                triggerAlert({
                    title: 'Error',
                    description: 'Por favor selecciona una fecha y una asignatura',
                    variant: 'destructive'
                });
                return;
            }

            // Validar que el día sea lectivo
            if (!lectiveDates.has(config.eventDate)) {
                triggerAlert({
                    title: 'Error',
                    description: 'No puedes crear eventos en días no lectivos',
                    variant: 'destructive'
                });
                return;
            }

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
            return;
        }

        // Manejar eventos periódicos semanales
        if (config.frequency === 'weekly') {
            if (!config.weekDays || config.weekDays.length === 0) {
                triggerAlert({
                    title: 'Error',
                    description: 'Por favor selecciona un día de la semana',
                    variant: 'destructive'
                });
                return;
            }

            if (config.planifiedHours <= 0) {
                triggerAlert({
                    title: 'Error',
                    description: 'Por favor especifica las horas planificadas',
                    variant: 'destructive'
                });
                return;
            }

            createPeriodicEvent(
                {
                    calendarId,
                    weekDay: config.weekDays[0],
                    startTime: config.startTime,
                    endTime: config.endTime,
                    planifiedHours: config.planifiedHours,
                    groupIds: config.groupIds,
                    classroomIds: config.classroomIds || []
                },
                {
                    onSuccess: () => {
                        triggerAlert({
                            title: 'Éxito',
                            description: 'Evento periódico creado correctamente',
                            variant: 'success'
                        });
                        setIsCreateEventDialogOpen(false);
                        refetch();
                    },
                    onError: (error: Error & { statusCode?: number }) => {
                        const errorMessage = error.message || 'Error al crear el evento periódico';

                        triggerAlert({
                            title: 'Error',
                            description: errorMessage,
                            variant: 'destructive'
                        });
                    }
                }
            );
            return;
        }

        // Manejar eventos periódicos con frecuencia personalizada
        if (config.frequency === 'custom') {
            if (!config.customStartDate || !config.customFrequencyUnit || config.interval <= 0) {
                triggerAlert({
                    title: 'Error',
                    description: 'Por favor completa todos los campos de la frecuencia personalizada',
                    variant: 'destructive'
                });
                return;
            }

            if (config.customFrequencyUnit === 'week' && (!config.weekDays || config.weekDays.length === 0)) {
                triggerAlert({
                    title: 'Error',
                    description: 'Por favor selecciona al menos un día de la semana',
                    variant: 'destructive'
                });
                return;
            }

            // TODO: Implementar lógica de creación de eventos periódicos con frecuencia personalizada
            console.log('Creating custom frequency periodic event:', {
                calendarId,
                customStartDate: config.customStartDate,
                customFrequencyUnit: config.customFrequencyUnit,
                interval: config.interval,
                weekDays: config.weekDays,
                startTime: config.startTime,
                endTime: config.endTime,
                groupIds: config.groupIds,
                classroomIds: config.classroomIds
            });

            triggerAlert({
                title: 'Funcionalidad en desarrollo',
                description: 'La creación de eventos con frecuencia personalizada está siendo implementada',
                variant: 'default'
            });
            return;
        }

        // Otras opciones no implementadas
        triggerAlert({
            title: 'No implementado',
            description: 'Por el momento solo se pueden crear eventos puntuales y periódicos semanales',
            variant: 'default'
        });
    };

    const handleUpdateEvent = (_eventId: string, config: RecurrenceConfig) => {
        if (!eventToEdit?.puntualEventId || !config.eventDate) return;

        // Convertir la fecha ISO completa a formato YYYY-MM-DD
        const eventDateOnly = config.eventDate.split('T')[0];

        updatePuntualEvent(
            {
                eventId: eventToEdit.puntualEventId,
                eventDate: eventDateOnly,
                startTime: config.startTime,
                endTime: config.endTime,
                subjectId: config.subjectId,
                groupIds: config.groupIds,
                classroomIds: config.classroomIds || [],
                comment: config.comment
            },
            {
                onSuccess: () => {
                    setIsEditEventDialogOpen(false);
                    setEventToEdit(null);
                    refetch();
                    triggerAlert({
                        title: 'Evento actualizado',
                        description: 'El evento ha sido actualizado correctamente',
                        variant: 'success'
                    });
                },
                onError: (error: Error & { statusCode?: number }) => {
                    triggerAlert({
                        title: 'Error al actualizar',
                        description: error.message || 'No se pudo actualizar el evento',
                        variant: 'destructive'
                    });
                }
            }
        );
    };

    const handleEditEvent = (event?: CalendarEvent) => {
        const eventToUse = event || selectedEvent;

        if (eventToUse && eventToUse.type === 'puntual') {
            setEventToEdit(eventToUse);
            setIsEditEventDialogOpen(true);
            setIsEventDetailsDrawerOpen(false);
        }
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

    const handleViewEventDetails = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setIsEventDetailsDrawerOpen(true);
    };

    const handleApproveRequest = (event: CalendarEvent) => {
        // TODO: Implement approve request logic
        console.log('Approve request:', event);
    };

    const handleRejectRequest = (event: CalendarEvent) => {
        // TODO: Implement reject request logic
        console.log('Reject request:', event);
    };

    const handleReviewRequest = (event: CalendarEvent) => {
        // TODO: Implement review request logic
        console.log('Review request:', event);
    };

    const handleDeleteRequest = async (event: CalendarEvent) => {
        if (!event.requestId) {
            triggerAlert({
                title: 'Error',
                description: 'No se pudo identificar la solicitud',
                variant: 'destructive'
            });
            return;
        }

        const result = await deleteRequest(event.requestId, refetchPendingRequests);

        if (result.success) {
            triggerAlert({
                title: 'Solicitud eliminada',
                description: 'Tu solicitud ha sido eliminada exitosamente',
                variant: 'success'
            });
        } else {
            triggerAlert({
                title: 'Error',
                description: result.message || 'Error al eliminar la solicitud',
                variant: 'destructive'
            });
        }
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

        const result = await crearSolicitud(
            calendarIdParam,
            config.frequency === 'no-repeat' ? 'PUNTUAL' : 'PERIODIC',
            eventData,
            () => {
                refetch();
                refetchPendingRequests();
            }
        );

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
            onViewDetails={handleViewEventDetails}
            onApproveRequest={handleApproveRequest}
            onRejectRequest={handleRejectRequest}
            onReviewRequest={handleReviewRequest}
            onDeleteRequest={handleDeleteRequest}
        />
    );

    const calendarComponents: Components<MyEvent> = {
        event: EventComponent,
    };

    // Función para estilizar días no lectivos y días fuera del rango
    const dayPropGetter = (date: Date) => {
        const dateKey = format(date, 'yyyy-MM-dd');

        // Colorear si NO está en lectiveDates (incluye días no lectivos + días fuera del rango)
        if (!lectiveDates.has(dateKey)) {
            return {
                style: {
                    backgroundColor: '#d0d0d0',
                    opacity: 1,
                    borderLeft: '3px solid #999999',
                    color: '#000000',
                }
            };
        }
        return {};
    };

    if (isLoading || isLoadingPending) {
        return (
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2 p-10">
                <div className="flex items-center justify-center h-full">
                    <LoadingSpinner />
                </div>
            </section>
        );
    }

    if (!data) {
        return (
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2 p-10">
                <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No se pudo cargar el calendario</p>
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
                                onExportCSV={handleExportToCSV}
                                onCreateEvent={handleCreateEvent}
                                onManageGroups={() => navigate(`/degrees/${acronym}/courses/${startYear}/${endYear}/semester/${semester}/calendar/groups`)}
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
                    {user?.role === 'PROFESSOR' && (
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
                                selectable={isAdmin || user?.role === 'PROFESSOR'}
                                onDoubleClickEvent={(event) => {
                                    const calendarEvent = (event as MyEvent).resource;
                                    if (calendarEvent) {
                                        handleViewEventDetails(calendarEvent);
                                    }
                                }}
                                formats={{
                                    timeGutterFormat: 'HH:mm',
                                    eventTimeRangeFormat: () => '',
                                    agendaTimeRangeFormat: () => '',
                                    selectRangeFormat: () => '',
                                }}
                                eventPropGetter={(event) => {
                                    const calendarEvent = event.resource as CalendarEvent;

                                    // Obtener el color basado en la asignatura
                                    let backgroundColor = getSubjectColor(calendarEvent?.subject?.acronym);
                                    let textColor = darkenColor(backgroundColor, 0.4); // Usar versión oscura del mismo color
                                    let opacity = 1;
                                    let border = '1px solid white';

                                    // Eventos cancelados
                                    if (calendarEvent?.cancelled) {
                                        backgroundColor = '#ef4444';
                                        textColor = '#7f1d1d'; // Rojo oscuro
                                        opacity = 0.6;
                                    }
                                    // Eventos pendientes (solicitudes)
                                    else if (calendarEvent?.isPending) {
                                        opacity = 0.5;
                                        border = '2px dashed #6b7280';
                                    }

                                    return {
                                        style: {
                                            backgroundColor,
                                            color: textColor,
                                            opacity,
                                            border,
                                            borderRadius: '10px',
                                        }
                                    };
                                }}
                                dayPropGetter={dayPropGetter}
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
                courseId={course?.id}
                semester={semester ? parseInt(semester, 10) : undefined}
                initialDate={dragStartDate}
                initialStartTime={dragStartTime}
                initialEndTime={dragEndTime}
                lectiveDates={lectiveDates}
            />

            {/* Edit Event Dialog */}
            <EditEventDialog
                open={isEditEventDialogOpen}
                onOpenChange={(open) => {
                    setIsEditEventDialogOpen(open);
                    if (!open) {
                        setEventToEdit(null);
                    }
                }}
                onSave={handleUpdateEvent}
                event={eventToEdit}
                degreeId={course?.degree?.id}
                courseId={course?.id}
                semester={semester ? parseInt(semester, 10) : undefined}
                lectiveDates={lectiveDates}
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

            {/* Event Request Dialog - Solo para PROFESSOR */}
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
                    courseId={course?.id}
                    semester={semester ? parseInt(semester, 10) : undefined}
                    calendarId={calendarId || undefined}
                    initialDate={dragStartDate}
                    initialStartTime={dragStartTime}
                    initialEndTime={dragEndTime}
                    lectiveDates={lectiveDates}
                />
            )}
        </>
    );
}