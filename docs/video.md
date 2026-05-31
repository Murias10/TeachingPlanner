# Guion del vídeo de demostración — TeachingPlanner

> **Duración objetivo:** 4-6 minutos  
> **Formato:** Grabación de pantalla con narración en voz  
> **URL de la app:** `planificador.ingenieriainformatica.uniovi.es`

---

## 0. Preparación previa (NO grabar esto)

### Datos que deben existir en la base de datos antes de empezar

- **Titulación:** `GIISOF01 — Grado en Ingeniería Informática del Software`
- **Curso:** `2025/2026` en estado *Activo*
- **Semestre 1** con un calendario ya creado con:
  - Asignaturas: `Álgebra` (acronimo `Alg`), `Programación` (acronimo `Pro`), `Redes`
  - Grupos de laboratorio: `Alg.L1`, `Alg.L3`; teoría: `Alg.T1`; seminario: `Pro.S2`
  - Aulas: `L-11`, `A-001`
  - Varios eventos periódicos ya creados para que el calendario no aparezca vacío
  - Un hueco libre el próximo martes de 09:00 a 11:00 en el grupo `Alg.L3` (para la demo de creación)
- **Cuenta administrador:** `admin@uniovi.es` con contraseña conocida
- **Cuenta profesor:** `profe@uniovi.es` con contraseña conocida, asignada al grupo `Alg.L3`
- **Google account** del administrador ya conectada en TeachingPlanner (badge verde en Configuración)
- Tener abierta una pestaña de **Google Calendar** (calendar.google.com) en la vista Semana, con el calendario sincronizado visible

### Ajustes del escritorio antes de grabar

1. Poner el navegador en **pantalla completa** (F11)
2. Zoom del navegador al **110%** (Ctrl + `+`)
3. **Ocultar barra de favoritos** del navegador (Ctrl+Shift+B)
4. Activar **No Molestar** en Windows (esquina inferior derecha → icono de notificaciones → No Molestar)
5. Cerrar todas las pestañas salvo: la app de TeachingPlanner y Google Calendar
6. La app debe estar en la **pantalla de bienvenida** (cerrar sesión si hay alguna activa)

---

## Escena 1 — Pantalla de bienvenida y login (0:00 – 0:35)

### Estado inicial
La pantalla muestra `/` con la tarjeta central "Teaching Planner", el subtítulo "Escuela de Ingeniería Informática — Universidad de Oviedo" y dos botones: **Continuar como invitado** e **Iniciar sesión**.

### Pasos detallados

**Paso 1.** Espera 2 segundos para que el espectador lea la pantalla de bienvenida.

**Paso 2.** Haz clic en el botón **Iniciar sesión** (botón azul principal, centro de la tarjeta).

**Paso 3.** La URL cambia a `/login`. Se muestra un formulario con dos campos: `Correo electrónico` y `Contraseña`.

**Paso 4.** Haz clic en el campo **Correo electrónico** y escribe lentamente: `admin@uniovi.es`

**Paso 5.** Haz clic en el campo **Contraseña** y escribe la contraseña (los caracteres aparecerán como puntos — correcto, no pasa nada).

**Paso 6.** Haz clic en el botón **Iniciar sesión** (botón azul, parte inferior del formulario).

**Paso 7.** Espera a que cargue. La URL cambia a `/home`. Se carga el dashboard con el calendario.

### Narración
> "Accedemos a TeachingPlanner, el sistema web de gestión de horarios académicos de la EII Oviedo. Iniciamos sesión con credenciales de administrador. El servicio de autenticación valida las credenciales y nos redirige al panel principal."

---

## Escena 2 — Dashboard: vista global del calendario (0:35 – 1:25)

### Estado inicial
Estamos en `/home`. En la parte superior hay un **selector de calendario** desplegable. El calendario ocupa el área principal. La barra lateral izquierda muestra: Inicio, Titulaciones, Aulas (sección Principal) y, abajo, el nombre del usuario administrador.

### Pasos detallados

**Paso 1.** Señala (mueve el cursor lentamente) el **selector de calendario** en la parte superior de la página. Se lee: `GIISOF01 - 2025/2026 - Semestre 1`. Espera 1 segundo.

**Paso 2.** Señala la **barra de navegación del calendario**: los 5 botones de vista (`Semana`, `Semana laboral`, `Día`, `Mes`, `Agenda`) y las flechas `<` `Hoy` `>`. Espera 1 segundo.

**Paso 3.** Haz clic en el botón **Mes** (en la barra de vistas). El calendario cambia a vista mensual con eventos como teselas de color por asignatura.

**Paso 4.** Mueve el cursor lentamente por varias teselas de colores diferentes para que se vean. Espera 2 segundos.

**Paso 5.** Haz clic en el botón **Semana laboral** (en la barra de vistas). El calendario vuelve a la rejilla horaria de lunes a viernes de 09:00 a 21:00.

**Paso 6.** Localiza un evento en el calendario (por ejemplo un bloque azul de Álgebra). **Pasa el cursor por encima sin hacer clic** — aparece un tooltip flotante con: nombre completo de la asignatura, tipo de evento, duración en horas y lista de aulas asignadas.

**Paso 7.** Ahora **haz clic** sobre ese mismo evento. Se abre el **panel de detalles lateral** por la derecha. Espera 1 segundo para que cargue.

**Paso 8.** Señala con el cursor los campos del panel de detalles: nombre de asignatura, grupo (ej. `Alg.L3`), aula (`L-11`), hora de inicio y fin.

**Paso 9.** Haz clic en la **X** o fuera del panel para cerrarlo.

### Narración
> "El dashboard muestra el calendario lectivo completo del semestre seleccionado. Podemos alternar entre vistas de mes, semana laboral, semana completa, día o agenda. Cada asignatura tiene un color único. Al pasar el cursor sobre un evento aparece un resumen rápido; al hacer clic se abre el panel de detalles con la información completa: asignatura, grupo, aula y horario exacto."

---

## Escena 3 — Panel de filtros (1:25 – 2:05)

### Estado inicial
Seguimos en `/home` en vista **Semana laboral**. El panel de filtros está cerrado.

### Pasos detallados

**Paso 1.** Localiza el botón **Filtros ▼** en la barra izquierda del calendario. Fíjate en que el badge del botón muestra `0` (ningún filtro activo).

**Paso 2.** Haz clic en **Filtros ▼**. El panel de filtros se despliega mostrando las categorías: Curso, Asignatura, Tipo de grupo, Grupos, Aula, Idioma, Tipo de Evento.

**Paso 3.** Haz clic en la cabecera **Asignatura** para expandir esa categoría. Aparece la lista de asignaturas con checkboxes.

**Paso 4.** Marca el checkbox de **Álgebra**. El calendario se actualiza inmediatamente: solo quedan los eventos de Álgebra. En la cabecera del calendario aparece el contador `Mostrando X de Y eventos`.

**Paso 5.** Haz clic en la cabecera **Tipo de grupo** para expandir esa categoría.

**Paso 6.** Marca el checkbox de **L** (Laboratorio). El calendario se filtra aún más: solo quedan eventos de laboratorio de Álgebra.

**Paso 7.** Señala la **franja inferior del panel de filtros** donde aparecen las chips activas: `Álgebra ×` y `L ×`.

**Paso 8.** Haz clic en la **X de la chip `L`** para desactivar ese filtro. Vuelven los eventos de teoría y seminario de Álgebra.

**Paso 9.** Haz clic en el botón **Limpiar filtros** (en la parte inferior del panel). Todos los eventos vuelven a verse. El badge del botón Filtros vuelve a `0`.

**Paso 10.** Haz clic de nuevo en **Filtros ▼** para colapsar el panel.

### Narración
> "El panel de filtros permite acotar la vista en tiempo real. Podemos combinar filtros: por ejemplo, ver solo los laboratorios de Álgebra. La lógica es AND entre categorías y OR dentro de cada una. Las selecciones activas aparecen como chips eliminables individualmente. Todo se guarda automáticamente entre sesiones."

---

## Escena 4 — Navegar a la gestión del semestre (2:05 – 2:20)

### Estado inicial
Estamos en `/home`.

### Pasos detallados

**Paso 1.** En la barra lateral izquierda, haz clic en **Titulaciones**. La URL cambia a `/degrees` y se muestra la tabla de titulaciones.

**Paso 2.** Haz clic en el nombre o acrónimo **GIISOF01** en la tabla. Se navega a `/degrees/GIISOF01/courses`, que muestra la tabla de cursos con dos filas de semestres por año.

**Paso 3.** Localiza la fila del curso **2025/2026** con el badge verde *Activo*. En la columna de Semestre 1 verás varios iconos de acceso.

**Paso 4.** Haz clic en el **icono de calendario** (el primero de los iconos) de la fila de Semestre 1. La URL cambia a `.../calendar`. Se carga el calendario semestral con su propia barra de herramientas.

**Paso 5.** Señala brevemente los botones adicionales de esta barra: **Crear evento**, **Importar excepciones**, **Exportar .csv**, **Exportar .txt**.

### Narración
> "Navegamos a la gestión del semestre a través de la jerarquía: Titulaciones, luego el curso activo 2025/2026, y abrimos el calendario del Semestre 1. Esta vista es exclusiva del administrador y añade las herramientas de gestión."

---

## Escena 5 — Crear un evento puntual (2:20 – 3:05)

### Estado inicial
Estamos en `.../calendar` del Semestre 1, en vista **Semana laboral**.

### Pasos detallados

**Paso 1.** Localiza el **próximo martes** en el calendario. Busca el hueco libre de 09:00 a 11:00 (sin ningún evento).

**Paso 2.** **Haz clic** en la celda de las **09:00 del martes** y, **sin soltar**, arrastra el cursor hacia abajo hasta las **11:00**. Mientras arrastras, aparece un rectángulo gris sombreado indicando la selección.

**Paso 3.** **Suelta** el botón del ratón. Se abre el diálogo **"Crear evento"**. Los campos **Fecha**, **Hora inicio (09:00)** y **Hora fin (11:00)** ya están prefijados gracias al arrastre.

**Paso 4.** En el campo **Tipo de recurrencia / Frecuencia**, verifica que está seleccionado `No se repite` (evento puntual).

**Paso 5.** En el campo **Asignatura**, haz clic y empieza a escribir `Alg`. Aparece la lista filtrada. Selecciona **Álgebra**.

**Paso 6.** Al seleccionar la asignatura, aparecen dos nuevos campos automáticamente:
  - **Tipo de evento**: déjalo en `Clase`
  - **Tipo de grupo**: selecciona `L` (Laboratorio)

**Paso 7.** En el campo **Grupo**, despliega y selecciona `Alg.L3`.

**Paso 8.** En el campo **Aula**, despliega y selecciona `L-11`.

**Paso 9.** Revisa que la línea resumen al pie del diálogo muestra: `No se repite — 09:00–11:00`.

**Paso 10.** Haz clic en **Guardar**.

**Paso 11.** El diálogo se cierra. En el calendario aparece inmediatamente el nuevo evento en el martes de 09:00 a 11:00, con el color asignado a Álgebra. Señálalo con el cursor.

### Narración
> "Creamos un evento puntual haciendo clic y arrastrando directamente sobre el hueco horario — el diálogo se abre con fecha y hora ya prefijadas. Seleccionamos la asignatura, el tipo de grupo y el aula. Al guardar, el evento aparece de inmediato en el calendario."

---

## Escena 6 — Detección automática de conflictos (3:05 – 3:30)

### Estado inicial
Seguimos en el mismo calendario semestral. El evento de Álgebra recién creado está visible en el martes de 09:00 a 11:00.

### Pasos detallados

**Paso 1.** Haz clic en **Crear evento** en la barra de herramientas (esta vez usando el botón, no el arrastre).

**Paso 2.** Rellena el diálogo con exactamente los mismos datos que el evento anterior:
  - **Frecuencia:** `No se repite`
  - **Fecha:** el mismo martes
  - **Hora inicio:** `09:00`, **Hora fin:** `11:00`
  - **Asignatura:** `Álgebra`
  - **Tipo de evento:** `Clase`
  - **Tipo de grupo:** `L`
  - **Grupo:** `Alg.L3`
  - **Aula:** `L-11`

**Paso 3.** Haz clic en **Guardar**.

**Paso 4.** El sistema muestra un **mensaje de error / aviso de conflicto** indicando que ese grupo y hora ya están ocupados. Señala el aviso con el cursor y espera 2 segundos para que el espectador lo lea.

**Paso 5.** Haz clic en **Cancelar** o cierra el diálogo sin guardar.

### Narración
> "Si intentamos crear un segundo evento que solapa con uno ya existente para el mismo grupo, el sistema lo detecta automáticamente y bloquea el guardado con un aviso de conflicto. Esto elimina los errores de solapamiento que antes pasaban desapercibidos en el fichero compartido."

---

## Escena 7 — Crear un evento periódico (3:30 – 4:05)

### Estado inicial
Seguimos en el mismo calendario semestral.

### Pasos detallados

**Paso 1.** Haz clic en **Crear evento** en la barra de herramientas.

**Paso 2.** En el campo **Frecuencia / Tipo de recurrencia**, selecciona `Quincenal — semanas impares`.

**Paso 3.** En el campo **Día de la semana**, selecciona `Miércoles`.

**Paso 4.** **Hora inicio:** selecciona `15:00`. **Hora fin:** selecciona `17:00`.

**Paso 5.** En **Asignatura**, escribe `Pro` y selecciona **Programación**.

**Paso 6.** **Tipo de evento:** `Clase`. **Tipo de grupo:** `S` (Seminario).

**Paso 7.** **Grupo:** selecciona `Pro.S2`.

**Paso 8.** **Aula:** selecciona `A-001`.

**Paso 9.** Revisa la línea resumen al pie: `Quincenal (semanas impares) — Miércoles 15:00–17:00`.

**Paso 10.** Haz clic en **Guardar**.

**Paso 11.** El diálogo se cierra. Localiza el evento de Programación en el miércoles actual (si es semana impar ya aparece; si es par, navega a la siguiente semana).

**Paso 12.** Haz clic en el botón `>` (siguiente semana) **dos veces** para avanzar dos semanas. Muestra que el evento aparece en el miércoles de semana impar pero **no** en el de semana par. Señala la diferencia.

### Narración
> "Para los eventos que se repiten a lo largo del semestre, elegimos tipo periódico y configuramos el patrón — en este caso los miércoles de semanas impares de 15 a 17 horas. El sistema distribuye el evento automáticamente en todos los días lectivos que cumplen esa condición durante todo el semestre, sin necesidad de crearlo semana a semana."

---

## Escena 8 — Gestión de asignaturas y grupos (4:05 – 4:30)

### Estado inicial
Seguimos dentro del semestre. Volvemos a la vista de cursos.

### Pasos detallados

**Paso 1.** Usa el **breadcrumb** en la parte superior de la página para hacer clic en el nivel del curso (`2025/2026`). Se vuelve a la tabla de cursos/semestres.

**Paso 2.** En la fila de **Semestre 1**, haz clic en el **icono de asignaturas** (el segundo icono, después del de calendario). La URL cambia a `.../subjects`.

**Paso 3.** Muestra la tabla de asignaturas con las columnas: acrónimo, nombre, curso académico, código SIES. Señala brevemente las tres asignaturas: Álgebra, Programación, Redes.

**Paso 4.** Haz clic en el botón `<` del breadcrumb para volver al curso. Luego haz clic en el **icono de grupos** (el tercer icono en la fila del Semestre 1). La URL cambia a `.../groups`.

**Paso 5.** Muestra la tabla jerárquica de grupos, organizada por asignatura. Despliega la asignatura **Álgebra** para mostrar sus grupos: `Alg.T1`, `Alg.L1`, `Alg.L3`.

**Paso 6.** Señala la columna **Horas planificadas** (ej. `6h` junto a `Alg.L3`). Comenta brevemente que este valor controla el presupuesto máximo de horas lectivas del grupo.

### Narración
> "Desde la misma fila del semestre podemos acceder a la gestión de asignaturas y grupos. Los grupos están organizados jerárquicamente por asignatura y tipo. Las horas planificadas de cada grupo controlan el presupuesto de horas lectivas: el sistema nunca permitirá programar más horas de las configuradas."

---

## Escena 9 — Solicitud de cambio como profesor (4:30 – 5:20)

### Estado inicial
Vamos a cambiar a sesión de profesor.

### Pasos detallados

**Paso 1.** Haz clic en tu **nombre / avatar** en la parte inferior del menú lateral. Aparece un pequeño menú con **Configuración** y **Cerrar sesión**.

**Paso 2.** Haz clic en **Cerrar sesión**. Se vuelve a la pantalla de bienvenida.

**Paso 3.** Haz clic en **Iniciar sesión**. En el formulario escribe `profe@uniovi.es` y la contraseña del profesor. Haz clic en **Iniciar sesión**.

**Paso 4.** Se carga el dashboard del profesor. Observa que el menú lateral ahora tiene **Mis Solicitudes** (sección Sistema) en lugar de "Gestión de usuarios" y "Solicitudes".

**Paso 5.** Navega al calendario semestral: **Titulaciones → GIISOF01 → 2025/2026 → icono de calendario de Semestre 1**.

**Paso 6.** Observa la barra de herramientas: el botón principal ahora dice **Crear solicitud** (no "Crear evento"). Esto refleja que el profesor no puede crear eventos directamente.

**Paso 7.** Localiza un **hueco libre** en el calendario (por ejemplo el jueves de 09:00 a 11:00).

**Paso 8.** **Haz clic y arrastra** de 09:00 a 11:00 en ese hueco. Se abre el diálogo **"Solicitar evento"** con fecha, hora inicio y hora fin ya prefijadas.

**Paso 9.** Rellena los campos del diálogo:
  - **Frecuencia:** `No se repite`
  - **Fecha** y **horario**: ya vienen rellenos (09:00 – 11:00)
  - **Asignatura:** escribe `Alg` y selecciona **Álgebra**
  - **Tipo de evento:** `Clase`
  - **Tipo de grupo:** `L` (Laboratorio)
  - **Grupo:** `Alg.L3`
  - **Aula:** `L-11` (campo opcional, selecciónalo igualmente)
  - **Comentario:** escribe `"Recuperación de la clase del 12 de octubre (festivo)"`

**Paso 10.** Revisa la línea resumen en el pie del diálogo: `No se repite — 09:00–11:00`. Señálala.

**Paso 11.** Haz clic en **Solicitar**.

**Paso 12.** Aparece un **toast de confirmación** en la esquina inferior derecha: cabecera "Solicitud enviada" y texto "Tu solicitud de evento ha sido enviada para aprobación". Señala el toast antes de que desaparezca (dura ~3 segundos).

**Paso 13.** En el calendario aparece el evento con **opacidad reducida y borde discontinuo gris** — indica estado pendiente. Señálalo y espera 2 segundos.

**Paso 14.** En el menú lateral, haz clic en **Mis Solicitudes**. La URL cambia a `/my-requests`.

**Paso 15.** Muestra la tabla de solicitudes. Localiza la recién creada: columnas visibles son titulación (`GIISOF01`), curso (`2025/2026`), semestre (`1`), tipo de solicitud (`CREATE`), tipo de evento (`Puntual`), fecha de envío y estado. El badge de estado muestra **Pendiente** en color ámbar.

### Narración
> "Como profesor no podemos modificar el calendario directamente. En su lugar, creamos una solicitud: arrastramos el hueco horario, rellenamos asignatura, grupo y añadimos un comentario justificativo — el administrador lo usará para evaluar el cambio. La solicitud aparece en el calendario con borde discontinuo indicando que está pendiente, y podemos seguir su estado desde Mis Solicitudes."

---

## Escena 10 — Aprobación de la solicitud como administrador (5:20 – 5:55)

### Estado inicial
Volvemos a sesión de administrador.

### Pasos detallados

**Paso 1.** Haz clic en el avatar del profesor → **Cerrar sesión**.

**Paso 2.** Inicia sesión como `admin@uniovi.es`. Haz clic en **Iniciar sesión**.

**Paso 3.** En el menú lateral (sección Sistema), haz clic en **Solicitudes**. La URL cambia a `/solicitudes`. Esta página muestra **todas** las solicitudes pendientes del sistema, de todos los semestres y titulaciones.

**Paso 4.** Localiza la solicitud que acaba de crear el profesor (fila con `GIISOF01`, `2025/2026`, `Semestre 1`, tipo `CREATE`, estado `Pendiente` — badge ámbar).

**Paso 5.** En la columna **Acciones** de esa fila, haz clic en el **icono de ojo** (Revisar). Se abre el diálogo de revisión completo.

**Paso 6.** Dentro del diálogo, señala:
  - Los campos de asignatura, grupo y aula que son **solo lectura** (enviados por el profesor)
  - Los campos de **Frecuencia, Fecha, Hora inicio y Hora fin** que el administrador **puede ajustar** antes de aprobar
  - El **Comentario del profesor**: `"Recuperación de la clase del 12 de octubre (festivo)"`

**Paso 7.** No modifiques nada. Haz clic en **Aprobar solicitud** (botón verde dentro del diálogo).

**Paso 8.** El diálogo se cierra. La solicitud desaparece de la vista "Pendiente". Si cambias el filtro a **Aprobadas**, aparece con badge verde.

**Paso 9.** Navega al calendario del semestre (Titulaciones → GIISOF01 → 2025/2026 → icono calendario Semestre 1).

**Paso 10.** Localiza el jueves de 09:00 a 11:00. El evento ahora aparece con **color sólido y borde normal** — está aprobado y confirmado. Señálalo y espera 2 segundos.

### Narración
> "El administrador ve todas las solicitudes pendientes en un único panel global. Puede revisar los detalles, leer el comentario del profesor, ajustar la hora si fuera necesario y aprobar con un clic. El evento pasa de pendiente a confirmado y queda registrado en el log de auditoría con el nombre del administrador que lo aprobó."

---

## Escena 11 — Sincronización con Google Calendar (5:55 – 6:35)

### Estado inicial
Sesión de administrador activa.

### Pasos detallados

**Paso 1.** Haz clic en el **avatar del administrador** (parte inferior del menú lateral). Aparece el menú con Configuración y Cerrar sesión.

**Paso 2.** Haz clic en **Configuración**. La URL cambia a `/settings`.

**Paso 3.** Desplázate hacia abajo hasta la sección **Google Calendar Sync**. Muestra el badge verde "Conectado" y el email de la cuenta de Google enlazada. Señala el badge.

**Paso 4.** Haz clic en el botón **Gestionar sincronizaciones**. La URL cambia a `/calendar-sync`.

**Paso 5.** Se muestra la tabla de calendarios académicos. En la parte superior está el filtro **Filtrar por titulación** — señálalo brevemente.

**Paso 6.** Localiza la fila `GIISOF01 - 2025/2026 - Semestre 1`. La columna **Estado** muestra `Idle` o el resultado de la última sincronización. La columna **Última sincronización** muestra la fecha.

**Paso 7.** Haz clic en el **icono de sincronización** (tooltip: "Sync now") de esa fila.

**Paso 8.** Aparece una **barra de progreso** debajo de la fila con el texto `N / Total completados` que se va actualizando. Espera a que termine.

**Paso 9.** Cuando acaba, el badge de **Estado** cambia a **Success** (verde). La columna **Última sincronización** muestra la hora actual.

**Paso 10.** Cambia a la pestaña del navegador donde tienes abierto **Google Calendar** (calendar.google.com).

**Paso 11.** Muestra la vista semanal con los eventos del semestre: distintos calendarios de Google (uno por aula: `L-11`, `A-001`, etc.) con los eventos distribuidos por ubicación. Desplázate por la semana para que se vean los eventos.

### Narración
> "Desde la configuración, el administrador conecta su cuenta de Google y gestiona las sincronizaciones. Con un clic, el sistema exporta todos los eventos del calendario a Google Calendar, creando un calendario de Google por aula. Así los profesores y alumnos pueden suscribirse a las agendas de su aula desde cualquier dispositivo."

---

## Escena 12 — Vista pública como invitado (6:35 – 7:05)

### Estado inicial
Sesión de administrador activa. Vamos a cerrar sesión y entrar como invitado.

### Pasos detallados

**Paso 1.** Haz clic en el avatar → **Cerrar sesión**. Se vuelve a la pantalla de bienvenida.

**Paso 2.** En la pantalla de bienvenida, haz clic en **Continuar como invitado** (botón secundario / gris).

**Paso 3.** Se carga la pantalla de inicio en `/home`. Observa el menú lateral: solo muestra **Inicio**, **Titulaciones** y **Aulas**. La sección Sistema no existe. En la parte inferior dice "Invitado / No autenticado". Señala esto 2 segundos.

**Paso 4.** Haz clic en **Titulaciones**. Se carga la lista de titulaciones — muestra **solo** los cursos en estado *Activo* (los Planificados y Finalizados están ocultos para invitados).

**Paso 5.** Haz clic en **GIISOF01**. Se carga la tabla de cursos. Señala que solo aparece el curso **2025/2026** en estado *Activo*.

**Paso 6.** Haz clic en el **icono de calendario** del Semestre 1. Se carga el calendario semestral — completamente visible para el invitado, con todos los eventos en color.

**Paso 7.** Abre el panel de **Filtros ▼** y expande la categoría **Asignatura**. Marca el checkbox de **Álgebra**. El calendario filtra en tiempo real mostrando solo los eventos de Álgebra. Señala el contador `Mostrando X de Y eventos`.

**Paso 8.** Señala que no hay ningún botón de "Crear evento" ni "Crear solicitud" en la barra de herramientas — la vista es completamente de solo lectura.

### Narración
> "Cualquier persona puede acceder como invitado sin necesidad de cuenta. La vista pública muestra los cursos activos y permite explorar y filtrar los horarios con total libertad. Esto reemplaza directamente el acceso al fichero compartido que antes tenían profesores y alumnos para consultar horarios."

---

## Escena 13 — Cierre (7:05 – 7:20)

### Estado inicial
Seguimos como invitado en el calendario semestral.

### Pasos detallados

**Paso 1.** Cambia a vista **Mes** (botón Mes en la barra de vistas). Se muestra el mes completo con todos los eventos distribuidos en colores por asignatura.

**Paso 2.** Usa las flechas `>` para avanzar un mes y mostrar más eventos periódicos repartidos a lo largo del semestre.

**Paso 3.** Deja la imagen del calendario en pantalla durante 3 segundos mientras termina la narración.

### Narración
> "TeachingPlanner reúne en una sola herramienta web todo lo necesario para gestionar horarios académicos: eventos periódicos y puntuales, detección automática de conflictos, flujo de solicitudes con aprobación, sincronización con Google Calendar y consulta pública sin instalación. Un sistema desplegado, probado con tests de integración y E2E, y listo para producción."

---

## Checklist final antes de publicar

- [ ] Ninguna contraseña real visible en pantalla durante el login (los puntos son suficiente)
- [ ] El toast de "Solicitud enviada" aparece y es legible antes de desaparecer (~3 s) — si no se ve bien, repetir la escena
- [ ] Google Calendar en escena 11 muestra eventos reales (no pantalla vacía ni sin sincronizar)
- [ ] El evento pendiente (borde discontinuo) y el aprobado (color sólido) son claramente distinguibles visualmente
- [ ] Audio sin ruidos de fondo, narración a velocidad natural (~130 palabras/minuto)
- [ ] Resolución mínima 1080p, sin pixelado
- [ ] Sin notificaciones del SO interrumpiendo ninguna escena
- [ ] Duración total entre 5 y 7 minutos (la demo puede extenderse ligeramente)
- [ ] El breadcrumb de navegación es visible en las escenas 8 y siguientes
