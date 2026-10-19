import { cookies } from 'next/headers';
export type Plateforme = 'mobile' | 'console';
export const libelle = (p: string | null | undefined) => p === 'console' ? 'Console' : 'Mobile';
/** Plateforme choisie par le visiteur (Mobile par défaut). */
export function plateforme(): Plateforme { return cookies().get('cem_platform')?.value === 'console' ? 'console' : 'mobile'; }
