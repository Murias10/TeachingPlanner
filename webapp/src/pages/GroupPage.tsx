
import { GroupToolbar } from "@/components/group/GroupToolbar"
import { useCallback, useEffect, useState } from "react"
import { Users } from "lucide-react"
import { GroupTable } from "@/components/group/GroupTable"
import { useTranslation } from "react-i18next"
import { useSubjectsWithGroupsByCalendarId } from "@/hooks/subject/useSubjectsWithGroupsByCalendarId"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { useFloatingAlertContext } from "@/contexts/useFloatingAlertContext"
import { useParams } from "react-router-dom"
import { useCourseNavBreadcrumb } from "@/hooks/breadcrumb/useCourseNavBreadcrumb"
import CreateGroupDialog from "@/components/group/CreateGroupDialog"
import { useCreateGroup } from "@/hooks/group/useCreateGroup"
import { useDeleteGroup } from "@/hooks/group/useDeleteGroup"
import { useCalendarByCourseAndSemester } from "@/hooks/calendar/useCalendarByCourseAndSemester"
import { useAuth } from "@/contexts/AuthContext"
import { ProtectedComponent } from "@/components/ProtectedComponent"

export default function GroupPage() {

    const { t } = useTranslation()
    const { user } = useAuth()
    const isAdmin = user?.role === "ADMIN"

    const { triggerAlert } = useFloatingAlertContext()

    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [preSelectedSubjectId, setPreSelectedSubjectId] = useState<string | undefined>(undefined)

    // Obtener parámetros de la URL
    const { acronym, startYear, endYear, semester } = useParams();

    useCourseNavBreadcrumb(acronym, startYear, endYear, semester, {
        label: t("breadcrumb.groups"),
        icon: Users,
    })

    // Obtener el calendarId
    const { calendarId } = useCalendarByCourseAndSemester(
        acronym || null,
        startYear || null,
        endYear || null,
        semester || null
    );

    // Obtener las asignaturas con grupos usando el calendarId
    const {
        data: subjects = [],
        isLoading: isSubjectsLoading,
        error: subjectsError,
        refetch
    } = useSubjectsWithGroupsByCalendarId(calendarId);

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

    const { createGroup } = useCreateGroup()
    const { deleteGroup } = useDeleteGroup()

    const handleCreateGroup = useCallback(async (groupData: { subjectId: string; number: number; type: string; language: string }) => {
        if (!calendarId) {
            triggerAlert({
                title: "Error",
                description: "No se pudo obtener el ID del calendario",
                variant: "destructive"
            })
            return
        }

        const result = await createGroup({ calendarId, ...groupData }, refetch)

        if (result.success) {
            triggerAlert({
                title: "Grupo creado",
                description: "El grupo se ha creado correctamente",
                variant: "default"
            })
        } else {
            triggerAlert({
                title: "Error al crear grupo",
                description: result.message || "No se pudo crear el grupo",
                variant: "destructive"
            })
        }
    }, [createGroup, refetch, triggerAlert, calendarId])

    const handleDeleteGroup = useCallback(async (groupId: string) => {
        const result = await deleteGroup(groupId, refetch)

        if (result.success) {
            triggerAlert({
                title: "Grupo eliminado",
                description: "El grupo se ha eliminado correctamente",
                variant: "default"
            })
        } else {
            triggerAlert({
                title: "Error al eliminar grupo",
                description: result.message || "No se pudo eliminar el grupo",
                variant: "destructive"
            })
        }
    }, [deleteGroup, refetch, triggerAlert])

    const handleCreateGroupForSubject = useCallback((subjectId: string) => {
        setPreSelectedSubjectId(subjectId)
        setCreateDialogOpen(true)
    }, [])

    const handleCreateGroupGlobal = useCallback(() => {
        setPreSelectedSubjectId(undefined)
        setCreateDialogOpen(true)
    }, [])

    const handleDialogClose = useCallback((open: boolean) => {
        if (!open) {
            setPreSelectedSubjectId(undefined)
        }
        setCreateDialogOpen(open)
    }, [])

    return (
        <>
            <section className="h-full bg-background overflow-hidden flex flex-col">
                {/* Toolbar */}
                <ProtectedComponent requiredRoles={["ADMIN"]} hideIfNoAccess={true}>
                    <div className="px-4 py-3 border-b bg-background flex justify-end items-center">
                        <GroupToolbar onCreateGroup={handleCreateGroupGlobal} />
                    </div>
                </ProtectedComponent>

                {/* Table */}
                <div className="flex-1 overflow-auto px-4 py-0 flex items-center justify-center">
                    {isSubjectsLoading ? (
                        <div className="h-full flex items-center justify-center p-10">
                            <LoadingSpinner />
                        </div>
                    ) : (
                        <GroupTable subjects={subjects} onDeleteGroup={isAdmin ? handleDeleteGroup : undefined} onCreateGroup={isAdmin ? handleCreateGroupForSubject : undefined} />
                    )}
                </div>
            </section>

            <CreateGroupDialog
                open={createDialogOpen}
                onOpenChange={handleDialogClose}
                onSave={handleCreateGroup}
                subjects={subjects}
                preSelectedSubjectId={preSelectedSubjectId}
            />
        </>
    )
}