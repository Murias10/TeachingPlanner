# Capítulo 4 — SYSTEM REQUIREMENTS (REQUISITOS DEL SISTEMA)

---

## 4.1 Functional Requirements

### 4.1.1 System Functions

Los requisitos funcionales del sistema se expresan mediante una lista jerárquica detallada, organizada por módulos funcionales. Cada módulo referencia los requisitos de usuario correspondientes del Capítulo 3. Las operaciones CRUD simples se enumeran sin escenario detallado; los flujos complejos (autenticación, detección de conflictos, solicitudes de cambio, sincronización) se desarrollan con sus entradas, flujo, validaciones y casos de error.

---

#### RF-AUTH — Autenticación y acceso (→ UR1)

**RF-AUTH-01: Inicio de sesión**

RF-AUTH-01.1. El sistema solicitará al usuario su dirección de correo electrónico y contraseña.

RF-AUTH-01.2. El sistema verificará que el email existe en el sistema y que la cuenta está activada.

RF-AUTH-01.3. El sistema comparará la contraseña introducida con el hash almacenado mediante bcrypt.

RF-AUTH-01.4. Si las credenciales son correctas, el sistema generará un token JWT con los campos `userId`, `email` y `role`, con una validez de 1 hora, y lo devolverá al cliente.

- RF-AUTH-01.4.1. El cliente almacenará el token y lo enviará en la cabecera `Authorization` de todas las peticiones posteriores.

RF-AUTH-01.5. El sistema redirigirá al usuario a la pantalla principal según su rol:

- RF-AUTH-01.5.1. `ROLE_ADMIN` → panel de administración.
- RF-AUTH-01.5.2. `ROLE_PROFESSOR` → vista de docente.

**Casos de error:**
- Email no registrado o cuenta no activada → mensaje: *"Credenciales inválidas"* (sin revelar cuál de los dos falló).
- Contraseña incorrecta → mismo mensaje genérico.

---

**RF-AUTH-02: Activación de cuenta**

RF-AUTH-02.1. El sistema enviará al nuevo usuario un email con un enlace de activación único con validez de 24 horas.

RF-AUTH-02.2. Al acceder al enlace, el sistema solicitará al usuario que establezca su contraseña personal, con confirmación.

RF-AUTH-02.3. El sistema validará que la contraseña cumple los siguientes requisitos: mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un carácter especial.

RF-AUTH-02.4. El sistema almacenará la contraseña cifrada con bcrypt (factor 10), marcará la cuenta como activa e invalidará el token de activación.

**Casos de error:**
- Token expirado → mensaje: *"El enlace ha expirado. Contacte con su administrador."*
- Contraseñas no coincidentes → mensaje: *"Las contraseñas no coinciden."*

---

**RF-AUTH-03: Recuperación de contraseña (flujo OTP)**

El proceso de recuperación se realiza en tres pasos:

RF-AUTH-03.1. **Paso 1 — Solicitud de código.** El usuario introduce su email. Si existe y está activado, el sistema genera un código OTP de 6 dígitos con validez de 15 minutos y lo envía por correo. El sistema aplica un cooldown de 60 segundos entre solicitudes del mismo usuario. La respuesta es siempre genérica (no revela si el email existe).

RF-AUTH-03.2. **Paso 2 — Verificación del código.** El usuario introduce el código OTP. Si es válido y no ha expirado, el sistema devuelve un `resetToken` de un solo uso.

RF-AUTH-03.3. **Paso 3 — Nueva contraseña.** El usuario introduce y confirma la nueva contraseña usando el `resetToken`. El sistema valida los requisitos de complejidad, almacena el hash bcrypt, invalida el `resetToken` y redirige al formulario de login.

**Casos de error:**
- Código expirado → mensaje: *"El código ha expirado. Solicite uno nuevo."*
- Código incorrecto → mensaje: *"Código de verificación inválido."*

---

**RF-AUTH-04: Cierre de sesión**

RF-AUTH-04.1. El sistema eliminará el token JWT del almacenamiento del cliente.

RF-AUTH-04.2. El usuario será redirigido a la pantalla de inicio.

---

**RF-AUTH-05: Conexión con Google OAuth (para sincronización de calendario)**

RF-AUTH-05.1. Desde la página de configuración, el usuario autenticado podrá iniciar el flujo OAuth 2.0 con Google.

RF-AUTH-05.2. Tras el consentimiento del usuario, el sistema intercambiará el código de autorización por un `access_token` y un `refresh_token`, que almacenará cifrados en la base de datos (AES-256).

RF-AUTH-05.3. El sistema mostrará la cuenta de Google vinculada y habilitará las opciones de sincronización de calendario.

RF-AUTH-05.4. El usuario podrá desconectar su cuenta de Google desde la misma página; el sistema limpiará los tokens almacenados y los Google Calendars de aulas asociados a ese usuario.

---

#### RF-USER — Gestión de usuarios (→ UR2)

**RF-USER-01: Crear usuario** *(solo administrador)*

RF-USER-01.1. El administrador proporcionará nombre, apellidos, email y rol (`ROLE_ADMIN` o `ROLE_PROFESSOR`).

RF-USER-01.2. El sistema validará que el email tiene formato válido y no está ya registrado.

RF-USER-01.3. El sistema creará la cuenta con estado inactivo y enviará el email de activación (RF-AUTH-02).

**Casos de error:**
- Email duplicado → *"El email ya está registrado en el sistema."*

---

**RF-USER-02: Listar usuarios** *(solo administrador)*

RF-USER-02.1. El sistema mostrará la lista de usuarios con columnas: nombre completo, email, rol, estado (activo/inactivo) y fecha de registro.

RF-USER-02.2. El sistema permitirá filtrar por rol, estado y búsqueda por texto; ordenar por cualquier columna; y paginar los resultados.

---

**RF-USER-03: Editar usuario** *(solo administrador)*

RF-USER-03.1. El administrador podrá modificar nombre, apellidos, rol y estado de un usuario.

RF-USER-03.2. El sistema impedirá desactivar o cambiar el rol del último administrador activo del sistema.

RF-USER-03.3. El sistema impedirá que un administrador desactive su propia cuenta.

---

**RF-USER-04: Eliminar usuario** *(solo administrador)*

RF-USER-04.1. El sistema solicitará confirmación explícita antes de eliminar.

RF-USER-04.2. El sistema impedirá eliminar al último administrador activo o la propia cuenta del administrador que realiza la acción.

---

**RF-USER-05: Importar usuarios desde Excel** *(solo administrador)*

RF-USER-05.1. El administrador cargará un fichero `.xlsx` con las columnas: nombre, primer apellido, segundo apellido, email, rol y usuario UniOvi (opcional).

RF-USER-05.2. El sistema validará cada fila (email único, rol válido, campos obligatorios completos) y creará los usuarios válidos con estado inactivo.

RF-USER-05.3. El sistema enviará el email de activación a cada usuario creado correctamente y mostrará un informe con los errores encontrados fila a fila.

---

#### RF-STRUCT — Gestión de la estructura académica (→ UR3)

Las operaciones de esta sección son CRUD estándar. Se detallan únicamente las restricciones relevantes.

**RF-STRUCT-01: Titulaciones**

RF-STRUCT-01.1. Crear, listar, editar y eliminar titulaciones con nombre y acrónimo únicos.

RF-STRUCT-01.2. Una titulación no podrá eliminarse si tiene cursos académicos asociados.

---

**RF-STRUCT-02: Cursos académicos**

RF-STRUCT-02.1. Crear, listar, editar y eliminar cursos académicos (año de inicio, año de fin) asociados a una titulación.

RF-STRUCT-02.2. Cada curso tendrá un estado: `PLANIFICADO`, `ACTIVO` o `FINALIZADO`.

RF-STRUCT-02.3. La combinación (titulación, año de inicio, año de fin) debe ser única.

RF-STRUCT-02.4. Un curso no podrá eliminarse si tiene calendarios asociados.

---

**RF-STRUCT-03: Asignaturas**

RF-STRUCT-03.1. Crear, listar, editar y eliminar asignaturas con nombre, acrónimo, código SIES, curso (1–4) y semestre (1 o 2), asociadas a una titulación.

RF-STRUCT-03.2. La combinación (titulación, acrónimo) debe ser única.

RF-STRUCT-03.3. El código SIES no es modificable una vez creada la asignatura.

RF-STRUCT-03.4. Una asignatura no podrá eliminarse si tiene grupos asociados.

---

**RF-STRUCT-04: Grupos**

RF-STRUCT-04.1. Crear, listar, editar y eliminar grupos con número, tipo (`T`, `S`, `L`, `TG`) e idioma (`ES`, `EN`, `AS`), asociados a una asignatura.

RF-STRUCT-04.2. La combinación (asignatura, número, tipo, idioma) dentro del mismo calendario debe ser única.

RF-STRUCT-04.3. Cada grupo tiene un campo de horas planificadas (`planifiedHours`) que representa el presupuesto de horas lectivas del semestre.

---

**RF-STRUCT-05: Aulas**

RF-STRUCT-05.1. Crear, listar, editar y eliminar aulas con código único y URL GIS.

RF-STRUCT-05.2. Un aula no podrá eliminarse si tiene eventos asociados, salvo que se confirme la eliminación forzada.

---

#### RF-CAL — Gestión de calendarios académicos (→ UR4)

**RF-CAL-01: Crear calendario**

RF-CAL-01.1. El administrador proporcionará el curso académico, el semestre (1 o 2), la fecha de inicio y la fecha de fin.

RF-CAL-01.2. El sistema validará que la combinación (curso, semestre) es única y que la fecha de fin es posterior a la de inicio.

RF-CAL-01.3. El sistema generará automáticamente un registro `Day` por cada día laborable (lunes a viernes) comprendido en el rango de fechas, marcados inicialmente como lectivos.

---

**RF-CAL-02: Gestionar días lectivos y festivos**

RF-CAL-02.1. El administrador podrá marcar o desmarcar individualmente cada día del calendario como festivo o no lectivo.

---

**RF-CAL-03: Duplicar calendario**

RF-CAL-03.1. El administrador seleccionará un calendario origen y un curso/semestre destino con nuevas fechas.

RF-CAL-03.2. El sistema creará el nuevo calendario copiando la estructura de días y, opcionalmente, los eventos periódicos del calendario origen ajustados a las nuevas fechas.

RF-CAL-03.3. La combinación (curso destino, semestre) no debe existir previamente.

---

**RF-CAL-04: Eliminar calendario**

RF-CAL-04.1. El sistema mostrará un resumen de los datos que se eliminarán (días, eventos periódicos, eventos puntuales) y solicitará confirmación explícita antes de proceder.

RF-CAL-04.2. La eliminación es en cascada: se eliminan todos los días, eventos y solicitudes asociadas al calendario.

---

#### RF-EVENT — Gestión de eventos (→ UR5)

**RF-EVENT-01: Crear evento periódico**

RF-EVENT-01.1. El administrador seleccionará uno o varios grupos, opcionalmente una o varias aulas, hora de inicio, hora de fin, y uno o varios días de la semana (L, M, X, J, V).

RF-EVENT-01.2. El tipo de evento puede ser: `Class` (clase), `Evaluation` (evaluación), `Review` (revisión), `Others` (otros) o `Independent` (reserva independiente sin asignatura).

RF-EVENT-01.3. Antes de guardar, el sistema ejecutará la detección de conflictos (RF-EVENT-03).

RF-EVENT-01.4. Si no hay conflictos, el sistema creará el evento periódico y establecerá las relaciones con los grupos y aulas seleccionados.

---

**RF-EVENT-02: Crear evento puntual**

RF-EVENT-02.1. El administrador seleccionará un día específico del calendario, grupos, aulas opcionales, hora de inicio y hora de fin.

RF-EVENT-02.2. El sistema ejecutará la detección de conflictos para esa fecha y franja horaria concreta (RF-EVENT-03).

RF-EVENT-02.3. Si el día está marcado como festivo, el sistema mostrará una advertencia antes de confirmar.

---

**RF-EVENT-03: Detección de conflictos de horario**

Este es un requisito transversal que se aplica antes de crear o modificar cualquier evento.

RF-EVENT-03.1. El sistema determinará el conjunto de días afectados: para eventos periódicos, todos los días lectivos del calendario con el `dayCharacter` correspondiente al día de la semana seleccionado; para eventos puntuales, el día específico.

RF-EVENT-03.2. Para cada día afectado, el sistema comprobará si existe otro evento activo (no cancelado) que:

- RF-EVENT-03.2.1. Comparta alguno de los grupos seleccionados, **y**
- RF-EVENT-03.2.2. Se solape en horario: `hora_inicio_A < hora_fin_B AND hora_fin_A > hora_inicio_B`.

RF-EVENT-03.3. El sistema comprobará igualmente si existe otro evento que comparta alguna de las aulas seleccionadas en las mismas condiciones de solape.

RF-EVENT-03.4. Si se detecta al menos un conflicto, el sistema bloqueará la operación y mostrará un mensaje detallado indicando qué evento y qué recurso (grupo o aula) genera el conflicto.

RF-EVENT-03.5. Si no se detecta ningún conflicto, la operación continuará.

**Criterio de aceptación:** tiempo de validación inferior a 500 ms para calendarios con hasta 500 eventos.

---

**RF-EVENT-04: Editar evento periódico**

RF-EVENT-04.1. El administrador podrá modificar grupos, aulas, horario y días de la semana de un evento periódico existente.

RF-EVENT-04.2. El sistema ejecutará la detección de conflictos con los nuevos parámetros antes de guardar.

---

**RF-EVENT-05: Cancelar evento puntual**

RF-EVENT-05.1. El administrador podrá marcar un evento puntual como cancelado, manteniendo el registro histórico.

RF-EVENT-05.2. Los eventos cancelados se mostrarán visualmente diferenciados (tachado, color atenuado) y no contarán en las estadísticas de ocupación.

---

**RF-EVENT-06: Eliminar evento**

RF-EVENT-06.1. El sistema solicitará confirmación antes de eliminar un evento periódico, informando de que se eliminarán todas sus ocurrencias.

RF-EVENT-06.2. Los eventos puntuales cancelados permanecen en el historial; solo los no cancelados pueden eliminarse directamente.

---

#### RF-VIEW — Consulta de horarios (→ UR6)

**RF-VIEW-01: Vista pública de horarios**

RF-VIEW-01.1. La consulta de horarios está disponible sin autenticación. Los usuarios no autenticados solo pueden acceder a calendarios de cursos en estado `ACTIVO`.

RF-VIEW-01.2. El sistema mostrará los eventos del calendario seleccionado en una vista de calendario con cinco modos: semana, semana laboral, día, mes y agenda.

RF-VIEW-01.3. El sistema expandirá dinámicamente los eventos periódicos a sus ocurrencias concretas en cada día lectivo del calendario, respetando el sistema de caracteres de día.

RF-VIEW-01.4. El sistema permitirá filtrar los eventos visibles por: titulación, asignatura, tipo de grupo, grupo concreto, aula e idioma.

RF-VIEW-01.5. Los eventos cancelados se mostrarán visualmente diferenciados del resto.

RF-VIEW-01.6. Al hacer clic sobre un evento, el sistema mostrará un panel lateral con los detalles: asignatura, grupo, tipo, aula, horario y comentarios.

---

#### RF-REQ — Solicitudes de cambio (→ UR7)

El sistema gestiona cuatro tipos de solicitud de cambio, creadas por docentes y revisadas por administradores.

**RF-REQ-01: Crear solicitud** *(solo docente)*

RF-REQ-01.1. El docente podrá crear solicitudes de cuatro tipos:

- RF-REQ-01.1.1. `CREATE` — propuesta de creación de un nuevo evento (sin evento original asociado).
- RF-REQ-01.1.2. `EDIT` — propuesta de modificación de un evento existente (requiere `originalEventId`).
- RF-REQ-01.1.3. `CANCEL` — propuesta de cancelación de una ocurrencia concreta de un evento existente (requiere `originalEventId`).
- RF-REQ-01.1.4. `REPLACE` — propuesta de cancelación de una ocurrencia y creación de una nueva en su lugar (requiere `originalEventId`).

RF-REQ-01.2. El sistema mostrará al docente si los datos propuestos generan un conflicto de horario antes de enviar la solicitud (mismo algoritmo que RF-EVENT-03), a título informativo; el docente puede enviar igualmente la solicitud.

RF-REQ-01.3. La solicitud quedará en estado `PENDING` y el sistema enviará una notificación por email a todos los administradores.

RF-REQ-01.4. El docente podrá eliminar sus propias solicitudes en estado `PENDING`.

---

**RF-REQ-02: Listar solicitudes**

RF-REQ-02.1. Los administradores verán todas las solicitudes del sistema, filtradas por estado (`PENDING`, `APPROVED`, `REJECTED`) y por calendario.

RF-REQ-02.2. Los docentes verán únicamente sus propias solicitudes con el estado actualizado y los comentarios del revisor.

---

**RF-REQ-03: Aprobar solicitud** *(solo administrador)*

RF-REQ-03.1. El administrador revisará los detalles de la solicitud; el sistema mostrará si los datos propuestos generan conflictos con el estado actual del calendario.

RF-REQ-03.2. Al aprobar, el sistema ejecutará automáticamente la acción correspondiente al tipo de solicitud:

- `CREATE` → crea el evento con los datos de `eventData`.
- `EDIT` → modifica el evento original con los datos de `eventData`.
- `CANCEL` → marca la ocurrencia indicada como cancelada.
- `REPLACE` → cancela la ocurrencia original y crea el nuevo evento puntual.

RF-REQ-03.3. La solicitud pasa a estado `APPROVED` con registro del revisor y la fecha.

RF-REQ-03.4. El sistema envía una notificación por email al docente solicitante.

---

**RF-REQ-04: Rechazar solicitud** *(solo administrador)*

RF-REQ-04.1. Al rechazar, el administrador deberá incluir un comentario con la justificación (campo obligatorio).

RF-REQ-04.2. La solicitud pasa a estado `REJECTED` con registro del revisor, la fecha y el comentario.

RF-REQ-04.3. El sistema envía una notificación por email al docente con el motivo del rechazo.

---

#### RF-SYNC — Sincronización con Google Calendar (→ UR8)

**RF-SYNC-01: Inicializar entradas de sincronización**

RF-SYNC-01.1. Al conectar la cuenta de Google (RF-AUTH-05), el sistema creará automáticamente un registro `CalendarSync` en estado `IDLE` por cada calendario académico activo existente, permitiendo al administrador gestionar la sincronización de todos ellos desde una única pantalla.

---

**RF-SYNC-02: Sincronizar calendario**

RF-SYNC-02.1. El administrador lanzará la sincronización de un calendario desde la página de sincronización (`/calendar-sync`).

RF-SYNC-02.2. El sistema identificará todas las aulas con eventos en el calendario. Por cada aula nueva, creará un Google Calendar con el código del aula como nombre.

RF-SYNC-02.3. El sistema creará los eventos del calendario en el Google Calendar del aula correspondiente, con título (asignatura + grupo), fecha, hora y aula como ubicación.

RF-SYNC-02.4. El sistema respetará el límite de cuota de la API de Google Calendar (400 operaciones por minuto a nivel de proyecto). Si se alcanza el límite, pausará las llamadas hasta que el ventana de tiempo se renueve.

RF-SYNC-02.5. El sistema actualizará el progreso en tiempo real: número de calendarios procesados sobre el total, y operación actual en curso.

RF-SYNC-02.6. El estado de la sincronización pasará por los valores: `IDLE` → `SYNCING` → `SUCCESS` o `ERROR`. En caso de error, se almacenará el mensaje de error para diagnóstico desde la interfaz.

---

**RF-SYNC-03: Renovar tokens automáticamente**

RF-SYNC-03.1. Antes de cada sincronización, el sistema verificará la validez del `access_token` almacenado. Si ha expirado o está próximo a expirar, lo renovará automáticamente usando el `refresh_token` antes de iniciar las llamadas a la API.

---

**RF-SYNC-04: Eliminar sincronización**

RF-SYNC-04.1. El administrador podrá eliminar la sincronización de un calendario individual.

RF-SYNC-04.2. El sistema eliminará los eventos del calendario académico en cada Google Calendar de aula afectado. Si un Google Calendar de aula queda vacío, el sistema lo eliminará también de Google.

RF-SYNC-04.3. El sistema eliminará el registro `CalendarSync` correspondiente. El estado `DELETING` persiste en base de datos durante el proceso para que recargas de página no pierdan el progreso.

---

#### RF-EXPORT — Interoperabilidad con el sistema heredado (→ UR9)

**RF-EXPORT-01: Exportar calendario en formato ZIP**

RF-EXPORT-01.1. El administrador podrá descargar un archivo ZIP con los cinco ficheros `.txt` del sistema heredado, generados a partir del estado actual del calendario:

- `ubicaciones.txt` — listado de aulas en formato `CÓDIGO:URL_GIS`, ordenado por código.
- `asignaturas.txt` — catálogo de asignaturas con grupos por tipo e idioma, en formato de 12 campos separados por `:`.
- `calendario.txt` — días lectivos con sus caracteres de día correspondientes.

RF-EXPORT-01.2. Solo se incluyen en la exportación los eventos de tipo `Class` (tipo NORMAL); los eventos de tipo `Evaluation`, `Review`, `Others` e `Independent` se excluyen.

RF-EXPORT-01.3. Todos los ficheros se generan con codificación UTF-8.

---

**RF-EXPORT-02: Importar calendario desde ficheros `.txt`**

RF-EXPORT-02.1. El administrador cargará los ficheros `.txt` del sistema heredado.

RF-EXPORT-02.2. El sistema parseará y validará el contenido antes de mostrar una vista previa de los datos a importar.

RF-EXPORT-02.3. Tras la confirmación del administrador, el sistema creará las entidades correspondientes en el calendario destino y mostrará un informe de errores encontrados.

---

**RF-EXPORT-03: Exportar CSV para Google Calendar**

RF-EXPORT-03.1. El sistema generará un fichero CSV con el formato de importación de Google Calendar a partir del horario actual del semestre seleccionado, para uso de los estudiantes.

---

#### RF-AUDIT — Auditoría y trazabilidad (→ UR10)

**RF-AUDIT-01: Registro automático de auditoría en entidades**

RF-AUDIT-01.1. Todas las entidades del sistema heredan de la clase abstracta `AuditedEntity`, que añade automáticamente los campos: `createdAt` (timestamp de creación), `createdBy` (email del usuario creador), `updatedAt` (timestamp de última modificación) y `updatedBy` (email del último usuario que modificó).

RF-AUDIT-01.2. Estos campos se establecen y actualizan automáticamente mediante middleware que extrae el email del token JWT en cada operación de escritura.

RF-AUDIT-01.3. Las entidades auditadas son: `Degree`, `Course`, `Calendar`, `Day`, `Subject`, `Group`, `Classroom`, `PeriodicEvent`, `PuntualEvent`, `EventRequest` y `CalendarSync`.

---

### 4.1.2 Domain Data Model

El modelo de datos del sistema se organiza en cuatro grupos de entidades: estructura académica, eventos, solicitudes de cambio e integración con Google Calendar. Todas las entidades heredan de `AuditedEntity`.

**Figura 4.1 — Diagrama de clases del dominio**

```mermaid
classDiagram
    class AuditedEntity {
        <<abstract>>
        +UUID id
        +DateTime createdAt
        +String createdBy
        +DateTime updatedAt
        +String updatedBy
    }

    class Degree {
        +String name
        +String acronym
    }

    class Course {
        +Int startYear
        +Int endYear
        +CourseState status
    }

    class Calendar {
        +Date start
        +Date end
        +Int semester
        +String charactersInUse
    }

    class Day {
        +Date date
        +String dayCharacter
    }

    class Subject {
        +String acronym
        +String name
        +Int year
        +Int semester
        +String siesCode
    }

    class Group {
        +Int number
        +GroupType type
        +Language language
        +Int planifiedHours
    }

    class Classroom {
        +String code
        +String gisUrl
    }

    class PeriodicEvent {
        +Time startTime
        +Time endTime
        +WeekDay weekDay
        +String eventCharacter
        +EventType eventType
    }

    class PuntualEvent {
        +Time startTime
        +Time endTime
        +Boolean cancelled
        +String comment
        +EventType eventType
        +UUID replacementEventId
        +UUID periodicEventSourceId
    }

    class EventRequest {
        +RequestType requestType
        +EventType eventType
        +RequestStatus status
        +UUID originalEventId
        +JSON eventData
        +String reviewedBy
        +String comments
    }

    class CalendarSync {
        +SyncStatus syncStatus
        +DateTime lastSyncAt
        +String errorMessage
    }

    class GoogleClassroomCalendar {
        +String googleCalendarId
    }

    class ApiQuotaCounter {
        +Int minuteCount
        +Int dayCount
    }

    AuditedEntity <|-- Degree
    AuditedEntity <|-- Course
    AuditedEntity <|-- Calendar
    AuditedEntity <|-- Day
    AuditedEntity <|-- Subject
    AuditedEntity <|-- Group
    AuditedEntity <|-- Classroom
    AuditedEntity <|-- PeriodicEvent
    AuditedEntity <|-- PuntualEvent
    AuditedEntity <|-- EventRequest
    AuditedEntity <|-- CalendarSync

    Degree "1" --> "N" Course
    Course "1" --> "N" Calendar
    Calendar "1" --> "N" Day
    Calendar "1" --> "N" Subject
    Calendar "1" --> "N" PeriodicEvent
    Day "1" --> "N" PuntualEvent
    Subject "1" --> "N" Group
    Group "N" --> "M" PeriodicEvent : PERIODIC_EVENTS_GROUPS
    Group "N" --> "M" PuntualEvent : PUNTUAL_EVENTS_GROUPS
    Classroom "N" --> "M" PeriodicEvent : PERIODIC_EVENTS_CLASSROOMS
    Classroom "N" --> "M" PuntualEvent : PUNTUAL_EVENTS_CLASSROOMS
    PuntualEvent --> PuntualEvent : replacementEventId
    PuntualEvent --> PeriodicEvent : periodicEventSourceId
    Calendar "1" --> "N" EventRequest
    CalendarSync --> Calendar
    GoogleClassroomCalendar --> Calendar
    GoogleClassroomCalendar --> Classroom
```

**Enumeraciones:**

| Enumeración | Valores |
|---|---|
| `CourseState` | `PLANIFICADO`, `ACTIVO`, `FINALIZADO` |
| `GroupType` | `T` (Teoría), `S` (Seminario), `L` (Laboratorio), `TG` (Tutoría Grupal) |
| `Language` | `ES`, `EN`, `AS` |
| `EventType` | `Class`, `Evaluation`, `Review`, `Others`, `Independent` |
| `WeekDay` | `L`, `M`, `X`, `J`, `V` |
| `RequestType` | `CREATE`, `EDIT`, `CANCEL`, `REPLACE` |
| `RequestStatus` | `PENDING`, `APPROVED`, `REJECTED` |
| `SyncStatus` | `IDLE`, `SYNCING`, `SUCCESS`, `ERROR`, `DELETING` |

**Relaciones destacadas:**

- `PuntualEvent.replacementEventId` — autorreferencia: apunta al evento puntual que reemplaza a este (flujo REPLACE de solicitudes de cambio).
- `PuntualEvent.periodicEventSourceId` — referencia al `PeriodicEvent` del que deriva esta cancelación puntual, permitiendo cancelar selectivamente una ocurrencia sin afectar al resto de la serie.
- `GoogleClassroomCalendar` — almacena el mapeo entre cada aula y su Google Calendar ID, permitiendo añadir y eliminar eventos en el calendario correcto durante la sincronización.
- `ApiQuotaCounter` — contador global (no por usuario) del consumo de cuota de la API de Google Calendar, reflejando cómo Google aplica los límites a nivel de proyecto.

---

### 4.1.3 User Interface

Esta sección describe la estructura de navegación de la aplicación y las pantallas principales. Las capturas de pantalla se presentan como figuras sugeridas.

#### Estructura de navegación

La aplicación tiene cuatro rutas públicas sin layout de aplicación y el resto organizado bajo un layout común con barra lateral. El contenido visible en la barra lateral varía según el rol del usuario.

**Figura 4.2 — Mapa de navegación de la aplicación**

```
Rutas públicas (sin barra lateral):
  /              → Pantalla de bienvenida
  /login         → Formulario de inicio de sesión
  /forgot-password → Recuperación de contraseña (3 pasos: email → OTP → nueva contraseña)
  /activate      → Activación de cuenta

Rutas con barra lateral (AppLayout):
  Sección "Main" — visible para todos los perfiles:
    /home                                                        → Calendario global
    /degrees                                                     → Lista de titulaciones
    /degrees/:acronym/courses                                    → Cursos de una titulación
    /degrees/:acronym/courses/:startYear/:endYear/semester/:n/calendar   → Vista de calendario
    /degrees/:acronym/courses/:startYear/:endYear/semester/:n/subjects   → Asignaturas
    /degrees/:acronym/courses/:startYear/:endYear/semester/:n/groups     → Grupos
    /degrees/:acronym/courses/:startYear/:endYear/semester/:n/solicitudes → Solicitudes (admin)
    /classrooms                                                  → Lista de aulas

  Sección "System" — solo usuarios autenticados:
    Administrador:
      /users        → Gestión de usuarios
      /solicitudes  → Panel global de solicitudes de cambio
    Docente:
      /my-requests  → Mis solicitudes de cambio

  Área de usuario (accesible desde el pie de la barra lateral):
    /settings       → Perfil y conexión con Google Calendar
    /calendar-sync  → Gestión de sincronización con Google Calendar
```

La barra lateral incluye un sistema de breadcrumbs que muestra la ruta de navegación actual y permite saltar a cualquier nivel anterior con un clic. Los usuarios invitados (sin autenticación) solo pueden acceder a calendarios de cursos en estado `ACTIVO`.

#### Pantallas principales

> 📷 **Figura 4.3 — Pantalla de bienvenida** (`/`): tarjeta central con el título de la aplicación y dos botones: *"Continuar como invitado"* e *"Iniciar sesión"*.

> 📷 **Figura 4.4 — Formulario de inicio de sesión** (`/login`): campos de email y contraseña, botón *"Iniciar sesión"* y enlace *"¿Olvidó su contraseña?"*.

> 📷 **Figura 4.5 — Vista de calendario semanal** (`/home` o ruta de semestre): selector de calendario en la parte superior; barra de filtros lateral (titulación, asignatura, tipo de grupo, grupo, aula, idioma); cinco botones de vista (Semana, Semana laboral, Día, Mes, Agenda); navegación temporal (anterior, hoy, siguiente); eventos coloreados por tipo sobre la cuadrícula horaria; panel de detalles lateral al hacer clic sobre un evento.

> 📷 **Figura 4.6 — Dialog de detección de conflicto**: mensaje de advertencia en el momento de intentar crear o editar un evento que solapa en horario con otro evento del mismo grupo o aula, indicando el nombre del evento en conflicto y la franja afectada.

> 📷 **Figura 4.7 — Panel de solicitudes de cambio (administrador)** (`/solicitudes`): tabla de solicitudes con columnas de estado, docente solicitante, tipo de solicitud y fecha; filtros por estado (pendiente, aprobado, rechazado); botones de aprobar y rechazar por fila; indicador visual destacado para las solicitudes en estado `PENDING`.

> 📷 **Figura 4.8 — Dialog de nueva solicitud (docente)**: formulario para crear una solicitud de cambio con selector de tipo (`CREATE`, `EDIT`, `CANCEL`, `REPLACE`), selector de evento origen (para tipos que requieren `originalEventId`), campos de fecha, hora, asignatura, grupo y aula, y campo de comentario. Indicador de conflictos en tiempo real antes de enviar.

> 📷 **Figura 4.9 — Página de sincronización con Google Calendar** (`/calendar-sync`): tabla con una fila por cada calendario académico activo, columnas de estado (`IDLE`, `SYNCING`, `SUCCESS`, `ERROR`, `DELETING`), barra de progreso durante la sincronización (calendarios procesados / total), botón *"Sincronizar"* y botón de eliminar sincronización. Widget de cuota de API con el consumo acumulado del proyecto.

> 📷 **Figura 4.10 — Vista en dispositivo móvil**: barra lateral colapsada en menú hamburguesa; vista de calendario en modo agenda (más adecuado para pantallas estrechas); panel de filtros ocultable.

#### Convenios de diálogo

- Los campos obligatorios en formularios se marcan con un asterisco rojo (`*`) y el componente `RequiredLabel`.
- Los errores de validación se muestran en tiempo real bajo el campo afectado, sin esperar al envío del formulario.
- Las acciones destructivas (eliminar entidades, eliminar sincronización) requieren un diálogo de confirmación explícita antes de ejecutarse.
- Las operaciones largas (sincronización, importación) muestran indicadores de progreso y no bloquean la navegación.
- La interfaz está completamente internacionalizada en español e inglés mediante un sistema de internacionalización (i18n).

---

## 4.2 Non-Functional Requirements

### 4.2.1 Rendimiento

| ID | Operación | Tiempo máximo | Condiciones |
|---|---|---|---|
| RNF-PERF-01 | Login | 1 segundo | 95% de los casos |
| RNF-PERF-02 | Listado de entidades (usuarios, asignaturas, etc.) | 2 segundos | Hasta 1.000 registros |
| RNF-PERF-03 | Crear o editar entidad | 1 segundo | Operación simple |
| RNF-PERF-04 | Crear evento con validación de conflictos | 3 segundos | Calendario con hasta 500 eventos |
| RNF-PERF-05 | Cargar vista de horarios | 3 segundos | Carga inicial del calendario |
| RNF-PERF-06 | Duplicar calendario | 10 segundos | Hasta 200 eventos |
| RNF-PERF-07 | Sincronización con Google Calendar | 2 minutos | Hasta 100 eventos |
| RNF-PERF-08 | Exportar calendario a ZIP | 10 segundos | Hasta 200 eventos |

### 4.2.2 Escalabilidad

- El sistema soportará al menos **200 usuarios concurrentes** en operaciones normales y **500 en consultas públicas** de solo lectura.
- El volumen de datos estimado a 5 años: hasta 500 asignaturas, 2.000 grupos, 10.000 eventos periódicos y 5.000 eventos puntuales.
- La arquitectura de microservicios permite escalar el `planner_service` (el más exigente computacionalmente) de forma independiente sin replicar los servicios de autenticación y usuarios.

### 4.2.3 Disponibilidad

- **Objetivo de disponibilidad:** 99,5% de uptime anual (máximo 43,8 horas de caída por año).
- Los mantenimientos programados se realizarán exclusivamente en períodos no lectivos con al menos 7 días de preaviso.
- **RTO** (Recovery Time Objective): 4 horas. **RPO** (Recovery Point Objective): 24 horas.

### 4.2.4 Seguridad

Las medidas de seguridad implementadas se organizan en capas:

**Transporte:** HTTPS obligatorio en toda la comunicación cliente-servidor. El servidor web (Caddy) gestiona TLS con el certificado institucional GEANT proporcionado por el SUTIC, con redirección automática HTTP → HTTPS y HSTS habilitado.

**Autenticación:** tokens JWT firmados con HS256, expiración de 1 hora. El secreto de firma se configura mediante variable de entorno (`JWT_SECRET`); no existe valor por defecto en el código. Los tokens no contienen información sensible: solo `userId`, `email` y `role`.

**Credenciales:** contraseñas almacenadas con bcrypt (factor 10). Nunca se almacenan ni transmiten en texto plano. Los campos de contraseña permiten copiar y pegar (compatible con gestores de contraseñas).

**Tokens de terceros:** los `access_token` y `refresh_token` de Google OAuth se almacenan cifrados en la base de datos (AES-256 mediante la clave `ENCRYPTION_KEY` en variables de entorno).

**Control de acceso:** RBAC con dos roles (`ADMIN`, `PROFESSOR`). El gateway aplica CORS con lista blanca de orígenes explícita (sin wildcard `*`). La verificación del JWT se realiza en cada servicio de forma independiente.

**Secretos:** ninguna contraseña, API key ni secreto está hardcodeado en el código fuente. Todos se gestionan mediante variables de entorno (`.env`) y GitHub Secrets en el pipeline de CI/CD.

**Deudas técnicas de seguridad conocidas:**

- *Sistema de autenticación propio:* el sistema gestiona credenciales propias (email + contraseña) en lugar de delegar en un proveedor externo. Esto constituye una limitación de seguridad reconocida, asumida por falta de disponibilidad del SSO institucional en el momento del desarrollo (ver §3.3.1). La integración con el SSO de la Universidad de Oviedo (Microsoft/Azure AD) queda documentada como trabajo futuro en el capítulo 8.
- *Sin WAF:* el sistema está desplegado detrás de la infraestructura universitaria sin WAF dedicado. Se documenta como mejora futura.
- *Sin rate limiting en API:* no se ha implementado limitación de tasa en los endpoints de la API en v1.0. Se documenta como mejora futura.
- *SonarQube no integrado en pipeline:* SonarQube está configurado y puede ejecutarse manualmente, pero no forma parte del pipeline CI/CD automatizado en v1.0. Se documenta como mejora futura.

### 4.2.5 Usabilidad y accesibilidad

- La interfaz cumplirá con las pautas **WCAG 2.1 nivel AA**: contraste de color mínimo 4,5:1 para texto, navegación completa por teclado, etiquetas ARIA en elementos interactivos, y textos alternativos en imágenes.
- Los campos obligatorios se marcan visualmente con el componente `RequiredLabel`. Los mensajes de error son específicos y orientados a la acción.
- La interfaz es **responsive**: diseño adaptativo para móvil (<768 px), tableta (768–1.024 px) y escritorio (>1.024 px).
- La interfaz está completamente **internacionalizada** en español e inglés.

### 4.2.6 Portabilidad y despliegue

- El sistema se despliega íntegramente mediante **Docker** y **Docker Compose**. Cada componente (webapp, gateway, auth, user, planner, dos instancias MariaDB) tiene su propio `Dockerfile`.
- Compatible con Linux (Ubuntu 20.04+) y cualquier plataforma que soporte Docker Engine.
- Navegadores soportados: las dos últimas versiones de Chrome, Firefox, Safari y Edge.

### 4.2.7 Mantenibilidad

- Código TypeScript con modo `strict` habilitado en todos los servicios.
- Linting con ESLint y formateo con Prettier configurados de forma consistente.
- Cobertura de tests objetivo: >70% de líneas, ramas y funciones.
- Pipeline CI/CD con GitHub Actions que ejecuta tests automáticamente antes de autorizar merges.

---

## 4.3 Test Plan

### 4.3.1 Estrategia general

La estrategia de testing de TeachingPlanner se estructura en tres niveles complementarios que cubren distintas capas del sistema, desde el análisis estático hasta los flujos completos de usuario.

**Tabla 4.1 — Niveles de prueba**

| Nivel | Tipo | Scope | Herramienta | Nº tests |
|---|---|---|---|---|
| 0 | Análisis estático de código | Todos los servicios (backend + frontend) | SonarQube | — |
| 1 | Tests de integración | Backend — lógica de negocio con BD real | Jest 30 + Testcontainers (MariaDB 11) | 27 |
| 2 | Tests E2E | Flujos completos de usuario a través de la interfaz | Playwright 1.58 (Chromium) | 57 |

La ausencia de tests unitarios con mocks es una decisión deliberada: la lógica de negocio más crítica del sistema implica invariablemente operaciones de base de datos (restricciones de unicidad, cascadas de borrado, relaciones lazy/eager) que los mocks no reproducen fielmente. Los tests de integración con Testcontainers ejecutan contra una instancia real de MariaDB en un contenedor efímero, verificando exactamente el comportamiento que se desplegará en producción.

---

### 4.3.2 Nivel 0 — Análisis estático (SonarQube)

**Objetos de prueba:** código TypeScript de los cuatro servicios backend y el frontend.

**Herramienta:** SonarQube, ejecutado manualmente mediante `sonar-scanner` con la configuración de `sonar-project.properties`.

**Qué se analiza:** bugs potenciales y code smells; cobertura de código a partir de los informes LCOV generados por Jest; duplicación de código; complejidad ciclomática.

**Umbrales verificados antes de merge a `main`:** nuevos issues respecto a `main` = 0; duplicación < 30%; cobertura > 70%; complejidad ciclomática < 15 por función.

---

### 4.3.3 Nivel 1 — Tests de integración (backend)

**Objetos de prueba:** capa de datos y servicios de `planner_service`, `auth_service` y `user_service`.

**Herramienta:** Jest 30 con soporte TypeScript (`ts-jest`) y Testcontainers (`@testcontainers/mariadb 11.2`). Cada suite arranca un contenedor MariaDB efímero, ejecuta los tests y destruye el contenedor al finalizar, garantizando aislamiento completo entre suites.

**Categorías de verificación:**
- Eliminación en cascada: al borrar una entidad de alto nivel (Degree, Calendar, Subject, Classroom), se eliminan transaccionalmente todas las entidades subordinadas; las entidades fuera del subárbol permanecen intactas.
- Lógica de borrado condicional: el flag `force` en la eliminación de aulas debe respetarse.
- Restricciones de unicidad a nivel de base de datos: campos únicos (código de aula, acrónimo de asignatura, nombre de titulación, email de usuario) deben generar una violación de constraint en MariaDB, no solo en la capa de aplicación.
- Integridad de campos en entidades: los campos específicos del dominio (`planifiedHours`, `eventCharacter`, `dayCharacter`) se persisten correctamente.
- Contrato de autenticación: el registro almacena un hash bcrypt (nunca texto plano); el login emite un JWT válido con credenciales correctas y lo rechaza con credenciales incorrectas; el email es único.

**Total: 27 casos de prueba distribuidos en 8 ficheros de test.**

**Cobertura:** Jest genera informes LCOV consumidos por SonarQube para calcular la cobertura de líneas y ramas.

---

### 4.3.4 Nivel 2 — Tests E2E (frontend)

**Objetos de prueba:** flujos completos de usuario desde el navegador hasta la base de datos, pasando por todos los microservicios.

**Herramienta:** Playwright 1.58 configurado sobre Chromium. Los tests se ubican en `webapp/e2e/`.

**Aislamiento de datos:** antes de cada suite, el endpoint `POST /test/reset-database` borra en cascada los registros de 9 tablas del dominio de planificación, garantizando la idempotencia de cada test independientemente del orden de ejecución. Este endpoint solo está activo cuando `NODE_ENV=development` o `NODE_ENV=test`.

**Tabla 4.2 — Suites de tests E2E**

| Suite | Módulo | Aspectos verificados | Tests |
|---|---|---|---|
| `auth.spec.ts` | Autenticación | Renderizado del formulario; validación de campos vacíos; error en credenciales incorrectas; login exitoso y redirección; navegación autenticada; logout | 6 |
| `classroom.spec.ts` | Aulas | Listado; creación con código único; error en código duplicado; edición (campo `code` de solo lectura); borrado sin eventos; borrado forzado con eventos; cancelación; filtro por código | 8 |
| `course.spec.ts` | Cursos académicos | Listado; creación; error en año duplicado; edición de estado; borrado; cancelación; filtrado; validación de campos obligatorios; estado por defecto `PLANIFICADO` | 9 |
| `degree.spec.ts` | Titulaciones | Listado; creación; error en acrónimo duplicado; edición; borrado; cancelación; filtro por nombre; validación de campos obligatorios; conversión automática a mayúsculas del acrónimo | 9 |
| `subject.spec.ts` | Asignaturas | Listado; creación; error en acrónimo duplicado; edición; borrado; cancelación; validación de campos; nombre en mayúsculas; opciones de año (0–4); borrado múltiple | 10 |
| `calendar.spec.ts` | Calendarios | Listado; creación con fechas y semestre; validación fecha fin < inicio; edición; borrado con advertencia de cascada; cancelación; filtro por semestre; validación de campos obligatorios | 8 |
| `group.spec.ts` | Grupos | Listado; creación con horas planificadas; error de validación con horas a cero; edición; borrado; cancelación; validación de campos obligatorios | 7 |
| **Total** | | | **57** |

**Infraestructura CI** (job `e2e-tests` del pipeline GitHub Actions):
1. MariaDB 11 arranca como servicio Docker con credenciales de test.
2. Se crean las dos bases de datos de test (`planner_db_test`, `management_db_test`).
3. Los cuatro servicios backend se compilan y arrancan en background con `NODE_ENV=test`.
4. Se siembra un usuario administrador de test mediante script.
5. Se ejecuta `playwright test` con el reporter `html,github` generando artefactos (screenshots, vídeos, trazas) en caso de fallo.

**Fuera del alcance de los tests automatizados:**
- Gestión de usuarios (creación, activación por email, recuperación de contraseña): requieren servidor SMTP real.
- Sincronización con Google Calendar: requiere cuenta Google con OAuth configurado.
- Tests de carga o rendimiento.
- Accesibilidad (validación manual con herramientas WCAG).

**Cobertura de riesgo por funcionalidad:**

| Funcionalidad | Nivel de cobertura |
|---|---|
| Autenticación (login, logout) | Alta — E2E |
| CRUD estructura académica (titulaciones, cursos, asignaturas, grupos, aulas, calendarios) | Alta — E2E + integración |
| Integridad referencial y restricciones de unicidad | Alta — integración |
| Detección de conflictos de horario | Alta — integración |
| Solicitudes de cambio | Media — integración parcial |
| Exportación ZIP / importación `.txt` | Media — integración parcial |
| Sincronización Google Calendar | Baja — solo manual |
| Interfaz responsive | Baja — solo manual |
| Accesibilidad WCAG | Baja — solo manual |
