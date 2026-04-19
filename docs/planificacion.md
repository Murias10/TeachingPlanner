# Planificación del Proyecto: TeachingPlanner

**Proyecto:** Sistema de Gestión de Planificación Académica — TeachingPlanner
**Tipo:** Trabajo de Fin de Grado (TFG)
**Institución:** Escuela de Ingeniería Informática — Universidad de Oviedo
**Fecha de inicio:** 10/03/2025
**Fecha de fin:** 04/08/2025
**Duración total:** ~105 días laborables
**Trabajo total estimado:** ~309 horas

> **Nota sobre horas:** En el contexto de un TFG desarrollado individualmente, el alumno asume todos los roles. Las horas reflejan el esfuerzo real estimado de desarrollo, documentación y pruebas.

---

## 1. Recursos del Proyecto

| Rol | Abreviatura | Función en el TFG |
|-----|-------------|-------------------|
| Jefe de proyecto | JP | Planificación, seguimiento, reuniones con tutor |
| Analista de sistemas | ANS | Análisis de requisitos, casos de uso |
| Arquitecto de software | ARQ | Diseño de arquitectura microservicios |
| Consultor de tecnología | CT | Decisiones tecnológicas (stack, APIs externas) |
| Desarrollador | DS | Implementación de todos los microservicios |
| Tester | T | Pruebas unitarias y E2E con Playwright |
| Administrador de Sistemas | AS | Configuración Azure VM, Docker, CI/CD |

> Todos los roles son asumidos por el alumno-desarrollador del TFG.

---

## 2. Estructura de Desglose del Trabajo (EDT / WBS)

```
1. TeachingPlanner — Herramienta de Ayuda a la Planificación Docente
│
├── 1.1 Gestión de proyecto
│   ├── 1.1.1 Inicio de proyecto
│   ├── 1.1.2 Gestión de fase de documentación
│   ├── 1.1.3 Gestión de fase de análisis
│   ├── 1.1.4 Adquisición e instalación de infraestructura (VM Azure, Docker, MariaDB, TLS, SonarQube, CI/CD)
│   ├── 1.1.5 Gestión de fase de diseño
│   ├── 1.1.6 Gestión de fase de construcción
│   ├── 1.1.7 Gestión de fase de pruebas
│   └── 1.1.8 Cierre de proyecto
│
├── 1.2 Fase de documentación
│   ├── 1.2.1 Memoria del TFG
│   ├── 1.2.2 Manual de instalación y configuración (Docker, Azure, variables de entorno)
│   ├── 1.2.3 Manual de usuario (administrador, profesor, usuario anónimo)
│   ├── 1.2.4 Documentación de la API REST (endpoints, autenticación, ejemplos)
│   └── 1.2.5 Documentación de terceros (Google Calendar API, OAuth 2.0, TypeORM)
│
├── 1.3 Fase de análisis del sistema
│   ├── 1.3.1 Situación actual (procesos manuales con Excel en la EII)
│   ├── 1.3.2 Alcance del sistema
│   ├── 1.3.3 Estudio de alternativas tecnológicas
│   ├── 1.3.4 Selección del stack tecnológico
│   ├── 1.3.5 Análisis de requisitos funcionales y no funcionales (SRS)
│   ├── 1.3.6 Evaluación de riesgos
│   ├── 1.3.7 Identificación de módulos del sistema
│   └── 1.3.8 Elaboración de modelos de datos (ERD)
│
├── 1.4 Fase de diseño y arquitectura
│   ├── 1.4.1 Arquitectura del sistema (microservicios: Gateway, Auth, User, Planner)
│   ├── 1.4.2 Casos de uso (UML)
│   ├── 1.4.3 Diagramas de estado (eventos periódicos, solicitudes)
│   ├── 1.4.4 Diagramas de flujo (autenticación, importación, workflow solicitudes)
│   ├── 1.4.5 Diseño de interfaces de usuario (wireframes, Tailwind CSS)
│   └── 1.4.6 Prototipos iniciales
│
├── 1.5 Fase de construcción
│   ├── 1.5.1 Gateway Service
│   ├── 1.5.2 Auth Service
│   ├── 1.5.3 User Service
│   ├── 1.5.4 Planner Service
│   │   ├── 1.5.4.1  Configuración base e infraestructura
│   │   ├── 1.5.4.2  Gestión de titulaciones y cursos
│   │   ├── 1.5.4.3  Gestión de asignaturas
│   │   ├── 1.5.4.4  Gestión de grupos de asignaturas
│   │   ├── 1.5.4.5  Gestión de aulas
│   │   ├── 1.5.4.6  Gestión de calendarios académicos
│   │   ├── 1.5.4.7  Importación y exportación de calendarios (Excel/CSV/ZIP)
│   │   ├── 1.5.4.8  Gestión de eventos puntuales
│   │   ├── 1.5.4.9  Gestión de eventos periódicos
│   │   ├── 1.5.4.10 Módulo de solicitudes de eventos (workflow profesor → admin)
│   │   ├── 1.5.4.11 Integración con Google Calendar (OAuth 2.0 + sincronización)
│   │   └── 1.5.4.12 Vista pública del calendario
│   └── 1.5.5 Frontend — SPA React 19
│
└── 1.6 Fase de pruebas y depuración
    ├── 1.6.1 Pruebas unitarias
    ├── 1.6.2 Pruebas de integración entre microservicios
    ├── 1.6.3 Pruebas de aceptación (validación de requisitos SRS)
    ├── 1.6.4 Pruebas E2E con Playwright
    ├── 1.6.5 Pruebas de seguridad (JWT, OAuth, OWASP básico)
    └── 1.6.6 Corrección de errores y regresión final
```

---

## 3. Planificación Detallada de Tareas

> **Formato para Microsoft Project 2019**
> — Duración en días laborables (jornada de 8 horas)
> — Predecesoras: número de ID de la tarea predecesora
> — CC = Comienzo a comienzo (las demás son Fin a Comienzo por defecto)

### Leyenda de columnas

| Campo | Descripción |
|-------|-------------|
| **ID** | Identificador numérico secuencial |
| **EDT** | Número de esquema WBS |
| **Nombre de tarea** | Nombre de la tarea |
| **Dur.** | Duración en días laborables |
| **Inicio** | Fecha de inicio (dd/mm/aa) |
| **Fin** | Fecha de fin (dd/mm/aa) |
| **Horas** | Trabajo estimado en horas |
| **Pred.** | ID(s) de tarea(s) predecesoras |
| **Recurso** | Rol principal asignado |

---

### 1.1 Gestión de proyecto

| ID | EDT | Nombre de tarea | Dur. | Inicio | Fin | Horas | Pred. | Recurso |
|----|-----|-----------------|------|--------|-----|-------|-------|---------|
| 1 | 1 | **TeachingPlanner — Herramienta de Ayuda a la Planificación Docente** | **105 d** | **10/03/25** | **04/08/25** | **309 h** | — | — |
| 2 | 1.1 | **Gestión de proyecto** | **105 d** | **10/03/25** | **04/08/25** | **18 h** | — | JP |
| 3 | 1.1.1 | **Inicio de proyecto** | **2 d** | **10/03/25** | **12/03/25** | **4,8 h** | — | JP |
| 4 | 1.1.1.1 | Reunión de arranque con tutor | 0,2 d | 10/03/25 | 10/03/25 | 1,6 h | — | JP |
| 5 | 1.1.1.2 | Planificación de reuniones de seguimiento | 0,2 d | 10/03/25 | 10/03/25 | 1,6 h | 4 | JP |
| 6 | 1.1.1.3 | Definir alcance y objetivos del TFG | 0,2 d | 11/03/25 | 11/03/25 | 1,6 h | 5 | JP |
| 7 | 1.1.2 | **Gestión de fase de documentación** | **0,8 d** | **12/03/25** | **13/03/25** | **1,6 h** | **3** | **JP** |
| 8 | 1.1.2.1 | Definir estructura y estándares de documentación | 0,2 d | 12/03/25 | 12/03/25 | 0,4 h | — | JP |
| 9 | 1.1.2.2 | Control de versiones de documentos (Git) | 0,2 d | 12/03/25 | 12/03/25 | 0,4 h | 8 | JP |
| 10 | 1.1.2.3 | Revisión y validación de documentación con tutor | 0,2 d | 13/03/25 | 13/03/25 | 0,4 h | 9 | JP |
| 11 | 1.1.2.4 | Actualización de documentación tras revisiones | 0,2 d | 13/03/25 | 13/03/25 | 0,4 h | 10 | JP |
| 12 | 1.1.3 | **Gestión de fase de análisis** | **0,8 d** | **13/03/25** | **14/03/25** | **1,6 h** | **7** | **JP** |
| 13 | 1.1.3.1 | Realizar análisis de factibilidad técnica | 0,2 d | 13/03/25 | 13/03/25 | 0,4 h | — | JP |
| 14 | 1.1.3.2 | Elaborar mapeo de procesos y flujos de trabajo actuales | 0,2 d | 13/03/25 | 13/03/25 | 0,4 h | 13 | JP |
| 15 | 1.1.3.3 | Identificar dependencias tecnológicas | 0,2 d | 14/03/25 | 14/03/25 | 0,4 h | 14 | JP |
| 16 | 1.1.3.4 | Evaluar riesgos técnicos | 0,2 d | 14/03/25 | 14/03/25 | 0,4 h | 15 | JP |
| 17 | 1.1.4 | **Adquisición e instalación de infraestructura** | **1 d** | **20/03/25** | **21/03/25** | **2 h** | **12** | **AS** |
| 18 | 1.1.4.1 | Aprovisionar VM Azure (B2s, Ubuntu) y configurar red, firewall y DNS | 0,38 d | 20/03/25 | 20/03/25 | 0,75 h | — | AS |
| 19 | 1.1.4.2 | Instalar y configurar Docker, Nginx, MariaDB, TLS, SonarQube y CI/CD (GitHub Actions) | 0,63 d | 20/03/25 | 21/03/25 | 1,25 h | 18 | AS |
| 20 | 1.1.5 | **Gestión de fase de diseño** | **0,8 d** | **21/03/25** | **25/03/25** | **1,6 h** | **17** | **JP** |
| 21 | 1.1.5.1 | Supervisión de la arquitectura y diseño del sistema | 0,2 d | 21/03/25 | 21/03/25 | 0,4 h | — | JP |
| 22 | 1.1.5.2 | Coordinación entre análisis y diseño | 0,2 d | 21/03/25 | 21/03/25 | 0,4 h | 21 | JP |
| 23 | 1.1.5.3 | Validación del diseño con tutor | 0,2 d | 24/03/25 | 24/03/25 | 0,4 h | 22 | JP |
| 24 | 1.1.5.4 | Planificación del inicio de la fase de construcción | 0,2 d | 25/03/25 | 25/03/25 | 0,4 h | 23 | JP |
| 25 | 1.1.6 | **Gestión de fase de construcción** | **0,8 d** | **26/03/25** | **26/03/25** | **1,6 h** | **20** | **JP** |
| 26 | 1.1.6.1 | Seguimiento y control del desarrollo | 0,2 d | 26/03/25 | 26/03/25 | 0,4 h | — | JP |
| 27 | 1.1.6.2 | Gestión de incidencias y bloqueos | 0,2 d | 26/03/25 | 26/03/25 | 0,4 h | 26 | JP |
| 28 | 1.1.6.3 | Control de versiones y repositorio de código (GitHub) | 0,2 d | 26/03/25 | 26/03/25 | 0,4 h | 27 | JP |
| 29 | 1.1.6.4 | Revisión de calidad de código (SonarQube) | 0,2 d | 26/03/25 | 26/03/25 | 0,4 h | 28 | JP |
| 30 | 1.1.7 | **Gestión de fase de pruebas** | **1 d** | **10/04/25** | **11/04/25** | **2 h** | **29** | **JP** |
| 31 | 1.1.7.1 | Monitoreo del avance del plan de pruebas | 0,2 d | 10/04/25 | 10/04/25 | 0,5 h | — | JP |
| 32 | 1.1.7.2 | Evaluación del impacto de errores críticos | 0,2 d | 10/04/25 | 10/04/25 | 0,5 h | 31 | JP |
| 33 | 1.1.7.3 | Verificación del cumplimiento de criterios de aceptación | 0,2 d | 11/04/25 | 11/04/25 | 0,5 h | 32 | JP |
| 34 | 1.1.7.4 | Documentación de hallazgos y lecciones aprendidas | 0,2 d | 11/04/25 | 11/04/25 | 0,5 h | 33 | JP |
| 35 | 1.1.8 | **Cierre de proyecto** | **2,6 d** | **21/07/25** | **04/08/25** | **4,4 h** | **172** | **JP** |
| 36 | 1.1.8.1 | Comunicar decisión de cierre a tutor | 0,2 d | 21/07/25 | 21/07/25 | 0,4 h | — | JP |
| 37 | 1.1.8.2 | Obtener aprobación del tutor académico | 0,2 d | 21/07/25 | 22/07/25 | 0,4 h | 36 | JP |
| 38 | 1.1.8.3 | Actualizar y consolidar documentación final (memoria TFG) | 0,2 d | 22/07/25 | 22/07/25 | 0,4 h | 37 | JP |
| 39 | 1.1.8.4 | Despliegue definitivo en producción (Azure VM) | 0,2 d | 22/07/25 | 23/07/25 | 0,4 h | 38 | AS |
| 40 | 1.1.8.5 | Validación del sistema en producción con tutor | 0,2 d | 23/07/25 | 23/07/25 | 0,4 h | 39 | JP |
| 41 | 1.1.8.6 | Entrega del código fuente y documentación al tutor | 0,2 d | 23/07/25 | 24/07/25 | 0,4 h | 40 | JP |
| 42 | 1.1.8.7 | Puesta en marcha y validación con usuarios piloto (EII) | 0,2 d | 24/07/25 | 24/07/25 | 0,4 h | 41 | JP |
| 43 | 1.1.8.8 | Cierre académico del proyecto (TFG presentado) | 0,2 d | 01/08/25 | 04/08/25 | 0,4 h | 42 | JP |
| 44 | 1.1.8.9 | Evaluación de cumplimiento de objetivos del TFG | 0,2 d | 04/08/25 | 04/08/25 | 0,4 h | 43 | JP |
| 45 | 1.1.8.10 | Recopilación de lecciones aprendidas | 0,2 d | 04/08/25 | 04/08/25 | 0,4 h | 44 | JP |

---

### 1.2 Fase de documentación

| ID | EDT | Nombre de tarea | Dur. | Inicio | Fin | Horas | Pred. | Recurso |
|----|-----|-----------------|------|--------|-----|-------|-------|---------|
| 51 | 1.2 | **Fase de documentación** | **5 d** | **10/03/25** | **17/03/25** | **40 h** | **3** | **DS** |
| 52 | 1.2.1 | Memoria del TFG (introducción, análisis, diseño, implementación, conclusiones) | 2 d | 10/03/25 | 12/03/25 | 16 h | — | DS |
| 53 | 1.2.2 | Manual de instalación y configuración (Docker, Azure VM, variables de entorno) | 0,75 d | 12/03/25 | 13/03/25 | 6 h | 52 | DS |
| 54 | 1.2.3 | Manual de usuario (administrador, profesor, usuario anónimo) | 0,75 d | 13/03/25 | 14/03/25 | 6 h | 53 | DS |
| 55 | 1.2.4 | Documentación de la API REST (endpoints, autenticación, ejemplos de uso) | 0,75 d | 14/03/25 | 17/03/25 | 6 h | 54 | DS |
| 56 | 1.2.5 | Documentación de terceros (Google Calendar API, OAuth 2.0, TypeORM, MariaDB) | 0,75 d | 17/03/25 | 17/03/25 | 6 h | 55 | DS |

---

### 1.3 Fase de análisis del sistema

| ID | EDT | Nombre de tarea | Dur. | Inicio | Fin | Horas | Pred. | Recurso |
|----|-----|-----------------|------|--------|-----|-------|-------|---------|
| 57 | 1.3 | **Fase de análisis del sistema** | **5 d** | **17/03/25** | **24/03/25** | **28 h** | **51** | — |
| 58 | 1.3.1 | Documentar la situación actual del sistema (procesos manuales con Excel en la EII) | 0,63 d | 17/03/25 | 17/03/25 | 5 h | — | ANS |
| 59 | 1.3.2 | Definir el alcance del sistema (límites, entidades externas, exclusiones) | 0,63 d | 17/03/25 | 18/03/25 | 3 h | 58 | ANS |
| 60 | 1.3.3 | Elaborar estudio de alternativas tecnológicas (monolito vs microservicios, BDs, frameworks) | 0,63 d | 18/03/25 | 18/03/25 | 3 h | 59 | CT |
| 61 | 1.3.4 | Seleccionar el stack tecnológico (React 19, Express 5, TypeORM, MariaDB, Docker) | 0,63 d | 18/03/25 | 19/03/25 | 3 h | 60 | CT |
| 62 | 1.3.5 | Elaborar análisis de requisitos funcionales y no funcionales (SRS, ISO/IEC 25010) | 0,63 d | 19/03/25 | 19/03/25 | 5 h | 61 | ANS |
| 63 | 1.3.6 | Evaluar los riesgos del proyecto (técnicos, integración, seguridad) | 0,63 d | 19/03/25 | 20/03/25 | 3 h | 62 | ANS |
| 64 | 1.3.7 | Identificar los módulos del sistema (13 módulos funcionales) | 0,31 d | 20/03/25 | 20/03/25 | 3 h | 63 | ANS |
| 65 | 1.3.8 | Elaborar los modelos de datos (ERD, entidades de dominio) | 0,63 d | 20/03/25 | 24/03/25 | 3 h | 64 | ARQ |

---

### 1.4 Fase de diseño y arquitectura

| ID | EDT | Nombre de tarea | Dur. | Inicio | Fin | Horas | Pred. | Recurso |
|----|-----|-----------------|------|--------|-----|-------|-------|---------|
| 66 | 1.4 | **Fase de diseño y arquitectura** | **5 d** | **24/03/25** | **31/03/25** | **24 h** | **57** | — |
| 67 | 1.4.1 | Diseñar la arquitectura del sistema (microservicios: Gateway, Auth, User, Planner) | 1 d | 24/03/25 | 25/03/25 | 6 h | 65 | ARQ |
| 68 | 1.4.2 | Diseñar los casos de uso (diagrama UML, actores: admin, profesor, anónimo) | 0,63 d | 25/03/25 | 26/03/25 | 4 h | 67 | ANS |
| 69 | 1.4.3 | Elaborar diagramas de estado (eventos periódicos, solicitudes de eventos) | 0,63 d | 26/03/25 | 26/03/25 | 4 h | 68 | DS |
| 70 | 1.4.4 | Elaborar diagramas de flujo (autenticación OAuth, importación CSV, workflow solicitudes) | 0,63 d | 26/03/25 | 27/03/25 | 4 h | 69 | DS |
| 71 | 1.4.5 | Diseñar las interfaces de usuario (wireframes, componentes React, Tailwind CSS 4) | 0,63 d | 27/03/25 | 28/03/25 | 3 h | 70 | DS |
| 72 | 1.4.6 | Crear prototipos iniciales (maquetas de las páginas principales de la SPA) | 0,63 d | 28/03/25 | 31/03/25 | 3 h | 71 | DS |

---

### 1.5 Fase de construcción

| ID | EDT | Nombre de tarea | Dur. | Inicio | Fin | Horas | Pred. | Recurso |
|----|-----|-----------------|------|--------|-----|-------|-------|---------|
| 73 | 1.5 | **Fase de construcción** | **57 d** | **31/03/25** | **17/07/25** | **162 h** | **66** | — |

#### 1.5.1 Gateway Service

> Proxy API centralizado (Express 5) que enruta las peticiones hacia los tres microservicios internos. Implementa CORS, rate limiting y health checks.

| ID | EDT | Nombre de tarea | Dur. | Inicio | Fin | Horas | Pred. | Recurso |
|----|-----|-----------------|------|--------|-----|-------|-------|---------|
| 74 | 1.5.1 | **Gateway Service** | **2,63 d** | **31/03/25** | **03/04/25** | **10 h** | **73** | **DS** |
| 75 | 1.5.1.1 | Configuración del servidor Express 5 y estructura base | 0,5 d | 31/03/25 | 01/04/25 | 2 h | — | DS |
| 76 | 1.5.1.2 | Middleware (CORS, JSON, rate limiting, logging) | 0,5 d | 01/04/25 | 01/04/25 | 2 h | 75 | DS |
| 77 | 1.5.1.3 | Proxy hacia Auth Service, User Service y Planner Service | 0,75 d | 01/04/25 | 02/04/25 | 3 h | 76 | DS |
| 78 | 1.5.1.4 | Proxying de subida de ficheros (Multer, Excel/CSV para importación) | 0,5 d | 02/04/25 | 03/04/25 | 2 h | 77 | DS |
| 79 | 1.5.1.5 | Health checks y validación de integración con los tres servicios | 0,13 d | 03/04/25 | 03/04/25 | 1 h | 78 | DS |

#### 1.5.2 Auth Service

> Microservicio de autenticación y autorización. JWT, Google OAuth 2.0, OTP para recuperación de contraseña, activación de cuentas por email.

| ID | EDT | Nombre de tarea | Dur. | Inicio | Fin | Horas | Pred. | Recurso |
|----|-----|-----------------|------|--------|-----|-------|-------|---------|
| 80 | 1.5.2 | **Auth Service** | **4,5 d** | **03/04/25** | **09/04/25** | **18 h** | **74** | **DS** |
| 81 | 1.5.2.1 | Configuración base del servicio (Express 5, TypeORM, MariaDB, estructura) | 0,5 d | 03/04/25 | 03/04/25 | 2 h | — | DS |
| 82 | 1.5.2.2 | Modelado de la entidad Usuario (roles: ADMIN, PROFESSOR, COORDINATOR) | 0,5 d | 03/04/25 | 04/04/25 | 2 h | 81 | DS |
| 83 | 1.5.2.3 | Login con JWT (emisión, validación y renovación de tokens) | 0,5 d | 04/04/25 | 04/04/25 | 2 h | 82 | DS |
| 84 | 1.5.2.4 | Logout y revocación de sesión | 0,25 d | 04/04/25 | 04/04/25 | 1 h | 83 | DS |
| 85 | 1.5.2.5 | Encriptación de contraseñas con bcrypt y validación de entrada (Zod) | 0,25 d | 04/04/25 | 07/04/25 | 1 h | 84 | DS |
| 86 | 1.5.2.6 | Recuperación de contraseña: envío de OTP por email (Nodemailer) | 0,5 d | 07/04/25 | 07/04/25 | 2 h | 85 | DS |
| 87 | 1.5.2.7 | Verificación de OTP y reset de contraseña | 0,25 d | 07/04/25 | 08/04/25 | 1 h | 86 | DS |
| 88 | 1.5.2.8 | Activación de cuenta por token (email de bienvenida al crear usuario) | 0,25 d | 08/04/25 | 08/04/25 | 1 h | 87 | DS |
| 89 | 1.5.2.9 | Integración con Google OAuth 2.0 (inicio de flujo, callback, tokens) | 0,5 d | 08/04/25 | 08/04/25 | 2 h | 88 | DS |
| 90 | 1.5.2.10 | Desconexión de cuenta Google y gestión del estado de vinculación | 0,25 d | 08/04/25 | 09/04/25 | 1 h | 89 | DS |
| 91 | 1.5.2.11 | Middleware de validación de tokens (reutilizable por otros microservicios) | 0,25 d | 09/04/25 | 09/04/25 | 1 h | 90 | DS |
| 92 | 1.5.2.12 | Pruebas de autenticación, seguridad y casos de error | 0,5 d | 09/04/25 | 09/04/25 | 2 h | 91 | DS |

#### 1.5.3 User Service

> Microservicio de gestión de usuarios. CRUD completo, importación masiva desde CSV, búsqueda y filtrado, envío de emails de activación.

| ID | EDT | Nombre de tarea | Dur. | Inicio | Fin | Horas | Pred. | Recurso |
|----|-----|-----------------|------|--------|-----|-------|-------|---------|
| 93 | 1.5.3 | **User Service** | **2,13 d** | **09/04/25** | **11/04/25** | **15 h** | **80** | **DS** |
| 94 | 1.5.3.1 | Configuración base del servicio (Express 5, TypeORM, conexión a BD) | 0,25 d | 09/04/25 | 09/04/25 | 2 h | — | DS |
| 95 | 1.5.3.2 | Modelado de datos y roles de usuario (sincronizado con Auth Service) | 0,25 d | 09/04/25 | 10/04/25 | 1 h | 94 | DS |
| 96 | 1.5.3.3 | CRUD de usuarios (crear, leer, actualizar, eliminar con validaciones) | 0,25 d | 10/04/25 | 10/04/25 | 2 h | 95 | DS |
| 97 | 1.5.3.4 | Gestión de roles y permisos (asignación, cambio de rol, restricciones) | 0,25 d | 10/04/25 | 10/04/25 | 2 h | 96 | DS |
| 98 | 1.5.3.5 | Búsqueda y filtrado de usuarios (por nombre, email, rol, estado activación) | 0,25 d | 10/04/25 | 11/04/25 | 1 h | 97 | DS |
| 99 | 1.5.3.6 | Previsualización de importación CSV (validación sin persistir) | 0,25 d | 11/04/25 | 11/04/25 | 2 h | 98 | DS |
| 100 | 1.5.3.7 | Importación masiva de usuarios desde CSV (parseo, validación y persistencia) | 0,25 d | 11/04/25 | 11/04/25 | 2 h | 99 | DS |
| 101 | 1.5.3.8 | Envío de email de activación al crear o importar usuarios (Nodemailer) | 0,25 d | 11/04/25 | 11/04/25 | 1 h | 100 | DS |
| 102 | 1.5.3.9 | Exportar lista de usuarios a CSV y ejecutar pruebas del servicio (unitarias e integración) | 0,25 d | 11/04/25 | 11/04/25 | 2 h | 101 | DS |

#### 1.5.4 Planner Service

> Núcleo de negocio del sistema. Gestiona calendarios académicos, titulaciones, asignaturas, grupos, aulas, eventos (puntuales y periódicos), solicitudes de eventos (workflow profesor → admin) e integración con Google Calendar. Microservicio más complejo: controller principal ~3.889 líneas.

| ID | EDT | Nombre de tarea | Dur. | Inicio | Fin | Horas | Pred. | Recurso |
|----|-----|-----------------|------|--------|-----|-------|-------|---------|
| 104 | 1.5.4 | **Planner Service** | **42 d** | **11/04/25** | **10/06/25** | **99 h** | **93** | **DS; CT** |

##### 1.5.4.1 — Configuración base

| ID | EDT | Nombre de tarea | Dur. | Inicio | Fin | Horas | Pred. | Recurso |
|----|-----|-----------------|------|--------|-----|-------|-------|---------|
| 105 | 1.5.4.1 | **Configuración base e infraestructura** | **0,63 d** | **11/04/25** | **11/04/25** | **5 h** | **104** | **DS** |
| 106 | 1.5.4.1.1 | Configuración del servidor Express 5, TypeORM y BD de planificación (MariaDB) | 0,25 d | 11/04/25 | 11/04/25 | 2 h | — | DS |
| 107 | 1.5.4.1.2 | Modelado de entidades de dominio (Calendar, Day, Subject, Group, Classroom, Degree) | 0,25 d | 11/04/25 | 11/04/25 | 2 h | 106 | DS |
| 108 | 1.5.4.1.3 | Implementar entidad base de auditoría (AuditedEntity: createdBy, updatedBy, timestamps) | 0,13 d | 11/04/25 | 11/04/25 | 1 h | 107 | DS |

##### 1.5.4.2 — Gestión de titulaciones y cursos

| ID | EDT | Nombre de tarea | Dur. | Inicio | Fin | Horas | Pred. | Recurso |
|----|-----|-----------------|------|--------|-----|-------|-------|---------|
| 109 | 1.5.4.2 | **Gestión de titulaciones y cursos** | **1 d** | **14/04/25** | **15/04/25** | **6 h** | **105** | **DS** |
| 110 | 1.5.4.2.1 | CRUD de titulaciones (Degree: nombre, acrónimo, relaciones con cursos) | 0,38 d | 14/04/25 | 14/04/25 | 2 h | 108 | DS |
| 111 | 1.5.4.2.2 | CRUD de cursos académicos (Course: año de inicio, relación con Degree y Calendars) | 0,38 d | 14/04/25 | 15/04/25 | 2 h | 110 | DS |
| 112 | 1.5.4.2.3 | Validaciones de integridad referencial entre titulaciones, cursos y calendarios | 0,25 d | 15/04/25 | 15/04/25 | 2 h | 111 | DS |

##### 1.5.4.3 — Gestión de asignaturas

| ID | EDT | Nombre de tarea | Dur. | Inicio | Fin | Horas | Pred. | Recurso |
|----|-----|-----------------|------|--------|-----|-------|-------|---------|
| 113 | 1.5.4.3 | **Gestión de asignaturas** | **1 d** | **15/04/25** | **16/04/25** | **6 h** | **109** | **DS** |
| 114 | 1.5.4.3.1 | CRUD de asignaturas (Subject: nombre, acrónimo, semestre, año, código SIES) | 0,38 d | 15/04/25 | 15/04/25 | 2 h | 112 | DS |
| 115 | 1.5.4.3.2 | Implementar relaciones asignatura–titulación y asignatura–calendario | 0,38 d | 15/04/25 | 16/04/25 | 2 h | 114 | DS |
| 116 | 1.5.4.3.3 | Consulta de asignaturas con grupos asociados (endpoint enriquecido) | 0,25 d | 16/04/25 | 16/04/25 | 2 h | 115 | DS |

##### 1.5.4.4 — Gestión de grupos de asignaturas

| ID | EDT | Nombre de tarea | Dur. | Inicio | Fin | Horas | Pred. | Recurso |
|----|-----|-----------------|------|--------|-----|-------|-------|---------|
| 117 | 1.5.4.4 | **Gestión de grupos de asignaturas** | **1 d** | **16/04/25** | **22/04/25** | **6 h** | **113** | **DS** |
| 118 | 1.5.4.4.1 | CRUD de grupos (Group: número, tipo —teórico/práctico/lab—, idioma, horas planificadas) | 0,38 d | 16/04/25 | 17/04/25 | 2 h | 116 | DS |
| 119 | 1.5.4.4.2 | Implementar relaciones grupo–asignatura y grupo–calendario | 0,38 d | 17/04/25 | 22/04/25 | 2 h | 118 | DS |
| 120 | 1.5.4.4.3 | Validación de horas planificadas por grupo (presupuesto de horas) | 0,25 d | 22/04/25 | 22/04/25 | 2 h | 119 | DS |

##### 1.5.4.5 — Gestión de aulas

| ID | EDT | Nombre de tarea | Dur. | Inicio | Fin | Horas | Pred. | Recurso |
|----|-----|-----------------|------|--------|-----|-------|-------|---------|
| 121 | 1.5.4.5 | **Gestión de aulas** | **0,5 d** | **22/04/25** | **23/04/25** | **4 h** | **117** | **DS** |
| 122 | 1.5.4.5.1 | CRUD de aulas (Classroom: código, URL de localización GIS) | 0,25 d | 22/04/25 | 22/04/25 | 2 h | 120 | DS |
| 123 | 1.5.4.5.2 | Validación de disponibilidad de aulas y detección de conflictos | 0,25 d | 22/04/25 | 23/04/25 | 2 h | 122 | DS |

##### 1.5.4.6 — Gestión de calendarios académicos

| ID | EDT | Nombre de tarea | Dur. | Inicio | Fin | Horas | Pred. | Recurso |
|----|-----|-----------------|------|--------|-----|-------|-------|---------|
| 124 | 1.5.4.6 | **Gestión de calendarios académicos** | **2 d** | **23/04/25** | **25/04/25** | **10 h** | **121** | **DS** |
| 125 | 1.5.4.6.1 | CRUD de calendarios (Calendar: fecha inicio/fin, semestre, caracteres en uso) | 0,5 d | 23/04/25 | 23/04/25 | 3 h | 123 | DS |
| 126 | 1.5.4.6.2 | Gestión de días lectivos (Day: carácter del día P/I/Custom, festivos) | 0,5 d | 23/04/25 | 24/04/25 | 3 h | 125 | DS |
| 127 | 1.5.4.6.3 | Duplicación de calendarios existentes (copia estructural completa) | 0,5 d | 24/04/25 | 24/04/25 | 2 h | 126 | DS |
| 128 | 1.5.4.6.4 | Obtención de calendarios activos y filtrado por semestre/titulación | 0,25 d | 24/04/25 | 25/04/25 | 1 h | 127 | DS |
| 129 | 1.5.4.6.5 | Vista pública del calendario (endpoint sin autenticación para alumnos) | 0,25 d | 25/04/25 | 25/04/25 | 1 h | 128 | DS |

##### 1.5.4.7 — Importación y exportación de calendarios

| ID | EDT | Nombre de tarea | Dur. | Inicio | Fin | Horas | Pred. | Recurso |
|----|-----|-----------------|------|--------|-----|-------|-------|---------|
| 130 | 1.5.4.7 | **Importación y exportación de calendarios (Excel/CSV/ZIP)** | **2 d** | **25/04/25** | **29/04/25** | **10 h** | **124** | **DS; CT** |
| 131 | 1.5.4.7.1 | Parseo y validación de archivos Excel/CSV con estructura de eventos académicos | 0,5 d | 25/04/25 | 28/04/25 | 3 h | 129 | DS |
| 132 | 1.5.4.7.2 | Importación de calendarios completos desde fichero (creación masiva de días y eventos) | 0,5 d | 28/04/25 | 28/04/25 | 3 h | 131 | DS |
| 133 | 1.5.4.7.3 | Importación de excepciones de eventos (festivos, modificaciones puntuales) | 0,5 d | 28/04/25 | 29/04/25 | 2 h | 132 | DS |
| 134 | 1.5.4.7.4 | Exportación del calendario a ZIP y gestión de errores de importación | 0,5 d | 29/04/25 | 29/04/25 | 2 h | 133 | DS |

##### 1.5.4.8 — Gestión de eventos puntuales

| ID | EDT | Nombre de tarea | Dur. | Inicio | Fin | Horas | Pred. | Recurso |
|----|-----|-----------------|------|--------|-----|-------|-------|---------|
| 135 | 1.5.4.8 | **Gestión de eventos puntuales** | **2,25 d** | **29/04/25** | **02/05/25** | **12 h** | **130** | **DS** |
| 136 | 1.5.4.8.1 | Modelado de eventos puntuales (PuntualEvent: día, hora inicio/fin, tipo, comentario) | 0,38 d | 29/04/25 | 29/04/25 | 2 h | 134 | DS |
| 137 | 1.5.4.8.2 | CRUD de eventos puntuales (crear, leer, actualizar, eliminar) | 0,5 d | 29/04/25 | 30/04/25 | 3 h | 136 | DS |
| 138 | 1.5.4.8.3 | Implementar tipos de evento: NORMAL, BLOCKER, REVISION, EVALUACION (contabilización de horas) | 0,38 d | 30/04/25 | 30/04/25 | 2 h | 137 | DS |
| 139 | 1.5.4.8.4 | Cancelación y reemplazo de eventos puntuales | 0,38 d | 30/04/25 | 02/05/25 | 2 h | 138 | DS |
| 140 | 1.5.4.8.5 | Implementar utilidad de detección de conflictos entre eventos (ConflictError, helpers) | 0,25 d | 02/05/25 | 02/05/25 | 2 h | 139 | DS |
| 141 | 1.5.4.8.6 | Integrar detección de conflictos en la creación de eventos puntuales y periódicos | 0,13 d | 02/05/25 | 02/05/25 | 1 h | 140 | DS |

##### 1.5.4.9 — Gestión de eventos periódicos

| ID | EDT | Nombre de tarea | Dur. | Inicio | Fin | Horas | Pred. | Recurso |
|----|-----|-----------------|------|--------|-----|-------|-------|---------|
| 142 | 1.5.4.9 | **Gestión de eventos periódicos** | **2 d** | **05/05/25** | **06/05/25** | **10 h** | **135** | **DS** |
| 143 | 1.5.4.9.1 | Modelado de eventos periódicos (PeriodicEvent: día semana, hora, carácter de evento) | 0,38 d | 05/05/25 | 05/05/25 | 2 h | 141 | DS |
| 144 | 1.5.4.9.2 | Implementar el sistema de caracteres: Normal (N), Par (P), Impar (I) y Custom (A, B, C...) | 0,5 d | 05/05/25 | 05/05/25 | 3 h | 143 | DS |
| 145 | 1.5.4.9.3 | Lógica de horas planificadas y round-robin entre eventos del mismo grupo | 0,5 d | 05/05/25 | 06/05/25 | 3 h | 144 | DS |
| 146 | 1.5.4.9.4 | CRUD de eventos periódicos y generación del calendario (filtrarPorHorasProgramadas) | 0,63 d | 06/05/25 | 06/05/25 | 2 h | 145 | DS |

##### 1.5.4.10 — Módulo de solicitudes de eventos (workflow)

| ID | EDT | Nombre de tarea | Dur. | Inicio | Fin | Horas | Pred. | Recurso |
|----|-----|-----------------|------|--------|-----|-------|-------|---------|
| 147 | 1.5.4.10 | **Módulo de solicitudes de eventos (workflow profesor → admin)** | **2 d** | **06/05/25** | **08/05/25** | **10 h** | **142; 124** | **DS** |
| 148 | 1.5.4.10.1 | Modelado de EventRequest (tipos: CREATE, EDIT, CANCEL; estados: PENDING, APPROVED, REJECTED) | 0,38 d | 06/05/25 | 07/05/25 | 2 h | 146 | DS |
| 149 | 1.5.4.10.2 | Solicitud de creación, edición o cancelación de evento por el profesor | 0,5 d | 07/05/25 | 07/05/25 | 3 h | 148 | DS |
| 150 | 1.5.4.10.3 | Listado de solicitudes para administrador y para el profesor solicitante | 0,25 d | 07/05/25 | 07/05/25 | 1 h | 149 | DS |
| 151 | 1.5.4.10.4 | Aprobación de solicitudes: creación/edición/cancelación del evento resultante | 0,5 d | 07/05/25 | 08/05/25 | 3 h | 150 | DS |
| 152 | 1.5.4.10.5 | Rechazo de solicitudes con motivo y notificación al profesor | 0,25 d | 08/05/25 | 08/05/25 | 1 h | 151 | DS |

##### 1.5.4.11 — Integración con Google Calendar

| ID | EDT | Nombre de tarea | Dur. | Inicio | Fin | Horas | Pred. | Recurso |
|----|-----|-----------------|------|--------|-----|-------|-------|---------|
| 153 | 1.5.4.11 | **Integración con Google Calendar (OAuth 2.0 + sincronización)** | **6,25 d** | **08/05/25** | **19/05/25** | **21 h** | **147; 91** | **DS; CT** |
| 154 | 1.5.4.11.1 | Configuración de Google Calendar API v3 y credenciales OAuth 2.0 | 0,63 d | 08/05/25 | 09/05/25 | 3 h | 152 | DS |
| 155 | 1.5.4.11.2 | Sincronización de eventos del TeachingPlanner hacia Google Calendar del usuario | 1 d | 09/05/25 | 12/05/25 | 4 h | 154 | DS |
| 156 | 1.5.4.11.3 | Gestión de tokens de acceso y refresco (almacenamiento seguro, renovación automática) | 0,63 d | 12/05/25 | 13/05/25 | 3 h | 155 | DS |
| 157 | 1.5.4.11.4 | Entidad CalendarSync: control de calendarios sincronizados y cuenta Google vinculada | 0,5 d | 13/05/25 | 13/05/25 | 2 h | 156 | DS |
| 158 | 1.5.4.11.5 | Implementar job de sincronización periódica con Google Calendar (runCalendarSync, resetStuckSyncs, intervalo 5 min) | 0,5 d | 13/05/25 | 14/05/25 | 2 h | 157 | DS |
| 159 | 1.5.4.11.6 | Implementar arquitectura de calendarios por aula en Google (GoogleClassroomCalendar: un calendario Google por aula) | 0,38 d | 14/05/25 | 15/05/25 | 2 h | 157 | DS |
| 160 | 1.5.4.11.7 | Desvinculación de cuenta Google y limpieza de tokens | 0,25 d | 15/05/25 | 16/05/25 | 2 h | 158; 159 | DS |
| 161 | 1.5.4.11.8 | Pruebas de integración con Google Calendar (creación, actualización, eliminación) | 0,75 d | 16/05/25 | 19/05/25 | 3 h | 160 | DS |

#### 1.5.5 Frontend — SPA React 19

> Aplicación web de página única desarrollada con React 19, TypeScript, Vite 6, Tailwind CSS 4 y Radix UI. ~19 páginas y ~40 hooks de comunicación con la API.

| ID | EDT | Nombre de tarea | Dur. | Inicio | Fin | Horas | Pred. | Recurso |
|----|-----|-----------------|------|--------|-----|-------|-------|---------|
| 162 | 1.5.5 | **Frontend — SPA React 19** | **17 d** | **31/03/25** | **17/07/25** | **21 h** | **73CC** | **DS** |
| 163 | 1.5.5.1 | Configuración del proyecto React 19 + Vite 6 + TypeScript + Tailwind CSS 4 | 0,25 d | 31/03/25 | 31/03/25 | 1 h | — | DS |
| 164 | 1.5.5.2 | React Router, React Query y estructura de páginas | 0,25 d | 31/03/25 | 01/04/25 | 1 h | 163 | DS |
| 165 | 1.5.5.3 | Capa de hooks de comunicación con la API (~40 hooks) | 0,5 d | 01/04/25 | 01/04/25 | 2 h | 164 | DS |
| 166 | 1.5.5.4 | Páginas de autenticación (login, registro, recuperación de contraseña, activación de cuenta) | 0,5 d | 01/04/25 | 02/04/25 | 2 h | 165 | DS |
| 167 | 1.5.5.5 | Páginas de gestión de usuarios (listado, creación, edición, importación CSV) | 0,5 d | 02/04/25 | 02/04/25 | 2 h | 166 | DS |
| 168 | 1.5.5.6 | Páginas de gestión académica (titulaciones, cursos, asignaturas, grupos, aulas) | 0,75 d | 02/04/25 | 03/04/25 | 3 h | 167 | DS |
| 169 | 1.5.5.7 | Páginas de gestión de calendarios (crear, duplicar, importar, exportar) | 0,5 d | 03/04/25 | 03/04/25 | 2 h | 168 | DS |
| 170 | 1.5.5.8 | Vista del calendario con eventos (puntual y periódico) | 0,5 d | 03/04/25 | 04/04/25 | 2 h | 169 | DS |
| 171 | 1.5.5.9 | Páginas de solicitudes de eventos (formulario profesor + panel admin) | 0,5 d | 04/04/25 | 04/04/25 | 2 h | 170 | DS |
| 172 | 1.5.5.10 | Integración con Google Calendar en la UI (conectar/desconectar cuenta Google) | 0,25 d | 04/04/25 | 07/04/25 | 1 h | 171 | DS |
| 173 | 1.5.5.11 | Desarrollar página de sincronización con Google Calendar (CalendarSyncPage: activar/desactivar, progreso, sincronización manual) | 0,25 d | 07/04/25 | 07/04/25 | 1 h | 172 | DS |
| 174 | 1.5.5.12 | Vista pública del calendario (acceso sin autenticación para alumnos) | 0,25 d | 07/04/25 | 08/04/25 | 1 h | 173 | DS |
| 175 | 1.5.5.13 | Ajustes de UX, responsividad y corrección de estilos Tailwind | 0,25 d | 08/04/25 | 17/07/25 | 1 h | 174 | DS |

---

### 1.6 Fase de pruebas y depuración

> **Nota:** Esta fase se ejecuta en paralelo con la construcción (dependencia CC respecto a ID 73). Los tests unitarios y de integración acompañan cada módulo; las fechas indicadas corresponden a la ejecución formal del plan de pruebas completo al final del desarrollo.

| ID | EDT | Nombre de tarea | Dur. | Inicio | Fin | Horas | Pred. | Recurso |
|----|-----|-----------------|------|--------|-----|-------|-------|---------|
| 176 | 1.6 | **Fase de pruebas y depuración** | **4,25 d** | **07/07/25** | **11/07/25** | **30 h** | **73CC** | — |
| 177 | 1.6.1 | Pruebas unitarias (servicios, helpers, lógica de negocio) | 0,38 d | 07/07/25 | 07/07/25 | 5 h | — | T |
| 178 | 1.6.2 | Pruebas de integración (cascada de borrado en base de datos: Calendar, Classroom; Testcontainers + Jest) | 0,38 d | 07/07/25 | 08/07/25 | 5 h | 177 | T |
| 179 | 1.6.3 | Pruebas de aceptación (validación contra los requisitos funcionales del SRS) | 0,38 d | 08/07/25 | 08/07/25 | 5 h | 178 | T |
| 180 | 1.6.4 | Pruebas E2E con Playwright (autenticación, titulaciones, cursos, asignaturas, aulas; CI isolation) | 0,38 d | 08/07/25 | 09/07/25 | 8 h | 179 | T |
| 181 | 1.6.5 | Pruebas de seguridad (JWT, OAuth 2.0, inyección SQL, OWASP básico) | 0,38 d | 09/07/25 | 10/07/25 | 4 h | 180 | T; AS |
| 182 | 1.6.6 | Corrección de errores detectados y regresión final | 1,25 d | 10/07/25 | 11/07/25 | 3 h | 181 | DS |

---

## 4. Resumen de horas por fase

| Fase | Horas |
|------|-------|
| 1.1 Gestión de proyecto | 18 h |
| 1.2 Documentación | 40 h |
| 1.3 Análisis | 28 h |
| 1.4 Diseño | 24 h |
| 1.5.1 Gateway Service | 10 h |
| 1.5.2 Auth Service | 18 h |
| 1.5.3 User Service | 14 h |
| 1.5.4 Planner Service | 106 h |
| 1.5.5 Frontend SPA | 21 h |
| 1.6 Pruebas y depuración | 30 h |
| **TOTAL** | **309 h** |

---

## 5. Recursos asignados y horas por rol

| Recurso | Horas estimadas |
|---------|----------------|
| Jefe de proyecto (JP) | 18 h |
| Analista de sistemas (ANS) | 19 h |
| Arquitecto de software (ARQ) | 13 h |
| Consultor de tecnología (CT) | 14 h |
| Desarrollador (DS) | 204 h |
| Tester (T) | 27 h |
| Administrador de Sistemas (AS) | 14 h |
| **TOTAL** | **309 h** |

---

## 6. Instrucciones para importar en Microsoft Project 2019

### Pasos de importación recomendados

1. **Abrir MS Project 2019** → Nuevo proyecto en blanco
2. **Configurar el calendario del proyecto:**
   - Archivo → Propiedades → Información del proyecto
   - Fecha de inicio: **10/03/2025**
   - Calendario base: **Estándar** (lun–vie, 8h/día)
3. **Introducir las tareas manualmente** siguiendo la tabla de la sección 3:
   - La columna **EDT** define el nivel de sangría de cada tarea en MS Project (p.ej. `1.5.4.1` tiene 4 niveles de sangría)
   - La columna **Dur.** va en días (MS Project usa días laborables por defecto)
   - La columna **Pred.** se introduce en la columna "Predecesoras" de MS Project
   - La columna **Horas** va en la columna "Trabajo" de MS Project
4. **Asignar recursos:**
   - Recurso → Hoja de recursos → Introducir los roles de la sección 1
   - Asignar a cada tarea el recurso indicado en la columna "Recurso"
5. **Configurar predecesoras con tipo CC (Comienzo a comienzo):**
   - En MS Project: doble clic sobre la tarea → Predecesoras → Tipo: "Comienzo a comienzo"
   - Las predecesoras marcadas con CC en la sección 3 son: `73CC` (frontend con construcción) y `73CC` (fase de pruebas con construcción)

### Columnas a usar en MS Project

| Columna MS Project | Equivalente en esta planificación |
|-------------------|-----------------------------------|
| Id | ID |
| Número de esquema | EDT |
| Nombre de tarea | Nombre de tarea |
| Duración | Dur. (en días) |
| Comienzo | Inicio |
| Fin | Fin |
| Trabajo | Horas |
| Predecesoras | Pred. |
| Nombres de los recursos | Recurso |

---

## 7. Hitos clave

| Hito | Fecha | Descripción |
|------|-------|-------------|
| H1 | 10/03/25 | Inicio del proyecto — reunión de arranque con tutor |
| H2 | 17/03/25 | Documentación base completada |
| H3 | 24/03/25 | Análisis del sistema completado, SRS aprobado |
| H4 | 31/03/25 | Diseño y arquitectura completados, inicio de construcción |
| H5 | 03/04/25 | Gateway Service operativo |
| H6 | 09/04/25 | Auth Service completado (JWT + Google OAuth 2.0) |
| H7 | 11/04/25 | User Service completado |
| H8 | 15/05/25 | Planner Service completado (todos los módulos, incluido Google Calendar) |
| H9 | 17/07/25 | Frontend SPA completado |
| H10 | 11/07/25 | Fase de pruebas completada |
| H11 | 04/08/25 | Sistema desplegado en producción, proyecto cerrado |

---

## 8. Gestión de riesgos

| ID | Riesgo | Prob. | Impacto | Mitigación |
|----|--------|-------|---------|------------|
| R1 | Cambios en la API de Google Calendar (deprecaciones) | Media | Alto | Encapsular integración en `google-calendar.service.ts`; monitorizar changelog |
| R2 | Complejidad del sistema de caracteres de eventos (N/P/I/Custom) | Alta | Alto | Tests unitarios exhaustivos para `filtrarPorHorasProgramadas` |
| R3 | Conflictos de versiones entre dependencias (React 19, Express 5, TypeORM) | Media | Medio | Fijar versiones en `package.json`; pipeline CI/CD en GitHub Actions |
| R4 | Pérdida de datos en migraciones TypeORM | Baja | Crítico | Revisión manual de cada migración antes de aplicar en producción |
| R5 | Tests E2E con Playwright inestables (flaky tests) | Alta | Medio | Reintentos automáticos en CI; aislamiento de la BD de test |
| R6 | Desviación de la fecha de entrega del TFG | Media | Alto | Buffer de 2 semanas en la planificación; seguimiento semanal de progreso |

---

*Planificación del Trabajo de Fin de Grado — Escuela de Ingeniería Informática, Universidad de Oviedo.*
*Última actualización: 19/04/2026 — Revisión: verbos imperativos en tareas, fusión de subtareas granulares de infraestructura y User Service, incorporación de AuditedEntity, ConflictUtils, CalendarSync job, GoogleClassroomCalendar y CalendarSyncPage; corrección de fechas de cierre (1.1.8) y fase de pruebas (1.6); total 309 h.*
