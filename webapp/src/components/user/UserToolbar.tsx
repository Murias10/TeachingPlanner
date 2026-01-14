import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip"
import { CirclePlus, Trash2, FileUp } from "lucide-react";
import { useTranslation } from "react-i18next";

interface UserToolbarProps {
    deleteSelectedUsers?: () => void;
    selectedIds?: string[];
    onCreateClick?: () => void;
    onImportClick?: () => void;
}

export function UserToolbar({ deleteSelectedUsers, selectedIds, onCreateClick, onImportClick }: UserToolbarProps) {
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
                            <span className="hidden sm:inline text-xs">{t("users.toolbar.create")}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t("users.toolbar.createTooltip")}
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 gap-2"
                            onClick={onImportClick}
                        >
                            <FileUp className="w-4 h-4" />
                            <span className="hidden sm:inline text-xs">{t("users.toolbar.import")}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t("users.toolbar.importTooltip")}
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="h-9 gap-2"
                            onClick={deleteSelectedUsers}
                            disabled={!selectedIds?.length}
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline text-xs">{t("users.toolbar.deleteSelected")}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t("users.toolbar.deleteSelected")}
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    )
}
