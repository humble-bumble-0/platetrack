-- ============================================================
-- PLATETRACK MAIN SCHEMA — Run this first
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text,
  avatar_url text,
  gender text CHECK (gender IN ('male','female','other')),
  date_of_birth date,
  height_cm numeric,
  weight_kg numeric,
  unit_preference text NOT NULL DEFAULT 'imperial',
  fitness_goal text DEFAULT 'general',
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro')),
  plan_expires_at timestamptz,
  stripe_customer_id text,
  onboarding_complete boolean NOT NULL DEFAULT false,
  total_xp integer NOT NULL DEFAULT 0,
  current_level text NOT NULL DEFAULT 'Novice',
  xp_this_week integer NOT NULL DEFAULT 0,
  xp_this_month integer NOT NULL DEFAULT 0,
  last_workout_at timestamptz,
  last_xp_at timestamptz,
  deleted_at timestamptz,
  deletion_scheduled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT username_length CHECK (char_length(username) BETWEEN 3 AND 30)
);

-- EXERCISES
CREATE TABLE public.exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  category text,
  primary_muscles text[],
  secondary_muscles text[],
  equipment text,
  tracking_type text NOT NULL DEFAULT 'weight_reps',
  met_value numeric,
  is_default boolean NOT NULL DEFAULT false,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT exercise_name_length CHECK (char_length(name) BETWEEN 2 AND 100)
);

-- PROGRAMS
CREATE TABLE public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  days_per_week integer,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- WORKOUT SESSIONS
CREATE TABLE public.workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  name text,
  notes text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  is_complete boolean NOT NULL DEFAULT false,
  set_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT session_name_length CHECK (name IS NULL OR char_length(name) <= 100)
);

-- SESSION EXERCISES
CREATE TABLE public.session_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  notes text
);

-- SESSION SETS
CREATE TABLE public.session_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_exercise_id uuid NOT NULL REFERENCES public.session_exercises(id) ON DELETE CASCADE,
  set_number integer NOT NULL DEFAULT 1,
  weight_kg numeric,
  reps integer,
  duration_seconds integer,
  distance_km numeric,
  rpe numeric,
  heart_rate integer,
  is_pr boolean DEFAULT false,
  notes text,
  CONSTRAINT weight_positive CHECK (weight_kg IS NULL OR weight_kg >= 0),
  CONSTRAINT reps_positive CHECK (reps IS NULL OR (reps >= 0 AND reps <= 10000)),
  CONSTRAINT rpe_range CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10))
);

-- PERSONAL RECORDS
CREATE TABLE public.personal_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
  record_type text NOT NULL CHECK (record_type IN ('1rm','max_reps','max_weight','max_distance','fastest_pace','longest_hold')),
  value numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, exercise_id, record_type)
);

-- WEIGHT LOGS
CREATE TABLE public.weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  weight_lbs numeric NOT NULL,
  logged_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, logged_date),
  CONSTRAINT weight_range CHECK (weight_lbs BETWEEN 50 AND 1500)
);

-- BODY COMPOSITION
CREATE TABLE public.body_composition (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body_fat_pct numeric,
  lean_mass_pct numeric,
  water_pct numeric,
  logged_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, logged_date)
);

-- NUTRITION
CREATE TABLE public.food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  calories_per_100g numeric,
  protein_per_100g numeric,
  carbs_per_100g numeric,
  fat_per_100g numeric,
  is_verified boolean DEFAULT false
);

CREATE TABLE public.nutrition_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  calories integer,
  protein_g integer,
  carbs_g integer,
  fat_g integer,
  water_ml integer DEFAULT 3000
);

CREATE TABLE public.nutrition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  food_item_id uuid REFERENCES public.food_items(id),
  food_name text,
  meal_type text CHECK (meal_type IN ('breakfast','lunch','dinner','snack','pre_workout','post_workout')),
  quantity_g numeric,
  calories numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- WATER LOGS
CREATE TABLE public.water_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ml integer NOT NULL,
  logged_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- FRIENDSHIPS
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','blocked')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, friend_id)
);

-- CHALLENGES
CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  metric text NOT NULL DEFAULT 'workouts',
  duration_days integer NOT NULL DEFAULT 30,
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  invite_code text UNIQUE DEFAULT encode(gen_random_bytes(6),'base64'),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.challenge_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score numeric DEFAULT 0,
  rank integer,
  is_winner boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  UNIQUE (challenge_id, user_id)
);

-- SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  plan_type text,
  status text,
  current_period_end timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- PUSH SUBSCRIPTIONS
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text,
  auth text,
  created_at timestamptz DEFAULT now()
);

-- AUDIT LOG
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_sets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_composition  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_goals   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own profile"  ON public.profiles          FOR ALL USING (auth.uid()=id);
CREATE POLICY "own sessions" ON public.workout_sessions  FOR ALL USING (auth.uid()=user_id);
CREATE POLICY "own sets via session" ON public.session_exercises FOR ALL USING (EXISTS(SELECT 1 FROM public.workout_sessions s WHERE s.id=session_id AND s.user_id=auth.uid()));
CREATE POLICY "own set data" ON public.session_sets FOR ALL USING (EXISTS(SELECT 1 FROM public.session_exercises se JOIN public.workout_sessions s ON s.id=se.session_id WHERE se.id=session_exercise_id AND s.user_id=auth.uid()));
CREATE POLICY "own prs"      ON public.personal_records  FOR ALL USING (auth.uid()=user_id);
CREATE POLICY "own weight"   ON public.weight_logs       FOR ALL USING (auth.uid()=user_id);
CREATE POLICY "own body"     ON public.body_composition  FOR ALL USING (auth.uid()=user_id);
CREATE POLICY "own nutrition" ON public.nutrition_logs   FOR ALL USING (auth.uid()=user_id);
CREATE POLICY "own goals"    ON public.nutrition_goals   FOR ALL USING (auth.uid()=user_id);
CREATE POLICY "own water"    ON public.water_logs        FOR ALL USING (auth.uid()=user_id);
CREATE POLICY "own push"     ON public.push_subscriptions FOR ALL USING (auth.uid()=user_id);
CREATE POLICY "own sub"      ON public.subscriptions     FOR ALL USING (auth.uid()=user_id);
CREATE POLICY "exercises readable" ON public.exercises   FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "own custom exercises" ON public.exercises FOR INSERT WITH CHECK (auth.uid()=user_id AND is_default=false);
CREATE POLICY "friendships"  ON public.friendships       FOR ALL USING (auth.uid()=user_id OR auth.uid()=friend_id);
CREATE POLICY "challenges read" ON public.challenges     FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "challenges own" ON public.challenges      FOR INSERT WITH CHECK (auth.uid()=creator_id);
CREATE POLICY "participants"  ON public.challenge_participants FOR ALL USING (auth.uid()=user_id);

-- INDEXES
CREATE INDEX idx_sessions_user ON public.workout_sessions(user_id,completed_at DESC);
CREATE INDEX idx_prs_user ON public.personal_records(user_id,exercise_id,record_type);
CREATE INDEX idx_weight_user ON public.weight_logs(user_id,logged_date DESC);
CREATE INDEX idx_nutrition_user ON public.nutrition_logs(user_id,log_date DESC);
CREATE INDEX idx_profiles_username ON public.profiles(username);
