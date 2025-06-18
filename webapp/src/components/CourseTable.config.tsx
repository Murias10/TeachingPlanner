// aquí solo van tipos y datos de ejemplo
export interface CourseRecord {
    id: string
    idDegree: string
    startYear: number
    endYear: number
    state: "success" | "processing" | "failed"
    email: string
}

export const data: CourseRecord[] = [
    { id: "1", idDegree: "1", startYear: 2023, endYear: 2024, state: "success", email: "murias101010@gmail.com" },
    { id: "2", idDegree: "1", startYear: 2024, endYear: 2025, state: "processing", email: "uo290009@uniovi.es" },
    { id: "3", idDegree: "1", startYear: 2022, endYear: 2023, state: "failed", email: "email@gmail.com" },
    { id: "4", idDegree: "1", startYear: 2024, endYear: 2025, state: "processing", email: "uo290009@uniovi.es" },
    { id: "5", idDegree: "1", startYear: 2022, endYear: 2023, state: "failed", email: "email@gmail.com" },
    { id: "6", idDegree: "1", startYear: 2024, endYear: 2025, state: "processing", email: "uo290009@uniovi.es" },
    { id: "7", idDegree: "1", startYear: 2022, endYear: 2023, state: "failed", email: "email@gmail.com" },
]
