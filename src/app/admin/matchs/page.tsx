import Link from 'next/link';
import { db } from '@/lib/supabase';
export const metadata = { title: 'Corriger les résultats', robots: { index: false } };
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: { msg?: string } }) {
  const { data } = await db().from('matches').select('id,played_on,score_a,score_b,league:leagues(name),a:teams!matches_team_a_fkey(name),b:teams!matches_team_b_fkey(name)').order('played_on', { ascending: false }).order('id').limit(60);
  return (<div className="space-y-4">
    <div className="flex items-center justify-between"><h1 className="font-titre text-3xl font-bold">Corriger les résultats</h1><Link href="/admin" className="text-sm text-doux underline">Retour</Link></div>
    {searchParams.msg && <p role="status" className="rounded-lg bg-orange/20 p-3 text-sm">{searchParams.msg}</p>}
    <p className="text-sm text-doux">Les 60 derniers matchs de ligue. Les matchs de tournoi se corrigent dans « Tournois ».</p>
    <ul className="divide-y divide-bord rounded-xl border border-bord bg-carte text-sm">
      {(data || []).map((m: any) => <li key={m.id}><Link href={`/admin/matchs/${m.id}?t=ligue`} className="flex justify-between gap-2 p-3 hover:bg-fond">
        <span>{m.a?.name} <b>{m.score_a} - {m.score_b}</b> {m.b?.name}</span><span className="text-doux">{m.league?.name} · {m.played_on}</span></Link></li>)}
      {!data?.length && <li className="p-3 text-doux">Aucun match saisi.</li>}</ul></div>);
}
