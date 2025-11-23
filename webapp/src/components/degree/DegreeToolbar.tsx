import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip"
import { CirclePlus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DegreeToolbarProps {
    deleteSelectedDegrees?: () => void;
    selectedIds?: string[];
    onCreateClick?: () => void;
}

export function DegreeToolbar({ deleteSelectedDegrees, selectedIds, onCreateClick }: DegreeToolbarProps) {
    const { t } = useTranslation();

    return (
        <TooltipProvider>
            <div className="flex gap-2 items-center justify-end">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            onClick={onCreateClick}
                            size="sm"
                            className="h-9 gap-2"
                        >
                            <CirclePlus className="w-4 h-4" />
                            <span className="hidden sm:inline text-xs">
                                {t("toolbar.degrees.create")}
                            </span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t("toolbar.degrees.create")}
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="destructive"
                            onClick={deleteSelectedDegrees}
                            disabled={!selectedIds?.length}
                            size="sm"
                            className="h-9 gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline text-xs">
                                {t("toolbar.degrees.delete.selected")}
                            </span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t("toolbar.degrees.delete.selected")}
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    )
}