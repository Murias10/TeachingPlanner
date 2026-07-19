# Guion del vídeo de demostración — TeachingPlanner

> **Duración objetivo:** 5-7 minutos
> **Formato:** Grabación de pantalla con narración en voz
> **URL de la app:** `planificador.ingenieriainformatica.uniovi.es`

---

## 0. Preparación previa (NO grabar esto)

### Datos que deben existir en la base de datos antes de empezar

- **Titulación:** `GIISOF01 — Grado en Ingeniería Informática del Software`
- **Curso:** `2025/2026` en estado *Activo*, **Semestre 1 sin calendario todavía** (para crear el calendario en la escena 3)
- Ficheros de importación en el escritorio: `asignaturas.txt`, `calendario.txt`, `horarios.txt`, `ubicaciones.txt`, `excepciones.txt`
- **Cuenta administrador:** `uo290009@uniovi.es` con contraseña conocida
- **Cuenta profesor ya activa:** `teacher@uniovi.es` con contraseña conocida (para la escena 5)
- **Cuenta nueva sin crear todavía:** `newTeacher@uniovi.es` — se crea en directo en la escena 2
- Después de crear el calendario en la escena 3, dejar preparado un **hueco libre** en algún grupo para la solicitud del profesor (escena 5) y otro hueco distinto para el evento que crea el administrador (escena 4)
- **Cuenta de Google** del administrador: dejarla **desvinculada** antes de grabar, para vincularla en directo en la escena 7
- Pestaña de **Google Calendar** abierta de antemano en otra ventana/pestaña del navegador, lista para alternar

### Ajustes del escritorio antes de grabar

1. Navegador en **pantalla completa** (F11), zoom al **110%** (Ctrl + `+`)
2. **Ocultar barra de favoritos** (Ctrl+Shift+B)
3. Activar **No Molestar** en Windows (esquina inferior derecha → icono de notificaciones)
4. Cerrar todas las pestañas salvo la app y Google Calendar
5. La app debe estar en la **pantalla de bienvenida** (cerrar sesión si hay alguna activa)
6. Tener a mano, fuera de pantalla: contraseña del admin, contraseña del profesor, y el enlace de activación de `newTeacher@uniovi.es` (se genera al crear la cuenta en la escena 2, cópialo del correo en el momento)

---

## Escena 1 — Login como administrador (0:00 – 0:25)

### Estado inicial
La app muestra `/` con la pantalla de bienvenida.

### Pasos

**Paso 1.** Deja la pantalla de bienvenida visible 1-2 segundos.

**Paso 2.** Haz clic en **Iniciar sesión**. Escribe `uo290009@uniovi.es` y la contraseña. Haz clic en **Iniciar sesión**.

**Paso 3.** Se carga `/home`. Deja el dashboard visible un momento, con el calendario cargado (puede estar vacío si el semestre aún no tiene eventos).

### Narración
> "Accedemos a TeachingPlanner e iniciamos sesión como administrador, el rol con acceso completo al sistema."

---

## Escena 2 — Crear usuario y activar cuenta (0:25 – 1:15)

### Estado inicial
Sesión de administrador en `/home`.

### Pasos

**Paso 1.** Haz clic en **Gestión de usuarios** en el menú lateral. Deja ver la tabla un momento.

**Paso 2.** Haz clic en **Crear usuario**. Rellena: nombre `Nuevo`, apellidos `Profesor`, correo `newTeacher@uniovi.es`, rol `Profesor`. Haz clic en **Guardar**.

**Paso 3.** La cuenta aparece en la tabla con estado **Pendiente de activación**. Comenta que el correo de activación se ha enviado automáticamente.

**Paso 4.** Abre el correo recibido (o simúlalo si se prepara offline), copia el enlace de activación, y ábrelo en una pestaña nueva.

**Paso 5.** Se carga la pantalla `/activate` con los campos de contraseña. Escribe una contraseña válida y confirma. Haz clic en **Activar cuenta**.

**Paso 6.** Redirige al login. Cierra esa pestaña y vuelve a la sesión de administrador.

### Narración
> "El administrador crea cuentas nuevas desde Gestión de usuarios. Cada cuenta recibe automáticamente un correo con un enlace de activación. El nuevo profesor establece su contraseña y ya puede iniciar sesión."

---

## Escena 3 — Crear calendario importando los ficheros del sistema legado (1:15 – 2:35)

### Estado inicial
Sesión de administrador en `/home`.

### Pasos

**Paso 1.** Haz clic en **Titulaciones** en el menú lateral. Haz clic en `GIISOF01`. Se carga la tabla de cursos.

**Paso 2.** Localiza `2025/2026`, Semestre 1, sin calendario todavía. Haz clic en el icono **+** (Crear calendario).

**Paso 3.** Haz clic en la pestaña **Importar**. Muestra los cinco campos de fichero: `asignaturas.txt`, `calendario.txt`, `horarios.txt`, `ubicaciones.txt` (obligatorios) y `excepciones.txt` (opcional). Menciona brevemente qué contiene cada uno.

**Paso 4.** Selecciona los cinco ficheros del escritorio, uno por uno. Haz clic en **Crear calendario**.

**Paso 5.** El sistema procesa la importación y muestra el informe de resultado (asignaturas, grupos, aulas y eventos importados). El icono de calendario de esa fila pasa a estar activo.

**Paso 6.** Haz clic en el icono de **asignaturas** de esa fila. Deja ver la tabla con las asignaturas ya creadas por la importación, 2-3 segundos.

**Paso 7.** Vuelve atrás y haz clic en el icono de **grupos**. Deja ver la tabla de grupos ya creados, 2-3 segundos.

**Paso 8.** Vuelve atrás y haz clic en el icono de calendario para entrar. Se carga `.../calendar` con todos los eventos ya generados a partir de los ficheros.

### Narración
> "Para no partir de cero, el calendario puede crearse importando directamente los cinco ficheros de texto del sistema anterior. El sistema reconstruye asignaturas, grupos, aulas y todos los eventos automáticamente."

---

## Escena 4 — Vistas, filtros, conflictos y creación de un evento (2:35 – 3:50)

### Estado inicial
Calendario del Semestre 1 cargado, vista Semana laboral.

### Pasos

**Paso 1.** Antes de nada, haz clic en **Aulas** en el menú lateral. Deja ver la tabla de aulas disponibles, 2-3 segundos. Vuelve al calendario.

**Paso 2.** Cambia rápidamente entre las vistas del calendario: **Mes**, luego **Día**, y vuelve a **Semana laboral**. Deja cada una visible 1-2 segundos.

**Paso 3.** Abre el panel de **Filtros**. Marca una asignatura o un tipo de grupo concreto. El calendario filtra en tiempo real. Quita el filtro para volver a ver todos los eventos.

**Paso 4.** Haz clic en un evento ya existente del calendario. Se abre el **panel de detalles** con asignatura, grupo, aula y horario. Ciérralo.

**Paso 5.** Haz clic en **Crear evento**. Rellena los datos usando **el mismo grupo y la misma franja horaria** que un evento ya existente, para forzar el conflicto. Haz clic en **Guardar**. El sistema muestra el **aviso de conflicto** y no guarda. Señálalo 1-2 segundos.

**Paso 6.** Corrige los datos: localiza un hueco libre real. Rellena asignatura, tipo de evento `Clase`, grupo, aula. Haz clic en **Guardar**. El nuevo evento aparece en el calendario.

### Narración
> "El calendario ofrece varias vistas, semana, día o mes, y un panel de filtros por asignatura, grupo, aula o idioma. Al crear un evento, el sistema detecta automáticamente si choca con otro ya existente en el mismo grupo o aula, y bloquea el guardado hasta que se corrige."

---

## Escena 5 — El profesor crea una solicitud (3:50 – 4:35)

### Estado inicial
Cierra sesión de administrador. Inicia sesión con `teacher@uniovi.es`.

### Pasos

**Paso 1.** Se carga `/home` con la sesión del profesor. Señala brevemente que el menú lateral es más reducido que el del administrador — sin Usuarios, sin Sincronización.

**Paso 2.** Navega hasta el calendario del semestre. Localiza un hueco libre distinto al usado en la escena 4.

**Paso 3.** Haz **clic y arrastra** sobre ese hueco. Se abre el diálogo **Solicitar evento**.

**Paso 4.** Rellena los datos del evento propuesto y un comentario breve explicando el motivo. Haz clic en **Solicitar**.

**Paso 5.** Aparece la confirmación de envío. El evento aparece en el calendario con aspecto atenuado (pendiente de aprobación).

### Narración
> "Cambiamos a la cuenta de un profesor. En vez de escribir un correo, el profesor solicita el evento directamente desde el calendario, con toda la información estructurada. La solicitud queda pendiente de revisión."

---

## Escena 6 — El administrador aprueba la solicitud y exporta (4:35 – 5:20)

### Estado inicial
Cierra sesión del profesor. Inicia sesión de nuevo como `uo290009@uniovi.es`.

### Pasos

**Paso 1.** Haz clic en **Solicitudes** en el menú lateral. Se muestra la tabla con la solicitud del profesor en estado Pendiente.

**Paso 2.** Haz clic en el icono de revisar (ojo) para ver el detalle, o directamente en el tick para aprobar. Aprueba la solicitud.

**Paso 3.** Pasa a estado Aprobada. Navega al calendario y señala el evento ya confirmado (color sólido, ya no atenuado).

**Paso 4.** Haz clic en **Exportar .csv**. El navegador descarga el fichero. Haz clic en **Exportar .txt**. Se descarga el fichero en formato nativo.

### Narración
> "El administrador revisa la solicitud y la aprueba. El evento pasa automáticamente de pendiente a confirmado en el calendario, sin que nadie tenga que copiarlo a mano. El calendario también puede exportarse en CSV, compatible con Google Calendar, o en el formato de texto del sistema heredado, para las herramientas que aún lo necesiten."

---

## Escena 7 — Vincular la cuenta de Google (5:20 – 5:50)

### Estado inicial
Sesión de administrador activa.

### Pasos

**Paso 1.** Haz clic en el avatar → **Configuración**.

**Paso 2.** Desplázate hasta la sección **Sincronización con Google Calendar**. El indicador está en gris, "No conectado".

**Paso 3.** Haz clic en **Conectar**. Se abre el flujo OAuth de Google en una ventana nueva: selecciona la cuenta, concede los permisos.

**Paso 4.** Vuelve a la app. El indicador pasa a verde, mostrando el correo de la cuenta vinculada.

### Narración
> "Antes de sincronizar, el administrador vincula su cuenta de Google mediante el flujo estándar de autorización de Google."

---

## Escena 8 — Estado de Google Calendar antes de sincronizar (5:50 – 6:05)

### Estado inicial
Cuenta de Google ya vinculada.

### Pasos

**Paso 1.** Cambia a la pestaña de **Google Calendar**, ya abierta de antemano. Muestra que está vacío o sin los eventos de este calendario académico.

### Narración
> "Así está Google Calendar antes de sincronizar: no tiene ninguno de estos eventos todavía."

---

## Escena 9 — Sincronizar el calendario (6:05 – 6:30, incluye corte)

### Estado inicial
Vuelve a la pestaña de TeachingPlanner, sesión de administrador.

### Pasos

**Paso 1.** Haz clic en **Gestionar sincronizaciones** en el menú lateral.

**Paso 2.** Localiza el calendario del Semestre 1. Haz clic en el icono de sincronizar.

**Paso 3.** Aparece la barra de progreso. **Corte de edición aquí** — no hace falta grabar el proceso completo, se puede acelerar o cortar directamente al resultado.

**Paso 4.** El estado cambia a **Completado** (verde).

### Narración
> "Lanzamos la sincronización. El sistema crea un calendario de Google por cada aula y publica ahí los eventos correspondientes."

---

## Escena 10 — Resultado en Google Calendar (6:30 – 6:55)

### Estado inicial
Sincronización completada.

### Pasos

**Paso 1.** Cambia a la pestaña de Google Calendar. Refresca si hace falta.

**Paso 2.** Muestra los eventos ya visibles, distribuidos en los distintos calendarios por aula. Desplázate un poco para que se vean varios.

### Narración
> "Y así queda Google Calendar después de sincronizar: los eventos ya están ahí, organizados por aula."

---

## Escena 11 — Cierre (6:55 – 7:15)

### Estado inicial
Puedes volver a TeachingPlanner, sesión de invitado (cierra sesión de administrador y entra como invitado, o usa "Continuar como invitado" desde la bienvenida).

### Pasos

**Paso 1.** Muestra brevemente la vista de invitado: calendario visible, sin ningún botón de crear o solicitar.

**Paso 2.** Deja la pantalla visible unos segundos antes de cerrar.

### Narración
> "Y así lo ve cualquiera sin necesidad de cuenta: consulta libre, sin permisos de edición. Esto es TeachingPlanner: gestión de horarios en un único sistema web, con roles diferenciados, importación del formato heredado, solicitudes estructuradas y sincronización automática con Google Calendar."

---

## Checklist final antes de grabar

- [ ] `uo290009@uniovi.es` activa, contraseña a mano
- [ ] `teacher@uniovi.es` activa, contraseña a mano
- [ ] `newTeacher@uniovi.es` **todavía no creada** — se crea en directo en la escena 2
- [ ] Semestre 1 de `2025/2026` **sin calendario** antes de grabar — se crea en directo en la escena 3
- [ ] Los 5 ficheros TXT de importación están en el escritorio, accesibles
- [ ] Cuenta de Google del administrador **desvinculada** antes de grabar — se vincula en directo en la escena 7
- [ ] Pestaña de Google Calendar abierta de antemano, lista para alternar
- [ ] Tras crear el calendario (escena 3), identificar un hueco libre para el evento válido del admin (escena 4, paso 6) y otro distinto para la solicitud del profesor (escena 5)
- [ ] Identificar de antemano un evento ya existente cuyo grupo y horario se puedan reutilizar para forzar el conflicto en la escena 4 (paso 5)
- [ ] Practicar los cambios de sesión (admin → profesor → admin → invitado) para que sean rápidos y no rompan el ritmo
- [ ] Audio sin ruidos de fondo, narración pausada pero fluida
- [ ] Resolución mínima 1080p
- [ ] Sin notificaciones del SO interrumpiendo ninguna escena
- [ ] Duración total entre 5 y 7 minutos
