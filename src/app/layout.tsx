import type { Metadata } from 'next';
import Link from 'next/link';
import { Rajdhani, Inter } from 'next/font/google';
import './globals.css';
import { plateforme } from '@/lib/plateforme';
import { choisirPlateforme } from './plateforme';
const titre = Rajdhani({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-titre' });
const texte = Inter({ subsets: ['latin'], variable: '--font-texte' });
const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: 'eFootball Madagascar — Annuaire et ligues de la communauté', template: '%s · eFootball Madagascar' },
  description: 'Joueurs, équipes, classements des 4 ligues et transferts de la communauté eFootball Madagascar.',
  openGraph: { title: 'eFootball Madagascar', description: 'Joueurs, équipes, ligues et transferts.', images: ['/logo.jpg'], locale: 'fr_MG', type: 'website' } };
const liens = [['/', 'Joueurs'], ['/equipes', 'Équipes'], ['/competitions', 'Compétitions'], ['/transferts', 'Transferts'], ['/actualites', 'Actualités']];
export default function Layout({ children }: { children: React.ReactNode }) {
  const pf = plateforme();
  return (<html lang="fr"><body className={`${titre.variable} ${texte.variable}`}>
    <div className="drapeau" />
    <header className="sticky top-0 z-20 border-b border-white/10 bg-fond/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center gap-5 overflow-x-auto px-4 py-3">
        <Link href="/" className="flex items-center gap-2 whitespace-nowrap font-titre text-xl font-bold"><img src="/logo.jpg" alt="" className="h-8 w-8 rounded-md object-cover" />eFootball <span className="text-jaune">Madagascar</span></Link>
        <div className="ml-4 flex gap-5">{liens.map(([h, l]) => <Link key={h} href={h} className="whitespace-nowrap text-sm font-medium text-texte/80 hover:text-white">{l}</Link>)}</div>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <form action={choisirPlateforme} className="flex shrink-0 rounded-full border border-white/15 text-xs" aria-label="Plateforme">
            {[['mobile', 'Mobile'], ['console', 'Console']].map(([v, l]) => <button key={v} name="p" value={v} aria-pressed={pf === v} className={`rounded-full px-3 py-1 ${pf === v ? 'bg-orange font-semibold text-black' : 'text-doux'}`}>{l}</button>)}</form>
          <Link href="/admin/login" className="whitespace-nowrap text-sm font-medium text-texte/80 hover:text-white">Se connecter</Link>
          <Link href="/admin" className="whitespace-nowrap rounded-lg bg-orange px-4 py-2 text-xs font-bold text-black hover:brightness-95">Espace admin</Link></div>
      </nav></header>
    <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    <footer className="mx-auto max-w-6xl space-y-2 border-t border-bord px-4 py-8 text-sm text-doux">
      <p>Suivez la communauté eFootball Madagascar sur les réseaux sociaux :{' '}
        <a href="https://www.facebook.com/profile.php?id=61557417564717" target="_blank" rel="noopener noreferrer" className="text-texte underline">Facebook</a></p>
      <p>Adresse e-mail de la communauté : <a href="mailto:efootballmadagascar@gmail.com" className="text-texte underline">efootballmadagascar@gmail.com</a></p>
      <p className="text-xs">Photos publiées avec l’accord des joueurs. Retrait sur simple demande par e-mail.</p>
    </footer>
  </body></html>);
}
