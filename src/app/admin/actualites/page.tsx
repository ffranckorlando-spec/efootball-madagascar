import Link from 'next/link';
import { db } from '@/lib/supabase';
import { publierActualite, supprimerActualite } from '../actions';
export const metadata = { title: 'Actualités', robots: { index: false } };
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: { msg?: string } }) {
  const { data } = await db().from('news').select('id,title,category,auto,created_at').order('created_at', { ascending: false }).limit(40);
  return (<div className="space-y-4">
    <div className="flex items-center justify-between"><h1 className="font-titre text-3xl font-bold">Actualités</h1><Link href="/admin" className="text-sm text-doux underline">Retour</Link></div>
    {searchParams.msg && <p role="status" className="rounded-lg bg-orange/20 p-3 text-sm">{searchParams.msg}</p>}
    <p className="text-sm text-doux">Les transferts, résultats, champions, nouveaux joueurs et nouvelles saisons publient leur actualité tout seuls. Écris ici les autres annonces.</p>
    <form action={publierActualite} className="space-y-2 rounded-xl border border-bord bg-carte p-4">
      <input name="titre" required placeholder="Titre" className="champ" />
      <select name="categorie" className="champ">{['Actualité', 'Événement', 'Mise à jour', 'Conseils', 'Annonce'].map(c => <option key={c}>{c}</option>)}</select>
      <textarea name="texte" rows={3} placeholder="Texte (facultatif)" className="champ" /><button className="bouton">Publier</button></form>
    <ul className="divide-y divide-bord rounded-xl border border-bord bg-carte text-sm">
      {data?.map(n => <li key={n.id} className="flex items-center justify-between gap-3 p-3">
        <span><b>{n.title}</b><br /><span className="text-xs text-doux">{n.category}{n.auto ? ' · automatique' : ''} · {new Date(n.created_at).toLocaleDateString('fr-FR')}</span></span>
        <form action={supprimerActualite}><input type="hidden" name="id" value={n.id} /><button className="text-xs text-red-400 underline">Supprimer</button></form></li>)}
      {!data?.length && <li className="p-3 text-doux">Aucune actualité.</li>}</ul></div>);
}
