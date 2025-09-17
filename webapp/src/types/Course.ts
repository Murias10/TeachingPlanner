// types/course.types.ts
import { Calendar } from "@/types/Calendar";

export enum CourseState {
    PLANIFICADO = 'PLANIFICADO',
    ACTIVO = 'ACTIVO',
    FINALIZADO = 'FINALIZADO'
}

export interface Course {
    id: string;
    idDegree: string;
    startYear: number;
    endYear: number;
    state: CourseState;
    calendars: Calendar[];
}

export interface CreateCourseRequest {
    startYear: string;
    endYear: string;
    state: CourseState;
    degreeId?: string; // Si necesitas asociar con un grado
}

// Utilidad para validar transiciones de estado válidas
export class CourseStateManager {
    private static readonly VALID_TRANSITIONS: Record<CourseState, CourseState[]> = {
        [CourseState.PLANIFICADO]: [CourseState.ACTIVO],
        [CourseState.ACTIVO]: [CourseState.FINALIZADO],
        [CourseState.FINALIZADO]: [] // Estado final, no se puede cambiar
    };

    static canTransition(from: CourseState, to: CourseState): boolean {
        return this.VALID_TRANSITIONS[from].includes(to);
    }

    static getValidTransitions(currentState: CourseState): CourseState[] {
        return this.VALID_TRANSITIONS[currentState];
    }

    static getStateDescription(state: CourseState): string {
        const descriptions = {
            [CourseState.PLANIFICADO]: 'Curso planificado, pendiente de inicio',
            [CourseState.ACTIVO]: 'Curso en desarrollo activo',
            [CourseState.FINALIZADO]: 'Curso completado exitosamente'
        };
        return descriptions[state];
    }

    static getStateColor(state: CourseState): string {
        switch (state) {
            case CourseState.PLANIFICADO:
                return "bg-blue-100 text-blue-800 hover:bg-blue-200";
            case CourseState.ACTIVO:
                return "bg-green-100 text-green-800 hover:bg-green-200";
            case CourseState.FINALIZADO:
                return "bg-gray-100 text-gray-800 hover:bg-gray-200";
            default:
                return "bg-gray-100 text-gray-800";
        }
    }
}