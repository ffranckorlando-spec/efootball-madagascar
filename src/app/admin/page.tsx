import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase';
import { saisirResultat, faireTransfert, ajouterJoueur, finDeSaison, deconnexion } from './actions';
export const metadata = { title: 'Administration', robots: { index: false } };
export const dynamic = 'force-dynamic';
const Carte = ({ t, children }: { t: string; children: React.ReactNode }) => <section className="rounded-xl border border-bord bg-carte p-4"><h2 className="mb-3 font-titre text-xl font-bold">{t}</h2><div className="space-y-2">{children}</div></section>;
export default async function Admin({ searchParams }: { searchParams: { msg?: string } }) {
  const sb = db();
  const { data: ok } = await sb.rpc('is_admin'); if (!ok) redirect('/admin/login?erreur=1');
  const [{ data: teams }, { data: players }, { data: logs }] = await Promise.all([
    sb.from('teams').select('id,name').order('name'), sb.from('players').select('id,name,pseudo').order('name'),
    sb.from('admin_logs').select('action,created_at').order('id', { ascending: false }).limit(10)]);
  const Equipes = ({ name, vide }: { name: string; vide?: boolean }) => <select name={name} required={!vide} className="champ">{vide && <option value="">Sans équipe</option>}{teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>;
  return (<div className="space-y-4">
    <div className="flex items-center justify-between"><h1 className="font-titre text-3xl font-bold">Administration</h1><div className="flex flex-wrap gap-4 text-sm"><a href="/admin/joueurs" className="underline">Joueurs</a><a href="/admin/equipes" className="underline">Équipes</a><a href="/admin/matchs" className="underline">Résultats</a><a href="/admin/tournois" className="underline">Tournois</a><a href="/admin/actualites" className="underline">Actualités</a><form action={deconnexion}><button className="text-doux underline">Se déconnecter</button></form></div></div>
    {searchParams.msg && <p role="status" className="rounded-lg bg-orange/20 p-3 text-sm">{searchParams.msg}</p>}
    <div className="grid gap-4 md:grid-cols-2">
      <Carte t="Saisir un résultat"><form action={saisirResultat} className="space-y-2"><Equipes name="a" /><Equipes name="b" />
        <div className="flex gap-2"><input name="sa" type="number" min="0" required placeholder="Buts A" className="champ" /><input name="sb" type="number" min="0" required placeholder="Buts B" className="champ" /></div>
        <input name="date" type="date" className="champ" /><button className="bouton">Enregistrer le résultat</button></form></Carte>
      <Carte t="Enregistrer un transfert"><form action={faireTransfert} className="space-y-2">
        <select name="joueur" required className="champ">{players?.map(p => <option key={p.id} value={p.id}>{p.name}{p.pseudo ? ` (${p.pseudo})` : ''}</option>)}</select>
        <Equipes name="equipe" vide /><select name="type" className="champ">{['Transfert', 'Prêt', 'Libre', 'Fin de contrat'].map(x => <option key={x}>{x}</option>)}</select>
        <input name="montant" type="number" min="0" placeholder="Montant (Ar)" className="champ" /><button className="bouton">Valider le transfert</button></form></Carte>
      <Carte t="Ajouter un joueur"><form action={ajouterJoueur} className="space-y-2">
        <input name="nom" required placeholder="Nom" className="champ" /><input name="pseudo" placeholder="Pseudo" className="champ" /><Equipes name="equipe" vide />
        <div className="flex gap-2"><input name="ville" placeholder="Ville" className="champ" /><input name="force" type="number" placeholder="Force" className="champ" /></div>
        <input name="photo" type="file" accept="image/*" className="text-sm" /><label className="flex gap-2 text-xs text-doux"><input type="checkbox" name="forcer" /> Ajouter quand même en cas de doublon</label>
        <button className="bouton">Ajouter</button></form></Carte>
      <Carte t="Fin de saison"><p className="text-sm text-doux">Désigne les champions, applique les montées et descentes, remet les classements à zéro. Action définitive.</p>
        <form action={finDeSaison} className="space-y-2"><label className="flex gap-2 text-xs text-doux"><input type="checkbox" name="confirmer" required /> Je confirme : cette action ne peut pas être annulée</label><button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold">Terminer la saison</button></form></Carte></div>
    <Carte t="Journal des modifications"><ul className="text-xs text-doux">{logs?.map((l, i) => <li key={i}>{new Date(l.created_at).toLocaleString('fr-FR')} · {l.action}</li>)}</ul></Carte></div>);
}
