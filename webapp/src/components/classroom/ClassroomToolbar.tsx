import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip"
import { CirclePlus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ClassroomToolbarProps {
    deleteSelectedClassrooms?: () => void;
    selectedIds?: string[];
    onCreateClick?: () => void;
}

export function ClassroomToolbar({ deleteSelectedClassrooms, selectedIds, onCreateClick }: ClassroomToolbarProps) {
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
                            onClick={onCreateClick}
                        >
                            <CirclePlus className="w-4 h-4" />
                            <span className="hidden sm:inline text-xs">{t("toolbar.classrooms.create")}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t("toolbar.classrooms.create")}
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="h-9 gap-2"
                            onClick={deleteSelectedClassrooms}
                            disabled={!selectedIds?.length}
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline text-xs">{t("toolbar.classrooms.delete.selected")}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t("toolbar.classrooms.delete.selected")}
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    )
}