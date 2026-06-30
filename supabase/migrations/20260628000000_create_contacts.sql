create table if not exists public.contacts (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  email       text        not null,
  phone       text,
  subject     text,
  message     text        not null,
  source      text        default 'landing_page',
  status      text        not null default 'new',
  created_at  timestamptz not null default now()
);

comment on table public.contacts is 'Contact form submissions from the landing page.';

create index if not exists idx_contacts_created_at on public.contacts (created_at desc);
create index if not exists idx_contacts_status on public.contacts (status);

alter table public.contacts enable row level security;

drop policy if exists "anon_insert_contacts" on public.contacts;
create policy "anon_insert_contacts" on public.contacts
  for insert
  to anon
  with check (true);

drop policy if exists "owner_read_contacts" on public.contacts;
create policy "owner_read_contacts" on public.contacts
  for select
  to authenticated
  using (is_owner());

drop policy if exists "owner_update_contacts" on public.contacts;
create policy "owner_update_contacts" on public.contacts
  for update
  to authenticated
  using (is_owner())
  with check (is_owner());

grant usage on schema public to anon;
grant insert on public.contacts to anon;
grant select, update on public.contacts to authenticated;
