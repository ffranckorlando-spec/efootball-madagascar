-- eFootball Madagascar : schéma. À exécuter d'abord dans Supabase > SQL Editor, puis seed.sql.
create extension if not exists pgcrypto;
-- 2 plateformes (mobile, console) x 4 ligues. Les ids 1 à 4 sont Mobile, 5 à 8 sont Console.
create table leagues (id serial primary key, name text not null, level int not null, platform text not null default 'mobile' check (platform in ('mobile','console')), unique (platform, level));
insert into leagues(name,level,platform) values ('Ligue 1',1,'mobile'),('Ligue 2',2,'mobile'),('Ligue 3',3,'mobile'),('Ligue 4',4,'mobile'),('Ligue 1',1,'console'),('Ligue 2',2,'console'),('Ligue 3',3,'console'),('Ligue 4',4,'console');
create table settings (key text primary key, value int not null);
insert into settings values ('teams_per_league',10),('promoted',3),('relegated',3);
create table teams (id uuid primary key default gen_random_uuid(), name text unique not null, color text default '#a855f7', logo_url text, league_id int references leagues(id));
create table players (id uuid primary key default gen_random_uuid(), name text not null, pseudo text, team_id uuid references teams(id) on delete set null, photo_url text, series text, strength int, value int, clause int, city text);
create table contracts (id uuid primary key default gen_random_uuid(), player_id uuid references players(id) on delete cascade, starts_on date, ends_on date);
create table transfers (id uuid primary key default gen_random_uuid(), player_id uuid references players(id) on delete cascade, from_team_id uuid references teams(id), to_team_id uuid references teams(id), made_on date default current_date, type text default 'Transfert', amount int, strength int);
create table seasons (id serial primary key, year int not null, status text not null default 'en_cours' check (status in ('en_cours','terminee')));
insert into seasons(year) values (2026);
create table matches (id uuid primary key default gen_random_uuid(), season_id int references seasons(id), league_id int references leagues(id), team_a uuid references teams(id), team_b uuid references teams(id), score_a int, score_b int, played_on date default current_date, check (team_a <> team_b));
create table champions (id uuid primary key default gen_random_uuid(), season_id int references seasons(id), competition text not null, team_id uuid references teams(id));
create table admins (user_id uuid primary key references auth.users(id) on delete cascade);
create table admin_logs (id bigserial primary key, user_id uuid, action text, details jsonb, created_at timestamptz default now());

create function is_admin() returns boolean language sql stable as $$ select exists(select 1 from admins where user_id = auth.uid()) $$;

-- Classement par saison et ligue : points, puis différence de buts, puis buts marqués
create view standings as
with r as (
  select season_id, league_id, team_a team_id, score_a gf, score_b ga from matches where score_a is not null
  union all select season_id, league_id, team_b, score_b, score_a from matches where score_a is not null)
select season_id, league_id, team_id, count(*) j, count(*) filter (where gf>ga) v, count(*) filter (where gf=ga) n,
  count(*) filter (where gf<ga) d, sum(gf) bp, sum(ga) bc, sum(gf-ga) diff,
  sum(case when gf>ga then 3 when gf=ga then 1 else 0 end) pts from r group by 1,2,3;

-- Classement de la saison en cours, avec les équipes sans match (à zéro) et le rang
create view ranking as
select t.league_id, l.level, l.platform, t.id team_id, t.name, t.color, t.logo_url,
  coalesce(s.j,0) j, coalesce(s.v,0) v, coalesce(s.n,0) n, coalesce(s.d,0) d, coalesce(s.bp,0) bp, coalesce(s.bc,0) bc,
  coalesce(s.diff,0) diff, coalesce(s.pts,0) pts,
  row_number() over (partition by t.league_id order by coalesce(s.pts,0) desc, coalesce(s.diff,0) desc, coalesce(s.bp,0) desc, t.name) rang,
  count(*) over (partition by t.league_id) total
from teams t join leagues l on l.id=t.league_id left join standings s on s.team_id=t.id and s.league_id=t.league_id
  and s.season_id=(select id from seasons where status='en_cours' order by id desc limit 1)
where t.league_id is not null;

-- Transfert en un clic : change l'équipe du joueur et écrit l'historique
create function record_transfer(p_player uuid, p_to uuid, p_type text, p_amount int) returns void language plpgsql as $$
declare v_from uuid; v_force int;
begin
  if not is_admin() then raise exception 'Accès réservé aux administrateurs'; end if;
  select team_id, strength into v_from, v_force from players where id=p_player;
  insert into transfers(player_id,from_team_id,to_team_id,type,amount,strength) values (p_player,v_from,p_to,p_type,p_amount,v_force);
  update players set team_id=p_to where id=p_player;
end $$;

-- Fin de saison : champions, montées/descentes (réglages dans settings), nouvelle saison
create function end_season() returns void language plpgsql as $$
declare up int; down int; sid int; yr int;
begin
  if not is_admin() then raise exception 'Accès réservé aux administrateurs'; end if;
  select value into up from settings where key='promoted'; select value into down from settings where key='relegated';
  select id, year into sid, yr from seasons where status='en_cours' order by id desc limit 1;
  insert into champions(season_id,competition,team_id) select sid, l.name||case when l.platform='mobile' then ' Mobile' else ' Console' end, r.team_id from ranking r join leagues l on l.id=r.league_id where r.rang=1;
  create temp table moves on commit drop as
    select r.team_id, (select x.id from leagues x where x.platform=r.platform and x.level=r.level-1) new_level from ranking r where r.level > 1 and r.rang <= up
    union all select r.team_id, (select x.id from leagues x where x.platform=r.platform and x.level=r.level+1) from ranking r where r.level < 4 and r.rang > greatest(r.total - down, up);
  update teams t set league_id = m.new_level from moves m where t.id = m.team_id;
  update seasons set status='terminee' where id=sid;
  insert into seasons(year) values (yr+1);
  insert into admin_logs(user_id,action,details) values (auth.uid(),'fin_de_saison',jsonb_build_object('saison',yr));
end $$;

-- Journal des modifications
create function log_change() returns trigger language plpgsql security definer as $$
begin
  insert into admin_logs(user_id,action,details) values (auth.uid(), tg_op||' '||tg_table_name, to_jsonb(coalesce(new,old)));
  return coalesce(new,old);
end $$;
create trigger log_players after insert or update or delete on players for each row execute function log_change();
create trigger log_teams after insert or update or delete on teams for each row execute function log_change();
create trigger log_matches after insert or update or delete on matches for each row execute function log_change();

-- Sécurité : lecture publique, écriture réservée aux admins
do $$ declare t text; begin
  foreach t in array array['leagues','settings','teams','players','contracts','transfers','seasons','matches','champions'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "lecture publique" on %I for select using (true)', t);
    execute format('create policy "ecriture admin" on %I for all using (is_admin()) with check (is_admin())', t);
  end loop;
end $$;
alter table admins enable row level security;
alter table admin_logs enable row level security;
create policy "logs admin" on admin_logs for select using (is_admin());
create policy "admin voit admins" on admins for select using (is_admin());

-- Photos : bucket public, écriture admin
insert into storage.buckets(id,name,public) values ('photos','photos',true) on conflict do nothing;
create policy "photos lecture" on storage.objects for select using (bucket_id='photos');
create policy "photos ecriture admin" on storage.objects for insert with check (bucket_id='photos' and is_admin());
-- Après avoir créé ton compte (Authentication > Users), ajoute-le :
-- insert into admins(user_id) values ('TON-UUID');
