# Capítulo 3 — STAKEHOLDER REQUIREMENTS (REQUISITOS DE USUARIO)

---

## 3.1 System Scope

### 3.1.1 Contexto y origen del proyecto

TeachingPlanner es un proyecto encargado por la Escuela de Ingeniería Informática (EII) de la Universidad de Oviedo para sustituir el sistema de gestión de horarios académicos actualmente en uso. Se trata de un encargo real de la propia institución, motivado por las limitaciones operativas acumuladas del sistema heredado, que con el paso del tiempo han dificultado de forma creciente el trabajo del personal administrativo y docente del centro.

La aplicación está actualmente desplegada en una máquina virtual de la propia universidad, accesible a través de la VPN institucional, y ha sido presentada formalmente al personal de la EII como propuesta de sustitución del sistema en producción. Este capítulo recoge los requisitos identificados durante el proceso de análisis previo al desarrollo, organizados desde la perspectiva de los usuarios y otras partes interesadas.

### 3.1.2 Situación actual del sistema (AS-IS)

Para entender el alcance del proyecto es necesario conocer cómo funciona actualmente la gestión de horarios en la EII. El sistema heredado consta de dos componentes independientes: un **visualizador público** desplegado en los servidores de la universidad, que permite consultar los horarios de los grupos del grado en tres formatos (lista web, tabla y CSV para Google Calendar) e incluye enlaces al sistema GIS para localizar cada aula; y un conjunto de **cinco ficheros de texto plano** por semestre que alimentan dicho visualizador, cuyo mantenimiento es enteramente manual.

No existe ninguna interfaz web de administración. Toda la gestión de datos se realiza conectándose por SSH al puerto 22 de la máquina virtual que aloja la aplicación y editando directamente los ficheros con un editor de línea de comandos. Los cinco ficheros tienen el carácter `:` como separador de campos y cumplen las siguientes funciones:

- `asignaturas.txt` — catálogo de asignaturas con sus grupos por tipo (teoría, seminario, laboratorio, tutoría grupal) e idioma (español e inglés).
- `calendario.txt` — calendario lectivo, con cada fecha etiquetada mediante un código de letra que indica el tipo de sesión que corresponde ese día.
- `horarios.txt` — eventos periódicos, vinculando cada grupo a un día de la semana, una franja horaria y un aula.
- `excepciones.txt` — eventos puntuales y cancelaciones.
- `ubicaciones.txt` — asociación entre código de aula y su URL en el sistema GIS de la universidad.

> 📷 **Figura sugerida 1 — Fragmento de `horarios.txt` abierto en una sesión SSH**, ilustrando el proceso de edición manual en línea de comandos.

Este enfoque presenta limitaciones importantes en cuatro áreas:

**Sin validación de formato ni de conflictos.** Si al editar un fichero se introduce un error de sintaxis, el sistema no lo detecta ni avisa: el dato erróneo queda registrado silenciosamente. Del mismo modo, al guardar un cambio no se comprueba si genera solapamientos con otros eventos: un aula puede quedar asignada dos veces a la misma hora sin que el sistema emita ninguna advertencia.

**Fragilidad del mecanismo de códigos-letra.** La periodicidad de los grupos no semanales depende de que el código de letra en `calendario.txt` y en `horarios.txt` sea exactamente el mismo en ambos ficheros. Una mayúscula distinta o un espacio de más hace que el grupo desaparezca silenciosamente del horario publicado sin producir ningún error visible.

**Proceso de solicitudes de cambio por correo electrónico.** Cuando un docente necesita modificar una clase, el canal habitual es el correo electrónico a jefatura de estudios. Este proceso puede derivar en hilos de correo largos y difíciles de gestionar, con riesgo de malentendidos y de mensajes sin respuesta. El docente no dispone de ninguna herramienta para saber de antemano si su solicitud genera un conflicto.

**Doble mantenimiento manual y falta de interoperabilidad.** Existe otra aplicación en el ecosistema de la EII que se alimenta de los mismos calendarios de Google y de los mismos ficheros `.txt`. Cualquier cambio en los horarios debe propagarse manualmente tanto a los ficheros como al calendario de Google correspondiente, creando un proceso de doble mantenimiento propenso a desincronizaciones. Adicionalmente, el visualizador carece de diseño responsive y no funciona correctamente en dispositivos móviles.

> 📷 **Figura sugerida 2 — Captura del visualizador heredado en un dispositivo móvil**, mostrando la ausencia de diseño responsive.

### 3.1.3 Objetivos del sistema (TO-BE)

TeachingPlanner es una aplicación web desarrollada desde cero para sustituir el sistema descrito y resolver todas las limitaciones identificadas. Los objetivos del nuevo sistema son:

- Proporcionar una **interfaz web de administración** completa, accesible desde cualquier navegador y sin necesidad de conocimientos técnicos, que permita gestionar toda la información académica (titulaciones, cursos, asignaturas, grupos, aulas, calendarios y eventos) con formularios validados y retroalimentación inmediata.
- **Detectar automáticamente conflictos de horario** antes de confirmar cualquier asignación o cambio, impidiendo que solapamientos erróneos lleguen a guardarse.
- Incorporar un **sistema integrado de solicitudes de cambio** que reemplace el flujo basado en correo electrónico, con visibilidad del estado para docente y administrador en todo momento.
- **Sincronizar automáticamente con Google Calendar**, generando un calendario independiente por aula, de modo que otras aplicaciones del ecosistema de la EII puedan consumir datos siempre actualizados sin intervención manual.
- **Mantener la compatibilidad con el sistema heredado**, permitiendo importar y exportar los cinco ficheros `.txt` para facilitar la migración inicial y la coexistencia con otras herramientas que dependen de ese formato.
- Conservar la **consulta pública de horarios sin autenticación**, equivalente a la funcionalidad del visualizador existente, y añadir la exportación a CSV compatible con Google Calendar para uso de los estudiantes.
- Ofrecer una interfaz **responsive** que funcione correctamente en dispositivos móviles, y **completamente internacionalizada** en español e inglés.

### 3.1.4 Partes interesadas (Stakeholders)

| ID | Stakeholder | Rol en el sistema | Necesidades principales |
|---|---|---|---|
| STK-01 | Subdirección de Ordenación Académica (EII) | Cliente y usuario principal (administrador) | Eliminar la edición manual de ficheros; detección automática de conflictos; gestión integrada de solicitudes; trazabilidad de cambios |
| STK-02 | Profesorado de la EII | Usuario secundario (docente) | Consultar su propio horario; solicitar cambios sin usar correo electrónico; sincronizar con Google Calendar personal |
| STK-03 | Estudiantes y público general | Usuario de consulta | Acceder a los horarios publicados sin autenticación, desde cualquier dispositivo |
| STK-04 | Otras aplicaciones del ecosistema EII | Sistema externo dependiente | Seguir recibiendo los cinco ficheros `.txt` y los calendarios de Google en el formato esperado, sin intervención manual |
| STK-05 | Servicio de Informática (SUTIC) | Responsable de infraestructura | Sistema desplegable en la VM universitaria y mantenible con Docker |
| STK-06 | Equipo de desarrollo (TFG) | Desarrollador | Requisitos claros y alcance viable en el marco del TFG |

---

## 3.2 User Requirements

Los requisitos de usuario se organizan en grupos funcionales y se expresan en lenguaje conciso desde la perspectiva del usuario, sin entrar en detalles de implementación. Los requisitos no funcionales se recogen al final de esta sección en formato de tabla.

### Requisitos funcionales

**UR1 — Acceso al sistema y perfil**

UR1.1. El sistema permitirá a los usuarios registrados iniciar sesión mediante email y contraseña.

UR1.2. El sistema permitirá a los usuarios recuperar el acceso si han olvidado su contraseña.

UR1.3. El sistema permitirá a los usuarios autenticados cerrar sesión.

UR1.4. El sistema permitirá a los usuarios autenticados consultar y modificar los datos de su propio perfil, incluyendo el cambio de contraseña.

UR1.5. El sistema permitirá a los usuarios autenticados vincular su cuenta con Google para habilitar la sincronización de calendarios con Google Calendar.

- UR1.5.1. El sistema permitirá desconectar la cuenta de Google y limpiar los calendarios sincronizados asociados.

---

**UR2 — Gestión de usuarios** *(solo administrador)*

UR2.1. El sistema permitirá al administrador registrar nuevos usuarios proporcionando su nombre, apellidos, email y rol.

- UR2.1.1. El nuevo usuario recibirá un correo electrónico para activar su cuenta y establecer su contraseña.

UR2.2. El sistema permitirá al administrador importar usuarios de forma masiva desde un fichero Excel.

UR2.3. El sistema permitirá al administrador consultar, modificar el rol y el estado, y eliminar usuarios existentes.

UR2.4. El sistema gestionará dos roles de usuario: administrador y docente, con distintos niveles de acceso.

---

**UR3 — Gestión de la estructura académica** *(solo administrador)*

UR3.1. El sistema permitirá al administrador crear, consultar, modificar y eliminar titulaciones, identificadas por nombre y acrónimo.

UR3.2. El sistema permitirá al administrador crear, consultar, modificar y eliminar cursos académicos asociados a una titulación (por ejemplo, 2025/2026).

- UR3.2.1. Cada curso académico tendrá un estado: en planificación, activo o finalizado.

UR3.3. El sistema permitirá al administrador crear, consultar, modificar y eliminar asignaturas asociadas a una titulación, con su código SIES oficial, curso y semestre.

UR3.4. El sistema permitirá al administrador crear, consultar, modificar y eliminar grupos dentro de una asignatura.

- UR3.4.1. Cada grupo tendrá un tipo (teoría, prácticas de aula, prácticas de laboratorio, seminario) e idioma (español, inglés, asturiano).

UR3.5. El sistema permitirá al administrador crear, consultar, modificar y eliminar aulas, con su código identificativo y su enlace de ubicación geográfica (GIS).

---

**UR4 — Gestión de calendarios académicos** *(solo administrador)*

UR4.1. El sistema permitirá al administrador crear calendarios académicos por curso y semestre, con generación automática de los días lectivos dentro del rango de fechas indicado.

UR4.2. El sistema permitirá al administrador marcar días individuales como festivos o no lectivos dentro de un calendario.

UR4.3. El sistema permitirá al administrador duplicar un calendario existente como punto de partida para un nuevo curso o semestre.

UR4.4. El sistema permitirá al administrador eliminar un calendario y todos sus datos asociados.

---

**UR5 — Gestión de eventos** *(solo administrador)*

UR5.1. El sistema permitirá al administrador crear eventos periódicos (clases regulares semanales o quincenales) asignando uno o varios grupos, una o varias aulas, franja horaria y días de la semana.

UR5.2. El sistema permitirá al administrador crear eventos puntuales (sesiones únicas o excepciones) para una fecha específica del calendario.

UR5.3. Antes de guardar cualquier evento, el sistema comprobará automáticamente si existe un conflicto de horario con otros eventos del mismo grupo o la misma aula en la misma franja.

- UR5.3.1. Si se detecta un conflicto, el sistema informará al administrador con detalle del evento en conflicto e impedirá guardar hasta que sea resuelto.

UR5.4. El sistema permitirá al administrador cancelar eventos puntuales, manteniendo el registro histórico con indicación visual de la cancelación.

UR5.5. El sistema permitirá al administrador modificar y eliminar eventos existentes.

---

**UR6 — Consulta de horarios** *(todos los usuarios, incluido público sin autenticación)*

UR6.1. Cualquier persona podrá consultar los horarios publicados sin necesidad de autenticarse.

UR6.2. El sistema permitirá filtrar los horarios por titulación, curso, semestre, asignatura, tipo de grupo, aula e idioma.

UR6.3. El sistema mostrará los horarios en vista de calendario (semana, semana laboral, día, mes y agenda).

UR6.4. La vista de horarios funcionará correctamente en dispositivos móviles.

---

**UR7 — Solicitudes de cambio** *(docente crea; administrador gestiona)*

UR7.1. El docente podrá solicitar la creación de un nuevo evento directamente desde la aplicación, sin necesidad de usar el correo electrónico.

UR7.2. El docente podrá solicitar la edición, cancelación o sustitución de un evento existente.

- UR7.2.1. Antes de enviar la solicitud, el sistema informará al docente si el cambio propuesto genera un conflicto con el horario actual.

UR7.3. El administrador podrá consultar todas las solicitudes recibidas, aprobarlas o rechazarlas.

- UR7.3.1. Al aprobar una solicitud, el sistema creará o modificará el evento automáticamente.
- UR7.3.2. Al rechazar una solicitud, el administrador deberá incluir una justificación que el docente podrá consultar.

UR7.4. El docente y el administrador recibirán notificaciones por correo electrónico sobre el estado de las solicitudes.

UR7.5. El docente podrá eliminar sus propias solicitudes mientras estén pendientes de revisión.

---

**UR8 — Sincronización con Google Calendar** *(solo administrador)*

UR8.1. El administrador podrá sincronizar un calendario académico completo con Google Calendar, generando un calendario de Google independiente por cada aula registrada.

UR8.2. La sincronización garantizará que el estado del calendario en Google Calendar quede completamente alineado con el estado actual del sistema.

UR8.3. El sistema informará al administrador del progreso de la sincronización y de cualquier error producido.

UR8.4. El administrador podrá eliminar la sincronización de un calendario, limpiando los eventos y calendarios de Google correspondientes.

---

**UR9 — Interoperabilidad con el sistema heredado**

UR9.1. El sistema permitirá exportar el calendario en formato ZIP con los cinco ficheros `.txt` del sistema anterior, manteniendo compatibilidad con otras aplicaciones del ecosistema de la EII.

UR9.2. El sistema permitirá importar datos desde los ficheros `.txt` del sistema heredado para facilitar la migración inicial sin necesidad de reintroducir la información desde cero.

UR9.3. El sistema permitirá exportar el horario en formato CSV compatible con Google Calendar, para que los estudiantes puedan importarlo en su calendario personal.

---

**UR10 — Auditoría y trazabilidad**

UR10.1. El sistema registrará automáticamente el usuario responsable y la fecha de cada creación y modificación sobre todas las entidades gestionadas.

---

### Requisitos no funcionales

| ID | Atributo | Descripción |
|---|---|---|
| RNF-01 | Disponibilidad | El sistema estará operativo 24/7 y accesible desde cualquier navegador moderno. |
| RNF-02 | Rendimiento | Las operaciones habituales (consultas, creación de entidades) responderán en menos de 2 segundos en condiciones normales de uso. |
| RNF-03 | Portabilidad | El sistema será desplegable en la infraestructura de la universidad mediante contenedores Docker, sin dependencias específicas del sistema operativo subyacente. |
| RNF-04 | Privacidad | El sistema cumplirá con el Reglamento General de Protección de Datos (RGPD) en el tratamiento de datos personales de los usuarios. |
| RNF-05 | Usabilidad | La interfaz será accesible para los perfiles de administrador y docente sin formación técnica previa. Los campos obligatorios estarán claramente indicados y los errores se describirán de forma comprensible. |
| RNF-06 | Accesibilidad | La interfaz cumplirá con las pautas WCAG 2.1 nivel AA. |
| RNF-07 | Internacionalización | La interfaz estará disponible en español e inglés. |
| RNF-08 | Compatibilidad | La interfaz funcionará correctamente en las dos últimas versiones de Chrome, Firefox, Safari y Edge. |
| RNF-09 | Responsive | La interfaz se adaptará a dispositivos móviles, tabletas y escritorio. |
| RNF-10 | Seguridad | Toda la comunicación se cifrará mediante HTTPS. Las contraseñas se almacenarán cifradas y nunca se transmitirán en texto plano. |
| RNF-11 | Escalabilidad | El sistema soportará al menos 200 usuarios concurrentes sin degradación perceptible del rendimiento. |
| RNF-12 | Mantenibilidad | El sistema dispondrá de una suite de pruebas automáticas que valide las funcionalidades principales antes de cada despliegue. |

---

## 3.3 Alternatives

En esta sección se describen las decisiones en las que existía libertad de elección entre alternativas funcionales o técnicas, detallando los pros y contras de cada opción y la justificación de la alternativa seleccionada.

### 3.3.1 Sistema de autenticación

El sistema requiere gestionar la identidad de los usuarios que acceden a las funciones de administración y docencia. Se evaluaron tres alternativas:

**Opción A — Sistema de autenticación propio** (email + contraseña con activación por correo): proporciona control total sobre el proceso de acceso y no introduce dependencias externas para la función crítica de login. Requiere gestionar el ciclo de vida completo de las credenciales: almacenamiento seguro de contraseñas, mecanismo de recuperación y tokens de activación. Introduce responsabilidad directa sobre la seguridad de las credenciales de los usuarios.

**Opción B — SSO institucional de la Universidad de Oviedo** (Microsoft/Azure AD): elimina la gestión de contraseñas, delega la seguridad en el proveedor institucional e integra de forma natural a todo el personal universitario. Es la opción con mejor relación seguridad/coste de mantenimiento. **No estaba disponible** para integración por aplicaciones externas en el momento del desarrollo, pendiente de configuración por parte del SUTIC.

**Opción C — Google OAuth como único mecanismo de autenticación**: elimina igualmente la gestión de contraseñas y delega la seguridad en Google. Introduce dependencia de un servicio externo para el acceso a la función más crítica del sistema.

**Opción elegida: Opción A**, por descarte. La opción B, que habría sido la más adecuada desde el punto de vista de seguridad, no estaba disponible en el momento del desarrollo. La opción C introduce una dependencia externa inaceptable para el control de acceso. Se reconoce esta decisión como una **limitación conocida del sistema**: al gestionar contraseñas propias se asumen riesgos que un sistema de autenticación delegado evitaría. La integración con el SSO institucional queda documentada como trabajo futuro.

*Nota:* Google OAuth sí se utiliza en el sistema, pero únicamente para habilitar la sincronización de calendarios con Google Calendar (UR1.5), no como mecanismo de login.

---

### 3.3.2 Tipo de aplicación web

Se evaluó qué modelo de aplicación web se ajustaba mejor a las necesidades del sistema:

**Opción A — SPA (Single Page Application) con backend API independiente**: la interfaz se carga una vez y las interacciones posteriores se realizan mediante llamadas a la API sin recargar la página. El backend y el frontend son componentes independientes que evolucionan de forma autónoma. Toda la funcionalidad requiere JavaScript activo en el navegador.

**Opción B — Aplicación con renderizado en servidor (SSR)** (por ejemplo, Next.js): el servidor genera el HTML de cada página antes de enviarla al cliente, lo que mejora el tiempo de primera carga y el posicionamiento en buscadores. Sin beneficio real en este contexto, dado que todas las rutas de gestión requieren autenticación previa y la consulta pública de horarios no necesita indexación por buscadores.

**Opción C — Aplicación monolítica tradicional**: menor complejidad inicial al no separar frontend y backend. Dificulta el escalado independiente de los diferentes componentes del sistema.

**Opción elegida: Opción A.** El SSR no aporta valor para este sistema ya que todas las rutas de gestión están protegidas por autenticación. La SPA permite una interfaz más reactiva, especialmente en la vista de calendario con múltiples filtros interactivos. La separación frontend/backend facilita además el desarrollo y mantenimiento independiente de cada parte.

---

### 3.3.3 Modelo de sincronización con Google Calendar

La integración con Google Calendar requería decidir cuándo y cómo propagar los cambios del sistema hacia los calendarios de Google:

**Opción A — Sincronización incremental** (propagar cada cambio individual en tiempo real):
- *Pro:* el calendario de Google refleja siempre el estado más actualizado del sistema.
- *Contra:* la cuota de la API de Google Calendar es compartida a nivel de proyecto de Google Cloud (no por usuario). El volumen de cambios durante la planificación semestral —cientos de creaciones, modificaciones y cancelaciones de eventos— agotaría la cuota disponible en cuestión de horas.

**Opción B — Sincronización completa bajo demanda** (el administrador lanza la sincronización manualmente; el sistema borra y recrea todos los eventos desde el estado actual):
- *Pro:* garantiza consistencia total entre el sistema y Google Calendar con un único lanzamiento, eliminando cualquier desincronización acumulada. El consumo de cuota es predecible y acotado.
- *Contra:* los cambios no se reflejan en Google Calendar hasta que el administrador lanza explícitamente la sincronización.

**Opción elegida: Opción B.** La cuota de la API de Google Calendar (400 operaciones por minuto a nivel de proyecto) hace inviable la sincronización incremental para un calendario con cientos de eventos en periodos de planificación intensiva. El patrón de uso real —cambios en bloque al inicio de semestre— se adapta bien a una sincronización completa bajo demanda. Además, otra aplicación del ecosistema de la EII consume directamente estos calendarios de Google, por lo que la consistencia total en el momento de la sincronización es más importante que la propagación inmediata de cada cambio individual.

---

### 3.3.4 Acceso público a los horarios

Se evaluó si la consulta de horarios debía estar disponible para cualquier persona o restringida a usuarios autenticados:

**Opción A — Acceso público sin autenticación** (como el visualizador heredado): cualquier persona puede consultar los horarios sin necesidad de registrarse.

**Opción B — Acceso restringido a usuarios autenticados**: solo el personal con cuenta en el sistema puede consultar los horarios.

**Opción elegida: Opción A.** El sistema sustituye a una herramienta de consulta pública existente utilizada por estudiantes y público general. Exigir autenticación para ver los horarios representaría una regresión funcional sin justificación. El acceso público es un requisito no negociable dictado por el contexto de uso.

---

### 3.3.5 Alcance de la sincronización de Google Calendar por rol

Se evaluó qué roles de usuario podían gestionar la sincronización con Google Calendar:

**Opción A — Sincronización disponible para todos los usuarios autenticados** (docentes y administradores): cualquier usuario con cuenta puede conectar su Google y sincronizar calendarios.

**Opción B — Sincronización restringida al rol administrador**: solo los administradores pueden gestionar la sincronización de los calendarios de aulas con Google.

**Opción elegida: Opción B.** La cuota de la API de Google Calendar se consume a nivel de proyecto de Google Cloud, no por usuario individual. Si múltiples docentes pudieran sincronizar sus propias copias del calendario, el consumo de cuota sería proporcional al número de usuarios activos, haciendo la funcionalidad inviable a escala. Centralizar la sincronización en el rol administrador permite un control estricto del consumo de cuota y garantiza que los calendarios de Google que consume otra aplicación del ecosistema de la EII sean siempre gestionados por personal autorizado.
