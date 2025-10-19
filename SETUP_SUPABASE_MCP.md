# Setup Supabase MCP for Future Database Operations

## Why MCP Authentication Failed

The Supabase MCP server requires a **service role key** for database operations, but it's not configured yet.

## Quick Fix (For Now)

**Just run the SQL manually in Supabase Dashboard:**
1. Open `RUN_THIS_NOW_PREVIEW_FIX.sql`
2. Copy all contents
3. Paste into Supabase SQL Editor
4. Click Run
5. ✅ Preview will work!

## Setup MCP for Future (Optional)

If you want me to apply database changes automatically in the future:

### Step 1: Get Your Service Role Key

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **nxipkmxbvdrwdtujjlyr**
3. Click **Settings** → **API**
4. Copy the **service_role** key (NOT the anon key)

### Step 2: Configure Environment

Create/edit `.env` file in project root:

```bash
# Add these to .env
SUPABASE_URL=https://nxipkmxbvdrwdtujjlyr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

⚠️ **Important**: Add `.env` to `.gitignore` (should already be there)

### Step 3: Configure Cursor MCP

If using Cursor AI, you might need to configure the MCP server settings.
Check Cursor settings for MCP configuration.

## Your Current Supabase Details

- **URL**: `https://nxipkmxbvdrwdtujjlyr.supabase.co`
- **Anon Key**: Already configured (in code)
- **Service Role Key**: Needed for MCP (get from dashboard)

## For This Issue

**You don't need MCP setup to fix the preview!**

Just run the SQL file manually and you're done. MCP setup is only needed if you want automated database operations in the future.

## Verification

After running the SQL, verify it worked:

```sql
-- Run this in Supabase SQL Editor
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'get_product_form_attributes_v2';
```

You should see:
```
routine_name: get_product_form_attributes_v2
routine_type: FUNCTION
```

Then test preview in your admin panel! 🎉






