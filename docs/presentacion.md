# Presentación — TeachingPlanner

> **Duración objetivo:** ~10 minutos de exposición oral + vídeo demo

---

## Diapositiva 1 — Portada

**TeachingPlanner**
*Sistema web de gestión de horarios académicos*

- Autor: [Nombre]
- Tutor: [Nombre tutor]
- Grado / Máster en Ingeniería Informática
- Curso 2025-2026

---

## Diapositiva 2 — Motivación y contexto

**¿Por qué existe este proyecto?**

- Los departamentos académicos gestionan horarios con **ficheros Excel compartidos** en red
- Múltiples personas editando el mismo fichero → conflictos frecuentes
- Sin validación automática → solapamientos, errores no detectados
- Sin flujo estructurado de cambios → correos informales, pérdida de trazabilidad

> "El objetivo es **sustituir el fichero compartido** por una herramienta web colaborativa, validada y auditable."

---

## Diapositiva 3 — Alcance y objetivos

**Objetivos del proyecto**

1. Crear un sistema web accesible desde el navegador sin instalación local
2. Gestionar eventos lectivos **periódicos y puntuales** con detección automática de conflictos
3. Proporcionar un flujo de **solicitud de cambios** aprobado por el administrador
4. Sincronizar con **Google Calendar** para visibilidad personal
5. Mantener **compatibilidad** con el ecosistema de herramientas legado (importación/exportación)
6. Registro de auditoría completo de todas las acciones

---

## Diapositiva 4 — Arquitectura del sistema

**Diseño en microservicios**

```
┌────────────────────────────────────────────────────┐
│                  React Frontend (Next.js)           │
└────────────────────┬───────────────────────────────┘
                     │  HTTPS
┌────────────────────▼───────────────────────────────┐
│              API Gateway (Nginx)                   │
└──────┬──────────────┬───────────────┬──────────────┘
       │              │               │
  ┌────▼────┐   ┌─────▼──────┐  ┌────▼───────┐
  │  Auth   │   │  Usuarios  │  │ Planificador│
  │ Service │   │  Service   │  │  Service   │
  └────┬────┘   └─────┬──────┘  └────┬───────┘
       │              │               │
  ┌────▼──────────────▼───────────────▼───────┐
  │            2 × MariaDB                    │
  └───────────────────────────────────────────┘
```

- **4 servicios independientes** + frontend
- Comunicación interna por red Docker privada
- JWT + RBAC para autenticación y autorización

---

## Diapositiva 5 — Roles y permisos

**3 niveles de acceso**

| Rol | Capacidades |
|-----|-------------|
| **Administrador** | Configuración total: calendarios, grupos, estructura académica, aprobación de solicitudes |
| **Profesor** | Consulta de su horario, solicitud de cambios |
| **Invitado** | Consulta pública de horarios sin autenticación |

- Autenticación: usuario/contraseña **y OAuth con Google**
- Control de acceso basado en roles (RBAC) en cada endpoint

---

## Diapositiva 6 — Modelo de eventos

**Dos tipos de eventos**

| Tipo | Descripción |
|------|-------------|
| **Puntual** | Ocurre una sola vez en una fecha y hora concretas |
| **Periódico** | Se repite según el tipo de semana del calendario lectivo |

**Caracteres de evento periódico:**
- `N` — Normal: se repite todas las semanas lectivas en round-robin
- `P` — Par: solo en semanas pares
- `I` — Impar: solo en semanas impares
- `A`, `B`, `C`… — Custom: cuando el día lectivo incluye ese carácter

**Detección de conflictos:** el sistema genera los eventos del calendario completo y detecta solapamientos de forma precisa.

---

## Diapositiva 7 — Flujo de solicitudes de cambio

**Proceso estructurado de modificaciones**

```
Profesor detecta necesidad de cambio
           │
           ▼
   Crea solicitud de cambio en la app
           │
           ▼
  Administrador recibe notificación
           │
    ┌──────┴──────┐
    ▼             ▼
 Aprueba       Rechaza
    │
    ▼
Cambio aplicado automáticamente al calendario
    │
    ▼
 Registro en log de auditoría
```

- Elimina los correos informales
- Trazabilidad completa de quién aprobó cada cambio y cuándo

---

## Diapositiva 8 — Integración con Google Calendar

**Sincronización bidireccional**

- El profesor conecta su cuenta Google mediante **OAuth 2.0**
- TeachingPlanner exporta los eventos del horario a su Google Calendar personal
- Actualizaciones automáticas cuando el administrador modifica el calendario
- Compatible con cualquier app que consuma Google Calendar (móvil, escritorio)

---

## Diapositiva 9 — Pruebas y calidad

**Estrategia de testing en 3 niveles**

| Nivel | Herramienta | Qué cubre |
|-------|-------------|-----------|
| Análisis estático | SonarQube | Code smells, deuda técnica, vulnerabilidades |
| Tests de integración | Jest + Testcontainers | 27 casos — APIs contra BD real |
| Tests E2E | Playwright | 57 casos — flujos completos en navegador |

- Cobertura objetivo: **≥ 70%**
- Pipeline CI/CD con **GitHub Actions** → ejecuta los 3 niveles automáticamente en cada PR

---

## Diapositiva 10 — Despliegue

**3 entornos de despliegue**

| Entorno | Descripción |
|---------|-------------|
| **Local** | Docker Compose — para desarrollo |
| **VM Azure (pública)** | Desplegado en Azure con dominio público y TLS |
| **VM privada** | Self-hosted GitHub Actions runner en red interna |

- Infraestructura completa dockerizada
- Certificados TLS automáticos (Let's Encrypt)
- Health checks y monitorización de contenedores

---

## Diapositiva 11 — Gestión del proyecto

**Datos del proyecto**

- **Duración:** Junio 2025 – Mayo 2026 (51 semanas)
- **Esfuerzo estimado:** 365 horas
- **Valor de mercado estimado:** 11.775 € 
- **Metodología:** Iterativa incremental (5 iteraciones)
- **11 riesgos identificados y mitigados** (complejidad del planificador, OAuth, aprovisionamiento VM…)

**Hitos principales:**
1. Prototipo de autenticación
2. Gestión de usuarios y estructura académica
3. Motor de planificación (core)
4. Integración Google Calendar + solicitudes
5. Despliegue en producción + pruebas E2E

---

## Diapositiva 12 — Conclusiones y trabajo futuro

**Conclusiones**

- Sistema **desplegado y funcional** en producción
- Cubre todos los objetivos planteados
- Demuestra la viabilidad de arquitecturas microservicio en proyectos académicos

**Líneas de trabajo futuro**

1. Integración con Microsoft / Azure AD
2. Interfaz de consulta del log de auditoría
3. Undo/redo de acciones en el calendario
4. Notificaciones en tiempo real (WebSockets)
5. Web Application Firewall (WAF) y rate limiting

---

## Diapositiva 13 — Demo en vídeo

> *A continuación se proyecta el vídeo de demostración de la aplicación.*

*(~3-5 minutos)*

---

## Diapositiva 14 — Preguntas

**¿Preguntas?**

- Repositorio: [enlace]
- Documentación: [enlace]
- Contacto: murias101010@gmail.com
