import Link from 'next/link';
import Bandeau from '../Bandeau';
import { plateforme, libelle } from '@/lib/plateforme';
import { db } from '@/lib/supabase';
export const metadata = { title: 'Compétitions' };
export const revalidate = 60;
const zone = (r: number, total: number, relegated = 3) => r <= 3 ? 'border-l-vert' : r === 4 ? 'border-l-bleu' : r > total - relegated ? 'border-l-red-500' : 'border-l-transparent';
export default async function Competitions() {
  const sb = db(); const pf = plateforme();
  const { data: ligues } = await sb.from('leagues').select('id,name').eq('platform', pf).order('level');
  const ids = (ligues || []).map(l => l.id);
  const [{ data: rang }, { data: champs }, { data: matchs }, { data: tournois }] = await Promise.all([
    sb.from('ranking').select('*').in('league_id', ids).order('rang'),
    sb.from('champions').select('competition,team:teams(name),season:seasons(year)').ilike('competition', `%${libelle(pf)}`).order('id', { ascending: false }).limit(8),
    sb.from('matches').select('played_on,score_a,score_b,a:teams!matches_team_a_fkey(name),b:teams!matches_team_b_fkey(name)').in('league_id', ids).order('played_on', { ascending: false }).limit(10),
    sb.from('tournaments').select('id,name,description,champion:teams(name)').order('created_at', { ascending: false })]);
  return (<><Bandeau titre="Compétitions" sous="Classements des 4 ligues, champions et tournois." />
    <p className="mt-1 text-sm text-doux">Plateforme {libelle(pf)} · change-la avec le sélecteur en haut de la page.</p>
    {!rang?.length && <p className="mt-3 rounded-xl border border-bord bg-carte p-3 text-sm text-doux">Aucune équipe sur la plateforme {libelle(pf)} pour le moment.</p>}
    {!!champs?.length && <div className="mt-3 flex gap-2 overflow-x-auto">{champs.map((c: any, i) => <span key={i} className="whitespace-nowrap rounded-full bg-carte px-3 py-1 text-xs">🏆 {c.competition} {c.season?.year} : <b>{c.team?.name}</b></span>)}</div>}
    {(ligues || []).map(l => <section key={l.id} className="mt-6"><h2 className="font-titre text-2xl font-bold">{l.name}</h2>
      <div className="mt-2 overflow-x-auto rounded-xl border border-bord"><table className="w-full min-w-[420px] text-sm">
        <thead className="bg-carte text-xs text-doux"><tr><th className="p-2 text-left">#</th><th className="text-left">Équipe</th>{['J', 'V', 'N', 'D', 'Diff', 'Pts'].map(h => <th key={h} className="px-2">{h}</th>)}</tr></thead>
        <tbody>{(rang || []).filter((r: any) => r.league_id === l.id).map((r: any) => <tr key={r.team_id} className={`border-l-4 border-t border-bord text-center ${zone(r.rang, r.total)}`}>
          <td className="p-2 text-left">{r.rang}</td><td className="text-left font-medium">{r.name}</td><td>{r.j}</td><td>{r.v}</td><td>{r.n}</td><td>{r.d}</td><td>{r.diff}</td><td className="font-bold">{r.pts}</td></tr>)}</tbody></table></div></section>)}
    {!!tournois?.length && <><h2 className="mt-8 font-titre text-2xl font-bold">Tournois et coupes</h2>
      <ul className="mt-2 grid gap-3 sm:grid-cols-2">{tournois.map((t: any) => <li key={t.id}><Link href={`/tournois/${t.id}`} className="block rounded-xl border border-bord bg-carte p-4 hover:border-orange">
        <p className="font-titre text-xl font-bold">{t.name}</p><p className="text-sm text-doux">{t.description}</p>{t.champion?.name && <p className="mt-1 text-sm">🏆 {t.champion.name}</p>}</Link></li>)}</ul></>}
    <h2 className="mt-8 font-titre text-2xl font-bold">Derniers résultats</h2>
    <ul className="mt-2 divide-y divide-bord rounded-xl border border-bord bg-carte text-sm">{(matchs || []).map((m: any, i) => <li key={i} className="flex justify-between p-3"><span>{m.a?.name} <b>{m.score_a} - {m.score_b}</b> {m.b?.name}</span><span className="text-doux">{m.played_on}</span></li>)}
      {!matchs?.length && <li className="p-3 text-doux">Aucun match saisi pour le moment.</li>}</ul></>);
}
