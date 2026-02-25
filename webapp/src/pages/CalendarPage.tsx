import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext";
import { useEffect, useMemo, useState } from "react";
import { Calendar, momentLocalizer, Components } from "react-big-calendar";
import moment from "@/utils/momentLocales"; // Usar moment con locales pre-cargados
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useCalendarByCourseAndSemester } from "@/hooks/calendar/useCalendarByCourseAndSemester";
import { usePendingRequestsAsEvents } from "@/hooks/calendar/usePendingRequestsAsEvents";
import { useSubjectsWithGroupsByCalendarId } from "@/hooks/subject/useSubjectsWithGroupsByCalendarId";
import { CalendarEvent } from "@/types/CalendarEvent";
import ClassFilter, { FilterValues } from "@/components/ClassFilter";
import { FileText, BookOpen, DoorOpen, Languages, Users, GraduationCap, Tag } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useParams } from "react-router-dom";
import CalendarToolbar from "@/components/calendar/CalendarToolbar";
import CreateEventDialog from "@/components/calendar/CreateEventDialog";
import EditEventDialog from "@/components/calendar/EditEventDialog";
import CreateSolicitudDialog from "@/components/calendar/CreateSolicitudDialog";
import { ImportExceptionsDialog } from "@/components/calendar/ImportExceptionsDialog";
import { ExceptionValidationDialog } from "@/components/calendar/ExceptionValidationDialog";
import { GroupValidationResult } from "@/types/Calendar";
import type { RecurrenceConfig } from "@/types/RecurrenceConfig";
import { CalendarEventWrapper } from "@/components/calendar/CalendarEventWrapper";
import VITE_GATEWAY_API_URL from "@/config/api";
import { EventDetailsDrawer } from "@/components/calendar/EventDetailsDrawer";
import { DeleteEventConfirmationDialog } from "@/components/calendar/DeleteEventConfirmationDialog";
import ReplaceEventDialog from "@/components/calendar/ReplaceEventDialog";
import RequestEditDialog from "@/components/solicitud/RequestEditDialog";
import RequestCancelDialog from "@/components/solicitud/RequestCancelDialog";
import RequestReplaceDialog from "@/components/solicitud/RequestReplaceDialog";
import { useCreatePuntualEvent } from "@/hooks/calendar/useCreatePuntualEvent";
import { useCreatePeriodicEvent } from "@/hooks/calendar/useCreatePeriodicEvent";
import { useCreateCustomPeriodicEvent } from "@/hooks/calendar/useCreateCustomPeriodicEvent";
import { useUpdatePuntualEvent } from "@/hooks/calendar/useUpdatePuntualEvent";
import { useUpdatePeriodicEvent } from "@/hooks/calendar/useUpdatePeriodicEvent";
import { useUpdateCustomPeriodicEvent } from "@/hooks/calendar/useUpdateCustomPeriodicEvent";
import { useDeletePuntualEvent } from "@/hooks/calendar/useDeletePuntualEvent";
import { useImportExceptions } from "@/hooks/calendar/useImportExceptions";
import { calculateAffectedDates, getAffectedDatesSummary } from "@/utils/customPatternCalculator";
import { useFloatingAlertContext } from "@/contexts/useFloatingAlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCrearSolicitud } from "@/hooks/event-request/useCrearSolicitud";
import { useDeleteRequest } from "@/hooks/event-request/useDeleteRequest";
import { useGetSolicitudById } from "@/hooks/event-request/useGetSolicitudById";
import { useAprobarSolicitud } from "@/hooks/event-request/useAprobarSolicitud";
import { useRechazarSolicitud } from "@/hooks/event-request/useRechazarSolicitud";
import ApproveRequestDialog, { canApproveRequestDirectly } from "@/components/solicitud/ApproveRequestDialog";
import RejectRequestDialog from "@/components/calendar/RejectRequestDialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { generateGoogleCalendarCSV, downloadCSV } from "@/utils/csvExport";
import { generateGroupId } from "@/utils/groupFormatUtils";
import { sortAlphabetically, sortGruposByAcronymTypeNumber } from "@/utils/filterSortingUtils";
import { getAuthHeaders } from "@/utils/authHeaders";
import { EVENT_CHARACTERS, EVENT_TYPES, isCustomEventCharacter } from "@/constants/eventCharacters";

// El localizer se crea de forma global
const localizer = momentLocalizer(moment);

interface MyEvent {
    title: string;
    start: Date;
    end: Date;
    resource?: CalendarEvent;
    tooltip?: string;
}

// Helper: Mapear año numérico a etiqueta con traducción
const getYearLabel = (year: number, t: (key: string) => string): string => {
    const yearKeys: { [key: number]: string } = {
        0: 'calendar.academicYear.elective',
        1: 'calendar.academicYear.first',
        2: 'calendar.academicYear.second',
        3: 'calendar.academicYear.third',
        4: 'calendar.academicYear.fourth'
    };
    return t(yearKeys[year]) || `${year}º`;
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
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);

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

    const { t, i18n } = useTranslation()
    const { triggerAlert } = useFloatingAlertContext();
    const { user } = useAuth();
    const [localeLoaded, setLocaleLoaded] = useState(false);

    // Configurar el locale de moment basándose en el idioma actual de i18next
    useEffect(() => {
        setLocaleLoaded(false);
        const currentLanguage = i18n.language;
        console.log('🌍 Current i18n language:', currentLanguage);

        // Extraer el código de idioma base (ej: 'es-ES' -> 'es')
        const languageCode = currentLanguage.split('-')[0];
        console.log('🌍 Language code extracted:', languageCode);

        // Establecer el locale actual
        moment.locale(languageCode);

        // Configurar que la semana siempre empiece en lunes, independientemente del idioma
        moment.updateLocale(languageCode, {
            week: {
                dow: 1, // Monday/Lunes es el primer día de la semana
                doy: 4
            }
        });

        // Verificar el locale actual
        const currentLocale = moment.locale();
        console.log('🌍 Final moment locale:', currentLocale);
        console.log('🗓️ Test format:', moment().format('dddd, MMMM DD, YYYY'));
        setLocaleLoaded(true);
    }, [i18n.language]);

    // Extraer el acrónimo de la URL
    const { acronym, startYear, endYear, semester } = useParams<{ acronym: string, startYear: string, endYear: string, semester: string }>()

    const { setItems } = useBreadcrumbContext();

    const { data, isLoading, calendarId, course, refetch } = useCalendarByCourseAndSemester(
        acronym || null,
        startYear || null,
        endYear || null,
        semester || null
    );

    // Hooks que dependen de calendarId
    const { mutate: createPuntualEvent } = useCreatePuntualEvent();
    const { mutate: createPeriodicEvent } = useCreatePeriodicEvent();
    const { mutate: createCustomPeriodicEvent } = useCreateCustomPeriodicEvent();
    const { mutate: updatePuntualEvent } = useUpdatePuntualEvent();
    const { mutate: updatePeriodicEvent } = useUpdatePeriodicEvent();
    const { updateCustomPeriodicEventAsync } = useUpdateCustomPeriodicEvent();
    const { deletePuntualEvent, isDeleting: isDeletingEvent } = useDeletePuntualEvent();
    const crearSolicitud = useCrearSolicitud();
    const deleteRequest = useDeleteRequest();
    const aprobarSolicitud = useAprobarSolicitud();
    const rechazarSolicitud = useRechazarSolicitud();
    const isAdmin = user?.role === 'ADMIN';

    // Estado para revisión de solicitudes desde el calendario
    const [reviewRequestId, setReviewRequestId] = useState<string | null>(null);
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
    const { data: requestToReview } = useGetSolicitudById(reviewRequestId);

    // Estado para rechazo directo
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectRequestId, setRejectRequestId] = useState<string | null>(null);
    const [isSubmittingReject, setIsSubmittingReject] = useState(false);

    // Obtener eventos de solicitudes pendientes
    const { data: pendingData, isLoading: isLoadingPending, refetch: refetchPendingRequests } = usePendingRequestsAsEvents(calendarId);

    // Obtener asignaturas para el mapping de años
    const { data: subjectsData } = useSubjectsWithGroupsByCalendarId(calendarId);

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
        curso: [],
        tipoEvento: []  // Sin selección = todos visibles
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

    // Estado para los diálogos de solicitud (edit/cancel/replace)
    const [isRequestEditOpen, setIsRequestEditOpen] = useState(false);
    const [isRequestCancelOpen, setIsRequestCancelOpen] = useState(false);
    const [isRequestReplaceOpen, setIsRequestReplaceOpen] = useState(false);
    const [eventForRequest, setEventForRequest] = useState<CalendarEvent | undefined>(undefined);

    // Estado para el diálogo de eliminación de evento
    const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<CalendarEvent | undefined>(undefined);
    const [deleteType, setDeleteType] = useState<'event' | 'series'>('event');

    // Estado para el diálogo de revertir cancelación
    const [isRevertConfirmationOpen, setIsRevertConfirmationOpen] = useState(false);
    const [eventToRevert, setEventToRevert] = useState<CalendarEvent | undefined>(undefined);
    const [isRevertingEvent, setIsRevertingEvent] = useState(false);

    // Estado para el diálogo de reemplazo de evento
    const [isReplaceEventDialogOpen, setIsReplaceEventDialogOpen] = useState(false);
    const [eventToReplace, setEventToReplace] = useState<CalendarEvent | null>(null);

    // Estado para solicitud de eventos
    const [isSolicitudDrawerOpen, setIsSolicitudDrawerOpen] = useState(false);

    // Estado para importar excepciones
    const [isImportExceptionsDialogOpen, setIsImportExceptionsDialogOpen] = useState(false);
    const [exceptionValidationData, setExceptionValidationData] = useState<GroupValidationResult | null>(null);
    const [isExceptionValidationDialogOpen, setIsExceptionValidationDialogOpen] = useState(false);

    const { importExceptionsAsync, isImporting: isImportingExceptions } = useImportExceptions({
        onValidationIssues: (validationResult) => {
            setExceptionValidationData(validationResult);
            setIsExceptionValidationDialogOpen(true);
            setIsImportExceptionsDialogOpen(false);
        },
        onSuccess: () => {
            setIsImportExceptionsDialogOpen(false);
        }
    });

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
            // Miga intermedia con el nombre del grado (sin enlace, solo informativo)
            ...(course?.degree ? [{ label: course.degree.name, href: "" }] : []),
            { label: t("breadcrumb.courses"), href: `/degrees/${acronym}/courses` },
            // Miga intermedia con el año académico (sin enlace, solo informativo)
            ...(course ? [{ label: `${course.startYear}/${course.endYear}`, href: "" }] : []),
            // Miga intermedia con el semestre (sin enlace, solo informativo)
            ...(semester ? [{ label: `${t("breadcrumb.semester")} ${semester}`, href: "" }] : []),
            { label: t("breadcrumb.calendar"), href: "" },
        ]);
    }, [setItems, acronym, t, course, semester]);

    // Calcular grupos disponibles basado en curso, asignaturas y tipos seleccionados
    const availableGrupos = useMemo(() => {
        if (allEvents.length === 0) return new Set<string>();

        const grupos = new Set<string>();

        // Helper: Verificar si evento cumple con filtros de Curso
        const matchesCourseFilter = (event: CalendarEvent): boolean => {
            if (filters.curso.length === 0) return true;
            if (!event.subject?.acronym) return false;
            const year = subjectYearMap.get(event.subject.acronym);
            if (year === undefined || year === null) return false;
            const yearLabel = getYearLabel(year, t);
            return filters.curso.includes(yearLabel);
        };

        // Helper: Verificar si evento cumple con filtros de Asignatura
        const matchesSubjectFilter = (event: CalendarEvent): boolean => {
            if (filters.asignatura.length === 0) return true;
            return event.subject?.acronym ? filters.asignatura.includes(event.subject.acronym) : false;
        };

        allEvents.forEach(event => {
            if (!event.subject?.acronym) return;
            if (!matchesCourseFilter(event)) return;
            if (!matchesSubjectFilter(event)) return;

            event.groups.forEach(group => {
                // Si hay tipos seleccionados, solo usar esos
                if (filters.tipoGrupo.length > 0 && !filters.tipoGrupo.includes(group.type)) {
                    return;
                }

                const groupId = generateGroupId(
                    event.subject!.acronym,
                    group.number,
                    group.type,
                    group.language === 'EN'
                );
                grupos.add(groupId);
            });
        });

        return grupos;
    }, [allEvents, filters.curso, filters.asignatura, filters.tipoGrupo, subjectYearMap, t]);

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

    // Extraer opciones únicas de los eventos con filtrado en cascada
    const filterOptions = useMemo(() => {
        if (allEvents.length === 0) return [];

        // Para cada categoría, aplicar solo los filtros "superiores" en la jerarquía
        // Jerarquía: Curso > Asignatura > Tipo de Grupo > Grupos/Aulas/Idiomas

        // Helper: Verificar si un evento pertenece a los cursos seleccionados
        const matchesCourseFilter = (event: CalendarEvent): boolean => {
            if (filters.curso.length === 0) return true;
            if (!event.subject?.acronym) return false;
            const year = subjectYearMap.get(event.subject.acronym);
            if (year === undefined || year === null) return false;
            const yearLabel = getYearLabel(year, t);
            return filters.curso.includes(yearLabel);
        };

        // Helper: Verificar si un evento pertenece a las asignaturas seleccionadas
        const matchesSubjectFilter = (event: CalendarEvent): boolean => {
            if (filters.asignatura.length === 0) return true;
            return event.subject?.acronym ? filters.asignatura.includes(event.subject.acronym) : false;
        };

        // Helper: Verificar si un evento tiene grupos del tipo seleccionado
        const matchesGroupTypeFilter = (event: CalendarEvent): boolean => {
            if (filters.tipoGrupo.length === 0) return true;
            return event.groups.some(group => filters.tipoGrupo.includes(group.type));
        };

        // Aplicar filtros en cascada según jerarquía
        const eventsForYears = allEvents;
        const eventsForSubjects = allEvents.filter(matchesCourseFilter);
        const eventsForTypes = eventsForSubjects.filter(matchesSubjectFilter);
        const eventsForOthers = eventsForTypes.filter(matchesGroupTypeFilter);

        // Extraer opciones únicas usando los eventos correspondientes
        const uniqueYears = new Set<number>();
        const uniqueSubjects = new Set<string>();
        const subjectTooltipMap = new Map<string, string>(); // Mapa acronym -> nombre completo
        const uniqueTypes = new Set<string>();
        const uniqueClassrooms = new Set<string>();
        const uniqueLanguages = new Set<string>();

        // Años (de todos los eventos)
        eventsForYears.forEach(event => {
            if (event.subject?.acronym) {
                const year = subjectYearMap.get(event.subject.acronym);
                if (year !== undefined && year !== null) {
                    uniqueYears.add(year);
                }
            }
        });

        // Asignaturas (de eventos filtrados por Curso)
        eventsForSubjects.forEach(event => {
            if (event.subject?.acronym) {
                uniqueSubjects.add(event.subject.acronym);
                // Guardar el nombre completo para tooltips
                if (event.subject.name) {
                    subjectTooltipMap.set(event.subject.acronym, event.subject.name);
                }
            }
        });

        // Tipos de Grupo (de eventos filtrados por Curso y Asignatura)
        eventsForTypes.forEach(event => {
            event.groups.forEach(group => uniqueTypes.add(group.type));
        });

        // Aulas e Idiomas (de eventos filtrados por Curso, Asignatura y Tipo de Grupo)
        eventsForOthers.forEach(event => {
            event.groups.forEach(group => uniqueLanguages.add(group.language));
            event.classrooms.forEach(classroom => uniqueClassrooms.add(classroom.code));
        });

        // Mapear años a etiquetas usando la función helper
        const yearLabels = Array.from(uniqueYears).sort().map(year => getYearLabel(year, t));

        return [
            {
                category: 'curso' as const,
                label: t('calendar.filters.year'),
                options: yearLabels,
                icon: GraduationCap
            },
            {
                category: 'asignatura' as const,
                label: t('calendar.filters.subject'),
                options: sortAlphabetically(Array.from(uniqueSubjects)),
                optionTooltips: Object.fromEntries(subjectTooltipMap),
                icon: BookOpen
            },
            {
                category: 'tipoGrupo' as const,
                label: t('calendar.filters.groupType'),
                options: sortAlphabetically(Array.from(uniqueTypes)),
                icon: Users
            },
            {
                category: 'grupos' as const,
                label: t('calendar.filters.groups'),
                options: sortGruposByAcronymTypeNumber(Array.from(availableGrupos)),
                icon: Users
            },
            {
                category: 'aula' as const,
                label: t('calendar.filters.classroom'),
                options: sortAlphabetically(Array.from(uniqueClassrooms)),
                icon: DoorOpen
            },
            {
                category: 'idioma' as const,
                label: t('calendar.filters.language'),
                options: sortAlphabetically(Array.from(uniqueLanguages)),
                icon: Languages
            },
            {
                category: 'tipoEvento' as const,
                label: t('calendar.filters.eventType'),
                options: [EVENT_TYPES.NORMAL, EVENT_TYPES.BLOCKER, EVENT_TYPES.REVISION, EVENT_TYPES.EVALUACION, EVENT_TYPES.OTRO, 'CANCELADO'],
                icon: Tag
            }
        ];
    }, [allEvents, availableGrupos, subjectYearMap, isAdmin, filters.curso, filters.asignatura, filters.tipoGrupo, t]);

    // Filtrar eventos según los filtros activos
    const filteredEvents = useMemo(() => {
        if (allEvents.length === 0) return [];

        return allEvents.filter(event => {
            // Filtro por tipo de evento: sin selección = todos visibles;
            // con selección = solo los tipos marcados.
            // "CANCELADO" es un valor especial que matchea event.cancelled === true.
            if (filters.tipoEvento.length > 0) {
                const isCancelled = event.cancelled;
                const matchesCancelado = isCancelled && filters.tipoEvento.includes('CANCELADO');
                const matchesEventType = !isCancelled && filters.tipoEvento.includes(event.eventType);
                if (!matchesCancelado && !matchesEventType) return false;
            }

            // Verificar si hay otros filtros activos (excluyendo tipoEvento)
            const { tipoEvento: _, ...otherFilters } = filters;
            const hasActiveFilters = Object.values(otherFilters).some(arr => arr.length > 0);
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
                const yearLabel = getYearLabel(subjectYear, t);
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

            // Formatear la hora en formato 24h (HH:MM)
            const timeStr = startMoment.format('HH:mm');

            // Crear tooltip personalizado
            const classroomStr = event.classrooms.length > 0
                ? event.classrooms.map(c => c.code).join(', ')
                : 'Sin aula asignada';

            // Blocker: label solo con aulas
            if (event.eventType === 'BLOCKER') {
                const tooltip = `Blocker\n${classroomStr}\n${event.startTime} - ${event.endTime}`;
                return {
                    title: `${classroomStr} · ${timeStr}`,
                    start: startMoment.toDate(),
                    end: endMoment.toDate(),
                    resource: event,
                    tooltip: tooltip
                };
            }

            // Add prefix based on event type for special events
            const eventPrefixMap: Record<string, string> = {
                [EVENT_TYPES.EVALUACION]: 'EV · ',
                [EVENT_TYPES.REVISION]: 'RE · ',
                [EVENT_TYPES.OTRO]: 'OT · ',
            };
            const eventPrefix = eventPrefixMap[event.eventType] || '';

            // Formatear el nombre del grupo
            const groupName = `${event.subject?.acronym || 'Sin asignatura'}.${event.groups.map(g => {
                const lang = g.language === 'EN' ? 'I-' : '';
                return `${g.type}.${lang}${g.number}`;
            }).join(', ')}`;

            const tooltip = `${event.subject?.name || 'Sin asignatura'}\n${groupName}\n${event.startTime} - ${event.endTime}\n${classroomStr}`;

            return {
                title: `${eventPrefix}${groupName} · ${timeStr}`,
                start: startMoment.toDate(),
                end: endMoment.toDate(),
                resource: event,
                tooltip: tooltip
            };
        });
    }, [filteredEvents]);

    // Limpiar los dos puntos que react-big-calendar agrega automáticamente al tooltip
    useEffect(() => {
        const cleanTooltips = () => {
            const eventElements = document.querySelectorAll<HTMLElement>('.rbc-event[title]');
            eventElements.forEach((element) => {
                const titleAttr = element.getAttribute('title');
                if (titleAttr?.startsWith(': ')) {
                    element.setAttribute('title', titleAttr.slice(2));
                }
            });
        };

        // Usar MutationObserver para detectar cuando se agregan nuevos eventos al DOM
        const observer = new MutationObserver(() => {
            // Solo limpiar tooltips cuando se detecten cambios en el DOM
            cleanTooltips();
        });

        const calendarElement = document.querySelector('.rbc-calendar');
        if (calendarElement) {
            observer.observe(calendarElement, {
                childList: true,
                subtree: true,
                attributes: false, // No necesitamos observar cambios de atributos
                characterData: false // No necesitamos observar cambios de texto
            });

            // Limpieza inicial
            cleanTooltips();
        }

        return () => {
            observer.disconnect();
        };
    }, [events, currentDate]);

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

    const handleImportExceptions = async (file: File, mode: 'add' | 'replace') => {
        if (!calendarId) {
            console.error('No calendar ID available for import');
            return;
        }

        try {
            await importExceptionsAsync({
                calendarId,
                file,
                mode
            });

            // Refetch calendar events
            await refetch();
        } catch (error) {
            console.error('Error importing exceptions:', error);
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
                    title: t('calendar.alerts.export.noEvents.title'),
                    description: t('calendar.alerts.export.noEvents.description'),
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
                title: t('calendar.alerts.export.success.title'),
                description: t('calendar.alerts.export.success.description', { count: eventsToExport.length }),
                variant: 'success'
            });

        } catch (error) {
            console.error('Error exporting calendar to CSV:', error);
            triggerAlert({
                title: t('calendar.alerts.export.error.title'),
                description: error instanceof Error ? error.message : t('calendar.alerts.export.error.description'),
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
                title: t('calendar.alerts.nonLectiveDay.title'),
                description: t('calendar.alerts.nonLectiveDay.description'),
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
        const eventType = config.eventType || 'NORMAL';
        const isSpecial = eventType !== 'NORMAL';

        // Validaciones comunes
        if (eventType !== 'BLOCKER' && (!config.groupIds || config.groupIds.length === 0)) {
            triggerAlert({
                title: t('calendar.alerts.validation.noGroups.title'),
                description: t('calendar.alerts.validation.noGroups.description'),
                variant: 'destructive'
            });
            return;
        }

        // Validar que al menos un aula esté seleccionada
        if (!config.classroomIds || config.classroomIds.length === 0) {
            triggerAlert({
                title: t('calendar.alerts.validation.noClassrooms.title'),
                description: t('calendar.alerts.validation.noClassrooms.description'),
                variant: 'destructive'
            });
            return;
        }

        if (!calendarId) {
            triggerAlert({
                title: t('calendar.alerts.validation.noCalendarId.title'),
                description: t('calendar.alerts.validation.noCalendarId.description'),
                variant: 'destructive'
            });
            return;
        }

        // Manejar eventos puntuales
        if (config.frequency === 'no-repeat') {
            if (!config.eventDate || (!config.subjectId && eventType !== 'BLOCKER')) {
                triggerAlert({
                    title: t('calendar.alerts.validation.noDateOrSubject.title'),
                    description: t('calendar.alerts.validation.noDateOrSubject.description'),
                    variant: 'destructive'
                });
                return;
            }

            // Validar que el día sea lectivo
            if (!lectiveDates.has(config.eventDate)) {
                triggerAlert({
                    title: t('calendar.alerts.nonLectiveDay.title'),
                    description: t('calendar.alerts.nonLectiveDay.description'),
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
                    comment: config.comment,
                    eventType: eventType
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
                        triggerAlert({
                            title: t('alerts.puntualEvent.error.title'),
                            description: t(error.message),
                            variant: 'destructive'
                        });
                    }
                }
            );
            return;
        }

        // Manejar eventos periódicos semanales, quincenales par e impar
        if (config.frequency === 'weekly' || config.frequency === 'biweekly-even' || config.frequency === 'biweekly-odd') {
            if (!config.weekDays || config.weekDays.length === 0) {
                triggerAlert({
                    title: t('calendar.alerts.validation.noWeekDay.title'),
                    description: t('calendar.alerts.validation.noWeekDay.description'),
                    variant: 'destructive'
                });
                return;
            }

            if (!isSpecial && config.planifiedHours <= 0) {
                triggerAlert({
                    title: t('calendar.alerts.validation.noPlanifiedHours.title'),
                    description: t('calendar.alerts.validation.noPlanifiedHours.description'),
                    variant: 'destructive'
                });
                return;
            }

            // Crear un evento para cada día de la semana seleccionado
            let createdCount = 0;
            let errorCount = 0;
            const totalDays = config.weekDays.length;

            const createNextEvent = (index: number) => {
                if (index >= totalDays) {
                    // Todos los eventos han sido procesados
                    if (errorCount === 0) {
                        triggerAlert({
                            title: t('calendar.alerts.periodicEvent.success.title'),
                            description: t('calendar.alerts.periodicEvent.success.description', { count: createdCount }),
                            variant: 'success'
                        });
                        setIsCreateEventDialogOpen(false);
                        refetch();
                    } else if (createdCount > 0) {
                        triggerAlert({
                            title: t('calendar.alerts.periodicEvent.partial.title'),
                            description: t('calendar.alerts.periodicEvent.partial.description', { created: createdCount, errors: errorCount }),
                            variant: 'default'
                        });
                        setIsCreateEventDialogOpen(false);
                        refetch();
                    }
                    return;
                }

                createPeriodicEvent(
                    {
                        calendarId,
                        weekDay: config.weekDays[index],
                        startTime: config.startTime,
                        endTime: config.endTime,
                        planifiedHours: config.planifiedHours,
                        eventCharacter: config.eventCharacter,
                        groupIds: config.groupIds,
                        classroomIds: config.classroomIds || [],
                        eventType: eventType
                    },
                    {
                        onSuccess: () => {
                            createdCount++;
                            createNextEvent(index + 1);
                        },
                        onError: (error: Error & { statusCode?: number }) => {
                            errorCount++;
                            console.error(`Error creating event for day ${config.weekDays[index]}:`, error);

                            if (index === 0) {
                                // Si falla el primero, mostrar error y no continuar
                                const errorMessage = error.message || t('calendar.alerts.periodicEvent.error.description');
                                triggerAlert({
                                    title: t('calendar.alerts.periodicEvent.error.title'),
                                    description: errorMessage,
                                    variant: 'destructive'
                                });
                            } else {
                                // Si falla uno posterior, continuar con el siguiente
                                createNextEvent(index + 1);
                            }
                        }
                    }
                );
            };

            // Iniciar la creación secuencial de eventos
            createNextEvent(0);
            return;
        }

        // Manejar eventos periódicos con frecuencia personalizada
        if (config.frequency === 'custom') {
            console.log('[Custom Frequency] Validando configuración:', {
                customStartDate: config.customStartDate,
                customFrequencyUnit: config.customFrequencyUnit,
                interval: config.interval,
                weekDays: config.weekDays,
                planifiedHours: config.planifiedHours
            });

            if (!config.customStartDate || !config.customFrequencyUnit || config.interval <= 0) {
                console.log('[Custom Frequency] Error: Campos incompletos');
                triggerAlert({
                    title: t('calendar.alerts.validation.customFrequencyIncomplete.title'),
                    description: t('calendar.alerts.validation.customFrequencyIncomplete.description'),
                    variant: 'destructive'
                });
                return;
            }

            // Validar weekDays solo para frecuencia semanal
            if (config.customFrequencyUnit === 'week' && (!config.weekDays || config.weekDays.length === 0)) {
                console.log('[Custom Frequency] Error: No hay días de la semana seleccionados para frecuencia semanal');
                triggerAlert({
                    title: t('calendar.alerts.validation.noWeekDay.title'),
                    description: t('calendar.alerts.validation.noWeekDay.description'),
                    variant: 'destructive'
                });
                return;
            }

            if (!isSpecial && config.planifiedHours <= 0) {
                console.log('[Custom Frequency] Error: Horas planificadas inválidas:', config.planifiedHours);
                triggerAlert({
                    title: t('calendar.alerts.validation.noPlanifiedHours.title'),
                    description: t('calendar.alerts.validation.noPlanifiedHours.description'),
                    variant: 'destructive'
                });
                return;
            }

            // Obtener las fechas del calendario desde course.calendars
            const currentCalendar = course?.calendars?.find(cal => cal.id === calendarId) as any;
            console.log('[Custom Frequency] Calendario encontrado:', {
                currentCalendar,
                hasStart: !!currentCalendar?.start,
                hasEnd: !!currentCalendar?.end,
                start: currentCalendar?.start,
                end: currentCalendar?.end,
                allKeys: currentCalendar ? Object.keys(currentCalendar) : []
            });

            if (!currentCalendar?.start || !currentCalendar?.end) {
                console.log('[Custom Frequency] Error: Información del calendario no disponible', {
                    course,
                    calendarId,
                    currentCalendar
                });
                triggerAlert({
                    title: t('calendar.alerts.validation.noCalendarInfo.title'),
                    description: t('calendar.alerts.validation.noCalendarInfo.description'),
                    variant: 'destructive'
                });
                return;
            }

            // El backend verificará si hay caracteres disponibles y devolverá error si se alcanzó el límite

            console.log('[Custom Frequency] Todas las validaciones pasaron, calculando fechas afectadas...');

            // Calcular las fechas afectadas
            let affectedDates: string[];
            try {
                const calendarStartDate = new Date(currentCalendar.start);
                const customStartDate = new Date(config.customStartDate);
                const calendarEndDate = new Date(currentCalendar.end);

                // Determinar fecha límite según endsType
                let effectiveEndDate = calendarEndDate;
                if (config.endsType === 'on' && config.endsOnDate) {
                    const userEndDate = new Date(config.endsOnDate);
                    effectiveEndDate = userEndDate < calendarEndDate ? userEndDate : calendarEndDate;
                }

                affectedDates = calculateAffectedDates({
                    calendarStart: calendarStartDate,
                    startDate: customStartDate,
                    endDate: effectiveEndDate,
                    interval: config.interval,
                    unit: config.customFrequencyUnit || 'week',
                    weekDays: config.weekDays,
                    endsType: config.endsType,
                    endsOnDate: config.endsOnDate,
                    endsAfterOccurrences: config.endsAfterOccurrences,
                    monthlyPatternType: config.monthlyPatternType
                });

                if (affectedDates.length === 0) {
                    triggerAlert({
                        title: t('calendar.alerts.validation.noDates.title'),
                        description: t('calendar.alerts.validation.noDates.description'),
                        variant: 'destructive'
                    });
                    return;
                }

                const summary = getAffectedDatesSummary(affectedDates);
                console.log('[Custom Pattern] Fechas afectadas:', {
                    total: summary.totalDates,
                    primera: summary.firstDate,
                    última: summary.lastDate,
                    porDía: summary.datesByWeekDay
                });
            } catch (error) {
                console.error('[Custom Pattern] Error al calcular fechas:', error);
                triggerAlert({
                    title: 'Error',
                    description: error instanceof Error ? error.message : 'Error al calcular las fechas afectadas',
                    variant: 'destructive'
                });
                return;
            }

            // Crear el evento periódico personalizado
            // El backend asignará automáticamente el eventCharacter disponible
            console.log('[Custom Frequency] Creando evento con payload:', {
                calendarId,
                affectedDates,
                startTime: config.startTime,
                endTime: config.endTime,
                planifiedHours: config.planifiedHours,
                groupIds: config.groupIds,
                classroomIds: config.classroomIds || []
            });

            createCustomPeriodicEvent(
                {
                    calendarId,
                    affectedDates: affectedDates,
                    startTime: config.startTime,
                    endTime: config.endTime,
                    planifiedHours: config.planifiedHours,
                    groupIds: config.groupIds,
                    classroomIds: config.classroomIds || [],
                    eventType: eventType
                },
                {
                    onSuccess: (data) => {
                        const summary = getAffectedDatesSummary(affectedDates);
                        setIsCreateEventDialogOpen(false);
                        refetch();
                        triggerAlert({
                            title: t('calendar.alerts.customPeriodicEvent.created.title'),
                            description: t('calendar.alerts.customPeriodicEvent.created.description', { count: data.data.events.length, dates: summary.totalDates }),
                            variant: 'success'
                        });
                    },
                    onError: (error) => {
                        const errorMessage = error.message || t('calendar.alerts.customPeriodicEvent.error.description');
                        triggerAlert({
                            title: t('calendar.alerts.customPeriodicEvent.error.title'),
                            description: errorMessage,
                            variant: 'destructive'
                        });
                    }
                }
            );
            return;
        }

        // Otras opciones no implementadas
        triggerAlert({
            title: t('calendar.alerts.validation.notImplemented.title'),
            description: t('calendar.alerts.validation.notImplemented.description'),
            variant: 'default'
        });
    };

    const handleUpdateEvent = async (_eventId: string, config: RecurrenceConfig) => {
        if (!eventToEdit) return;

        // Actualizar evento periódico
        if (eventToEdit.type === 'periodic' && eventToEdit.periodicEventId) {
            // Detectar si es un evento periódico personalizado (custom character)
            const isCustomPeriodicEvent = isCustomEventCharacter(eventToEdit.eventCharacter);

            // Si es evento personalizado, usar el endpoint de actualización personalizada
            if (isCustomPeriodicEvent && calendarId) {
                try {
                    await updateCustomPeriodicEventAsync({
                        eventCharacter: eventToEdit.eventCharacter!,
                        calendarId: calendarId,
                        startTime: config.startTime,
                        endTime: config.endTime,
                        classroomIds: config.classroomIds || [],
                        planifiedHours: config.planifiedHours,
                        eventType: config.eventType
                    });

                    setIsEditEventDialogOpen(false);
                    setEventToEdit(null);
                    refetch();
                } catch (error) {
                    console.error('Error al actualizar eventos personalizados:', error);
                }
                return;
            }

            // Si es evento periódico estándar (N, P, I), usar el endpoint normal
            updatePeriodicEvent(
                {
                    eventId: eventToEdit.periodicEventId,
                    startTime: config.startTime,
                    endTime: config.endTime,
                    weekDay: config.weekDays && config.weekDays.length > 0 ? config.weekDays[0] : undefined,
                    classroomIds: config.classroomIds || [],
                    planifiedHours: config.planifiedHours,
                    eventType: config.eventType
                },
                {
                    onSuccess: () => {
                        setIsEditEventDialogOpen(false);
                        setEventToEdit(null);
                        refetch();
                        triggerAlert({
                            title: t('calendar.alerts.periodicEvent.updated.title'),
                            description: t('calendar.alerts.periodicEvent.updated.description'),
                            variant: 'success'
                        });
                    },
                    onError: (error: Error & { statusCode?: number }) => {
                        triggerAlert({
                            title: t('calendar.alerts.periodicEvent.updateError.title'),
                            description: t(error.message) || t('calendar.alerts.periodicEvent.updateError.description'),
                            variant: 'destructive'
                        });
                    }
                }
            );
            return;
        }

        // Actualizar evento puntual
        if (eventToEdit.type === 'puntual' && eventToEdit.puntualEventId && config.eventDate) {
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
                    comment: config.comment,
                    eventType: config.eventType
                },
                {
                    onSuccess: () => {
                        setIsEditEventDialogOpen(false);
                        setEventToEdit(null);
                        refetch();
                        triggerAlert({
                            title: t('calendar.alerts.eventUpdate.success.title'),
                            description: t('calendar.alerts.eventUpdate.success.description'),
                            variant: 'success'
                        });
                    },
                    onError: (error: Error & { statusCode?: number }) => {
                        triggerAlert({
                            title: t('calendar.alerts.eventUpdate.error.title'),
                            description: t(error.message) || t('calendar.alerts.eventUpdate.error.description'),
                            variant: 'destructive'
                        });
                    }
                }
            );
        }
    };

    const handleEditEvent = (event?: CalendarEvent) => {
        const eventToUse = event || selectedEvent;

        // Solo permitir editar eventos puntuales directamente
        // Los eventos periódicos se editan mediante handleEditSeries
        if (eventToUse && eventToUse.type === 'puntual') {
            setEventToEdit(eventToUse);
            setIsEditEventDialogOpen(true);
            setIsEventDetailsDrawerOpen(false);
        }
    };

    const handleDeleteEvent = (event: CalendarEvent) => {
        setEventToDelete(event);
        setDeleteType('event');
        setIsDeleteConfirmationOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!eventToDelete) return;

        // Si es eliminar serie completa
        if (deleteType === 'series') {
            if (!eventToDelete.periodicEventId) {
                triggerAlert({
                    title: t('calendar.alerts.eventDelete.noPeriodicId.title'),
                    description: t('calendar.alerts.eventDelete.noPeriodicId.description'),
                    variant: 'destructive'
                });
                return;
            }

            try {
                const response = await fetch(`${VITE_GATEWAY_API_URL}/calendar/periodic-event/${eventToDelete.periodicEventId}`, {
                    method: 'DELETE',
                    headers: {
                        ...getAuthHeaders(),
                        'Content-Type': 'application/json'
                    }
                });

                const result = await response.json();

                if (result.status === 'success') {
                    triggerAlert({
                        title: t('calendar.alerts.eventDelete.seriesDeleted.title'),
                        description: t('calendar.alerts.eventDelete.seriesDeleted.description'),
                        variant: 'success'
                    });
                    setIsDeleteConfirmationOpen(false);
                    setEventToDelete(undefined);
                    refetch();
                } else {
                    triggerAlert({
                        title: t('calendar.alerts.eventDelete.seriesError.title'),
                        description: result.message || t('calendar.alerts.eventDelete.seriesError.description'),
                        variant: 'destructive'
                    });
                }
            } catch (error) {
                triggerAlert({
                    title: t('calendar.alerts.eventDelete.seriesErrorGeneric.title'),
                    description: error instanceof Error ? error.message : t('calendar.alerts.eventDelete.seriesErrorGeneric.description'),
                    variant: 'destructive'
                });
            }
            return;
        }

        // Si es un evento periódico individual, crear un evento puntual cancelado
        if (eventToDelete.type === 'periodic') {
            try {
                const response = await fetch(`${VITE_GATEWAY_API_URL}/calendar/puntual-event`, {
                    method: 'POST',
                    headers: {
                        ...getAuthHeaders(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        calendarId: calendarId,
                        eventDate: eventToDelete.date,
                        startTime: eventToDelete.startTime,
                        endTime: eventToDelete.endTime,
                        subjectId: eventToDelete.subject?.id || null,
                        groupIds: eventToDelete.groups.map(g => g.id),
                        classroomIds: eventToDelete.classrooms.map(c => c.id),
                        comment: eventToDelete.comment || '',
                        cancelled: true
                    })
                });

                const result = await response.json();

                if (result.status === 'success') {
                    triggerAlert({
                        title: t('calendar.alerts.eventDelete.cancelled.title'),
                        description: t('calendar.alerts.eventDelete.cancelled.description'),
                        variant: 'success'
                    });
                    setIsDeleteConfirmationOpen(false);
                    setEventToDelete(undefined);
                    refetch();
                } else {
                    triggerAlert({
                        title: t('calendar.alerts.eventDelete.cancelError.title'),
                        description: result.message || t('calendar.alerts.eventDelete.cancelError.description'),
                        variant: 'destructive'
                    });
                }
            } catch (error) {
                triggerAlert({
                    title: t('calendar.alerts.eventDelete.cancelErrorGeneric.title'),
                    description: error instanceof Error ? error.message : t('calendar.alerts.eventDelete.cancelErrorGeneric.description'),
                    variant: 'destructive'
                });
            }
        } else {
            // Si es un evento puntual, eliminarlo normalmente
            if (!eventToDelete.puntualEventId) return;

            const result = await deletePuntualEvent(eventToDelete.puntualEventId, refetch);

            if (result.success) {
                triggerAlert({
                    title: t('calendar.alerts.eventDelete.deleted.title'),
                    description: t('calendar.alerts.eventDelete.deleted.description'),
                    variant: 'success'
                });
                setIsDeleteConfirmationOpen(false);
                setEventToDelete(undefined);
            } else {
                triggerAlert({
                    title: t('calendar.alerts.eventDelete.deleteError.title'),
                    description: result.message || t('calendar.alerts.eventDelete.deleteError.description'),
                    variant: 'destructive'
                });
            }
        }
    };

    const handleViewEventDetails = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setIsEventDetailsDrawerOpen(true);
    };

    const handleRequestEdit = (event: CalendarEvent) => {
        setEventForRequest(event);
        setIsEventDetailsDrawerOpen(false);
        setIsRequestEditOpen(true);
    };

    const handleRequestCancel = (event: CalendarEvent) => {
        setEventForRequest(event);
        setIsEventDetailsDrawerOpen(false);
        setIsRequestCancelOpen(true);
    };

    const handleRequestReplace = (event: CalendarEvent) => {
        setEventForRequest(event);
        setIsEventDetailsDrawerOpen(false);
        setIsRequestReplaceOpen(true);
    };

    const handleApproveRequest = async (event: CalendarEvent) => {
        if (!event.requestId) {
            triggerAlert({
                title: t('calendar.alerts.request.noRequestId.title'),
                description: t('calendar.alerts.request.noRequestId.description'),
                variant: 'destructive'
            });
            return;
        }

        // Extract the actual request ID
        let actualRequestId = event.requestId;
        if (actualRequestId.startsWith('request-')) {
            actualRequestId = actualRequestId.substring(8);
        }
        if (actualRequestId.length > 36) {
            actualRequestId = actualRequestId.substring(0, 36);
        }

        // Get the full solicitud to extract the config
        try {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/event-request/${actualRequestId}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                triggerAlert({
                    title: t('calendar.alerts.request.approveError.title'),
                    description: 'No se pudo obtener la información de la solicitud',
                    variant: 'destructive'
                });
                return;
            }

            const body = await response.json();
            const solicitud = body.data;

            if (!solicitud || !solicitud.eventData) {
                triggerAlert({
                    title: t('calendar.alerts.request.approveError.title'),
                    description: 'No se pudo obtener la información de la solicitud',
                    variant: 'destructive'
                });
                return;
            }

            // Validar si la solicitud tiene todos los datos necesarios
            if (!canApproveRequestDirectly(solicitud.eventData)) {
                // Faltan datos -> Abrir diálogo de revisión para completar
                setReviewRequestId(actualRequestId);
                setApproveDialogOpen(true);
                return;
            }

            // Use the event data from the solicitud as the config
            const config = solicitud.eventData as RecurrenceConfig;

            const result = await aprobarSolicitud(actualRequestId, config, refetchPendingRequests);

            if (result.success) {
                triggerAlert({
                    title: t('calendar.alerts.request.approved.title'),
                    description: t('calendar.alerts.request.approved.description'),
                    variant: 'default'
                });
                refetch();
            } else {
                triggerAlert({
                    title: t('calendar.alerts.request.approveError.title'),
                    description: result.message || t('calendar.alerts.request.approveError.description'),
                    variant: 'destructive'
                });
            }
        } catch (error) {
            triggerAlert({
                title: t('calendar.alerts.request.approveErrorGeneric.title'),
                description: t('calendar.alerts.request.approveErrorGeneric.description'),
                variant: 'destructive'
            });
        }
    };

    const handleRejectRequest = (event: CalendarEvent) => {
        if (!event.requestId) {
            triggerAlert({
                title: t('calendar.alerts.request.noRequestId.title'),
                description: t('calendar.alerts.request.noRequestId.description'),
                variant: 'destructive'
            });
            return;
        }

        // Extract the actual request ID
        let actualRequestId = event.requestId;
        if (actualRequestId.startsWith('request-')) {
            actualRequestId = actualRequestId.substring(8);
        }
        if (actualRequestId.length > 36) {
            actualRequestId = actualRequestId.substring(0, 36);
        }

        setRejectRequestId(actualRequestId);
        setRejectDialogOpen(true);
    };

    const handleRejectWithComments = async (comments: string) => {
        if (!rejectRequestId) return;

        setIsSubmittingReject(true);

        try {
            const result = await rechazarSolicitud(rejectRequestId, comments, refetchPendingRequests);

            if (result.success) {
                triggerAlert({
                    title: t('calendar.alerts.request.rejected.title'),
                    description: t('calendar.alerts.request.rejected.description'),
                    variant: 'default'
                });
                setRejectDialogOpen(false);
                setRejectRequestId(null);
            } else {
                triggerAlert({
                    title: t('calendar.alerts.request.rejectError.title'),
                    description: result.message || t('calendar.alerts.request.rejectError.description'),
                    variant: 'destructive'
                });
            }
        } catch (error) {
            triggerAlert({
                title: t('calendar.alerts.request.rejectErrorGeneric.title'),
                description: t('calendar.alerts.request.rejectErrorGeneric.description'),
                variant: 'destructive'
            });
        } finally {
            setIsSubmittingReject(false);
        }
    };

    const handleReviewRequest = (event: CalendarEvent) => {
        if (!event.requestId) {
            triggerAlert({
                title: t('calendar.alerts.request.noRequestId.title'),
                description: t('calendar.alerts.request.noRequestId.description'),
                variant: 'destructive'
            });
            return;
        }

        // Extract the actual request ID
        // requestId format: "request-{uuid}" or "request-{uuid}-{date}"
        // We need to extract just the UUID part
        let actualRequestId = event.requestId;

        // Remove 'request-' prefix if present
        if (actualRequestId.startsWith('request-')) {
            actualRequestId = actualRequestId.substring(8); // Remove 'request-'
        }

        // If there's a date suffix (format: -YYYY-MM-DD), remove it
        // UUID format: 8-4-4-4-12 characters (36 total with dashes)
        // So we take the first 36 characters
        if (actualRequestId.length > 36) {
            actualRequestId = actualRequestId.substring(0, 36);
        }

        setReviewRequestId(actualRequestId);
        setApproveDialogOpen(true);
    };

    const handleApproveWithData = async (config: RecurrenceConfig) => {
        if (!requestToReview) return;

        setIsSubmittingApproval(true);

        try {
            const result = await aprobarSolicitud(
                requestToReview.id,
                config,
                () => {
                    refetchPendingRequests();
                    refetch();
                }
            );

            if (result.success) {
                triggerAlert({
                    title: t('calendar.alerts.request.approvedShort.title'),
                    description: t('calendar.alerts.request.approvedShort.description'),
                    variant: 'success'
                });
                setApproveDialogOpen(false);
                setReviewRequestId(null);
                refetchPendingRequests();
                refetch();
            } else {
                triggerAlert({
                    title: t('calendar.alerts.request.approveErrorWithMessage.title'),
                    description: result.message || t('calendar.alerts.request.approveErrorWithMessage.description'),
                    variant: 'destructive'
                });
            }
        } catch {
            triggerAlert({
                title: t('calendar.alerts.request.approveErrorGeneric.title'),
                description: t('calendar.alerts.request.approveErrorGeneric.description'),
                variant: 'destructive'
            });
        } finally {
            setIsSubmittingApproval(false);
        }
    };

    const handleDeleteRequest = async (event: CalendarEvent) => {
        if (!event.requestId) {
            triggerAlert({
                title: t('calendar.alerts.request.noRequestId.title'),
                description: t('calendar.alerts.request.noRequestId.description'),
                variant: 'destructive'
            });
            return;
        }

        const result = await deleteRequest(event.requestId, refetchPendingRequests);

        if (result.success) {
            triggerAlert({
                title: t('calendar.alerts.request.deleted.title'),
                description: t('calendar.alerts.request.deleted.description'),
                variant: 'success'
            });
        } else {
            triggerAlert({
                title: t('calendar.alerts.request.deleteError.title'),
                description: result.message || t('calendar.alerts.request.deleteError.description'),
                variant: 'destructive'
            });
        }
    };

    const handleEditSeries = (event: CalendarEvent) => {
        // Permitir editar series de eventos periódicos (incluye eventos personalizados)
        // Solo excluir eventos festivos (F). Los días lectivos no tienen carácter específico
        if (event.type === 'periodic' && event.eventCharacter &&
            event.eventCharacter !== EVENT_CHARACTERS.FESTIVO) {
            setEventToEdit(event);
            setIsEditEventDialogOpen(true);
            setIsEventDetailsDrawerOpen(false);
        }
    };

    const handleDeleteSeries = (event: CalendarEvent) => {
        setEventToDelete(event);
        setDeleteType('series');
        setIsDeleteConfirmationOpen(true);
    };

    const handleRevertCancellation = (event: CalendarEvent) => {
        setEventToRevert(event);
        setIsRevertConfirmationOpen(true);
    };

    const handleConfirmRevert = async () => {
        if (!eventToRevert || !eventToRevert.puntualEventId) return;

        setIsRevertingEvent(true);

        try {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/calendar/puntual-event/${eventToRevert.puntualEventId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorInfo = { message: errorData.message, data: errorData.data };
                throw errorInfo;
            }

            // Refetch calendar events
            refetch();

            setIsRevertConfirmationOpen(false);
            setEventToRevert(undefined);
        } catch (error: any) {
            console.error('Error al revertir la cancelación:', error);
            const errorMessage = error?.message || 'calendar.alerts.revert.error.generic';
            const errorData = error?.data || {};
            triggerAlert({
                title: t('calendar.alerts.revert.error.title'),
                description: String(t(errorMessage, errorData)),
                variant: 'destructive'
            });
        } finally {
            setIsRevertingEvent(false);
        }
    };

    // Replace event handlers
    const handleReplaceEvent = (event: CalendarEvent) => {
        setEventToReplace(event);
        // Ir directamente al diálogo de reemplazo sin confirmación previa
        setIsReplaceEventDialogOpen(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSaveReplaceEvent = async (config: any) => {
        if (!calendarId) return;

        try {
            // Extraer solo la fecha en formato YYYY-MM-DD de originalDate si viene como timestamp ISO
            const originalDateStr = config.originalDate.includes('T')
                ? config.originalDate.split('T')[0]
                : config.originalDate;

            const requestBody = {
                calendarId: calendarId,
                originalDate: originalDateStr,
                originalStartTime: config.originalStartTime,
                originalEndTime: config.originalEndTime,
                newEventDate: config.newEventDate,
                newStartTime: config.newStartTime,
                newEndTime: config.newEndTime,
                groupIds: config.groupIds,
                classroomIds: config.classroomIds,
                comment: config.comment || ''
            };

            const response = await fetch(`${VITE_GATEWAY_API_URL}/calendar/replace-event`, {
                method: 'POST',
                headers: getAuthHeaders({
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al reemplazar el evento');
            }

            // Refetch calendar events
            refetch();

            setIsReplaceEventDialogOpen(false);
            setEventToReplace(null);
        } catch (error) {
            console.error('Error al reemplazar el evento:', error);
            triggerAlert({
                title: t('calendar.alerts.replace.error.title'),
                description: error instanceof Error ? t(error.message) : t('calendar.alerts.replace.error.description'),
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
                cancelled: false,
                eventType: config.eventType || 'NORMAL'
            };
        } else if (config.frequency === 'custom') {
            // Evento custom periodic - calcular affectedDates
            // Get calendar details from course
            const calendar = course?.calendars?.find(cal => cal.id === calendarId);
            const calendarStart = calendar?.startDate ? new Date(calendar.startDate) : new Date();
            const calendarEnd = calendar?.endDate ? new Date(calendar.endDate) : new Date();

            const affectedDates = calculateAffectedDates({
                calendarStart,
                startDate: new Date(config.customStartDate),
                endDate: calendarEnd,
                interval: config.interval,
                unit: config.customFrequencyUnit,
                weekDays: config.weekDays,
                endsType: config.endsType,
                endsOnDate: config.endsOnDate,
                endsAfterOccurrences: config.endsAfterOccurrences,
                monthlyPatternType: config.monthlyPatternType
            });

            eventData = {
                startTime: config.startTime,
                endTime: config.endTime,
                subjectId: config.subjectId,
                groupIds: config.groupIds,
                classroomIds: config.classroomIds,
                frequency: config.frequency,
                affectedDates: affectedDates,
                planifiedHours: config.endsAfterOccurrences || 0, // Horas planificadas desde endsAfterOccurrences
                interval: config.interval,
                customFrequencyUnit: config.customFrequencyUnit,
                weekDays: config.weekDays,
                monthlyPatternType: config.monthlyPatternType,
                endsType: config.endsType,
                endsOnDate: config.endsOnDate,
                endsAfterOccurrences: config.endsAfterOccurrences,
                customStartDate: config.customStartDate,
                eventType: config.eventType || 'NORMAL'
            };
        } else {
            // Evento recurrente estándar (weekly, biweekly-even, biweekly-odd)
            eventData = {
                startTime: config.startTime,
                endTime: config.endTime,
                subjectId: config.subjectId,
                groupIds: config.groupIds,
                classroomIds: config.classroomIds,
                frequency: config.frequency,
                weekDays: config.weekDays,
                planifiedHours: config.planifiedHours || 0, // Opcional - admin completará si falta
                interval: config.interval,
                endsType: config.endsType,
                endsOnDate: config.endsOnDate,
                endsAfterOccurrences: config.endsAfterOccurrences,
                eventType: config.eventType || 'NORMAL'
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
                title: t('calendar.alerts.request.sent.title'),
                description: t('calendar.alerts.request.sent.description'),
                variant: 'success'
            });
            setIsSolicitudDrawerOpen(false);
            setDragStartDate(null);
            setDragStartTime(null);
            setDragEndTime(null);
        } else {
            triggerAlert({
                title: t('calendar.alerts.request.sendError.title'),
                description: result.message || t('calendar.alerts.request.sendError.description'),
                variant: 'destructive'
            });
        }
    };

    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

    const handleSubmitRequestEdit = async (config: { originalEventId: string; eventType: 'PUNTUAL' | 'PERIODIC'; startTime: string; endTime: string; eventDate?: string; weekDay?: string; comment: string }) => {
        setIsSubmittingRequest(true);
        const result = await crearSolicitud(
            calendarId!,
            config.eventType,
            { startTime: config.startTime, endTime: config.endTime, eventDate: config.eventDate, weekDay: config.weekDay, comment: config.comment },
            () => { refetch(); refetchPendingRequests(); },
            'EDIT',
            config.originalEventId
        );
        setIsSubmittingRequest(false);
        if (result.success) {
            triggerAlert({ title: t('calendar.alerts.request.sent.title'), description: t('calendar.alerts.request.sent.description'), variant: 'success' });
            setIsRequestEditOpen(false);
        } else {
            triggerAlert({ title: t('calendar.alerts.request.sendError.title'), description: result.message || t('calendar.alerts.request.sendError.description'), variant: 'destructive' });
        }
    };

    const handleSubmitRequestCancel = async (config: { originalEventId: string; eventType: 'PUNTUAL' | 'PERIODIC'; comment: string }) => {
        setIsSubmittingRequest(true);
        const result = await crearSolicitud(
            calendarId!,
            config.eventType,
            { comment: config.comment },
            () => { refetch(); refetchPendingRequests(); },
            'CANCEL',
            config.originalEventId
        );
        setIsSubmittingRequest(false);
        if (result.success) {
            triggerAlert({ title: t('calendar.alerts.request.sent.title'), description: t('calendar.alerts.request.sent.description'), variant: 'success' });
            setIsRequestCancelOpen(false);
        } else {
            triggerAlert({ title: t('calendar.alerts.request.sendError.title'), description: result.message || t('calendar.alerts.request.sendError.description'), variant: 'destructive' });
        }
    };

    const handleSubmitRequestReplace = async (config: { originalEventId: string; eventType: 'PUNTUAL' | 'PERIODIC'; originalDate?: string; newEventDate: string; startTime: string; endTime: string; comment: string }) => {
        setIsSubmittingRequest(true);
        const result = await crearSolicitud(
            calendarId!,
            config.eventType,
            { newEventDate: config.newEventDate, startTime: config.startTime, endTime: config.endTime, comment: config.comment, originalDate: config.originalDate },
            () => { refetch(); refetchPendingRequests(); },
            'REPLACE',
            config.originalEventId
        );
        setIsSubmittingRequest(false);
        if (result.success) {
            triggerAlert({ title: t('calendar.alerts.request.sent.title'), description: t('calendar.alerts.request.sent.description'), variant: 'success' });
            setIsRequestReplaceOpen(false);
        } else {
            triggerAlert({ title: t('calendar.alerts.request.sendError.title'), description: result.message || t('calendar.alerts.request.sendError.description'), variant: 'destructive' });
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
            onEditSeries={handleEditSeries}
            onReplaceEvent={handleReplaceEvent}
            onDeleteSeries={handleDeleteSeries}
            onRevertCancellation={handleRevertCancellation}
            onRequestEdit={handleRequestEdit}
            onRequestCancel={handleRequestCancel}
            onRequestReplace={handleRequestReplace}
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
                    backgroundColor: 'rgba(156, 163, 175, 0.20)', // Gris con opacidad más reducida
                }
            };
        }
        return {};
    };

    if (isLoading || isLoadingPending || !localeLoaded) {
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
                    <p className="text-muted-foreground">{t('calendar.loadError')}</p>
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
                                onImportExceptions={() => setIsImportExceptionsDialogOpen(true)}
                                isAdmin={isAdmin}
                            />
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
                                        <span className="hidden sm:inline text-xs">{t('calendar.toolbar.requestEvent')}</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{t('calendar.toolbar.requestEventTooltip')}</TooltipContent>
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
                                    {t('calendar.title', { semester: data.semester })}
                                </h1>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {t('calendar.showingEvents', { count: events.length, total: data.totalEvents })}
                                </p>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {moment(data.startDate).format('DD/MM/YYYY')} - {moment(data.endDate).format('DD/MM/YYYY')}
                            </div>
                        </div>

                        {/* Calendario */}
                        <div className="flex-1 p-4 overflow-hidden bg-white rounded-b-2xl">
                            <Calendar
                                key={i18n.language}
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
                                tooltipAccessor={(event: MyEvent) => event.tooltip || event.title}
                                culture={i18n.language}
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
                                    dayHeaderFormat: (date: Date) => moment(date).format('ddd DD'),
                                    dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
                                        `${moment(start).format('MMMM DD')} – ${moment(end).format('DD')}`,
                                    monthHeaderFormat: (date: Date) => moment(date).format('MMMM YYYY')
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
                                        backgroundColor = '#9ca3af'; // Gris apagado
                                        textColor = '#374151'; // Gris oscuro
                                        opacity = 0.7;
                                        return {
                                            style: {
                                                backgroundColor,
                                                color: textColor,
                                                opacity,
                                                border: '1px solid white',
                                                borderRadius: '10px',
                                                textDecoration: 'line-through',
                                            }
                                        };
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
                                    week: t('calendar.week'),
                                    work_week: t('calendar.workWeek'),
                                    day: t('calendar.day'),
                                    month: t('calendar.month'),
                                    previous: t('calendar.previous'),
                                    next: t('calendar.next'),
                                    today: t('calendar.today'),
                                    agenda: t('calendar.agenda'),
                                    date: t('calendar.date'),
                                    time: t('calendar.time'),
                                    event: t('calendar.event.label'),
                                    noEventsInRange: t('calendar.noEvents'),
                                    showMore: (total) => t('calendar.showMore', { total })
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
                calendarId={calendarId || undefined}
                initialDate={dragStartDate}
                initialStartTime={dragStartTime}
                initialEndTime={dragEndTime}
                lectiveDates={lectiveDates}
                calendarEndDate={data?.endDate}
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
                calendarId={calendarId || undefined}
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
                subjectName={eventToDelete?.subject?.name}
                title={deleteType === 'series' ? t('calendar.dialogs.deleteSeries.title') : undefined}
                description={
                    deleteType === 'series'
                        ? t('calendar.dialogs.deleteSeries.description')
                        : undefined
                }
            />

            {/* Revert Cancellation Confirmation Dialog */}
            <DeleteEventConfirmationDialog
                open={isRevertConfirmationOpen}
                onOpenChange={setIsRevertConfirmationOpen}
                onConfirm={handleConfirmRevert}
                isLoading={isRevertingEvent}
                subjectName={eventToRevert?.subject?.name}
                title={t('calendar.dialogs.revertCancellation.title')}
                description={t('calendar.dialogs.revertCancellation.description')}
            />

            {/* Replace Event Dialog */}
            <ReplaceEventDialog
                open={isReplaceEventDialogOpen}
                onOpenChange={setIsReplaceEventDialogOpen}
                onSave={handleSaveReplaceEvent}
                eventToReplace={eventToReplace}
                lectiveDates={lectiveDates}
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
                    calendarId={calendarId || undefined}
                    initialDate={dragStartDate}
                    initialStartTime={dragStartTime}
                    initialEndTime={dragEndTime}
                    lectiveDates={lectiveDates}
                />
            )}

            {/* Solicitud Editar — Solo para PROFESSOR */}
            {!isAdmin && (
                <RequestEditDialog
                    open={isRequestEditOpen}
                    onOpenChange={setIsRequestEditOpen}
                    onSave={handleSubmitRequestEdit}
                    event={eventForRequest}
                    lectiveDates={lectiveDates}
                    isSubmitting={isSubmittingRequest}
                />
            )}

            {/* Solicitud Cancelar — Solo para PROFESSOR */}
            {!isAdmin && (
                <RequestCancelDialog
                    open={isRequestCancelOpen}
                    onOpenChange={setIsRequestCancelOpen}
                    onSave={handleSubmitRequestCancel}
                    event={eventForRequest}
                    isSubmitting={isSubmittingRequest}
                />
            )}

            {/* Solicitud Reemplazo — Solo para PROFESSOR */}
            {!isAdmin && (
                <RequestReplaceDialog
                    open={isRequestReplaceOpen}
                    onOpenChange={setIsRequestReplaceOpen}
                    onSave={handleSubmitRequestReplace}
                    event={eventForRequest}
                    lectiveDates={lectiveDates}
                    isSubmitting={isSubmittingRequest}
                />
            )}

            {/* Import Exceptions Dialog - Solo para ADMIN */}
            {isAdmin && (
                <ImportExceptionsDialog
                    open={isImportExceptionsDialogOpen}
                    onOpenChange={setIsImportExceptionsDialogOpen}
                    onImport={handleImportExceptions}
                    isLoading={isImportingExceptions}
                />
            )}

            {/* Exception Validation Dialog - Solo para ADMIN */}
            {isAdmin && (
                <ExceptionValidationDialog
                    open={isExceptionValidationDialogOpen}
                    onOpenChange={setIsExceptionValidationDialogOpen}
                    validationResult={exceptionValidationData}
                />
            )}

            {/* Approve Request Dialog - Solo para ADMIN */}
            {isAdmin && (
                <>
                    <ApproveRequestDialog
                        open={approveDialogOpen}
                        onOpenChange={setApproveDialogOpen}
                        solicitud={requestToReview || null}
                        onApprove={handleApproveWithData}
                        isSubmitting={isSubmittingApproval}
                        lectiveDates={lectiveDates}
                        calendarEndDate={data?.endDate}
                    />

                    {/* Reject Request Dialog */}
                    <RejectRequestDialog
                        open={rejectDialogOpen}
                        onOpenChange={setRejectDialogOpen}
                        onReject={handleRejectWithComments}
                        isSubmitting={isSubmittingReject}
                    />
                </>
            )}
        </>
    );
}