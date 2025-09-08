
import { GroupToolbar } from "@/components/GroupToolbar"
import { useBreadcrumbContext } from "@/context/useBreadcrumbContext"
import { useCallback, useEffect } from "react"
import { GroupTable } from "@/components/GroupTable"
import { useTranslation } from "react-i18next"
import { useSubjectsWithEventsAndGroupsByCourseAndSemester } from "@/hooks/useSubjectsWithEventsAndGroupsByCourseIdAndSemester"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { useFloatingAlertContext } from "@/context/useFloatingAlertContext"

export default function GroupPage() {

    const { t } = useTranslation()

    const { triggerAlert } = useFloatingAlertContext()

    const { setItems } = useBreadcrumbContext()

    useEffect(() => {
        setItems([
            { label: t("breadcrumb.home"), href: "/home" },
            { label: t("breadcrumb.degrees"), href: "/degrees" },
            { label: t("breadcrumb.courses"), href: "/courses" },
            { label: t("breadcrumb.groups"), href: "/groups" }
        ])
    }, [setItems, t])

    const { data: subjects = [], isLoading, error, refetch } = useSubjectsWithEventsAndGroupsByCourseAndSemester()

    const refetchData = useCallback(() => {
        refetch()
    }, [refetch])

    useEffect(() => {
        if (error) {
            triggerAlert({
                title: t("alerts.classroom.error.title"),
                description: t("alerts.classroom.error.read"),
                variant: "destructive"
            })
        }
        refetchData()
    }, [error, t, triggerAlert, refetchData])

    return (
        <>
            <GroupToolbar />
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="min-w-[400px] w-2/3">
                    {!isLoading && <GroupTable subjects={subjects} />}
                    {isLoading && <LoadingSpinner />}
                </div>
            </section>
        </>
    )
}