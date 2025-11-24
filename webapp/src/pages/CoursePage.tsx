import { CourseToolbar } from "@/components/course/CourseToolbar"
import { CourseTable } from "@/components/course/CourseTable"
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog"
import { ProtectedComponent } from "@/components/ProtectedComponent"
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext"
import { useAuth } from "@/contexts/AuthContext"
import { useCallback, useEffect, useState, useMemo } from "react"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { useTranslation } from "react-i18next"
import { useFloatingAlertContext } from "@/contexts/useFloatingAlertContext"
import { useParams } from "react-router-dom"
import { useDeleteCourse } from "@/hooks/course/useDeleteCourse"
import { useCreateCourse } from "@/hooks/course/useCreateCourse"
import { useEditCourse } from "@/hooks/course/useEditCourse"
import { useDeleteCalendar } from "@/hooks/calendar/useDeleteCalendar"
import { useDegreeByAcronym } from "@/hooks/degree/useDegreeByAcronym"
import { useImportCalendar } from "@/hooks/calendar/useImportCalendar"
import { CreateCourseDrawer } from "@/components/course/CreateCourseDrawer"
import { EditCourseDrawer, EditCourseFormData } from "@/components/course/EditCourseDrawer"
import { CreateCalendarDrawer } from "@/components/calendar/CreateCalendarDrawer"
import { CourseFormData, Course } from "@/types/Course"
import { CalendarFormData, CalendarDrawerData } from "@/types/Calendar"
import { useCoursesByDegreeId } from "@/hooks/course/useCoursesByDegreeId"

interface DeleteState {
    type: 'single' | 'bulk' | 'calendar' | null;
    courseId?: string;
    calendarId?: string;
    selectedIds?: string[];
}

export default function CoursePage() {
    const { t } = useTranslation()
    const { user } = useAuth()

    // Extraer el acrónimo de la URL
    const { acronym } = useParams<{ acronym: string }>()

    const { triggerAlert } = useFloatingAlertContext()
    const { isAuthenticated } = useAuth()

    const isAdmin = user?.role === "ADMIN"

    const { deleteCourse } = useDeleteCourse()
    const { createCourse } = useCreateCourse()
    const { editCourse } = useEditCourse()
    const { deleteCalendar } = useDeleteCalendar()
    const { importCalendar } = useImportCalendar()
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
    } = useCoursesByDegreeId(degree?.id || null)

    // Filtrar cursos según autenticación
    // Si está autenticado: mostrar todos los cursos
    // Si no está autenticado: mostrar solo cursos ACTIVO
    const filteredCourses = useMemo(() => {
        return isAuthenticated
            ? courses
            : courses.filter(course => course.state === 'ACTIVO')
    }, [isAuthenticated, courses])

    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [openDrawer, setOpenDrawer] = useState(false)
    const [openEditDrawer, setOpenEditDrawer] = useState(false)
    const [editCourseData, setEditCourseData] = useState<Course | null>(null)
    const [openCalendarDrawer, setOpenCalendarDrawer] = useState(false)
    const [calendarDrawerData, setCalendarDrawerData] = useState<CalendarDrawerData | null>(null)
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

    // Función principal de eliminación de calendario
    const performDeleteCalendar = useCallback(async (calendarId: string, showAlert = true) => {
        const result = await deleteCalendar(calendarId, refetch);

        if (result.success && showAlert) {
            triggerAlert({
                title: t("alerts.calendar.success.delete.title"),
                description: t("alerts.calendar.success.delete.description"),
                variant: "success"
            });
        } else if (!result.success && showAlert) {
            let errorMessage = t("alerts.calendar.error.delete.description");

            // Personalizar mensaje según el tipo de error
            if (result.status === 404) {
                errorMessage = t("alerts.calendar.error.delete.not_found");
            } else if (result.status === 403) {
                errorMessage = t("alerts.calendar.error.delete.forbidden");
            } else if (result.message) {
                errorMessage = result.message;
            }

            triggerAlert({
                title: t("alerts.calendar.error.delete.title"),
                description: errorMessage,
                variant: "destructive"
            });
        }

        return result.success;
    }, [deleteCalendar, refetch, triggerAlert, t]);

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

    // Abrir drawer para crear calendario
    const handleCreateCalendar = useCallback((courseId: string, semester: number) => {
        const course = courses.find(c => c.id === courseId);
        if (!course || !degree?.id) return;

        setCalendarDrawerData({
            courseId,
            semester,
            courseYear: `${course.startYear}-${course.endYear}`,
            degreeId: degree.id
        });
        setOpenCalendarDrawer(true);
    }, [courses, degree?.id]);

    // Iniciar eliminación de calendario
    const handleDeleteCalendarWithConfirmation = useCallback((calendarId: string) => {
        // Buscar el curso que contiene este calendario
        const course = courses.find(c =>
            c.calendars?.some(calendar => calendar.id === calendarId)
        );

        setDeleteState({
            type: 'calendar',
            calendarId,
            courseId: course?.id // AGREGAR courseId al estado
        });
    }, [courses]);

    // Confirmar eliminación
    const handleConfirmDelete = useCallback(async () => {
        if (deleteState.type === 'single' && deleteState.courseId) {
            await performDeleteCourse(deleteState.courseId, true);
            setDeleteState({ type: null });

        } else if (deleteState.type === 'bulk' && deleteState.selectedIds) {
            let deletedCount = 0;

            for (const id of deleteState.selectedIds) {
                const success = await performDeleteCourse(id, false);
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
            await performDeleteCalendar(deleteState.calendarId, true);
            setDeleteState({ type: null });
        }
    }, [deleteState, performDeleteCourse, performDeleteCalendar, triggerAlert, t]);

    // Cerrar diálogo de eliminación
    const handleCloseDeleteDialog = useCallback(() => {
        setDeleteState({ type: null });
    }, []);

    // Cerrar drawer de calendario
    const handleCloseCalendarDrawer = useCallback(() => {
        setOpenCalendarDrawer(false);
        setCalendarDrawerData(null);
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

    const handleEditCourse = useCallback(async (formData: EditCourseFormData) => {
        const result = await editCourse(formData, refetch);

        if (result.success) {
            setOpenEditDrawer(false);
            triggerAlert({
                title: t("alerts.course.success.edit.title"),
                description: t("alerts.course.success.edit.description", {
                    startYear: formData.startYear,
                    endYear: formData.endYear
                }),
                variant: "success"
            });
            return;
        }

        // Manejo de errores de edición
        const errorMessage = result.message || t("alerts.course.error.edit.description");

        triggerAlert({
            title: t("alerts.course.error.edit.title"),
            description: errorMessage,
            variant: "destructive",
        });
    }, [editCourse, refetch, triggerAlert, t]);

    // Función para crear calendario manual
    const createManualCalendar = useCallback(async (formData: CalendarFormData) => {
        if (!calendarDrawerData?.degreeId) {
            throw new Error('Degree ID is required');
        }

        const response = await fetch(`http://localhost:8080/api/calendars`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idCourse: formData.courseId,
                degreeId: calendarDrawerData.degreeId,
                semester: formData.semester,
                start: formData.startDate?.toISOString(),
                end: formData.endDate?.toISOString()
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error creating manual calendar');
        }

        return await response.json();
    }, [calendarDrawerData]);

    // Guardar nuevo calendario
    const handleSaveCalendar = useCallback(async (formData: CalendarFormData): Promise<void> => {
        if (!calendarDrawerData) return;

        if (formData.files?.length && formData.formData) {
            // Modo importación - usar mutation con onSuccess
            return new Promise((resolve, reject) => {
                importCalendar(
                    {
                        courseId: formData.courseId,
                        degreeId: calendarDrawerData.degreeId,
                        semester: formData.semester,
                        files: formData.files!,
                    },
                    {
                        onSuccess: () => {
                            handleCloseCalendarDrawer();

                            triggerAlert({
                                title: t("alerts.calendar.success.create.title"),
                                description: t("alerts.calendar.success.create.description", {
                                    semester: formData.semester,
                                    year: calendarDrawerData.courseYear
                                }),
                                variant: "success"
                            });

                            refetch();
                            resolve();
                        },
                        onError: (error) => {
                            console.error('Error importing calendar:', error);

                            let errorMessage = t("alerts.calendar.error.create.description");

                            if (error instanceof Error) {
                                if (error.message.includes('already exists')) {
                                    errorMessage = t("alerts.calendar.error.create.conflict.description");
                                } else if (error.message.includes('Course not found')) {
                                    errorMessage = t("alerts.calendar.error.create.course.description");
                                } else {
                                    errorMessage = error.message;
                                }
                            }

                            triggerAlert({
                                title: t("alerts.calendar.error.create.title"),
                                description: errorMessage,
                                variant: "destructive"
                            });
                            reject(error);
                        }
                    }
                );
            });
        } else {
            // Modo manual
            try {
                await createManualCalendar(formData);

                handleCloseCalendarDrawer();

                triggerAlert({
                    title: t("alerts.calendar.success.create.title"),
                    description: t("alerts.calendar.success.create.description", {
                        semester: formData.semester,
                        year: calendarDrawerData.courseYear
                    }),
                    variant: "success"
                });

                refetch();
            } catch (error) {
                console.error('Error creating calendar:', error);

                let errorMessage = t("alerts.calendar.error.create.description");

                if (error instanceof Error) {
                    if (error.message.includes('already exists')) {
                        errorMessage = t("alerts.calendar.error.create.conflict.description");
                    } else if (error.message.includes('Course not found')) {
                        errorMessage = t("alerts.calendar.error.create.course.description");
                    } else {
                        errorMessage = error.message;
                    }
                }

                triggerAlert({
                    title: t("alerts.calendar.error.create.title"),
                    description: errorMessage,
                    variant: "destructive"
                });
                throw error;
            }
        }
    }, [importCalendar, createManualCalendar, triggerAlert, t, refetch, calendarDrawerData, handleCloseCalendarDrawer]);

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
                    description: t("dialog.courses.delete.single.description", {
                        startYear: courses.find(c => c.id === deleteState.courseId)?.startYear,
                        endYear: courses.find(c => c.id === deleteState.courseId)?.endYear
                    }),
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

            case 'calendar': {
                // Una sola búsqueda del curso
                const course = courses.find(c => c.id === deleteState.courseId);
                // Una sola búsqueda del calendario
                const calendar = course?.calendars?.find(cal => cal.id === deleteState.calendarId);

                return {
                    open: true,
                    onOpenChange: handleCloseDeleteDialog,
                    onConfirm: handleConfirmDelete,
                    title: t("dialog.calendar.delete.title"),
                    description: t("dialog.calendar.delete.description", {
                        semester: calendar?.semester || 0,
                        startYear: course?.startYear || 0,
                        endYear: course?.endYear || 0
                    }),
                };
            }
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
            <section className="h-full bg-background overflow-hidden flex flex-col">
                {/* Toolbar */}
                <ProtectedComponent requiredRoles={["ADMIN"]} hideIfNoAccess={true}>
                    <div className="px-4 py-3 border-b bg-background flex justify-end items-center">
                        <CourseToolbar
                            setOpenDrawer={setOpenDrawer}
                            deleteSelectedCourses={handleDeleteSelectedCourses}
                            selectedIds={selectedIds}
                        />
                    </div>
                </ProtectedComponent>

                {/* Table */}
                <div className="flex-1 overflow-auto px-4 py-0 flex items-center justify-center">
                    {isCoursesLoading || isDegreeLoading ? (
                        <div className="h-full flex items-center justify-center p-10">
                            <LoadingSpinner />
                        </div>
                    ) : (
                        <CourseTable
                            courses={filteredCourses}
                            deleteCourse={handleDeleteCourse}
                            deleteCalendar={handleDeleteCalendarWithConfirmation}
                            createCalendar={handleCreateCalendar}
                            onEditCourse={(course) => {
                                setEditCourseData(course);
                                setOpenEditDrawer(true);
                            }}
                            setSelectedIds={setSelectedIds}
                            isAdmin={isAdmin}
                        />
                    )}
                </div>
            </section>

            <CreateCourseDrawer
                open={openDrawer && !!degree?.id}
                onOpenChange={setOpenDrawer}
                onSave={handleSaveCourse}
            />

            <EditCourseDrawer
                open={openEditDrawer}
                onOpenChange={setOpenEditDrawer}
                onSave={handleEditCourse}
                courseData={editCourseData || undefined}
            />

            <CreateCalendarDrawer
                open={openCalendarDrawer}
                onOpenChange={handleCloseCalendarDrawer}
                onSave={handleSaveCalendar}
                calendarData={calendarDrawerData}
            />

            <DeleteConfirmationDialog {...getDeleteDialogProps()} />
        </>
    )
}