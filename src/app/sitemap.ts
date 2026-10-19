import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [{ data: joueurs }, { data: equipes }, { data: tournois }] = await Promise.all([
    sb.from('players').select('id'), sb.from('teams').select('id'), sb.from('tournaments').select('id')]);
  const fixes = ['', '/equipes', '/competitions', '/transferts', '/actualites'].map(p => ({ url: site + p, changeFrequency: 'daily' as const, priority: p === '' ? 1 : 0.8 }));
  return [...fixes,
    ...(equipes || []).map(t => ({ url: `${site}/equipes/${t.id}`, changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...(tournois || []).map(t => ({ url: `${site}/tournois/${t.id}`, changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...(joueurs || []).map(p => ({ url: `${site}/joueur/${p.id}`, changeFrequency: 'weekly' as const, priority: 0.4 }))];
}
