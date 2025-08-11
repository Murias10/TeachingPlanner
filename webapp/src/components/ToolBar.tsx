import { useDegree } from "@/hooks/useDegree"
import { DegreeSelect } from "@/components/DegreeSelect"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface ToolbarProps {
    title?: string
    showDegreeSelector?: boolean
    addButtonLabel?: string
    onAdd?: () => void
}

export function Toolbar({
    showDegreeSelector = false,
    addButtonLabel = "Añadir",
    onAdd,
}: ToolbarProps) {

    const {
        selectedDegree,
        setSelectedDegree,
        degrees,
        loading,
        error,
    } = useDegree()

    return (
        <section className="flex items-center justify-between bg-muted/50 p-4 rounded-xl mt-2 mx-2 gap-4">
            {showDegreeSelector && (
                <div>
                    {loading && (
                        <Skeleton className="h-10 w-[250px] rounded-md" />
                    )}

                    {!loading && !error && degrees?.length > 0 && (
                        <DegreeSelect
                            degrees={degrees}
                            value={selectedDegree}
                            onChange={setSelectedDegree}
                        />
                    )}
                </div>
            )}

            <div className="flex-1 flex justify-end">
                {onAdd && (
                    <Button onClick={onAdd} variant="outline" size="sm">
                        {addButtonLabel} +
                    </Button>
                )}
            </div>
        </section>
    )
}
