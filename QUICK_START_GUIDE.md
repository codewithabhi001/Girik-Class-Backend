# 🚀 Quick Start Guide - Checklist Template System

## API Documentation (Swagger)

Interactive OpenAPI docs are available at:

| URL | Description |
|-----|-------------|
| http://localhost:3000/api-docs | Full API (all endpoints) |
| http://localhost:3000/api-docs/admin | ADMIN role view |
| http://localhost:3000/api-docs/gm | GM role view |
| http://localhost:3000/api-docs/tm | TM role view |
| http://localhost:3000/api-docs/surveyor | SURVEYOR role view |
| http://localhost:3000/api-docs/client | CLIENT role view |

**Try it out:** Log in via `/api/v1/auth/login`, then click **Authorize** and enter `Bearer <token>`.

---

## Current Situation

You have an empty database with no certificate types yet. This is normal! Follow these steps to get everything working.

---

## Step-by-Step Setup

### Step 1: Seed Certificate Types ⭐

Certificate types are required before creating checklist templates.

```bash
# Run the seeder script
node src/seeders/seed_certificate_types.js
```

**Expected Output:**
```
🌱 Starting certificate types seeding...
✅ Database connection established
✅ Created "Safety Equipment Certificate" (ID: abc-123-...)
✅ Created "Load Line Certificate" (ID: def-456-...)
...

📋 Available Certificate Types:

1. Safety Equipment Certificate
   ID: abc-123-def-456-...
   Authority: CLASS
   Validity: 1 years
...
```

**Copy the IDs** - you'll need them in the next step!

---

### Step 2: Create Checklist Templates

Now that you have certificate types, you can create templates.

#### Option A: Using the API (Recommended)

1. **Login as ADMIN** to get your JWT token:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-password"
  }'
```

2. **Create a template** (replace `CERT_TYPE_ID` with actual ID from Step 1):
```bash
curl -X POST http://localhost:3000/api/v1/checklist-templates \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=YOUR_JWT_TOKEN" \
  -d '{
    "name": "Safety Equipment Inspection Checklist",
    "code": "SAFETY_EQUIP_001",
    "description": "Standard safety equipment inspection",
    "certificate_type_id": "CERT_TYPE_ID_HERE",
    "sections": [
      {
        "title": "Life-Saving Equipment",
        "items": [
          {
            "code": "LSE001",
            "text": "Are life jackets available?",
            "type": "YES_NO_NA"
          },
          {
            "code": "LSE002",
            "text": "Number of life jackets",
            "type": "NUMBER"
          }
        ]
      }
    ],
    "status": "ACTIVE"
  }'
```

#### Option B: Using an API client (e.g. Thunder Client)

1. Set base URL to your server and add authentication (JWT cookie)
2. Use the request body from Option A above

---

### Step 3: Verify Templates Were Created

```bash
# List all templates
curl http://localhost:3000/api/v1/checklist-templates \
  -H "Cookie: jwt=YOUR_JWT_TOKEN"
```

**Expected Response:**
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
        "name": "Safety Equipment Certificate"
      }
    }
  ]
}
```

---

### Step 4: Test the Complete Workflow

#### 4.1 Create a Job
```bash
curl -X POST http://localhost:3000/api/v1/jobs \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=YOUR_JWT_TOKEN" \
  -d '{
    "vessel_id": "YOUR_VESSEL_ID",
    "certificate_type_id": "CERT_TYPE_ID_FROM_STEP_1",
    "reason": "Annual survey",
    "target_port": "Singapore",
    "target_date": "2026-03-01"
  }'
```

#### 4.2 Assign Surveyor (as GM/ADMIN)
```bash
curl -X PUT http://localhost:3000/api/v1/jobs/JOB_ID/assign \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=YOUR_JWT_TOKEN" \
  -d '{
    "surveyorId": "SURVEYOR_USER_ID"
  }'
```

#### 4.3 Surveyor Fetches Template ⭐
```bash
curl http://localhost:3000/api/v1/checklist-templates/job/JOB_ID \
  -H "Cookie: jwt=SURVEYOR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Use this template to fill out the checklist for this job",
  "data": {
    "name": "Safety Equipment Inspection Checklist",
    "sections": [
      {
        "title": "Life-Saving Equipment",
        "items": [
          {
            "code": "LSE001",
            "text": "Are life jackets available?",
            "type": "YES_NO_NA"
          }
        ]
      }
    ]
  }
}
```

#### 4.4 Surveyor Submits Checklist
```bash
curl -X PUT http://localhost:3000/api/v1/jobs/JOB_ID/checklist \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=SURVEYOR_JWT_TOKEN" \
  -d '{
    "items": [
      {
        "question_code": "LSE001",
        "question_text": "Are life jackets available?",
        "answer": "YES",
        "remarks": "20 life jackets found in good condition"
      }
    ]
  }'
```

---

## 🎯 Quick Reference

### Certificate Types Endpoint
```
GET /api/v1/certificates/types
```
Returns all certificate types with their IDs.

### Checklist Template Endpoints
```
POST   /api/v1/checklist-templates          # Create template (ADMIN)
GET    /api/v1/checklist-templates          # List templates
GET    /api/v1/checklist-templates/:id      # Get specific template
GET    /api/v1/checklist-templates/job/:jobId  # Get template for job ⭐
PUT    /api/v1/checklist-templates/:id      # Update template (ADMIN)
DELETE /api/v1/checklist-templates/:id      # Delete template (ADMIN)
```

### Checklist Submission Endpoints
```
GET /api/v1/jobs/:jobId/checklist    # View submitted checklist
PUT /api/v1/jobs/:jobId/checklist    # Submit/update checklist (SURVEYOR)
```

---

## 🐛 Troubleshooting

### Problem: "No certificate types found"
**Solution:** Run the seeder: `node src/seeders/seed_certificate_types.js`

### Problem: "No active checklist template found for certificate type"
**Solution:** 
1. Make sure you created a template with the correct `certificate_type_id`
2. Make sure the template status is `ACTIVE`
3. Verify: `GET /api/v1/checklist-templates?status=ACTIVE`

### Problem: "Validation Error: certificate_type_id must be a valid GUID"
**Solution:** Use the actual UUID from Step 1, not a placeholder

### Problem: "Access denied"
**Solution:** 
- Creating templates requires ADMIN role
- Fetching templates for jobs requires SURVEYOR role
- Check your JWT token and user role

---

## 📊 Database Check

To verify everything is set up correctly:

```sql
-- Check certificate types
SELECT id, name, issuing_authority FROM certificate_types;

-- Check checklist templates
SELECT id, name, code, certificate_type_id, status FROM checklist_templates;

-- Check template-certificate type relationships
SELECT 
  ct.name as template_name,
  cert.name as certificate_type
FROM checklist_templates ct
LEFT JOIN certificate_types cert ON ct.certificate_type_id = cert.id;
```

---

## ✅ Success Checklist

- [ ] Certificate types seeded (Step 1)
- [ ] At least one checklist template created (Step 2)
- [ ] Template appears in list (Step 3)
- [ ] Can fetch template for a job (Step 4.3)
- [ ] Can submit checklist (Step 4.4)

---

## 🎉 You're All Set!

Once you complete these steps, your checklist template system will be fully operational!

**Key Takeaway:** The system automatically selects the right template based on the job's certificate type. Surveyors just need to fetch the template for their job and fill it out!
