import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Degree } from "@/context/DegreeContext";

interface DegreeSelectProps {
    degrees: Degree[];
    value: string;
    onChange: (value: string) => void;
}

export function DegreeSelect({ degrees, value, onChange }: DegreeSelectProps) {
    const list = Array.isArray(degrees) ? degrees : [];
    const isEmpty = list.length === 0;

    return (
        <div className="flex items-center space-x-2">
            <Label htmlFor="degree-select">Grado:</Label>
            <Select
                value={isEmpty ? undefined : value}
                onValueChange={onChange}
            >
                <SelectTrigger id="degree-select" disabled={isEmpty}>
                    <SelectValue
                        placeholder={
                            isEmpty ? "Sin grados disponibles" : "Selecciona un grado…"
                        }
                    />
                </SelectTrigger>
                <SelectContent>
                    {/* Opción sin filtro */}
                    <SelectItem value="all">Todos los grados</SelectItem>
                    {/* Opciones dinámicas */}
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
