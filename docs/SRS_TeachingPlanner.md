# Especificación de Requisitos de Software (SRS)
# Sistema TeachingPlanner

**Versión 1.0**
**Fecha:** 02/03/2026
**Escuela de Ingeniería Informática de Oviedo**

---

## Historial de Revisiones

| Fecha | Versión | Descripción | Autor |
|-------|---------|-------------|-------|
| 02/03/2026 | 1.0 | Documento inicial de requisitos | Equipo TeachingPlanner |

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
   - 1.1 [Propósito](#11-propósito)
   - 1.2 [Ámbito del Sistema](#12-ámbito-del-sistema)
   - 1.3 [Definiciones, Acrónimos y Abreviaturas](#13-definiciones-acrónimos-y-abreviaturas)
   - 1.4 [Referencias](#14-referencias)
   - 1.5 [Visión General del Documento](#15-visión-general-del-documento)

2. [Descripción General](#2-descripción-general)
   - 2.1 [Perspectiva del Producto](#21-perspectiva-del-producto)
   - 2.2 [Funciones del Producto](#22-funciones-del-producto)
   - 2.3 [Características de los Usuarios](#23-características-de-los-usuarios)
   - 2.4 [Restricciones](#24-restricciones)
   - 2.5 [Suposiciones y Dependencias](#25-suposiciones-y-dependencias)

3. [Stakeholders](#3-stakeholders)
   - 3.1 [Identificación de Stakeholders](#31-identificación-de-stakeholders)
   - 3.2 [Matriz de Intereses y Poder](#32-matriz-de-intereses-y-poder)
   - 3.3 [Necesidades por Stakeholder](#33-necesidades-por-stakeholder)

4. [Requisitos Específicos](#4-requisitos-específicos)
   - 4.1 [Requisitos Funcionales](#41-requisitos-funcionales)
   - 4.2 [Requisitos No Funcionales](#42-requisitos-no-funcionales)

5. [Apéndices](#5-apéndices)
   - 5.1 [Diagramas UML](#51-diagramas-uml)
   - 5.2 [Matriz de Trazabilidad](#52-matriz-de-trazabilidad)
   - 5.3 [Glosario Técnico](#53-glosario-técnico)

---

# 1. Introducción

## 1.1 Propósito

El presente documento tiene como finalidad establecer la **Especificación de Requisitos de Software (SRS)** del sistema **TeachingPlanner**, una plataforma web diseñada para gestionar la planificación académica de la Escuela de Ingeniería Informática de Oviedo.

Este documento está dirigido a:
- **Equipo de desarrollo**: Para guiar la implementación técnica del sistema
- **Administradores académicos**: Para validar que el sistema cumple con sus necesidades
- **Profesorado**: Para comprender las funcionalidades disponibles
- **Equipo de calidad**: Para verificar el cumplimiento de requisitos
- **Dirección de la escuela**: Para aprobar la solución propuesta

El documento sigue los estándares **IEEE 830-1998** para especificaciones de requisitos de software.

## 1.2 Ámbito del Sistema

### 1.2.1 Nombre del Sistema
**TeachingPlanner** - Sistema de Gestión de Planificación Académica

### 1.2.2 Objetivos del Sistema

El sistema TeachingPlanner tiene como objetivo principal **automatizar y optimizar el proceso de planificación académica** en la Escuela de Ingeniería Informática de Oviedo, proporcionando las siguientes capacidades:

1. **Automatización de tareas manuales**: Eliminar la gestión manual en hojas de cálculo y documentos dispersos
2. **Gestión centralizada**: Unificar toda la información académica en una única plataforma
3. **Reducción de errores**: Validar automáticamente conflictos de horarios, aulas y asignaciones
4. **Facilitar cambios**: Agilizar las modificaciones en la planificación durante el curso
5. **Mejorar comunicación**: Mantener sincronizada la información entre administración y profesorado
6. **Transparencia**: Permitir consulta pública de horarios sin necesidad de autenticación

### 1.2.3 Alcance Funcional

El sistema gestionará los siguientes elementos académicos:

- **Titulaciones (Degrees)**: Grados ofrecidos por la escuela
- **Asignaturas (Subjects)**: Materias que componen cada titulación
- **Grupos**: Secciones específicas de cada asignatura (teoría, prácticas, laboratorios)
- **Calendarios Académicos**: Planificación temporal por curso y semestre
- **Aulas (Classrooms)**: Espacios físicos disponibles para docencia
- **Eventos**: Sesiones de clase (periódicas y puntuales)
- **Usuarios**: Administradores y profesores con roles diferenciados
- **Solicitudes de Cambio**: Peticiones de modificación de horarios por parte del profesorado
- **Auditoría**: Registro histórico de todas las modificaciones realizadas

### 1.2.4 Beneficios Esperados

- **Ahorro de tiempo**: Reducción del 70% en tiempo dedicado a planificación manual
- **Reducción de errores**: Eliminación de conflictos de horarios y solapamientos
- **Mejora en comunicación**: Sincronización automática con Google Calendar
- **Accesibilidad**: Consulta de horarios 24/7 desde cualquier dispositivo
- **Trazabilidad**: Registro completo de cambios y responsables
- **Escalabilidad**: Soporte para múltiples titulaciones y cursos académicos

## 1.3 Definiciones, Acrónimos y Abreviaturas

| Término | Definición |
|---------|------------|
| **SRS** | Software Requirements Specification (Especificación de Requisitos de Software) |
| **API** | Application Programming Interface (Interfaz de Programación de Aplicaciones) |
| **CRUD** | Create, Read, Update, Delete (Operaciones básicas de persistencia) |
| **JWT** | JSON Web Token (Estándar de autenticación basado en tokens) |
| **OAuth 2.0** | Protocolo de autorización para acceso a recursos de terceros |
| **HTTPS** | HyperText Transfer Protocol Secure (Protocolo seguro de transferencia) |
| **CSV** | Comma-Separated Values (Formato de archivo de valores separados por comas) |
| **REST** | Representational State Transfer (Arquitectura para servicios web) |
| **ORM** | Object-Relational Mapping (Mapeo objeto-relacional) |
| **GIS** | Geographic Information System (Sistema de Información Geográfica) |
| **SIES** | Sistema Integrado de Información Universitaria del Ministerio |
| **UniOvi** | Universidad de Oviedo |
| **EII** | Escuela de Ingeniería Informática |
| **Evento Periódico** | Sesión de clase que se repite regularmente (ej: lunes y miércoles 9:00-11:00) |
| **Evento Puntual** | Sesión de clase única o excepción (ej: seminario especial, recuperación) |
| **Calendario Académico** | Conjunto de días lectivos para un semestre y curso específico |
| **Grupo** | Subdivisión de una asignatura (teoría, prácticas, laboratorio) |
| **Solicitud de Cambio** | Petición formal de un profesor para modificar un evento |
| **Auditoría** | Registro histórico de modificaciones con usuario y timestamp |

## 1.4 Referencias

### Normativas y Legislación
- **Ley Orgánica 6/2001**, de 21 de diciembre, de Universidades (LOU)
- **Real Decreto 1125/2003**, por el que se establece el sistema europeo de créditos (ECTS)
- **Real Decreto 1393/2007**, de ordenación de las enseñanzas universitarias oficiales
- **Estatutos de la Universidad de Oviedo** (aprobados por Decreto 12/2010)

### Estándares Técnicos
- **IEEE 830-1998**: Recommended Practice for Software Requirements Specifications
- **ISO/IEC 25010**: Systems and software Quality Requirements and Evaluation (SQuaRE)
- **RFC 5322**: Internet Message Format (para validación de emails)
- **RFC 3339**: Date and Time on the Internet: Timestamps
- **RFC 6749**: OAuth 2.0 Authorization Framework
- **RFC 7519**: JSON Web Token (JWT)

### Documentación de Referencia
- Reglamento Académico de la Universidad de Oviedo
- Normativa de evaluación de la Universidad de Oviedo
- Guías académicas de las titulaciones de la EII
- Manual de estilo de la Universidad de Oviedo

### Tecnologías y Frameworks
- **Node.js v20+**: Plataforma de ejecución JavaScript
- **TypeScript 5+**: Lenguaje de programación tipado
- **Express.js 4+**: Framework web para Node.js
- **TypeORM 0.3+**: ORM para TypeScript y JavaScript
- **React 18+**: Librería para interfaces de usuario
- **Vite 5+**: Build tool para aplicaciones web modernas
- **PostgreSQL 15+**: Sistema de gestión de bases de datos
- **Docker**: Plataforma de contenedores
- **Google Calendar API v3**: API para integración de calendarios

## 1.5 Visión General del Documento

El documento está organizado de la siguiente manera:

- **Sección 1 (Introducción)**: Proporciona una visión general del propósito, alcance y estructura del documento
- **Sección 2 (Descripción General)**: Describe el contexto del sistema, sus funciones principales, características de usuarios y restricciones
- **Sección 3 (Stakeholders)**: Identifica y analiza a todos los interesados en el proyecto
- **Sección 4 (Requisitos Específicos)**: Detalla exhaustivamente todos los requisitos funcionales y no funcionales
- **Sección 5 (Apéndices)**: Incluye diagramas, matrices de trazabilidad y documentación complementaria

---

# 2. Descripción General

## 2.1 Perspectiva del Producto

### 2.1.1 Contexto del Sistema

TeachingPlanner es un **sistema web independiente** que reemplaza los procesos manuales actuales de planificación académica basados en hojas de cálculo Excel y documentos compartidos. El sistema operará como una solución centralizada y autónoma para la Escuela de Ingeniería Informática.

### 2.1.2 Interfaces del Sistema

#### A) Interfaz de Usuario
- **Aplicación Web Responsiva**: Accesible desde navegadores modernos (Chrome, Firefox, Safari, Edge)
- **Diseño Adaptativo**: Funcional en dispositivos desktop, tablets y móviles
- **Panel de Administración**: Interfaz completa para gestión de todos los elementos
- **Vista Pública**: Consulta de horarios sin autenticación
- **Portal del Profesor**: Panel limitado para profesores con funciones específicas

#### B) Interfaz de Hardware
- **Servidor de Aplicaciones**: Desplegado en infraestructura de la Universidad
- **Servidor de Base de Datos**: PostgreSQL en servidor dedicado
- **Balanceadores de Carga**: Para alta disponibilidad (opcional)

#### C) Interfaz de Software
- **Google Calendar API**: Sincronización bidireccional de eventos con calendarios personales
- **Servicio de Email**: Envío de notificaciones (activación, cambios, solicitudes)
- **Sistema de Autenticación UniOvi**: Integración futura con SSO institucional (opcional)

#### D) Interfaz de Comunicaciones
- **Protocolo HTTPS**: Para toda la comunicación cliente-servidor
- **API REST**: Arquitectura de microservicios con endpoints documentados
- **WebSockets** (futuro): Para notificaciones en tiempo real

### 2.1.3 Arquitectura del Sistema

El sistema sigue una **arquitectura de microservicios** con los siguientes componentes:

```
┌─────────────────────────────────────────────────────────┐
│                   Cliente Web (React)                   │
│              Interfaz de Usuario Responsiva              │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS/REST
┌────────────────────▼────────────────────────────────────┐
│              API Gateway (Express.js)                   │
│         Autenticación JWT, Enrutamiento, CORS           │
└───┬──────────────┬──────────────┬─────────────────┬─────┘
    │              │              │                 │
    ▼              ▼              ▼                 ▼
┌────────┐   ┌──────────┐   ┌──────────┐    ┌────────────┐
│  Auth  │   │   User   │   │ Planner  │    │  Audit     │
│Service │   │ Service  │   │ Service  │    │  Service   │
└───┬────┘   └────┬─────┘   └────┬─────┘    └─────┬──────┘
    │             │              │                 │
    └─────────────┴──────────────┴─────────────────┘
                          │
                          ▼
                ┌──────────────────┐
                │   PostgreSQL DB  │
                │  (Base de Datos) │
                └──────────────────┘
```

**Servicios:**
1. **Gateway Service**: Punto de entrada único, enrutamiento y autenticación
2. **Auth Service**: Autenticación, registro, recuperación de contraseñas, OAuth
3. **User Service**: Gestión de usuarios y perfiles
4. **Planner Service**: Lógica de negocio principal (calendarios, grupos, eventos, solicitudes)

## 2.2 Funciones del Producto

### 2.2.1 Gestión de Usuarios (RF-USER)
Administración completa del ciclo de vida de usuarios con roles diferenciados:
- Registro de nuevos usuarios con activación por email
- Autenticación segura con JWT
- Gestión de perfiles y contraseñas
- Asignación y modificación de roles (Administrador/Profesor)
- Integración con Google OAuth para sincronización de calendarios

### 2.2.2 Gestión de Estructura Académica (RF-STRUCT)
Creación y mantenimiento de la jerarquía académica:
- **Titulaciones**: Grados ofrecidos (GII, GIIIS, Doble Grado, etc.)
- **Asignaturas**: Materias con código SIES, semestre, curso
- **Grupos**: Tipos (teoría/práctica/laboratorio), idiomas, números

### 2.2.3 Gestión de Calendarios Académicos (RF-CAL)
Planificación temporal de actividades lectivas:
- Creación de calendarios por curso académico y semestre
- Definición de periodos lectivos (inicio/fin)
- Generación automática de días lectivos
- Duplicación de calendarios entre semestres/cursos
- Gestión de periodos no lectivos (festivos, vacaciones)

### 2.2.4 Gestión de Aulas (RF-CLASS)
Administración de espacios físicos:
- Registro de aulas con código único
- Información de ubicación (GIS URL)
- Consulta de disponibilidad
- Asignación a eventos

### 2.2.5 Gestión de Eventos (RF-EVENT)
Control de sesiones de clase:
- **Eventos Periódicos**: Clases regulares (ej: L/X 9:00-11:00)
- **Eventos Puntuales**: Sesiones únicas o excepciones
- Asignación de grupos y aulas
- Detección de conflictos de horario
- Cancelación y modificación de eventos
- Sincronización con Google Calendar

### 2.2.6 Solicitudes de Cambio (RF-REQ)
Sistema de peticiones de modificación:
- Profesores crean solicitudes de cambio de eventos
- Administradores revisan y aprueban/rechazan
- Registro de comentarios y justificaciones
- Notificaciones por email del estado
- Historial de solicitudes por profesor

### 2.2.7 Visualización Pública (RF-VIEW)
Consulta de horarios sin autenticación:
- Vista pública de horarios por curso y semestre
- Filtrado por titulación, curso, asignatura
- Exportación a PDF
- Vista de calendario mensual/semanal

### 2.2.8 Auditoría y Trazabilidad (RF-AUDIT)
Registro completo de actividad:
- Registro automático de todas las modificaciones
- Información de usuario, fecha, hora y cambios realizados
- Consulta de historial por entidad
- Exportación de logs a CSV

### 2.2.9 Exportación de Datos (RF-EXPORT)
Generación de informes:
- Exportación de listados a CSV
- Generación de horarios en PDF
- Descarga de planificaciones completas

### 2.2.10 Sincronización con Google Calendar (RF-SYNC)
Integración con calendarios personales:
- Autenticación OAuth 2.0 con Google
- Sincronización bidireccional de eventos
- Actualización automática de cambios
- Gestión de permisos de calendario

## 2.3 Características de los Usuarios

### 2.3.1 Usuario Anónimo (Público)

**Perfil:**
- Cualquier persona con acceso a internet
- No requiere cuenta en el sistema
- Incluye: estudiantes, profesores, personal administrativo, público general

**Conocimientos Técnicos:**
- Nivel básico: Navegación web
- No requiere formación específica

**Funciones Permitidas:**
- Consultar horarios públicos
- Visualizar calendarios por semestre
- Filtrar por titulación, curso, asignatura
- Exportar horarios a PDF

**Frecuencia de Uso:**
- Consultas puntuales (inicio de semestre, búsqueda de aulas)
- Acceso esporádico durante el curso

### 2.3.2 Profesor (ROLE_PROFESSOR)

**Perfil:**
- Docentes de la Escuela de Ingeniería Informática
- Personal académico con asignaturas asignadas
- Aproximadamente 80-120 usuarios activos

**Conocimientos Técnicos:**
- Nivel intermedio: Uso de aplicaciones web
- Familiaridad con Google Calendar
- Capacitación inicial de 1-2 horas

**Funciones Permitidas:**
- Todas las funciones de Usuario Anónimo
- Consultar su propia planificación completa
- Crear solicitudes de cambio de eventos
- Consultar historial de solicitudes propias
- Sincronizar con Google Calendar personal
- Exportar su planificación

**Frecuencia de Uso:**
- Alta al inicio de semestre (revisión de horarios)
- Media durante el curso (solicitudes de cambio)
- Uso diario de Google Calendar sincronizado

**Necesidades Específicas:**
- Notificaciones rápidas de cambios aprobados/rechazados
- Interfaz simple para solicitar cambios
- Visibilidad de toda su carga docente
- Acceso desde dispositivos móviles

### 2.3.3 Administrador (ROLE_ADMIN)

**Perfil:**
- Personal administrativo de la Subdirección de Ordenación Académica
- Responsables de planificación académica
- 2-5 usuarios con privilegios completos

**Conocimientos Técnicos:**
- Nivel avanzado: Conocimiento profundo de gestión académica
- Experiencia previa con planificación manual
- Formación completa del sistema (4-8 horas)

**Funciones Permitidas:**
- Control total sobre el sistema
- CRUD completo de todos los elementos
- Aprobación/rechazo de solicitudes
- Gestión de usuarios y roles
- Configuración de calendarios académicos
- Resolución de conflictos de horario
- Consulta de auditorías
- Exportación masiva de datos

**Frecuencia de Uso:**
- Muy alta durante planificación inicial (julio-septiembre)
- Alta durante el primer mes de curso (ajustes)
- Media durante el resto del curso (cambios puntuales)

**Necesidades Específicas:**
- Herramientas de detección de conflictos
- Vistas globales de ocupación de aulas
- Duplicación masiva de planificaciones
- Notificaciones de solicitudes pendientes
- Respaldo y exportación completa

### 2.3.4 Administrador del Sistema (ROLE_SYSTEM_ADMIN)

**Perfil:**
- Personal técnico de IT de la Universidad
- Responsables de infraestructura y seguridad
- 1-2 usuarios

**Conocimientos Técnicos:**
- Nivel experto: Administración de sistemas
- Conocimiento de Docker, PostgreSQL, Node.js

**Funciones Permitidas:**
- Todas las funciones de Administrador
- Gestión de backups y restauraciones
- Configuración de sistema
- Monitorización de logs técnicos
- Gestión de rendimiento

**Frecuencia de Uso:**
- Baja: Mantenimiento mensual
- Alta durante incidencias

## 2.4 Restricciones

### 2.4.1 Restricciones Regulatorias

**R-REG-01: Protección de Datos (RGPD)**
- El sistema debe cumplir con el Reglamento General de Protección de Datos (UE) 2016/679
- Almacenamiento de datos personales únicamente con consentimiento
- Derecho de acceso, rectificación y supresión de datos
- Encriptación de datos sensibles (contraseñas)

**R-REG-02: Normativa Universitaria**
- Cumplimiento del Reglamento Académico de la Universidad de Oviedo
- Respeto a los calendarios oficiales aprobados por Consejo de Gobierno
- Compatibilidad con el sistema ECTS de créditos

**R-REG-03: Accesibilidad**
- Cumplimiento de WCAG 2.1 nivel AA
- Accesible para usuarios con discapacidades

### 2.4.2 Restricciones Técnicas

**R-TEC-01: Plataforma de Desarrollo**
- Backend: Node.js 20+ con TypeScript 5+
- Frontend: React 18+ con TypeScript
- Base de Datos: PostgreSQL 15+
- Contenedores: Docker para despliegue

**R-TEC-02: Navegadores Soportados**
- Chrome/Edge (últimas 2 versiones)
- Firefox (últimas 2 versiones)
- Safari (últimas 2 versiones)
- No se garantiza soporte para Internet Explorer

**R-TEC-03: Seguridad**
- Comunicación exclusivamente por HTTPS
- Autenticación basada en JWT (RFC 7519)
- Tokens con expiración máxima de 24 horas
- Contraseñas encriptadas con bcrypt (factor 10+)

**R-TEC-04: Integración con Google**
- Uso de Google Calendar API v3
- Autenticación OAuth 2.0
- Cumplimiento de políticas de privacidad de Google

### 2.4.3 Restricciones Operacionales

**R-OP-01: Disponibilidad**
- El sistema debe estar operativo 24/7
- Mantenimientos programados únicamente en períodos no lectivos
- Ventanas de mantenimiento notificadas con 7 días de antelación

**R-OP-02: Rendimiento**
- Tiempo de respuesta <2 segundos para operaciones comunes
- Soporte para 200 usuarios concurrentes
- Consultas públicas con caching para alta carga

**R-OP-03: Escalabilidad**
- Diseño preparado para soportar todas las titulaciones de la EII
- Capacidad de crecimiento hasta 500 asignaturas
- Almacenamiento histórico mínimo de 5 años

**R-OP-04: Copias de Seguridad**
- Backup automático diario de la base de datos
- Retención de backups: 30 días
- Plan de recuperación ante desastres (RPO <24h, RTO <4h)

### 2.4.4 Restricciones de Diseño

**R-DIS-01: Arquitectura**
- Arquitectura de microservicios con separación clara de responsabilidades
- API REST con formato JSON
- Separación frontend-backend

**R-DIS-02: Internacionalización**
- Interfaz en español (v1.0)
- Preparado para futura internacionalización (i18n)
- Soporte para caracteres UTF-8

**R-DIS-03: Responsive Design**
- Diseño mobile-first
- Breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px)

## 2.5 Suposiciones y Dependencias

### 2.5.1 Suposiciones

**S-01: Infraestructura Disponible**
- La Universidad proporcionará servidor con recursos suficientes
- Conectividad a internet estable y de alta velocidad
- Acceso a servicio de correo electrónico institucional

**S-02: Datos Iniciales**
- Existencia de datos históricos de planificación para migración inicial
- Disponibilidad de listados actualizados de titulaciones, asignaturas y aulas
- Catálogo SIES de asignaturas actualizado

**S-03: Usuarios**
- Los administradores recibirán formación adecuada antes del despliegue
- Los profesores tienen conocimientos básicos de uso de aplicaciones web
- Existe un responsable académico para validación de requisitos

**S-04: Calendario Académico**
- El calendario académico oficial se publica antes del inicio de cada semestre
- Los festivos y periodos no lectivos son conocidos con antelación
- No habrá cambios masivos de calendario una vez iniciado el semestre

**S-05: Google Services**
- Google Calendar API mantendrá compatibilidad con versión v3
- Los usuarios tienen o pueden crear cuentas de Google
- La política de privacidad de Google permite la integración propuesta

### 2.5.2 Dependencias

**D-01: Dependencias de Software Externo**
- **Google Calendar API v3**: Para sincronización de calendarios
- **Servicio SMTP**: Para envío de emails (ej: Gmail SMTP, SendGrid)
- **Librerías NPM**: React, Express, TypeORM, etc. (mantenidas por comunidad)

**D-02: Dependencias de Infraestructura**
- **Servidor de Aplicaciones**: Con Node.js 20+ instalado
- **Servidor de BD**: PostgreSQL 15+ con almacenamiento suficiente
- **Certificados SSL**: Para HTTPS (Let's Encrypt o institucional)
- **Dominio**: URL institucional para acceso al sistema

**D-03: Dependencias de Datos**
- **Sistema SIES**: Para códigos oficiales de asignaturas
- **Directorio de Personal**: Para listado actualizado de profesores
- **Catálogo de Aulas**: Información actualizada de espacios disponibles

**D-04: Dependencias de Procesos**
- **Aprobación de Calendarios**: Por Consejo de Gobierno de la Universidad
- **Asignación Docente**: Definida por Departamentos antes de planificación
- **Normativas**: Cambios en regulaciones académicas que afecten a planificación

**D-05: Dependencias de Terceros**
- **OAuth 2.0**: Disponibilidad del servicio de Google
- **Email Delivery**: Tasa de entrega de emails institucionales
- **Navegadores**: Actualizaciones que puedan afectar compatibilidad

---

# 3. Stakeholders

## 3.1 Identificación de Stakeholders

Esta sección identifica a todos los interesados (stakeholders) en el sistema TeachingPlanner, clasificados por categorías y con análisis de sus intereses, influencia y requisitos específicos.

### 3.1.1 Stakeholders Principales

#### STK-01: Subdirector/a de Ordenación Académica de la EII
**Rol:** Cliente principal y sponsor del proyecto
**Interés:** Muy Alto | **Poder:** Muy Alto
**Descripción:** Responsable último de la planificación académica de la escuela

**Necesidades:**
- Herramienta que simplifique la planificación semestral
- Reducción drástica de tiempo dedicado a tareas administrativas
- Capacidad de detectar y resolver conflictos rápidamente
- Reportes y estadísticas de uso de recursos (aulas, horarios)
- Sistema fiable y disponible durante periodos críticos

**Expectativas:**
- Implantación antes del inicio del curso 2026-2027
- ROI positivo en el primer año de uso
- Reducción del 70% en tiempo de planificación
- Cero conflictos de horario no detectados

#### STK-02: Personal Administrativo de Ordenación Académica
**Rol:** Usuarios principales del sistema (Administradores)
**Interés:** Muy Alto | **Poder:** Alto
**Descripción:** 2-5 personas que realizarán la planificación diaria

**Necesidades:**
- Interfaz intuitiva que no requiera formación extensa
- Capacidad de duplicar planificaciones entre semestres
- Herramientas de detección automática de conflictos
- Exportación de datos para informes oficiales
- Sistema de auditoría para trazabilidad de cambios

**Expectativas:**
- Formación completa antes de uso en producción
- Soporte técnico durante periodo de adaptación
- Manuales de usuario detallados
- Sistema estable sin pérdida de datos

#### STK-03: Profesorado de la EII
**Rol:** Usuarios secundarios y beneficiarios
**Interés:** Alto | **Poder:** Medio
**Descripción:** 80-120 profesores que impartirán docencia

**Necesidades:**
- Consulta fácil de su planificación personal
- Sistema sencillo para solicitar cambios de horario
- Sincronización automática con calendario personal
- Notificaciones rápidas de cambios en su horario
- Acceso desde dispositivos móviles

**Expectativas:**
- Interfaz simple que no requiera formación
- Respuesta rápida a solicitudes de cambio (<48h)
- Fiabilidad en sincronización con Google Calendar
- Privacidad de datos personales

#### STK-04: Estudiantes de la EII
**Rol:** Beneficiarios finales (usuarios de consulta)
**Interés:** Alto | **Poder:** Bajo
**Descripción:** 1000-1500 estudiantes que consultarán horarios

**Necesidades:**
- Acceso público sin necesidad de registro
- Consulta rápida de horarios actualizados
- Vista clara de sus asignaturas matriculadas
- Información de aulas y ubicaciones
- Acceso desde móvil

**Expectativas:**
- Horarios actualizados en tiempo real
- Disponibilidad 24/7
- Interfaz responsive para móvil
- Exportación a calendario personal

#### STK-05: Director/a de la Escuela de Ingeniería Informática
**Rol:** Autoridad final y aprobador del proyecto
**Interés:** Alto | **Poder:** Muy Alto
**Descripción:** Máximo responsable de la escuela

**Necesidades:**
- Mejora de la eficiencia administrativa
- Reducción de quejas de estudiantes por conflictos
- Imagen de modernización de la escuela
- Cumplimiento de normativas universitarias
- Control de costes del proyecto

**Expectativas:**
- Proyecto dentro de presupuesto aprobado
- Implantación sin interrupciones del servicio
- Mejora medible de satisfacción de usuarios
- Cumplimiento de normativas RGPD

### 3.1.2 Stakeholders Secundarios

#### STK-06: Jefes/as de Departamento
**Rol:** Responsables de asignación docente
**Interés:** Medio | **Poder:** Medio
**Descripción:** Responsables de departamentos que asignan profesores a asignaturas

**Necesidades:**
- Visibilidad de carga docente de su departamento
- Consulta de disponibilidad de profesores
- Reportes de horas asignadas por profesor

**Expectativas:**
- Datos actualizados tras cambios
- Exportación de informes por departamento

#### STK-07: Comisión de Garantía de Calidad
**Rol:** Validadores de cumplimiento normativo
**Interés:** Medio | **Poder:** Medio
**Descripción:** Comisión que verifica cumplimiento de estándares de calidad

**Necesidades:**
- Evidencia de planificación conforme a guías docentes
- Trazabilidad de cambios realizados
- Reportes para auditorías de calidad

**Expectativas:**
- Sistema de auditoría completo
- Exportación de logs para análisis

#### STK-08: Servicio de Informática (SUTIC)
**Rol:** Responsables de infraestructura IT
**Interés:** Alto | **Poder:** Alto
**Descripción:** Equipo técnico que desplegará y mantendrá el sistema

**Necesidades:**
- Arquitectura escalable y mantenible
- Documentación técnica completa
- Sistema de monitorización y alertas
- Procedimientos de backup y recuperación
- Seguridad robusta

**Expectativas:**
- Código limpio y bien documentado
- Tests automatizados
- Contenedores Docker para despliegue
- Plan de contingencia ante fallos

#### STK-09: Delegación de Alumnos
**Rol:** Representantes estudiantiles
**Interés:** Medio | **Poder:** Bajo
**Descripción:** Representantes de estudiantes en órganos de gobierno

**Necesidades:**
- Transparencia en planificación de horarios
- Consulta pública sin restricciones
- Canales para reportar errores en horarios

**Expectativas:**
- Información actualizada y fiable
- Accesibilidad universal

#### STK-10: Personal de Conserjería
**Rol:** Gestores de acceso a aulas
**Interés:** Medio | **Poder:** Bajo
**Descripción:** Personal que gestiona apertura de aulas y recursos

**Necesidades:**
- Consulta rápida de ocupación de aulas
- Información de eventos puntuales
- Vista diaria de reservas

**Expectativas:**
- Interfaz sencilla para consultas
- Información actualizada en tiempo real

### 3.1.3 Stakeholders Externos

#### STK-11: Vicerrectorado de Ordenación Académica (UniOvi)
**Rol:** Supervisores institucionales
**Interés:** Medio | **Poder:** Alto
**Descripción:** Órgano central de la Universidad que supervisa procesos académicos

**Necesidades:**
- Cumplimiento de normativas universitarias
- Coherencia con calendario académico oficial
- Reportes para verificación institucional

**Expectativas:**
- Conformidad con Reglamento Académico
- Datos exportables para auditorías

#### STK-12: Ministerio de Universidades (SIES)
**Rol:** Regulador externo
**Interés:** Bajo | **Poder:** Medio
**Descripción:** Organismo que gestiona el Sistema Integrado de Información Universitaria

**Necesidades:**
- Uso correcto de códigos SIES de asignaturas
- Coherencia con planes de estudio aprobados

**Expectativas:**
- Validación de códigos SIES
- Correspondencia con planes oficiales

#### STK-13: Google (Proveedor de API)
**Rol:** Proveedor de servicios de terceros
**Interés:** Bajo | **Poder:** Alto
**Descripción:** Empresa que proporciona Google Calendar API

**Necesidades:**
- Cumplimiento de políticas de uso de API
- Respeto a límites de tasa (rate limits)
- Privacidad de datos de usuarios

**Expectativas:**
- Uso conforme a términos de servicio
- Autenticación OAuth 2.0 correcta
- No almacenamiento de credenciales sin cifrar

#### STK-14: Agencia Española de Protección de Datos (AEPD)
**Rol:** Regulador de protección de datos
**Interés:** Medio | **Poder:** Muy Alto
**Descripción:** Autoridad que supervisa cumplimiento del RGPD

**Necesidades:**
- Cumplimiento estricto del RGPD
- Consentimiento informado de usuarios
- Medidas de seguridad adecuadas
- Procedimientos para ejercicio de derechos

**Expectativas:**
- Política de privacidad clara
- Cifrado de datos sensibles
- Auditorías de acceso a datos
- Procedimientos de borrado de datos

### 3.1.4 Stakeholders del Proyecto

#### STK-15: Equipo de Desarrollo
**Rol:** Desarrolladores del sistema
**Interés:** Muy Alto | **Poder:** Alto
**Descripción:** Equipo técnico que construirá el sistema

**Necesidades:**
- Requisitos claros y estables
- Acceso a stakeholders para clarificaciones
- Herramientas y recursos adecuados
- Tiempo suficiente para desarrollo de calidad

**Expectativas:**
- Especificaciones completas (SRS)
- Feedback regular de clientes
- Entorno de desarrollo apropiado
- Gestión realista de plazos

#### STK-16: Product Owner
**Rol:** Responsable de producto
**Interés:** Muy Alto | **Poder:** Alto
**Descripción:** Persona que define prioridades y valida requisitos

**Necesidades:**
- Comunicación fluida con cliente
- Capacidad de priorizar features
- Validar entregables con usuarios finales

**Expectativas:**
- Acceso directo al Subdirector/a de Ordenación Académica
- Participación en demos y validaciones
- Autoridad para decisiones de producto

#### STK-17: Equipo de QA/Testing
**Rol:** Responsables de calidad
**Interés:** Alto | **Poder:** Medio
**Descripción:** Equipo que verificará el cumplimiento de requisitos

**Necesidades:**
- Casos de prueba derivados de requisitos
- Entorno de testing
- Acceso a datos de prueba realistas

**Expectativas:**
- SRS con requisitos verificables
- Criterios de aceptación claros
- Tiempo suficiente para pruebas

#### STK-18: Arquitecto de Software
**Rol:** Diseñador de arquitectura técnica
**Interés:** Alto | **Poder:** Alto
**Descripción:** Responsable de decisiones técnicas de alto nivel

**Necesidades:**
- Comprensión de requisitos no funcionales
- Libertad para decisiones técnicas
- Colaboración con SUTIC

**Expectativas:**
- Requisitos de rendimiento y escalabilidad claros
- Restricciones técnicas documentadas

## 3.2 Matriz de Intereses y Poder

| Stakeholder | Interés | Poder | Estrategia de Gestión |
|-------------|---------|-------|----------------------|
| **STK-01**: Subdirector/a Ordenación | Muy Alto | Muy Alto | **Gestionar de cerca** - Comunicación constante, demos frecuentes |
| **STK-02**: Personal Administrativo | Muy Alto | Alto | **Gestionar de cerca** - Involucrar en diseño de UI, formación continua |
| **STK-03**: Profesorado | Alto | Medio | **Mantener satisfecho** - Comunicar beneficios, recoger feedback |
| **STK-04**: Estudiantes | Alto | Bajo | **Mantener informado** - Acceso público, encuestas de satisfacción |
| **STK-05**: Director/a EII | Alto | Muy Alto | **Gestionar de cerca** - Reportes ejecutivos, validación de hitos |
| **STK-06**: Jefes/as Departamento | Medio | Medio | **Mantener informado** - Comunicación de cambios |
| **STK-07**: Comisión Calidad | Medio | Medio | **Mantener informado** - Demostrar cumplimiento normativo |
| **STK-08**: SUTIC | Alto | Alto | **Gestionar de cerca** - Colaboración técnica estrecha |
| **STK-09**: Delegación Alumnos | Medio | Bajo | **Monitorear** - Consultas puntuales |
| **STK-10**: Conserjería | Medio | Bajo | **Monitorear** - Formación básica |
| **STK-11**: Vicerrectorado | Medio | Alto | **Mantener satisfecho** - Cumplimiento de normativas |
| **STK-12**: Ministerio (SIES) | Bajo | Medio | **Monitorear** - Validación de códigos |
| **STK-13**: Google | Bajo | Alto | **Mantener satisfecho** - Cumplir términos de servicio |
| **STK-14**: AEPD | Medio | Muy Alto | **Mantener satisfecho** - Cumplimiento estricto RGPD |
| **STK-15**: Equipo Desarrollo | Muy Alto | Alto | **Gestionar de cerca** - Recursos adecuados, requisitos claros |
| **STK-16**: Product Owner | Muy Alto | Alto | **Gestionar de cerca** - Decisiones ágiles de producto |
| **STK-17**: Equipo QA | Alto | Medio | **Mantener satisfecho** - SRS completa, tiempo para testing |
| **STK-18**: Arquitecto Software | Alto | Alto | **Gestionar de cerca** - Decisiones técnicas consensuadas |

## 3.3 Necesidades por Stakeholder

### Tabla de Necesidades Prioritarias

| ID | Stakeholder | Necesidad | Prioridad | Requisito Relacionado |
|----|-------------|-----------|-----------|----------------------|
| N-01 | STK-01, STK-02 | Detección automática de conflictos de horario | CRÍTICA | RF-EVENT-07 |
| N-02 | STK-01, STK-02 | Duplicación masiva de calendarios entre semestres | ALTA | RF-CAL-04 |
| N-03 | STK-03 | Sincronización con Google Calendar | ALTA | RF-SYNC-01 a 05 |
| N-04 | STK-03 | Sistema simple de solicitud de cambios | ALTA | RF-REQ-01 a 06 |
| N-05 | STK-04 | Consulta pública de horarios sin registro | CRÍTICA | RF-VIEW-01 |
| N-06 | STK-02 | Auditoría completa de cambios | ALTA | RF-AUDIT-01 a 03 |
| N-07 | STK-08 | Arquitectura escalable y mantenible | CRÍTICA | RNF-ARCH-01 a 03 |
| N-08 | STK-14 | Cumplimiento RGPD | CRÍTICA | RNF-SEC-04, RNF-SEC-05 |
| N-09 | STK-01, STK-05 | Reducción drástica de tiempo de planificación | CRÍTICA | (Objetivo general) |
| N-10 | STK-02 | Formación y manuales de usuario | ALTA | (No funcional) |
| N-11 | STK-03, STK-04 | Interfaz responsive para móvil | ALTA | RNF-UI-02 |
| N-12 | STK-02 | Exportación de datos a CSV | MEDIA | RF-EXPORT-01 |
| N-13 | STK-08 | Backups automáticos y plan de recuperación | CRÍTICA | RNF-DISP-03 |
| N-14 | STK-11 | Cumplimiento de normativa universitaria | ALTA | (Restricción REG-02) |
| N-15 | STK-01 | Reportes y estadísticas de uso de aulas | MEDIA | (Feature futura) |

---

# 4. Requisitos Específicos

**NOTA:** Debido a la extensión del documento, la sección de Requisitos Específicos se ha dividido en archivos separados para mejor organización y mantenibilidad:

- **[Requisitos Funcionales (Sección 4.1)](./SRS_Requisitos_Funcionales.md)**
  - RF-AUTH: Autenticación y Gestión de Usuarios
  - RF-USER: Gestión de Usuarios
  - RF-DEGREE: Gestión de Titulaciones
  - RF-SUBJECT: Gestión de Asignaturas
  - RF-GROUP: Gestión de Grupos
  - RF-CLASSROOM: Gestión de Aulas
  - RF-CAL: Gestión de Calendarios Académicos
  - RF-EVENT: Gestión de Eventos
  - RF-REQ: Solicitudes de Cambio
  - RF-VIEW: Visualización Pública
  - RF-SYNC: Sincronización con Google Calendar
  - RF-AUDIT: Auditoría
  - RF-EXPORT: Exportación de Datos

- **[Requisitos No Funcionales (Sección 4.2)](./SRS_Requisitos_NoFuncionales.md)**
  - RNF-PERF: Requisitos de Rendimiento
  - RNF-SCALE: Requisitos de Escalabilidad
  - RNF-DISP: Requisitos de Disponibilidad
  - RNF-SEC: Requisitos de Seguridad
  - RNF-UI: Requisitos de Usabilidad
  - RNF-MAINT: Requisitos de Mantenibilidad
  - RNF-PORT: Requisitos de Portabilidad
  - RNF-INT: Requisitos de Integración
  - RNF-COMP: Requisitos de Cumplimiento Normativo
  - RNF-SUP: Requisitos de Soporte y Documentación

---

# 5. Apéndices

**NOTA:** Los apéndices con diagramas, matrices y glosario están disponibles en:

- **[Apéndices Completos (Sección 5)](./SRS_Apendices.md)**
  - 5.1 Diagramas UML
  - 5.2 Matriz de Trazabilidad de Requisitos
  - 5.3 Glosario Técnico
  - 5.4 Resumen de Verificación de Requisitos
  - 5.5 Plan de Implementación Sugerido
  - 5.6 Conclusiones

---

# Índice de Documentos del SRS

Este SRS está organizado en los siguientes documentos:

1. **[SRS_TeachingPlanner.md](./SRS_TeachingPlanner.md)** (ESTE DOCUMENTO)
   - Introducción
   - Descripción General
   - Stakeholders
   - Índice de Documentos

2. **[SRS_Requisitos_Funcionales.md](./SRS_Requisitos_Funcionales.md)**
   - Todos los requisitos funcionales detallados (RF-AUTH a RF-EXPORT)
   - 60+ requisitos con criterios de aceptación

3. **[SRS_Requisitos_NoFuncionales.md](./SRS_Requisitos_NoFuncionales.md)**
   - Todos los requisitos no funcionales (RNF-PERF a RNF-SUP)
   - 30+ requisitos de calidad, seguridad y rendimiento

4. **[SRS_Apendices.md](./SRS_Apendices.md)**
   - Diagramas UML (Casos de Uso, Clases, Secuencia, Estados, Despliegue)
   - Matrices de Trazabilidad
   - Glosario Técnico
   - Plan de Implementación

---

# Resumen Ejecutivo

## Visión General del Sistema

TeachingPlanner es un sistema web de gestión de planificación académica diseñado para la Escuela de Ingeniería Informática de Oviedo. Su objetivo principal es **automatizar y optimizar** el proceso actualmente manual de asignación de horarios, grupos y aulas, reduciendo errores y facilitando la gestión de cambios durante el curso académico.

## Beneficios Clave

- **Ahorro de tiempo:** Reducción estimada del 70% en tiempo dedicado a planificación manual
- **Reducción de errores:** Detección automática del 100% de conflictos de horario
- **Mejora en comunicación:** Sincronización automática con Google Calendar
- **Accesibilidad:** Consulta pública de horarios 24/7 sin autenticación
- **Trazabilidad:** Registro completo de cambios con auditoría

## Usuarios del Sistema

- **Administradores (2-5 usuarios):** Control total del sistema, planificación académica
- **Profesores (80-120 usuarios):** Consulta de planificación, solicitudes de cambio
- **Estudiantes y Público (1000+ usuarios):** Consulta pública de horarios

## Alcance Técnico

- **Arquitectura:** Microservicios con Docker
- **Frontend:** React 18+ con TypeScript
- **Backend:** Node.js 20+ con Express y TypeORM
- **Base de Datos:** PostgreSQL 15+
- **Integraciones:** Google Calendar API, Email SMTP

## Requisitos Destacados

### Requisitos Críticos
1. **Detección automática de conflictos** de horario antes de crear eventos
2. **Vista pública de horarios** accesible sin autenticación
3. **Seguridad y cumplimiento RGPD** con encriptación y auditoría
4. **Disponibilidad 24/7** con backups automáticos diarios

### Funcionalidades Principales
- Gestión completa de estructura académica (titulaciones, asignaturas, grupos, aulas)
- Creación de calendarios con generación automática de días lectivos
- Eventos periódicos y puntuales con validación de solapamientos
- Sistema de solicitudes de cambio (profesor → administrador)
- Sincronización bidireccional con Google Calendar
- Exportación a PDF y CSV
- Auditoría completa de todas las modificaciones

## Métricas de Calidad

- **Rendimiento:** Tiempo de respuesta <2s para operaciones comunes
- **Escalabilidad:** Soporte para 200 usuarios concurrentes
- **Disponibilidad:** 99.5% uptime anual (43.8h downtime/año máximo)
- **Seguridad:** HTTPS obligatorio, JWT, bcrypt, cumplimiento RGPD
- **Cobertura de Tests:** >70% en código crítico

## Plan de Implementación

**Fase 1 - MVP (3 meses):** Sistema básico funcional con autenticación, estructura académica, calendarios y eventos periódicos

**Fase 2 - Avanzado (2 meses):** Solicitudes de cambio, sincronización Google Calendar, eventos puntuales

**Fase 3 - Optimización (1 mes):** Rendimiento, exportaciones, documentación

**Fase 4 - Despliegue (1 mes):** Migración de datos, formación, estabilización

**Total estimado:** 7 meses

## Stakeholders Principales

1. **Subdirector/a de Ordenación Académica** - Cliente y sponsor
2. **Personal Administrativo** - Usuarios principales (administradores)
3. **Profesorado** - Usuarios secundarios (solicitudes y consulta)
4. **Estudiantes** - Beneficiarios finales (consulta pública)
5. **Director/a de la EII** - Autoridad final y aprobador
6. **SUTIC** - Responsables de infraestructura IT

## Cumplimiento Normativo

- **RGPD (Reglamento General de Protección de Datos)**
- **Normativa Universitaria de la Universidad de Oviedo**
- **WCAG 2.1 Nivel AA** (Accesibilidad Web)
- **Sistema ECTS** de créditos europeos

## Documentación Completa

Para detalles completos, consulte:
- **60+ Requisitos Funcionales** en [SRS_Requisitos_Funcionales.md](./SRS_Requisitos_Funcionales.md)
- **30+ Requisitos No Funcionales** en [SRS_Requisitos_NoFuncionales.md](./SRS_Requisitos_NoFuncionales.md)
- **Diagramas y Matrices** en [SRS_Apendices.md](./SRS_Apendices.md)

---

**Versión:** 1.0
**Fecha:** 02/03/2026
**Estado:** Pendiente de Aprobación
**Elaborado por:** Equipo TeachingPlanner

