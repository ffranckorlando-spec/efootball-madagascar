import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/supabase';
import { modifierEquipe, supprimerEquipe } from '../../actions';
export const metadata = { title: 'Modifier une équipe', robots: { index: false } };
export const dynamic = 'force-dynamic';
export default async function Modifier({ params, searchParams }: { params: { id: string }; searchParams: { msg?: string } }) {
  const sb = db();
  const [{ data: t }, { data: ligues }, { count }] = await Promise.all([sb.from('teams').select('*').eq('id', params.id).single(),
    sb.from('leagues').select('id,name,platform').order('platform', { ascending: false }).order('level'), sb.from('players').select('id', { count: 'exact', head: true }).eq('team_id', params.id)]);
  if (!t) notFound();
  return (<div className="mx-auto max-w-lg space-y-4">
    <div className="flex items-center justify-between"><h1 className="font-titre text-3xl font-bold">{t.name}</h1><Link href="/admin/equipes" className="text-sm text-doux underline">Retour</Link></div>
    {searchParams.msg && <p role="alert" className="rounded-lg bg-red-500/20 p-3 text-sm">{searchParams.msg}</p>}
    <form action={modifierEquipe} className="space-y-3 rounded-xl border border-bord bg-carte p-4"><input type="hidden" name="id" value={t.id} />
      {t.logo_url && <img src={t.logo_url} alt="" className="h-24 w-24 rounded-full object-cover" />}
      <label className="block text-xs text-doux">Nom<input name="nom" required defaultValue={t.name} className="champ" /></label>
      <div className="flex gap-2"><label className="block flex-1 text-xs text-doux">Ligue<select name="ligue" defaultValue={t.league_id || ''} className="champ"><option value="">Hors ligue</option>{ligues?.map(l => <option key={l.id} value={l.id}>{l.name} · {l.platform === 'mobile' ? 'Mobile' : 'Console'}</option>)}</select></label>
        <label className="block text-xs text-doux">Couleur<input name="couleur" type="color" defaultValue={t.color || '#a855f7'} className="mt-1 block h-10 w-16 rounded-lg border border-bord bg-fond" /></label></div>
      <label className="block text-xs text-doux">Nouveau logo<input name="logo" type="file" accept="image/*" className="mt-1 block text-sm" /></label>
      <label className="flex gap-2 text-xs text-doux"><input type="checkbox" name="retirer_logo" /> Retirer le logo</label>
      <button className="bouton w-full">Enregistrer les modifications</button></form>
    <form action={supprimerEquipe} className="space-y-3 rounded-xl border border-red-500/40 bg-carte p-4"><input type="hidden" name="id" value={t.id} />
      <p className="text-sm text-doux">{count || 0} joueur(s) passeront « sans équipe ». Impossible si l’équipe a déjà des matchs.</p>
      <label className="flex gap-2 text-sm"><input type="checkbox" name="confirmer" /> Je confirme la suppression de {t.name}</label>
      <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold">Supprimer l’équipe</button></form></div>);
}
