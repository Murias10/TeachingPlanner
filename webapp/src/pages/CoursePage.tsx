
import { CourseToolbar } from "@/components/CourseToolbar"
import { CourseTable } from "@/components/CourseTable"
import { useBreadcrumbContext } from "@/context/useBreadcrumbContext"
import { useEffect, useState } from "react"
import { useCourses } from "@/hooks/useCourses"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { useTranslation } from "react-i18next"
import { useFloatingAlertContext } from "@/context/useFloatingAlertContext"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerClose,
    DrawerDescription
} from "@/components/ui/drawer";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

export default function CoursePage() {

    const STATES = ["active", "inactive", "archived"];
    const CURRENT_YEAR = new Date().getFullYear();
    const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => {
        const start = CURRENT_YEAR + i;
        return `${start}-${start + 1}`;
    });

    const { t } = useTranslation()

    const { triggerAlert } = useFloatingAlertContext()

    const { setItems } = useBreadcrumbContext()

    useEffect(() => {
        setItems([
            { label: t("breadcrumb.home"), href: "/home" },
            { label: t("breadcrumb.degrees"), href: "/degrees" },
            { label: t("breadcrumb.courses"), href: "/courses" },
        ])
    }, [setItems, t])

    const { data: courses = [], isLoading, error, refetch } = useCourses()

    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const handleDeleteCourse = async (courseId: string) => {
        refetchData();
        console.log("HANDLE DELETE", courseId)
    };

    const handleDeleteSelectedCourses = async () => {

        if (selectedIds.length === 0) return;

        for (const id of selectedIds) {
            await handleDeleteCourse(id);
        }

        refetchData();
        setSelectedIds([]);
    }

    const handleDeleteCalendar = async (calendarId: string, force = false) => {
        try {
            const res = await fetch(`http://localhost:8080/calendar/${calendarId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ force })
            });

            if (!res.ok) {
                switch (res.status) {
                    case 404: {
                        triggerAlert({
                            title: t("alerts.calendar.error.title"),
                            description: t("alerts.calendar.error.notFound"),
                            variant: "destructive"
                        });
                        break;
                    }

                    case 409: {
                        const json = await res.json();
                        const relatedEvents = json.data?.relatedEvents ?? 0;

                        triggerAlert({
                            title: t("alerts.calendar.warning.title"),
                            description: t("alerts.calendar.warning.hasEvents", { count: relatedEvents }),
                            variant: "warning"
                        });

                        // Aquí puedes abrir un diálogo de confirmación en el frontend
                        break;
                    }

                    default: {
                        triggerAlert({
                            title: t("alerts.calendar.error.title"),
                            description: t("alerts.calendar.error.default"),
                            variant: "destructive"
                        });
                        break;
                    }
                }

                return;
            }

            triggerAlert({
                title: t("alerts.calendar.success.delete.title"),
                description: t("alerts.calendar.success.delete.description"),
                variant: "success"
            });

            refetchData();
        } catch {
            triggerAlert({
                title: t("alerts.calendar.error.title"),
                description: t("alerts.calendar.error.network"),
                variant: "destructive"
            });
        }
    };

    const [openDrawer, setOpenDrawer] = useState(false);
    const [year, setYear] = useState("");
    const [state, setState] = useState("");

    const handleSaveCourse = async () => {
        refetchData();
        console.log("HANDLE SAVE")
    }

    useEffect(() => {
        if (error) {
            triggerAlert({
                title: t("alerts.course.error.title"),
                description: t("alerts.course.error.read"),
                variant: "destructive"
            })
        }
    }, [error, t, triggerAlert])

    const refetchData = () => {
        refetch()
    }

    return (
        <>
            <CourseToolbar setOpenDrawer={setOpenDrawer} deleteSelectedCourses={handleDeleteSelectedCourses} selectedIds={selectedIds} />
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="min-w-[400px] w-2/3">
                    {!isLoading && <CourseTable courses={courses} deleteCourse={handleDeleteCourse} deleteCalendar={handleDeleteCalendar} setSelectedIds={setSelectedIds} />}
                    {isLoading && <LoadingSpinner />}
                </div>
            </section>
            <Drawer open={openDrawer} onOpenChange={setOpenDrawer}>
                <DrawerContent className="flex flex-col max-h-screen">
                    <DrawerHeader>
                        <DrawerTitle>{t("drawer.courses.create.title")}</DrawerTitle>
                        <DrawerDescription>
                            {t("drawer.courses.create.description")}
                        </DrawerDescription>
                    </DrawerHeader>

                    {/* Contenido desplazable */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Select de estado */}
                        <div className="space-y-2 max-w-sm mx-auto">
                            <Label htmlFor="course-start-end-year">{t("drawer.courses.create.start.end.year")}</Label>
                            <Select value={state} onValueChange={setState}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecciona un estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATES.map((state) => (
                                        <SelectItem key={state} value={state}>
                                            {state.charAt(0).toUpperCase() + state.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Select de año académico */}
                        <div className="space-y-2 max-w-sm mx-auto">
                            <Label htmlFor="course-state">{t("drawer.courses.create.state")}</Label>
                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecciona un año académico" />
                                </SelectTrigger>
                                <SelectContent>
                                    {YEAR_OPTIONS.map((year) => (
                                        <SelectItem key={year} value={year}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="p-4 flex justify-end space-x-2 border-t">
                        <DrawerClose asChild>
                            <Button variant="outline" onClick={() => {
                                setOpenDrawer(false);
                                setYear("");
                                setState("");
                            }}>{t("drawer.courses.create.cancel")}</Button>
                        </DrawerClose>
                        <Button disabled={!state || !year} onClick={handleSaveCourse}>{t("drawer.courses.create.save")}</Button>
                    </div>
                </DrawerContent>
            </Drawer>
        </>
    )
}