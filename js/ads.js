// ADS MODULE

let adsCache = [];
let adStats = {};

async function initAds() {
  adsCache = await fetchAds();
  adStats = getStorage(STORAGE_KEYS.AD_STATS, {});
  console.log('✅ Ads loaded:', adsCache.length);
}

function getRandomAd() {
  if (!adsCache.length) return null;
  return randomItem(adsCache);
}

function trackAdClick(adId) {
  adStats[adId] = (adStats[adId] || 0) + 1;
  setStorage(STORAGE_KEYS.AD_STATS, adStats);
}

function renderAdCard(ad) {
  if (!ad) ad = getRandomAd();
  if (!ad) return '';
  
  return `
    <div class="game-card ad-card" data-ad-id="${ad.id}">
      <a href="${ad.link}" target="_blank" class="ad-link" onclick="trackAdClick('${ad.id}')">
        <div class="card-image-container">
          <img class="card-image" src="${ad.image}" alt="Advertisement" loading="lazy">
        </div>
        <div class="card-content">
          <h3 class="card-title">📢 Ads</h3>
          <p class="card-description">${escapeHtml(ad.desc)}</p>
        </div>
      </a>
    </div>
  `;
}

function showAdPopup(callback) {
  const ad = getRandomAd();
  if (!ad) {
    if (callback) callback();
    return;
  }
  
  const popup = document.getElementById('adPopup');
  const popupImage = document.getElementById('popupAdImage');
  const popupDesc = document.getElementById('popupAdDesc');
  const popupLink = document.getElementById('popupAdLink');
  
  popupImage.src = ad.image;
  popupDesc.textContent = ad.desc;
  popupLink.href = ad.link;
  
  popup.classList.add('active');
  
  const closeHandler = () => {
    popup.classList.remove('active');
    if (callback) callback();
  };
  
  document.getElementById('closeAdPopupBtn').onclick = closeHandler;
}

function renderDetailAd() {
  const ad = getRandomAd();
  if (!ad) return '';
  
  return `
    <div style="margin-top: 32px; padding: 20px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 20px; text-align: center;">
      <a href="${ad.link}" target="_blank" style="text-decoration: none; color: white;" onclick="trackAdClick('${ad.id}')">
        <img src="${ad.image}" alt="Ad" style="width: 100%; border-radius: 12px; margin-bottom: 12px;">
        <p>${escapeHtml(ad.desc)}</p>
        <button class="btn-primary" style="margin-top: 12px;">Learn More →</button>
      </a>
    </div>
  `;
}