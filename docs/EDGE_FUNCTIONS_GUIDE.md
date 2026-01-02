# KooliHub Supabase Edge Functions Guide

## Overview
Successfully deployed 6 Supabase Edge Functions to handle critical serverless operations for the KooliHub multi-vendor super app.

## Deployed Edge Functions

### 1. 🔐 auth-webhook
**URL**: `https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/auth-webhook`

**Purpose**: Handles authentication lifecycle events

**Features**:
- Automatically creates user profiles when new users sign up
- Handles email confirmation events
- Sends welcome notifications
- Manages user metadata synchronization

**Webhook Events**:
- `INSERT` on `auth.users` → Creates profile entry
- `UPDATE` on `auth.users` → Handles email confirmation

**Database Requirements**:
```sql
-- Profiles table must exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 2. 📲 send-notification
**URL**: `https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/send-notification`

**Purpose**: Centralized push notification service using Firebase Cloud Messaging (FCM)

**Features**:
- Send notifications to specific users
- Send to multiple device tokens
- Send to FCM topics
- Automatic token cleanup for invalid registrations
- Support for rich notifications with images and custom data

**Request Format**:
```json
{
  "userId": "uuid",          // Send to specific user
  "tokens": ["token1", ...], // Send to specific tokens
  "topic": "topic_name",     // Send to topic subscribers
  "title": "Notification Title",
  "body": "Notification message",
  "imageUrl": "https://...", // Optional
  "url": "/path",           // Optional deep link
  "data": {                 // Optional custom data
    "key": "value"
  }
}
```

**Response**:
```json
{
  "success": true,
  "results": [...],
  "totalSent": 5,
  "totalFailed": 0
}
```

**Environment Variables Required**:
- `FIREBASE_SERVER_KEY` - FCM server key

---

### 3. 📦 order-webhook
**URL**: `https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/order-webhook`

**Purpose**: Handles order lifecycle events and notifications

**Features**:
- Notifies customers when orders are placed
- Notifies vendors of new orders
- Sends order status update notifications
- Supports all order statuses (confirmed, processing, ready, out_for_delivery, delivered, cancelled)

**Webhook Events**:
- `INSERT` on `orders` → New order notifications
- `UPDATE` on `orders` → Status change notifications

**Status Messages**:
- ✅ `confirmed` → "Your order has been confirmed!"
- ⚙️ `processing` → "Your order is being prepared"
- 🎁 `ready` → "Your order is ready!"
- 🚚 `out_for_delivery` → "Your order is out for delivery"
- ✨ `delivered` → "Your order has been delivered!"
- ❌ `cancelled` → "Your order has been cancelled"

**Database Requirements**:
```sql
-- Orders table structure
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  vendor_id UUID,
  status TEXT,
  total_amount DECIMAL,
  payment_status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

### 4. 💳 payment-webhook
**URL**: `https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/payment-webhook`

**Purpose**: Handles payment gateway webhooks (Razorpay & Stripe)

**Features**:
- Verifies webhook signatures for security
- Updates order payment status
- Handles payment success and failure events
- Supports multiple payment gateways

**Supported Gateways**:
1. **Razorpay**
   - Event: `payment.captured` → Updates order as paid
   - Event: `payment.failed` → Marks payment as failed
   - Signature verification using HMAC-SHA256

2. **Stripe**
   - Event: `payment_intent.succeeded` → Updates order as paid
   - Event: `payment_intent.payment_failed` → Marks payment as failed

**Environment Variables Required**:
- `RAZORPAY_WEBHOOK_SECRET` - Razorpay webhook secret
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

**Webhook Configuration**:
- **Razorpay**: Set webhook URL in Razorpay Dashboard
- **Stripe**: Set webhook URL in Stripe Dashboard
- Include events: `payment.captured`, `payment.failed` (Razorpay)
- Include events: `payment_intent.succeeded`, `payment_intent.payment_failed` (Stripe)

---

### 5. 🧹 scheduled-cleanup
**URL**: `https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/scheduled-cleanup`

**Purpose**: Automated database maintenance and cleanup

**Features**:
- Removes expired user sessions
- Cleans up inactive FCM tokens (90+ days old)
- Removes abandoned carts (30+ days old)
- Archives old delivered/cancelled orders (6+ months)
- Removes old read notifications (90+ days)
- Cleans up failed upload metadata
- Updates product statistics

**Recommended Schedule**:
Run daily at 2:00 AM UTC using Supabase Cron Jobs:
```sql
SELECT cron.schedule(
  'daily-cleanup',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url:='https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/scheduled-cleanup',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

**Response Format**:
```json
{
  "success": true,
  "timestamp": "2024-01-15T02:00:00Z",
  "results": {
    "expiredSessions": { "deleted": 15 },
    "inactiveTokens": { "deleted": 8 },
    "abandonedCarts": { "deleted": 42 },
    "oldOrders": { "found": 127 },
    "oldNotifications": { "deleted": 256 }
  }
}
```

---

### 6. 📊 analytics-aggregator
**URL**: `https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/analytics-aggregator`

**Purpose**: Daily analytics data aggregation and reporting

**Features**:
- Aggregates daily revenue metrics
- Calculates revenue by service type
- Tracks revenue by vendor
- Identifies top-performing products
- Monitors user activity and growth
- Stores aggregated data for fast dashboard queries

**Metrics Collected**:
1. **Revenue Metrics**:
   - Total daily revenue
   - Total orders
   - Average order value
   - Revenue by service type
   - Revenue by vendor

2. **Product Performance**:
   - Top 10 products by revenue
   - Total units sold per product
   - Order count per product

3. **User Activity**:
   - New user registrations
   - Active users (daily)

**Recommended Schedule**:
Run daily at 3:00 AM UTC (after cleanup):
```sql
SELECT cron.schedule(
  'daily-analytics',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url:='https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/analytics-aggregator',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

**Database Requirements**:
```sql
CREATE TABLE IF NOT EXISTS daily_analytics (
  date DATE PRIMARY KEY,
  metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Environment Variables Setup

Add these to your Supabase project settings (Project Settings → Edge Functions → Environment Variables):

```bash
# Supabase (automatically available)
SUPABASE_URL=https://nxipkmxbvdrwdtujjlyr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Firebase Cloud Messaging
FIREBASE_SERVER_KEY=your_fcm_server_key

# Payment Gateways
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### How to Add Environment Variables:
1. Go to Supabase Dashboard
2. Select your project
3. Go to **Project Settings** → **Edge Functions**
4. Add each environment variable
5. Restart edge functions if needed

---

## Testing Edge Functions

### 1. Test auth-webhook
```bash
curl -X POST https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/auth-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -d '{
    "type": "INSERT",
    "table": "users",
    "record": {
      "id": "test-user-id",
      "email": "test@example.com"
    }
  }'
```

### 2. Test send-notification
```bash
curl -X POST https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/send-notification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "userId": "user-uuid",
    "title": "Test Notification",
    "body": "This is a test notification"
  }'
```

### 3. Test scheduled-cleanup
```bash
curl -X POST https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/scheduled-cleanup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### 4. Test analytics-aggregator
```bash
curl -X POST https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/analytics-aggregator \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

---

## Setting Up Database Webhooks

### Enable webhooks for order-webhook:
```sql
-- Create a webhook to call order-webhook on order changes
CREATE OR REPLACE FUNCTION notify_order_webhook()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
BEGIN
  payload := jsonb_build_object(
    'type', TG_OP,
    'record', row_to_json(NEW),
    'old_record', row_to_json(OLD)
  );
  
  PERFORM net.http_post(
    url := 'https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/order-webhook',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body := payload
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER order_webhook_on_insert
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION notify_order_webhook();

CREATE TRIGGER order_webhook_on_update
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION notify_order_webhook();
```

---

## Integration with Express Server

You can now call these edge functions from your Express server:

```typescript
// server/lib/edge-functions.ts
import { supabase } from './supabase';

export async function sendNotification(params: {
  userId?: string;
  tokens?: string[];
  topic?: string;
  title: string;
  body: string;
  imageUrl?: string;
  data?: any;
}) {
  const { data, error } = await supabase.functions.invoke('send-notification', {
    body: params,
  });
  
  return { data, error };
}

export async function triggerAnalytics() {
  const { data, error } = await supabase.functions.invoke('analytics-aggregator', {
    body: {},
  });
  
  return { data, error };
}
```

---

## Monitoring and Logs

### View Edge Function Logs:
1. Go to Supabase Dashboard
2. Navigate to **Edge Functions**
3. Click on any function
4. View **Logs** tab for real-time logs

### Monitor Performance:
- Check **Invocations** tab for usage statistics
- Monitor response times
- Track error rates

---

## Security Best Practices

1. **Always verify webhook signatures** for payment webhooks
2. **Use service role key** only in edge functions, never in client
3. **Validate input data** in all edge functions
4. **Rate limit** public-facing endpoints
5. **Enable JWT verification** for protected functions (already enabled)
6. **Rotate secrets regularly** in environment variables
7. **Monitor logs** for suspicious activity

---

## Cost Optimization

- Edge functions are **free** for the first 500K requests/month
- Optimize database queries to reduce execution time
- Use connection pooling in edge functions
- Cache frequently accessed data
- Schedule heavy operations during off-peak hours

---

## Troubleshooting

### Function not responding:
1. Check environment variables are set
2. Verify database connection
3. Check function logs for errors
4. Ensure correct permissions

### Webhooks not triggering:
1. Verify webhook URLs in external services
2. Check webhook signatures
3. Ensure triggers are enabled
4. Check database permissions

### Notifications not sending:
1. Verify FIREBASE_SERVER_KEY is set
2. Check FCM tokens are valid
3. Ensure fcm_tokens table exists
4. Check Firebase project configuration

---

## Next Steps

1. ✅ Edge functions deployed
2. ⬜ Add environment variables in Supabase Dashboard
3. ⬜ Set up database webhooks for orders
4. ⬜ Configure payment gateway webhooks
5. ⬜ Set up cron jobs for scheduled tasks
6. ⬜ Test all functions with real data
7. ⬜ Monitor logs and performance
8. ⬜ Update client code to use edge functions

---

## Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Razorpay Webhooks](https://razorpay.com/docs/webhooks/)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

---

**Last Updated**: 2024-11-16
**Project**: KooliHub Multi-Vendor Super App
**Supabase Project**: nxipkmxbvdrwdtujjlyr

