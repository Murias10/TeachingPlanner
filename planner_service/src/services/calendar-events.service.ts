import { AppDataSource } from '@/config/data-source';
import { Day } from '@/entities/day.entity';
import { PeriodicEvent } from '@/entities/periodic_event.entity';

/**
 * CalendarEventsService
 *
 * Este servicio genera un calendario completo combinando dos tipos de eventos:
 * 1. Eventos periódicos: Clases recurrentes
 * 2. Eventos puntuales: Sesiones únicas
 *
 * Responsabilidades principales:
 * - Calcular y respetar los presupuestos de horas para cada grupo de curso
 * - Gestionar cancelaciones de eventos y conflictos
 * - Implementar la lógica de "horas compartidas" para eventos con carácter 'N'
 * - Distribuir eventos equitativamente usando programación round-robin
 */
export class CalendarEventsService {
  // Mapeo de letras de días a números (Lunes=1, Viernes=5)
  private static readonly DIAS_SEMANA: Record<string, number> = {
    'L': 1, // Lunes
    'M': 2, // Martes
    'X': 3, // Miércoles
    'J': 4, // Jueves
    'V': 5  // Viernes
  };

  /**
   * Genera todos los eventos de calendario para un calendario específico
   */
  static async generateCalendarEvents(calendarId: string) {
    // Cargar datos en paralelo
    const [diasDelCalendario, eventosPeriodicos] = await Promise.all([
      this.cargarDiasDelCalendario(calendarId),
      this.cargarEventosPeriodicos(calendarId)
    ]);

    // Crear mapa para búsqueda rápida de días por fecha
    const diasPorClaveFecha = new Map(
      diasDelCalendario.map(dia => [this.obtenerClaveFecha(dia.date), dia])
    );

    // Construir índice de eventos cancelados (bloquean eventos periódicos)
    const indiceCanceladosEventos = this.construirIndiceCanceladosEventos(diasDelCalendario);

    // MAP para agrupar eventos por grupo
    const eventosPorGrupo = new Map<string, any[]>();

    // PASO 1: Añadir eventos puntuales no cancelados
    this.añadirEventosPuntualesAlMap(diasDelCalendario, eventosPorGrupo);

    // PASO 2: Procesar eventos periódicos con carácter 'N' (horas compartidas)
    const eventosN = eventosPeriodicos.filter(e => e.eventCharacter.toUpperCase() === 'N');
    this.procesarEventosPeriodicosN(
      eventosN,
      diasDelCalendario,
      diasPorClaveFecha,
      indiceCanceladosEventos,
      eventosPorGrupo
    );

    // PASO 3: Procesar eventos periódicos NO-N (nueva lógica por dayCharacter)
    const eventosNoN = eventosPeriodicos.filter(e => e.eventCharacter.toUpperCase() !== 'N');
    this.procesarEventosPeriodicosNoN(
      eventosNoN,
      diasDelCalendario,
      diasPorClaveFecha,
      indiceCanceladosEventos,
      eventosPorGrupo
    );

    // PASO 4: Ordenar eventos de cada grupo por fecha y hora
    for (const eventos of eventosPorGrupo.values()) {
      this.ordenarEventosPorFechaYHora(eventos);
    }

    // PASO 5: Filtrar por horas programadas
    const eventosFiltrados = this.filtrarPorHorasProgramadas(
      eventosPorGrupo,
      eventosPeriodicos
    );

    // PASO 6: Añadir eventos cancelados
    const eventosCancelados = this.añadirEventosCancelados(diasDelCalendario);

    return [...eventosFiltrados, ...eventosCancelados];
  }

  /**
   * Carga días del calendario con todas sus relaciones
   */
  private static async cargarDiasDelCalendario(calendarId: string) {
    return AppDataSource.getRepository(Day).find({
      where: { calendar: { id: calendarId } },
      relations: [
        'puntualEvents',
        'puntualEvents.groups',
        'puntualEvents.groups.subject',
        'puntualEvents.classrooms'
      ],
      order: { date: 'ASC' }
    });
  }

  /**
   * Carga eventos periódicos con todas sus relaciones
   */
  private static async cargarEventosPeriodicos(calendarId: string) {
    return AppDataSource.getRepository(PeriodicEvent).find({
      where: { calendar: { id: calendarId } },
      relations: ['groups', 'groups.subject', 'classrooms']
    });
  }

  /**
   * Añade eventos puntuales no cancelados al MAP agrupados por grupo
   */
  private static añadirEventosPuntualesAlMap(
    diasDelCalendario: any[],
    eventosPorGrupo: Map<string, any[]>
  ): void {
    for (const dia of diasDelCalendario) {
      // Solo procesar días lectivos
      if (!dia.lective) continue;

      for (const eventoPuntual of dia.puntualEvents || []) {
        if (eventoPuntual.cancelled) continue;

        const claveFecha = this.obtenerClaveFecha(dia.date);
        const evento = this.crearObjetoEventoPuntual(eventoPuntual, dia, claveFecha);

        // Añadir el evento a cada grupo involucrado
        for (const grupo of eventoPuntual.groups) {
          const claveGrupo = this.construirClaveGrupo(grupo);
          if (!eventosPorGrupo.has(claveGrupo)) {
            eventosPorGrupo.set(claveGrupo, []);
          }
          eventosPorGrupo.get(claveGrupo)!.push(evento);
        }
      }
    }
  }

  /**
   * Añade eventos cancelados al resultado final
   * Los eventos cancelados se muestran en el calendario con una estética diferente
   */
  private static añadirEventosCancelados(diasDelCalendario: any[]): any[] {
    const eventosCancelados: any[] = [];

    for (const dia of diasDelCalendario) {
      for (const eventoPuntual of dia.puntualEvents || []) {
        if (!eventoPuntual.cancelled) continue;

        const claveFecha = this.obtenerClaveFecha(dia.date);
        const evento = this.crearObjetoEventoPuntual(eventoPuntual, dia, claveFecha);
        // Marcar explícitamente como cancelado
        evento.cancelled = true;

        eventosCancelados.push(evento);
      }
    }

    return eventosCancelados;
  }

  /**
   * Procesa eventos periódicos NO-N según dayCharacter
   *
   * Si el eventCharacter del evento está incluido en el dayCharacter del día,
   * se crea un evento para ese día (solo en días lectivos)
   *
   * IMPORTANTE: También verifica que el weekDay del evento coincida con el día de la semana del calendario
   */
  private static procesarEventosPeriodicosNoN(
    eventosNoN: any[],
    diasDelCalendario: any[],
    diasPorClaveFecha: Map<string, any>,
    indiceCanceladosEventos: Set<string>,
    eventosPorGrupo: Map<string, any[]>
  ): void {
    for (const dia of diasDelCalendario) {
      // Solo procesar días lectivos
      if (!dia.lective) continue;

      // Obtener el día de la semana del calendario (L, M, X, J, V)
      const diaSemanaCalendario = this.obtenerDiaSemanaDesdeFecha(dia.date);

      for (const eventoPeriodico of eventosNoN) {
        // Verificar si el carácter del evento está incluido en el dayCharacter
        const caracterEvento = eventoPeriodico.eventCharacter.toUpperCase();
        const caracterDia = (dia.dayCharacter || '').toUpperCase();

        if (!caracterDia.includes(caracterEvento)) continue;

        // Verificar que el weekDay del evento coincida con el día de la semana del calendario
        if (eventoPeriodico.weekDay !== diaSemanaCalendario) continue;

        // Verificar si hay conflicto con evento puntual cancelado
        if (this.tieneConflictoCancelacion(eventoPeriodico, dia, indiceCanceladosEventos)) {
          continue;
        }

        // Crear evento y añadirlo al MAP por cada grupo
        const claveFecha = this.obtenerClaveFecha(dia.date);
        const evento = this.crearObjetoEventoPeriodico(
          eventoPeriodico,
          claveFecha,
          diasPorClaveFecha
        );

        for (const grupo of eventoPeriodico.groups) {
          const claveGrupo = this.construirClaveGrupo(grupo);
          if (!eventosPorGrupo.has(claveGrupo)) {
            eventosPorGrupo.set(claveGrupo, []);
          }
          eventosPorGrupo.get(claveGrupo)!.push(evento);
        }
      }
    }
  }

  /**
   * Ordena eventos por fecha y hora de inicio
   */
  private static ordenarEventosPorFechaYHora(eventos: any[]): void {
    eventos.sort((a, b) => {
      // Primero ordenar por fecha
      const fechaComparacion = a.date.localeCompare(b.date);
      if (fechaComparacion !== 0) return fechaComparacion;

      // Si misma fecha, ordenar por hora de inicio
      return a.startTime.localeCompare(b.startTime);
    });
  }

  /**
   * Filtra eventos por horas programadas
   *
   * Los eventos puntuales SIEMPRE se incluyen (tienen prioridad)
   * Los eventos periódicos se filtran hasta completar las horas restantes
   */
  private static filtrarPorHorasProgramadas(
    eventosPorGrupo: Map<string, any[]>,
    eventosPeriodicos: any[]
  ): any[] {
    const resultado: any[] = [];

    for (const [claveGrupo, eventos] of eventosPorGrupo) {
      // Obtener horas programadas del primer evento periódico del grupo
      const horasProgramadas = this.obtenerHorasProgramadasDelGrupo(
        claveGrupo,
        eventosPeriodicos
      );

      // Si no hay horas programadas (grupo sin eventos periódicos), devolver todos
      if (horasProgramadas === null) {
        resultado.push(...eventos);
        continue;
      }

      // Separar eventos puntuales y periódicos
      const eventosPuntuales = eventos.filter(e => e.type === 'puntual');
      const eventosPeriodicosDelGrupo = eventos.filter(e => e.type === 'periodic');

      // Calcular horas consumidas por eventos puntuales
      const horasConsumidasPorPuntuales = eventosPuntuales.reduce(
        (sum, e) => sum + e.duration,
        0
      );

      // Calcular horas restantes disponibles para eventos periódicos
      const horasRestantes = Math.max(0, horasProgramadas - horasConsumidasPorPuntuales);

      // Filtrar eventos periódicos hasta completar horas restantes
      const eventosPeriodicosFiltrados: any[] = [];
      let horasAcumuladas = 0;

      for (const evento of eventosPeriodicosDelGrupo) {
        if (horasAcumuladas >= horasRestantes) break;

        eventosPeriodicosFiltrados.push(evento);
        horasAcumuladas += evento.duration;
      }

      // Añadir todos los puntuales + periódicos filtrados
      resultado.push(...eventosPuntuales, ...eventosPeriodicosFiltrados);
    }

    return resultado;
  }

  /**
   * Obtiene las horas programadas para un grupo específico
   * Obtiene las horas directamente del grupo (Group.planifiedHours)
   */
  private static obtenerHorasProgramadasDelGrupo(
    claveGrupo: string,
    eventosPeriodicos: any[]
  ): number | null {
    for (const eventoPeriodico of eventosPeriodicos) {
      for (const grupo of eventoPeriodico.groups) {
        if (this.construirClaveGrupo(grupo) === claveGrupo) {
          // Return planified hours from Group instead of PeriodicEvent
          return grupo.planifiedHours ?? null;
        }
      }
    }
    return null;
  }

  /**
   * Construye índice de eventos cancelados para detección rápida de conflictos
   */
  private static construirIndiceCanceladosEventos(diasCalendario: any[]): Set<string> {
    const indice = new Set<string>();

    for (const dia of diasCalendario) {
      for (const eventoPuntual of dia.puntualEvents || []) {
        if (!eventoPuntual.cancelled) continue;

        for (const grupo of eventoPuntual.groups) {
          indice.add(this.crearClaveEventoCancelado(grupo.id, dia.date, eventoPuntual.startTime));
        }
      }
    }

    return indice;
  }

  /**
   * Verifica si hay conflicto de cancelación para un evento
   */
  private static tieneConflictoCancelacion(
    eventoPeriodico: any,
    dia: any,
    indiceCanceladosEventos: Set<string>
  ): boolean {
    return eventoPeriodico.groups.some((grupo: any) =>
      this.estaEventoCancelado(
        indiceCanceladosEventos,
        grupo.id,
        dia.date,
        eventoPeriodico.startTime
      )
    );
  }

  /**
   * Crea objeto de evento puntual
   */
  private static crearObjetoEventoPuntual(eventoPuntual: any, dia: any, claveFecha: string) {
    return {
      id: eventoPuntual.id,
      date: new Date(`${claveFecha}T${eventoPuntual.startTime}`).toISOString(),
      startTime: eventoPuntual.startTime,
      endTime: eventoPuntual.endTime,
      duration: this.calcularDuracionEnHoras(eventoPuntual.startTime, eventoPuntual.endTime),
      subject: eventoPuntual.groups[0]?.subject ? {
        id: eventoPuntual.groups[0].subject.id,
        acronym: eventoPuntual.groups[0].subject.acronym,
        name: eventoPuntual.groups[0].subject.name
      } : null,
      groups: eventoPuntual.groups.map((grupo: any) => ({
        id: grupo.id,
        number: grupo.number,
        type: grupo.type,
        language: grupo.language
      })),
      classrooms: eventoPuntual.classrooms.map((aula: any) => ({
        id: aula.id,
        code: aula.code,
        gisUrl: aula.gisUrl
      })),
      type: 'puntual',
      cancelled: false,
      puntualEventId: eventoPuntual.id,
      dayCharacter: dia.dayCharacter || '',
      dayComment: dia.comment || ''
    };
  }

  /**
   * Construye identificador único para un grupo
   * Formato: "{acronimoAsignatura}.{tipoGrupo}.{idioma}-{numero}"
   */
  private static construirClaveGrupo(grupo: any): string {
    return `${grupo.subject?.acronym || 'N/A'}.${grupo.type}.${grupo.language}-${grupo.number}`;
  }

  /**
   * Procesa eventos periódicos con carácter 'N' usando horas compartidas
   *
   * CONCEPTO DE HORAS COMPARTIDAS:
   * Múltiples eventos 'N' para el mismo grupo comparten UN ÚNICO presupuesto de horas.
   * Se distribuyen usando algoritmo round-robin para equidad.
   */
  private static procesarEventosPeriodicosN(
    eventosPeriodicosN: any[],
    diasCalendario: any[],
    diasPorClaveFecha: Map<string, any>,
    indiceCanceladosEventos: Set<string>,
    eventosPorGrupo: Map<string, any[]>
  ): void {
    const eventosPorGrupoN = this.agruparEventosPorGrupo(eventosPeriodicosN);

    for (const [claveGrupo, eventosDelGrupo] of eventosPorGrupoN) {
      this.procesarGrupoConHorasCompartidas(
        claveGrupo,
        eventosDelGrupo,
        diasCalendario,
        diasPorClaveFecha,
        indiceCanceladosEventos,
        eventosPorGrupo
      );
    }
  }

  /**
   * Agrupa eventos por clave de grupo
   */
  private static agruparEventosPorGrupo(eventos: any[]): Map<string, any[]> {
    const eventosPorGrupo = new Map<string, any[]>();

    for (const evento of eventos) {
      for (const grupo of evento.groups) {
        const claveGrupo = this.construirClaveGrupo(grupo);
        if (!eventosPorGrupo.has(claveGrupo)) {
          eventosPorGrupo.set(claveGrupo, []);
        }
        eventosPorGrupo.get(claveGrupo)!.push(evento);
      }
    }

    return eventosPorGrupo;
  }

  /**
   * Procesa un grupo de eventos con presupuesto compartido usando round-robin
   *
   * IMPORTANTE: Esta función NO filtra por horas, solo genera todos los eventos posibles.
   * El filtrado se hace después en filtrarPorHorasProgramadas()
   */
  private static procesarGrupoConHorasCompartidas(
    claveGrupo: string,
    eventosDelGrupo: any[],
    diasCalendario: any[],
    diasPorClaveFecha: Map<string, any>,
    indiceCanceladosEventos: Set<string>,
    eventosPorGrupo: Map<string, any[]>
  ): void {
    // Ordenar eventos por día de semana
    const eventosOrdenados = this.ordenarEventosPorDiaSemana(eventosDelGrupo);

    // Crear colas de colocación para round-robin
    const colas = eventosOrdenados.map(evento => ({
      evento,
      numeroDiaSemana: this.DIAS_SEMANA[evento.weekDay] || 6,
      siguienteIndice: 0
    }));

    // Asegurar que el grupo existe en el MAP
    if (!eventosPorGrupo.has(claveGrupo)) {
      eventosPorGrupo.set(claveGrupo, []);
    }

    this.aplicarRoundRobin(
      colas,
      diasCalendario,
      diasPorClaveFecha,
      indiceCanceladosEventos,
      eventosPorGrupo.get(claveGrupo)!
    );
  }

  /**
   * Ordena eventos por día de semana
   */
  private static ordenarEventosPorDiaSemana(eventos: any[]): any[] {
    return [...eventos].sort((a, b) => {
      const diaA = this.DIAS_SEMANA[a.weekDay] || 6;
      const diaB = this.DIAS_SEMANA[b.weekDay] || 6;
      return diaA - diaB;
    });
  }

  /**
   * Aplica algoritmo round-robin para distribución equitativa de eventos
   * Genera TODOS los eventos posibles sin filtrar por horas
   */
  private static aplicarRoundRobin(
    colas: any[],
    diasCalendario: any[],
    diasPorClaveFecha: Map<string, any>,
    indiceCanceladosEventos: Set<string>,
    eventosDelGrupo: any[]
  ): void {
    let indiceActual = 0;

    while (colas.length > 0) {
      const cola = colas[indiceActual];
      const colocado = this.intentarColocarEvento(
        cola,
        diasCalendario,
        diasPorClaveFecha,
        indiceCanceladosEventos,
        eventosDelGrupo
      );

      if (colocado) {
        indiceActual = (indiceActual + 1) % colas.length;
      } else {
        // No hay más fechas para este evento, eliminarlo de rotación
        colas.splice(indiceActual, 1);
        if (colas.length > 0) {
          indiceActual = indiceActual % colas.length;
        }
      }
    }
  }

  /**
   * Intenta colocar un evento en la siguiente fecha disponible
   */
  private static intentarColocarEvento(
    cola: any,
    diasCalendario: any[],
    diasPorClaveFecha: Map<string, any>,
    indiceCanceladosEventos: Set<string>,
    eventosDelGrupo: any[]
  ): boolean {
    for (let i = cola.siguienteIndice; i < diasCalendario.length; i++) {
      const dia = diasCalendario[i];

      // Verificar día de semana y estado lectivo
      if (dia.date.getDay() !== cola.numeroDiaSemana || !dia.lective) continue;

      // Verificar conflictos de cancelación
      if (this.tieneConflictoCancelacion(cola.evento, dia, indiceCanceladosEventos)) {
        continue;
      }

      const claveFecha = this.obtenerClaveFecha(dia.date);
      eventosDelGrupo.push(
        this.crearObjetoEventoPeriodico(cola.evento, claveFecha, diasPorClaveFecha)
      );

      cola.siguienteIndice = i + 1;
      return true;
    }

    return false;
  }

  /**
   * Crea objeto de evento a partir de evento periódico
   */
  private static crearObjetoEventoPeriodico(
    eventoPeriodico: any,
    claveFecha: string,
    diasPorClaveFecha: Map<string, any>
  ) {
    const dia = diasPorClaveFecha.get(claveFecha);

    return {
      id: `${eventoPeriodico.id}_${claveFecha}`,
      date: new Date(`${claveFecha}T${eventoPeriodico.startTime}`).toISOString(),
      startTime: eventoPeriodico.startTime,
      endTime: eventoPeriodico.endTime,
      duration: this.calcularDuracionEnHoras(eventoPeriodico.startTime, eventoPeriodico.endTime),
      subject: eventoPeriodico.groups[0]?.subject ? {
        id: eventoPeriodico.groups[0].subject.id,
        acronym: eventoPeriodico.groups[0].subject.acronym,
        name: eventoPeriodico.groups[0].subject.name
      } : null,
      groups: eventoPeriodico.groups.map((grupo: any) => ({
        id: grupo.id,
        number: grupo.number,
        type: grupo.type,
        language: grupo.language,
        planifiedHours: grupo.planifiedHours
      })),
      classrooms: eventoPeriodico.classrooms.map((aula: any) => ({
        id: aula.id,
        code: aula.code,
        gisUrl: aula.gisUrl
      })),
      type: 'periodic',
      cancelled: false,
      periodicEventId: eventoPeriodico.id,
      eventCharacter: eventoPeriodico.eventCharacter,
      weekDay: eventoPeriodico.weekDay,
      dayCharacter: dia?.dayCharacter || '',
      dayComment: dia?.comment || ''
    };
  }

  /**
   * Obtiene clave de fecha en formato YYYY-MM-DD
   */
  private static obtenerClaveFecha(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
  }

  /**
   * Crea clave única para evento cancelado
   */
  private static crearClaveEventoCancelado(idGrupo: string, fecha: Date, horaInicio: string): string {
    return `${idGrupo}_${this.obtenerClaveFecha(fecha)}_${horaInicio}`;
  }

  /**
   * Verifica si un evento está cancelado
   */
  private static estaEventoCancelado(
    indice: Set<string>,
    idGrupo: string,
    fecha: Date,
    horaInicio: string
  ): boolean {
    return indice.has(this.crearClaveEventoCancelado(idGrupo, fecha, horaInicio));
  }

  /**
   * Calcula duración en horas entre dos tiempos
   */
  private static calcularDuracionEnHoras(horaInicio: string, horaFin: string): number {
    const [horaIni, minIni] = horaInicio.split(':').map(Number);
    const [horaFn, minFn] = horaFin.split(':').map(Number);
    return ((horaFn * 60 + minFn) - (horaIni * 60 + minIni)) / 60;
  }

  /**
   * Detecta conflictos entre un nuevo evento y eventos existentes
   *
   * Conflicto ocurre cuando hay solapamiento temporal Y se comparte grupo O aula
   */
  static detectConflicts(nuevoEvento: any, eventosExistentes: any[]): any[] {
    const [inicioNuevo, finNuevo] = this.convertirATiempoMinutos(
      nuevoEvento.startTime,
      nuevoEvento.endTime
    );
    const gruposNuevos = new Set(nuevoEvento.groupIds || []);
    const aulasNuevas = new Set(nuevoEvento.classroomIds || []);

    return eventosExistentes.filter(existente => {
      const [inicioExistente, finExistente] = this.convertirATiempoMinutos(
        existente.startTime,
        existente.endTime
      );

      // Verificar solapamiento temporal
      const haySolapamiento = finNuevo > inicioExistente && inicioNuevo < finExistente;
      if (!haySolapamiento) return false;

      // Verificar si comparte recursos
      const gruposExistentes = new Set(existente.groups?.map((g: any) => g.id) || []);
      const aulasExistentes = new Set(existente.classrooms?.map((a: any) => a.id) || []);

      const comparteGrupo = [...gruposNuevos].some(id => gruposExistentes.has(id));
      const comparteAula = [...aulasNuevas].some(id => aulasExistentes.has(id));

      return comparteGrupo || comparteAula;
    });
  }

  /**
   * Convierte tiempos a minutos desde medianoche
   */
  private static convertirATiempoMinutos(horaInicio: string, horaFin: string): [number, number] {
    const aMinutos = (tiempo: string) => {
      const [h, m] = tiempo.split(':').map(Number);
      return h * 60 + m;
    };
    return [aMinutos(horaInicio), aMinutos(horaFin)];
  }

  /**
   * Obtiene el día de la semana desde una fecha en formato letra
   * @param fecha Fecha del calendario
   * @returns 'L' | 'M' | 'X' | 'J' | 'V' según el día de la semana
   */
  private static obtenerDiaSemanaDesdeFecha(fecha: Date): string {
    const fechaObj = new Date(fecha);
    const numeroDia = fechaObj.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado

    // Mapeo de número de día a letra
    const mapaDias: Record<number, string> = {
      1: 'L', // Lunes
      2: 'M', // Martes
      3: 'X', // Miércoles
      4: 'J', // Jueves
      5: 'V', // Viernes
    };

    return mapaDias[numeroDia] || '';
  }
}