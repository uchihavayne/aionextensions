// redirect.js
const db = require('./_db');

exports.handler = async function(event, context) {
  // event.path örn: /r/abc123
  console.log('Redirect invoked, path:', event.path);

  const headers = {
    'Access-Control-Allow-Origin': '*'
  };

  const slugMatch = (event.path || '').match(/^\/r\/([^\/\?\#]+)/);
  const slug = slugMatch ? slugMatch[1] : null;

  if (!slug) {
    // Kök veya hatalı ise anasayfaya gönder
    return {
      statusCode: 302,
      headers: { ...headers, Location: '/' },
      body: ''
    };
  }

  // DB'den linki al
  const link = await db.getLink(slug);
  if (!link) {
    // Yoksa not-found anchor'ına gönder
    return {
      statusCode: 302,
      headers: { ...headers, Location: '/#not-found' },
      body: ''
    };
  }

  // click sayısını artır (DB tarafında atomic olmalı; burada örnek)
  try {
    // Eğer DB persistent ise burada atomic increment yap (Fauna/Mongo'da uygun sorgu).
    // İn-memory fallback:
    if (db._memoryDB && db._memoryDB[slug]) {
      db._memoryDB[slug].clicks = (db._memoryDB[slug].clicks || 0) + 1;
    }
  } catch (e) {
    console.warn('click increment failed', e);
  }

  const clicks = (link.clicks || 0) + 1; // link objesi güncel değilse fallback
  const showAd = (clicks % 3 === 0);

  // Eğer reklam gösterilecekse HTML sayfa döndür
  if (showAd) {
    return showAdPage(link.longUrl);
  }

  // Normal redirect
  return {
    statusCode: 302,
    headers: { ...headers, Location: link.longUrl },
    body: ''
  };
};

function showAdPage(originalUrl) {
  // originalUrl güvenli hale getir (basit encode)
  const safeUrl = originalUrl.replace(/'/g, "\\'");

  const adHtml = `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Yönlendiriliyor...</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;background:#f5f7fb;margin:0;display:flex;align-items:center;justify-content:center;height:100vh;color:#222}
  .card{max-width:520px;background:linear-gradient(180deg,#fff,#fbfbff);padding:28px;border-radius:12px;box-shadow:0 10px 30px rgba(20,20,40,0.08);text-align:center}
  .count{font-size:48px;color:#2b6cb0;margin:10px 0}
  .btn{display:inline-block;margin:8px;padding:10px 16px;border-radius:8px;background:#2b6cb0;color:#fff;text-decoration:none}
  .muted{color:#666;font-size:14px}
</style>
</head>
<body>
  <div class="card">
    <h2>🔄 Yönlendiriliyorsunuz</h2>
    <p class="muted">Hedef sayfaya yönlendirilmeden önce kısa bir sponsorluk gösterimi.</p>
    <div class="count" id="t">5</div>
    <div>
      <a class="btn" id="skip">Reklamı Geç</a>
      <a class="btn" id="stay">Burada Kal</a>
    </div>
    <p class="muted" style="margin-top:12px">Destek için teşekkürler.</p>
  </div>

<script>
  let s = 5;
  const tEl = document.getElementById('t');
  const inter = setInterval(() => {
    s--;
    tEl.textContent = s;
    if (s <= 0) {
      clearInterval(inter);
      window.location.href = '${safeUrl}';
    }
  }, 1000);

  document.getElementById('skip').addEventListener('click', () => {
    window.location.href = '${safeUrl}';
  });

  document.getElementById('stay').addEventListener('click', () => {
    clearInterval(inter);
    tEl.textContent = '✓';
    document.querySelector('p.muted').textContent = 'Reklamı görüntülediniz, teşekkürler!';
  });
</script>
</body>
</html>
  `;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: adHtml
  };
}
