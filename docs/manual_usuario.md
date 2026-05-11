# 5.2 User Guide

## Introduction

TeachingPlanner is a web-based academic scheduling application that allows you to manage degrees, courses, semester calendars, and a broad spectrum of events across five types:

- **Class** — regular teaching session. Counts towards the group's planned teaching hours and is included in schedule exports. The following class types are available:
  - Theory (T)
  - Seminar (S)
  - Laboratory (L)
  - Group Tutorial (TG)
- **Evaluation** *(displayed as EV· in the calendar)* — examination or formal assessment activity. Does not consume planned teaching hours. Can be assigned to multiple groups and classrooms simultaneously.
- **Review** *(displayed as RE· in the calendar)* — exam review or post-assessment session. Same behaviour as Evaluation.
- **Others** *(displayed as OT· in the calendar)* — any other activity requiring a room booking without consuming teaching hours: talks, workshops, open days, and similar events.
- **Independent** — room reservation with no associated subject or group, used to block a classroom for non-academic purposes (e.g. maintenance, external bookings).

Events may belong to subjects within any of the registered degree programmes or be entirely independent of any specific subject. The system recognises three user profiles, each with a different level of access:

| Profile | Authentication | What they can do |
|---------|---------------|------------------|
| **Guest** | No (open access) | Browse degrees, classrooms, and the calendars of **Active** courses only |
| **Professor** | Yes | Everything above (across all courses) + submit event requests + manage their own profile |
| **Administrator** | Yes | Full access: manage all resources, approve or reject requests, administer user accounts |

The guide is organised into common sections (accessible to all profiles) and role-specific sections. Functionality described in the common sections is not repeated in the Professor and Administrator chapters.

---

## 1. Accessing the Application

### 1.1 Welcome Screen

Open the application in your browser at **[planificador.ingenieriainformatica.uniovi.es](https://planificador.ingenieriainformatica.uniovi.es)**. The welcome screen is displayed.

> **[IMAGE 1 — Welcome screen]**: screenshot of the `/` route, showing the central card with the title "Teaching Planner", the subtitle, and the two main buttons.

From here you have two options:

- **Continue as guest**: goes directly to the main screen without signing in. Only public content is available.
- **Sign in**: redirects to the login form to access the application with a user account.

If you already have an active session, this screen redirects you automatically to the main screen.

---

### 1.2 Sign In

> **[IMAGE 2 — Login form]**: screenshot of the `/login` route, showing the form with the email and password fields.

Enter your email address and password, then click **Sign in**. If the credentials are correct you will be redirected to the main screen.

> **Note for university users:** use your institutional email address (e.g. `jrpp@uniovi.es`) together with the password you set when you activated your TeachingPlanner account. This is a **separate credential** from your general university network password — the two are independent. If you have never received an activation email, contact `jefaturaestudios.eii@uniovi.es` providing your full name so that the account setup process can be initiated for you.

If you do not remember your password, click the **Forgot your password?** link below the form to start the recovery process (see section 1.3).

---

### 1.3 Password Recovery

The password recovery process has three steps.

**Step 1 — Enter your email address**

> **[IMAGE 3 — Recovery, step 1]**: screenshot of `/forgot-password` on the first step, showing the email field and the "Request Code" button.

Enter the email address associated with your account and click **Request Code**. You will receive an email with a six-digit verification code. The resend button becomes active after 60 seconds if you have not received the email.

**Step 2 — Enter the verification code**

> **[IMAGE 4 — Recovery, step 2]**: screenshot of the second step, showing the six individual OTP input fields.

Enter the six-digit code from the email and click **Verify Code**. If the code is correct you will proceed to the third step. Click **Change Email** to go back and use a different address.

**Step 3 — Set a new password**

> **[IMAGE 5 — Recovery, step 3]**: screenshot of the third step, showing the new password and confirmation fields along with the requirements indicator.

Enter and confirm your new password. The requirements indicator updates in real time as you type, showing which conditions are already met. The password must satisfy all of the following requirements:

- At least **8 characters** (and no more than 128).
- At least one **uppercase letter** (A–Z).
- At least one **lowercase letter** (a–z).
- At least one **number** (0–9).
- At least one **special character** (e.g. `!`, `@`, `#`, `$`, `%`, `&`, `*`).

These requirements exist to ensure your account remains secure even if the system is exposed to automated attacks. Once all requirements are satisfied, click **Update Password**. You will be redirected to the login form.

---

### 1.4 Account Activation

When an administrator creates your account, you receive an activation email with a link. Clicking that link opens the activation screen.

> **[IMAGE 6 — Account activation]**: screenshot of the `/activate` route, showing the password and confirmation fields and the "Activate account" button.

Enter and confirm the password you will use to sign in, then click **Activate account**. After a few seconds you will be redirected to the login form. If the link has expired, contact your administrator to resend the activation email.

---

## 2. Interface Structure

### 2.1 Sidebar Navigation

The sidebar is the primary navigation tool. Its content changes according to the profile you are signed in with.

> **[IMAGE 7 — Guest sidebar]**: screenshot of the sidebar when the user is not authenticated, showing only the "Main" section (Home, Degrees, Classrooms) and, at the bottom, the user area displaying "Guest / Not authenticated".

> **[IMAGE 8 — Professor sidebar]**: screenshot of the sidebar with a Professor session, showing the "Main" section and the user area with the account name and avatar.

> **[IMAGE 9 — Administrator sidebar]**: screenshot of the sidebar with an Administrator session, showing the "Main" section, the "System" section (User Management, Requests), and the user area.

The sidebar header always shows **Escuela de Ingeniería Informática / Universidad de Oviedo**. Below it, the menu is organised into sections:

- **Main** (always visible): **Home**, **Degrees**, **Classrooms**.
- **System** (authenticated users only, content varies by role):
  - *Administrators*: **User Management**, **Requests**.
  - *Professors*: **My Requests**.
- **User area** (bottom of the sidebar): shows your name and email when signed in, or "Guest / Not authenticated" otherwise. Click it to open a small menu with **Settings** and **Log out**. If you are not signed in, the menu shows **Sign in** instead.

---

### 2.2 Hierarchical Navigation and Breadcrumbs

The application organises information in a hierarchy: **Degrees → Courses → Semester → Calendar / Subjects / Groups / Requests**. As you navigate deeper, a breadcrumb bar appears at the top showing your current location and letting you jump back to any previous level with a single click.

> **[IMAGE 10 — Breadcrumb]**: screenshot of the breadcrumb bar on a subjects page, showing the full path: Degrees > [Name] > Courses > [Year] > Semester [N] > Subjects.

**Important:** Calendar, Subjects, Groups, and Requests for a given semester are **separate pages accessible from the course table**, not from within the calendar itself. Each semester row in the course table shows a set of icon buttons: one to open the calendar, one for subjects, one for groups, and (for admins) one for requests. If no calendar has been created yet for a semester, these buttons are disabled and show the tooltip *(Requiere calendario)*.

---

## 3. Features Available to All Profiles

The features described in this section are accessible to guests, professors, and administrators alike. The only difference is that **guests can only access courses in Active status** and their calendars; Planned and Finished courses are hidden from unauthenticated users.

---

### 3.1 Global Calendar — Home

> **[IMAGE 11 — Home page]**: screenshot of the `/home` route, showing the calendar selector dropdown at the top and the filter panel expanded.

> **[IMAGE 12 — Event details panel]**: screenshot of the side drawer that opens when clicking on a calendar event, showing the detailed information.

> **[IMAGE 11b — Calendar views and navigation bar]**: screenshot of the calendar header showing the five view buttons (Semana, Semana laboral, Día, Mes, Agenda) and the Previous / Today / Next navigation buttons alongside the current date range label.

The home page displays all events from a selected active academic calendar. The two core components of this page — the calendar itself and the filter panel — are described in detail below.

#### Reading the calendar

The **calendar selector** dropdown at the top of the page identifies the active calendar you are viewing. Each entry follows the format *ACRONYM - YYYY/YYYY - Semestre N* (e.g. `GIISOF01 - 2025/2026 - Semestre 2`); only calendars in *Activo* status are available here. Your selection is persisted between browser sessions. The degree acronym (e.g. `GIISOF01`) and the academic year (e.g. `2025/2026`) are part of this selector label, so this is where you read which degree and semester you are looking at.

The current **date range** being displayed is shown in the calendar header, next to the navigation controls, so you always know which period you are looking at.

> **[IMAGE 11c — Event tile detail]**: screenshot of a calendar event tile at a zoom level where the two lines of text are clearly readable: the subject–group identifier on the first line and the classroom code on the second (e.g. "Alg.L3 / L-11").

Each **event** is rendered as a coloured block, with each subject assigned a distinct colour that remains consistent throughout the application. Inside the block, two lines of text allow you to identify the event at a glance without opening the detail panel:

1. The **subject–group identifier** (e.g. `Alg.L3`) — tells you which subject and which specific group the event belongs to. Non-standard event types are identified by a short prefix before the identifier:
   - *(no prefix)* — regular class session
   - `EV ·` — Evaluation (exam or formal assessment)
   - `RE ·` — Review (post-assessment session)
   - `OT ·` — Others (talk, workshop, or similar activity)
   - `IND` — Independent room reservation (no subject or group)
2. The **classroom code and start time** (e.g. `09:00 · L-11`) — tells you when the session starts and the physical location where it takes place.

Events can appear in three visual states:

| State | Appearance | Meaning |
|---|---|---|
| **Normal** | Full colour, solid border | Scheduled and confirmed |
| **Pending** | Reduced opacity, dashed grey border | A professor's request awaiting administrator approval |
| **Cancelled** | Grey colour, strikethrough text | Occurrence cancelled; shown for reference |

**Days with no scheduled teaching** (non-teaching days or holidays) are displayed with a light grey background so they are immediately distinguishable from regular days.

**Hover tooltip**: moving the mouse cursor over any event shows a tooltip with the full subject name, event type, duration in hours, and the list of classrooms assigned to that occurrence — useful when the event tile is too small to show all the detail.

Click any event to open the **details side panel**, which shows the complete event information: full subject name, group, classroom, and exact start and end times.

#### Navigating the calendar

When you open the calendar, the **initial date** is set automatically: if today's date falls within the calendar's range, the view centres on the current week; otherwise it opens on the first day of the calendar period.

Five **view modes** are available via the buttons in the calendar header:

| View | Description |
|---|---|
| **Semana** (Week) | All seven days of the selected week |
| **Semana laboral** (Working week) | Monday to Friday only — useful for hiding weekends |
| **Día** (Day) | A single day with hourly resolution; the time grid runs from **09:00 to 21:00** |
| **Mes** (Month) | A full month overview showing events as compact tiles |
| **Agenda** | A chronological list of upcoming events with full date and time detail |

In the **Semana**, **Semana laboral**, and **Día** views the time grid spans **09:00 to 21:00**, covering the full range of possible class hours.

Use the **Previous** and **Next** arrow buttons to move to the preceding or following period (week, day, or month, depending on the active view). Click **Hoy** (Today) to jump back to the period containing the current date at any time. Navigation is restricted to the date range of the selected calendar: you cannot scroll beyond its start or end dates.

#### Using the filter panel

> **[IMAGE 11d — Active filter chips]**: screenshot of the bottom strip of the filter panel showing several active filter chips (e.g. "Alg ×", "Alg.T1 ×", "Alg.L3 ×") and the real-time event counter "Mostrando X de Y eventos".

The filter panel is opened and closed with the **Filtros ▼** button in the left toolbar. When collapsed, a badge on the button shows the total number of currently active filter values, so you always know at a glance whether any filtering is in effect.

**Available filters:**

| Filter | What it controls | Selection control |
|---|---|---|
| **Curso** | Academic year of the subject group (1st, 2nd, 3rd, 4th year, or Elective) | Multiple checkboxes |
| **Asignatura** | One or more subjects in the calendar | Checkboxes + text search |
| **Tipo de grupo** | Group category: T (Theory), S (Seminar), L (Lab), TG (Group Tutorial) | Multiple checkboxes |
| **Grupos** | Individual groups (e.g. `Alg.T1`, `Alg.L3`) | Checkboxes + text search |
| **Aula** | A specific classroom or laboratory | Checkboxes + text search |
| **Idioma** | Language of instruction (Español / Inglés) | Multiple checkboxes |
| **Tipo de Evento** | Event type: Normal, Cancelled, Evaluation, Review, Others | Multiple checkboxes |

**Selecting values within a filter:**

Each filter category has a header you can click to **expand or collapse** it independently. Inside each expanded category:

- **Tick the checkboxes** next to the values you want. You can select as many values as needed within a category.
- When a category contains more than eight options, a **text search box** appears automatically at the top of the list — type any partial string to narrow the list in real time. Practical tip: in the **Aula** filter, typing `A` shows only standard classrooms; typing `L` shows only laboratories.
- The **Seleccionar todo** (Select all) and **Deseleccionar** (Clear) shortcut buttons at the top of each category let you tick or untick all options in that category with a single click.
- Options that would return **no events** if selected are shown greyed out, preventing you from choosing combinations that yield an empty calendar.

**Combining filters:**

- **Between categories — AND logic:** selecting values in more than one category further restricts the visible events. For example, choosing *Asignatura: Álgebra* AND *Aula: L-11* shows only Álgebra events that take place in L-11.
- **Within a category — OR logic:** selecting multiple values within the same category broadens the result. Choosing *Grupos: Alg.T1* and *Grupos: Alg.L3* shows events belonging to either group.
- **Automatic cascade:** the filter categories are linked in a hierarchy — `Curso → Asignatura → Tipo de grupo → Grupos`. When you narrow a higher-level filter, the options in dependent filters that no longer match are automatically removed from your selection. The **Idioma** filter is also linked to **Grupos** in the same way. This prevents you from ending up in a state where a lower-level filter refers to groups that are no longer visible.

The calendar header shows a live counter, *"Mostrando X de Y eventos"*, reflecting how many events match the current combination of filters.

**Managing active filters:**

Active filter selections appear as **chips** in the strip at the bottom of the filter panel. Click the `×` on any chip to remove that individual value. The **Limpiar filtros** (Clear filters) button removes all active filters at once and restores the full event set.

**Persistence:** your filter selections are **saved automatically** in your browser between sessions. The next time you open the application you will find the same filters already in place, so you do not need to re-configure them each time.

---

### 3.2 Degrees

> **[IMAGE 13 — Degrees list]**: screenshot of `/degrees`, showing the degrees table with name and acronym columns (no edit buttons — guest or professor view).

Click **Degrees** in the sidebar to access the full list of available degrees. Click the name or acronym of a degree to navigate to its courses.

---

### 3.3 Courses Within a Degree

> **[IMAGE 14 — Courses of a degree]**: screenshot of `/degrees/:acronym/courses`, showing the table with academic courses, their two semesters, and the linked calendars.

When you open a degree, the list of its academic courses is displayed. Each course corresponds to an academic year (e.g. 2024/2025) and can have up to two semesters, each with its own calendar.

- Each semester row shows a **Semestre 1** / **Semestre 2** button. Click it to open the calendar for that semester. Additional icon buttons on the same row lead to the Subjects and Groups pages.
- Each course shows a colour-coded **Status** badge: *Planificado* (blue — course defined but not yet started), *Activo* (green — currently running), or *Finalizado* (grey — course completed). Guests can only see courses in *Activo* status; Planificado and Finalizado courses are hidden from unauthenticated users.

---

### 3.4 Classrooms

> **[IMAGE 15 — Classrooms list]**: screenshot of `/classrooms`, showing the table with the classroom code and GIS URL columns.

Click **Classrooms** in the sidebar to see all classrooms available in the system. Each classroom shows its identifier code and, if configured, a link to its location in the university GIS system.

---

### 3.5 Semester Calendar

> **[IMAGE 16 — Monthly calendar view]**: screenshot of the `.../calendar` route, showing the calendar in monthly view with events colour-coded by subject.

> **[IMAGE 17 — Filter panel expanded]**: screenshot of the filter panel open inside the calendar, showing the available filtering options (group, classroom, subject, event type, language).

> **[IMAGE 16b — Semester calendar toolbar]**: screenshot of the toolbar specific to the semester calendar, showing the "Importar excepciones", "Exportar .csv" and "Exportar .txt" buttons alongside the filter toggle.

The semester calendar displays all planned events for the selected academic semester. Its calendar view and filter panel work **identically** to those described in section 3.1 — the same five view modes (Semana, Semana laboral, Día, Mes, Agenda), the same navigation controls (Previous / Today / Next), the same event tile format (subject–group identifier with type prefix on the first line, start time and classroom on the second), the same visual states (normal, pending, cancelled), the same hover tooltip, the same seven filter types with their search boxes, cascade behaviour, and chip-based active filter management, and the same automatic persistence of filter selections between sessions all apply here.

The only differences with respect to the home calendar are:

- There is **no calendar selector dropdown**: the semester is determined by the navigation path you followed (Degree → Course → Semester), so the calendar is already fixed to that specific period.
- The toolbar includes **three additional buttons** exclusive to this view:
  - **Importar excepciones** — load a `.txt` file with one-off exceptions (cancelled classes, make-up sessions) that modify the existing recurring event pattern.
  - **Exportar .csv** — download the currently visible events as a CSV file formatted for import into Google Calendar or other calendar applications.
  - **Exportar .txt** — download the full calendar in the application's native TXT format.

---

### 3.6 Subjects and Groups Within a Semester

> **[IMAGE 18 — Subjects table]**: screenshot of `.../subjects`, showing the table with acronym, name, academic year, and SIES code columns.

> **[IMAGE 19 — Groups table]**: screenshot of `.../groups`, showing the hierarchical table with subjects and their associated groups (type, number, language).

From the course table you can also access the **Subjects** and **Groups** pages for a given semester to consult the academic information for that period. These views are read-only for guests and professors.

---

## 4. Professor Features

This section describes the additional features available to users with the **Professor** role. Administrators also have access to all of these.

---

### 4.1 Submitting Event Requests

As a professor, you cannot modify the calendar directly. Instead, you submit **requests** to the administrator, who evaluates and approves them. There are four types of request:

> **[IMAGE 20 — Create request button (professor)]**: screenshot of the calendar toolbar (`.../calendar`) when the user has a Professor session, showing the "Create request" button.

> **[IMAGE 21 — Request creation dialog]**: screenshot of the dialog that opens when a professor clicks "Create request", showing the event type, date, time, classroom, and group fields.

#### CREATE request — add a new event

> **[IMAGE 21c — Request form with all fields]**: screenshot of the "Solicitar evento" dialog fully filled in, showing the Frecuencia selector set to "No se repite", the date picker and start/end time dropdowns, the Asignatura combobox with a subject selected, the Tipo de evento and Tipo de grupo fields that appear after selecting a subject, the Grupo selector, the Aula (opcional) dropdown, and the Comentario text area with an example justification.

There are two ways to open the **"Solicitar evento"** dialog:

**Option 1 — toolbar button:** navigate to the semester calendar and click the **Crear solicitud** button in the toolbar. The dialog opens with all fields empty.

**Option 2 — click and drag on the calendar:** navigate to the target day, click on the desired start time slot, and drag the cursor down to the end time before releasing. The dialog opens with the date, start time, and end time already filled in based on your selection. This is the fastest method when you already know the exact time slot.

> **[IMAGE 21e — Click-and-drag time selection]**: screenshot of the calendar showing a grey shaded selection rectangle being drawn from 18:00 to 20:00 on a given day, indicating the drag-to-create gesture in progress.

Once the dialog is open, fill in the following fields:

- **Frecuencia** *(Frequency)*: for a one-off make-up or extra session, select *No se repite*. To request a new recurring class, choose the appropriate recurrence pattern from the dropdown.
- **Fecha y Horario** *(Date and Time)*: select the date using the calendar picker, then set the start time and end time independently using the hour and minute selectors.
- **Asignatura** *(Subject)*: type any part of the subject name to search; select from the filtered list. Once a subject is selected, two additional fields appear automatically:
  - *Tipo de evento*: leave this set to **Clase** for ordinary teaching sessions.
  - *Tipo de grupo*: choose the group category — **Teoría** (T), **Seminario** (S), **Laboratorio** (L), or **Tutoría Grupal** (TG). Note that laboratory groups (L) and group tutorial groups (TG) are managed separately from theory and seminar groups.
- **Grupo**: once a subject and group type are selected, this dropdown lists the available groups (e.g. `Alg.L3`). Select the specific group for which you are requesting the session.
- **Aula** *(Classroom, optional)*: select the preferred classroom from the dropdown. This is a preference — the administrator may assign a different room when approving the request if the one you selected is unavailable.
- **Comentario** *(Comment, optional but strongly recommended)*: use this field to justify the request clearly. The administrator uses this justification to evaluate and approve the request; an unclear or missing comment significantly increases the risk of rejection. Examples of good comments: *"Recuperación de la clase del 12 de octubre (festivo)"*, *"Adelanto de clase de teoría para sincronizar con los grupos de prácticas de laboratorio"*, *"Recuperación de la última clase del semestre antes del 1 de mayo"*.

A **summary line** at the bottom of the dialog (e.g. *"No se repite — 09:00–10:00"*) reflects the recurrence and time settings in real time, allowing you to verify the key data before submitting.

Click **Solicitar** to submit. The request is registered with **Pending** status and sent to the administrator's review queue.

> **Note — planned hours limit:** the system automatically enforces the planned-hours budget configured for each subject and group type. If a CREATE request would cause the total scheduled hours to exceed that budget, it will not be accepted. Should this occur, contact the administrator to review the planned-hours configuration for the group concerned.

#### EDIT, CANCEL, and REPLACE requests — modify an existing event

> **[IMAGE 21b — Event context menu for professors]**: screenshot of the context menu that appears when a professor right-clicks on an existing calendar event. For recurring events the menu shows "Ver detalles", "Solicitar editar serie de eventos", "Solicitar reemplazar evento" and "Solicitar cancelar". For one-off events the labels adapt: "Solicitar edición" replaces "Solicitar editar serie de eventos", but "Solicitar reemplazar evento" and "Solicitar cancelar" remain available.

**Right-click** any existing event on the calendar to open its context menu. (On touch devices, a long press opens the same menu.) The following options are available:

- **Request edit** (*Solicitar editar serie de eventos*): propose a change to the time, date, or classroom of an existing recurring event. Fill in the updated details and click **Send request** to submit. For one-off events, the option reads *Solicitar edición*.
- **Request replacement** (*Solicitar reemplazar evento*): substitute an event — either a specific occurrence of a recurring series or a one-off event — with a different one-off session scheduled on a new date and time.

  > **[IMAGE 21d — Replace request dialog with summary block]**: screenshot of the "Solicitar reemplazo de evento" dialog showing the three sections: the original event block (read-only) at the top, the new date/time/classroom fields in the middle, and the "Resumen de la solicitud" block at the bottom displaying both action lines.

  The replacement dialog is divided into three sections: (1) the **original event** block, shown read-only, with the subject, groups, classrooms, date, and exact time of the occurrence that will be cancelled; (2) the **new event** fields where you set the new date, start time, end time, and preferred classroom; and (3) a **"Resumen de la solicitud"** block at the bottom that automatically summarises the two actions that will be taken on approval — for example, *"El evento del 08/04/2026 a las 15:00 será cancelado"* and *"Se solicitará un nuevo evento el 16/04/2026 de 13:00 – 15:00. Aula solicitada: L-11"* — so you can review the full impact of the request before confirming. Click **Solicitar reemplazo** to submit.

- **Request cancellation** (*Solicitar cancelar*): request removal of a specific occurrence from the calendar. This option appears in red as a destructive action. The dialog shows the event details (type, date, groups, and classroom) read-only, and provides a **Comentario** field for the cancellation reason — fill this in as clearly as possible to facilitate approval. Confirm with **Solicitar cancelación**.

All request types are sent to the administrator's review queue and follow the approval workflow described in sections 5.7 and 5.8.

---

### 4.2 Tracking Your Own Requests

After submitting any type of request (CREATE, REPLACE, or CANCEL), a **confirmation notification** appears in the bottom-right corner of the screen.

> **[IMAGE 22c — Submission confirmation toast]**: screenshot of the bottom-right toast notification showing the "Solicitud enviada" header and the body text "Tu solicitud de evento ha sido enviada para aprobación", with the dismiss × button.

This toast confirms that the request has been registered and is now pending administrator review. You can continue working normally while you wait.

You can follow the status of your submitted requests in two ways:

**On the semester calendar:**

> **[IMAGE 22 — Pending request on calendar]**: screenshot of the calendar showing an event with reduced opacity and a dashed grey border indicating it is pending approval.

Submitted CREATE requests appear on the calendar with reduced opacity and a dashed grey border to indicate they are awaiting review. Once the administrator has reviewed the request, the calendar updates automatically on your next visit or page refresh:

- Events from **rejected** requests disappear from the calendar entirely.
- Events from **approved** requests appear with the same full-colour visual style as all other scheduled events.
- If the request was a **replacement**, the original occurrence is additionally displayed with a cancelled style (greyed out), making it clear that it has been superseded by the newly approved event.

To withdraw a pending CREATE request before it is reviewed, right-click it on the calendar to open its context menu and select **Eliminar solicitud** (Delete request). This permanently removes the request. Only pending requests can be withdrawn this way.

**On the My Requests page:**

> **[IMAGE 22b — My Requests page]**: screenshot of `/my-requests`, showing the status filter buttons at the top (Pending, Approved, Rejected, All) and the requests table listing all submitted requests across all semesters.

Click **My Requests** in the sidebar to open a dedicated page listing all requests you have submitted across all calendars and semesters.

- Use the **status filter buttons** (Pending, Approved, Rejected, All) at the top to narrow the list. The default view shows Pending requests.
- Click the **refresh icon** to reload the list at any time.
- The table shows: degree acronym, course year, semester, request type (CREATE / EDIT / CANCEL / REPLACE), event type (one-off or recurring), submission date, and current status. Status badges use colour coding: amber for Pending, green for Approved, red for Rejected.
- For **pending** requests, a red delete icon appears in the Actions column to withdraw the request permanently.
- **Approved and rejected** requests are read-only — the Actions column shows "Processed".
- The table is paginated (10 rows per page) with Previous / Next navigation at the bottom.

---

### 4.3 Profile Settings

> **[IMAGE 23 — Settings page]**: screenshot of `/settings`, showing the two sections visible to professors: "User profile" and "Password".

Access settings from the **user area** at the bottom of the sidebar: click your name or avatar and select **Settings**.

The settings page has two sections for professors:

- **User profile**: update your first name, surname(s), email address, and university username. Click **Update profile** to save.
- **Password**: enter your current password, choose a new one, and confirm it. The requirements indicator updates in real time. Click **Change password** to save.

---

## 5. Administrator Features

This section describes features exclusive to the **Administrator** role: full resource management, request review, user administration, and Google Calendar synchronisation.

---

### 5.1 Degree Management

> **[IMAGE 24 — Degrees with admin toolbar]**: screenshot of `/degrees` with an Administrator session, showing the toolbar with the "Create degree" and "Delete selected" buttons, and the edit/delete icons on each row.

> **[IMAGE 25 — Create degree drawer]**: screenshot of the creation side drawer, showing the "Name" and "Acronym" fields.

From the **Degrees** page an administrator can:

- **Create** a new degree by clicking **Create degree** → a side drawer opens with the name and acronym fields.
- **Edit** an existing degree by clicking its edit icon → the same drawer opens with the current values.
- **Delete** a degree by clicking its delete icon, or select several rows with the checkboxes and use **Delete selected**.

---

### 5.2 Course and Calendar Management

> **[IMAGE 26 — Courses with admin toolbar]**: screenshot of `.../courses` with an Administrator session, showing the toolbar and the per-row action buttons.

> **[IMAGE 27 — Create course drawer]**: screenshot of the side drawer with the "Start year", "End year", and status selector (Planned, Active, Finished) fields.

> **[IMAGE 28 — Calendar creation drawer — three tabs]**: screenshot of the `CreateCalendarDrawer` showing the three tabs: Manual, Import, and Duplicate.

Within a degree, the administrator manages its courses and associated calendars.

**Courses:**
- **Create course**: click **Create course** in the toolbar → select the start and end years and the initial status. The available statuses are:
  - *Planificado* — the course is defined but not yet running. This is the usual starting state.
  - *Activo* — the course is currently in progress. This is the only status visible to guests.
  - *Finalizado* — the course has ended.
- **Edit course**: click the edit icon to change the years or update the status. Status transitions are one-directional: Planificado → Activo → Finalizado. You cannot revert a course to a previous status.
- **Delete course**: click the delete icon. A course can only be deleted if it has no calendars with events.

**Calendars (for each semester row):**

Click the **+** icon on a semester row to open the **Create Calendar** drawer, which has three tabs:

1. **Manual** — a guided three-step wizard: set the start and end dates → mark public holidays → add comments to holidays.
2. **Import** — upload up to five TXT files in the application's native format:
   - `asignaturas.txt` (required) — subject information
   - `calendario.txt` (required) — academic calendar with teaching and non-teaching days
   - `horarios.txt` (required) — recurring class events
   - `ubicaciones.txt` (required) — classroom and lab information
   - `excepciones.txt` (optional) — one-off events and exceptions
3. **Duplicate** — select an existing calendar from the same semester in a different academic year → confirm or adjust the start/end dates → review the public holidays (copied from the source calendar and adjusted to the new year).

To **delete** an existing calendar, click the delete icon on its semester row. All events in the calendar will be permanently removed.

---

### 5.3 Subject Management

> **[IMAGE 29 — Subjects with admin toolbar]**: screenshot of `.../subjects` with an Administrator session, showing the toolbar and the creation drawer open with its fields.

Navigate to the desired semester → **Subjects** page. From here you can:

- **Create** a subject by clicking **Create subject** → fill in the acronym, full name, academic year, and SIES code.
- **Edit** a subject by clicking its edit icon.
- **Delete** a subject. Deleting a subject also removes its groups and all events associated with those groups.

---

### 5.4 Group Management

> **[IMAGE 30 — Groups with admin toolbar]**: screenshot of `.../groups`, showing the hierarchical table with subjects and their groups, and the "Create group" button.

> **[IMAGE 31 — Create group dialog]**: screenshot of the creation dialog with the subject, group type, number, and language fields.

Navigate to the desired semester → **Groups** page. The table shows groups organised by subject. To manage them:

- **Create group**: click **Create group** → choose the subject, group type, and language of instruction. The group number is **assigned automatically** (the system picks the next available number for that subject/type/language combination). The available group types are:
  - **T** — Teoría (Theory)
  - **S** — Seminario (Seminar)
  - **L** — Laboratorio (Laboratory)
  - **TG** — Tutoría Grupal (Group Tutorial)
- **Delete group**: click the delete icon directly on the group row.

**Planned Hours:**

Each group has a **Planned Hours** value (shown as `Xh`, e.g. `6h`) recording the total teaching hours expected for that group across the semester.

To view or update planned hours:

1. In the **Groups** table, click the **Manage Groups** button on any subject row to open the group detail panel.
2. Inside the panel, groups are organised into tabs by type (T, S, L, TG) with Spanish and English columns.
3. As an **administrator**, click the `Xh` value next to any group to switch to edit mode. An input field appears.
4. Enter the new value. Only non-negative multiples of **0.5** are accepted (e.g. `0`, `0.5`, `1`, `1.5`, `6`). Invalid values are rejected in real time.
5. Press **Enter** or click the green checkmark to save. Press **Escape** or click the red cross to cancel.

Professors can see planned hours in the panel but cannot edit them.

---

### 5.5 Classroom Management

> **[IMAGE 32 — Classrooms with admin toolbar]**: screenshot of `/classrooms` with an Administrator session, showing the toolbar and the edit/delete icons on each row.

From the **Classrooms** page an administrator can:

- **Create** a classroom by clicking **Create classroom** → enter the classroom code and, optionally, the GIS URL for its location.
- **Edit** a classroom by clicking its edit icon.
- **Delete** a classroom. If the classroom has no events, it is deleted immediately. If it has associated events, a confirmation dialog appears warning you that all events assigned to that classroom will also be permanently deleted; you must confirm to proceed.

---

### 5.6 Event Management in the Calendar

> **[IMAGE 33 — Create one-off event dialog]**: screenshot of the one-off event creation dialog in `.../calendar`, showing the subject/group, classroom, date, start time, and end time fields.

> **[IMAGE 34 — Create recurring event dialog]**: screenshot of the recurring event creation dialog, showing the day-of-week selector and the frequency dropdown (Weekly, Biweekly — even weeks, Biweekly — odd weeks, Custom).

> **[IMAGE 35 — Event context menu]**: screenshot of the options that appear when clicking an event as an Administrator: edit, delete, replace.

As an administrator you can add and modify events directly in the calendar without going through the request workflow.

**Creating events:**

Click **Create event** in the toolbar, or click and drag on an empty time slot to pre-fill the date and time, then choose the event type:

- **One-off event**: occurs on a single date. Fill in the subject, group, classroom, date, and times.
- **Recurring event**: repeats following a weekly or biweekly pattern throughout the semester. Choose the day of the week, the start and end times, and the **frequency**:
  - *Weekly* — the event repeats every week.
  - *Biweekly — even weeks* — the event repeats every other week on even calendar weeks.
  - *Biweekly — odd weeks* — the event repeats every other week on odd calendar weeks.
  - *Custom* — define a bespoke recurrence pattern.

**Modifying existing events:**

Click any event to open its context menu. The available options depend on the event type:

*For one-off events:*
- **Editar evento** — modify the event's details.
- **Eliminar evento** — permanently remove the event.

*For recurring events:*
- **Editar serie de eventos** — modify the details of the entire recurring series.
- **Reemplazar evento** — substitute a single occurrence with a different one-off event. The dialog shows the original occurrence read-only and lets you set a new date, times, and classroom; on confirmation the original occurrence is cancelled and a new one-off event is created in its place.
- **Eliminar evento** — cancel only the selected occurrence (leaves the rest of the series intact).
- **Eliminar serie de eventos** — permanently remove the entire recurring series.

*For cancelled occurrences:*
- **Revertir cancelación** — restore a previously cancelled occurrence back to its original state.

*For pending professor requests (visible on the calendar as events with a dashed border):*
- **Aprobar solicitud** — open the approval dialog and approve the request directly from the calendar.
- **Revisar solicitud** — open the full review dialog to inspect and optionally adjust the request details (frequency, dates, times) before approving.
- **Rechazar solicitud** — reject the request with an optional comment.

**Additional toolbar tools:**

- **Importar excepciones** — load a `.txt` file with exceptions that modify existing recurring patterns (cancelled classes, make-up sessions, etc.). The dialog offers two modes: **Agregar** (Add — appends to existing exceptions) and **Reemplazar** (Replace — overwrites all existing exceptions).
- **Exportar .csv** — downloads the currently visible events as a CSV file in Google Calendar format.
- **Exportar .txt** — downloads the calendar in the application's native TXT format.

---

### 5.7 Semester Request Management

> **[IMAGE 36 — Semester requests table]**: screenshot of `.../solicitudes`, showing the table filtered to "Pending", with columns for requesting professor, event type, and date.

> **[IMAGE 37 — Approve request dialog]**: screenshot of the approval dialog, showing the event details and any conflict warnings.

> **[IMAGE 38 — Reject request dialog]**: screenshot of the rejection dialog with the comments text field.

Within a semester's page, the **Requests** section shows all professor requests for that period. Use the filter buttons at the top to view **Pending**, **Approved**, **Rejected**, or **All** requests.

For each pending request, three actions are available:

- **Revisar** (Review, eye icon): opens the full review dialog. The subject, group, and classroom fields are read-only — set by the professor — but you can adjust the **frequency, dates, and times** before approving. Click **Aprobar solicitud** inside the dialog to create the event with the (possibly modified) details.
- **Aprobar** (Approve, checkmark icon): approves the request immediately without opening the review dialog, using the details as submitted.
- **Rechazar** (Reject, X icon): opens a dialog where you enter the reason. The professor can see this comment in their My Requests page.

If there are any scheduling conflicts (the same group or classroom is already occupied), the system warns you before you confirm the approval.

---

### 5.8 Global Request Management

> **[IMAGE 39 — Global requests table]**: screenshot of the `/solicitudes` route, showing the table with requests from all calendars in the system, including degree, course, and semester columns.

Click **Requests** in the sidebar to access a system-wide view of all professor requests, regardless of which semester or degree they belong to. The approval and rejection actions are identical to those described in section 5.7.

---

### 5.9 User Management

> **[IMAGE 40 — Users table]**: screenshot of `/users`, showing the table with name, email, role, and activation status columns, and per-row action buttons.

> **[IMAGE 41 — Create user drawer]**: screenshot of the user creation side drawer, with the first name, surname(s), email, and role selector (Administrator / Professor) fields.

> **[IMAGE 42 — Resend activation button]**: screenshot of an inactive user's row in the table, highlighting the icon that resends the activation email.

Click **User Management** in the sidebar to manage user accounts:

- **Search**: type in the search box at the top of the table to filter users by email address.
- **Create user**: click **Create user** → fill in the first name, surname(s), email address, and role (Administrator or Professor). On save, an activation email is sent automatically to the address provided.
- **Edit user**: click the edit (pencil) icon on a row to update their details.
- **Delete user**: click the delete (trash) icon on a row, or select several rows with the checkboxes and use **Delete selected**.
- **Import users**: click **Import users** to load an Excel (`.xlsx`) file containing multiple user records. All imported users will receive their activation emails.
- **Resend activation email**: click the mail icon on any row belonging to a user who has not yet activated their account to resend the activation link.
- The table is paginated (10 rows per page). Use the **Previous / Next** buttons at the bottom to navigate. The total user count is shown below the table.

---

### 5.10 Connecting Google Calendar

> **[IMAGE 43 — Google Calendar section in Settings]**: screenshot of the Google Calendar card inside `/settings` (visible only to Administrators), showing the connection status badge and the Connect / Disconnect buttons.

Before you can use the Google Calendar synchronisation feature, you must connect a Google account. This option is only available to administrators.

Go to **Settings** (click your avatar → **Settings**) and scroll to the **Google Calendar Sync** card:

- **Status badge**: shows whether a Google account is currently connected (green) or not (grey).
- **Connect**: click **Connect** and follow Google's OAuth authorisation flow. Once authorised, the badge turns green and shows the linked Google account's email.
- **Manage synchronisations**: appears when connected; clicking it navigates to the synchronisation page (section 5.11).
- **Disconnect**: removes the Google account link. All synced Google Calendars created by the system are deleted from Google Calendar automatically.

---

### 5.11 Google Calendar Synchronisation

> **[IMAGE 44 — Synchronisation page]**: screenshot of `/calendar-sync`, showing the academic calendars table with the degree filter, the status badge, the sync icon button, and the delete button.

> **[IMAGE 45 — Synchronisation in progress]**: screenshot of the sync icon button in its loading state and the progress bar showing "{N} / {Total} completed".

The synchronisation page is accessible by clicking **Manage synchronisations** in the Settings page (section 5.10). There is no direct sidebar link to this page. You must have a Google account connected (section 5.10) before any synchronisation will work.

The table lists all academic calendars in the system. Use the **Filter by degree** dropdown at the top to narrow the list.

For each calendar:

1. Click the **sync icon** (tooltip: **Sync now**) to launch a manual synchronisation immediately. A progress bar will appear showing `{N} / {Total} completed` while the operation runs.
2. Click the **trash icon** (tooltip: **Remove sync**) to remove the synchronisation for that calendar. A confirmation dialog will appear showing the degree name, academic year, and semester. On confirmation, the system removes all events belonging to that academic calendar from Google Calendar, deletes the Google Calendar for any classroom that becomes empty, and removes the row from the table. **This button only appears once the calendar has been synchronised at least once.**

The **Status** column shows the result of the last synchronisation: *Idle*, *Syncing*, *Success*, *Error*, or *Deleting* (while a removal is in progress). When synchronisation runs, the application creates Google Calendars for each classroom that has events in the academic calendar, distributing events by classroom location. The **Last synchronised** column shows when the most recent successful sync occurred, or *Never* if it has not been synced yet.
