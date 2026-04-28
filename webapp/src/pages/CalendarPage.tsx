import { useEffect } from "react";
import { CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCalendarByCourseAndSemester } from "@/hooks/calendar/useCalendarByCourseAndSemester";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import CalendarView from "@/components/calendar/CalendarView";
import { useCourseNavBreadcrumb } from "@/hooks/breadcrumb/useCourseNavBreadcrumb";

export default function CalendarPage() {
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const { acronym, startYear, endYear, semester } = useParams<{ acronym: string; startYear: string; endYear: string; semester: string }>();

    const { isLoading, calendarId, course } = useCalendarByCourseAndSemester(
        acronym || null,
        startYear || null,
        endYear || null,
        semester || null
    );

    useCourseNavBreadcrumb(acronym, startYear, endYear, semester, {
        label: t("breadcrumb.calendar"),
        icon: CalendarDays,
    });

    // Redirigir a invitados si el curso no está activo
    useEffect(() => {
        if (!isLoading && course && !isAuthenticated && course.state !== 'ACTIVO') {
            navigate(`/degrees/${acronym}/courses`, { replace: true });
        }
    }, [isLoading, course, isAuthenticated, acronym, navigate]);

    if (isLoading) {
        return (
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2 p-10">
                <div className="flex items-center justify-center h-full">
                    <LoadingSpinner />
                </div>
            </section>
        );
    }

    if (!calendarId) {
        return (
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2 p-10">
                <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">{t('calendar.loadError')}</p>
                </div>
            </section>
        );
    }

    return <CalendarView calendarId={calendarId} />;
}
