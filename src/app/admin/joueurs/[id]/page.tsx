import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/supabase';
import { modifierJoueur, supprimerJoueur } from '../../actions';
export const metadata = { title: 'Modifier un joueur', robots: { index: false } };
export const dynamic = 'force-dynamic';
const Champ = ({ l, children }: { l: string; children: React.ReactNode }) => <label className="block text-xs text-doux">{l}{children}</label>;
export default async function Modifier({ params, searchParams }: { params: { id: string }; searchParams: { msg?: string } }) {
  const sb = db();
  const [{ data: p }, { data: teams }, { data: c }] = await Promise.all([
    sb.from('players').select('*').eq('id', params.id).single(), sb.from('teams').select('id,name').order('name'),
    sb.from('contracts').select('starts_on,ends_on').eq('player_id', params.id).order('ends_on', { ascending: false }).limit(1)]);
  if (!p) notFound();
  return (<div className="mx-auto max-w-lg space-y-4">
    <div className="flex items-center justify-between"><h1 className="font-titre text-3xl font-bold">{p.name}</h1><Link href="/admin/joueurs" className="text-sm text-doux underline">Retour</Link></div>
    {searchParams.msg && <p role="alert" className="rounded-lg bg-red-500/20 p-3 text-sm">{searchParams.msg}</p>}
    <form action={modifierJoueur} className="space-y-3 rounded-xl border border-bord bg-carte p-4">
      <input type="hidden" name="id" value={p.id} />
      {p.photo_url && <img src={p.photo_url} alt="" className="h-28 w-28 rounded-lg object-cover" />}
      <Champ l="Nom"><input name="nom" required defaultValue={p.name} className="champ" /></Champ>
      <Champ l="Pseudo"><input name="pseudo" defaultValue={p.pseudo || ''} className="champ" /></Champ>
      <Champ l="Équipe"><select name="equipe" defaultValue={p.team_id || ''} className="champ"><option value="">Sans équipe</option>{teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Champ>
      <div className="grid grid-cols-2 gap-2">
        <Champ l="Série"><input name="serie" defaultValue={p.series || ''} className="champ" /></Champ>
        <Champ l="Force"><input name="force" type="number" defaultValue={p.strength ?? ''} className="champ" /></Champ>
        <Champ l="Valeur (Ar)"><input name="valeur" type="number" min="0" defaultValue={p.value ?? ''} className="champ" /></Champ>
        <Champ l="Clause (Ar)"><input name="clause" type="number" min="0" defaultValue={p.clause ?? ''} className="champ" /></Champ>
        <Champ l="Début du contrat"><input name="debut" type="date" defaultValue={c?.[0]?.starts_on || ''} className="champ" /></Champ>
        <Champ l="Fin du contrat"><input name="fin" type="date" defaultValue={c?.[0]?.ends_on || ''} className="champ" /></Champ></div>
      <Champ l="Ville"><input name="ville" defaultValue={p.city || ''} className="champ" /></Champ>
      <Champ l="Nouvelle photo"><input name="photo" type="file" accept="image/*" className="mt-1 block text-sm" /></Champ>
      <label className="flex gap-2 text-xs text-doux"><input type="checkbox" name="retirer_photo" /> Retirer la photo (demande de retrait du joueur)</label>
      <label className="flex gap-2 text-xs text-doux"><input type="checkbox" name="forcer" /> Enregistrer quand même en cas de doublon</label>
      <button className="bouton w-full">Enregistrer les modifications</button></form>
    <form action={supprimerJoueur} className="space-y-3 rounded-xl border border-red-500/40 bg-carte p-4">
      <input type="hidden" name="id" value={p.id} />
      <p className="text-sm text-doux">Supprimer ce joueur efface aussi son contrat et ses transferts.</p>
      <label className="flex gap-2 text-sm"><input type="checkbox" name="confirmer" /> Je confirme la suppression de {p.name}</label>
      <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold">Supprimer le joueur</button></form></div>);
}
