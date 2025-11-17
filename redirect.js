// Geçici memory database
let linksDB = {};

exports.handler = async function(event, context) {
  const path = event.path;
  const slug = path.startsWith('/r/') ? path.split('/r/')[1] : null;
  
  if (!slug) {
    return {
      statusCode: 302,
      headers: {
        'Location': 'https://ornate-piroshki-d0109f.netlify.app'
      }
    };
  }
  
  // Linki bul (geçici memory'den)
  const link = linksDB[slug];
  
  if (!link) {
    return {
      statusCode: 302,
      headers: {
        'Location': 'https://ornate-piroshki-d0109f.netlify.app/404'
      }
    };
  }
  
  // Tıklama sayısını artır
  linksDB[slug].clicks++;
  
  // Her 3 tıklamada bir reklam göster
  if (link.clicks % 3 === 0) {
    return showAdPage(link.longUrl, slug);
  }
  
  // Direkt yönlendir
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
  <title>Redirecting... - 12hrs.net</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      text-align: center; 
      padding: 40px 20px; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin: 0;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
      background: rgba(255,255,255,0.1);
      padding: 30px;
      border-radius: 15px;
      backdrop-filter: blur(10px);
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
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔄 Redirecting...</h1>
    <p>You're being redirected to your destination</p>
    
    <div class="countdown" id="countdown">5</div>
    
    <div class="ad-section">
      <h3>📢 Sponsored Content</h3>
      <div id="ad-content">
        <!-- PropellerAds reklamı -->
        <script src="https://3nbf4.com/act/files/tag.min.js?z=10200882"></script>
      </div>
      <p><small>Support our free service by viewing this ad</small></p>
    </div>
    
    <div class="loader"></div>
    
    <p>You will be redirected automatically in <span id="seconds">5</span> seconds</p>
    
    <div>
      <button class="btn" onclick="skipAd()">Skip Ad</button>
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
