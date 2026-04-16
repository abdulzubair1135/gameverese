// ============ ADS MODULE ============

let adsCache = [];
let adRotationIndex = 0;
let adStats = {
    impressions: {},
    clicks: {},
    revenue: 0
};

// Default ads (fallback)
const DEFAULT_ADS = [
    {
        id: "ad1",
        type: "banner",
        image: "https://picsum.photos/id/0/400/200",
        desc: "🔥 Limited Time: 50% Off Gaming Peripherals!",
        link: "https://example.com/gaming-deal",
        cpc: 0.50
    },
    {
        id: "ad2",
        type: "banner",
        image: "https://picsum.photos/id/1/400/200",
        desc: "⚡ New Gaming Laptop - RTX 4080. Ultra performance!",
        link: "https://example.com/gaming-laptop",
        cpc: 0.75
    },
    {
        id: "ad3",
        type: "popup",
        image: "https://picsum.photos/id/2/400/300",
        desc: "🎧 Premium Gaming Headset - 40% OFF!",
        link: "https://example.com/headset",
        cpc: 0.60
    },
    {
        id: "ad4",
        type: "reward",
        image: "https://picsum.photos/id/3/400/300",
        desc: "🎁 Watch ad to earn 50 points!",
        link: "https://example.com/reward",
        cpc: 0.40
    }
];

/**
 * Initialize ads module
 */
async function initAds() {
    adsCache = await fetchAds();
    adStats = getStorage(STORAGE_KEYS.AD_STATS, { impressions: {}, clicks: {}, revenue: 0 });
    console.log('✅ Ads loaded:', adsCache.length);
}

/**
 * Fetch ads from JSON file
 * @returns {Promise<Array>} Ads array
 */
async function fetchAds() {
    try {
        const response = await fetch('ads.json');
        if (!response.ok) throw new Error('Failed to load ads');
        const ads = await response.json();
        return ads;
    } catch (error) {
        console.error('Error fetching ads, using defaults:', error);
        return DEFAULT_ADS;
    }
}

/**
 * Get random ad with rotation
 * @param {string} type - Ad type (banner, popup, reward, inline)
 * @returns {Object|null} Ad object
 */
function getRandomAd(type = null) {
    if (!adsCache.length) return null;
    
    let availableAds = adsCache;
    if (type) {
        availableAds = adsCache.filter(ad => ad.type === type);
    }
    
    if (!availableAds.length) return null;
    
    // Rotate through ads
    adRotationIndex = (adRotationIndex + 1) % availableAds.length;
    return availableAds[adRotationIndex];
}

/**
 * Get different ad than previous
 * @param {string} previousAdId - Previous ad ID
 * @returns {Object|null} Different ad
 */
function getDifferentAd(previousAdId) {
    if (!adsCache.length) return null;
    
    let available = adsCache.filter(ad => ad.id !== previousAdId);
    if (available.length === 0) available = adsCache;
    
    return randomItem(available);
}

/**
 * Track ad impression
 * @param {string} adId - Ad ID
 */
function trackAdImpression(adId) {
    if (!adStats.impressions[adId]) adStats.impressions[adId] = 0;
    adStats.impressions[adId]++;
    saveAdStats();
}

/**
 * Track ad click
 * @param {string} adId - Ad ID
 */
function trackAdClick(adId) {
    if (!adStats.clicks[adId]) adStats.clicks[adId] = 0;
    adStats.clicks[adId]++;
    
    // Calculate revenue (CPC model)
    const ad = adsCache.find(a => a.id === adId);
    if (ad && ad.cpc) {
        adStats.revenue += ad.cpc;
        saveAdStats();
    }
    
    console.log(`Ad clicked: ${adId}`);
}

/**
 * Save ad statistics to storage
 */
function saveAdStats() {
    setStorage(STORAGE_KEYS.AD_STATS, adStats);
}

/**
 * Get ad click-through rate
 * @param {string} adId - Ad ID
 * @returns {number} CTR percentage
 */
function getAdCTR(adId) {
    const impressions = adStats.impressions[adId] || 0;
    const clicks = adStats.clicks[adId] || 0;
    return impressions > 0 ? (clicks / impressions) * 100 : 0;
}

/**
 * Get total ad revenue
 * @returns {number} Total revenue
 */
function getTotalAdRevenue() {
    return adStats.revenue || 0;
}

/**
 * Render banner ad
 * @param {string} position - Position (top, bottom, sidebar)
 * @returns {string} HTML string
 */
function renderBannerAd(position = 'top') {
    const ad = getRandomAd('banner');
    if (!ad) return '';
    
    trackAdImpression(ad.id);
    
    return `
        <div class="ad-banner ad-${position}" data-ad-id="${ad.id}">
            <div class="ad-container">
                <a href="${ad.link}" target="_blank" rel="sponsored nofollow" onclick="trackAdClick('${ad.id}')">
                    <img src="${ad.image}" alt="Advertisement" loading="lazy">
                    <div class="ad-label">Advertisement</div>
                </a>
                <button class="ad-close" onclick="this.parentElement.parentElement.style.display='none'">✕</button>
            </div>
        </div>
    `;
}

/**
 * Render inline ad card (like game card)
 * @returns {string} HTML string
 */
function renderInlineAdCard() {
    const ad = getRandomAd('banner');
    if (!ad) return '';
    
    trackAdImpression(ad.id);
    
    return `
        <div class="game-card ad-card" data-ad-id="${ad.id}">
            <a href="${ad.link}" target="_blank" rel="sponsored nofollow" onclick="trackAdClick('${ad.id}')" style="text-decoration: none;">
                <div class="card-media">
                    <img class="card-image" src="${ad.image}" alt="Advertisement">
                    <div class="ad-badge">Sponsored</div>
                </div>
                <div class="card-content">
                    <h3 class="card-title">✨ Special Offer</h3>
                    <p class="card-description">${escapeHtml(ad.desc)}</p>
                    <button class="btn-ad">Learn More →</button>
                </div>
            </a>
        </div>
    `;
}

/**
 * Show popup ad
 * @param {Function} callback - Callback after ad closes
 */
function showAdPopup(callback) {
    const ad = getRandomAd('popup');
    if (!ad) {
        if (callback) callback();
        return;
    }
    
    trackAdImpression(ad.id);
    
    const popup = document.getElementById('adPopup');
    if (!popup) {
        if (callback) callback();
        return;
    }
    
    // Set ad content
    document.getElementById('popupAdImage').src = ad.image;
    document.getElementById('popupAdDesc').textContent = ad.desc;
    document.getElementById('popupAdLink').href = ad.link;
    
    // Show popup
    popup.classList.add('active');
    
    // Setup close handler
    const closeHandler = () => {
        popup.classList.remove('active');
        if (callback) callback();
    };
    
    document.getElementById('closeAdPopup').onclick = closeHandler;
    document.getElementById('continueGameBtn').onclick = closeHandler;
    
    // Track click on ad link
    document.getElementById('popupAdLink').onclick = () => {
        trackAdClick(ad.id);
    };
}

/**
 * Show reward ad (watch to earn points)
 * @param {Function} callback - Callback with success boolean
 */
function showRewardAd(callback) {
    const ad = getRandomAd('reward');
    if (!ad) {
        if (callback) callback(false);
        return;
    }
    
    trackAdImpression(ad.id);
    
    const modal = document.getElementById('rewardAdModal');
    if (!modal) {
        if (callback) callback(false);
        return;
    }
    
    // Set ad content
    document.getElementById('rewardAdImage').src = ad.image;
    
    // Show modal
    modal.classList.add('active');
    
    let countdown = 3;
    const timerDiv = modal.querySelector('.reward-timer');
    const watchBtn = document.getElementById('watchAdBtn');
    
    // Countdown timer
    const interval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            timerDiv.textContent = `Ad starts in ${countdown} seconds...`;
            watchBtn.textContent = `Watch Ad (${countdown}s)`;
        } else {
            clearInterval(interval);
            timerDiv.textContent = 'Ad ready to watch';
            watchBtn.textContent = 'Watch Ad →';
            watchBtn.disabled = false;
        }
    }, 1000);
    
    // Watch button handler
    watchBtn.onclick = () => {
        trackAdClick(ad.id);
        modal.classList.remove('active');
        
        // Simulate ad watching
        const adDuration = 5000;
        const progressContainer = document.createElement('div');
        progressContainer.className = 'ad-progress-overlay';
        progressContainer.innerHTML = `
            <div class="ad-progress-container">
                <div class="ad-progress-bar"></div>
                <p>Watching ad... ${Math.ceil(adDuration / 1000)} seconds</p>
            </div>
        `;
        document.body.appendChild(progressContainer);
        
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 100;
            const bar = progressContainer.querySelector('.ad-progress-bar');
            if (bar) bar.style.width = `${(progress / adDuration) * 100}%`;
            
            if (progress >= adDuration) {
                clearInterval(progressInterval);
                progressContainer.remove();
                
                // Add reward points
                addUserPoints(10);
                showToast('🎉 +10 points earned!', 'success');
                
                if (callback) callback(true);
            }
        }, 100);
    };
    
    // Cancel button handler
    document.getElementById('cancelRewardBtn').onclick = () => {
        clearInterval(interval);
        modal.classList.remove('active');
        if (callback) callback(false);
    };
}

/**
 * Render detail page ad
 * @param {Object} ad - Ad object
 * @param {string} label - Ad label
 * @returns {string} HTML string
 */
function renderDetailAd(ad, label = 'Advertisement') {
    if (!ad) return '';
    
    return `
        <div class="detail-ad" style="margin: 20px 0; padding: 16px; background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 16px; text-align: center;">
            <p style="font-size: 11px; opacity: 0.7; margin-bottom: 8px;">📢 ${label}</p>
            <a href="${ad.link}" target="_blank" rel="sponsored nofollow" onclick="trackAdClick('${ad.id}')" style="text-decoration: none; color: inherit;">
                <img src="${ad.image}" alt="Ad" style="max-width: 100%; border-radius: 12px; max-height: 100px; object-fit: cover;">
                <p style="font-size: 13px; margin-top: 8px;">${escapeHtml(ad.desc)}</p>
                <button class="btn-primary" style="margin-top: 8px; padding: 6px 16px; font-size: 12px;">Learn More →</button>
            </a>
        </div>
    `;
}

// Make functions global
window.trackAdClick = trackAdClick;
window.renderInlineAdCard = renderInlineAdCard;
window.showAdPopup = showAdPopup;
window.showRewardAd = showRewardAd;
window.getRandomAd = getRandomAd;
window.getDifferentAd = getDifferentAd;
window.renderDetailAd = renderDetailAd;