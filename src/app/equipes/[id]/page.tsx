import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { db, ar } from '@/lib/supabase';
export const revalidate = 60;
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { data } = await db().from('teams').select('name,logo_url').eq('id', params.id).single();
  return data ? { title: data.name, description: `Effectif, classement et palmarès de ${data.name} — eFootball Madagascar`,
    openGraph: { title: data.name, images: data.logo_url ? [data.logo_url] : undefined } } : {};
}
export default async function Equipe({ params }: { params: { id: string } }) {
  const sb = db();
  const { data: t } = await sb.from('teams').select('id,name,color,logo_url,league:leagues(name)').eq('id', params.id).single();
  if (!t) notFound();
  const [{ data: effectif }, { data: rang }, { data: titres }, { data: matchs }] = await Promise.all([
    sb.from('players').select('id,name,pseudo,photo_url,strength,value').eq('team_id', t.id).order('strength', { ascending: false, nullsFirst: false }).order('name'),
    sb.from('ranking').select('*').eq('team_id', t.id).maybeSingle(),
    sb.from('champions').select('competition,season:seasons(year)').eq('team_id', t.id).order('id', { ascending: false }),
    sb.from('matches').select('played_on,score_a,score_b,a:teams!matches_team_a_fkey(name),b:teams!matches_team_b_fkey(name)').or(`team_a.eq.${t.id},team_b.eq.${t.id}`).order('played_on', { ascending: false }).limit(5)]);
  const valeur = (effectif || []).reduce((s, p: any) => s + (p.value || 0), 0);
  return (<>
    <header className="flex items-center gap-4 rounded-2xl border border-bord bg-carte p-5" style={{ borderTop: `4px solid ${t.color}` }}>
      {t.logo_url ? <img src={t.logo_url} alt="" className="h-20 w-20 rounded-full object-cover" /> : <div className="h-20 w-20 rounded-full bg-fond" />}
      <div><h1 className="font-titre text-3xl font-bold">{t.name}</h1>
        <p className="text-sm text-doux">{(t as any).league?.name || 'Hors ligue'}{rang ? ` · ${rang.rang}e sur ${rang.total} · ${rang.pts} pts` : ''}</p>
        <p className="text-sm text-doux">{effectif?.length || 0} joueurs · valeur de l’effectif {ar(valeur || null)}</p></div></header>

    <h2 className="mt-8 font-titre text-2xl font-bold">Palmarès</h2>
    {titres?.length ? <ul className="mt-2 flex flex-wrap gap-2">{titres.map((c: any, i) => <li key={i} className="rounded-full bg-carte px-3 py-1 text-sm">🏆 {c.competition} · saison {c.season?.year}</li>)}</ul>
      : <p className="mt-2 text-sm text-doux">Aucun titre pour le moment.</p>}

    <h2 className="mt-8 font-titre text-2xl font-bold">Effectif</h2>
    <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {(effectif || []).map((p: any) => <li key={p.id} className="overflow-hidden rounded-xl border border-bord bg-carte"><Link href={`/joueur/${p.id}`}>
        <div className="aspect-square bg-fond">{p.photo_url && <img src={p.photo_url} alt={p.name} loading="lazy" className="h-full w-full object-cover" />}</div>
        <div className="p-3"><p className="truncate font-titre text-lg font-bold">{p.name}</p><p className="truncate text-xs text-doux">{p.pseudo}</p>
          {p.strength && <p className="mt-1 text-xs" style={{ color: t.color }}>Force {p.strength}</p>}</div></Link></li>)}
    </ul>
    {!effectif?.length && <p className="mt-2 text-sm text-doux">Aucun joueur dans cette équipe.</p>}

    <h2 className="mt-8 font-titre text-2xl font-bold">Derniers matchs</h2>
    <ul className="mt-2 divide-y divide-bord rounded-xl border border-bord bg-carte text-sm">
      {(matchs || []).map((m: any, i) => <li key={i} className="flex justify-between p-3"><span>{m.a?.name} <b>{m.score_a} - {m.score_b}</b> {m.b?.name}</span><span className="text-doux">{m.played_on}</span></li>)}
      {!matchs?.length && <li className="p-3 text-doux">Aucun match saisi.</li>}</ul>
    <p className="mt-6"><Link href="/equipes" className="text-sm text-doux underline">Toutes les équipes</Link></p></>);
}
