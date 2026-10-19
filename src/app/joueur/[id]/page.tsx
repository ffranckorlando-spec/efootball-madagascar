import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { db, ar } from '@/lib/supabase';
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { data } = await db().from('players').select('name,pseudo').eq('id', params.id).single();
  return data ? { title: data.name, description: `Fiche de ${data.name} (${data.pseudo || ''}) — eFootball Madagascar` } : {};
}
export default async function Fiche({ params }: { params: { id: string } }) {
  const sb = db();
  const { data: p } = await sb.from('players').select('*,team:teams(id,name,color)').eq('id', params.id).single();
  if (!p) notFound();
  const { data: c } = await sb.from('contracts').select('starts_on,ends_on').eq('player_id', p.id).order('ends_on', { ascending: false }).limit(1);
  const lignes: [string, string][] = [['Équipe', p.team?.name || 'Sans équipe'], ['Série', p.series || '—'], ['Force', p.strength ?? '—'] as any,
    ['Valeur', ar(p.value)], ['Clause', ar(p.clause)], ['Contrat', c?.[0] ? `${c[0].starts_on} → ${c[0].ends_on}` : '—'], ['Ville', p.city || '—']];
  return (<div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-bord bg-carte" style={{ borderTop: `4px solid ${p.team?.color || '#26263a'}` }}>
    {p.photo_url && <img src={p.photo_url} alt={p.name} className="aspect-square w-full object-cover" />}
    <div className="p-5"><h1 className="font-titre text-3xl font-bold">{p.name}</h1><p className="text-doux">{p.pseudo}</p>
      <dl className="mt-4 divide-y divide-bord text-sm">{lignes.map(([k, v]) => <div key={k} className="flex justify-between py-2"><dt className="text-doux">{k}</dt><dd>{k === 'Équipe' && p.team ? <Link href={`/equipes/${p.team.id}`} className="underline">{v}</Link> : v}</dd></div>)}</dl></div></div>);
}
