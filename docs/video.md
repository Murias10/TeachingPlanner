# Guion del vídeo de demostración — TeachingPlanner

> **Duración objetivo:** 12-15 minutos  
> **Formato:** Grabación de pantalla con narración en voz  
> **URL de la app:** `planificador.ingenieriainformatica.uniovi.es`

---

## 0. Preparación previa (NO grabar esto)

### Datos que deben existir en la base de datos antes de empezar

- **Titulación:** `GIISOF01 — Grado en Ingeniería Informática del Software`
- **Cursos:** `2025/2026` en estado *Activo*, `2024/2025` en estado *Finalizado*, y `2026/2027` en estado *Planificado* sin calendario (para demostrar la duplicación en la escena 8)
- **Semestre 1 de 2025/2026** con calendario ya creado con:
  - Asignaturas: `Álgebra Lineal` (acrónimo `AL`), `Estructuras de Datos` (acrónimo `ED`), `Introducción a la Programación` (acrónimo `IP`)
  - Grupos: `AL.T1`, `AL.L1`, `AL.L3`, `ED.S2`
  - Aulas: `L-11`, `A-001`
  - Varios eventos periódicos ya creados (una clase de `AL.L3` los martes 09:00–11:00, una de `ED.S2` los miércoles 15:00–17:00 semanas pares)
  - Al menos un evento de tipo **Evaluación** (`EV ·`) ya creado para mostrar el prefijo
  - Un hueco libre el próximo martes de 11:00 a 13:00 en el grupo `AL.L3`
  - Un hueco libre el próximo jueves de 09:00 a 11:00 en el grupo `AL.L3` (para solicitud del profesor en escena 15)
  - Al menos una ocurrencia cancelada ya existente (para mostrar el estado gris tachado desde `/home`)
- **Cuenta administrador:** `uo290009@uniovi.es` con contraseña conocida
- **Cuenta profesor ya activa:** `teacher@uniovi.es` con contraseña conocida (para las escenas 14-15)
- **Cuenta nueva sin activar:** `newTeacher@uniovi.es` — creada previamente o se crea en la escena 3. Tener la URL de activación copiada en el portapapeles antes de grabar la escena 4. La cuenta debe estar en estado *Pendiente de activación*.
- **Cuenta de Google** del administrador ya conectada en TeachingPlanner (indicador verde en Configuración)
- Pestaña de **Google Calendar** abierta en la vista Semana con el calendario ya sincronizado y eventos visibles
- Fichero `excepciones.txt` de ejemplo en el escritorio
- Fichero `usuarios.xlsx` de ejemplo (2-3 profesores) en el escritorio

### Ajustes del escritorio antes de grabar

1. Navegador en **pantalla completa** (F11), zoom al **110%** (Ctrl + `+`)
2. **Ocultar barra de favoritos** (Ctrl+Shift+B)
3. Activar **No Molestar** en Windows (esquina inferior derecha → icono de notificaciones)
4. Cerrar todas las pestañas salvo la app y Google Calendar
5. La app debe estar en la **pantalla de bienvenida** (cerrar sesión si hay alguna activa)

---

## Escena 1 — Pantalla de bienvenida y login (0:00 – 0:30)

### Estado inicial
La app muestra `/` con la tarjeta central "Teaching Planner", el subtítulo "Escuela de Ingeniería Informática — Universidad de Oviedo" y dos botones: **Continuar como invitado** e **Iniciar sesión**.

### Pasos

**Paso 1.** Deja la pantalla de bienvenida visible 2 segundos.

**Paso 2.** Haz clic en **Iniciar sesión** (botón azul principal).

**Paso 3.** La URL cambia a `/login`. Se muestra el formulario con los campos `Correo electrónico` y `Contraseña`. Señala también el enlace **¿Has olvidado tu contraseña?** debajo del formulario.

**Paso 4.** Escribe lentamente `uo290009@uniovi.es` en el campo de correo.

**Paso 5.** Escribe la contraseña (aparecerán puntos).

**Paso 6.** Haz clic en **Iniciar sesión**. La URL cambia a `/home` y se carga el dashboard.

### Narración
> "Accedemos a TeachingPlanner. Desde la pantalla de bienvenida podemos iniciar sesión o entrar como invitado. El formulario de login incluye también recuperación de contraseña por correo electrónico con código OTP de seis dígitos. Iniciamos sesión como administrador."

---

## Escena 2 — Recuperación de contraseña (0:30 – 1:05)

### Estado inicial
Pantalla de login en `/login` — no cerrar sesión, quedarse en el formulario de la escena anterior.

### Pasos

**Paso 1.** Haz clic en el enlace **¿Has olvidado tu contraseña?** bajo el formulario. La URL cambia a `/forgot-password`. Se muestra el paso 1: campo de correo electrónico y botón **Solicitar código**.

**Paso 2.** Escribe `uo290009@uniovi.es` y haz clic en **Solicitar código**. El sistema envía un correo con un código de seis dígitos. Se muestra el paso 2: seis campos individuales de un dígito cada uno.

**Paso 3.** Escribe el código de seis dígitos recibido en los campos. Señala el enlace **Reenviar código** (activo tras 60 segundos) y el enlace **Cambiar correo** para volver atrás. Haz clic en **Verificar código**.

**Paso 4.** Se muestra el paso 3: campos `Nueva contraseña` y `Confirmar contraseña` con el indicador de requisitos. Escribe una nueva contraseña. El indicador se actualiza en tiempo real mostrando: mayúscula ✓, minúscula ✓, número ✓, carácter especial ✓, mínimo 8 caracteres ✓. Haz clic en **Actualizar contraseña**.

**Paso 5.** Redirige al formulario de login.

### Narración
> "La recuperación de contraseña tiene tres pasos: se introduce el correo, se recibe un código de verificación de seis dígitos por email, y se establece la nueva contraseña. El indicador de requisitos guía al usuario en tiempo real para que la contraseña sea segura."

---

## Escena 3 — Gestión de usuarios (1:05 – 2:00)

### Estado inicial
Sesión de administrador activa en `/home` (continuamos tras el login de la escena 1).

### Pasos

**Paso 1.** Haz clic en **Gestión de usuarios** en el menú lateral. Se carga la tabla con columnas: nombre, correo, rol, estado de activación. Señala que hay usuarios con estado "Activado" y otros "Pendiente de activación". La tabla está paginada a 10 filas con navegación Anterior/Siguiente al pie.

**Paso 2.** Escribe `teacher` en el buscador superior. La tabla filtra en tiempo real mostrando solo coincidencias por correo. Borra el texto para restablecer.

**Paso 3.** Haz clic en **Crear usuario**. Panel lateral con campos: nombre, apellidos, correo, rol (Administrador / Profesor). Rellena `Nuevo`, `Profesor`, `newTeacher@uniovi.es`, rol `Profesor`. Haz clic en **Guardar**. La nueva cuenta aparece con estado "Pendiente de activación". Se envía automáticamente el correo de activación.

**Paso 4.** Haz clic en el **icono de editar** (lápiz) de la fila de Nuevo Profesor. El mismo panel se abre con sus datos. Corrige el nombre a `Nuevo Profesor Demo`. Guarda. — Este ciclo de crear, editar y eliminar es idéntico para todas las entidades de la aplicación.

**Paso 5.** Selecciona con el checkbox la fila de Nuevo Profesor Demo. Haz clic en **Eliminar seleccionadas**. Confirma en el diálogo. La fila desaparece.

**Paso 6.** Haz clic de nuevo en **Crear usuario** y crea otra vez `newTeacher@uniovi.es` con rol `Profesor`. Esta es la cuenta que se activará en la siguiente escena.

**Paso 7.** Haz clic en **Importar usuarios**. Se abre el selector de fichero. Selecciona `usuarios.xlsx` del escritorio. Las filas importadas aparecen en la tabla y cada usuario recibe su correo de activación automáticamente.

### Narración
> "Desde Gestión de usuarios el administrador crea cuentas individualmente o importa un Excel completo. Cada nueva cuenta recibe su correo de activación al instante. El patrón de crear, editar y eliminar que acabamos de ver con usuarios es el mismo en todas las entidades de la aplicación: aulas, titulaciones, cursos, asignaturas y grupos."

---

## Escena 4 — Activación de cuenta (2:00 – 2:20)

### Estado inicial
Tenemos la URL de activación de `newTeacher@uniovi.es` copiada en el portapapeles (copiada antes de empezar a grabar).

### Pasos

**Paso 1.** Abre una pestaña nueva y pega la URL de activación (`/activate?token=...`). Se carga la pantalla con campos `Contraseña` y `Confirmar contraseña` y el indicador de requisitos — el mismo que ya vimos en la recuperación de contraseña. Escribe una contraseña y haz clic en **Activar cuenta**. Redirige al login.

**Paso 2.** Cierra esa pestaña y vuelve a la sesión de administrador.

### Narración
> "Cuando el usuario nuevo recibe el correo de activación, hace clic en el enlace, establece su contraseña con el indicador de requisitos en tiempo real, y ya puede iniciar sesión. Volvemos a la sesión de administrador para continuar con la configuración."

---

## Escena 5 — Dashboard: lectura del calendario y navegación (2:20 – 3:20)

### Estado inicial
Sesión de administrador (`uo290009@uniovi.es`) activa en `/home`.

### Pasos

**Paso 1.** Señala el **selector de calendario** en la parte superior: `GIISOF01 - 2025/2026 - Semestre 1`. Indica que solo aparecen calendarios de cursos en estado *Activo*.

**Paso 2.** Señala la **barra de vistas**: `Semana`, `Semana laboral`, `Día`, `Mes`, `Agenda` y las flechas `<` `Hoy` `>`.

**Paso 3.** Haz clic en **Mes**. Vista mensual con teselas de color por asignatura. Espera 2 segundos.

**Paso 4.** Haz clic en **Agenda**. Se muestra la lista cronológica de eventos próximos con fecha, hora y aula completas. Espera 2 segundos.

**Paso 5.** Haz clic en **Semana laboral**. Vuelve la rejilla de 09:00 a 21:00.

**Paso 6.** Señala las **teselas de eventos** y los distintos prefijos visibles en el calendario:
  - Un evento de clase normal (sin prefijo): `AL.L3 / 09:00 · L-11`
  - Un evento de evaluación con prefijo `EV ·`: señala que no consume horas planificadas y puede asignarse a varios grupos a la vez
  - Señala que cada asignatura tiene un color distinto y consistente en toda la aplicación

**Paso 7.** Señala un **día festivo** con fondo gris claro — visualmente diferenciado de los días lectivos.

**Paso 8.** Señala un evento con **color gris y texto tachado** (ocurrencia cancelada) en el calendario.

**Paso 9.** Haz clic en **Día** en la barra de vistas. El calendario muestra solo el día actual con resolución horaria de 09:00 a 21:00. Espera 1 segundo. Vuelve a **Semana laboral**.

**Paso 10.** Pasa el cursor sobre un evento sin hacer clic — aparece el texto emergente con nombre completo de asignatura, tipo, duración y lista de aulas.

**Paso 11.** Haz clic en ese evento. Se abre el **panel de detalles lateral** con asignatura, grupo, aula, hora inicio y fin. Señala los campos. Cierra el panel con la **X**.

**Paso 12.** Intenta navegar más allá de la fecha de fin del calendario pulsando `>` varias veces seguidas. Muestra que la navegación se detiene al llegar al límite del semestre — no se puede ir más allá del período del calendario.

### Narración
> "El dashboard muestra todos los eventos del semestre activo seleccionado. Hay cinco vistas: semana laboral, semana completa, día, mes y agenda. Las teselas muestran el identificador asignatura-grupo y el aula. Los eventos de evaluación llevan el prefijo EV·, los de revisión RE·, los de otras actividades OT·, y las reservas independientes de aula se identifican con IND. Los días festivos tienen fondo gris, las ocurrencias canceladas aparecen en gris tachado. La navegación está limitada al rango del semestre seleccionado."

---

## Escena 6 — Panel de filtros (3:20 – 4:05)

### Estado inicial
Seguimos en `/home` en vista **Semana laboral** como administrador.

### Pasos

**Paso 1.** Haz clic en **Filtros ▼** en la barra lateral izquierda. El panel se despliega mostrando las siete categorías: Curso, Asignatura, Tipo de grupo, Grupos, Aula, Idioma, Tipo de Evento.

**Paso 2.** Expande **Asignatura** y marca `Álgebra Lineal`. El calendario filtra en tiempo real. El contador muestra `Mostrando X de Y eventos`.

**Paso 3.** Expande **Tipo de grupo** y marca `L` (Laboratorio). Solo quedan laboratorios de Álgebra Lineal.

**Paso 4.** Expande **Aula** y escribe `L` en el buscador interno de la categoría — la lista se acota a laboratorios. Selecciona `L-11`.

**Paso 5.** Expande **Tipo de Evento** y marca `Cancelado`. Muestra que las opciones que no devolverían resultados aparecen en gris deshabilitadas, evitando combinaciones vacías.

**Paso 6.** Señala las chips activas en la franja inferior: `Álgebra Lineal ×`, `L ×`, `L-11 ×`, `Cancelado ×`. Haz clic en la **X de la chip `Cancelado`** para desactivarla individualmente.

**Paso 7.** Haz clic en **Limpiar filtros**. Todos los eventos vuelven. El contador del botón vuelve a `0`.

**Paso 8.** Cierra el panel con **Filtros ▼**.

### Narración
> "El panel de filtros combina siete categorías: curso académico, asignatura, tipo de grupo, grupos individuales, aula, idioma y tipo de evento. La lógica es AND entre categorías y OR dentro de cada una. El buscador interno aparece cuando hay más de ocho opciones. Las opciones sin resultados se muestran deshabilitadas para evitar calendarios vacíos. Los filtros activos se gestionan como chips y se persisten automáticamente entre sesiones."

---

## Escena 7 — Vista de Aulas (4:05 – 4:25)

### Estado inicial
Seguimos en `/home` como administrador.

### Pasos

**Paso 1.** En el menú lateral, haz clic en **Aulas** (`/classrooms`). Se muestra la tabla con columnas: código de aula y enlace GIS. Señala una fila con el enlace activo al GIS de la universidad.

**Paso 2.** Señala la barra de herramientas de administrador: **Crear aula**, **Eliminar seleccionadas** y los iconos de editar/eliminar en cada fila. Haz clic en **Crear aula**, escribe `B-101` y guarda. Aparece en la tabla.

### Narración
> "La sección Aulas lista todos los espacios disponibles con su código y enlace GIS. El administrador puede crear, editar o eliminar aulas — el mismo patrón que veremos a continuación con titulaciones. Si un aula tiene eventos asociados, el sistema advierte antes de eliminarla."

---

## Escena 8 — Gestión de titulaciones, cursos y calendarios (4:25 – 5:25)

### Estado inicial
Seguimos como administrador en `/home`.

### Pasos

**Paso 1.** En el menú lateral haz clic en **Titulaciones** (`/degrees`). Se muestra la tabla con el botón **Crear titulación** y los iconos de editar/eliminar en cada fila.

**Paso 2.** Haz clic en **GIISOF01**. Se carga la tabla de cursos. Señala las etiquetas de estado: *Planificado* (azul), *Activo* (verde), *Finalizado* (gris). Señala que la transición de estados es unidireccional: Planificado → Activo → Finalizado, sin vuelta atrás.

**Paso 3.** Señala en la fila de `2025/2026` Semestre 2 (sin calendario) que los iconos de acceso están **deshabilitados** con el tooltip "Requiere calendario" — no se puede acceder a asignaturas, grupos ni solicitudes hasta que exista un calendario.

**Paso 4.** En la fila de `2026/2027`, Semestre 1, haz clic en el icono **+** (Crear calendario). Se abre el panel con tres pestañas.

**Paso 5.** Muestra la pestaña **Manual**: explica que es un asistente de tres pasos — establecer fechas de inicio y fin → marcar días festivos en un selector → añadir comentarios a los festivos.

**Paso 6.** Haz clic en la pestaña **Importar**. Muestra los cinco campos de fichero TXT: `asignaturas.txt` (obligatorio), `calendario.txt` (obligatorio), `horarios.txt` (obligatorio), `ubicaciones.txt` (obligatorio), `excepciones.txt` (opcional). Explica que corresponden al formato del sistema legado.

**Paso 7.** Haz clic en la pestaña **Duplicar**. Selecciona `2025/2026 - Semestre 1` como origen. Ajusta las fechas al nuevo curso. Señala que los festivos se copian y adaptan automáticamente al nuevo año. Haz clic en **Crear calendario**. El calendario aparece creado en la fila del Semestre 1 de `2026/2027` — el icono de calendario ya está activo.

**Paso 8.** En la fila de `2025/2026`, Semestre 1, haz clic en el **icono de eliminar** del calendario existente. Aparece el diálogo de confirmación advirtiendo que todos los eventos se borrarán permanentemente. Haz clic en **Cancelar** (no eliminamos el calendario de trabajo).

### Narración
> "El administrador gestiona titulaciones, cursos y calendarios. Los cursos avanzan su estado de Planificado a Activo a Finalizado de forma unidireccional. Los iconos de acceso a asignaturas, grupos y solicitudes están deshabilitados hasta que exista un calendario. Para crear un calendario hay tres modos: el asistente manual, la importación de los cinco ficheros TXT del sistema legado, o la duplicación de un año anterior — la más rápida al inicio de cada curso, y la que acabamos de usar."

---

## Escena 9 — Gestión de asignaturas y grupos (5:25 – 6:20)

### Estado inicial
Seguimos como administrador en la tabla de cursos de GIISOF01.

### Pasos

**Paso 1.** En la fila de Semestre 1 del curso `2025/2026`, haz clic en el **icono de asignaturas** (segundo icono). URL cambia a `.../subjects`.

**Paso 2.** Muestra la tabla: acrónimo, nombre completo, curso académico, código SIES. Señala que hay iconos de editar y eliminar en cada fila — al eliminar una asignatura el sistema avisa que también se eliminarán sus grupos y todos los eventos asociados en cascada.

**Paso 3.** Usa la ruta de navegación para volver al Semestre 1. Haz clic en el **icono de grupos** (tercer icono). URL cambia a `.../groups`.

**Paso 4.** Muestra la tabla jerárquica de grupos por asignatura con columnas: tipo, número, idioma, horas planificadas. Señala que los grupos también tienen iconos de crear y eliminar.

**Paso 5.** Haz clic en el botón **Gestionar grupos** de la fila de **Álgebra Lineal**. Se abre el panel de detalle con pestañas por tipo (T, S, L, TG) y columnas Español / Inglés.

**Paso 6.** En la pestaña `L`, haz clic sobre el valor `6h` del grupo `AL.L3`. El campo cambia a modo edición. Escribe `6.5`. Pulsa **Enter**. Se guarda como `6,5h`. Señala que solo se aceptan múltiplos de 0,5.

### Narración
> "La gestión de asignaturas y grupos construye la estructura académica del semestre. Eliminar una asignatura es destructivo en cascada: también elimina sus grupos y todos sus eventos. Las horas planificadas de cada grupo se editan haciendo clic directamente sobre el valor — controlan el presupuesto máximo de horas lectivas y limitan automáticamente las solicitudes del profesor."

---

## Escena 10 — Creación y edición de eventos en el calendario (6:20 – 7:30)

### Estado inicial
Desde la fila del Semestre 1, haz clic en el **icono de calendario**. Se carga `.../calendar`.

### Pasos

**→ Evento puntual por arrastre**

**Paso 1.** En vista **Semana laboral**, localiza el martes con el hueco libre de 11:00 a 13:00. Haz **clic y arrastra** de 11:00 a 13:00. El diálogo **Crear evento** se abre con fecha y hora prefijadas.

**Paso 2.** Rellena: frecuencia `No se repite`, asignatura `Álgebra Lineal`, tipo de evento `Clase`, tipo de grupo `L`, grupo `AL.L3`, aula `L-11`. Haz clic en **Guardar**. El evento aparece en el calendario.

**→ Evento periódico**

**Paso 3.** Haz clic en **Crear evento** (sin arrastre). Selecciona frecuencia `Quincenal — semanas impares`, día `Miércoles`, hora `15:00–17:00`, asignatura `Estructuras de Datos`, tipo `S`, grupo `ED.S2`, aula `A-001`. Guarda. Avanza con `>` dos semanas — el evento aparece en miércoles de semana impar y no en semana par.

**→ Editar y eliminar evento puntual**

**Paso 4.** Haz clic sobre el **evento puntual** creado en el paso 2 (martes 11:00–13:00). En el menú contextual aparecen dos opciones: **Editar evento** y **Eliminar evento**.

**Paso 5.** Selecciona **Editar evento**. El diálogo se abre con los datos actuales. Cambia el aula a `A-001`. Haz clic en **Guardar**. El evento se actualiza en el calendario.

**Paso 6.** Haz clic de nuevo sobre el evento puntual. Selecciona **Eliminar evento**. Aparece diálogo de confirmación. Confirma. El evento desaparece permanentemente del calendario.

**→ Editar serie completa**

**Paso 7.** Haz clic sobre el **evento periódico de Estructuras de Datos**. En el menú contextual, selecciona **Editar serie de eventos**. El diálogo se abre con los datos actuales editables: día, hora, aula. Cambia la hora de fin a `17:30`. Guarda. Todos los eventos de la serie quedan actualizados.

**→ Reemplazar una ocurrencia**

**Paso 8.** Haz clic sobre otra ocurrencia del evento periódico. Selecciona **Reemplazar evento**. El diálogo muestra tres secciones: bloque original (solo lectura), campos del nuevo evento (nueva fecha, hora, aula) y bloque **Resumen** que se actualiza en tiempo real. Rellena una fecha diferente. Señala el resumen. Haz clic en **Confirmar**. La ocurrencia original aparece cancelada (gris tachado) y la nueva aparece confirmada.

**→ Cancelar una ocurrencia y revertirla**

**Paso 9.** Haz clic sobre otra ocurrencia del evento periódico. Selecciona **Eliminar evento** (solo esta ocurrencia). El evento aparece en gris con texto tachado (cancelado).

**Paso 10.** Haz clic sobre ese evento cancelado. Selecciona **Revertir cancelación**. Vuelve al color normal.

### Narración
> "El administrador crea eventos directamente en el calendario. El arrastre sobre el hueco prefija la fecha y hora. Para eventos periódicos se configura el patrón de recurrencia. Sobre una serie ya creada se puede editar toda la serie a la vez, reemplazar una ocurrencia concreta — lo que cancela la original y crea una nueva —, cancelar puntualmente una ocurrencia o revertir esa cancelación."

---

## Escena 11 — Detección automática de conflictos (7:30 – 7:50)

### Estado inicial
Seguimos en el calendario semestral.

### Pasos

**Paso 1.** Haz clic en **Crear evento**. Rellena los mismos datos que un evento periódico ya existente en el calendario: mismo grupo `AL.L3`, misma franja horaria (martes 09:00–11:00), con frecuencia `No se repite`.

**Paso 2.** Haz clic en **Guardar**. El sistema muestra el **aviso de conflicto** indicando que ese grupo y esa franja ya están ocupados. Señala el aviso 2 segundos.

**Paso 3.** Haz clic en **Cancelar**.

### Narración
> "Si un evento solapa en grupo o aula con uno ya existente, el sistema lo detecta y bloquea el guardado con un aviso de conflicto. Esto reemplaza la validación manual que antes se hacía a ojo en el fichero compartido."

---

## Escena 12 — Importar excepciones y exportar calendario (7:50 – 8:20)

### Estado inicial
Seguimos en el calendario semestral, barra de herramientas visible.

### Pasos

**Paso 1.** Haz clic en **Importar excepciones**. Se abre el diálogo con dos modos: **Agregar** (añade al existente conservando los anteriores) y **Reemplazar** (sobrescribe todo). Selecciona `Agregar`.

**Paso 2.** Haz clic en **Seleccionar fichero**, elige `excepciones.txt` del escritorio y confirma. El calendario muestra las excepciones cargadas: clases canceladas en gris tachado.

**Paso 3.** Haz clic en **Exportar .csv**. El navegador descarga el fichero. Comenta: "CSV compatible con Google Calendar y otras aplicaciones de calendario".

**Paso 4.** Haz clic en **Exportar .txt**. Se descarga el fichero en formato nativo. Comenta: "formato de interoperabilidad con el ecosistema de herramientas de la escuela".

### Narración
> "El calendario puede enriquecerse importando un fichero de excepciones del sistema legado — clases canceladas, recuperaciones puntuales — en modo Agregar o Reemplazar. Y en cualquier momento se puede exportar en CSV para Google Calendar o en TXT para las herramientas propias de la escuela."

---

## Escena 13 — Solicitudes de semestre (acceso por icono desde la fila del semestre) (8:20 – 8:40)

### Estado inicial
Seguimos como administrador. Volvemos a la tabla de cursos de GIISOF01.

### Pasos

**Paso 1.** Usa la ruta de navegación para llegar a la tabla de cursos de GIISOF01.

**Paso 2.** En la fila de **Semestre 1** del curso `2025/2026`, señala el **cuarto icono** (solicitudes). Haz clic en él. URL cambia a `.../solicitudes`.

**Paso 3.** Muestra que esta vista muestra solo las solicitudes del Semestre 1 de este curso concreto, a diferencia de la vista global del menú lateral que agrupa todas. Señala los botones de filtro por estado: Pendiente, Aprobada, Rechazada, Todas.

**Paso 4.** Señala que las acciones disponibles son exactamente las mismas: icono de ojo (revisar), tick (aprobar directo), X (rechazar).

### Narración
> "Además del panel global de solicitudes del menú lateral, el administrador puede acceder a las solicitudes de un semestre concreto directamente desde la fila del semestre. Es útil para gestionar las solicitudes de un grupo de asignaturas sin mezclarlas con las del resto del sistema."

---

## Escena 14 — Configuración del perfil del profesor (8:40 – 9:00)

### Estado inicial
Sesión de `teacher@uniovi.es` en `/home`. El cambio de usuario se menciona en narración, no se graba.

### Pasos

**Paso 1.** Haz clic en el **avatar / nombre** en la parte inferior del menú lateral. Aparece el menú pequeño con **Configuración** y **Cerrar sesión**.

**Paso 2.** Haz clic en **Configuración** (`/settings`). Se muestra la página con dos secciones: **Perfil de usuario** y **Contraseña**.

**Paso 3.** En **Perfil de usuario**, señala los campos: nombre, apellidos, correo electrónico y nombre de usuario universitario. Modifica el nombre a `Profesor Demo`. Haz clic en **Actualizar perfil**. Aparece confirmación de que los datos se han guardado.

### Narración
> "Desde la cuenta del profesor accedemos a Configuración. El profesor puede actualizar su perfil: nombre, apellidos, correo y nombre de usuario universitario. También puede cambiar su contraseña en cualquier momento desde la sección Contraseña."

---

## Escena 15 — Solicitudes del profesor: los cuatro tipos (9:00 – 10:15)

### Estado inicial
Seguimos con la sesión de `teacher@uniovi.es` en el calendario del Semestre 1.

**→ Solicitud CREATE (nuevo evento)**

**Paso 1.** Haz **clic y arrastra** sobre el hueco del jueves de 09:00 a 11:00. Se abre el diálogo **Solicitar evento** con fecha y hora prefijadas.

**Paso 2.** Rellena: frecuencia `No se repite`, asignatura `Álgebra Lineal`, tipo `Clase`, grupo `L`, `AL.L3`, aula `L-11`, comentario `"Recuperación de la clase del 12 de octubre (festivo)"`. Señala la **línea resumen** al pie del diálogo: `No se repite — 09:00–11:00`.

**Paso 3.** Haz clic en **Solicitar**. Aparece el aviso emergente "Solicitud enviada — Tu solicitud ha sido enviada para aprobación". Señálalo antes de que desaparezca (~3 segundos).

**Paso 4.** El evento aparece en el calendario con **opacidad reducida y borde discontinuo gris** (pendiente). Señálalo.

**→ Solicitud EDIT (editar serie)**

**Paso 5.** Haz clic derecho sobre un **evento periódico** ya existente. El menú contextual muestra: **Ver detalles**, **Solicitar editar serie de eventos**, **Solicitar reemplazar evento**, **Solicitar cancelar** (en rojo). Señala que en un evento puntual esta opción aparece como "Solicitar edición" en lugar de "Solicitar editar serie de eventos".

**Paso 6.** Haz clic en **Solicitar editar serie de eventos**. Se abre el diálogo con los campos actuales pre-rellenados y editables: frecuencia, día, hora, aula. Cambia el aula a `A-001`. Haz clic en **Enviar solicitud**.

**→ Solicitud CANCEL (cancelar una ocurrencia)**

**Paso 7.** Haz clic derecho sobre otra ocurrencia del mismo evento periódico. Selecciona **Solicitar cancelar** (en rojo). Se abre el diálogo mostrando los detalles del evento en solo lectura: tipo, fecha, grupos, aula. Hay un campo `Comentario` — escribe `"Actividad de evaluación continua programada para este día"`. Haz clic en **Solicitar cancelación**.

**→ Solicitud REPLACE (reemplazar una ocurrencia)**

**Paso 8.** Haz clic derecho sobre otra ocurrencia. Selecciona **Solicitar reemplazar evento**. El diálogo tiene tres secciones:
  - Bloque superior (solo lectura): evento original con asignatura, grupos, aulas, fecha y hora exacta
  - Sección central: nueva fecha, hora inicio, hora fin, aula
  - Bloque **Resumen de la solicitud** al pie: se actualiza en tiempo real con las dos acciones (`"El evento del DD/MM a las HH:MM será cancelado"` y `"Se solicitará un nuevo evento el DD/MM de HH:MM a HH:MM. Aula solicitada: A-001"`)

**Paso 9.** Rellena nueva fecha (una semana después), hora `13:00–15:00`, aula `A-001`. Señala el bloque de resumen actualizándose. Haz clic en **Solicitar reemplazo**.

**→ Mis Solicitudes**

**Paso 10.** En el menú lateral, haz clic en **Mis Solicitudes** (`/my-requests`). Se muestra la tabla con todas las solicitudes enviadas: columnas titulación, curso, semestre, tipo (CREAR / EDITAR / CANCELAR / REEMPLAZAR), tipo de evento, fecha de envío y estado con código de color (ámbar = pendiente, verde = aprobada, rojo = rechazada). Señala el botón de actualizar (icono de refresco) y los botones de filtro por estado. Las solicitudes aprobadas y rechazadas muestran "Procesada" en la columna Acciones (solo lectura). La tabla está paginada a 10 filas.

**Paso 11.** Comenta brevemente: si una solicitud CREATE supera el presupuesto de horas planificadas del grupo, el sistema la rechaza automáticamente sin llegar al administrador — el profesor ve un aviso indicando que debe contactar al administrador para revisar la configuración de horas.

### Narración
> "El profesor dispone de cuatro tipos de solicitud: CREATE para pedir un evento nuevo, EDIT para proponer un cambio en toda una serie, CANCEL para pedir la cancelación de una ocurrencia puntual, y REPLACE para sustituir una ocurrencia por otra en distinta fecha — el diálogo de reemplazo muestra un bloque de resumen que detalla exactamente las dos acciones que se ejecutarán si el administrador aprueba. Desde Mis Solicitudes puede seguir el estado de todas sus peticiones."

---

## Escena 16 — Aprobación y rechazo de solicitudes (como administrador) (10:15 – 11:00)

### Estado inicial
Sesión de administrador (`uo290009@uniovi.es`) en `/solicitudes`. El cambio de usuario se menciona en narración, no se graba.

### Pasos

**Paso 1.** Vista global de todas las solicitudes del sistema: aparecen las cuatro solicitudes enviadas por el profesor en la escena anterior.

**Paso 2.** Localiza la solicitud de tipo `CANCELAR` (estado Pendiente, ámbar). Haz clic en el **icono X** (Rechazar). Se abre el diálogo de rechazo con campo de texto. Escribe `"El aula está libre en ese horario, no es necesario cancelar"`. Haz clic en **Rechazar**. Pasa a estado Rechazada (etiqueta roja).

**Paso 3.** Localiza la solicitud de tipo `CREAR` (estado Pendiente). Haz clic directamente en el **icono de tick** (Aprobar directamente, sin abrir el diálogo de revisión). La solicitud se aprueba instantáneamente usando los datos tal como los envió el profesor. Pasa a estado Aprobada (etiqueta verde).

**Paso 4.** Localiza la solicitud de tipo `REEMPLAZAR` (estado Pendiente). Haz clic en el **icono de ojo** (Revisar). El diálogo muestra los detalles tal como los envió el profesor: asignatura, grupo y aula en solo lectura; frecuencia, fecha y hora ajustables por el administrador. Lee el comentario del profesor. Haz clic en **Aprobar solicitud** (botón verde). El diálogo se cierra.

**Paso 5.** Navega al calendario del semestre. La ocurrencia original aparece cancelada (gris tachado) y la nueva ocurrencia aparece confirmada (color sólido). Señala ambas.

**Paso 6.** Localiza la solicitud de tipo `EDITAR` pendiente. En lugar de usar el panel global, navega al calendario. Haz clic derecho sobre el evento pendiente (borde discontinuo). El menú contextual muestra **Aprobar solicitud**, **Revisar solicitud** y **Rechazar solicitud** — el administrador puede gestionar solicitudes sin salir del calendario. Haz clic en **Revisar solicitud**. Se abre el diálogo completo con los datos del profesor y los campos ajustables. Señala que aquí el administrador puede modificar el horario antes de aprobar. Haz clic en **Aprobar solicitud**. El evento aparece con color sólido y el profesor verá el cambio en su página Mis Solicitudes.

### Narración
> "El administrador gestiona todas las solicitudes desde el panel global o directamente haciendo clic derecho sobre el evento en el calendario. Puede rechazar con un motivo que el profesor verá en Mis Solicitudes, o revisar la solicitud y ajustar el horario antes de aprobar. Al aprobar un reemplazo, el sistema cancela la ocurrencia original y confirma la nueva automáticamente."

---

## Escena 17 — Sincronización con Google Calendar (11:00 – 11:50)

### Estado inicial
Sesión de administrador activa.

### Pasos

**Paso 1.** Haz clic en el avatar → **Configuración** (`/settings`).

**Paso 2.** Desplázate hasta la sección **Sincronización con Google Calendar**. Explica que la primera vez que el administrador llega aquí, el indicador es gris "No conectado" y hay un botón **Conectar**. Al pulsar **Conectar** se lanza el flujo OAuth de Google: se abre la pantalla de autorización de Google, el administrador elige su cuenta y concede permisos, y al volver a la app el indicador pasa a verde mostrando el correo de la cuenta enlazada. Para la demo el sistema ya está conectado — muestra el indicador verde y el correo de la cuenta.

**Paso 3.** Señala el botón **Desconectar** y comenta: al desconectar, el sistema elimina automáticamente todos los calendarios de Google que había creado. No lo pulses.

**Paso 4.** Haz clic en **Gestionar sincronizaciones** (`/calendar-sync`).

**Paso 5.** Muestra la tabla de calendarios académicos con el filtro **Filtrar por titulación** en la parte superior. Señala las columnas: Estado, Última sincronización e iconos de acción.

**Paso 6.** Localiza `GIISOF01 - 2025/2026 - Semestre 1`. El estado muestra `En espera` y la fecha de la última sincronización.

**Paso 7.** Haz clic en el **icono de sincronización** (Sincronizar ahora). Aparece la barra de progreso `N / Total completados` que se actualiza. Espera a que finalice.

**Paso 8.** El indicador de Estado cambia a **Completado** (verde). La columna Última sincronización muestra la hora actual.

**Paso 9.** Señala el **icono de papelera** (Eliminar sincronización) que aparece ahora que el calendario ha sido sincronizado al menos una vez. Comenta: al pulsar este icono se eliminan todos los eventos de ese calendario de Google Calendar y los calendarios de aula que queden vacíos. No lo pulses.

**Paso 10.** Cambia a la pestaña de **Google Calendar**. Muestra la vista semanal con los eventos distribuidos en calendarios por aula (`L-11`, `A-001`, etc.). Desplázate para que se vean varios eventos de diferentes días.

### Narración
> "El administrador sincroniza cualquier calendario académico con Google Calendar con un solo clic. El sistema crea un calendario de Google por aula, distribuyendo los eventos según su ubicación. Una vez sincronizado, el icono de papelera permite eliminar toda la sincronización, borrando los eventos de Google Calendar automáticamente. Al desconectar la cuenta de Google, el sistema hace lo mismo con todos los calendarios sincronizados."

---

## Escena 18 — Vista pública como invitado (11:50 – 12:10)

### Estado inicial
Sesión de invitado en `/home`. El cambio a invitado se menciona en narración, no se graba.

### Pasos

**Paso 1.** Señala el menú lateral: solo **Inicio**, **Titulaciones** y **Aulas**. Sin sección Sistema. La parte inferior dice "Invitado / No autenticado".

**Paso 2.** Navega a **Titulaciones → GIISOF01 → cursos**. Solo aparece el curso `2025/2026` en estado *Activo*. Los cursos Planificados y Finalizados están ocultos para el invitado.

**Paso 3.** Abre el calendario del Semestre 1. El calendario es completamente visible con todos los eventos en color. Señala que la barra de herramientas no tiene ningún botón de Crear ni Solicitar — solo lectura.

### Narración
> "Cualquier persona accede como invitado sin cuenta: solo ve los cursos activos, puede explorar los horarios libremente con todas las vistas y filtros, y consultar la lista de aulas. No puede crear ni modificar nada. Esto reemplaza directamente el acceso al fichero compartido que antes tenían alumnos y visitantes."

---

## Escena 19 — Cierre (12:10 – 12:25)

### Estado inicial
Sesión de administrador en el calendario del Semestre 1 de `2025/2026`. El cambio de usuario se menciona en narración, no se graba.

### Pasos

**Paso 1.** Cambia a vista **Mes**. Se muestra el mes completo con los eventos distribuidos en colores por asignatura.

**Paso 2.** Avanza un mes con `>`. Deja el calendario visible 3 segundos.

### Narración
> "TeachingPlanner integra en una sola herramienta web la gestión completa de horarios académicos: estructura de titulaciones, cursos y calendarios con tres modos de creación; eventos periódicos y puntuales de cinco tipos distintos con detección automática de conflictos; importación y exportación del sistema legado; flujo estructurado de solicitudes de cambio con cuatro tipos y aprobación con ajuste por parte del administrador; sincronización con Google Calendar por aula; y consulta pública sin instalación ni cuenta. Todo desplegado, probado con 27 tests de integración y 57 tests end-to-end, y listo para producción."

---

## Checklist final antes de publicar

### Preparación de cuentas
- [ ] La cuenta `uo290009@uniovi.es` está activa y con contraseña conocida antes de grabar la escena 1
- [ ] La cuenta `teacher@uniovi.es` está **activa** y con contraseña conocida antes de grabar la escena 14
- [ ] La cuenta `newTeacher@uniovi.es` está en estado *Pendiente de activación* y la URL de activación está copiada en el portapapeles antes de grabar la escena 4
- [ ] El código OTP de recuperación de contraseña está disponible durante la grabación de la escena 2 (usar cuenta `uo290009@uniovi.es`)

### Datos de prueba
- [ ] Los prefijos `EV ·`, `RE ·` u `OT ·` son visibles en al menos un evento del calendario en la escena 5 — preparar ese evento en los datos de prueba
- [ ] Al menos una ocurrencia cancelada (gris tachado) está visible en el calendario de la escena 5
- [ ] Los iconos deshabilitados "Requiere calendario" se ven en la fila del Semestre 2 sin calendario (escena 8, paso 6)
- [ ] El curso `2026/2027` existe en estado *Planificado* sin calendario antes de grabar la escena 8
- [ ] La duplicación del calendario (escena 8, paso 7) completa sin error y el icono de calendario aparece activo en la fila
- [ ] El hueco libre del jueves de 09:00 a 11:00 en `AL.L3` está disponible para la solicitud CREATE de la escena 15
- [ ] El evento periódico de `AL.L3` (martes 09:00–11:00) ya existe en los datos de prueba para el conflicto de la escena 11

### Flujo de solicitudes
- [ ] La diferencia de menú contextual entre evento puntual ("Solicitar edición") y periódico ("Solicitar editar serie") se aprecia claramente en la escena 15 (paso 5)
- [ ] El aviso emergente "Solicitud enviada" es legible antes de desaparecer (~3 s) en la escena 15 — repetir la toma si no se ve
- [ ] El bloque "Resumen de la solicitud" del diálogo de reemplazo (escena 15, paso 8) es claramente legible
- [ ] Las cuatro solicitudes del profesor son visibles en el panel global de administrador al inicio de la escena 16
- [ ] El tick de aprobación directa (escena 16, paso 3) se distingue visualmente del icono de ojo (revisar)
- [ ] La ocurrencia cancelada (gris tachado) y la nueva confirmada se ven juntas en el calendario (escena 16, paso 5)

### Sincronización y técnico
- [ ] El indicador de Google Calendar ya está en verde (conectado) antes de grabar la escena 17
- [ ] Google Calendar muestra eventos reales en la escena 17 (no pantalla vacía)
- [ ] La barra de progreso de sincronización es visible antes de completarse
- [ ] El icono de papelera de eliminación de sincronización (escena 17) es visible pero NO se pulsa
- [ ] La vista **Día** se muestra en la escena 5 (paso 9) antes de volver a Semana laboral
- [ ] La vista **Agenda** se muestra en la escena 5 (paso 4) antes de volver a Semana laboral
- [ ] La navegación restringida al rango del semestre se muestra en la escena 5 (paso 12)
- [ ] Audio sin ruidos de fondo, narración a ~130 palabras/minuto
- [ ] Resolución mínima 1080p, sin pixelado
- [ ] Sin notificaciones del SO interrumpiendo ninguna escena
- [ ] Duración total entre 11 y 13 minutos
