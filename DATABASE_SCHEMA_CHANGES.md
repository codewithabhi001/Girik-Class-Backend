# Database Schema Changes - Checklist Template System

## Overview
This document details all database schema changes made to implement the checklist template system.

---

## 1. Checklist Templates Table

### Column Added via Migration
**Column:** `certificate_type_id`

**Migration File:** `src/migrations/add_certificate_type_to_checklist_templates.js`

**SQL Command:**
```sql
ALTER TABLE checklist_templates 
MODIFY COLUMN certificate_type_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL
COMMENT 'Links template to a specific certificate type';

ALTER TABLE checklist_templates 
ADD CONSTRAINT fk_checklist_template_cert_type 
FOREIGN KEY (certificate_type_id) 
REFERENCES certificate_types(id)
ON DELETE SET NULL
ON UPDATE CASCADE;
```

### Complete Table Structure

**Table Name:** `checklist_templates`

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| `id` | CHAR(36) | NO | UUIDV7 | Primary Key |
| `name` | VARCHAR(255) | NO | - | Template name |
| `code` | VARCHAR(255) | NO | - | Unique template code |
| `description` | TEXT | YES | NULL | Template description |
| **`certificate_type_id`** | **CHAR(36)** | **YES** | **NULL** | **Links to certificate type** ⭐ |
| `sections` | JSON | NO | [] | Questions organized in sections |
| `status` | ENUM | NO | 'DRAFT' | ACTIVE, INACTIVE, DRAFT |
| `metadata` | JSON | YES | {} | Additional configuration |
| `created_by` | CHAR(36) | YES | NULL | User who created |
| `updated_by` | CHAR(36) | YES | NULL | User who last updated |
| `created_at` | DATETIME | NO | NOW() | Creation timestamp |
| `updated_at` | DATETIME | NO | NOW() | Last update timestamp |

### Indexes
- PRIMARY KEY: `id`
- UNIQUE KEY: `code`

### Foreign Keys
- `created_by` → `users(id)` ON UPDATE CASCADE
- `updated_by` → `users(id)` ON UPDATE CASCADE
- **`certificate_type_id` → `certificate_types(id)` ON DELETE SET NULL ON UPDATE CASCADE** ⭐

---

## 2. Model Updates

### File: `src/models/checklist_template.model.js`

**Changes Made:**
1. ✅ Added `certificate_type_id` field (lines 8-12)
2. ✅ Added association to `CertificateType` model (line 36)

**Code:**
```javascript
export default (sequelize, DataTypes) => {
    const ChecklistTemplate = sequelize.define('ChecklistTemplate', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV7, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        code: { type: DataTypes.STRING, unique: true, allowNull: false },
        description: DataTypes.TEXT,
        
        // ⭐ NEW FIELD ADDED
        certificate_type_id: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'Links template to a specific certificate type (e.g., Load Line, Safety Equipment)'
        },
        
        sections: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
            comment: 'Array of sections with questions: [{ title, items: [{ code, text, type }] }]'
        },
        status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'DRAFT'), defaultValue: 'DRAFT' },
        metadata: {
            type: DataTypes.JSON,
            defaultValue: {},
            comment: 'Additional config like version, applicable_vessel_types, etc.'
        },
        created_by: DataTypes.UUID,
        updated_by: DataTypes.UUID
    }, {
        tableName: 'checklist_templates',
        underscored: true,
        timestamps: true,
    });

    ChecklistTemplate.associate = (models) => {
        ChecklistTemplate.belongsTo(models.User, { as: 'Creator', foreignKey: 'created_by' });
        ChecklistTemplate.belongsTo(models.User, { as: 'Updater', foreignKey: 'updated_by' });
        
        // ⭐ NEW ASSOCIATION ADDED
        ChecklistTemplate.belongsTo(models.CertificateType, { foreignKey: 'certificate_type_id' });
    };

    return ChecklistTemplate;
};
```

---

## 3. Activity Planning Table (Surveyor Responses)

### Existing Structure - No Changes Needed ✅

**Table Name:** `activity_plannings`

| Column | Type | Nullable | Comment |
|--------|------|----------|---------|
| `id` | CHAR(36) | NO | Primary Key |
| `job_id` | CHAR(36) | NO | Links to job_requests |
| `question_code` | VARCHAR(255) | YES | Question identifier |
| `question_text` | VARCHAR(255) | YES | Full question text ✅ |
| `answer` | ENUM | YES | YES, NO, NA |
| `remarks` | TEXT | YES | Additional comments |
| `created_at` | DATETIME | NO | Timestamp |
| `updated_at` | DATETIME | NO | Timestamp |

**Note:** The `question_text` field already exists, so no migration needed for this table.

---

## 4. Certificate Types Table

### Existing Structure - No Changes Needed ✅

**Table Name:** `certificate_types`

| Column | Type | Nullable | Comment |
|--------|------|----------|---------|
| `id` | CHAR(36) | NO | Primary Key |
| `name` | VARCHAR(255) | YES | Certificate type name |
| `issuing_authority` | ENUM | YES | CLASS, FLAG |
| `validity_years` | INT | YES | Default validity period |
| `status` | ENUM | NO | ACTIVE, INACTIVE |
| `description` | TEXT | YES | Description |

**Note:** This table was already properly structured. We just seeded it with 17 certificate types.

---

## 5. Validation Schema Updates

### File: `src/middlewares/validate.middleware.js`

**New Schemas Added:**

```javascript
// For creating checklist templates
createChecklistTemplate: Joi.object({
    name: Joi.string().required(),
    code: Joi.string().required(),
    description: Joi.string().optional().allow(''),
    certificate_type_id: Joi.string().guid().optional().allow(null), // ⭐ NEW
    sections: Joi.array().items(Joi.object({
        title: Joi.string().required(),
        items: Joi.array().items(Joi.object({
            code: Joi.string().required(),
            text: Joi.string().required(),
            type: Joi.string().valid('YES_NO_NA', 'TEXT', 'NUMBER').default('YES_NO_NA')
        })).required()
    })).required(),
    status: Joi.string().valid('ACTIVE', 'INACTIVE', 'DRAFT').optional(),
    metadata: Joi.object().optional()
}),

// For updating checklist templates
updateChecklistTemplate: Joi.object({
    name: Joi.string().optional(),
    code: Joi.string().optional(),
    description: Joi.string().optional().allow(''),
    certificate_type_id: Joi.string().guid().optional().allow(null), // ⭐ NEW
    sections: Joi.array().items(Joi.object({
        title: Joi.string().required(),
        items: Joi.array().items(Joi.object({
            code: Joi.string().required(),
            text: Joi.string().required(),
            type: Joi.string().valid('YES_NO_NA', 'TEXT', 'NUMBER').default('YES_NO_NA')
        })).required()
    })).optional(),
    status: Joi.string().valid('ACTIVE', 'INACTIVE', 'DRAFT').optional(),
    metadata: Joi.object().optional()
}),
```

**Updated Schema:**

```javascript
// Updated to include question_text
submitChecklist: Joi.object({
    items: Joi.array().items(Joi.object({
        question_code: Joi.string().required(),
        question_text: Joi.string().required(), // ⭐ ADDED
        answer: Joi.string().valid('YES', 'NO', 'NA').required(),
        remarks: Joi.string().allow('').optional()
    })).required()
}),
```

---

## 6. Summary of All Changes

### Database Migrations
| Table | Column Added | Type | Foreign Key |
|-------|-------------|------|-------------|
| `checklist_templates` | `certificate_type_id` | CHAR(36) | → `certificate_types(id)` |

### Model Files Updated
| File | Changes |
|------|---------|
| `src/models/checklist_template.model.js` | Added `certificate_type_id` field and `CertificateType` association |
| `src/models/activity_planning.model.js` | ✅ Already had `question_text` - no changes needed |

### Validation Schemas Added
| Schema Name | Purpose |
|------------|---------|
| `createChecklistTemplate` | Validate template creation |
| `updateChecklistTemplate` | Validate template updates |
| `submitChecklist` (updated) | Now requires `question_text` |

---

## 7. How to Verify Changes

### Check Database Structure
```sql
-- Verify checklist_templates table
DESCRIBE checklist_templates;

-- Verify foreign key
SHOW CREATE TABLE checklist_templates;

-- Check certificate types
SELECT id, name FROM certificate_types ORDER BY name;

-- Check checklist templates
SELECT id, name, code, certificate_type_id FROM checklist_templates;
```

### Check Model Associations
```javascript
// In Node.js console or test file
import db from './src/models/index.js';

// Check if association exists
console.log(db.ChecklistTemplate.associations);
// Should show: Creator, Updater, CertificateType

// Test query with association
const template = await db.ChecklistTemplate.findOne({
    include: [{ model: db.CertificateType }]
});
console.log(template.CertificateType); // Should show certificate type data
```

---

## 8. Migration History

| Date | Migration | Status |
|------|-----------|--------|
| 2026-02-11 | `add_certificate_type_to_checklist_templates.js` | ✅ Completed |

---

## 9. Rollback Instructions (If Needed)

If you need to rollback the migration:

```sql
-- Remove foreign key constraint
ALTER TABLE checklist_templates 
DROP FOREIGN KEY fk_checklist_template_cert_type;

-- Remove column
ALTER TABLE checklist_templates 
DROP COLUMN certificate_type_id;
```

**Note:** Also revert the model file changes if rolling back.

---

## ✅ All Changes Complete

- ✅ Database column added via migration
- ✅ Model updated with new field
- ✅ Association added to CertificateType
- ✅ Validation schemas updated
- ✅ Foreign key constraint applied
- ✅ Data seeded (17 certificate types, 2 checklist templates)

**The system is fully operational and ready to use!**
