import { useState } from 'react';
import { Filter, X, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

type FilterCategory = 'tipoGrupo' | 'asignatura' | 'aula' | 'idioma';

export interface FilterValues {
  tipoGrupo: string[];
  asignatura: string[];
  aula: string[];
  idioma: string[];
}

interface FilterOption {
  category: FilterCategory;
  label: string;
  options: string[];
  icon: React.ComponentType<{ className?: string }>;
}

interface ClassFilterProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  filterOptions: FilterOption[];
}

export default function ClassFilter({ filters, onFiltersChange, filterOptions }: ClassFilterProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<FilterCategory, boolean>>({
    tipoGrupo: true,
    asignatura: true,
    aula: false,
    idioma: false
  });

  const toggleCategory = (category: FilterCategory) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleFilter = (category: FilterCategory, value: string) => {
    const currentValues = filters[category];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(item => item !== value)
      : [...currentValues, value];

    onFiltersChange({
      ...filters,
      [category]: newValues
    });
  };

  const selectAll = (category: FilterCategory, options: string[]) => {
    onFiltersChange({
      ...filters,
      [category]: options
    });
  };

  const clearCategory = (category: FilterCategory) => {
    onFiltersChange({
      ...filters,
      [category]: []
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      tipoGrupo: [],
      asignatura: [],
      aula: [],
      idioma: []
    });
  };

  const totalActiveFilters = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <aside className="w-80 border-r bg-gray-50/50 h-full flex flex-col">
      <div className="p-6 border-b bg-white">
        <div className="flex items-center gap-3 mb-1">
          <Filter className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {totalActiveFilters > 0
            ? `${totalActiveFilters} aplicado${totalActiveFilters > 1 ? 's' : ''}`
            : 'Ningún filtro aplicado'}
        </p>
        {totalActiveFilters > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="w-full mt-4"
          >
            <X className="w-4 h-4 mr-2" />
            Limpiar filtros
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-2">
          {filterOptions.map(({ category, label, options, icon: Icon }) => {
            const isExpanded = expandedCategories[category];
            const selectedCount = filters[category].length;

            return (
              <div key={category} className="border rounded-lg overflow-hidden bg-white">
                <button
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                  onClick={() => toggleCategory(category)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-gray-600" />
                    <div className="text-left">
                      <div className="font-medium text-sm text-gray-900">{label}</div>
                      {selectedCount > 0 && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {selectedCount} de {options.length}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedCount}
                      </Badge>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t">
                    <div className="p-2 bg-gray-50 flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs flex-1"
                        onClick={() => selectAll(category, options)}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Todas
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs flex-1"
                        onClick={() => clearCategory(category)}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Ninguna
                      </Button>
                    </div>
                    <div className="p-2 space-y-1">
                      {options.map(option => (
                        <button
                          key={option}
                          className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded transition-colors"
                          onClick={() => toggleFilter(category, option)}
                        >
                          <Checkbox
                            checked={filters[category].includes(option)}
                            className="pointer-events-none"
                          />
                          <span className="text-sm flex-1 text-left text-gray-700">
                            {option}
                          </span>
                          {filters[category].includes(option) && (
                            <Check className="w-4 h-4 text-gray-900" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {totalActiveFilters > 0 && (
          <div className="mt-4 p-4 bg-white border rounded-lg">
            <p className="text-xs font-medium text-gray-700 mb-3">Filtros activos</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([category, values]) =>
                values.map((value: string) => (
                  <Badge
                    key={`${category}-${value}`}
                    variant="secondary"
                    className="px-2 py-1 flex items-center gap-1 cursor-pointer hover:bg-gray-300 transition-colors"
                    onClick={() => toggleFilter(category as FilterCategory, value)}
                  >
                    {value}
                    <X className="w-3 h-3" />
                  </Badge>
                ))
              )}
            </div>
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}