# Chapter 3 — STAKEHOLDER REQUIREMENTS

---

## 3.1 System Scope

### 3.1.1 Context and origin of the project

TeachingPlanner is a project commissioned by the School of Computer Engineering (EII) of the University of Oviedo to replace the academic schedule management system currently in use. It is a real commission from the institution itself, motivated by the accumulated operational limitations of the legacy system, which over time have increasingly hindered the work of administrative and teaching staff.

The application is currently deployed on a university virtual machine, accessible through the institutional VPN, and has been formally presented to the EII staff as a proposal to replace the system in production. This chapter collects the requirements identified during the analysis process prior to development, organised from the perspective of users and other stakeholders.

### 3.1.2 Current system (AS-IS)

To understand the scope of the project, it is necessary to know how the schedule management currently works at the EII. The legacy system consists of two independent components: a **public viewer** deployed on the university servers, which allows consulting the group schedules in three formats (web list, table and CSV for Google Calendar) and includes links to the GIS system to locate each classroom; and a set of **five plain text files** per semester that feed this viewer and whose maintenance is completely manual.

There is no web administration interface. All data management is performed by connecting via SSH to port 22 of the virtual machine that hosts the application and directly editing the files with a command-line editor. The five files use the `:` character as a field separator and have the following purposes:

- `asignaturas.txt` — catalogue of subjects with their groups by type (theory, seminar, laboratory, group tutoring) and language (Spanish and English).
- `calendario.txt` — academic calendar, with each date tagged with a letter code indicating the type of session on that day.
- `horarios.txt` — recurring events, linking each group to a day of the week, a time slot and a classroom.
- `excepciones.txt` — one-off events and cancellations.
- `ubicaciones.txt` — mapping between the classroom code and its URL in the university's GIS system.

> 📷 **Suggested figure 1 — Fragment of `horarios.txt` opened in an SSH session**, illustrating the manual command-line editing process.

This approach has significant limitations in four areas:

**No format or conflict validation.** If a syntax error is introduced when editing a file, the system does not detect or warn about it: erroneous data is silently recorded. Similarly, when saving a change, it is not checked whether it generates overlaps with other events: a classroom can be assigned twice at the same time without the system issuing any warning.

**Fragility of the letter code mechanism.** The periodicity of non-weekly groups depends on the letter code in `calendario.txt` and in `horarios.txt` being exactly the same in both files. A different capitalisation or an extra space causes the group to silently disappear from the published schedule without producing any visible error.

**Email-based change request process.** When a professor needs to modify a class, the usual channel is email to the head of studies. This process can lead to long email chains that are difficult to manage, with the risk of misunderstandings and unanswered messages. The professor has no tool to know in advance whether their request generates a conflict.

**Manual double maintenance and lack of interoperability.** There is another application in the EII ecosystem that feeds on the same Google Calendars and the same `.txt` files. Any change in the schedules must be propagated manually both to the files and to the corresponding Google Calendar, creating a double maintenance process prone to desynchronisations. In addition, the viewer lacks responsive design and does not work correctly on mobile devices.

> 📷 **Suggested figure 2 — Screenshot of the legacy viewer on a mobile device**, showing the absence of responsive design.

### 3.1.3 System objectives (TO-BE)

TeachingPlanner is a web application developed from scratch to replace the system described above and resolve all the identified limitations. The objectives of the new system are:

- Provide a **complete web administration interface**, accessible from any browser without requiring technical knowledge, which allows managing all the academic information (degrees, courses, subjects, groups, classrooms, calendars and events) with validated forms and immediate feedback.
- **Automatically detect scheduling conflicts** before confirming any assignment or change, preventing erroneous overlaps from being saved.
- Incorporate an **integrated change request system** that replaces the email-based workflow, with visibility of the status for both the professor and the administrator at all times.
- **Automatically synchronise with Google Calendar**, generating an independent calendar per classroom so that other applications in the EII ecosystem can consume always-up-to-date data without manual intervention.
- **Maintain compatibility with the legacy system**, allowing the import and export of the five `.txt` files to facilitate initial migration and coexistence with other tools that depend on this format.
- Preserve the **public schedule consultation without authentication**, equivalent to the functionality of the existing viewer, and add CSV export compatible with Google Calendar for students' use.
- Offer a **responsive** interface that works correctly on mobile devices and is **fully internationalised** in Spanish and English.

### 3.1.4 Stakeholders

| ID | Stakeholder | Role in the system | Main needs |
|---|---|---|---|
| STK-01 | Academic Affairs Office (EII) | Client and main user (administrator) | Eliminate manual file editing; automatic conflict detection; integrated request management; change traceability |
| STK-02 | EII teaching staff | Secondary user (professor) | Consult their own schedule; submit change requests without using email; synchronise with personal Google Calendar |
| STK-03 | Students and general public | Read-only user | Access published schedules without authentication, from any device |
| STK-04 | Other applications in the EII ecosystem | Dependent external system | Continue receiving the five `.txt` files and Google Calendars in the expected format, without manual intervention |
| STK-05 | IT Service (SUTIC) | Infrastructure owner | System deployable on the university's VM and maintainable with Docker |
| STK-06 | Development team (TFG) | Developer | Clear requirements and achievable scope within the framework of the Final Degree Project |

---

## 3.2 User Requirements

### Functional requirements

**UR1 — System access and profile**

**UR1.1.** The system shall allow registered users to log in using their email address and password.

**UR1.2.** The system shall allow users to recover access to their account if they have forgotten their password, by means of a verification code sent to their email address.

**UR1.3.** The system shall allow authenticated users to close their active session.

**UR1.4.** The system shall allow authenticated users to consult and modify their own profile data and change their password.

**UR1.5.** When the administrator creates a new account, the user shall receive an email with a link to activate the account and set a personal password.

**UR1.6.** The system shall allow authenticated users to link their account with a Google account to enable the synchronisation of academic calendars with Google Calendar, and unlink it when necessary.

---

**UR2 — User management** *(administrator only)*

**UR2.1.** The system shall allow the administrator to register new users individually, assigning them a role (administrator or professor).

**UR2.2.** The system shall allow the administrator to import users in bulk from an Excel file.

**UR2.3.** The system shall allow the administrator to consult and search the list of registered users, filtering by role and status.

**UR2.4.** The system shall allow the administrator to modify the data and role of an existing user, with the necessary safeguards to avoid losing the last active administrator.

**UR2.5.** The system shall allow the administrator to delete a user from the system.

**UR2.6.** The system shall allow the administrator to resend the activation email to users who have not yet activated their account.

**UR2.7.** The system shall manage three access profiles with differentiated levels: administrator (full access), professor (schedule consultation and own change requests) and guest user (public read-only access without an account).

---

**UR3 — Academic structure management** *(administrator only)*

**UR3.1.** The system shall allow the administrator to manage degrees (create, consult, edit, delete).

**UR3.2.** The system shall allow the administrator to manage the academic courses associated with a degree, including tracking their status through a one-way lifecycle (planned → active → completed).

**UR3.3.** The system shall allow the administrator to manage the subjects associated with a degree.

**UR3.4.** The system shall allow the administrator to manage the groups within a subject, specifying type (theory, seminar, laboratory, group tutoring), language and planned teaching hours.

**UR3.5.** The system shall allow the administrator to manage the classrooms, including an optional link to their geographical location in the institutional GIS system.

---

**UR4 — Academic calendar management** *(administrator only)*

**UR4.1.** The system shall allow the administrator to create an academic calendar for a given semester through any of three available modes: (a) manual creation, specifying start and end dates and selecting holidays; (b) import from the legacy system's `.txt` files (see UR9.2); or (c) duplication of an existing calendar (see UR4.4).

**UR4.2.** The system shall allow the administrator to mark individual days of the calendar as holidays or non-lective, and restore their lective condition.

**UR4.3.** The system shall allow the administrator to consult and filter the list of existing calendars.

**UR4.4.** The system shall allow the administrator to duplicate an existing calendar to create a new one for another academic course or semester, preserving the structure of recurring events and the distribution of holidays.

**UR4.5.** The system shall allow the administrator to delete a calendar and all its associated data.

---

**UR5 — Event management** *(administrator only)*

**UR5.1.** The system shall allow the administrator to create recurring events (classes that repeat with a weekly pattern, bi-weekly on even weeks, bi-weekly on odd weeks, or with a custom pattern), assigning them to groups, classrooms and a time slot.

**UR5.2.** The system shall allow the administrator to create one-off events on a specific date.

**UR5.3.** The system shall allow the administrator to modify an existing event (recurring or one-off).

**UR5.4.** The system shall allow the administrator to cancel a specific occurrence of a recurring event without affecting the rest of the series.

**UR5.5.** The system shall allow the administrator to delete events (a specific occurrence or a complete series).

**UR5.6.** The system shall allow the administrator to revert the cancellation of a previously cancelled one-off event.

**UR5.7.** Before saving any creation or modification of an event, the system shall automatically detect scheduling conflicts with other events already registered for the same group or classroom, and shall prevent saving until the conflict is resolved.

---

**UR6 — Schedule consultation** *(all users, including the unauthenticated guest user)*

**UR6.1.** The system shall allow anyone to consult the published academic schedules without the need to authenticate. Unauthenticated users shall only be able to access the calendars of academic courses in the active state.

**UR6.2.** The system shall allow the user to select the calendar to consult based on the degree, academic course and semester.

**UR6.3.** The system shall display the events of the selected calendar in a calendar view, offering at least the following modes: full week, work week, day, and month.

**UR6.4.** The system shall allow filtering the visible events by multiple criteria: group year, subject, group type, specific group, classroom, language and event type.

**UR6.5.** The system shall allow the user to consult the complete details of an event by selecting it in the calendar.

**UR6.6.** The schedule consultation interface shall work correctly on mobile devices and shall automatically save the user's filter selections between sessions.

---

**UR7 — Change requests** *(the professor creates; the administrator manages)*

**UR7.1.** The system shall allow the professor to create change requests for calendar events without the need to use email, offering four types of request: create a new event, edit an existing event, cancel an occurrence, or replace an occurrence with a new event.

**UR7.2.** The system shall allow the professor to consult the list of their own requests and view their current status and the reviewer's comments.

**UR7.3.** The system shall allow the professor to delete their own requests that are pending review.

**UR7.4.** The system shall allow the administrator to consult the list of all received change requests, filtering by status, degree and calendar.

**UR7.5.** The system shall allow the administrator to approve a pending request, with the option to adjust the schedule details before confirming. After approval, the corresponding action shall be executed automatically in the calendar.

**UR7.6.** The system shall allow the administrator to reject a pending request, with an optional indication of the reason.

---

**UR8 — Google Calendar synchronisation** *(administrator only)*

**UR8.1.** The system shall allow the administrator to synchronise a complete academic calendar with Google Calendar, creating an independent Google Calendar for each classroom and publishing in it the events of the academic calendar corresponding to that classroom.

**UR8.2.** The system shall allow the administrator to consult the synchronisation status of each academic calendar and see the progress in real time during synchronisation.

**UR8.3.** The system shall allow the administrator to delete the synchronisation of a specific academic calendar.

**UR8.4.** The system shall automatically renew the Google access tokens when they expire, without requiring manual intervention from the administrator.

---

**UR9 — Interoperability with the legacy system**

**UR9.1.** The system shall allow the administrator to export a complete academic calendar in the format of the legacy system (a ZIP file containing five `.txt` files).

**UR9.2.** The system shall allow the administrator to create a new academic calendar by importing the five `.txt` files from the legacy system.

**UR9.3.** The system shall allow the administrator to load exceptions onto an existing calendar from a `.txt` file, either by adding them to the existing exceptions or by replacing them completely.

**UR9.4.** The system shall allow any user to export the schedule of a semester in CSV format compatible with Google Calendar.

---

**UR10 — Auditing and traceability**

**UR10.1.** The system shall automatically record, for each managed entity, who created it, when it was created, who last modified it and when the last modification occurred. This record shall be performed automatically without requiring any additional action from the user.

---

### Non-functional requirements

| ID | Attribute | Description |
|---|---|---|
| RNF-01 | Availability | The system shall be operational 24/7 with a minimum annual availability of 99.5%. |
| RNF-02 | Performance | Routine operations (queries, entity creation) shall respond in less than 2 seconds under normal usage conditions. |
| RNF-03 | Portability | The system shall be deployable on the university infrastructure through Docker containers, without dependencies on the underlying operating system. |
| RNF-04 | Privacy | The system shall comply with the General Data Protection Regulation (GDPR) in the processing of users' personal data. |
| RNF-05 | Usability | The interface shall be accessible for administrator and professor profiles without prior technical training. Mandatory fields shall be clearly indicated and errors shall be described in an understandable way. |
| RNF-06 | Accessibility | The interface shall comply with the WCAG 2.1 level AA guidelines. |
| RNF-07 | Internationalisation | The interface shall be available in Spanish and English. |
| RNF-08 | Compatibility | The interface shall work correctly on the last two versions of Chrome, Firefox, Safari and Edge. |
| RNF-09 | Adaptability | The interface shall adapt to mobile, tablet and desktop devices. |
| RNF-10 | Security | All communications shall be encrypted via HTTPS. Passwords shall be stored encrypted and shall never be transmitted in plain text. |
| RNF-11 | Scalability | The system shall support at least 200 concurrent users without perceptible degradation of performance. |
| RNF-12 | Maintainability | The system shall have an automated test suite that validates the main functionalities before each deployment. |

> The detailed technical specification of each of these non-functional requirements — including specific values, tools and verification criteria — is provided in Chapter 4 (§4.2 Non-functional Requirements and §4.3 Test Plan).

---

## 3.3 Alternatives

### 3.3.1 Authentication system

The system requires managing the identity of users who access administration and teaching functions. Three alternatives were evaluated:

**Option A — Own authentication system** (email + password with email activation): provides full control over the access process and does not introduce external dependencies for the critical login function. Requires managing the complete lifecycle of credentials: secure password storage, recovery mechanism and activation tokens. Introduces direct responsibility over the security of user credentials.

**Option B — Institutional SSO of the University of Oviedo** (Microsoft/Azure AD): eliminates password management, delegates security to the institutional provider and naturally integrates all university staff. It is the option with the best security/maintenance cost ratio. **It was not available** for integration by external applications at the time of development, pending configuration by SUTIC.

**Option C — Google OAuth as the sole authentication mechanism**: also eliminates password management and delegates security to Google. Introduces dependency on an external service for access to the most critical function of the system.

**Chosen option: Option A**, by elimination. Option B, which would have been the most appropriate from a security point of view, was not available at the time of development. Option C introduces an unacceptable external dependency for access control. This decision is recognised as a **known limitation of the system**: by managing its own passwords, the system assumes risks that a delegated authentication system would avoid. Integration with the institutional SSO is documented as future work.

---

### 3.3.2 Type of web application

The most appropriate web application model for the system's needs was evaluated:

**Option A — SPA (Single Page Application) with independent backend API**: the interface is loaded once and subsequent interactions are performed through API calls without reloading the page. The backend and frontend are independent components that evolve autonomously. All functionality requires JavaScript active in the browser.

**Option B — Application with server-side rendering (SSR)** (e.g. Next.js): the server generates the HTML of each page before sending it to the client, improving the first load time and search engine positioning. It does not provide real benefit in this context, given that all management routes require prior authentication and the public schedule consultation does not need search engine indexing.

**Option C — Traditional monolithic application**: lower initial complexity by not separating frontend and backend. Hampers the independent scaling of the different system components.

**Chosen option: Option A.** SSR does not add value for this system since all management routes are protected by authentication. The SPA allows a more reactive interface, especially in the calendar view with multiple interactive filters. The frontend/backend separation also facilitates the independent development and maintenance of each part.

---

### 3.3.3 Google Calendar synchronisation model

The integration with Google Calendar required deciding when and how to propagate the system's changes to the Google Calendars:

**Option A — Incremental synchronisation** (propagate each individual change in real time):
- *Advantage:* the Google Calendar always reflects the most up-to-date state of the system.
- *Disadvantage:* the Google Calendar API quota is shared at the Google Cloud project level (not per user). The volume of changes during semester planning — hundreds of event creations, modifications and cancellations — would exhaust the available quota in a few hours.

**Option B — Full on-demand synchronisation** (the administrator manually launches the synchronisation; the system deletes and recreates all events from the current state):
- *Advantage:* guarantees complete consistency between the system and Google Calendar with a single execution, eliminating any accumulated desynchronisation. Quota consumption is predictable and bounded.
- *Disadvantage:* changes are not reflected in Google Calendar until the administrator explicitly launches the synchronisation.

**Chosen option: Option B.** The Google Calendar API quota (400 operations per minute at the project level) makes incremental synchronisation unfeasible for a calendar with hundreds of events during intensive planning periods. The real usage pattern — massive changes at the beginning of the semester — adapts well to full on-demand synchronisation. In addition, another application in the EII ecosystem directly consumes these Google Calendars, so complete consistency at the time of synchronisation is more important than the immediate propagation of each individual change.

---

### 3.3.4 Public access to schedules

It was evaluated whether the schedule consultation should be available to anyone or restricted to authenticated users:

**Option A — Public access without authentication** (like the legacy viewer): anyone can consult the schedules without needing to register.

**Option B — Access restricted to authenticated users**: only staff with an account in the system can consult the schedules.

**Chosen option: Option A.** The system replaces a public consultation tool used by students and the general public. Requiring authentication to consult the schedules would be a functional regression without justification. Public access is a non-negotiable requirement dictated by the usage context.

---

### 3.3.5 Scope of Google Calendar synchronisation by role

It was evaluated which user roles could manage the synchronisation with Google Calendar:

**Option A — Synchronisation available to all authenticated users** (professors and administrators): any user with an account can connect their Google account and synchronise calendars.

**Option B — Synchronisation restricted to the administrator role**: only administrators can manage the synchronisation of classroom calendars with Google.

**Chosen option: Option B.** The Google Calendar API quota is consumed at the Google Cloud project level, not per individual user. If multiple professors could synchronise their own copies of the calendar, the quota consumption would be proportional to the number of active users, making the functionality unfeasible at scale. Centralising synchronisation in the administrator role allows strict control of quota consumption and guarantees that the Google Calendars consumed by another application in the EII ecosystem are always managed by authorised personnel.
