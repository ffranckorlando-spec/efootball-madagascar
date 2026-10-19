import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/supabase';
import { modifierMatch, supprimerMatch } from '../../actions';
export const metadata = { title: 'Corriger un match', robots: { index: false } };
export const dynamic = 'force-dynamic';
export default async function Page({ params, searchParams }: { params: { id: string }; searchParams: { t?: string; msg?: string } }) {
  const t = searchParams.t === 'tournoi' ? 'tournoi' : 'ligue'; const sb = db();
  const [{ data: m }, { data: teams }] = await Promise.all([sb.from(t === 'tournoi' ? 'tournament_matches' : 'matches').select('*').eq('id', params.id).single(), sb.from('teams').select('id,name').order('name')]);
  if (!m) notFound();
  const Eq = ({ name, def }: { name: string; def: string }) => <select name={name} required defaultValue={def} className="champ">{teams?.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>;
  return (<div className="mx-auto max-w-lg space-y-4">
    <div className="flex items-center justify-between"><h1 className="font-titre text-3xl font-bold">Corriger un match</h1><Link href={t === 'tournoi' ? '/admin/tournois' : '/admin/matchs'} className="text-sm text-doux underline">Retour</Link></div>
    {searchParams.msg && <p role="alert" className="rounded-lg bg-red-500/20 p-3 text-sm">{searchParams.msg}</p>}
    <form action={modifierMatch} className="space-y-3 rounded-xl border border-bord bg-carte p-4"><input type="hidden" name="id" value={m.id} /><input type="hidden" name="t" value={t} />
      <Eq name="a" def={m.team_a} /><Eq name="b" def={m.team_b} />
      <div className="flex gap-2"><input name="sa" type="number" min="0" defaultValue={m.score_a ?? ''} placeholder="Buts A" className="champ" /><input name="sb" type="number" min="0" defaultValue={m.score_b ?? ''} placeholder="Buts B" className="champ" /></div>
      <div className="flex gap-2"><input name="date" type="date" defaultValue={m.played_on || ''} className="champ" />{t === 'tournoi' && <input name="heure" type="time" defaultValue={m.played_at ? String(m.played_at).slice(0, 5) : ''} className="champ" />}</div>
      {t === 'tournoi' && <p className="text-xs text-doux">Laisse les buts vides pour un match à venir.</p>}
      <button className="bouton w-full">Enregistrer la correction</button></form>
    <form action={supprimerMatch} className="space-y-3 rounded-xl border border-red-500/40 bg-carte p-4"><input type="hidden" name="id" value={m.id} /><input type="hidden" name="t" value={t} />
      <label className="flex gap-2 text-sm"><input type="checkbox" name="confirmer" /> Je confirme la suppression de ce match</label>
      <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold">Supprimer le match</button></form></div>);
}
