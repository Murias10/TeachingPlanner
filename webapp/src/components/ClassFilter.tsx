import { useState } from 'react';
import { Filter, X, ChevronRight, ChevronDown, Check, ChevronLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatGroupForDisplay, getGroupAcronym } from '@/utils/groupFormatUtils';
import { GROUP_TYPE_LABELS, LANGUAGE_LABELS } from '@/constants/groupTypes';
import { useTranslation } from 'react-i18next';

type FilterCategory = 'tipoGrupo' | 'asignatura' | 'grupos' | 'aula' | 'idioma' | 'curso' | 'mostrarCancelados';

export interface FilterValues {
  tipoGrupo: string[];
  asignatura: string[];
  grupos: string[];
  aula: string[];
  idioma: string[];
  curso: string[];
  mostrarCancelados: string[];
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
  const { t } = useTranslation();
  const [expandedCategory, setExpandedCategory] = useState<FilterCategory | null>(null);
  const [searchTerms, setSearchTerms] = useState<Record<FilterCategory, string>>({
    tipoGrupo: '',
    asignatura: '',
    grupos: '',
    aula: '',
    idioma: '',
    curso: '',
    mostrarCancelados: ''
  });

  const SEARCH_THRESHOLD = 8; // Mostrar búsqueda si hay más de 8 opciones

  const getGroupState = (groupId: string): 'disabled' | 'unchecked' | 'checked' => {
    const subjectAcronym = getGroupAcronym(groupId);

    if (filters.asignatura.length > 0 && !filters.asignatura.includes(subjectAcronym)) {
      return 'disabled';
    }

    if (filters.grupos.includes(groupId)) {
      return 'checked';
    }

    return 'unchecked';
  };

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
      grupos: [],
      aula: [],
      idioma: [],
      curso: [],
      mostrarCancelados: []
    });
  };

  const getDisplayLabel = (category: FilterCategory, value: string): string => {
    if (category === 'tipoGrupo') {
      return GROUP_TYPE_LABELS[value as keyof typeof GROUP_TYPE_LABELS] || value;
    }
    if (category === 'idioma') {
      return LANGUAGE_LABELS[value as keyof typeof LANGUAGE_LABELS] || value;
    }
    if (category === 'grupos') {
      return formatGroupForDisplay(value);
    }
    if (category === 'mostrarCancelados') {
      return t('filters.showCancelledEvents');
    }
    return value;
  };

  const filterOptionsBySearch = (options: string[], category: FilterCategory): string[] => {
    const searchTerm = searchTerms[category].toLowerCase();
    if (!searchTerm) return options;

    return options.filter(option => {
      const displayLabel = getDisplayLabel(category, option).toLowerCase();
      return displayLabel.includes(searchTerm);
    });
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
            <h2 className="text-lg font-semibold text-foreground">{t('filters.title')}</h2>
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
            ? t('filters.appliedCount', { count: totalActiveFilters })
            : t('filters.noFiltersApplied')}
        </p>
        {totalActiveFilters > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="w-full mt-4"
          >
            <X className="w-4 h-4 mr-2" />
            {t('filters.clearFilters')}
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 py-4 space-y-2">
          {filterOptions.map(({ category, label, options, icon: Icon }) => {
            const isExpanded = expandedCategory === category;
            const selectedCount = filters[category].length;
            const showSearch = options.length > SEARCH_THRESHOLD;
            const filteredOptions = filterOptionsBySearch(options, category);

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
                    {showSearch && (
                      <div className="p-2 border-b shrink-0">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={t('filters.search')}
                            value={searchTerms[category]}
                            onChange={(e) => setSearchTerms(prev => ({
                              ...prev,
                              [category]: e.target.value
                            }))}
                            className="h-8 pl-8"
                          />
                        </div>
                      </div>
                    )}
                    <div className="p-2 bg-muted/50 flex gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs flex-1"
                        onClick={() => selectAll(category, options)}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        {t('filters.selectAll')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs flex-1"
                        onClick={() => clearCategory(category)}
                      >
                        <X className="w-3 h-3 mr-1" />
                        {t('filters.selectNone')}
                      </Button>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                      <div className="p-2 space-y-1">
                        {filteredOptions.length === 0 && searchTerms[category] && (
                          <div className="text-sm text-muted-foreground text-center py-4">
                            {t('filters.noResults')}
                          </div>
                        )}
                        {filteredOptions.map(option => {
                          const groupState = category === 'grupos' ? getGroupState(option) : null;
                          const isDisabled = groupState === 'disabled';
                          const isChecked = filters[category].includes(option);

                          return (
                            <div
                              key={option}
                              className={cn(
                                "w-full flex items-center gap-3 p-2 rounded transition-colors min-h-10",
                                isDisabled
                                  ? "opacity-50 cursor-not-allowed bg-muted/30"
                                  : "hover:bg-accent hover:text-accent-foreground cursor-pointer"
                              )}
                              onClick={() => !isDisabled && toggleFilter(category, option)}
                            >
                              <Checkbox
                                checked={isChecked}
                                disabled={isDisabled}
                                className="pointer-events-none shrink-0"
                              />
                              <span className={cn(
                                "text-sm flex-1 text-left truncate",
                                isDisabled ? "text-muted-foreground" : "text-foreground"
                              )}>
                                {getDisplayLabel(category, option)}
                              </span>
                              {isChecked && (
                                <Check className="w-4 h-4 text-foreground shrink-0" />
                              )}
                              {isDisabled && category === 'grupos' && (
                                <Badge variant="outline" className="text-xs">
                                  {t('filters.notAvailable')}
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {totalActiveFilters > 0 && (
            <div className="mt-4 p-4 bg-card border rounded-lg">
              <p className="text-xs font-medium text-foreground mb-3">{t('filters.activeFilters')}</p>
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