// create.js
const { generateRandomSlug } = (() => {
  function generateRandomSlug() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  return { generateRandomSlug };
})();

const db = require('./_db');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const longUrl = (body.longUrl || '').trim();
    let customSlug = body.customSlug ? String(body.customSlug).trim() : '';

    if (!longUrl) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'longUrl is required' }) };
    }

    // Basit URL validasyonu
    try {
      new URL(longUrl);
    } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid URL' }) };
    }

    // Eğer custom slug verilmişse kontrol et
    if (customSlug) {
      const exists = await db.existsSlug(customSlug);
      if (exists) {
        return { statusCode: 409, headers, body: JSON.stringify({ error: 'Custom slug already taken' }) };
      }
      await db.saveLink(customSlug, {
        longUrl,
        createdAt: new Date().toISOString(),
        clicks: 0
      });
      const shortUrl = `${getSiteBaseUrl(event)}/r/${customSlug}`;
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, shortUrl }) };
    }

    // Rasgele slug oluştur ve çakışma kontrolü (kaç deneme yapıldığına dikkat)
    let attempts = 0;
    let slug;
    do {
      slug = generateRandomSlug();
      attempts++;
      if (attempts > 6) break;
    } while (await db.existsSlug(slug));

    // Eğer 6 denemede bulunamadıysa hata dönebiliriz (çok düşük ihtimal)
    if (await db.existsSlug(slug)) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Could not generate unique slug, try again' }) };
    }

    await db.saveLink(slug, {
      longUrl,
      createdAt: new Date().toISOString(),
      clicks: 0
    });

    const shortUrl = `${getSiteBaseUrl(event)}/r/${slug}`;
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, shortUrl }) };
  } catch (err) {
    console.error('create error', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

function getSiteBaseUrl(event) {
  // Netlify fonksiyonlarında HOST header ile site domain'i alınabilir
  const host = (event.headers && (event.headers['x-forwarded-host'] || event.headers.host)) || 'ornate-piroshki-d0109f.netlify.app';
  const proto = (event.headers && (event.headers['x-forwarded-proto'] || event.headers['x-forwarded-protocol'])) || 'https';
  return `${proto}://${host}`;
}
