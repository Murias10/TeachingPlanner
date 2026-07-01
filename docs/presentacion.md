# Presentación — TeachingPlanner

> **Duración objetivo:** ~10 minutos de exposición oral
> **Formato total:** presentación (10 min) + vídeo demo (10 min) + preguntas
>
> **Guía de tiempo por sección:**
> - Motivación (diapositivas 2–3): ~1 min 45 s
> - Objetivos (diapositiva 4): ~1 min
> - Solución técnica (diapositivas 5–10): ~6 min 30 s
> - Conclusiones (diapositiva 11): ~1 min 30 s

---

## Diapositiva 1 — Portada

**TeachingPlanner**
*Sistema web de gestión de horarios académicos para la EII*

Diego Murias · Escuela de Ingeniería Informática · Universidad de Oviedo
Trabajo de Fin de Grado — Curso 2025-2026

---

## Diapositiva 2 — El problema: así se gestionaban los horarios

> *Antes de ver qué hace este sistema, hay que entender qué había antes.*

La EII gestionaba sus horarios con **dos piezas**:

1. Un **visualizador público** de solo lectura — sin ningún panel de administración
2. Cinco **ficheros de texto plano** que se editaban directamente en el servidor de la escuela

Para cualquier cambio en el horario había que acceder al servidor de la escuela y editar esos ficheros a mano con un editor de texto. No existía ninguna interfaz para el personal administrativo ni para los docentes.

---

## Diapositiva 3 — Las consecuencias del día a día

El sistema funcionaba... hasta que dejaba de funcionar. Y cuando fallaba, no avisaba.

- **Errores silenciosos:** una letra incorrecta en el formato del fichero hacía desaparecer un grupo del horario sin ningún aviso
- **Sin detección de conflictos:** un aula podía quedar reservada dos veces a la misma hora sin que nadie lo supiera
- **Solicitudes por correo:** docente → correo a jefatura → comprobación manual → respuesta → contraoferta → … hilos interminables sin trazabilidad
- **Doble mantenimiento:** cada cambio en los ficheros había que replicarlo también en Google Calendar a mano
- **Sin móvil:** el visualizador no funcionaba en teléfonos ni tablets

Todos son problemas de proceso diario. El sistema no fallaba de forma dramática — fallaba de forma silenciosa y costosa en tiempo.

---

## Diapositiva 4 — Qué abarca este TFG

De todo lo que se identificó como mejorable, este proyecto da respuesta a seis objetivos concretos:

1. **Interfaz web de administración** — que cualquier persona pueda gestionar el horario sin acceder al servidor
2. **Detección de conflictos en tiempo real** — antes de guardar cualquier cambio
3. **Sistema de solicitudes integrado** — que reemplaza el flujo por correo electrónico
4. **Sincronización automática con Google Calendar** — un calendario por aula
5. **Compatibilidad total con el formato de ficheros heredado** — para no romper el ecosistema existente
6. **Consulta pública sin autenticación** — conservando lo que ya ofrecía el sistema anterior
7. **Vista de calendario interactiva** — semana completa, semana laboral, día y mes, sustituyendo el listado/tabla del visualizador heredado

El sistema anterior no era solo problemas: su modelo de datos reflejaba necesidades académicas reales, y varios puntos de partida se conservan — el modelo de recurrencia (semanal, par/impar, código personalizado), el presupuesto de horas lectivas por grupo, los enlaces de cada aula al GIS de la universidad y de cada asignatura al SIES, y el catálogo bilingüe ES/EN.

> La aplicación no extiende el visualizador heredado: es un sistema nuevo construido desde cero. Pero no parte de cero en su modelo de dominio — conserva lo que ya funcionaba y corrige lo que fallaba.

---

## Diapositiva 5 — Arquitectura: la primera decisión de diseño

La primera decisión fue: ¿un único sistema integrado (monolito) o servicios independientes (microservicios)?

**Se optó por microservicios con API Gateway** por tres razones concretas, no por tendencia tecnológica:

- **Autenticación y planificación evolucionan a ritmos distintos.** Un cambio en el sistema de contraseñas no debe poder romper el calendario, y viceversa. Con un monolito, ambos módulos comparten el ciclo de despliegue y ese riesgo existe siempre.
- **El servicio de planificación es computacionalmente más costoso.** Genera calendarios completos, maneja la exportación y sincroniza con Google Calendar. Puede escalar de forma independiente sin replicar los servicios de autenticación.
- **Despliegue de bajo riesgo.** Actualizar el servicio de usuarios no requiere reiniciar el servicio de planificación. Si algo falla, solo el servicio afectado se detiene — el resto sigue funcionando.

El resultado: cuatro servicios independientes (autenticación, usuarios, planificación, gateway), cada uno con su propia base de datos, comunicándose internamente y exponiendo un único punto de entrada al exterior.

Todo el entorno corre en **Docker Compose**, con configuraciones diferenciadas para desarrollo, VM universitaria y Azure.

---

## Diapositiva 6 — El modelo de datos: una restricción institucional

Para representar los eventos del horario había dos caminos posibles:

| Opción | Cómo funciona | Analogía |
|--------|---------------|----------|
| **Modelo de fechas concretas** (como Google Calendar) | Cada clase se guarda con su fecha exacta: "clase el martes 14 de octubre". Consultar = leer registros. | Agenda de citas |
| **Modelo de patrones de recurrencia** (sistema heredado) | Cada clase se define por su día de la semana y un tipo de periodicidad. Las fechas se calculan en el momento de consultar. | Regla de calendario |

**Se eligió el segundo.** La razón es una restricción institucional concreta: existe en la EII otra aplicación, usada por jefatura de estudios, que se alimenta directamente de los mismos cinco ficheros de texto. Si TeachingPlanner no pudiera generar esos ficheros con exactamente el mismo formato, esa aplicación quedaría desconectada desde el primer día.

Con el modelo de fechas concretas, reconstruir esos ficheros exigiría una transformación inversa compleja con riesgo de pérdida de información. Con el modelo de patrones, la exportación es una transcripción directa.

**El coste de esta decisión:** mostrar el calendario requiere calcular en el momento qué fechas corresponden a cada evento recurrente. Esa es la operación más costosa del sistema, y la que generó el problema técnico más importante del proyecto.

---

## Diapositiva 7 — El motor de planificación: cómo funciona

El sistema no almacena las fechas concretas de las clases. Lo que almacena es la **regla**: "esta clase ocurre todos los martes". Las fechas se calculan cada vez que se consulta el calendario.

Ese cálculo sigue tres reglas:

**1. Qué días lectivos aplican a cada evento**

Cada evento periódico tiene un tipo de recurrencia:
- *Normal* — aparece todas las semanas lectivas del semestre
- *Par* — solo en semanas pares
- *Impar* — solo en semanas impares
- *Personalizado* — solo en los días lectivos marcados con un código específico durante la importación

**2. El presupuesto de horas**

Cada grupo tiene un número de horas lectivas planificadas para el semestre. El sistema asigna clases en orden cronológico hasta agotar ese presupuesto. Si hay clases extraordinarias ya confirmadas en el calendario, esas consumen presupuesto primero — y las clases periódicas se ajustan automáticamente.

**3. Rotación entre grupos del mismo horario**

Si varios grupos comparten el mismo día de la semana y franja horaria, el sistema los rota: el primer día va al primer grupo, el segundo al segundo, y así sucesivamente. Reproduce automáticamente la alternancia que se hace en la realidad cuando un aula no puede albergar dos grupos simultáneamente.

---

## Diapositiva 8 — El problema más difícil que se encontró

Durante las pruebas del sistema apareció un error en la detección de conflictos para las **clases semanales ordinarias** — el tipo de evento más común en cualquier horario.

**El síntoma:** al reservar un aula para una clase puntual, el sistema no detectaba el conflicto con las clases semanales que ya ocupaban ese aula. Los conflictos pasaban desapercibidos en silencio, exactamente como en el sistema antiguo que se quería sustituir.

**La causa:** el mecanismo de detección consultaba directamente la base de datos para saber qué eventos periódicos caen en un día concreto. Pero para los eventos de tipo *Normal*, esa información no está guardada directamente — se calcula a partir del calendario lectivo. La consulta siempre devolvía vacío y el detector nunca encontraba conflictos.

**Las dos opciones para arreglarlo:**

| Opción | Ventaja | Inconveniente |
|--------|---------|---------------|
| Reimplementar la lógica de expansión dentro del detector de conflictos | Más rápido computacionalmente | Duplica lógica compleja; dos implementaciones del mismo cálculo pueden divergir con el tiempo |
| Reutilizar el generador de calendario completo como fuente de verdad | Sin duplicación; correcto por construcción | Más costoso: genera el calendario entero y luego filtra |

**Se eligió la segunda.** El sistema ya tenía un generador de calendario probado y correcto. Mantener dos implementaciones del mismo cálculo en paralelo era un riesgo real de que divergieran. El coste computacional adicional es aceptable para la escala de uso de la EII.

---

## Diapositiva 9 — Tres decisiones técnicas con consecuencias reales

**1. Base de datos: relacional (MariaDB) en lugar de documental (MongoDB)**

El modelo académico — titulaciones, cursos, asignaturas, grupos, aulas, eventos — tiene relaciones fuertes y restricciones de unicidad: si se borra una asignatura, todos sus grupos desaparecen; no se pueden crear dos aulas con el mismo código. Una base de datos documental no aplica estas garantías automáticamente — habría que reimplementarlas en el código de la aplicación, con riesgo de inconsistencias. Una base de datos relacional las aplica a nivel de motor, sin código adicional.

**2. Frontend: React como aplicación de una sola página (Vite) en lugar de Next.js con renderizado en servidor**

Next.js con renderizado en servidor aporta principalmente dos cosas: mejor posicionamiento en buscadores y carga inicial más rápida para usuarios no autenticados. TeachingPlanner no necesita ninguna de las dos: todas las páginas requieren autenticación previa — no hay nada que indexar ni páginas que mostrar sin sesión. React con Vite tiene un ciclo de desarrollo significativamente más rápido y sin infraestructura de servidor adicional.

**3. Sincronización con Google Calendar: completa en lugar de incremental**

Una sincronización incremental identificaría qué eventos han cambiado y actualizaría solo esos. El problema: los eventos periódicos no tienen fechas almacenadas — habría que expandir el calendario completo y comparar ocurrencia por ocurrencia con lo que hay en Google. Con cientos de eventos en un semestre, eso agotaría la cuota de la API en segundos. La sincronización completa — borrar todo y recrear desde cero — consume el mismo número de llamadas pero de forma predecible y controlada.

**4. TLS: Caddy en lugar de Nginx**

El certificado TLS de la universidad (GEANT) llega ya emitido, no hay que gestionar su renovación automática. Nginx exigiría scripts de certbot para eso; Caddy acepta certificados provisionados manualmente sin herramientas adicionales dentro del contenedor. Menos piezas que mantener para el mismo resultado.

---

## Diapositiva 10 — Calidad: cómo se verifica que funciona

**La decisión de testing más importante: no usar simulaciones**

Para los tests del núcleo del sistema se tomó una decisión deliberada: **no usar bases de datos simuladas (mocks)**, sino una base de datos real en un contenedor efímero que se crea antes de cada suite de tests y se destruye al terminar.

La razón: la lógica más crítica del sistema — restricciones de unicidad, eliminaciones en cascada, integridad referencial — solo se manifiesta con una base de datos real. Un mock no reproduce esas garantías. Una suite construida sobre mocks pasaría los tests para código que falla en producción. Los 27 casos de integración prueban exactamente esa capa.

**El pipeline CI/CD: calidad integrada en el proceso**

| Etapa | Qué verifica |
|-------|-------------|
| Análisis estático (SonarQube) | Code smells, deuda técnica, cobertura > 70% |
| Tests de integración (base de datos real) | 27 casos: restricciones, cascadas, unicidad, autenticación |
| Tests E2E (Playwright, navegador real) | 42 flujos completos de usuario en Chromium |
| Build y publicación | Imagen Docker lista para desplegar |
| Despliegue | VM universitaria (runner propio) o Azure (SSH) |

El pipeline se activa de forma **manual y deliberada** — no en cada push. La persona que despliega elige qué etapas ejecutar.

La interfaz cuida también los detalles: tema claro/oscuro/sistema persistido, filtros en cascada que recuerdan la última selección, confirmación explícita antes de cualquier acción destructiva y progreso en tiempo real en operaciones largas como la sincronización o la importación.

La aplicación está **desplegada en una VM de la Universidad de Oviedo** y se presentó formalmente al personal de la EII como candidata para sustituir el sistema actual.

---

## Diapositiva 11 — Conclusiones y trabajo futuro

**Conclusiones**

- El objetivo principal está cumplido: la EII tiene un sistema desplegado, funcional y presentado formalmente como sustituto del actual
- Los problemas de partida — edición manual en el servidor, errores silenciosos, solicitudes por correo — están resueltos
- Todas las decisiones técnicas tuvieron restricciones reales: la compatibilidad con el ecosistema de ficheros, la cuota de la API de Google, la disponibilidad del portal universitario de Azure. Ninguna fue arbitraria.
- El trabajo demuestra que una arquitectura de microservicios con CI/CD y despliegue real en producción es abordable dentro de un TFG si las decisiones se toman con criterio desde el principio

**Trabajo futuro — qué está listo para crecer**

- **Autenticación Microsoft** — usar las cuentas `@uniovi.es` en lugar de credenciales propias *(requería registro en el portal Azure universitario: decisión institucional fuera del alcance del TFG)*
- **Interfaz de auditoría** — los campos de trazabilidad ya están en la base de datos; falta la UI de consulta
- **Undo/redo en el calendario** — la lógica de eventos periódicos lo hace complejo, pero la estructura está preparada
- **Notificaciones en tiempo real** — WebSockets cuando se aprueba o rechaza una solicitud
- **WAF y rate limiting** — antes de cualquier despliegue más amplio que el entorno universitario actual

---

## Diapositiva 12 — Demostración

> *A continuación se proyecta el vídeo de demostración de la aplicación.*

*(~10 minutos)*
