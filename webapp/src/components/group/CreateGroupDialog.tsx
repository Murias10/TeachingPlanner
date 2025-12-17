import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Subject } from '@/types/Subject';

interface CreateGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (groupData: { subjectId: string; number: number; type: string; language: string }) => void;
    subjects: Subject[];
}

const CreateGroupDialog: React.FC<CreateGroupDialogProps> = ({ open, onOpenChange, onSave, subjects }) => {
    const [subjectId, setSubjectId] = useState<string>('');
    const [number, setNumber] = useState<string>('1');
    const [type, setType] = useState<string>('');
    const [language, setLanguage] = useState<string>('ES');

    const handleSave = () => {
        if (!subjectId || !number || !type || !language) {
            return;
        }

        onSave({
            subjectId,
            number: parseInt(number, 10),
            type,
            language
        });

        // Reset form
        setSubjectId('');
        setNumber('1');
        setType('');
        setLanguage('ES');
        onOpenChange(false);
    };

    const handleCancel = () => {
        // Reset form
        setSubjectId('');
        setNumber('1');
        setType('');
        setLanguage('ES');
        onOpenChange(false);
    };

    const isFormValid = subjectId && number && type && language && parseInt(number, 10) > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="text-2xl">Crear nuevo grupo</DialogTitle>
                    <DialogDescription className="text-base">
                        Completa los datos para crear un nuevo grupo de una asignatura.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-6">
                    {/* Subject Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="subject" className="text-sm font-medium">
                            Asignatura
                        </Label>
                        <Select value={subjectId} onValueChange={setSubjectId}>
                            <SelectTrigger id="subject" className="w-full">
                                <SelectValue placeholder="Selecciona una asignatura" />
                            </SelectTrigger>
                            <SelectContent>
                                {subjects.map((subject) => (
                                    <SelectItem key={subject.id} value={subject.id}>
                                        {subject.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Two columns for Type and Number */}
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
                                    <SelectItem value="L">Laboratorio</SelectItem>
                                    <SelectItem value="S">Seminario</SelectItem>
                                    <SelectItem value="TG">Tutoría Grupal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Group Number */}
                        <div className="space-y-2">
                            <Label htmlFor="number" className="text-sm font-medium">
                                Número de grupo
                            </Label>
                            <Input
                                id="number"
                                type="number"
                                min="1"
                                value={number}
                                onChange={(e) => setNumber(e.target.value)}
                                placeholder="Ej: 1, 2, 3..."
                                className="w-full"
                            />
                        </div>
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

                <DialogFooter className="gap-2 sm:gap-0">
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
