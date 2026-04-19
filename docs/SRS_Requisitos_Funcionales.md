# 4. Requisitos Específicos - TeachingPlanner

## 4.1 Requisitos Funcionales

### 4.1.1 Módulo de Autenticación y Gestión de Usuarios (RF-AUTH)

#### RF-AUTH-01: Registro de Nuevos Usuarios
**Prioridad:** ALTA
**Descripción:** El sistema debe permitir a un administrador registrar nuevos usuarios en el sistema.

**Entradas:**
- Nombre (obligatorio, máx. 255 caracteres)
- Primer apellido (obligatorio, máx. 255 caracteres)
- Segundo apellido (obligatorio, máx. 255 caracteres)
- Email (obligatorio, formato RFC 5322, único en el sistema)
- Rol (obligatorio: ROLE_ADMIN o ROLE_PROFESSOR)
- Usuario UniOvi (opcional, máx. 255 caracteres)

**Proceso:**
1. Administrador completa formulario de registro
2. Sistema valida formato de email (RFC 5322)
3. Sistema verifica que el email no esté ya registrado
4. Sistema genera contraseña temporal aleatoria
5. Sistema crea el usuario con estado `is_active=false`
6. Sistema genera token de activación único con validez de 24 horas
7. Sistema envía email con enlace de activación y contraseña temporal
8. Sistema muestra confirmación de registro

**Salidas:**
- Usuario creado en base de datos
- Email de activación enviado
- Mensaje de confirmación al administrador

**Validaciones:**
- Email válido según RFC 5322
- Email único (no existente en BD)
- Todos los campos obligatorios completos
- Rol válido (solo ROLE_ADMIN o ROLE_PROFESSOR)

**Casos de Error:**
- ER-AUTH-01-01: Email ya registrado → Mensaje: "El email ya está registrado en el sistema"
- ER-AUTH-01-02: Email inválido → Mensaje: "Formato de email inválido"
- ER-AUTH-01-03: Error de envío de email → Mensaje: "Usuario creado pero error al enviar email de activación"

**Criterios de Aceptación:**
- Usuario puede recibir email de activación en menos de 2 minutos
- Token de activación tiene validez de exactamente 24 horas
- Contraseña temporal generada cumple política de seguridad (mín. 12 caracteres, mayúsculas, minúsculas, números)

---

#### RF-AUTH-02: Activación de Cuenta
**Prioridad:** ALTA
**Descripción:** El usuario debe poder activar su cuenta mediante el enlace recibido por email.

**Entradas:**
- Token de activación (en URL)
- Nueva contraseña (mín. 8 caracteres)
- Confirmación de contraseña

**Proceso:**
1. Usuario accede a URL con token de activación
2. Sistema verifica validez del token (existente y no expirado)
3. Usuario establece nueva contraseña personalizada
4. Sistema valida que ambas contraseñas coincidan
5. Sistema valida requisitos de seguridad de contraseña
6. Sistema encripta contraseña con bcrypt (factor 10)
7. Sistema marca cuenta como `is_active=true`
8. Sistema invalida token de activación
9. Sistema redirige a página de login

**Salidas:**
- Cuenta activada
- Contraseña personalizada establecida
- Redirección a login

**Validaciones:**
- Token existente y no expirado (<24h desde emisión)
- Contraseña mín. 8 caracteres
- Contraseña coincide con confirmación
- Contraseña incluye al menos: 1 mayúscula, 1 minúscula, 1 número

**Casos de Error:**
- ER-AUTH-02-01: Token expirado → Mensaje: "El enlace ha expirado. Solicite un nuevo enlace al administrador"
- ER-AUTH-02-02: Token inválido → Mensaje: "Enlace de activación inválido"
- ER-AUTH-02-03: Contraseñas no coinciden → Mensaje: "Las contraseñas no coinciden"
- ER-AUTH-02-04: Contraseña débil → Mensaje: "La contraseña debe tener mínimo 8 caracteres incluyendo mayúsculas, minúsculas y números"

---

#### RF-AUTH-03: Inicio de Sesión (Login)
**Prioridad:** CRÍTICA
**Descripción:** Los usuarios deben poder autenticarse en el sistema mediante email y contraseña.

**Entradas:**
- Email
- Contraseña

**Proceso:**
1. Usuario ingresa credenciales en formulario de login
2. Sistema verifica que el usuario existe
3. Sistema verifica que la cuenta está activada (`is_active=true`)
4. Sistema compara contraseña con hash almacenado (bcrypt)
5. Sistema genera JWT con payload:
   - userId (UUID)
   - email
   - role (ROLE_ADMIN/ROLE_PROFESSOR)
   - iat (issued at)
   - exp (expiration: 24h)
6. Sistema devuelve JWT al cliente
8. Cliente almacena JWT en localStorage/sessionStorage
9. Sistema redirige según rol:
   - ROLE_ADMIN → Dashboard administrativo
   - ROLE_PROFESSOR → Vista de profesor

**Salidas:**
- JWT válido con expiración de 24h
- Redirección a página correspondiente según rol

**Validaciones:**
- Usuario existe en BD
- Cuenta está activada
- Contraseña correcta

**Casos de Error:**
- ER-AUTH-03-01: Usuario no existe → Mensaje: "Credenciales inválidas"
- ER-AUTH-03-02: Cuenta no activada → Mensaje: "La cuenta no ha sido activada. Revise su email"
- ER-AUTH-03-03: Contraseña incorrecta → Mensaje: "Credenciales inválidas"
- ER-AUTH-03-04: Cuenta bloqueada (futuro) → Mensaje: "La cuenta ha sido bloqueada. Contacte con administración"

**Criterios de Aceptación:**
- Tiempo de respuesta <1 segundo para login exitoso
- JWT incluye todos los claims necesarios

---

#### RF-AUTH-04: Cierre de Sesión (Logout)
**Prioridad:** ALTA
**Descripción:** Los usuarios deben poder cerrar sesión de forma segura.

**Entradas:**
- JWT actual del usuario

**Proceso:**
1. Usuario hace clic en "Cerrar Sesión"
2. Cliente elimina JWT de localStorage/sessionStorage
3. Sistema redirige a página de login
4. (Opcional futuro) Sistema invalida JWT en blacklist

**Salidas:**
- Sesión cerrada
- JWT eliminado del cliente
- Redirección a login

**Criterios de Aceptación:**
- JWT se elimina completamente del cliente
- No es posible realizar acciones autenticadas tras logout

---

#### RF-AUTH-05: Recuperación de Contraseña
**Prioridad:** ALTA
**Descripción:** Los usuarios deben poder recuperar su contraseña mediante un código OTP de verificación enviado por email.

**Entradas (Paso 1 - Solicitud):**
- Email del usuario

**Entradas (Paso 2 - Verificación OTP):**
- Email
- Código OTP de 6 dígitos

**Entradas (Paso 3 - Nueva contraseña):**
- Token de reseteo (devuelto en paso 2)
- Nueva contraseña
- Confirmación de contraseña

**Proceso:**
1. Usuario accede a "¿Olvidó su contraseña?"
2. Usuario ingresa su email
3. Sistema verifica que el email existe y está activado
4. Sistema genera código OTP de 6 dígitos con validez de 15 minutos
5. Sistema almacena OTP en memoria (asociado al email) con su expiración
6. Sistema aplica cooldown: no permite nueva solicitud hasta 60 segundos tras la anterior
7. Sistema envía email con el código OTP
8. Usuario introduce el código OTP en el formulario de verificación
9. Sistema valida el OTP → devuelve `resetToken` de un solo uso
10. Usuario establece nueva contraseña usando el `resetToken`
11. Sistema valida la nueva contraseña
12. Sistema encripta la nueva contraseña (bcrypt factor 10)
13. Sistema invalida el `resetToken`
14. Sistema actualiza la contraseña en base de datos

**Salidas:**
- Email con código OTP enviado
- `resetToken` temporal tras verificación OTP exitosa
- Contraseña actualizada

**Validaciones:**
- Email existe en sistema
- Cuenta está activada
- OTP no expirado (<15 minutos)
- OTP correcto
- Nueva contraseña: mínimo 6 caracteres
- Confirmación de contraseña coincide con nueva contraseña

**Casos de Error:**
- ER-AUTH-05-01: Email no registrado → Mensaje genérico: "Si el email existe, recibirá instrucciones" (por seguridad)
- ER-AUTH-05-02: OTP expirado → Mensaje: "El código ha expirado. Solicite uno nuevo"
- ER-AUTH-05-03: OTP inválido → Mensaje: "Código de verificación inválido"
- ER-AUTH-05-04: Cooldown activo → No se puede solicitar nuevo código hasta transcurrido el tiempo de espera
- ER-AUTH-05-05: Contraseña débil → Mensaje: "La contraseña debe tener al menos 6 caracteres"

---

#### RF-AUTH-06: Autenticación con Google OAuth
**Prioridad:** ALTA
**Descripción:** Los usuarios deben poder vinc ular su cuenta con Google para sincronización de calendario.

**Entradas:**
- JWT del usuario autenticado
- Consentimiento de Google OAuth

**Proceso:**
1. Usuario autenticado accede a configuración
2. Usuario hace clic en "Conectar con Google Calendar"
3. Sistema redirige a pantalla de consentimiento de Google
4. Usuario autoriza acceso a Google Calendar
5. Google devuelve authorization code
6. Sistema intercambia code por access_token y refresh_token
7. Sistema almacena tokens encriptados en BD
8. Sistema almacena Google ID y fecha de expiración
9. Sistema activa flag `google_calendar_sync_enabled=true`
10. Sistema confirma conexión exitosa

**Salidas:**
- Tokens de Google almacenados
- Sincronización habilitada
- Confirmación visual al usuario

**Validaciones:**
- Usuario ya autenticado en TeachingPlanner
- Consentimiento de Google obtenido
- Tokens válidos recibidos de Google

**Casos de Error:**
- ER-AUTH-06-01: Usuario deniega consentimiento → Mensaje: "Autorización cancelada"
- ER-AUTH-06-02: Error de Google → Mensaje: "Error al conectar con Google. Intente nuevamente"
- ER-AUTH-06-03: Tokens inválidos → Mensaje: "Error de autenticación con Google"

---

### 4.1.2 Módulo de Gestión de Usuarios (RF-USER)

#### RF-USER-01: Listar Usuarios
**Prioridad:** ALTA
**Descripción:** Los administradores deben poder ver un listado de todos los usuarios del sistema.

**Entradas:**
- Filtros opcionales:
  - Rol (ROLE_ADMIN / ROLE_PROFESSOR / Todos)
  - Estado (Activo / Inactivo / Todos)
  - Búsqueda por texto (nombre, apellidos, email)

**Proceso:**
1. Administrador accede a sección "Usuarios"
2. Sistema recupera listado de usuarios
3. Sistema aplica filtros seleccionados
4. Sistema muestra tabla con columnas:
   - ID
   - Nombre completo
   - Email
   - Usuario UniOvi
   - Rol
   - Estado (Activo/Inactivo)
   - Fecha de registro
   - Acciones (Editar, Eliminar)
5. Sistema permite ordenar por cualquier columna
6. Sistema implementa paginación (20 usuarios por página)

**Salidas:**
- Tabla de usuarios con datos actualizados
- Indicadores visuales de estado

**Criterios de Aceptación:**
- Carga de listado <2 segundos
- Paginación funcional
- Filtros en tiempo real
- Búsqueda case-insensitive

---

#### RF-USER-02: Editar Usuario
**Prioridad:** ALTA
**Descripción:** Los administradores deben poder modificar los datos de un usuario.

**Entradas:**
- ID del usuario a editar
- Campos modificables:
  - Nombre
  - Primer apellido
  - Segundo apellido
  - Usuario UniOvi
  - Rol
  - Estado (Activo/Inactivo)

**Proceso:**
1. Administrador hace clic en "Editar" de un usuario
2. Sistema muestra formulario prellenado con datos actuales
3. Administrador modifica campos deseados
4. Sistema valida cambios
5. Sistema actualiza registro en BD
6. Los metadatos de auditoría de la entidad se actualizan automáticamente: `updatedBy` (email del administrador) y `updatedAt` (timestamp de la modificación)
7. Sistema muestra confirmación

**Salidas:**
- Usuario actualizado con metadatos de auditoría actualizados
- Confirmación de éxito

**Validaciones:**
- Cambio de rol no debe dejar sin administradores
- No se puede desactivar el propio usuario administrador
- Email no modificable (es identificador único)

**Casos de Error:**
- ER-USER-02-01: Último administrador → Mensaje: "No puede cambiar el rol del último administrador"
- ER-USER-02-02: Autodesactivación → Mensaje: "No puede desactivar su propia cuenta"

---

#### RF-USER-03: Eliminar Usuario
**Prioridad:** MEDIA
**Descripción:** Los administradores deben poder eliminar usuarios del sistema (eliminación permanente del registro).

**Entradas:**
- ID del usuario a eliminar
- Confirmación de eliminación

**Proceso:**
1. Administrador hace clic en "Eliminar"
2. Sistema muestra diálogo de confirmación:
   - "¿Está seguro de eliminar al usuario [Nombre]?"
   - Advertencia de acción irreversible
3. Administrador confirma
4. Sistema verifica que no es el último administrador
5. Sistema verifica que no es el usuario actual
6. Sistema elimina el usuario de la base de datos
7. Sistema refresca listado

**Salidas:**
- Usuario eliminado del sistema

**Validaciones:**
- No eliminar último administrador
- No autoeliminación
- Confirmación explícita requerida

**Casos de Error:**
- ER-USER-03-01: Último admin → Mensaje: "No puede eliminar al último administrador"
- ER-USER-03-02: Usuario actual → Mensaje: "No puede eliminar su propia cuenta"

---

### 4.1.3 Módulo de Gestión de Titulaciones (RF-DEGREE)

#### RF-DEGREE-01: Crear Titulación
**Prioridad:** ALTA
**Descripción:** Los administradores deben poder crear nuevas titulaciones.

**Entradas:**
- Nombre (obligatorio, máx. 100 caracteres, único)
- Acrónimo (obligatorio, máx. 20 caracteres, único)

**Proceso:**
1. Administrador accede a sección "Titulaciones"
2. Administrador hace clic en "Nueva Titulación"
3. Sistema muestra formulario
4. Administrador completa datos
5. Sistema valida unicidad de nombre y acrónimo
6. Sistema crea registro en tabla DEGREES
7. Los metadatos de auditoría de la entidad se establecen automáticamente (`createdBy`, `createdAt`)
8. Sistema muestra confirmación

**Salidas:**
- Nueva titulación creada
- Metadatos de auditoría actualizados en la entidad
- Confirmación de éxito

**Validaciones:**
- Nombre único
- Acrónimo único
- Campos obligatorios completos

**Casos de Error:**
- ER-DEGREE-01-01: Nombre duplicado → Mensaje: "Ya existe una titulación con ese nombre"
- ER-DEGREE-01-02: Acrónimo duplicado → Mensaje: "Ya existe una titulación con ese acrónimo"

**Ejemplos:**
- Nombre: "Grado en Ingeniería Informática" | Acrónimo: "GII"
- Nombre: "Grado en Ingeniería Informática del Software" | Acrónimo: "GIIIS"

---

#### RF-DEGREE-02: Listar Titulaciones
**Prioridad:** ALTA
**Descripción:** El sistema debe mostrar un listado de todas las titulaciones.

**Proceso:**
1. Sistema muestra tabla con columnas:
   - ID
   - Nombre
   - Acrónimo
   - Nº de Asignaturas
   - Nº de Cursos Académicos
   - Acciones (Editar, Eliminar)
2. Sistema permite ordenar por columna
3. Sistema muestra contador total

**Salidas:**
- Listado completo de titulaciones
- Estadísticas asociadas

---

#### RF-DEGREE-03: Editar Titulación
**Prioridad:** MEDIA
**Descripción:** Los administradores deben poder modificar titulaciones existentes.

**Entradas:**
- ID de titulación
- Nuevo nombre (opcional)
- Nuevo acrónimo (opcional)

**Proceso:**
1. Administrador hace clic en "Editar"
2. Sistema muestra formulario con datos actuales
3. Administrador modifica campos
4. Sistema valida unicidad si se cambiaron
5. Sistema actualiza registro
6. Los metadatos de auditoría de la entidad se actualizan automáticamente (`updatedBy`, `updatedAt`)
7. Sistema actualiza vista

**Validaciones:**
- Si se cambia nombre, debe ser único
- Si se cambia acrónimo, debe ser único

---

#### RF-DEGREE-04: Eliminar Titulación
**Prioridad:** BAJA
**Descripción:** Los administradores deben poder eliminar titulaciones sin asignaturas asociadas.

**Entradas:**
- ID de titulación
- Confirmación

**Proceso:**
1. Administrador hace clic en "Eliminar"
2. Sistema verifica que no tenga asignaturas asociadas
3. Sistema muestra diálogo de confirmación
4. Administrador confirma
5. Sistema elimina registro (CASCADE eliminará cursos vacíos)
6. Los metadatos de auditoría de la entidad se actualizan automáticamente (`updatedBy`, `updatedAt`)

**Validaciones:**
- No debe tener asignaturas asociadas
- Confirmación requerida

**Casos de Error:**
- ER-DEGREE-04-01: Tiene asignaturas → Mensaje: "No puede eliminar una titulación con asignaturas asociadas. Elimine primero las asignaturas."

---

### 4.1.4 Módulo de Gestión de Asignaturas (RF-SUBJECT)

#### RF-SUBJECT-01: Crear Asignatura
**Prioridad:** ALTA
**Descripción:** Los administradores deben poder crear nuevas asignaturas.

**Entradas:**
- Nombre (obligatorio, máx. 100 caracteres)
- Acrónimo (obligatorio, máx. 20 caracteres)
- Código SIES (obligatorio, máx. 20 caracteres)
- Titulación (obligatoria, selección de lista)
- Semestre (obligatorio: 1 o 2)
- Curso (obligatorio: 1, 2, 3 o 4)

**Proceso:**
1. Administrador accede a "Asignaturas" → "Nueva Asignatura"
2. Sistema muestra formulario
3. Administrador completa campos
4. Sistema valida:
   - Combinación (nombre, titulación) única
   - Combinación (acrónimo, titulación) única
   - Semestre válido (1 o 2)
   - Curso válido (1-4)
5. Sistema crea registro en SUBJECTS
6. Los metadatos de auditoría de la entidad se actualizan automáticamente (`updatedBy`, `updatedAt`)
7. Sistema muestra confirmación

**Salidas:**
- Nueva asignatura creada
- Metadatos de auditoría actualizados en la entidad

**Validaciones:**
- Nombre único dentro de la misma titulación
- Acrónimo único dentro de la misma titulación
- Semestre en rango [1,2]
- Curso en rango [1-4]
- Código SIES válido

**Casos de Error:**
- ER-SUBJECT-01-01: Nombre duplicado en titulación → Mensaje: "Ya existe una asignatura con ese nombre en esta titulación"
- ER-SUBJECT-01-02: Acrónimo duplicado en titulación → Mensaje: "Ya existe una asignatura con ese acrónimo en esta titulación"
- ER-SUBJECT-01-03: Semestre inválido → Mensaje: "El semestre debe ser 1 o 2"
- ER-SUBJECT-01-04: Curso inválido → Mensaje: "El curso debe ser entre 1 y 4"

**Ejemplo:**
- Nombre: "Ingeniería de Requisitos"
- Acrónimo: "IR"
- SIES: "1234567"
- Titulación: "Grado en Ingeniería Informática"
- Semestre: 2
- Curso: 3

---

#### RF-SUBJECT-02: Listar Asignaturas
**Prioridad:** ALTA
**Descripción:** El sistema debe mostrar listado de asignaturas con filtros.

**Entradas:**
- Filtros opcionales:
  - Titulación
  - Curso (1-4)
  - Semestre (1-2)
  - Búsqueda por texto

**Proceso:**
1. Sistema muestra tabla con columnas:
   - Código SIES
   - Acrónimo
   - Nombre
   - Titulación
   - Curso
   - Semestre
   - Nº Grupos
   - Acciones
2. Sistema aplica filtros seleccionados
3. Sistema permite ordenar por columna
4. Sistema implementa paginación (25 por página)

**Salidas:**
- Listado filtrado de asignaturas
- Contador de resultados

---

#### RF-SUBJECT-03: Editar Asignatura
**Prioridad:** MEDIA
**Descripción:** Los administradores deben poder modificar asignaturas.

**Entradas:**
- ID de asignatura
- Campos modificables (todos excepto código SIES)

**Proceso:**
1. Administrador hace clic en "Editar"
2. Sistema muestra formulario con datos actuales
3. Código SIES aparece deshabilitado (no editable)
4. Administrador modifica campos deseados
5. Sistema valida unicidad si cambió nombre/acrónimo
6. Sistema actualiza registro
7. Los metadatos de auditoría de la entidad se actualizan automáticamente (`updatedBy`, `updatedAt`)
8. Sistema actualiza vista

**Validaciones:**
- Nombre único en titulación (si cambió)
- Acrónimo único en titulación (si cambió)
- Semestre válido
- Curso válido

**Restricciones:**
- Código SIES no modificable (es identificador oficial)

---

#### RF-SUBJECT-04: Eliminar Asignatura
**Prioridad:** BAJA
**Descripción:** Los administradores deben poder eliminar asignaturas sin grupos asociados.

**Entradas:**
- ID de asignatura
- Confirmación

**Proceso:**
1. Administrador hace clic en "Eliminar"
2. Sistema verifica que no tenga grupos asociados
3. Sistema muestra confirmación
4. Administrador confirma
5. Sistema elimina registro
6. Los metadatos de auditoría de la entidad se actualizan automáticamente (`updatedBy`, `updatedAt`)

**Validaciones:**
- No debe tener grupos asociados

**Casos de Error:**
- ER-SUBJECT-04-01: Tiene grupos → Mensaje: "No puede eliminar una asignatura con grupos asociados"

---

### 4.1.5 Módulo de Gestión de Grupos (RF-GROUP)

#### RF-GROUP-01: Crear Grupo
**Prioridad:** ALTA
**Descripción:** Los administradores deben poder crear grupos dentro de una asignatura.

**Entradas:**
- Asignatura (obligatoria)
- Número (obligatorio, entero positivo)
- Tipo (obligatorio: "Teoría", "Prácticas de Aula", "Prácticas de Laboratorio", "Seminario")
- Idioma (obligatorio: "ES" - Español, "EN" - Inglés, "AS" - Asturiano)

**Proceso:**
1. Administrador accede a asignatura → "Nuevo Grupo"
2. Sistema muestra formulario
3. Administrador completa datos
4. Sistema valida combinación única (asignatura, número, tipo, idioma)
5. Sistema crea registro en GROUPS
6. Los metadatos de auditoría de la entidad se actualizan automáticamente (`updatedBy`, `updatedAt`)
7. Sistema muestra confirmación

**Salidas:**
- Nuevo grupo creado
- Metadatos de auditoría actualizados en la entidad

**Validaciones:**
- Combinación (asignatura, número, tipo, idioma) única
- Número entero positivo
- Tipo válido dentro del catálogo
- Idioma válido (ES/EN/AS)

**Casos de Error:**
- ER-GROUP-01-01: Grupo duplicado → Mensaje: "Ya existe un grupo con ese número, tipo e idioma para esta asignatura"

**Ejemplo:**
- Asignatura: "Ingeniería de Requisitos"
- Número: 1
- Tipo: "Teoría"
- Idioma: "ES"
→ Resultado: "IR - Teoría 1 (ES)"

---

#### RF-GROUP-02: Listar Grupos
**Prioridad:** ALTA
**Descripción:** El sistema debe mostrar grupos filtrados por asignatura.

**Entradas:**
- Filtro por asignatura
- Filtro por tipo (opcional)
- Filtro por idioma (opcional)

**Proceso:**
1. Sistema muestra tabla con columnas:
   - Asignatura
   - Número
   - Tipo
   - Idioma
   - Nº Eventos Asignados
   - Acciones
2. Sistema permite filtrar y ordenar
3. Sistema agrupa visualmente por asignatura

**Salidas:**
- Listado de grupos con información asociada

---

#### RF-GROUP-03: Editar Grupo
**Prioridad:** MEDIA
**Descripción:** Los administradores deben poder modificar grupos.

**Entradas:**
- ID de grupo
- Campos modificables (todos)

**Proceso:**
1. Sistema muestra formulario con datos actuales
2. Administrador modifica campos
3. Sistema valida unicidad de combinación si cambió
4. Sistema actualiza registro
5. Los metadatos de auditoría de la entidad se actualizan automáticamente (`updatedBy`, `updatedAt`)

**Validaciones:**
- Combinación única si se modificó algún campo de la clave

---

#### RF-GROUP-04: Eliminar Grupo
**Prioridad:** MEDIA
**Descripción:** Los administradores deben poder eliminar grupos.

**Entradas:**
- ID de grupo
- Confirmación

**Proceso:**
1. Sistema verifica que no tenga eventos asociados (o pide confirmación para eliminar en cascada)
2. Sistema muestra advertencia si tiene eventos
3. Administrador confirma
4. Sistema elimina grupo (CASCADE eliminará relaciones en tablas intermedias)
5. Los metadatos de auditoría de la entidad se actualizan automáticamente (`updatedBy`, `updatedAt`)

**Validaciones:**
- Confirmación requerida
- Advertencia si tiene eventos asociados

---

### 4.1.6 Módulo de Gestión de Aulas (RF-CLASSROOM)

#### RF-CLASSROOM-01: Crear Aula
**Prioridad:** ALTA
**Descripción:** Los administradores deben poder crear nuevas aulas.

**Entradas:**
- Código (obligatorio, máx. 50 caracteres, único)
- URL GIS (obligatorio, máx. 255 caracteres, formato URL)

**Proceso:**
1. Administrador accede a "Aulas" → "Nueva Aula"
2. Sistema muestra formulario
3. Administrador completa campos
4. Sistema valida unicidad del código
5. Sistema valida formato de URL GIS
6. Sistema crea registro en CLASSROOMS
7. Los metadatos de auditoría de la entidad se actualizan automáticamente (`updatedBy`, `updatedAt`)

**Salidas:**
- Nueva aula creada
- Metadatos de auditoría actualizados en la entidad

**Validaciones:**
- Código único
- URL GIS formato válido (http:// o https://)

**Casos de Error:**
- ER-CLASSROOM-01-01: Código duplicado → Mensaje: "Ya existe un aula con ese código"
- ER-CLASSROOM-01-02: URL inválida → Mensaje: "El formato de la URL GIS es inválido"

**Ejemplo:**
- Código: "LAB1.04"
- URL GIS: "https://gis.uniovi.es/aulas/LAB1.04"

---

#### RF-CLASSROOM-02: Listar Aulas
**Prioridad:** ALTA
**Descripción:** El sistema debe mostrar listado de aulas disponibles.

**Proceso:**
1. Sistema muestra tabla con columnas:
   - Código
   - URL GIS (enlace clickeable)
   - Ocupación Actual
   - Acciones
2. Sistema permite búsqueda por código
3. Sistema permite ordenar por código

**Salidas:**
- Listado completo de aulas

---

#### RF-CLASSROOM-03: Editar Aula
**Prioridad:** MEDIA
**Descripción:** Los administradores deben poder modificar aulas.

**Entradas:**
- ID de aula
- Código modificable
- URL GIS modificable

**Proceso:**
1. Sistema muestra formulario con datos actuales
2. Administrador modifica campos
3. Sistema valida unicidad de código si cambió
4. Sistema valida formato de URL
5. Sistema actualiza registro
6. Los metadatos de auditoría de la entidad se actualizan automáticamente (`updatedBy`, `updatedAt`)

---

#### RF-CLASSROOM-04: Eliminar Aula
**Prioridad:** BAJA
**Descripción:** Los administradores deben poder eliminar aulas sin eventos asociados.

**Entradas:**
- ID de aula
- Confirmación

**Proceso:**
1. Sistema verifica que no tenga eventos asociados
2. Sistema muestra confirmación
3. Administrador confirma
4. Sistema elimina registro
5. Los metadatos de auditoría de la entidad se actualizan automáticamente (`updatedBy`, `updatedAt`)

**Casos de Error:**
- ER-CLASSROOM-04-01: Tiene eventos → Mensaje: "No puede eliminar un aula con eventos asociados"

---

### 4.1.7 Módulo de Gestión de Calendarios (RF-CAL)

#### RF-CAL-01: Crear Calendario Académico
**Prioridad:** CRÍTICA
**Descripción:** Los administradores deben poder crear calendarios académicos para cada curso y semestre.

**Entradas:**
- Curso Académico (obligatorio, selección de lista de cursos existentes)
- Semestre (obligatorio: 1 o 2)
- Fecha de Inicio (obligatoria, formato YYYY-MM-DD)
- Fecha de Fin (obligatoria, formato YYYY-MM-DD)
- Generar días lectivos automáticamente (checkbox, default: true)

**Proceso:**
1. Administrador accede a "Calendarios" → "Nuevo Calendario"
2. Sistema muestra formulario
3. Administrador selecciona curso académico
4. Administrador selecciona semestre
5. Administrador define fechas de inicio y fin
6. Sistema valida:
   - Combinación (curso, semestre) única
   - Fecha fin posterior a fecha inicio
   - Fechas coherentes con curso académico
7. Sistema crea registro en CALENDARS
8. Si checkbox activado, sistema genera automáticamente días lectivos:
   - Crea un registro en DAYS por cada día entre inicio y fin
   - Excluye sábados y domingos
   - Marca días como lectivos inicialmente
9. Los metadatos de auditoría de la entidad se actualizan automáticamente (`updatedBy`, `updatedAt`)
10. Sistema muestra confirmación y redirige a vista de calendario

**Salidas:**
- Nuevo calendario creado
- Días lectivos generados (si aplica)
- Metadatos de auditoría actualizados en la entidad

**Validaciones:**
- Combinación (curso, semestre) única
- Fecha fin > fecha inicio
- Rango de fechas razonable (máx. 6 meses)
- Semestre válido (1 o 2)

**Casos de Error:**
- ER-CAL-01-01: Calendario duplicado → Mensaje: "Ya existe un calendario para este curso y semestre"
- ER-CAL-01-02: Fechas inválidas → Mensaje: "La fecha de fin debe ser posterior a la fecha de inicio"
- ER-CAL-01-03: Rango excesivo → Mensaje: "El rango de fechas no puede superar los 6 meses"

**Ejemplo:**
- Curso: "2026-2027"
- Semestre: 1
- Inicio: 2026-09-15
- Fin: 2027-01-31
→ Sistema crea calendario y genera aprox. 95 días lectivos (excluyendo fines de semana)

---

#### RF-CAL-02: Listar Calendarios
**Prioridad:** ALTA
**Descripción:** El sistema debe mostrar listado de calendarios académicos.

**Entradas:**
- Filtro por curso (opcional)
- Filtro por semestre (opcional)

**Proceso:**
1. Sistema muestra tabla con columnas:
   - Curso Académico
   - Semestre
   - Fecha Inicio
   - Fecha Fin
   - Nº Días Lectivos
   - Nº Eventos Programados
   - Acciones (Ver Detalles, Duplicar, Eliminar)
2. Sistema ordena por curso descendente y semestre ascendente
3. Sistema permite filtrar por curso y semestre

**Salidas:**
- Listado de calendarios con estadísticas

---

#### RF-CAL-03: Ver Detalles de Calendario
**Prioridad:** ALTA
**Descripción:** Los administradores deben poder ver y gestionar los días de un calendario.

**Entradas:**
- ID de calendario

**Proceso:**
1. Administrador hace clic en "Ver Detalles"
2. Sistema muestra:
   - Información del calendario (curso, semestre, fechas)
   - Vista de calendario mensual con días lectivos marcados
   - Listado de días con opciones de marcar como no lectivo/festivo
   - Listado de eventos programados en el calendario
   - Estadísticas: total días, lectivos, festivos, eventos
3. Sistema permite:
   - Marcar/desmarcar días como festivos
   - Agregar comentarios a días específicos
   - Ver eventos del día al hacer clic

**Salidas:**
- Vista detallada del calendario
- Opciones de gestión de días

---

#### RF-CAL-04: Duplicar Calendario
**Prioridad:** ALTA
**Descripción:** Los administradores deben poder duplicar un calendario existente para un nuevo curso/semestre.

**Entradas:**
- ID de calendario origen
- Curso académico destino
- Semestre destino
- Ajuste de fechas:
  - Nueva fecha de inicio
  - Opción: "Mantener estructura de días" (checkbox)
- Opción: "Duplicar eventos periódicos" (checkbox)

**Proceso:**
1. Administrador hace clic en "Duplicar" en un calendario
2. Sistema muestra formulario de duplicación
3. Administrador selecciona curso/semestre destino
4. Administrador ajusta fechas
5. Sistema valida que no exista calendario para curso/semestre destino
6. Sistema crea nuevo calendario con las nuevas fechas
7. Si "Mantener estructura de días" activado:
   - Sistema copia estructura de días lectivos/festivos con ajuste de fechas
8. Si "Duplicar eventos periódicos" activado:
   - Sistema copia eventos periódicos del calendario origen al destino
   - Sistema ajusta fechas de eventos proporcionalmente
9. Los metadatos de auditoría de la entidad se actualizan automáticamente (`updatedBy`, `updatedAt`)
10. Sistema muestra confirmación

**Salidas:**
- Nuevo calendario creado con estructura duplicada
- Eventos duplicados (si aplica)
- Metadatos de auditoría actualizados en la entidad

**Validaciones:**
- No debe existir calendario para curso/semestre destino
- Fechas válidas

**Casos de Error:**
- ER-CAL-04-01: Calendario destino existe → Mensaje: "Ya existe un calendario para el curso y semestre seleccionados"

**Criterios de Aceptación:**
- Duplicación completa en <10 segundos
- Eventos mantienen relaciones con grupos y aulas
- Estructura de días festivos se respeta con ajuste de fechas

---

#### RF-CAL-05: Eliminar Calendario
**Prioridad:** MEDIA
**Descripción:** Los administradores deben poder eliminar calendarios (con precaución).

**Entradas:**
- ID de calendario
- Confirmación explícita (doble)

**Proceso:**
1. Administrador hace clic en "Eliminar"
2. Sistema muestra diálogo de advertencia:
   - "¿Está seguro de eliminar este calendario?"
   - "Esta acción eliminará: X días, Y eventos periódicos, Z eventos puntuales"
   - "Esta acción NO se puede deshacer"
3. Administrador debe escribir "ELIMINAR" para confirmar
4. Sistema verifica confirmación
5. Sistema elimina calendario (CASCADE eliminará días y eventos)
6. Los metadatos de auditoría de la entidad se actualizan automáticamente (`updatedBy`, `updatedAt`)
7. Sistema muestra confirmación

**Validaciones:**
- Confirmación explícita requerida
- No permitir eliminación de calendario del semestre actual (restricción de negocio)

**Casos de Error:**
- ER-CAL-05-01: Calendario actual → Mensaje: "No puede eliminar el calendario del semestre en curso"

---

### 4.1.8 Módulo de Gestión de Eventos (RF-EVENT)

#### RF-EVENT-01: Crear Evento Periódico
**Prioridad:** CRÍTICA
**Descripción:** Los administradores deben poder crear eventos que se repiten regularmente.

**Entradas:**
- Calendario (obligatorio)
- Grupo(s) (obligatorio, selección múltiple)
- Aula(s) (opcional, selección múltiple)
- Hora de Inicio (obligatorio, formato HH:MM)
- Hora de Fin (obligatorio, formato HH:MM)
- Días de la Semana (obligatorio, selección múltiple: L, M, X, J, V)
- Comentarios (opcional, máx. 500 caracteres)

**Proceso:**
1. Administrador accede a calendario → "Nuevo Evento Periódico"
2. Sistema muestra formulario
3. Administrador selecciona grupos (puede ser múltiple)
4. Administrador selecciona aulas (opcional, puede ser múltiple)
5. Administrador define horario
6. Administrador selecciona días de la semana
7. Sistema valida:
   - Hora fin > hora inicio
   - No conflictos de horario para grupos/aulas seleccionados
8. Sistema muestra preview de ocurrencias
9. Administrador confirma
10. Sistema crea registro en PERIODIC_EVENTS
11. Sistema crea relaciones en tablas intermedias con grupos y aulas
12. Los metadatos de auditoría de la entidad se actualizan automáticamente (`updatedBy`, `updatedAt`)
13. Sistema sincroniza con Google Calendar (si usuarios tienen sync activado)

**Salidas:**
- Evento periódico creado
- Relaciones con grupos/aulas establecidas
- Metadatos de auditoría actualizados en la entidad
- Sincronización con Google Calendar

**Validaciones:**
- Hora fin > hora inicio
- Al menos 1 grupo seleccionado
- Al menos 1 día de semana seleccionado
- No conflictos de horario (validar solapamientos)

**Detección de Conflictos:**
Sistema debe verificar que NO existan:
- Otros eventos periódicos con mismo grupo en mismo día/hora
- Otros eventos periódicos con misma aula en mismo día/hora
- Eventos puntuales que se solapen

**Casos de Error:**
- ER-EVENT-01-01: Horario inválido → Mensaje: "La hora de fin debe ser posterior a la hora de inicio"
- ER-EVENT-01-02: Sin grupos → Mensaje: "Debe seleccionar al menos un grupo"
- ER-EVENT-01-03: Conflicto → Mensaje: "Conflicto detectado: El grupo X ya tiene clase en ese horario los días [días]"
- ER-EVENT-01-04: Conflicto de aula → Mensaje: "El aula Y ya está ocupada en ese horario los días [días]"

**Ejemplo:**
- Grupo: "IR - Teoría 1 (ES)"
- Aula: "AN-3.03"
- Horario: 09:00 - 11:00
- Días: Lunes, Miércoles
→ Evento se repetirá cada lunes y miércoles de 9 a 11 en AN-3.03 durante todo el calendario

---

#### RF-EVENT-02: Crear Evento Puntual
**Prioridad:** ALTA
**Descripción:** Los administradores deben poder crear eventos únicos (excepciones, seminarios, recuperaciones).

**Entradas:**
- Calendario (obligatorio)
- Día Específico (obligatorio, selección de calendario)
- Grupo(s) (obligatorio)
- Aula(s) (opcional)
- Hora de Inicio (obligatorio)
- Hora de Fin (obligatorio)
- Comentario (opcional)
- Motivo (opcional: "Seminario", "Recuperación", "Examen", "Evento Especial")

**Proceso:**
1. Administrador accede a calendario → día específico → "Nuevo Evento Puntual"
2. Sistema muestra formulario prellenado con fecha seleccionada
3. Administrador completa datos
4. Sistema valida:
   - Día pertenece al calendario seleccionado
   - Hora fin > hora inicio
   - No conflictos en ese día/hora específico
5. Sistema crea registro en PUNTUAL_EVENTS asociado a DAY
6. Los metadatos de auditoría de la entidad se actualizan automáticamente (`updatedBy`, `updatedAt`)
7. Sistema sincroniza con Google Calendar

**Salidas:**
- Evento puntual creado
- Metadatos de auditoría actualizados en la entidad
- Sincronización con Google

**Validaciones:**
- Día válido dentro del calendario
- Hora fin > hora inicio
- No conflictos en fecha/hora específica

**Casos de Error:**
- ER-EVENT-02-01: Conflicto → Mensaje: "El grupo X ya tiene un evento el día DD/MM/YYYY de HH:MM a HH:MM"
- ER-EVENT-02-02: Día festivo → Advertencia: "El día seleccionado está marcado como festivo. ¿Desea continuar?"

---

#### RF-EVENT-03: Editar Evento Periódico
**Prioridad:** ALTA
**Descripción:** Los administradores deben poder modificar eventos periódicos.

**Entradas:**
- ID de evento periódico
- Campos modificables (todos)
- Opción de propagación:
  - "Aplicar solo a futuras ocurrencias"
  - "Aplicar a todas las ocurrencias"

**Proceso:**
1. Administrador hace clic en evento periódico → "Editar"
2. Sistema muestra formulario con datos actuales
3. Administrador modifica campos deseados
4. Sistema muestra opciones de propagación
5. Administrador selecciona propagación
6. Sistema valida no conflictos con nuevos parámetros
7. Sistema actualiza registro
8. Sistema cancela eventos puntuales afectados si se pidió (opcional)
9. Los metadatos de auditoría de la entidad se actualizan automáticamente (`updatedBy`, `updatedAt`)
10. Sistema sincroniza con Google Calendar

**Validaciones:**
- No conflictos con nuevos horarios/días
- Hora fin > hora inicio

**Criterios de Aceptación:**
- Cambios se reflejan inmediatamente
- Sincronización con Google en <1 minuto
- Usuarios reciben notificación de cambio (futuro)

---

#### RF-EVENT-04: Editar Evento Puntual
**Prioridad:** ALTA
**Descripción:** Los administradores deben poder modificar eventos puntuales.

**Entradas:**
- ID de evento puntual
- Campos modificables (todos)

**Proceso:**
1. Administrador hace clic en evento puntual → "Editar"
2. Sistema muestra formulario
3. Administrador modifica campos
4. Sistema valida no conflictos
5. Sistema actualiza registro
6. Los metadatos de auditoría de la entidad se actualizan automáticamente (`updatedBy`, `updatedAt`)
7. Sistema sincroniza con Google Calendar

---

#### RF-EVENT-05: Cancelar Evento Puntual
**Prioridad:** ALTA
**Descripción:** Los administradores deben poder cancelar un evento puntual específico.

**Entradas:**
- ID de evento puntual
- Motivo de cancelación (opcional)

**Proceso:**
1. Administrador hace clic en evento puntual → "Cancelar"
2. Sistema muestra diálogo solicitando motivo (opcional)
3. Administrador confirma
4. Sistema marca evento como `cancelled=true`
5. Sistema almacena motivo en campo `comment`
6. Los metadatos de auditoría de la entidad se actualizan automáticamente (`updatedBy`, `updatedAt`)
7. Sistema sincroniza con Google Calendar (elimina o marca como cancelado)
8. Sistema muestra evento con estilo visual "cancelado" (tachado, gris)

**Salidas:**
- Evento marcado como cancelado (no eliminado)
- Metadatos de auditoría actualizados en la entidad
- Sincronización con Google

**Criterios de Aceptación:**
- Evento cancelado sigue visible pero marcado visualmente
- Eventos cancelados no cuentan en estadísticas de ocupación

---

#### RF-EVENT-06: Eliminar Evento Periódico
**Prioridad:** MEDIA
**Descripción:** Los administradores deben poder eliminar eventos periódicos.

**Entradas:**
- ID de evento periódico
- Confirmación

**Proceso:**
1. Administrador hace clic en "Eliminar"
2. Sistema muestra advertencia:
   - "Esto eliminará todas las ocurrencias de este evento"
   - "Eventos puntuales asociados no se eliminarán"
3. Administrador confirma
4. Sistema elimina registro de PERIODIC_EVENTS
5. Los metadatos de auditoría de la entidad se actualizan automáticamente (`updatedBy`, `updatedAt`)
6. Sistema sincroniza con Google Calendar (elimina todas ocurrencias)

**Validaciones:**
- Confirmación explícita requerida

---

#### RF-EVENT-07: Detección de Conflictos de Horario
**Prioridad:** CRÍTICA
**Descripción:** El sistema debe detectar automáticamente conflictos de horario antes de crear/modificar eventos.

**Tipos de Conflictos a Detectar:**

**A) Conflicto de Grupo:**
- Mismo grupo tiene dos eventos al mismo tiempo

**B) Conflicto de Aula:**
- Misma aula asignada a dos eventos simultáneos

**C) Conflicto de Profesor (futuro):**
- Mismo profesor asignado a dos grupos simultáneos

**Proceso de Detección:**
1. Usuario intenta crear/modificar evento
2. Sistema extrae: grupos, aulas, día/días, hora inicio, hora fin
3. Sistema consulta:
   - Eventos periódicos que se solapen en días y horas
   - Eventos puntuales en fechas específicas que se solapen en horas
4. Para cada evento encontrado, sistema verifica:
   - ¿Comparten grupos? → Conflicto de Grupo
   - ¿Comparten aulas? → Conflicto de Aula
5. Si detecta conflictos:
   - Sistema NO permite crear/modificar
   - Sistema muestra mensaje detallado con conflictos encontrados
   - Sistema sugiere horarios alternativos (futuro)
6. Si NO detecta conflictos:
   - Sistema permite operación

**Algoritmo de Solapamiento:**
```
Dos rangos horarios [A_inicio, A_fin] y [B_inicio, B_fin] se solapan si:
A_inicio < B_fin AND A_fin > B_inicio
```

**Salidas:**
- Validación exitosa (sin conflictos) → Operación permitida
- Validación fallida (conflictos) → Operación bloqueada + mensaje detallado

**Criterios de Aceptación:**
- Detección 100% fiable (cero falsos negativos)
- Tiempo de validación <500ms
- Mensajes claros indicando qué conflictos se encontraron

---

#### RF-EVENT-08: Listar Eventos
**Prioridad:** ALTA
**Descripción:** El sistema debe mostrar listados de eventos con filtros.

**Entradas:**
- Filtros:
  - Calendario
  - Grupo
  - Aula
  - Rango de fechas
  - Tipo (Periódico/Puntual/Todos)
  - Estado (Activo/Cancelado/Todos)

**Proceso:**
1. Sistema muestra tabla con columnas:
   - Tipo (Periódico/Puntual)
   - Grupos
   - Aulas
   - Horario
   - Días/Fecha
   - Estado
   - Acciones
2. Sistema aplica filtros
3. Sistema permite ordenar por columnas
4. Sistema implementa paginación

**Salidas:**
- Listado filtrado de eventos

---

### 4.1.9 Módulo de Solicitudes de Cambio (RF-REQ)

#### RF-REQ-01: Crear Solicitud de Cambio (Profesor)
**Prioridad:** ALTA
**Descripción:** Los profesores deben poder solicitar cambios en eventos de sus grupos.

**Entradas:**
- Calendario
- Tipo de Evento (Puntual/Periódico)
- Datos del evento solicitado (igual que creación de evento)
- Justificación (obligatoria, máx. 1000 caracteres)

**Proceso:**
1. Profesor autenticado accede a "Mis Grupos"
2. Profesor selecciona calendario y grupo
3. Profesor hace clic en "Solicitar Nuevo Evento" o "Solicitar Cambio en Evento"
4. Sistema muestra formulario
5. Profesor completa datos del evento deseado
6. Profesor escribe justificación
7. Sistema valida que profesor tiene asignado el grupo (futuro: tabla de asignaciones)
8. Sistema NO valida conflictos (es responsabilidad del admin revisor)
9. Sistema crea registro en EVENT_REQUESTS con:
   - Estado: PENDING
   - Profesor solicitante
   - Datos del evento en campo JSON
10. Los metadatos de auditoría de la entidad se actualizan automáticamente (`updatedBy`, `updatedAt`)
11. Sistema envía email a administradores notificando solicitud
12. Sistema muestra confirmación al profesor

**Salidas:**
- Solicitud creada en estado PENDING
- Notificación a administradores
- Confirmación a profesor

**Validaciones:**
- Profesor autenticado
- Justificación no vacía
- Datos de evento completos

**Criterios de Aceptación:**
- Profesor recibe confirmación inmediata
- Administradores reciben email en <5 minutos
- Solicitud visible en panel de administrador

---

#### RF-REQ-02: Listar Solicitudes (Administrador)
**Prioridad:** ALTA
**Descripción:** Los administradores deben ver todas las solicitudes pendientes y resueltas.

**Entradas:**
- Filtros:
  - Estado (PENDING/APPROVED/REJECTED/Todos)
  - Profesor solicitante
  - Calendario
  - Rango de fechas de solicitud

**Proceso:**
1. Administrador accede a "Solicitudes de Cambio"
2. Sistema muestra tabla con columnas:
   - ID Solicitud
   - Profesor
   - Calendario
   - Tipo Evento
   - Fecha Solicitud
   - Estado
   - Acciones (Ver Detalles, Aprobar, Rechazar)
3. Sistema ordena por fecha de solicitud descendente
4. Sistema destaca solicitudes PENDING
5. Sistema permite filtrar

**Salidas:**
- Listado de solicitudes con información resumida

**Criterios de Aceptación:**
- Solicitudes PENDING claramente diferenciadas visualmente
- Contador de solicitudes pendientes en menú

---

#### RF-REQ-03: Ver Detalles de Solicitud
**Prioridad:** ALTA
**Descripción:** Los administradores deben poder ver detalles completos de una solicitud.

**Proceso:**
1. Administrador hace clic en "Ver Detalles"
2. Sistema muestra:
   - Información del profesor solicitante
   - Calendario y grupos involucrados
   - Datos completos del evento solicitado
   - Justificación
   - Fecha de solicitud
   - Estado actual
   - Revisor y fecha de revisión (si aplica)
   - Comentarios del revisor (si aplica)
3. Sistema muestra preview visual del evento en calendario
4. Sistema ejecuta detección de conflictos y muestra resultado
5. Sistema muestra botones "Aprobar" y "Rechazar" si estado es PENDING

**Salidas:**
- Vista detallada de solicitud
- Indicadores de conflictos (si existen)
- Opciones de acción

---

#### RF-REQ-04: Aprobar Solicitud (Administrador)
**Prioridad:** CRÍTICA
**Descripción:** Los administradores deben poder aprobar solicitudes y crear el evento automáticamente.

**Entradas:**
- ID de solicitud
- Comentarios del revisor (opcionales)

**Proceso:**
1. Administrador revisa detalles de solicitud
2. Administrador hace clic en "Aprobar"
3. Sistema muestra diálogo de confirmación con:
   - Resumen del evento a crear
   - Advertencia de conflictos (si existen)
   - Campo para comentarios opcionales
4. Administrador confirma
5. Sistema verifica que estado sea PENDING
6. Sistema crea evento (Periódico o Puntual según tipo) con datos de la solicitud
7. Sistema actualiza solicitud:
   - Estado: APPROVED
   - reviewed_by: email del administrador
   - reviewed_at: timestamp actual
   - comments: comentarios del revisor
8. Los metadatos de auditoría de la entidad se actualizan automáticamente (`updatedBy`, `updatedAt`)
9. Sistema envía email a profesor notificando aprobación
10. Sistema sincroniza evento con Google Calendar
11. Sistema muestra confirmación

**Salidas:**
- Evento creado en calendario
- Solicitud marcada como APPROVED
- Notificación a profesor
- Metadatos de auditoría actualizados en la entidad

**Validaciones:**
- Solicitud debe estar en estado PENDING
- Solo administradores pueden aprobar

**Casos de Error:**
- ER-REQ-04-01: Ya procesada → Mensaje: "Esta solicitud ya fue procesada anteriormente"
- ER-REQ-04-02: Error al crear evento → Mensaje: "Error al crear evento. Verifique que no existan conflictos"

**Criterios de Aceptación:**
- Evento se crea exitosamente
- Profesor recibe notificación en <5 minutos
- Evento sincronizado con Google en <2 minutos

---

#### RF-REQ-05: Rechazar Solicitud (Administrador)
**Prioridad:** ALTA
**Descripción:** Los administradores deben poder rechazar solicitudes con justificación.

**Entradas:**
- ID de solicitud
- Comentarios del revisor (OBLIGATORIOS al rechazar)

**Proceso:**
1. Administrador revisa solicitud
2. Administrador hace clic en "Rechazar"
3. Sistema muestra diálogo requiriendo comentarios obligatorios
4. Administrador escribe motivo de rechazo
5. Administrador confirma
6. Sistema actualiza solicitud:
   - Estado: REJECTED
   - reviewed_by: email del administrador
   - reviewed_at: timestamp actual
   - comments: motivo de rechazo
7. Los metadatos de auditoría de la entidad se actualizan automáticamente (`updatedBy`, `updatedAt`)
8. Sistema envía email a profesor con motivo de rechazo
9. Sistema muestra confirmación

**Salidas:**
- Solicitud marcada como REJECTED
- Notificación a profesor con motivo
- Metadatos de auditoría actualizados en la entidad

**Validaciones:**
- Solicitud en estado PENDING
- Comentarios obligatorios (no vacíos)

**Criterios de Aceptación:**
- Profesor recibe email con motivo claro de rechazo
- Profesor puede ver motivo en su panel

---

#### RF-REQ-06: Eliminar Solicitud (Profesor)
**Prioridad:** MEDIA
**Descripción:** Los profesores deben poder eliminar sus propias solicitudes pendientes.

**Entradas:**
- ID de solicitud
- Confirmación

**Proceso:**
1. Profesor ve listado de sus solicitudes
2. Profesor hace clic en "Eliminar" en solicitud PENDING
3. Sistema verifica que:
   - Solicitud pertenece al profesor autenticado
   - Estado es PENDING
4. Sistema muestra confirmación
5. Profesor confirma
6. Sistema elimina registro de EVENT_REQUESTS
7. Los metadatos de auditoría de la entidad se actualizan automáticamente (`updatedBy`, `updatedAt`)
8. Sistema muestra confirmación

**Validaciones:**
- Solo puede eliminar propias solicitudes
- Solo puede eliminar solicitudes PENDING

**Casos de Error:**
- ER-REQ-06-01: Ya procesada → Mensaje: "No puede eliminar una solicitud ya procesada"
- ER-REQ-06-02: No es propietario → Mensaje: "No tiene permisos para eliminar esta solicitud"

---

### 4.1.10 Módulo de Visualización de Horarios (RF-VIEW)

#### RF-VIEW-01: Vista de Horarios por Calendario
**Prioridad:** CRÍTICA
**Descripción:** Los usuarios autenticados deben poder consultar los horarios del calendario académico.

> **Nota v1.0:** El acceso requiere autenticación. El acceso público sin autenticación está previsto en versiones futuras.

**Entradas:**
- Filtros:
  - Titulación (acronym)
  - Curso Académico
  - Semestre
  - Asignatura (opcional)

**Proceso:**
1. Usuario autenticado navega a la sección de calendarios
2. Usuario selecciona titulación → cursos académicos disponibles
3. Usuario selecciona curso académico y semestre → calendario
4. Sistema carga el calendario con sus eventos
5. Sistema renderiza calendario visual con:
    - Eventos periódicos expandidos por día de la semana
    - Eventos puntuales en fechas específicas
    - Información: Asignatura, Grupo, Aula, Horario
    - Eventos cancelados marcados visualmente
6. Sistema permite navegación entre días
7. Sistema muestra las solicitudes de cambio pendientes (para administradores)

**Salidas:**
- Vista de calendario con horarios
- Información detallada de cada evento

**Criterios de Aceptación:**
- Carga de página <3 segundos
- Responsive (funcional en móvil)
- Información clara y legible
- Requiere autenticación válida

**Restricciones:**
- No se muestra información sensible (emails de profesores)
- La edición directa de eventos solo está disponible para administradores

---

### 4.1.11 Módulo de Sincronización con Google Calendar (RF-SYNC)

#### RF-SYNC-01: Conectar Cuenta de Google
**Prioridad:** ALTA
**Descripción:** Los usuarios autenticados deben poder vincular su cuenta de Google para habilitar la sincronización de calendarios de aulas.

**Entradas:**
- JWT de usuario autenticado
- Consentimiento OAuth 2.0 de Google

**Proceso (Conectar):**
1. Usuario accede a Configuración → Google Calendar
2. Usuario hace clic en "Conectar con Google Calendar"
3. Sistema redirige a la pantalla de consentimiento OAuth 2.0 de Google
4. Usuario autoriza acceso a Google Calendar (`calendar` scope)
5. Google devuelve authorization code
6. Sistema intercambia code por `access_token` y `refresh_token`
7. Sistema almacena tokens encriptados en la base de datos
8. Sistema marca la cuenta como conectada a Google
9. Sistema muestra confirmación con el email de la cuenta Google vinculada

**Proceso (Desconectar):**
1. Usuario hace clic en "Desconectar Google Calendar"
2. Sistema muestra confirmación
3. Usuario confirma
4. Sistema limpia los Google Calendars de aulas creados por este usuario
5. Sistema elimina los tokens de la base de datos
6. Sistema muestra confirmación

**Criterios de Aceptación:**
- OAuth funciona correctamente con Google
- Tokens se almacenan encriptados (nunca en texto plano)
- Desconexión limpia (limpia Google Calendars de aulas creados)
- El email de la cuenta Google vinculada se muestra al usuario

---

#### RF-SYNC-02: Sincronizar Calendario Académico con Google Calendar
**Prioridad:** ALTA
**Descripción:** El administrador puede sincronizar un calendario académico completo con Google Calendar. El sistema crea un Google Calendar independiente por cada aula involucrada en el calendario.

**Modelo de Sincronización:**
- Cada aula (`Classroom`) con eventos en el calendario obtiene su propio Google Calendar
- Los eventos del calendario se distribuyen al Google Calendar del aula correspondiente
- La entidad `GoogleClassroomCalendar` almacena el mapeo entre cada aula y su Google Calendar ID
- La entidad `CalendarSync` registra el estado de la sincronización por calendario académico

**Proceso de Sincronización:**
1. Administrador accede a `/calendar-sync`
2. El sistema muestra el listado de calendarios académicos activos con su estado de sincronización
3. Administrador activa la sincronización de un calendario (`toggle`)
4. Administrador puede lanzar sincronización manual (`sync-now`)
5. Sistema identifica todas las aulas con eventos en el calendario
6. Para cada aula nueva: sistema crea un Google Calendar con nombre `[código aula]`
7. Para cada evento periódico/puntual: sistema crea el evento en el Google Calendar del aula correspondiente
8. Sistema actualiza el progreso en tiempo real: `totalCalendars`, `processedCalendars`, `currentOperation`
9. Sistema almacena estado final: `SUCCESS` o `ERROR` con mensaje de error si aplica
10. Sistema respeta límite de tasa de la API de Google (400 requests/min)

**Estados de Sincronización (`SyncStatus`):**
- `IDLE`: Sin sincronización en curso
- `SYNCING`: Sincronización en progreso
- `SUCCESS`: Última sincronización completada
- `ERROR`: Última sincronización fallida (con mensaje de error)

**Datos Sincronizados en Google Calendar:**
- Título del evento: Información de asignatura y grupo
- Descripción: Comentarios adicionales
- Fecha y hora del evento
- Ubicación: Código del aula

**Criterios de Aceptación:**
- Sincronización de un calendario completo en <2 minutos (hasta 100 eventos)
- Progreso visible en tiempo real en la interfaz
- Errores de sincronización no bloquean operaciones locales
- Respeto del rate limit de Google Calendar API

---

#### RF-SYNC-03: Renovar Tokens de Google Automáticamente
**Prioridad:** ALTA
**Descripción:** El sistema debe renovar automáticamente los tokens de acceso de Google cuando se lanzan sincronizaciones, dado que los `access_token` tienen una validez limitada.

**Proceso:**
1. Administrador lanza sincronización manual (`sync-now`) o el sistema la ejecuta
2. Sistema recupera los tokens almacenados del usuario
3. Si el `access_token` está próximo a expirar o expirado:
   - Sistema usa el `refresh_token` para obtener un nuevo `access_token` desde Google
   - Sistema almacena el nuevo `access_token` y su nueva fecha de expiración
4. Sistema continúa la sincronización con el token renovado

**Casos de Error:**
- Refresh token inválido o revocado → Sistema desactiva la sincronización del usuario y muestra error en la página de sincronización
- Error de red con Google → Sistema almacena el error en el estado `CalendarSync.error` y marca el estado como `ERROR`

---

#### RF-SYNC-04: Limpiar Google Calendars al Desconectar
**Prioridad:** ALTA
**Descripción:** Cuando un usuario desconecta su cuenta de Google, el sistema debe limpiar todos los Google Calendars de aulas que fueron creados por ese usuario.

**Proceso:**
1. Usuario desconecta su cuenta de Google (RF-SYNC-01 proceso de desconexión)
2. Sistema identifica todos los `GoogleClassroomCalendar` asociados al usuario
3. Para cada Google Calendar de aula: sistema elimina o limpia los eventos de Google Calendar vía API
4. Sistema elimina los registros `GoogleClassroomCalendar` de la base de datos
5. Sistema elimina todos los `CalendarSync` del usuario
6. Sistema elimina los tokens de Google del usuario

---

#### RF-SYNC-05: Inicializar Entradas de Sincronización
**Prioridad:** ALTA
**Descripción:** Al conectar la cuenta de Google, el sistema debe inicializar los registros `CalendarSync` para todos los calendarios académicos activos, de forma que el administrador pueda gestionarlos.

**Proceso:**
1. Administrador conecta su cuenta de Google exitosamente (RF-SYNC-01)
2. Sistema llama al endpoint `POST /calendar-sync/initialize`
3. Sistema obtiene todos los calendarios académicos activos
4. Para cada calendario activo: sistema crea un registro `CalendarSync` con estado `IDLE` si no existe ya
5. Sistema muestra al administrador el listado de calendarios listos para sincronizar

---

### 4.1.12 Módulo de Auditoría (RF-AUDIT)

#### RF-AUDIT-01: Registro de Auditoría en Entidades
**Prioridad:** ALTA
**Descripción:** Todas las entidades del sistema deben registrar automáticamente los metadatos de creación y modificación mediante la clase base `AuditedEntity`.

**Implementación:**
- La clase `AuditedEntity` se extiende en todas las entidades principales del sistema
- Campos de auditoría añadidos automáticamente a cada entidad:
  - `createdAt` (timestamp): Fecha y hora de creación del registro
  - `createdBy` (string): Email del usuario que creó el registro
  - `updatedAt` (timestamp): Fecha y hora de la última modificación
  - `updatedBy` (string): Email del usuario que realizó la última modificación

**Entidades Auditadas:**
- `Calendar`, `Course`, `Degree`, `Subject`, `Classroom`, `Group`
- `Day`, `PuntualEvent`, `PeriodicEvent`
- `EventRequest`, `CalendarSync`

**Proceso de registro:**
- Al crear una entidad: el sistema extrae el email del JWT del usuario y lo almacena en `createdBy` y `createdAt`
- Al modificar una entidad: el sistema actualiza `updatedBy` y `updatedAt` automáticamente

**Limitaciones actuales (v1.0):**
- No se registran eventos de login/logout
- No se almacenan valores anteriores/nuevos de campos modificados
- No se registra la IP del usuario
- No existe una tabla de historial de cambios separada

**Criterios de Aceptación:**
- Todas las entidades del sistema heredan de `AuditedEntity`
- Los campos `createdBy`/`createdAt` se establecen en la creación
- Los campos `updatedBy`/`updatedAt` se actualizan en cada modificación

---

#### RF-AUDIT-02: Consultar Metadatos de Auditoría
**Prioridad:** MEDIA
**Descripción:** Los administradores deben poder consultar quién creó y modificó cada entidad del sistema.

> **Estado v1.0:** La interfaz de consulta de auditoría centralizada (página `/logs`) está prevista para versiones futuras. En v1.0, los metadatos de auditoría son accesibles en los detalles de cada entidad.

**Información Disponible por Entidad:**
- Fecha de creación (`createdAt`)
- Responsable de la creación (`createdBy`)
- Fecha de última modificación (`updatedAt`)
- Responsable de la última modificación (`updatedBy`)

---

#### RF-AUDIT-03: Exportar Datos de Auditoría
**Prioridad:** BAJA
**Descripción:** Exportación de información de auditoría de entidades.

> **Estado v1.0:** Funcionalidad de exportación centralizada de auditoría prevista en versiones futuras. En v1.0, los metadatos de auditoría se incluyen en las exportaciones de cada entidad.

---

### 4.1.13 Módulo de Exportación de Datos (RF-EXPORT)

#### RF-EXPORT-01: Exportar Calendario como ZIP
**Prioridad:** ALTA
**Descripción:** Los administradores deben poder exportar un calendario académico completo en formato ZIP con los ficheros necesarios para importación en otros sistemas.

**Proceso:**
1. Administrador accede a la vista de un calendario académico
2. Administrador hace clic en "Exportar"
3. Sistema genera un archivo ZIP con tres ficheros:
   - `ubicaciones.txt`: listado de aulas en formato `CÓDIGO_AULA:URL_GIS`, ordenado por código ascendente
   - `asignaturas.txt`: datos académicos de asignaturas con 12 campos (`Acrónimo:Nombre:Año:GruposTeoriaES:GruposSeminarioES:GruposLaboratorioES:GruposTeoriaEN:GruposSeminarioEN:GruposLaboratorioEN:GruposTutoriaGrupalES:GruposTutoriaGrupalEN:CódigoSIES`), ordenado por acrónimo
   - `calendario.txt`: eventos programados del calendario (únicamente tipo NORMAL; se excluyen eventos de tipo BLOCKER, REVISION_* y EVALUACION_*)
4. Sistema descarga el archivo ZIP en el navegador

**Salidas:**
- Archivo ZIP con `ubicaciones.txt`, `asignaturas.txt` y `calendario.txt`

**Criterios de Aceptación:**
- ZIP generado en <10 segundos para calendarios con hasta 200 eventos
- Codificación UTF-8 en todos los ficheros de texto
- Formato compatible con el proceso de importación del sistema

---

#### RF-EXPORT-02: Importar Calendario desde Ficheros de Texto
**Prioridad:** ALTA
**Descripción:** Los administradores deben poder importar eventos de un calendario desde ficheros de texto con formato específico.

**Entradas:**
- Fichero `asignaturas.txt` con eventos a importar
- Fichero `calendario.txt` con configuración de días lectivos/festivos (opcional)
- ID del calendario destino

**Proceso:**
1. Administrador accede a la vista del calendario
2. Administrador carga el/los fichero(s) de importación
3. Sistema parsea y valida el contenido
4. Sistema muestra vista previa de los eventos a importar
5. Administrador confirma la importación
6. Sistema crea los eventos en el calendario
7. Sistema reporta resultado: eventos importados, errores encontrados

**Criterios de Aceptación:**
- Importación correcta del formato de fichero estándar
- Validación de formato antes de importar
- Reporte claro de errores

---

#### RF-EXPORT-03: Importar Usuarios desde Excel
**Prioridad:** ALTA
**Descripción:** Los administradores deben poder importar usuarios masivamente desde un fichero Excel (XLSX).

**Entradas:**
- Fichero Excel (.xlsx) con listado de usuarios
- Columnas esperadas: nombre, primer apellido, segundo apellido, email, rol, usuario UniOvi (opcional)

**Proceso:**
1. Administrador accede a la sección de usuarios
2. Administrador carga el fichero Excel
3. Sistema parsea el fichero con la librería XLSX
4. Sistema valida cada fila (email único, rol válido, campos obligatorios)
5. Sistema crea los usuarios válidos con `is_active=false`
6. Sistema envía email de activación a cada usuario creado
7. Sistema reporta resultado: usuarios creados, filas con errores

**Criterios de Aceptación:**
- Compatible con archivos Excel generados por Office 365 y LibreOffice
- Validación fila a fila con informe de errores
- Emails de activación enviados a usuarios creados correctamente

---
