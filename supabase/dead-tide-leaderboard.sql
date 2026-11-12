-- Blackthorn: Dead Tide's own leaderboard (v214), for the GitHub Pages build.
-- Run once in the Supabase SQL Editor, after supabase/leaderboard.sql. Safe to re-run:
-- it never deletes scores, and it never touches the mansion's table or functions.
--
-- Players can't touch the table directly. The game only calls the two functions
-- below, which validate every run the same way the Cloudflare server does
-- (server/dead-tide-leaderboard.mjs). Runs rank by kills, then threat level,
-- then the longer survival (design spec 12.2).

create table if not exists dead_tide_scores (
  id uuid primary key,
  mode text not null default 'dead-tide' check (mode = 'dead-tide'),
  name text not null check (char_length(name) between 1 and 24),
  kills int not null check (kills between 0 and 10000000),
  threat_level int not null check (threat_level between 1 and 500001),
  threat_rank text not null,
  duration int not null check (duration between 0 and 604800),
  score int not null check (score between 0 and 1000000000),
  headshots int not null default 0 check (headshots between 0 and 100000000),
  version text not null check (version ~ '^\d{1,5}$'),
  created_at timestamptz not null default now()
);

create index if not exists dead_tide_ranking_idx
  on dead_tide_scores (kills desc, threat_level desc, duration desc, created_at asc, id asc);

-- Row level security with no policies: no direct reads or writes.
alter table dead_tide_scores enable row level security;

-- Must match threatRank() in public/game/tide-threat.mjs (levels 1-5, 6-13, 14-23, 24+).
create or replace function blackthorn_threat_rank(level int)
returns text language sql immutable set search_path = public as $$
  select case when level >= 24 then 'The Apocalypse' when level >= 14 then 'The Swarm'
              when level >= 6 then 'The Hunt' else 'The Unease' end;
$$;

-- Top 50, most kills first; ties favor the higher threat level, then the longer run, then the earlier one.
create or replace function get_dead_tide_leaderboard()
returns table (rank bigint, id uuid, mode text, name text, kills int, threat_level int, threat_rank text,
               duration int, score int, headshots int, version text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select row_number() over (order by s.kills desc, s.threat_level desc, s.duration desc, s.created_at asc, s.id asc),
         s.id, s.mode, s.name, s.kills, s.threat_level, s.threat_rank, s.duration, s.score, s.headshots, s.version, s.created_at
  from dead_tide_scores s
  order by s.kills desc, s.threat_level desc, s.duration desc, s.created_at asc, s.id asc
  limit 50;
$$;

-- Saves one finished run. Retrying the same run id never counts it twice.
create or replace function submit_dead_tide_score(run jsonb)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  run_id uuid;
  clean_name text;
  nums int[];
  key text;
  value jsonb;
  saved dead_tide_scores;
  placement bigint;
begin
  if run is null or jsonb_typeof(run) <> 'object' then
    raise sqlstate 'PT400' using message = 'The score submission is invalid.';
  end if;

  if jsonb_typeof(run->'mode') is distinct from 'string' or run->>'mode' <> 'dead-tide' then
    raise sqlstate 'PT400' using message = 'Use a name of 1-24 characters and a valid completed run.';
  end if;

  if jsonb_typeof(run->'id') is distinct from 'string'
     or (run->>'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise sqlstate 'PT400' using message = 'Use a name of 1-24 characters and a valid completed run.';
  end if;
  run_id := lower(run->>'id')::uuid;

  if jsonb_typeof(run->'name') is distinct from 'string' then
    raise sqlstate 'PT400' using message = 'Use a name of 1-24 characters and a valid completed run.';
  end if;
  clean_name := regexp_replace(btrim(normalize(run->>'name', NFKC)), '\s+', ' ', 'g');
  if char_length(clean_name) not between 1 and 24
     or clean_name ~ '[<>\u0001-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯]' then
    raise sqlstate 'PT400' using message = 'Use a name of 1-24 characters and a valid completed run.';
  end if;

  foreach key in array array['kills','threatLevel','duration','score','headshots'] loop
    value := run->key;
    if jsonb_typeof(value) is distinct from 'number' or (value::text)::numeric <> trunc((value::text)::numeric) then
      raise sqlstate 'PT400' using message = 'Use a name of 1-24 characters and a valid completed run.';
    end if;
  end loop;
  if (run->>'kills')::numeric not between 0 and 10000000
     or (run->>'threatLevel')::numeric not between 1 and 500001
     or (run->>'duration')::numeric not between 0 and 604800
     or (run->>'score')::numeric not between 0 and 1000000000
     or (run->>'headshots')::numeric not between 0 and 100000000 then
    raise sqlstate 'PT400' using message = 'Use a name of 1-24 characters and a valid completed run.';
  end if;
  nums := array[(run->>'kills')::int, (run->>'threatLevel')::int, (run->>'duration')::int, (run->>'score')::int, (run->>'headshots')::int];

  -- The level is the kills' own: threat level = floor(kills / 20) + 1 (design spec 6.1).
  if nums[2] <> nums[1] / 20 + 1 then
    raise sqlstate 'PT400' using message = 'Use a name of 1-24 characters and a valid completed run.';
  end if;

  if jsonb_typeof(run->'version') is distinct from 'string' or (run->>'version') !~ '^\d{1,5}$' then
    raise sqlstate 'PT400' using message = 'Use a name of 1-24 characters and a valid completed run.';
  end if;

  insert into dead_tide_scores (id, mode, name, kills, threat_level, threat_rank, duration, score, headshots, version)
  values (run_id, 'dead-tide', clean_name, nums[1], nums[2], blackthorn_threat_rank(nums[2]), nums[3], nums[4], nums[5], run->>'version')
  on conflict (id) do nothing;

  select * into saved from dead_tide_scores where dead_tide_scores.id = run_id;
  if saved.name <> clean_name or saved.kills <> nums[1] or saved.threat_level <> nums[2] or saved.duration <> nums[3]
     or saved.score <> nums[4] or saved.headshots <> nums[5] or saved.version <> run->>'version' then
    raise sqlstate 'PT409' using message = 'This run was already submitted with different details.';
  end if;

  select r.rank into placement from (
    select s.id, row_number() over (order by s.kills desc, s.threat_level desc, s.duration desc, s.created_at asc, s.id asc) as rank
    from dead_tide_scores s) r
  where r.id = run_id;

  return jsonb_build_object('saved', true, 'entry', to_jsonb(saved) || jsonb_build_object('rank', placement));
end;
$$;

revoke all on function get_dead_tide_leaderboard() from public;
revoke all on function submit_dead_tide_score(jsonb) from public;
grant execute on function get_dead_tide_leaderboard() to anon, authenticated;
grant execute on function submit_dead_tide_score(jsonb) to anon, authenticated;
