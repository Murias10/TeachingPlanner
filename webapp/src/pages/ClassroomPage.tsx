import { DegreeProvider } from "@/context/DegreeContext"
import { ToolBar } from "@/components/ToolBar"
import { ClassroomTable } from "@/components/ClassroomTable"

export default function ClassroomPage() {
    return (
        <DegreeProvider>
            <ToolBar />
            <section className="h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                <div className="min-w-[400px] w-2/3">
                    <ClassroomTable />
                </div>
            </section>
        </DegreeProvider>
    )
}