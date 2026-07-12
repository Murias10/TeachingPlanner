# Presentación — TeachingPlanner

> **Duración objetivo:** ~12-13 minutos de exposición oral (margen hasta 15 min si hace falta respirar entre bloques)
> **Formato total:** presentación (~13 min) + vídeo demo (~12 min) + preguntas
>
> **Guía de tiempo por sección:**
> - Portada (diapositiva 1): ~10 s
> - Motivación (diapositivas 2–3): ~1 min 15 s
> - Objetivos (diapositiva 4): ~50 s
> - Solución técnica — arquitectura y decisiones (diapositivas 5–7, 10): ~3 min 20 s
> - Solución técnica — problemas encontrados y cómo se resolvieron (diapositivas 8–9): ~1 min 55 s
> - Calidad y despliegue (diapositiva 11): ~55 s
> - Conclusiones y trabajo futuro (diapositiva 12): ~65 s
> - Cierre / paso a demo (diapositiva 13): ~5 s
>
> **Estructura alineada con las indicaciones del tutor:** motivación sin tecnicismos (2–3) → objetivos sin tecnicismos (4) → bloque largo de arquitectura, problemas *verdaderamente importantes* encontrados y decisiones ante alternativas (5–11, es la parte central y más extensa) → conclusiones y trabajo futuro (12) → anuncio de la demo (13). Los problemas encontrados están narrados con la misma estructura siempre: síntoma/situación → causa → alternativas valoradas → decisión tomada.
>
> **Cómo usar este documento:** cada diapositiva tiene dos bloques.
> - **Contenido** → lo que aparece en pantalla (para generar el diseño en Canva). Bullets cortos o tabla; nada de párrafos.
> - **Guion** → lo que se dice en voz alta mientras esa diapositiva está proyectada. No se lee literalmente, es apoyo para practicar.

---

## Diapositiva 1 — Portada

### Contenido
- **TeachingPlanner**
- Sistema web de gestión de horarios académicos para la EII
- Diego Murias · Escuela de Ingeniería Informática · Universidad de Oviedo
- Trabajo de Fin de Grado — Curso 2025-2026

### Guion
> "Buenos días. Voy a presentar TeachingPlanner, un sistema web de gestión de horarios académicos desarrollado para la Escuela de Ingeniería Informática de la Universidad de Oviedo, como Trabajo de Fin de Grado."

*(~10 s)*

---

## Diapositiva 2 — El problema: así se gestionaban los horarios

### Contenido
- El sistema actual de la EII tiene dos piezas:
  - Un **visualizador público** de solo lectura, sin panel de administración
  - Cinco **ficheros de texto plano** editados a mano en el servidor
- Sin interfaz para personal administrativo ni docentes

### Guion
> "Antes de ver qué hace este sistema, hay que entender qué había antes. La EII gestionaba sus horarios con dos piezas: un visualizador público de solo lectura, sin ningún panel de administración, y cinco ficheros de texto plano que se editaban directamente en el servidor de la escuela. Para cualquier cambio en el horario había que acceder a ese servidor y editar los ficheros a mano con un editor de texto. No existía ninguna interfaz para el personal administrativo ni para los docentes."

*(~30 s)*

---

## Diapositiva 3 — Las consecuencias del día a día

### Contenido
- **Sin validación de formato ni de conflictos** — un error de sintaxis se guarda sin avisar; un aula puede reservarse dos veces a la misma hora sin que el sistema lo detecte
- **El mecanismo de código de letra es frágil** — la periodicidad de los grupos no semanales depende de que el mismo código coincida exactamente en dos ficheros distintos; una mayúscula de más o un espacio hace que el grupo desaparezca del horario publicado sin ningún error visible
- **Solicitudes por correo** — hilos interminables, sin trazabilidad
- **Doble mantenimiento** — replicar cambios a mano en Google Calendar
- **Sin móvil** — el visualizador no funciona en teléfono ni tablet

> Todo apuntaba en la misma dirección: hacía falta una **plataforma web centralizada**, con una interfaz real para administrar el horario y validaciones automáticas — no más ficheros de texto editados a mano

### Guion
> "El sistema funcionaba... hasta que dejaba de funcionar. Y cuando fallaba, no avisaba. Si se introducía un error de sintaxis al editar un fichero, el sistema no lo detectaba ni avisaba: el dato erróneo se guardaba silenciosamente. Tampoco se comprobaba si un cambio generaba solapamientos: un aula podía quedar asignada dos veces a la misma hora sin ningún aviso. Había además un problema más sutil y específico: la periodicidad de los grupos no semanales dependía de un código de letra que tenía que coincidir exactamente entre dos ficheros distintos, calendario.txt y horarios.txt. Una diferencia de mayúscula o un espacio de más rompía esa coincidencia, y el grupo desaparecía del horario publicado sin producir ningún error visible — quien no supiera que ese mecanismo existía no tenía forma de saber por qué faltaba una clase. Las solicitudes de cambio se gestionaban por correo — docente escribe a jefatura, comprobación manual, respuesta, contraoferta — hilos interminables sin trazabilidad. Cada cambio en los ficheros había que replicarlo también a mano en Google Calendar. Y el visualizador no funcionaba en móviles ni tablets. Todos son problemas de proceso diario: el sistema no fallaba de forma dramática, fallaba de forma silenciosa y costosa en tiempo. Y todos apuntaban en la misma dirección: hacía falta sustituir la edición manual de ficheros por una plataforma web centralizada, con una interfaz real para administrar el horario y validaciones automáticas que hoy no existían. Esa es la dirección de mejora que aborda este trabajo."

*(~55 s)*

---

## Diapositiva 4 — Qué abarca este TFG

### Contenido
1. Interfaz web de administración
2. Detección de conflictos en tiempo real
3. Sistema de solicitudes integrado (sustituye el correo)
4. Sincronización automática con Google Calendar
5. Compatibilidad total con el formato de ficheros heredado
6. Consulta pública sin autenticación
7. Vista de calendario interactiva (semana, día, mes, agenda)

> Sistema nuevo desde cero, pero conserva el modelo de dominio que ya funcionaba

### Guion
> "De todo lo que se identificó como mejorable, este proyecto da respuesta a siete objetivos concretos: una interfaz web de administración para que cualquier persona gestione el horario sin acceder al servidor; detección de conflictos en tiempo real antes de guardar cualquier cambio; un sistema de solicitudes integrado que reemplaza el flujo por correo; sincronización automática con Google Calendar, un calendario por aula; compatibilidad total con el formato de ficheros heredado para no romper el ecosistema existente; consulta pública sin autenticación, conservando lo que ya ofrecía el sistema anterior; y una vista de calendario interactiva completa. El sistema anterior no era solo problemas: su modelo de datos reflejaba necesidades académicas reales, y varios puntos de partida se conservan — el modelo de recurrencia, el presupuesto de horas lectivas por grupo, los enlaces al GIS y al SIES, y el catálogo bilingüe. La aplicación no extiende el visualizador heredado: es un sistema nuevo construido desde cero. Pero no parte de cero en su modelo de dominio."

*(~50 s)*

---

## Diapositiva 5 — Arquitectura: la primera decisión de diseño

### Contenido
**¿Monolito o microservicios?** → Se optó por microservicios con API Gateway

| Razón | Detalle |
|-------|---------|
| Ritmos de evolución distintos | Auth y planificación cambian por separado, sin riesgo cruzado |
| Coste computacional distinto | Planificación escala sola (calendarios, exportación, sync) |
| Despliegue de bajo riesgo | Actualizar un servicio no reinicia los demás |

- 3 servicios backend + 1 gateway: auth, usuarios, planificación, gateway
- 2 bases de datos: una compartida por auth+usuarios, otra exclusiva de planificación
- Docker Compose (dev / VM universitaria / Azure)

### Guion
> "La primera decisión fue: ¿un único sistema integrado o servicios independientes? Se optó por microservicios con API Gateway, por tres razones concretas, no por tendencia tecnológica. Primero, autenticación y planificación evolucionan a ritmos distintos: un cambio en el sistema de contraseñas no debe poder romper el calendario, y con un monolito ambos módulos comparten ciclo de despliegue. Segundo, el servicio de planificación es computacionalmente más costoso — genera calendarios completos, exporta, sincroniza con Google Calendar — y puede escalar de forma independiente. Tercero, despliegue de bajo riesgo: actualizar el servicio de usuarios no requiere reiniciar el de planificación, y si algo falla, solo el servicio afectado se detiene. El resultado son siete componentes desplegables: el frontend, el gateway, tres servicios backend — autenticación, usuarios y planificación — y dos bases de datos relacionales. Autenticación y usuarios comparten una misma base de datos, porque ambos dominios están fuertemente relacionados entre sí; planificación tiene la suya propia y exclusiva, separada precisamente porque es el dominio que más se aísla del resto. Todo corre en Docker Compose, con configuraciones para desarrollo, VM universitaria y Azure."

*(~55 s)*

---

## Diapositiva 6 — El modelo de datos: una restricción institucional

### Contenido
**El camino no tomado:** modelo de eventos concretos encadenados (como Google Calendar) — cada clase como registro con fecha exacta

**El camino elegido:** patrones de recurrencia para eventos periódicos — día de la semana + carácter de periodicidad; sin fecha almacenada (los eventos puntuales sí guardan fecha exacta, como cualquier cita concreta)

- **Razón:** otras aplicaciones de la EII (asignación de horarios al alumnado, jefatura de estudios) consumen los mismos ficheros de texto plano — hay que poder regenerarlos exactamente igual
- **Coste asumido conscientemente:** calcular fechas al vuelo en cada consulta es la operación más costosa del sistema

### Guion
> "Para representar los eventos del horario, la opción más natural habría sido copiar el modelo que usa Google Calendar y la práctica totalidad de aplicaciones de calendario: eventos concretos, cada clase como un registro independiente con su fecha exacta, encadenados como ocurrencias de una serie. Esa opción se descartó deliberadamente. El sistema heredado de la EII, y el resto de aplicaciones de su ecosistema — incluida la que asigna horarios individuales al alumnado — no funcionan así: describen una clase recurrente por su día de la semana, un carácter de periodicidad, y las horas totales planificadas para el grupo, no por una lista explícita de fechas. Para que TeachingPlanner pudiera importar y exportar esos mismos ficheros de texto sin romper el resto del ecosistema, el modelo de dominio tenía que respetar esa misma estructura: los eventos periódicos no almacenan fechas, los grupos llevan un presupuesto de horas, y los días lectivos llevan caracteres que dirigen la expansión. Con el modelo de eventos concretos, generar esos ficheros de exportación habría exigido una transformación inversa compleja, con riesgo real de pérdida de información. Con el modelo de patrones, la exportación es una transcripción directa y la importación una reconstrucción fiel. El coste que se asume conscientemente: generar la vista de calendario exige expandir los patrones de recurrencia en tiempo real cada vez que se consulta, en lugar de simplemente leer fechas ya guardadas. Es la operación más costosa del sistema, y la que generó el problema técnico más importante del proyecto, que veremos en un momento."

*(~65 s)*

---

## Diapositiva 7 — El motor de planificación: cómo funciona

### Contenido
Los eventos **periódicos** no guardan fecha — guardan la **regla**. (Los eventos **puntuales** sí tienen fecha exacta, como una cita concreta). Tres mecanismos rigen la expansión de los periódicos:

1. **Tipo de recurrencia** — Normal / Par / Impar / Personalizado
2. **Presupuesto de horas** — los puntuales se incluyen siempre y consumen presupuesto primero, sin importar su fecha; los periódicos solo rellenan las horas que quedan libres
3. **Rotación entre grupos (algoritmo round-robin)** — mismo día/hora → reparto equitativo de sesiones entre grupos, ninguno acumula más que otro antes de agotar su presupuesto

### Guion
> "El sistema distingue dos tipos de eventos. Los eventos puntuales sí tienen una fecha concreta guardada, como cualquier cita en un calendario normal. Pero los eventos periódicos no almacenan ninguna fecha: almacenan la regla, 'esta clase ocurre todos los martes', y las fechas concretas se calculan cada vez que se consulta el calendario. Esa expansión sigue tres mecanismos. Primero, el tipo de recurrencia: normal aparece todas las semanas lectivas, par y impar solo en esas semanas, y personalizado solo en los días marcados con un código específico. Segundo, el presupuesto de horas: cada grupo tiene horas lectivas planificadas para el semestre. Los eventos puntuales de ese grupo se incluyen siempre, sin ninguna condición — no compiten por orden de fecha con nada. Sus horas se restan primero del presupuesto total, y solo con lo que queda libre se van generando eventos periódicos, hasta agotarlo. Esto significa que si un puntual ya consume todo el presupuesto, ese grupo no tendrá ningún evento periódico ese semestre, aunque cronológicamente algún periódico caería antes que el puntual: el puntual no gana por ir primero en el tiempo, gana porque siempre tiene prioridad absoluta sobre el presupuesto. Tercero, la rotación entre grupos: cuando varios grupos comparten el mismo día y franja horaria — por ejemplo, dos grupos de laboratorio que solo caben de uno en uno en la misma aula el mismo martes a las nueve — el sistema aplica un algoritmo round-robin, el mismo principio que reparte turnos por rondas: la primera semana le toca al grupo A, la segunda al grupo B, la tercera otra vez al A, y así sucesivamente, en vez de agotar primero todas las sesiones de un grupo y luego las del otro. El resultado es que, al final del semestre, ningún grupo ha recibido más clases que otro — reproduce automáticamente la alternancia que en el sistema antiguo había que calcular y cuadrar a mano."

*(~50 s)*

---

## Diapositiva 8 — El problema más difícil que se encontró

### Contenido
**Síntoma:** conflictos de aula en clases semanales normales no se detectaban

**Causa:** el detector consultaba la BD directamente, pero los eventos "Normal" no tienen fechas guardadas — se calculan a partir del calendario lectivo

| Opción | Ventaja | Inconveniente |
|--------|---------|----------------|
| Reimplementar la expansión en el detector | Más rápido | Duplica lógica, riesgo de divergencia |
| **Reutilizar el generador de calendario** (elegida) | Sin duplicación, correcto por construcción | Más costoso computacionalmente |

> Nota para la defensa: la causa y la solución final están documentadas en la memoria (capítulo 2, incidente I6); la comparación de las dos alternativas es razonamiento técnico propio a partir del código, no una cita literal — tenlo presente por si preguntan de dónde sale exactamente esa tabla.

### Guion
> "Durante las pruebas apareció un error en la detección de conflictos para las clases semanales ordinarias, el tipo de evento más común en cualquier horario. El síntoma: al reservar un aula para una clase puntual, el sistema no detectaba el conflicto con las clases semanales que ya ocupaban esa aula. Los conflictos pasaban desapercibidos, exactamente como en el sistema antiguo que se quería sustituir. La causa: el mecanismo de detección consultaba directamente la base de datos para saber qué eventos periódicos caen en un día concreto, pero para los eventos de tipo Normal esa información no está guardada — se calcula a partir del calendario lectivo. La consulta siempre devolvía vacío. Había dos opciones: reimplementar la lógica de expansión dentro del propio detector, más rápido pero duplicando lógica compleja con riesgo de que las dos implementaciones divergieran; o reutilizar el generador de calendario completo como fuente de verdad, sin duplicación y correcto por construcción, aunque más costoso computacionalmente. Se eligió la segunda: el generador ya estaba probado y correcto, y mantener dos implementaciones en paralelo era un riesgo real. El coste computacional adicional es aceptable para la escala de uso de la EII."

*(~60 s)*

---

## Diapositiva 9 — Segundo problema real: la cuota de la API de Google Calendar

### Contenido
**Diseño original:** sincronización incremental (propagar cada cambio al momento)

**Problema:** la cuota de Google Calendar es **compartida a nivel de proyecto**, no por usuario — 600 peticiones/min

- Cientos de eventos por semestre → agotaría la cuota en horas
- Detectado y resuelto en fase de análisis/diseño, antes de implementar la integración

**Decisión:** sincronización completa "borrar y recrear" bajo demanda manual, con límite propio de 400 req/min (margen de seguridad del 33%)

### Guion
> "El segundo problema técnico real no fue un bug, sino una limitación externa que obligó a rediseñar. El plan inicial era una sincronización incremental: cada cambio en el calendario se propaga a Google Calendar en el momento en que ocurre. El problema es que la cuota de la API de Google Calendar es compartida a nivel de todo el proyecto de Google Cloud, no por usuario, con un límite de seiscientas peticiones por minuto. Con cientos de creaciones, modificaciones y cancelaciones de eventos en un semestre, ese modelo agotaría la cuota disponible en pocas horas. Esto se detectó durante el análisis y diseño de la integración con Google Calendar, al comparar las dos alternativas antes de implementar ninguna, así que se pudo resolver sobre el papel sin necesidad de reescribir código ya construido. La decisión fue cambiar a una sincronización completa: borrar y recrear todos los eventos bajo demanda manual del administrador, con un limitador propio de cuatrocientas peticiones por minuto — un margen de seguridad del treinta y tres por ciento, porque el contador interno del servidor puede desincronizarse temporalmente del contador real de Google. Esto también llevó a restringir la sincronización solo a administradores, para controlar quién puede consumir esa cuota compartida."

*(~55 s)*

---

## Diapositiva 10 — Tres decisiones técnicas más

### Contenido
| Decisión | Elegido | En vez de | Por qué |
|----------|---------|-----------|---------|
| Base de datos | MariaDB (relacional) | MongoDB | Relaciones e integridad fuertes en el dominio académico |
| Frontend | React + Vite (SPA) | Next.js SSR | Ninguna página necesita indexación SEO — toda la gestión requiere login |
| TLS | Caddy | Nginx | Certificado GEANT ya emitido, sin necesidad de certbot |

### Guion
> "Tres decisiones técnicas más, con consecuencias reales. Base de datos relacional, MariaDB, en lugar de documental: el modelo académico tiene relaciones fuertes y restricciones de unicidad — si se borra una asignatura, desaparecen sus grupos; no puede haber dos aulas con el mismo código — y una base de datos relacional aplica esas garantías a nivel de motor, sin código adicional. Frontend en React con Vite como aplicación de una sola página, en lugar de Next.js con renderizado en servidor: esa tecnología aporta mejor posicionamiento en buscadores y carga inicial más rápida para contenido público indexable. Aquí sí existe una vista pública sin necesidad de iniciar sesión — la consulta de horarios — pero no es contenido que interese indexar en buscadores, y todas las páginas de gestión requieren login de todas formas. Por eso el renderizado en servidor no aporta nada relevante, y React con Vite tiene un ciclo de desarrollo mucho más rápido. Y TLS con Caddy en lugar de Nginx: el certificado de la universidad llega ya emitido, y Caddy lo acepta sin necesidad de scripts de certbot."

*(~40 s)*

---

## Diapositiva 11 — Calidad: cómo se verifica que funciona

### Contenido
**Sin mocks en tests del núcleo** — base de datos real en contenedor efímero

| Etapa CI/CD | Qué verifica |
|-------------|---------------|
| SonarQube | Code smells; umbral obligatorio de cobertura > 70% para fusionar a main |
| Integración (BD real) | 27 casos diseñados — 7 implementados hasta la fecha (restricciones, cascadas, unicidad) |
| E2E (Playwright) | 57 casos diseñados — 42 implementados en navegador real |
| Build + despliegue | VM universitaria o Azure |

- Desplegado en producción (VM Universidad de Oviedo) y presentado a la EII

### Guion
> "La decisión de testing más importante: no usar simulaciones. Para los tests del núcleo se tomó una decisión deliberada de no usar bases de datos mockeadas, sino una base de datos real en un contenedor efímero que se crea antes de cada suite y se destruye al terminar. La razón: la lógica más crítica del sistema — restricciones de unicidad, eliminaciones en cascada, integridad referencial — solo se manifiesta con una base de datos real; un mock no reproduce esas garantías, y una suite construida sobre mocks pasaría tests para código que falla en producción. El pipeline de CI/CD integra análisis estático con SonarQube, que exige más de un setenta por ciento de cobertura antes de poder fusionar a la rama principal. La suite de integración está diseñada para veintisiete casos sobre base de datos real, de los cuales siete están implementados hasta la fecha; la suite end-to-end está diseñada para cincuenta y siete flujos completos en Playwright sobre navegador real, de los cuales cuarenta y dos están implementados. El resto queda como trabajo de testing pendiente, no como carencia oculta. Y build y despliegue a la VM universitaria o a Azure. El pipeline se activa de forma manual y deliberada, no en cada push. La aplicación está desplegada en una VM de la Universidad de Oviedo y se presentó formalmente al personal de la EII como candidata para sustituir el sistema actual."

*(~55 s)*

---

## Diapositiva 12 — Conclusiones y trabajo futuro

### Contenido
**Conclusiones**
- Sistema desplegado, funcional y presentado formalmente a la EII
- Los problemas de partida (edición manual, errores silenciosos, correo) están resueltos
- Todas las decisiones técnicas respondieron a restricciones reales, no fueron arbitrarias
- El dominio académico resultó más complejo de lo estimado — el motor de planificación completo llevó más tiempo del previsto, absorbido con el colchón de contingencia sin recortar alcance

**Trabajo futuro**
- Autenticación Microsoft (cuentas institucionales `uoXXXXXX@uniovi.es`)
- Interfaz de auditoría
- Undo/redo en el calendario
- Notificaciones en tiempo real (WebSockets)
- WAF y rate limiting

### Guion
> "Para concluir: el objetivo principal está cumplido — la EII tiene un sistema desplegado, funcional y presentado formalmente como sustituto del actual. Los problemas de partida (edición manual en el servidor, errores silenciosos, solicitudes por correo) están resueltos. Todas las decisiones técnicas tuvieron restricciones reales detrás — la compatibilidad con el ecosistema de ficheros, la cuota de la API de Google, la disponibilidad del portal universitario de Azure — ninguna fue arbitraria. Una lección honesta del proyecto: el dominio académico resultó más complejo de lo estimado inicialmente. El motor de planificación — el sistema de caracteres de recurrencia, el presupuesto de horas, la detección de conflictos — llevó bastante más tiempo de implementación del que se había previsto en la planificación. Se absorbió reajustando el orden del backlog y con el colchón de contingencia de dos semanas, sin recortar ninguna funcionalidad ni retrasar la entrega. El trabajo demuestra que una arquitectura de microservicios con CI/CD y despliegue real en producción es abordable dentro de un TFG si las decisiones se toman con criterio desde el principio, y si la planificación deja margen para la complejidad real del dominio. Como trabajo futuro queda: autenticación con cuentas de Microsoft de la universidad, que requería un registro institucional fuera del alcance del TFG; una interfaz de auditoría, ya que los campos de trazabilidad están en la base de datos pero falta la UI; undo/redo en el calendario; notificaciones en tiempo real por WebSockets cuando se aprueba o rechaza una solicitud; y WAF con rate limiting antes de cualquier despliegue más amplio."

*(~65 s)*

---

## Diapositiva 13 — Demostración

### Contenido
- A continuación, vídeo de demostración de la aplicación
- *(~10 minutos)*

### Guion
> "A continuación se proyecta el vídeo de demostración de la aplicación."

*(~5 s)*
