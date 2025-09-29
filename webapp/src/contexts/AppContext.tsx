import React, { useState } from "react";
import { AppContext } from "@/contexts/AppContextInstance";

export type AppContextType = {
    degreeId: string | null;
    degreeName: string | null;
    degreeAcronym: string | null;
    setDegreeId: (id: string | null) => void;
    setDegreeName: (name: string | null) => void;
    setDegreeAcronym: (acronym: string | null) => void;
    courseId: string | null;
    semester: number | null;
    setCourseId: (id: string | null) => void;
    setSemester: (semester: number | null) => void;
    resetContext: () => void;
};

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [degreeId, setDegreeId] = useState<string | null>(null);
    const [degreeName, setDegreeName] = useState<string | null>(null);
    const [degreeAcronym, setDegreeAcronym] = useState<string | null>(null);

    const [courseId, setCourseId] = useState<string | null>(null);
    const [semester, setSemester] = useState<number | null>(null);
    const resetContext = () => {
        setDegreeId(null);
        setDegreeName(null);
        setDegreeAcronym(null);
        setCourseId(null);
        setSemester(null);
    };

    return (

        <AppContext.Provider
            value={{
                degreeId,
                degreeName,
                degreeAcronym,
                setDegreeId,
                setDegreeName,
                setDegreeAcronym,
                courseId,
                semester,
                setCourseId,
                setSemester,
                resetContext
            }}
        >
            {children}
        </AppContext.Provider>
    );
}
