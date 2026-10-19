import Link from 'next/link';
import { db } from '@/lib/supabase';
export const revalidate = 60;
type P = { id: string; name: string; pseudo: string | null; photo_url: string | null; strength: number | null; team: { name: string; color: string } | null };
export default async function Joueurs({ searchParams }: { searchParams: { q?: string; equipe?: string } }) {
  const sb = db(); const q = (searchParams.q || '').trim().replace(/[%,()]/g, ''); const equipe = searchParams.equipe;
  const { data: actus } = await sb.from('news').select('id,title,category').order('created_at', { ascending: false }).limit(3);
  const { data: teams } = await sb.from('teams').select('id,name,color,players(count)').order('name');
  let req = sb.from('players').select('id,name,pseudo,photo_url,strength,team:teams(name,color)').order('name').limit(120);
  if (q) req = req.or(`name.ilike.%${q}%,pseudo.ilike.%${q}%`);
  if (equipe) req = req.eq('team_id', equipe);
  const { data } = await req; const joueurs = (data || []) as unknown as P[];
  const total = (teams || []).reduce((s, t: any) => s + (t.players?.[0]?.count || 0), 0);
  const top = [...(teams || [])].sort((a: any, b: any) => (b.players?.[0]?.count || 0) - (a.players?.[0]?.count || 0))[0] as any;
  return (<>
    <section className="hero relative left-1/2 -mt-6 mb-6 w-screen -translate-x-1/2 px-4 py-14 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <span className="inline-block rounded-full border border-jaune/40 bg-black/40 px-3 py-1 text-xs font-semibold text-jaune">Communauté eFootball Madagascar</span>
        <h1 className="mt-4 max-w-xl font-titre text-4xl font-bold leading-tight sm:text-6xl">Retrouvez <br />n’importe quel <span className="text-jaune">joueur</span></h1>
        <p className="mt-4 max-w-lg text-sm text-white/85 sm:text-base">Évitez les recherches sans fin. Accédez instantanément aux équipes, classements des ligues Mobile et Console, transferts et fiches des joueurs.</p>
        <form className="mt-6 flex max-w-xl items-center gap-2 rounded-xl bg-white p-1.5 shadow-xl" role="search">
          <span className="pl-3 text-gray-500" aria-hidden="true">#</span>
          <input name="q" defaultValue={q} placeholder="Nom ou pseudo du joueur" className="hero-champ" aria-label="Rechercher un joueur" />
          {equipe && <input type="hidden" name="equipe" value={equipe} />}
          <button className="bouton-jaune"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>Rechercher</button></form>
        <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
          {[['/competitions', 'Classements'], ['/equipes', 'Équipes'], ['/transferts', 'Transferts'], ['/actualites', 'Actualités']].map(([h, l]) => <li key={h}><Link href={h} className="text-jaune hover:underline">● {l}</Link></li>)}
          <li className="text-white/70">{total} joueurs · {teams?.length} équipes</li></ul>
      </div></section>
        {!!actus?.length && <div className="mt-4 rounded-xl border border-bord bg-carte p-3 text-sm"><ul className="space-y-1">{actus.map(n => <li key={n.id}><span className="text-doux">{n.category} · </span>{n.title}</li>)}</ul>
      <Link href="/actualites" className="mt-2 inline-block text-xs text-doux underline">Toutes les actualités</Link></div>}
    <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
      <Link href="/" className="whitespace-nowrap rounded-full border border-bord px-3 py-1 text-xs">Toutes</Link>
      {(teams || []).map((t: any) => <Link key={t.id} href={`/?equipe=${t.id}`} style={{ borderColor: t.color }} className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${equipe === t.id ? 'bg-carte' : ''}`}>{t.name} <span className="text-doux">{t.players?.[0]?.count || 0}</span></Link>)}
    </div>
    <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {joueurs.map(p => <li key={p.id} className="overflow-hidden rounded-xl border border-bord bg-carte" style={{ borderTop: `3px solid ${p.team?.color || '#26263a'}` }}>
        <Link href={`/joueur/${p.id}`}>
          <div className="aspect-square bg-fond">{p.photo_url && <img src={p.photo_url} alt={p.name} loading="lazy" className="h-full w-full object-cover" />}</div>
          <div className="p-3"><p className="truncate font-titre text-lg font-bold">{p.name}</p><p className="truncate text-xs text-doux">{p.pseudo}</p>
            <p className="mt-2 text-xs" style={{ color: p.team?.color }}>{p.team?.name || 'Sans équipe'}</p></div></Link></li>)}
    </ul>
    {!joueurs.length && <p className="mt-6 text-sm text-doux">Aucun joueur trouvé. Essaie un autre nom ou retire le filtre d’équipe.</p>}
  </>);
}
