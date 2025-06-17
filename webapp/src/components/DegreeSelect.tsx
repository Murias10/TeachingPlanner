"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export interface Degree {
    value: string;
    label: string;
}

interface DegreeSelectProps {
    degrees: Degree[];
    value: string | undefined;
    onChange: (value: string) => void;
}

export function DegreeSelect({ degrees, value, onChange }: DegreeSelectProps) {
    return (
        <div className="flex items-center space-x-2">
            <Label htmlFor="degree-select" className="whitespace-nowrap">
                Grado:
            </Label>
            <Select
                onValueChange={onChange}
                value={value}
            >
                <SelectTrigger id="degree-select">
                    <SelectValue placeholder="Selecciona un grado…" />
                </SelectTrigger>
                <SelectContent>
                    {degrees.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                            {d.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
