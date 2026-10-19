// Rapatrie les photos externes (ibb.co...) dans Supabase Storage, compressées (~50 Ko).
// Usage : SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-photos.mjs
// ATTENTION : la clé service_role reste sur ton ordinateur, ne la mets jamais dans le site ni sur GitHub.
import { createClient } from '@supabase/supabase-js'; import sharp from 'sharp'; import fs from 'fs'; import path from 'path';
const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env;
if (!url || !key) throw new Error('Définis SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
const sb = createClient(url, key);
const compresser = async buf => { for (const d of [480, 400, 320]) for (let q = 80; q >= 40; q -= 10) {
  const o = await sharp(buf).rotate().resize(d, d, { fit: 'cover', position: 'attention' }).webp({ quality: q }).toBuffer(); if (o.length <= 51200 || (d === 320 && q === 40)) return o; } };
const { data: joueurs } = await sb.from('players').select('id,name,photo_url').not('photo_url', 'is', null);
let ok = 0, ko = 0;
for (const p of joueurs) {
  if (p.photo_url.includes('/storage/v1/object/public/photos/')) continue; // déjà migrée
  try {
    let buf;
    if (p.photo_url.startsWith('http')) { const r = await fetch(p.photo_url); if (!r.ok) throw new Error('HTTP ' + r.status); buf = Buffer.from(await r.arrayBuffer()); }
    else buf = fs.readFileSync(path.resolve(process.argv[2] || '../cem-site/images', p.photo_url.replace(/^\//, ''))); // ex. /players/xxx.jpg
    const out = await compresser(buf); const dest = `joueurs/${p.id}.webp`;
    const up = await sb.storage.from('photos').upload(dest, out, { contentType: 'image/webp', upsert: true, cacheControl: '31536000' });
    if (up.error) throw up.error;
    await sb.from('players').update({ photo_url: sb.storage.from('photos').getPublicUrl(dest).data.publicUrl }).eq('id', p.id);
    ok++; console.log('✓', p.name, Math.round(out.length / 1024) + ' Ko');
  } catch (e) { ko++; console.log('✗', p.name, e.message); }
}
console.log(`Terminé : ${ok} migrées, ${ko} en échec.`);
