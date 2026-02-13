# Production-Ready Database Configuration

## Summary of Changes

This document outlines the production-ready fixes implemented to resolve Sequelize camelCase/snake_case conflicts and database sync errors.

## Problems Solved

### 1. **Sequelize Field Name Mismatch**
- **Issue**: Sequelize was auto-generating `clientId` (camelCase) but database had `client_id` (snake_case)
- **Error**: `Unknown column 'Vessel.clientId' in 'where clause'`
- **Root Cause**: Inconsistent field naming between ORM and database schema

### 2. **Database Constraint Errors**
- **Issue**: `alter: true` mode was trying to drop and recreate foreign keys
- **Error**: `Can't DROP 'vessels_ibfk_1'; check that column/key exists`
- **Root Cause**: Dangerous use of `sync({ alter: true })` in production-like environment

### 3. **Too Many Unique Keys**
- **Issue**: Database reached MySQL's 64-key limit
- **Error**: `Too many keys specified; max 64 keys allowed`
- **Root Cause**: Unnecessary unique constraints on fields

## Solutions Implemented

### 1. Global Sequelize Configuration (`/src/config/database.js`)

Added `define` options to enforce snake_case globally:

\`\`\`javascript
define: {
    underscored: true,        // All auto-generated fields use snake_case
    freezeTableName: true,    // Prevent table name pluralization
    timestamps: true
}
\`\`\`

**Benefits:**
- Consistent field naming across all models
- Prevents Sequelize from auto-converting to camelCase
- No manual field mapping needed for most cases

### 2. Explicit Foreign Key Mapping

Updated model associations to explicitly declare field names:

**Vessel Model:**
\`\`\`javascript
Vessel.belongsTo(models.Client, { 
    foreignKey: {
        name: 'client_id',
        field: 'client_id'  // Explicitly map to snake_case column
    },
    as: 'Client'
});
\`\`\`

**Client Model:**
\`\`\`javascript
Client.hasMany(models.Vessel, { 
    foreignKey: {
        name: 'client_id',
        field: 'client_id'
    },
    as: 'Vessels'
});
\`\`\`

**Benefits:**
- No ambiguity about field names
- Works even if global config fails
- Production-ready and explicit

### 3. Safe Database Sync Strategy (`/src/server.js`)

**Before (DANGEROUS):**
\`\`\`javascript
await db.sequelize.sync({ alter: true });  // ❌ Modifies existing schema
\`\`\`

**After (PRODUCTION-READY):**
\`\`\`javascript
// Production-ready: Don't alter tables, just validate connection
// Use migrations for schema changes
if (env.nodeEnv === 'development') {
    logger.info('Skipping auto-sync in favor of manual migrations...');
    // await db.sequelize.sync({ force: false }); // Only if needed
}
\`\`\`

**Benefits:**
- No accidental schema modifications
- Prevents foreign key constraint errors
- Production-safe approach
- Use migrations (Sequelize CLI) for schema changes

### 4. Removed Problematic Unique Constraints

Removed unnecessary unique constraints that were hitting MySQL's 64-key limit:

- `client.company_code` - removed unique constraint
- `vessel.imo_number` - removed unique constraint

**Note:** These should be enforced at application level or via database migrations if truly needed.

### 5. Fixed Vessel Service Include Syntax

**Before:**
\`\`\`javascript
include: ['Client']  // ❌ String aliases can cause camelCase issues
\`\`\`

**After:**
\`\`\`javascript
include: [{ model: Client, as: 'Client' }]  // ✅ Explicit model reference
\`\`\`

## Testing Checklist

- [x] Server starts without database sync errors
- [x] No foreign key constraint errors
- [x] Vessel endpoints work correctly
- [x] Client associations resolve properly
- [x] API authentication works

## Migration Strategy for Future Schema Changes

For production environments, use Sequelize CLI migrations:

\`\`\`bash
# Install Sequelize CLI
npm install --save-dev sequelize-cli

# Initialize migrations folder
npx sequelize-cli init

# Create a migration
npx sequelize-cli migration:generate --name add-vessel-imo-unique-constraint

# Run migrations
npx sequelize-cli db:migrate

# Rollback if needed
npx sequelize-cli db:migrate:undo
\`\`\`

## Production Deployment Notes

1. **Never use `sync({ alter: true })` in production** - it can corrupt data
2. **Always use migrations** for schema changes
3. **Test migrations** in staging before production
4. **Keep `underscored: true`** in all environments for consistency
5. **Use explicit foreignKey mapping** for critical associations
6. **Set up connection pooling** (already configured for production)

## Connection Pool (Production Config)

\`\`\`javascript
pool: {
    max: 10,         // Maximum connections
    min: 0,          // Minimum connections
    acquire: 30000,  // Max time to get connection (30s)
    idle: 10000      // Max idle time before release (10s)
}
\`\`\`

## Rollback Instructions

If issues occur, revert these files:
1. `/src/config/database.js` - Remove `define` options
2. `/src/server.js` - Restore `sync({ alter: true })`
3. `/src/models/vessel.model.js` - Use simple foreignKey strings
4. `/src/models/client.model.js` - Use simple foreignKey strings
5. `/src/modules/vessels/vessel.service.js` - Use string includes

## Performance Improvements

- Disabled SQL query logging in development (`logging: false`)
- Added connection pooling for production
- Removed unnecessary database sync operations

## Security Notes

- Database credentials still loaded from `.env`
- No sensitive data exposed in code
- Connection pooling prevents connection exhaustion attacks
