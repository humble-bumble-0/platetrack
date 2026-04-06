-- 04_security.sql — Run after 01_main.sql
-- Fixes constraints, adds audit log, tightens RLS

ALTER TABLE public.personal_records
  DROP CONSTRAINT IF EXISTS personal_records_record_type_check,
  ADD CONSTRAINT personal_records_record_type_check
    CHECK (record_type IN ('1rm','max_reps','max_weight','max_distance','fastest_pace','longest_hold'));

ALTER TABLE public.body_composition
  DROP CONSTRAINT IF EXISTS body_composition_user_date_unique;
ALTER TABLE public.body_composition
  ADD CONSTRAINT body_composition_user_date_unique UNIQUE (user_id, logged_date);

ALTER TABLE public.session_exercises
  DROP CONSTRAINT IF EXISTS session_exercises_session_id_fkey,
  ADD CONSTRAINT session_exercises_session_id_fkey
    FOREIGN KEY (session_id) REFERENCES public.workout_sessions(id) ON DELETE CASCADE;

ALTER TABLE public.session_sets
  DROP CONSTRAINT IF EXISTS session_sets_session_exercise_id_fkey,
  ADD CONSTRAINT session_sets_session_exercise_id_fkey
    FOREIGN KEY (session_exercise_id) REFERENCES public.session_exercises(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.audit_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action     text NOT NULL,
  metadata   jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own audit log" ON public.audit_log FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_username     ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_xp_events_user        ON public.xp_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_sets_exercise ON public.session_sets(session_exercise_id, set_number);
CREATE INDEX IF NOT EXISTS idx_prs_user_exercise     ON public.personal_records(user_id, exercise_id, record_type);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_date   ON public.nutrition_logs(user_id, log_date DESC);

ALTER TABLE public.profiles
  ALTER COLUMN total_xp SET DEFAULT 0,
  ALTER COLUMN current_level SET DEFAULT 'Novice';

-- share_tokens table removed (not used in current schema)
