import { Loader } from "lucide-react"

export function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center py-4">
            <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
    )
}
