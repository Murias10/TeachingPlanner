"use client"

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Degree } from '@/context/DegreeContext'

interface DegreeSelectProps {
    degrees: Degree[]
    value: string
    onChange: (value: string) => void
}

export function DegreeSelect({ degrees, value, onChange }: DegreeSelectProps) {
    return (
        <div className="flex items-center space-x-2">
            <Label htmlFor="degree-select">Grado:</Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger id="degree-select">
                    <SelectValue placeholder="Selecciona un grado…" />
                </SelectTrigger>
                <SelectContent>
                    {degrees.map(d => (
                        <SelectItem key={d.value} value={d.value}>
                            {d.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}