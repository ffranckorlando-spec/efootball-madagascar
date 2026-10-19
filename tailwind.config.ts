import type { Config } from 'tailwindcss';
export default { content: ['./src/**/*.{ts,tsx}'], theme: { extend: {
  colors: { fond: '#0b0b14', carte: '#14141f', bord: '#26263a', violet: '#a855f7', bleu: '#3b82f6', vert: '#22d97a', texte: '#e8e8f2', doux: '#9a9ab5', jaune: '#ffd60a', orange: '#ff8a1f' },
  fontFamily: { titre: ['var(--font-titre)'], texte: ['var(--font-texte)'] } } }, plugins: [] } satisfies Config;
