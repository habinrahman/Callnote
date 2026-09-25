create table if not exists public.meetings (
  id text primary key,
  payload jsonb not null
);

create table if not exists public.action_states (
  meeting_id text not null references public.meetings (id) on delete cascade,
  action_id text not null,
  done boolean not null,
  primary key (meeting_id, action_id)
);

alter table public.meetings enable row level security;
alter table public.action_states enable row level security;
