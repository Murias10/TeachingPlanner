# Chapter 3 — STAKEHOLDER REQUIREMENTS

---

## 3.1 System Scope

### 3.1.1 Context and Project Origin

TeachingPlanner is a project commissioned by the School of Computer Engineering (EII) of the University of Oviedo to replace the academic schedule management system currently in use. It is a real commission from the institution itself, motivated by the accumulated operational limitations of the legacy system, which over time have increasingly hindered the work of the administrative and teaching staff.

The application is currently deployed on a university virtual machine, accessible via the institutional VPN, and has been formally presented to EII staff as a proposed replacement for the production system. This chapter collects the requirements identified during the analysis process prior to development, organised from the perspective of users and other stakeholders.

### 3.1.2 Current System (AS-IS)

To understand the project scope it is necessary to know how schedule management currently works at the EII. The legacy system consists of two independent components: a **public viewer** deployed on the university servers, which allows querying group schedules in three formats (web list, table and CSV for Google Calendar) and includes links to the GIS system to locate each classroom; and a set of **five plain-text files** per semester that feed that viewer, whose maintenance is entirely manual.

There is no web administration interface. All data management is done by connecting via SSH to port 22 of the virtual machine hosting the application and directly editing the files with a command-line editor. The five files use the `:` character as a field separator and serve the following purposes:

- `asignaturas.txt` — catalogue of subjects with their groups by type (theory, seminar, laboratory, group tutoring) and language (Spanish and English).
- `calendario.txt` — academic calendar, with each date labelled with a letter code indicating the type of session for that day.
- `horarios.txt` — recurring events, linking each group to a day of the week, a time slot and a classroom.
- `excepciones.txt` — one-off events and cancellations.
- `ubicaciones.txt` — mapping between classroom code and its URL in the university GIS system.

> 📷 **Suggested Figure 1 — Fragment of `horarios.txt` open in an SSH session**, illustrating the manual command-line editing process.

This approach has significant limitations in four areas:

**No format or conflict validation.** If a syntax error is introduced when editing a file, the system does not detect or warn about it: the erroneous data is silently recorded. Likewise, when saving a change, no check is made as to whether it creates overlaps with other events: a classroom can be assigned twice at the same time without the system issuing any warning.

**Fragility of the letter-code mechanism.** The periodicity of non-weekly groups depends on the letter code in `calendario.txt` and `horarios.txt` being exactly the same in both files. A different capitalisation or an extra space causes the group to silently disappear from the published schedule without producing any visible error.

**Change request process by email.** When a lecturer needs to modify a class, the usual channel is email to the head of studies. This process can result in long, difficult-to-manage email threads, with the risk of misunderstandings and unanswered messages. The lecturer has no tool to know in advance whether their request creates a conflict.

**Double manual maintenance and lack of interoperability.** There is another application in the EII ecosystem that is fed by the same Google Calendars and the same `.txt` files. Any change to schedules must be manually propagated both to the files and to the corresponding Google Calendar, creating a double-maintenance process prone to desynchronisation. Additionally, the viewer lacks responsive design and does not work correctly on mobile devices.

> 📷 **Suggested Figure 2 — Screenshot of the legacy viewer on a mobile device**, showing the absence of responsive design.

### 3.1.3 System Objectives (TO-BE)

TeachingPlanner is a web application developed from scratch to replace the system described above and resolve all identified limitations. The objectives of the new system are:

- Provide a complete **web administration interface**, accessible from any browser without requiring technical knowledge, that allows managing all academic information (degrees, courses, subjects, groups, classrooms, calendars and events) with validated forms and immediate feedback.
- **Automatically detect schedule conflicts** before confirming any assignment or change, preventing erroneous overlaps from being saved.
- Incorporate an **integrated change request system** that replaces the email-based flow, with status visibility for both lecturer and administrator at all times.
- **Automatically synchronise with Google Calendar**, generating one independent calendar per classroom so that other applications in the EII ecosystem can consume always up-to-date data without manual intervention.
- **Maintain compatibility with the legacy system**, allowing import and export of the five `.txt` files to facilitate the initial migration and coexistence with other tools that depend on that format.
- Preserve **public schedule consultation without authentication**, equivalent to the functionality of the existing viewer, and add CSV export compatible with Google Calendar for student use.
- Offer a **responsive** interface that works correctly on mobile devices, and is **fully internationalised** in Spanish and English.

### 3.1.4 Stakeholders

| ID | Stakeholder | Role in the system | Main needs |
|---|---|---|---|
| STK-01 | Academic Planning Deputy Directorate (EII) | Client and main user (administrator) | Eliminate manual file editing; automatic conflict detection; integrated request management; change traceability |
| STK-02 | EII Teaching Staff | Secondary user (lecturer) | View their own schedule; submit change requests without using email; synchronise with personal Google Calendar |
| STK-03 | Students and general public | Read-only user | Access published schedules without authentication, from any device |
| STK-04 | Other EII ecosystem applications | Dependent external system | Continue receiving the five `.txt` files and Google Calendars in the expected format, without manual intervention |
| STK-05 | IT Service (SUTIC) | Infrastructure owner | System deployable on the university VM and maintainable with Docker |
| STK-06 | Development team (Final Year Project) | Developer | Clear requirements and achievable scope within the Final Year Project framework |

---

## 3.2 User Requirements

User requirements are organised into functional groups and expressed in concise language from the user's perspective, without going into implementation details. Non-functional requirements are collected at the end of this section in table format.

### Functional requirements

**UR1 — System access and profile**

**UR1.1.** The system shall allow registered users to log in to the application.

&nbsp;&nbsp;&nbsp;&nbsp;**UR1.1.1.** The system shall request the following data from the user:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.1.1.1.** Email address.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.1.1.1.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.1.1.2.** Password.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.1.1.2.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;**UR1.1.2.** If the credentials are correct, the system shall redirect the user to the main screen according to their role.

&nbsp;&nbsp;&nbsp;&nbsp;**UR1.1.3.** If the email address does not exist in the system or the password is incorrect, the system shall display a generic error message and the user shall not be authenticated.

&nbsp;&nbsp;&nbsp;&nbsp;**UR1.1.4.** If the account exists but has not been activated, the system shall display a message indicating that the user must activate their account before being able to access.

**UR1.2.** The system shall allow users to recover access to their account if they have forgotten their password. The process shall be carried out in three steps:

&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.1.** First step — request for verification code:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.1.1.** The system shall request the user's email address.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.1.1.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.1.2.** The system shall send a six-digit verification code to the indicated email address, valid for 15 minutes.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.1.3.** The system shall not reveal whether the email address is registered or not, always showing the same confirmation message.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.1.4.** The system shall not allow requesting a new code until 60 seconds have elapsed since the previous request.

&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.2.** Second step — code verification:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.2.1.** The system shall request the six-digit code received by email.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.2.1.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.2.2.** If the code is correct and has not expired, the system shall proceed to the third step.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.2.3.** If the code has expired, the system shall display an error message and invite the user to request a new code.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.2.4.** If the code is incorrect, the system shall display an error message.

&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.3.** Third step — set new password:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.3.1.** The system shall request the following data from the user:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.3.1.1.** New password.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.3.1.1.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.3.1.1.2.** It must be at least 8 characters long.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.3.1.1.3.** It must contain at least one uppercase letter.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.3.1.1.4.** It must contain at least one lowercase letter.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.3.1.1.5.** It must contain at least one digit.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.3.1.1.6.** It must contain at least one special character.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.3.1.2.** Confirmation of the new password.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.3.1.2.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.3.1.2.2.** It must match the new password entered.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.3.2.** If the password does not meet the complexity requirements, the system shall display an error message indicating which condition has not been satisfied and shall not update the password.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.3.3.** If the passwords do not match, the system shall display an error message and shall not update the password.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.2.3.4.** If the data are valid, the system shall update the password and redirect the user to the login form.

**UR1.3.** The system shall allow authenticated users to close their active session.

&nbsp;&nbsp;&nbsp;&nbsp;**UR1.3.1.** The system shall close the user's session and redirect them to the home screen.

**UR1.4.** The system shall allow authenticated users to view and modify their own profile data.

&nbsp;&nbsp;&nbsp;&nbsp;**UR1.4.1.** The user shall be able to modify their first name, last name(s), email address and UniOvi username.

&nbsp;&nbsp;&nbsp;&nbsp;**UR1.4.2.** The user shall be able to change their password by entering their current password and a new password that meets the same complexity requirements as established in UR1.2.3.1.1.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR1.4.2.1.** If the current password entered is incorrect, the system shall display an error message and shall not make the change.

**UR1.5.** When the administrator creates a new account, the user shall receive an email with an activation link.

&nbsp;&nbsp;&nbsp;&nbsp;**UR1.5.1.** Upon accessing the link, the system shall ask the user to set their personal password, meeting the complexity requirements indicated in UR1.2.3.1.1.

&nbsp;&nbsp;&nbsp;&nbsp;**UR1.5.2.** If the link has expired, the system shall indicate to the user that they should contact the administrator to have the activation email resent.

&nbsp;&nbsp;&nbsp;&nbsp;**UR1.5.3.** If the data are valid, the system shall activate the account and redirect the user to the login form.

**UR1.6.** The system shall allow authenticated users to link their account with a Google account to enable synchronisation of academic calendars with Google Calendar.

&nbsp;&nbsp;&nbsp;&nbsp;**UR1.6.1.** The user shall be redirected to the Google consent screen, where they will authorise access to the system.

&nbsp;&nbsp;&nbsp;&nbsp;**UR1.6.2.** If the user authorises access, the system shall link the Google account and display the email address of the linked Google account as confirmation.

&nbsp;&nbsp;&nbsp;&nbsp;**UR1.6.3.** If the user denies access, the system shall display an informational message and shall not link any account.

&nbsp;&nbsp;&nbsp;&nbsp;**UR1.6.4.** The system shall allow the user to disconnect their Google account. Upon disconnection, the system shall delete the Google Calendars created by that user and remove the stored link.

---

**UR2 — User management** *(administrator only)*

**UR2.1.** The system shall allow the administrator to register new users in the system.

&nbsp;&nbsp;&nbsp;&nbsp;**UR2.1.1.** The system shall request the following data from the administrator:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR2.1.1.1.** First name.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR2.1.1.1.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR2.1.1.2.** First surname.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR2.1.1.2.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR2.1.1.3.** Second surname.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR2.1.1.3.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR2.1.1.4.** Email address.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR2.1.1.4.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR2.1.1.4.2.** The system shall check that the email format is valid.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR2.1.1.4.3.** The system shall check that the email is not already registered in the system.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR2.1.1.5.** Role.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR2.1.1.5.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR2.1.1.5.2.** The system shall allow choosing between the following roles: Administrator or Lecturer.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR2.1.1.6.** UniOvi username.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR2.1.1.6.1.** It is an optional field.

&nbsp;&nbsp;&nbsp;&nbsp;**UR2.1.2.** If the email address is already registered in the system, the system shall display an error message and shall not complete the registration.

&nbsp;&nbsp;&nbsp;&nbsp;**UR2.1.3.** If the email address format is not valid, the system shall display an error message and shall not complete the registration.

&nbsp;&nbsp;&nbsp;&nbsp;**UR2.1.4.** If the registration is correct, the system shall create the account with inactive status and send the new user an email with a link to activate their account and set their password.

**UR2.2.** The system shall allow the administrator to bulk import users from an Excel file.

&nbsp;&nbsp;&nbsp;&nbsp;**UR2.2.1.** The system shall ask the administrator to upload a file in `.xlsx` format.

&nbsp;&nbsp;&nbsp;&nbsp;**UR2.2.2.** The file must contain the following columns:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR2.2.2.1.** UniOvi username. It is a mandatory field per row.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR2.2.2.2.** First name. It is a mandatory field per row.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR2.2.2.3.** Surnames. It is a mandatory field per row. The system shall internally split this field into first surname and second surname.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR2.2.2.4.** Email address. It is a mandatory field per row. Must be unique in the system.

&nbsp;&nbsp;&nbsp;&nbsp;**UR2.2.3.** The system shall validate each row of the file independently.

&nbsp;&nbsp;&nbsp;&nbsp;**UR2.2.4.** The system shall create users from valid rows with inactive status and send each one an activation email.

&nbsp;&nbsp;&nbsp;&nbsp;**UR2.2.5.** The system shall display a report indicating how many users were created successfully and which rows contained errors and for what reason.

**UR2.3.** The system shall allow the administrator to view the list of users registered in the system.

&nbsp;&nbsp;&nbsp;&nbsp;**UR2.3.1.** The system shall display for each user: full name, email address, role, status (active or inactive) and registration date.

&nbsp;&nbsp;&nbsp;&nbsp;**UR2.3.2.** The system shall allow filtering the list by role and by status.

&nbsp;&nbsp;&nbsp;&nbsp;**UR2.3.3.** The system shall allow searching for users by name or email address.

**UR2.4.** The system shall allow the administrator to modify the data of an existing user.

&nbsp;&nbsp;&nbsp;&nbsp;**UR2.4.1.** The administrator shall be able to modify the user's first name, surname(s), role and status (active or inactive).

&nbsp;&nbsp;&nbsp;&nbsp;**UR2.4.2.** The system shall prevent the administrator from changing the role or deactivating the last active administrator in the system.

&nbsp;&nbsp;&nbsp;&nbsp;**UR2.4.3.** The system shall prevent the administrator from deactivating their own account.

**UR2.5.** The system shall allow the administrator to delete a user from the system.

&nbsp;&nbsp;&nbsp;&nbsp;**UR2.5.1.** The system shall request explicit confirmation before proceeding with the deletion.

&nbsp;&nbsp;&nbsp;&nbsp;**UR2.5.2.** The system shall prevent deleting the last active administrator in the system.

&nbsp;&nbsp;&nbsp;&nbsp;**UR2.5.3.** The system shall prevent the administrator from deleting their own account.

**UR2.6.** The system shall allow the administrator to resend the activation email to users who have been registered but have not yet activated their account. The activation process that the user will follow upon receiving the resent email is identical to that described in UR1.5.

**UR2.7.** The system shall manage three access profiles with differentiated levels:

&nbsp;&nbsp;&nbsp;&nbsp;**UR2.7.1.** Administrator: full access to all system management functions.

&nbsp;&nbsp;&nbsp;&nbsp;**UR2.7.2.** Lecturer: access to schedule consultation and to creating and managing their own change requests.

&nbsp;&nbsp;&nbsp;&nbsp;**UR2.7.3.** Guest (unauthenticated user): read-only access to schedules of academic courses in Active status, without needing an account in the system.

---

**UR3 — Academic structure management** *(administrator only)*

**UR3.1.** The system shall allow the administrator to manage degrees.

&nbsp;&nbsp;&nbsp;&nbsp;**UR3.1.1.** The system shall allow creating a new degree. The system shall request the following data:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.1.1.1.** Name.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.1.1.1.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.1.1.1.2.** The system shall check that the name is not already registered in the system.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.1.1.2.** Acronym.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.1.1.2.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.1.1.2.2.** The system shall check that the acronym is not already registered in the system.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.1.1.3.** If the name or acronym already exist, the system shall display a specific error message and shall not complete the creation.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.1.1.4.** If the data are valid, the system shall create the degree and display a confirmation.

&nbsp;&nbsp;&nbsp;&nbsp;**UR3.1.2.** The system shall allow viewing the list of existing degrees.

&nbsp;&nbsp;&nbsp;&nbsp;**UR3.1.3.** The system shall allow modifying the name and acronym of an existing degree, with the same uniqueness validations as in creation.

&nbsp;&nbsp;&nbsp;&nbsp;**UR3.1.4.** The system shall allow deleting a degree.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.1.4.1.** If the degree has associated academic courses, the system shall display an error message and shall not complete the deletion.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.1.4.2.** If the degree has no associated courses, the system shall request confirmation and delete the degree.

**UR3.2.** The system shall allow the administrator to manage academic courses associated with a degree.

&nbsp;&nbsp;&nbsp;&nbsp;**UR3.2.1.** The system shall allow creating a new academic course. The system shall request the following data:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.2.1.1.** Degree to which the course belongs.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.2.1.1.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.2.1.2.** Start year.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.2.1.2.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.2.1.3.** End year.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.2.1.3.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.2.1.3.2.** It must be later than the start year.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.2.1.4.** If a course with the same years already exists for that degree, the system shall display an error message and shall not complete the creation.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.2.1.5.** If the data are valid, the system shall create the course with the initial status «Planning».

&nbsp;&nbsp;&nbsp;&nbsp;**UR3.2.2.** Each academic course shall have a status that the administrator can modify:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.2.2.1.** Planning.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.2.2.2.** Active.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.2.2.3.** Finished.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.2.2.4.** Status transitions are unidirectional: Planning → Active → Finished. It is not possible to revert a course to a previous status.

&nbsp;&nbsp;&nbsp;&nbsp;**UR3.2.3.** The system shall allow deleting an academic course.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.2.3.1.** If the course has calendars with associated events, the system shall display an error message and shall not complete the deletion.

**UR3.3.** The system shall allow the administrator to manage subjects associated with a degree.

&nbsp;&nbsp;&nbsp;&nbsp;**UR3.3.1.** The system shall allow creating a new subject. The system shall request the following data:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.3.1.1.** Name.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.3.1.1.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.3.1.1.2.** Must be unique within the same degree.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.3.1.2.** Acronym.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.3.1.2.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.3.1.2.2.** Must be unique within the same degree.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.3.1.3.** SIES code.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.3.1.3.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.3.1.3.2.** It shall not be modifiable once the subject has been created.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.3.1.4.** Degree to which it belongs.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.3.1.4.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.3.1.5.** Semester in which it is taught.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.3.1.5.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.3.1.5.2.** The system shall allow choosing between the first semester and the second semester.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.3.1.6.** Year in which it is taught.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.3.1.6.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.3.1.6.2.** The system shall allow choosing between: first, second, third, fourth, or no specific year (for elective or free-choice subjects).

&nbsp;&nbsp;&nbsp;&nbsp;**UR3.3.2.** The system shall allow viewing and filtering the list of subjects by degree, semester and year.

&nbsp;&nbsp;&nbsp;&nbsp;**UR3.3.3.** The system shall allow modifying all fields of a subject except the SIES code.

&nbsp;&nbsp;&nbsp;&nbsp;**UR3.3.4.** The system shall allow deleting a subject.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.3.4.1.** The system shall display a warning indicating that the deletion will also delete all associated groups and the events of those groups.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.3.4.2.** After the administrator's confirmation, the system shall delete the subject along with its associated groups and events.

**UR3.4.** The system shall allow the administrator to manage groups within a subject.

&nbsp;&nbsp;&nbsp;&nbsp;**UR3.4.1.** The system shall allow creating a new group. The system shall request the following data:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.4.1.1.** Subject to which it belongs.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.4.1.1.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.4.1.2.** Group type.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.4.1.2.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.4.1.2.2.** The system shall allow choosing between: Theory (T), Seminar (S), Laboratory Practice (L), Group Tutoring (TG).

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.4.1.3.** Language.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.4.1.3.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.4.1.3.2.** The system shall allow choosing between: Spanish and English.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.4.1.4.** Planned hours.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.4.1.4.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.4.1.4.2.** It must be a positive number that is a multiple of 0.5 (e.g.: 0, 0.5, 1, 1.5, 6). Negative values and decimals that are not multiples of 0.5 are not accepted.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.4.1.5.** The group number is automatically assigned by the system. The system shall assign the next available number for the selected combination of subject, type and language.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.4.1.6.** If the system cannot assign a unique number for the indicated combination of subject, type and language, it shall display an error message and shall not complete the creation.

&nbsp;&nbsp;&nbsp;&nbsp;**UR3.4.2.** The system shall allow viewing the list of groups of a subject.

&nbsp;&nbsp;&nbsp;&nbsp;**UR3.4.3.** The system shall allow modifying the data of an existing group, with the same uniqueness validations as in creation.

&nbsp;&nbsp;&nbsp;&nbsp;**UR3.4.4.** The system shall allow deleting a group. The system shall request confirmation before proceeding.

**UR3.5.** The system shall allow the administrator to manage classrooms.

&nbsp;&nbsp;&nbsp;&nbsp;**UR3.5.1.** The system shall allow creating a new classroom. The system shall request the following data:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.5.1.1.** Classroom code.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.5.1.1.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.5.1.1.2.** The system shall check that the code is not already registered in the system.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.5.1.2.** Geographic location link (GIS URL).

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.5.1.2.1.** It is an optional field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.5.1.2.2.** If provided, the system shall check that the value has a valid URL format.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.5.1.3.** If the code already exists, the system shall display an error message and shall not complete the creation.

&nbsp;&nbsp;&nbsp;&nbsp;**UR3.5.2.** The system shall allow viewing the list of registered classrooms.

&nbsp;&nbsp;&nbsp;&nbsp;**UR3.5.3.** The system shall allow modifying the code and GIS link of an existing classroom.

&nbsp;&nbsp;&nbsp;&nbsp;**UR3.5.4.** The system shall allow deleting a classroom.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR3.5.4.1.** If the classroom has associated events, the system shall request additional confirmation warning that the deletion of the classroom will also permanently delete all events assigned to that classroom. The administrator must explicitly confirm before proceeding.

---

**UR4 — Academic calendar management** *(administrator only)*

**UR4.1.** The system shall allow the administrator to create an academic calendar. The system shall request the following data:

&nbsp;&nbsp;&nbsp;&nbsp;**UR4.1.1.** Academic course to which the calendar belongs.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR4.1.1.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;**UR4.1.2.** Semester.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR4.1.2.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR4.1.2.2.** The system shall allow choosing between the first semester and the second semester.

&nbsp;&nbsp;&nbsp;&nbsp;**UR4.1.3.** Start date.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR4.1.3.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;**UR4.1.4.** End date.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR4.1.4.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR4.1.4.2.** It must be later than the start date.

&nbsp;&nbsp;&nbsp;&nbsp;**UR4.1.5.** If a calendar already exists for the same academic course and semester, the system shall display an error message and shall not complete the creation.

&nbsp;&nbsp;&nbsp;&nbsp;**UR4.1.6.** If the end date is not later than the start date, the system shall display an error message and shall not complete the creation.

&nbsp;&nbsp;&nbsp;&nbsp;**UR4.1.7.** If the data are valid, the system shall create the calendar and automatically generate one teaching day for each working day (Monday to Friday) between the start and end dates.

**UR4.2.** The system shall allow the administrator to mark individual days on the calendar as holidays or non-teaching days, and unmark them to restore their teaching status.

**UR4.3.** The system shall allow the administrator to view the list of existing academic calendars, with the ability to filter by course and semester.

**UR4.4.** The system shall allow the administrator to duplicate an existing calendar to create a new one for another course or semester.

&nbsp;&nbsp;&nbsp;&nbsp;**UR4.4.1.** The system shall request the target academic course and target semester.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR4.4.1.1.** These are mandatory fields.

&nbsp;&nbsp;&nbsp;&nbsp;**UR4.4.2.** The system shall request the new start and end dates.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR4.4.2.1.** These are mandatory fields.

&nbsp;&nbsp;&nbsp;&nbsp;**UR4.4.3.** If a calendar already exists for the target course and semester, the system shall display an error message and shall not complete the duplication.

&nbsp;&nbsp;&nbsp;&nbsp;**UR4.4.4.** If the data are valid, the system shall create the new calendar copying the day structure from the source calendar (including days marked as holidays, proportionally adjusted to the new dates) and the recurring events from the source calendar.

**UR4.5.** The system shall allow the administrator to delete a calendar and all its associated data.

&nbsp;&nbsp;&nbsp;&nbsp;**UR4.5.1.** The system shall inform the administrator of the number of days and events that will be deleted and shall request explicit confirmation before proceeding.

---

**UR5 — Event management** *(administrator only)*

**UR5.1.** The system shall allow the administrator to create recurring events (classes that repeat with a regular pattern in the calendar). The system shall request the following data:

&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.1.** Group or groups affected by the event.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.1.1.** It is a mandatory field for all event types except Independent. The administrator can select one or more groups. Independent-type events do not require an associated group or subject.

&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.2.** Classroom or classrooms assigned to the event.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.2.1.** It is an optional field. The administrator can select one or more classrooms, or none.

&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.3.** Start time.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.3.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.4.** End time.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.4.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.4.2.** It must be later than the start time.

&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.5.** Day of the week on which the event repeats.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.5.1.** It is a mandatory field. The administrator shall select one of the days: Monday, Tuesday, Wednesday, Thursday or Friday.

&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.6.** Repetition frequency.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.6.1.** It is a mandatory field. The system shall allow choosing from the following patterns:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.6.1.1.** Weekly: the event repeats every week on the selected day.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.6.1.2.** Biweekly — even weeks: the event repeats every two weeks, in even-numbered weeks of the calendar.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.6.1.3.** Biweekly — odd weeks: the event repeats every two weeks, in odd-numbered weeks of the calendar.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.6.1.4.** Custom: the administrator defines their own repetition pattern using calendar day characters.

&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.7.** Event type.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.7.1.** It is a mandatory field. The system shall allow choosing from the following types:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.7.1.1.** Class: ordinary teaching session. Consumes the group's planned hours and is included in calendar exports.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.7.1.2.** Evaluation: exam or formal assessment activity. Does not consume planned hours.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.7.1.3.** Review: exam review session. Does not consume planned hours.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.7.1.4.** Others: any activity requiring a classroom booking without consuming planned hours (talks, workshops, open days, etc.).

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.7.1.5.** Independent: classroom booking without an associated subject or group (for non-academic uses such as maintenance or external bookings).

&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.8.** If the end time is not later than the start time, the system shall display an error message and shall not complete the creation.

&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.9.** Before saving the event, the system shall check whether a schedule conflict exists with other already registered events:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.9.1.** A conflict shall be considered to exist when a selected group has another event on the same day of the week and in a time slot that overlaps with the new event's slot.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.9.2.** A conflict shall be considered to exist when a selected classroom is assigned to another event on the same day of the week and in an overlapping time slot.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.9.3.** If a conflict is detected, the system shall display an error message indicating which event and which resource (group or classroom) generates the conflict, and shall prevent saving the event until it is resolved.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.1.9.4.** If no conflict is detected, the system shall save the event.

**UR5.2.** The system shall allow the administrator to create one-off events (single sessions on a specific date). The system shall request the following data:

&nbsp;&nbsp;&nbsp;&nbsp;**UR5.2.1.** Specific date within the calendar.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.2.1.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.2.1.2.** The date must belong to the selected calendar.

&nbsp;&nbsp;&nbsp;&nbsp;**UR5.2.2.** Group or groups affected by the event.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.2.2.1.** It is a mandatory field for all event types except Independent, which does not require an associated group or subject.

&nbsp;&nbsp;&nbsp;&nbsp;**UR5.2.3.** Classroom or classrooms assigned.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.2.3.1.** It is an optional field.

&nbsp;&nbsp;&nbsp;&nbsp;**UR5.2.4.** Start time.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.2.4.1.** It is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;**UR5.2.5.** End time.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.2.5.1.** It is a mandatory field. It must be later than the start time.

&nbsp;&nbsp;&nbsp;&nbsp;**UR5.2.6.** Event type.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR5.2.6.1.** It is a mandatory field, with the same options as in UR5.1.7.1.

&nbsp;&nbsp;&nbsp;&nbsp;**UR5.2.7.** If the selected day is marked as a holiday, the system shall display a warning to the administrator; the creation can continue if the administrator confirms.

&nbsp;&nbsp;&nbsp;&nbsp;**UR5.2.8.** The system shall apply the same conflict detection as in UR5.1.9, but for the specific date and time slot of the one-off event.

**UR5.3.** The system shall allow the administrator to modify an existing event.

&nbsp;&nbsp;&nbsp;&nbsp;**UR5.3.1.** For recurring events, the modifiable fields are: groups, classrooms, start time, end time, day of the week, repetition frequency and event type.

&nbsp;&nbsp;&nbsp;&nbsp;**UR5.3.2.** For one-off events, the modifiable fields are: groups, classrooms, start time, end time and event type.

&nbsp;&nbsp;&nbsp;&nbsp;**UR5.3.3.** The system shall apply the same conflict detection as in UR5.1.9 or UR5.2.8 to the new data before saving the change.

**UR5.4.** The system shall allow the administrator to cancel a one-off event.

&nbsp;&nbsp;&nbsp;&nbsp;**UR5.4.1.** The system shall mark the event as cancelled, without deleting it from the system.

&nbsp;&nbsp;&nbsp;&nbsp;**UR5.4.2.** Cancelled events shall remain visible on the calendar with a differentiated visual indication.

**UR5.5.** The system shall allow the administrator to delete events.

&nbsp;&nbsp;&nbsp;&nbsp;**UR5.5.1.** For recurring events, the administrator shall be able to delete a specific occurrence or the entire series. The system shall request confirmation before proceeding in both cases.

&nbsp;&nbsp;&nbsp;&nbsp;**UR5.5.2.** For non-cancelled one-off events, the administrator shall be able to permanently delete them.

**UR5.6.** The system shall allow the administrator to revert the cancellation of a one-off event that was previously cancelled, restoring it to its original active state.

---

**UR6 — Schedule consultation** *(all users, including unauthenticated public)*

**UR6.1.** The system shall allow any person to view published academic schedules without needing to authenticate.

&nbsp;&nbsp;&nbsp;&nbsp;**UR6.1.1.** Unauthenticated users shall only be able to access calendars of academic courses in Active status.

&nbsp;&nbsp;&nbsp;&nbsp;**UR6.1.2.** Authenticated users shall be able to access calendars of courses in any status.

**UR6.2.** The system shall allow selecting the calendar to view based on degree, academic course and semester.

**UR6.3.** The system shall display the events of the selected calendar in a calendar view. The system shall offer the following views:

&nbsp;&nbsp;&nbsp;&nbsp;**UR6.3.1.** Full week view.

&nbsp;&nbsp;&nbsp;&nbsp;**UR6.3.2.** Work week view (Monday to Friday).

&nbsp;&nbsp;&nbsp;&nbsp;**UR6.3.3.** Day view.

&nbsp;&nbsp;&nbsp;&nbsp;**UR6.3.4.** Month view.

&nbsp;&nbsp;&nbsp;&nbsp;**UR6.3.5.** Agenda view.

**UR6.4.** The system shall allow filtering the visible events on the calendar according to the following criteria:

&nbsp;&nbsp;&nbsp;&nbsp;**UR6.4.1.** Group year (first, second, third, fourth or elective).

&nbsp;&nbsp;&nbsp;&nbsp;**UR6.4.2.** Subject.

&nbsp;&nbsp;&nbsp;&nbsp;**UR6.4.3.** Group type.

&nbsp;&nbsp;&nbsp;&nbsp;**UR6.4.4.** Specific group.

&nbsp;&nbsp;&nbsp;&nbsp;**UR6.4.5.** Classroom.

&nbsp;&nbsp;&nbsp;&nbsp;**UR6.4.6.** Language.

&nbsp;&nbsp;&nbsp;&nbsp;**UR6.4.7.** Event type (class, evaluation, review, others, cancelled).

**UR6.5.** When selecting an event on the calendar, the system shall display its details: subject, group, event type, classroom, schedule and comments if any.

**UR6.6.** Cancelled events and events from requests pending review shall be visually differentiated from other active events.

**UR6.7.** The schedule consultation interface shall work correctly on mobile devices.

**UR6.8.** The system shall automatically save calendar filter selections in the user's browser, so that they are maintained between sessions without needing to reconfigure them.

---

**UR7 — Change requests** *(lecturer creates; administrator manages)*

**UR7.1.** The system shall allow the lecturer to create change requests about calendar events, without needing to use email. The lecturer can open the request form using the button in the calendar toolbar or by clicking and dragging over an empty time slot to automatically pre-fill the date and time. The system shall offer the following request types:

&nbsp;&nbsp;&nbsp;&nbsp;**UR7.1.1.** Request to create a new event: the lecturer shall provide the data for the event they wish to create, with the same fields as in direct event creation (UR5.1 or UR5.2).

&nbsp;&nbsp;&nbsp;&nbsp;**UR7.1.2.** Request to edit an existing event: the lecturer shall select the original event and provide the proposed modified data.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR7.1.2.1.** Selection of the original event is a mandatory field.

&nbsp;&nbsp;&nbsp;&nbsp;**UR7.1.3.** Request to cancel an occurrence of an existing event: the lecturer shall select the original event and the specific date of the occurrence they wish to cancel.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR7.1.3.1.** Selection of the original event and of the occurrence date are mandatory fields.

&nbsp;&nbsp;&nbsp;&nbsp;**UR7.1.4.** Request to replace an occurrence: the lecturer shall select the original event, the occurrence to cancel, and provide the data for the new event to replace it.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR7.1.4.1.** Selection of the original event and the occurrence are mandatory fields.

&nbsp;&nbsp;&nbsp;&nbsp;**UR7.1.5.** For all request types, the system shall inform the lecturer whether the proposed data generates a schedule conflict with the current state of the calendar before sending the request. This information is advisory; the lecturer may send the request regardless.

&nbsp;&nbsp;&nbsp;&nbsp;**UR7.1.6.** Upon sending the request, the system shall notify the administrators by email.

**UR7.2.** The system shall allow the lecturer to view the list of their own requests and see the updated status and reviewer comments on each. The list shall implement pagination and allow filtering by status (pending, approved, rejected, all).

**UR7.3.** The system shall allow the lecturer to delete their own requests that are pending review.

&nbsp;&nbsp;&nbsp;&nbsp;**UR7.3.1.** If the request has already been reviewed (approved or rejected), the system shall display an error message and shall not allow it to be deleted.

**UR7.4.** The system shall allow the administrator to view the list of all requests received in the system.

&nbsp;&nbsp;&nbsp;&nbsp;**UR7.4.1.** The system shall allow filtering requests by status (pending, approved or rejected), by degree and by calendar.

&nbsp;&nbsp;&nbsp;&nbsp;**UR7.4.2.** Requests pending review shall be shown with a differentiated visual indication.

&nbsp;&nbsp;&nbsp;&nbsp;**UR7.4.3.** The list shall implement pagination.

**UR7.5.** The system shall allow the administrator to approve a pending request.

&nbsp;&nbsp;&nbsp;&nbsp;**UR7.5.1.** The system shall show the administrator whether the request data generates conflicts with the current state of the calendar.

&nbsp;&nbsp;&nbsp;&nbsp;**UR7.5.2.** Before confirming the approval, the administrator shall be able to adjust the frequency, dates and times of the proposed event. The subject, group and classroom fields are read-only and cannot be modified.

&nbsp;&nbsp;&nbsp;&nbsp;**UR7.5.3.** If the administrator approves the request, the system shall automatically execute the corresponding action for the request type (create, edit, cancel or replace the event) with the definitive data after any possible adjustment.

&nbsp;&nbsp;&nbsp;&nbsp;**UR7.5.4.** The system shall notify the lecturer by email indicating that their request has been approved.

**UR7.6.** The system shall allow the administrator to reject a pending request.

&nbsp;&nbsp;&nbsp;&nbsp;**UR7.6.1.** The system shall allow the administrator to enter the reason for rejection.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR7.6.1.1.** It is a recommended field. If omitted, the lecturer shall receive the rejection notification without a detailed justification.

&nbsp;&nbsp;&nbsp;&nbsp;**UR7.6.2.** The system shall notify the lecturer by email indicating that their request has been rejected and the reason provided by the administrator, if any.

---

**UR8 — Google Calendar synchronisation** *(administrator only)*

**UR8.1.** The system shall allow the administrator to synchronise a complete academic calendar with Google Calendar.

&nbsp;&nbsp;&nbsp;&nbsp;**UR8.1.1.** The administrator shall select the academic calendar to synchronise.

&nbsp;&nbsp;&nbsp;&nbsp;**UR8.1.2.** The system shall create one independent Google Calendar per classroom that has events in the selected academic calendar. The name of each Google Calendar shall be the corresponding classroom code.

&nbsp;&nbsp;&nbsp;&nbsp;**UR8.1.3.** The system shall publish the events of the academic calendar in the Google Calendar of the corresponding classroom.

&nbsp;&nbsp;&nbsp;&nbsp;**UR8.1.4.** The system shall show the administrator the synchronisation progress in real time, indicating how many classroom calendars have been processed out of the total.

&nbsp;&nbsp;&nbsp;&nbsp;**UR8.1.5.** Upon completion, the system shall indicate whether the synchronisation has finished successfully or whether an error occurred, with a diagnostic message in case of failure.

**UR8.2.** The system shall guarantee that, when running a synchronisation, the state of the Google Calendars is completely aligned with the current state of the system, deleting and recreating events from scratch.

**UR8.3.** The system shall allow the administrator to check the synchronisation status of each academic calendar: pending synchronisation, in progress, successfully synchronised or with error.

&nbsp;&nbsp;&nbsp;&nbsp;**UR8.3.1.** The system shall allow filtering the calendar list by degree.

**UR8.4.** The system shall allow the administrator to delete the synchronisation of a specific academic calendar.

&nbsp;&nbsp;&nbsp;&nbsp;**UR8.4.1.** The system shall request confirmation before proceeding.

&nbsp;&nbsp;&nbsp;&nbsp;**UR8.4.2.** The system shall delete the events of that academic calendar from the Google Calendars of the affected classrooms. If any Google Calendar becomes empty, the system shall delete it as well.

---

**UR9 — Interoperability with the legacy system**

**UR9.1.** The system shall allow the administrator to export a complete academic calendar in the legacy system's format.

&nbsp;&nbsp;&nbsp;&nbsp;**UR9.1.1.** The system shall generate a compressed file in ZIP format containing the five `.txt` files of the previous system: `ubicaciones.txt`, `asignaturas.txt`, `calendario.txt`, `horarios.txt` and `excepciones.txt`.

&nbsp;&nbsp;&nbsp;&nbsp;**UR9.1.2.** The export shall include only events of type Class; events of type Evaluation, Review, Others and Independent shall not be included.

&nbsp;&nbsp;&nbsp;&nbsp;**UR9.1.3.** The file shall automatically download in the administrator's browser.

**UR9.2.** The system shall allow any user to download the schedule of a semester in the application's native text format (`.txt` files).

&nbsp;&nbsp;&nbsp;&nbsp;**UR9.2.1.** This export shall be available from the semester calendar view.

&nbsp;&nbsp;&nbsp;&nbsp;**UR9.2.2.** The download shall generate the `.txt` files with the content currently visible on the calendar.

**UR9.3.** The system shall allow the administrator to create a new academic calendar from the five `.txt` files of the legacy system, to facilitate the initial migration without needing to enter data manually.

&nbsp;&nbsp;&nbsp;&nbsp;**UR9.3.1.** The administrator shall upload the `.txt` files of the previous system (required: `asignaturas.txt`, `calendario.txt`, `horarios.txt`, `ubicaciones.txt`; the `excepciones.txt` file is optional).

&nbsp;&nbsp;&nbsp;&nbsp;**UR9.3.2.** After the administrator's confirmation, the system shall create a new academic calendar with all entities (subjects, groups, classrooms, teaching days and events) extracted from the files.

&nbsp;&nbsp;&nbsp;&nbsp;**UR9.3.3.** The system shall display a report with the successfully imported data and the errors found.

**UR9.4.** The system shall allow the administrator to load exceptions onto an existing calendar from a `.txt` file.

&nbsp;&nbsp;&nbsp;&nbsp;**UR9.4.1.** The administrator must mandatorily select one of two import modes before confirming:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR9.4.1.1.** Add: the exceptions from the file are added to those already existing in the calendar.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR9.4.1.2.** Replace: the existing exceptions in the calendar are completely replaced by those from the file.

&nbsp;&nbsp;&nbsp;&nbsp;**UR9.4.2.** The system shall not start the import until the administrator has explicitly selected one of the two modes.

**UR9.5.** The system shall allow exporting the schedule of a calendar in CSV format compatible with Google Calendar, so that users can import it into their personal calendar application.

&nbsp;&nbsp;&nbsp;&nbsp;**UR9.5.1.** This export shall be available from the semester calendar view for any user.

---

**UR10 — Audit and traceability**

**UR10.1.** The system shall automatically record audit information on all managed entities.

&nbsp;&nbsp;&nbsp;&nbsp;**UR10.1.1.** For each entity, the system shall automatically store the following data:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR10.1.1.1.** User who created the record.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR10.1.1.2.** Creation date and time.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR10.1.1.3.** User who made the last modification.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**UR10.1.1.4.** Date and time of the last modification.

&nbsp;&nbsp;&nbsp;&nbsp;**UR10.1.2.** This record shall be made automatically in each creation or modification operation, without requiring any additional action from the user.

---

### Non-functional requirements

| ID | Attribute | Description |
|---|---|---|
| RNF-01 | Availability | The system shall be operational 24/7 and accessible from any modern browser. |
| RNF-02 | Performance | Routine operations (queries, entity creation) shall respond in less than 2 seconds under normal usage conditions. |
| RNF-03 | Portability | The system shall be deployable on the university infrastructure using Docker containers, without dependencies on the underlying operating system. |
| RNF-04 | Privacy | The system shall comply with the General Data Protection Regulation (GDPR) in the processing of users' personal data. |
| RNF-05 | Usability | The interface shall be accessible to administrator and lecturer profiles without prior technical training. Mandatory fields shall be clearly indicated and errors shall be described in an understandable way. |
| RNF-06 | Accessibility | The interface shall comply with WCAG 2.1 level AA guidelines. |
| RNF-07 | Internationalisation | The interface shall be available in Spanish and English. |
| RNF-08 | Compatibility | The interface shall work correctly in the last two versions of Chrome, Firefox, Safari and Edge. |
| RNF-09 | Responsive | The interface shall adapt to mobile devices, tablets and desktop. |
| RNF-10 | Security | All communication shall be encrypted using HTTPS. Passwords shall be stored encrypted and shall never be transmitted in plain text. |
| RNF-11 | Scalability | The system shall support at least 200 concurrent users without noticeable performance degradation. |
| RNF-12 | Maintainability | The system shall have an automated test suite that validates the main functionalities before each deployment. |

---

## 3.3 Alternatives

This section describes the decisions where there was freedom of choice between functional or technical alternatives, detailing the pros and cons of each option and the justification for the selected alternative.

### 3.3.1 Authentication system

The system requires managing the identity of users who access the administration and teaching functions. Three alternatives were evaluated:

**Option A — Custom authentication system** (email + password with email activation): provides full control over the access process and introduces no external dependencies for the critical login function. Requires managing the complete credential lifecycle: secure password storage, recovery mechanism and activation tokens. Introduces direct responsibility for the security of users' credentials.

**Option B — University of Oviedo institutional SSO** (Microsoft/Azure AD): eliminates password management, delegates security to the institutional provider and naturally integrates all university staff. It is the option with the best security/maintenance cost ratio. **It was not available** for integration by external applications at the time of development, pending configuration by SUTIC.

**Option C — Google OAuth as the sole authentication mechanism**: equally eliminates password management and delegates security to Google. Introduces dependency on an external service for access to the most critical function of the system.

**Chosen option: Option A**, by elimination. Option B, which would have been the most appropriate from a security standpoint, was not available at the time of development. Option C introduces an unacceptable external dependency for access control. This decision is acknowledged as a **known system limitation**: by managing its own passwords the system assumes risks that a delegated authentication system would avoid. Integration with the institutional SSO is documented as future work.

*Note:* Google OAuth is used in the system, but only to enable calendar synchronisation with Google Calendar (UR1.6), not as a login mechanism.

---

### 3.3.2 Type of web application

The most suitable web application model for the system's needs was evaluated:

**Option A — SPA (Single Page Application) with independent API backend**: the interface is loaded once and subsequent interactions are made via API calls without reloading the page. The backend and frontend are independent components that evolve autonomously. All functionality requires JavaScript active in the browser.

**Option B — Server-side rendering (SSR) application** (e.g. Next.js): the server generates the HTML of each page before sending it to the client, improving the first load time and search engine positioning. No real benefit in this context, given that all management routes require prior authentication and the public schedule consultation does not need search engine indexing.

**Option C — Traditional monolithic application**: lower initial complexity by not separating frontend and backend. Makes independent scaling of the different system components more difficult.

**Chosen option: Option A.** SSR adds no value for this system since all management routes are protected by authentication. The SPA allows a more reactive interface, especially in the calendar view with multiple interactive filters. The frontend/backend separation also facilitates independent development and maintenance of each part.

---

### 3.3.3 Google Calendar synchronisation model

Google Calendar integration required deciding when and how to propagate changes from the system to Google Calendars:

**Option A — Incremental synchronisation** (propagate each individual change in real time):
- *Pro:* the Google Calendar always reflects the most up-to-date state of the system.
- *Con:* the Google Calendar API quota is shared at the Google Cloud project level (not per user). The volume of changes during semester planning — hundreds of event creations, modifications and cancellations — would exhaust the available quota within hours.

**Option B — Full on-demand synchronisation** (the administrator manually triggers synchronisation; the system deletes and recreates all events from the current state):
- *Pro:* guarantees complete consistency between the system and Google Calendar with a single run, eliminating any accumulated desynchronisation. Quota consumption is predictable and bounded.
- *Con:* changes are not reflected in Google Calendar until the administrator explicitly triggers the synchronisation.

**Chosen option: Option B.** The Google Calendar API quota (400 operations per minute at project level) makes incremental synchronisation unviable for a calendar with hundreds of events during intensive planning periods. The actual usage pattern — bulk changes at the beginning of the semester — is well suited to full on-demand synchronisation. Furthermore, another application in the EII ecosystem directly consumes these Google Calendars, so complete consistency at the time of synchronisation is more important than the immediate propagation of each individual change.

---

### 3.3.4 Public access to schedules

Whether schedule consultation should be available to anyone or restricted to authenticated users was evaluated:

**Option A — Public access without authentication** (as the legacy viewer): anyone can view schedules without needing to register.

**Option B — Access restricted to authenticated users**: only staff with an account in the system can view schedules.

**Chosen option: Option A.** The system replaces an existing public consultation tool used by students and the general public. Requiring authentication to view schedules would represent a functional regression without justification. Public access is a non-negotiable requirement dictated by the usage context.

---

### 3.3.5 Scope of Google Calendar synchronisation by role

Which user roles could manage Google Calendar synchronisation was evaluated:

**Option A — Synchronisation available to all authenticated users** (lecturers and administrators): any user with an account can connect their Google account and synchronise calendars.

**Option B — Synchronisation restricted to the administrator role**: only administrators can manage the synchronisation of classroom calendars with Google.

**Chosen option: Option B.** The Google Calendar API quota is consumed at the Google Cloud project level, not per individual user. If multiple lecturers could synchronise their own copies of the calendar, quota consumption would be proportional to the number of active users, making the functionality unviable at scale. Centralising synchronisation in the administrator role allows strict control of quota consumption and guarantees that the Google Calendars consumed by another EII ecosystem application are always managed by authorised staff.
