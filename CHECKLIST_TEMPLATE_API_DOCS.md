# Checklist Template System - API Documentation

## Overview
The Checklist Template System allows administrators to create standardized checklists that surveyors must fill out for different types of jobs/certificates. This ensures consistent data collection across all surveys.

---

## API Endpoints

### Base URL
All endpoints are prefixed with: `/api/v1/checklist-templates`

---

## 1. Create Checklist Template

**Endpoint:** `POST /api/v1/checklist-templates`  
**Access:** ADMIN only  
**Description:** Create a new checklist template

### Request Body
```json
{
  "name": "Safety Equipment Inspection Checklist",
  "code": "SAFETY_EQUIP_001",
  "description": "Standard checklist for safety equipment inspection",
  "certificate_type_id": "uuid-of-certificate-type",
  "sections": [
    {
      "title": "Life-Saving Equipment",
      "items": [
        {
          "code": "LSE001",
          "text": "Are life jackets available and in good condition?",
          "type": "YES_NO_NA"
        },
        {
          "code": "LSE002",
          "text": "Are liferafts properly serviced?",
          "type": "YES_NO_NA"
        },
        {
          "code": "LSE003",
          "text": "Number of life jackets found",
          "type": "NUMBER"
        }
      ]
    },
    {
      "title": "Fire Fighting Equipment",
      "items": [
        {
          "code": "FFE001",
          "text": "Are fire extinguishers within expiry date?",
          "type": "YES_NO_NA"
        },
        {
          "code": "FFE002",
          "text": "Describe fire detection system",
          "type": "TEXT"
        }
      ]
    }
  ],
  "status": "ACTIVE",
  "metadata": {
    "version": "1.0",
    "applicable_vessel_types": ["CARGO", "TANKER", "PASSENGER"],
    "estimated_completion_time_minutes": 45
  }
}
```

### Response
```json
{
  "success": true,
  "message": "Checklist template created successfully",
  "data": {
    "id": "template-uuid",
    "name": "Safety Equipment Inspection Checklist",
    "code": "SAFETY_EQUIP_001",
    "certificate_type_id": "uuid-of-certificate-type",
    "sections": [...],
    "status": "ACTIVE",
    "created_at": "2026-02-11T10:00:00Z",
    "updated_at": "2026-02-11T10:00:00Z"
  }
}
```

---

## 2. Get All Checklist Templates

**Endpoint:** `GET /api/v1/checklist-templates`  
**Access:** ADMIN, GM, TM, SURVEYOR  
**Description:** Get all checklist templates with optional filters

### Query Parameters
- `status` (optional): Filter by status (ACTIVE, INACTIVE, DRAFT)
- `certificate_type_id` (optional): Filter by certificate type
- `code` (optional): Filter by template code

### Examples
```
GET /api/v1/checklist-templates
GET /api/v1/checklist-templates?status=ACTIVE
GET /api/v1/checklist-templates?certificate_type_id=uuid-here
```

### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "template-uuid",
      "name": "Safety Equipment Inspection Checklist",
      "code": "SAFETY_EQUIP_001",
      "status": "ACTIVE",
      "CertificateType": {
        "id": "cert-type-uuid",
        "name": "Safety Equipment Certificate",
        "issuing_authority": "CLASS"
      },
      "Creator": {
        "id": "user-uuid",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "created_at": "2026-02-11T10:00:00Z"
    }
  ]
}
```

---

## 3. Get Checklist Template for a Job (CRITICAL FOR SURVEYORS)

**Endpoint:** `GET /api/v1/checklist-templates/job/:jobId`  
**Access:** SURVEYOR, ADMIN, GM, TM, TO  
**Description:** Get the appropriate checklist template for a specific job. This is what surveyors use to know what questions to answer.

### Example
```
GET /api/v1/checklist-templates/job/job-uuid-123
```

### Response
```json
{
  "success": true,
  "message": "Use this template to fill out the checklist for this job",
  "data": {
    "id": "template-uuid",
    "name": "Safety Equipment Inspection Checklist",
    "code": "SAFETY_EQUIP_001",
    "certificate_type_id": "cert-type-uuid",
    "sections": [
      {
        "title": "Life-Saving Equipment",
        "items": [
          {
            "code": "LSE001",
            "text": "Are life jackets available and in good condition?",
            "type": "YES_NO_NA"
          }
        ]
      }
    ],
    "CertificateType": {
      "id": "cert-type-uuid",
      "name": "Safety Equipment Certificate",
      "issuing_authority": "CLASS"
    }
  }
}
```

---

## 4. Get Specific Checklist Template

**Endpoint:** `GET /api/v1/checklist-templates/:id`  
**Access:** ADMIN, GM, TM, SURVEYOR  
**Description:** Get a specific checklist template by ID

### Example
```
GET /api/v1/checklist-templates/template-uuid-123
```

---

## 5. Update Checklist Template

**Endpoint:** `PUT /api/v1/checklist-templates/:id`  
**Access:** ADMIN only  
**Description:** Update an existing checklist template

### Request Body
```json
{
  "name": "Updated Safety Equipment Checklist",
  "status": "ACTIVE",
  "sections": [...]
}
```

---

## 6. Activate Checklist Template

**Endpoint:** `PUT /api/v1/checklist-templates/:id/activate`  
**Access:** ADMIN only  
**Description:** Activate a checklist template (set status to ACTIVE)

### Response
```json
{
  "success": true,
  "message": "Checklist template activated successfully",
  "data": {...}
}
```

---

## 7. Clone Checklist Template

**Endpoint:** `POST /api/v1/checklist-templates/:id/clone`  
**Access:** ADMIN only  
**Description:** Create a copy of an existing template

### Response
```json
{
  "success": true,
  "message": "Checklist template cloned successfully",
  "data": {
    "id": "new-template-uuid",
    "name": "Safety Equipment Inspection Checklist (Copy)",
    "code": "SAFETY_EQUIP_001_COPY_1707649200000",
    "status": "DRAFT",
    ...
  }
}
```

---

## 8. Delete Checklist Template

**Endpoint:** `DELETE /api/v1/checklist-templates/:id`  
**Access:** ADMIN only  
**Description:** Soft delete a template (sets status to INACTIVE)

### Response
```json
{
  "success": true,
  "message": "Checklist template deleted successfully"
}
```

---

## Complete Workflow: From Template Creation to Surveyor Submission

### Step 1: Admin Creates Template
```bash
POST /api/v1/checklist-templates
{
  "name": "Load Line Survey Checklist",
  "code": "LOADLINE_001",
  "certificate_type_id": "load-line-cert-type-uuid",
  "sections": [...]
}
```

### Step 2: Client Requests Job
```bash
POST /api/v1/jobs
{
  "vessel_id": "vessel-uuid",
  "certificate_type_id": "load-line-cert-type-uuid",
  "reason": "Annual survey",
  "target_port": "Singapore",
  "target_date": "2026-03-01"
}
```

### Step 3: GM Assigns Surveyor
```bash
PUT /api/v1/jobs/job-uuid/assign
{
  "surveyorId": "surveyor-uuid"
}
```

### Step 4: Surveyor Fetches Template for Job
```bash
GET /api/v1/checklist-templates/job/job-uuid
```

**Response includes all questions the surveyor needs to answer**

### Step 5: Surveyor Fills Out Checklist
```bash
PUT /api/v1/jobs/job-uuid/checklist
{
  "items": [
    {
      "question_code": "LSE001",
      "question_text": "Are life jackets available and in good condition?",
      "answer": "YES",
      "remarks": "20 life jackets found, all in good condition"
    },
    {
      "question_code": "LSE002",
      "question_text": "Are liferafts properly serviced?",
      "answer": "YES",
      "remarks": "Service certificate valid until 2027"
    }
  ]
}
```

### Step 6: Anyone Can View Submitted Checklist
```bash
GET /api/v1/jobs/job-uuid/checklist
```

---

## Question Types

The system supports three question types:

1. **YES_NO_NA**: Standard yes/no/not applicable questions
2. **TEXT**: Free-form text responses
3. **NUMBER**: Numeric values

---

## Best Practices

### For Administrators
1. **Link templates to certificate types** for automatic selection
2. **Use clear question codes** (e.g., LSE001, FFE001) for easy reference
3. **Set status to DRAFT** while developing, then **ACTIVE** when ready
4. **Use metadata** to store additional info like estimated completion time

### For Frontend Developers
1. **Fetch template before showing checklist form** to surveyor
2. **Display questions grouped by sections** for better UX
3. **Validate answers** match question type (YES/NO/NA for YES_NO_NA type)
4. **Save question_text** along with question_code when submitting

### For Surveyors
1. **Always fetch the latest template** for each job
2. **Fill in remarks** for context, especially for NO or NA answers
3. **Double-check all answers** before submission

---

## Error Handling

### Common Errors

**404 - Template Not Found**
```json
{
  "message": "No active checklist template found for certificate type: Load Line Certificate"
}
```

**400 - Validation Error**
```json
{
  "message": "Validation Error",
  "error": "sections is required, code must be unique"
}
```

**403 - Forbidden**
```json
{
  "message": "Access denied. Required role: ADMIN"
}
```

---

## Database Schema

### checklist_templates Table
```sql
CREATE TABLE checklist_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  certificate_type_id UUID,
  sections JSON NOT NULL,
  status ENUM('ACTIVE', 'INACTIVE', 'DRAFT') DEFAULT 'DRAFT',
  metadata JSON,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (certificate_type_id) REFERENCES certificate_types(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);
```

### activity_plannings Table (Surveyor Responses)
```sql
CREATE TABLE activity_plannings (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL,
  question_code VARCHAR(255) NOT NULL,
  question_text TEXT NOT NULL,
  answer ENUM('YES', 'NO', 'NA') NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES job_requests(id)
);
```

---

## Summary

This checklist template system provides:
- ✅ **Standardized data collection** across all surveys
- ✅ **Automatic template selection** based on certificate type
- ✅ **Flexible question types** (YES/NO/NA, TEXT, NUMBER)
- ✅ **Version control** through metadata
- ✅ **Role-based access control** for security
- ✅ **Complete audit trail** with creator/updater tracking
