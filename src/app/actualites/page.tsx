import { db } from '@/lib/supabase';
import Bandeau from '../Bandeau';
export const metadata = { title: 'Actualités', description: 'Transferts, résultats, champions et annonces de la communauté eFootball Madagascar.' };
export const revalidate = 60;
export default async function Actualites() {
  const { data } = await db().from('news').select('*').order('created_at', { ascending: false }).limit(50);
  return (<><Bandeau titre="Actualités" sous="Annonces, résultats et transferts de la communauté." />
    <ul className="mt-4 space-y-3">{data?.map(n => <li key={n.id} className="rounded-xl border border-bord bg-carte p-4">
      <p className="text-xs text-doux">{n.category} · {new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <p className="mt-1 font-titre text-xl font-bold">{n.title}</p>{n.body && <p className="mt-1 text-sm text-doux">{n.body}</p>}</li>)}
      {!data?.length && <li className="text-sm text-doux">Aucune actualité pour le moment.</li>}</ul></>);
}
