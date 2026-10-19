'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase';
import { envoyerPhoto } from '@/lib/photo';
const num = (v: FormDataEntryValue | null) => v === null || v === '' ? null : Number(v);
const scoreOk = (v: number | null) => v === null || (Number.isInteger(v) && v >= 0);
const fin = (msg: string) => { revalidatePath('/', 'layout'); redirect('/admin?msg=' + encodeURIComponent(msg)); };

export async function saisirResultat(f: FormData) {
  const sb = db(); const a = String(f.get('a')), b = String(f.get('b'));
  if (a === b) fin('Choisis deux équipes différentes.');
  const sa = num(f.get('sa')), sb2 = num(f.get('sb'));
  if (sa === null || sb2 === null || !scoreOk(sa) || !scoreOk(sb2)) fin('Scores invalides : entiers positifs ou nuls.');
  const { data: s } = await sb.from('seasons').select('id').eq('status', 'en_cours').order('id', { ascending: false }).limit(1).single();
  const { data: ta } = await sb.from('teams').select('league_id').eq('id', a).single();
  const { data: tb } = await sb.from('teams').select('league_id').eq('id', b).single();
  if (!ta?.league_id || ta.league_id !== tb?.league_id) fin('Les deux équipes doivent être dans la même ligue (et la même plateforme).');
  const { error } = await sb.from('matches').insert({ season_id: s?.id, league_id: ta?.league_id, team_a: a, team_b: b, score_a: sa, score_b: sb2, played_on: f.get('date') || undefined });
  fin(error ? 'Erreur : ' + error.message : 'Résultat enregistré. Le classement est à jour.');
}
export async function faireTransfert(f: FormData) {
  const { error } = await db().rpc('record_transfer', { p_player: f.get('joueur'), p_to: f.get('equipe') || null, p_type: f.get('type'), p_amount: num(f.get('montant')) });
  fin(error ? 'Erreur : ' + error.message : 'Transfert enregistré.');
}
export async function ajouterJoueur(f: FormData) {
  const sb = db(); const name = String(f.get('nom')).trim();
  const { data: doublon } = await sb.from('players').select('name,team:teams(name)').ilike('name', name).limit(1);
  if (doublon?.length && f.get('forcer') !== 'on') fin(`Doublon : « ${doublon[0].name} » existe déjà (${(doublon[0] as any).team?.name || 'sans équipe'}). Coche « Ajouter quand même » si c'est un autre joueur.`);
  let photo_url: string | null = null; const file = f.get('photo') as File;
  if (file && file.size > 0) {
    const r = await envoyerPhoto(sb, file);
    if (r.erreur) fin('Photo refusée : ' + r.erreur);
    photo_url = r.url || null;
  }
  const { error } = await sb.from('players').insert({ name, pseudo: f.get('pseudo') || null, team_id: f.get('equipe') || null, city: f.get('ville') || null, strength: num(f.get('force')), photo_url });
  fin(error ? 'Erreur : ' + error.message : 'Joueur ajouté.');
}
export async function finDeSaison(f: FormData) {
  if (f.get('confirmer') !== 'on') fin('Coche la case pour confirmer la fin de saison.');
  const { error } = await db().rpc('end_season'); fin(error ? 'Erreur : ' + error.message : 'Saison terminée : champions désignés, montées et descentes appliquées.');
}
export async function deconnexion() { await db().auth.signOut(); redirect('/admin/login'); }

const retour = (msg: string, to = '/admin/joueurs') => { revalidatePath('/', 'layout'); redirect(`${to}?msg=${encodeURIComponent(msg)}`); };

export async function modifierJoueur(f: FormData) {
  const sb = db(); const id = String(f.get('id')); const name = String(f.get('nom')).trim();
  const { data: doublon } = await sb.from('players').select('name,team:teams(name)').ilike('name', name).neq('id', id).limit(1);
  if (doublon?.length && f.get('forcer') !== 'on') retour(`Doublon : « ${doublon[0].name} » existe déjà (${(doublon[0] as any).team?.name || 'sans équipe'}). Coche « Enregistrer quand même » si c'est un autre joueur.`, `/admin/joueurs/${id}`);
  const maj: Record<string, unknown> = { name, pseudo: f.get('pseudo') || null, team_id: f.get('equipe') || null, series: f.get('serie') || null,
    strength: num(f.get('force')), value: num(f.get('valeur')), clause: num(f.get('clause')), city: f.get('ville') || null };
  const file = f.get('photo') as File;
  if (f.get('retirer_photo') === 'on') maj.photo_url = null;
  else if (file && file.size > 0) {
    const r = await envoyerPhoto(sb, file);
    if (r.erreur) retour('Photo refusée : ' + r.erreur, `/admin/joueurs/${id}`);
    maj.photo_url = r.url;
  }
  const { error } = await sb.from('players').update(maj).eq('id', id);
  if (error) retour('Erreur : ' + error.message, `/admin/joueurs/${id}`);
  const debut = f.get('debut'), fincontrat = f.get('fin');
  if (debut && fincontrat) {
    const { data: nc, error: ec } = await sb.from('contracts').insert({ player_id: id, starts_on: debut, ends_on: fincontrat }).select('id').single();
    if (ec || !nc) retour('Joueur modifié, mais le contrat n’a pas été enregistré (l’ancien est conservé).', `/admin/joueurs/${id}`);
    await sb.from('contracts').delete().eq('player_id', id).neq('id', nc!.id);
  } else await sb.from('contracts').delete().eq('player_id', id);
  retour('Joueur modifié.');
}
export async function supprimerJoueur(f: FormData) {
  const id = String(f.get('id'));
  if (f.get('confirmer') !== 'on') retour('Coche la case pour confirmer la suppression.', `/admin/joueurs/${id}`);
  const { error } = await db().from('players').delete().eq('id', id);
  retour(error ? 'Erreur : ' + error.message : 'Joueur supprimé. Il reste dans le journal des modifications.');
}

const HEX = /^#[0-9a-fA-F]{6}$/;
async function ligueComplete(sb: ReturnType<typeof db>, ligue: number | null, sauf?: string) {
  if (!ligue) return '';
  const { data: s } = await sb.from('settings').select('value').eq('key', 'teams_per_league').single();
  const { count } = await sb.from('teams').select('id', { count: 'exact', head: true }).eq('league_id', ligue).neq('id', sauf || '00000000-0000-0000-0000-000000000000');
  return (count ?? 0) >= (s?.value ?? 10) ? ` Attention : cette ligue a maintenant plus de ${s?.value ?? 10} équipes.` : '';
}
export async function creerEquipe(f: FormData) {
  const sb = db(); const name = String(f.get('nom')).trim(); const ligue = num(f.get('ligue')); const couleur = String(f.get('couleur') || '#a855f7');
  if (!HEX.test(couleur)) retour('Couleur invalide.', '/admin/equipes');
  let logo_url: string | null = null; const file = f.get('logo') as File;
  if (file && file.size > 0) { const r = await envoyerPhoto(sb, file, 'equipes'); if (r.erreur) retour('Logo refusé : ' + r.erreur, '/admin/equipes'); logo_url = r.url || null; }
  const avert = await ligueComplete(sb, ligue);
  const { error } = await sb.from('teams').insert({ name, color: couleur, league_id: ligue, logo_url });
  retour(error ? (error.code === '23505' ? `Une équipe nommée « ${name} » existe déjà.` : 'Erreur : ' + error.message) : 'Équipe créée.' + avert, '/admin/equipes');
}
export async function modifierEquipe(f: FormData) {
  const sb = db(); const id = String(f.get('id')); const ligue = num(f.get('ligue')); const couleur = String(f.get('couleur') || '');
  const retourFiche = `/admin/equipes/${id}`;
  if (!HEX.test(couleur)) retour('Couleur invalide.', retourFiche);
  const maj: Record<string, unknown> = { name: String(f.get('nom')).trim(), color: couleur, league_id: ligue };
  const file = f.get('logo') as File;
  if (f.get('retirer_logo') === 'on') maj.logo_url = null;
  else if (file && file.size > 0) { const r = await envoyerPhoto(sb, file, 'equipes'); if (r.erreur) retour('Logo refusé : ' + r.erreur, retourFiche); maj.logo_url = r.url; }
  const avert = await ligueComplete(sb, ligue, id);
  const { error } = await sb.from('teams').update(maj).eq('id', id);
  if (error) retour(error.code === '23505' ? 'Ce nom d’équipe existe déjà.' : 'Erreur : ' + error.message, retourFiche);
  retour('Équipe modifiée.' + avert, '/admin/equipes');
}
export async function supprimerEquipe(f: FormData) {
  const sb = db(); const id = String(f.get('id'));
  if (f.get('confirmer') !== 'on') retour('Coche la case pour confirmer la suppression.', `/admin/equipes/${id}`);
  const { count } = await sb.from('matches').select('id', { count: 'exact', head: true }).or(`team_a.eq.${id},team_b.eq.${id}`);
  if (count) retour(`Suppression impossible : ${count} match(s) utilisent cette équipe. Retire-la de sa ligue à la place.`, `/admin/equipes/${id}`);
  const { error } = await sb.from('teams').delete().eq('id', id);
  retour(error ? 'Erreur : ' + error.message : 'Équipe supprimée. Ses joueurs sont maintenant sans équipe.', '/admin/equipes');
}

// ---- Actualités et tournois
export async function publierActualite(f: FormData) {
  const { error } = await db().from('news').insert({ title: String(f.get('titre')).trim(), body: f.get('texte') || null, category: f.get('categorie') || 'Actualité' });
  retour(error ? 'Erreur : ' + error.message : 'Actualité publiée.', '/admin/actualites');
}
export async function supprimerActualite(f: FormData) {
  const { error } = await db().from('news').delete().eq('id', String(f.get('id')));
  retour(error ? 'Erreur : ' + error.message : 'Actualité supprimée.', '/admin/actualites');
}
export async function creerTournoi(f: FormData) {
  const sb = db(); const { data: s } = await sb.from('seasons').select('id').eq('status', 'en_cours').order('id', { ascending: false }).limit(1).single();
  const { error } = await sb.from('tournaments').insert({ name: String(f.get('nom')).trim(), description: f.get('desc') || null, season_id: s?.id });
  retour(error ? 'Erreur : ' + error.message : 'Tournoi créé.', '/admin/tournois');
}
export async function supprimerTournoi(f: FormData) {
  if (f.get('confirmer') !== 'on') retour('Coche la case pour confirmer la suppression du tournoi.', '/admin/tournois');
  const { error } = await db().from('tournaments').delete().eq('id', String(f.get('id')));
  retour(error ? 'Erreur : ' + error.message : 'Tournoi supprimé avec ses matchs.', '/admin/tournois');
}
export async function ajouterMatchTournoi(f: FormData) {
  const a = String(f.get('a')), b = String(f.get('b'));
  if (a === b) retour('Choisis deux équipes différentes.', '/admin/tournois');
  if (!scoreOk(num(f.get('sa'))) || !scoreOk(num(f.get('sb')))) retour('Scores invalides : entiers positifs ou nuls.', '/admin/tournois');
  const { error } = await db().from('tournament_matches').insert({ tournament_id: f.get('tournoi'), team_a: a, team_b: b, score_a: num(f.get('sa')), score_b: num(f.get('sb')), played_on: f.get('date') || undefined, played_at: f.get('heure') || null });
  retour(error ? 'Erreur : ' + error.message : 'Match ajouté (sans score = match à venir).', '/admin/tournois');
}
export async function definirChampionTournoi(f: FormData) {
  const sb = db(); const maj: Record<string, unknown> = { champion_team_id: f.get('equipe') || null, champion_player: f.get('joueur') || null };
  const file = f.get('image') as File;
  if (file && file.size > 0) { const r = await envoyerPhoto(sb, file, 'tournois'); if (r.erreur) retour('Image refusée : ' + r.erreur, '/admin/tournois'); maj.champion_image = r.url; }
  const { error } = await sb.from('tournaments').update(maj).eq('id', String(f.get('id')));
  retour(error ? 'Erreur : ' + error.message : 'Champion enregistré.', '/admin/tournois');
}

// ---- Correction des matchs (ligues et tournois)
const tableMatch = (t: FormDataEntryValue | null) => t === 'tournoi' ? 'tournament_matches' : 'matches';
export async function modifierMatch(f: FormData) {
  const sb = db(); const t = String(f.get('t')), id = String(f.get('id')); const a = String(f.get('a')), b = String(f.get('b'));
  const ici = `/admin/matchs/${id}?t=${t}`;
  if (a === b) retour('Choisis deux équipes différentes.', ici);
  if (!scoreOk(num(f.get('sa'))) || !scoreOk(num(f.get('sb')))) retour('Scores invalides : entiers positifs ou nuls.', ici);
  const maj: Record<string, unknown> = { team_a: a, team_b: b, score_a: num(f.get('sa')), score_b: num(f.get('sb')), played_on: f.get('date') || undefined };
  if (t === 'tournoi') maj.played_at = f.get('heure') || null;
  else {
    const { data: ta } = await sb.from('teams').select('league_id').eq('id', a).single(); const { data: tb } = await sb.from('teams').select('league_id').eq('id', b).single();
    if (!ta?.league_id || ta.league_id !== tb?.league_id) retour('Les deux équipes doivent être dans la même ligue (et la même plateforme).', ici);
    maj.league_id = ta.league_id;
  }
  const { error } = await sb.from(tableMatch(t)).update(maj).eq('id', id);
  retour(error ? 'Erreur : ' + error.message : 'Match corrigé. Le classement est recalculé.', t === 'tournoi' ? '/admin/tournois' : '/admin/matchs');
}
export async function supprimerMatch(f: FormData) {
  const t = String(f.get('t')), id = String(f.get('id'));
  if (f.get('confirmer') !== 'on') retour('Coche la case pour confirmer la suppression.', `/admin/matchs/${id}?t=${t}`);
  const { error } = await db().from(tableMatch(t)).delete().eq('id', id);
  retour(error ? 'Erreur : ' + error.message : 'Match supprimé. Le classement est recalculé.', t === 'tournoi' ? '/admin/tournois' : '/admin/matchs');
}
