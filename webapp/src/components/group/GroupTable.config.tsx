import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown } from "lucide-react"
import { Subject } from "@/types/Subject"
import { GroupTableButtons } from "@/components/group/GroupTableButtons"
import { TFunction } from "i18next"

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

export const columns = (t: TFunction, onDeleteGroup?: (groupId: string) => void): ColumnDef<Subject>[] => [
    {
        accessorKey: "name",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="flex items-center gap-1"
            >
                {t("table.groups.columns.name")} <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ getValue }) => <span>{getValue<string>()}</span>,
        meta: {
            label: t("table.groups.columns.name")
        }
    },
    {
        accessorKey: "acronym",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="flex items-center gap-1"
            >
                {t("table.groups.columns.acronym")} <ArrowUpDown className="h-4 w-4" />
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
        meta: {
            label: t("table.groups.columns.acronym")
        }
    },
    {
        accessorKey: "semester",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="flex items-center gap-1"
            >
                {t("table.groups.columns.semester")} <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ getValue }) => {
            const semester = getValue<number>();
            const label = semester === 1 ? t("table.subjects.semester.1") : semester === 2 ? t("table.subjects.semester.2") : "—";
            return <span>{label}</span>;
        },
        meta: {
            label: t("table.groups.columns.semester")
        }
    },
    {
        accessorKey: "year",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
                className="flex items-center gap-1"
            >
                {t("table.groups.columns.year")}<ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ getValue }) => {
            const year = getValue<number>();
            const label =
                year === 1 ? t("table.subjects.year.1") :
                    year === 2 ? t("table.subjects.year.2") :
                        year === 3 ? t("table.subjects.year.3") :
                            year === 4 ? t("table.subjects.year.4") :
                                "—";
            return <span>{label}</span>;
        },
        meta: {
            label: t("table.groups.columns.year")
        }
    },
    {
        id: "actions",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
            const subject = row.original
            return (
                <GroupTableButtons subject={subject} onDeleteGroup={onDeleteGroup} />
            )
        },
    }
]
