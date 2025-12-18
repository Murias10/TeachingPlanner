import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowUpDown } from 'lucide-react'
import { Course } from "@/types/Course"
import { CourseState, CourseStateManager } from "@/types/Course"
import { CourseTableButtons } from "@/components/course/CourseTableButtons"
import { TFunction } from 'i18next'

interface ColumnExtraProps {
    deleteCourse: (courseId: string) => void;
    deleteCalendar: (calendarId: string, force: boolean) => void;
    createCalendar: (courseId: string, semester: number) => void;
    onEditCourse?: (course: Course) => void;
    isAdmin?: boolean;
}

export const columns = ({ deleteCourse, deleteCalendar, createCalendar, onEditCourse, isAdmin = false }: ColumnExtraProps, t: TFunction): ColumnDef<Course>[] => {
    const cols: ColumnDef<Course>[] = [];

    // Solo agregar columna de selección si es ADMIN
    if (isAdmin) {
        cols.push({
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
                    onCheckedChange={v => table.toggleAllPageRowsSelected(!!v)}
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={v => row.toggleSelected(!!v)}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        });
    }

    cols.push({
        id: 'course',
        accessorFn: row => `${row.startYear}-${row.endYear}`,
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="flex items-center gap-1">
                {t("table.courses.columns.course")}<ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ getValue }) => (
            <span className="font-medium text-sm">{getValue<string>()}</span>
        ),
        meta: {
            label: t("table.courses.columns.course")
        }
    },
    {
        accessorKey: 'state',
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="flex items-center gap-1">
                {t("table.courses.columns.state")}<ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const state = row.getValue('state') as CourseState;

            return (
                <div className="flex items-center gap-2">
                    <Badge
                        variant="secondary"
                        className={`text-xs font-medium ${CourseStateManager.getStateColor(state)}`}
                    >
                        {t(`drawer.courses.create.states.${state.toLowerCase()}`)}
                    </Badge>

                </div>
            );
        },
        meta: {
            label: t("table.courses.columns.state")
        }
    },
    {
        id: 'actions',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
            const course = row.original

            return (
                <CourseTableButtons
                    course={course}
                    deleteCourse={deleteCourse}
                    deleteCalendar={deleteCalendar}
                    createCalendar={createCalendar}
                    onEditCourse={onEditCourse}
                />
            )
        },
    });

    return cols;
}