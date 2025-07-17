"use client";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Degree } from "@/context/DegreeContext";

interface DegreeSelectProps {
    degrees: Degree[];
    value: string;
    onChange: (value: string) => void;
}

export function DegreeSelect({ degrees, value, onChange }: DegreeSelectProps) {
    // Aseguramos que degrees sea un array antes de mapear
    const list = Array.isArray(degrees) ? degrees : [];

    // Si no hay grados, deshabilitamos el trigger y cambiamos placeholder
    const isEmpty = list.length === 0;

    console.log("Rendering DegreeSelect with degrees:", list);

    return (
        <div className="flex items-center space-x-2">
            <Label htmlFor="degree-select">Grado:</Label>
            <Select value={isEmpty ? undefined : value} onValueChange={onChange}>
                <SelectTrigger id="degree-select" disabled={isEmpty}>
                    <SelectValue placeholder={isEmpty ? "Sin grados disponibles" : "Selecciona un grado…"} />
                </SelectTrigger>
                <SelectContent>
                    {list.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                            {d.name} - {d.acronym}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}