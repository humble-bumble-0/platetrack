# Schema Run Order

Run these SQL files in Supabase SQL Editor **in this order**:

1. `01_main.sql` — Core tables: profiles, exercises, sessions, sets, PRs, weight, nutrition, etc.
2. `02_seed.sql` — Exercise library (120+ exercises seeded)
3. `02_rewards.sql` — XP events, achievements catalog, reward catalog
4. `03_exercises.sql` — Exercise type enum and tracking type columns
5. `03_xp_expiry.sql` — XP expiry triggers and cron function
6. `04_security.sql` — Constraint fixes, audit log, indexes

## Supabase Extensions to enable first:
- `pg_cron` (Database → Extensions)
- `pgcrypto` (usually enabled by default)
- `uuid-ossp` (usually enabled by default)

## After running all SQL:
Set up the daily cron job:
```sql
SELECT cron.schedule('expire-xp-daily', '0 3 * * *', $$ SELECT run_xp_expiry() $$);
```
