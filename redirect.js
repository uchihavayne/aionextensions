// Geçici memory database - gerçek uygulamada FaunaDB kullan
let linksDB = {
  '1ok255': { 
    longUrl: 'https://google.com', 
    clicks: 0 
  },
  'test': { 
    longUrl: 'https://github.com', 
    clicks: 0 
  }
};

exports.handler = async function(event, context) {
  console.log('Redirect function called:', event.path);
  
  // Path'i parse et - /r/:slug formatında
  const path = event.path;
  const slugMatch = path.match(/\/r\/(.+)/);
  const slug = slugMatch ? slugMatch[1] : null;
  
  console.log('Extracted slug:', slug);
  
  if (!slug) {
    return {
      statusCode: 302,
      headers: {
        'Location': '/'
      }
    };
  }
  
  // Linki bul (geçici memory'den)
  const link = linksDB[slug];
  console.log('Found link:', link);
  
  if (!link) {
    return {
      statusCode: 302,
      headers: {
        'Location': '/#not-found'
      }
    };
  }
  
  // Tıklama sayısını artır
  linksDB[slug].clicks++;
  console.log('Updated clicks:', linksDB[slug].clicks);
  
  // Her 3 tıklamada bir reklam göster
  if (linksDB[slug].clicks % 3 === 0) {
    console.log('Showing ad page');
    return showAdPage(link.longUrl, slug);
  }
  
  // Direkt yönlendir
  console.log('Direct redirect to:', link.longUrl);
  return {
    statusCode: 302,
    headers: {
      'Location': link.longUrl
    }
  };
};

function showAdPage(originalUrl, slug) {
  const adHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Redirecting... - Link Kısaltıcı Pro</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      text-align: center; 
      padding: 40px 20px; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
      background: rgba(255,255,255,0.1);
      padding: 30px;
      border-radius: 15px;
      backdrop-filter: blur(10px);
      box-shadow: 0 15px 35px rgba(0,0,0,0.1);
    }
    .ad-section {
      background: white;
      color: #333;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
    }
    .countdown {
      font-size: 48px;
      font-weight: bold;
      margin: 20px 0;
      color: #FFD700;
    }
    .loader {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #667eea;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      margin: 10px 5px;
      transition: all 0.3s ease;
    }
    .btn:hover {
      background: #5a6fd8;
      transform: translateY(-2px);
    }
    .security-badge {
      background: #48bb78;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-left: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔄 Yönlendiriliyorsunuz...</h1>
    <p>Hedef sayfanıza yönlendiriliyorsunuz</p>
    
    <div class="countdown" id="countdown">5</div>
    
    <div class="ad-section">
      <h3>📢 Sponsor İçerik</h3>
      <p><small>Ücretsiz hizmetimizi bu reklamı görüntüleyerek destekleyin</small></p>
      <div id="ad-content">
        <!-- Reklam içeriği -->
        <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin: 10px 0;">
          <h4 style="margin: 0 0 10px 0; color: #2d3748;">🚀 Link Kısaltıcı Pro</h4>
          <p style="margin: 0; color: #4a5568; font-size: 14px;">Profesyonel link yönetimi için Chrome eklentimizi deneyin!</p>
        </div>
      </div>
      <span class="security-badge">🔒 Güvenli</span>
    </div>
    
    <div class="loader"></div>
    
    <p><span id="seconds">5</span> saniye içinde otomatik olarak yönlendirileceksiniz</p>
    
    <div>
      <button class="btn" onclick="skipAd()">Reklamı Geç</button>
      <button class="btn" onclick="stayOnPage()">Burada Kal</button>
    </div>
  </div>

  <script>
    let seconds = 5;
    let countdownInterval;
    
    function startCountdown() {
      countdownInterval = setInterval(() => {
        seconds--;
        document.getElementById('seconds').textContent = seconds;
        document.getElementById('countdown').textContent = seconds;
        
        if (seconds <= 0) {
          clearInterval(countdownInterval);
          redirectToDestination();
        }
      }, 1000);
    }
    
    function redirectToDestination() {
      window.location.href = '${originalUrl}';
    }
    
    function skipAd() {
      clearInterval(countdownInterval);
      redirectToDestination();
    }
    
    function stayOnPage() {
      clearInterval(countdownInterval);
      document.getElementById('countdown').textContent = '✓';
      document.getElementById('seconds').textContent = '0';
      document.querySelector('h1').textContent = '✅ Reklamı Görüntülediniz';
      document.querySelector('p').textContent = 'Destek için teşekkürler!';
    }
    
    // Start countdown when page loads
    startCountdown();
  </script>
</body>
</html>
  `;
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html'
    },
    body: adHtml
  };
}
