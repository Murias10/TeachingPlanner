import { DegreeToolbar } from "@/components/degree/DegreeToolbar"
import { DegreeTable } from "@/components/degree/DegreeTable"
import { CreateDegreeDrawer } from "@/components/degree/CreateDegreeDrawer"
import { EditDegreeDrawer, EditDegreeFormData } from "@/components/degree/EditDegreeDrawer"
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog"
import { ProtectedComponent } from "@/components/ProtectedComponent"
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext"
import { useAuth } from "@/contexts/AuthContext"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useDegrees } from "@/hooks/degree/useDegrees"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { useDeleteDegree } from "@/hooks/degree/useDeleteDegree"
import { useCreateDegree } from "@/hooks/degree/useCreateDegree"
import { useUpdateDegree } from "@/hooks/degree/useUpdateDegree"
import { useFloatingAlertContext } from "@/contexts/useFloatingAlertContext"
import { Degree } from "@/types/Degree"

interface DeleteState {
    type: 'single' | 'bulk' | null;
    degreeId?: string;
    selectedIds?: string[];
}

export default function DegreePage() {
    const { t } = useTranslation()
    const { user } = useAuth()

    const { triggerAlert } = useFloatingAlertContext()
    const { deleteDegree } = useDeleteDegree()
    const { createDegree } = useCreateDegree()
    const { updateDegree } = useUpdateDegree()
    const { setItems } = useBreadcrumbContext()

    const isAdmin = user?.role === "ADMIN"

    // Estados principales
    const { data: degrees = [], isLoading, error, refetch } = useDegrees()
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [editDrawerOpen, setEditDrawerOpen] = useState(false)
    const [degreeToEdit, setDegreeToEdit] = useState<Degree | undefined>(undefined)
    const [deleteState, setDeleteState] = useState<DeleteState>({ type: null })

    // Configurar breadcrumb
    useEffect(() => {
        setItems([
            { label: t("breadcrumb.home"), href: "/home" },
            { label: t("breadcrumb.degrees"), href: "/degrees" }
        ])
    }, [setItems, t])

    // Manejo de errores de carga
    useEffect(() => {
        if (error) {
            triggerAlert({
                title: t("alerts.degree.error.read.title"),
                description: t("alerts.degree.error.read.title"),
                variant: "destructive"
            })
        }
    }, [error, t, triggerAlert])

    // Función principal de eliminación (sin force)
    const performDelete = useCallback(async (degreeId: string) => {
        const result = await deleteDegree(degreeId, refetch);

        if (result.success) {
            triggerAlert({
                title: t("alerts.degree.success.delete.individual.title"),
                description: t("alerts.degree.success.delete.individual.description", { name: degrees.find(d => d.id === degreeId)?.name }),
                variant: "success",
            });
        } else {
            triggerAlert({
                title: t("alerts.degree.error.delete.individual.title"),
                description: t("alerts.degree.error.delete.individual.description"),
                variant: "destructive",
            });
        }

        return result.success;
    }, [deleteDegree, refetch, triggerAlert, t, degrees]);

    // Iniciar eliminación individual - solo abre el diálogo
    const handleDeleteClick = useCallback((degreeId: string) => {
        setDeleteState({
            type: 'single',
            degreeId
        });
    }, []);

    // Iniciar eliminación múltiple - solo abre el diálogo
    const handleDeleteSelectedDegrees = useCallback(() => {
        if (selectedIds.length === 0) return;

        setDeleteState({
            type: 'bulk',
            selectedIds: [...selectedIds]
        });
    }, [selectedIds]);

    // Confirmar eliminación - aquí se ejecuta la eliminación real
    const handleConfirmDelete = useCallback(async () => {
        if (deleteState.type === 'single' && deleteState.degreeId) {
            await performDelete(deleteState.degreeId);
            setDeleteState({ type: null });

        } else if (deleteState.type === 'bulk' && deleteState.selectedIds) {
            let deletedCount = 0;

            for (const id of deleteState.selectedIds) {
                const success = await performDelete(id);
                if (success) deletedCount++;
            }

            if (deletedCount > 0) {
                triggerAlert({
                    title: t("alerts.degree.success.delete.multiple.title"),
                    description: t("alerts.degree.success.delete.multiple.description", { count: deletedCount }),
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
        const translated = fields.map(field => t(`alerts.degree.error.create.${field}`));

        if (translated.length === 1) return translated[0];
        if (translated.length === 2) return translated.join(` ${t("common.and")} `);

        const last = translated.pop()!;
        return `${translated.join(", ")} ${t("common.and")} ${last}`;
    }, [t]);

    // Guardar nueva titulación
    const handleSave = useCallback(async (name: string, acronym: string) => {
        const result = await createDegree(name, acronym, refetch);

        if (result.success) {
            setDrawerOpen(false);
            triggerAlert({
                title: t("alerts.degree.success.create.title"),
                description: t("alerts.degree.success.create.description", { name }),
                variant: "success"
            });
            return;
        }

        // Manejo de errores de creación
        let errorMessage = result.message || t("alerts.degree.error.create.description");

        if (result.status === 409) {
            const conflictData = result.data as { fields?: string[] } | undefined;

            if (conflictData?.fields?.length) {
                const fieldText = formatConflictFields(conflictData.fields);
                errorMessage = t("alerts.degree.error.create.conflict.description", { fields: fieldText });
            }
        }

        triggerAlert({
            title: t("alerts.degree.error.create.title"),
            description: errorMessage,
            variant: "destructive",
        });
    }, [createDegree, refetch, triggerAlert, t, formatConflictFields]);

    // Manejo de click para editar titulación
    const handleEditClick = useCallback((degree: Degree) => {
        setDegreeToEdit(degree);
        setEditDrawerOpen(true);
    }, []);

    // Guardar cambios de titulación editada
    const handleEditSave = useCallback(async (formData: EditDegreeFormData) => {
        const result = await updateDegree(formData.degreeId, formData.name, formData.acronym, refetch);

        if (result.success) {
            setEditDrawerOpen(false);
            triggerAlert({
                title: t("alerts.degree.success.update.title"),
                description: t("alerts.degree.success.update.description", { name: formData.name }),
                variant: "success"
            });
            return;
        }

        // Manejo de errores de actualización
        let errorMessage = result.message || t("alerts.degree.error.update.description");

        if (result.status === 409) {
            const conflictData = result.data as { fields?: string[] } | undefined;

            if (conflictData?.fields?.length) {
                const fieldText = formatConflictFields(conflictData.fields);
                errorMessage = t("alerts.degree.error.update.conflict.description", { fields: fieldText });
            }
        }

        triggerAlert({
            title: t("alerts.degree.error.update.title"),
            description: errorMessage,
            variant: "destructive",
        });
    }, [updateDegree, refetch, triggerAlert, t, formatConflictFields]);

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
                ? t("dialog.degrees.delete.single.title")
                : t("dialog.degrees.delete.multiple.title"),
            description: isSingle
                ? t("dialog.degrees.delete.single.description", {
                    name: degrees.find(d => d.id === deleteState.degreeId)?.name
                })
                : t("dialog.degrees.delete.multiple.description", {
                    count: deleteState.selectedIds?.length || 0
                }),
        };
    }, [deleteState, handleCloseDeleteDialog, handleConfirmDelete, t, degrees]);

    return (
        <>
            <section className="h-full bg-background overflow-hidden flex flex-col">
                {/* Toolbar */}
                <ProtectedComponent requiredRoles={["ADMIN"]} hideIfNoAccess={true}>
                    <div className="px-4 py-3 border-b bg-background flex justify-end items-center">
                        <DegreeToolbar
                            deleteSelectedDegrees={handleDeleteSelectedDegrees}
                            selectedIds={selectedIds}
                            onCreateClick={() => setDrawerOpen(true)}
                        />
                    </div>
                </ProtectedComponent>

                {/* Table */}
                <div className="flex-1 overflow-auto px-4 py-0 flex items-center justify-center">
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : (
                        <DegreeTable
                            degrees={degrees}
                            deleteDegree={handleDeleteClick}
                            editDegree={handleEditClick}
                            setSelectedIds={setSelectedIds}
                            isAdmin={isAdmin}
                        />
                    )}
                </div>
            </section>

            <CreateDegreeDrawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                onSave={handleSave}
            />

            <EditDegreeDrawer
                open={editDrawerOpen}
                onOpenChange={setEditDrawerOpen}
                onSave={handleEditSave}
                degreeData={degreeToEdit}
            />

            <DeleteConfirmationDialog {...getDeleteDialogProps()} />
        </>
    )
}