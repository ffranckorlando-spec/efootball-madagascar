import Link from 'next/link';
import { db } from '@/lib/supabase';
export const metadata = { title: 'Gérer les joueurs', robots: { index: false } };
export const dynamic = 'force-dynamic';
export default async function Liste({ searchParams }: { searchParams: { q?: string; msg?: string } }) {
  const q = (searchParams.q || '').trim().replace(/[%,()]/g, '');
  let req = db().from('players').select('id,name,pseudo,team:teams(name)').order('name').limit(100);
  if (q) req = req.or(`name.ilike.%${q}%,pseudo.ilike.%${q}%`);
  const { data } = await req;
  return (<div className="space-y-4">
    <div className="flex items-center justify-between"><h1 className="font-titre text-3xl font-bold">Gérer les joueurs</h1><Link href="/admin" className="text-sm text-doux underline">Retour</Link></div>
    {searchParams.msg && <p role="status" className="rounded-lg bg-orange/20 p-3 text-sm">{searchParams.msg}</p>}
    <form className="flex gap-2"><input name="q" defaultValue={q} placeholder="Nom ou pseudo" className="champ" aria-label="Rechercher" /><button className="bouton">Chercher</button></form>
    <ul className="divide-y divide-bord rounded-xl border border-bord bg-carte text-sm">
      {(data || []).map((p: any) => <li key={p.id}><Link href={`/admin/joueurs/${p.id}`} className="flex justify-between p-3 hover:bg-fond">
        <span><b>{p.name}</b> <span className="text-doux">{p.pseudo}</span></span><span className="text-doux">{p.team?.name || 'Sans équipe'} · Modifier</span></Link></li>)}
      {!data?.length && <li className="p-3 text-doux">Aucun joueur trouvé.</li>}</ul></div>);
}
