import React, { useState } from "react";
import { DegreeContext } from "@/context/DegreeContextInstace";

export type DegreeContextType = {
    degreeId: string | null;
    degreeName: string | null;
    degreeAcronym: string | null;
    setDegreeId: (id: string) => void;
    setDegreeName: (name: string) => void;
    setDegreeAcronym: (acronym: string) => void;
};

export function DegreeProvider({ children }: { children: React.ReactNode }) {
    const [degreeId, setDegreeId] = useState<string | null>(null);
    const [degreeName, setDegreeName] = useState<string | null>(null);
    const [degreeAcronym, setDegreeAcronym] = useState<string | null>(null);

    return (
        <DegreeContext.Provider
            value={{
                degreeId,
                degreeName,
                degreeAcronym,
                setDegreeId,
                setDegreeName,
                setDegreeAcronym,
            }}
        >
            {children}
        </DegreeContext.Provider>
    );
}
