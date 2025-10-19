import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown } from "lucide-react"
import { DegreeTableButtons } from "@/components/degree/DegreeTableButtons"
import { Degree } from "@/types/Degree"
import { TFunction } from "i18next"

interface ColumnExtraProps {
    deleteDegree: (degreeId: string) => void;
    isAdmin?: boolean;
}

// Función para generar colores consistentes basados en el texto
const getColorFromText = (text: string) => {
    const colors = [
        "bg-red-100 text-red-800",
        "bg-blue-100 text-blue-800",
        "bg-green-100 text-green-800",
        "bg-yellow-100 text-yellow-800",
        "bg-purple-100 text-purple-800",
        "bg-pink-100 text-pink-800",
        "bg-indigo-100 text-indigo-800",
        "bg-orange-100 text-orange-800",
        "bg-cyan-100 text-cyan-800",
        "bg-emerald-100 text-emerald-800"
    ];

    // Usar el hash del texto para obtener un índice consistente
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    return colors[Math.abs(hash) % colors.length];
};

export const columns = ({ deleteDegree, isAdmin = false }: ColumnExtraProps, t: TFunction): ColumnDef<Degree>[] => {
    const cols: ColumnDef<Degree>[] = [];

    // Solo agregar columna de selección si es ADMIN
    if (isAdmin) {
        cols.push({
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(v) => row.toggleSelected(!!v)}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        });
    }

    cols.push({
        accessorKey: "name",
        enableHiding: false,
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="flex items-center gap-1"
            >
                {t("table.degrees.columns.name")}<ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ getValue }) => <span>{getValue<string>()}</span>,
    });

    cols.push({
        accessorKey: "acronym",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="flex items-center gap-1"
            >
                {t("table.degrees.columns.acronym")}<ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ getValue }) => {
            const acronym = getValue<string>();
            const colorClasses = getColorFromText(acronym);

            return (
                <Badge className={colorClasses}>
                    {acronym}
                </Badge>
            );
        },
    });

    cols.push({
        id: "actions",
        enableSorting: false,
        cell: ({ row }) => {
            const degree = row.original

            return (
                <DegreeTableButtons degree={degree} deleteDegree={deleteDegree} />
            )
        },
    });

    return cols;
}