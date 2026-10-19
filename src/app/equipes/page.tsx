import Link from 'next/link';
import Bandeau from '../Bandeau';
import { db } from '@/lib/supabase';
import { plateforme } from '@/lib/plateforme';
export const metadata = { title: 'Équipes' };
export const revalidate = 60;
export default async function Equipes() {
  const pf = plateforme();
  const { data } = await db().from('teams').select('id,name,color,logo_url,league:leagues(name,platform),players(count)').order('name');
  return (<><Bandeau titre="Équipes" sous="Toutes les équipes de la plateforme choisie." />
    <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {(data || []).filter((t: any) => !t.league || t.league.platform === pf).map((t: any) => <li key={t.id} className="rounded-xl border border-bord bg-carte p-4 text-center" style={{ borderTop: `3px solid ${t.color}` }}><Link href={`/equipes/${t.id}`} className="block">
        {t.logo_url ? <img src={t.logo_url} alt="" loading="lazy" className="mx-auto h-16 w-16 rounded-full object-cover" /> : <div className="mx-auto h-16 w-16 rounded-full bg-fond" />}
        <p className="mt-2 font-titre text-lg font-bold">{t.name}</p>
        <p className="text-xs text-doux">{t.league?.name || 'Hors ligue'} · {t.players?.[0]?.count || 0} joueurs</p></Link></li>)}
    </ul></>);
}
