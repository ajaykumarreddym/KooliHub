# 🚀 Edge Functions Setup Guide

## Quick Start

Your KooliHub application now has **6 Supabase Edge Functions** deployed and ready to use!

## ✅ What's Been Done

1. ✅ **6 Edge Functions Deployed**:
   - `auth-webhook` - User authentication lifecycle
   - `send-notification` - Push notifications via FCM
   - `order-webhook` - Order tracking and notifications
   - `payment-webhook` - Payment gateway webhooks
   - `scheduled-cleanup` - Database maintenance
   - `analytics-aggregator` - Daily analytics

2. ✅ **Helper Library Created**:
   - `server/lib/edge-functions.ts` - Easy-to-use functions for invoking edge functions

3. ✅ **Database Migration Ready**:
   - `supabase/migrations/20250116_setup_edge_function_tables.sql`

4. ✅ **Cron Jobs Configuration**:
   - `supabase/cron-jobs.sql`

## 📋 Setup Steps (5 minutes)

### Step 1: Apply Database Migration

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **nxipkmxbvdrwdtujjlyr**
3. Go to **SQL Editor**
4. Open the file: `supabase/migrations/20250116_setup_edge_function_tables.sql`
5. Copy all contents and paste into SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Wait for "✅ Edge function tables and triggers setup completed!" message

### Step 2: Set Environment Variables

1. Go to **Project Settings** → **Edge Functions**
2. Add these variables one by one:

#### Required Variables:

**FIREBASE_SERVER_KEY**
- Get from: [Firebase Console](https://console.firebase.google.com/)
- Path: Project Settings → Cloud Messaging → Server Key
- Used by: `send-notification` function

#### Optional (but recommended) Variables:

**RAZORPAY_WEBHOOK_SECRET**
- Get from: [Razorpay Dashboard](https://dashboard.razorpay.com/)
- Path: Settings → Webhooks → Create/View Webhook Secret
- Used by: `payment-webhook` function

**STRIPE_WEBHOOK_SECRET**
- Get from: [Stripe Dashboard](https://dashboard.stripe.com/)
- Path: Developers → Webhooks → Add endpoint
- Used by: `payment-webhook` function

### Step 3: Set Up Cron Jobs (Optional)

1. Stay in Supabase SQL Editor
2. Open the file: `supabase/cron-jobs.sql`
3. Copy all contents and paste
4. Click **Run**
5. Verify with: `SELECT * FROM cron.job;`

This will schedule:
- **Daily cleanup** at 2:00 AM UTC
- **Daily analytics** at 3:00 AM UTC

### Step 4: Configure Payment Webhooks

#### For Razorpay:
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to: Settings → Webhooks
3. Add webhook URL: `https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/payment-webhook`
4. Select events:
   - `payment.captured`
   - `payment.failed`
5. Save and copy the webhook secret
6. Add it as `RAZORPAY_WEBHOOK_SECRET` in Supabase

#### For Stripe:
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to: Developers → Webhooks
3. Add endpoint: `https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/payment-webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Save and copy the signing secret
6. Add it as `STRIPE_WEBHOOK_SECRET` in Supabase

## 🧪 Test Your Functions

### Test 1: Send a Test Notification
```bash
curl -X POST https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/send-notification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "topic": "all_users",
    "title": "Test Notification",
    "body": "Edge functions are working! 🎉"
  }'
```

### Test 2: Trigger Manual Cleanup
```bash
curl -X POST https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/scheduled-cleanup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### Test 3: Run Analytics
```bash
curl -X POST https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/analytics-aggregator \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## 💻 Use in Your Code

### From Express Server:

```typescript
import { sendOrderNotification, sendWelcomeNotification } from './lib/edge-functions';

// Send order notification
await sendOrderNotification(orderId, 'confirmed', userId);

// Send welcome notification to new user
await sendWelcomeNotification(userId, userName);
```

### From Client (via API):

You can expose these in your Express routes:

```typescript
// server/routes/notifications.ts
import { sendNotificationToUser } from '../lib/edge-functions';

export const sendNotification: RequestHandler = async (req, res) => {
  const { userId, title, body } = req.body;
  const result = await sendNotificationToUser(userId, title, body);
  res.json(result);
};
```

## 📊 Monitor Your Functions

### View Logs:
1. Go to Supabase Dashboard
2. Navigate to **Edge Functions**
3. Click on any function
4. Check the **Logs** tab

### View Cron Job Status:
```sql
-- In Supabase SQL Editor
SELECT * FROM cron.job;
SELECT * FROM cron_job_health;
```

## 🔒 Security Checklist

- ✅ JWT verification enabled on all functions
- ✅ CORS headers configured
- ✅ Webhook signature verification (payment-webhook)
- ⚠️ Make sure to keep your service role key secret
- ⚠️ Never expose service role key in client code
- ⚠️ Rotate secrets regularly

## 📚 Documentation

Full documentation available in: `EDGE_FUNCTIONS_GUIDE.md`

## 🆘 Troubleshooting

### Function not responding?
- Check environment variables are set correctly
- View function logs for errors
- Verify database tables exist (run migration)

### Notifications not sending?
- Verify `FIREBASE_SERVER_KEY` is set
- Check FCM tokens in database are valid
- Ensure `fcm_tokens` table exists

### Webhooks not working?
- Verify webhook URLs in payment gateway dashboards
- Check webhook secrets are correct
- View function logs for signature verification errors

### Cron jobs not running?
- Verify `pg_cron` extension is enabled
- Check `SELECT * FROM cron.job;` shows your jobs
- View execution history: `SELECT * FROM cron.job_run_details;`

## 🎉 You're All Set!

Your edge functions are deployed and ready to use. Here's what you can do now:

1. ✨ Start sending push notifications
2. 📦 Automatic order tracking
3. 💳 Payment webhook handling
4. 🧹 Automated database cleanup
5. 📊 Daily analytics aggregation

## 📞 Need Help?

Refer to:
- `EDGE_FUNCTIONS_GUIDE.md` - Complete API documentation
- Supabase Edge Functions logs - Real-time debugging
- `server/lib/edge-functions.ts` - Usage examples

---

**Last Updated**: 2024-11-16
**Status**: ✅ Production Ready

