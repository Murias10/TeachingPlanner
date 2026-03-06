# 4.2 Requisitos No Funcionales - TeachingPlanner

## 4.2.1 Requisitos de Rendimiento (RNF-PERF)

### RNF-PERF-01: Tiempo de Respuesta para Operaciones Comunes
**Prioridad:** ALTA
**Descripción:** El sistema debe responder en tiempos aceptables para mantener una buena experiencia de usuario.

**Métricas:**
| Operación | Tiempo Máximo | Condiciones |
|-----------|---------------|-------------|
| Login | 1 segundo | 95% de las veces |
| Listar entidades (usuarios, asignaturas, etc.) | 2 segundos | Hasta 1000 registros |
| Crear/Editar entidad | 1 segundo | Operación simple |
| Crear evento con validación de conflictos | 3 segundos | Calendario con hasta 500 eventos |
| Vista pública de horarios | 3 segundos | Carga inicial con caché |
| Duplicar calendario | 10 segundos | Hasta 200 eventos |
| Sincronización inicial con Google Calendar | 2 minutos | Hasta 100 eventos |
| Exportar a PDF | 10 segundos | Calendario de 1 semana |
| Consultar logs de auditoría | 2 segundos | Con filtros aplicados |

**Criterios de Medición:**
- Tiempos medidos desde el cliente (incluye latencia de red)
- En condiciones de carga normal (hasta 50 usuarios concurrentes)
- Servidor con recursos especificados en RNF-SCALE-01

**Pruebas:**
- Tests de rendimiento automatizados con herramientas como JMeter o k6
- Métricas de APM (Application Performance Monitoring) en producción

---

### RNF-PERF-02: Tiempo de Respuesta para API REST
**Prioridad:** ALTA
**Descripción:** Los endpoints de la API deben responder eficientemente.

**Métricas por Tipo de Endpoint:**
- **GET (lectura)**: <500ms (percentil 95)
- **POST/PUT (escritura)**: <1s (percentil 95)
- **DELETE**: <1s (percentil 95)
- **Búsquedas complejas**: <2s (percentil 95)

**Consideraciones:**
- Implementar paginación en listados grandes
- Caché para datos estáticos (titulaciones, aulas)
- Índices en BD para campos de búsqueda frecuente

---

### RNF-PERF-03: Optimización de Consultas a Base de Datos
**Prioridad:** ALTA
**Descripción:** Las consultas a la base de datos deben estar optimizadas.

**Requisitos:**
- Uso de índices en columnas de búsqueda frecuente:
  - Emails (usuarios)
  - Códigos (aulas, asignaturas)
  - Fechas (calendarios, eventos)
  - Foreign keys (todas las relaciones)
- Consultas con JOINS optimizados (evitar N+1 queries)
- Uso de eager loading para relaciones frecuentes
- Queries complejas con EXPLAIN ANALYZE < 50ms

**Índices Requeridos:**
```sql
-- Usuarios
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Calendarios
CREATE INDEX idx_calendars_course_semester ON calendars(id_course, semester);

-- Eventos
CREATE INDEX idx_periodic_events_calendar ON periodic_events(id_calendar);
CREATE INDEX idx_puntual_events_day ON puntual_events(id_day);

-- Auditoría
CREATE INDEX idx_audit_logs_user ON audit_logs(user_email);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
```

---

### RNF-PERF-04: Uso de Caché
**Prioridad:** MEDIA
**Descripción:** El sistema debe implementar caché para datos consultados frecuentemente.

**Estrategia de Caché:**
| Tipo de Dato | TTL (Time To Live) | Estrategia |
|--------------|-------------------|-----------|
| Vista pública de horarios | 5 minutos | Cache-Control header |
| Listado de titulaciones | 1 hora | In-memory cache |
| Listado de aulas | 1 hora | In-memory cache |
| Configuración del sistema | 24 horas | In-memory cache |
| Calendarios activos | 15 minutos | In-memory cache |

**Invalidación de Caché:**
- Invalidar automáticamente cuando se modifiquen datos
- Endpoint manual de limpieza de caché para administradores

**Tecnología:**
- Redis (opcional para caché distribuido)
- Node.js memory cache (para implementación simple)

---

## 4.2.2 Requisitos de Escalabilidad (RNF-SCALE)

### RNF-SCALE-01: Capacidad de Usuarios Concurrentes
**Prioridad:** ALTA
**Descripción:** El sistema debe soportar múltiples usuarios simultáneos sin degradación.

**Capacidad Mínima:**
- **200 usuarios concurrentes** en operaciones normales
- **500 usuarios concurrentes** en consulta pública (lectura)
- **50 usuarios concurrentes** en operaciones de escritura (administradores)

**Picos Esperados:**
- Inicio de semestre: 500-1000 consultas públicas simultáneas
- Periodo de planificación (julio-agosto): 20-30 administradores trabajando

**Recursos Mínimos del Servidor:**
- CPU: 4 cores
- RAM: 8 GB
- Disco: 100 GB SSD
- Red: 100 Mbps

**Escalabilidad Horizontal:**
- Arquitectura preparada para balanceo de carga (opcional)
- Servicios stateless para permitir múltiples instancias
- Base de datos con réplicas de lectura (futuro)

---

### RNF-SCALE-02: Volumen de Datos
**Prioridad:** ALTA
**Descripción:** El sistema debe manejar eficientemente el volumen de datos esperado.

**Volumen Estimado (5 años):**
| Entidad | Registros Estimados |
|---------|---------------------|
| Usuarios | 500 |
| Titulaciones | 20 |
| Cursos Académicos | 10 |
| Asignaturas | 500 |
| Grupos | 2,000 |
| Aulas | 150 |
| Calendarios | 100 (10 cursos × 2 semestres × 5 titulaciones aprox.) |
| Días | 10,000 (100 calendarios × 100 días promedio) |
| Eventos Periódicos | 10,000 |
| Eventos Puntuales | 5,000 |
| Solicitudes | 2,000 |
| Logs de Auditoría | 100,000 |

**Tamaño Estimado de Base de Datos:** 5-10 GB (5 años)

**Capacidad de Crecimiento:**
- Sistema debe funcionar eficientemente hasta 10x el volumen estimado
- Archivado de logs antiguos (>2 años) en almacenamiento secundario

---

### RNF-SCALE-03: Crecimiento Futuro
**Prioridad:** MEDIA
**Descripción:** El sistema debe permitir crecimiento sin refactorización mayor.

**Consideraciones de Diseño:**
- Arquitectura modular para agregar nuevas funcionalidades
- API REST versionada para compatibilidad
- Esquema de BD normalizado y extensible
- Separación clara entre frontend y backend

**Extensiones Futuras Previstas:**
- Soporte para más titulaciones/centros de la Universidad
- Asignación automática de profesores
- Optimización automática de horarios (algoritmos)
- Integración con otros sistemas (matrícula, actas, etc.)

---

## 4.2.3 Requisitos de Disponibilidad (RNF-DISP)

### RNF-DISP-01: Disponibilidad del Sistema
**Prioridad:** CRÍTICA
**Descripción:** El sistema debe estar disponible continuamente.

**Objetivo de Disponibilidad:** 99.5% uptime anual

**Cálculo:**
- 99.5% = 43.8 horas de downtime permitido al año
- Aprox. 3.65 horas de downtime por mes

**Ventanas de Mantenimiento:**
- Mantenimiento programado solo en periodos no lectivos
- Notificación mínima de 7 días calendario
- Ventanas de mantenimiento máx. 4 horas
- Mantenimientos preferiblemente en madrugadas o fines de semana

**Exclusiones:**
- Caídas por causas de fuerza mayor (desastres naturales, apagones generales)
- Mantenimientos de emergencia por seguridad

---

### RNF-DISP-02: Recuperación ante Fallos (RTO/RPO)
**Prioridad:** CRÍTICA
**Descripción:** El sistema debe poder recuperarse rápidamente de fallos.

**Objetivos:**
- **RTO (Recovery Time Objective):** 4 horas
  - Tiempo máximo para restaurar el sistema tras una caída
- **RPO (Recovery Point Objective):** 24 horas
  - Pérdida máxima de datos aceptable (datos de hasta 1 día)

**Plan de Recuperación:**
1. Detección de fallo: <15 minutos (monitorización automática)
2. Notificación a equipo técnico: <5 minutos
3. Diagnóstico: <1 hora
4. Restauración desde backup: <2 horas
5. Validación y puesta en marcha: <1 hora

**Alta Disponibilidad (Opcional - Futuro):**
- Despliegue en múltiples nodos con balanceador
- Base de datos con réplica en standby
- Failover automático

---

### RNF-DISP-03: Copias de Seguridad (Backups)
**Prioridad:** CRÍTICA
**Descripción:** El sistema debe realizar copias de seguridad automáticas.

**Estrategia de Backup:**

**A) Backup Completo:**
- Frecuencia: Diario (madrugada, 3:00 AM)
- Retención: 30 días
- Contenido: Base de datos completa + archivos de configuración

**B) Backup Incremental:**
- Frecuencia: Cada 6 horas
- Retención: 7 días
- Contenido: Cambios desde último backup completo

**C) Backup de Logs:**
- Frecuencia: Diario
- Retención: 90 días
- Contenido: Logs de aplicación y auditoría

**D) Archivado de Largo Plazo:**
- Frecuencia: Al finalizar cada semestre
- Retención: 5 años
- Contenido: Snapshot completo del semestre
- Formato: SQL dump + documentación

**Ubicación de Backups:**
- Primario: Mismo servidor (disco separado)
- Secundario: Servidor remoto o cloud storage (obligatorio)
- Terciario: Backup offline mensual (recomendado)

**Pruebas de Restauración:**
- Prueba de restauración completa: Semestral
- Validación de integridad: Semanal
- Documentación del proceso: Actualizada

**Características:**
- Backups automáticos (scripts cron o servicio de backup)
- Encriptación de backups (AES-256)
- Notificación de éxito/fallo por email
- Logs de todos los backups realizados

---

### RNF-DISP-04: Monitorización y Alertas
**Prioridad:** ALTA
**Descripción:** El sistema debe tener monitorización activa para detectar problemas.

**Métricas a Monitorizar:**
- **Disponibilidad:** Ping cada 1 minuto
- **Tiempo de respuesta:** Endpoints críticos cada 5 minutos
- **Uso de CPU:** Alerta si >80% por 5 minutos
- **Uso de RAM:** Alerta si >85% por 5 minutos
- **Uso de Disco:** Alerta si >80%
- **Errores HTTP 5xx:** Alerta si >10 en 10 minutos
- **Consultas BD lentas:** Alerta si >100ms promedio
- **Fallos de backup:** Alerta inmediata

**Herramientas:**
- Health check endpoint: `/api/health`
- Logs centralizados (ELK stack o similar - opcional)
- APM (Application Performance Monitoring) - opcional
- Uptime monitoring (UptimeRobot, Pingdom, etc.)

**Notificaciones:**
- Email a equipo técnico para alertas críticas
- Dashboard de estado visible para administradores

---

## 4.2.4 Requisitos de Seguridad (RNF-SEC)

### RNF-SEC-01: Autenticación Segura
**Prioridad:** CRÍTICA
**Descripción:** El sistema debe implementar autenticación robusta.

**Requisitos:**
- **Contraseñas:**
  - Almacenadas con bcrypt (factor de costo mínimo 10)
  - Longitud mínima: 8 caracteres
  - Requisitos: Al menos 1 mayúscula, 1 minúscula, 1 número
  - No permitir contraseñas comunes (diccionario de contraseñas débiles)

- **Tokens JWT:**
  - Firmados con algoritmo HS256 o RS256
  - Secret key de al menos 256 bits
  - Expiración: 24 horas
  - Incluir claims: userId, email, role, iat, exp
  - No incluir información sensible en payload

- **Sesiones:**
  - Una sesión activa por usuario (opcional)
  - Cierre automático tras inactividad (opcional - futuro)
  - Invalidación de sesión al cambiar contraseña

**Política de Contraseñas:**
- Cambio obligatorio tras primer login (activación)
- Recuperación solo mediante email verificado
- Token de recuperación válido 1 hora
- No reutilizar últimas 3 contraseñas (futuro)

---

### RNF-SEC-02: Autorización y Control de Acceso
**Prioridad:** CRÍTICA
**Descripción:** El sistema debe controlar acceso basado en roles (RBAC).

**Roles Definidos:**
1. **ROLE_ADMIN:**
   - Acceso total a todas las funcionalidades
   - CRUD de todas las entidades
   - Aprobación de solicitudes
   - Consulta de auditorías
   - Gestión de usuarios

2. **ROLE_PROFESSOR:**
   - Consulta de horarios públicos
   - Consulta de su planificación personal
   - Creación de solicitudes de cambio
   - Gestión de su perfil
   - Sincronización con Google Calendar

3. **ANÓNIMO (sin autenticación):**
   - Solo consulta de horarios públicos
   - No acceso a endpoints protegidos

**Implementación:**
- Middleware de autenticación verifica JWT en todas las rutas protegidas
- Middleware de autorización verifica rol necesario
- Validación tanto en frontend como backend
- Mensajes de error genéricos (no revelar existencia de recursos)

**Matriz de Permisos:**
| Funcionalidad | ADMIN | PROFESSOR | ANÓNIMO |
|---------------|-------|-----------|---------|
| Ver horarios públicos | ✓ | ✓ | ✓ |
| Gestionar usuarios | ✓ | ✗ | ✗ |
| Gestionar estructura académica | ✓ | ✗ | ✗ |
| Gestionar calendarios | ✓ | ✗ | ✗ |
| Gestionar eventos | ✓ | ✗ | ✗ |
| Crear solicitudes | ✓ | ✓ | ✗ |
| Aprobar solicitudes | ✓ | ✗ | ✗ |
| Ver auditorías | ✓ | ✗ | ✗ |
| Exportar datos | ✓ | ✗ | ✗ |
| Sincronizar Google Calendar | ✓ | ✓ | ✗ |

---

### RNF-SEC-03: Comunicación Segura (HTTPS)
**Prioridad:** CRÍTICA
**Descripción:** Toda la comunicación debe ser cifrada.

**Requisitos:**
- **HTTPS obligatorio** para todas las comunicaciones
- Certificado SSL/TLS válido (no autofirmado en producción)
- Redirección automática HTTP → HTTPS
- HSTS (HTTP Strict Transport Security) habilitado
- TLS versión mínima: 1.2 (preferiblemente 1.3)
- Cipher suites seguros (sin RC4, DES, etc.)

**Headers de Seguridad:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: no-referrer-when-downgrade
```

**Certificados:**
- Renovación automática (Let's Encrypt recomendado)
- Alertas si certificado expira en <30 días
- Verificación periódica de configuración SSL (SSL Labs)

---

### RNF-SEC-04: Protección de Datos Personales (RGPD)
**Prioridad:** CRÍTICA
**Descripción:** El sistema debe cumplir con el Reglamento General de Protección de Datos.

**Datos Personales Almacenados:**
- Nombre y apellidos
- Email
- Usuario UniOvi
- Rol
- Tokens de Google (encriptados)

**Medidas de Cumplimiento:**

**A) Consentimiento:**
- Política de privacidad visible en registro
- Checkbox de aceptación obligatorio
- Consentimiento explícito para sincronización con Google

**B) Minimización de Datos:**
- Solo recopilar datos estrictamente necesarios
- No solicitar datos innecesarios (ej: fecha de nacimiento, teléfono)

**C) Derechos de los Usuarios:**
- **Derecho de Acceso:** Usuario puede descargar sus datos
- **Derecho de Rectificación:** Usuario puede editar su perfil
- **Derecho de Supresión:** Administrador puede eliminar usuario (anonimización)
- **Derecho de Portabilidad:** Exportación de datos en formato JSON

**D) Seguridad de Datos:**
- Contraseñas encriptadas con bcrypt
- Tokens de Google encriptados en BD (AES-256)
- Backups encriptados
- Acceso a BD solo mediante credenciales seguras

**E) Retención de Datos:**
- Datos de usuarios activos: Indefinidamente
- Datos de usuarios eliminados: Anonimizados (reemplazar email/nombre con hash)
- Logs de auditoría: 2 años
- Backups archivados: 5 años (calendarios históricos)

**F) Notificación de Brechas:**
- Plan de respuesta ante brechas de seguridad
- Notificación a AEPD en <72 horas si aplica
- Notificación a usuarios afectados

**G) Responsable de Datos:**
- Designar responsable de protección de datos (DPO)
- Contacto visible en política de privacidad

---

### RNF-SEC-05: Prevención de Vulnerabilidades
**Prioridad:** ALTA
**Descripción:** El sistema debe estar protegido contra vulnerabilidades comunes (OWASP Top 10).

**Protecciones Implementadas:**

**A) Inyección SQL:**
- Uso exclusivo de ORM (TypeORM) con consultas parametrizadas
- Nunca concatenar strings para construir queries
- Validación de tipos de entrada

**B) Autenticación Rota:**
- Implementación correcta de JWT
- Tokens con expiración
- Validación de tokens en cada petición

**C) Exposición de Datos Sensibles:**
- Contraseñas nunca devueltas en API
- Tokens de Google encriptados en BD
- No incluir información sensible en logs

**D) XXE (XML External Entities):**
- No procesamiento de XML (usar JSON)

**E) Control de Acceso Roto:**
- Validación de autorización en cada endpoint
- Verificar que usuario solo accede a sus recursos
- No confiar en datos del cliente (validar en servidor)

**F) Configuración Incorrecta:**
- Variables de entorno para configuración sensible
- No exponer stack traces en producción
- Desactivar listado de directorios

**G) XSS (Cross-Site Scripting):**
- Escapado de HTML en frontend (React lo hace por defecto)
- Validación de entrada en backend
- Content Security Policy habilitado

**H) Deserialización Insegura:**
- Validación de datos JSON con esquemas (zod, joi, etc.)
- No usar eval() o similar

**I) Componentes con Vulnerabilidades Conocidas:**
- Actualización regular de dependencias npm
- Uso de npm audit / Snyk
- Renovación de paquetes con vulnerabilidades

**J) Logging y Monitorización Insuficiente:**
- Log de todos los eventos de seguridad
- Registro de intentos fallidos de login
- Alertas ante actividad sospechosa

**K) CSRF (Cross-Site Request Forgery):**
- Tokens CSRF en formularios (opcional con JWT)
- SameSite cookie attribute
- Verificación de origen de peticiones

**L) CORS Configurado Correctamente:**
- Lista blanca de orígenes permitidos
- No usar wildcard (*) en producción
- Credentials solo si es necesario

---

### RNF-SEC-06: Rate Limiting
**Prioridad:** MEDIA
**Descripción:** El sistema debe limitar peticiones para prevenir abuso.

**Límites por Endpoint:**
| Endpoint | Límite | Ventana |
|----------|--------|---------|
| POST /api/auth/login | 5 intentos | 15 minutos |
| POST /api/auth/register | 3 intentos | 1 hora |
| POST /api/auth/forgot-password | 3 intentos | 1 hora |
| GET /api/public/* | 100 peticiones | 1 minuto |
| Otros endpoints autenticados | 60 peticiones | 1 minuto |
| API en general | 1000 peticiones | 1 hora |

**Implementación:**
- Librería express-rate-limit o similar
- Identificación por IP o por usuario autenticado
- Respuesta HTTP 429 Too Many Requests
- Header Retry-After indicando cuándo reintentar

**Excepciones:**
- IPs de confianza (red interna universidad) sin límite
- Monitorización de tráfico para ajustar límites

---

## 4.2.5 Requisitos de Usabilidad (RNF-UI)

### RNF-UI-01: Interfaz Intuitiva
**Prioridad:** ALTA
**Descripción:** La interfaz debe ser fácil de usar sin formación extensa.

**Principios de Diseño:**
- **Simplicidad:** Evitar sobrecarga de información
- **Consistencia:** Mismo estilo en toda la aplicación
- **Feedback:** Confirmaciones de acciones, mensajes de error claros
- **Prevención de errores:** Validaciones en tiempo real
- **Recuperación:** Deshacer acciones críticas (opcional)

**Guías de UI/UX:**
- Formularios con labels claros
- Campos obligatorios marcados visualmente
- Mensajes de error específicos (no genéricos)
- Confirmaciones para acciones destructivas
- Indicadores de carga (spinners) para operaciones largas
- Breadcrumbs para navegación
- Tooltips para ayuda contextual

**Estándares de Accesibilidad:**
- Cumplimiento WCAG 2.1 nivel AA (mínimo)
- Contraste de colores adecuado (ratio 4.5:1 para texto)
- Tamaños de fuente legibles (mín. 14px)
- Navegación por teclado funcional
- Alt text en imágenes
- Labels en campos de formulario
- ARIA attributes donde sea necesario

---

### RNF-UI-02: Diseño Responsive
**Prioridad:** ALTA
**Descripción:** La aplicación debe funcionar en dispositivos de diferentes tamaños.

**Breakpoints:**
- **Mobile:** <768px (teléfonos)
- **Tablet:** 768px - 1024px (tablets)
- **Desktop:** >1024px (ordenadores)

**Adaptaciones por Dispositivo:**
- **Mobile:**
  - Menú hamburguesa
  - Tablas en formato de tarjetas
  - Formularios en una columna
  - Botones grandes (min 44x44px para touch)
  - Vistas simplificadas

- **Tablet:**
  - Menú lateral colapsable
  - Tablas con scroll horizontal si es necesario
  - Formularios en 1-2 columnas

- **Desktop:**
  - Menú lateral fijo
  - Tablas completas
  - Formularios en 2-3 columnas
  - Uso completo del espacio

**Testing:**
- Pruebas en Chrome DevTools (responsive mode)
- Testing en dispositivos reales (iOS, Android)
- Validación en navegadores principales

---

### RNF-UI-03: Internacionalización (i18n)
**Prioridad:** BAJA (Futuro)
**Descripción:** El sistema debe estar preparado para múltiples idiomas.

**Fase Inicial:**
- Interfaz completamente en **Español**
- Textos hardcodeados aceptables en v1.0

**Preparación Futura:**
- Uso de librería de i18n (react-i18next)
- Separación de textos en archivos de traducción
- Fechas con formato locale-aware
- Números con formato locale-aware

**Idiomas Objetivo (Futuro):**
- Español (ES) - Primario
- Inglés (EN) - Secundario
- Asturiano (AS) - Opcional

---

### RNF-UI-04: Tiempos de Carga
**Prioridad:** MEDIA
**Descripción:** La aplicación debe cargar rápidamente.

**Objetivos:**
- **First Contentful Paint (FCP):** <1.8 segundos
- **Largest Contentful Paint (LCP):** <2.5 segundos
- **Time to Interactive (TTI):** <3.8 segundos
- **Cumulative Layout Shift (CLS):** <0.1

**Optimizaciones:**
- Code splitting por rutas
- Lazy loading de componentes pesados
- Imágenes optimizadas (WebP, lazy loading)
- Minificación de JS/CSS
- Compresión gzip/brotli
- CDN para assets estáticos (opcional)

**Medición:**
- Google Lighthouse score >90
- WebPageTest performance grade A/B

---

## 4.2.6 Requisitos de Mantenibilidad (RNF-MAINT)

### RNF-MAINT-01: Calidad del Código
**Prioridad:** ALTA
**Descripción:** El código debe ser limpio, legible y mantenible.

**Estándares de Código:**
- **TypeScript:** Strict mode habilitado
- **Linting:** ESLint con reglas estrictas
- **Formatting:** Prettier con configuración consistente
- **Convenciones de Nombres:**
  - Variables/funciones: camelCase
  - Clases/Interfaces: PascalCase
  - Constantes: UPPER_SNAKE_CASE
  - Archivos: kebab-case

**Estructura de Proyecto:**
- Separación clara por capas: controllers, services, entities, routes
- Un archivo por clase/componente
- Máximo 300 líneas por archivo (recomendado)
- Organización por features, no por tipo de archivo

**Complejidad:**
- Complejidad ciclomática <10 por función
- Funciones <50 líneas (recomendado)
- Evitar anidamiento >3 niveles

---

### RNF-MAINT-02: Documentación del Código
**Prioridad:** ALTA
**Descripción:** El código debe estar adecuadamente documentado.

**Documentación Requerida:**
- **README.md** en raíz del proyecto:
  - Descripción del proyecto
  - Instrucciones de instalación
  - Configuración de entorno (.env)
  - Comandos disponibles
  - Arquitectura general

- **Comentarios JSDoc** en:
  - Funciones públicas
  - Clases y sus métodos
  - Interfaces complejas
  - Lógica de negocio no obvia

- **API Documentation:**
  - Swagger/OpenAPI para endpoints REST
  - Ejemplos de peticiones/respuestas
  - Códigos de error documentados

- **Documentación Técnica:**
  - Arquitectura del sistema (diagrama)
  - Modelo de datos (ERD)
  - Flujos de autenticación
  - Integración con Google Calendar

**Ejemplos de JSDoc:**
```typescript
/**
 * Creates a new periodic event in the calendar
 * @param calendarId - UUID of the calendar
 * @param eventData - Event details including groups, classrooms, schedule
 * @returns Promise with created event or throws error if conflicts exist
 * @throws {ConflictError} If time slot is already occupied
 */
async function createPeriodicEvent(calendarId: string, eventData: EventData): Promise<Event>
```

---

### RNF-MAINT-03: Testing
**Prioridad:** ALTA
**Descripción:** El sistema debe tener cobertura de tests adecuada.

**Tipos de Tests:**

**A) Tests Unitarios:**
- Framework: Jest
- Cobertura objetivo: >70%
- Focos: Servicios, funciones de utilidad, validaciones
- Ejecución: En cada commit (pre-commit hook)

**B) Tests de Integración:**
- Framework: Jest + Supertest
- Cobertura: Endpoints críticos de API
- Focos: Flujos completos (CRUD, autenticación, etc.)
- Ejecución: En CI/CD

**C) Tests E2E (Opcional - Futuro):**
- Framework: Cypress o Playwright
- Cobertura: Flujos de usuario principales
- Focos: Login, creación de eventos, vista pública
- Ejecución: Antes de releases

**Estructura de Tests:**
```
tests/
  unit/
    services/
    utils/
  integration/
    controllers/
  e2e/
    scenarios/
```

**Métricas de Calidad:**
- Cobertura de líneas: >70%
- Cobertura de funciones: >80%
- Todos los tests deben pasar antes de merge
- Tests deben ser independientes (no orden específico)

---

### RNF-MAINT-04: Versionado y Control de Cambios
**Prioridad:** ALTA
**Descripción:** El código debe estar bajo control de versiones con buenas prácticas.

**Sistema de Control de Versiones:**
- Git como sistema de control de versiones
- Repositorio centralizado (GitHub, GitLab, etc.)
- Branches protegidos (main, develop)

**Estrategia de Branching:**
- **main:** Código en producción
- **develop:** Código en desarrollo
- **feature/[nombre]:** Nuevas funcionalidades
- **fix/[nombre]:** Correcciones de bugs
- **hotfix/[nombre]:** Correcciones urgentes en producción

**Commits:**
- Mensajes descriptivos en español o inglés
- Formato: `[tipo]: descripción breve`
  - Tipos: feat, fix, docs, style, refactor, test, chore
- Ejemplo: `feat: añadir detección de conflictos de horario`

**Pull Requests:**
- Revisión de código por al menos 1 persona
- Tests pasando antes de merge
- Lint sin errores
- Descripción clara de cambios

**Versionado Semántico:**
- Formato: MAJOR.MINOR.PATCH (ej: 1.2.3)
- MAJOR: Cambios incompatibles con versiones anteriores
- MINOR: Nuevas funcionalidades compatibles
- PATCH: Correcciones de bugs

---

### RNF-MAINT-05: Logs del Sistema
**Prioridad:** ALTA
**Descripción:** El sistema debe generar logs adecuados para diagnóstico.

**Niveles de Log:**
- **ERROR:** Errores que requieren atención inmediata
- **WARN:** Situaciones anómalas que no impiden funcionamiento
- **INFO:** Eventos importantes del sistema
- **DEBUG:** Información detallada para debugging (solo en desarrollo)

**Qué Loguear:**
- Inicios y cierres de sesión
- Errores de API (con stack trace)
- Operaciones críticas (creación de calendarios, eventos, etc.)
- Fallos de validación
- Errores de integración (Google Calendar)
- Rendimiento de consultas lentas

**Qué NO Loguear:**
- Contraseñas
- Tokens completos (solo primeros/últimos caracteres)
- Datos personales sensibles

**Formato de Logs:**
```json
{
  "timestamp": "2026-03-02T10:30:45.123Z",
  "level": "ERROR",
  "service": "planner-service",
  "message": "Failed to create event",
  "userId": "user@example.com",
  "error": "ConflictError: Time slot already occupied",
  "context": {
    "calendarId": "abc-123",
    "eventData": {...}
  }
}
```

**Rotación de Logs:**
- Rotación diaria
- Retención: 30 días en servidor
- Compresión de logs antiguos
- Archivado opcional en almacenamiento externo

---

## 4.2.7 Requisitos de Portabilidad (RNF-PORT)

### RNF-PORT-01: Independencia de Plataforma
**Prioridad:** MEDIA
**Descripción:** El sistema debe poder desplegarse en diferentes entornos.

**Compatibilidad de Sistema Operativo:**
- Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+)
- Windows Server (con Docker)
- macOS (solo desarrollo)

**Containerización:**
- Uso de Docker para empaquetado
- Docker Compose para orchestración local
- Imágenes base oficiales (node:20-alpine)
- Variables de entorno para configuración

**Despliegue:**
- Scripts de despliegue automatizados
- Instrucciones claras de instalación
- Configuración mediante variables de entorno (.env)

---

### RNF-PORT-02: Compatibilidad de Navegadores
**Prioridad:** ALTA
**Descripción:** La aplicación web debe funcionar en navegadores modernos.

**Navegadores Soportados:**
| Navegador | Versión Mínima |
|-----------|----------------|
| Google Chrome | Últimas 2 versiones |
| Mozilla Firefox | Últimas 2 versiones |
| Safari | Últimas 2 versiones |
| Microsoft Edge | Últimas 2 versiones |

**No Soportados:**
- Internet Explorer (EOL)
- Navegadores obsoletos sin actualizaciones

**Detección de Navegador:**
- Mensaje de advertencia si navegador no soportado
- Funcionalidad degradada en lugar de bloqueo total

---

### RNF-PORT-03: Independencia de Base de Datos
**Prioridad:** BAJA
**Descripción:** Minimizar acoplamiento con PostgreSQL específico.

**Enfoque:**
- Uso de ORM (TypeORM) para abstracción
- Evitar SQL nativo (usar query builder)
- Evitar features específicas de PostgreSQL (a menos que sean críticas)

**Excepciones Permitidas:**
- Uso de JSONB para campos dinámicos (campos `changes` en auditoría)
- Índices específicos de PostgreSQL si mejoran significativamente rendimiento

---

## 4.2.8 Requisitos de Integración (RNF-INT)

### RNF-INT-01: API REST Estándar
**Prioridad:** ALTA
**Descripción:** La API debe seguir estándares REST.

**Principios REST:**
- Recursos identificados por URLs
- Uso correcto de métodos HTTP:
  - GET: Lectura
  - POST: Creación
  - PUT/PATCH: Actualización
  - DELETE: Eliminación
- Códigos de estado HTTP apropiados
- Stateless (sin estado en servidor)

**Códigos de Estado:**
- **200 OK:** Operación exitosa
- **201 Created:** Recurso creado exitosamente
- **204 No Content:** Eliminación exitosa
- **400 Bad Request:** Datos inválidos
- **401 Unauthorized:** No autenticado
- **403 Forbidden:** No autorizado
- **404 Not Found:** Recurso no encontrado
- **409 Conflict:** Conflicto (ej: horarios)
- **422 Unprocessable Entity:** Validación fallida
- **429 Too Many Requests:** Rate limit excedido
- **500 Internal Server Error:** Error del servidor

**Formato de Respuesta Estándar:**
```json
{
  "status": "success" | "error",
  "message": "Descripción legible",
  "data": { ... } | null
}
```

**Versionado de API:**
- Prefijo `/api/v1/...`
- Preparado para futuras versiones (`/api/v2/`)

---

### RNF-INT-02: Integración con Google Calendar
**Prioridad:** ALTA
**Descripción:** Integración confiable con Google Calendar API.

**Requisitos:**
- Uso de Google Calendar API v3
- Autenticación OAuth 2.0
- Renovación automática de tokens
- Manejo de errores de API (rate limits, timeouts)
- Reintentos con backoff exponencial
- Sincronización bidireccional (crear, actualizar, eliminar)

**Manejo de Errores:**
- Token expirado → Refresh automático
- Refresh token inválido → Notificar usuario
- Rate limit excedido → Queue de peticiones
- Timeout → Reintentar hasta 3 veces

**Límites de Google:**
- Respetar límites de rate limiting (1,000,000 queries/día)
- Batch operations cuando sea posible
- Caché de respuestas cuando aplique

---

### RNF-INT-03: Integración con Servicio de Email
**Prioridad:** ALTA
**Descripción:** Envío confiable de correos electrónicos.

**Casos de Uso:**
- Activación de cuenta
- Recuperación de contraseña
- Notificación de solicitudes (a administradores)
- Notificación de aprobación/rechazo (a profesores)
- Alertas de sistema (a técnicos)

**Proveedores Soportados:**
- SMTP genérico (Gmail, Outlook, etc.)
- SendGrid (opcional)
- AWS SES (opcional)

**Configuración:**
- Variables de entorno para credenciales SMTP
- Plantillas de email en HTML
- Fallback a texto plano

**Características:**
- Queue de emails para evitar bloqueos
- Reintentos en caso de fallo
- Logs de emails enviados
- No bloquear operaciones principales si falla envío

**Plantillas de Email:**
- Activación de cuenta
- Recuperación de contraseña
- Notificación de solicitud creada
- Notificación de solicitud aprobada
- Notificación de solicitud rechazada

---

## 4.2.9 Requisitos de Cumplimiento Normativo (RNF-COMP)

### RNF-COMP-01: Cumplimiento RGPD
**Prioridad:** CRÍTICA
**Descripción:** Ver detalles en RNF-SEC-04

---

### RNF-COMP-02: Cumplimiento de Normativa Universitaria
**Prioridad:** ALTA
**Descripción:** El sistema debe respetar normativas académicas.

**Normativas Aplicables:**
- Reglamento Académico de la Universidad de Oviedo
- Normativa de evaluación
- Calendarios oficiales aprobados por Consejo de Gobierno
- Sistema ECTS de créditos

**Requisitos:**
- Calendarios deben respetar fechas oficiales de la Universidad
- Códigos SIES deben corresponder con planes de estudio oficiales
- Carga horaria debe respetar límites ECTS
- Auditoría debe permitir trazabilidad para acreditaciones

---

### RNF-COMP-03: Accesibilidad (WCAG)
**Prioridad:** MEDIA
**Descripción:** Cumplimiento de estándares de accesibilidad web.

**Nivel de Conformidad:** WCAG 2.1 nivel AA

**Requisitos Principales:**
- **Perceptible:**
  - Alt text en imágenes
  - Contraste de colores adecuado (4.5:1 para texto)
  - Contenido no solo por color

- **Operable:**
  - Navegación por teclado completa
  - Sin trampas de teclado
  - Tiempo suficiente para interactuar

- **Comprensible:**
  - Idioma de página declarado
  - Mensajes de error claros
  - Labels en formularios

- **Robusto:**
  - HTML semántico válido
  - ARIA attributes correctos
  - Compatible con lectores de pantalla

**Validación:**
- Herramientas automáticas (WAVE, axe DevTools)
- Testing manual con lectores de pantalla (NVDA, JAWS)

---

## 4.2.10 Requisitos de Soporte y Documentación (RNF-SUP)

### RNF-SUP-01: Documentación de Usuario
**Prioridad:** ALTA
**Descripción:** Debe existir documentación para usuarios finales.

**Documentos Requeridos:**

**A) Manual de Usuario para Administradores:**
- Gestión de usuarios
- Creación de calendarios
- Gestión de eventos
- Aprobación de solicitudes
- Consulta de auditorías
- Exportación de datos
- Solución de problemas comunes

**B) Manual de Usuario para Profesores:**
- Primer acceso (activación)
- Consulta de horarios
- Creación de solicitudes
- Sincronización con Google Calendar

**C) Guía de Consulta Pública:**
- Cómo consultar horarios
- Filtros disponibles
- Exportación a PDF

**Formato:**
- PDF descargable
- Sección de ayuda en la aplicación
- Videos tutoriales (opcional - futuro)

---

### RNF-SUP-02: Documentación Técnica
**Prioridad:** ALTA
**Descripción:** Documentación para equipo técnico y desarrolladores.

**Documentos Requeridos:**

**A) Manual de Instalación:**
- Requisitos de sistema
- Instalación paso a paso
- Configuración de entorno
- Problemas comunes y soluciones

**B) Manual de Despliegue:**
- Proceso de despliegue
- Configuración de producción
- Backups y restauración
- Monitorización

**C) Documentación de API:**
- Swagger/OpenAPI spec completo
- Ejemplos de uso
- Códigos de error
- Rate limits

**D) Documentación de Arquitectura:**
- Diagrama de arquitectura
- Flujo de datos
- Diagrama de base de datos (ERD)
- Decisiones de diseño

---

### RNF-SUP-03: Soporte y Mantenimiento
**Prioridad:** MEDIA
**Descripción:** Plan de soporte post-lanzamiento.

**Niveles de Soporte:**

**A) Soporte Nivel 1 - Usuario:**
- Consultas generales
- Problemas de uso
- Canal: Email, formulario web
- Tiempo de respuesta: 48 horas

**B) Soporte Nivel 2 - Técnico:**
- Problemas técnicos
- Bugs reportados
- Canal: Email técnico, issue tracker
- Tiempo de respuesta: 24 horas

**C) Soporte Nivel 3 - Emergencia:**
- Sistema caído
- Pérdida de datos
- Seguridad comprometida
- Canal: Teléfono, email urgente
- Tiempo de respuesta: 2 horas

**Mantenimiento:**
- Actualizaciones de seguridad: Mensual
- Actualizaciones de funcionalidad: Trimestral
- Revisiones de rendimiento: Semestral

---
