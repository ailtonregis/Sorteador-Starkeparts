create table if not exists public.app_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  constraint app_state_singleton check (id = 'main'),
  constraint app_state_version check ((data ->> 'version')::integer = 3)
);

alter table public.app_state enable row level security;

revoke all on table public.app_state from anon, authenticated;
grant select, insert, update on table public.app_state to service_role;

insert into public.app_state (id, data)
values (
  'main',
  '{"version":3,"campaigns":[],"customers":[],"sales":[],"draws":[],"audit":[],"settings":{"activeCampaignId":null}}'::jsonb
)
on conflict (id) do nothing;

comment on table public.app_state is
  'Estado persistente do Sorteador Stärke; acesso somente pelo backend autorizado.';
