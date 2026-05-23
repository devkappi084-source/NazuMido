/* GET /api/config — public endpoint, returns KV overrides */
export async function onRequestGet({ env }) {
  const [content, events, settings, gallery] = await Promise.all([
    env.KV.get('config:content',  'json').catch(() => null),
    env.KV.get('config:events',   'json').catch(() => null),
    env.KV.get('config:settings', 'json').catch(() => null),
    env.KV.get('config:gallery',  'json').catch(() => null),
  ]);

  return new Response(JSON.stringify({ content, events, settings, gallery }), {
    headers: {
      'Content-Type':                'application/json',
      'Cache-Control':               'no-cache, no-store',
      'Access-Control-Allow-Origin': '*',
    }
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    }
  });
}
