// Usage : node scripts/make-seed.mjs ../cem-site   -> écrit supabase/seed.sql
import fs from 'fs'; import vm from 'vm'; import path from 'path';
const root = path.resolve(process.argv[2] || '../cem-site');
const read = f => fs.readFileSync(path.join(root, 'js', f), 'utf8');
const ctx = vm.createContext({ console: { warn() {}, log() {} } });
const src = ['core/config.js','data/players.js','data/player-info.js','data/team-logos.js','data/divisions.js','data/transfers.js','data/competitions.js','data/news.js'].map(read).join('\n')
  + '\nconst roleOf=()=>"";\n' + read('models/players.js').split('const PLAYERS')[0]
  + '\nconst __OUT={TRANSFERS,EXTRA_COMPS,DEFAULT_NEWS,BASE,TEAMS,TEAM_LOGOS,PALETTE,EXTRA,UNS,pick:p=>({photo:pickOf(PHOTOS,p),serie:pickOf(SERIES,p),force:pickOf(FORCES,p),clause:pickOf(CLAUSES,p),value:pickOf(VALUES,p),city:pickOf(ADDRESSES,p),contract:pickOf(CONTRACTS,p)})};';
vm.runInContext(src, ctx);
const { TRANSFERS, EXTRA_COMPS, DEFAULT_NEWS, BASE, TEAMS, TEAM_LOGOS, PALETTE, EXTRA, UNS, pick } = vm.runInContext('__OUT', ctx);
const q = v => v == null || v === '' ? 'null' : typeof v === 'number' ? v : `'${String(v).replace(/'/g, "''")}'`;
const lit = v => `'${String(v || '').replace(/'/g, "''")}'`;
const lvl = { D1: 1, D2: 2, D3: 3, D4: 4 };
const names = new Set([...Object.values(TEAMS).flat(), ...EXTRA, ...BASE.map(p => p.team)]); names.delete(UNS);
const leagueOf = t => Object.entries(TEAMS).find(([, l]) => l.includes(t))?.[0];
let sql = '-- Généré par scripts/make-seed.mjs\nbegin;\n';
[...names].forEach((t, i) => {
  const lg = leagueOf(t); const logo = TEAM_LOGOS[t] ? '/' + TEAM_LOGOS[t].replace('images/', '') : null;
  sql += `insert into teams(name,color,logo_url,league_id) values (${q(t)},${q(PALETTE[i % PALETTE.length])},${q(logo)},${lg ? `(select id from leagues where level=${lvl[lg]} and platform='mobile')` : 'null'});\n`;
});
const expire = x => x.contract && new Date(x.contract[1] + 'T23:59:59') < new Date();
BASE.forEach(p => {
  const x = pick(p); const photo = x.photo ? (x.photo.startsWith('images/') ? '/' + x.photo.replace('images/', '') : x.photo) : p.photo;
  sql += `insert into players(name,pseudo,team_id,photo_url,series,strength,value,clause,city) values (${q(p.name)},${q(p.pseudo)},${p.team === UNS || expire(x) ? 'null' : `(select id from teams where name=${q(p.team)})`},${q(photo)},${q(x.serie)},${q(x.force)},${q(x.value)},${q(x.clause)},${q(x.city)});\n`;
  if (x.contract) sql += `insert into contracts(player_id,starts_on,ends_on) values ((select id from players where name=${q(p.name)} and coalesce(pseudo,'')=${lit(p.pseudo)} limit 1),${q(x.contract[0])},${q(x.contract[1])});\n`;
});
fs.writeFileSync('supabase/seed.sql', sql + 'commit;\n');

// ---- seed-extra.sql : transferts, champions, tournois, actualités
const pl = p => `(select id from players where name=${q(p.name)} and coalesce(pseudo,'')=${lit(p.pseudo)} limit 1)`;
const tm = t => !t || t === UNS ? 'null' : `(select id from teams where name=${q(t)})`;
const count = {}; BASE.forEach(p => { count[p.name] = (count[p.name] || 0) + 1; });
const find = j => BASE.find(p => p.id === j) || (count[j] === 1 ? BASE.find(p => p.name === j) : null);
let ex = '-- Généré par scripts/make-seed.mjs\nbegin;\n';
TRANSFERS.forEach(t => { const p = find(t.joueur); if (!p) { ex += `-- ignoré (joueur introuvable) : ${t.joueur}\n`; return; }
  ex += `insert into transfers(player_id,from_team_id,to_team_id,made_on,type,amount,strength) values (${pl(p)},${tm(t.de)},${tm(t.vers)},${q(t.date || '2026-09-01')},${q(t.type)},${q(t.montant)},${q(t.force)});\n`; });
BASE.forEach(p => { const x = pick(p); if (expire(x)) ex += `insert into transfers(player_id,from_team_id,to_team_id,made_on,type,strength) values (${pl(p)},${tm(p.team)},null,${q(x.contract[1])},'Fin de contrat',${q(x.force)});\n`; });
// Champions des ligues 2026 (équipe → ligue 1/2/3)
const champs = [['Ligue 1 Mobile', 'FEROX'], ['Ligue 2 Mobile', 'VORTEX'], ['Ligue 3 Mobile', 'e-TR / e-Team Royal']];
champs.forEach(([l, t]) => { ex += `insert into champions(season_id,competition,team_id) values ((select id from seasons order by id limit 1),${q(l)},${tm(t)});\n`; });
Object.entries(EXTRA_COMPS).forEach(([n, c]) => {
  const ch = c.champion || {}; const img = ch.image ? '/' + ch.image.replace('images/', '') : null;
  ex += `insert into tournaments(name,description,season_id,champion_team_id,champion_player,champion_image) values (${q(n)},${q(c.desc)},(select id from seasons order by id limit 1),${tm(ch.equipe)},${q(ch.joueur)},${q(img)});\n`; });
const MOIS = { Jan: 1, Fév: 2, Mar: 3, Avr: 4, Mai: 5, Juin: 6, Juil: 7, Aoû: 8, Sep: 9, Oct: 10, Nov: 11, Déc: 12 };
DEFAULT_NEWS.forEach(n => { const [d, m, y] = n.d.split(' '); const iso = `${y}-${String(MOIS[m] || 1).padStart(2, '0')}-${d.padStart(2, '0')}`;
  ex += `insert into news(title,category,created_at) values (${q(n.t)},${q(n.cat)},${q(iso)});\n`; });
fs.writeFileSync('supabase/seed-extra.sql', ex + 'commit;\n');
console.log(names.size, 'équipes,', BASE.length, 'joueurs');
