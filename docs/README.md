# Documentación TeachingPlanner

Esta carpeta contiene la **Especificación de Requisitos de Software (SRS)** completa del sistema TeachingPlanner, organizada en documentos modulares para facilitar su lectura y mantenimiento.

## 📋 Estructura de Documentos

### 1. Documento Principal
**[SRS_TeachingPlanner.md](./SRS_TeachingPlanner.md)** - 100 páginas aprox.
- ✅ Sección 1: Introducción
- ✅ Sección 2: Descripción General
- ✅ Sección 3: Stakeholders (18 stakeholders identificados)
- ✅ Resumen Ejecutivo
- ✅ Índice de documentos

### 2. Requisitos Funcionales
**[SRS_Requisitos_Funcionales.md](./SRS_Requisitos_Funcionales.md)** - 120 páginas aprox.
- ✅ **FR-AUTH:** Autenticación y Gestión de Usuarios (6 requisitos)
- ✅ **FR-USER:** Gestión de Usuarios (3 requisitos)
- ✅ **FR-DEGREE:** Gestión de Titulaciones (4 requisitos)
- ✅ **FR-SUBJECT:** Gestión de Asignaturas (4 requisitos)
- ✅ **FR-GROUP:** Gestión de Grupos (4 requisitos)
- ✅ **FR-CLASSROOM:** Gestión de Aulas (4 requisitos)
- ✅ **FR-CAL:** Gestión de Calendarios Académicos (5 requisitos)
- ✅ **FR-EVENT:** Gestión de Eventos (8 requisitos)
- ✅ **FR-REQ:** Solicitudes de Cambio (6 requisitos)
- ✅ **FR-VIEW:** Visualización Pública (2 requisitos)
- ✅ **FR-SYNC:** Sincronización con Google Calendar (5 requisitos)
- ✅ **FR-AUDIT:** Auditoría (3 requisitos)
- ✅ **FR-EXPORT:** Exportación de Datos (1 requisito)

**Total:** 60+ requisitos funcionales detallados con:
- Descripción completa
- Entradas y salidas
- Proceso paso a paso
- Validaciones
- Casos de error
- Criterios de aceptación

### 3. Requisitos No Funcionales
**[SRS_Requisitos_NoFuncionales.md](./SRS_Requisitos_NoFuncionales.md)** - 80 páginas aprox.
- ✅ **NFR-PERF:** Rendimiento (4 requisitos)
- ✅ **NFR-SCALE:** Escalabilidad (3 requisitos)
- ✅ **NFR-DISP:** Disponibilidad (4 requisitos)
- ✅ **NFR-SEC:** Seguridad (6 requisitos)
- ✅ **NFR-UI:** Usabilidad (4 requisitos)
- ✅ **NFR-MAINT:** Mantenibilidad (5 requisitos)
- ✅ **NFR-PORT:** Portabilidad (3 requisitos)
- ✅ **NFR-INT:** Integración (3 requisitos)
- ✅ **NFR-COMP:** Cumplimiento Normativo (3 requisitos)
- ✅ **NFR-SUP:** Soporte y Documentación (3 requisitos)

**Total:** 30+ requisitos no funcionales con métricas específicas

### 4. Apéndices
**[SRS_Apendices.md](./SRS_Apendices.md)** - 60 páginas aprox.
- ✅ **5.1 Diagramas UML:**
  - Diagrama de Casos de Uso
  - Diagrama de Clases (Modelo de Dominio)
  - Diagramas de Secuencia
  - Diagrama de Estados
  - Diagrama de Despliegue
- ✅ **5.2 Matrices de Trazabilidad:**
  - Requisitos ↔ Stakeholders
  - Requisitos ↔ Casos de Uso
  - Cobertura de Tests
- ✅ **5.3 Glosario Técnico**
- ✅ **5.4 Verificación de Requisitos**
- ✅ **5.5 Plan de Implementación**
- ✅ **5.6 Conclusiones**

## 🎯 Cómo Navegar la Documentación

### Para Diferentes Roles

#### 📊 Directivos y Sponsors
**Empezar con:** [Resumen Ejecutivo](./SRS_TeachingPlanner.md#resumen-ejecutivo)
- Visión general del sistema
- Beneficios esperados
- Plan de implementación
- Stakeholders principales

**Luego revisar:**
- [Sección 3: Stakeholders](./SRS_TeachingPlanner.md#3-stakeholders) - Identificación de interesados
- [Conclusiones](./SRS_Apendices.md#56-conclusiones) - Viabilidad y próximos pasos

#### 👨‍💼 Administradores Académicos (Clientes)
**Empezar con:** [Descripción General](./SRS_TeachingPlanner.md#2-descripción-general)
- Funciones del producto
- Características de usuarios

**Luego revisar:**
- [Requisitos Funcionales](./SRS_Requisitos_Funcionales.md) - Todas las funcionalidades
- [FR-CAL](./SRS_Requisitos_Funcionales.md#417-módulo-de-gestión-de-calendarios-rf-cal) - Gestión de calendarios
- [FR-EVENT](./SRS_Requisitos_Funcionales.md#418-módulo-de-gestión-de-eventos-rf-event) - Gestión de eventos
- [FR-REQ](./SRS_Requisitos_Funcionales.md#419-módulo-de-solicitudes-de-cambio-rf-req) - Solicitudes de cambio

#### 👨‍🏫 Profesores (Usuarios Finales)
**Empezar con:** [Características de Usuarios - Profesor](./SRS_TeachingPlanner.md#232-profesor-role_professor)

**Luego revisar:**
- [FR-VIEW](./SRS_Requisitos_Funcionales.md#4110-módulo-de-visualización-pública-rf-view) - Consulta de horarios
- [FR-REQ](./SRS_Requisitos_Funcionales.md#419-módulo-de-solicitudes-de-cambio-rf-req) - Solicitar cambios
- [FR-SYNC](./SRS_Requisitos_Funcionales.md#4111-módulo-de-sincronización-con-google-calendar-rf-sync) - Google Calendar

#### 👨‍💻 Equipo de Desarrollo
**Empezar con:** [Arquitectura del Sistema](./SRS_TeachingPlanner.md#213-arquitectura-del-sistema)

**Luego revisar:**
- [Requisitos Funcionales completos](./SRS_Requisitos_Funcionales.md)
- [Requisitos No Funcionales completos](./SRS_Requisitos_NoFuncionales.md)
- [Diagramas UML](./SRS_Apendices.md#51-diagramas-uml)
- [Plan de Implementación](./SRS_Apendices.md#55-plan-de-implementación-sugerido)

#### 🔧 Equipo de IT/Infraestructura
**Empezar con:** [Restricciones Técnicas](./SRS_TeachingPlanner.md#242-restricciones-técnicas)

**Luego revisar:**
- [NFR-SCALE](./SRS_Requisitos_NoFuncionales.md#422-requisitos-de-escalabilidad-rnf-scale) - Escalabilidad
- [NFR-DISP](./SRS_Requisitos_NoFuncionales.md#423-requisitos-de-disponibilidad-rnf-disp) - Disponibilidad y backups
- [NFR-SEC](./SRS_Requisitos_NoFuncionales.md#424-requisitos-de-seguridad-rnf-sec) - Seguridad
- [Diagrama de Despliegue](./SRS_Apendices.md#516-diagrama-de-despliegue)

#### 🧪 Equipo de QA/Testing
**Empezar con:** [Matriz de Cobertura de Tests](./SRS_Apendices.md#523-matriz-de-cobertura-de-tests)

**Luego revisar:**
- [Criterios de Aceptación](./SRS_Requisitos_Funcionales.md) - En cada requisito funcional
- [NFR-MAINT-03](./SRS_Requisitos_NoFuncionales.md#rnf-maint-03-testing) - Requisitos de testing
- [Verificación de Requisitos](./SRS_Apendices.md#54-resumen-de-verificación-de-requisitos)

## 📊 Estadísticas del SRS

| Métrica | Valor |
|---------|-------|
| **Páginas totales** | ~350 |
| **Stakeholders identificados** | 18 |
| **Requisitos funcionales** | 60+ |
| **Requisitos no funcionales** | 30+ |
| **Diagramas UML** | 5 |
| **Casos de uso documentados** | 25+ |
| **Entidades de dominio** | 15 |
| **Términos en glosario** | 40+ |

## 🎓 Estándares Seguidos

Este SRS cumple con los siguientes estándares:

- ✅ **IEEE 830-1998:** Recommended Practice for Software Requirements Specifications
- ✅ **ISO/IEC 25010:** Systems and software Quality Requirements and Evaluation
- ✅ Estructura clara y organizada
- ✅ Requisitos verificables y trazables
- ✅ Separación entre funcionales y no funcionales
- ✅ Criterios de aceptación explícitos
- ✅ Diagramas UML estándar
- ✅ Glosario de términos

## 🔍 Búsqueda Rápida de Requisitos

### Por Prioridad

**Requisitos CRÍTICOS:**
- FR-EVENT-07 - Detección automática de conflictos
- FR-VIEW-01 - Vista pública de horarios
- FR-CAL-01 - Crear calendario académico
- FR-AUDIT-01 - Registro automático de acciones
- NFR-SEC-01 a 06 - Seguridad completa
- NFR-DISP-01 a 03 - Disponibilidad y backups

**Requisitos ALTOS:**
- FR-AUTH-01 a 06 - Autenticación completa
- FR-CAL-04 - Duplicar calendario
- FR-REQ-01 a 06 - Solicitudes de cambio
- FR-SYNC-01 a 05 - Google Calendar

### Por Módulo

- **Autenticación:** [FR-AUTH-01 a 06](./SRS_Requisitos_Funcionales.md#411-módulo-de-autenticación-y-gestión-de-usuarios-rf-auth)
- **Calendarios:** [FR-CAL-01 a 05](./SRS_Requisitos_Funcionales.md#417-módulo-de-gestión-de-calendarios-rf-cal)
- **Eventos:** [FR-EVENT-01 a 08](./SRS_Requisitos_Funcionales.md#418-módulo-de-gestión-de-eventos-rf-event)
- **Solicitudes:** [FR-REQ-01 a 06](./SRS_Requisitos_Funcionales.md#419-módulo-de-solicitudes-de-cambio-rf-req)
- **Seguridad:** [NFR-SEC-01 a 06](./SRS_Requisitos_NoFuncionales.md#424-requisitos-de-seguridad-rnf-sec)

## 📝 Historial de Cambios

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | 02/03/2026 | Equipo TeachingPlanner | Documento inicial completo |

## 📞 Contacto

Para consultas sobre este SRS:
- **Product Owner:** [pendiente de asignar]
- **Arquitecto de Software:** [pendiente de asignar]
- **Cliente Principal:** Subdirector/a de Ordenación Académica - EII

## 📄 Licencia

Este documento es propiedad de la **Universidad de Oviedo - Escuela de Ingeniería Informática**.

Todos los derechos reservados. © 2026

---

**Última actualización:** 02/03/2026
**Estado del documento:** Pendiente de Aprobación
**Próxima revisión:** Tras validación con stakeholders principales

---

## 🚀 Próximos Pasos

1. ✅ **Completado:** Elaboración del SRS completo
2. ⏳ **Pendiente:** Revisión con Subdirector/a de Ordenación Académica (STK-01)
3. ⏳ **Pendiente:** Validación con Personal Administrativo (STK-02)
4. ⏳ **Pendiente:** Presentación a Director/a de la EII (STK-05)
5. ⏳ **Pendiente:** Revisión técnica con SUTIC (STK-08)
6. ⏳ **Pendiente:** Aprobación final
7. ⏳ **Pendiente:** Inicio de Fase 1 - MVP

**Meta:** Aprobación del SRS antes del 31/03/2026 para inicio del desarrollo en abril 2026.