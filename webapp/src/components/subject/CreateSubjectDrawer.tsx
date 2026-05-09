import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RequiredLabel } from "@/components/ui/RequiredLabel";
import { FormDrawer } from "@/components/ui/FormDrawer";

interface CreateSubjectDrawerProps {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly onSave: (formData: {
        acronym: string;
        year: number;
        name: string;
        siesCode: string;
        semester: number;
    }) => Promise<void>;
    readonly semester?: number;
}

export function CreateSubjectDrawer({ open, onOpenChange, onSave, semester: fixedSemester }: CreateSubjectDrawerProps) {
    const { t } = useTranslation();

    const [acronym, setAcronym] = useState<string>("");
    const [year, setYear] = useState<number | null>(null);
    const [name, setName] = useState<string>("");
    const [siesCode, setSiesCode] = useState<string>("");
    const [semester, setSemester] = useState<number | null>(fixedSemester ?? null);

    const resetForm = () => {
        setAcronym("");
        setYear(null);
        setName("");
        setSiesCode("");
        setSemester(fixedSemester ?? null);
    };

    const handleSave = async () => {
        if (!acronym || year === null || !name || !siesCode || !semester) return;
        await onSave({ acronym, year, name, siesCode, semester });
        resetForm();
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) resetForm();
        onOpenChange(newOpen);
    };

    const isValid = !!(acronym && year !== null && name && siesCode && semester !== null);

    return (
        <FormDrawer
            open={open}
            onOpenChange={handleOpenChange}
            title={t("drawer.subjects.create.title")}
            description={t("drawer.subjects.create.description")}
            onSave={handleSave}
            onCancel={resetForm}
            isValid={isValid}
            saveLabel={t("drawer.subjects.create.save")}
            cancelLabel={t("drawer.subjects.create.cancel")}
        >
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <RequiredLabel htmlFor="subjects-name" required>{t("drawer.subjects.create.name")}</RequiredLabel>
                <Input
                    id="subjects-name"
                    name="subjects-name"
                    value={name}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (/^[A-ZÁÉÍÓÚÑ\s]*$/.test(value.toUpperCase())) setName(value);
                    }}
                    placeholder="Ej: Introducción a la Programación"
                />
            </div>
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <RequiredLabel htmlFor="subjects-acronym" required>{t("drawer.subjects.create.acronym")}</RequiredLabel>
                <Input
                    id="subjects-acronym"
                    name="subjects-acronym"
                    value={acronym}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (/^[A-Za-z]{0,20}$/.test(value)) setAcronym(value);
                    }}
                    placeholder="Ej: Est, IP, Calc"
                />
            </div>
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <RequiredLabel htmlFor="subjects-year" required>{t("drawer.subjects.create.year")}</RequiredLabel>
                <Select onValueChange={(value) => setYear(Number(value))} value={year !== null ? String(year) : ""}>
                    <SelectTrigger id="subjects-year" className="w-full">
                        <SelectValue placeholder="Selecciona el año" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0">{t("table.subjects.year.0")}</SelectItem>
                        <SelectItem value="1">{t("table.subjects.year.1")}</SelectItem>
                        <SelectItem value="2">{t("table.subjects.year.2")}</SelectItem>
                        <SelectItem value="3">{t("table.subjects.year.3")}</SelectItem>
                        <SelectItem value="4">{t("table.subjects.year.4")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <RequiredLabel htmlFor="subject-semester" required={fixedSemester === undefined}>{t("drawer.subjects.create.semester")}</RequiredLabel>
                <Select
                    onValueChange={(value) => setSemester(Number(value))}
                    value={semester === null ? "" : String(semester)}
                    disabled={fixedSemester !== undefined}
                >
                    <SelectTrigger id="subject-semester" className="w-full">
                        <SelectValue placeholder="Selecciona el semestre" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">{t("table.subjects.semester.1")}</SelectItem>
                        <SelectItem value="2">{t("table.subjects.semester.2")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <RequiredLabel htmlFor="subject-sies-code" required>{t("drawer.subjects.create.siesCode")}</RequiredLabel>
                <Input
                    id="subject-sies-code"
                    name="subject-sies-code"
                    value={siesCode}
                    onChange={(e) => setSiesCode(e.target.value)}
                    placeholder="Ej: GIISOF01-1-002"
                    maxLength={20}
                />
            </div>
        </FormDrawer>
    );
}