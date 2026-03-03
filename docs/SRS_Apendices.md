# 5. Apéndices - TeachingPlanner SRS

## 5.1 Diagramas UML

### 5.1.1 Diagrama de Casos de Uso

```
                    ┌─────────────────────────────────────────────────┐
                    │        Sistema TeachingPlanner                  │
                    │                                                 │
                    │  ┌──────────────────────────────────────┐       │
    ┌──────┐        │  │  Consultar Horarios Públicos         │       │
    │      │───────────│  └──────────────────────────────────────┘       │
    │ Anó- │        │                                                 │
    │ nimo │        │  ┌──────────────────────────────────────┐       │
    │      │───────────│  │  Exportar Horario a PDF             │       │
    └──────┘        │  └──────────────────────────────────────┘       │
                    │                                                 │
                    │  ┌──────────────────────────────────────┐       │
    ┌──────┐        │  │  Activar Cuenta                      │       │
    │      │───────────│  └──────────────────────────────────────┘       │
    │      │        │                                                 │
    │      │        │  ┌──────────────────────────────────────┐       │
    │      │───────────│  │  Iniciar Sesión                     │       │
    │      │        │  └──────────────────────────────────────┘       │
    │      │        │                                                 │
    │      │        │  ┌──────────────────────────────────────┐       │
    │      │───────────│  │  Consultar Mi Planificación         │       │
    │ Prof │        │  └──────────────────────────────────────┘       │
    │      │        │                                                 │
    │      │        │  ┌──────────────────────────────────────┐       │
    │      │───────────│  │  Crear Solicitud de Cambio          │       │
    │      │        │  └──────────────────────────────────────┘       │
    │      │        │                                                 │
    │      │        │  ┌──────────────────────────────────────┐       │
    │      │───────────│  │  Sincronizar Google Calendar        │       │
    │      │        │  └──────────────────────────────────────┘       │
    │      │        │                                                 │
    │      │        │  ┌──────────────────────────────────────┐       │
    │      │───────────│  │  Gestionar Mi Perfil                │       │
    └──────┘        │  └──────────────────────────────────────┘       │
                    │                                                 │
                    │  ┌──────────────────────────────────────┐       │
    ┌──────┐        │  │  Gestionar Usuarios                  │       │
    │      │───────────│  └──────────────────────────────────────┘       │
    │      │        │                                                 │
    │      │        │  ┌──────────────────────────────────────┐       │
    │      │───────────│  │  Gestionar Titulaciones             │       │
    │      │        │  └──────────────────────────────────────┘       │
    │      │        │                                                 │
    │      │        │  ┌──────────────────────────────────────┐       │
    │      │───────────│  │  Gestionar Asignaturas              │       │
    │      │        │  └──────────────────────────────────────┘       │
    │Admin │        │                                                 │
    │      │        │  ┌──────────────────────────────────────┐       │
    │      │───────────│  │  Gestionar Grupos                   │       │
    │      │        │  └──────────────────────────────────────┘       │
    │      │        │                                                 │
    │      │        │  ┌──────────────────────────────────────┐       │
    │      │───────────│  │  Gestionar Aulas                    │       │
    │      │        │  └──────────────────────────────────────┘       │
    │      │        │                                                 │
    │      │        │  ┌──────────────────────────────────────┐       │
    │      │───────────│  │  Crear Calendario Académico         │       │
    │      │        │  └──────────────────────────────────────┘       │
    │      │        │                                                 │
    │      │        │  ┌──────────────────────────────────────┐       │
    │      │───────────│  │  Duplicar Calendario                │       │
    │      │        │  └──────────────────────────────────────┘       │
    │      │        │                                                 │
    │      │        │  ┌──────────────────────────────────────┐       │
    │      │───────────│  │  Crear Evento Periódico             │       │
    │      │        │  │  <<include>>                         │       │
    │      │        │  │  ┌──────────────────────────┐        │       │
    │      │        │  └──│ Detectar Conflictos      │────────┘       │
    │      │        │     └──────────────────────────┘                │
    │      │        │                                                 │
    │      │        │  ┌──────────────────────────────────────┐       │
    │      │───────────│  │  Crear Evento Puntual               │       │
    │      │        │  └──────────────────────────────────────┘       │
    │      │        │                                                 │
    │      │        │  ┌──────────────────────────────────────┐       │
    │      │───────────│  │  Aprobar/Rechazar Solicitudes       │       │
    │      │        │  └──────────────────────────────────────┘       │
    │      │        │                                                 │
    │      │        │  ┌──────────────────────────────────────┐       │
    │      │───────────│  │  Consultar Auditoría                │       │
    │      │        │  └──────────────────────────────────────┘       │
    │      │        │                                                 │
    │      │        │  ┌──────────────────────────────────────┐       │
    │      │───────────│  │  Exportar Datos a CSV               │       │
    └──────┘        │  └──────────────────────────────────────┘       │
                    │                                                 │
                    └─────────────────────────────────────────────────┘
```

### 5.1.2 Diagrama de Clases (Modelo de Dominio)

```
┌─────────────────────┐
│      User           │
├─────────────────────┤
│ - id: UUID          │
│ - name: String      │
│ - email: String     │
│ - password: String  │
│ - role: String      │
│ - isActive: Boolean │
└─────────────────────┘
          │
          │ created_by
          ▼
┌──────────────────────────┐        ┌──────────────────────┐
│   AuditedEntity          │        │   Degree             │
├──────────────────────────┤        ├──────────────────────┤
│ - id: UUID               │        │ - name: String       │
│ - createdAt: DateTime    │◄───────│ - acronym: String    │
│ - createdBy: String      │        └──────────────────────┘
│ - updatedAt: DateTime    │                   │ 1
│ - updatedBy: String      │                   │
└──────────────────────────┘                   │ has many
          △                                    │
          │                                    ▼ *
          │                          ┌──────────────────────┐
          │                          │   Course             │
          │                          ├──────────────────────┤
          │                          │ - year: String       │
          │                          └──────────────────────┘
          │                                    │ 1
          │                                    │
          │                                    │ has many
          │                                    ▼ *
          │                          ┌──────────────────────┐         ┌──────────────────────┐
          │                          │   Calendar           │1        │   Day                │
          │                          ├──────────────────────┤─────────├──────────────────────┤
          │                          │ - start: Date        │  has    │ - date: Date         │
          │                          │ - end: Date          │  many   │ - isLectureable: Bool│
          │                          │ - semester: Int      │        *│                      │
          │                          └──────────────────────┘         └──────────────────────┘
          │                                    │ 1                              │ 1
          │                                    │                                │
          │                                    │                                │ has many
          │                                    │                                ▼ *
          │                                    │                      ┌──────────────────────┐
          │                                    │                      │  PuntualEvent        │
          │                                    │                      ├──────────────────────┤
          │                                    │                      │ - startTime: Time    │
          │                                    │                      │ - endTime: Time      │
          │                                    │                      │ - cancelled: Boolean │
          │                                    │                      │ - comment: String    │
          │                                    │                      └──────────────────────┘
          │                                    │ has many                      │ *
          │                                    ▼ *                              │
          │                          ┌──────────────────────┐                  │
          │                          │  PeriodicEvent       │                  │
          │                          ├──────────────────────┤                  │
          │                          │ - startTime: Time    │                  │
          │                          │ - endTime: Time      │                  │
          │                          │ - monday: Boolean    │                  │
          │                          │ - tuesday: Boolean   │                  │
          │                          │ - wednesday: Boolean │                  │
          │                          │ - thursday: Boolean  │                  │
          │                          │ - friday: Boolean    │                  │
          │                          │ - comment: String    │                  │
          │                          └──────────────────────┘                  │
          │                                    │ *                             │
          │                                    │                               │
          │                                    │                               │
          │                       ┌────────────┴───────────┐                   │
          │                       │                        │                   │
          │                       │                        │                   │
          │                       ▼ *                      ▼ *                 │
          │              ┌──────────────────────┐  ┌──────────────────────┐   │
          │              │   Group              │  │   Classroom          │   │
          │              ├──────────────────────┤  ├──────────────────────┤   │
          │              │ - number: Int        │  │ - code: String       │   │
          │              │ - type: String       │  │ - gisUrl: String     │   │
          │              │ - language: String   │  └──────────────────────┘   │
          │              └──────────────────────┘            △                 │
          │                       △                          │                 │
          │                       │ *                        │ *               │
          │                       │                          │                 │
          │                       │              ┌───────────┴─────────────────┘
          │                       │ *            │
          │                       │              │
          │              ┌────────┴─────────┐    │
          │              │   Subject        │    │
          │              ├──────────────────┤    │
          │         ┌────│ - name: String   │    │
          │         │    │ - acronym: String│    │
          │         │    │ - siesCode: String    │
          │         │    │ - semester: Int  │    │
          │         │    │ - year: Int      │    │
          │         │    └──────────────────┘    │
          │         │ *           △               │
          │         │             │               │
          │         │             │ belongs to    │
          │         │             │               │
          │         └─────────────┘               │
          │                                       │
          │                                       │
          │                              ┌────────┴────────────┐
          │                              │  EventRequest       │
          │                              ├─────────────────────┤
          │                              │ - eventType: String │
          │                              │ - eventData: JSON   │
          │                              │ - status: String    │
          │                              │ - professorId: String│
          │                              │ - reviewedBy: String │
          │                              │ - reviewedAt: DateTime│
          │                              │ - comments: String   │
          │                              └─────────────────────┘
          │
          │
          │
┌─────────┴──────────────┐
│  AuditLog              │
├────────────────────────┤
│ - userEmail: String    │
│ - actionType: String   │
│ - entityType: String   │
│ - entityId: String     │
│ - changes: JSON        │
│ - createdAt: DateTime  │
└────────────────────────┘
```

### 5.1.3 Diagrama de Secuencia: Crear Evento con Validación de Conflictos

```
Admin          API Gateway      Planner Service      Database       Google Calendar
  │                 │                  │                  │                │
  │ POST /events    │                  │                  │                │
  ├────────────────>│                  │                  │                │
  │                 │ verify JWT       │                  │                │
  │                 │─────────┐        │                  │                │
  │                 │         │        │                  │                │
  │                 │<────────┘        │                  │                │
  │                 │                  │                  │                │
  │                 │ createEvent()    │                  │                │
  │                 ├─────────────────>│                  │                │
  │                 │                  │                  │                │
  │                 │                  │ validate data    │                │
  │                 │                  │────────┐         │                │
  │                 │                  │        │         │                │
  │                 │                  │<───────┘         │                │
  │                 │                  │                  │                │
  │                 │                  │ check conflicts  │                │
  │                 │                  ├─────────────────>│                │
  │                 │                  │                  │                │
  │                 │                  │  existing events │                │
  │                 │                  │<─────────────────┤                │
  │                 │                  │                  │                │
  │                 │                  │ detect overlaps  │                │
  │                 │                  │────────┐         │                │
  │                 │                  │        │         │                │
  │                 │                  │<───────┘         │                │
  │                 │                  │                  │                │
  │                 │                  │ [no conflicts]   │                │
  │                 │                  │                  │                │
  │                 │                  │ save event       │                │
  │                 │                  ├─────────────────>│                │
  │                 │                  │                  │                │
  │                 │                  │  event created   │                │
  │                 │                  │<─────────────────┤                │
  │                 │                  │                  │                │
  │                 │                  │ save audit log   │                │
  │                 │                  ├─────────────────>│                │
  │                 │                  │                  │                │
  │                 │                  │ sync with Google │                │
  │                 │                  ├────────────────────────────────>│
  │                 │                  │                  │                │
  │                 │                  │           event synced            │
  │                 │                  │<────────────────────────────────┤
  │                 │                  │                  │                │
  │                 │  event created   │                  │                │
  │                 │<─────────────────┤                  │                │
  │                 │                  │                  │                │
  │  201 Created    │                  │                  │                │
  │<────────────────┤                  │                  │                │
  │                 │                  │                  │                │

[Alternative: Conflict Detected]
  │                 │                  │                  │                │
  │                 │                  │ detect overlaps  │                │
  │                 │                  │────────┐         │                │
  │                 │                  │        │         │                │
  │                 │                  │<───────┘         │                │
  │                 │                  │                  │                │
  │                 │                  │ [conflict found] │                │
  │                 │                  │                  │                │
  │                 │  409 Conflict    │                  │                │
  │                 │<─────────────────┤                  │                │
  │                 │                  │                  │                │
  │ 409 Conflict    │                  │                  │                │
  │<────────────────┤                  │                  │                │
  │ (error details) │                  │                  │                │
```

### 5.1.4 Diagrama de Secuencia: Solicitud de Cambio (Profesor → Admin)

```
Profesor       API Gateway    Planner Service   Database    Email Service   Admin
  │                │                │               │             │            │
  │ POST /requests │                │               │             │            │
  ├───────────────>│                │               │             │            │
  │                │ verify JWT     │               │             │            │
  │                │────────┐       │               │             │            │
  │                │        │       │               │             │            │
  │                │<───────┘       │               │             │            │
  │                │                │               │             │            │
  │                │ createRequest()│               │             │            │
  │                ├───────────────>│               │             │            │
  │                │                │               │             │            │
  │                │                │ save request  │             │            │
  │                │                ├──────────────>│             │            │
  │                │                │               │             │            │
  │                │                │ request saved │             │            │
  │                │                │<──────────────┤             │            │
  │                │                │               │             │            │
  │                │                │ notify admins │             │            │
  │                │                ├─────────────────────────────>            │
  │                │                │               │             │            │
  │                │                │               │   send email│            │
  │                │                │               │             ├───────────>│
  │                │                │               │             │            │
  │                │   201 Created  │               │             │            │
  │                │<───────────────┤               │             │            │
  │                │                │               │             │            │
  │ 201 Created    │                │               │             │            │
  │<───────────────┤                │               │             │            │
  │                │                │               │             │            │
  ...              ...              ...             ...           ...          ...
  │                │                │               │             │            │
  │                │                │               │             │     [Admin reviews]
  │                │                │               │             │            │
  │                │                │               │             │ PATCH /requests/:id/approve
  │                │                │               │             │<───────────┤
  │                │                │               │             │            │
  │                │                │ approveRequest()            │            │
  │                │                │<─────────────────────────────────────────┤
  │                │                │               │             │            │
  │                │                │ create event  │             │            │
  │                │                ├──────────────>│             │            │
  │                │                │               │             │            │
  │                │                │ update status │             │            │
  │                │                ├──────────────>│             │            │
  │                │                │               │             │            │
  │                │                │ notify profesor│            │            │
  │                │                ├─────────────────────────────>            │
  │                │                │               │             │            │
  │                │                │               │   send email│            │
  │   [Email]      │                │               │             ├───────────>│
  │<───────────────────────────────────────────────────────────────────────────┤
  │ "Solicitud    │                │               │             │            │
  │  aprobada"    │                │               │             │            │
```

### 5.1.5 Diagrama de Estados: Solicitud de Cambio

```
                  ┌─────────────────┐
                  │   [Creada]      │
                  │                 │
                  │    PENDING      │
                  └────────┬────────┘
                           │
                           │ profesor crea solicitud
                           │
                ┌──────────┴──────────┐
                │                     │
                │ admin revisa        │ admin revisa
                ▼                     ▼
       ┌─────────────────┐   ┌─────────────────┐
       │                 │   │                 │
       │    APPROVED     │   │    REJECTED     │
       │                 │   │                 │
       │  [Final State]  │   │  [Final State]  │
       └─────────────────┘   └─────────────────┘
       │                     │
       │ evento creado       │ solo comentario
       │ automáticamente     │ explicativo
       │                     │
       ▼                     ▼
  Notificación           Notificación
  a profesor             a profesor
  (aprobación)           (rechazo)


  Transiciones Permitidas:
  ─────────────────────────
  PENDING → APPROVED   (solo Admin)
  PENDING → REJECTED   (solo Admin)

  Transiciones NO Permitidas:
  ────────────────────────────
  APPROVED → REJECTED
  REJECTED → APPROVED
  APPROVED → PENDING
  REJECTED → PENDING

  Acciones por Estado:
  ────────────────────
  PENDING:
  - Profesor puede eliminar solicitud
  - Profesor puede ver detalle
  - Admin puede aprobar o rechazar

  APPROVED:
  - Solo lectura
  - Evento ya creado en calendario

  REJECTED:
  - Solo lectura
  - Ver motivo de rechazo
```

### 5.1.6 Diagrama de Despliegue

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Universidad de Oviedo                        │
│                         Infraestructura IT                          │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │               Servidor de Aplicación (Docker Host)            │ │
│  │                                                               │ │
│  │  ┌──────────────────┐      ┌──────────────────┐             │ │
│  │  │  webapp          │      │  gateway_service │             │ │
│  │  │  (React SPA)     │      │  (Express.js)    │             │ │
│  │  │  Container       │◄─────┤  Container       │             │ │
│  │  │  Port: 80/443    │      │  Port: 3000      │             │ │
│  │  └──────────────────┘      └────────┬─────────┘             │ │
│  │                                     │                        │ │
│  │                     ┌───────────────┼───────────────┐        │ │
│  │                     │               │               │        │ │
│  │                     ▼               ▼               ▼        │ │
│  │         ┌───────────────┐ ┌────────────┐ ┌────────────────┐ │ │
│  │         │ auth_service  │ │user_service│ │planner_service │ │ │
│  │         │ (Express.js)  │ │(Express.js)│ │ (Express.js)   │ │ │
│  │         │ Container     │ │ Container  │ │ Container      │ │ │
│  │         │ Port: 3001    │ │ Port: 3002 │ │ Port: 3003     │ │ │
│  │         └───────┬───────┘ └──────┬─────┘ └────────┬───────┘ │ │
│  │                 │                │                │         │ │
│  │                 └────────────────┼────────────────┘         │ │
│  │                                  │                          │ │
│  │                                  ▼                          │ │
│  │                     ┌────────────────────────┐              │ │
│  │                     │   PostgreSQL Database  │              │ │
│  │                     │   Container            │              │ │
│  │                     │   Port: 5432           │              │ │
│  │                     │   Volume: pgdata       │              │ │
│  │                     └────────────────────────┘              │ │
│  │                                                             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │          Servidor de Backups (Opcional Remoto)            │ │
│  │                                                           │ │
│  │  ┌────────────────────────────────────────────┐          │ │
│  │  │  Backups diarios (SQL dumps)               │          │ │
│  │  │  Retención: 30 días                        │          │ │
│  │  └────────────────────────────────────────────┘          │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ HTTPS
                             │
                             ▼
                    ┌─────────────────┐
                    │  Usuarios Web   │
                    │  (Navegadores)  │
                    └─────────────────┘

                             │
                             │ HTTPS/REST
                             │
                             ▼
                ┌────────────────────────────┐
                │   Google Calendar API      │
                │   (Servicio Externo)       │
                └────────────────────────────┘

                             │
                             │ SMTP
                             │
                             ▼
                ┌────────────────────────────┐
                │   Email Service            │
                │   (Gmail/SendGrid/etc)     │
                └────────────────────────────┘
```

## 5.2 Matriz de Trazabilidad de Requisitos

### 5.2.1 Matriz Requisitos - Stakeholders

| Requisito | STK-01 | STK-02 | STK-03 | STK-04 | STK-05 | STK-08 | Prioridad |
|-----------|--------|--------|--------|--------|--------|--------|-----------|
| **Funcionales** |
| RF-AUTH-01 a 06 | ● | ● | ● | ○ | ● | ● | ALTA |
| RF-USER-01 a 03 | ● | ● | ○ | ○ | ● | ○ | ALTA |
| RF-DEGREE-01 a 04 | ● | ● | ○ | ○ | ○ | ○ | ALTA |
| RF-SUBJECT-01 a 04 | ● | ● | ○ | ○ | ○ | ○ | ALTA |
| RF-GROUP-01 a 04 | ● | ● | ○ | ○ | ○ | ○ | ALTA |
| RF-CLASSROOM-01 a 04 | ● | ● | ○ | ○ | ○ | ○ | ALTA |
| RF-CAL-01 a 05 | ● | ● | ○ | ○ | ● | ○ | CRÍTICA |
| RF-EVENT-01 a 08 | ● | ● | ○ | ○ | ● | ○ | CRÍTICA |
| RF-REQ-01 a 06 | ● | ● | ● | ○ | ● | ○ | ALTA |
| RF-VIEW-01 a 02 | ○ | ○ | ● | ● | ○ | ○ | CRÍTICA |
| RF-SYNC-01 a 05 | ○ | ○ | ● | ○ | ○ | ● | ALTA |
| RF-AUDIT-01 a 03 | ● | ● | ○ | ○ | ● | ● | CRÍTICA |
| RF-EXPORT-01 | ● | ● | ○ | ○ | ○ | ○ | MEDIA |
| **No Funcionales** |
| RNF-PERF-01 a 04 | ● | ● | ● | ● | ● | ● | ALTA |
| RNF-SCALE-01 a 03 | ● | ● | ○ | ● | ● | ● | ALTA |
| RNF-DISP-01 a 04 | ● | ● | ● | ● | ● | ● | CRÍTICA |
| RNF-SEC-01 a 06 | ● | ● | ● | ○ | ● | ● | CRÍTICA |
| RNF-UI-01 a 04 | ○ | ● | ● | ● | ○ | ○ | ALTA |
| RNF-MAINT-01 a 05 | ○ | ○ | ○ | ○ | ○ | ● | ALTA |

**Leyenda:**
- ● = Afecta directamente / Alta relevancia
- ○ = Afecta indirectamente / Baja relevancia
- (vacío) = No afecta

### 5.2.2 Matriz Requisitos - Casos de Uso

| Caso de Uso | Requisitos Funcionales | Requisitos No Funcionales | Actor Principal |
|-------------|----------------------|--------------------------|-----------------|
| Login | RF-AUTH-03 | RNF-SEC-01, RNF-PERF-01 | Todos |
| Registro de Usuario | RF-AUTH-01, RF-USER-01 | RNF-SEC-04 | Admin |
| Activación de Cuenta | RF-AUTH-02 | RNF-INT-03 | Usuario Nuevo |
| Crear Calendario | RF-CAL-01 | RNF-PERF-01, RNF-AUDIT-01 | Admin |
| Duplicar Calendario | RF-CAL-04 | RNF-PERF-01 | Admin |
| Crear Evento Periódico | RF-EVENT-01, RF-EVENT-07 | RNF-PERF-03, RNF-SEC-02 | Admin |
| Crear Evento Puntual | RF-EVENT-02, RF-EVENT-07 | RNF-PERF-03 | Admin |
| Solicitar Cambio | RF-REQ-01 | RNF-INT-03, RNF-SEC-02 | Profesor |
| Aprobar Solicitud | RF-REQ-04 | RNF-AUDIT-01, RNF-INT-03 | Admin |
| Rechazar Solicitud | RF-REQ-05 | RNF-AUDIT-01, RNF-INT-03 | Admin |
| Ver Horarios Públicos | RF-VIEW-01 | RNF-PERF-01, RNF-UI-02, RNF-PERF-04 | Anónimo |
| Sincronizar Google | RF-SYNC-01 a 05 | RNF-INT-02, RNF-SEC-03 | Profesor/Admin |
| Exportar a PDF | RF-VIEW-02 | RNF-PERF-01 | Anónimo |
| Exportar a CSV | RF-EXPORT-01 | RNF-PERF-01 | Admin |
| Consultar Auditoría | RF-AUDIT-02 | RNF-PERF-03, RNF-SEC-02 | Admin |

### 5.2.3 Matriz de Cobertura de Tests

| Módulo | Requisitos | Tests Unitarios | Tests Integración | Tests E2E | Cobertura Objetivo |
|--------|-----------|-----------------|-------------------|-----------|-------------------|
| Autenticación | RF-AUTH-01 a 06 | ● | ● | ● | >80% |
| Usuarios | RF-USER-01 a 03 | ● | ● | ○ | >70% |
| Estructura Académica | RF-DEGREE, RF-SUBJECT, RF-GROUP | ● | ● | ○ | >70% |
| Calendarios | RF-CAL-01 a 05 | ● | ● | ● | >80% |
| Eventos | RF-EVENT-01 a 08 | ● | ● | ● | >85% |
| Solicitudes | RF-REQ-01 a 06 | ● | ● | ● | >80% |
| Vista Pública | RF-VIEW-01 a 02 | ○ | ● | ● | >70% |
| Sincronización Google | RF-SYNC-01 a 05 | ● | ● | ○ | >75% |
| Auditoría | RF-AUDIT-01 a 03 | ● | ● | ○ | >70% |
| Exportación | RF-EXPORT-01 | ○ | ● | ○ | >60% |

**Leyenda:**
- ● = Cobertura requerida
- ○ = Cobertura opcional/parcial

## 5.3 Glosario Técnico

### Términos de Dominio

**Calendario Académico:** Conjunto de días lectivos asociados a un curso académico y semestre específico, que define el periodo en el que se imparten clases.

**Código SIES:** Identificador único asignado por el Sistema Integrado de Información Universitaria del Ministerio a cada asignatura oficial.

**Curso Académico:** Periodo lectivo anual, generalmente de septiembre a junio, identificado por dos años consecutivos (ej: 2026-2027).

**Día Lectivo:** Día incluido en un calendario académico en el que potencialmente hay docencia. Se excluyen sábados, domingos y festivos.

**Evento Periódico:** Sesión de clase que se repite regularmente según un patrón de días de la semana (ej: lunes y miércoles de 9:00 a 11:00).

**Evento Puntual:** Sesión de clase única que ocurre en una fecha específica, como seminarios, recuperaciones o excepciones.

**Grupo:** Subdivisión de una asignatura identificada por tipo (teoría, prácticas), número e idioma de impartición.

**Semestre:** División del curso académico en dos periodos: primer semestre (septiembre-enero) y segundo semestre (febrero-junio).

**Solicitud de Cambio:** Petición formal de un profesor para modificar un evento en el calendario, sujeta a aprobación administrativa.

**Titulación:** Programa de estudios oficial que conduce a un grado universitario (ej: Grado en Ingeniería Informática).

### Términos Técnicos

**API REST:** Interfaz de Programación de Aplicaciones que sigue principios RESTful, usando HTTP para operaciones CRUD.

**Bcrypt:** Algoritmo de hashing criptográfico utilizado para almacenar contraseñas de forma segura.

**CORS (Cross-Origin Resource Sharing):** Mecanismo de seguridad que permite solicitudes HTTP desde diferentes dominios.

**CSRF (Cross-Site Request Forgery):** Tipo de ataque web que explota la confianza de un sitio en el navegador del usuario.

**Docker:** Plataforma de contenedores que empaqueta aplicaciones con sus dependencias en unidades aisladas.

**ECTS (European Credit Transfer System):** Sistema europeo de transferencia y acumulación de créditos universitarios.

**ERD (Entity-Relationship Diagram):** Diagrama que muestra las entidades de un sistema y sus relaciones.

**HTTPS:** Protocolo HTTP sobre TLS/SSL que cifra la comunicación entre cliente y servidor.

**JWT (JSON Web Token):** Estándar abierto (RFC 7519) para crear tokens de acceso que afirman claims JSON.

**OAuth 2.0:** Protocolo de autorización que permite acceso limitado a recursos sin compartir credenciales.

**ORM (Object-Relational Mapping):** Técnica que mapea objetos de programación a tablas de base de datos relacional.

**Rate Limiting:** Técnica para controlar la cantidad de peticiones que un cliente puede hacer en un periodo de tiempo.

**RBAC (Role-Based Access Control):** Modelo de control de acceso basado en roles de usuario.

**RGPD (Reglamento General de Protección de Datos):** Regulación europea (GDPR en inglés) sobre privacidad y protección de datos personales.

**RPO (Recovery Point Objective):** Máxima cantidad de datos que una organización puede permitirse perder medida en tiempo.

**RTO (Recovery Time Objective):** Tiempo máximo aceptable para restaurar un sistema tras una interrupción.

**SPA (Single Page Application):** Aplicación web que carga una única página HTML y actualiza dinámicamente el contenido.

**SQL Injection:** Técnica de ataque que inserta código SQL malicioso en consultas a bases de datos.

**TLS/SSL (Transport Layer Security / Secure Sockets Layer):** Protocolos criptográficos para comunicación segura por red.

**TypeORM:** ORM para TypeScript y JavaScript que soporta múltiples bases de datos.

**WCAG (Web Content Accessibility Guidelines):** Directrices de accesibilidad para contenido web.

**XSS (Cross-Site Scripting):** Vulnerabilidad que permite inyectar scripts maliciosos en páginas web.

### Acrónimos del Proyecto

| Acrónimo | Significado |
|----------|-------------|
| EII | Escuela de Ingeniería Informática |
| GII | Grado en Ingeniería Informática |
| GIIIS | Grado en Ingeniería Informática del Software |
| GIS | Geographic Information System (para URLs de ubicación de aulas) |
| SIES | Sistema Integrado de Información Universitaria |
| SUTIC | Servicio Universitario de Tecnologías de la Información y Comunicaciones |
| UniOvi | Universidad de Oviedo |

## 5.4 Resumen de Verificación de Requisitos

### Tabla de Verificabilidad de Requisitos

| ID Requisito | Verificación | Método | Criterio de Aceptación |
|--------------|--------------|--------|------------------------|
| RF-AUTH-01 | ✓ | Test automatizado + Manual | Usuario recibe email de activación en <2 min |
| RF-AUTH-03 | ✓ | Test automatizado | Login exitoso en <1s, JWT válido generado |
| RF-EVENT-07 | ✓ | Test automatizado | 100% de conflictos detectados, 0 falsos negativos |
| RF-CAL-04 | ✓ | Test manual | Duplicación completa en <10s, eventos copiados correctamente |
| RF-VIEW-01 | ✓ | Test E2E | Carga de página pública <3s, sin autenticación requerida |
| RF-SYNC-01 | ✓ | Test integración | Conexión OAuth exitosa, tokens almacenados encriptados |
| RNF-PERF-01 | ✓ | Test rendimiento | Tiempo de respuesta medido con JMeter, percentil 95 |
| RNF-SEC-01 | ✓ | Test seguridad | Contraseñas hasheadas con bcrypt, auditoría de código |
| RNF-DISP-01 | ✓ | Monitorización | Uptime medido por herramienta externa durante 1 año |
| RNF-UI-02 | ✓ | Test responsive | Validación en Chrome DevTools + dispositivos reales |

### Defectos Encontrados Durante Revisión de Requisitos

| ID Defecto | Tipo | Descripción | Estado | Corrección |
|------------|------|-------------|--------|-----------|
| DEF-001 | Ambigüedad | RF-USER-03 no especificaba si eliminación es hard delete o soft delete | RESUELTO | Aclarado: Soft delete (marca is_active=false) |
| DEF-002 | Inconsistencia | RF-EVENT-01 y RF-EVENT-07 duplicaban validación de conflictos | RESUELTO | Separados: RF-EVENT-01 crea, RF-EVENT-07 valida |
| DEF-003 | Falta de requisito | No se especificó comportamiento cuando profesor tiene múltiples grupos | RESUELTO | Agregado: Sincronización incluye todos los grupos asignados |
| DEF-004 | Ambigüedad | RNF-PERF-01 no especificaba percentil para tiempos de respuesta | RESUELTO | Aclarado: Percentil 95 |
| DEF-005 | Conflicto | RF-CAL-05 permitía eliminar calendario actual, contradiciendo restricción de negocio | RESUELTO | Agregada validación: No eliminar calendario del semestre en curso |

## 5.5 Plan de Implementación Sugerido

### Fase 1: MVP (Minimum Viable Product) - 3 meses
**Objetivo:** Sistema funcional básico para una titulación

**Características:**
- Autenticación (RF-AUTH-01 a 05)
- Gestión de usuarios (RF-USER-01 a 03)
- Estructura académica básica (RF-DEGREE, RF-SUBJECT, RF-GROUP, RF-CLASSROOM)
- Calendarios (RF-CAL-01 a 03, 05)
- Eventos periódicos (RF-EVENT-01, RF-EVENT-07)
- Vista pública básica (RF-VIEW-01)
- Auditoría básica (RF-AUDIT-01)

**Excluido del MVP:**
- Eventos puntuales
- Solicitudes de cambio
- Sincronización con Google Calendar
- Duplicación de calendarios
- Exportaciones

### Fase 2: Funcionalidades Avanzadas - 2 meses
**Objetivo:** Completar funcionalidades para profesores

**Características:**
- Eventos puntuales (RF-EVENT-02)
- Solicitudes de cambio (RF-REQ-01 a 06)
- Sincronización con Google Calendar (RF-SYNC-01 a 05)
- Duplicación de calendarios (RF-CAL-04)
- Exportación a PDF (RF-VIEW-02)

### Fase 3: Optimización y Escalado - 1 mes
**Objetivo:** Preparar para múltiples titulaciones

**Características:**
- Optimización de rendimiento (RNF-PERF-04 caché)
- Exportación a CSV (RF-EXPORT-01)
- Auditoría completa (RF-AUDIT-02, RF-AUDIT-03)
- Testing completo
- Documentación de usuario

### Fase 4: Despliegue y Estabilización - 1 mes
**Objetivo:** Puesta en producción

**Actividades:**
- Migración de datos históricos
- Formación a administradores
- Formación a profesores
- Monitorización y ajustes
- Corrección de bugs reportados

**Total estimado:** 7 meses

## 5.6 Conclusiones

Este documento de Especificación de Requisitos de Software (SRS) para el sistema **TeachingPlanner** ha establecido una base sólida para el desarrollo del proyecto. Los puntos clave son:

### Alcance Completo
- **18 stakeholders** identificados con sus necesidades específicas
- **60+ requisitos funcionales** detallados con criterios de aceptación
- **30+ requisitos no funcionales** que garantizan calidad, seguridad y rendimiento
- Trazabilidad completa entre stakeholders, requisitos y casos de uso

### Prioridades Claras
Los requisitos críticos están claramente identificados:
- Detección automática de conflictos de horario (RF-EVENT-07)
- Vista pública de horarios sin autenticación (RF-VIEW-01)
- Seguridad y cumplimiento RGPD (RNF-SEC-01 a 06)
- Disponibilidad y copias de seguridad (RNF-DISP-01 a 03)

### Viabilidad Técnica
- Arquitectura de microservicios escalable
- Tecnologías probadas (Node.js, PostgreSQL, React)
- Integración con servicios externos bien definida
- Plan de implementación por fases realista

### Cumplimiento Normativo
- Conforme con RGPD y protección de datos
- Alineado con normativa universitaria
- Accesibilidad WCAG 2.1 nivel AA
- Auditoría completa para trazabilidad

### Próximos Pasos Recomendados
1. **Validación:** Revisión de SRS con stakeholders principales (STK-01, STK-02, STK-05)
2. **Prototipado:** Crear prototipos de interfaz para validar UX
3. **Diseño Detallado:** Elaborar diseño técnico detallado y arquitectura
4. **Planificación:** Crear backlog de producto con historias de usuario
5. **Desarrollo:** Iniciar Fase 1 (MVP) según plan de implementación

---

**Documento elaborado por:** Equipo TeachingPlanner
**Fecha:** 02/03/2026
**Versión:** 1.0
**Estado:** Pendiente de aprobación

---
