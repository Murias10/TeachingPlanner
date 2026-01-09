import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Subject } from '@/types/Subject';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

interface CreateGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (groupData: { subjectId: string; number: number; type: string; language: string }) => void;
    subjects: Subject[];
    preSelectedSubjectId?: string;
}

const CreateGroupDialog: React.FC<CreateGroupDialogProps> = ({ open, onOpenChange, onSave, subjects, preSelectedSubjectId }) => {
    const [subjectId, setSubjectId] = useState<string>('');
    const [type, setType] = useState<string>('');
    const [language, setLanguage] = useState<string>('ES');
    const [nextNumber, setNextNumber] = useState<number>(1);

    // Establecer el subjectId cuando se proporciona preSelectedSubjectId
    useEffect(() => {
        if (preSelectedSubjectId) {
            setSubjectId(preSelectedSubjectId);
        }
    }, [preSelectedSubjectId]);

    // Calcular el siguiente número disponible cuando cambian subject, type o language
    useEffect(() => {
        if (!subjectId || !type || !language) {
            setNextNumber(1);
            return;
        }

        const selectedSubject = subjects.find(s => s.id === subjectId);
        if (!selectedSubject?.groups) {
            setNextNumber(1);
            return;
        }

        // Filtrar grupos del mismo tipo e idioma
        const existingGroups = selectedSubject.groups.filter(
            g => g.type === type && g.language === language
        );

        if (existingGroups.length === 0) {
            setNextNumber(1);
            return;
        }

        // Encontrar el número más alto y sumar 1
        const maxNumber = Math.max(...existingGroups.map(g => g.number));
        setNextNumber(maxNumber + 1);
    }, [subjectId, type, language, subjects]);

    const handleSave = () => {
        if (!subjectId || !type || !language) {
            return;
        }

        onSave({
            subjectId,
            number: nextNumber,
            type,
            language
        });

        // Reset form
        setSubjectId('');
        setType('');
        setLanguage('ES');
        setNextNumber(1);
        onOpenChange(false);
    };

    const handleCancel = () => {
        // Reset form
        setSubjectId('');
        setType('');
        setLanguage('ES');
        setNextNumber(1);
        onOpenChange(false);
    };

    const isFormValid = subjectId && type && language;

    return (
        <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="text-2xl">Crear nuevo grupo</DialogTitle>
                    <DialogDescription className="text-base">
                        Selecciona la asignatura, tipo e idioma. El número de grupo se asignará automáticamente.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-6">
                    {/* Subject Selection - solo mostrar si no hay preselección */}
                    {!preSelectedSubjectId && (
                        <div className="space-y-2">
                            <Label htmlFor="subject" className="text-sm font-medium">
                                Asignatura
                            </Label>
                            <SearchableSelect
                                value={subjectId}
                                onValueChange={setSubjectId}
                                options={subjects.map((subject) => ({
                                    value: subject.id,
                                    label: `${subject.acronym} - ${subject.name}`
                                }))}
                                placeholder="Selecciona una asignatura"
                                searchPlaceholder="Buscar asignatura..."
                                emptyMessage="No se encontraron asignaturas"
                                className="w-full h-10 text-sm"
                            />
                        </div>
                    )}

                    {/* Mostrar nombre de la asignatura si está preseleccionada */}
                    {preSelectedSubjectId && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                Asignatura
                            </Label>
                            <div className="p-3 bg-muted rounded-lg">
                                <p className="text-sm font-medium">
                                    {subjects.find(s => s.id === preSelectedSubjectId)?.acronym} - {subjects.find(s => s.id === preSelectedSubjectId)?.name}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Two columns for Type and Language */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Group Type */}
                        <div className="space-y-2">
                            <Label htmlFor="type" className="text-sm font-medium">
                                Tipo de grupo
                            </Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger id="type" className="w-full">
                                    <SelectValue placeholder="Selecciona el tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="T">Teoría</SelectItem>
                                    <SelectItem value="S">Seminario</SelectItem>
                                    <SelectItem value="L">Laboratorio</SelectItem>
                                    <SelectItem value="TG">Tutoría Grupal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Language */}
                        <div className="space-y-2">
                            <Label htmlFor="language" className="text-sm font-medium">
                                Idioma
                            </Label>
                            <Select value={language} onValueChange={setLanguage}>
                                <SelectTrigger id="language" className="w-full">
                                    <SelectValue placeholder="Selecciona el idioma" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ES">Español</SelectItem>
                                    <SelectItem value="EN">Inglés</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Auto-assigned Number Info */}
                    {isFormValid && (
                        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                            <Info className="h-5 w-5 text-muted-foreground shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">Número de grupo asignado automáticamente</p>
                                <p className="text-sm text-muted-foreground">
                                    Se creará el grupo número <Badge variant="secondary">{nextNumber}</Badge> para esta combinación de asignatura, tipo e idioma.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={!isFormValid} className="w-full sm:w-auto">
                        Crear grupo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateGroupDialog;
