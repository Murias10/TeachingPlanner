import { Button } from "@/components/ui/button";

export function CourseToolbar() {
    return (
        <section className="flex items-center justify-between bg-muted/50 p-4 rounded-xl mt-2 mx-2 gap-4" >
            <div className="flex-1 flex justify-end">
                <Button variant="outline" size="sm">
                    Añadir Curso +
                </Button>
            </div>
        </section>
    )
}
