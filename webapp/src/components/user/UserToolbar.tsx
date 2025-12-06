import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip"
import { CirclePlus, Trash2, FileUp } from "lucide-react";

interface UserToolbarProps {
    deleteSelectedUsers?: () => void;
    selectedIds?: string[];
    onCreateClick?: () => void;
    onImportClick?: () => void;
}

export function UserToolbar({ deleteSelectedUsers, selectedIds, onCreateClick, onImportClick }: UserToolbarProps) {

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
                            <span className="hidden sm:inline text-xs">Crear usuario</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        Crear nuevo usuario
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
                            <span className="hidden sm:inline text-xs">Importar usuarios</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        Importar usuarios desde Excel
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
                            <span className="hidden sm:inline text-xs">Eliminar seleccionados</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        Eliminar seleccionados
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    )
}
