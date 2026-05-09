// components/subject/EditSubjectDrawer.tsx
import { useState, useEffect } from "react";
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

export interface EditSubjectFormData {
    subjectId: string;
    acronym: string;
    year: number;
    name: string;
    siesCode: string;
    semester: number;
}

interface EditSubjectDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (formData: EditSubjectFormData) => Promise<void>;
    subjectData?: {
        id: string;
        acronym: string;
        year: number;
        name: string;
        siesCode: string;
        semester: number;
    };
}

export function EditSubjectDrawer({ open, onOpenChange, onSave, subjectData }: EditSubjectDrawerProps) {
    const { t } = useTranslation();

    const [acronym, setAcronym] = useState<string>("");
    const [year, setYear] = useState<number | null>(null);
    const [name, setName] = useState<string>("");
    const [siesCode, setSiesCode] = useState<string>("");
    const [semester, setSemester] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open && subjectData) {
            setName(subjectData.name);
            setAcronym(subjectData.acronym);
            setYear(subjectData.year);
            setSemester(subjectData.semester);
            setSiesCode(subjectData.siesCode);
        } else if (!open) {
            setName("");
            setAcronym("");
            setYear(null);
            setSemester(null);
            setSiesCode("");
            setIsLoading(false);
        }
    }, [open, subjectData]);

    const handleSave = async () => {
        if (!acronym || year === null || !name || !siesCode || !semester || !subjectData) return;
        setIsLoading(true);
        try {
            await onSave({ subjectId: subjectData.id, acronym, year, name, siesCode, semester });
        } catch (error) {
            console.error('Error saving subject:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid =
        acronym && year !== null && name && siesCode && semester !== null &&
        subjectData && (
            name !== subjectData.name ||
            acronym !== subjectData.acronym ||
            year !== subjectData.year ||
            siesCode !== subjectData.siesCode
        );

    return (
        <FormDrawer
            open={open}
            onOpenChange={onOpenChange}
            title={t("drawer.subjects.edit.title")}
            description={t("drawer.subjects.edit.description")}
            onSave={handleSave}
            onCancel={() => { if (!isLoading) onOpenChange(false); }}
            isValid={!!isFormValid}
            isLoading={isLoading}
            saveLabel={t("drawer.subjects.edit.save")}
            cancelLabel={t("drawer.subjects.edit.cancel")}
        >
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <RequiredLabel htmlFor="edit-subject-name" required>{t("drawer.subjects.edit.name")}</RequiredLabel>
                <Input
                    id="edit-subject-name"
                    name="edit-subject-name"
                    value={name}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (/^[A-ZÁÉÍÓÚÑ\s]*$/.test(value.toUpperCase())) setName(value);
                    }}
                    placeholder="Ej: Introducción a la Programación"
                    disabled={isLoading}
                />
            </div>
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <RequiredLabel htmlFor="edit-subject-acronym" required>{t("drawer.subjects.edit.acronym")}</RequiredLabel>
                <Input
                    id="edit-subject-acronym"
                    name="edit-subject-acronym"
                    value={acronym}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (/^[A-Za-z]{0,20}$/.test(value)) setAcronym(value);
                    }}
                    placeholder="Ej: Est, IP, Calc"
                    disabled={isLoading}
                />
            </div>
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <RequiredLabel htmlFor="edit-subject-year" required>{t("drawer.subjects.edit.year")}</RequiredLabel>
                <Select onValueChange={(value) => setYear(Number(value))} value={year !== null ? String(year) : ""} disabled={isLoading}>
                    <SelectTrigger id="edit-subject-year" className="w-full">
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
                <RequiredLabel htmlFor="edit-subject-semester">{t("drawer.subjects.edit.semester")}</RequiredLabel>
                <Select value={semester !== null ? String(semester) : ""} disabled>
                    <SelectTrigger id="edit-subject-semester" className="w-full bg-muted">
                        <SelectValue placeholder="Selecciona el semestre" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">{t("table.subjects.semester.1")}</SelectItem>
                        <SelectItem value="2">{t("table.subjects.semester.2")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2 max-w-sm mx-auto w-full">
                <RequiredLabel htmlFor="edit-subject-sies-code" required>{t("drawer.subjects.edit.siesCode")}</RequiredLabel>
                <Input
                    id="edit-subject-sies-code"
                    name="edit-subject-sies-code"
                    value={siesCode}
                    onChange={(e) => setSiesCode(e.target.value)}
                    placeholder="Ej: GIISOF01-1-002"
                    maxLength={20}
                    disabled={isLoading}
                />
            </div>
        </FormDrawer>
    );
}
