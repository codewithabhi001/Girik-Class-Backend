# 📋 Surveyor Checklist Submission Guide

## 🎯 Complete Workflow: From Template to Submission

---

## Step 1: Surveyor Gets the Template for Their Job

**Endpoint:** `GET /api/v1/checklist-templates/job/{jobId}`

**Example Request:**
```bash
GET /api/v1/checklist-templates/job/019c378d-3052-776d-bdd3-a5817a6332ed
Authorization: Bearer {surveyor-jwt-token}
```

**Response:** (The template you provided)
```json
{
  "success": true,
  "data": {
    "id": "019c4b0d-df72-75bb-ba86-7455c75a4720",
    "name": "Safety Equipment Inspection Checklist",
    "code": "SAFETY_EQUIP_001",
    "sections": [
      {
        "title": "Life-Saving Appliances",
        "items": [
          {
            "code": "LSA001",
            "text": "Are life jackets available for all persons on board?",
            "type": "YES_NO_NA"
          },
          {
            "code": "LSA002",
            "text": "Are life jackets in good condition?",
            "type": "YES_NO_NA"
          },
          {
            "code": "LSA003",
            "text": "Total number of life jackets found",
            "type": "NUMBER"
          }
          // ... more items
        ]
      },
      {
        "title": "Fire Fighting Equipment",
        "items": [
          {
            "code": "FFE001",
            "text": "Are portable fire extinguishers within expiry date?",
            "type": "YES_NO_NA"
          }
          // ... more items
        ]
      },
      {
        "title": "Emergency Equipment",
        "items": [
          {
            "code": "EME001",
            "text": "Are emergency lights functional?",
            "type": "YES_NO_NA"
          }
          // ... more items
        ]
      }
    ]
  }
}
```

---

## Step 2: Surveyor Fills Out the Checklist

The surveyor goes through each section and answers each question based on the inspection.

---

## Step 3: Surveyor Submits the Completed Checklist

**Endpoint:** `PUT /api/v1/jobs/{jobId}/checklist`

**Example Request:**
```bash
PUT /api/v1/jobs/019c378d-3052-776d-bdd3-a5817a6332ed/checklist
Authorization: Bearer {surveyor-jwt-token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "items": [
    // ========== Life-Saving Appliances Section ==========
    {
      "question_code": "LSA001",
      "question_text": "Are life jackets available for all persons on board?",
      "answer": "YES",
      "remarks": "Found 25 life jackets, all accessible"
    },
    {
      "question_code": "LSA002",
      "question_text": "Are life jackets in good condition (no tears, inflation mechanism working)?",
      "answer": "YES",
      "remarks": "All life jackets inspected, no damage found"
    },
    {
      "question_code": "LSA003",
      "question_text": "Total number of life jackets found",
      "answer": "25",
      "remarks": "Counted and verified"
    },
    {
      "question_code": "LSA004",
      "question_text": "Are liferafts properly serviced and within certification date?",
      "answer": "YES",
      "remarks": "Service date: 2025-12-15, valid until 2026-12-15"
    },
    {
      "question_code": "LSA005",
      "question_text": "Number of liferafts on board",
      "answer": "2",
      "remarks": "Both liferafts in good condition"
    },
    {
      "question_code": "LSA006",
      "question_text": "Are lifeboats in operational condition?",
      "answer": "YES",
      "remarks": "Tested launching mechanism, working properly"
    },
    {
      "question_code": "LSA007",
      "question_text": "Describe any deficiencies found in life-saving equipment",
      "answer": "No deficiencies found. All equipment in excellent condition.",
      "remarks": ""
    },

    // ========== Fire Fighting Equipment Section ==========
    {
      "question_code": "FFE001",
      "question_text": "Are portable fire extinguishers within expiry date?",
      "answer": "YES",
      "remarks": "All 12 extinguishers checked, expiry dates valid"
    },
    {
      "question_code": "FFE002",
      "question_text": "Are fire extinguishers properly mounted and accessible?",
      "answer": "YES",
      "remarks": "All mounted in designated locations with clear access"
    },
    {
      "question_code": "FFE003",
      "question_text": "Number of fire extinguishers inspected",
      "answer": "12",
      "remarks": "CO2: 6, Foam: 4, Powder: 2"
    },
    {
      "question_code": "FFE004",
      "question_text": "Is the fire detection system operational?",
      "answer": "YES",
      "remarks": "Tested all zones, system responding correctly"
    },
    {
      "question_code": "FFE005",
      "question_text": "Is the fire alarm system functional?",
      "answer": "YES",
      "remarks": "Alarm tested, audible in all areas"
    },
    {
      "question_code": "FFE006",
      "question_text": "Are fire hoses and nozzles in good condition?",
      "answer": "NO",
      "remarks": "One hose on deck 3 showing wear, recommended replacement"
    },
    {
      "question_code": "FFE007",
      "question_text": "Describe fire fighting system configuration",
      "answer": "Fixed CO2 system in engine room, foam system in cargo area, portable extinguishers throughout vessel. Water spray system in accommodation.",
      "remarks": "All systems tested and operational except noted hose"
    },

    // ========== Emergency Equipment Section ==========
    {
      "question_code": "EME001",
      "question_text": "Are emergency lights functional?",
      "answer": "YES",
      "remarks": "All emergency lights tested, battery backup working"
    },
    {
      "question_code": "EME002",
      "question_text": "Is emergency power supply operational?",
      "answer": "YES",
      "remarks": "Emergency generator tested, auto-start functioning"
    },
    {
      "question_code": "EME003",
      "question_text": "Are emergency escape routes clearly marked?",
      "answer": "YES",
      "remarks": "All escape routes marked with illuminated signs"
    },
    {
      "question_code": "EME004",
      "question_text": "Is the emergency communication system working?",
      "answer": "YES",
      "remarks": "PA system tested, all speakers functional"
    }
  ]
}
```

---

## 📊 Understanding the Answer Types

### 1. YES_NO_NA Questions
**Answer:** Must be one of: `"YES"`, `"NO"`, or `"NA"`

**Example:**
```json
{
  "question_code": "LSA001",
  "question_text": "Are life jackets available for all persons on board?",
  "answer": "YES",
  "remarks": "Found 25 life jackets, all accessible"
}
```

### 2. NUMBER Questions
**Answer:** Numeric value as a string

**Example:**
```json
{
  "question_code": "LSA003",
  "question_text": "Total number of life jackets found",
  "answer": "25",
  "remarks": "Counted and verified"
}
```

### 3. TEXT Questions
**Answer:** Free-form text description

**Example:**
```json
{
  "question_code": "FFE007",
  "question_text": "Describe fire fighting system configuration",
  "answer": "Fixed CO2 system in engine room, foam system in cargo area...",
  "remarks": "All systems tested and operational"
}
```

---

## ✅ Successful Response

```json
{
  "success": true,
  "message": "Checklist submitted successfully",
  "data": {
    "job_id": "019c378d-3052-776d-bdd3-a5817a6332ed",
    "items_submitted": 18,
    "submitted_at": "2026-02-11T10:45:00.000Z"
  }
}
```

---

## 🎯 Key Points for Surveyors

### Required Fields
Every item must include:
1. ✅ `question_code` - From the template
2. ✅ `question_text` - From the template
3. ✅ `answer` - The surveyor's response
4. ⚠️ `remarks` - Optional but recommended

### Answer Validation
- **YES_NO_NA:** Must be exactly `"YES"`, `"NO"`, or `"NA"`
- **NUMBER:** Can be any numeric value (as string)
- **TEXT:** Can be any text description

### Best Practices
1. ✅ Answer ALL questions in the template
2. ✅ Provide detailed remarks for:
   - Any "NO" answers
   - Any deficiencies found
   - Important observations
3. ✅ Use "NA" when a question doesn't apply to the vessel
4. ✅ Be specific with numbers and descriptions

---

## 🔄 Complete Frontend Flow

### 1. Surveyor Opens Job
```javascript
// Get job details
GET /api/v1/jobs/019c378d-3052-776d-bdd3-a5817a6332ed
```

### 2. Fetch Checklist Template
```javascript
// Get the template for this job
GET /api/v1/checklist-templates/job/019c378d-3052-776d-bdd3-a5817a6332ed
```

### 3. Display Form
```javascript
// Frontend renders a form with:
// - Section headers (Life-Saving Appliances, Fire Fighting, etc.)
// - Questions from template
// - Input fields based on question type:
//   - YES_NO_NA: Radio buttons or dropdown
//   - NUMBER: Number input
//   - TEXT: Textarea
// - Remarks field for each question
```

### 4. Surveyor Fills Form
```javascript
// User answers each question
// Frontend builds the submission object
```

### 5. Submit Checklist
```javascript
PUT /api/v1/jobs/019c378d-3052-776d-bdd3-a5817a6332ed/checklist
{
  "items": [
    // All answered questions
  ]
}
```

---

## 📱 Example Frontend Code (React)

```javascript
// Fetch template
const fetchTemplate = async (jobId) => {
  const response = await fetch(
    `/api/v1/checklist-templates/job/${jobId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  const data = await response.json();
  return data.data;
};

// Submit checklist
const submitChecklist = async (jobId, answers) => {
  const items = answers.map(answer => ({
    question_code: answer.code,
    question_text: answer.text,
    answer: answer.value,
    remarks: answer.remarks || ''
  }));

  const response = await fetch(
    `/api/v1/jobs/${jobId}/checklist`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ items })
    }
  );
  
  return await response.json();
};
```

---

## ❌ Common Errors

### 1. Invalid Answer for YES_NO_NA
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "items[0].answer must be one of [YES, NO, NA]"
  ]
}
```

### 2. Missing Required Fields
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "items[0].question_code is required",
    "items[0].question_text is required",
    "items[0].answer is required"
  ]
}
```

---

## 🎉 Summary

**Surveyor Workflow:**
1. 📋 Get template for job → `GET /checklist-templates/job/{jobId}`
2. ✍️ Fill out all questions
3. 📤 Submit answers → `PUT /jobs/{jobId}/checklist`
4. ✅ Done!

**The system automatically:**
- Links answers to the job
- Stores question codes and text
- Tracks submission timestamp
- Validates all answers

**Result:** Complete audit trail of the inspection! 🚀
