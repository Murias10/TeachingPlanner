# Chapter 9: APPENDICES (APÉNDICES)

This chapter contains supplementary material that supports the main body of the document. Section 9.1 presents the full Risk Management Plan referenced in Chapter 2. Section 9.2 lists the references cited throughout the document. Section 9.3 describes the structure and contents of the deliverable annexed to this project.

## 9.1 Risk Management Plan

This section details the risk management methodology applied to TeachingPlanner. The risk register, identification table, and contingency plan derived from this process are presented in Section 2.1.7 of the main document.

### 9.1.1 Methodology

Risk management for this project is structured around two sequential phases. The first is risk assessment, which covers the identification, analysis, and prioritisation of any event or condition that could affect the project. The second is risk control, which defines the response strategy for each risk and monitors those risks throughout the project lifecycle. This separation ensures that risks are fully understood before any decisions are made about how to handle them.

### 9.1.2 Risk Assessment

#### 9.1.2.1 Risk Identification

Risk identification was carried out during the analysis phase. The approach was to systematically consider any event or condition that could affect the project positively or negatively across four dimensions: budget, planning, scope, and quality. Particular attention was paid to the specific characteristics of this project: a single developer managing all roles, a real institutional client, a technically complex domain, and a dependency on external infrastructure and third-party APIs.

A total of eleven risks were identified. Ten are negative risks requiring mitigation, and one is a positive risk representing an opportunity to be exploited if conditions allow.

#### 9.1.2.2 Risk Analysis

Each identified risk was evaluated on two independent dimensions: the probability of it occurring, and the potential impact it would have on the project if it did.

Probability is rated on a three-level scale:

| Level | Value |
|-------|-------|
| Low | 0.30 |
| Medium | 0.45 |
| High | 0.70 |

Impact is assessed separately for each of the four project dimensions (budget, planning, scope, and quality) and rated on a five-level scale:

| Level | Value |
|-------|-------|
| Negligible | 0.05 |
| Low | 0.15 |
| Medium | 0.30 |
| High | 0.55 |
| Critical | 0.90 |

Assessing impact across four dimensions rather than a single value makes it possible to understand which area of the project each risk threatens most.

#### 9.1.2.3 Prioritisation

Once each risk has been assessed, a total priority score is calculated by multiplying the probability value by the highest of its four impact values. This gives a single number that reflects the worst-case severity of the risk and is used to rank all risks from most to least critical.

The matrix below shows the resulting priority value for each combination of probability level and maximum impact level:

*Table 9.1: Risk prioritisation matrix*

| | Negligible (0.05) | Low (0.15) | Medium (0.30) | High (0.55) | Critical (0.90) |
|---|---|---|---|---|---|
| **High (0.70)** | 0.04 | 0.11 | 0.21 | 0.39 | 0.63 |
| **Medium (0.45)** | 0.02 | 0.07 | 0.14 | 0.25 | 0.45 |
| **Low (0.30)** | 0.02 | 0.05 | 0.09 | 0.17 | 0.27 |

The full risk register, including the category, probability, impact breakdown, total priority score, and contingency plan for each of the eleven risks, is presented in Section 2.1.7 of the main document (Tables 2.17, 2.19, and 2.20).

### 9.1.3 Risk Control

Once the risks have been assessed and prioritised, a response strategy is assigned to each one. Four strategies are available:

- **Mitigate**: take actions to reduce either the probability of the risk occurring or the severity of its impact. This is the strategy applied to all ten negative risks in this project.
- **Exploit**: actively work to increase the likelihood or maximise the benefit of a positive risk. Applied to R6 (early project completion), where any time saved would be directed towards increasing test coverage and improving the user interface.
- **Accept**: acknowledge the risk and choose not to act, typically when the cost of mitigation outweighs the potential impact. No risk in this project fell into this category.
- **Transfer**: delegate responsibility for managing the risk to a third party. In a single-developer TFG there is no third party available to take on this role, so this strategy was not applicable.

Risk monitoring was maintained throughout the project via a running task log that recorded progress and flagged any deviation from the plan. Incidents that had a measurable effect on the schedule or required a deliberate decision to resolve were logged as project issues (I1–I6) and cross-referenced with the corresponding risks. The outcome of each risk at project closure is recorded in the final risk report in Section 2.3.2.

---

## 9.2 References

### 9.2.1 References and Bibliography

The following list includes all sources cited directly in the text of this document as well as additional sources consulted during development that are relevant to its context. Sources [1] to [16] are cited in the text; sources [17] to [23] were consulted as background reference.

> **[NOTA — Citas pendientes de insertar en el texto]**
> Antes de entregar, busca cada referencia en el capítulo correspondiente y añade el número entre corchetes justo después de la primera mención. Usa el gestor de referencias de Word para vincularlas automáticamente.
>
> **Capítulo 2 — Planning and Management**
> - [2][3] Randstad y Glassdoor: en el texto introductorio del presupuesto (2.1.8), justo después de "sources: Randstad Tech, Glassdoor Spain, 2025".
> - [5][6] Google Calendar API y OAuth 2.0: en la tabla de riesgos (R4), al final de "The system relies on the Google Calendar API v3 and OAuth 2.0 for calendar synchronisation."
>
> **Capítulo 4 — System Requirements**
> - [4] OWASP ASVS: en la sección de seguridad, después de "OWASP Application Security Verification Standard (ASVS)".
> - [7] GDPR: en los requisitos de privacidad (NFR-PRIV-01), después de "General Data Protection Regulation (GDPR)".
> - [13] Docker: en NFR-PORT-01, después de "Docker and Docker Compose".
> - [15] GitHub Actions: en la descripción del pipeline de CI/CD, después de "GitHub Actions".
> - [16] Testcontainers: en la tabla de niveles de prueba, después de "Jest + Testcontainers".
> - [8] Node.js: en los requisitos de entorno, después de "Node.js >= 18.x".
> - [14] SonarQube: en la sección 4.3.3, primera mención de SonarQube como herramienta.
> - [19] JWT RFC: en NFR-SEG-08, al final de "Short-lived JWT tokens".
>
> **Capítulo 5 — Design**
> - [17] Microservices (Fowler): en la introducción de la arquitectura, en la primera frase que describe el patrón de microservicios.
> - [9] NestJS: en la tabla de decisiones de diseño, después de "Modular monolith (NestJS)".
> - [10] TypeORM: en la tabla de servicios, primera mención de TypeORM.
> - [11] React: en la tabla de decisiones, después de "React SPA (Vite)".
> - [12] MariaDB: en la tabla de decisiones, después de "Relational MariaDB vs. NoSQL".
> - [21][22] Radix UI y TanStack Query: en la tabla de servicios, celda del webapp, al final de la lista de librerías.
> - [6][19] OAuth 2.0 y JWT: en la celda del auth_service de la tabla de servicios.
>
> **Capítulo 6 — Implementation**
> - [19] JWT: primera mención de JWT tokens en el texto.
> - [6] OAuth 2.0: primera mención del flujo OAuth en el texto.
> - [15] GitHub Actions: primera mención del pipeline en el texto.
> - [12] MariaDB: primera mención de MariaDB como base de datos.
>
> **Prioridad si el tiempo es limitado:** [4] OWASP, [7] GDPR, [5][6] Google APIs, [19] JWT y [17] microservicios son los cinco mas importantes desde el punto de vista academico.

[1] J. M. Redondo, "Documentos-modelo para Trabajos de Fin de Grado/Master de la Escuela de Informática de Oviedo," 17 Jun. 2019. [Online]. Available: https://www.researchgate.net/publication/327882831_Plantilla_de_Proyectos_de_Fin_de_Carrera_de_la_Escuela_de_Informatica_de_Oviedo

[2] Randstad Technologies, "Informe de salarios del sector tecnológico en España 2025," Randstad, 2025. [Online]. Available: https://www.randstad.es

[3] Glassdoor, "Software engineer salaries in Spain," Glassdoor, 2025. [Online]. Available: https://www.glassdoor.es

[4] OWASP Foundation, "OWASP Application Security Verification Standard (ASVS) 4.0," OWASP, 2019. [Online]. Available: https://owasp.org/www-project-application-security-verification-standard

[5] Google LLC, "Google Calendar API v3 Reference," Google Developers, 2024. [Online]. Available: https://developers.google.com/calendar/api/v3/reference

[6] Google LLC, "OAuth 2.0 for Web Server Applications," Google Developers, 2024. [Online]. Available: https://developers.google.com/identity/protocols/oauth2/web-server

[7] European Parliament and Council of the European Union, "Regulation (EU) 2016/679 of the European Parliament and of the Council (GDPR)," Official Journal of the European Union, Apr. 2016. [Online]. Available: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679

[8] OpenJS Foundation, "Node.js Documentation," 2024. [Online]. Available: https://nodejs.org/docs/latest/api

[9] Trilon Labs, "NestJS Documentation," 2024. [Online]. Available: https://docs.nestjs.com

[10] TypeORM Contributors, "TypeORM Documentation," 2024. [Online]. Available: https://typeorm.io

[11] Meta Open Source, "React Documentation," 2024. [Online]. Available: https://react.dev

[12] MariaDB Foundation, "MariaDB 11 Server Documentation," 2024. [Online]. Available: https://mariadb.com/kb/en/documentation

[13] Docker Inc., "Docker Documentation," 2024. [Online]. Available: https://docs.docker.com

[14] SonarSource, "SonarQube Documentation," 2024. [Online]. Available: https://docs.sonarsource.com/sonarqube

[15] GitHub, "GitHub Actions Documentation," 2024. [Online]. Available: https://docs.github.com/en/actions

[16] Testcontainers Contributors, "Testcontainers for Node.js Documentation," 2024. [Online]. Available: https://node.testcontainers.org

**Background sources (not cited directly in the text)**

[17] M. Fowler, "Microservices," martinfowler.com, Mar. 2014. [Online]. Available: https://martinfowler.com/articles/microservices.html

[18] M. Fowler, "Strangler Fig Application," martinfowler.com, Jun. 2004. [Online]. Available: https://martinfowler.com/bliki/StranglerFigApplication.html

[19] IETF, "RFC 7519: JSON Web Token (JWT)," Internet Engineering Task Force, May 2015. [Online]. Available: https://datatracker.ietf.org/doc/html/rfc7519

[20] IETF, "RFC 6749: The OAuth 2.0 Authorization Framework," Internet Engineering Task Force, Oct. 2012. [Online]. Available: https://datatracker.ietf.org/doc/html/rfc6749

[21] Radix UI Contributors, "Radix UI Documentation," 2024. [Online]. Available: https://www.radix-ui.com/docs/primitives

[22] TanStack, "TanStack Query Documentation," 2024. [Online]. Available: https://tanstack.com/query/latest

[23] Evan You, "Vite Documentation," 2024. [Online]. Available: https://vitejs.dev/guide

---

## 9.3 Content Delivered in Annexes

### 9.3.1 Content Description

In addition to the main TFG document, a compressed file is submitted to the university platform containing the source code and all supplementary materials associated with the project. The university platform has a file size limit of approximately 40 to 90 MB. Since Node.js projects include `node_modules` folders that can be several hundred megabytes, these are excluded from the archive. A `README.txt` file at the root of the archive explains the full structure and provides a link to the public GitHub repository at https://github.com/murias10/teachingplanner, where the complete project can also be downloaded.

The archive is organised into directories by purpose, as described in Table 9.2.

*Table 9.2: Structure of the submitted compressed file*

| Directory | Contents |
|-----------|----------|
| `./` | Contains the `README.txt` file described below. |
| `./TeachingPlanner` | Full project source code: all microservices, the webapp, Docker Compose configuration files for each deployment environment, and the root `package.json`. `node_modules` folders are excluded; run `npm install` in each service directory to restore dependencies. See Table 9.3 for the internal structure. |
| `./documentacion` | This TFG document in PDF format. The installation manual and user manual are included as chapters within the document itself. |
| `./contexto` | Background document provided by the EII at the start of the project (`Explicación archivos TXT planificador actual.pdf`), describing the legacy plain-text file format that TeachingPlanner replaces. |
| `./planificacion` | Microsoft Project 2019 file (`planificacion_TFG.mpp`) with the full project schedule referenced in Chapter 2. |
| `./prototipos` | Initial UI sketches from the design phase: `planificador_boceto.excalidraw` (editable) and `planificador_boceto.svg` (exported image). |

The content of the `README.txt` file included at the root of the archive is the following:

```
========================================================
  TeachingPlanner — TFG
  Escuela de Ingeniería Informática, Universidad de Oviedo
  Autor: Diego Murias Suárez
========================================================

Este fichero describe la estructura del fichero comprimido adjunto
entregado junto a la memoria del Trabajo de Fin de Grado.

ESTRUCTURA DE DIRECTORIOS
--------------------------

./                    README.txt (este fichero)

./TeachingPlanner/    Código fuente completo del proyecto (microservicios
                      gateway, auth, user y planner, aplicación web webapp,
                      y ficheros Docker Compose para cada entorno).
                      NOTA: las carpetas node_modules están excluidas.
                      Ejecutar "npm install" en cada directorio de servicio
                      y en webapp/ para restaurar las dependencias.

./documentacion/      Memoria del TFG en PDF. Los manuales de instalación
                      y de usuario forman parte de la propia memoria.

./contexto/           Documento de contexto del sistema heredado de la EII.

./planificacion/      Fichero Microsoft Project (planificacion_TFG.mpp).

./prototipos/         Bocetos iniciales de la interfaz (Excalidraw y SVG).

REPOSITORIO PÚBLICO
--------------------
https://github.com/murias10/teachingplanner

ACCESO A LA APLICACIÓN
------------------------
La aplicación está desplegada y operativa. Consultar la sección 7.1.0
del manual de instalación incluido en ./documentacion/ para instrucciones
de acceso mediante la VPN de la universidad.
```

### 9.3.2 Development Directory Structure

The table below describes the internal structure of the `./TeachingPlanner` directory. The layout follows directly from the microservices architecture of the system: one directory per service, one for the frontend application, two for the database schemas, and shared configuration at the root.

*Table 9.3: Internal structure of the TeachingPlanner development directory*

| Directory | Contents |
|-----------|----------|
| `./` | Root-level files: `package.json`, Docker Compose files for each environment (development, self-hosted, Azure, and SonarQube), environment variable templates (`.env.template` and `.env.sonarqube.template`), and the `.github/workflows/` directory containing the CI/CD pipeline definitions. Actual `.env` files with real credentials are excluded from the archive. |
| `./gateway_service` | API gateway service. Routes all incoming requests to the appropriate backend service. Contains `src/` with routing and middleware logic. |
| `./auth_service` | Authentication service. Handles login, registration, account activation, password recovery, and Google OAuth integration. Contains `src/` with controllers, services, entities, middleware, routes, and utilities, and `migrations/` with TypeORM database migration files. |
| `./user_service` | User management service. Manages user accounts, roles, and bulk imports. Contains `src/` with controllers, services, entities, middleware, routes, and utilities, and `scripts/` for import tooling. |
| `./planner_service` | Scheduling service, the core of the system. Manages all academic data: calendars, degree programmes, subjects, groups, classrooms, recurring and one-off events, change requests, and Google Calendar synchronisation. Integration tests are in `src/__tests__/integration/`. |
| `./webapp` | React single-page application. Contains `src/` with components, pages, hooks, API services, contexts, internationalisation files, styles, and utilities. End-to-end tests are in `e2e/` and run with Playwright. |
| `./management_database` | SQL schema file (`schema.sql`) for the management database, shared by the authentication and user services. |
| `./planner_database` | SQL schema file (`schema.sql`) for the scheduling database, used exclusively by the planner service. |
| `./certs` | TLS certificate (`cert.pem`) and private key (`key.pem`) used by the Caddy reverse proxy to serve the application over HTTPS. |
| `./docs` | Project documentation in Markdown format, covering all chapters of this TFG report and supplementary technical notes. |

---
