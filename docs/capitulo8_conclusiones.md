# Chapter 8 — CONCLUSIONS AND FUTURE WORK

## 8.1 Conclusions

The main goal of this project was to give the Escuela de Ingeniería Informática a working replacement for its legacy scheduling system, and that goal has been achieved. The application is deployed, real users can access it, and it has been presented to EII staff as a candidate to take over from the previous toolchain.

This project also shows that a complete system with real users, real infrastructure, and real deployment constraints can be built within the scope of a Final Degree Project — and still be done properly. The decision to use microservices, invest in automated testing, set up a CI/CD pipeline, and keep the data model flexible was not about making the project look ambitious; those choices are what made the system actually work in practice, and what will keep it working as it gets maintained over time.

The features described in the next section as future work were not dropped — they were deferred on purpose. The audit fields are already in place, the navigation sections exist and are ready to be filled, and the code structure was designed with growth in mind. The EII does not just receive a tool that works today; it receives something that can be extended gradually, without having to tear anything down first.

---

## 8.2 Future Work

This section describes possible lines of future work that, although not incorporated into the current system, represent relevant improvements that would increase its value, usability, and maintainability. For each extension, an explanation is provided of what it consists of, what advantages it would bring to the system, and why it was not included in the project scope.

### 8.2.1 OAuth 2.0 Authentication with Microsoft (Institutional SSO)

The system currently implements a custom authentication mechanism based on JWT, with internal password management, email-based recovery, and OTP verification. While this solution is functional and secure, it requires each user to remember application-specific credentials that are separate from those they already use in their day-to-day university activities.

A natural improvement would be to integrate federated authentication using the OAuth 2.0 / OpenID Connect standard with Microsoft, leveraging the institutional accounts of the Universidad de Oviedo (`uoXXXXXX@uniovi.es`). The university uses Microsoft 365, so all users — teachers and administrators alike — already have an active and familiar account. This integration would eliminate the need to manage a proprietary identity system and would align the application with the technological ecosystem already established at the institution.

It is worth noting that the project already has a Google OAuth integration, but this was implemented exclusively for synchronising the classroom calendar with Google Calendar, not for user authentication. The extension proposed here is independent of that functionality and would focus on the login flow.

The advantages of this extension are multiple:

- **Reduced friction for users:** no need to remember an additional application-specific password, as existing institutional credentials are reused.
- **Delegated security:** Microsoft invests considerable resources in the security of its identity platform (Microsoft Entra ID, formerly Azure Active Directory), meaning critical vulnerabilities are addressed far more quickly than would be possible if the authentication system depended solely on the application development team.
- **Natural integration with the university environment:** by using the same `uniovi.es` accounts, user provisioning and deprovisioning would be partially tied to the institutional directory, reducing administrative overhead.
- **Standards compliance:** OAuth 2.0 / OIDC are widely adopted protocols, which facilitates security audits and interoperability with other university systems.

This extension was not included in the project due to time constraints and because its implementation required registering the application in the university's Azure portal, which involved organisational and institutional decisions outside the scope of a Final Degree Project.

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

### 8.2.4 Real-Time Notifications

Currently, when an administrator approves or rejects an event change request, the teacher involved can only learn the outcome by manually accessing the requests section. Similarly, when changes occur in calendars that affect multiple users, no immediate alert mechanism exists.

A relevant extension would be the integration of a **real-time notification system** using WebSockets (or similar technologies such as Server-Sent Events), which would inform affected users at the moment relevant changes occur: approval of requests, new requests pending review, modifications to shared calendars, and so on.

The project's microservices architecture is compatible with this improvement, as the gateway service could act as an intermediary for distributing real-time events to connected clients.

### 8.2.5 Web Application Firewall (WAF)

In the production deployment, all external traffic enters through a single public entry point — the web server — which handles incoming requests and routes them to the internal application components, none of which are directly reachable from the Internet. Despite this, no dedicated security layer currently examines whether those requests are legitimate before they reach the application itself. A **Web Application Firewall (WAF)** would sit in front of the web server and fill this gap: it analyses all incoming traffic and blocks requests that match known attack patterns — most notably those catalogued in the **OWASP Top 10**, such as SQL injection, cross-site scripting, or brute-force login attempts — and also provides protection against large-scale automated attacks and bot traffic, all without requiring any modifications to the application code. This would add a meaningful layer of defence in depth for a system that handles sensitive institutional data. Configuring a WAF was not included in the project scope because it requires decisions about the final deployment environment — such as how the domain is managed and where certificates are issued — that depend on the institution and go beyond what can be resolved within a Final Degree Project.

Among the available options, **Cloudflare WAF** is the most practical starting point: it works as an external service that intercepts traffic before it reaches the server simply by routing the domain through Cloudflare's infrastructure, combining firewall protection, content delivery acceleration, and DDoS mitigation under a single plan with a functional free tier whose protection rules are kept up to date automatically. Alternatives include **AWS WAF** or **Azure Front Door WAF** for deployments hosted in those cloud environments, and **ModSecurity** as an open-source option that can be installed directly on the server for teams that prefer full control over the configuration.

### 8.2.6 Request Rate Limiting

TeachingPlanner is accessible from the public Internet, which means that its login and password-recovery screens are reachable by anyone — not just university staff. Without any mechanism to limit the number of requests a single user can make in a given period, these screens are exposed to **brute-force attacks** (systematically trying large numbers of passwords against a known account) and **credential-stuffing attacks** (replaying username-and-password combinations leaked from other services). The password-recovery flow is particularly sensitive: an attacker who repeatedly triggers it can flood the institutional email system with one-time codes and exhaust server resources. Beyond authentication, unrestricted automated access to the calendar-generation features could also be exploited to deliberately slow down the application for legitimate users, an attack that network-level protections alone would not prevent.

A **rate-limiting mechanism** addresses this by capping how many requests a single visitor can make within a given time window — applying stricter limits to authentication-related actions (for example, allowing no more than a handful of login attempts per quarter-hour from the same address) and more relaxed limits to read-only operations. This can be implemented directly within the application using libraries readily available for the technology stack in use, or — if a WAF is deployed as described in §8.2.5, particularly Cloudflare — enforced externally with no changes to the application code whatsoever. This improvement was not included in the initial version because the deployment context is a university environment with a relatively small and known user base, which reduces the likelihood of targeted attacks. However, since the application is publicly reachable, that assumption does not eliminate the risk, and adding rate limiting should be a priority before any broader rollout.

---

> It is important to note that all extensions described in this section are compatible with the current system architecture. During the project design phase, decisions were made with future extensibility in mind: the separation into independent microservices, the use of audit fields in all domain model entities, the existence of navigation sections ready to receive content, and the compatibility of the data model with future external integrations are clear examples of this long-term vision. The primary reason these features were not included in the project scope was the time constraint inherent to a Final Degree Project, not any technical or architectural incompatibility.
