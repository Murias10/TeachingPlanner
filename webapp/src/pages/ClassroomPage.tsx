import { Toolbar } from "@/components/Toolbar"
import { ClassroomTable } from "@/components/ClassroomTable"

export default function ClassroomPage() {
    return (
        <>
            <Toolbar addButtonLabel="Añadir aula" onAdd={() => { }} />
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="min-w-[400px] w-2/3">
                    <ClassroomTable />
                </div>
            </section>
        </>
    )
}