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
            <div className="flex-1 flex justify-end">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="destructive" size="lg" className="mr-2" onClick={deleteSelectedCourses}
                            disabled={!selectedIds?.length}>
                            <Trash2 /> {t("toolbar.courses.delete.selected")}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t("toolbar.courses.delete.selected")}
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="lg" onClick={() => setOpenDrawer(true)}>
                            <CirclePlus />{t("toolbar.courses.create")}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t("toolbar.courses.create")}
                    </TooltipContent>
                </Tooltip>
            </div>
        </section>
    )
}
