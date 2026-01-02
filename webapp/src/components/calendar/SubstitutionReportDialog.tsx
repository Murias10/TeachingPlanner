"use client"

import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { PIConflictDetection, PISubstitution } from '@/types/Calendar';

interface SubstitutionReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    conflictDetection?: PIConflictDetection;
    substitution?: PISubstitution;
}

const SubstitutionReportDialog: React.FC<SubstitutionReportDialogProps> = ({
    open,
    onOpenChange,
    conflictDetection,
    substitution
}) => {
    if (!conflictDetection && !substitution) {
        return null;
    }

    const hasConflict = conflictDetection?.detected || false;
    const hasSubstitution = substitution?.performed || false;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex flex-col max-h-[85vh] max-w-2xl p-0">
                <DialogHeader className="px-6 pt-6 pb-0">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${hasConflict ? 'bg-amber-100 dark:bg-amber-900' : 'bg-green-100 dark:bg-green-900'}`}>
                            {hasConflict ? (
                                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            ) : (
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            )}
                        </div>
                        <DialogTitle className="text-lg font-semibold">
                            {hasConflict ? 'Conflictos P/I Detectados y Resueltos' : 'Importación Exitosa'}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="hidden">
                        Reporte de detección y sustitución de conflictos en caracteres P/I
                    </DialogDescription>
                </DialogHeader>

                <div className="overflow-y-auto flex-1 px-6 py-4">
                    <div className="space-y-4">
                        {/* No Conflict Message */}
                        {!hasConflict && (
                            <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded">
                                <p className="text-sm text-green-800 dark:text-green-200">
                                    ✓ No se detectaron conflictos en los caracteres P (Par) e I (Impar). El archivo importado utiliza el mismo sistema de paridad de semanas que el calendario.
                                </p>
                            </div>
                        )}

                        {/* Conflict Detection Section */}
                        {hasConflict && conflictDetection && (
                            <>
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold flex items-center gap-2">
                                        <Info className="w-4 h-4" />
                                        Resumen del Conflicto
                                    </h3>
                                    <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded">
                                        <p className="text-sm text-amber-900 dark:text-amber-100 font-medium mb-2">
                                            Tipo: {getConflictTypeLabel(conflictDetection.type)}
                                        </p>
                                        <p className="text-sm text-amber-800 dark:text-amber-200">
                                            {conflictDetection.summary}
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                {/* Statistics */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold">Estadísticas</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <StatCard
                                            label="Días Lectivos"
                                            value={conflictDetection.statistics.lectiveDays}
                                        />
                                        <StatCard
                                            label="Días en Conflicto"
                                            value={conflictDetection.statistics.conflictingDays}
                                            variant="warning"
                                        />
                                        <StatCard
                                            label="Días con 'P' en TXT"
                                            value={conflictDetection.statistics.daysWithP}
                                        />
                                        <StatCard
                                            label="Días con 'I' en TXT"
                                            value={conflictDetection.statistics.daysWithI}
                                        />
                                        <StatCard
                                            label="'P' Esperados (Pares)"
                                            value={conflictDetection.statistics.expectedPDays}
                                        />
                                        <StatCard
                                            label="'I' Esperados (Impares)"
                                            value={conflictDetection.statistics.expectedIDays}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Substitution Section */}
                        {hasSubstitution && substitution && (
                            <>
                                <Separator />
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        Sustituciones Realizadas
                                    </h3>
                                    <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded">
                                        <p className="text-sm text-blue-900 dark:text-blue-100 mb-3">
                                            {substitution.summary}
                                        </p>
                                        <div className="space-y-2">
                                            {substitution.substitutions.map((sub, index) => (
                                                <SubstitutionCard key={index} substitution={sub} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Info Box */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded">
                            <p className="text-xs text-gray-700 dark:text-gray-300">
                                <strong>Nota:</strong> Los caracteres P e I representan eventos quincenales basados en la paridad de la semana desde el inicio del calendario.
                                Los conflictos ocurren cuando un archivo TXT importado usa estos caracteres con un significado diferente al sistema interno.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-2 justify-end px-6 pb-6 border-t pt-4">
                    <Button
                        onClick={() => onOpenChange(false)}
                        className="h-9 text-sm"
                    >
                        Entendido
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

// Helper Components
interface StatCardProps {
    label: string;
    value: number;
    variant?: 'default' | 'warning';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, variant = 'default' }) => {
    const bgColor = variant === 'warning'
        ? 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800'
        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700';

    const textColor = variant === 'warning'
        ? 'text-amber-900 dark:text-amber-100'
        : 'text-gray-900 dark:text-gray-100';

    return (
        <div className={`p-3 border rounded ${bgColor}`}>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
        </div>
    );
};

interface SubstitutionCardProps {
    substitution: {
        oldCharacter: string;
        newCharacter: string;
        reason: string;
        daysUpdated: number;
        eventsUpdated: number;
    };
}

const SubstitutionCard: React.FC<SubstitutionCardProps> = ({ substitution }) => {
    return (
        <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded">
            <div className="flex items-center gap-2 min-w-[80px]">
                <div className="flex items-center justify-center w-8 h-8 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 font-bold text-sm">
                    {substitution.oldCharacter}
                </div>
                <span className="text-gray-400">→</span>
                <div className="flex items-center justify-center w-8 h-8 rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-bold text-sm">
                    {substitution.newCharacter}
                </div>
            </div>
            <div className="flex-1">
                <p className="text-xs text-gray-900 dark:text-gray-100 font-medium mb-1">
                    {substitution.reason}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                    {substitution.daysUpdated} día(s) • {substitution.eventsUpdated} evento(s)
                </p>
            </div>
        </div>
    );
};

// Helper Functions
function getConflictTypeLabel(type: string): string {
    switch (type) {
        case 'none':
            return 'Sin Conflictos';
        case 'P_only':
            return 'Conflicto en P (Par)';
        case 'I_only':
            return 'Conflicto en I (Impar)';
        case 'both_PI':
            return 'Conflicto en P e I';
        case 'irregular':
            return 'Patrón Irregular';
        default:
            return 'Desconocido';
    }
}

export default SubstitutionReportDialog;
