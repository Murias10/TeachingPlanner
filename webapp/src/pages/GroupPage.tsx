
import { GroupToolbar } from "@/components/group/GroupToolbar"
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext"
import { useCallback, useEffect, useState } from "react"
import { GroupTable } from "@/components/group/GroupTable"
import { useTranslation } from "react-i18next"
import { useSubjectsWithEventsAndGroupsByCourseAndSemester } from "@/hooks/subject/useSubjectsWithEventsAndGroupsByCourseIdAndSemester"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { useFloatingAlertContext } from "@/contexts/useFloatingAlertContext"
import { useCoursesByDegreeAcronym } from "@/hooks/course/useCoursesByDegreeAcronym"
import { useParams } from "react-router-dom"
import CreateGroupDialog from "@/components/group/CreateGroupDialog"
import { useCreateGroup } from "@/hooks/group/useCreateGroup"
import { useDeleteGroup } from "@/hooks/group/useDeleteGroup"

export default function GroupPage() {

    const { t } = useTranslation()

    const { triggerAlert } = useFloatingAlertContext()

    const { setItems } = useBreadcrumbContext()

    const [createDialogOpen, setCreateDialogOpen] = useState(false)

    // Obtener parámetros de la URL
    const { acronym, startYear, endYear, semester } = useParams();

    useEffect(() => {
        setItems([
            { label: t("breadcrumb.home"), href: "/home" },
            { label: t("breadcrumb.degrees"), href: "/degrees" },
            { label: t("breadcrumb.courses"), href: `/degrees/${acronym}/courses` },
            { label: t("breadcrumb.calendar"), href: `/degrees/${acronym}/courses/${startYear}/${endYear}/semester/${semester}/calendar` },
            { label: t("breadcrumb.groups"), href: `/degrees/${acronym}/courses/${startYear}/${endYear}/semester/${semester}/calendar/groups` }
        ])
    }, [setItems, t, acronym, startYear, endYear, semester])

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

    const { createGroup } = useCreateGroup()
    const { deleteGroup } = useDeleteGroup()

    const handleCreateGroup = useCallback(async (groupData: { subjectId: string; number: number; type: string; language: string }) => {
        const result = await createGroup(groupData, refetch)

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
    }, [createGroup, refetch, triggerAlert])

    const handleDeleteGroup = useCallback(async (groupId: string) => {
        // Find the group to get its details for the alert message
        const group = subjects.flatMap(s => s.groups || []).find(g => g.id === groupId);

        const result = await deleteGroup(groupId, refetch)

        if (result.success && group) {
            const subject = subjects.find(s => s.groups?.some(g => g.id === groupId));
            const langPrefix = group.language === 'EN' ? 'I-' : '';
            const groupLabel = subject ? `${subject.acronym}.${group.type}.${langPrefix}${group.number}` : '';

            triggerAlert({
                title: "Grupo eliminado",
                description: `El grupo '${groupLabel}' se ha eliminado correctamente`,
                variant: "default"
            })
        } else {
            triggerAlert({
                title: "Error al eliminar grupo",
                description: result.message || "No se pudo eliminar el grupo",
                variant: "destructive"
            })
        }
    }, [deleteGroup, refetch, triggerAlert, subjects])

    return (
        <>
            <section className="h-full bg-background overflow-hidden flex flex-col">
                {/* Toolbar */}
                <div className="px-4 py-3 border-b bg-background flex justify-end items-center">
                    <GroupToolbar onCreateGroup={() => setCreateDialogOpen(true)} />
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto px-4 py-0 flex items-center justify-center">
                    {isSubjectsLoading ? (
                        <div className="h-full flex items-center justify-center p-10">
                            <LoadingSpinner />
                        </div>
                    ) : (
                        <GroupTable subjects={subjects} onDeleteGroup={handleDeleteGroup} />
                    )}
                </div>
            </section>

            <CreateGroupDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSave={handleCreateGroup}
                subjects={subjects}
            />
        </>
    )
}