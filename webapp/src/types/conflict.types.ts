export interface ConflictEntry {
    id: string;
    startTime: string;
    endTime: string;
    type: 'puntual' | 'periodic';
    groupNames: string[];
    classroomNames: string[];
    date?: string;
}

export interface ApiError extends Error {
    statusCode?: number;
    conflictData?: ConflictEntry[];
}
