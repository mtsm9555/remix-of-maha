create extension if not exists vector;

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding vector(768),
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.memories to authenticated;
grant all on public.memories to service_role;
alter table public.memories enable row level security;
create policy "Authenticated can read memories" on public.memories for select to authenticated using (true);
create policy "Authenticated can insert memories" on public.memories for insert to authenticated with check (true);
create policy "Authenticated can update memories" on public.memories for update to authenticated using (true) with check (true);
create policy "Authenticated can delete memories" on public.memories for delete to authenticated using (true);

create table public.entities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.entities to authenticated;
grant all on public.entities to service_role;
alter table public.entities enable row level security;
create policy "Authenticated can read entities" on public.entities for select to authenticated using (true);
create policy "Authenticated can insert entities" on public.entities for insert to authenticated with check (true);
create policy "Authenticated can update entities" on public.entities for update to authenticated using (true) with check (true);
create policy "Authenticated can delete entities" on public.entities for delete to authenticated using (true);

create table public.relationships (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.entities(id) on delete cascade,
  target_id uuid references public.entities(id) on delete cascade,
  relation text,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.relationships to authenticated;
grant all on public.relationships to service_role;
alter table public.relationships enable row level security;
create policy "Authenticated can read relationships" on public.relationships for select to authenticated using (true);
create policy "Authenticated can insert relationships" on public.relationships for insert to authenticated with check (true);
create policy "Authenticated can update relationships" on public.relationships for update to authenticated using (true) with check (true);
create policy "Authenticated can delete relationships" on public.relationships for delete to authenticated using (true);