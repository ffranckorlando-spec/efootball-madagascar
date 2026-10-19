import Link from 'next/link';
import { db } from '@/lib/supabase';
import { creerEquipe } from '../actions';
export const metadata = { title: 'Gérer les équipes', robots: { index: false } };
export const dynamic = 'force-dynamic';
const nl = (l: any) => l.platform ? `${nl(l)} · ${l.platform === 'mobile' ? 'Mobile' : 'Console'}` : l.name;
export default async function Liste({ searchParams }: { searchParams: { msg?: string } }) {
  const sb = db();
  const [{ data: teams }, { data: ligues }, { data: reg }] = await Promise.all([
    sb.from('teams').select('id,name,color,logo_url,league_id').order('name'), sb.from('leagues').select('id,name,platform').order('platform', { ascending: false }).order('level'), sb.from('settings').select('value').eq('key', 'teams_per_league').single()]);
  const max = reg?.value ?? 10;
  return (<div className="space-y-6">
    <div className="flex items-center justify-between"><h1 className="font-titre text-3xl font-bold">Gérer les équipes</h1><Link href="/admin" className="text-sm text-doux underline">Retour</Link></div>
    {searchParams.msg && <p role="status" className="rounded-lg bg-orange/20 p-3 text-sm">{searchParams.msg}</p>}
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{ligues?.map(l => { const n = teams?.filter(t => t.league_id === l.id).length || 0;
      return <div key={l.id} className="rounded-xl border border-bord bg-carte p-3"><p className="font-titre text-lg font-bold">{nl(l)}</p>
        <p className={`text-sm ${n === max ? 'text-vert' : 'text-yellow-400'}`}>{n} / {max} équipes</p></div>; })}</div>
    <form action={creerEquipe} className="space-y-2 rounded-xl border border-bord bg-carte p-4"><h2 className="font-titre text-xl font-bold">Nouvelle équipe</h2>
      <input name="nom" required placeholder="Nom de l’équipe" className="champ" />
      <div className="flex gap-2"><select name="ligue" className="champ"><option value="">Hors ligue</option>{ligues?.map(l => <option key={l.id} value={l.id}>{nl(l)}</option>)}</select>
        <input name="couleur" type="color" defaultValue="#a855f7" aria-label="Couleur" className="h-10 w-16 rounded-lg border border-bord bg-fond" /></div>
      <input name="logo" type="file" accept="image/*" className="text-sm" /><button className="bouton">Créer l’équipe</button></form>
    {ligues?.concat([{ id: 0, name: 'Hors ligue' }] as any).map((l: any) => { const liste = teams?.filter(t => (t.league_id || 0) === l.id) || []; if (!liste.length) return null;
      return <section key={l.id}><h2 className="font-titre text-xl font-bold">{nl(l)}</h2>
        <ul className="mt-2 divide-y divide-bord rounded-xl border border-bord bg-carte text-sm">{liste.map(t => <li key={t.id}><Link href={`/admin/equipes/${t.id}`} className="flex items-center gap-3 p-3 hover:bg-fond">
          <span className="h-4 w-4 rounded-full" style={{ background: t.color }} /><b className="flex-1">{t.name}</b><span className="text-doux">Modifier</span></Link></li>)}</ul></section>; })}</div>);
}
