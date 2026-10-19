import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase';
export const metadata = { title: 'Connexion admin', robots: { index: false } };
async function connexion(f: FormData) {
  'use server';
  const { error } = await db().auth.signInWithPassword({ email: String(f.get('email')), password: String(f.get('password')) });
  if (error) redirect('/admin/login?erreur=1');
  redirect('/admin');
}
export default function Login({ searchParams }: { searchParams: { erreur?: string } }) {
  return (<form action={connexion} className="mx-auto mt-10 max-w-sm space-y-3 rounded-xl border border-bord bg-carte p-6">
    <h1 className="font-titre text-2xl font-bold">Espace administrateur</h1>
    {searchParams.erreur && <p role="alert" className="text-sm text-red-400">E-mail ou mot de passe incorrect.</p>}
    <input name="email" type="email" required placeholder="E-mail" className="champ" />
    <input name="password" type="password" required placeholder="Mot de passe" className="champ" />
    <button className="bouton w-full">Se connecter</button></form>);
}
