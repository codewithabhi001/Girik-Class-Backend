# Girik Marine Certification Backend

This is the production-ready backend for the Girik Marine Certification and Operations Management System. It is built using Node.js, Express.js, and Sequelize ORM with MySQL.

## 🚀 Technologies

*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MySQL / MariaDB via Sequelize ORM
*   **Authentication:** JWT (HttpOnly Cookies), BCrypt
*   **File Storage:** AWS S3
*   **Email:** Nodemailer
*   **Scheduling:** Node-cron
*   **Validation:** Joi
*   **Documentation:** Swagger / OpenAPI

## 📂 Folder Structure

```
src
│
├── app.js                  # Express app setup (Middleware, CORS, Helmet)
├── server.js               # Application entry point (DB connection, Server start)
├── routes.js               # Main API router aggregating all modules
│
├── config                  # Configuration files
│   ├── aws.js              # AWS S3 Client
│   ├── database.js         # Sequelize config
│   ├── env.js              # Environment variable loader
│   └── mail.js             # Nodemailer transporter
│
├── services                # Cross-module business logic
│   ├── s3.service.js       # File upload/signed URL logic
│   ├── cron.service.js     # Scheduled tasks (Expiry checks)
│   └── notification.service.js # Central notification logic
│
├── utils                   # Helper utilities
│   ├── logger.js           # Winston logger
│   └── geoValidator.js     # Haversine formula for Geo-fencing
│
├── middlewares             # Custom Express middlewares
│   ├── auth.middleware.js  # JWT validation (Cookie/Header)
│   ├── rbac.middleware.js  # Role-Based Access Control
│   ├── validate.middleware.js # Joi Validation Wrapper
│   └── error.middleware.js # Global error handler
│
├── models                  # Sequelize Models (Schema definitions)
│   ├── index.js            # Model loader & associations
│   ├── user.model.js
│   ├── client.model.js
│   ├── job_request.model.js
│   └── ... (30+ entities)
│
├── modules                 # Feature-based architecture
│   ├── auth/               # Authentication (Login, Register, Reset)
│   ├── clients/            # Client Management
│   ├── vessels/            # Vessel Registry
│   ├── jobs/               # Job Request & Workflow
│   ├── surveys/            # Surveyor Reporting & Geo-Check
│   ├── certificates/       # Certificate Generation
│   └── payments/           # Invoicing & Payments
│
└── seeders                 # Initial database data
    └── initial_seed.js     # Seeds Roles & Admin User
```

## 🛠️ Setup & Installation

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Configuration**
    Create a `.env` file in the root directory:
    ```env
    PORT=3000
    DB_HOST=localhost
    DB_USER=root
    DB_PASS=your_password
    DB_NAME=girik_db
    JWT_SECRET=super_secret_key
    AWS_ACCESS_KEY_ID=your_aws_key
    AWS_SECRET_ACCESS_KEY=your_aws_secret
    AWS_BUCKET_NAME=your_bucket
    SMTP_HOST=smtp.mailtrap.io
    SMTP_USER=user
    SMTP_PASS=pass
    ```

3.  **Database Initialization**
    ```bash
    node src/seeders/initial_seed.js
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

## 📡 API Endpoints

All endpoints are prefixed with `/api/v1`.

### 🔐 Authentication Module (`/auth`)

| Method | Endpoint | Description | Access | Body Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/login` | Login user & set HttpOnly Cookie | Public | `email`, `password` |
| `POST` | `/register` | Register new user | Public | `name`, `email`, `password`, `role` |
| `POST` | `/logout` | Clear auth cookie | Auth | - |
| `POST` | `/refresh-token` | Refresh JWT | Auth | `token` |
| `POST` | `/forgot-password`| Initiate password reset | Public | `email` |
| `POST` | `/reset-password` | Complete password reset | Public | `token`, `newPassword` |

### 🏢 Client Module (`/clients`)

| Method | Endpoint | Description | Access | Body Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/` | Create Client | ADMIN, GM, TM | `company_name`, `email`, `address`, `...` |
| `GET` | `/` | List Clients (Paginated) | ADMIN, GM, TM, TO | `page`, `limit` |
| `GET` | `/:id` | Get Client Details | ADMIN, GM, TM, TO | - |
| `PUT` | `/:id` | Update Client | ADMIN, GM, TM | `company_name`, `...` |
| `DELETE`| `/:id` | Delete Client (Soft) | ADMIN | - |

### 🚢 Vessel Module (`/vessels`)

| Method | Endpoint | Description | Access | Body Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/` | Register Vessel | ADMIN, GM, TM | `vessel_name`, `imo_number`, `client_id`, `...` |
| `GET` | `/` | List Vessels | Internal, SURVEYOR | `page`, `limit` |
| `GET` | `/:id` | Get Vessel Details | Internal, SURVEYOR | - |
| `PUT` | `/:id` | Update Vessel | ADMIN, GM, TM | `vessel_name`, `...` |

### 📋 Job Module (`/jobs`)

| Method | Endpoint | Description | Access | Body Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/` | Create Job Request | CLIENT, ADMIN, GM | `vessel_id`, `certificate_type_id`, `reason`, `...` |
| `GET` | `/` | List Jobs (Role Filtered) | Auth Users | `page`, `limit` |
| `GET` | `/:id` | Get Job Details | Auth Users | - |
| `PUT` | `/:id/status` | Update Workflow Status | ADMIN, GM, TM, TO | `status`, `remarks` |
| `PUT` | `/:id/assign` | Assign Surveyor | ADMIN, GM | `surveyorId` |
| `PUT` | `/:id/reassign` | Reassign Surveyor | GM, TM | `surveyorId`, `reason` |
| `PUT` | `/:id/escalate` | Escalate Job | GM, TM | `reason`, `target_role` |

### 📝 Survey Module (`/surveys`)

| Method | Endpoint | Description | Access | Body Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/` | Submit Report (Multipart) | SURVEYOR | `job_id`, `gps_latitude`, `gps_longitude`, `photo` (file) |
| `POST` | `/start` | Start Survey Session | SURVEYOR | `job_id`, `latitude`, `longitude` |
| `PUT` | `/:id/finalize` | Finalize Survey | SURVEYOR | - |
| `GET` | `/:id/timeline` | GPS & Photo Timeline | Internal | - |
| `POST` | `/:id/violation`| Flag Suspicious Activity | Internal | - |
| `GET` | `/` | List Reports | Internal Staff | `page`, `limit` |

### 📜 Certificate Module (`/certificates`)

| Method | Endpoint | Description | Access | Body Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/` | Generate Certificate | ADMIN, GM, TM | `job_id`, `validity_years` |
| `GET` | `/` | List Certificates | Auth Users | `page`, `limit` |
| `PUT` | `/:id/suspend` | Suspend Certificate | ADMIN, TM | `reason` |
| `PUT` | `/:id/revoke` | Revoke Certificate | ADMIN, TM | `reason` |
| `PUT` | `/:id/renew` | Renew Certificate | ADMIN, TM | `validity_years`, `reason` |
| `POST` | `/:id/reissue` | Reissue Certificate | ADMIN, TM | `reason` |
| `GET` | `/:id/history` | View Status History | Internal | - |

### 💰 Payment Module (`/payments`)

| Method | Endpoint | Description | Access | Body Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/invoice` | Create Invoice | ADMIN, GM, TM | `job_id`, `amount`, `currency` |
| `PUT` | `/:id/pay` | Mark as Paid | ADMIN, GM, TM | - |

### 👷 Surveyor Module (`/surveyors`)

| Method | Endpoint | Description | Access | Body Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/apply` | Submit Application (Multipart) | Public | `full_name`, `email`, `cv` (file), etc. |
| `GET` | `/applications` | List Applications | ADMIN, TM | `status` |
| `PUT` | `/applications/:id/review` | Approve/Reject Application | TM, ADMIN | `status`, `remarks` |
| `GET` | `/:id/profile` | Get Profile | Internal, SURVEYOR | - |
| `PUT` | `/:id/profile` | Update Profile | ADMIN, TM | `license_number`, etc. |

### 📍 Geo-Fencing Module (`/geofence` & `/gps`)

| Method | Endpoint | Description | Access | Body Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/gps/update` | Update Live Location | SURVEYOR | `vessel_id`, `latitude`, `longitude` |
| `POST` | `/geofence` | Set Vessel Radius | ADMIN, TM | `vessel_id`, `radius_meters` |
| `GET` | `/geofence/:vesselId` | Get Geo-Fence Rules | ADMIN, TM | - |

### ✅ Checklist / Activity Planning (`/jobs`)

| Method | Endpoint | Description | Access | Body Params |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/:jobId/checklist` | Get Job Checklist | Job Roles | - |
| `PUT` | `/:jobId/checklist` | Submit Checklist Items | SURVEYOR | `items` array |

### ⚠️ Non-Conformity Module (`/non-conformities`)

| Method | Endpoint | Description | Access | Body Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/` | Raise NC | SURVEYOR, TO | `job_id`, `description`, `severity` |
| `PUT` | `/:id/close` | Close NC | TO, TM | `closure_remarks` |
| `GET` | `/job/:jobId` | List NCs for Job | Internal | - |

### 🔄 TOCA Module (`/toca`)

| Method | Endpoint | Description | Access | Body Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/` | Create Verification Request | TM | `vessel_id`, `gaining_class_society` |
| `PUT` | `/:id/status` | Accept/Reject TOCA | TM, ADMIN | `status` |
| `GET` | `/` | List TOCA Requests | Internal | - |

### 🏳️ Flag Administration (`/flags`)

| Method | Endpoint | Description | Access | Body Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/` | Create Flag Authority | ADMIN | `flag_name`, `country` |
| `GET` | `/` | List Flags | All | - |
| `PUT` | `/:id` | Update Flag | ADMIN | - |

### 🔐 User & Role Management (`/users`, `/roles`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/users` | List All Users | ADMIN |
| `POST` | `/users` | Create User Manually | ADMIN |
| `PUT` | `/users/:id/status` | Activate/Suspend User | ADMIN |
| `POST` | `/users/:id/export` | Export User Data | ADMIN |
| `POST` | `/users/:id/anonymize` | Anonymize/Forget User | ADMIN |
| `GET` | `/roles` | List Roles | ADMIN |
| `POST` | `/roles` | Create Dynamic Role | ADMIN |
| `POST` | `/roles/:id/permissions` | Assign Permissions | ADMIN |

### 📂 Document & Evidence Management (`/documents`, `/evidence`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/documents/upload` | Upload File (Versioning) | Internal |
| `GET` | `/documents/:entity/:id` | List Documents | Internal |
| `DELETE`| `/documents/:id` | Remove Document | Internal |
| `POST` | `/evidence` | Upload Evidence (Specific Context) | Internal |
| `GET` | `/evidence/:entity/:id` | View Evidence | Internal |

### 🛡️ Public Verification (`/public`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/certificate/verify/:number` | Verify Certificate | Public |
| `GET` | `/vessel/:imo` | Verify Vessel | Public |

### 💻 Client Portal (`/client`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard` | Dashboard Stats | Client |
| `GET` | `/jobs` | My Jobs | Client |
| `GET` | `/certificates` | My Certificates | Client |

### 🛠️ Ops & System (`/system`, `/security`, `/notifications`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/system/health/db` | DB Health Check | ADMIN |
| `POST` | `/system/cache/clear` | Clear Cache | ADMIN |
| `GET` | `/security/rate-limits` | View Rate Limits | ADMIN |
| `GET` | `/security/login-attempts` | Audit Login Logs | ADMIN |
| `POST` | `/security/block-ip` | Block Malicious IP | ADMIN |
| `GET` | `/notifications/preferences` | User Preferences | Auth User |
| `PUT` | `/notifications/preferences` | Update Preferences | Auth User |

### 📱 Mobile & Offline (`/mobile`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/sync` | Bi-directional Sync | Surveyor |
| `GET` | `/offline/jobs` | Download Jobs | Surveyor |

### 📣 Events, SLA & Triggers (`/events`, `/sla`, `/webhooks`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/events` | Emit Event | Internal |
| `GET` | `/events` | List System Events | ADMIN |
| `POST` | `/sla/rules` | Define SLA Rules | ADMIN |
| `POST` | `/sla/evaluate` | Trigger SLA Check | System |
| `POST` | `/webhooks/register` | Register Webhook | ADMIN |

### 🔍 Search & Bulk Ops (`/search`, `/bulk`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/search` | Global Search | Internal |
| `POST` | `/bulk/vessels` | CSV Upload Vessels | ADMIN |
| `POST` | `/bulk/users` | CSV Bulk Users | ADMIN |

### ⚖️ Compliance & Reports (`/reports`, `/compliance`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/compliance/logs` | Compliance Audit Logs | ADMIN |
| `GET` | `/reports/financials` | Revenue Reports | ADMIN |
| `GET` | `/reports/non-conformities` | NC Trends | ADMIN |

### 🧠 AI & Smart Assist (`/ai`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/ai/anomaly-detect` | Detect Fake Surveys | ADMIN |
| `GET` | `/ai/risk-score` | Vessel Risk Score | ADMIN |

### 🛂 Change Control & Incidents (`/incidents`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/change-requests` | Draft Change | Internal |
| `POST` | `/incidents` | Report Incident | Internal |
| `PUT` | `/incidents/:id/resolve` | Resolve Incident | ADMIN, GM |

### 🔐 Security & Access (Advanced)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/certificates/:id/sign` | Digitally Sign | ADMIN |
| `GET` | `/evidence/:id/chain` | Chain of Custody | Internal |
| `POST` | `/security/2fa/enable` | Enable 2FA | Auth User |
| `GET` | `/system/access-policies` | Field Level Security | ADMIN |

### 🎨 Templates & Localization

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/certificate-templates` | Create Design | ADMIN |
| `GET` | `/system/locales` | List Languages | All |

## ⚙️ Background Services

*   **Cron Jobs:** Runs daily to check for expiring certificates and sends alerts.
*   **Notifications:** Automatically creates DB notifications and checks Geo-Fencing radius during survey submission.
# Girik-Class-Backend
