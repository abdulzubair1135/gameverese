// ============ PART 4: MONETIZATION SYSTEM ============

class MonetizationManager {
  constructor() {
    this.ads = [];
    this.sponsoredGames = [];
    this.affiliateLinks = new Map();
    this.adImpressions = new Map();
    this.adClicks = new Map();
    this.revenue = {
      total: 0,
      byType: {
        ads: 0,
        affiliate: 0,
        sponsored: 0
      }
    };
    this.init();
  }

  async init() {
    await this.loadAds();
    await this.loadSponsoredGames();
    this.setupAdRefresh();
    this.trackRevenue();
  }

  async loadAds() {
    try {
      const response = await fetch('ads.json');
      this.ads = await response.json();
      console.log(`Loaded ${this.ads.length} ads for monetization`);
    } catch (error) {
      console.error('Failed to load ads:', error);
      this.ads = this.getDefaultAds();
    }
  }

  getDefaultAds() {
    return [
      {
        id: 'default1',
        type: 'banner',
        image: 'https://via.placeholder.com/728x90?text=Advertisement',
        link: 'https://example.com/ad',
        cpc: 0.50,
        cpm: 2.00
      },
      {
        id: 'default2',
        type: 'popup',
        image: 'https://via.placeholder.com/600x400?text=Special+Offer',
        link: 'https://example.com/promo',
        cpc: 0.75,
        cpm: 3.00
      }
    ];
  }

  async loadSponsoredGames() {
    // Sponsored games are marked in games.json with isSponsored: true
    const gamesResponse = await fetch('games.json');
    const allGames = await gamesResponse.json();
    this.sponsoredGames = allGames.filter(g => g.isSponsored);
  }

  // 1. Ad Placements
  renderBannerAd(position = 'top') {
    const ad = this.getRandomAd('banner');
    if (!ad) return '';
    
    this.trackAdImpression(ad.id);
    
    return `
      <div class="ad-banner ad-${position}" data-ad-id="${ad.id}" data-ad-type="banner">
        <div class="ad-container">
          <a href="${ad.link}" target="_blank" rel="sponsored nofollow" onclick="monetization.trackAdClick('${ad.id}')">
            <img src="${ad.image}" alt="Advertisement" loading="lazy">
            <div class="ad-label">Advertisement</div>
          </a>
          <button class="ad-close" onclick="this.parentElement.parentElement.style.display='none'">✕</button>
        </div>
      </div>
    `;
  }

  renderInlineAd(index) {
    const ad = this.getRandomAd('inline');
    if (!ad) return '';
    
    this.trackAdImpression(ad.id);
    
    return `
      <div class="ad-inline" data-ad-id="${ad.id}" data-ad-type="inline">
        <div class="ad-card game-card">
          <a href="${ad.link}" target="_blank" rel="sponsored nofollow" onclick="monetization.trackAdClick('${ad.id}')">
            <div class="card-media">
              <img src="${ad.image}" alt="Sponsored" loading="lazy">
              <div class="ad-badge">Sponsored</div>
            </div>
            <div class="card-content">
              <h4>${ad.title || 'Special Offer'}</h4>
              <p>${ad.description || 'Click to learn more'}</p>
              <button class="btn-ad">Learn More →</button>
            </div>
          </a>
        </div>
      </div>
    `;
  }

  renderPopupAd() {
    const ad = this.getRandomAd('popup');
    if (!ad) return null;
    
    this.trackAdImpression(ad.id);
    
    const popup = document.createElement('div');
    popup.className = 'ad-popup modal';
    popup.innerHTML = `
      <div class="modal-content">
        <button class="close-popup" onclick="this.closest('.ad-popup').remove()">✕</button>
        <img src="${ad.image}" alt="Advertisement">
        <h3>${ad.title || 'Special Offer!'}</h3>
        <p>${ad.description || 'Don\'t miss out on this amazing deal!'}</p>
        <a href="${ad.link}" target="_blank" rel="sponsored nofollow" class="btn-primary" onclick="monetization.trackAdClick('${ad.id}'); this.closest('.ad-popup').remove()">
          Learn More →
        </a>
        <button class="btn-secondary" onclick="this.closest('.ad-popup').remove()">Close</button>
      </div>
    `;
    
    // Show popup after delay
    setTimeout(() => {
      document.body.appendChild(popup);
      popup.classList.add('active');
    }, 3000);
    
    return popup;
  }

  renderRewardAd(callback) {
    const ad = this.getRandomAd('reward');
    if (!ad) {
      if (callback) callback(false);
      return;
    }
    
    this.trackAdImpression(ad.id);
    
    const modal = document.createElement('div');
    modal.className = 'reward-ad modal';
    modal.innerHTML = `
      <div class="modal-content reward-content">
        <h3>🎁 Watch Ad to Unlock</h3>
        <p>Watch this short ad to continue playing or unlock premium features</p>
        <div class="ad-preview">
          <img src="${ad.image}" alt="Advertisement">
        </div>
        <div class="timer">Ad will start in 3 seconds...</div>
        <button class="btn-primary watch-btn" disabled>Watch Ad (3s)</button>
        <button class="btn-secondary cancel-btn">Cancel</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.classList.add('active');
    
    let countdown = 3;
    const timerDiv = modal.querySelector('.timer');
    const watchBtn = modal.querySelector('.watch-btn');
    
    const interval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        timerDiv.textContent = `Ad will start in ${countdown} seconds...`;
        watchBtn.textContent = `Watch Ad (${countdown}s)`;
      } else {
        clearInterval(interval);
        timerDiv.textContent = 'Ad ready to watch';
        watchBtn.textContent = 'Watch Ad →';
        watchBtn.disabled = false;
      }
    }, 1000);
    
    watchBtn.onclick = () => {
      this.trackAdClick(ad.id);
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
      
      // Simulate ad watching
      const adDuration = 5000;
      const adModal = document.createElement('div');
      adModal.className = 'ad-playing';
      adModal.innerHTML = `
        <div class="ad-playing-content">
          <div class="ad-progress">
            <div class="ad-progress-bar" style="width: 0%"></div>
          </div>
          <p>Advertisement - ${Math.ceil(adDuration / 1000)} seconds</p>
        </div>
      `;
      document.body.appendChild(adModal);
      
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 100;
        const progressBar = adModal.querySelector('.ad-progress-bar');
        if (progressBar) progressBar.style.width = `${(progress / adDuration) * 100}%`;
        
        if (progress >= adDuration) {
          clearInterval(progressInterval);
          adModal.remove();
          if (callback) callback(true);
          this.addRewardPoints(10);
        }
      }, 100);
    };
    
    modal.querySelector('.cancel-btn').onclick = () => {
      clearInterval(interval);
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
      if (callback) callback(false);
    };
  }

  // 2. Sponsored Game Cards
  renderSponsoredCard(game) {
    if (!game.isSponsored) return '';
    
    this.trackSponsoredImpression(game.id);
    
    return `
      <div class="game-card sponsored-card" data-sponsored="true" data-game-id="${game.id}">
        <div class="sponsored-badge">
          <span class="sponsored-icon">💎</span>
          <span>Sponsored</span>
        </div>
        <div class="card-media">
          <img src="${game.images?.[0] || game.image}" alt="${game.name}" loading="lazy">
        </div>
        <div class="card-content">
          <h3>${game.name}</h3>
          <p>${game.shortDesc}</p>
          <button class="btn-primary sponsored-play" data-game-id="${game.id}">
            Play Now →
          </button>
        </div>
      </div>
    `;
  }

  // 3. Affiliate Links
  getAffiliateLink(game) {
    if (game.affiliateLink) {
      this.trackAffiliateClick(game.id);
      return game.affiliateLink;
    }
    
    // Generate affiliate link for app stores
    if (game.appStoreId) {
      return `https://play.google.com/store/apps/details?id=${game.appStoreId}&referrer=utm_source=gameverse&utm_medium=affiliate`;
    }
    
    return game.downloadLink || '#';
  }

  // 4. Premium Featured Games (Paid Promotion)
  getPremiumGames() {
    // These would be games that paid for premium placement
    const premiumGames = this.sponsoredGames.filter(g => g.premiumTier === 'premium');
    
    // Sort by premium tier (platinum > gold > silver)
    const tierOrder = { platinum: 4, gold: 3, silver: 2, bronze: 1 };
    return premiumGames.sort((a, b) => (tierOrder[b.premiumTier] || 0) - (tierOrder[a.premiumTier] || 0));
  }

  renderPremiumSection() {
    const premiumGames = this.getPremiumGames();
    if (!premiumGames.length) return '';
    
    return `
      <div class="premium-section">
        <div class="section-header">
          <h2 class="section-title">✨ Premium Picks</h2>
          <span class="premium-badge">Featured</span>
        </div>
        <div class="scroll-row premium-row">
          ${premiumGames.map(game => this.renderPremiumCard(game)).join('')}
        </div>
      </div>
    `;
  }

  renderPremiumCard(game) {
    return `
      <div class="game-card premium-card premium-${game.premiumTier}">
        <div class="premium-ribbon">${game.premiumTier.toUpperCase()}</div>
        <div class="card-media">
          <img src="${game.images?.[0] || game.image}" alt="${game.name}">
          <div class="premium-overlay">
            <button class="btn-primary" onclick="monetization.trackPremiumClick('${game.id}')">
              Featured Game →
            </button>
          </div>
        </div>
        <div class="card-content">
          <h3>${game.name}</h3>
          <p>${game.shortDesc}</p>
        </div>
      </div>
    `;
  }

  // 5. Engagement-Based Ad Display
  shouldShowAd(userEngagement) {
    // Show ads based on user engagement level
    const lastAdTime = localStorage.getItem('last_ad_time') || 0;
    const timeSinceLastAd = Date.now() - lastAdTime;
    
    // Don't show ads too frequently (minimum 2 minutes between ads)
    if (timeSinceLastAd < 120000) return false;
    
    // Show ads based on engagement score
    const engagementScore = this.calculateEngagementScore(userEngagement);
    
    // More engaged users see fewer ads
    const adProbability = Math.max(0.1, Math.min(0.5, 0.5 - (engagementScore / 200)));
    
    const shouldShow = Math.random() < adProbability;
    
    if (shouldShow) {
      localStorage.setItem('last_ad_time', Date.now().toString());
    }
    
    return shouldShow;
  }

  calculateEngagementScore(userEngagement) {
    let score = 0;
    
    // Daily active user
    if (userEngagement.dailyActive) score += 20;
    
    // Session duration
    if (userEngagement.sessionDuration > 300) score += 15;
    if (userEngagement.sessionDuration > 600) score += 25;
    
    // Games played
    score += Math.min(userEngagement.gamesPlayed * 2, 30);
    
    // Favorites
    score += userEngagement.favoritesCount * 3;
    
    // Comments/Reviews
    score += userEngagement.commentsCount * 2;
    
    // Shares
    score += userEngagement.sharesCount * 5;
    
    return Math.min(score, 100);
  }

  // 6. Download Tracking Clicks
  trackDownload(gameId, source = 'direct') {
    const downloads = JSON.parse(localStorage.getItem('game_downloads') || '{}');
    downloads[gameId] = (downloads[gameId] || 0) + 1;
    localStorage.setItem('game_downloads', JSON.stringify(downloads));
    
    // Track revenue from affiliate
    this.trackAffiliateConversion(gameId, source);
    
    // Analytics
    this.trackEvent('download', { gameId, source });
    
    console.log(`Download tracked for game ${gameId} from ${source}`);
  }

  // 7. Revenue Tracking
  trackAdImpression(adId) {
    const impressions = this.adImpressions.get(adId) || 0;
    this.adImpressions.set(adId, impressions + 1);
    
    // Calculate estimated revenue (CPM model)
    const ad = this.ads.find(a => a.id === adId);
    if (ad && ad.cpm) {
      const revenue = (ad.cpm / 1000);
      this.revenue.total += revenue;
      this.revenue.byType.ads += revenue;
    }
    
    this.saveRevenueData();
  }

  trackAdClick(adId) {
    const clicks = this.adClicks.get(adId) || 0;
    this.adClicks.set(adId, clicks + 1);
    
    // Calculate estimated revenue (CPC model)
    const ad = this.ads.find(a => a.id === adId);
    if (ad && ad.cpc) {
      this.revenue.total += ad.cpc;
      this.revenue.byType.ads += ad.cpc;
    }
    
    this.saveRevenueData();
    
    // Track for analytics
    this.trackEvent('ad_click', { adId });
  }

  trackAffiliateClick(gameId) {
    const clicks = JSON.parse(localStorage.getItem('affiliate_clicks') || '{}');
    clicks[gameId] = (clicks[gameId] || 0) + 1;
    localStorage.setItem('affiliate_clicks', JSON.stringify(clicks));
    
    this.trackEvent('affiliate_click', { gameId });
  }

  trackAffiliateConversion(gameId, source) {
    // Estimated affiliate commission (e.g., 5% of typical game price)
    const estimatedCommission = 1.50;
    this.revenue.total += estimatedCommission;
    this.revenue.byType.affiliate += estimatedCommission;
    
    const conversions = JSON.parse(localStorage.getItem('affiliate_conversions') || '{}');
    conversions[gameId] = (conversions[gameId] || 0) + 1;
    localStorage.setItem('affiliate_conversions', JSON.stringify(conversions));
    
    this.saveRevenueData();
    this.trackEvent('affiliate_conversion', { gameId, source });
  }

  trackSponsoredImpression(gameId) {
    const impressions = JSON.parse(localStorage.getItem('sponsored_impressions') || '{}');
    impressions[gameId] = (impressions[gameId] || 0) + 1;
    localStorage.setItem('sponsored_impressions', JSON.stringify(impressions));
  }

  trackPremiumClick(gameId) {
    const clicks = JSON.parse(localStorage.getItem('premium_clicks') || '{}');
    clicks[gameId] = (clicks[gameId] || 0) + 1;
    localStorage.setItem('premium_clicks', JSON.stringify(clicks));
    
    // Premium games pay per click (e.g., $0.10 per click)
    this.revenue.total += 0.10;
    this.revenue.byType.sponsored += 0.10;
    
    this.saveRevenueData();
    this.trackEvent('premium_click', { gameId });
  }

  // 8. Reward System for Ad Engagement
  addRewardPoints(points, reason = 'ad_watch') {
    let currentPoints = parseInt(localStorage.getItem('user_reward_points') || '0');
    currentPoints += points;
    localStorage.setItem('user_reward_points', currentPoints.toString());
    
    // Track reward history
    const history = JSON.parse(localStorage.getItem('reward_history') || '[]');
    history.push({ points, reason, timestamp: Date.now() });
    if (history.length > 50) history.shift();
    localStorage.setItem('reward_history', JSON.stringify(history));
    
    this.showRewardNotification(points, reason);
    
    return currentPoints;
  }

  showRewardNotification(points, reason) {
    const notification = document.createElement('div');
    notification.className = 'reward-notification';
    notification.innerHTML = `
      <div class="reward-content">
        <span class="reward-icon">🎁</span>
        <div>
          <strong>+${points} Points!</strong>
          <small>Earned from ${reason.replace('_', ' ')}</small>
        </div>
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }, 100);
  }

  getUserRewards() {
    return {
      points: parseInt(localStorage.getItem('user_reward_points') || '0'),
      history: JSON.parse(localStorage.getItem('reward_history') || '[]'),
      level: this.calculateRewardLevel()
    };
  }

  calculateRewardLevel() {
    const points = parseInt(localStorage.getItem('user_reward_points') || '0');
    if (points >= 1000) return { level: 'Platinum', multiplier: 2.0 };
    if (points >= 500) return { level: 'Gold', multiplier: 1.5 };
    if (points >= 200) return { level: 'Silver', multiplier: 1.2 };
    if (points >= 50) return { level: 'Bronze', multiplier: 1.0 };
    return { level: 'Starter', multiplier: 0.8 };
  }

  // 9. Revenue Dashboard
  saveRevenueData() {
    const revenueData = {
      total: this.revenue.total,
      byType: this.revenue.byType,
      adImpressions: Object.fromEntries(this.adImpressions),
      adClicks: Object.fromEntries(this.adClicks),
      timestamp: Date.now()
    };
    localStorage.setItem('revenue_data', JSON.stringify(revenueData));
  }

  getRevenueReport() {
    const revenueData = JSON.parse(localStorage.getItem('revenue_data') || '{}');
    const userRewards = this.getUserRewards();
    
    return {
      totalRevenue: this.revenue.total,
      estimatedMonthly: this.revenue.total * 30, // Rough estimate
      breakdown: this.revenue.byType,
      adPerformance: {
        impressions: Object.values(this.adImpressions).reduce((a, b) => a + b, 0),
        clicks: Object.values(this.adClicks).reduce((a, b) => a + b, 0),
        ctr: this.calculateCTR()
      },
      userRewards,
      topPerformingAds: this.getTopPerformingAds()
    };
  }

  calculateCTR() {
    const totalImpressions = Object.values(this.adImpressions).reduce((a, b) => a + b, 0);
    const totalClicks = Object.values(this.adClicks).reduce((a, b) => a + b, 0);
    return totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  }

  getTopPerformingAds(limit = 5) {
    const adPerformance = [];
    
    for (const [adId, impressions] of this.adImpressions) {
      const clicks = this.adClicks.get(adId) || 0;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      adPerformance.push({ adId, impressions, clicks, ctr });
    }
    
    return adPerformance.sort((a, b) => b.ctr - a.ctr).slice(0, limit);
  }

  // 10. Ad Refresh and Optimization
  setupAdRefresh() {
    // Refresh ads every 30 seconds on page
    setInterval(() => {
      this.refreshAds();
    }, 30000);
  }

  refreshAds() {
    const adContainers = document.querySelectorAll('[data-ad-id]');
    adContainers.forEach(container => {
      const newAd = this.getRandomAd(container.dataset.adType);
      if (newAd) {
        this.updateAdContainer(container, newAd);
      }
    });
  }

  updateAdContainer(container, ad) {
    // Update ad content without page refresh
    const link = container.querySelector('a');
    const img = container.querySelector('img');
    
    if (link) link.href = ad.link;
    if (img) img.src = ad.image;
    
    container.dataset.adId = ad.id;
    this.trackAdImpression(ad.id);
  }

  getRandomAd(type = null) {
    let availableAds = this.ads;
    if (type) {
      availableAds = this.ads.filter(ad => ad.type === type);
    }
    
    if (!availableAds.length) return null;
    return availableAds[Math.floor(Math.random() * availableAds.length)];
  }

  // 11. Ad Blocker Detection
  detectAdBlocker() {
    return new Promise((resolve) => {
      const testAd = document.createElement('div');
      testAd.className = 'ad-test';
      testAd.innerHTML = '&nbsp;';
      testAd.style.position = 'absolute';
      testAd.style.top = '-1000px';
      testAd.style.left = '-1000px';
      document.body.appendChild(testAd);
      
      setTimeout(() => {
        const isBlocked = testAd.offsetHeight === 0;
        document.body.removeChild(testAd);
        
        if (isBlocked) {
          this.handleAdBlocker();
        }
        
        resolve(isBlocked);
      }, 100);
    });
  }

  handleAdBlocker() {
    const message = document.createElement('div');
    message.className = 'adblocker-message';
    message.innerHTML = `
      <div class="adblocker-content">
        <h3>🛡️ Ad Blocker Detected</h3>
        <p>Please disable your ad blocker to support our platform and keep GameVerse free!</p>
        <button onclick="this.parentElement.parentElement.remove()">I've disabled it</button>
      </div>
    `;
    document.body.appendChild(message);
  }

  // 12. Subscription Model (Premium)
  initPremiumSubscription() {
    const premiumStatus = this.getPremiumStatus();
    
    if (!premiumStatus.active) {
      this.showPremiumOffer();
    }
  }

  getPremiumStatus() {
    const subscription = JSON.parse(localStorage.getItem('premium_subscription') || '{}');
    const isActive = subscription.expiry && subscription.expiry > Date.now();
    
    return {
      active: isActive,
      tier: subscription.tier || 'free',
      expiry: subscription.expiry || null,
      features: this.getPremiumFeatures(subscription.tier)
    };
  }

  getPremiumFeatures(tier) {
    const features = {
      free: ['Basic game access', 'Limited ads', 'Standard support'],
      plus: ['No ads', 'Early access to games', 'Priority support', 'Exclusive badges'],
      pro: ['Everything in Plus', 'Monthly rewards', 'Game analytics', 'Custom profile', 'Beta access']
    };
    
    return features[tier] || features.free;
  }

  showPremiumOffer() {
    // Show premium upsell after certain actions
    const gamePlays = Object.values(JSON.parse(localStorage.getItem('gamehub_plays') || '{}'))
      .reduce((a, b) => a + b, 0);
    
    if (gamePlays > 20 && !localStorage.getItem('premium_offer_shown')) {
      const modal = document.createElement('div');
      modal.className = 'premium-offer modal';
      modal.innerHTML = `
        <div class="modal-content premium-offer-content">
          <h2>✨ Go Premium ✨</h2>
          <p>You've played ${gamePlays} games! Upgrade to Premium for:</p>
          <ul>
            <li>🚫 No ads</li>
            <li>🎮 Early access to new games</li>
            <li>🏆 Exclusive achievements</li>
            <li>📊 Personal gaming analytics</li>
          </ul>
          <div class="pricing">
            <div class="price-card">
              <h4>Monthly</h4>
              <div class="price">$4.99</div>
              <button class="btn-primary" onclick="monetization.startCheckout('monthly')">Subscribe</button>
            </div>
            <div class="price-card featured">
              <h4>Yearly</h4>
              <div class="price">$39.99</div>
              <div class="save">Save 33%</div>
              <button class="btn-primary" onclick="monetization.startCheckout('yearly')">Subscribe</button>
            </div>
          </div>
          <button class="btn-secondary" onclick="this.closest('.modal').remove()">Maybe Later</button>
        </div>
      `;
      document.body.appendChild(modal);
      modal.classList.add('active');
      localStorage.setItem('premium_offer_shown', 'true');
    }
  }

  startCheckout(plan) {
    // Simulate checkout process
    this.trackEvent('checkout_start', { plan });
    
    // In production, integrate with Stripe/PayPal
    alert(`Premium ${plan} subscription - Demo mode\nIn production, this would integrate with Stripe/PayPal.`);
    
    // Simulate successful payment
    setTimeout(() => {
      const expiry = new Date();
      if (plan === 'monthly') expiry.setMonth(expiry.getMonth() + 1);
      else expiry.setFullYear(expiry.getFullYear() + 1);
      
      localStorage.setItem('premium_subscription', JSON.stringify({
        active: true,
        tier: plan === 'yearly' ? 'pro' : 'plus',
        expiry: expiry.getTime(),
        startDate: Date.now()
      }));
      
      this.trackEvent('checkout_success', { plan });
      location.reload();
    }, 2000);
  }

  // 13. Analytics Tracking
  trackEvent(eventName, eventData = {}) {
    const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
    events.push({
      name: eventName,
      data: eventData,
      timestamp: Date.now(),
      userId: this.getUserId()
    });
    
    // Keep last 1000 events
    if (events.length > 1000) events.shift();
    localStorage.setItem('analytics_events', JSON.stringify(events));
    
    // Send to analytics service (if configured)
    if (window.gtag) {
      window.gtag('event', eventName, eventData);
    }
  }

  getUserId() {
    let userId = localStorage.getItem('user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('user_id', userId);
    }
    return userId;
  }

  // 14. A/B Testing for Ad Placements
  getAdPlacementStrategy() {
    const testName = 'ad_placement';
    let variant = localStorage.getItem(`ab_${testName}`);
    
    if (!variant) {
      const variants = ['sidebar', 'inline', 'popup', 'banner'];
      variant = variants[Math.floor(Math.random() * variants.length)];
      localStorage.setItem(`ab_${testName}`, variant);
    }
    
    return variant;
  }

  // 15. Revenue Optimization
  optimizeRevenue() {
    // Analyze best performing ad placements
    const placements = ['sidebar', 'inline', 'popup', 'banner'];
    const performance = {};
    
    placements.forEach(placement => {
      const clicks = parseInt(localStorage.getItem(`ad_clicks_${placement}`) || '0');
      const impressions = parseInt(localStorage.getItem(`ad_impressions_${placement}`) || '1');
      performance[placement] = clicks / impressions;
    });
    
    // Return best performing placement
    return Object.entries(performance).sort((a, b) => b[1] - a[1])[0]?.[0] || 'inline';
  }
}

// Initialize monetization
const monetization = new MonetizationManager();
window.monetization = monetization;

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = monetization;
}