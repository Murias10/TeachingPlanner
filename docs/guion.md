# Guion — TeachingPlanner

> **Duración objetivo:** ~16 min 4 s de exposición oral (recalculado a ritmo natural de ~140 palabras/minuto)
> **Formato total:** presentación (~16 min) + vídeo demo (~12 min) + preguntas
>
> **Guía de tiempo por sección:**
> - Portada (diapositiva 1): ~14 s
> - Motivación: complejidad del dominio, sistema anterior, consecuencias (diapositivas 2–4): ~3 min 18 s
> - Objetivos (diapositiva 5): ~45 s
> - Roles: qué puede hacer cada uno (diapositiva 6): ~72 s
> - Motor de planificación: presupuesto de horas y patrones (diapositivas 7–8): ~2 min 55 s
> - Solicitudes de profesores y Google Calendar (diapositivas 9–10): ~66 s
> - Más decisiones técnicas (diapositiva 11): ~111 s
> - Monolito o microservicios (diapositiva 12): ~57 s
> - Validación con feedback real: problemas reales + flujo de GitHub (diapositiva 13): ~91 s
> - Calidad y despliegue (diapositiva 14): ~72 s
> - Conclusiones y trabajo futuro (diapositiva 15): ~58 s
> - Cierre / paso a demo (diapositiva 16): ~5 s
>
> **Nota:** recalculado por conteo de palabras del guion a ~140 palabras/minuto (ritmo natural hablado con pausas). Se eliminó la diapositiva "Unlinking the Google Account" (Google Calendar sync es exclusivo de Administrator en la app real, no tiene sentido dedicarle una diapositiva propia de desvinculación separada). Las antiguas diapositivas 7-8-9 (patrones, presupuesto de horas simple, presupuesto de horas compartido) se fusionaron en 2: primero "Sharing the Hour Budget", después "Patterns Versus Concrete Dates" (con la caché en memoria por calendario). Las antiguas 14-15 (flujo con el cliente + GitHub como canal) también se fusionaron en una sola diapositiva, con las capturas del issue #31 justo debajo del contenido conceptual. La diapositiva 2 se recortó de ~90 s a ~68 s quitando relleno. La diapositiva 6 creció al pasar de lista de roles a diagrama de casos de uso (~52 s a ~72 s), y la diapositiva 11 (antes 13) creció al añadir las dos decisiones previas que pidió el tutor (~44 s a ~111 s). El total (~16 min 4 s) sigue por encima del límite de 15 min de ambos tutores — conviene recortar antes de la defensa, y ensayar en voz alta para confirmar el tiempo real.
>
> **Cómo usar este documento:** el guion de cada diapositiva es lo que se dice en voz alta mientras esa diapositiva está proyectada (ver el contenido en pantalla en `presentacion.md`). No se lee literalmente, es apoyo para practicar.

---

## Diapositiva 1 — Cover

> "Good morning. I'm going to present TeachingPlanner, a web system for managing academic schedules. I developed it for the School of Computer Engineering at the University of Oviedo, as my Final Degree Project."

*(~14 s)*

---

## Diapositiva 2 — The Complexity of University Scheduling

> "Coordinating a university schedule means organizing hundreds of weekly sessions in a limited number of classrooms, with no overlaps.
>
> This schedule comes from last year's Teaching Organisation Plan, or POD, and keeps changing during the year, with changes in teachers, classrooms, and exams.
>
> A generic calendar app, like Google Calendar, can't handle this. Every teaching period has its own start and end date, and holidays change the schedule in ways it doesn't understand. Classes can also repeat in patterns it doesn't support, like every other week. Each group has an hour budget for the semester, from the POD. And it has no real concept of a group or a classroom as connected entities, so it can't detect a real conflict, like two groups assigned the same classroom at the same time. There's also a scale problem: a semester generates thousands of events, hundreds in the same week, so you need real filtering by degree, course, subject, group, or classroom."

*(~68 s)*

---

## Diapositiva 3 — The Previous System

> "The old EII system had two parts: a public viewer, and the data behind it, stored in plain text files.
>
> The viewer offered three formats: a web list, a table, and CSV export. You could pick which groups to show with checkboxes, and it linked directly to the university's GIS system to find each classroom. It also correctly split schedules by semester, and administrators had their own filters, by professor, by group, and by date range.
>
> The old system did meet all those complexity requirements we just covered, and it worked well for years. This is the data model that TeachingPlanner keeps as its starting point.
>
> To make a change, you had to connect through SSH to the virtual machine running the old PHP application, and edit those plain text files by hand. This actually worked as a practical solution: editing the file, you could manage new events and changes reasonably well. The real issue was that it required understanding the domain: the file format, the letter codes, the structure behind it. For someone without that knowledge, it was hard to use. That created a bottleneck: only one specialist could really make changes during the year, because there was no interface for anyone else."

*(~86 s)*

---

## Diapositiva 4 — Operational Consequences

> "The data model worked well, as we just saw. But there were real problems in daily use. If someone made a typing error, the system didn't warn them. The wrong data was just saved, sometimes silently breaking a group's schedule with no error message. The system also didn't check for overlaps, so a classroom could be booked twice at the same time, with no warning.
>
> Change requests were sent by email, with long threads and no way to track them. Every change also had to be copied by hand into Google Calendar. And the viewer didn't work on phones or tablets.
>
> The system failed quietly, and it wasted time, little by little. Everything pointed to the same answer: we needed one central web platform, with a real interface and automatic checks. That is exactly what this project is about."

*(~44 s)*

---

## Diapositiva 5 — Objectives

> "This project has eight objectives. The first two have the biggest effect on daily use: an interactive calendar view, and a fast filter system that combines degree program, year, subject, group, and classroom.
>
> The other objectives are: a web interface for administration, conflict detection in real time, a request system that replaces email, sync with Google Calendar, full support for the old file format, and public access without a login.
>
> The old system wasn't only problems, though. Some good parts are kept: the recurrence model, the hour budget for each group, and the links to GIS and SIES. So this is a new system, built from scratch, but it doesn't throw away what already worked."

*(~45 s)*

---

## Diapositiva 6 — Roles: What Each One Can Do

> "Before I explain the architecture, let me clarify the three roles. This use case diagram shows it better than a long list: each role builds on top of the previous one.
>
> The guest can browse the schedule and the academic catalog, and export the calendar as a CSV file. No login needed.
>
> The professor can do all of that, plus log in, manage their own account, and manage their own change requests.
>
> The administrator can do everything above, plus manage the academic structure and calendars, manage events with automatic conflict detection, review and approve or reject professor requests, manage users, import or export the legacy TXT format, and manage the Google Calendar sync.
>
> One last detail that has no actor at all: the system automatically logs who created or changed each record, and when. This auditing happens in the background, with no extra action from anyone."

*(~72 s)*

---

## Diapositiva 7 — Sharing the Hour Budget

> Every group has an hour budget for the semester: a fixed number of teaching hours it's meant to receive. The system has to fill that budget with real sessions.
>
> To explain how, let's first define what an event is here: a time slot linked to a group and a classroom, with a specific type. A normal class has one group and one classroom. Special events can have more than one of each.
>
> Not every event touches that budget, though. The Class type does. Special event types, review, evaluation, independent, and others, book a time slot without consuming any hours. They can be periodic or one-off, just like a class, and they only exist inside the app, never in the text files.
>
> For everything else, there are two kinds of events: one-off, with one exact date, and recurring, repeating on a pattern. One-off events always come first, taking hours from the group's budget unconditionally, no matter when they happen in the calendar. Recurring events use whatever is left, one session at a time. And the type of recurring series doesn't matter, Normal, Even, Odd, or Custom, they all compete for the same budget, with no priority between them.
>
> A real example: group Est.T.I-1, with an 8-hour budget. Its real weekly class is on Tuesdays. I also add a class every other Wednesday, plus a one-hour one-off makeup class, to show all the types competing for the same 8 hours. Remove the one-off first, 7 hours are left. With two-hour classes, that's three full ones, using 6 hours, one hour still left over. The fourth class doesn't fully fit, so the system still creates it, but shortens it to that last hour instead of skipping it."

*(~118 s)*

---

## Diapositiva 8 — Patterns Versus Concrete Dates

> "This is the real reason patterns win over fixed records, like Google Calendar's one event per occurrence. Imagine a group already has its weekly series generated, and a new one-off event gets added later, a makeup class. That event takes hours from the group's budget, so the series has to shrink somewhere, maybe the last session gets shorter, maybe one gets dropped. With one record per occurrence, you'd have to find and update every future occurrence by hand, every time. With patterns, nothing needs to be touched: it's recalculated automatically the next time someone asks for it.
>
> This is the most expensive operation in the system. To keep that cost down, the result is cached in memory per calendar, and only recalculated when something in that calendar actually changes."

*(~60 s)*

---

## Diapositiva 9 — Professor Change Requests

> "Professor requests follow a simple process. A professor can ask to create, edit, cancel, or replace an event, even without knowing the exact classroom or time yet. The request stays pending, and the professor can cancel it at any time.
>
> If they don't cancel it, the administrator checks it, fills in any missing details, and then approves or rejects it.

*(~25 s)*

---

## Diapositiva 10 — Google Calendar Sync

> "The Google Calendar sync only goes one way, and the administrator starts it by hand. The system groups events by classroom, and it uses one Google Calendar for each room. If a calendar already exists, it reuses it. Creating a new calendar is the most limited action in Google's API, so the system never creates one again once it exists. Instead, it just deletes the old events and adds the new ones.
>
> Google also limits how many requests you can send. So if a request fails, the system tries again automatically, waiting a bit longer each time, up to five tries. Each retry repeats the same process for all classrooms: delete, then insert. If it still fails after five tries, the system marks it as an error, and the administrator decides when to try again."

*(~41 s)*

---

## Diapositiva 11 — More Technical Decisions

> "Here are four more technical decisions that really mattered.
>
> Before choosing between databases, there was an earlier decision: moving away from plain text files as the way to store data, and using a real database instead. That choice was easy, for clear reasons: text files can't check data, can't handle several users at once, and don't scale well. Once that was decided, the next question was which type of database. I chose MariaDB instead of MongoDB, because academic data has strong relationships, and a relational database can check all of that directly.
>
> There was also an earlier decision behind the calendar component. Before picking a specific library, I first had to decide between building a simple, basic calendar, or a full interactive one, with more features but more work. I chose the interactive option, because it matches how people actually use a calendar day to day. Given that, the next choice was which library to use. I chose react-big-calendar instead of FullCalendar. FullCalendar needs a paid license for its advanced features. react-big-calendar is free, and it works naturally with React.
>
> For the frontend, I used React with Vite, instead of Next.js with server rendering. The app doesn't need SEO, and every feature needs a login anyway, so a rendering server would just add complexity with no real benefit.
>
> And for TLS, I used Caddy instead of Nginx. Both work fine, but Caddy can use the university's GEANT certificate directly. That means no extra tools like certbot, and simpler configuration."

*(~111 s)*

---

## Diapositiva 12 — Monolith or Microservices

> "Should this be one single system, or separate services? I chose microservices with an API Gateway, for three reasons. First, authentication and scheduling change at different speeds, and don't depend on each other. Second, scheduling needs more computing power and can scale on its own, for things like calendars, exports, and sync. Third, this makes deployment safer: if one service fails, only that one stops, not the whole system. In total there are seven parts: the frontend, the gateway, three backend services, and two databases. Auth and users share one database, because they are closely related. Scheduling has its own database, because it's the most independent part. All of this runs with Docker Compose, in three environments: local development, the university VM, and Azure.
>
> And this is not just theory. If the users service or the authentication service goes down, people can still see the public schedule, and the calendars still work. Here's why: the JWT token has its own signature, and every service shares the same secret key. So each service can check the token by itself, without asking authentication every time. Only the features that truly depend on the failing service stop working."

*(~57 s)*

---

## Diapositiva 13 — A Structured Client Workflow

> "There's one part of this project that doesn't show up in the code, but it was still important: how I worked with my tutors. They acted as the real client. Instead of scattered emails, I used GitHub Issues. Emails have the same tracking problem I mentioned earlier with professor requests: things get lost. With GitHub Issues, every question, bug, or improvement got its own thread, with context and screenshots, until we reached a final decision. In total, there were forty-five issues. I used them for bugs, improvements, questions, and even to reject ideas that didn't fit.
>
> I'll show you one of them as an example. I picked this one because it's easy to read on screen, not because it's the most important one. What matters is the process behind it, and that same process repeats in all the other forty-four.
>
> Every time a tutor had a question, they opened a new issue on GitHub. That issue stays open until we have a clear answer. It's the same idea as the professor requests: nothing gets solved through messages that get lost later.
>
> I answer inside that same issue, with screenshots. If my answer doesn't solve the problem, we reopen the same issue, instead of creating a new one. This way, the whole history stays in one place, easy to find later.
>
> At the end, the final answer gets linked to one commit in the code. This is the key part: once that commit exists, I can run the pipeline, and it sends the fix to production automatically. We'll see how in the next slide, about quality and deployment. The cycle is short: find the problem, decide the fix, write the code, and deploy it."

*(~91 s)*

---

## Diapositiva 14 — Quality and Deployment

> "After we closed issue thirty-one, the pipeline sent the fix to production. One key decision about testing: I don't use fake databases. The core tests run on a real database, inside a temporary container. This way, all the database rules are really checked, not just simulated.
>
> The pipeline has these steps. Static analysis with SonarQube. Integration tests. End-to-end tests with Playwright, in a real browser. Then the Docker images are built and pushed to the registry. These steps are the same for both environments.
>
> Deployment is where it changes. For Azure, GitHub Actions connects to the VM directly, using SSH. But the university's VM has no open ports, so nothing can connect to it from outside. The solution was a self-hosted runner, installed inside that VM. All the deployment happens locally, inside the VM itself. The runner only makes two outgoing connections: one to check for new jobs, and one to download the Docker images. This gives the same result as Azure, but the university firewall stays closed.
>
> In both environments, I trigger the pipeline by hand, I don't run it on every change. Test coverage is still growing, but the important part is that this is a real, working pipeline, in two very different networks, and the system is fully deployed on the University of Oviedo's VM."

*(~72 s)*

---

## Diapositiva 15 — Conclusions and Future Work

> "To finish, the main goal is done. The EII now has a working system, ready to be deployed, and formally presented as a replacement for the old one. The original problems are solved.
>
> One important lesson: this academic domain was harder than I thought, and that took real extra time. Part of that came from new features that appeared while I was building the project, not from the original plan. Things like conflict checks and the professor request system. Nobody asked me for these, I proposed them myself, because I thought they added a lot of value, both in what the system could do and in how well it worked. They did add real value, but they also needed more time than I expected, and that added to the delay.
>
> Looking forward, there are five planned improvements. Login with university accounts, so professors don't need a separate password. A log that tracks who changed what, and when. Undo and redo for calendar changes. Live notifications when a request gets approved or rejected. And better security, with a firewall for web attacks and limits on how many requests someone can send."

*(~58 s)*

---

## Diapositiva 16 — Demonstration

> "A continuación se proyecta el vídeo de demostración de la aplicación."

*(~5 s)*
