import { CourseToolbar } from "@/components/course/CourseToolbar"
import { CourseTable } from "@/components/course/CourseTable"
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog"
import { useBreadcrumbContext } from "@/context/useBreadcrumbContext"
import { useCallback, useEffect, useState } from "react"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { useTranslation } from "react-i18next"
import { useFloatingAlertContext } from "@/context/useFloatingAlertContext"
import { useParams } from "react-router-dom"
import { useCoursesByDegreeAcronym } from "@/hooks/course/useCoursesByDegreeAcronym"
import { useDeleteCourse } from "@/hooks/course/useDeleteCourse"
import { useCreateCourse } from "@/hooks/course/useCreateCourse"
import { useDegreeByAcronym } from "@/hooks/degree/useDegreeByAcronym"
import { CreateCourseDrawer } from "@/components/course/CreateCourseDrawer"

interface DeleteState {
    type: 'single' | 'bulk' | 'calendar' | null;
    courseId?: string;
    calendarId?: string;
    selectedIds?: string[];
}

interface CourseFormData {
    startYear: string;
    endYear: string;
    state: string;
}

export default function CoursePage() {
    const { t } = useTranslation()

    // Extraer el acrónimo de la URL
    const { acronym } = useParams<{ acronym: string }>()

    const { triggerAlert } = useFloatingAlertContext()
    const { deleteCourse } = useDeleteCourse()
    const { createCourse } = useCreateCourse()
    const { setItems } = useBreadcrumbContext()

    // Obtener degree desde el acrónimo de la URL
    const {
        data: degree,
        isLoading: isDegreeLoading,
        error: degreeError
    } = useDegreeByAcronym(acronym || null)

    // Obtener courses usando el acrónimo
    const {
        data: courses = [],
        isLoading: isCoursesLoading,
        error: coursesError,
        refetch
    } = useCoursesByDegreeAcronym(acronym || null)

    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [openDrawer, setOpenDrawer] = useState(false)
    const [deleteState, setDeleteState] = useState<DeleteState>({ type: null })

    // Configurar breadcrumb
    useEffect(() => {
        const items = [
            { label: t("breadcrumb.home"), href: "/home" },
            { label: t("breadcrumb.degrees"), href: "/degrees" },
            { label: t("breadcrumb.courses"), href: "" },
        ];

        setItems(items);
    }, [setItems, t, degree, acronym])

    // Manejo de errores de carga
    useEffect(() => {
        if (coursesError) {
            triggerAlert({
                title: t("alerts.course.error.title"),
                description: t("alerts.course.error.read"),
                variant: "destructive"
            })
        }
    }, [coursesError, t, triggerAlert])

    // Función principal de eliminación de curso
    const performDeleteCourse = useCallback(async (courseId: string, showAlert = true) => {
        const result = await deleteCourse(courseId, refetch);

        if (result.success && showAlert) {
            triggerAlert({
                title: t("alerts.course.success.delete.individual.title"),
                description: t("alerts.course.success.delete.individual.description", {
                    startYear: courses.find(c => c.id === courseId)?.startYear,
                    endYear: courses.find(c => c.id === courseId)?.endYear
                }),
                variant: "success",
            });
        } else if (!result.success && showAlert) {
            triggerAlert({
                title: t("alerts.course.error.delete.individual.title"),
                description: t("alerts.course.error.delete.individual.description"),
                variant: "destructive",
            });
        }

        return result.success;
    }, [deleteCourse, refetch, triggerAlert, t, courses]);

    // Iniciar eliminación individual de curso
    const handleDeleteCourse = useCallback((courseId: string) => {
        setDeleteState({
            type: 'single',
            courseId
        });
    }, []);

    // Iniciar eliminación múltiple de cursos
    const handleDeleteSelectedCourses = useCallback(() => {
        if (selectedIds.length === 0) return;

        setDeleteState({
            type: 'bulk',
            selectedIds: [...selectedIds]
        });
    }, [selectedIds]);

    // Manejar eliminación de calendario con confirmación
    const handleDeleteCalendar = useCallback(async (calendarId: string, force = false) => {
        if (!force) {
            // Primer intento - verificar si hay eventos relacionados
            try {
                const res = await fetch(`http://localhost:8080/calendar/${calendarId}`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ force: false })
                });

                if (res.status === 409) {
                    // Mostrar diálogo de confirmación
                    setDeleteState({
                        type: 'calendar',
                        calendarId
                    });
                    return;
                }

                if (!res.ok) {
                    throw new Error('Delete failed');
                }

                // Eliminación exitosa
                triggerAlert({
                    title: t("alerts.calendar.success.delete.title"),
                    description: t("alerts.calendar.success.delete.description"),
                    variant: "success"
                });

                refetch();
            } catch {
                triggerAlert({
                    title: t("alerts.calendar.error.title"),
                    description: t("alerts.calendar.error.network"),
                    variant: "destructive"
                });
            }
        } else {
            // Eliminación forzada
            try {
                const res = await fetch(`http://localhost:8080/calendar/${calendarId}`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ force: true })
                });

                if (!res.ok) throw new Error('Forced delete failed');

                triggerAlert({
                    title: t("alerts.calendar.success.delete.title"),
                    description: t("alerts.calendar.success.delete.description"),
                    variant: "success"
                });

                refetch();
            } catch {
                triggerAlert({
                    title: t("alerts.calendar.error.title"),
                    description: t("alerts.calendar.error.default"),
                    variant: "destructive"
                });
            }
        }
    }, [triggerAlert, t, refetch]);

    // Confirmar eliminación
    const handleConfirmDelete = useCallback(async () => {
        if (deleteState.type === 'single' && deleteState.courseId) {
            await performDeleteCourse(deleteState.courseId, true); // showAlert = true para borrado individual
            setDeleteState({ type: null });

        } else if (deleteState.type === 'bulk' && deleteState.selectedIds) {
            let deletedCount = 0;

            for (const id of deleteState.selectedIds) {
                const success = await performDeleteCourse(id, false); // showAlert = false para borrado múltiple
                if (success) deletedCount++;
            }

            if (deletedCount > 0) {
                triggerAlert({
                    title: t("alerts.course.success.delete.multiple.title"),
                    description: t("alerts.course.success.delete.multiple.description", { count: deletedCount }),
                    variant: "success",
                });
            }

            setSelectedIds([]);
            setDeleteState({ type: null });

        } else if (deleteState.type === 'calendar' && deleteState.calendarId) {
            await handleDeleteCalendar(deleteState.calendarId, true);
            setDeleteState({ type: null });
        }
    }, [deleteState, performDeleteCourse, handleDeleteCalendar, triggerAlert, t]);

    // Cerrar diálogo de eliminación
    const handleCloseDeleteDialog = useCallback(() => {
        setDeleteState({ type: null });
    }, []);

    // Guardar nuevo curso
    const handleSaveCourse = useCallback(async (formData: CourseFormData) => {
        if (!degree?.id) return;

        const result = await createCourse(formData, degree.id, refetch);

        if (result.success) {
            setOpenDrawer(false);
            triggerAlert({
                title: t("alerts.course.success.create.title"),
                description: t("alerts.course.success.create.description", {
                    startYear: formData.startYear,
                    endYear: formData.endYear
                }),
                variant: "success"
            });
            return;
        }

        // Manejo de errores de creación
        let errorMessage = result.message || t("alerts.course.error.create.description");

        if (result.status === 409) {
            errorMessage = t("alerts.course.error.create.conflict.description");
        }

        triggerAlert({
            title: t("alerts.course.error.create.title"),
            description: errorMessage,
            variant: "destructive",
        });
    }, [degree?.id, createCourse, refetch, triggerAlert, t]);

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

        switch (deleteState.type) {
            case 'single':
                return {
                    open: true,
                    onOpenChange: handleCloseDeleteDialog,
                    onConfirm: handleConfirmDelete,
                    title: t("dialog.courses.delete.single.title"),
                    description: t("dialog.courses.delete.single.description", { startYear: courses.find(c => c.id === deleteState.courseId)?.startYear, endYear: courses.find(c => c.id === deleteState.courseId)?.endYear }),
                };

            case 'bulk':
                return {
                    open: true,
                    onOpenChange: handleCloseDeleteDialog,
                    onConfirm: handleConfirmDelete,
                    title: t("dialog.courses.delete.multiple.title"),
                    description: t("dialog.courses.delete.multiple.description", {
                        count: deleteState.selectedIds?.length || 0
                    }),
                };

            case 'calendar':
                return {
                    open: true,
                    onOpenChange: handleCloseDeleteDialog,
                    onConfirm: handleConfirmDelete,
                    title: t("dialog.calendar.delete.title"),
                    description: t("dialog.calendar.delete.description"),
                };

            default:
                return {
                    open: false,
                    onOpenChange: handleCloseDeleteDialog,
                    onConfirm: () => { },
                    title: "",
                    description: "",
                };
        }
    }, [deleteState, handleCloseDeleteDialog, handleConfirmDelete, t, courses]);

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
            <CourseToolbar
                setOpenDrawer={setOpenDrawer}
                deleteSelectedCourses={handleDeleteSelectedCourses}
                selectedIds={selectedIds}
            />

            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="min-w-[400px] w-2/3">
                    {isCoursesLoading || isDegreeLoading ? (
                        <LoadingSpinner />
                    ) : (
                        <CourseTable
                            courses={courses}
                            deleteCourse={handleDeleteCourse}
                            deleteCalendar={handleDeleteCalendar}
                            setSelectedIds={setSelectedIds}
                        />
                    )}
                </div>
            </section>

            <CreateCourseDrawer
                open={openDrawer && !!degree?.id}
                onOpenChange={setOpenDrawer}
                onSave={handleSaveCourse}
            />

            <DeleteConfirmationDialog {...getDeleteDialogProps()} />
        </>
    )
}