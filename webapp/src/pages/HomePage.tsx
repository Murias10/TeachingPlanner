import { useEffect, useMemo, useState } from "react";
import { Calendar, momentLocalizer, Components } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useEventsCalendar } from "@/hooks/calendar/useEventsCalendar";
import { useSubjectsWithEventsAndGroupsByCourseAndSemester } from "@/hooks/subject/useSubjectsWithEventsAndGroupsByCourseIdAndSemester";
import { CalendarEvent } from "@/types/CalendarEvent";
import ClassFilter, { FilterValues } from "@/components/ClassFilter";
import { FileText, BookOpen, DoorOpen, Languages, Users, GraduationCap, XCircle, CalendarDays } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useTranslation } from "react-i18next";
import { CalendarEventWrapper } from "@/components/calendar/CalendarEventWrapper";
import { EventDetailsDrawer } from "@/components/calendar/EventDetailsDrawer";
import { useDegreesWithActiveCalendars } from "@/hooks/degree/useDegreesWithActiveCalendars";
import { sortAlphabetically, sortGruposByAcronymTypeNumber } from "@/utils/filterSortingUtils";
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { generateGroupId } from "@/utils/groupFormatUtils";

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
    '#FFB3BA', '#FFCAB0', '#FFDAB9', '#B4F0E0', '#D8BFD8', '#DDA0DD',
    '#FFB6C1', '#FFC0CB', '#F08080', '#E6E6FA', '#E1D5E7', '#FFD4A3',
    '#C9E4CA', '#A8D5BA', '#FFD6E8', '#C8D4E6', '#E8C8E8', '#FFE0D4',
    '#D4E8FF', '#E8D4C8',
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

export default function HomePage() {
    const { t } = useTranslation();
    const { setItems } = useBreadcrumbContext();

    // Estado para la titulación seleccionada
    const [selectedDegreeId, setSelectedDegreeId] = useState<string | null>(() => {
        // Intentar cargar desde localStorage
        return localStorage.getItem('homePage_selectedDegreeId');
    });

    // Obtener titulaciones con calendarios activos
    const { data: degreesData, isLoading: isLoadingDegrees } = useDegreesWithActiveCalendars();

    // Encontrar la titulación seleccionada
    const selectedDegree = useMemo(() => {
        if (!degreesData || !selectedDegreeId) return null;
        return degreesData.find(d => d.id === selectedDegreeId) || null;
    }, [degreesData, selectedDegreeId]);

    // Validar que la titulación seleccionada siga siendo válida
    useEffect(() => {
        if (degreesData && selectedDegreeId) {
            const isStillValid = degreesData.some(d => d.id === selectedDegreeId);
            if (!isStillValid) {
                // La titulación ya no es válida, limpiar localStorage
                localStorage.removeItem('homePage_selectedDegreeId');
                setSelectedDegreeId(null);
            }
        }
    }, [degreesData, selectedDegreeId]);

    // Hooks que dependen del calendario seleccionado
    const { data, isLoading: isLoadingEvents } = useEventsCalendar(selectedDegree?.calendarId || null);

    // Obtener asignaturas para el mapping de años
    const { data: subjectsData } = useSubjectsWithEventsAndGroupsByCourseAndSemester(
        selectedDegree ? `${selectedDegree.courseStartYear}-${selectedDegree.courseEndYear}` : null,
        selectedDegree?.semester || null
    );

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

    // Estado de filtros
    const [filters, setFilters] = useState<FilterValues>({
        tipoGrupo: [],
        asignatura: [],
        grupos: [],
        aula: [],
        idioma: [],
        curso: [],
        mostrarCancelados: []
    });

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

    // Manejar cambio de titulación y guardar en localStorage
    const handleDegreeChange = (degreeId: string) => {
        setSelectedDegreeId(degreeId);
        localStorage.setItem('homePage_selectedDegreeId', degreeId);
    };

    // Construir eventos para el calendario
    const events: MyEvent[] = useMemo(() => {
        if (!data?.events || !Array.isArray(data.events)) {
            return [];
        }

        const filteredData = data.events.filter((event: CalendarEvent) => {
            // No mostrar eventos cancelados a menos que el filtro esté activado
            if (event.cancelled && !filters.mostrarCancelados.includes('true')) {
                return false;
            }
            return true;
        });

        const mappedEvents = filteredData.map((event: CalendarEvent) => {
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
    }, [data, filters.mostrarCancelados]);

    // Construir opciones para los filtros (usando eventos filtrados por año)
    const filterOptions = useMemo(() => {
        if (!data?.events || !Array.isArray(data.events)) return [];

        // Obtener años seleccionados
        const selectedYears = filters.curso.map(label => {
            const entry = Object.entries(ACADEMIC_YEAR_LABELS).find(([_, val]) => val === label);
            return entry ? parseInt(entry[0], 10) : null;
        }).filter((y): y is number => y !== null);

        // Filtrar eventos por años activos
        const filteredByYear = selectedYears.length === 0
            ? data.events
            : data.events.filter((event: CalendarEvent) => {
                const eventYear = subjectYearMap.get(event.subject?.acronym || '');
                return eventYear !== undefined && selectedYears.includes(eventYear);
            });

        const tipoGrupoSet = new Set<string>();
        const asignaturaSet = new Set<string>();
        const gruposSet = new Set<string>();
        const aulaSet = new Set<string>();
        const idiomaSet = new Set<string>();
        const cursoSet = new Set<number>();

        filteredByYear.forEach((event: CalendarEvent) => {
            // Tipo de grupo del primer grupo
            if (event.groups[0]?.type) tipoGrupoSet.add(event.groups[0].type);

            // Asignatura
            if (event.subject?.acronym) {
                asignaturaSet.add(event.subject.acronym);
                const year = subjectYearMap.get(event.subject.acronym);
                if (year !== undefined) cursoSet.add(year);
            }

            // Grupos - usar generateGroupId para crear IDs legibles
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
            });

            // Aulas
            event.classrooms.forEach(classroom => {
                if (classroom.code) aulaSet.add(classroom.code);
            });

            // Idioma del primer grupo
            if (event.groups[0]?.language) idiomaSet.add(event.groups[0].language);
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
                category: 'mostrarCancelados' as const,
                label: t("calendar.filters.showCancelled"),
                options: ['true'],
                icon: XCircle
            }
        ].filter(option => option.options.length > 0);
    }, [data, filters.curso, subjectYearMap, t]);

    // Filtrar eventos según los filtros activos
    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            const calendarEvent = event.resource;
            if (!calendarEvent) return false;

            // Filtro de año
            if (filters.curso.length > 0) {
                const eventYear = subjectYearMap.get(calendarEvent.subject?.acronym || '');
                if (eventYear === undefined) return false;
                const eventYearLabel = getYearLabel(eventYear);
                if (!filters.curso.includes(eventYearLabel)) return false;
            }

            // Filtro de asignatura
            if (filters.asignatura.length > 0 && !filters.asignatura.includes(calendarEvent.subject?.acronym || '')) {
                return false;
            }

            // Filtro de tipo de grupo
            if (filters.tipoGrupo.length > 0) {
                const hasMatchingType = calendarEvent.groups.some(g => filters.tipoGrupo.includes(g.type));
                if (!hasMatchingType) return false;
            }

            // Filtro de grupos
            if (filters.grupos.length > 0) {
                const hasMatchingGroup = calendarEvent.groups.some(g => {
                    if (!calendarEvent.subject?.acronym) return false;
                    const groupId = generateGroupId(
                        calendarEvent.subject.acronym,
                        g.number,
                        g.type,
                        g.language === 'EN'
                    );
                    return filters.grupos.includes(groupId);
                });
                if (!hasMatchingGroup) return false;
            }

            // Filtro de aula
            if (filters.aula.length > 0) {
                const hasMatchingClassroom = calendarEvent.classrooms.some(c => filters.aula.includes(c.code));
                if (!hasMatchingClassroom) return false;
            }

            // Filtro de idioma
            if (filters.idioma.length > 0) {
                const hasMatchingLanguage = calendarEvent.groups.some(g => filters.idioma.includes(g.language));
                if (!hasMatchingLanguage) return false;
            }

            return true;
        });
    }, [events, filters, subjectYearMap]);

    // Personalizar estilos de eventos
    const eventStyleGetter = (event: MyEvent) => {
        const calendarEvent = event.resource;
        const baseColor = getSubjectColor(calendarEvent?.subject?.acronym);
        const isCancelled = calendarEvent?.cancelled || false;

        return {
            style: {
                backgroundColor: isCancelled ? '#9CA3AF' : baseColor,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: '500',
                padding: '2px 4px',
                opacity: isCancelled ? 0.6 : 1,
                textDecoration: isCancelled ? 'line-through' : 'none'
            }
        };
    };

    // Manejar clic en evento para ver detalles
    const handleViewDetails = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setDetailsDrawerOpen(true);
    };

    // Componentes personalizados
    const components: Components<MyEvent> = {
        event: (props) => (
            <CalendarEventWrapper
                {...props}
                onViewDetails={handleViewDetails}
            />
        ),
    };

    const isLoading = isLoadingDegrees || isLoadingEvents;

    // Mostrar loading mientras carga
    if (isLoadingDegrees) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoadingSpinner />
            </div>
        );
    }

    // Verificar si hay titulaciones disponibles
    const hasAvailableDegrees = degreesData && degreesData.length > 0;

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar simplificada con selector de titulación y filtros de año - Solo si hay titulaciones */}
            {hasAvailableDegrees && (
                <div className="border-b p-4 space-y-4">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                            {t("home.selectDegree")}:
                        </label>
                        <Select
                            value={selectedDegreeId || ""}
                            onValueChange={handleDegreeChange}
                        >
                            <SelectTrigger className="w-auto min-w-[300px]">
                                <SelectValue placeholder={t("home.selectDegree")} />
                            </SelectTrigger>
                            <SelectContent>
                                {degreesData?.map((degree) => (
                                    <SelectItem key={degree.id} value={degree.id}>
                                        {degree.name} ({degree.courseStartYear}-{degree.courseEndYear} - Semestre {degree.semester})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Filtros de año (botones) */}
                    {selectedDegree && filterOptions.find(opt => opt.category === 'curso') && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-muted-foreground">{t("calendar.filters.year")}:</span>
                            {filterOptions
                                .find(opt => opt.category === 'curso')
                                ?.options.map((yearLabel) => {
                                    const isActive = filters.curso.includes(yearLabel);
                                    return (
                                        <Button
                                            key={yearLabel}
                                            variant={isActive ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => {
                                                const newCurso = isActive
                                                    ? filters.curso.filter(y => y !== yearLabel)
                                                    : [...filters.curso, yearLabel];
                                                setFilters({ ...filters, curso: newCurso });
                                            }}
                                        >
                                            {yearLabel}
                                        </Button>
                                    );
                                })}
                        </div>
                    )}
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 overflow-hidden flex">
                {/* Cuando hay titulaciones disponibles */}
                {hasAvailableDegrees && selectedDegree && (
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
                                <Calendar
                                    localizer={localizer}
                                    events={filteredEvents}
                                    startAccessor="start"
                                    endAccessor="end"
                                    style={{ height: '100%' }}
                                    eventPropGetter={eventStyleGetter}
                                    components={components}
                                    views={['month', 'week', 'day']}
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
                                        showMore: (total: number) => t("calendar.showMore", { count: total })
                                    }}
                                />
                            )}
                        </div>
                    </>
                )}

                {/* Mensaje cuando hay titulaciones pero no se ha seleccionado ninguna */}
                {hasAvailableDegrees && !selectedDegree && !isLoading && (
                    <div className="flex-1 flex items-center justify-center p-8">
                        <div className="text-center space-y-2">
                            <p className="text-lg font-medium text-muted-foreground">
                                {t("home.selectDegreeMessage")}
                            </p>
                        </div>
                    </div>
                )}

                {/* Mensaje cuando NO hay titulaciones con calendarios activos */}
                {!hasAvailableDegrees && !isLoading && (
                    <div className="flex-1 p-4 overflow-auto relative">
                        {/* Calendario vacío de fondo */}
                        <div className="absolute inset-0 opacity-30">
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
