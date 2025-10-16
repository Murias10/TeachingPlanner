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
            <div className="flex-1 flex justify-end gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="destructive"
                            onClick={deleteSelectedDegrees}
                            disabled={!selectedIds?.length}
                            className="lg:size-auto size-10 lg:px-4"
                        >
                            <Trash2 className="lg:mr-2" />
                            <span className="hidden lg:inline">
                                {t("toolbar.degrees.delete.selected")}
                            </span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t("toolbar.degrees.delete.selected")}</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            onClick={onCreateClick}
                            className="lg:size-auto size-10 lg:px-4"
                        >
                            <CirclePlus className="lg:mr-2" />
                            <span className="hidden lg:inline">
                                {t("toolbar.degrees.create")}
                            </span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t("toolbar.degrees.create")}</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </section>
    )
}