# Girik Backend - Complete Codebase Flow Documentation

## Table of Contents
1. [Checklists Module Overview](#checklists-module-overview)
2. [Complete System Architecture](#complete-system-architecture)
3. [Module Interconnections](#module-interconnections)
4. [Request Flow Diagram](#request-flow-diagram)
5. [Database Relationships](#database-relationships)

---

## 1. Checklists Module Overview

### What is the Checklists Module?

The **Checklists Module** (also known as **Activity Planning**) is a feature that allows **surveyors** to fill out standardized checklists for each job/survey they perform. It stores questions and answers related to the activities planned or completed during a marine survey.

### Who Creates Checklists?

**Surveyors** create and submit checklists when they are working on a job. The checklist is associated with a specific `job_id`.

### How Does It Work?

#### Database Model (`activity_planning.model.js`)
```javascript
ActivityPlanning {
  id: UUID (Primary Key)
  job_id: UUID (Foreign Key → JobRequest)
  question_code: STRING (e.g., "Q001", "Q002")
  question_text: STRING (e.g., "Was the vessel inspected?")
  answer: ENUM('YES', 'NO', 'NA')
  remarks: TEXT (Additional comments)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

**Relationships:**
- `ActivityPlanning` belongs to `JobRequest` (Many-to-One)
- Each job can have multiple checklist items

#### API Endpoints

| Method | Endpoint | Description | Access | Body |
|--------|----------|-------------|--------|------|
| `GET` | `/jobs/:jobId/checklist` | Retrieve all checklist items for a job | Authenticated Users | - |
| `PUT` | `/jobs/:jobId/checklist` | Submit/Update checklist items for a job | SURVEYOR only | `{ items: [...] }` |

#### Service Layer (`checklist.service.js`)

**1. Get Checklist**
```javascript
getChecklist(jobId) {
  // Fetches all activity planning items for a specific job
  return ActivityPlanning.findAll({ where: { job_id: jobId } });
}
```

**2. Submit Checklist**
```javascript
submitChecklist(jobId, items, userId) {
  // 1. Delete existing checklist items for the job (replace strategy)
  await ActivityPlanning.destroy({ where: { job_id: jobId } });
  
  // 2. Map new items with job_id
  const entries = items.map(item => ({
    job_id: jobId,
    ...item  // question_code, question_text, answer, remarks
  }));
  
  // 3. Bulk insert new checklist items
  return ActivityPlanning.bulkCreate(entries);
}
```

#### Controller Layer (`checklist.controller.js`)

Handles HTTP requests and responses:
```javascript
getChecklist(req, res, next) {
  const list = await checklistService.getChecklist(req.params.jobId);
  res.json({ success: true, data: list });
}

submitChecklist(req, res, next) {
  const list = await checklistService.submitChecklist(
    req.params.jobId, 
    req.body.items, 
    req.user.id
  );
  res.json({ success: true, data: list });
}
```

#### Routes Layer (`checklist.routes.js`)

Defines the API routes with middleware:
```javascript
router.use(authenticate);  // All routes require authentication

// GET checklist - any authenticated user
router.get('/jobs/:jobId/checklist', checklistController.getChecklist);

// PUT checklist - only SURVEYOR role
router.put(
  '/jobs/:jobId/checklist', 
  authorizeRoles('SURVEYOR'),  // RBAC middleware
  validate(schemas.submitChecklist),  // Joi validation
  checklistController.submitChecklist
);
```

### Typical Usage Flow

1. **Surveyor is assigned to a job** (via Job Module)
2. **Surveyor starts survey** (via Survey Module)
3. **Surveyor fills out checklist** during or after the survey
   - Frontend sends `PUT /api/v1/jobs/:jobId/checklist` with items array
4. **System validates** the request (authentication, authorization, schema)
5. **Service layer** replaces old checklist with new items
6. **Response** returns the saved checklist items

---

## 2. Complete System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Frontend)                        │
│              React/Vue/Mobile App                            │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/HTTPS Requests
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXPRESS APP (app.js)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Middleware Stack:                                     │   │
│  │ - CORS, Helmet, Morgan (Logging)                     │   │
│  │ - Body Parser (JSON/URL-encoded)                     │   │
│  │ - Cookie Parser                                       │   │
│  │ - Rate Limiter                                        │   │
│  │ - API Logger (apiLogger)                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                     │                                        │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           ROUTES (routes.js)                         │   │
│  │  /api/v1/* → Module-specific routers                 │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    MODULE ROUTERS                            │
│  ┌────────────┬────────────┬────────────┬────────────┐      │
│  │   Auth     │   Jobs     │  Vessels   │ Checklists │      │
│  │  Routes    │  Routes    │  Routes    │  Routes    │ ...  │
│  └────────────┴────────────┴────────────┴────────────┘      │
│                     │                                        │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Middleware: authenticate, authorizeRoles, validate   │   │
│  └──────────────────────────────────────────────────────┘   │
│                     │                                        │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              CONTROLLERS                             │   │
│  │  Handle HTTP req/res, call services                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                     │                                        │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              SERVICES                                │   │
│  │  Business logic, data manipulation                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                     │                                        │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              MODELS (Sequelize ORM)                  │   │
│  │  Database schema, associations, queries              │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   MySQL DATABASE                             │
│  Tables: users, clients, vessels, jobs, certificates, etc.  │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure Breakdown

```
src/
├── app.js                    # Express app configuration
├── server.js                 # Entry point, starts server
├── routes.js                 # Main router aggregator
│
├── config/                   # Configuration files
│   ├── database.js           # Sequelize config
│   ├── aws.js                # S3 client
│   ├── mail.js               # Email transporter
│
├── middlewares/              # Express middlewares
│   ├── auth.middleware.js    # JWT authentication
│   ├── rbac.middleware.js    # Role-based access control
│   ├── validate.middleware.js # Joi validation
│   ├── error.middleware.js   # Global error handler
│   └── api.logger.middleware.js # Request/response logging
│
├── models/                   # Sequelize models (40+ models)
│   ├── index.js              # Model loader & associations
│   ├── user.model.js
│   ├── client.model.js
│   ├── vessel.model.js
│   ├── job_request.model.js
│   ├── activity_planning.model.js  # Checklist model
│   └── ...
│
├── modules/                  # Feature-based modules (30+ modules)
│   ├── auth/                 # Authentication
│   ├── clients/              # Client management
│   ├── vessels/              # Vessel registry
│   ├── jobs/                 # Job workflow
│   ├── checklists/           # Activity planning (checklists)
│   ├── surveys/              # Survey reports
│   ├── certificates/         # Certificate generation
│   ├── payments/             # Invoicing & payments
│   ├── surveyors/            # Surveyor management
│   ├── dashboard/            # Dashboard statistics
│   └── ...
│
├── services/                 # Cross-module services
│   ├── notification.service.js  # Notifications
│   ├── s3.service.js         # File uploads
│   └── cron.service.js       # Scheduled tasks
│
└── utils/                    # Helper utilities
    ├── logger.js             # Winston logger
    └── geoValidator.js       # GPS validation
```

---

## 3. Module Interconnections

### Core Module Dependencies

```
┌──────────────────────────────────────────────────────────────┐
│                        AUTH MODULE                            │
│  - Login, Register, Logout, Password Reset                   │
│  - Issues JWT tokens (HttpOnly cookies)                      │
└────────────────────┬─────────────────────────────────────────┘
                     │ Provides authentication for all modules
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                      USER MODULE                              │
│  - User CRUD, Role management                                │
│  - Roles: ADMIN, GM, TM, TO, TA, SURVEYOR, CLIENT            │
└────────────────────┬─────────────────────────────────────────┘
                     │ Users are associated with entities
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                    CLIENT MODULE                              │
│  - Client companies (shipping companies)                     │
│  - Each client owns vessels                                  │
└────────────────────┬─────────────────────────────────────────┘
                     │ One-to-Many
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                    VESSEL MODULE                              │
│  - Vessel registry (ships, boats)                            │
│  - IMO numbers, vessel details                               │
└────────────────────┬─────────────────────────────────────────┘
                     │ Vessels require surveys/certifications
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                     JOB MODULE                                │
│  - Job requests for surveys/certifications                   │
│  - Workflow: CREATED → ASSIGNED → IN_PROGRESS → COMPLETED    │
│  - Assigned to surveyors                                     │
└────────┬────────────┬────────────┬────────────┬──────────────┘
         │            │            │            │
         ▼            ▼            ▼            ▼
    ┌────────┐  ┌──────────┐  ┌────────┐  ┌──────────┐
    │CHECKLIST│  │ SURVEY   │  │  NC    │  │CERTIFICATE│
    │ MODULE │  │ MODULE   │  │ MODULE │  │  MODULE   │
    └────────┘  └──────────┘  └────────┘  └──────────┘
         │            │            │            │
         └────────────┴────────────┴────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │   PAYMENT MODULE       │
         │   Invoicing & Billing  │
         └────────────────────────┘
```

### Detailed Module Relationships

#### 1. **Client → Vessel → Job Flow**

```
CLIENT creates account
  ↓
CLIENT registers VESSELS
  ↓
CLIENT requests JOB (survey/certification) for a VESSEL
  ↓
ADMIN/GM assigns SURVEYOR to JOB
  ↓
SURVEYOR performs survey
  ↓
SURVEYOR submits:
  - SURVEY REPORT (photos, GPS, findings)
  - CHECKLIST (activity planning items)
  - NON-CONFORMITIES (if any issues found)
  ↓
TM/TO reviews and approves
  ↓
CERTIFICATE is generated
  ↓
PAYMENT invoice is created
  ↓
CLIENT pays invoice
  ↓
JOB status = COMPLETED
```

#### 2. **Authentication & Authorization Flow**

```
User sends login request
  ↓
AUTH MODULE validates credentials
  ↓
JWT token issued (stored in HttpOnly cookie)
  ↓
User makes API request with cookie
  ↓
authenticate middleware validates JWT
  ↓
authorizeRoles middleware checks user role
  ↓
If authorized → proceed to controller
  ↓
Controller calls service
  ↓
Service interacts with models/database
  ↓
Response sent back to user
```

#### 3. **Job Lifecycle & Related Modules**

```
JOB CREATED (by CLIENT/ADMIN)
  ↓
JOB ASSIGNED (to SURVEYOR by GM)
  ↓
SURVEYOR starts survey
  ├── Submits GPS tracking (SURVEY MODULE)
  ├── Uploads photos (DOCUMENT MODULE)
  ├── Fills CHECKLIST (CHECKLIST MODULE)
  └── Reports issues (NC MODULE)
  ↓
SURVEYOR finalizes survey
  ↓
TM/TO reviews
  ├── Approves → CERTIFICATE generated
  └── Rejects → SURVEYOR must revise
  ↓
CERTIFICATE issued
  ↓
PAYMENT invoice created
  ↓
JOB COMPLETED
```

#### 4. **Cross-Module Services**

**Notification Service** (used by multiple modules):
```javascript
// Called from:
- Job Module (job assigned, escalated)
- Certificate Module (certificate expiring)
- Payment Module (payment due)
- Survey Module (survey submitted)

notificationService.notifyRoles(['SURVEYOR'], 'Job Assigned', 'You have a new job');
```

**S3 Service** (file uploads):
```javascript
// Used by:
- Survey Module (photos)
- Document Module (PDFs, files)
- Certificate Module (certificate PDFs)
- Surveyor Module (CV uploads)

s3Service.uploadFile(file, 'surveys/photos/');
```

**Cron Service** (scheduled tasks):
```javascript
// Runs daily:
- Check expiring certificates
- Send reminder notifications
- Clean up old logs
```

---

## 4. Request Flow Diagram

### Example: Surveyor Submits Checklist

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Frontend (Surveyor fills checklist form)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ PUT /api/v1/jobs/123/checklist
                     │ Cookie: jwt=<token>
                     │ Body: { items: [{...}, {...}] }
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Express App (app.js)                                      │
│    - CORS check                                              │
│    - Body parser (parse JSON)                                │
│    - Cookie parser (extract JWT)                             │
│    - Rate limiter                                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Main Router (routes.js)                                   │
│    Route: /api/v1/* → checklistRoutes                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Checklist Router (checklist.routes.js)                   │
│    Route: PUT /jobs/:jobId/checklist                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Middleware Stack (executed in order)                     │
│    a) authenticate(req, res, next)                          │
│       - Verify JWT from cookie                              │
│       - Decode user info (id, role, email)                  │
│       - Attach to req.user                                  │
│                                                              │
│    b) authorizeRoles('SURVEYOR')                            │
│       - Check if req.user.role === 'SURVEYOR'               │
│       - If not → 403 Forbidden                              │
│                                                              │
│    c) validate(schemas.submitChecklist)                     │
│       - Validate req.body against Joi schema                │
│       - Ensure items array exists and is valid              │
│       - If invalid → 400 Bad Request                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Controller (checklist.controller.js)                     │
│    submitChecklist(req, res, next)                          │
│    - Extract jobId from req.params                          │
│    - Extract items from req.body                            │
│    - Extract userId from req.user.id                        │
│    - Call service layer                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Service (checklist.service.js)                           │
│    submitChecklist(jobId, items, userId)                    │
│    - Delete existing checklist items for this job          │
│    - Map items array to include job_id                      │
│    - Bulk insert new checklist items                        │
│    - Return saved items                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Model (ActivityPlanning via Sequelize)                   │
│    - ActivityPlanning.destroy({ where: { job_id } })        │
│    - ActivityPlanning.bulkCreate(entries)                   │
│    - Execute SQL queries on MySQL database                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Database (MySQL)                                          │
│    DELETE FROM activity_plannings WHERE job_id = '123';     │
│    INSERT INTO activity_plannings (id, job_id, ...) VALUES  │
│    (...), (...), (...);                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. Response flows back up the chain                        │
│     Service → Controller → Express → Frontend               │
│     { success: true, data: [...checklist items...] }        │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Database Relationships

### Entity Relationship Diagram (Simplified)

```
┌──────────────┐
│    User      │
│──────────────│
│ id (PK)      │
│ email        │
│ role         │
│ password_hash│
└──────┬───────┘
       │
       │ created_by / assigned_to
       │
       ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Client     │──────▶│   Vessel     │──────▶│ JobRequest   │
│──────────────│ 1:N   │──────────────│ 1:N   │──────────────│
│ id (PK)      │       │ id (PK)      │       │ id (PK)      │
│ company_name │       │ vessel_name  │       │ vessel_id(FK)│
│ email        │       │ imo_number   │       │ job_status   │
└──────────────┘       │ client_id(FK)│       │ surveyor_id  │
                       └──────────────┘       └──────┬───────┘
                                                     │
                       ┌─────────────────────────────┼─────────────────┐
                       │                             │                 │
                       ▼                             ▼                 ▼
              ┌─────────────────┐         ┌──────────────────┐  ┌──────────────┐
              │ActivityPlanning │         │  SurveyReport    │  │ Certificate  │
              │─────────────────│         │──────────────────│  │──────────────│
              │ id (PK)         │         │ id (PK)          │  │ id (PK)      │
              │ job_id (FK)     │         │ job_id (FK)      │  │ job_id (FK)  │
              │ question_code   │         │ gps_latitude     │  │ cert_number  │
              │ question_text   │         │ gps_longitude    │  │ valid_until  │
              │ answer          │         │ photo_url        │  │ status       │
              │ remarks         │         │ findings         │  └──────────────┘
              └─────────────────┘         └──────────────────┘
                                                     │
                                                     ▼
                                          ┌──────────────────┐
                                          │NonConformity     │
                                          │──────────────────│
                                          │ id (PK)          │
                                          │ job_id (FK)      │
                                          │ description      │
                                          │ severity         │
                                          │ status           │
                                          └──────────────────┘
```

### Key Relationships

1. **User ↔ Client**: One-to-Many (A user can be associated with a client)
2. **Client ↔ Vessel**: One-to-Many (A client owns multiple vessels)
3. **Vessel ↔ JobRequest**: One-to-Many (A vessel can have multiple jobs)
4. **JobRequest ↔ ActivityPlanning**: One-to-Many (A job has multiple checklist items)
5. **JobRequest ↔ SurveyReport**: One-to-One (A job has one survey report)
6. **JobRequest ↔ Certificate**: One-to-One (A job results in one certificate)
7. **JobRequest ↔ NonConformity**: One-to-Many (A job can have multiple NCs)
8. **User ↔ JobRequest**: Many-to-Many (Users create, assign, and work on jobs)

---

## 6. Summary: How Everything Works Together

### The Big Picture

1. **Authentication Layer**: All requests go through JWT authentication
2. **Authorization Layer**: RBAC middleware ensures users can only access allowed resources
3. **Validation Layer**: Joi schemas validate request data
4. **Business Logic Layer**: Services handle complex operations
5. **Data Layer**: Sequelize ORM manages database interactions
6. **Cross-Cutting Concerns**: Logging, notifications, file uploads, scheduled tasks

### Checklists Module in Context

The **Checklists Module** is a **supporting module** for the **Job Module**. It allows surveyors to document their activities in a structured way. The checklist data is stored in the `activity_plannings` table and is associated with a specific job.

**Key Points:**
- **Created by**: Surveyors (during or after survey)
- **Associated with**: Jobs (via `job_id` foreign key)
- **Purpose**: Standardized documentation of survey activities
- **Access Control**: Only surveyors can submit, but others can view
- **Data Model**: Flexible question-answer format with remarks

### Module Interaction Example

When a surveyor completes a job:

1. **Survey Module**: Submits GPS data, photos, findings
2. **Checklist Module**: Submits activity planning items
3. **NC Module**: Reports any non-conformities
4. **Job Module**: Updates job status to "COMPLETED"
5. **Notification Service**: Notifies TM/TO for review
6. **Certificate Module**: Generates certificate (if approved)
7. **Payment Module**: Creates invoice
8. **Dashboard Module**: Updates statistics

All these modules work together, coordinated through the **Job Module** as the central entity.

---

## Conclusion

This documentation provides a comprehensive overview of:
- ✅ What the Checklists module is and how it works
- ✅ Who creates checklists (Surveyors)
- ✅ How the entire codebase is structured
- ✅ How modules are interconnected
- ✅ The complete request flow from frontend to database
- ✅ Database relationships and entity associations

The Girik backend follows a **modular, layered architecture** with clear separation of concerns, making it maintainable and scalable.
