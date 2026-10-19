import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export function db() {
  const store = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => store.getAll(), setAll: (list) => { try { list.forEach(c => store.set(c.name, c.value, c.options)); } catch {} } } });
}
export const ar = (n: number | null) => n == null ? '—' : n.toLocaleString('fr-FR').replace(/\u202f/g, ' ') + ' Ar';
