import { useState } from 'react';
import { Filter, X, ChevronRight, ChevronDown, Check, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

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
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function ClassFilter({
  filters,
  onFiltersChange,
  filterOptions,
  isCollapsed,
  onToggleCollapse
}: ClassFilterProps) {
  const [expandedCategory, setExpandedCategory] = useState<FilterCategory | null>(null);

  const toggleCategory = (category: FilterCategory) => {
    setExpandedCategory(prev => prev === category ? null : category);
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

  const getDisplayLabel = (category: FilterCategory, value: string): string => {
    if (category === 'tipoGrupo') {
      const typeMap: Record<string, string> = {
        'L': 'Laboratorio',
        'S': 'Seminario',
        'T': 'Teoría',
        'TG': 'Tutoría Grupal'
      };
      return typeMap[value] || value;
    }
    if (category === 'idioma') {
      const languageMap: Record<string, string> = {
        'ES': 'Español',
        'EN': 'Inglés'
      };
      return languageMap[value] || value;
    }
    return value;
  };

  const totalActiveFilters = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);

  // Vista colapsada (solo botón)
  if (isCollapsed) {
    return (
      <div className="relative">
        <Button
          onClick={onToggleCollapse}
          variant="outline"
          size="icon"
          className="absolute left-0 top-4 z-10 rounded-r-lg rounded-l-none border-l-0 h-12 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        {totalActiveFilters > 0 && (
          <Badge
            variant="destructive"
            className="absolute left-6 top-2 z-10 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {totalActiveFilters}
          </Badge>
        )}
      </div>
    );
  }

  // Vista expandida
  return (
    <aside className={cn(
      "w-72 border-r bg-background/50 flex flex-col transition-all duration-300 overflow-hidden",
      "h-full"
    )}>
      <div className="p-6 border-b bg-card shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Filtros</h2>
          </div>
          <Button
            onClick={onToggleCollapse}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
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

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 py-4 space-y-2">
          {filterOptions.map(({ category, label, options, icon: Icon }) => {
            const isExpanded = expandedCategory === category;
            const selectedCount = filters[category].length;

            return (
              <div key={category} className="border rounded-lg overflow-hidden bg-card">
                <button
                  className="w-full flex items-center justify-between p-3 hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => toggleCategory(category)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <div className="text-left">
                      <div className="font-medium text-sm text-foreground">{label}</div>
                      {selectedCount > 0 && (
                        <div className="text-xs text-muted-foreground mt-0.5">
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
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t max-h-72 flex flex-col overflow-hidden">
                    <div className="p-2 bg-muted/50 flex gap-2 shrink-0">
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
                    <div className="flex-1 min-h-0 overflow-y-auto">
                      <div className="p-2 space-y-1">
                        {options.map(option => (
                          <button
                            key={option}
                            className="w-full flex items-center gap-3 p-2 hover:bg-accent hover:text-accent-foreground rounded transition-colors min-h-10"
                            onClick={() => toggleFilter(category, option)}
                          >
                            <Checkbox
                              checked={filters[category].includes(option)}
                              className="pointer-events-none shrink-0"
                            />
                            <span className="text-sm flex-1 text-left text-foreground truncate">
                              {getDisplayLabel(category, option)}
                            </span>
                            {filters[category].includes(option) && (
                              <Check className="w-4 h-4 text-foreground shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {totalActiveFilters > 0 && (
            <div className="mt-4 p-4 bg-card border rounded-lg">
              <p className="text-xs font-medium text-foreground mb-3">Filtros activos</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([category, values]) =>
                  values.map((value: string) => (
                    <Badge
                      key={`${category}-${value}`}
                      variant="secondary"
                      className="px-2 py-1 flex items-center gap-1 cursor-pointer hover:bg-secondary/80 transition-colors"
                      onClick={() => toggleFilter(category as FilterCategory, value)}
                    >
                      {getDisplayLabel(category as FilterCategory, value)}
                      <X className="w-3 h-3" />
                    </Badge>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}