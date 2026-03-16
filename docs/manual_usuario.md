# 5.2 User Guide

## Introduction

TeachingPlanner is a web-based academic scheduling application that allows you to manage degrees, courses, semester calendars, and teaching events. The system recognises three user profiles, each with a different level of access:

| Profile | Authentication | What they can do |
|---------|---------------|------------------|
| **Guest** | No (open access) | Browse degrees, classrooms, and the calendars of **Active** courses only |
| **Professor** | Yes | Everything above (across all courses) + submit event requests + manage their own profile |
| **Administrator** | Yes | Full access: manage all resources, approve or reject requests, administer user accounts |

The guide is organised into common sections (accessible to all profiles) and role-specific sections. Functionality described in the common sections is not repeated in the Professor and Administrator chapters.

---

## 1. Accessing the Application

### 1.1 Welcome Screen

When you open the application for the first time, the welcome screen is displayed.

> **[IMAGE 1 — Welcome screen]**: screenshot of the `/` route, showing the central card with the title "Teaching Planner", the subtitle, and the two main buttons.

From here you have two options:

- **Continue as guest**: goes directly to the main screen without signing in. Only public content is available.
- **Sign in**: redirects to the login form to access the application with a user account.

If you already have an active session, this screen redirects you automatically to the main screen.

---

### 1.2 Sign In

> **[IMAGE 2 — Login form]**: screenshot of the `/login` route, showing the form with the email and password fields.

Enter your email address and password, then click **Sign in**. If the credentials are correct you will be redirected to the main screen.

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

Enter and confirm your new password. The requirements indicator updates in real time. Once all requirements are satisfied, click **Update Password**. You will be redirected to the login form.

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
- **System** (Administrators only): **User Management**, **Requests**.
- **Extra** (always visible): **FAQ** (link not yet active).
- **User area** (bottom of the sidebar): shows your name and email when signed in, or "Guest / Not authenticated" otherwise. Click it to open a small menu with **Settings** and **Log out**. If you are not signed in, the menu shows **Sign in** instead.

---

### 2.2 Hierarchical Navigation and Breadcrumbs

The application organises information in a hierarchy: **Degrees → Courses → Semester → Calendar / Subjects / Groups / Requests**. As you navigate deeper, a breadcrumb bar appears at the top showing your current location and letting you jump back to any previous level with a single click.

> **[IMAGE 10 — Breadcrumb]**: screenshot of the breadcrumb bar on a subjects page, showing the full path: Degrees > [Name] > Courses > [Year] > Semester [N] > Subjects.

**Important:** Calendar, Subjects, Groups, and Requests for a given semester are **separate pages accessible from the course table**, not from within the calendar itself. To navigate between them, return to the course table (click **Degrees** or any breadcrumb ancestor) and use the links available for each semester row.

---

## 3. Features Available to All Profiles

The features described in this section are accessible to guests, professors, and administrators alike. The only difference is that **guests can only access courses in Active status** and their calendars; Planned and Finished courses are hidden from unauthenticated users.

---

### 3.1 Global Calendar — Home

> **[IMAGE 11 — Home page]**: screenshot of the `/home` route, showing the calendar selector dropdown at the top and the filter panel expanded.

> **[IMAGE 12 — Event details panel]**: screenshot of the side drawer that opens when clicking on a calendar event, showing the detailed information.

The home page shows a calendar with all events from a selected active academic calendar. To use it:

1. Use the **calendar selector** at the top to choose from the available active calendars. Your selection is remembered between visits.
2. Expand the **filter panel** to narrow down the events displayed by group type, subject, classroom, language, and other criteria.
3. Switch between **month, week, day, and agenda** views using the buttons in the calendar header.
4. Click any event to open the **details panel** on the right, showing the full information for that event (subject, group, classroom, start and end time).

Each subject is assigned a distinct colour that remains consistent throughout the application.

---

### 3.2 Degrees

> **[IMAGE 13 — Degrees list]**: screenshot of `/degrees`, showing the degrees table with name and acronym columns (no edit buttons — guest or professor view).

Click **Degrees** in the sidebar to access the full list of available degrees. Click the name or acronym of a degree to navigate to its courses.

---

### 3.3 Courses Within a Degree

> **[IMAGE 14 — Courses of a degree]**: screenshot of `/degrees/:acronym/courses`, showing the table with academic courses, their two semesters, and the linked calendars.

When you open a degree, the list of its academic courses is displayed. Each course corresponds to an academic year (e.g. 2024/2025) and can have up to two semesters, each with its own calendar.

- Click the **calendar name** of a semester to access the detailed view of that calendar.
- Guests only see courses in **Active** status. Planned and Finished courses are only visible to authenticated users.

---

### 3.4 Classrooms

> **[IMAGE 15 — Classrooms list]**: screenshot of `/classrooms`, showing the table with the classroom code and GIS URL columns.

Click **Classrooms** in the sidebar to see all classrooms available in the system. Each classroom shows its identifier code and, if configured, a link to its location in the university GIS system.

---

### 3.5 Semester Calendar

> **[IMAGE 16 — Monthly calendar view]**: screenshot of the `.../calendar` route, showing the calendar in monthly view with events colour-coded by subject.

> **[IMAGE 17 — Filter panel expanded]**: screenshot of the filter panel open inside the calendar, showing the available filtering options (group, classroom, subject, event type, language).

The semester calendar shows all planned events for that period. Features available to all profiles:

- Switch between **month, week, day, and agenda** views.
- Open the **filter panel** to show only the events you need.
- Click any event to view its details in a side panel.
- Use **Export .csv** in the toolbar to download the currently visible events as a CSV file in Google Calendar format.
- Use **Export .txt** in the toolbar to download the calendar in the application's native TXT format.

---

### 3.6 Subjects and Groups Within a Semester

> **[IMAGE 18 — Subjects table]**: screenshot of `.../subjects`, showing the table with acronym, name, academic year, and SIES code columns.

> **[IMAGE 19 — Groups table]**: screenshot of `.../groups`, showing the hierarchical table with subjects and their associated groups (type, number, language).

From the course table you can also access the **Subjects** and **Groups** pages for a given semester to consult the academic information for that period. These views are read-only for guests and professors.

---

## 4. Professor Features

This section describes the additional features available to users with the **Professor** role. Administrators also have access to all of these.

---

### 4.1 Submitting an Event Request

As a professor, you cannot add events directly to the calendar. Instead, you submit a **request** to the administrator, who evaluates and approves it.

> **[IMAGE 20 — Create event button (professor)]**: screenshot of the calendar toolbar (`.../calendar`) when the user has a Professor session, showing the "Create event" button.

> **[IMAGE 21 — Request creation dialog]**: screenshot of the dialog that opens when a professor clicks "Create event", showing the event type, date, time, classroom, and group fields.

To submit a request:

1. Navigate to the **semester calendar** where you want to add the event.
2. Click the **Create event** button in the toolbar, or click and drag on an empty time slot to pre-fill the date and time.
3. Choose the event type (**one-off** for a single session or **recurring** for a repeating event) and fill in the required fields (date or recurrence pattern, start and end time, classroom, and group).
4. Click **Submit request**. The request is registered with **Pending** status until the administrator reviews it.

---

### 4.2 Tracking Your Own Requests

> **[IMAGE 22 — Pending request on calendar]**: screenshot of the calendar showing an event with a distinctive visual style (reduced opacity and a dashed grey border) indicating it is pending approval.

Submitted requests appear on the calendar with a distinctive look — 50 % opacity and a dashed grey border — to indicate they are awaiting review.

If you need to remove a pending request, right-click it (or click to open the context menu) and select **Delete request**. This permanently removes the request. There is no option to edit a submitted request; if you need to change any details, delete it and submit a new one.

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
- **Create course**: click **Create course** in the toolbar → select the start and end years and the initial status (usually _Planned_).
- **Edit course**: click the edit icon to change the years or update the status.
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

- **Create group**: click **Create group** → choose the subject, group type (Large Group, Medium Group, Small Group, etc.), number, and language of instruction.
- **Delete group**: click the delete icon directly on the group row.

---

### 5.5 Classroom Management

> **[IMAGE 32 — Classrooms with admin toolbar]**: screenshot of `/classrooms` with an Administrator session, showing the toolbar and the edit/delete icons on each row.

From the **Classrooms** page an administrator can:

- **Create** a classroom by clicking **Create classroom** → enter the classroom code and, optionally, the GIS URL for its location.
- **Edit** a classroom by clicking its edit icon.
- **Delete** a classroom. Deleting a classroom automatically removes all events in the system that were assigned to it.

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

Click any event to open its details panel, where you will find the following options:

- **Edit**: modify the event's details. For recurring series you can choose to update only the selected occurrence or the entire series.
- **Delete**: remove the event. For recurring series you can delete only the selected occurrence or the entire series.
- **Replace**: substitute a single occurrence of a recurring series with a different one-off event. The replace dialog shows the original event (read-only) and lets you set a new date, times, and classroom. On confirmation, the original occurrence is cancelled and a new one-off event is created in its place.

**Additional toolbar tools:**

- **Import exceptions** — load a `.txt` file with exceptions that modify existing recurring patterns (cancelled classes, make-up sessions, etc.). The dialog offers two modes: **Replace** (overwrites all existing exceptions) and **Add** (appends to existing exceptions).
- **Export .csv** — downloads the currently visible events as a CSV file in Google Calendar format.
- **Export .txt** — downloads the calendar in the application's native TXT format.

---

### 5.7 Semester Request Management

> **[IMAGE 36 — Semester requests table]**: screenshot of `.../solicitudes`, showing the table filtered to "Pending", with columns for requesting professor, event type, and date.

> **[IMAGE 37 — Approve request dialog]**: screenshot of the approval dialog, showing the event details and any conflict warnings.

> **[IMAGE 38 — Reject request dialog]**: screenshot of the rejection dialog with the comments text field.

Within a semester's page, the **Requests** section shows all professor requests for that period. Use the filter buttons at the top to view **Pending**, **Approved**, **Rejected**, or **All** requests.

For each pending request:

- **Approve**: click **Approve** → a dialog shows the event details. If there are any scheduling conflicts (same group or classroom already occupied), the system warns you before you confirm. Click **Approve request** to confirm.
- **Reject**: click **Reject** → enter the reason in the comments field and confirm. The professor can see this comment when checking their request status.

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

- **Create user**: click **Create user** → fill in the first name, surname(s), email address, and role (Administrator or Professor). On save, an activation email is sent automatically to the address provided.
- **Edit user**: click the edit icon on a row to update their details.
- **Delete user**: click the delete icon, or select several rows with the checkboxes and use **Delete selected**.
- **Import users**: click **Import users** to load an Excel file containing multiple user records. All imported users will receive their activation emails.
- **Resend activation email**: if a user has not yet activated their account, an icon button appears on their row to resend the activation email.

---

### 5.10 Connecting Google Calendar

> **[IMAGE 43 — Google Calendar section in Settings]**: screenshot of the Google Calendar card inside `/settings` (visible only to Administrators), showing the connection status badge and the Connect / Disconnect buttons.

Before you can use the Google Calendar synchronisation feature, you must connect a Google account. This option is only available to administrators.

Go to **Settings** (click your avatar → **Settings**) and scroll to the **Google Calendar Sync** card:

- **Status badge**: shows whether a Google account is currently connected (green) or not (grey).
- **Connect**: click **Connect** and follow Google's OAuth authorisation flow. Once authorised, the badge turns green and shows the linked Google account's email.
- **Manage synchronisations**: appears when connected; clicking it navigates to the synchronisation page (section 5.11).
- **Disconnect**: removes the Google account link. Existing synced calendars are not deleted from Google Calendar automatically.

---

### 5.11 Google Calendar Synchronisation

> **[IMAGE 44 — Synchronisation page]**: screenshot of `/calendar-sync`, showing the academic calendars table with the degree filter, the Active/Inactive toggle switch, the status badge, and the sync icon button.

> **[IMAGE 45 — Synchronisation in progress]**: screenshot of the sync icon button in its loading state and the progress bar showing "{N} / {Total} completed".

From the sidebar → **User Management** → or by clicking **Manage synchronisations** in Settings, you reach the `/calendar-sync` page. You must have a Google account connected (section 5.10) before any synchronisation will work.

The table lists all academic calendars in the system. Use the **Filter by degree** dropdown at the top to narrow the list.

For each calendar:

1. Toggle the **Active / Inactive** switch to enable or disable synchronisation for that calendar.
2. Click the **sync icon** (tooltip: **Sync now**) to launch a manual synchronisation immediately. A progress bar will appear showing `{N} / {Total} completed` while the operation runs.

The **Status** column shows the result of the last synchronisation: *Inactive*, *Syncing*, *Success*, or *Error*. When synchronisation runs, the application creates Google Calendars for each classroom that has events in the academic calendar, distributing events by classroom location. The **Last synchronised** column shows when the most recent successful sync occurred, or *Never* if it has not been synced yet.
