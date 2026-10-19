import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/supabase';
export const revalidate = 60;
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { data } = await db().from('tournaments').select('name,description').eq('id', params.id).single();
  return data ? { title: data.name, description: data.description || `Classement et calendrier du tournoi ${data.name}` } : {};
}
export default async function Tournoi({ params }: { params: { id: string } }) {
  const sb = db();
  const { data: t } = await sb.from('tournaments').select('*').eq('id', params.id).single();
  if (!t) notFound();
  const [{ data: teams }, { data: st }, { data: matchs }] = await Promise.all([sb.from('teams').select('id,name'),
    sb.from('tournament_standings').select('*').eq('tournament_id', t.id), sb.from('tournament_matches').select('*').eq('tournament_id', t.id).order('played_on').order('played_at')]);
  const nom = (id: string) => teams?.find(x => x.id === id)?.name || '—';
  const classement = [...(st || [])].sort((a: any, b: any) => b.pts - a.pts || b.diff - a.diff || b.bp - a.bp);
  return (<>
    <h1 className="font-titre text-3xl font-bold">{t.name}</h1>{t.description && <p className="mt-1 text-sm text-doux">{t.description}</p>}
    {t.champion_team_id && <div className="mt-4 flex items-center gap-4 rounded-xl border border-bord bg-carte p-4" style={{ borderLeft: '4px solid #facc15' }}>
      {t.champion_image && <img src={t.champion_image} alt="" className="h-20 w-20 rounded-lg object-cover" />}
      <div><p className="text-xs text-doux">Champion</p><p className="font-titre text-2xl font-bold">🏆 {nom(t.champion_team_id)}</p>{t.champion_player && <p className="text-sm text-doux">{t.champion_player}</p>}</div></div>}
    <h2 className="mt-8 font-titre text-2xl font-bold">Classement</h2>
    {classement.length ? <div className="mt-2 overflow-x-auto rounded-xl border border-bord"><table className="w-full min-w-[420px] text-sm">
      <thead className="bg-carte text-xs text-doux"><tr><th className="p-2 text-left">#</th><th className="text-left">Équipe</th>{['J', 'V', 'N', 'D', 'Diff', 'Pts'].map(h => <th key={h} className="px-2">{h}</th>)}</tr></thead>
      <tbody>{classement.map((r: any, i) => <tr key={r.team_id} className="border-t border-bord text-center"><td className="p-2 text-left">{i + 1}</td><td className="text-left font-medium">{nom(r.team_id)}</td><td>{r.j}</td><td>{r.v}</td><td>{r.n}</td><td>{r.d}</td><td>{r.diff}</td><td className="font-bold">{r.pts}</td></tr>)}</tbody></table></div>
      : <p className="mt-2 text-sm text-doux">Le classement apparaîtra avec les premiers résultats.</p>}
    <h2 className="mt-8 font-titre text-2xl font-bold">Calendrier</h2>
    <ul className="mt-2 divide-y divide-bord rounded-xl border border-bord bg-carte text-sm">
      {(matchs || []).map((m: any) => <li key={m.id} className="flex justify-between gap-2 p-3"><span>{nom(m.team_a)} <b>{m.score_a == null ? 'vs' : `${m.score_a} - ${m.score_b}`}</b> {nom(m.team_b)}</span>
        <span className="text-doux">{m.played_on}{m.played_at ? ' · ' + String(m.played_at).slice(0, 5) : ''}</span></li>)}
      {!matchs?.length && <li className="p-3 text-doux">Aucun match programmé.</li>}</ul>
    <p className="mt-6"><Link href="/competitions" className="text-sm text-doux underline">Toutes les compétitions</Link></p></>);
}
