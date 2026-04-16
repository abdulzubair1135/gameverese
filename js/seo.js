// ============ PART 6: SEO OPTIMIZATION ============

class SEOManager {
  constructor() {
    this.setupMetaTags();
    this.setupOpenGraph();
    this.setupStructuredData();
    this.setupDynamicTitles();
    this.setupSitemap();
    this.setupRobotsTxt();
    this.trackCoreWebVitals();
  }

  // 1. Meta Tags
  setupMetaTags() {
    const metaTags = {
      'description': 'GameVerse - Play the best free online games. Trending games, new releases, and classic favorites. No download required!',
      'keywords': 'free games, online games, play games, gaming platform, trending games, browser games',
      'author': 'GameVerse',
      'viewport': 'width=device-width, initial-scale=1.0',
      'theme-color': '#0f172a',
      'msapplication-TileColor': '#0f172a'
    };
    
    for (const [name, content] of Object.entries(metaTags)) {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    }
  }

  // 2. Open Graph Tags
  setupOpenGraph() {
    const ogTags = {
      'og:title': 'GameVerse - Premium Gaming Platform',
      'og:description': 'Play trending games online for free. No download required!',
      'og:type': 'website',
      'og:url': window.location.origin,
      'og:image': `${window.location.origin}/og-image.jpg`,
      'og:site_name': 'GameVerse',
      'og:locale': 'en_US',
      'fb:app_id': '1234567890'
    };
    
    for (const [property, content] of Object.entries(ogTags)) {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    }
  }

  // 3. Twitter Card Tags
  setupTwitterCards() {
    const twitterTags = {
      'twitter:card': 'summary_large_image',
      'twitter:title': 'GameVerse - Premium Gaming Platform',
      'twitter:description': 'Play trending games online for free!',
      'twitter:image': `${window.location.origin}/twitter-image.jpg`,
      'twitter:site': '@gameverse'
    };
    
    for (const [name, content] of Object.entries(twitterTags)) {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    }
  }

  // 4. Structured Data (JSON-LD)
  setupStructuredData() {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'GameVerse',
      'url': window.location.origin,
      'description': 'Free online gaming platform with trending games',
      'potentialAction': {
        '@type': 'SearchAction',
        'target': `${window.location.origin}/?search={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    };
    
    this.addStructuredData(structuredData);
  }

  addGameStructuredData(game) {
    const gameData = {
      '@context': 'https://schema.org',
      '@type': 'VideoGame',
      'name': game.name,
      'description': game.longDesc || game.desc,
      'url': `${window.location.origin}#game-${game.id}`,
      'image': game.images?.[0] || game.image,
      'genre': game.category,
      'keywords': game.tags?.join(', '),
      'datePublished': game.releaseDate || '2024-01-01',
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': game.rating || 4.5,
        'ratingCount': game.likes || 100
      },
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD',
        'availability': 'https://schema.org/OnlineOnly'
      },
      'applicationCategory': 'Game',
      'operatingSystem': 'All'
    };
    
    this.addStructuredData(gameData);
  }

  addStructuredData(data) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  // 5. Dynamic Page Titles
  setupDynamicTitles() {
    const defaultTitle = 'GameVerse - Premium Gaming Platform';
    
    // Observe route changes
    const observer = new MutationObserver(() => {
      this.updatePageTitle();
    });
    
    observer.observe(document.querySelector('#app'), {
      childList: true,
      subtree: true
    });
    
    // Handle hash changes
    window.addEventListener('hashchange', () => {
      this.updatePageTitle();
    });
  }

  updatePageTitle() {
    const hash = window.location.hash;
    const defaultTitle = 'GameVerse - Premium Gaming Platform';
    
    if (hash && hash.startsWith('#game-')) {
      const gameId = hash.replace('#game-', '');
      this.setGameTitle(gameId);
    } else {
      document.title = defaultTitle;
    }
  }

  async setGameTitle(gameId) {
    try {
      const response = await fetch('/games.json');
      const games = await response.json();
      const game = games.find(g => g.id == gameId);
      
      if (game) {
        document.title = `${game.name} | Play Free Online Game | GameVerse`;
        
        // Update meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          metaDesc.content = `Play ${game.name} online for free. ${game.desc} ${game.tags?.join(', ')} games available. No download required!`;
        }
        
        // Add game structured data
        this.addGameStructuredData(game);
      }
    } catch (error) {
      console.error('Failed to set game title:', error);
    }
  }

  // 6. Sitemap Generation
  setupSitemap() {
    // Generate sitemap dynamically
    this.generateSitemap();
    
    // Add sitemap link to robots.txt
    const link = document.createElement('link');
    link.rel = 'sitemap';
    link.type = 'application/xml';
    link.title = 'Sitemap';
    link.href = '/sitemap.xml';
    document.head.appendChild(link);
  }

  async generateSitemap() {
    const baseUrl = window.location.origin;
    const games = await fetch('/games.json').then(r => r.json());
    
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Homepage
    sitemap += `
      <url>
        <loc>${baseUrl}/</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>
    `;
    
    // Game pages
    games.forEach(game => {
      sitemap += `
        <url>
          <loc>${baseUrl}/#game-${game.id}</loc>
          <lastmod>${game.releaseDate || new Date().toISOString().split('T')[0]}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>
      `;
    });
    
    // Category pages
    const categories = ['action', 'racing', 'fps', 'casual', 'adventure', 'simulation'];
    categories.forEach(category => {
      sitemap += `
        <url>
          <loc>${baseUrl}/?category=${category}</loc>
          <changefreq>weekly</changefreq>
          <priority>0.6</priority>
        </url>
      `;
    });
    
    sitemap += '</urlset>';
    
    // Store sitemap in localStorage for serving
    localStorage.setItem('sitemap', sitemap);
    
    // Create blob URL for sitemap
    const blob = new Blob([sitemap], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    
    // Add link tag
    const link = document.querySelector('link[rel="sitemap"]');
    if (link) link.href = url;
  }

  // 7. Robots.txt Optimization
  setupRobotsTxt() {
    const robots = `
      User-agent: *
      Allow: /
      Disallow: /private/
      Disallow: /admin/
      
      Sitemap: ${window.location.origin}/sitemap.xml
      
      # Crawl delay for large sites
      Crawl-delay: 1
      
      # Host
      Host: ${window.location.host}
    `;
    
    // Create robots.txt blob
    const blob = new Blob([robots], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Add link tag
    let link = document.querySelector('link[rel="robots"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'robots';
      document.head.appendChild(link);
    }
    link.href = url;
  }

  // 8. Core Web Vitals Tracking
  trackCoreWebVitals() {
    if ('webVitals' in window) {
      // LCP (Largest Contentful Paint)
      this.trackLCP();
      
      // FID (First Input Delay)
      this.trackFID();
      
      // CLS (Cumulative Layout Shift)
      this.trackCLS();
      
      // FCP (First Contentful Paint)
      this.trackFCP();
      
      // TTFB (Time to First Byte)
      this.trackTTFB();
    }
  }

  trackLCP() {
    if (!window.PerformanceObserver) return;
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      this.reportMetric('LCP', lastEntry.startTime);
    });
    
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  trackFID() {
    if (!window.PerformanceObserver) return;
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        this.reportMetric('FID', entry.processingStart - entry.startTime);
      });
    });
    
    observer.observe({ entryTypes: ['first-input'] });
  }

  trackCLS() {
    if (!window.PerformanceObserver) return;
    
    let clsValue = 0;
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          this.reportMetric('CLS', clsValue);
        }
      });
    });
    
    observer.observe({ entryTypes: ['layout-shift'] });
  }

  trackFCP() {
    if (!window.PerformanceObserver) return;
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        this.reportMetric('FCP', entry.startTime);
      });
    });
    
    observer.observe({ entryTypes: ['paint'] });
  }

  trackTTFB() {
    if (!window.performance) return;
    
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.requestStart;
      this.reportMetric('TTFB', ttfb);
    }
  }

  reportMetric(metricName, value) {
    console.log(`Web Vital - ${metricName}: ${Math.round(value)}ms`);
    
    // Store metrics
    const metrics = JSON.parse(localStorage.getItem('web_vitals') || '{}');
    metrics[metricName] = metrics[metricName] || [];
    metrics[metricName].push({ value, timestamp: Date.now() });
    
    // Keep last 100 measurements
    if (metrics[metricName].length > 100) metrics[metricName].shift();
    
    localStorage.setItem('web_vitals', JSON.stringify(metrics));
    
    // Send to analytics (if configured)
    if (window.gtag) {
      window.gtag('event', 'web_vital', {
        metric_name: metricName,
        metric_value: value
      });
    }
  }

  // 9. SEO-Friendly URLs
  setupSEOFriendlyURLs() {
    // Handle pushState for clean URLs
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function() {
      originalPushState.apply(this, arguments);
      window.dispatchEvent(new Event('pushstate'));
      window.dispatchEvent(new Event('locationchange'));
    };
    
    history.replaceState = function() {
      originalReplaceState.apply(this, arguments);
      window.dispatchEvent(new Event('replacestate'));
      window.dispatchEvent(new Event('locationchange'));
    };
    
    window.addEventListener('popstate', () => {
      window.dispatchEvent(new Event('locationchange'));
    });
    
    // Update canonical URL
    window.addEventListener('locationchange', () => {
      this.updateCanonicalURL();
    });
  }

  updateCanonicalURL() {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href.split('#')[0];
  }

  // 10. Breadcrumb Structured Data
  addBreadcrumbStructuredData(path) {
    const items = path.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url
    }));
    
    const breadcrumbData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': items
    };
    
    this.addStructuredData(breadcrumbData);
  }

  // 11. FAQ Structured Data
  addFAQStructuredData(faqs) {
    const faqData = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': faqs.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer
        }
      }))
    };
    
    this.addStructuredData(faqData);
  }

  // 12. Organization Structured Data
  addOrganizationStructuredData() {
    const orgData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'GameVerse',
      'url': window.location.origin,
      'logo': `${window.location.origin}/logo.png`,
      'sameAs': [
        'https://facebook.com/gameverse',
        'https://twitter.com/gameverse',
        'https://instagram.com/gameverse'
      ]
    };
    
    this.addStructuredData(orgData);
  }

  // 13. Semantic HTML Enhancements
  enhanceSemanticHTML() {
    // Ensure proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let currentLevel = 0;
    
    headings.forEach(heading => {
      const level = parseInt(heading.tagName[1]);
      if (level === 1 && currentLevel === 0) {
        currentLevel = 1;
      } else if (level > currentLevel + 1) {
        // Fix heading hierarchy
        heading.setAttribute('aria-level', currentLevel + 1);
      }
    });
    
    // Add main landmark
    const main = document.querySelector('main');
    if (main) {
      main.setAttribute('role', 'main');
    }
    
    // Add navigation landmark
    const nav = document.querySelector('nav');
    if (nav) {
      nav.setAttribute('role', 'navigation');
      nav.setAttribute('aria-label', 'Main navigation');
    }
  }

  // 14. Image Alt Text Optimization
  optimizeImageAltText() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.alt || img.alt === '') {
        // Generate alt text from filename or context
        const src = img.src;
        const filename = src.split('/').pop().split('.')[0];
        img.alt = `${filename.replace(/[-_]/g, ' ')} game screenshot`;
      }
    });
  }

  // 15. Internal Linking Structure
  optimizeInternalLinks() {
    const links = document.querySelectorAll('a');
    links.forEach(link => {
      if (link.href && link.href.includes(window.location.origin)) {
        // Internal link
        if (!link.getAttribute('rel')) {
          link.setAttribute('rel', 'internal');
        }
      } else if (link.href && !link.href.startsWith('#')) {
        // External link
        link.setAttribute('rel', 'noopener noreferrer');
        if (!link.getAttribute('target')) {
          link.setAttribute('target', '_blank');
        }
      }
    });
  }
}

// Initialize SEO
const seo = new SEOManager();
window.seo = seo;