# Chapter 8 — CONCLUSIONS AND FUTURE WORK

## 8.1 Conclusions

*(To be written.)*

## 8.2 Future Work

This section describes possible lines of future work that, although not incorporated into the current system, represent relevant improvements that would increase its value, usability, and maintainability. For each extension, an explanation is provided of what it consists of, what advantages it would bring to the system, and why it was not included in the project scope.

### 8.2.1 OAuth 2.0 Authentication with Microsoft (Institutional SSO)

The system currently implements a custom authentication mechanism based on JWT, with internal password management, email-based recovery, and OTP verification. While this solution is functional and secure, it requires each user to remember application-specific credentials that are separate from those they already use in their day-to-day university activities.

A natural improvement would be to integrate federated authentication using the OAuth 2.0 / OpenID Connect standard with Microsoft, leveraging the institutional accounts of the University of Oviedo (`uoXXXXXX@uniovi.es`). The university uses Microsoft 365, so all users — teachers and administrators alike — already have an active and familiar account. This integration would eliminate the need to manage a proprietary identity system and would align the application with the technological ecosystem already established at the institution.

It is worth noting that the project already has a Google OAuth integration, but this was implemented exclusively for synchronising the classroom calendar with Google Calendar, not for user authentication. The extension proposed here is independent of that functionality and would focus on the login flow.

The advantages of this extension are multiple:

- **Reduced friction for users:** no need to remember an additional application-specific password, as existing institutional credentials are reused.
- **Delegated security:** Microsoft invests considerable resources in the security of its identity platform (Microsoft Entra ID, formerly Azure Active Directory), meaning critical vulnerabilities are addressed far more quickly than would be possible if the authentication system depended solely on the application development team.
- **Natural integration with the university environment:** by using the same `uniovi.es` accounts, user provisioning and deprovisioning would be partially tied to the institutional directory, reducing administrative overhead.
- **Standards compliance:** OAuth 2.0 / OIDC are widely adopted protocols, which facilitates security audits and interoperability with other university systems.

This extension was not included in the project due to time constraints and because its implementation required registering the application in the university's Azure portal, which involved organisational and institutional decisions outside the scope of a Bachelor's thesis.

### 8.2.2 Audit Log System with Query Interface

The system already has a solid foundation for data traceability: all main entities in the domain model include audit fields that automatically record the moment of creation, the user who created the record, the moment of the last modification, and the user who made it. This means that at the database level it is always possible to know who created or modified any record and when.

However, this information is not currently accessible from the user interface. The proposed extension consists of two parts:

1. **Study and selection of actions to record:** not all events are equally relevant from an audit perspective. A systematic analysis would be needed to determine which operations should generate log entries (for example, approval or rejection of event requests, bulk calendar imports, deletion of groups, etc.) and which can be omitted to avoid noise.
2. **Log query page for administrators:** the project already includes a records section and a reports section in its navigation, both currently without content. Completing these sections would allow administrators to filter and search actions by user, date range, entity type, or operation type. The component library used in the frontend provides all the necessary elements to build this interface in a manner consistent with the rest of the design.

This functionality was not developed in the current project because, although the data infrastructure was ready, designing the interface and defining the log model required significant prior analysis that fell outside the available time.

### 8.2.3 Undo and Redo Calendar Actions

Interacting with the calendar is the most critical and frequent part of the application. Creating, editing, or deleting periodic or one-off events are operations that, if performed by mistake, can currently only be reverted manually by repeating the steps in reverse. For complex operations affecting multiple events — such as bulk imports or chained modifications — this can represent a considerable amount of work.

A highly valued improvement for users would be an **undo/redo** mechanism for actions performed on the calendar. The system already includes elements that facilitate this implementation: one-off events support logical cancellation without deleting the database record, a link exists between replacement events and their originals, and the change-request workflow provides, indirectly, a certain level of supervised reversibility.

Implementing an action history (command pattern) in the frontend, complemented by specific backend endpoints to revert operations, would allow this functionality to be offered in a robust manner.

This extension was not included primarily due to the complexity it adds to the data model and business logic, especially in the case of periodic events, whose generation involves sophisticated logic for distributing sessions across weeks and consuming the planned-hours budget.

### 8.2.4 Administrator Statistics and Analytics Dashboard

The application manages a considerable amount of academic data: calendars, groups, subjects, classrooms, events, and requests. However, there is currently no consolidated view that allows administrators to obtain global system metrics in a visual format.

A dedicated analytics and statistics page is proposed for the system section, which could include:

- Distribution of teaching load by classroom, subject, or group.
- Change-request statistics: number of approved, rejected, or pending requests, and trends by period.
- Percentage of planned hours versus hours actually generated by the calendar.
- Classroom occupancy throughout the academic year.
- Activity per user (complementing the audit log described in the previous section).

The component library used in the frontend includes a rich set of visualisation elements — charts and data tables among them — that would make this implementation viable in a manner consistent with the current design. This page would complement the audit log page naturally, offering both a quantitative view (statistics) and a qualitative one (action traceability).

This functionality was not developed in the current project given that prioritising the core features of the planning system required all available time.

### 8.2.5 Real-Time Notifications

Currently, when an administrator approves or rejects an event change request, the teacher involved can only learn the outcome by manually accessing the requests section. Similarly, when changes occur in calendars that affect multiple users, no immediate alert mechanism exists.

A relevant extension would be the integration of a **real-time notification system** using WebSockets (or similar technologies such as Server-Sent Events), which would inform affected users at the moment relevant changes occur: approval of requests, new requests pending review, modifications to shared calendars, and so on.

The project's microservices architecture is compatible with this improvement, as the gateway service could act as an intermediary for distributing real-time events to connected clients.

---

> It is important to note that all extensions described in this section are compatible with the current system architecture. During the project design phase, decisions were made with future extensibility in mind: the separation into independent microservices, the use of audit fields in all domain model entities, the existence of navigation sections ready to receive content, and the compatibility of the data model with future external integrations are clear examples of this long-term vision. The primary reason these features were not included in the project scope was the time constraint inherent to a Bachelor's thesis, not any technical or architectural incompatibility.
