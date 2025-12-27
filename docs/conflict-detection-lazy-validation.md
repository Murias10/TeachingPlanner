# Validación Lazy de Conflictos - Propuesta de Implementación

## Contexto

Actualmente, el sistema detecta conflictos de horarios en tres puntos:
1. Al crear un evento puntual (`createPuntualEvent`)
2. Al actualizar un evento puntual (`updatePuntualEvent`)
3. Al reemplazar un evento periódico (`replacePeriodicEvent`)

Sin embargo, **NO** se detectan conflictos al crear eventos periódicos (`createPeriodicEvent`) porque:
- Los eventos periódicos son plantillas dinámicas que se materializan en días concretos
- Detectar conflictos requeriría iterar por cientos de días lectivos
- Los eventos periódicos cambian según ajustes posteriores en el calendario
- Sería computacionalmente muy costoso

## Propuesta: Validación Lazy en el Frontend

### Concepto

En lugar de validar conflictos en el backend al crear eventos periódicos, implementar una **validación visual en el frontend** que:
- Detecte conflictos cuando el usuario visualiza el calendario
- Resalte visualmente los eventos conflictivos
- Permita al usuario resolver los conflictos manualmente
- No bloquee la creación de eventos (solo alerta)

### Ventajas

1. **Performance**: No impacta el rendimiento del backend
2. **Flexibilidad**: Permite al usuario decidir si un "conflicto" es realmente un problema
3. **Experiencia de usuario**: Visual e intuitivo
4. **No bloquea workflows**: Los usuarios pueden crear eventos y resolverlos después

### Implementación Sugerida

#### 1. Detección de Conflictos en el Cliente

Agregar una función en el frontend que analice los eventos visibles en el calendario:

```typescript
// webapp/src/utils/conflictDetection.ts

export interface ConflictInfo {
  eventId: string;
  conflictsWith: string[]; // IDs of conflicting events
  conflictType: 'group' | 'classroom' | 'both';
  severity: 'warning' | 'error';
}

export function detectConflicts(events: CalendarEvent[]): Map<string, ConflictInfo> {
  const conflicts = new Map<string, ConflictInfo>();

  // Agrupar eventos por fecha
  const eventsByDate = groupBy(events, e => e.date);

  // Para cada fecha, verificar conflictos de tiempo
  for (const [date, dayEvents] of Object.entries(eventsByDate)) {
    for (let i = 0; i < dayEvents.length; i++) {
      for (let j = i + 1; j < dayEvents.length; j++) {
        const event1 = dayEvents[i];
        const event2 = dayEvents[j];

        // Verificar solapamiento temporal
        if (hasTimeOverlap(event1, event2)) {
          // Verificar si comparten recursos
          const sharesGroup = hasSharedGroups(event1, event2);
          const sharesClassroom = hasSharedClassrooms(event1, event2);

          if (sharesGroup || sharesClassroom) {
            // Registrar conflicto para ambos eventos
            addConflict(conflicts, event1.id, event2.id,
              sharesGroup && sharesClassroom ? 'both' :
              sharesGroup ? 'group' : 'classroom'
            );
          }
        }
      }
    }
  }

  return conflicts;
}

function hasTimeOverlap(e1: CalendarEvent, e2: CalendarEvent): boolean {
  return e1.startTime < e2.endTime && e1.endTime > e2.startTime;
}

function hasSharedGroups(e1: CalendarEvent, e2: CalendarEvent): boolean {
  return e1.groups.some(g1 => e2.groups.some(g2 => g1.id === g2.id));
}

function hasSharedClassrooms(e1: CalendarEvent, e2: CalendarEvent): boolean {
  return e1.classrooms.some(c1 => e2.classrooms.some(c2 => c1.id === c2.id));
}
```

#### 2. Visualización de Conflictos

Modificar el componente de eventos en el calendario para resaltar conflictos:

```typescript
// webapp/src/components/calendar/CalendarEventWrapper.tsx

export function CalendarEventWrapper({ event, conflicts }: Props) {
  const conflictInfo = conflicts.get(event.id);
  const hasConflict = conflictInfo !== undefined;

  return (
    <div
      className={cn(
        "calendar-event",
        hasConflict && "ring-2 ring-red-500 bg-red-50"
      )}
    >
      {hasConflict && (
        <Tooltip>
          <TooltipTrigger>
            <AlertTriangle className="w-3 h-3 text-red-600" />
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-semibold">Conflicto detectado</p>
              <p className="text-xs">
                {conflictInfo.conflictType === 'both'
                  ? 'Mismo grupo y aula en este horario'
                  : conflictInfo.conflictType === 'group'
                  ? 'Mismo grupo en este horario'
                  : 'Misma aula en este horario'}
              </p>
              <p className="text-xs text-muted-foreground">
                {conflictInfo.conflictsWith.length} evento(s) conflictivo(s)
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Resto del contenido del evento */}
    </div>
  );
}
```

#### 3. Panel de Conflictos

Agregar un panel lateral o modal que liste todos los conflictos detectados:

```typescript
// webapp/src/components/calendar/ConflictsPanel.tsx

export function ConflictsPanel({ conflicts, events }: Props) {
  const conflictingEvents = Array.from(conflicts.entries())
    .map(([eventId, conflictInfo]) => {
      const event = events.find(e => e.id === eventId);
      return { event, conflictInfo };
    })
    .filter(x => x.event !== undefined);

  if (conflictingEvents.length === 0) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Sin conflictos</AlertTitle>
        <AlertDescription>
          No se detectaron conflictos de horarios en el calendario actual.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Conflictos Detectados</h3>
        <Badge variant="destructive">{conflictingEvents.length}</Badge>
      </div>

      <div className="space-y-2">
        {conflictingEvents.map(({ event, conflictInfo }) => (
          <Card key={event.id}>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{event.subject?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(event.date), 'dd/MM/yyyy')} • {event.startTime} - {event.endTime}
                  </p>
                </div>
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>

              <div className="text-xs space-y-1">
                <p>
                  <strong>Grupos:</strong> {event.groups.map(g => `${g.type}-${g.number}`).join(', ')}
                </p>
                <p>
                  <strong>Aulas:</strong> {event.classrooms.map(c => c.code).join(', ')}
                </p>
                <p className="text-red-600">
                  <strong>Conflicto:</strong> {
                    conflictInfo.conflictType === 'both'
                      ? 'Grupo y aula compartidos'
                      : conflictInfo.conflictType === 'group'
                      ? 'Grupo compartido'
                      : 'Aula compartida'
                  }
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => handleResolveConflict(event)}>
                  Resolver
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleViewDetails(event)}>
                  Ver detalles
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

#### 4. Integración en CalendarPage

```typescript
// webapp/src/pages/CalendarPage.tsx

export function CalendarPage() {
  const { data: calendarData } = useCalendarEvents(calendarId);
  const [showConflictsPanel, setShowConflictsPanel] = useState(false);

  // Detectar conflictos automáticamente cuando cambian los eventos
  const conflicts = useMemo(() => {
    if (!calendarData?.events) return new Map();
    return detectConflicts(calendarData.events);
  }, [calendarData?.events]);

  const conflictCount = conflicts.size;

  return (
    <div className="calendar-page">
      {/* Botón para mostrar/ocultar panel de conflictos */}
      <Button
        variant={conflictCount > 0 ? "destructive" : "outline"}
        onClick={() => setShowConflictsPanel(!showConflictsPanel)}
      >
        <AlertTriangle className="w-4 h-4 mr-2" />
        Conflictos ({conflictCount})
      </Button>

      {/* Panel de conflictos */}
      {showConflictsPanel && (
        <Sheet open={showConflictsPanel} onOpenChange={setShowConflictsPanel}>
          <SheetContent>
            <ConflictsPanel conflicts={conflicts} events={calendarData.events} />
          </SheetContent>
        </Sheet>
      )}

      {/* Calendario con información de conflictos */}
      <Calendar
        events={calendarData.events}
        conflicts={conflicts}
        // ...
      />
    </div>
  );
}
```

### Flujo de Resolución de Conflictos

Cuando el usuario hace clic en "Resolver" en un conflicto:

1. **Mostrar diálogo de resolución** con opciones:
   - Ver todos los eventos conflictivos en ese horario
   - Editar el evento actual (cambiar hora, aula, o fecha)
   - Cancelar el evento
   - Marcar como "conflicto aceptado" (ignorar la advertencia)

2. **Acciones automáticas sugeridas**:
   - Buscar aulas disponibles en ese horario
   - Sugerir horarios alternativos sin conflictos
   - Mostrar calendario de disponibilidad del grupo/aula

3. **Persistencia de decisiones**:
   - Si el usuario marca un conflicto como "aceptado", guardarlo en localStorage
   - No volver a mostrar ese conflicto específico
   - Permitir "resetear" conflictos aceptados

### Consideraciones Adicionales

#### Performance

- **Memoización**: Usar `useMemo` para evitar recalcular conflictos en cada render
- **Lazy loading**: Solo detectar conflictos en el rango de fechas visible
- **Web Workers**: Para calendarios muy grandes, calcular conflictos en background

#### Tipos de Conflictos

Diferenciar entre:
- **Error (rojo)**: Mismo grupo Y misma aula (conflicto absoluto)
- **Warning (amarillo)**: Solo mismo grupo O solo misma aula (conflicto parcial)
- **Info (azul)**: Eventos consecutivos del mismo grupo (útil para planificación)

#### Filtros

Permitir filtrar conflictos por:
- Tipo de conflicto (grupo, aula, ambos)
- Severidad (error, warning)
- Fecha (rango)
- Grupo específico
- Aula específica

### Archivos a Crear/Modificar

1. **Nuevo**: `webapp/src/utils/conflictDetection.ts`
2. **Nuevo**: `webapp/src/components/calendar/ConflictsPanel.tsx`
3. **Nuevo**: `webapp/src/components/calendar/ConflictBadge.tsx`
4. **Modificar**: `webapp/src/components/calendar/CalendarEventWrapper.tsx`
5. **Modificar**: `webapp/src/pages/CalendarPage.tsx`
6. **Nuevo**: `webapp/src/types/Conflict.ts`

### Estimación de Esfuerzo

- **Detección básica**: 2-3 horas
- **Visualización**: 3-4 horas
- **Panel de conflictos**: 2-3 horas
- **Flujo de resolución**: 4-5 horas
- **Testing y refinamiento**: 2-3 horas

**Total**: 13-18 horas de desarrollo

### Alternativas Consideradas

#### Opción A: Validación en Backend (Descartada)

- Detectar conflictos al crear `PeriodicEvent`
- **Problema**: Muy costoso computacionalmente
- **Problema**: Bloquea la creación de eventos

#### Opción B: Endpoint de Análisis (Futuro)

- Crear endpoint `/calendar/:id/analyze-conflicts`
- Ejecutar bajo demanda (botón "Analizar conflictos")
- Devolver reporte completo de conflictos
- **Ventaja**: Puede analizar todo el semestre de una vez
- **Desventaja**: Más complejo de implementar

#### Opción C: Validación Lazy (Recomendada)

- Validación visual en el frontend
- No bloquea workflows
- Detección inmediata al visualizar calendario
- **Esta es la opción propuesta en este documento**

## Conclusión

La validación lazy de conflictos ofrece el mejor balance entre:
- Performance (no impacta el backend)
- Experiencia de usuario (visual e intuitivo)
- Flexibilidad (permite al usuario decidir)
- Implementación (relativamente sencilla)

Esta propuesta puede implementarse de forma incremental:
1. Fase 1: Detección básica y visualización
2. Fase 2: Panel de conflictos
3. Fase 3: Flujo de resolución automatizada
