import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTranslation } from "react-i18next";
import { CirclePlus, Trash2 } from "lucide-react";

interface ClassroomToolbarProps {
    setOpenDrawer: (state: boolean) => void;
    deleteSelectedClassrooms: () => void;
    selectedIds: string[];
}

export function ClassroomToolbar({ setOpenDrawer, deleteSelectedClassrooms, selectedIds }: ClassroomToolbarProps) {

    const { t } = useTranslation();

    return (
        <section className="flex items-center justify-between bg-muted/50 p-4 rounded-xl mt-2 mx-2 gap-4">
            <div className="flex-1 flex justify-end">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="destructive" size="lg" className="mr-2" onClick={deleteSelectedClassrooms}
                            disabled={!selectedIds?.length}>
                            <Trash2 /> {t("toolbar.classrooms.delete.selected")}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t("toolbar.classrooms.delete.selected")}
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="lg" onClick={() => setOpenDrawer(true)}>
                            <CirclePlus />{t("toolbar.classrooms.create")}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t("toolbar.classrooms.create")}
                    </TooltipContent>
                </Tooltip>
            </div>
        </section>
    );
}
