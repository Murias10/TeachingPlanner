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

UR1.1. El sistema permitirá a los usuarios registrados iniciar sesión en la aplicación.

&nbsp;&nbsp;&nbsp;&nbsp;UR1.1.1. El sistema solicitará los siguientes datos al usuario:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.1.1.1. Correo electrónico.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.1.1.1.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.1.1.2. Contraseña.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.1.1.2.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;UR1.1.2. Si las credenciales son correctas, el sistema redirigirá al usuario a la pantalla principal según su rol.

&nbsp;&nbsp;&nbsp;&nbsp;UR1.1.3. Si el correo electrónico no existe en el sistema o la contraseña es incorrecta, el sistema mostrará un mensaje de error genérico y el usuario no quedará autenticado.

&nbsp;&nbsp;&nbsp;&nbsp;UR1.1.4. Si la cuenta existe pero no ha sido activada, el sistema mostrará un mensaje indicando al usuario que debe activar su cuenta antes de poder acceder.

UR1.2. El sistema permitirá a los usuarios recuperar el acceso a su cuenta si han olvidado su contraseña. El proceso se realizará en tres pasos:

&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.1. Primer paso — solicitud de código de verificación:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.1.1. El sistema solicitará al usuario su correo electrónico.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.1.1.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.1.2. El sistema enviará un código de verificación de seis dígitos al correo indicado, con una validez de 15 minutos.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.1.3. El sistema no revelará si el correo electrónico está registrado o no, mostrando siempre el mismo mensaje de confirmación.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.1.4. El sistema no permitirá solicitar un nuevo código hasta que hayan transcurrido 60 segundos desde la solicitud anterior.

&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.2. Segundo paso — verificación del código:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.2.1. El sistema solicitará al usuario el código de seis dígitos recibido por correo.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.2.1.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.2.2. Si el código es correcto y no ha expirado, el sistema pasará al tercer paso.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.2.3. Si el código ha expirado, el sistema mostrará un mensaje de error e invitará al usuario a solicitar un nuevo código.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.2.4. Si el código es incorrecto, el sistema mostrará un mensaje de error.

&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.3. Tercer paso — establecer nueva contraseña:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.3.1. El sistema solicitará al usuario los siguientes datos:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.3.1.1. Nueva contraseña.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.3.1.1.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.3.1.1.2. Debe tener al menos 8 caracteres.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.3.1.1.3. Debe contener al menos una letra mayúscula.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.3.1.1.4. Debe contener al menos una letra minúscula.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.3.1.1.5. Debe contener al menos un número.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.3.1.1.6. Debe contener al menos un carácter especial.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.3.1.2. Confirmación de la nueva contraseña.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.3.1.2.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.3.1.2.2. Debe coincidir con la nueva contraseña introducida.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.3.2. Si la contraseña no cumple los requisitos de complejidad, el sistema mostrará un mensaje de error indicando qué condición no se ha satisfecho y no actualizará la contraseña.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.3.3. Si las contraseñas no coinciden, el sistema mostrará un mensaje de error y no actualizará la contraseña.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.2.3.4. Si los datos son válidos, el sistema actualizará la contraseña y redirigirá al usuario al formulario de inicio de sesión.

UR1.3. El sistema permitirá a los usuarios autenticados cerrar su sesión activa.

&nbsp;&nbsp;&nbsp;&nbsp;UR1.3.1. El sistema cerrará la sesión del usuario y lo redirigirá a la pantalla de inicio.

UR1.4. El sistema permitirá a los usuarios autenticados consultar y modificar los datos de su propio perfil.

&nbsp;&nbsp;&nbsp;&nbsp;UR1.4.1. El usuario podrá modificar su nombre, apellidos, correo electrónico y usuario UniOvi.

&nbsp;&nbsp;&nbsp;&nbsp;UR1.4.2. El usuario podrá cambiar su contraseña introduciendo la contraseña actual y una nueva contraseña que cumpla los mismos requisitos de complejidad establecidos en UR1.2.3.1.1.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR1.4.2.1. Si la contraseña actual introducida no es correcta, el sistema mostrará un mensaje de error y no realizará el cambio.

UR1.5. El sistema permitirá a los usuarios autenticados vincular su cuenta con una cuenta de Google para habilitar la sincronización de calendarios académicos con Google Calendar.

&nbsp;&nbsp;&nbsp;&nbsp;UR1.5.1. El usuario será redirigido a la pantalla de consentimiento de Google, donde autorizará el acceso al sistema.

&nbsp;&nbsp;&nbsp;&nbsp;UR1.5.2. Si el usuario autoriza el acceso, el sistema vinculará la cuenta de Google y mostrará el correo electrónico de la cuenta Google vinculada como confirmación.

&nbsp;&nbsp;&nbsp;&nbsp;UR1.5.3. Si el usuario deniega el acceso, el sistema mostrará un mensaje informativo y no vinculará ninguna cuenta.

&nbsp;&nbsp;&nbsp;&nbsp;UR1.5.4. El sistema permitirá al usuario desconectar su cuenta de Google. Al desconectarse, el sistema eliminará los calendarios de Google creados por ese usuario y eliminará la vinculación almacenada.

---

**UR2 — Gestión de usuarios** *(solo administrador)*

UR2.1. El sistema permitirá al administrador registrar nuevos usuarios en el sistema.

&nbsp;&nbsp;&nbsp;&nbsp;UR2.1.1. El sistema solicitará los siguientes datos al administrador:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR2.1.1.1. Nombre.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR2.1.1.1.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR2.1.1.2. Primer apellido.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR2.1.1.2.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR2.1.1.3. Segundo apellido.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR2.1.1.3.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR2.1.1.4. Correo electrónico.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR2.1.1.4.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR2.1.1.4.2. El sistema comprobará que el formato del correo es válido.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR2.1.1.4.3. El sistema comprobará que el correo no está ya registrado en el sistema.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR2.1.1.5. Rol.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR2.1.1.5.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR2.1.1.5.2. El sistema permitirá elegir entre los siguientes roles: Administrador o Docente.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR2.1.1.6. Usuario UniOvi.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR2.1.1.6.1. Es un dato opcional.

&nbsp;&nbsp;&nbsp;&nbsp;UR2.1.2. Si el correo electrónico ya está registrado en el sistema, el sistema mostrará un mensaje de error y no completará el registro.

&nbsp;&nbsp;&nbsp;&nbsp;UR2.1.3. Si el formato del correo electrónico no es válido, el sistema mostrará un mensaje de error y no completará el registro.

&nbsp;&nbsp;&nbsp;&nbsp;UR2.1.4. Si el registro es correcto, el sistema creará la cuenta con estado inactivo y enviará al nuevo usuario un correo electrónico con un enlace para activar su cuenta y establecer su contraseña.

UR2.2. El sistema permitirá al administrador activar cuentas de nuevos usuarios mediante un enlace enviado por correo electrónico.

&nbsp;&nbsp;&nbsp;&nbsp;UR2.2.1. Al acceder al enlace de activación, el sistema solicitará al usuario que establezca su contraseña personal, cumpliendo los requisitos definidos en UR1.2.3.1.1.

&nbsp;&nbsp;&nbsp;&nbsp;UR2.2.2. Si el enlace de activación ha caducado, el sistema mostrará un mensaje de error indicando al usuario que contacte con su administrador.

&nbsp;&nbsp;&nbsp;&nbsp;UR2.2.3. Si la contraseña es válida, el sistema activará la cuenta y redirigirá al usuario al formulario de inicio de sesión.

UR2.3. El sistema permitirá al administrador importar usuarios de forma masiva desde un fichero Excel.

&nbsp;&nbsp;&nbsp;&nbsp;UR2.3.1. El sistema solicitará al administrador que cargue un fichero en formato `.xlsx`.

&nbsp;&nbsp;&nbsp;&nbsp;UR2.3.2. El fichero deberá contener las siguientes columnas:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR2.3.2.1. Usuario UniOvi. Es un dato obligatorio por fila.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR2.3.2.2. Nombre. Es un dato obligatorio por fila.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR2.3.2.3. Apellidos. Es un dato obligatorio por fila. El sistema dividirá internamente este campo en primer apellido y segundo apellido.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR2.3.2.4. Correo electrónico. Es un dato obligatorio por fila. Debe ser único en el sistema.

&nbsp;&nbsp;&nbsp;&nbsp;UR2.3.3. El sistema validará cada fila del fichero de forma independiente.

&nbsp;&nbsp;&nbsp;&nbsp;UR2.3.4. El sistema creará los usuarios de las filas válidas con estado inactivo y enviará a cada uno un correo de activación.

&nbsp;&nbsp;&nbsp;&nbsp;UR2.3.5. El sistema mostrará un informe indicando cuántos usuarios se crearon correctamente y qué filas contuvieron errores y por qué motivo.

UR2.4. El sistema permitirá al administrador consultar el listado de usuarios registrados en el sistema.

&nbsp;&nbsp;&nbsp;&nbsp;UR2.4.1. El sistema mostrará para cada usuario: nombre completo, correo electrónico, rol, estado (activo o inactivo) y fecha de registro.

&nbsp;&nbsp;&nbsp;&nbsp;UR2.4.2. El sistema permitirá filtrar el listado por rol y por estado.

&nbsp;&nbsp;&nbsp;&nbsp;UR2.4.3. El sistema permitirá buscar usuarios por nombre o correo electrónico.

UR2.5. El sistema permitirá al administrador modificar los datos de un usuario existente.

&nbsp;&nbsp;&nbsp;&nbsp;UR2.5.1. El administrador podrá modificar el nombre, los apellidos, el rol y el estado (activo o inactivo) del usuario.

&nbsp;&nbsp;&nbsp;&nbsp;UR2.5.2. El sistema impedirá que el administrador cambie el rol o desactive al último administrador activo del sistema.

&nbsp;&nbsp;&nbsp;&nbsp;UR2.5.3. El sistema impedirá que el administrador desactive su propia cuenta.

UR2.6. El sistema permitirá al administrador eliminar un usuario del sistema.

&nbsp;&nbsp;&nbsp;&nbsp;UR2.6.1. El sistema solicitará confirmación explícita antes de proceder con la eliminación.

&nbsp;&nbsp;&nbsp;&nbsp;UR2.6.2. El sistema impedirá eliminar al último administrador activo del sistema.

&nbsp;&nbsp;&nbsp;&nbsp;UR2.6.3. El sistema impedirá que el administrador elimine su propia cuenta.

UR2.7. El sistema permitirá al administrador reenviar el correo electrónico de activación a usuarios que hayan sido registrados pero aún no hayan activado su cuenta.

UR2.8. El sistema gestionará dos roles de usuario con niveles de acceso diferenciados:

&nbsp;&nbsp;&nbsp;&nbsp;UR2.8.1. Administrador: acceso completo a todas las funciones de gestión del sistema.

&nbsp;&nbsp;&nbsp;&nbsp;UR2.8.2. Docente: acceso a la consulta de horarios y a la creación y gestión de sus propias solicitudes de cambio.

---

**UR3 — Gestión de la estructura académica** *(solo administrador)*

UR3.1. El sistema permitirá al administrador gestionar titulaciones.

&nbsp;&nbsp;&nbsp;&nbsp;UR3.1.1. El sistema permitirá crear una nueva titulación. El sistema solicitará los siguientes datos:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.1.1.1. Nombre.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.1.1.1.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.1.1.1.2. El sistema comprobará que el nombre no está ya registrado en el sistema.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.1.1.2. Acrónimo.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.1.1.2.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.1.1.2.2. El sistema comprobará que el acrónimo no está ya registrado en el sistema.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.1.1.3. Si el nombre o el acrónimo ya existen, el sistema mostrará un mensaje de error específico y no completará la creación.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.1.1.4. Si los datos son válidos, el sistema creará la titulación y mostrará una confirmación.

&nbsp;&nbsp;&nbsp;&nbsp;UR3.1.2. El sistema permitirá consultar el listado de titulaciones existentes.

&nbsp;&nbsp;&nbsp;&nbsp;UR3.1.3. El sistema permitirá modificar el nombre y el acrónimo de una titulación existente, con las mismas validaciones de unicidad que en la creación.

&nbsp;&nbsp;&nbsp;&nbsp;UR3.1.4. El sistema permitirá eliminar una titulación.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.1.4.1. Si la titulación tiene cursos académicos asociados, el sistema mostrará un mensaje de error y no completará la eliminación.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.1.4.2. Si la titulación no tiene cursos asociados, el sistema solicitará confirmación y eliminará la titulación.

UR3.2. El sistema permitirá al administrador gestionar cursos académicos asociados a una titulación.

&nbsp;&nbsp;&nbsp;&nbsp;UR3.2.1. El sistema permitirá crear un nuevo curso académico. El sistema solicitará los siguientes datos:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.2.1.1. Titulación a la que pertenece el curso.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.2.1.1.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.2.1.2. Año de inicio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.2.1.2.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.2.1.3. Año de fin.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.2.1.3.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.2.1.3.2. Debe ser posterior al año de inicio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.2.1.4. Si ya existe un curso con los mismos años en esa titulación, el sistema mostrará un mensaje de error y no completará la creación.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.2.1.5. Si los datos son válidos, el sistema creará el curso con estado inicial «En planificación».

&nbsp;&nbsp;&nbsp;&nbsp;UR3.2.2. Cada curso académico tendrá un estado que el administrador podrá modificar:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.2.2.1. En planificación.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.2.2.2. Activo.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.2.2.3. Finalizado.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.2.2.4. Las transiciones de estado son unidireccionales: En planificación → Activo → Finalizado. No es posible revertir un curso a un estado anterior.

&nbsp;&nbsp;&nbsp;&nbsp;UR3.2.3. El sistema permitirá eliminar un curso académico.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.2.3.1. Si el curso tiene calendarios con eventos asociados, el sistema mostrará un mensaje de error y no completará la eliminación.

UR3.3. El sistema permitirá al administrador gestionar asignaturas asociadas a una titulación.

&nbsp;&nbsp;&nbsp;&nbsp;UR3.3.1. El sistema permitirá crear una nueva asignatura. El sistema solicitará los siguientes datos:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.3.1.1. Nombre.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.3.1.1.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.3.1.1.2. Debe ser único dentro de la misma titulación.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.3.1.2. Acrónimo.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.3.1.2.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.3.1.2.2. Debe ser único dentro de la misma titulación.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.3.1.3. Código SIES.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.3.1.3.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.3.1.3.2. No será modificable una vez creada la asignatura.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.3.1.4. Titulación a la que pertenece.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.3.1.4.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.3.1.5. Semestre en el que se imparte.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.3.1.5.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.3.1.5.2. El sistema permitirá elegir entre el primer semestre y el segundo semestre.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.3.1.6. Curso en el que se imparte.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.3.1.6.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.3.1.6.2. El sistema permitirá elegir entre: primero, segundo, tercero, cuarto, o sin curso específico (para asignaturas optativas o de libre elección).

&nbsp;&nbsp;&nbsp;&nbsp;UR3.3.2. El sistema permitirá consultar y filtrar el listado de asignaturas por titulación, semestre y curso.

&nbsp;&nbsp;&nbsp;&nbsp;UR3.3.3. El sistema permitirá modificar todos los campos de una asignatura excepto el código SIES.

&nbsp;&nbsp;&nbsp;&nbsp;UR3.3.4. El sistema permitirá eliminar una asignatura.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.3.4.1. El sistema mostrará un aviso indicando que la eliminación también eliminará todos los grupos asociados y los eventos de esos grupos.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.3.4.2. Tras la confirmación del administrador, el sistema eliminará la asignatura junto con sus grupos y eventos asociados.

UR3.4. El sistema permitirá al administrador gestionar grupos dentro de una asignatura.

&nbsp;&nbsp;&nbsp;&nbsp;UR3.4.1. El sistema permitirá crear un nuevo grupo. El sistema solicitará los siguientes datos:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.4.1.1. Asignatura a la que pertenece.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.4.1.1.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.4.1.2. Tipo de grupo.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.4.1.2.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.4.1.2.2. El sistema permitirá elegir entre: Teoría (T), Seminario (S), Prácticas de Laboratorio (L), Tutoría Grupal (TG).

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.4.1.3. Idioma.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.4.1.3.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.4.1.3.2. El sistema permitirá elegir entre: Español e Inglés.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.4.1.4. Horas planificadas.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.4.1.4.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.4.1.4.2. Debe ser un número positivo múltiplo de 0,5 (por ejemplo: 0, 0.5, 1, 1.5, 6). No se aceptan valores negativos ni decimales que no sean múltiplos de 0,5.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.4.1.5. El número de grupo es asignado automáticamente por el sistema. El sistema asignará el siguiente número disponible para la combinación de asignatura, tipo e idioma seleccionados.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.4.1.6. Si ya existe un grupo con el mismo tipo e idioma en la misma asignatura y el número asignado automáticamente genera un duplicado, el sistema mostrará un mensaje de error y no completará la creación.

&nbsp;&nbsp;&nbsp;&nbsp;UR3.4.2. El sistema permitirá consultar el listado de grupos de una asignatura.

&nbsp;&nbsp;&nbsp;&nbsp;UR3.4.3. El sistema permitirá modificar los datos de un grupo existente, con las mismas validaciones de unicidad que en la creación.

&nbsp;&nbsp;&nbsp;&nbsp;UR3.4.4. El sistema permitirá eliminar un grupo. El sistema solicitará confirmación antes de proceder.

UR3.5. El sistema permitirá al administrador gestionar aulas.

&nbsp;&nbsp;&nbsp;&nbsp;UR3.5.1. El sistema permitirá crear una nueva aula. El sistema solicitará los siguientes datos:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.5.1.1. Código del aula.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.5.1.1.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.5.1.1.2. El sistema comprobará que el código no está ya registrado en el sistema.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.5.1.2. Enlace de ubicación geográfica (URL GIS).

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.5.1.2.1. Es un dato opcional.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.5.1.2.2. Si se proporciona, el sistema comprobará que el valor tiene formato de URL válido.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.5.1.3. Si el código ya existe, el sistema mostrará un mensaje de error y no completará la creación.

&nbsp;&nbsp;&nbsp;&nbsp;UR3.5.2. El sistema permitirá consultar el listado de aulas registradas.

&nbsp;&nbsp;&nbsp;&nbsp;UR3.5.3. El sistema permitirá modificar el código y el enlace GIS de un aula existente.

&nbsp;&nbsp;&nbsp;&nbsp;UR3.5.4. El sistema permitirá eliminar un aula.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR3.5.4.1. Si el aula tiene eventos asociados, el sistema solicitará confirmación adicional advirtiendo de que la eliminación afectará a los eventos y solicitará al administrador confirmar explícitamente.

---

**UR4 — Gestión de calendarios académicos** *(solo administrador)*

UR4.1. El sistema permitirá al administrador crear un calendario académico. El sistema solicitará los siguientes datos:

&nbsp;&nbsp;&nbsp;&nbsp;UR4.1.1. Curso académico al que pertenece el calendario.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR4.1.1.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;UR4.1.2. Semestre.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR4.1.2.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR4.1.2.2. El sistema permitirá elegir entre el primer semestre y el segundo semestre.

&nbsp;&nbsp;&nbsp;&nbsp;UR4.1.3. Fecha de inicio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR4.1.3.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;UR4.1.4. Fecha de fin.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR4.1.4.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR4.1.4.2. Debe ser posterior a la fecha de inicio.

&nbsp;&nbsp;&nbsp;&nbsp;UR4.1.5. Si ya existe un calendario para el mismo curso académico y semestre, el sistema mostrará un mensaje de error y no completará la creación.

&nbsp;&nbsp;&nbsp;&nbsp;UR4.1.6. Si la fecha de fin no es posterior a la fecha de inicio, el sistema mostrará un mensaje de error y no completará la creación.

&nbsp;&nbsp;&nbsp;&nbsp;UR4.1.7. Si los datos son válidos, el sistema creará el calendario y generará automáticamente un día lectivo por cada día laborable (de lunes a viernes) comprendido entre las fechas de inicio y fin.

UR4.2. El sistema permitirá al administrador marcar días individuales del calendario como festivos o no lectivos, y desmarcarlos para recuperar su estado lectivo.

UR4.3. El sistema permitirá al administrador consultar el listado de calendarios académicos existentes, con la posibilidad de filtrar por curso y semestre.

UR4.4. El sistema permitirá al administrador duplicar un calendario existente para crear uno nuevo en otro curso o semestre.

&nbsp;&nbsp;&nbsp;&nbsp;UR4.4.1. El sistema solicitará el curso académico destino y el semestre destino.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR4.4.1.1. Son datos obligatorios.

&nbsp;&nbsp;&nbsp;&nbsp;UR4.4.2. El sistema solicitará las nuevas fechas de inicio y fin.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR4.4.2.1. Son datos obligatorios.

&nbsp;&nbsp;&nbsp;&nbsp;UR4.4.3. Si ya existe un calendario para el curso y semestre destino, el sistema mostrará un mensaje de error y no completará la duplicación.

&nbsp;&nbsp;&nbsp;&nbsp;UR4.4.4. Si los datos son válidos, el sistema creará el nuevo calendario copiando la estructura de días y los eventos periódicos del calendario origen, ajustados a las nuevas fechas.

UR4.5. El sistema permitirá al administrador eliminar un calendario y todos sus datos asociados.

&nbsp;&nbsp;&nbsp;&nbsp;UR4.5.1. El sistema informará al administrador del número de días y eventos que se eliminarán y solicitará confirmación explícita antes de proceder.

---

**UR5 — Gestión de eventos** *(solo administrador)*

UR5.1. El sistema permitirá al administrador crear eventos periódicos (clases que se repiten con un patrón regular en el calendario). El sistema solicitará los siguientes datos:

&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.1. Grupo o grupos a los que afecta el evento.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.1.1. Es un dato obligatorio. El administrador podrá seleccionar uno o varios grupos.

&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.2. Aula o aulas asignadas al evento.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.2.1. Es un dato opcional. El administrador podrá seleccionar una o varias aulas, o ninguna.

&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.3. Hora de inicio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.3.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.4. Hora de fin.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.4.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.4.2. Debe ser posterior a la hora de inicio.

&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.5. Día de la semana en el que se repite el evento.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.5.1. Es un dato obligatorio. El administrador seleccionará uno de los días: lunes, martes, miércoles, jueves o viernes.

&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.6. Frecuencia de repetición.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.6.1. Es un dato obligatorio. El sistema permitirá elegir entre los siguientes patrones:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.6.1.1. Semanal: el evento se repite todas las semanas en el día seleccionado.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.6.1.2. Quincenal — semanas pares: el evento se repite cada dos semanas, en las semanas pares del calendario.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.6.1.3. Quincenal — semanas impares: el evento se repite cada dos semanas, en las semanas impares del calendario.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.6.1.4. Personalizado: el administrador define un patrón de repetición propio mediante caracteres de día del calendario.

&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.7. Tipo de evento.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.7.1. Es un dato obligatorio. El sistema permitirá elegir entre los siguientes tipos:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.7.1.1. Clase: sesión docente ordinaria. Consume las horas planificadas del grupo y se incluye en las exportaciones del calendario.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.7.1.2. Evaluación: examen o actividad de evaluación formal. No consume horas planificadas.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.7.1.3. Revisión: sesión de revisión de examen. No consume horas planificadas.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.7.1.4. Otros: cualquier actividad que requiera reserva de aula sin consumir horas planificadas (charlas, talleres, jornadas de puertas abiertas, etc.).

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.7.1.5. Independiente: reserva de aula sin asignatura ni grupo asociado (para usos no académicos como mantenimiento o reservas externas).

&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.8. Si la hora de fin no es posterior a la hora de inicio, el sistema mostrará un mensaje de error y no completará la creación.

&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.9. Antes de guardar el evento, el sistema comprobará si existe un conflicto de horario con otros eventos ya registrados:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.9.1. Se considerará conflicto que un grupo seleccionado tenga otro evento en el mismo día de la semana y en una franja horaria que se solape con la del nuevo evento.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.9.2. Se considerará conflicto que un aula seleccionada esté asignada a otro evento en el mismo día de la semana y en una franja horaria que se solape.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.9.3. Si se detecta un conflicto, el sistema mostrará un mensaje de error indicando qué evento y qué recurso (grupo o aula) genera el conflicto, e impedirá guardar el evento hasta que sea resuelto.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.1.9.4. Si no se detecta ningún conflicto, el sistema guardará el evento.

UR5.2. El sistema permitirá al administrador crear eventos puntuales (sesiones únicas en una fecha específica). El sistema solicitará los siguientes datos:

&nbsp;&nbsp;&nbsp;&nbsp;UR5.2.1. Fecha específica dentro del calendario.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.2.1.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.2.1.2. La fecha debe pertenecer al calendario seleccionado.

&nbsp;&nbsp;&nbsp;&nbsp;UR5.2.2. Grupo o grupos a los que afecta el evento.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.2.2.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;UR5.2.3. Aula o aulas asignadas.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.2.3.1. Es un dato opcional.

&nbsp;&nbsp;&nbsp;&nbsp;UR5.2.4. Hora de inicio.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.2.4.1. Es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;UR5.2.5. Hora de fin.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.2.5.1. Es un dato obligatorio. Debe ser posterior a la hora de inicio.

&nbsp;&nbsp;&nbsp;&nbsp;UR5.2.6. Tipo de evento.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR5.2.6.1. Es un dato obligatorio, con las mismas opciones que en UR5.1.7.1.

&nbsp;&nbsp;&nbsp;&nbsp;UR5.2.7. Si el día seleccionado está marcado como festivo, el sistema mostrará una advertencia al administrador; la creación podrá continuar si el administrador confirma.

&nbsp;&nbsp;&nbsp;&nbsp;UR5.2.8. El sistema aplicará la misma detección de conflictos que en UR5.1.9, pero para la fecha y franja horaria específicas del evento puntual.

UR5.3. El sistema permitirá al administrador modificar un evento existente, con las mismas validaciones de conflicto aplicadas a los nuevos datos.

UR5.4. El sistema permitirá al administrador cancelar un evento puntual.

&nbsp;&nbsp;&nbsp;&nbsp;UR5.4.1. El sistema marcará el evento como cancelado, sin eliminarlo del sistema.

&nbsp;&nbsp;&nbsp;&nbsp;UR5.4.2. Los eventos cancelados permanecerán visibles en el calendario con una indicación visual diferenciada.

UR5.5. El sistema permitirá al administrador eliminar eventos.

&nbsp;&nbsp;&nbsp;&nbsp;UR5.5.1. Para eventos periódicos, el administrador podrá eliminar una ocurrencia concreta o toda la serie. El sistema solicitará confirmación antes de proceder en ambos casos.

&nbsp;&nbsp;&nbsp;&nbsp;UR5.5.2. Para eventos puntuales no cancelados, el administrador podrá eliminarlos permanentemente.

UR5.6. El sistema permitirá al administrador revertir la cancelación de un evento puntual que haya sido previamente cancelado, restaurándolo a su estado activo original.

---

**UR6 — Consulta de horarios** *(todos los usuarios, incluido público sin autenticación)*

UR6.1. El sistema permitirá a cualquier persona consultar los horarios académicos publicados sin necesidad de autenticarse.

&nbsp;&nbsp;&nbsp;&nbsp;UR6.1.1. Los usuarios no autenticados solo podrán acceder a los calendarios de cursos académicos en estado Activo.

&nbsp;&nbsp;&nbsp;&nbsp;UR6.1.2. Los usuarios autenticados podrán acceder a los calendarios de cursos en cualquier estado.

UR6.2. El sistema permitirá seleccionar el calendario a consultar a partir de la titulación, el curso académico y el semestre.

UR6.3. El sistema mostrará los eventos del calendario seleccionado en una vista de tipo calendario. El sistema ofrecerá las siguientes vistas:

&nbsp;&nbsp;&nbsp;&nbsp;UR6.3.1. Vista de semana completa.

&nbsp;&nbsp;&nbsp;&nbsp;UR6.3.2. Vista de semana laboral (lunes a viernes).

&nbsp;&nbsp;&nbsp;&nbsp;UR6.3.3. Vista de día.

&nbsp;&nbsp;&nbsp;&nbsp;UR6.3.4. Vista de mes.

&nbsp;&nbsp;&nbsp;&nbsp;UR6.3.5. Vista de agenda.

UR6.4. El sistema permitirá filtrar los eventos visibles en el calendario según los siguientes criterios:

&nbsp;&nbsp;&nbsp;&nbsp;UR6.4.1. Asignatura.

&nbsp;&nbsp;&nbsp;&nbsp;UR6.4.2. Tipo de grupo.

&nbsp;&nbsp;&nbsp;&nbsp;UR6.4.3. Grupo concreto.

&nbsp;&nbsp;&nbsp;&nbsp;UR6.4.4. Aula.

&nbsp;&nbsp;&nbsp;&nbsp;UR6.4.5. Idioma.

UR6.5. Al seleccionar un evento en el calendario, el sistema mostrará sus detalles: asignatura, grupo, tipo de evento, aula, horario y comentarios si los hubiera.

UR6.6. Los eventos cancelados se mostrarán visualmente diferenciados del resto de eventos.

UR6.7. La interfaz de consulta de horarios funcionará correctamente en dispositivos móviles.

---

**UR7 — Solicitudes de cambio** *(docente crea; administrador gestiona)*

UR7.1. El sistema permitirá al docente crear solicitudes de cambio sobre los eventos del calendario, sin necesidad de usar el correo electrónico. El sistema ofrecerá los siguientes tipos de solicitud:

&nbsp;&nbsp;&nbsp;&nbsp;UR7.1.1. Solicitud de creación de un nuevo evento: el docente proporcionará los datos del evento que desea crear, con los mismos campos que en la creación directa de un evento (UR5.1 o UR5.2).

&nbsp;&nbsp;&nbsp;&nbsp;UR7.1.2. Solicitud de edición de un evento existente: el docente seleccionará el evento original y proporcionará los datos modificados propuestos.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR7.1.2.1. La selección del evento original es un dato obligatorio.

&nbsp;&nbsp;&nbsp;&nbsp;UR7.1.3. Solicitud de cancelación de una ocurrencia de un evento existente: el docente seleccionará el evento original y la fecha concreta de la ocurrencia que desea cancelar.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR7.1.3.1. La selección del evento original y de la fecha de la ocurrencia son datos obligatorios.

&nbsp;&nbsp;&nbsp;&nbsp;UR7.1.4. Solicitud de sustitución de una ocurrencia: el docente seleccionará el evento original, la ocurrencia a cancelar, y proporcionará los datos del nuevo evento que debe sustituirla.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR7.1.4.1. La selección del evento original y la ocurrencia son datos obligatorios.

&nbsp;&nbsp;&nbsp;&nbsp;UR7.1.5. En todos los tipos de solicitud, el sistema indicará al docente si los datos propuestos generan un conflicto de horario con el estado actual del calendario antes de enviar la solicitud. Esta información es orientativa; el docente podrá enviar la solicitud igualmente.

&nbsp;&nbsp;&nbsp;&nbsp;UR7.1.6. Al enviar la solicitud, el sistema notificará a los administradores por correo electrónico.

UR7.2. El sistema permitirá al docente consultar el listado de sus propias solicitudes y ver el estado actualizado y los comentarios del revisor en cada una de ellas.

UR7.3. El sistema permitirá al docente eliminar sus propias solicitudes que estén pendientes de revisión.

&nbsp;&nbsp;&nbsp;&nbsp;UR7.3.1. Si la solicitud ya ha sido revisada (aprobada o rechazada), el sistema mostrará un mensaje de error y no permitirá eliminarla.

UR7.4. El sistema permitirá al administrador consultar el listado de todas las solicitudes recibidas.

&nbsp;&nbsp;&nbsp;&nbsp;UR7.4.1. El sistema permitirá filtrar las solicitudes por estado: pendiente, aprobada o rechazada.

&nbsp;&nbsp;&nbsp;&nbsp;UR7.4.2. Las solicitudes pendientes de revisión se mostrarán con una indicación visual diferenciada.

UR7.5. El sistema permitirá al administrador aprobar una solicitud pendiente.

&nbsp;&nbsp;&nbsp;&nbsp;UR7.5.1. El sistema mostrará al administrador si los datos de la solicitud generan conflictos con el estado actual del calendario.

&nbsp;&nbsp;&nbsp;&nbsp;UR7.5.2. Antes de confirmar la aprobación, el administrador podrá ajustar la frecuencia, las fechas y las horas del evento propuesto. Los campos de asignatura, grupo y aula son de solo lectura y no podrán modificarse.

&nbsp;&nbsp;&nbsp;&nbsp;UR7.5.3. Si el administrador aprueba la solicitud, el sistema ejecutará automáticamente la acción correspondiente al tipo de solicitud (crear, editar, cancelar o sustituir el evento) con los datos definitivos tras el posible ajuste.

&nbsp;&nbsp;&nbsp;&nbsp;UR7.5.4. El sistema notificará al docente por correo electrónico indicando que su solicitud ha sido aprobada.

UR7.6. El sistema permitirá al administrador rechazar una solicitud pendiente.

&nbsp;&nbsp;&nbsp;&nbsp;UR7.6.1. El sistema permitirá al administrador introducir el motivo del rechazo.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR7.6.1.1. Es un dato recomendado. Si se omite, el docente recibirá la notificación de rechazo sin justificación detallada.

&nbsp;&nbsp;&nbsp;&nbsp;UR7.6.2. El sistema notificará al docente por correo electrónico indicando que su solicitud ha sido rechazada y el motivo proporcionado por el administrador, si lo hubiera.

---

**UR8 — Sincronización con Google Calendar** *(solo administrador)*

UR8.1. El sistema permitirá al administrador sincronizar un calendario académico completo con Google Calendar.

&nbsp;&nbsp;&nbsp;&nbsp;UR8.1.1. El administrador seleccionará el calendario académico que desea sincronizar.

&nbsp;&nbsp;&nbsp;&nbsp;UR8.1.2. El sistema creará un calendario de Google independiente por cada aula que tenga eventos en el calendario académico seleccionado. El nombre de cada calendario de Google será el código del aula correspondiente.

&nbsp;&nbsp;&nbsp;&nbsp;UR8.1.3. El sistema publicará los eventos del calendario académico en el calendario de Google del aula correspondiente.

&nbsp;&nbsp;&nbsp;&nbsp;UR8.1.4. El sistema mostrará al administrador el progreso de la sincronización en tiempo real, indicando cuántos calendarios de aula se han procesado sobre el total.

&nbsp;&nbsp;&nbsp;&nbsp;UR8.1.5. Al finalizar, el sistema indicará si la sincronización ha concluido correctamente o si se ha producido algún error, con un mensaje de diagnóstico en caso de fallo.

UR8.2. El sistema garantizará que, al ejecutar una sincronización, el estado de los calendarios de Google quede completamente alineado con el estado actual del sistema, eliminando y recreando los eventos desde cero.

UR8.3. El sistema permitirá al administrador consultar el estado de sincronización de cada calendario académico: pendiente de sincronizar, en proceso, sincronizado correctamente o con error.

UR8.4. El sistema permitirá al administrador eliminar la sincronización de un calendario académico concreto.

&nbsp;&nbsp;&nbsp;&nbsp;UR8.4.1. El sistema solicitará confirmación antes de proceder.

&nbsp;&nbsp;&nbsp;&nbsp;UR8.4.2. El sistema eliminará los eventos de ese calendario académico en los calendarios de Google de las aulas afectadas. Si algún calendario de Google queda vacío, el sistema lo eliminará también.

---

**UR9 — Interoperabilidad con el sistema heredado**

UR9.1. El sistema permitirá al administrador exportar un calendario académico completo en el formato del sistema heredado.

&nbsp;&nbsp;&nbsp;&nbsp;UR9.1.1. El sistema generará un archivo comprimido en formato ZIP que contendrá los cinco ficheros `.txt` del sistema anterior: `ubicaciones.txt`, `asignaturas.txt`, `calendario.txt`, `horarios.txt` y `excepciones.txt`.

&nbsp;&nbsp;&nbsp;&nbsp;UR9.1.2. La exportación incluirá únicamente los eventos de tipo Clase; los eventos de tipo Evaluación, Revisión, Otros e Independiente no se incluirán.

&nbsp;&nbsp;&nbsp;&nbsp;UR9.1.3. El archivo se descargará automáticamente en el navegador del administrador.

UR9.2. El sistema permitirá a cualquier usuario descargar el calendario de un semestre en formato de texto nativo de la aplicación (ficheros `.txt`).

&nbsp;&nbsp;&nbsp;&nbsp;UR9.2.1. Esta exportación estará disponible desde la vista del calendario de semestre.

&nbsp;&nbsp;&nbsp;&nbsp;UR9.2.2. La descarga generará los ficheros `.txt` con el contenido actualmente visible en el calendario.

UR9.3. El sistema permitirá al administrador importar un calendario académico desde los cinco ficheros `.txt` del sistema heredado para facilitar la migración inicial.

&nbsp;&nbsp;&nbsp;&nbsp;UR9.3.1. El administrador cargará los ficheros `.txt` del sistema anterior (se requieren: `asignaturas.txt`, `calendario.txt`, `horarios.txt`, `ubicaciones.txt`; el fichero `excepciones.txt` es opcional).

&nbsp;&nbsp;&nbsp;&nbsp;UR9.3.2. Tras la confirmación del administrador, el sistema creará las entidades correspondientes en el calendario destino.

&nbsp;&nbsp;&nbsp;&nbsp;UR9.3.3. El sistema mostrará un informe con los datos importados correctamente y los errores encontrados.

UR9.4. El sistema permitirá al administrador cargar excepciones sobre un calendario existente desde un fichero `.txt`.

&nbsp;&nbsp;&nbsp;&nbsp;UR9.4.1. El administrador podrá elegir entre dos modos de importación:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR9.4.1.1. Agregar: las excepciones del fichero se añaden a las ya existentes en el calendario.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR9.4.1.2. Reemplazar: las excepciones existentes en el calendario son sustituidas completamente por las del fichero.

UR9.5. El sistema permitirá exportar el horario de un calendario en formato CSV compatible con Google Calendar, para que los usuarios puedan importarlo en su aplicación de calendario personal.

&nbsp;&nbsp;&nbsp;&nbsp;UR9.5.1. Esta exportación estará disponible desde la vista del calendario de semestre para cualquier usuario.

---

**UR10 — Auditoría y trazabilidad**

UR10.1. El sistema registrará automáticamente información de auditoría en todas las entidades gestionadas.

&nbsp;&nbsp;&nbsp;&nbsp;UR10.1.1. Para cada entidad, el sistema almacenará los siguientes datos de forma automática:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR10.1.1.1. Usuario que creó el registro.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR10.1.1.2. Fecha y hora de creación.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR10.1.1.3. Usuario que realizó la última modificación.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UR10.1.1.4. Fecha y hora de la última modificación.

&nbsp;&nbsp;&nbsp;&nbsp;UR10.1.2. Este registro se realizará de forma automática en cada operación de creación o modificación, sin necesidad de ninguna acción adicional por parte del usuario.

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
