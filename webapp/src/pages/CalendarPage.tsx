import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useCalendarByCourseAndSemester } from "@/hooks/calendar/useCalendarByCourseAndSemester";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import CalendarView from "@/components/calendar/CalendarView";

export default function CalendarPage() {
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const { acronym, startYear, endYear, semester } = useParams<{ acronym: string; startYear: string; endYear: string; semester: string }>();

    const { setItems } = useBreadcrumbContext();

    const { isLoading, calendarId, course } = useCalendarByCourseAndSemester(
        acronym || null,
        startYear || null,
        endYear || null,
        semester || null
    );

    // Redirigir a invitados si el curso no está activo
    useEffect(() => {
        if (!isLoading && course && !isAuthenticated && course.state !== 'ACTIVO') {
            navigate(`/degrees/${acronym}/courses`, { replace: true });
        }
    }, [isLoading, course, isAuthenticated, acronym, navigate]);

    // Breadcrumb
    useEffect(() => {
        setItems([
            { label: t("breadcrumb.degrees"), href: "/degrees" },
            ...(course?.degree ? [{ label: course.degree.name, href: "" }] : []),
            { label: t("breadcrumb.courses"), href: `/degrees/${acronym}/courses` },
            ...(course ? [{ label: `${course.startYear}/${course.endYear}`, href: "" }] : []),
            ...(semester ? [{ label: `${t("breadcrumb.semester")} ${semester}`, href: "" }] : []),
            { label: t("breadcrumb.calendar"), href: "" },
        ]);
    }, [setItems, acronym, t, course, semester]);

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
