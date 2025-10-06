import React, { useState } from 'react';
import { Calendar, Repeat, Clock, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type FrequencyType = 'no-repeat' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
type WeekDay = 'L' | 'M' | 'X' | 'J' | 'V' | 'S' | 'D';
type EndsType = 'never' | 'on' | 'after';

interface RecurrenceConfig {
  frequency: FrequencyType;
  interval: number;
  weekDays: WeekDay[];
  endsType: EndsType;
  endsOnDate: string;
  endsAfterOccurrences: number;
  startTime: string;
  endTime: string;
}

const EventRecurrenceSelector: React.FC = () => {
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

  return (
    <div className="w-full max-w-lg mx-auto p-1">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        {/* Header */}
        <div className="bg-black px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg">
              <Repeat className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Periodicidad del evento</h2>
              <p className="text-sm text-gray-400">Configura horario y repetición</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Time Selection */}
          <div className="space-y-3 pb-5 border-b border-gray-200">
            <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Horario del evento
            </Label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label htmlFor="start-time" className="text-xs text-gray-600 mb-1 block">Inicio</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={config.startTime}
                  onChange={(e) => setConfig({ ...config, startTime: e.target.value })}
                  className="w-full h-11 border-gray-300 text-base font-medium"
                />
              </div>
              <div className="pt-5 text-gray-400">—</div>
              <div className="flex-1">
                <Label htmlFor="end-time" className="text-xs text-gray-600 mb-1 block">Fin</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={config.endTime}
                  onChange={(e) => setConfig({ ...config, endTime: e.target.value })}
                  className="w-full h-11 border-gray-300 text-base font-medium"
                />
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Duración: {(() => {
                const [startH, startM] = config.startTime.split(':').map(Number);
                const [endH, endM] = config.endTime.split(':').map(Number);
                const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
              })()}
            </div>
          </div>

          {/* Frequency Selector */}
          <div className="space-y-2">
            <Label htmlFor="frequency" className="text-sm font-semibold text-gray-900">
              Frecuencia
            </Label>
            <Select value={config.frequency} onValueChange={handleFrequencyChange}>
              <SelectTrigger id="frequency" className="w-full h-11 border-gray-300 bg-white hover:border-gray-400 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-repeat">No se repite</SelectItem>
                <SelectItem value="daily">Diariamente</SelectItem>
                <SelectItem value="weekly">Semanalmente</SelectItem>
                <SelectItem value="monthly">Mensualmente</SelectItem>
                <SelectItem value="yearly">Anualmente</SelectItem>
                <SelectItem value="custom">Personalizado...</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showCustom && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Interval */}
              <div className="space-y-2">
                <Label htmlFor="interval" className="text-sm font-semibold text-gray-900">
                  Repetir cada
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="interval"
                    type="number"
                    min="1"
                    value={config.interval}
                    onChange={(e) => setConfig({ ...config, interval: parseInt(e.target.value) || 1 })}
                    className="w-24 h-11 text-center text-lg font-semibold border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-2 rounded-lg border border-gray-200">
                    semanas
                  </span>
                </div>
              </div>

              {/* Week Days */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-900">Días de la semana</Label>
                <div className="flex gap-2 justify-between">
                  {weekDays.map((day) => (
                    <button
                      key={day.value}
                      onClick={() => toggleWeekDay(day.value)}
                      className={`relative w-11 h-11 rounded-lg text-sm font-bold transition-all duration-150 ${
                        config.weekDays.includes(day.value)
                          ? 'bg-black text-white shadow-md'
                          : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {day.label}
                      {config.weekDays.includes(day.value) && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-black">
                          <Check className="w-2.5 h-2.5 text-black" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ends Section */}
              <div className="space-y-3 pt-2">
                <Label className="text-sm font-semibold text-gray-900">Finaliza</Label>
                <RadioGroup
                  value={config.endsType}
                  onValueChange={(value: EndsType) => setConfig({ ...config, endsType: value })}
                  className="space-y-2"
                >
                  <div className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${
                    config.endsType === 'never' ? 'border-black bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                    <RadioGroupItem value="never" id="never" />
                    <Label htmlFor="never" className="text-sm font-medium cursor-pointer flex-1">
                      Nunca
                    </Label>
                  </div>

                  <div className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${
                    config.endsType === 'on' ? 'border-black bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                    <RadioGroupItem value="on" id="on" />
                    <Label htmlFor="on" className="text-sm font-medium cursor-pointer">
                      El
                    </Label>
                    <Input
                      type="date"
                      value={config.endsOnDate}
                      onChange={(e) => setConfig({ ...config, endsOnDate: e.target.value })}
                      disabled={config.endsType !== 'on'}
                      className="flex-1 h-9 text-sm border-gray-300"
                    />
                  </div>

                  <div className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${
                    config.endsType === 'after' ? 'border-black bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                    <RadioGroupItem value="after" id="after" />
                    <Label htmlFor="after" className="text-sm font-medium cursor-pointer">
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
                      className="w-20 h-9 text-sm text-center border-gray-300"
                    />
                    <span className="text-sm text-gray-600">eventos</span>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Resumen</span>
              <span className="text-sm font-semibold text-black flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {getSummary()}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {config.startTime} - {config.endTime}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button className="flex-1 h-11 border-2 bg-white hover:bg-gray-50 text-gray-900 font-medium" variant="outline">
              Cancelar
            </Button>
            <Button className="flex-1 h-11 bg-black hover:bg-gray-800 text-white font-semibold">
              Guardar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventRecurrenceSelector;