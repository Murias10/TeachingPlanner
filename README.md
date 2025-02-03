# 📅 Proyecto de Planificación Docente - Escuela de Ingeniería Informática de Oviedo  

## 🚀 Introducción  

Este proyecto tiene como objetivo desarrollar una herramienta web para la **gestión de la planificación académica** de la Escuela de Ingeniería Informática de Oviedo. La necesidad surge de la existencia de procesos manuales y poco eficientes para la asignación de horarios, grupos y aulas. La herramienta busca **automatizar estas tareas, reducir errores y facilitar la gestión de cambios** a lo largo del curso.  

## 🔹 Funcionalidades Principales  

La aplicación se centra en las siguientes funcionalidades:  

- 👤 **Gestión de usuarios**: Permitir la creación, modificación y gestión de usuarios con diferentes roles.  
- 📆 **Gestión de calendarios académicos**: Facilitar la creación, modificación y duplicación de calendarios académicos.  
- 📚 **Gestión de asignaturas**: Permitir la creación, modificación y gestión de asignaturas.  
- 🏫 **Gestión de grupos**: Crear, modificar, duplicar y eliminar grupos, incluyendo la gestión de lecciones y excepciones.  
- 🏠 **Gestión de aulas**: Permitir la creación, modificación y gestión de aulas.  
- 🔍 **Visualización de horarios**: Ofrecer una vista pública donde cualquier usuario, sin necesidad de iniciar sesión, pueda **consultar los horarios** de los diferentes cursos académicos disponibles, tanto del primer como del segundo semestre.  
- 🔄 **Sincronización con Google Calendar**: Sincronizar la planificación de lecciones con calendarios de Google Calendar, reflejando los cambios automáticamente.  
- 📜 **Registro de cambios**: Guardar un historial de todas las acciones que modifiquen datos, incluyendo la hora, el día y el usuario.  
- ✏️ **Solicitudes de cambio**: Permitir que los profesores soliciten modificaciones en horarios y asignaciones de aulas, las cuales deberán ser revisadas y aprobadas o rechazadas por un administrador.  
- 📂 **Exportación de datos**: Permitir la exportación de listados a archivos `.csv`.  

## 👥 Roles de Usuario  

La herramienta define tres roles principales de usuario:  

- 🛠️ **Administrador**: Tiene **control total** sobre la aplicación, pudiendo **crear, modificar y eliminar** todos los elementos del sistema (calendarios, asignaturas, grupos, aulas y usuarios). Además, es responsable de revisar y **aprobar o rechazar** las solicitudes de cambio enviadas por los profesores.  
- 🎓 **Profesor**: Puede **consultar la planificación académica** y **crear solicitudes de cambio** en los grupos que tenga asignados. Estas solicitudes serán evaluadas por un administrador antes de aplicarse.  
- 👀 **Usuario anónimo**: No necesita iniciar sesión y puede **consultar los horarios** de los diferentes cursos académicos disponibles, tanto del primer como del segundo semestre.  

## ✅ Aspectos Relevantes  

- 🖥️ **Interfaz Intuitiva**: Se busca ofrecer una interfaz sencilla y fácil de usar para evitar la interacción directa con grandes cantidades de datos y reducir errores.  
- ⚠️ **Validación de datos**: La aplicación implementa validaciones para asegurar la correcta entrada de datos, mostrando mensajes de error en caso de información incorrecta o duplicada.  
- 🔐 **Seguridad**: Se contemplan medidas de seguridad como la **encriptación de contraseñas** y la gestión de accesos según el rol de usuario.  
- 📊 **Registro de actividad**: El sistema **registra inicios y cierres de sesión**, así como las modificaciones realizadas por los usuarios, facilitando el seguimiento y la detección de errores.  
- 🔄 **Gestión de solicitudes de cambio**: Los profesores podrán **solicitar modificaciones** en horarios y asignaciones de aulas, pero estas deberán ser **evaluadas y aprobadas o rechazadas** por un administrador.  
- 📅 **Integración con Google Calendar**: La sincronización automática con **Google Calendar** permite que los profesores puedan consultar los horarios sin necesidad de acceder directamente a la aplicación web.  