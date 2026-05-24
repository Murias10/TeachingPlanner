# Capítulo 2 — PLANNING AND MANAGEMENT (PLANIFICACIÓN Y GESTIÓN)

---

## 2.1 PROJECT PLANNING

### 2.1.1 Stakeholder Identification

Stakeholder identification consists of determining all individuals, groups or systems that have an interest in the project or that could be affected by its development and outcome. Identifying them early makes it possible to align expectations, detect conflicting needs and ensure that the solution addresses the actual users of the system.

A total of six stakeholders have been identified for TeachingPlanner. These include the head of studies of the EII, who is responsible for coordinating academic scheduling and is the main beneficiary of the tool; the teaching staff, who will use it to consult their timetables and submit change requests; and the students, who will access the published schedules. Additionally, other applications within the EII ecosystem that depend on the existing files and calendars, the university IT Service (SUTIC) responsible for the production infrastructure, and the development team itself have been identified as stakeholders. Each stakeholder is described in full — including their role and main needs — in Section 3.1.4 of the Stakeholder Requirements chapter.

### 2.1.2 OBS and PBS

### 2.1.3 Initial Planning. WBS

### 2.1.4 Risks

This section describes the main risks identified for the TeachingPlanner project and the planned strategies for managing them. The full Risk Management Plan can be consulted in the corresponding annex.

#### 2.1.4.1 Risk Management Plan

Risks were identified during the analysis phase, considering any process or circumstance that could affect the project positively or negatively. For each risk, the probability of occurrence and the potential impact on four dimensions have been assessed: **budget**, **planning**, **scope** and **quality**. The priority value is the product of the probability and the highest impact value across the four dimensions, and is used to rank risks from most to least critical.

A total of **11 risks** have been identified, including one positive risk (opportunity). Their detailed analysis and contingency responses are provided in Section 2.1.4.3. Risk evolution is tracked during project execution (Section 2.2.3), and the final risk report is included in the project closure (Section 2.3.2).

#### 2.1.4.2 Risk Identification

| ID | Name | Description |
|----|------|-------------|
| R1 | Time estimation errors | TeachingPlanner includes several technically demanding modules — the event character system (N/P/I/Custom), the Google Calendar synchronisation job and the microservice architecture as a whole — whose real complexity may only become apparent during construction. The developer assumes all roles simultaneously, so an underestimate in any one module can quickly cascade into a schedule deviation that threatens the TFG submission deadline. |
| R2 | Changes in requirements by the client | The Academic Affairs Office acts as the project client and may request changes to the functional scope once development is under way — for example, new event types, a different import format or adjustments to the change-request workflow. Because this is a real institutional commission, late changes can have cascading effects on the data model, the TypeORM migrations and the frontend, making early agreement on scope essential. |
| R3 | Changes in requirements due to analysis errors | The academic calendar domain is complex enough (semester structures, day characters, planned-hours budgets, round-robin scheduling) that some requirements may be ambiguously specified during analysis and only surface as problems during construction or testing, requiring rework that was not planned for. |
| R4 | Dependency on external APIs (Google Calendar) | The system relies on the Google Calendar API v3 and OAuth 2.0 for calendar synchronisation. Google can introduce breaking changes, deprecate endpoints, tighten OAuth policies or alter quota limits without prior notice, any of which would disable or degrade the synchronisation feature entirely. |
| R5 | Slow adoption by users (EII staff) | The head of studies and teaching staff are used to managing schedules through manual processes and spreadsheets. Even with a well-designed system, transitioning away from a long-established workflow can meet resistance, and low adoption would directly undermine the project's main objective. |
| R6 | Early project completion *(Positive risk)* | Prior experience with the technology stack and a well-structured plan could allow certain phases to finish ahead of schedule. This surplus time is an opportunity to increase test coverage, improve the UI or address backlog items that were deprioritised due to scope constraints. |
| R7 | Cost estimation errors | The cost estimates are based on hourly rates applied to the work hours planned for each role. The Planner Service (~106 h) and the testing phase carry the most estimation uncertainty. Significant underestimates would distort the financial viability analysis in the initial and final budget reports. |
| R8 | Infrastructure availability issues (university VM) | The production system is deployed on a virtual machine managed by the University IT Service (SUTIC, STK-05). The developer has no direct control over this infrastructure: provisioning the machine, assigning network access through the institutional VPN, applying OS updates or scheduling maintenance windows are all decisions made by SUTIC. Any delay in provisioning, unplanned maintenance or infrastructure failure could block deployment or make the system unavailable, and the resolution timeline depends entirely on a third party. |
| R9 | Low performance in production under peak load | Usage peaks at the start of each semester, when all teaching staff consult or update timetables simultaneously. The university VM has limited resources, and unoptimised queries, missing database indices or an inefficient synchronisation job could cause response times that violate the non-functional performance requirements (RNF-PERF). |
| R10 | Resource availability delay (sole developer) | The whole project is delivered by a single developer who simultaneously manages other academic commitments, examinations and personal obligations. Illness or an unexpected workload spike leaves no one to cover, meaning even a short interruption translates directly into schedule slippage. |
| R11 | Ineffective user training and onboarding | The long-term value of the system depends on EII staff actually using it. If the documentation is too technical or too sparse, users may find it easier to fall back to the existing Excel-based workflow, making the deployment a technical success but a practical failure. |

#### 2.1.4.3 Risk Register

The following table summarises the probability and impact analysis for each identified risk. The total priority value is calculated as the product of the probability and the highest impact value across the four dimensions.

**Table 2.1.4.3.1 — Risk analysis and prioritisation**

| ID | Category | Probability | Budget | Planning | Scope | Quality | Total |
|----|----------|-------------|--------|----------|-------|---------|-------|
| R1 | Project Management (Estimation) | High | Medium | Critical | High | High | **0.63** |
| R2 | Technical (Requirements) | High | High | Critical | High | High | **0.63** |
| R3 | Technical (Requirements) | Medium | Medium | Critical | Medium | Medium | **0.45** |
| R4 | Technical (External APIs) | Medium | Critical | Critical | Medium | High | **0.45** |
| R5 | External (User) | Medium | Medium | Critical | High | Medium | **0.45** |
| R6 | Project Management (Planning) — *Positive* | Medium | Critical | Critical | Negligible | Negligible | **0.27** |
| R7 | Project Management (Estimation) | Low | Critical | Negligible | Negligible | Negligible | **0.27** |
| R8 | Technical (Technology) | Low | Critical | Critical | Critical | Low | **0.27** |
| R9 | Technical (Performance) | Low | Medium | Medium | High | Critical | **0.27** |
| R10 | External (Human Resources) | Low | Low | Critical | Negligible | High | **0.27** |
| R11 | External (User) | Low | High | High | Medium | High | **0.17** |

**Table 2.1.4.3.2 — Contingency plan**

| ID | Strategy | Risk response |
|----|----------|---------------|
| R1 | Mitigate the risk | A two-week contingency buffer is built into the schedule. Progress will be reviewed weekly with the supervisor; if a deviation is detected, the backlog will be re-prioritised to protect delivery of the core features within the deadline. |
| R2 | Mitigate the risk | Requirements will be elicited and agreed exhaustively with the EII before construction begins. Any subsequent scope change must go through a formal change-control process requiring supervisor approval. Time contingency in the schedule absorbs the impact of approved changes. |
| R3 | Mitigate the risk | The full SRS will be reviewed and validated with the supervisor before construction starts. Requirements will be cross-checked against use cases and acceptance criteria iteratively, so that ambiguities are caught early rather than discovered mid-implementation. |
| R4 | Mitigate the risk | All Google Calendar logic is encapsulated in `google-calendar.service.ts`, isolating the dependency. The Google API changelog and OAuth policy announcements will be monitored regularly. Synchronisation failures will degrade gracefully — logging the error and retrying — without disrupting the rest of the application. |
| R5 | Mitigate the risk | EII staff will be involved in user-acceptance testing before deployment. The UI will be designed with intuitive navigation and clear labels. A user manual and short walkthrough videos will be provided to lower the barrier for less technical users. |
| R6 | Exploit the risk | If any phase finishes ahead of schedule, the freed time will be used to increase test coverage (target ≥ 70%), refine UI/UX details or document lower-priority features from the backlog. |
| R7 | Mitigate the risk | Costs will be estimated carefully during planning, with explicit contingency margins in the budget. Actual hours will be logged at each phase closure and compared to estimates so that any systematic bias is caught before the final report. |
| R8 | Mitigate the risk | The need for a university VM will be communicated to SUTIC (STK-05) as early as possible to avoid provisioning delays. The deployment timeline will include buffer time to absorb scheduled maintenance windows. The application will be containerised with Docker so that it can be migrated to a different machine quickly if needed. The MariaDB database will be backed up regularly so that data can be restored after any infrastructure incident. |
| R9 | Mitigate the risk | Database queries and indices will be optimised throughout construction. TypeORM relations will be reviewed to eliminate N+1 patterns. Load tests will be run before deployment to identify bottlenecks under realistic concurrent usage. |
| R10 | Mitigate the risk | The delivery schedule will be planned to avoid overlap with university examination periods. A running task log will make it easy to resume work after an interruption. Any significant delay will be reported to the supervisor immediately so that the plan can be adjusted together. |
| R11 | Mitigate the risk | A user manual and installation guide written for non-technical staff will be delivered with the system. A pilot session with the head of studies will be run before final deployment to gather feedback and adjust documentation accordingly. |

### 2.1.5 Initial Budget

#### 2.1.5.1 Cost Budget

#### 2.1.5.2 Client Budget

---

## 2.2 PROJECT EXECUTION

### 2.2.1 Planning Monitoring Plan

### 2.2.2 Project Issue Log

### 2.2.3 Risks

---

## 2.3 PROJECT CLOSURE

### 2.3.1 Final Planning

### 2.3.2 Final Risk Report

### 2.3.3 Final Cost Budget

### 2.3.4 Lessons Learned Report
