# Codificación de Archivos TXT para Importación de Calendarios

Este documento describe la codificación esperada y el formato de cada archivo TXT utilizado en el sistema de importación de calendarios.

## Resumen de Codificaciones

| Archivo | Codificación | Obligatorio | Descripción |
|---------|--------------|-------------|-------------|
| `excepciones.txt` | **Windows-1252 (ANSI)** | No | Eventos puntuales que reemplazan el horario regular |
| `asignaturas.txt` | **Windows-1252 (ANSI)** | Sí | Definición de asignaturas con código y nombre |
| `ubicaciones.txt` | **UTF-8** | Sí | Definición de aulas y ubicaciones |
| `horarios.txt` | **UTF-8** | Sí | Horarios de las sesiones de clase |
| `calendario.txt` | **UTF-8** | Sí | Fechas de inicio y fin de los periodos lectivos |

## Detalles por Archivo

### 1. excepciones.txt
- **Codificación**: Windows-1252 (ANSI)
- **Formato**: `Grupo;Fecha;HoraInicio-HoraFin;Aula`
- **Ejemplo**: `AIN-GR2;15/01/2024;09:00-11:00;AULA 1.5`
- **Características especiales**:
  - Es el único archivo opcional
  - Puede importarse de forma independiente mediante endpoint dedicado
  - Los eventos reemplazan completamente el horario regular para ese grupo en esa fecha
  - Se eliminan todos los eventos puntuales existentes antes de crear los nuevos

### 2. asignaturas.txt
- **Codificación**: Windows-1252 (ANSI)
- **Formato**: `Código;Nombre de la asignatura`
- **Ejemplo**: `AIN;Aplicaciones Informáticas`
- **Notas**: El código se usa como acrónimo identificador único

### 3. ubicaciones.txt
- **Codificación**: UTF-8
- **Formato**: `Código;Nombre del aula`
- **Ejemplo**: `AULA1.5;Aula 1.5`

### 4. horarios.txt
- **Codificación**: UTF-8
- **Formato**: `Grupo;DiaSemana;HoraInicio-HoraFin;Aula`
- **Ejemplo**: `AIN-GR1;L;09:00-11:00;AULA 1.5`
- **Días válidos**: L (Lunes), M (Martes), X (Miércoles), J (Jueves), V (Viernes)

### 5. calendario.txt
- **Codificación**: UTF-8
- **Formato**: `FechaInicio;FechaFin`
- **Ejemplo**: `01/09/2024;20/12/2024`
- **Notas**: Define el periodo lectivo durante el cual se generan los eventos recurrentes

## Implementación Técnica

### Detección Automática de Codificación

El sistema detecta automáticamente la codificación basándose en el nombre del archivo:

```typescript
static decodeFileContent(file: Express.Multer.File): string {
    const fileName = file.originalname;
    const ansiFiles = ['excepciones.txt', 'asignaturas.txt'];
    const utf8Files = ['ubicaciones.txt', 'horarios.txt', 'calendario.txt'];

    if (ansiFiles.includes(fileName)) {
        const iconv = require('iconv-lite');
        return iconv.decode(file.buffer, 'windows-1252');
    } else if (utf8Files.includes(fileName)) {
        return file.buffer.toString('utf-8');
    } else {
        return file.buffer.toString('utf-8');
    }
}
```

### Orden de Procesamiento

1. **calendario.txt** - Define el periodo lectivo
2. **asignaturas.txt** - Crea las asignaturas
3. **ubicaciones.txt** - Crea las aulas
4. **horarios.txt** - Genera eventos recurrentes basados en el calendario
5. **excepciones.txt** (opcional) - Reemplaza eventos puntuales específicos

## Recomendaciones

### Para Crear los Archivos

1. **Archivos ANSI (excepciones.txt, asignaturas.txt)**:
   - Usar Bloc de notas de Windows y guardar como "ANSI"
   - O usar editores que permitan especificar codificación Windows-1252
   - Evitar caracteres especiales fuera del conjunto Windows-1252

2. **Archivos UTF-8 (ubicaciones.txt, horarios.txt, calendario.txt)**:
   - Usar editores modernos que soporten UTF-8
   - Guardar como "UTF-8" (sin BOM recomendado)
   - Soporta todos los caracteres Unicode

### Validación Previa

- Verificar que los archivos tengan la extensión `.txt`
- Comprobar que no haya líneas vacías al final
- Asegurar que los separadores sean punto y coma (`;`)
- Validar el formato de fechas: `DD/MM/YYYY`
- Validar el formato de horas: `HH:MM`

### Manejo de Errores

El sistema proporciona feedback detallado sobre:
- Líneas con errores de formato
- Grupos no encontrados
- Aulas no encontradas
- Contador de eventos eliminados/creados

Ejemplo de respuesta:
```json
{
  "deletedEvents": 15,
  "createdEvents": 12,
  "errors": ["Línea 5: formato inválido"],
  "groupsNotFound": ["GRP-INVALIDO"],
  "totalLines": 20,
  "errorCount": 1
}
```

## Endpoints de Importación

### Importación Completa
- **Endpoint**: `POST /calendar/:calendarId/import`
- **Archivos**: Todos excepto excepciones.txt
- **Comportamiento**: Elimina todos los eventos existentes y crea nuevos

### Importación de Excepciones
- **Endpoint**: `POST /calendar/:calendarId/import-exceptions`
- **Archivo**: Solo excepciones.txt
- **Comportamiento**: Elimina solo eventos puntuales y crea nuevos

## Notas Adicionales

- La codificación Windows-1252 se utiliza para mantener compatibilidad con sistemas antiguos que pueden exportar estos archivos
- Se recomienda migrar a UTF-8 para todos los archivos en futuras versiones
- Los archivos excepciones.txt y asignaturas.txt probablemente usan Windows-1252 porque pueden contener caracteres acentuados del español y fueron diseñados para ser editados en Bloc de notas de Windows
