import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip"
import { ChevronsRight } from "lucide-react";

export function GroupToolbar() {
    return (
        <TooltipProvider>
            <div className="flex gap-2 items-center justify-end">
                <Link to="calendar">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 gap-2"
                            >
                                <span className="hidden sm:inline text-xs">Ver Calendario</span>
                                <ChevronsRight className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            Ver Calendario
                        </TooltipContent>
                    </Tooltip>
                </Link>
            </div>
        </TooltipProvider>
    )
}
