
import { GroupToolbar } from "@/components/group/GroupToolbar"
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext"
import { useCallback, useEffect } from "react"
import { GroupTable } from "@/components/group/GroupTable"
import { useTranslation } from "react-i18next"
import { useSubjectsWithEventsAndGroupsByCourseAndSemester } from "@/hooks/subject/useSubjectsWithEventsAndGroupsByCourseIdAndSemester"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { useFloatingAlertContext } from "@/contexts/useFloatingAlertContext"
import { useCoursesByDegreeAcronym } from "@/hooks/course/useCoursesByDegreeAcronym"
import { useParams } from "react-router-dom"

export default function GroupPage() {

    const { t } = useTranslation()

    const { triggerAlert } = useFloatingAlertContext()

    const { setItems } = useBreadcrumbContext()

    // Obtener parámetros de la URL
    const { acronym, startYear, endYear, semester } = useParams();

    useEffect(() => {
        setItems([
            { label: t("breadcrumb.home"), href: "/home" },
            { label: t("breadcrumb.degrees"), href: "/degrees" },
            { label: t("breadcrumb.courses"), href: `/degrees/${acronym}/courses` },
            { label: t("breadcrumb.groups"), href: "/groups" }
        ])
    }, [setItems, t, acronym])

    // Obtener los cursos por acrónimo
    const {
        data: courses
    } = useCoursesByDegreeAcronym(acronym || null);

    // Buscar el curso específico basado en startYear y endYear
    const course = courses?.find(c =>
        c.startYear.toString() === startYear &&
        c.endYear.toString() === endYear
    );

    // Convertir semester a número
    const semesterNumber = semester ? parseInt(semester, 10) : null;

    // Obtener las asignaturas con el courseId encontrado
    const {
        data: subjects = [],
        isLoading: isSubjectsLoading,
        error: subjectsError,
        refetch
    } = useSubjectsWithEventsAndGroupsByCourseAndSemester(
        course?.id || null,
        semesterNumber
    );

    const refetchData = useCallback(() => {
        refetch()
    }, [refetch])

    useEffect(() => {
        if (subjectsError) {
            triggerAlert({
                title: t("alerts.classroom.error.title"),
                description: t("alerts.classroom.error.read"),
                variant: "destructive"
            })
        }
        refetchData()
    }, [subjectsError, t, triggerAlert, refetchData])

    return (
        <>
            <GroupToolbar />
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="min-w-[400px] w-2/3">
                    {!isSubjectsLoading && <GroupTable subjects={subjects} />}
                    {isSubjectsLoading && <LoadingSpinner />}
                </div>
            </section>
        </>
    )
}