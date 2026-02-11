# ✅ Swagger Documentation Updated

## File Updated
**`src/modules/checklists/checklists.swagger.yaml`**

---

## 📝 What Was Added

### New API Endpoints Documented (8 endpoints)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/checklist-templates` | List all templates | ADMIN, GM, TM, SURVEYOR |
| `POST` | `/checklist-templates` | Create new template | ADMIN |
| `GET` | `/checklist-templates/{id}` | Get specific template | ADMIN, GM, TM, SURVEYOR |
| `PUT` | `/checklist-templates/{id}` | Update template | ADMIN |
| `DELETE` | `/checklist-templates/{id}` | Delete template | ADMIN |
| `GET` | `/checklist-templates/job/{jobId}` | **Get template for job** ⭐ | SURVEYOR, ADMIN, GM, TM, TO |
| `PUT` | `/checklist-templates/{id}/activate` | Activate template | ADMIN |
| `POST` | `/checklist-templates/{id}/clone` | Clone template | ADMIN |

### New Schemas Defined (2 schemas)

1. **`ChecklistTemplate`** - Response schema for template data
2. **`ChecklistTemplateInput`** - Request schema for creating/updating templates

---

## 🎯 Key Features Documented

### 1. Checklist Template CRUD
- ✅ Create, Read, Update, Delete operations
- ✅ Role-based access control (RBAC)
- ✅ Request/response examples
- ✅ Validation requirements

### 2. Job-Specific Template Retrieval ⭐
```yaml
/checklist-templates/job/{jobId}:
  get:
    summary: Get Checklist Template for Job
    description: |
      **CRITICAL ENDPOINT FOR SURVEYORS**
      
      Automatically fetches the appropriate checklist template for a specific job 
      based on the job's certificate type. This is what surveyors use to know 
      which questions to answer.
```

### 3. Template Management
- ✅ Activation/deactivation
- ✅ Cloning for versioning
- ✅ Filtering by status and certificate type

### 4. Updated Checklist Submission
- ✅ Now requires `question_text` field
- ✅ Enum validation for answers (YES, NO, NA)
- ✅ Examples provided

---

## 📊 Schema Details

### ChecklistTemplate Schema
```yaml
ChecklistTemplate:
  properties:
    id: UUID
    name: string
    code: string (unique)
    description: string
    certificate_type_id: UUID (nullable) ⭐ NEW
    sections: array of sections
      - title: string
      - items: array of questions
        - code: string
        - text: string
        - type: enum (YES_NO_NA, TEXT, NUMBER)
    status: enum (ACTIVE, INACTIVE, DRAFT)
    metadata: object
    CertificateType: object (association) ⭐ NEW
    created_at: datetime
    updated_at: datetime
```

### ChecklistTemplateInput Schema
```yaml
ChecklistTemplateInput:
  required:
    - name
    - code
    - sections
  properties:
    name: string
    code: string
    description: string
    certificate_type_id: UUID (optional) ⭐ NEW
    sections: array
    status: enum (default: DRAFT)
    metadata: object
```

---

## 🔍 Example Request/Response

### Create Template
**Request:**
```json
POST /api/v1/checklist-templates
{
  "name": "Safety Equipment Inspection Checklist",
  "code": "SAFETY_EQUIP_001",
  "description": "Comprehensive checklist for inspecting vessel safety equipment",
  "certificate_type_id": "019c4b07-983f-707e-b168-2fb307169bd2",
  "sections": [
    {
      "title": "Life-Saving Appliances",
      "items": [
        {
          "code": "LSE001",
          "text": "Are life jackets available for all persons on board?",
          "type": "YES_NO_NA"
        }
      ]
    }
  ],
  "status": "ACTIVE"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Checklist template created successfully",
  "data": {
    "id": "019c4b0d-df72-75bb-ba86-7455c75a4720",
    "name": "Safety Equipment Inspection Checklist",
    "code": "SAFETY_EQUIP_001",
    "certificate_type_id": "019c4b07-983f-707e-b168-2fb307169bd2",
    "sections": [...],
    "status": "ACTIVE",
    "CertificateType": {
      "id": "019c4b07-983f-707e-b168-2fb307169bd2",
      "name": "Safety Equipment Certificate",
      "issuing_authority": "CLASS"
    }
  }
}
```

### Get Template for Job ⭐
**Request:**
```
GET /api/v1/checklist-templates/job/job-uuid-123
```

**Response:**
```json
{
  "success": true,
  "message": "Use this template to fill out the checklist for this job",
  "data": {
    "id": "019c4b0d-df72-75bb-ba86-7455c75a4720",
    "name": "Safety Equipment Inspection Checklist",
    "sections": [
      {
        "title": "Life-Saving Appliances",
        "items": [
          {
            "code": "LSE001",
            "text": "Are life jackets available for all persons on board?",
            "type": "YES_NO_NA"
          }
        ]
      }
    ]
  }
}
```

---

## 📋 Query Parameters

### List Templates
```
GET /checklist-templates?status=ACTIVE&certificate_type_id=uuid-here
```

**Parameters:**
- `status` (optional): ACTIVE, INACTIVE, DRAFT
- `certificate_type_id` (optional): Filter by certificate type

---

## 🎨 Swagger UI Features

### Role-Based Filtering
All endpoints include `x-roles` extension for role-based filtering in Swagger UI:
```yaml
x-roles: [ADMIN, GM, TM, SURVEYOR]
```

### Comprehensive Examples
- ✅ Request body examples
- ✅ Response examples
- ✅ Error response examples
- ✅ Enum values documented

### Detailed Descriptions
- ✅ Endpoint purposes explained
- ✅ RBAC requirements specified
- ✅ Critical endpoints highlighted

---

## 🚀 How to View

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Open Swagger UI:**
   ```
   http://localhost:3000/api-docs
   ```

3. **Navigate to "Checklists" section**

4. **You'll see:**
   - Job Checklists (existing)
   - **Checklist Templates (NEW)** ⭐

---

## ✅ Verification Checklist

- [x] All 8 new endpoints documented
- [x] Request schemas defined
- [x] Response schemas defined
- [x] RBAC roles specified
- [x] Examples provided
- [x] Query parameters documented
- [x] Error responses included
- [x] Updated existing checklist submission schema
- [x] Certificate type linking documented

---

## 📚 Related Documentation

- **API Docs:** `CHECKLIST_TEMPLATE_API_DOCS.md`
- **Implementation:** `IMPLEMENTATION_SUMMARY.md`
- **Database:** `DATABASE_SCHEMA_CHANGES.md`
- **Quick Start:** `QUICK_START_GUIDE.md`

---

## 🎉 Summary

The Swagger documentation is now **complete and up-to-date** with all checklist template endpoints!

**Access it at:** `http://localhost:3000/api-docs` → **Checklists** section
