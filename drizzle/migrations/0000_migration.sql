create type public.app_role as enum ('admin','user');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path = public as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.portfolio (id int primary key default 1 check (id = 1), data jsonb not null, views int not null default 0, updated_at timestamptz not null default now());
grant select on public.portfolio to anon, authenticated;
grant update on public.portfolio to authenticated;
grant all on public.portfolio to service_role;
alter table public.portfolio enable row level security;
create policy "public read" on public.portfolio for select to anon, authenticated using (true);
create policy "admin update" on public.portfolio for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.increment_views() returns int language sql security definer set search_path = public as $$ update public.portfolio set views = views + 1 where id = 1 returning views $$;
grant execute on function public.increment_views() to anon, authenticated;

alter publication supabase_realtime add table public.portfolio;

insert into public.portfolio (id, data, views) values (1, '{
 "profile": {"name":"nafim","bio":"Hi. I''m nafim","location":"Rajshahi","avatar":"https://api.dicebear.com/9.x/notionists/svg?seed=nafim&backgroundColor=1f2937","background":"","backgroundType":"image","particles":"snow","badges":["🌙","⚡","💻"]},
 "status": {"username":"nafim","activity":"currently doing nothing","badges":["DEV"],"color":"#22c55e","state":"online"},
 "socials": [
  {"id":"1","platform":"instagram","url":"https://instagram.com"},
  {"id":"2","platform":"discord","url":"https://discord.com"},
  {"id":"3","platform":"facebook","url":"https://facebook.com"},
  {"id":"4","platform":"email","url":"mailto:hello@example.com"},
  {"id":"5","platform":"github","url":"https://github.com"},
  {"id":"6","platform":"roblox","url":"https://roblox.com"},
  {"id":"7","platform":"spotify","url":"https://spotify.com"},
  {"id":"8","platform":"twitch","url":"https://twitch.tv"},
  {"id":"9","platform":"pinterest","url":"https://pinterest.com"}
 ],
 "music": {"autoplay":false,"volume":0.5,"loop":true,"tracks":[
  {"id":"t1","title":"Bengier kurwy v3","url":"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"},
  {"id":"t2","title":"Midnight drift","url":"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"}
 ]}
}'::jsonb, 15);

create policy "admin upload media" on storage.objects for insert to authenticated with check (bucket_id='media' and public.has_role(auth.uid(),'admin'));
create policy "admin read media" on storage.objects for select to authenticated using (bucket_id='media' and public.has_role(auth.uid(),'admin'));
create policy "admin delete media" on storage.objects for delete to authenticated using (bucket_id='media' and public.has_role(auth.uid(),'admin'));

-- Guestbook
create table public.guestbook (id uuid primary key default gen_random_uuid(), name text not null, message text not null, created_at timestamptz not null default now());
grant select, insert on public.guestbook to anon, authenticated;
grant delete on public.guestbook to authenticated;
grant all on public.guestbook to service_role;
alter table public.guestbook enable row level security;
create policy "public read gb" on public.guestbook for select to anon, authenticated using (true);
create policy "public sign gb" on public.guestbook for insert to anon, authenticated with check (char_length(name) between 1 and 40 and char_length(message) between 1 and 280);
create policy "admin delete gb" on public.guestbook for delete to authenticated using (public.has_role(auth.uid(),'admin'));
alter publication supabase_realtime add table public.guestbook;