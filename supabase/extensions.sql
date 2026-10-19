-- À exécuter après schema.sql et AVANT seed.sql : tournois, actualités et publication automatique.
create table tournaments (id uuid primary key default gen_random_uuid(), name text not null, description text, season_id int references seasons(id),
  champion_team_id uuid references teams(id) on delete set null, champion_player text, champion_image text, created_at timestamptz default now());
create table tournament_matches (id uuid primary key default gen_random_uuid(), tournament_id uuid references tournaments(id) on delete cascade,
  team_a uuid references teams(id), team_b uuid references teams(id), score_a int, score_b int, played_on date default current_date, played_at time, check (team_a <> team_b));
create table news (id uuid primary key default gen_random_uuid(), title text not null, body text, category text default 'Actualité', auto boolean default false, created_at timestamptz default now());

create view tournament_standings as
with r as (
  select tournament_id, team_a team_id, score_a gf, score_b ga from tournament_matches where score_a is not null
  union all select tournament_id, team_b, score_b, score_a from tournament_matches where score_a is not null)
select tournament_id, team_id, count(*) j, count(*) filter (where gf>ga) v, count(*) filter (where gf=ga) n, count(*) filter (where gf<ga) d,
  sum(gf) bp, sum(ga) bc, sum(gf-ga) diff, sum(case when gf>ga then 3 when gf=ga then 1 else 0 end) pts from r group by 1,2;

do $$ declare t text; begin
  foreach t in array array['tournaments','tournament_matches','news'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "lecture publique" on %I for select using (true)', t);
    execute format('create policy "ecriture admin" on %I for all using (is_admin()) with check (is_admin())', t);
  end loop;
end $$;

-- Actualités automatiques : créées quand un admin publie un transfert, un résultat, un champion, un joueur ou une saison.
-- (Pas d'actualité pour les imports faits depuis le SQL Editor.)
create function publier_actu(p_titre text, p_cat text, p_corps text default null) returns void language plpgsql security definer as $$
begin if auth.uid() is not null then insert into news(title,body,category,auto) values (p_titre,p_corps,p_cat,true); end if; end $$;

create function actu_transfert() returns trigger language plpgsql security definer as $$
declare j text; a text; b text;
begin
  if new.type not in ('Transfert','Prêt','Libre') then return new; end if;
  select name into j from players where id=new.player_id; select name into a from teams where id=new.from_team_id; select name into b from teams where id=new.to_team_id;
  perform publier_actu(new.type||' : '||j||' — '||coalesce(a,'sans équipe')||' → '||coalesce(b,'sans équipe'), 'Transfert', case when new.amount is not null then 'Montant : '||new.amount||' Ar' end);
  return new;
end $$;
create trigger actu_transfert after insert on transfers for each row execute function actu_transfert();

create function actu_match() returns trigger language plpgsql security definer as $$
declare a text; b text; l text;
begin
  if new.score_a is null then return new; end if;
  select name into a from teams where id=new.team_a; select name into b from teams where id=new.team_b; select name||' · '||case when platform='mobile' then 'Mobile' else 'Console' end into l from leagues where id=new.league_id;
  perform publier_actu('Résultat : '||a||' '||new.score_a||' - '||new.score_b||' '||b, 'Résultat', l);
  return new;
end $$;
create trigger actu_match after insert on matches for each row execute function actu_match();

create function actu_champion() returns trigger language plpgsql security definer as $$
declare t text;
begin select name into t from teams where id=new.team_id; perform publier_actu('Champion '||new.competition||' : '||t, 'Champion'); return new; end $$;
create trigger actu_champion after insert on champions for each row execute function actu_champion();

create function actu_tournoi() returns trigger language plpgsql security definer as $$
declare t text;
begin
  if new.champion_team_id is not null and (tg_op='INSERT' or new.champion_team_id is distinct from old.champion_team_id) then
    select name into t from teams where id=new.champion_team_id; perform publier_actu('Champion du tournoi '||new.name||' : '||t, 'Champion');
  end if; return new;
end $$;
create trigger actu_tournoi after insert or update on tournaments for each row execute function actu_tournoi();

create function actu_joueur() returns trigger language plpgsql security definer as $$
declare t text;
begin select name into t from teams where id=new.team_id; perform publier_actu('Nouveau joueur : '||new.name||coalesce(' ('||t||')',''), 'Joueur'); return new; end $$;
create trigger actu_joueur after insert on players for each row execute function actu_joueur();

create function actu_saison() returns trigger language plpgsql security definer as $$
begin perform publier_actu('Nouvelle saison '||new.year, 'Saison', 'Les classements sont remis à zéro. Les montées et descentes sont appliquées.'); return new; end $$;
create trigger actu_saison after insert on seasons for each row execute function actu_saison();
