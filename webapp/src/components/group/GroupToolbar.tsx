import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip"
import { Plus } from "lucide-react";

interface GroupToolbarProps {
    onCreateGroup?: () => void;
}

export function GroupToolbar({ onCreateGroup }: GroupToolbarProps) {
    return (
        <TooltipProvider>
            <div className="flex gap-2 items-center justify-end">
                {onCreateGroup && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={onCreateGroup}
                                className="h-9 gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline text-xs">Crear grupo</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            Crear nuevo grupo
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
        </TooltipProvider>
    )
}
