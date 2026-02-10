# Girik Marine Certification - Backend Project Description

## 🚢 Project Overview

The **Girik Marine Certification Backend** is a comprehensive, enterprise-grade system designed to manage the end-to-end lifecycle of maritime vessel certification, surveys, and compliance operations. It serves as the core infrastructure for a Classification Society or a Recognizing Organization (RO), enabling them to inspect ships, issue statutory/class certificates, and ensure compliance with international maritime regulations (IMO, SOLAS, MARPOL).

This system facilitates collaboration between multiple stakeholders: **Clients (Ship Owners)**, **Head Office Staff (Admins, Technical Managers)**, and **Field Surveyors**.

---

## 🏗️ Technical Architecture

### Core Stack
*   **Runtime Environment**: Node.js (v18+)
*   **Framework**: Express.js (REST API)
*   **Database**: MySQL / MariaDB (Relational Data) via Sequelize ORM
*   **Authentication**: JWT (JSON Web Tokens) with HttpOnly Cookies for security.
*   **File Storage**: AWS S3 (Scalable storage for survey reports, photos, certificates).
*   **Email Service**: Nodemailer (Transactional emails for alerts, invoices, reports).
*   **Task Scheduling**: Node-cron (Automated checks for certificate expiry, SLA breaches).

### Architecture Pattern: Domain-Driven Design (DDD)
The codebase is structured around business domains rather than technical layers. This means code related to "Vessels" is in one folder, "Payments" in another, etc. This "Vertical Slice" architecture makes the system highly modular and scalable.

`src/modules/<domain_name>/` contains:
*   `*.controller.js`: Handles HTTP requests, validation, and response formatting.
*   `*.service.js`: Contains pure business logic. It is **role-agnostic** (doesn't know about "Users", only IDs and data).
*   `*.routes.js`: Defines API endpoints and applies Authorization middleware.

---

## 👥 User Roles & Hierarchy

The system enforces strict **Role-Based Access Control (RBAC)**.

1.  **ADMIN (Administrator)**
    *   Full system access.
    *   Manages users, roles, system configurations, and master data (Flags, Certificate Types).
2.  **GM (General Manager)**
    *   Oversees operations.
    *   Approves critical workflows (TOCA, high-value invoices).
    *   Can assign/reassign jobs.
3.  **TM (Technical Manager)**
    *   Technical authority.
    *   Reviews complex survey reports.
    *   Approves certificate issuance.
4.  **TO (Technical Officer)**
    *   Day-to-day operations.
    *   Reviews basic reports.
    *   Manages Non-Conformities (NCs).
5.  **TA (Technical Assistant)**
    *   Administrative support.
    *   Drafts invoices, prepares initial documentation.
6.  **SURVEYOR (Field Surveyor)**
    *   Performs physical inspections.
    *   Uses the mobile/offline app.
    *   Uploads evidence (photos, GPS logs) and Checklists.
7.  **CLIENT (Ship Owner/Manager)**
    *   External user.
    *   Requests jobs/surveys.
    *   Downloads certificates and invoices.
    *   Views vessel status.

---

## ♻️ Key Business Workflows

### 1. The Job Lifecycle
The central unit of work is a **Job Request**.
1.  **Creation**: A `CLIENT` initiates a request (e.g., "Annual Survey for Vessel X").
2.  **Review**: `TA`/`TO` reviews the request and assigns a `SURVEYOR`.
3.  **Execution**:
    *   `SURVEYOR` receives the job (synced to mobile if offline).
    *   Performs inspection using digital **Checklists**.
    *   Uploads **Evidence** (Photos) and **GPS** location (for geo-verification).
    *   Submits **Survey Report**.
4.  **Technical Review**: `TO`/`TM` validates the report.
    *   If issues found -> Raise **Non-Conformity (NC)**.
    *   If clean -> Proceed to Certification.
5.  **Certification**: `TM` approves, and the system generates a digitally signed **Certificate** (PDF).
6.  **Billing**: Finance module generates an **Invoice**. Job is closed upon payment.

### 2. Digital Certificate Generation
*   **Templates**: The system uses HTML/Handlebars templates stored in the database.
*   **Generation**: Dynamic data (Vessel info, Survey dates) is injected into templates.
*   **Security**: Certificates are hashed and can be verified publicly via QR code or Unique Tracking Number (UTN).
*   **Lifecycle**: Certificates can be *Issued*, *Suspended* (e.g., due to major deficiency), *Revoked*, or *Renewed*.

### 3. Non-Conformity (NC) Management
*   Issues identified during surveys (e.g., "Engine room fire pump broken").
*   **Major NC**: Prevents certificate issuance. Must be fixed immediately.
*   **Minor NC**: Certificate issued with a condition (Memo). Must be fixed within X days.
*   **Workflow**: Surveyor raises NC -> Client fixes -> Surveyor creates "Close-out" report -> NC Closed.

### 4. Transfer of Class Authority (TOCA)
*   Workflow for a vessel moving from another society (e.g., Lloyds, DNV) to Girik.
*   Involves reviewing previous survey history and analyzing "Gaining" vs "Losing" society data.
*   Requires `GM` level approval.

---

## 📱 Mobile & Offline Capabilities
*   **Sync Endpoint**: `/api/v1/mobile/sync` handles bi-directional data transfer.
*   **Offline Mode**: Surveyors download job data (Vessel specs, Checklists) to their device.
*   **Submission**: When back online, they push data (JSON + Images). The server processes this asynchronously to avoid timeouts.

---

## 🔒 Security Features
1.  **Geo-Fencing**: Surveyors must be within X meters of the vessel's registered coordinates to "Start" a survey. This prevents fraud.
2.  **Audit Logs**: Every critical action (Status change, Certificate issuance) is logged in the `AuditLog` table.
3.  **Rate Limiting**: Protects against brute-force attacks.
4.  **Input Validation**: All payloads verified against Joi schemas.

---

## 📊 Dashboard & Analytics
*   **Admin/GM**: High-level stats (Revenue, Total Jobs, Surveyor Performance).
*   **Client**: Fleet status, upcoming expiries, outstanding invoices.
*   **Surveyor**: Assigned jobs calendar, pending reports.

---

## 📂 Detailed Module Directory
*   `activity_requests`: Managing generic requests that aren't full surveys.
*   `approvals`: Generic multi-step approval workflow engine.
*   `auth`: Login/Register logic.
*   `certificates`: Core logic for PDF generation and validity rules.
*   `checklists`: Dynamic form builder for surveys (Question/Answer/Remarks).
*   `clients`: CRM for ship owners.
*   `dashboard`: Aggregation service for UI charts/stats.
*   `documents`: Centralized S3 wrapper for associating files with any entity.
*   `flags`: Managing rules for different country flags (e.g., Panama vs Liberia rules).
*   `incidents`: Reporting accidents or near-misses on vessels.
*   `jobs`: The orchestrator module linking Vessels, Surveyors, and Certificates.
*   `notifications`: In-app and Email alert engine.
*   `payments`: Ledger for job fees and payments.
*   `surveys`: The technical reporting module.
*   `users`: Internal staff management.
*   `vessels`: The core asset register (Ship particulars).

---

## 🧪 Development Guide

### Running Locally
```bash
npm install
npm run dev
```

### Database Migrations (Sequelize)
*   **Sync**: `sequelize.sync({ alter: true })` (Safe update)
*   **Force**: `sequelize.sync({ force: true })` (⚠️ Wipes data)
*   **Seed**: `node src/seeders/initial_seed.js` (Creates Admin/Default roles)

### Testing
*   **Unit Tests**: Located in `tests/unit/`.
*   **Integration Tests**: Located in `tests/integration/`.
*   **Run**: `npm test`
