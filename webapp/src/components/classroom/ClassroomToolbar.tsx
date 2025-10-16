import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
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
        <section className="flex items-center justify-between bg-muted/50 p-4 rounded-xl mt-2 mx-2 gap-4">
            <div className="flex-1 flex justify-end gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="destructive"
                            onClick={deleteSelectedClassrooms}
                            disabled={!selectedIds?.length}
                            className="lg:size-auto size-10 lg:px-4"
                        >
                            <Trash2 className="lg:mr-2" />
                            <span className="hidden lg:inline">
                                {t("toolbar.classrooms.delete.selected")}
                            </span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t("toolbar.classrooms.delete.selected")}</p>
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
                                {t("toolbar.classrooms.create")}
                            </span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t("toolbar.classrooms.create")}</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </section>
    )
}