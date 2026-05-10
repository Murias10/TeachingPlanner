import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useActiveCalendars } from "@/hooks/calendar/useActiveCalendars";
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { CalendarDays, Home } from "lucide-react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "@/utils/momentLocales";
import "react-big-calendar/lib/css/react-big-calendar.css";
import CalendarView from "@/components/calendar/CalendarView";

const localizer = momentLocalizer(moment);

export default function HomePage() {
    const { t } = useTranslation();
    const { setItems } = useBreadcrumbContext();

    // Estado del calendario seleccionado (persistido en localStorage)
    const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(() => {
        return localStorage.getItem('homePage_selectedCalendarId');
    });

    // Obtener calendarios activos
    const { data: calendarsData, isLoading: isLoadingCalendars } = useActiveCalendars();

    // Validar que el calendario seleccionado siga siendo válido
    useEffect(() => {
        if (calendarsData && selectedCalendarId) {
            const isStillValid = calendarsData.some(c => c.id === selectedCalendarId);
            if (!isStillValid) {
                localStorage.removeItem('homePage_selectedCalendarId');
                setSelectedCalendarId(null);
            }
        }
    }, [calendarsData, selectedCalendarId]);

    // Breadcrumb
    useEffect(() => {
        setItems([
            { label: t("breadcrumb.home"), href: "/home", icon: Home }
        ]);
    }, [setItems, t]);

    const handleCalendarChange = (calendarId: string) => {
        setSelectedCalendarId(calendarId);
        localStorage.setItem('homePage_selectedCalendarId', calendarId);
    };

    if (isLoadingCalendars) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoadingSpinner />
            </div>
        );
    }

    const hasAvailableCalendars = calendarsData && calendarsData.length > 0;

    const calendarSelector = hasAvailableCalendars ? (
        <div className="flex items-center gap-2 min-w-0 flex-1">
            <label className="hidden lg:inline text-sm font-medium text-muted-foreground whitespace-nowrap shrink-0">
                {t("home.selectCalendar")}:
            </label>
            <Select
                value={selectedCalendarId || ""}
                onValueChange={handleCalendarChange}
            >
                <SelectTrigger className="w-full max-w-[400px]">
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
    ) : undefined;

    return (
        <div className="flex flex-col h-full">
            {/* Barra con selector solo cuando NO hay calendario seleccionado
                (cuando sí hay, el selector se integra en la toolbar de CalendarView) */}
            {hasAvailableCalendars && !selectedCalendarId && (
                <div className="border-b p-4">
                    {calendarSelector}
                </div>
            )}

            {/* Contenido principal */}
            <div className="flex-1 overflow-hidden flex">
                {/* Calendario seleccionado — pasa el selector como headerSlot para fusionar toolbars */}
                {hasAvailableCalendars && selectedCalendarId && (
                    <div className="flex-1 overflow-hidden">
                        <CalendarView calendarId={selectedCalendarId} headerSlot={calendarSelector} isQuickAccess />
                    </div>
                )}

                {/* Mensaje cuando hay calendarios pero no se ha seleccionado ninguno */}
                {hasAvailableCalendars && !selectedCalendarId && (
                    <div className="flex-1 flex items-center justify-center p-8">
                        <div className="text-center space-y-2">
                            <p className="text-lg font-medium text-muted-foreground">
                                {t("home.selectCalendarMessage")}
                            </p>
                        </div>
                    </div>
                )}

                {/* Mensaje cuando NO hay calendarios activos */}
                {!hasAvailableCalendars && (
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
        </div>
    );
}
