import { useEffect, useMemo, useState } from "react";
import { usePersistedFilters } from "@/hooks/usePersistedFilters";
import { useFilterCascade } from "@/hooks/useFilterCascade";
import { getActiveValues } from "@/utils/filterUtils";
import { Calendar, momentLocalizer, Components } from "react-big-calendar";
import moment from "@/utils/momentLocales"; // Usar moment con locales pre-cargados
import { format } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useEventsCalendar } from "@/hooks/calendar/useEventsCalendar";
import { useSubjectsWithGroupsByCalendarId } from "@/hooks/subject/useSubjectsWithGroupsByCalendarId";
import { useCalendarDays } from "@/hooks/calendar/useCalendarDays";
import { CalendarEvent } from "@/types/CalendarEvent";
import ClassFilter from "@/components/ClassFilter";
import { FileText, BookOpen, DoorOpen, Languages, Users, GraduationCap, Tag, CalendarDays } from "lucide-react";
import { EVENT_TYPES } from "@/constants/eventCharacters";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useTranslation } from "react-i18next";
import { EventDetailsDrawer } from "@/components/calendar/EventDetailsDrawer";
import { useActiveCalendars } from "@/hooks/calendar/useActiveCalendars";
import { sortAlphabetically, sortGruposByAcronymTypeNumber } from "@/utils/filterSortingUtils";
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateGroupId } from "@/utils/groupFormatUtils";

// El localizer se crea de forma global
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
    '#FFB3BA', '#FFCAB0', '#FFDAB9', '#B4F0E0', '#D8BFD8', '#DDA0DD',
    '#FFB6C1', '#FFC0CB', '#F08080', '#E6E6FA', '#E1D5E7', '#FFD4A3',
    '#C9E4CA', '#A8D5BA', '#FFD6E8', '#C8D4E6', '#E8C8E8', '#FFE0D4',
    '#D4E8FF', '#E8D4C8',
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

export default function HomePage() {
    const { t, i18n } = useTranslation();
    const { setItems } = useBreadcrumbContext();
    const [localeLoaded, setLocaleLoaded] = useState(false);

    // Configurar el locale de moment basándose en el idioma actual de i18next
    useEffect(() => {
        // i18n.language puede ser 'es', 'es-ES', 'en', 'en-US', etc.
        const languageCode = i18n.language.split('-')[0]; // Extraer 'es' de 'es-ES'
        console.log('🌍 Current i18n language:', i18n.language);
        console.log('🌍 Language code extracted:', languageCode);

        // Establecer el locale actual
        moment.locale(languageCode);

        // Configurar que la semana siempre empiece en lunes, independientemente del idioma
        moment.updateLocale(languageCode, {
            week: {
                dow: 1, // Lunes es el primer día de la semana
                doy: 4
            }
        });

        // Verificar el locale actual
        const currentLocale = moment.locale();
        console.log('🌍 Final moment locale:', currentLocale);
        console.log('🗓️ Test format:', moment().format('dddd, MMMM DD, YYYY'));
        setLocaleLoaded(true);
    }, [i18n.language]);

    // Estado para el calendario seleccionado
    const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(() => {
        // Intentar cargar desde localStorage
        return localStorage.getItem('homePage_selectedCalendarId');
    });

    // Obtener calendarios activos
    const { data: calendarsData, isLoading: isLoadingCalendars } = useActiveCalendars();

    // Encontrar el calendario seleccionado
    const selectedCalendar = useMemo(() => {
        if (!calendarsData || !selectedCalendarId) return null;
        return calendarsData.find(c => c.id === selectedCalendarId) || null;
    }, [calendarsData, selectedCalendarId]);

    // Validar que el calendario seleccionado siga siendo válido
    useEffect(() => {
        if (calendarsData && selectedCalendarId) {
            const isStillValid = calendarsData.some(c => c.id === selectedCalendarId);
            if (!isStillValid) {
                // El calendario ya no es válido, limpiar localStorage
                localStorage.removeItem('homePage_selectedCalendarId');
                setSelectedCalendarId(null);
            }
        }
    }, [calendarsData, selectedCalendarId]);

    // Hooks que dependen del calendario seleccionado
    const { data, isLoading: isLoadingEvents } = useEventsCalendar(selectedCalendar?.id || null);

    // Obtener días del calendario
    const { data: calendarDays } = useCalendarDays(selectedCalendar?.id || null);

    // Obtener asignaturas para el mapping de años
    const { data: subjectsData } = useSubjectsWithGroupsByCalendarId(selectedCalendar?.id || null);

    // Crear mapping de acronym → year
    const subjectYearMap = useMemo(() => {
        if (!subjectsData || !Array.isArray(subjectsData)) return new Map<string, number>();
        const map = new Map<string, number>();
        subjectsData.forEach(subject => {
            if (subject.acronym && subject.year !== undefined) {
                map.set(subject.acronym, subject.year);
            }
        });
        return map;
    }, [subjectsData]);

    // Crear Set de días lectivos
    const lectiveDates = useMemo(() => {
        const dates = new Set<string>();
        if (calendarDays && Array.isArray(calendarDays)) {
            calendarDays.forEach(day => {
                if (day.lective) {
                    dates.add(format(new Date(day.date), 'yyyy-MM-dd'));
                }
            });
        }
        return dates;
    }, [calendarDays]);

    // Estado de filtros (persistido en localStorage por usuario)
    const [filters, setFilters] = usePersistedFilters();

    // Estado de colapso del panel de filtros
    const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);

    // Estado para el drawer de detalles de evento
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);

    // Breadcrumb
    useEffect(() => {
        setItems([
            { label: t("breadcrumb.home"), href: "/home" }
        ]);
    }, [setItems, t]);

    // Manejar cambio de calendario y guardar en localStorage
    const handleCalendarChange = (calendarId: string) => {
        setSelectedCalendarId(calendarId);
        localStorage.setItem('homePage_selectedCalendarId', calendarId);
    };

    // Construir eventos para el calendario
    const events: MyEvent[] = useMemo(() => {
        if (!data?.events || !Array.isArray(data.events)) {
            return [];
        }

        const mappedEvents = data.events.map((event: CalendarEvent) => {
            // Construir fechas de inicio y fin usando moment
            const eventDate = event.date.split('T')[0];
            const startMoment = moment(`${eventDate}T${event.startTime}`);
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
                resource: event,
            };
        });

        return mappedEvents;
    }, [data]);

    // Construir opciones para los filtros (usando eventos filtrados por año)
    const filterOptions = useMemo(() => {
        if (!data?.events || !Array.isArray(data.events)) return [];

        // Jerarquía: Curso > Asignatura > TipoGrupo > Grupos/Idioma (igual que CalendarPage)

        // Obtener años seleccionados
        const selectedYears = filters.curso.map(label => {
            const entry = Object.entries(ACADEMIC_YEAR_LABELS).find(([_, val]) => val === label);
            return entry ? parseInt(entry[0], 10) : null;
        }).filter((y): y is number => y !== null);

        // Nivel 1: filtrar por curso
        const filteredByYear: CalendarEvent[] = selectedYears.length === 0
            ? data.events
            : data.events.filter((event: CalendarEvent) => {
                const eventYear = subjectYearMap.get(event.subject?.acronym || '');
                return eventYear !== undefined && selectedYears.includes(eventYear);
            });

        // Nivel 2: filtrar por asignatura (para restringir tipoGrupo, grupos, idioma)
        const filteredBySubject = filters.asignatura.length === 0
            ? filteredByYear
            : filteredByYear.filter((event: CalendarEvent) =>
                event.subject?.acronym ? filters.asignatura.includes(event.subject.acronym) : false
            );

        // Nivel 3: filtrar por tipoGrupo (para restringir grupos e idioma)
        const filteredByType = filters.tipoGrupo.length === 0
            ? filteredBySubject
            : filteredBySubject.filter((event: CalendarEvent) =>
                event.groups.some(group => filters.tipoGrupo.includes(group.type))
            );

        const asignaturaSet = new Set<string>();
        const asignaturaTooltipMap = new Map<string, string>();
        const cursoSet = new Set<number>();
        const tipoGrupoSet = new Set<string>();
        const gruposSet = new Set<string>();
        const aulaSet = new Set<string>();
        const idiomaSet = new Set<string>();

        // Curso: de todos los eventos (sin restricción)
        data.events.forEach((event: CalendarEvent) => {
            if (event.subject?.acronym) {
                const year = subjectYearMap.get(event.subject.acronym);
                if (year !== undefined) cursoSet.add(year);
            }
        });

        // Asignatura: restringida por curso
        filteredByYear.forEach((event: CalendarEvent) => {
            if (event.subject?.acronym) {
                asignaturaSet.add(event.subject.acronym);
                if (event.subject.name) {
                    asignaturaTooltipMap.set(event.subject.acronym, event.subject.name);
                }
            }
        });

        // TipoGrupo: restringido por curso + asignatura
        filteredBySubject.forEach((event: CalendarEvent) => {
            event.groups.forEach(group => {
                if (group.type) tipoGrupoSet.add(group.type);
            });
        });

        // Grupos, Aulas, Idioma: restringidos por curso + asignatura + tipoGrupo
        filteredByType.forEach((event: CalendarEvent) => {
            event.groups.forEach(group => {
                if (event.subject?.acronym) {
                    const groupId = generateGroupId(
                        event.subject.acronym,
                        group.number,
                        group.type,
                        group.language === 'EN'
                    );
                    gruposSet.add(groupId);
                }
                if (group.language) idiomaSet.add(group.language);
            });
            event.classrooms.forEach(classroom => {
                if (classroom.code) aulaSet.add(classroom.code);
            });
        });

        return [
            {
                category: 'curso' as const,
                label: t("calendar.filters.year"),
                options: Array.from(cursoSet).sort((a, b) => a - b).map(year => getYearLabel(year)),
                icon: GraduationCap
            },
            {
                category: 'asignatura' as const,
                label: t("calendar.filters.subject"),
                options: sortAlphabetically(Array.from(asignaturaSet)),
                optionTooltips: Object.fromEntries(asignaturaTooltipMap),
                icon: FileText
            },
            {
                category: 'tipoGrupo' as const,
                label: t("calendar.filters.groupType"),
                options: sortAlphabetically(Array.from(tipoGrupoSet)),
                icon: BookOpen
            },
            {
                category: 'grupos' as const,
                label: t("calendar.filters.groups"),
                options: sortGruposByAcronymTypeNumber(Array.from(gruposSet)),
                icon: Users
            },
            {
                category: 'aula' as const,
                label: t("calendar.filters.classroom"),
                options: sortAlphabetically(Array.from(aulaSet)),
                icon: DoorOpen
            },
            {
                category: 'idioma' as const,
                label: t("calendar.filters.language"),
                options: sortAlphabetically(Array.from(idiomaSet)),
                icon: Languages
            },
            {
                category: 'tipoEvento' as const,
                label: t('calendar.filters.eventType'),
                options: [EVENT_TYPES.NORMAL, EVENT_TYPES.BLOCKER, EVENT_TYPES.REVISION, EVENT_TYPES.EVALUACION, EVENT_TYPES.OTRO, 'CANCELADO'],
                icon: Tag
            }
        ].filter(option => option.options.length > 0);
    }, [data, filters.curso, filters.asignatura, filters.tipoGrupo, subjectYearMap, t]);

    // Deselección automática de filtros hijos al cambiar un filtro padre (cascada + idioma)
    useFilterCascade(filters, filterOptions, setFilters);

    // Filtrar eventos según los filtros activos.
    // Un filtro de categoría solo se aplica si al menos uno de sus valores existe
    // en las opciones del calendario actual (filterOptions). Así, valores persistidos
    // de otro calendario no bloquean la vista cuando no tienen correspondencia aquí.
    const filteredEvents = useMemo(() => {
        const activeTipoEvento = getActiveValues('tipoEvento', filters, filterOptions);
        const activeCurso      = getActiveValues('curso', filters, filterOptions);
        const activeAsignatura = getActiveValues('asignatura', filters, filterOptions);
        const activeTipoGrupo  = getActiveValues('tipoGrupo', filters, filterOptions);
        const activeGrupos     = getActiveValues('grupos', filters, filterOptions);
        const activeAula       = getActiveValues('aula', filters, filterOptions);
        const activeIdioma     = getActiveValues('idioma', filters, filterOptions);

        return events.filter(event => {
            const calendarEvent = event.resource;
            if (!calendarEvent) return false;

            // Filtro por tipo de evento: sin selección = todos visibles;
            // con selección = solo los tipos marcados.
            if (activeTipoEvento.length > 0) {
                const isCancelled = calendarEvent.cancelled;
                const matchesCancelado = isCancelled && activeTipoEvento.includes('CANCELADO');
                const matchesEventType = !isCancelled && activeTipoEvento.includes(calendarEvent.eventType);
                if (!matchesCancelado && !matchesEventType) return false;
            }

            // Filtro de año
            if (activeCurso.length > 0) {
                const eventYear = subjectYearMap.get(calendarEvent.subject?.acronym || '');
                if (eventYear === undefined) return false;
                const eventYearLabel = getYearLabel(eventYear);
                if (!activeCurso.includes(eventYearLabel)) return false;
            }

            // Filtro de asignatura
            if (activeAsignatura.length > 0 && !activeAsignatura.includes(calendarEvent.subject?.acronym || '')) {
                return false;
            }

            // Filtro de tipo de grupo
            if (activeTipoGrupo.length > 0) {
                const hasMatchingType = calendarEvent.groups.some(g => activeTipoGrupo.includes(g.type));
                if (!hasMatchingType) return false;
            }

            // Filtro de grupos
            if (activeGrupos.length > 0) {
                const hasMatchingGroup = calendarEvent.groups.some(g => {
                    if (!calendarEvent.subject?.acronym) return false;
                    const groupId = generateGroupId(
                        calendarEvent.subject.acronym,
                        g.number,
                        g.type,
                        g.language === 'EN'
                    );
                    return activeGrupos.includes(groupId);
                });
                if (!hasMatchingGroup) return false;
            }

            // Filtro de aula
            if (activeAula.length > 0) {
                const hasMatchingClassroom = calendarEvent.classrooms.some(c => activeAula.includes(c.code));
                if (!hasMatchingClassroom) return false;
            }

            // Filtro de idioma
            if (activeIdioma.length > 0) {
                const hasMatchingLanguage = calendarEvent.groups.some(g => activeIdioma.includes(g.language));
                if (!hasMatchingLanguage) return false;
            }

            return true;
        });
    }, [events, filters, filterOptions, subjectYearMap]);

    // Personalizar estilos de eventos
    const eventStyleGetter = (event: MyEvent) => {
        const calendarEvent = event.resource;

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

        return {
            style: {
                backgroundColor,
                color: textColor,
                opacity,
                border,
                borderRadius: '10px',
            }
        };
    };

    // Manejar clic en evento para ver detalles
    const handleViewDetails = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setDetailsDrawerOpen(true);
    };

    // Componentes personalizados - Sin menú contextual para HomePage (solo consulta)
    const components: Components<MyEvent> = {
        event: (props) => {
            const calendarEvent = props.event.resource;
            if (!calendarEvent) {
                return <div className="h-full w-full">{props.event.title}</div>;
            }

            // Extraer el grupo y la hora del título (formato esperado: "Grupo - HH:MM")
            const titleParts = props.event.title.split(' - ');
            const groupStr = titleParts[0];
            const timeStr = titleParts.length > 1 ? titleParts[1] : '';

            return (
                <div
                    className="h-full w-full px-1 py-1 flex flex-col gap-0.5 cursor-pointer"
                    onClick={() => handleViewDetails(calendarEvent)}
                >
                    <div className="text-xs font-semibold leading-tight">{groupStr}</div>
                    <div className="text-[11px] leading-tight font-medium opacity-95">
                        {timeStr}
                        {calendarEvent.classrooms.length > 0 && (
                            <> · {calendarEvent.classrooms.map(c => c.code).join(', ')}</>
                        )}
                    </div>
                </div>
            );
        },
    };

    // Función para estilizar días no lectivos
    const dayPropGetter = (date: Date) => {
        const dateKey = format(date, 'yyyy-MM-dd');

        // Colorear si NO está en lectiveDates (días no lectivos)
        if (!lectiveDates.has(dateKey)) {
            return {
                style: {
                    backgroundColor: 'rgba(156, 163, 175, 0.20)', // Gris con opacidad más reducida
                }
            };
        }
        return {};
    };

    const isLoading = isLoadingCalendars || isLoadingEvents;

    // Mostrar loading mientras carga o mientras se configura el locale
    if (isLoadingCalendars || !localeLoaded) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoadingSpinner />
            </div>
        );
    }

    // Verificar si hay calendarios disponibles
    const hasAvailableCalendars = calendarsData && calendarsData.length > 0;

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar con selector de calendario */}
            {hasAvailableCalendars && (
                <div className="border-b p-4">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                            {t("home.selectCalendar")}:
                        </label>
                        <Select
                            value={selectedCalendarId || ""}
                            onValueChange={handleCalendarChange}
                        >
                            <SelectTrigger className="w-auto min-w-[400px]">
                                <SelectValue placeholder={t("home.selectCalendar")} />
                            </SelectTrigger>
                            <SelectContent>
                                {calendarsData?.map((calendar) => (
                                    <SelectItem key={calendar.id} value={calendar.id}>
                                        {calendar.degreeAcronym} - {calendar.courseStartYear}/{calendar.courseEndYear} - Semestre {calendar.semester}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 overflow-hidden flex">
                {/* Cuando hay calendarios disponibles */}
                {hasAvailableCalendars && selectedCalendar && (
                    <>
                        {/* Panel de filtros */}
                        <ClassFilter
                            filters={filters}
                            onFiltersChange={setFilters}
                            filterOptions={filterOptions}
                            isCollapsed={isFiltersCollapsed}
                            onToggleCollapse={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
                        />

                        {/* Calendario */}
                        <div className="flex-1 p-4 overflow-auto">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <LoadingSpinner />
                                </div>
                            ) : (
                                <div className="h-full bg-white rounded-lg shadow-sm">
                                    <Calendar
                                        localizer={localizer}
                                        events={filteredEvents}
                                        startAccessor="start"
                                        endAccessor="end"
                                        min={moment().hour(9).minute(0).toDate()}
                                        max={moment().hour(21).minute(0).toDate()}
                                        style={{ height: '100%' }}
                                        eventPropGetter={eventStyleGetter}
                                        dayPropGetter={dayPropGetter}
                                        components={components}
                                        defaultView="work_week"
                                        views={['week', 'work_week', 'day', 'month']}
                                        culture={t("calendar.locale")}
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
                                        messages={{
                                            next: t("calendar.next"),
                                            previous: t("calendar.previous"),
                                            today: t("calendar.today"),
                                            month: t("calendar.month"),
                                            week: t("calendar.week"),
                                            day: t("calendar.day"),
                                            agenda: t("calendar.agenda"),
                                            date: t("calendar.date"),
                                            time: t("calendar.time"),
                                            event: t("calendar.event.label"),
                                            noEventsInRange: t("calendar.noEvents"),
                                            showMore: (total: number) => t("calendar.showMore", { count: total }),
                                            work_week: t("calendar.workWeek")
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Mensaje cuando hay calendarios pero no se ha seleccionado ninguno */}
                {hasAvailableCalendars && !selectedCalendar && !isLoading && (
                    <div className="flex-1 flex items-center justify-center p-8">
                        <div className="text-center space-y-2">
                            <p className="text-lg font-medium text-muted-foreground">
                                {t("home.selectCalendarMessage")}
                            </p>
                        </div>
                    </div>
                )}

                {/* Mensaje cuando NO hay calendarios activos */}
                {!hasAvailableCalendars && !isLoading && (
                    <div className="flex-1 p-4 overflow-auto relative">
                        {/* Calendario vacío de fondo */}
                        <div className="absolute inset-0 opacity-30 pointer-events-none">
                            <Calendar
                                localizer={localizer}
                                events={[]}
                                startAccessor="start"
                                endAccessor="end"
                                style={{ height: '100%' }}
                                views={['month']}
                                messages={{
                                    next: t("calendar.next"),
                                    previous: t("calendar.previous"),
                                    today: t("calendar.today"),
                                    month: t("calendar.month"),
                                    week: t("calendar.week"),
                                    day: t("calendar.day"),
                                }}
                            />
                        </div>
                        {/* Mensaje superpuesto */}
                        <div className="relative z-10 flex items-center justify-center h-full">
                            <div className="text-center space-y-3 bg-background/95 p-8 rounded-lg shadow-lg border">
                                <div className="flex justify-center">
                                    <CalendarDays className="h-16 w-16 text-muted-foreground/50" />
                                </div>
                                <h3 className="text-xl font-semibold text-foreground">
                                    {t("home.noActiveCalendars")}
                                </h3>
                                <p className="text-sm text-muted-foreground max-w-md">
                                    {t("home.noActiveCalendarsMessage")}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Event Details Drawer (read-only) */}
            <EventDetailsDrawer
                open={detailsDrawerOpen}
                onOpenChange={setDetailsDrawerOpen}
                event={selectedEvent || undefined}
            />
        </div>
    );
}
