// Eingang für das Vendoring von hono (npm run vendor) — nicht direkt importieren.
export { Hono } from 'hono';
export { cors } from 'hono/cors';
export { sign, verify } from 'hono/jwt';
