import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function GroupToolbar() {
    return (
        <section className="flex items-center justify-between bg-muted/50 p-4 rounded-xl mt-2 mx-2 gap-4" >
            <div className="flex-1 flex justify-end">
                <Link to="calendar">
                    <Button variant="outline" size="sm">
                        Ver Calendario +
                    </Button>
                </Link>
            </div>
        </section>
    )
}
