import { useDegree } from "@/hooks/useDegree"
import { DegreeSelect } from '@/components/DegreeSelect'
import { Button } from '@/components/ui/button'

export function ToolBar() {
    const { degrees, loading, error, selectedDegree, setSelectedDegree } = useDegree()

    return (
        <section className="flex items-center space-x-4 bg-muted/50 p-4 rounded-xl mt-2 ml-2 mr-2">
            {!loading && !error && (
                <DegreeSelect
                    degrees={degrees}
                    value={selectedDegree}
                    onChange={setSelectedDegree}
                />
            )}
            <Button variant="outline" size="sm">Añadir curso +</Button>
        </section>
    )
}
