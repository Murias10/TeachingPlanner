import { ClassroomToolbar } from "@/components/classroom/ClassroomToolbar"
import { ClassroomTable } from "@/components/classroom/ClassroomTable"
import { CreateClassroomDrawer } from "@/components/classroom/CreateClassroomDrawer"
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog"
import { useBreadcrumbContext } from "@/context/useBreadcrumbContext"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useClassrooms } from "@/hooks/classroom/useClassrooms"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { useDeleteClassroom } from "@/hooks/classroom/useDeleteClassroom"
import { useCreateClassroom } from "@/hooks/classroom/useCreateClassroom"
import { useFloatingAlertContext } from "@/context/useFloatingAlertContext"

interface DeleteState {
    type: 'single' | 'bulk' | null;
    classroomId?: string;
    selectedIds?: string[];
}

export default function ClassroomPage() {
    const { t } = useTranslation()

    const { triggerAlert } = useFloatingAlertContext()
    const { deleteClassroom } = useDeleteClassroom()
    const { createClassroom } = useCreateClassroom()
    const { setItems } = useBreadcrumbContext()

    // Estados principales
    const { data: classrooms = [], isLoading, error, refetch } = useClassrooms()
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [deleteState, setDeleteState] = useState<DeleteState>({ type: null })

    // Configurar breadcrumb
    useEffect(() => {
        setItems([
            { label: t("breadcrumb.home"), href: "/home" },
            { label: t("breadcrumb.classrooms"), href: "/classrooms" }
        ])
    }, [setItems, t])

    // Manejo de errores de carga
    useEffect(() => {
        if (error) {
            triggerAlert({
                title: t("alerts.classroom.error.title"),
                description: t("alerts.classroom.error.read"),
                variant: "destructive"
            })
        }
    }, [error, t, triggerAlert])

    // Función principal de eliminación
    const performDelete = useCallback(async (classroomId: string) => {
        const result = await deleteClassroom(classroomId, refetch);

        if (result.success) {
            triggerAlert({
                title: t("alerts.classroom.success.delete.title"),
                description: t("alerts.classroom.success.delete.description", {
                    code: classrooms.find(c => c.id === classroomId)?.code
                }),
                variant: "success",
            });
        } else {
            // Manejo específico de errores
            let errorMessage = result.message;

            switch (result.status) {
                case 404:
                    errorMessage = t("alerts.classroom.error.notFound");
                    break;
                case 409:
                    errorMessage = t("alerts.classroom.error.hasEvents");
                    break;
                default:
                    errorMessage = result.message || t("alerts.classroom.error.default");
            }

            triggerAlert({
                title: t("alerts.classroom.error.title"),
                description: errorMessage,
                variant: "destructive",
            });
        }

        return result.success;
    }, [deleteClassroom, refetch, triggerAlert, t, classrooms]);

    // Iniciar eliminación individual - solo abre el diálogo
    const handleDeleteClick = useCallback((classroomId: string) => {
        setDeleteState({
            type: 'single',
            classroomId
        });
    }, []);

    // Iniciar eliminación múltiple - solo abre el diálogo
    const handleDeleteSelectedClassrooms = useCallback(() => {
        if (selectedIds.length === 0) return;

        setDeleteState({
            type: 'bulk',
            selectedIds: [...selectedIds]
        });
    }, [selectedIds]);

    // Confirmar eliminación - aquí se ejecuta la eliminación real
    const handleConfirmDelete = useCallback(async () => {
        if (deleteState.type === 'single' && deleteState.classroomId) {
            await performDelete(deleteState.classroomId);
            setDeleteState({ type: null });

        } else if (deleteState.type === 'bulk' && deleteState.selectedIds) {
            let deletedCount = 0;

            for (const id of deleteState.selectedIds) {
                const success = await performDelete(id);
                if (success) deletedCount++;
            }

            if (deletedCount > 0) {
                triggerAlert({
                    title: t("alerts.classroom.success.delete.multiple.title"),
                    description: t("alerts.classroom.success.delete.multiple.description", { count: deletedCount }),
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
        const translated = fields.map(field => t(`alerts.classroom.error.create.${field}`));

        if (translated.length === 1) return translated[0];
        if (translated.length === 2) return translated.join(` ${t("common.and")} `);

        const last = translated.pop()!;
        return `${translated.join(", ")} ${t("common.and")} ${last}`;
    }, [t]);

    // Guardar nueva aula
    const handleSave = useCallback(async (code: string, gisUrl: string) => {
        const result = await createClassroom(code, gisUrl, refetch);

        if (result.success) {
            setDrawerOpen(false);
            triggerAlert({
                title: t("alerts.classroom.success.create.title"),
                description: t("alerts.classroom.success.create.description", { code }),
                variant: "success"
            });
            return;
        }

        // Manejo de errores de creación
        let errorMessage = result.message || t("alerts.classroom.error.create.description");

        if (result.status === 409) {
            const conflictData = result.data as { fields?: string[] } | undefined;

            if (conflictData?.fields?.length) {
                const fieldText = formatConflictFields(conflictData.fields);
                errorMessage = t("alerts.classroom.error.create.conflict.description", { fields: fieldText });
            }
        }

        triggerAlert({
            title: t("alerts.classroom.error.create.title"),
            description: errorMessage,
            variant: "destructive",
        });
    }, [createClassroom, refetch, triggerAlert, t, formatConflictFields]);

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
                ? t("dialog.classrooms.delete.single.title")
                : t("dialog.classrooms.delete.multiple.title"),
            description: isSingle
                ? t("dialog.classrooms.delete.single.description", {
                    code: classrooms.find(c => c.id === deleteState.classroomId)?.code
                })
                : t("dialog.classrooms.delete.multiple.description", {
                    count: deleteState.selectedIds?.length || 0
                }),
        };
    }, [deleteState, handleCloseDeleteDialog, handleConfirmDelete, t, classrooms]);

    return (
        <>
            <ClassroomToolbar
                deleteSelectedClassrooms={handleDeleteSelectedClassrooms}
                selectedIds={selectedIds}
                onCreateClick={() => setDrawerOpen(true)}
            />

            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="min-w-[400px] w-2/3">
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : (
                        <ClassroomTable
                            classrooms={classrooms}
                            deleteClassroom={handleDeleteClick}
                            setSelectedIds={setSelectedIds}
                        />
                    )}
                </div>
            </section>

            <CreateClassroomDrawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                onSave={handleSave}
            />

            <DeleteConfirmationDialog {...getDeleteDialogProps()} />
        </>
    )
}