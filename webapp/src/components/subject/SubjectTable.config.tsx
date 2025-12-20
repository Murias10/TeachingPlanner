// components/SubjectTable.config.ts
import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProtectedComponent } from "@/components/ProtectedComponent"
import { ArrowUpDown, Info } from "lucide-react"
import { EditDeleteTableButtons } from "@/components/common/EditDeleteTableButtons"
import { TFunction } from "i18next"
import { Subject } from "@/types/Subject"
import { Link } from "react-router-dom"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface ColumnExtraProps {
    deleteSubject: (subjectId: string) => void;
    isAdmin?: boolean;
    onEditSubject?: (subject: Subject) => void;
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

export const columns = ({ deleteSubject, isAdmin = false, onEditSubject }: ColumnExtraProps, t: TFunction): ColumnDef<Subject>[] => {
    const cols: ColumnDef<Subject>[] = [];

    // Solo agregar columna de selección si es ADMIN
    if (isAdmin) {
        cols.push({
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="flex items-center gap-1"
            >
                {t("table.subjects.columns.name")} <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ getValue }) => <span>{getValue<string>()}</span>,
        meta: {
            label: t("table.subjects.columns.name")
        }
    },
        {
            accessorKey: "acronym",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="flex items-center gap-1"
                >
                    {t("table.subjects.columns.acronym")} <ArrowUpDown className="h-4 w-4" />
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
                label: t("table.subjects.columns.acronym")
            }
        },
        {
            accessorKey: "siesCode",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="flex items-center gap-1"
                >
                    {t("table.subjects.columns.siesCode")} <ArrowUpDown className="h-4 w-4" />
                </Button>
            ),
            cell: ({ getValue }) => <span>{getValue<string>()}</span>,
            meta: {
                label: t("table.subjects.columns.siesCode")
            }
        },
        {
            accessorKey: "semester",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="flex items-center gap-1"
                >
                    {t("table.subjects.columns.semester")} <ArrowUpDown className="h-4 w-4" />
                </Button>
            ),
            cell: ({ getValue }) => {
                const semester = getValue<number>();
                const label = semester === 1 ? t("table.subjects.semester.1") : semester === 2 ? t("table.subjects.semester.2") : "—";
                return <span>{label}</span>;
            },
            meta: {
                label: t("table.subjects.columns.semester")
            }
        },
        {
            accessorKey: "year",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="flex items-center gap-1"
                >
                    {t("table.subjects.columns.year")} <ArrowUpDown className="h-4 w-4" />
                </Button>
            ),
            cell: ({ getValue }) => {
                const year = getValue<number>();
                // Intentar obtener la traducción específica, o crear el formato genérico
                const translationKey = `table.subjects.year.${year}`;
                const label = t(translationKey, { defaultValue: year === 0 ? "Optativa" : `${year}º` });
                return <span>{label}</span>;
            },
            meta: {
                label: t("table.subjects.columns.year")
            }
        },
        {
            id: "actions",
            enableSorting: false,
            enableHiding: false,
            cell: ({ row }) => {
                const subject = row.original
                const siesUrl = subject.siesCode
                    ? `https://www.uniovi.es/ast/estudia/grados/ingenieria/informaticasoftware/-/fof/asignatura/${subject.siesCode}`
                    : null

                return (
                    <div className="flex justify-end items-center gap-2">
                        {siesUrl && (
                            <Link to={siesUrl} target="_blank" className="flex items-center">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" className="size-10">
                                            <Info />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t("table.subjects.actions.siesUrl", { url: siesUrl })}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </Link>
                        )}

                        <ProtectedComponent requiredRoles={["ADMIN"]} hideIfNoAccess={true}>
                            <EditDeleteTableButtons
                                onEdit={() => onEditSubject?.(subject)}
                                onDelete={() => deleteSubject(subject.id)}
                            />
                        </ProtectedComponent>
                    </div>
                )
            },
        });

    return cols;
}