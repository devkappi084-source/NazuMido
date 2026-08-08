// middleware/auth.js — JWT-Authentifizierung für geschützte Routen
//
// Stellt Hilfsfunktionen zum Signieren von Tokens sowie eine Express-
// Middleware bereit, die den "Authorization: Bearer <token>"-Header prüft und
// bei Erfolg das dekodierte Admin-Objekt an `req.admin` hängt.

const jwt = require('jsonwebtoken');

// Secret aus der Umgebung. In Produktion MUSS JWT_SECRET gesetzt sein;
// zur Entwicklung fällt der Server auf einen unsicheren Standard zurück.
const JWT_SECRET = process.env.JWT_SECRET || 'nazumido-dev-secret-bitte-aendern';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!process.env.JWT_SECRET) {
  console.warn(
    '[auth] WARNUNG: JWT_SECRET ist nicht gesetzt — es wird ein unsicherer ' +
      'Entwicklungs-Standard verwendet. Bitte in .env konfigurieren!'
  );
}

// ---------------------------------------------------------------------------
// Token für einen Admin erzeugen
// ---------------------------------------------------------------------------
function signToken(admin) {
  return jwt.sign(
    { sub: admin.id, username: admin.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// ---------------------------------------------------------------------------
// Middleware: geschützte Routen absichern
// ---------------------------------------------------------------------------
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res
      .status(401)
      .json({ error: 'Nicht autorisiert: Bearer-Token fehlt' });
  }

  try {
    const payload = jwt.verify(match[1], JWT_SECRET);
    req.admin = { id: payload.sub, username: payload.username };
    return next();
  } catch (err) {
    const msg =
      err.name === 'TokenExpiredError'
        ? 'Token abgelaufen — bitte erneut anmelden'
        : 'Ungültiges Token';
    return res.status(401).json({ error: msg });
  }
}

module.exports = { signToken, requireAuth, JWT_SECRET, JWT_EXPIRES_IN };
