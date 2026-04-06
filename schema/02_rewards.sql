-- PlateTrack Rewards Schema — run after 01_main.sql

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS total_xp_expired integer NOT NULL DEFAULT 0;

CREATE TABLE public.xp_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type      text NOT NULL,
  xp_amount       integer NOT NULL CHECK (xp_amount > 0),
  description     text,
  reference_id    uuid,
  expires_at      timestamptz,
  is_expired      boolean NOT NULL DEFAULT false,
  expiry_rule     text DEFAULT 'rolling_365',
  metadata        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_xp_events_user    ON public.xp_events(user_id, created_at DESC);
CREATE INDEX idx_xp_events_expiry  ON public.xp_events(expires_at, is_expired) WHERE is_expired = false;

CREATE TABLE public.achievements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text UNIQUE NOT NULL,
  name        text NOT NULL,
  description text NOT NULL,
  icon        text NOT NULL,
  xp_reward   integer NOT NULL DEFAULT 0,
  rarity      text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary')),
  category    text NOT NULL DEFAULT 'general'
);

CREATE TABLE public.user_achievements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_key text NOT NULL REFERENCES public.achievements(key),
  earned_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_key)
);
CREATE INDEX idx_user_achievements ON public.user_achievements(user_id, earned_at DESC);

CREATE TABLE public.reward_catalog (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  description  text NOT NULL,
  xp_cost      integer NOT NULL CHECK (xp_cost > 0),
  reward_type  text NOT NULL,
  reward_value jsonb,
  icon         text NOT NULL DEFAULT '🎁',
  is_active    boolean NOT NULL DEFAULT true
);

CREATE TABLE public.redemptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_id   uuid NOT NULL REFERENCES public.reward_catalog(id),
  xp_spent    integer NOT NULL,
  status      text NOT NULL DEFAULT 'fulfilled',
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.xp_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_catalog    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions       ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON public.xp_events        FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "all" ON public.achievements     FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "own" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "all" ON public.reward_catalog   FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');
CREATE POLICY "own" ON public.redemptions      FOR SELECT USING (auth.uid() = user_id);

-- Trigger: update total_xp on insert
CREATE OR REPLACE FUNCTION public.update_profile_xp() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE new_total integer; new_level text;
BEGIN
  SELECT total_xp + NEW.xp_amount INTO new_total FROM public.profiles WHERE id = NEW.user_id;
  new_level := CASE
    WHEN new_total >= 150000 THEN 'Elite'   WHEN new_total >= 75000  THEN 'Platinum'
    WHEN new_total >= 35000  THEN 'Gold'    WHEN new_total >= 15000  THEN 'Silver'
    WHEN new_total >= 5000   THEN 'Bronze'  WHEN new_total >= 1000   THEN 'Iron'
    ELSE 'Novice' END;
  UPDATE public.profiles SET total_xp=new_total, current_level=new_level, last_xp_at=now(),
    xp_this_week=xp_this_week+NEW.xp_amount, xp_this_month=xp_this_month+NEW.xp_amount
  WHERE id = NEW.user_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_xp_earned AFTER INSERT ON public.xp_events FOR EACH ROW EXECUTE FUNCTION public.update_profile_xp();

-- Trigger: deduct XP on redemption
CREATE OR REPLACE FUNCTION public.check_xp_balance() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE bal integer;
BEGIN
  SELECT total_xp INTO bal FROM public.profiles WHERE id = NEW.user_id;
  IF bal < NEW.xp_spent THEN RAISE EXCEPTION 'Insufficient XP: have %, need %', bal, NEW.xp_spent; END IF;
  UPDATE public.profiles SET total_xp = total_xp - NEW.xp_spent WHERE id = NEW.user_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_redeem BEFORE INSERT ON public.redemptions FOR EACH ROW EXECUTE FUNCTION public.check_xp_balance();

-- XP expiry trigger
CREATE OR REPLACE FUNCTION public.set_xp_expiry() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE last_wkt timestamptz; days_inactive integer := 0; expiry_days integer := 365;
BEGIN
  SELECT last_workout_at INTO last_wkt FROM public.profiles WHERE id = NEW.user_id;
  IF last_wkt IS NOT NULL THEN days_inactive := GREATEST(0, EXTRACT(DAY FROM (now() - last_wkt))::integer); END IF;
  IF    days_inactive >= 60 THEN expiry_days := 90;  NEW.expiry_rule := 'inactivity_accelerated';
  ELSIF days_inactive >= 30 THEN expiry_days := 180; NEW.expiry_rule := 'inactivity_warning'; END IF;
  NEW.expires_at := NEW.created_at + (expiry_days || ' days')::interval;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_xp_expiry BEFORE INSERT ON public.xp_events FOR EACH ROW EXECUTE FUNCTION public.set_xp_expiry();

-- run_xp_expiry() called by cron
CREATE OR REPLACE FUNCTION public.run_xp_expiry()
RETURNS TABLE(users_affected integer, xp_expired bigint, events_expired integer)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_users integer:=0; v_xp bigint:=0; v_events integer:=0;
BEGIN
  WITH exp AS (UPDATE public.xp_events SET is_expired=true WHERE expires_at<now() AND is_expired=false RETURNING user_id,xp_amount)
  SELECT COUNT(DISTINCT user_id)::integer, COALESCE(SUM(xp_amount),0), COUNT(*)::integer INTO v_users,v_xp,v_events FROM exp;
  WITH inactive AS (SELECT id FROM public.profiles WHERE last_workout_at < now()-interval'60 days' OR last_workout_at IS NULL),
  exp2 AS (UPDATE public.xp_events xe SET is_expired=true,expiry_rule='inactivity_accelerated' FROM inactive i WHERE xe.user_id=i.id AND xe.is_expired=false AND xe.created_at<now()-interval'30 days' RETURNING xe.user_id,xe.xp_amount)
  SELECT v_users+COUNT(DISTINCT user_id)::integer, v_xp+COALESCE(SUM(xp_amount),0), v_events+COUNT(*)::integer INTO v_users,v_xp,v_events FROM exp2;
  UPDATE public.profiles p SET total_xp=COALESCE(live.x,0),
    current_level=CASE WHEN COALESCE(live.x,0)>=150000 THEN 'Elite' WHEN COALESCE(live.x,0)>=75000 THEN 'Platinum' WHEN COALESCE(live.x,0)>=35000 THEN 'Gold' WHEN COALESCE(live.x,0)>=15000 THEN 'Silver' WHEN COALESCE(live.x,0)>=5000 THEN 'Bronze' WHEN COALESCE(live.x,0)>=1000 THEN 'Iron' ELSE 'Novice' END
  FROM (SELECT user_id,SUM(xp_amount) AS x FROM public.xp_events WHERE is_expired=false GROUP BY user_id) live WHERE p.id=live.user_id;
  RETURN QUERY SELECT v_users,v_xp,v_events;
END; $$;

-- Schedule cron (requires pg_cron extension — run as superuser after enabling):
-- SELECT cron.schedule('expire-xp-daily','0 3 * * *','SELECT run_xp_expiry()');

-- Seed achievements
INSERT INTO public.achievements (key,name,description,icon,xp_reward,rarity,category) VALUES
('first_workout','First Blood','Complete your first workout','⚡',50,'common','milestone'),
('workouts_10','Getting Serious','Complete 10 workouts','💪',100,'common','milestone'),
('workouts_50','Dedicated','Complete 50 workouts','🏋️',300,'rare','milestone'),
('workouts_100','Century','Complete 100 workouts','🔥',750,'epic','milestone'),
('workouts_365','Year of Iron','Complete 365 workouts','👑',5000,'legendary','milestone'),
('streak_7','Week Warrior','7-day workout streak','🗓️',100,'common','consistency'),
('streak_30','Monthly Iron','30-day streak','📅',500,'rare','consistency'),
('streak_100','Unstoppable','100-day streak','🚀',2000,'epic','consistency'),
('first_pr','New Ground','Set your first personal record','🎯',100,'common','strength'),
('prs_10','Record Breaker','Set 10 personal records','📈',300,'rare','strength'),
('bench_1x_bw','Push It','Bench press your bodyweight','💪',250,'rare','strength'),
('bench_1_5x_bw','Chest Day Legend','Bench 1.5× your bodyweight','🦅',500,'epic','strength'),
('squat_1_5x_bw','Legs Day Hero','Squat 1.5× your bodyweight','🦵',500,'epic','strength'),
('deadlift_2x_bw','From the Floor','Deadlift 2× your bodyweight','⬆️',500,'epic','strength'),
('total_5x_bw','Powerhouse','S+B+D total over 5× bodyweight','🌟',2000,'legendary','strength'),
('level_iron','Iron Forged','Reach Iron level','⚙️',200,'common','milestone'),
('level_bronze','Bronze Warrior','Reach Bronze level','🥉',500,'rare','milestone'),
('level_silver','Silver Standard','Reach Silver level','🥈',1000,'rare','milestone'),
('level_gold','Gold Standard','Reach Gold level','🥇',2000,'epic','milestone'),
('level_platinum','Platinum Athlete','Reach Platinum level','💎',5000,'legendary','milestone'),
('level_elite','Elite','Reach Elite level','👑',10000,'legendary','milestone'),
('first_friend','Training Partner','Add your first friend','🤝',50,'common','social'),
('friends_5','Squad','Have 5 friends on PlateTrack','👥',150,'common','social'),
('challenge_won','Challenger','Win a challenge','🏆',300,'rare','social'),
('nutrition_streak_7','Fuel the Machine','7 days of nutrition logging','🥗',150,'common','nutrition'),
('nutrition_streak_30','Dialed In','30 consecutive nutrition logs','🎯',500,'rare','nutrition')
ON CONFLICT (key) DO NOTHING;

-- Seed reward catalog
INSERT INTO public.reward_catalog (name,description,xp_cost,reward_type,reward_value,icon) VALUES
('7-Day Pro Trial','Unlock Pro for 7 days — no card required',5000,'pro_trial_7','{"days":7}','⚡'),
('1-Month Pro Trial','Full Pro access for 30 days',15000,'pro_trial_30','{"days":30}','🚀'),
('3-Month Pro Trial','90 days of full Pro access',30000,'pro_trial_90','{"days":90}','🔥'),
('Custom Plate Colours','Unlock custom barbell plate colours in-app',8000,'cosmetic','{"feature":"custom_plates"}','🎨'),
('Extra Challenge Slot','Create an extra challenge this month',6000,'challenge_slot',null,'🏆'),
('10% Off Pro Annual','Discount code for your next annual upgrade',20000,'discount_code','{"pct":10}','🎫'),
('30% Off Pro Annual','Best discount — for dedicated athletes only',35000,'discount_code','{"pct":30}','👑')
ON CONFLICT DO NOTHING;
