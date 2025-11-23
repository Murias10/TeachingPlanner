import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
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
        <TooltipProvider>
            <div className="flex gap-2 items-center justify-end">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 gap-2"
                            onClick={() => setOpenDrawer(true)}
                        >
                            <CirclePlus className="w-4 h-4" />
                            <span className="hidden sm:inline text-xs">{t("toolbar.courses.create")}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t("toolbar.courses.create")}
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="h-9 gap-2"
                            onClick={deleteSelectedCourses}
                            disabled={!selectedIds?.length}
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline text-xs">{t("toolbar.courses.delete.selected")}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t("toolbar.courses.delete.selected")}
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    )
}