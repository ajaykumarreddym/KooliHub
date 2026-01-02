# 🚀 Edge Functions Quick Reference

## 📦 Deployed Functions (All Active ✅)

| # | Function | URL Slug | Purpose |
|---|----------|----------|---------|
| 1 | Auth Webhook | `auth-webhook` | User lifecycle events |
| 2 | Send Notification | `send-notification` | Push notifications |
| 3 | Order Webhook | `order-webhook` | Order tracking |
| 4 | Payment Webhook | `payment-webhook` | Payment processing |
| 5 | Scheduled Cleanup | `scheduled-cleanup` | Database maintenance |
| 6 | Analytics Aggregator | `analytics-aggregator` | Daily analytics |

**Base URL**: `https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/`

## 🔑 Environment Variables Needed

```bash
# Required for send-notification
FIREBASE_SERVER_KEY=your_key_here

# Required for payment-webhook
RAZORPAY_WEBHOOK_SECRET=your_secret_here
STRIPE_WEBHOOK_SECRET=your_secret_here
```

**Add in**: Supabase Dashboard → Project Settings → Edge Functions

## 📝 Quick Setup (3 Steps)

```bash
# 1. Apply database migration
# Copy: supabase/migrations/20250116_setup_edge_function_tables.sql
# Paste in: Supabase SQL Editor → Run

# 2. Add environment variables
# Go to: Supabase Dashboard → Edge Functions
# Add: FIREBASE_SERVER_KEY

# 3. Set up cron jobs (optional)
# Copy: supabase/cron-jobs.sql
# Paste in: Supabase SQL Editor → Run
```

## 💻 Usage Examples

### In Express Server

```typescript
import { 
  sendOrderNotification,
  sendWelcomeNotification,
  triggerAnalyticsAggregation 
} from './lib/edge-functions';

// Send order notification
await sendOrderNotification(orderId, 'confirmed', userId);

// Welcome new user
await sendWelcomeNotification(userId, userName);

// Trigger analytics
await triggerAnalyticsAggregation();
```

### Direct API Call

```bash
# Send notification
curl -X POST https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/send-notification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"userId":"uuid","title":"Test","body":"Hello!"}'

# Trigger cleanup
curl -X POST https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/scheduled-cleanup \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## 🧪 Testing Checklist

- [ ] Apply database migration
- [ ] Add `FIREBASE_SERVER_KEY`
- [ ] Test send-notification function
- [ ] Configure payment webhooks
- [ ] Set up cron jobs
- [ ] Monitor function logs

## 📊 Monitoring

```sql
-- View cron job status
SELECT * FROM cron.job;

-- View recent executions
SELECT * FROM cron_job_health;

-- Check daily analytics
SELECT * FROM daily_analytics ORDER BY date DESC LIMIT 7;
```

**Logs**: Supabase Dashboard → Edge Functions → Select Function → Logs

## 🔗 Important Links

- **Setup Guide**: `EDGE_FUNCTIONS_SETUP.md`
- **Full Documentation**: `EDGE_FUNCTIONS_GUIDE.md`
- **Architecture**: `EDGE_FUNCTIONS_ARCHITECTURE.md`
- **Helper Library**: `server/lib/edge-functions.ts`

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Notifications not sending | Check `FIREBASE_SERVER_KEY` is set |
| Webhook failing | Verify signature secrets |
| Cron not running | Check `pg_cron` extension enabled |
| Function error | View logs in Supabase Dashboard |

## 📞 Get Help

1. Check function logs in Supabase
2. Review `EDGE_FUNCTIONS_GUIDE.md`
3. Verify environment variables
4. Check database migration applied

---

**Quick Links**:
- 📖 [Setup Guide](EDGE_FUNCTIONS_SETUP.md)
- 📚 [Full Docs](EDGE_FUNCTIONS_GUIDE.md)
- 🏗️ [Architecture](EDGE_FUNCTIONS_ARCHITECTURE.md)
- 💻 [Helper Code](server/lib/edge-functions.ts)

**Status**: ✅ 6/6 Functions Active | 🔧 Setup Required

