import { db, ar } from '@/lib/supabase';
import Bandeau from '../Bandeau';
export const metadata = { title: 'Transferts' };
export const revalidate = 60;
export default async function Transferts() {
  const { data } = await db().from('transfers').select('id,made_on,type,amount,strength,player:players(name),de:teams!transfers_from_team_id_fkey(name),vers:teams!transfers_to_team_id_fkey(name)').order('made_on', { ascending: false }).limit(60);
  return (<><Bandeau titre="Transferts récents" sous="Les mouvements de joueurs entre les équipes." />
    <ul className="mt-4 divide-y divide-bord rounded-xl border border-bord bg-carte text-sm">
      {(data || []).map((t: any) => <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
        <span><b>{t.player?.name}</b> · {t.de?.name || 'Sans équipe'} → {t.vers?.name || 'Sans équipe'}</span>
        <span className="text-doux">{t.type}{t.strength ? ` · force ${t.strength}` : ''} · {ar(t.amount)} · {t.made_on}</span></li>)}
      {!data?.length && <li className="p-3 text-doux">Aucun transfert enregistré.</li>}</ul></>);
}
