import React, { useState } from 'react';
import { Repeat, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import type { RecurrenceConfig, FrequencyType, WeekDay, EndsType } from '@/types/RecurrenceConfig';

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: RecurrenceConfig) => void;
}

const CreateEventDialog: React.FC<CreateEventDialogProps> = ({ open, onOpenChange, onSave }) => {
  const [config, setConfig] = useState<RecurrenceConfig>({
    frequency: 'no-repeat',
    interval: 1,
    weekDays: [],
    endsType: 'never',
    endsOnDate: '',
    endsAfterOccurrences: 1,
    startTime: '09:00',
    endTime: '10:00',
  });

  const [showCustom, setShowCustom] = useState(false);

  const weekDays: { value: WeekDay; label: string }[] = [
    { value: 'L', label: 'L' },
    { value: 'M', label: 'M' },
    { value: 'X', label: 'X' },
    { value: 'J', label: 'J' },
    { value: 'V', label: 'V' },
    { value: 'S', label: 'S' },
    { value: 'D', label: 'D' },
  ];

  const handleFrequencyChange = (value: FrequencyType) => {
    setConfig({ ...config, frequency: value });
    setShowCustom(value === 'custom');
  };

  const toggleWeekDay = (day: WeekDay) => {
    setConfig({
      ...config,
      weekDays: config.weekDays.includes(day)
        ? config.weekDays.filter(d => d !== day)
        : [...config.weekDays, day],
    });
  };

  const getSummary = (): string => {
    if (config.frequency === 'no-repeat') return 'No se repite';
    if (config.frequency === 'daily') return 'Diariamente';
    if (config.frequency === 'weekly') return 'Semanalmente';
    if (config.frequency === 'monthly') return 'Mensualmente';
    if (config.frequency === 'yearly') return 'Anualmente';

    let summary = '';
    if (config.frequency === 'custom' && config.interval > 0) {
      summary = `Cada ${config.interval > 1 ? config.interval : ''} `;
      if (showCustom) {
        summary += 'semana';
        if (config.weekDays.length > 0) {
          summary += ` los ${config.weekDays.join(', ')}`;
        }
      }
    }
    return summary || 'Personalizado';
  };

  const handleSave = () => {
    onSave(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent rounded-lg">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Crear evento</h2>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          {/* Time Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Horario</Label>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <Input
                type="time"
                value={config.startTime}
                onChange={(e) => setConfig({ ...config, startTime: e.target.value })}
                className="h-8 text-xs"
              />
              <span className="text-xs">-</span>
              <Input
                type="time"
                value={config.endTime}
                onChange={(e) => setConfig({ ...config, endTime: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Frequency Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Frecuencia</Label>
            <Select value={config.frequency} onValueChange={(value) => handleFrequencyChange(value as FrequencyType)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-repeat">No se repite</SelectItem>
                <SelectItem value="daily">Diariamente</SelectItem>
                <SelectItem value="weekly">Semanalmente</SelectItem>
                <SelectItem value="monthly">Mensualmente</SelectItem>
                <SelectItem value="yearly">Anualmente</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Options */}
          {showCustom && (
            <div className="space-y-3 p-3 border border-primary/20 rounded bg-accent/20">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Intervalo</Label>
                <Input
                  type="number"
                  min="1"
                  value={config.interval}
                  onChange={(e) => setConfig({ ...config, interval: parseInt(e.target.value) || 1 })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Días</Label>
                <div className="flex gap-1">
                  {weekDays.map((day) => (
                    <Button
                      key={day.value}
                      variant={config.weekDays.includes(day.value) ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 w-7 p-0 text-xs"
                      onClick={() => toggleWeekDay(day.value)}
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Finalización */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Finaliza</Label>
                <RadioGroup
                  value={config.endsType}
                  onValueChange={(value: EndsType) => setConfig({ ...config, endsType: value })}
                  className="space-y-1"
                >
                  <div className={`flex items-center space-x-2 p-2 rounded border transition-all cursor-pointer ${
                    config.endsType === 'never' ? 'border-primary bg-primary/10' : 'border-primary/20 bg-accent/20'
                  }`}>
                    <RadioGroupItem value="never" id="never" />
                    <Label htmlFor="never" className="text-xs cursor-pointer m-0">
                      Nunca
                    </Label>
                  </div>

                  <div className={`flex items-center space-x-2 p-2 rounded border transition-all cursor-pointer ${
                    config.endsType === 'on' ? 'border-primary bg-primary/10' : 'border-primary/20 bg-accent/20'
                  }`}>
                    <RadioGroupItem value="on" id="on" />
                    <Label htmlFor="on" className="text-xs cursor-pointer m-0">
                      El
                    </Label>
                    <Input
                      type="date"
                      value={config.endsOnDate}
                      onChange={(e) => setConfig({ ...config, endsOnDate: e.target.value })}
                      disabled={config.endsType !== 'on'}
                      className="h-7 text-xs flex-1"
                    />
                  </div>

                  <div className={`flex items-center space-x-2 p-2 rounded border transition-all cursor-pointer ${
                    config.endsType === 'after' ? 'border-primary bg-primary/10' : 'border-primary/20 bg-accent/20'
                  }`}>
                    <RadioGroupItem value="after" id="after" />
                    <Label htmlFor="after" className="text-xs cursor-pointer m-0">
                      Después de
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={config.endsAfterOccurrences}
                      onChange={(e) =>
                        setConfig({ ...config, endsAfterOccurrences: parseInt(e.target.value) || 1 })
                      }
                      disabled={config.endsType !== 'after'}
                      className="w-12 h-7 text-xs text-center"
                    />
                    <span className="text-xs">eventos</span>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Resumen */}
          <div className="bg-accent/20 border border-primary/20 rounded p-3 text-xs">
            <p className="font-semibold">{getSummary()}</p>
            <p className="text-muted-foreground text-xs mt-1">{config.startTime} - {config.endTime}</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 justify-end pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="h-8 text-xs"
          >
            Crear
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventDialog;
