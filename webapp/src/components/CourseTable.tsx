// src/components/CourseTable.tsx
"use client"

import { useState, useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

export interface CourseRecord {
    course: string;           // p.ej. "2023-2024"
    status: "Ongoing" | "Finished";
}

interface CourseTableProps {
    data: CourseRecord[];
    onSemesterClick: (course: string, semester: 1 | 2) => void;
}

export function CourseTable({ data, onSemesterClick }: CourseTableProps) {
    const [asc, setAsc] = useState(true);

    const sorted = useMemo(() => {
        return [...data].sort((a, b) =>
            asc
                ? a.course.localeCompare(b.course)
                : b.course.localeCompare(a.course)
        );
    }, [data, asc]);

    return (
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead
                            className="cursor-pointer"
                            onClick={() => setAsc(!asc)}
                        >
                            <div className="flex items-center gap-1">
                                Course <ArrowUpDown className="h-4 w-4" />
                            </div>
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sorted.map((row) => (
                        <TableRow key={row.course}>
                            <TableCell>{row.course}</TableCell>
                            <TableCell>{row.status}</TableCell>
                            <TableCell className="flex justify-end space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onSemesterClick(row.course, 1)}
                                >
                                    Semester 1
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onSemesterClick(row.course, 2)}
                                >
                                    Semester 2
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Paginación simple */}
            <div className="flex items-center justify-end space-x-2 p-4">
                <Button variant="ghost" size="sm">
                    Previous
                </Button>
                <Button variant="ghost" size="sm">
                    1
                </Button>
                <Button variant="ghost" size="sm">
                    2
                </Button>
                <Button variant="ghost" size="sm">
                    3
                </Button>
                <span className="px-2">…</span>
                <Button variant="ghost" size="sm">
                    Next
                </Button>
            </div>
        </div>
    );
}
