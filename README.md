# 📅 Proyecto de Planificación Docente - Escuela de Ingeniería Informática de Oviedo  

## 🚀 Introducción  

Este proyecto tiene como objetivo desarrollar una herramienta web para la **gestión de la planificación académica** de la Escuela de Ingeniería Informática de Oviedo. La necesidad surge de la existencia de procesos manuales y poco eficientes para la asignación de horarios, grupos y aulas. La herramienta busca **automatizar estas tareas, reducir errores y facilitar la gestión de cambios** a lo largo del curso.  

## 🔹 Funcionalidades Principales  

La aplicación se centra en las siguientes funcionalidades:  

- 👤 **Gestión de usuarios**: Permitir la creación, modificación y eliminación de usuarios con diferentes roles.  
- 🏛️ **Gestión de titulaciones y cursos académicos**: Crear y gestionar la estructura académica (titulaciones, cursos y semestres) sobre la que se organiza la planificación.  
- 📚 **Gestión de asignaturas y grupos**: Permitir la creación, modificación y eliminación de asignaturas y sus grupos, incluyendo eventos periódicos y eventos puntuales.  
- 🏠 **Gestión de aulas**: Permitir la creación, modificación y gestión de aulas con enlace al sistema GIS de la universidad.  
- 📆 **Gestión de calendarios académicos**: Facilitar la creación, modificación y duplicación de calendarios académicos, con gestión de días lectivos y sus caracteres de recurrencia.  
- ⚠️ **Detección de conflictos en tiempo real**: Comprobar automáticamente, antes de guardar cualquier asignación o cambio, si existe una colisión con otros eventos ya registrados (misma aula, mismo horario).  
- 🔍 **Visualización pública de horarios**: Ofrecer una vista pública donde cualquier usuario, sin necesidad de iniciar sesión, pueda consultar los horarios de los diferentes grupos y cursos académicos disponibles.  
- ✏️ **Solicitudes de cambio**: Permitir que los profesores soliciten modificaciones en horarios y asignaciones de aulas, las cuales deberán ser revisadas y aprobadas o rechazadas por un administrador.  
- 🔄 **Sincronización con Google Calendar**: Sincronizar manualmente la planificación con Google Calendar, generando un calendario externo por aula para su uso por otras aplicaciones del ecosistema de la EII.  
- 📂 **Interoperabilidad con el sistema heredado**: Importar y exportar los cinco ficheros `.txt` del sistema legado, permitiendo la carga del semestre actual sin reintroducir datos y manteniendo la compatibilidad con otras herramientas de la EII.  
- 📥 **Exportación CSV personal**: Permitir que cualquier usuario exporte su horario personal a un fichero `.csv` compatible con Google Calendar.  
- 📜 **Registro de cambios**: Guardar un historial de todas las acciones que modifiquen datos, incluyendo la hora, el día y el usuario que realizó el cambio.  

## 👥 Roles de Usuario  

La herramienta define tres roles principales de usuario:  

- 🛠️ **Administrador**: Tiene **control total** sobre la aplicación, pudiendo **crear, modificar y eliminar** todos los elementos del sistema (titulaciones, cursos, asignaturas, grupos, aulas, calendarios y usuarios). Es responsable de revisar y **aprobar o rechazar** las solicitudes de cambio enviadas por los profesores, y es el único rol que puede lanzar la sincronización con Google Calendar.  
- 🎓 **Profesor**: Puede **consultar la planificación académica completa** y **crear solicitudes de modificación** sobre eventos del calendario. Antes de enviar una solicitud, el sistema le informa si el cambio solicitado genera algún conflicto. Las solicitudes son evaluadas por un administrador antes de aplicarse.  
- 👀 **Usuario anónimo**: No necesita iniciar sesión y puede **consultar los horarios** de los diferentes grupos y cursos académicos disponibles, así como exportar su horario personal a CSV.  

## ✅ Aspectos Relevantes  

- 🖥️ **Interfaz intuitiva y responsive**: Se ofrece una interfaz sencilla y fácil de usar, completamente adaptada a dispositivos móviles, que evita la interacción directa con los ficheros de texto del sistema anterior.  
- 🌐 **Internacionalización**: La interfaz está disponible en español e inglés, dando soporte tanto al personal hispanohablante como al itinerario en inglés de la EII.  
- ⚠️ **Validación de datos**: La aplicación implementa validaciones para asegurar la correcta entrada de datos, mostrando mensajes de error en caso de información incorrecta o duplicada.  
- 🔐 **Seguridad**: Se contemplan medidas de seguridad como la **encriptación de contraseñas**, gestión de accesos por rol, tokens JWT de corta duración y validación de entradas según OWASP ASVS.  
- 📊 **Registro de actividad**: El sistema **registra todas las modificaciones** realizadas sobre los datos, incluyendo el usuario responsable y la marca de tiempo, facilitando la trazabilidad y la auditoría de cambios.  
- 🐳 **Despliegue containerizado**: La aplicación está completamente containerizada con Docker y orquestada con Docker Compose, con configuraciones separadas para desarrollo, despliegue en Azure y servidor propio. Incluye un pipeline de CI/CD con GitHub Actions y análisis de calidad con SonarQube.  
