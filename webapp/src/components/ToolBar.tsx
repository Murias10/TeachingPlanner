"use client"

import { useDegree } from '@/context/DegreeContext'
import { DegreeSelect } from '@/components/DegreeSelect'
import { Button } from '@/components/ui/button'

export function ToolBar() {
    const { degrees, loading, error, selectedDegree, setSelectedDegree } = useDegree()

    if (loading) return <div>Cargando grados…</div>
    if (error) return <div>Error al cargar grados: {error}</div>

    return (
        <section className="flex items-center space-x-4 bg-muted/50 p-4 rounded-xl m-2">
            <DegreeSelect
                degrees={degrees}
                value={selectedDegree}
                onChange={setSelectedDegree}
            />
            <Button variant="outline" size="sm">Exportar a CSV</Button>
            <Button variant="outline" size="sm">Añadir calendario +</Button>
        </section>
    )
}