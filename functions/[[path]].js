// functions/[[path]].js — Pages Function für alle Pfade aus public/_routes.json
//
// Cloudflare Pages liefert public/ als statische Website aus. Nur die Pfade,
// die in public/_routes.json unter "include" stehen (/api/*, /uploads/*,
// /admin, /login und die Startseite für den Coming-Soon-Modus), laufen durch
// diese Function. Sie reicht die Anfrage an die Hono-App in src/worker.js
// weiter; env enthält dieselben Bindings (DB, BUCKET, ASSETS, Variablen).
import app from '../src/worker.js';

export const onRequest = (context) => app.fetch(context.request, context.env, context);
