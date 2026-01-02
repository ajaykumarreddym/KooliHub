# 🚀 Quick Start Guide - Naming Convention System

## ⚠️ IMPORTANT: Run Migration First!

The white screen issue is because the database migration hasn't been run yet.

## Step-by-Step Setup

### 1️⃣ Run Database Migration

**Option A: Via Supabase Dashboard**
1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/20250115_add_naming_convention_system.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Wait for success message

**Option B: Via Terminal** (if using Supabase CLI)
```bash
cd /Users/ajayreddy/koolihub
supabase db push
```

### 2️⃣ Verify Migration Success

Run this query in Supabase SQL Editor to verify:
```sql
-- Check if the new function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'get_product_form_attributes_v2';

-- Should return one row with the function name
```

### 3️⃣ Restart Your Dev Server

```bash
cd /Users/ajayreddy/koolihub
pnpm dev
```

### 4️⃣ Clear Browser Cache

1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to **Console** tab
3. Clear cache and hard reload (Cmd+Shift+R or Ctrl+Shift+R)

### 5️⃣ Check for Errors

In browser console, look for any errors. Common issues:

**"get_product_form_attributes_v2 does not exist"**
→ Migration not run. Go back to Step 1.

**"Failed to load preview"**
→ Check if service types exist in database

**Network errors**
→ Make sure dev server is running on port 8080

## 📍 Access the Feature

Once migration is complete and server is running:

1. Navigate to: `http://localhost:8080/admin/service-management/naming-convention`
2. Or go to: Admin → Service Management → Naming Convention tab

## 🔍 Troubleshooting

### White Screen Checklist

- [ ] Database migration run successfully
- [ ] Dev server is running (`pnpm dev`)
- [ ] No console errors in browser
- [ ] Supabase connection working
- [ ] Service types exist in database

### Check Database Connection

Run in Supabase SQL Editor:
```sql
-- Check if service_types table has data
SELECT id, title FROM service_types LIMIT 5;

-- Check if new columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'service_attribute_config' 
AND column_name IN ('is_editable', 'is_deletable');
```

### Common Fixes

**1. Migration Failed**
```sql
-- Rollback and try again
DROP FUNCTION IF EXISTS get_product_form_attributes_v2;
DROP VIEW IF EXISTS attribute_hierarchy_view;
-- Then re-run the full migration
```

**2. Import Errors**
```bash
# Rebuild the project
cd /Users/ajayreddy/koolihub
pnpm install
pnpm build
```

**3. Port Conflict**
```bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9
# Restart server
pnpm dev
```

## ✅ Success Indicators

You'll know it's working when:

1. No errors in browser console
2. Can see the Naming Convention Manager interface
3. Can select service types from dropdown
4. Preview tabs load without errors

## 📞 Still Having Issues?

Check the browser console (F12) and look for specific error messages. The error will tell you exactly what's wrong:

- **Database errors**: Migration issue
- **Import errors**: Build issue  
- **Network errors**: Server issue
- **Component errors**: Code issue

Share the exact error message for specific help!

