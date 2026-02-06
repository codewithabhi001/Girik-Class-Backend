
# GIRIK MARINE BACKEND – AI RULE FILE

This file serves as the definitive guide for AI assistants and developers working on the GIRIK Marine Backend. All code generation, architectural decisions, and API designs MUST adhere to these rules.

## 1. Core System Purpose
The system manages marine certification and vessel compliance with legal-grade auditability.
**Primary Goals**: Traceable decisions, Verifiable evidence, Role-secure operations, Regulatory alignment, Operational reliability.

## 2. Architectural Principles
### 2.1 Modular by Domain
*   Structure folders by business domain (`modules/jobs`, `modules/certificates`), NOT by role.
*   Roles control access, not code structure.

### 2.2 API-First Design
*   Every feature must be exposed via REST API.
*   Must include Input/Output schemas, Validation, System Events, and Audit Logs.
*   No "hidden logic".

## 3. Access Control Rules
### 3.1 Role-Based Access Control (RBAC)
*   All endpoints must declare allowed roles via middleware (e.g., `hasRole('ADMIN')`).
*   Violations return `403 Forbidden`.

### 3.2 Attribute-Based Access Control (ABAC)
*   Use dynamic policies where roles are insufficient (e.g., "Surveyor sees only assigned vessels").
*   Policies must be stored in DB and evaluated dynamically, never hardcoded.

## 4. Capabilities Over Roles
*   Backend must return specific `capabilities` (e.g., `["CERT_SIGN", "JOB_ESCALATE"]`).
*   Frontend UI visibility is driven by capabilities, not raw role strings.

## 5. Data Integrity Rules
### 5.1 No Hard Deletes
*   Core entities (Jobs, Certificates, Evidence) use `deleted_at` or `status='ARCHIVED'`.

### 5.2 Immutable Evidence
*   Evidence linked to certificates or legal holds is **Read-Only**.
*   Allowed actions: Read, Verify, Lock.

## 6. Audit & Event Rules
### 6.1 Critical Events
*   Mandatory events for: Certificate Issue/Revoke, Survey Submit, Evidence Lock, SLA Breach, Force Logout.
*   No silent state changes.

### 6.2 Mandatory Audit Trail
*   Log: **Who** did **What** on **Which Entity** at **When** from **Where**.
*   Logs must be immutable and exportable.

## 7. SLA Rules
*   Every Job has an SLA.
*   Pause/Resume/Override actions must be logged with justification.
*   Breaches trigger notifications to GM & Admin.

## 8. Security Rules
### 8.1 Session Control
*   Track Device + IP + User Agent.
*   Support Force Logout and Token Revocation.

### 8.2 Verify Everything
*   Never trust client claims or timestamps.
*   Verify GPS with AIS. Recalculate file hashes.

## 9. Compliance & Legal Rules
### 9.1 Legal Hold Supremacy
*   **Legal Hold** blocks ALL deletion, modification, and anonymization.

### 9.2 GDPR
*   Anonymization removes PII but preserves referential integrity and audit logs.

## 10. Database Rules
*   **Versioned Tables**: Certificates, Evidence, Templates.
*   **No Logic**: DB holds state; Logic lives in services.

## 11. API Behavior Rules
*   **Predictable Errors**: Standard error codes (e.g., `CERT_REVOKED`).
*   **Idempotency**: Required for critical endpoints (payments, uploads).

## 12. Background Job Rules
*   Async jobs must be retryable, observable, and have dead-letter queues.

## 13. AI-Specific Rules
*   AI generation MUST respect RBAC/ABAC, emit events, and log audits.
*   AI MUST NEVER bypass validation or hardcode business rules.

## 14. Frontend ↔ Backend Contract
*   Backend provides: Capabilities, State Machine, Audit Visibility.
*   Frontend assumes: Nothing about DB/Roles; Mutates via API only.

## 15. Naming & Versioning
*   APIs versioned (`/api/v1`).
*   Backward compatible.
*   DB columns never renamed without migration.

## 16. Final Principle
**If a feature cannot be audited, verified, or justified legally, it does not belong in this system.**
