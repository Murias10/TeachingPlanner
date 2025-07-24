
import { Toolbar } from "@/components/Toolbar"
import { CourseTable } from "@/components/CourseTable"

export default function CalendarPage() {
    return (
        <>
            <Toolbar showDegreeSelector addButtonLabel="Añadir curso" onAdd={() => { }} />
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="min-w-[400px] w-2/3">
                    <CourseTable />
                </div>
            </section>
        </>
    )
}