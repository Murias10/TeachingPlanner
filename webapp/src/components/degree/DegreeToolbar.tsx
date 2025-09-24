import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
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
        <section className="flex items-center justify-between bg-muted/50 p-4 rounded-xl mt-2 mx-2 gap-4">
            <div className="flex-1 flex justify-end">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="destructive"
                            size="lg"
                            className="mr-2"
                            onClick={deleteSelectedDegrees}
                            disabled={!selectedIds?.length}
                        >
                            <Trash2 /> {t("toolbar.degrees.delete.selected")}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t("toolbar.degrees.delete.selected")}
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={onCreateClick}
                        >
                            <CirclePlus />{t("toolbar.degrees.create")}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t("toolbar.degrees.create")}
                    </TooltipContent>
                </Tooltip>
            </div>
        </section>
    )
}