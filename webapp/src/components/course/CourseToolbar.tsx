import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { CirclePlus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CourseToolbarProps {
    setOpenDrawer: (state: boolean) => void;
    deleteSelectedCourses: () => void;
    selectedIds: string[];
}

export function CourseToolbar({ setOpenDrawer, deleteSelectedCourses, selectedIds }: CourseToolbarProps) {

    const { t } = useTranslation();

    return (
        <section className="flex items-center justify-between bg-muted/50 p-4 rounded-xl mt-2 mx-2 gap-4" >
            <div className="flex-1 flex justify-end gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="destructive"
                            onClick={deleteSelectedCourses}
                            disabled={!selectedIds?.length}
                            className="lg:size-auto size-10 lg:px-4"
                        >
                            <Trash2 className="lg:mr-2" />
                            <span className="hidden lg:inline">
                                {t("toolbar.courses.delete.selected")}
                            </span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t("toolbar.courses.delete.selected")}</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            onClick={() => setOpenDrawer(true)}
                            className="lg:size-auto size-10 lg:px-4"
                        >
                            <CirclePlus className="lg:mr-2" />
                            <span className="hidden lg:inline">
                                {t("toolbar.courses.create")}
                            </span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t("toolbar.courses.create")}</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </section>
    )
}