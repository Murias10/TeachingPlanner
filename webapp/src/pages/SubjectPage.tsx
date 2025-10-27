import { SubjectToolbar } from "@/components/subject/SubjectToolbar"
import { SubjectTable } from "@/components/subject/SubjectTable"
import { CreateSubjectDrawer } from "@/components/subject/CreateSubjectDrawer"
import { ViewSubjectDrawer } from "@/components/subject/ViewSubjectDrawer"
import { EditSubjectDrawer } from "@/components/subject/EditSubjectDrawer"
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog"
import { ProtectedComponent } from "@/components/ProtectedComponent"
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext"
import { useAuth } from "@/contexts/AuthContext"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { useSubjectsByDegreeId } from "@/hooks/subject/useSubjectsByDegreeId"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { useDeleteSubject } from "@/hooks/subject/useDeleteSubject"
import { useCreateSubject } from "@/hooks/subject/useCreateSubject"
import { useUpdateSubject } from "@/hooks/subject/useUpdateSubject"
import { useDegreeByAcronym } from "@/hooks/degree/useDegreeByAcronym"
import { useFloatingAlertContext } from "@/contexts/useFloatingAlertContext"
import { Subject } from "@/types/Subject"
import { EditSubjectFormData } from "@/components/subject/EditSubjectDrawer"

interface DeleteState {
    type: 'single' | 'bulk' | null;
    subjectId?: string;
    selectedIds?: string[];
}

interface SubjectFormData {
    acronym: string;
    year: number;
    name: string;
    siesCode: string;
    semester: number;
}

export default function SubjectPage() {
    const { t } = useTranslation()
    const { user } = useAuth()

    const { acronym } = useParams<{ acronym: string }>()

    const { triggerAlert } = useFloatingAlertContext()

    const isAdmin = user?.role === "ADMIN"
    const { deleteSubject } = useDeleteSubject()
    const { createSubject } = useCreateSubject()
    const { updateSubject } = useUpdateSubject()
    const { setItems } = useBreadcrumbContext()

    // Obtener degree desde el acrónimo de la URL usando React Query
    const {
        data: degree,
        isLoading: isDegreeLoading,
        error: degreeError
    } = useDegreeByAcronym(acronym || null)


    // Obtener subjects usando el degreeId
    const {
        data: subjects = [],
        isLoading: isSubjectsLoading,
        error: subjectsError,
        refetch
    } = useSubjectsByDegreeId(degree?.id || null)

    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [viewDrawerOpen, setViewDrawerOpen] = useState(false)
    const [editDrawerOpen, setEditDrawerOpen] = useState(false)
    const [subjectToView, setSubjectToView] = useState<Subject | undefined>(undefined)
    const [subjectToEdit, setSubjectToEdit] = useState<Subject | undefined>(undefined)
    const [deleteState, setDeleteState] = useState<DeleteState>({ type: null })

    // Configurar breadcrumb - incluye el nombre del degree si está disponible
    useEffect(() => {
        const items = [
            { label: t("breadcrumb.home"), href: "/home" },
            { label: t("breadcrumb.degrees"), href: "/degrees" },
            { label: t("breadcrumb.subjects"), href: "" },
        ];


        setItems(items);
    }, [setItems, t, degree, acronym])

    // Manejo de errores de carga
    useEffect(() => {

        if (subjectsError) {
            triggerAlert({
                title: t("alerts.subject.error.read.title"),
                description: t("alerts.subject.error.read.description"),
                variant: "destructive"
            })
        }
    }, [subjectsError, t, triggerAlert])

    // Función principal de eliminación
    const performDelete = useCallback(async (subjectId: string) => {
        const result = await deleteSubject(subjectId, refetch);

        if (result.success) {
            triggerAlert({
                title: t("alerts.subject.success.delete.individual.title"),
                description: t("alerts.subject.success.delete.individual.description", {
                    name: subjects.find(s => s.id === subjectId)?.name
                }),
                variant: "success",
            });
        } else {
            triggerAlert({
                title: t("alerts.subject.error.delete.individual.title"),
                description: t("alerts.subject.error.delete.individual.description"),
                variant: "destructive",
            });
        }

        return result.success;
    }, [deleteSubject, refetch, triggerAlert, t, subjects]);

    // Iniciar eliminación individual - solo abre el diálogo
    const handleDeleteClick = useCallback((subjectId: string) => {
        setDeleteState({
            type: 'single',
            subjectId
        });
    }, []);

    // Iniciar eliminación múltiple - solo abre el diálogo
    const handleDeleteSelectedSubjects = useCallback(() => {
        if (selectedIds.length === 0) return;

        setDeleteState({
            type: 'bulk',
            selectedIds: [...selectedIds]
        });
    }, [selectedIds]);

    // Confirmar eliminación - aquí se ejecuta la eliminación real
    const handleConfirmDelete = useCallback(async () => {
        if (deleteState.type === 'single' && deleteState.subjectId) {
            await performDelete(deleteState.subjectId);
            setDeleteState({ type: null });

        } else if (deleteState.type === 'bulk' && deleteState.selectedIds) {
            let deletedCount = 0;

            for (const id of deleteState.selectedIds) {
                const success = await performDelete(id);
                if (success) deletedCount++;
            }

            if (deletedCount > 0) {
                triggerAlert({
                    title: t("alerts.subject.success.delete.multiple.title"),
                    description: t("alerts.subject.success.delete.multiple.description", { count: deletedCount }),
                    variant: "success",
                });
            }

            setSelectedIds([]);
            setDeleteState({ type: null });
        }
    }, [deleteState, performDelete, triggerAlert, t]);

    // Cerrar diálogo de eliminación
    const handleCloseDeleteDialog = useCallback(() => {
        setDeleteState({ type: null });
    }, []);

    // Función para formatear campos en conflicto (para creación)
    const formatConflictFields = useCallback((fields: string[]): string => {
        const translated = fields.map(field => t(`alerts.subject.error.create.${field}`));

        if (translated.length === 1) return translated[0];
        if (translated.length === 2) return translated.join(` ${t("common.and")} `);

        const last = translated.pop()!;
        return `${translated.join(", ")} ${t("common.and")} ${last}`;
    }, [t]);

    // Guardar nueva asignatura
    const handleSave = useCallback(async (formData: SubjectFormData) => {

        if (!degree?.id) return;

        const result = await createSubject(formData, degree?.id, refetch);

        if (result.success) {
            setDrawerOpen(false);
            triggerAlert({
                title: t("alerts.subject.success.create.title"),
                description: t("alerts.subject.success.create.description", { name: formData.name }),
                variant: "success"
            });
            return;
        }

        // Manejo de errores de creación
        let errorMessage = result.message || t("alerts.subject.error.create.description");

        if (result.status === 409) {
            const conflictData = result.data as { fields?: string[] } | undefined;

            if (conflictData?.fields?.length) {
                const fieldText = formatConflictFields(conflictData.fields);
                errorMessage = t("alerts.subject.error.create.conflict.description", { fields: fieldText });
            }
        }

        triggerAlert({
            title: t("alerts.subject.error.create.title"),
            description: errorMessage,
            variant: "destructive",
        });
    }, [createSubject, degree, refetch, triggerAlert, t, formatConflictFields]);

    // Abrir drawer de visualización
    const handleViewClick = useCallback((subject: Subject) => {
        setSubjectToView(subject);
        setViewDrawerOpen(true);
    }, []);

    // Abrir drawer de edición
    const handleEditClick = useCallback((subject: Subject) => {
        setSubjectToEdit(subject);
        setEditDrawerOpen(true);
    }, []);

    // Guardar edición de asignatura
    const handleEditSave = useCallback(async (formData: EditSubjectFormData) => {
        const result = await updateSubject(formData, refetch);

        if (result.success) {
            setEditDrawerOpen(false);
            triggerAlert({
                title: t("alerts.subject.success.edit.title"),
                description: t("alerts.subject.success.edit.description", { name: formData.name }),
                variant: "success"
            });
            return;
        }

        // Manejo de errores de edición
        let errorMessage = result.message || t("alerts.subject.error.edit.description");

        // Manejo específico para conflictos (409)
        if (result.status === 409) {
            const conflictData = result.data as { fields?: string[] } | undefined;

            if (conflictData?.fields?.length) {
                const fieldText = formatConflictFields(conflictData.fields);
                errorMessage = t("alerts.subject.error.edit.conflict.description", { fields: fieldText });
            }
        }

        triggerAlert({
            title: t("alerts.subject.error.edit.title"),
            description: errorMessage,
            variant: "destructive",
        });
    }, [updateSubject, refetch, triggerAlert, t, formatConflictFields]);

    // Generar props para el diálogo de eliminación
    const getDeleteDialogProps = useCallback(() => {
        if (!deleteState.type) {
            return {
                open: false,
                onOpenChange: handleCloseDeleteDialog,
                onConfirm: () => { },
                title: "",
                description: "",
            };
        }

        const isSingle = deleteState.type === 'single';

        return {
            open: true,
            onOpenChange: handleCloseDeleteDialog,
            onConfirm: handleConfirmDelete,
            title: isSingle
                ? t("dialog.subjects.delete.single.title")
                : t("dialog.subjects.delete.multiple.title"),
            description: isSingle
                ? t("dialog.subjects.delete.single.description", {
                    name: subjects.find(s => s.id === deleteState.subjectId)?.name
                })
                : t("dialog.subjects.delete.multiple.description", {
                    count: deleteState.selectedIds?.length || 0
                }),
        };
    }, [deleteState, handleCloseDeleteDialog, handleConfirmDelete, t, subjects]);

    // Mostrar loading mientras se obtiene el degree
    if (isDegreeLoading) {
        return <LoadingSpinner />
    }

    // Mostrar error si no se encuentra el degree
    if (degreeError) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-destructive mb-2">
                        {t("alerts.degree.error.title")}
                    </h2>
                    <p className="text-muted-foreground">{degreeError.message}</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <ProtectedComponent requiredRoles={["ADMIN"]} hideIfNoAccess={true}>
                <SubjectToolbar
                    deleteSelectedSubjects={handleDeleteSelectedSubjects}
                    selectedIds={selectedIds}
                    onCreateClick={() => setDrawerOpen(true)}
                />
            </ProtectedComponent>

            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="min-w-[400px] w-2/3">
                    {isSubjectsLoading ? (
                        <LoadingSpinner />
                    ) : (
                        <SubjectTable
                            subjects={subjects}
                            deleteSubject={handleDeleteClick}
                            setSelectedIds={setSelectedIds}
                            isAdmin={isAdmin}
                            onViewSubject={handleViewClick}
                            onEditSubject={handleEditClick}
                        />
                    )}
                </div>
            </section>

            <CreateSubjectDrawer
                open={drawerOpen && !!degree}
                onOpenChange={setDrawerOpen}
                onSave={handleSave}
            />

            <ViewSubjectDrawer
                open={viewDrawerOpen}
                onOpenChange={setViewDrawerOpen}
                subjectData={subjectToView}
            />

            <EditSubjectDrawer
                open={editDrawerOpen}
                onOpenChange={setEditDrawerOpen}
                onSave={handleEditSave}
                subjectData={subjectToEdit}
            />

            <DeleteConfirmationDialog {...getDeleteDialogProps()} />
        </>
    )
}