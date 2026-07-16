# CLIENT Role - Complete API Integration Guide

> **For Frontend Developers** - Complete reference for CLIENT role API integration

**Base URL:** `/api/v1`  
**Authentication:** `Authorization: Bearer <accessToken>`

---

## 🔐 Authentication & Profile

### 1. Get Current User Profile
```http
GET /users/me
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Ahmed Ali",
    "email": "ahmed@abcshipping.com",
    "role": "CLIENT",
    "phone": "+971501234567",
    "status": "ACTIVE",
    "client_id": "uuid",
    "profile_pic_url": "https://...",
    "force_password_reset": false,
    "last_login_at": "2026-03-05T18:00:00.000Z",
    "created_at": "2026-01-01T00:00:00.000Z",
    "updated_at": "2026-03-05T18:00:00.000Z",
    "Client": {
      "company_name": "ABC Shipping Ltd",
      "company_code": "ABC-001",
      "address": "Business Bay, Dubai, UAE",
      "country": "AE",
      "email": "info@abcshipping.com",
      "phone": "+971501234567",
      "contact_person_name": "Ahmed Ali",
      "created_at": "2026-01-01T00:00:00.000Z"
    }
  }
}
```

---

### 2. Update Profile Picture
```http
PUT /users/profile-pic
Content-Type: multipart/form-data
```

**Request:**
| Field | Type | Required |
|-------|------|----------|
| `profile_pic` | File (image) | ✅ |

**Response (200):**
```json
{
  "success": true,
  "message": "Profile picture updated successfully",
  "data": {
    "id": "uuid",
    "profile_pic_url": "https://storage.grclass.com/profiles/new.jpg"
  }
}
```

---

### 3. Update FCM Token (Push Notifications)
```http
PUT /users/fcm-token
Content-Type: application/json
```

**Request Body:**
```json
{
  "fcmToken": "firebase-device-token-string"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "FCM token updated successfully",
  "data": {
    "id": "uuid",
    "fcm_token": "firebase-device-token-string"
  }
}
```

---

### 4. Logout
```http
POST /auth/logout
```

**Response (200):**
```json
{
  "message": "Logged out successfully",
  "accessToken": null,
  "refreshToken": null
}
```

---

##  Client Profile (Self-Service)

### 5. Get Client Profile
```http
GET /clients/profile
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "019514a2-7e3b-7000-8000-000000000060",
    "company_name": "ABC Shipping Ltd",
    "company_code": "ABC-001",
    "address": "Business Bay, Dubai, UAE",
    "country": "AE",
    "email": "info@abcshipping.com",
    "phone": "+971501234567",
    "contact_person_name": "Ahmed Ali",
    "contact_person_email": "ahmed@abcshipping.com",
    "status": "ACTIVE",
    "created_at": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### 6. Update Client Profile
```http
PUT /clients/profile
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "phone": "+971509999999",
  "contact_person_name": "Updated Contact",
  "contact_person_email": "newemail@abcshipping.com",
  "address": "New Address, Dubai, UAE"
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | optional | User's display name |
| `phone` | string | optional | Contact phone number |
| `contact_person_name` | string | optional | Primary contact person |
| `contact_person_email` | string | optional | Contact email |
| `address` | string | optional | Company address |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Updated Name",
    "email": "ahmed@abcshipping.com",
    "role": "CLIENT",
    "phone": "+971509999999",
    "Client": {
      "company_name": "ABC Shipping Ltd",
      "phone": "+971509999999",
      "contact_person_name": "Updated Contact",
      "address": "New Address, Dubai, UAE"
    }
  }
}
```

---

### 7. Get Client Documents
```http
GET /clients/profile/documents
```

**Response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "uuid",
      "entity_type": "CLIENT",
      "entity_id": "uuid",
      "document_type": "Registration Certificate",
      "description": "Company registration",
      "file_name": "reg_cert.pdf",
      "signedUrl": "https://signed-url...",
      "created_at": "2026-01-15T00:00:00.000Z"
    }
  ]
}
```

---

## 📊 Dashboard

### 8. Get Client Dashboard
```http
GET /clients/dashboard
```
**OR**
```http
GET /dashboard
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "role": "CLIENT",
    "stats": {
      "total_vessels": 5,
      "active_jobs": 3,
      "jobs_by_status": {
        "CREATED": 1,
        "ASSIGNED": 2
      },
      "expiring_soon": 1,
      "pending_payments": 2,
      "open_non_conformities": 0
    },
    "recent_jobs": [
      {
        "id": "uuid",
        "vessel_name": "MV Star",
        "type": "Safety Management Certificate",
        "status": "ASSIGNED",
        "surveyor": "John Surveyor",
        "date": "2026-03-05T18:00:00.000Z"
      }
    ],
    "recent_vessels": [
      {
        "id": "uuid",
        "vessel_name": "MV Star",
        "imo_number": "1234567",
        "date_added": "2026-01-01T00:00:00.000Z"
      }
    ],
    "recent_certificates": [
      {
        "id": "uuid",
        "name": "SMC Certificate",
        "vessel": "MV Star",
        "expiry_date": "2031-01-15",
        "issued_date": "2026-01-15"
      }
    ],
    "recent_surveys": [
      {
        "id": "uuid",
        "vessel": "MV Star",
        "surveyor": "John Surveyor",
        "status": "FINALIZED",
        "date": "2026-03-05T18:00:00.000Z"
      }
    ],
    "recent_payments": [
      {
        "id": "uuid",
        "invoice_number": "INV-2026-001",
        "amount": "5000.00",
        "currency": "USD",
        "status": "UNPAID",
        "vessel_name": "MV Star",
        "date": "2026-03-05"
      }
    ],
    "expiring_certificates": [
      {
        "id": "uuid",
        "name": "Safety Equipment Certificate",
        "vessel": "MV Star",
        "expiry_date": "2026-04-01"
      }
    ],
    "pending_payments_list": [
      {
        "id": "uuid",
        "invoice_number": "INV-2026-001",
        "amount": "5000.00",
        "currency": "USD",
        "vessel_name": "MV Star"
      }
    ]
  }
}
```

---

## 🚢 Vessels (Own Only)

### 9. List My Vessels
```http
GET /vessels?page=1&limit=20&class_status=ACTIVE&search=star
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (default: 20) |
| `class_status` | string | Filter by status: ACTIVE, INACTIVE |
| `search` | string | Search by vessel name or IMO |

**Response (200):**
```json
{
  "success": true,
  "message": "Vessels fetched successfully",
  "data": {
    "rows": [
      {
        "id": "uuid",
        "client_id": "uuid",
        "vessel_name": "MV Star",
        "imo_number": "1234567",
        "call_sign": "ABCD",
        "mmsi_number": "123456789",
        "flag_administration_id": "uuid",
        "port_of_registry": "Dubai",
        "year_built": 2015,
        "ship_type": "Bulk Carrier",
        "gross_tonnage": "50000.00",
        "net_tonnage": "30000.00",
        "deadweight": "85000.00",
        "class_status": "ACTIVE",
        "current_class_society": "Lloyd's Register",
        "engine_type": "MAN B&W 6S60ME-C8.5",
        "builder_name": "Hyundai Heavy Industries",
        "created_at": "2026-01-01T00:00:00.000Z",
        "updated_at": "2026-01-01T00:00:00.000Z",
        "Client": {
          "id": "uuid",
          "company_name": "ABC Shipping Ltd"
        },
        "FlagAdministration": {
          "id": "uuid",
          "flag_state_name": "Panama",
          "country": "PA"
        }
      }
    ],
    "count": 5
  }
}
```

---

### 10. Get Vessel Details
```http
GET /vessels/:id
```

**Response (200):**
```json
{
  "success": true,
  "message": "Vessel details fetched successfully",
  "data": {
    "id": "uuid",
    "client_id": "uuid",
    "vessel_name": "MV Star",
    "imo_number": "1234567",
    "call_sign": "ABCD",
    "mmsi_number": "123456789",
    "port_of_registry": "Dubai",
    "year_built": 2015,
    "ship_type": "Bulk Carrier",
    "gross_tonnage": "50000.00",
    "net_tonnage": "30000.00",
    "deadweight": "85000.00",
    "class_status": "ACTIVE",
    "current_class_society": "Lloyd's Register",
    "engine_type": "MAN B&W 6S60ME-C8.5",
    "builder_name": "Hyundai Heavy Industries",
    "Client": {
      "id": "uuid",
      "company_name": "ABC Shipping Ltd"
    },
    "FlagAdministration": {
      "flag_state_name": "Panama",
      "country": "PA",
      "authority_name": "Panama Maritime Authority"
    },
    "uploaded_documents": [
      {
        "id": "uuid",
        "document_type": "Class Certificate",
        "signedUrl": "https://...",
        "fileName": "class_cert.pdf",
        "uploadedBy": "Admin",
        "createdAt": "2026-01-15"
      }
    ]
  }
}
```

---

## 📋 Jobs

### 11. Create Job Request
```http
POST /jobs
Content-Type: application/json
```

**Request Body:**
```json
{
  "vessel_id": "uuid",
  "certificate_type_id": "uuid",
  "reason": "Annual survey due for safety management certificate",
  "target_port": "Dubai Port, Jebel Ali",
  "target_date": "2026-04-15",
  "uploaded_documents": [
    {
      "required_document_id": "uuid",
      "file_url": "https://storage.grclass.com/uploads/doc1.pdf"
    }
  ]
}
```

**Required Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `vessel_id` | UUID | Your vessel ID |
| `certificate_type_id` | UUID | Certificate type to apply for |
| `reason` | string | Reason for the job |
| `target_port` | string | Preferred port for survey |
| `target_date` | ISO date | Preferred date (YYYY-MM-DD) |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "019514a2-7e3b-7000-8000-000000000100",
    "vessel_id": "uuid",
    "certificate_type_id": "uuid",
    "requested_by_user_id": "uuid",
    "reason": "Annual survey due for safety management certificate",
    "target_port": "Dubai Port, Jebel Ali",
    "target_date": "2026-04-15",
    "job_status": "CREATED",
    "priority": "NORMAL",
    "is_survey_required": true,
    "assigned_surveyor_id": null,
    "assigned_by_user_id": null,
    "approved_by_user_id": null,
    "generated_certificate_id": null,
    "remarks": null,
    "reschedule_count": 0,
    "created_at": "2026-03-05T18:30:00.000Z",
    "updated_at": "2026-03-05T18:30:00.000Z"
  }
}
```

---

### 12. List My Jobs
```http
GET /jobs?page=1&limit=20&status=CREATED&priority=NORMAL&vessel_id=uuid
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `limit` | integer | Items per page |
| `status` | string | CREATED, DOCUMENT_VERIFIED, APPROVED, ASSIGNED, etc. |
| `priority` | string | LOW, NORMAL, HIGH, URGENT |
| `vessel_id` | UUID | Filter by specific vessel |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "rows": [
      {
        "id": "uuid",
        "vessel_id": "uuid",
        "requested_by_user_id": "uuid",
        "certificate_type_id": "uuid",
        "reason": "Annual survey due",
        "target_port": "Dubai Port",
        "target_date": "2026-04-15",
        "job_status": "CREATED",
        "priority": "NORMAL",
        "is_survey_required": true,
        "assigned_surveyor_id": null,
        "reschedule_count": 0,
        "created_at": "2026-03-05T18:30:00.000Z",
        "Vessel": {
          "id": "uuid",
          "vessel_name": "MV Star",
          "imo_number": "1234567"
        },
        "CertificateType": {
          "id": "uuid",
          "name": "Safety Management Certificate"
        },
        "requester": {
          "id": "uuid",
          "name": "Ahmed Ali"
        },
        "surveyor": null
      }
    ],
    "count": 5
  }
}
```

---

### 13. Get Job Details
```http
GET /jobs/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "vessel_id": "uuid",
    "requested_by_user_id": "uuid",
    "certificate_type_id": "uuid",
    "reason": "Annual survey due",
    "target_port": "Dubai Port",
    "target_date": "2026-04-15",
    "job_status": "ASSIGNED",
    "priority": "NORMAL",
    "is_survey_required": true,
    "assigned_surveyor_id": "uuid",
    "assigned_by_user_id": "uuid",
    "approved_by_user_id": "uuid",
    "generated_certificate_id": null,
    "remarks": "Approved for survey",
    "reschedule_count": 0,
    "created_at": "2026-03-05T18:30:00.000Z",
    "updated_at": "2026-03-05T19:00:00.000Z",
    "Vessel": {
      "id": "uuid",
      "vessel_name": "MV Star",
      "imo_number": "1234567",
      "Client": {
        "company_name": "ABC Shipping Ltd"
      }
    },
    "CertificateType": {
      "name": "Safety Management Certificate"
    },
    "requester": {
      "id": "uuid",
      "name": "Ahmed Ali"
    },
    "surveyor": {
      "id": "uuid",
      "name": "John Surveyor"
    },
    "approver": {
      "id": "uuid",
      "name": "Admin User"
    },
    "survey": {
      "id": "uuid",
      "survey_status": "NOT_STARTED",
      "surveyor_id": "uuid"
    }
  }
}
```

---

### 14. Cancel Job
```http
PUT /jobs/:id/cancel
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "Vessel sale — no longer required"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Job cancelled.",
  "data": {
    "id": "uuid",
    "job_status": "REJECTED",
    "updated_at": "2026-03-05T20:15:00.000Z"
  }
}
```

---

### 15. Get Job Messages (External)
```http
GET /jobs/:id/messages/external
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "job_id": "uuid",
      "sender_id": "uuid",
      "message": "Documents have been uploaded for review.",
      "is_internal": false,
      "attachment_url": null,
      "created_at": "2026-03-05T18:35:00.000Z",
      "Sender": {
        "name": "Ahmed Ali",
        "role": "CLIENT"
      }
    }
  ]
}
```

---

### 16. Send Message to Job
```http
POST /jobs/:id/messages
Content-Type: multipart/form-data
```

**Request:**
| Field | Type | Required |
|-------|------|----------|
| `message` | string | ✅ |
| `attachment` | File | optional |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "job_id": "uuid",
    "sender_id": "uuid",
    "message": "Updated documents attached.",
    "is_internal": false,
    "attachment_url": "https://storage.grclass.com/messages/doc.pdf",
    "created_at": "2026-03-05T20:45:00.000Z"
  }
}
```

---

## 📜 Certificates (Own Vessels Only)

### 17. List My Certificates
```http
GET /certificates?page=1&limit=20&status=VALID&vessel_id=uuid&expiring_within_days=30
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page`, `limit` | integer | Pagination |
| `status` | string | DRAFT, ISSUED, VALID, EXPIRED, SUSPENDED, REVOKED, TRANSFERRED, DOWNGRADED |
| `vessel_id` | UUID | Filter by vessel |
| `certificate_type_id` | UUID | Filter by certificate type |
| `client_id` | UUID | Filter by client (staff roles) |
| `expiring_within_days` | integer | VALID certificates expiring within N days (defaults status to VALID if omitted) |

**Response (200):**
```json
{
  "success": true,
  "message": "Certificates fetched successfully",
  "data": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "status_counts": [
      { "status": "DRAFT", "count": 0 },
      { "status": "ISSUED", "count": 1 },
      { "status": "VALID", "count": 8 },
      { "status": "EXPIRED", "count": 1 },
      { "status": "SUSPENDED", "count": 0 },
      { "status": "REVOKED", "count": 0 },
      { "status": "TRANSFERRED", "count": 0 },
      { "status": "DOWNGRADED", "count": 0 }
    ],
    "rows": [
      {
        "id": "uuid",
        "vessel_id": "uuid",
        "certificate_type_id": "uuid",
        "certificate_number": "GR-CLASS-2026-0042",
        "issue_date": "2026-01-15",
        "expiry_date": "2031-01-15",
        "status": "VALID",
        "createdAt": "2026-01-15T00:00:00.000Z",
        "vessel_name": "MV Star",
        "imo_number": "1234567",
        "client_id": "uuid",
        "company_name": "Acme Shipping",
        "certificate_type": "Safety Management Certificate"
      }
    ]
  }
}
```

> `status_counts` always includes **every** status for the entity (count `0` when none). Counts respect the same filters as the list except the `status` filter (so tab totals stay useful).

---

### 18. Get Certificate Types
```http
GET /certificates/types
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Safety Management Certificate",
      "issuing_authority": "CLASS",
      "validity_years": 5,
      "status": "ACTIVE",
      "description": "SMC for ISM Code compliance",
      "requires_survey": true
    }
  ]
}
```

---

### 19. Get Certificate Type Details
```http
GET /certificates/types/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Safety Management Certificate",
    "issuing_authority": "CLASS",
    "validity_years": 5,
    "status": "ACTIVE",
    "description": "SMC for ISM Code compliance",
    "requires_survey": true,
    "required_documents": [
      {
        "document_name": "Class Certificate",
        "is_mandatory": true
      },
      {
        "document_name": "Safety Equipment Cert",
        "is_mandatory": false
      }
    ]
  }
}
```

---

### 20. List Expiring Certificates (via list filter)
```http
GET /certificates?expiring_within_days=30&page=1&limit=20
```

Uses the standard certificate list response (`data.rows`, `data.total`, etc.).

---

### 21. Get Vessel Certificates
```http
GET /certificates/vessel/:vesselId
```

**Response (200):**
```json
{
  "success": true,
  "message": "Vessel certificates fetched successfully",
  "data": [
    {
      "id": "uuid",
      "certificate_number": "GR-CLASS-2026-0042",
      "status": "VALID",
      "issue_date": "2026-01-15",
      "expiry_date": "2031-01-15",
      "CertificateType": {
        "name": "SMC"
      }
    }
  ]
}
```

---

### 22. Get Certificate by Job
```http
GET /certificates/job/:jobId
```

**Response (200):**
```json
{
  "success": true,
  "message": "Certificate for job fetched successfully",
  "data": {
    "id": "uuid",
    "certificate_number": "GR-CLASS-2026-0042",
    "status": "VALID",
    "issue_date": "2026-01-15",
    "expiry_date": "2031-01-15"
  }
}
```

---

### 23. Get Certificate Details
```http
GET /certificates/:id
```

**Response (200):**
```json
{
  "success": true,
  "message": "Certificate details fetched successfully",
  "data": {
    "id": "uuid",
    "certificate_number": "GR-CLASS-2026-0042",
    "vessel_id": "uuid",
    "certificate_type_id": "uuid",
    "job_id": "uuid",
    "issue_date": "2026-01-15",
    "expiry_date": "2031-01-15",
    "status": "VALID",
    "issued_by_user_id": "uuid",
    "qr_code_url": "https://...",
    "pdf_file_url": "https://...",
    "Vessel": {
      "vessel_name": "MV Star",
      "imo_number": "1234567"
    },
    "CertificateType": {
      "name": "SMC",
      "issuing_authority": "CLASS"
    }
  }
}
```

---

### 24. Download Certificate PDF
```http
GET /certificates/:id/download
```

**Response:** Redirects to signed PDF URL (302) or error (404)

---

### 25. Preview Certificate
```http
GET /certificates/:id/preview
```

**Response (200):**
```json
{
  "success": true,
  "message": "Certificate preview data fetched",
  "data": {
    "certificate_number": "GR-CLASS-2026-0042",
    "vessel_name": "MV Star",
    "imo_number": "1234567",
    "certificate_type": "Safety Management Certificate",
    "issue_date": "2026-01-15",
    "expiry_date": "2031-01-15",
    "issuing_authority": "CLASS"
  }
}
```

---

### 26. Get Certificate Signature
```http
GET /certificates/:id/signature
```

**Response (200):**
```json
{
  "success": true,
  "message": "Certificate signature fetched",
  "data": {
    "public_key": "KEY-XYZ",
    "signature": "SHA256-SIG"
  }
}
```

---

### 27. Get Certificate History
```http
GET /certificates/:id/history
```

**Response (200):**
```json
{
  "success": true,
  "message": "Certificate history fetched",
  "data": [
    {
      "action": "ISSUED",
      "performed_by": "uuid",
      "timestamp": "2026-01-15T00:00:00.000Z",
      "details": {}
    }
  ]
}
```

---

## 💰 Payments (Own Only)

### 28. List My Payments
```http
GET /payments?page=1&limit=20&payment_status=UNPAID
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `payment_status` | string | UNPAID, PAID, ON_HOLD |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "rows": [
      {
        "id": "uuid",
        "job_id": "uuid",
        "invoice_number": "INV-2026-001",
        "amount": "5000.00",
        "currency": "USD",
        "payment_status": "UNPAID",
        "payment_date": null,
        "receipt_url": null,
        "verified_by_user_id": null,
        "JobRequest": {
          "id": "uuid",
          "reason": "Annual survey",
          "Vessel": {
            "vessel_name": "MV Star"
          }
        }
      }
    ],
    "count": 3
  }
}
```

---

### 29. Get Payment Summary
```http
GET /payments/summary
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_invoiced": "50000.00",
    "total_paid": "40000.00",
    "total_outstanding": "10000.00",
    "total_on_hold": "0.00",
    "count_paid": 8,
    "count_unpaid": 2,
    "count_on_hold": 0
  }
}
```

---

### 30. Get Payment Details
```http
GET /payments/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "job_id": "uuid",
    "invoice_number": "INV-2026-001",
    "amount": "5000.00",
    "currency": "USD",
    "payment_status": "UNPAID",
    "payment_date": null,
    "receipt_url": null,
    "verified_by_user_id": null,
    "JobRequest": {
      "id": "uuid",
      "reason": "Annual survey",
      "Vessel": {
        "vessel_name": "MV Star"
      }
    },
    "verifier": null
  }
}
```

---

## 📂 Documents

### 31. Get Upload URL
```http
GET /documents/get-upload-url?fileName=report.pdf&fileType=application/pdf&folder=documents
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3.../presigned?...",
    "fileKey": "documents/report.pdf",
    "expiresIn": 3600
  }
}
```

---

### 32. Upload Document (Direct)
```http
POST /documents/upload
Content-Type: multipart/form-data
```

**Request:**
| Field | Type | Required |
|-------|------|----------|
| `file` | File | ✅ |
| `folder` | string | optional |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "fileKey": "misc/1709672200000-report.pdf",
    "url": "https://storage.grclass.com/misc/report.pdf"
  }
}
```

---

### 33. Register Document
```http
POST /documents/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "fileKey": "uploads/abc/report.pdf",
  "fileType": "application/pdf",
  "document_type": "Survey Report",
  "description": "Final report"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "entity_type": "STANDALONE",
    "file_key": "uploads/abc/report.pdf",
    "document_type": "Survey Report"
  }
}
```

---

### 34. Get Document by ID
```http
GET /documents/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "entity_type": "JOB",
    "entity_id": "uuid",
    "document_type": "Class Certificate",
    "description": "Current class certificate",
    "file_name": "class_cert.pdf",
    "signedUrl": "https://signed-url...",
    "created_at": "2026-01-15T00:00:00.000Z"
  }
}
```

---

### 35. Get Entity Documents
```http
GET /documents/:entityType/:entityId
```

**Entity Types:** `VESSEL`, `JOB`, `CLIENT`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "entity_type": "VESSEL",
      "entity_id": "uuid",
      "document_type": "Class Certificate",
      "signedUrl": "https://...",
      "created_at": "2026-01-15T00:00:00.000Z"
    }
  ]
}
```

---

### 36. Upload Entity Documents
```http
POST /documents/:entityType/:entityId
Content-Type: multipart/form-data
```

**Request:**
| Field | Type | Required |
|-------|------|----------|
| `files` | File(s) | ✅ |
| `document_type` | string | optional |
| `description` | string | optional |

**Response (201):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "uuid",
      "entity_type": "VESSEL",
      "entity_id": "uuid",
      "document_type": "Class Certificate",
      "signedUrl": "https://..."
    }
  ]
}
```

---

## 🔔 Notifications

### 37. Get My Notifications
```http
GET /notifications
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "Job Status Updated",
      "message": "Your job request for MV Star has been approved.",
      "type": "INFO",
      "is_read": false,
      "created_at": "2026-03-05T18:00:00.000Z"
    }
  ]
}
```

---

### 38. Mark Notification as Read
```http
PUT /notifications/:id/read
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "is_read": true
  }
}
```

---

### 39. Mark All Notifications as Read
```http
PUT /notifications/read-all
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "updated": 5
  }
}
```

---

## 🎫 Support Tickets

### 40. Create Support Ticket
```http
POST /support
Content-Type: application/json
```

**Request Body:**
```json
{
  "subject": "Cannot upload documents",
  "description": "Getting 500 error when uploading PDF files for vessel MV Star.",
  "priority": "HIGH",
  "category": "Technical"
}
```

**Fields:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `subject` | string | ✅ | - |
| `description` | string | ✅ | - |
| `priority` | string | optional | LOW, MEDIUM, HIGH, URGENT |
| `category` | string | optional | - |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "subject": "Cannot upload documents",
    "description": "Getting 500 error...",
    "status": "OPEN",
    "priority": "HIGH",
    "category": "Technical",
    "resolved_at": null,
    "resolved_by": null,
    "created_at": "2026-03-05T18:00:00.000Z",
    "updated_at": "2026-03-05T18:00:00.000Z"
  }
}
```

---

### 41. List My Support Tickets
```http
GET /support?page=1&limit=20&status=OPEN
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "rows": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "subject": "Cannot upload documents",
        "description": "Getting 500 error...",
        "status": "OPEN",
        "priority": "HIGH",
        "category": "Technical",
        "created_at": "2026-03-05T18:00:00.000Z",
        "Creator": {
          "name": "Ahmed Ali",
          "email": "ahmed@abcshipping.com"
        }
      }
    ],
    "count": 2
  }
}
```

---

### 42. Get Support Ticket Details
```http
GET /support/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "subject": "Cannot upload documents",
    "description": "Getting 500 error...",
    "status": "OPEN",
    "priority": "HIGH",
    "category": "Technical",
    "resolved_at": null,
    "resolved_by": null,
    "created_at": "2026-03-05T18:00:00.000Z",
    "Creator": {
      "name": "Ahmed Ali"
    },
    "Resolver": null
  }
}
```

---

## ⭐ Customer Feedback

### 43. Submit Feedback
```http
POST /customer-feedback
Content-Type: application/json
```

**Request Body:**
```json
{
  "job_id": "uuid",
  "rating": 5,
  "timeliness": 4,
  "professionalism": 5,
  "documentation": 4,
  "remarks": "Excellent service!"
}
```

**Fields:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `job_id` | UUID | ✅ | Must be your job |
| `rating` | integer | ✅ | 1-5 |
| `timeliness` | integer | ✅ | 1-5 |
| `professionalism` | integer | ✅ | 1-5 |
| `documentation` | integer | ✅ | 1-5 |
| `remarks` | string | optional | - |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "job_id": "uuid",
    "client_id": "uuid",
    "rating": 5,
    "timeliness": 4,
    "professionalism": 5,
    "documentation": 4,
    "remarks": "Excellent service!",
    "submitted_at": "2026-03-05T18:00:00.000Z",
    "created_at": "2026-03-05T18:00:00.000Z"
  }
}
```

---

### 44. Get Feedback for Job
```http
GET /customer-feedback/job/:jobId
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "job_id": "uuid",
    "rating": 5,
    "timeliness": 4,
    "professionalism": 5,
    "documentation": 4,
    "remarks": "Excellent service!"
  }
}
```

---

## 🔄 Change Requests

### 45. Create Change Request
```http
POST /change-requests
Content-Type: application/json
```

**Request Body:**
```json
{
  "entity_type": "VESSEL",
  "entity_id": "uuid",
  "change_description": "Update port of registry from Dubai to Singapore",
  "old_value": { "port_of_registry": "Dubai" },
  "new_value": { "port_of_registry": "Singapore" },
  "priority": "MEDIUM"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Change request created successfully",
  "change_request": {
    "id": "uuid",
    "entity_type": "VESSEL",
    "entity_id": "uuid",
    "requested_by": "uuid",
    "change_description": "Update port of registry...",
    "old_value": { "port_of_registry": "Dubai" },
    "new_value": { "port_of_registry": "Singapore" },
    "status": "PENDING",
    "priority": "MEDIUM",
    "approved_by": null,
    "approval_remarks": null,
    "approved_at": null,
    "created_at": "2026-03-05T18:00:00.000Z"
  }
}
```

---

### 46. List My Change Requests
```http
GET /change-requests?status=PENDING
```

**Response (200):**
```json
{
  "success": true,
  "change_requests": [
    {
      "id": "uuid",
      "entity_type": "VESSEL",
      "entity_id": "uuid",
      "change_description": "Update port of registry...",
      "status": "PENDING",
      "priority": "MEDIUM",
      "requester": {
        "id": "uuid",
        "name": "Ahmed Ali",
        "email": "ahmed@abcshipping.com"
      }
    }
  ],
  "total": 1
}
```

---

### 47. Get Change Request by ID
```http
GET /change-requests/:id
```

**Response (200):**
```json
{
  "success": true,
  "change_request": {
    "id": "uuid",
    "entity_type": "VESSEL",
    "entity_id": "uuid",
    "change_description": "Update port of registry...",
    "old_value": { "port_of_registry": "Dubai" },
    "new_value": { "port_of_registry": "Singapore" },
    "status": "PENDING",
    "priority": "MEDIUM",
    "requester": {
      "id": "uuid",
      "name": "Ahmed Ali",
      "email": "ahmed@abcshipping.com"
    },
    "approver": null
  }
}
```

---

## 🚨 Incidents

### 48. Report Incident
```http
POST /incidents
Content-Type: application/json
```

**Request Body:**
```json
{
  "vessel_id": "uuid",
  "title": "Engine Room Fire Alarm",
  "description": "Smoke detected in engine room starboard side at 14:30 local time."
}
```

**Fields:**
| Field | Type | Required |
|-------|------|----------|
| `vessel_id` | UUID | ✅ |
| `title` | string | ✅ |
| `description` | string | ✅ |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "vessel_id": "uuid",
    "reported_by": "uuid",
    "title": "Engine Room Fire Alarm",
    "description": "Smoke detected...",
    "status": "OPEN",
    "remarks": null,
    "created_at": "2026-03-05T18:00:00.000Z",
    "updated_at": "2026-03-05T18:00:00.000Z"
  }
}
```

---

### 49. List My Incidents
```http
GET /incidents?page=1&limit=20&status=OPEN&vessel_id=uuid
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "rows": [
      {
        "id": "uuid",
        "vessel_id": "uuid",
        "reported_by": "uuid",
        "title": "Engine Room Fire Alarm",
        "description": "Smoke detected...",
        "status": "OPEN",
        "remarks": null,
        "created_at": "2026-03-05T18:00:00.000Z",
        "Vessel": {
          "vessel_name": "MV Star",
          "imo_number": "1234567"
        },
        "User": {
          "name": "Ahmed Ali"
        }
      }
    ],
    "count": 1
  }
}
```

---

### 50. Get Incident Details
```http
GET /incidents/:id
```

**Response (200):** Same structure as list item with full details

---

## 🔍 Search

### 51. Global Search
```http
GET /search?q=star
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query (min 2 characters) |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "vessels": [
      {
        "id": "uuid",
        "vessel_name": "MV Star",
        "imo_number": "1234567",
        "class_status": "ACTIVE",
        "Client": {
          "company_name": "ABC Shipping"
        }
      }
    ],
    "jobs": [
      {
        "id": "uuid",
        "job_status": "ASSIGNED",
        "reason": "Annual survey",
        "Vessel": {
          "vessel_name": "MV Star"
        }
      }
    ],
    "certificates": [
      {
        "id": "uuid",
        "certificate_number": "GR-CLASS-2026-0042",
        "status": "VALID",
        "Vessel": {
          "vessel_name": "MV Star"
        }
      }
    ]
  }
}
```

---

## 📋 Checklists

### 52. Get Job Checklist
```http
GET /checklists/jobs/:jobId
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "job_id": "uuid",
    "template_id": "uuid",
    "status": "SUBMITTED",
    "items": [
      {
        "id": "uuid",
        "question_code": "FS-001",
        "question_text": "Fire extinguishers inspected?",
        "answer": "YES",
        "remarks": "All good",
        "file_url": "https://...",
        "created_at": "2026-03-05T19:00:00.000Z"
      }
    ]
  }
}
```

---

## 🚀 Activity Requests

### 53. Create Activity Request
```http
POST /activity-requests
Content-Type: application/json
```

**Request Body:**
```json
{
  "vessel_id": "uuid",
  "activity_type": "INSPECTION",
  "requested_service": "Annual Safety Inspection",
  "priority": "HIGH",
  "description": "Annual safety inspection required before departure",
  "location_port": "Dubai Port",
  "proposed_date": "2026-04-10T00:00:00.000Z"
}
```

**Fields:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `vessel_id` | UUID | optional | Must be your vessel |
| `activity_type` | string | ✅ | INSPECTION, AUDIT, TRAINING, VISIT, OTHER |
| `requested_service` | string | optional | - |
| `priority` | string | optional | LOW, MEDIUM, HIGH, URGENT |
| `description` | string | optional | - |
| `location_port` | string | optional | - |
| `proposed_date` | ISO date | optional | - |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "request_number": "AR-2026-001",
    "requested_by": "uuid",
    "vessel_id": "uuid",
    "activity_type": "INSPECTION",
    "requested_service": "Annual Safety Inspection",
    "priority": "HIGH",
    "description": "Annual safety inspection required...",
    "location_port": "Dubai Port",
    "proposed_date": "2026-04-10T00:00:00.000Z",
    "status": "PENDING",
    "linked_job_id": null,
    "rejection_reason": null,
    "attachments": [],
    "created_at": "2026-03-05T18:00:00.000Z"
  }
}
```

---

### 54. List My Activity Requests
```http
GET /activity-requests
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "rows": [
      {
        "id": "uuid",
        "request_number": "AR-2026-001",
        "activity_type": "INSPECTION",
        "requested_service": "Annual Safety Inspection",
        "priority": "HIGH",
        "status": "PENDING",
        "proposed_date": "2026-04-10",
        "Requester": {
          "name": "Ahmed Ali"
        },
        "Vessel": {
          "vessel_name": "MV Star"
        }
      }
    ],
    "count": 2
  }
}
```

---

### 55. Get Activity Request Details
```http
GET /activity-requests/:id
```

**Response (200):** Same structure as create response with associations

---

## 🛡️ Compliance

### 56. Export Compliance Data
```http
GET /compliance/export/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Ahmed Ali",
      "email": "ahmed@abcshipping.com",
      "role": "CLIENT",
      "phone": "+971501234567",
      "status": "ACTIVE"
    },
    "client": {
      "company_name": "ABC Shipping",
      "company_code": "ABC-001"
    },
    "activity_logs": [],
    "notifications": [],
    "support_tickets": []
  }
}
```

---

# 🔴 Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "statusCode": 400
}
```

**Common HTTP Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized (login required) |
| 403 | Forbidden (access denied) |
| 404 | Not Found |
| 409 | Conflict (duplicate, already exists) |
| 500 | Server Error |

---

# 📱 Frontend Integration Checklist

## React/Next.js Hooks Example

```typescript
// hooks/useClientApi.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Get Profile
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await apiClient.get('/users/me');
      return res.data;
    },
  });
}

// Get Dashboard
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/clients/dashboard');
      return res.data;
    },
  });
}

// Get My Vessels
export function useVessels(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['vessels', params],
    queryFn: async () => {
      const res = await apiClient.get('/vessels', { params });
      return res.data;
    },
  });
}

// Get My Jobs
export function useJobs(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['jobs', params],
    queryFn: async () => {
      const res = await apiClient.get('/jobs', { params });
      return res.data;
    },
  });
}

// Create Job
export function useCreateJob() {
  return useMutation({
    mutationFn: async (data: CreateJobRequest) => {
      const res = await apiClient.post('/jobs', data);
      return res.data;
    },
  });
}

// Get Notifications
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications');
      return res.data;
    },
  });
}
```

---

# ✅ Summary

All CLIENT APIs are now properly configured with:
- ✅ **RBAC Scoping** - Clients only see their own data
- ✅ **Proper Response Formats** - Consistent `{ success, data/message }` structure
- ✅ **Field Validation** - All required fields documented
- ✅ **Error Handling** - Standardized error responses
- ✅ **Query Parameters** - Pagination, filtering, sorting support
- ✅ **File Uploads** - Multipart and presigned URL support

**Total APIs Available: 56 endpoints**

For any issues, check:
1. Authorization header is set: `Authorization: Bearer <token>`
2. User has `role: "CLIENT"` in their profile
3. User has `client_id` assigned
