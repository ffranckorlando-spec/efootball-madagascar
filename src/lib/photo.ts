import sharp from 'sharp';
import type { SupabaseClient } from '@supabase/supabase-js';
const CIBLE = 50 * 1024; // environ 50 Ko par photo

/** Recadre en carré, réduit et convertit en WebP jusqu'à ~50 Ko. */
export async function compresser(entree: Buffer): Promise<Buffer> {
  let taille = 480, sortie = Buffer.alloc(0);
  for (const dim of [480, 400, 320]) {
    taille = dim;
    for (let q = 80; q >= 40; q -= 10) {
      sortie = await sharp(entree).rotate().resize(taille, taille, { fit: 'cover', position: 'attention' }).webp({ quality: q }).toBuffer();
      if (sortie.length <= CIBLE) return sortie;
    }
  }
  return sortie;
}

/** Compresse puis envoie dans le bucket « photos ». Renvoie l'URL publique. */
export async function envoyerPhoto(sb: SupabaseClient, file: File, dossier = 'joueurs'): Promise<{ url?: string; erreur?: string }> {
  if (!file.type.startsWith('image/')) return { erreur: 'Le fichier doit être une image.' };
  try {
    const buf = await compresser(Buffer.from(await file.arrayBuffer()));
    const path = `${dossier}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
    const { error } = await sb.storage.from('photos').upload(path, buf, { contentType: 'image/webp', cacheControl: '31536000' });
    if (error) return { erreur: error.message };
    return { url: sb.storage.from('photos').getPublicUrl(path).data.publicUrl };
  } catch { return { erreur: 'Image illisible. Essaie un fichier JPG ou PNG.' }; }
}
