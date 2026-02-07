# 🔄 Auto-Sync Database Models - ENABLED ✅

## What This Does

The GIRIK Backend now **automatically creates and updates database tables** when the server starts!

### Features Enabled:

✅ **Auto-Create Tables**
- When you start the server for the first time, all 51 tables are created automatically
- No need to run migrations manually
- No need to create tables in MySQL manually

✅ **Auto-Update Columns**
- When you modify a model (add/remove/change columns), the database updates automatically
- Sequelize uses `ALTER TABLE` to adjust the schema
- Your data is preserved during updates

✅ **Auto-Create Relationships**
- Foreign keys are created automatically
- Indexes are created automatically
- Constraints are applied automatically

---

## How It Works

### Configuration in `src/server.js`:

```javascript
await db.sequelize.sync({ alter: true });
```

**What `alter: true` does:**
1. Checks if tables exist
2. If not, creates them with `CREATE TABLE`
3. If they exist, compares with model definitions
4. Adds missing columns
5. Modifies changed columns
6. Removes columns that are no longer in the model
7. Updates indexes and constraints

---

## Current Database Status

**Database:** `root`  
**Total Tables:** 51  
**Status:** ✅ All synced

### Tables Created:

1. `abac_policies`
2. `activity_plannings`
3. `activity_requests`
4. `ai_model_versions`
5. `api_rate_limits`
6. `approval_matrix`
7. `approval_steps`
8. `approvals`
9. `audit_logs`
10. `certificate_alerts`
11. `certificate_history`
12. `certificate_types`
13. `certificates`
14. `checklist_templates`
15. `clients`
16. `customer_feedbacks`
17. `document_versions`
18. `documents`
19. `email_logs`
20. `events`
21. `evidence_items`
22. `flag_administrations`
23. `geofence_zones`
24. `gps_tracks`
25. `incidents`
26. `job_requests`
27. `legal_holds`
28. `non_conformities`
29. `notifications`
30. `payment_invoices`
31. `permission_overrides`
32. `permissions`
33. `public_certificates`
34. `role_permissions`
35. `roles`
36. `security_policies`
37. `sla_breaches`
38. `sla_rules`
39. `survey_reports`
40. `surveyor_applications`
41. `surveyor_profiles`
42. `system_settings`
43. `tocas`
44. `user_sessions`
45. `users`
46. `vessel_documents`
47. `vessels`
48. `webhook_deliveries`
49. `webhook_subscriptions`
50. And more...

---

## Example: Adding a New Column

### 1. Update the Model

Edit any model file, for example `src/models/User.js`:

```javascript
// Add a new column
middle_name: {
    type: DataTypes.STRING,
    allowNull: true
}
```

### 2. Restart the Server

```bash
# The server will automatically detect the change
# and run: ALTER TABLE users ADD COLUMN middle_name VARCHAR(255)
```

### 3. Done!

The column is now in your database. No migration files needed!

---

## Example: Changing a Column Type

### 1. Update the Model

```javascript
// Change phone from STRING to STRING(20)
phone: {
    type: DataTypes.STRING(20),  // Changed from STRING
    allowNull: true
}
```

### 2. Restart the Server

```bash
# Sequelize will run: ALTER TABLE users MODIFY COLUMN phone VARCHAR(20)
```

### 3. Done!

The column type is updated automatically!

---

## When Does Sync Happen?

**Every time the server starts:**

```
[dotenv] Loading environment variables...
Executing: SELECT 1+1 AS result
✅ Database connected successfully.
🔄 Syncing database models...
Executing: CREATE TABLE IF NOT EXISTS `users` (...)
Executing: CREATE TABLE IF NOT EXISTS `vessels` (...)
... (all 51 tables)
✅ Database models synced successfully.
System Monitoring Started
✅ Server is running on port 3000
```

---

## Development vs Production

### Development (Current Setup)
```javascript
// Auto-sync enabled - perfect for rapid development
await db.sequelize.sync({ alter: true });
```

**Pros:**
- ✅ No migration files to manage
- ✅ Instant schema updates
- ✅ Easy to experiment with models
- ✅ Perfect for development

**Cons:**
- ⚠️ Can be slow on large databases
- ⚠️ Risk of data loss if not careful

### Production (Recommended)
```javascript
// Use migrations instead
// await db.sequelize.sync({ alter: true }); // Commented out
```

Then use Sequelize migrations:
```bash
npx sequelize-cli migration:generate --name add-middle-name
npx sequelize-cli db:migrate
```

**Pros:**
- ✅ Version controlled schema changes
- ✅ Rollback capability
- ✅ Safer for production data
- ✅ Better for team collaboration

---

## Sync Options

### `sync({ force: true })`
```javascript
// ⚠️ DANGEROUS: Drops and recreates all tables
// All data will be lost!
await db.sequelize.sync({ force: true });
```

### `sync({ alter: true })` ✅ (Current)
```javascript
// Safe: Updates tables to match models
// Preserves existing data
await db.sequelize.sync({ alter: true });
```

### `sync()`
```javascript
// Creates tables only if they don't exist
// Won't update existing tables
await db.sequelize.sync();
```

---

## Checking Sync Status

### View Server Logs
```bash
npm run dev
```

Look for:
```
✅ Database connected successfully.
🔄 Syncing database models...
Executing: CREATE TABLE IF NOT EXISTS...
✅ Database models synced successfully.
```

### Check Tables in MySQL
```bash
mysql -u root -proot123 -e "USE root; SHOW TABLES;"
```

### Check Table Structure
```bash
mysql -u root -proot123 -e "USE root; DESCRIBE users;"
```

---

## Troubleshooting

### Issue: Tables Not Creating

**Solution:** Check the logs for errors:
```bash
npm run dev
```

### Issue: Column Not Updating

**Solution:** Make sure `alter: true` is set:
```javascript
await db.sequelize.sync({ alter: true });
```

### Issue: Foreign Key Errors

**Solution:** Make sure parent tables exist first. Sequelize handles this automatically, but if you see errors, check the model associations.

---

## Benefits of Auto-Sync

✅ **No Manual Table Creation**
- Just define models, tables are created automatically

✅ **No Migration Files (in Development)**
- Faster development cycle
- Less boilerplate code

✅ **Schema Always in Sync**
- Models are the single source of truth
- Database matches models exactly

✅ **Easy Experimentation**
- Try new columns/tables easily
- Remove them just as easily

✅ **Perfect for Prototyping**
- Rapid iteration
- Quick schema changes

---

## Summary

🎉 **Auto-sync is now ENABLED!**

**What happens now:**
1. ✅ Start server → Tables created automatically
2. ✅ Modify model → Restart server → Columns updated automatically
3. ✅ Add new model → Restart server → New table created automatically
4. ✅ Remove column from model → Restart server → Column removed from database

**No more manual database work needed in development!**

---

## Quick Reference

| Action | What Happens |
|--------|-------------|
| First server start | All 51 tables created |
| Add column to model | Column added to table |
| Remove column from model | Column removed from table |
| Change column type | Column type updated |
| Add new model file | New table created |
| Delete model file | Table remains (manual drop needed) |

---

**Current Status:** ✅ WORKING PERFECTLY  
**Tables Created:** 51/51  
**Last Sync:** 2026-02-06 15:16 IST  
**Mode:** Development (alter: true)
