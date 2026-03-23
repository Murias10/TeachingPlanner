import { useEffect, useMemo, useState } from "react";
import { usePersistedFilters } from "@/hooks/usePersistedFilters";
import { useFilterCascade } from "@/hooks/useFilterCascade";
import { getActiveValues, applyFilters } from "@/utils/filterUtils";
import { Calendar, momentLocalizer, Components } from "react-big-calendar";
import MonthViewSingleEvent from "./MonthViewSingleEvent";
import moment from "@/utils/momentLocales";
import { format } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useEventsCalendar } from "@/hooks/calendar/useEventsCalendar";
import { usePendingRequestsAsEvents } from "@/hooks/calendar/usePendingRequestsAsEvents";
import { useSubjectsWithGroupsByCalendarId } from "@/hooks/subject/useSubjectsWithGroupsByCalendarId";
import { useCalendarById } from "@/hooks/calendar/useCalendarById";
import { CalendarEvent } from "@/types/CalendarEvent";
import ClassFilter from "@/components/ClassFilter";
import {
    FileText, BookOpen, DoorOpen, Languages, Users, GraduationCap, Tag
} from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useTranslation } from "react-i18next";
import { EventDetailsDrawer } from "@/components/calendar/EventDetailsDrawer";
import { sortAlphabetically, sortGruposByAcronymTypeNumber } from "@/utils/filterSortingUtils";
import { generateGroupId } from "@/utils/groupFormatUtils";
import { CalendarEventWrapper } from "@/components/calendar/CalendarEventWrapper";
import CalendarToolbar from "@/components/calendar/CalendarToolbar";
import CreateEventDialog from "@/components/calendar/CreateEventDialog";
import EditEventDialog from "@/components/calendar/EditEventDialog";
import CreateSolicitudDialog from "@/components/calendar/CreateSolicitudDialog";
import { ImportExceptionsDialog } from "@/components/calendar/ImportExceptionsDialog";
import { ExceptionValidationDialog } from "@/components/calendar/ExceptionValidationDialog";
import { GroupValidationResult } from "@/types/Calendar";
import type { RecurrenceConfig } from "@/types/RecurrenceConfig";
import { DeleteEventConfirmationDialog } from "@/components/calendar/DeleteEventConfirmationDialog";
import ReplaceEventDialog from "@/components/calendar/ReplaceEventDialog";
import RequestEditDialog from "@/components/solicitud/RequestEditDialog";
import RequestCancelDialog from "@/components/solicitud/RequestCancelDialog";
import RequestReplaceDialog from "@/components/solicitud/RequestReplaceDialog";
import ApproveRequestDialog, { canApproveRequestDirectly } from "@/components/solicitud/ApproveRequestDialog";
import RejectRequestDialog from "@/components/calendar/RejectRequestDialog";
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
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { generateGoogleCalendarCSV, downloadCSV } from "@/utils/csvExport";
import { getAuthHeaders } from "@/utils/authHeaders";
import { EVENT_CHARACTERS, EVENT_TYPES, isCustomEventCharacter } from "@/constants/eventCharacters";
import VITE_GATEWAY_API_URL from "@/config/api";

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
    '#FFB3BA', '#FFCAB0', '#FFDAB9', '#B4F0E0', '#D8BFD8', '#DDA0DD',
    '#FFB6C1', '#FFC0CB', '#F08080', '#E6E6FA', '#E1D5E7', '#FFD4A3',
    '#C9E4CA', '#A8D5BA', '#FFD6E8', '#C8D4E6', '#E8C8E8', '#FFE0D4',
    '#D4E8FF', '#E8D4C8',
];

// Map para almacenar asignaturas vistas y sus colores asignados
const subjectColorMap = new Map<string, string>();

// Función para oscurecer un color hex para mejorar el contraste
const darkenColor = (hex: string, amount: number = 0.6): string => {
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);
    const newR = Math.round(r * amount);
    const newG = Math.round(g * amount);
    const newB = Math.round(b * amount);
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

// Función para generar un color único y consistente basado en la asignatura
const getSubjectColor = (subjectAcronym: string | undefined): string => {
    if (!subjectAcronym) return '#9CA3AF';
    if (subjectColorMap.has(subjectAcronym)) {
        return subjectColorMap.get(subjectAcronym)!;
    }
    const colorIndex = subjectColorMap.size % SUBJECT_COLORS.length;
    const assignedColor = SUBJECT_COLORS[colorIndex];
    subjectColorMap.set(subjectAcronym, assignedColor);
    return assignedColor;
};

interface CalendarViewProps {
    calendarId: string;
    headerSlot?: React.ReactNode;
    isQuickAccess?: boolean;
}

export default function CalendarView({ calendarId, headerSlot, isQuickAccess }: CalendarViewProps) {
    const { t, i18n } = useTranslation();
    const { triggerAlert } = useFloatingAlertContext();
    const { user } = useAuth();
    const [localeLoaded, setLocaleLoaded] = useState(false);
    const isAdmin = user?.role === 'ADMIN';
    const isProfessor = user?.role === 'PROFESSOR';

    // Configurar el locale de moment
    useEffect(() => {
        setLocaleLoaded(false);
        const languageCode = i18n.language.split('-')[0];
        moment.locale(languageCode);
        moment.updateLocale(languageCode, {
            week: { dow: 1, doy: 4 }
        });
        setLocaleLoaded(true);
    }, [i18n.language]);

    // Datos del calendario
    const { data, isLoading: isLoadingEvents, refetch } = useEventsCalendar(calendarId);
    const { data: pendingData, isLoading: isLoadingPending, refetch: refetchPendingRequests } = usePendingRequestsAsEvents(calendarId);
    const { data: subjectsData } = useSubjectsWithGroupsByCalendarId(calendarId);
    const { data: calendarInfo } = useCalendarById(calendarId);

    // Mapping de acronym → year
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

    // Fechas lectivas
    const lectiveDates = useMemo(() => {
        return new Set(data?.lectiveDates || []);
    }, [data?.lectiveDates]);

    // Filtros
    const [filters, setFilters] = usePersistedFilters();
    const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);

    // Estado de navegación del calendario
    const [currentDate, setCurrentDate] = useState<Date>(new Date());

    // Constrainir la fecha dentro del rango del calendario
    const constrainDateToCalendar = (date: Date): Date => {
        if (!data?.startDate || !data?.endDate) return date;
        const start = moment(data.startDate);
        const end = moment(data.endDate);
        const target = moment(date);
        if (target.isBefore(start)) return start.toDate();
        if (target.isAfter(end)) return end.toDate();
        return date;
    };

    // Actualizar fecha cuando se cargan los datos
    useEffect(() => {
        if (!data?.startDate || !data?.endDate) return;
        const today = moment();
        const start = moment(data.startDate);
        const end = moment(data.endDate);
        const initialDate = today.isBetween(start, end, 'day', '[]')
            ? today.toDate()
            : start.toDate();
        setCurrentDate(initialDate);
    }, [data?.startDate, data?.endDate]);

    const handleNavigate = (newDate: Date) => {
        setCurrentDate(constrainDateToCalendar(newDate));
    };

    // Estado de dialogs
    const [isCreateEventDialogOpen, setIsCreateEventDialogOpen] = useState(false);
    const [dragStartDate, setDragStartDate] = useState<string | null>(null);
    const [dragStartTime, setDragStartTime] = useState<string | null>(null);
    const [dragEndTime, setDragEndTime] = useState<string | null>(null);
    const [isEditEventDialogOpen, setIsEditEventDialogOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
    const [isEventDetailsDrawerOpen, setIsEventDetailsDrawerOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>(undefined);
    const [isRequestEditOpen, setIsRequestEditOpen] = useState(false);
    const [isRequestCancelOpen, setIsRequestCancelOpen] = useState(false);
    const [isRequestReplaceOpen, setIsRequestReplaceOpen] = useState(false);
    const [eventForRequest, setEventForRequest] = useState<CalendarEvent | undefined>(undefined);
    const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<CalendarEvent | undefined>(undefined);
    const [deleteType, setDeleteType] = useState<'event' | 'series'>('event');
    const [isRevertConfirmationOpen, setIsRevertConfirmationOpen] = useState(false);
    const [eventToRevert, setEventToRevert] = useState<CalendarEvent | undefined>(undefined);
    const [isRevertingEvent, setIsRevertingEvent] = useState(false);
    const [isReplaceEventDialogOpen, setIsReplaceEventDialogOpen] = useState(false);
    const [eventToReplace, setEventToReplace] = useState<CalendarEvent | null>(null);
    const [isSolicitudDrawerOpen, setIsSolicitudDrawerOpen] = useState(false);
    const [isImportExceptionsDialogOpen, setIsImportExceptionsDialogOpen] = useState(false);
    const [exceptionValidationData, setExceptionValidationData] = useState<GroupValidationResult | null>(null);
    const [isExceptionValidationDialogOpen, setIsExceptionValidationDialogOpen] = useState(false);
    const [reviewRequestId, setReviewRequestId] = useState<string | null>(null);
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectRequestId, setRejectRequestId] = useState<string | null>(null);
    const [isSubmittingReject, setIsSubmittingReject] = useState(false);
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

    // Hooks de datos
    const { data: requestToReview } = useGetSolicitudById(reviewRequestId);
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

    // Opciones de filtro con crossfilter
    const filterOptions = useMemo(() => {
        if (allEvents.length === 0) return [];

        const yearLabelFn = (year: number) => getYearLabel(year, t);
        const forCurso      = applyFilters(allEvents, filters, subjectYearMap, yearLabelFn, ['curso']);
        const forAsignatura = applyFilters(allEvents, filters, subjectYearMap, yearLabelFn, ['asignatura']);
        const forTipoGrupo  = applyFilters(allEvents, filters, subjectYearMap, yearLabelFn, ['tipoGrupo']);
        const forGrupos     = applyFilters(allEvents, filters, subjectYearMap, yearLabelFn, ['grupos']);
        const forAula       = applyFilters(allEvents, filters, subjectYearMap, yearLabelFn, ['aula']);
        const forIdioma     = applyFilters(allEvents, filters, subjectYearMap, yearLabelFn, ['idioma']);
        const forTipoEvento = applyFilters(allEvents, filters, subjectYearMap, yearLabelFn, ['tipoEvento']);

        const uniqueYears = new Set<number>();
        const uniqueSubjects = new Set<string>();
        const subjectTooltipMap = new Map<string, string>();
        const uniqueTypes = new Set<string>();
        const uniqueGroups = new Set<string>();
        const uniqueClassrooms = new Set<string>();
        const uniqueLanguages = new Set<string>();
        const uniqueEventTypes = new Set<string>();

        forCurso.forEach(event => {
            if (event.subject?.acronym) {
                const year = subjectYearMap.get(event.subject.acronym);
                if (year !== undefined && year !== null) uniqueYears.add(year);
            }
        });
        forAsignatura.forEach(event => {
            if (event.subject?.acronym) {
                uniqueSubjects.add(event.subject.acronym);
                if (event.subject.name) subjectTooltipMap.set(event.subject.acronym, event.subject.name);
            }
        });
        forTipoGrupo.forEach(event => {
            event.groups.forEach(group => uniqueTypes.add(group.type));
        });
        forGrupos.forEach(event => {
            if (!event.subject?.acronym) return;
            event.groups.forEach(group => {
                const groupId = generateGroupId(event.subject!.acronym, group.number, group.type, group.language === 'EN');
                uniqueGroups.add(groupId);
            });
        });
        forAula.forEach(event => {
            event.classrooms.forEach(classroom => uniqueClassrooms.add(classroom.code));
        });
        forIdioma.forEach(event => {
            event.groups.forEach(group => uniqueLanguages.add(group.language));
        });
        forTipoEvento.forEach(event => {
            if (event.cancelled) uniqueEventTypes.add('CANCELADO');
            else if (event.eventType) uniqueEventTypes.add(event.eventType);
        });

        const yearLabels = Array.from(uniqueYears).sort().map(year => getYearLabel(year, t));

        return [
            { category: 'curso' as const, label: t('calendar.filters.year'), options: yearLabels, icon: GraduationCap },
            { category: 'asignatura' as const, label: t('calendar.filters.subject'), options: sortAlphabetically(Array.from(uniqueSubjects)), optionTooltips: Object.fromEntries(subjectTooltipMap), icon: BookOpen },
            { category: 'tipoGrupo' as const, label: t('calendar.filters.groupType'), options: sortAlphabetically(Array.from(uniqueTypes)), icon: Users },
            { category: 'grupos' as const, label: t('calendar.filters.groups'), options: sortGruposByAcronymTypeNumber(Array.from(uniqueGroups)), icon: Users },
            { category: 'aula' as const, label: t('calendar.filters.classroom'), options: sortAlphabetically(Array.from(uniqueClassrooms)), icon: DoorOpen },
            { category: 'idioma' as const, label: t('calendar.filters.language'), options: sortAlphabetically(Array.from(uniqueLanguages)), icon: Languages },
            { category: 'tipoEvento' as const, label: t('calendar.filters.eventType'), options: Array.from(uniqueEventTypes), icon: Tag }
        ];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allEvents, filters, subjectYearMap, t]);

    useFilterCascade(filters, filterOptions, setFilters);

    // Eventos filtrados
    const filteredEvents = useMemo(() => {
        if (allEvents.length === 0) return [];

        const activeTipoEvento = getActiveValues('tipoEvento', filters, filterOptions);
        const activeTipoGrupo  = getActiveValues('tipoGrupo', filters, filterOptions);
        const activeAsignatura = getActiveValues('asignatura', filters, filterOptions);
        const activeGrupos     = getActiveValues('grupos', filters, filterOptions);
        const activeAula       = getActiveValues('aula', filters, filterOptions);
        const activeIdioma     = getActiveValues('idioma', filters, filterOptions);
        const activeCurso      = getActiveValues('curso', filters, filterOptions);

        return allEvents.filter(event => {
            if (activeTipoEvento.length > 0) {
                const isCancelled = event.cancelled;
                const matchesCancelado = isCancelled && activeTipoEvento.includes('CANCELADO');
                const matchesEventType = !isCancelled && activeTipoEvento.includes(event.eventType);
                if (!matchesCancelado && !matchesEventType) return false;
            }

            const hasActiveFilters = [activeTipoGrupo, activeAsignatura, activeGrupos, activeAula, activeIdioma, activeCurso]
                .some(arr => arr.length > 0);
            if (!hasActiveFilters) return true;

            if (activeTipoGrupo.length > 0) {
                if (!event.groups.some(group => activeTipoGrupo.includes(group.type))) return false;
            }
            if (activeAsignatura.length > 0) {
                if (!event.subject?.acronym || !activeAsignatura.includes(event.subject.acronym)) return false;
            }
            if (activeGrupos.length > 0) {
                const hasMatchingGroup = event.groups.some(group => {
                    const groupId = generateGroupId(event.subject?.acronym || '', group.number, group.type, group.language === 'EN');
                    return activeGrupos.includes(groupId);
                });
                if (!hasMatchingGroup) return false;
            }
            if (activeAula.length > 0) {
                if (!event.classrooms.some(classroom => activeAula.includes(classroom.code))) return false;
            }
            if (activeIdioma.length > 0) {
                if (!event.groups.some(group => activeIdioma.includes(group.language))) return false;
            }
            if (activeCurso.length > 0) {
                if (!event.subject?.acronym) return false;
                const subjectYear = subjectYearMap.get(event.subject.acronym);
                if (subjectYear === undefined) return false;
                const yearLabel = getYearLabel(subjectYear, t);
                if (!activeCurso.includes(yearLabel)) return false;
            }

            return true;
        });
    }, [allEvents, filters, filterOptions, subjectYearMap, t]);

    // Transformar al formato de react-big-calendar
    const events: MyEvent[] = useMemo(() => {
        return filteredEvents.map((event) => {
            const eventDate = moment(event.date).format('YYYY-MM-DD');
            const startMoment = moment(`${eventDate}T${event.startTime}`);
            const endMoment = startMoment.clone().add(event.duration, 'hours');
            const timeStr = startMoment.format('HH:mm');
            const classroomStr = event.classrooms.length > 0
                ? event.classrooms.map(c => c.code).join(', ')
                : 'Sin aula asignada';

            if (event.eventType === 'BLOCKER') {
                const tooltip = `IND\n${classroomStr}\n${event.startTime.substring(0, 5)} - ${event.endTime.substring(0, 5)}`;
                return {
                    title: `IND · ${classroomStr} · ${timeStr}`,
                    start: startMoment.toDate(),
                    end: endMoment.toDate(),
                    resource: event,
                    tooltip
                };
            }

            const eventPrefixMap: Record<string, string> = {
                [EVENT_TYPES.EVALUACION]: 'EV · ',
                [EVENT_TYPES.REVISION]: 'RE · ',
                [EVENT_TYPES.OTRO]: 'OT · ',
            };
            const eventPrefix = eventPrefixMap[event.eventType] || '';

            const groupName = `${event.subject?.acronym || 'Sin asignatura'}.${event.groups.map(g => {
                const lang = g.language === 'EN' ? 'I-' : '';
                return `${g.type}.${lang}${g.number}`;
            }).join(', ')}`;

            const tooltipGroupPart = eventPrefix ? `${eventPrefix}${groupName}` : groupName;
            const tooltip = `${event.subject?.name || 'Sin asignatura'}\n${tooltipGroupPart}\n${event.startTime.substring(0, 5)} - ${event.endTime.substring(0, 5)}\n${classroomStr}`;

            return {
                title: `${eventPrefix}${groupName} · ${timeStr}`,
                start: startMoment.toDate(),
                end: endMoment.toDate(),
                resource: event,
                tooltip
            };
        });
    }, [filteredEvents]);

    // Limpiar tooltips duplicados de react-big-calendar
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

        const observer = new MutationObserver(() => { cleanTooltips(); });
        const calendarElement = document.querySelector('.rbc-calendar');
        if (calendarElement) {
            observer.observe(calendarElement, { childList: true, subtree: true, attributes: false, characterData: false });
            cleanTooltips();
        }
        return () => { observer.disconnect(); };
    }, [events, currentDate]);

    // Rango de horas
    const minHour = 9;
    const maxHour = 21;
    const minDate = data?.startDate
        ? moment(data.startDate).hour(minHour).minute(0).toDate()
        : moment().hour(minHour).minute(0).toDate();
    const maxDate = data?.endDate
        ? moment(data.endDate).hour(maxHour).minute(0).toDate()
        : moment().hour(maxHour).minute(0).toDate();

    // Handlers de exportación
    const handleExportCalendar = async () => {
        try {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/calendar/${calendarId}/export`);
            if (!response.ok) throw new Error(`Error exporting calendar: ${response.status}`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `${calendarId}.zip`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch) filename = filenameMatch[1];
            }
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting calendar:', error);
        }
    };

    const handleImportExceptions = async (file: File, mode: 'add' | 'replace') => {
        try {
            await importExceptionsAsync({ calendarId, file, mode });
            await refetch();
        } catch (error) {
            console.error('Error importing exceptions:', error);
        }
    };

    const handleExportToCSV = () => {
        try {
            const eventsToExport = filteredEvents.filter(event => !event.isPending && !event.cancelled);
            if (eventsToExport.length === 0) {
                triggerAlert({
                    title: t('calendar.alerts.export.noEvents.title'),
                    description: t('calendar.alerts.export.noEvents.description'),
                    variant: 'warning'
                });
                return;
            }
            const csvContent = generateGoogleCalendarCSV(eventsToExport);
            const filename = `${calendarId}_calendar.csv`;
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

    // Handlers de eventos
    const handleCreateEvent = () => {
        setDragStartDate(null);
        setDragStartTime(null);
        setDragEndTime(null);
        setIsCreateEventDialogOpen(true);
    };

    const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
        if (!isAdmin && user?.role !== 'PROFESSOR') return;

        // Bloquear zona all-day (slots fuera del rango horario válido tienen hora 00:00)
        if (slotInfo.start.getHours() < minHour) return;

        const selectedDate = moment(slotInfo.start).format('YYYY-MM-DD');
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

        if (isAdmin) {
            setIsCreateEventDialogOpen(true);
        } else if (isProfessor) {
            setIsSolicitudDrawerOpen(true);
        }
    };

    const handleSaveEvent = (config: RecurrenceConfig) => {
        const eventType = config.eventType || 'NORMAL';
        const isSpecial = eventType !== 'NORMAL';

        if (eventType !== 'BLOCKER' && (!config.groupIds || config.groupIds.length === 0)) {
            triggerAlert({ title: t('calendar.alerts.validation.noGroups.title'), description: t('calendar.alerts.validation.noGroups.description'), variant: 'destructive' });
            return;
        }
        if (!config.classroomIds || config.classroomIds.length === 0) {
            triggerAlert({ title: t('calendar.alerts.validation.noClassrooms.title'), description: t('calendar.alerts.validation.noClassrooms.description'), variant: 'destructive' });
            return;
        }

        // Eventos puntuales
        if (config.frequency === 'no-repeat') {
            if (!config.eventDate || (!config.subjectId && eventType !== 'BLOCKER')) {
                triggerAlert({ title: t('calendar.alerts.validation.noDateOrSubject.title'), description: t('calendar.alerts.validation.noDateOrSubject.description'), variant: 'destructive' });
                return;
            }
            if (!lectiveDates.has(config.eventDate)) {
                triggerAlert({ title: t('calendar.alerts.nonLectiveDay.title'), description: t('calendar.alerts.nonLectiveDay.description'), variant: 'destructive' });
                return;
            }
            const formattedDate = new Date(config.eventDate + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
            const startTimeShort = config.startTime.substring(0, 5);
            const endTimeShort = config.endTime.substring(0, 5);

            createPuntualEvent(
                { calendarId, eventDate: config.eventDate, startTime: config.startTime, endTime: config.endTime, subjectId: config.subjectId, groupIds: config.groupIds, classroomIds: config.classroomIds || [], comment: config.comment, eventType },
                {
                    onSuccess: () => {
                        triggerAlert({ title: t('alerts.puntualEvent.success.title'), description: t('alerts.puntualEvent.success.description', { date: formattedDate, startTime: startTimeShort, endTime: endTimeShort }), variant: 'success' });
                        setIsCreateEventDialogOpen(false);
                        refetch();
                    },
                    onError: (error: Error & { statusCode?: number; conflictData?: { groupNames: string[]; classroomNames: string[] }[] }) => {
                        const first = error.conflictData?.[0];
                        let description: string;
                        if (first) {
                            const groupNames = first.groupNames?.join(', ') || '';
                            const classroomNames = first.classroomNames?.join(', ') || '';
                            if (groupNames && classroomNames) description = t('alerts.puntualEvent.error.shared_both_detail', { date: formattedDate, startTime: startTimeShort, endTime: endTimeShort, groupNames, classroomNames });
                            else if (groupNames) description = t('alerts.puntualEvent.error.shared_group_detail', { date: formattedDate, startTime: startTimeShort, endTime: endTimeShort, names: groupNames });
                            else description = t('alerts.puntualEvent.error.shared_classroom_detail', { date: formattedDate, startTime: startTimeShort, endTime: endTimeShort, names: classroomNames });
                        } else {
                            description = t('alerts.puntualEvent.error.shared_group_detail', { date: formattedDate, startTime: startTimeShort, endTime: endTimeShort, names: '' });
                        }
                        triggerAlert({ title: t('alerts.puntualEvent.error.title'), description, variant: 'destructive' });
                    }
                }
            );
            return;
        }

        // Eventos periódicos semanales/quincenales
        if (config.frequency === 'weekly' || config.frequency === 'biweekly-even' || config.frequency === 'biweekly-odd') {
            if (!config.weekDays || config.weekDays.length === 0) {
                triggerAlert({ title: t('calendar.alerts.validation.noWeekDay.title'), description: t('calendar.alerts.validation.noWeekDay.description'), variant: 'destructive' });
                return;
            }
            if (!isSpecial && config.planifiedHours <= 0) {
                triggerAlert({ title: t('calendar.alerts.validation.noPlanifiedHours.title'), description: t('calendar.alerts.validation.noPlanifiedHours.description'), variant: 'destructive' });
                return;
            }

            let createdCount = 0;
            let errorCount = 0;
            const totalDays = config.weekDays.length;
            const weekDayNames: Record<string, string> = { 'L': 'lunes', 'M': 'martes', 'X': 'miércoles', 'J': 'jueves', 'V': 'viernes', 'S': 'sábado', 'D': 'domingo' };
            const weekDaysStr = config.weekDays.map((d: string) => weekDayNames[d] || d).join(', ');

            const createNextEvent = (index: number) => {
                if (index >= totalDays) {
                    if (errorCount === 0) {
                        triggerAlert({ title: t('calendar.alerts.periodicEvent.success.title'), description: t('calendar.alerts.periodicEvent.success.description', { count: createdCount, weekDays: weekDaysStr, startTime: config.startTime.substring(0, 5), endTime: config.endTime.substring(0, 5) }), variant: 'success' });
                        setIsCreateEventDialogOpen(false);
                        refetch();
                    }
                    return;
                }
                createPeriodicEvent(
                    { calendarId, weekDay: config.weekDays[index], startTime: config.startTime, endTime: config.endTime, planifiedHours: config.planifiedHours, eventCharacter: config.eventCharacter, groupIds: config.groupIds, classroomIds: config.classroomIds || [], eventType },
                    {
                        onSuccess: () => { createdCount++; createNextEvent(index + 1); },
                        onError: (error: Error & { statusCode?: number; conflictData?: { groupNames: string[]; classroomNames: string[] }[] }) => {
                            errorCount++;
                            if (index === 0) {
                                const isConflict = error.statusCode === 409;
                                let description: string;
                                const first = error.conflictData?.[0];
                                const currentWeekDay = weekDayNames[config.weekDays[index]] || config.weekDays[index];
                                const startTimeShortP = config.startTime.substring(0, 5);
                                const endTimeShortP = config.endTime.substring(0, 5);
                                if (isConflict && first) {
                                    const groupNames = first.groupNames?.join(', ') || '';
                                    const classroomNames = first.classroomNames?.join(', ') || '';
                                    if (groupNames && classroomNames) description = t('alerts.puntualEvent.error.shared_both_detail', { date: currentWeekDay, startTime: startTimeShortP, endTime: endTimeShortP, groupNames, classroomNames });
                                    else if (groupNames) description = t('alerts.puntualEvent.error.shared_group_detail', { date: currentWeekDay, startTime: startTimeShortP, endTime: endTimeShortP, names: groupNames });
                                    else description = t('alerts.puntualEvent.error.shared_classroom_detail', { date: currentWeekDay, startTime: startTimeShortP, endTime: endTimeShortP, names: classroomNames });
                                } else {
                                    description = t('calendar.alerts.periodicEvent.error.description', { weekDay: currentWeekDay, startTime: startTimeShortP, endTime: endTimeShortP });
                                }
                                triggerAlert({ title: t('calendar.alerts.periodicEvent.error.title'), description, variant: 'destructive' });
                            } else {
                                createNextEvent(index + 1);
                            }
                        }
                    }
                );
            };
            createNextEvent(0);
            return;
        }

        // Eventos periódicos custom
        if (config.frequency === 'custom') {
            if (!config.customStartDate || !config.customFrequencyUnit || config.interval <= 0) {
                triggerAlert({ title: t('calendar.alerts.validation.customFrequencyIncomplete.title'), description: t('calendar.alerts.validation.customFrequencyIncomplete.description'), variant: 'destructive' });
                return;
            }
            if (config.customFrequencyUnit === 'week' && (!config.weekDays || config.weekDays.length === 0)) {
                triggerAlert({ title: t('calendar.alerts.validation.noWeekDay.title'), description: t('calendar.alerts.validation.noWeekDay.description'), variant: 'destructive' });
                return;
            }
            if (!isSpecial && config.planifiedHours <= 0) {
                triggerAlert({ title: t('calendar.alerts.validation.noPlanifiedHours.title'), description: t('calendar.alerts.validation.noPlanifiedHours.description'), variant: 'destructive' });
                return;
            }
            if (!calendarInfo?.startDate || !calendarInfo?.endDate) {
                triggerAlert({ title: t('calendar.alerts.validation.noCalendarInfo.title'), description: t('calendar.alerts.validation.noCalendarInfo.description'), variant: 'destructive' });
                return;
            }

            let affectedDates: string[];
            try {
                const calendarStartDate = new Date(calendarInfo.startDate);
                const customStartDate = new Date(config.customStartDate);
                const calendarEndDate = new Date(calendarInfo.endDate);
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
                    triggerAlert({ title: t('calendar.alerts.validation.noDates.title'), description: t('calendar.alerts.validation.noDates.description'), variant: 'destructive' });
                    return;
                }
                const summary = getAffectedDatesSummary(affectedDates);
                console.log('[Custom Pattern] Fechas afectadas:', summary);
            } catch (error) {
                triggerAlert({ title: 'Error', description: error instanceof Error ? error.message : 'Error al calcular las fechas afectadas', variant: 'destructive' });
                return;
            }

            createCustomPeriodicEvent(
                { calendarId, affectedDates: affectedDates!, startTime: config.startTime, endTime: config.endTime, planifiedHours: config.planifiedHours, groupIds: config.groupIds, classroomIds: config.classroomIds || [], eventType },
                {
                    onSuccess: (responseData) => {
                        const summary = getAffectedDatesSummary(affectedDates!);
                        setIsCreateEventDialogOpen(false);
                        refetch();
                        triggerAlert({ title: t('calendar.alerts.customPeriodicEvent.created.title'), description: t('calendar.alerts.customPeriodicEvent.created.description', { count: responseData.data.events.length, startTime: config.startTime.substring(0, 5), endTime: config.endTime.substring(0, 5), dates: summary.totalDates }), variant: 'success' });
                    },
                    onError: () => {
                        triggerAlert({ title: t('calendar.alerts.customPeriodicEvent.error.title'), description: t('calendar.alerts.customPeriodicEvent.error.description', { startTime: config.startTime.substring(0, 5), endTime: config.endTime.substring(0, 5) }), variant: 'destructive' });
                    }
                }
            );
            return;
        }

        triggerAlert({ title: t('calendar.alerts.validation.notImplemented.title'), description: t('calendar.alerts.validation.notImplemented.description'), variant: 'default' });
    };

    const handleUpdateEvent = async (_eventId: string, config: RecurrenceConfig) => {
        if (!eventToEdit) return;

        if (eventToEdit.type === 'periodic' && eventToEdit.periodicEventId) {
            const isCustomPeriodicEvent = isCustomEventCharacter(eventToEdit.eventCharacter);

            if (isCustomPeriodicEvent) {
                try {
                    await updateCustomPeriodicEventAsync({
                        eventCharacter: eventToEdit.eventCharacter!,
                        calendarId,
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

            updatePeriodicEvent(
                { eventId: eventToEdit.periodicEventId, startTime: config.startTime, endTime: config.endTime, weekDay: config.weekDays && config.weekDays.length > 0 ? config.weekDays[0] : undefined, classroomIds: config.classroomIds || [], groupIds: config.groupIds, planifiedHours: config.planifiedHours, eventType: config.eventType },
                {
                    onSuccess: () => {
                        const weekDayNames: Record<string, string> = { 'L': 'lunes', 'M': 'martes', 'X': 'miércoles', 'J': 'jueves', 'V': 'viernes', 'S': 'sábado', 'D': 'domingo' };
                        const weekDayStr = weekDayNames[config.weekDays?.[0]] || config.weekDays?.[0] || '';
                        setIsEditEventDialogOpen(false);
                        setEventToEdit(null);
                        refetch();
                        triggerAlert({ title: t('calendar.alerts.periodicEvent.updated.title'), description: t('calendar.alerts.periodicEvent.updated.description', { weekDay: weekDayStr, startTime: config.startTime.substring(0, 5), endTime: config.endTime.substring(0, 5) }), variant: 'success' });
                    },
                    onError: (error: Error & { statusCode?: number; conflictData?: { groupNames: string[]; classroomNames: string[] }[] }) => {
                        const weekDayNames: Record<string, string> = { 'L': 'lunes', 'M': 'martes', 'X': 'miércoles', 'J': 'jueves', 'V': 'viernes', 'S': 'sábado', 'D': 'domingo' };
                        const weekDayStr = weekDayNames[config.weekDays?.[0]] || config.weekDays?.[0] || '';
                        const startTimeShort = config.startTime.substring(0, 5);
                        const endTimeShort = config.endTime.substring(0, 5);
                        const first = error.conflictData?.[0];
                        let description: string;
                        if (first) {
                            const groupNames = first.groupNames?.join(', ') || '';
                            const classroomNames = first.classroomNames?.join(', ') || '';
                            if (groupNames && classroomNames) description = t('calendar.alerts.periodicEvent.updateError.conflictBoth', { weekDay: weekDayStr, startTime: startTimeShort, endTime: endTimeShort, groupNames, classroomNames });
                            else if (groupNames) description = t('calendar.alerts.periodicEvent.updateError.conflictGroup', { weekDay: weekDayStr, startTime: startTimeShort, endTime: endTimeShort, names: groupNames });
                            else description = t('calendar.alerts.periodicEvent.updateError.conflictClassroom', { weekDay: weekDayStr, startTime: startTimeShort, endTime: endTimeShort, names: classroomNames });
                        } else {
                            description = t('calendar.alerts.periodicEvent.updateError.description', { weekDay: weekDayStr, startTime: startTimeShort, endTime: endTimeShort });
                        }
                        triggerAlert({ title: t('calendar.alerts.periodicEvent.updateError.title'), description, variant: 'destructive' });
                    }
                }
            );
            return;
        }

        if (eventToEdit.type === 'puntual' && eventToEdit.puntualEventId && config.eventDate) {
            const eventDateOnly = config.eventDate.split('T')[0];
            const formattedDate = new Date(eventDateOnly + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
            updatePuntualEvent(
                { eventId: eventToEdit.puntualEventId, eventDate: eventDateOnly, startTime: config.startTime, endTime: config.endTime, subjectId: config.subjectId, groupIds: config.groupIds, classroomIds: config.classroomIds || [], comment: config.comment, eventType: config.eventType },
                {
                    onSuccess: () => {
                        setIsEditEventDialogOpen(false);
                        setEventToEdit(null);
                        refetch();
                        triggerAlert({ title: t('calendar.alerts.eventUpdate.success.title'), description: t('calendar.alerts.eventUpdate.success.description', { date: formattedDate, startTime: config.startTime.substring(0, 5), endTime: config.endTime.substring(0, 5) }), variant: 'success' });
                    },
                    onError: (error: Error & { statusCode?: number; conflictData?: { groupNames: string[]; classroomNames: string[] }[] }) => {
                        const startTimeShort = config.startTime.substring(0, 5);
                        const endTimeShort = config.endTime.substring(0, 5);
                        const first = error.conflictData?.[0];
                        let description: string;
                        if (first) {
                            const groupNames = first.groupNames?.join(', ') || '';
                            const classroomNames = first.classroomNames?.join(', ') || '';
                            if (groupNames && classroomNames) description = t('calendar.alerts.eventUpdate.error.conflictBoth', { date: formattedDate, startTime: startTimeShort, endTime: endTimeShort, groupNames, classroomNames });
                            else if (groupNames) description = t('calendar.alerts.eventUpdate.error.conflictGroup', { date: formattedDate, startTime: startTimeShort, endTime: endTimeShort, names: groupNames });
                            else description = t('calendar.alerts.eventUpdate.error.conflictClassroom', { date: formattedDate, startTime: startTimeShort, endTime: endTimeShort, names: classroomNames });
                        } else {
                            description = t('calendar.alerts.eventUpdate.error.description', { date: formattedDate, startTime: startTimeShort, endTime: endTimeShort });
                        }
                        triggerAlert({ title: t('calendar.alerts.eventUpdate.error.title'), description, variant: 'destructive' });
                    }
                }
            );
        }
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
        setEventToDelete(event);
        setDeleteType('event');
        setIsDeleteConfirmationOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!eventToDelete) return;

        if (deleteType === 'series') {
            if (!eventToDelete.periodicEventId) {
                triggerAlert({ title: t('calendar.alerts.eventDelete.noPeriodicId.title'), description: t('calendar.alerts.eventDelete.noPeriodicId.description'), variant: 'destructive' });
                return;
            }
            try {
                const response = await fetch(`${VITE_GATEWAY_API_URL}/calendar/periodic-event/${eventToDelete.periodicEventId}`, {
                    method: 'DELETE',
                    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
                });
                const result = await response.json();
                if (result.status === 'success') {
                    triggerAlert({ title: t('calendar.alerts.eventDelete.seriesDeleted.title'), description: t('calendar.alerts.eventDelete.seriesDeleted.description', { weekDay: eventToDelete.weekDay || '', startTime: eventToDelete.startTime.substring(0, 5), endTime: eventToDelete.endTime.substring(0, 5) }), variant: 'success' });
                    setIsDeleteConfirmationOpen(false);
                    setEventToDelete(undefined);
                    refetch();
                } else {
                    triggerAlert({ title: t('calendar.alerts.eventDelete.seriesError.title'), description: result.message || t('calendar.alerts.eventDelete.seriesError.description'), variant: 'destructive' });
                }
            } catch (error) {
                triggerAlert({ title: t('calendar.alerts.eventDelete.seriesErrorGeneric.title'), description: error instanceof Error ? error.message : t('calendar.alerts.eventDelete.seriesErrorGeneric.description'), variant: 'destructive' });
            }
            return;
        }

        if (eventToDelete.type === 'periodic') {
            try {
                const response = await fetch(`${VITE_GATEWAY_API_URL}/calendar/puntual-event`, {
                    method: 'POST',
                    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        calendarId,
                        eventDate: eventToDelete.date,
                        startTime: eventToDelete.startTime,
                        endTime: eventToDelete.endTime,
                        subjectId: eventToDelete.subject?.id || null,
                        groupIds: eventToDelete.groups.map(g => g.id),
                        classroomIds: eventToDelete.classrooms.map(c => c.id),
                        comment: eventToDelete.comment || '',
                        cancelled: true,
                        periodicEventSourceId: eventToDelete.periodicEventId || null
                    })
                });
                const result = await response.json();
                if (result.status === 'success') {
                    const cancelledDate = new Date(eventToDelete.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
                    triggerAlert({ title: t('calendar.alerts.eventDelete.cancelled.title'), description: t('calendar.alerts.eventDelete.cancelled.description', { date: cancelledDate, weekDay: eventToDelete.weekDay || '', startTime: eventToDelete.startTime.substring(0, 5), endTime: eventToDelete.endTime.substring(0, 5) }), variant: 'success' });
                    setIsDeleteConfirmationOpen(false);
                    setEventToDelete(undefined);
                    refetch();
                } else {
                    triggerAlert({ title: t('calendar.alerts.eventDelete.cancelError.title'), description: result.message || t('calendar.alerts.eventDelete.cancelError.description'), variant: 'destructive' });
                }
            } catch (error) {
                triggerAlert({ title: t('calendar.alerts.eventDelete.cancelErrorGeneric.title'), description: error instanceof Error ? error.message : t('calendar.alerts.eventDelete.cancelErrorGeneric.description'), variant: 'destructive' });
            }
        } else {
            if (!eventToDelete.puntualEventId) return;
            const result = await deletePuntualEvent(eventToDelete.puntualEventId, refetch);
            if (result.success) {
                const deletedDate = new Date(eventToDelete.date.substring(0, 10) + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
                triggerAlert({ title: t('calendar.alerts.eventDelete.deleted.title'), description: t('calendar.alerts.eventDelete.deleted.description', { date: deletedDate, startTime: eventToDelete.startTime.substring(0, 5), endTime: eventToDelete.endTime.substring(0, 5) }), variant: 'success' });
                setIsDeleteConfirmationOpen(false);
                setEventToDelete(undefined);
            } else {
                triggerAlert({ title: t('calendar.alerts.eventDelete.deleteError.title'), description: result.message || t('calendar.alerts.eventDelete.deleteError.description'), variant: 'destructive' });
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

    const extractRequestId = (requestId: string): string => {
        let actualId = requestId;
        if (actualId.startsWith('request-')) actualId = actualId.substring(8);
        if (actualId.length > 36) actualId = actualId.substring(0, 36);
        return actualId;
    };

    const handleApproveRequest = async (event: CalendarEvent) => {
        if (!event.requestId) {
            triggerAlert({ title: t('calendar.alerts.request.noRequestId.title'), description: t('calendar.alerts.request.noRequestId.description'), variant: 'destructive' });
            return;
        }
        const actualRequestId = extractRequestId(event.requestId);
        try {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/event-request/${actualRequestId}`, { headers: getAuthHeaders() });
            if (!response.ok) {
                triggerAlert({ title: t('calendar.alerts.request.approveError.title'), description: 'No se pudo obtener la información de la solicitud', variant: 'destructive' });
                return;
            }
            const body = await response.json();
            const solicitud = body.data;
            if (!solicitud?.eventData) {
                triggerAlert({ title: t('calendar.alerts.request.approveError.title'), description: 'No se pudo obtener la información de la solicitud', variant: 'destructive' });
                return;
            }
            if (!canApproveRequestDirectly(solicitud.eventData)) {
                setReviewRequestId(actualRequestId);
                setApproveDialogOpen(true);
                return;
            }
            const config = solicitud.eventData as RecurrenceConfig;
            const result = await aprobarSolicitud(actualRequestId, config, refetchPendingRequests);
            if (result.success) {
                triggerAlert({ title: t('calendar.alerts.request.approved.title'), description: t('calendar.alerts.request.approved.description'), variant: 'default' });
                refetch();
            } else {
                triggerAlert({ title: t('calendar.alerts.request.approveError.title'), description: result.message || t('calendar.alerts.request.approveError.description'), variant: 'destructive' });
            }
        } catch {
            triggerAlert({ title: t('calendar.alerts.request.approveErrorGeneric.title'), description: t('calendar.alerts.request.approveErrorGeneric.description'), variant: 'destructive' });
        }
    };

    const handleRejectRequest = (event: CalendarEvent) => {
        if (!event.requestId) {
            triggerAlert({ title: t('calendar.alerts.request.noRequestId.title'), description: t('calendar.alerts.request.noRequestId.description'), variant: 'destructive' });
            return;
        }
        setRejectRequestId(extractRequestId(event.requestId));
        setRejectDialogOpen(true);
    };

    const handleRejectWithComments = async (comments: string) => {
        if (!rejectRequestId) return;
        setIsSubmittingReject(true);
        try {
            const result = await rechazarSolicitud(rejectRequestId, comments, refetchPendingRequests);
            if (result.success) {
                triggerAlert({ title: t('calendar.alerts.request.rejected.title'), description: t('calendar.alerts.request.rejected.description'), variant: 'default' });
                setRejectDialogOpen(false);
                setRejectRequestId(null);
            } else {
                triggerAlert({ title: t('calendar.alerts.request.rejectError.title'), description: result.message || t('calendar.alerts.request.rejectError.description'), variant: 'destructive' });
            }
        } catch {
            triggerAlert({ title: t('calendar.alerts.request.rejectErrorGeneric.title'), description: t('calendar.alerts.request.rejectErrorGeneric.description'), variant: 'destructive' });
        } finally {
            setIsSubmittingReject(false);
        }
    };

    const handleReviewRequest = (event: CalendarEvent) => {
        if (!event.requestId) {
            triggerAlert({ title: t('calendar.alerts.request.noRequestId.title'), description: t('calendar.alerts.request.noRequestId.description'), variant: 'destructive' });
            return;
        }
        setReviewRequestId(extractRequestId(event.requestId));
        setApproveDialogOpen(true);
    };

    const handleApproveWithData = async (config: RecurrenceConfig) => {
        if (!requestToReview) return;
        setIsSubmittingApproval(true);
        try {
            const result = await aprobarSolicitud(requestToReview.id, config, () => { refetchPendingRequests(); refetch(); });
            if (result.success) {
                triggerAlert({ title: t('calendar.alerts.request.approvedShort.title'), description: t('calendar.alerts.request.approvedShort.description'), variant: 'success' });
                setApproveDialogOpen(false);
                setReviewRequestId(null);
                refetchPendingRequests();
                refetch();
            } else {
                triggerAlert({ title: t('calendar.alerts.request.approveErrorWithMessage.title'), description: result.message || t('calendar.alerts.request.approveErrorWithMessage.description'), variant: 'destructive' });
            }
        } catch {
            triggerAlert({ title: t('calendar.alerts.request.approveErrorGeneric.title'), description: t('calendar.alerts.request.approveErrorGeneric.description'), variant: 'destructive' });
        } finally {
            setIsSubmittingApproval(false);
        }
    };

    const handleDeleteRequest = async (event: CalendarEvent) => {
        if (!event.requestId) {
            triggerAlert({ title: t('calendar.alerts.request.noRequestId.title'), description: t('calendar.alerts.request.noRequestId.description'), variant: 'destructive' });
            return;
        }
        const result = await deleteRequest(event.requestId, refetchPendingRequests);
        if (result.success) {
            triggerAlert({ title: t('calendar.alerts.request.deleted.title'), description: t('calendar.alerts.request.deleted.description'), variant: 'success' });
        } else {
            triggerAlert({ title: t('calendar.alerts.request.deleteError.title'), description: result.message || t('calendar.alerts.request.deleteError.description'), variant: 'destructive' });
        }
    };

    const handleEditSeries = (event: CalendarEvent) => {
        if (event.type === 'periodic' && event.eventCharacter && event.eventCharacter !== EVENT_CHARACTERS.FESTIVO) {
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
        if (!eventToRevert?.puntualEventId) return;
        setIsRevertingEvent(true);
        try {
            const response = await fetch(`${VITE_GATEWAY_API_URL}/calendar/puntual-event/${eventToRevert.puntualEventId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw { message: errorData.message, data: errorData.data };
            }
            refetch();
            const revertedDate = new Date(eventToRevert.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
            triggerAlert({ title: t('calendar.alerts.revert.success.title'), description: t('calendar.alerts.revert.success.description', { date: revertedDate, startTime: eventToRevert.startTime.substring(0, 5), endTime: eventToRevert.endTime.substring(0, 5) }), variant: 'success' });
            setIsRevertConfirmationOpen(false);
            setEventToRevert(undefined);
        } catch (error: any) {
            const errorMessage = error?.message || 'calendar.alerts.revert.error.generic';
            const errorData = error?.data || {};
            triggerAlert({ title: t('calendar.alerts.revert.error.title'), description: String(t(errorMessage, errorData)), variant: 'destructive' });
        } finally {
            setIsRevertingEvent(false);
        }
    };

    const handleReplaceEvent = (event: CalendarEvent) => {
        setEventToReplace(event);
        setIsReplaceEventDialogOpen(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSaveReplaceEvent = async (config: any) => {
        try {
            const originalDateStr = config.originalDate.includes('T') ? config.originalDate.split('T')[0] : config.originalDate;
            const requestBody = {
                calendarId,
                originalDate: originalDateStr,
                originalStartTime: config.originalStartTime,
                originalEndTime: config.originalEndTime,
                newEventDate: config.newEventDate,
                newStartTime: config.newStartTime,
                newEndTime: config.newEndTime,
                groupIds: config.groupIds,
                classroomIds: config.classroomIds,
                comment: config.comment || '',
                periodicEventSourceId: config.originalEventId || null
            };
            const response = await fetch(`${VITE_GATEWAY_API_URL}/calendar/replace-event`, {
                method: 'POST',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(requestBody)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al reemplazar el evento');
            }
            refetch();
            setIsReplaceEventDialogOpen(false);
            setEventToReplace(null);
        } catch (error) {
            console.error('Error al reemplazar el evento:', error);
            triggerAlert({ title: t('calendar.alerts.replace.error.title'), description: error instanceof Error ? t(error.message) : t('calendar.alerts.replace.error.description'), variant: 'destructive' });
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSolicitud = async (calendarIdParam: string, _eventType: string, config: any) => {
        let eventData: any = {};

        if (config.frequency === 'no-repeat') {
            eventData = { eventDate: config.eventDate, startTime: config.startTime, endTime: config.endTime, subjectId: config.subjectId, groupIds: config.groupIds, classroomIds: config.classroomIds, comment: config.comment || '', cancelled: false, eventType: config.eventType || 'NORMAL' };
        } else if (config.frequency === 'custom') {
            const calendarStart = calendarInfo?.startDate ? new Date(calendarInfo.startDate) : new Date();
            const calendarEnd = calendarInfo?.endDate ? new Date(calendarInfo.endDate) : new Date();
            const affectedDates = calculateAffectedDates({ calendarStart, startDate: new Date(config.customStartDate), endDate: calendarEnd, interval: config.interval, unit: config.customFrequencyUnit, weekDays: config.weekDays, endsType: config.endsType, endsOnDate: config.endsOnDate, endsAfterOccurrences: config.endsAfterOccurrences, monthlyPatternType: config.monthlyPatternType });
            eventData = { startTime: config.startTime, endTime: config.endTime, subjectId: config.subjectId, groupIds: config.groupIds, classroomIds: config.classroomIds, frequency: config.frequency, affectedDates, planifiedHours: config.endsAfterOccurrences || 0, interval: config.interval, customFrequencyUnit: config.customFrequencyUnit, weekDays: config.weekDays, monthlyPatternType: config.monthlyPatternType, endsType: config.endsType, endsOnDate: config.endsOnDate, endsAfterOccurrences: config.endsAfterOccurrences, customStartDate: config.customStartDate, eventType: config.eventType || 'NORMAL' };
        } else {
            eventData = { startTime: config.startTime, endTime: config.endTime, subjectId: config.subjectId, groupIds: config.groupIds, classroomIds: config.classroomIds, frequency: config.frequency, weekDays: config.weekDays, planifiedHours: config.planifiedHours || 0, interval: config.interval, endsType: config.endsType, endsOnDate: config.endsOnDate, endsAfterOccurrences: config.endsAfterOccurrences, eventType: config.eventType || 'NORMAL' };
        }

        const result = await crearSolicitud(calendarIdParam, config.frequency === 'no-repeat' ? 'PUNTUAL' : 'PERIODIC', eventData, () => { refetch(); refetchPendingRequests(); });

        if (result.success) {
            triggerAlert({ title: t('calendar.alerts.request.sent.title'), description: t('calendar.alerts.request.sent.description'), variant: 'success' });
            setIsSolicitudDrawerOpen(false);
            setDragStartDate(null);
            setDragStartTime(null);
            setDragEndTime(null);
        } else {
            triggerAlert({ title: t('calendar.alerts.request.sendError.title'), description: result.message || t('calendar.alerts.request.sendError.description'), variant: 'destructive' });
        }
    };

    const handleSubmitRequestEdit = async (config: { originalEventId: string; eventType: 'PUNTUAL' | 'PERIODIC'; startTime: string; endTime: string; eventDate?: string; weekDay?: string; comment: string }) => {
        setIsSubmittingRequest(true);
        const result = await crearSolicitud(calendarId, config.eventType, { startTime: config.startTime, endTime: config.endTime, eventDate: config.eventDate, weekDay: config.weekDay, comment: config.comment }, () => { refetch(); refetchPendingRequests(); }, 'EDIT', config.originalEventId);
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
        const result = await crearSolicitud(calendarId, config.eventType, { comment: config.comment }, () => { refetch(); refetchPendingRequests(); }, 'CANCEL', config.originalEventId);
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
        const result = await crearSolicitud(calendarId, config.eventType, { newEventDate: config.newEventDate, startTime: config.startTime, endTime: config.endTime, comment: config.comment, originalDate: config.originalDate }, () => { refetch(); refetchPendingRequests(); }, 'REPLACE', config.originalEventId);
        setIsSubmittingRequest(false);
        if (result.success) {
            triggerAlert({ title: t('calendar.alerts.request.sent.title'), description: t('calendar.alerts.request.sent.description'), variant: 'success' });
            setIsRequestReplaceOpen(false);
        } else {
            triggerAlert({ title: t('calendar.alerts.request.sendError.title'), description: result.message || t('calendar.alerts.request.sendError.description'), variant: 'destructive' });
        }
    };

    // Componente de evento personalizado
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

    // Estilizar días no lectivos
    const dayPropGetter = (date: Date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        if (!lectiveDates.has(dateKey)) {
            return { style: { backgroundColor: 'rgba(156, 163, 175, 0.20)' } };
        }
        return {};
    };

    if (isLoadingEvents || isLoadingPending || !localeLoaded) {
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
                {(isAdmin || isProfessor || headerSlot) && (
                    <div className="px-4 py-3 border-b bg-card flex items-center gap-4">
                        {/* Izquierda: selector de calendario (solo en HomePage via headerSlot) */}
                        {headerSlot && <div className="flex items-center">{headerSlot}</div>}

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Derecha: botones de acción según rol */}
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
                            {isProfessor && (
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
                    </div>
                )}

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
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 py-4 border-b">
                            <div>
                                <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                                    {isQuickAccess && (
                                        <>
                                            <span className="text-foreground font-normal">{t('calendar.quickAccess')}</span>
                                            <span className="text-foreground">·</span>
                                        </>
                                    )}
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
                                views={{ week: true, work_week: true, day: true, month: MonthViewSingleEvent as any }}
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
                                selectable={isAdmin || isProfessor}
                                onDoubleClickEvent={(event) => {
                                    const calendarEvent = (event as MyEvent).resource;
                                    if (calendarEvent) handleViewEventDetails(calendarEvent);
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
                                    let backgroundColor = getSubjectColor(calendarEvent?.subject?.acronym);
                                    let textColor = darkenColor(backgroundColor, 0.4);
                                    let opacity = 1;
                                    let border = '1px solid white';

                                    if (calendarEvent?.cancelled) {
                                        return {
                                            style: {
                                                backgroundColor: '#9ca3af',
                                                color: '#374151',
                                                opacity: 0.7,
                                                border: '1px solid white',
                                                borderRadius: '10px',
                                                textDecoration: 'line-through',
                                            }
                                        };
                                    } else if (calendarEvent?.isPending) {
                                        opacity = 0.5;
                                        border = '2px dashed #6b7280';
                                    }

                                    return {
                                        style: { backgroundColor, color: textColor, opacity, border, borderRadius: '10px' }
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

            {/* Dialogs */}
            <CreateEventDialog
                open={isCreateEventDialogOpen}
                onOpenChange={(open) => {
                    setIsCreateEventDialogOpen(open);
                    if (!open) { setDragStartDate(null); setDragStartTime(null); setDragEndTime(null); }
                }}
                onSave={handleSaveEvent}
                calendarId={calendarId}
                initialDate={dragStartDate}
                initialStartTime={dragStartTime}
                initialEndTime={dragEndTime}
                lectiveDates={lectiveDates}
                calendarEndDate={data?.endDate}
            />

            <EditEventDialog
                open={isEditEventDialogOpen}
                onOpenChange={(open) => {
                    setIsEditEventDialogOpen(open);
                    if (!open) setEventToEdit(null);
                }}
                onSave={handleUpdateEvent}
                event={eventToEdit}
                calendarId={calendarId}
                lectiveDates={lectiveDates}
            />

            <EventDetailsDrawer
                open={isEventDetailsDrawerOpen}
                onOpenChange={setIsEventDetailsDrawerOpen}
                event={selectedEvent}
            />

            <DeleteEventConfirmationDialog
                open={isDeleteConfirmationOpen}
                onOpenChange={setIsDeleteConfirmationOpen}
                onConfirm={handleConfirmDelete}
                isLoading={isDeletingEvent}
                subjectName={eventToDelete?.subject?.name}
                title={deleteType === 'series' ? t('calendar.dialogs.deleteSeries.title') : undefined}
                description={deleteType === 'series' ? t('calendar.dialogs.deleteSeries.description') : undefined}
            />

            <DeleteEventConfirmationDialog
                open={isRevertConfirmationOpen}
                onOpenChange={setIsRevertConfirmationOpen}
                onConfirm={handleConfirmRevert}
                isLoading={isRevertingEvent}
                subjectName={eventToRevert?.subject?.name}
                title={t('calendar.dialogs.revertCancellation.title')}
                description={t('calendar.dialogs.revertCancellation.description')}
            />

            <ReplaceEventDialog
                open={isReplaceEventDialogOpen}
                onOpenChange={setIsReplaceEventDialogOpen}
                onSave={handleSaveReplaceEvent}
                eventToReplace={eventToReplace}
                lectiveDates={lectiveDates}
            />

            {!isAdmin && (
                <CreateSolicitudDialog
                    open={isSolicitudDrawerOpen}
                    onOpenChange={(open) => {
                        setIsSolicitudDrawerOpen(open);
                        if (!open) { setDragStartDate(null); setDragStartTime(null); setDragEndTime(null); }
                    }}
                    onSave={handleSolicitud}
                    calendarId={calendarId}
                    initialDate={dragStartDate}
                    initialStartTime={dragStartTime}
                    initialEndTime={dragEndTime}
                    lectiveDates={lectiveDates}
                />
            )}

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

            {!isAdmin && (
                <RequestCancelDialog
                    open={isRequestCancelOpen}
                    onOpenChange={setIsRequestCancelOpen}
                    onSave={handleSubmitRequestCancel}
                    event={eventForRequest}
                    isSubmitting={isSubmittingRequest}
                />
            )}

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

            {isAdmin && (
                <ImportExceptionsDialog
                    open={isImportExceptionsDialogOpen}
                    onOpenChange={setIsImportExceptionsDialogOpen}
                    onImport={handleImportExceptions}
                    isLoading={isImportingExceptions}
                />
            )}

            {isAdmin && (
                <ExceptionValidationDialog
                    open={isExceptionValidationDialogOpen}
                    onOpenChange={setIsExceptionValidationDialogOpen}
                    validationResult={exceptionValidationData}
                />
            )}

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
