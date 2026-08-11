// Copie le build Vite du frontend (frontend/dist) dans backend/dist/public,
// pour qu'Express le serve en statique — un seul service Railway pour toute
// l'app plutôt que deux.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', '..', 'frontend', 'dist');
const dest = path.join(__dirname, '..', 'dist', 'public');

if (!fs.existsSync(src)) {
  console.warn(`[copy-frontend] ${src} introuvable — le frontend n'a pas été construit avant le backend. Ignoré.`);
  process.exit(0);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log(`[copy-frontend] ${src} -> ${dest}`);
