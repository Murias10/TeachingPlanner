/**
 * Servicio para formatear datos de calendario y eventos
 */
export class CalendarFormattingService {
  /**
   * Calcula la duración en horas entre dos tiempos (HH:MM)
   */
  static calculateDuration(startTime: string, endTime: string): number {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    return durationMinutes / 60;
  }

  /**
   * Formatea datos de evento para respuestas
   * Transforma grupos y aulas en formato de respuesta JSON
   */
  static formatEventData(
    groups: any[],
    classrooms: any[],
    request: any,
    startTime: string,
    endTime: string,
    date: string
  ) {
    return {
      duration: this.calculateDuration(startTime, endTime),
      subject: groups[0]?.subject
        ? {
            id: groups[0].subject.id,
            acronym: groups[0].subject.acronym,
            name: groups[0].subject.name
          }
        : null,
      groups: groups.map(group => ({
        id: group.id,
        number: group.number,
        type: group.type,
        language: group.language
      })),
      classrooms: classrooms.map(classroom => ({
        id: classroom.id,
        code: classroom.code,
        gisUrl: classroom.gisUrl
      })),
      cancelled: false,
      isPending: true,
      requestId: request.id,
      teacherId: request.teacherId,
      startTime,
      endTime,
      date
    };
  }
}
