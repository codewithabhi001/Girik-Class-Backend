# Backend Global Services Guide

This directory (`src/services`) contains shared, "single-purpose" utility services that provide the backbone logic for the entire GIRIK Backend. These services are used across multiple modules (Client, Management, Auth).

---

## 🛠️ Infrastructure Services

### 📦 S3 Storage Service (`s3.service.js`)
Handles all cloud-based file interactions using AWS SDK v3.
- **Upload File**: Securely buffers and uploads documents (Certificates, Vessel Photos, Incident proofs).
- **Signed URLs**: Generates temporary (1-hour) links for secure file viewing.
- **Buffer Stream**: Converts cloud streams to binary buffers for PDF generation or processing.

### 📧 Email Service (`email.service.js`)
The primary communication bridge for external alerts.
- **Transporter**: Uses SMTP (defined in `.env`) to dispatch emails via Mailgun, SendGrid, or local relays.
- **Templating**: Includes a `sendTemplateEmail` function for standardized messages:
  - `SLA_BREACH`: Notifies Admin/GM of delayed tasks.
  - `CERTIFICATE_EXPIRY`: Notifies Clients 30/15 days before expiration.
  - `LEGAL_HOLD`: Formal notification of lockdown for audits.

---

## ⚙️ Operational Services

### ⏰ Cron & Monitoring (`cron.service.js`)
Provides scheduled task execution using `node-cron`.
- **Expiry Monitor**: Runs daily at midnight to find certificates expiring in 30 days.
- **Deduplication**: Ensures users don't get spammed by checking if an alert was already sent.

### 🔔 Notification Router (`notification.service.js`)
Distributes alerts to the right users based on roles.
- **Role-based Broadcast**: Can shout to all "surveyors" or "admins" simultaneously.
- **Priority Levels**: Supports `URGENT` vs `NORMAL` marking for UI filtering.

---

## 💼 Core Business Logic (Legacy/Peer Helpers)

### 🛠️ Job Service (`job.service.js`)
Manages the master Job Lifecycle.
- **Transitions**: Controls the flow from `CREATED` → `ASSIGNED` → `IN_PROGRESS` → `COMPLETED`.
- **SLA Integration**: Pauses/Resumes SLA counters when a job is put `ON_HOLD`.
- **Audit Logging**: Every status change is recorded in the `JobStatusHistory` table.

### 📜 Certificate Service (`vessel.service.js` & `cert.service.js`)
Handles the heavy lifting for documentation.
- **Issuance**: Validates that all survey requirements are met before a certificate is "printable".
- **Tracking**: Real-time status of the global fleet (Valid, Expired, Revoked).

### 🏗️ Technical Oversight (`toca.service.js`)
Handles the "Transfer of Class Agreement" (TOCA) process when a vessel moves between organizations.
- **Workflow**: Manages the transitions between Losing/Gaining Class status.
- **Audit**: Tracks decision dates and notifies General Managers of pending approvals.

### ⚠️ Non-Conformity (`nc.service.js`)
The core of technical compliance tracking.
- **Findings**: Records defects found during surveys.
- **Closure**: Tracks rectification progress and notifies Technical Officers (TOs) when a vessel is again in compliance.

---

## 💰 Specialized Services

### 💳 Payment Service (`payment.service.js`)
Bridges the gap between operations and finance.
- **Invoice Generation**: Auto-calculates fees based on vessel tonnage and survey type.
- **Ledger Entries**: Maintains immutable records of credit/debit for each client.

### 📊 Report Service (`report.service.js`)
The data aggregation engine.
- **Excel/PDF Export**: Converts DB records into human-readable files.
- **Metrics**: Calculates fleet performance, surveyor workload, and financial health for the Master Dashboard.
