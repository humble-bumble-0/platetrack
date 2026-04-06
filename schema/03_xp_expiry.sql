-- XP expiry system — run after 01_main.sql

-- Set expires_at on every new XP event
CREATE OR REPLACE FUNCTION public.set_xp_expiry() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE last_wkt timestamptz; days_inactive integer := 0; expiry_days integer := 365; rule text := 'rolling_365';
BEGIN
  SELECT last_workout_at INTO last_wkt FROM public.profiles WHERE id = NEW.user_id;
  IF last_wkt IS NOT NULL THEN days_inactive := GREATEST(0, EXTRACT(DAY FROM (now() - last_wkt))::integer); END IF;
  IF days_inactive >= 60 THEN expiry_days := 90;  rule := 'inactivity_accelerated';
  ELSIF days_inactive >= 30 THEN expiry_days := 180; rule := 'inactivity_warning'; END IF;
  NEW.expires_at  := NEW.created_at + (expiry_days || ' days')::interval;
  NEW.expiry_rule := rule;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_set_xp_expiry BEFORE INSERT ON public.xp_events FOR EACH ROW EXECUTE FUNCTION public.set_xp_expiry();

-- Daily expiry function (called by pg_cron or Edge Function)
CREATE OR REPLACE FUNCTION public.run_xp_expiry()
RETURNS TABLE(users_affected integer, xp_expired_total bigint, events_expired integer)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_users integer := 0; v_xp bigint := 0; v_events integer := 0;
BEGIN
  -- Standard rolling expiry
  WITH expired AS (UPDATE public.xp_events SET is_expired = true WHERE expires_at < now() AND is_expired = false RETURNING user_id, xp_amount)
  SELECT COUNT(DISTINCT user_id)::integer, COALESCE(SUM(xp_amount),0), COUNT(*)::integer INTO v_users, v_xp, v_events FROM expired;
  -- Inactivity acceleration (60+ days inactive, expire XP older than 30 days)
  WITH inactive AS (SELECT id FROM public.profiles WHERE last_workout_at < now() - interval '60 days' OR last_workout_at IS NULL),
  inact_exp AS (UPDATE public.xp_events xe SET is_expired = true, expiry_rule = 'inactivity_accelerated' FROM inactive i WHERE xe.user_id = i.id AND xe.is_expired = false AND xe.created_at < now() - interval '30 days' RETURNING xe.user_id, xe.xp_amount)
  SELECT v_users + COUNT(DISTINCT user_id)::integer, v_xp + COALESCE(SUM(xp_amount),0), v_events + COUNT(*)::integer INTO v_users, v_xp, v_events FROM inact_exp;
  -- Recalculate totals
  UPDATE public.profiles p SET total_xp = COALESCE(live.xp, 0), current_level = CASE WHEN COALESCE(live.xp,0) >= 150000 THEN 'Elite' WHEN COALESCE(live.xp,0) >= 75000 THEN 'Platinum' WHEN COALESCE(live.xp,0) >= 35000 THEN 'Gold' WHEN COALESCE(live.xp,0) >= 15000 THEN 'Silver' WHEN COALESCE(live.xp,0) >= 5000 THEN 'Bronze' WHEN COALESCE(live.xp,0) >= 1000 THEN 'Iron' ELSE 'Novice' END
  FROM (SELECT user_id, SUM(xp_amount) AS xp FROM public.xp_events WHERE is_expired = false GROUP BY user_id) live WHERE p.id = live.user_id;
  RETURN QUERY SELECT v_users, v_xp, v_events;
END;
$$;

-- Schedule daily at 3am UTC (enable pg_cron extension first):
-- SELECT cron.schedule('expire-xp-daily', '0 3 * * *', $$ SELECT run_xp_expiry() $$);
