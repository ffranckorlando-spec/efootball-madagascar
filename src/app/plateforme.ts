'use server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
export async function choisirPlateforme(f: FormData) {
  cookies().set('cem_platform', f.get('p') === 'console' ? 'console' : 'mobile', { maxAge: 60 * 60 * 24 * 365, path: '/', sameSite: 'lax' });
  revalidatePath('/', 'layout');
}
