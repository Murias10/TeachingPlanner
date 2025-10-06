import { useState } from 'react';
import { Filter, X, ChevronRight, ChevronDown, Check, BookOpen, GraduationCap, Building2, Globe, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type TipoGrupo = 'Teoria' | 'Seminario' | 'Laboratorio';
type Idioma = 'Español' | 'Inglés' | 'Catalán';

interface Clase {
  id: number;
  nombre: string;
  tipo: TipoGrupo;
  aula: string;
  idioma: Idioma;
  horario: string;
  profesor: string;
}

interface Filters {
  tipoGrupo: TipoGrupo[];
  asignatura: string[];
  aula: string[];
  idioma: Idioma[];
}

interface ExpandedCategories {
  tipoGrupo: boolean;
  asignatura: boolean;
  aula: boolean;
  idioma: boolean;
}

type FilterCategory = keyof Filters;

interface FilterCategoryConfig {
  label: string;
  options: string[];
  icon: React.ComponentType<{ className?: string }>;
}

export default function ClassFilter() {
  const [filters, setFilters] = useState<Filters>({
    tipoGrupo: [],
    asignatura: [],
    aula: [],
    idioma: []
  });

  const [expandedCategories, setExpandedCategories] = useState<ExpandedCategories>({
    tipoGrupo: true,
    asignatura: true,
    aula: false,
    idioma: false
  });

  const [classes] = useState<Clase[]>([
    { id: 1, nombre: 'Cálculo I', tipo: 'Teoria', aula: 'A-101', idioma: 'Español', horario: 'L-M-X 10:00-11:00', profesor: 'Dr. García' },
    { id: 2, nombre: 'Cálculo I', tipo: 'Seminario', aula: 'B-205', idioma: 'Español', horario: 'J 12:00-14:00', profesor: 'Dra. López' },
    { id: 3, nombre: 'Programación', tipo: 'Teoria', aula: 'C-301', idioma: 'Inglés', horario: 'L-X 16:00-18:00', profesor: 'Dr. Smith' },
    { id: 4, nombre: 'Programación', tipo: 'Laboratorio', aula: 'LAB-1', idioma: 'Inglés', horario: 'V 10:00-13:00', profesor: 'Dr. Johnson' },
    { id: 5, nombre: 'Física I', tipo: 'Teoria', aula: 'A-102', idioma: 'Español', horario: 'M-J 9:00-10:30', profesor: 'Dr. Martínez' },
    { id: 6, nombre: 'Física I', tipo: 'Laboratorio', aula: 'LAB-2', idioma: 'Español', horario: 'V 15:00-18:00', profesor: 'Dra. Fernández' },
    { id: 7, nombre: 'Base de Datos', tipo: 'Seminario', aula: 'B-210', idioma: 'Catalán', horario: 'X 14:00-16:00', profesor: 'Dr. Puig' },
    { id: 8, nombre: 'Base de Datos', tipo: 'Laboratorio', aula: 'LAB-3', idioma: 'Catalán', horario: 'J 16:00-19:00', profesor: 'Dra. Vila' },
    { id: 9, nombre: 'Álgebra', tipo: 'Teoria', aula: 'A-101', idioma: 'Inglés', horario: 'M-J 15:00-16:30', profesor: 'Dr. Brown' },
    { id: 10, nombre: 'Álgebra', tipo: 'Seminario', aula: 'B-205', idioma: 'Inglés', horario: 'V 12:00-14:00', profesor: 'Dr. Wilson' },
    { id: 11, nombre: 'Química', tipo: 'Teoria', aula: 'C-401', idioma: 'Español', horario: 'L-M 11:00-12:30', profesor: 'Dra. Ruiz' },
    { id: 12, nombre: 'Química', tipo: 'Laboratorio', aula: 'LAB-4', idioma: 'Español', horario: 'J 9:00-12:00', profesor: 'Dr. Sánchez' },
  ]);

  const asignaturas = [...new Set(classes.map(c => c.nombre))].sort();
  const aulas = [...new Set(classes.map(c => c.aula))].sort();
  const idiomas = [...new Set(classes.map(c => c.idioma))].sort();
  const tiposGrupo: TipoGrupo[] = ['Teoria', 'Seminario', 'Laboratorio'];

  const filterCategories: Record<FilterCategory, FilterCategoryConfig> = {
    tipoGrupo: { label: 'Tipo de Grupo', options: tiposGrupo, icon: BookOpen },
    asignatura: { label: 'Asignatura', options: asignaturas, icon: GraduationCap },
    aula: { label: 'Aula', options: aulas, icon: Building2 },
    idioma: { label: 'Idioma', options: idiomas, icon: Globe }
  };

  const filteredClasses = classes.filter(clase => {
    if (filters.tipoGrupo.length > 0 && !filters.tipoGrupo.includes(clase.tipo)) return false;
    if (filters.asignatura.length > 0 && !filters.asignatura.includes(clase.nombre)) return false;
    if (filters.aula.length > 0 && !filters.aula.includes(clase.aula)) return false;
    if (filters.idioma.length > 0 && !filters.idioma.includes(clase.idioma)) return false;
    return true;
  });

  const toggleCategory = (category: FilterCategory) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleFilter = (category: FilterCategory, value: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value as never)
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value as never]
    }));
  };

  const selectAll = (category: FilterCategory, options: string[]) => {
    setFilters(prev => ({
      ...prev,
      [category]: options as never[]
    }));
  };

  const clearCategory = (category: FilterCategory) => {
    setFilters(prev => ({
      ...prev,
      [category]: []
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      tipoGrupo: [],
      asignatura: [],
      aula: [],
      idioma: []
    });
  };

  const totalActiveFilters = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="flex gap-0 max-w-[1800px] mx-auto">
        {/* Panel lateral de filtros */}
        <aside className="w-80 border-r bg-gray-50/50">
          <div className="sticky top-0 h-screen flex flex-col">
            <div className="p-6 border-b bg-white">
              <div className="flex items-center gap-3 mb-1">
                <Filter className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {totalActiveFilters > 0 ? `${totalActiveFilters} aplicado${totalActiveFilters > 1 ? 's' : ''}` : 'Ningún filtro aplicado'}
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
                {Object.entries(filterCategories).map(([key, { label, options, icon: Icon }]) => {
                  const category = key as FilterCategory;
                  const isExpanded = expandedCategories[category];
                  const selectedCount = filters[category].length;

                  return (
                    <div key={key} className="border rounded-lg overflow-hidden bg-white">
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
                                  checked={filters[category].includes(option as never)}
                                  className="pointer-events-none"
                                />
                                <span className="text-sm flex-1 text-left text-gray-700">
                                  {option}
                                </span>
                                {filters[category].includes(option as never) && (
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
          </div>
        </aside>

        {/* Contenido principal */}
        <main className="flex-1 min-w-0">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-900">Clases Disponibles</h1>
              <p className="text-sm text-gray-600 mt-1">
                {filteredClasses.length} {filteredClasses.length === 1 ? 'clase encontrada' : 'clases encontradas'}
              </p>
            </div>

            {filteredClasses.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium mb-2">No se encontraron clases</p>
                  <p className="text-sm text-gray-500 mb-4">Intenta ajustar los filtros para ver más resultados</p>
                  {totalActiveFilters > 0 && (
                    <Button
                      variant="outline"
                      onClick={clearAllFilters}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Limpiar filtros
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredClasses.map(clase => (
                  <Card
                    key={clase.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-base leading-tight">{clase.nombre}</CardTitle>
                        <Badge variant="outline" className="shrink-0">
                          {clase.tipo}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-gray-500 text-xs block">Profesor</span>
                          <span className="text-gray-900">{clase.profesor}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Building2 className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-gray-500 text-xs block">Aula</span>
                          <span className="text-gray-900">{clase.aula}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Globe className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-gray-500 text-xs block">Idioma</span>
                          <span className="text-gray-900">{clase.idioma}</span>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-start gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-gray-500 text-xs block">Horario</span>
                          <span className="text-gray-900 font-mono text-xs">{clase.horario}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}