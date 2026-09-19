-- P0 stub: reports JSON snapshot holds full ValidationReport including reserved keys.
-- Normalized monetization/pmf tables can project from reports.json in P1+.

create table if not exists ideas (
  id text primary key,
  text text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists runs (
  id text primary key,
  idea_id text not null references ideas(id) on delete cascade,
  status text not null,
  error text,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  idea_id text primary key references ideas(id) on delete cascade,
  run_id text not null references runs(id) on delete cascade,
  -- Full ValidationReport JSON (must include monetization, pmf, experiments,
  -- canvas, pestle, pitch, research — null allowed for deferred modules)
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint reports_reserved_keys check (
    payload ? 'monetization'
    and payload ? 'pmf'
    and payload ? 'experiments'
    and payload ? 'canvas'
    and payload ? 'pestle'
    and payload ? 'pitch'
    and payload ? 'research'
  )
);
