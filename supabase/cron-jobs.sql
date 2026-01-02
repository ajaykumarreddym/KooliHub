-- ============================================================================
-- Supabase Cron Jobs for KooliHub Edge Functions
-- ============================================================================
-- This file contains SQL commands to set up scheduled cron jobs that trigger
-- edge functions automatically at specific intervals.
--
-- Prerequisites:
-- 1. pg_cron extension must be enabled
-- 2. Edge functions must be deployed
-- 3. Service role key must be configured
--
-- To apply these cron jobs:
-- 1. Copy the commands below
-- 2. Open Supabase SQL Editor
-- 3. Paste and run each command
-- ============================================================================

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- 1. Daily Database Cleanup (Runs at 2:00 AM UTC daily)
-- ============================================================================
-- Cleans up expired sessions, old tokens, abandoned carts, etc.
SELECT cron.schedule(
  'daily-database-cleanup',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/scheduled-cleanup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ============================================================================
-- 2. Daily Analytics Aggregation (Runs at 3:00 AM UTC daily)
-- ============================================================================
-- Aggregates previous day's analytics data
SELECT cron.schedule(
  'daily-analytics-aggregation',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/analytics-aggregator',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ============================================================================
-- 3. Hourly Analytics Snapshot (Optional - runs every hour)
-- ============================================================================
-- Useful for real-time dashboard updates
-- Uncomment if you want hourly analytics
/*
SELECT cron.schedule(
  'hourly-analytics-snapshot',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/analytics-aggregator',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('frequency', 'hourly')
  );
  $$
);
*/

-- ============================================================================
-- Cron Job Management Commands
-- ============================================================================

-- View all scheduled cron jobs
-- SELECT * FROM cron.job;

-- View cron job execution history
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- Unschedule a cron job (if needed)
-- SELECT cron.unschedule('daily-database-cleanup');
-- SELECT cron.unschedule('daily-analytics-aggregation');

-- Update a cron job schedule
-- SELECT cron.alter_job('daily-database-cleanup', schedule := '0 3 * * *');

-- ============================================================================
-- Testing Cron Jobs
-- ============================================================================

-- To test if a cron job works without waiting for the scheduled time,
-- you can run the HTTP POST request directly:

-- Test cleanup function:
/*
SELECT net.http_post(
  url := 'https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/scheduled-cleanup',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY_HERE'
  ),
  body := '{}'::jsonb
);
*/

-- Test analytics function:
/*
SELECT net.http_post(
  url := 'https://nxipkmxbvdrwdtujjlyr.supabase.co/functions/v1/analytics-aggregator',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY_HERE'
  ),
  body := '{}'::jsonb
);
*/

-- ============================================================================
-- Monitoring Cron Job Health
-- ============================================================================

-- Check recent cron job executions
CREATE OR REPLACE VIEW cron_job_health AS
SELECT 
  j.jobname,
  j.schedule,
  j.active,
  jrd.status,
  jrd.start_time,
  jrd.end_time,
  jrd.end_time - jrd.start_time as duration,
  jrd.return_message
FROM cron.job j
LEFT JOIN LATERAL (
  SELECT *
  FROM cron.job_run_details
  WHERE jobid = j.jobid
  ORDER BY start_time DESC
  LIMIT 1
) jrd ON true
ORDER BY j.jobname;

-- View cron job health
-- SELECT * FROM cron_job_health;

-- ============================================================================
-- Alerting Setup (Optional)
-- ============================================================================

-- Create a function to check for failed cron jobs and send alerts
CREATE OR REPLACE FUNCTION check_failed_cron_jobs()
RETURNS void AS $$
DECLARE
  failed_count INTEGER;
BEGIN
  -- Count failed jobs in the last hour
  SELECT COUNT(*)
  INTO failed_count
  FROM cron.job_run_details
  WHERE status = 'failed'
    AND start_time > NOW() - INTERVAL '1 hour';
  
  -- If there are failures, you could trigger a notification here
  IF failed_count > 0 THEN
    RAISE NOTICE 'WARNING: % cron jobs failed in the last hour', failed_count;
    
    -- Optional: Send notification via edge function
    -- PERFORM net.http_post(...);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Schedule the health check (runs every 15 minutes)
-- Uncomment to enable automated health checks
/*
SELECT cron.schedule(
  'cron-health-check',
  '*/15 * * * *',
  'SELECT check_failed_cron_jobs();'
);
*/

-- ============================================================================
-- Setup Complete!
-- ============================================================================

-- Log setup completion
DO $$
BEGIN
  RAISE NOTICE '✅ Cron jobs configured successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Configured Jobs:';
  RAISE NOTICE '   1. daily-database-cleanup (2:00 AM UTC)';
  RAISE NOTICE '   2. daily-analytics-aggregation (3:00 AM UTC)';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 View jobs: SELECT * FROM cron.job;';
  RAISE NOTICE '📊 View history: SELECT * FROM cron_job_health;';
END $$;

