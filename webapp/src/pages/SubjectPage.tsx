import { Toolbar } from "@/components/Toolbar"
import { SubjectTable } from "@/components/SubjectTable"

export default function SubjectPage() {
    return (
        <>
            <Toolbar showDegreeSelector addButtonLabel="Añadir asignatura" onAdd={() => { }} />
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="min-w-[400px] w-2/3">
                    <SubjectTable />
                </div>
            </section>
        </>
    )
}