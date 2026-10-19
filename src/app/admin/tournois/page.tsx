import Link from 'next/link';
import { db } from '@/lib/supabase';
import { creerTournoi, supprimerTournoi, ajouterMatchTournoi, definirChampionTournoi } from '../actions';
export const metadata = { title: 'Tournois', robots: { index: false } };
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: { msg?: string } }) {
  const sb = db();
  const [{ data: tournois }, { data: teams }, { data: tm }] = await Promise.all([sb.from('tournaments').select('*').order('created_at', { ascending: false }), sb.from('teams').select('id,name').order('name'), sb.from('tournament_matches').select('*').order('played_on')]);
  const nom = (id: string) => teams?.find(x => x.id === id)?.name || '—';
  const Eq = ({ name, vide, def }: { name: string; vide?: boolean; def?: string | null }) => <select name={name} required={!vide} defaultValue={def || ''} className="champ">{vide && <option value="">Aucune équipe</option>}{teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>;
  return (<div className="space-y-4">
    <div className="flex items-center justify-between"><h1 className="font-titre text-3xl font-bold">Tournois et coupes</h1><Link href="/admin" className="text-sm text-doux underline">Retour</Link></div>
    {searchParams.msg && <p role="status" className="rounded-lg bg-orange/20 p-3 text-sm">{searchParams.msg}</p>}
    <form action={creerTournoi} className="space-y-2 rounded-xl border border-bord bg-carte p-4"><h2 className="font-titre text-xl font-bold">Nouveau tournoi</h2>
      <input name="nom" required placeholder="Nom du tournoi" className="champ" /><input name="desc" placeholder="Description" className="champ" /><button className="bouton">Créer le tournoi</button></form>
    {tournois?.map(t => <details key={t.id} className="rounded-xl border border-bord bg-carte p-4"><summary className="cursor-pointer font-titre text-xl font-bold">{t.name}</summary>
      <div className="mt-3 space-y-4">
        {!!tm?.filter(m => m.tournament_id === t.id).length && <ul className="divide-y divide-bord rounded-lg border border-bord text-sm">{tm.filter(m => m.tournament_id === t.id).map(m => <li key={m.id}>
          <Link href={`/admin/matchs/${m.id}?t=tournoi`} className="flex justify-between gap-2 p-2 hover:bg-fond"><span>{nom(m.team_a)} <b>{m.score_a == null ? 'vs' : `${m.score_a} - ${m.score_b}`}</b> {nom(m.team_b)}</span><span className="text-doux">Corriger</span></Link></li>)}</ul>}
        <form action={ajouterMatchTournoi} className="space-y-2"><h3 className="text-sm font-semibold">Ajouter un match</h3><input type="hidden" name="tournoi" value={t.id} />
          <Eq name="a" /><Eq name="b" /><div className="flex gap-2"><input name="sa" type="number" min="0" placeholder="Buts A" className="champ" /><input name="sb" type="number" min="0" placeholder="Buts B" className="champ" /></div>
          <div className="flex gap-2"><input name="date" type="date" className="champ" /><input name="heure" type="time" className="champ" /></div><button className="bouton">Ajouter le match</button></form>
        <form action={definirChampionTournoi} className="space-y-2"><h3 className="text-sm font-semibold">Champion</h3><input type="hidden" name="id" value={t.id} />
          <Eq name="equipe" vide def={t.champion_team_id} /><input name="joueur" defaultValue={t.champion_player || ''} placeholder="Joueur champion (facultatif)" className="champ" />
          <input name="image" type="file" accept="image/*" className="text-sm" /><button className="bouton">Enregistrer le champion</button></form>
        <form action={supprimerTournoi} className="flex items-center gap-3"><input type="hidden" name="id" value={t.id} />
          <label className="flex gap-2 text-xs text-doux"><input type="checkbox" name="confirmer" /> Confirmer la suppression</label><button className="text-xs text-red-400 underline">Supprimer le tournoi</button></form></div></details>)}</div>);
}
