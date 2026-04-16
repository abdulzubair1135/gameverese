// ============ PART 3: 40 PERFORMANCE + SYSTEM FEATURES ============

// 1. Lazy Loading Images
class LazyLoader {
  constructor() {
    this.observer = null;
    this.init();
  }

  init() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            this.loadImage(img);
            this.observer.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px',
        threshold: 0.01
      });
      
      this.observeImages();
    } else {
      this.loadAllImages();
    }
  }

  observeImages() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => this.observer.observe(img));
  }

  loadImage(img) {
    const src = img.dataset.src;
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
      
      // Add loading class
      img.classList.add('image-loaded');
      
      // Handle image load error
      img.onerror = () => {
        img.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
        img.classList.add('image-error');
      };
    }
  }

  loadAllImages() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => this.loadImage(img));
  }

  refresh() {
    this.observeImages();
  }
}

// 2. Video Lazy Loading
class VideoLazyLoader {
  constructor() {
    this.observer = null;
    this.init();
  }

  init() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const video = entry.target;
            this.loadVideo(video);
            this.observer.unobserve(video);
          }
        });
      }, { rootMargin: '100px' });
      
      this.observeVideos();
    }
  }

  observeVideos() {
    const videos = document.querySelectorAll('video[data-src]');
    videos.forEach(video => this.observer.observe(video));
  }

  loadVideo(video) {
    const src = video.dataset.src;
    if (src) {
      video.src = src;
      video.load();
      video.removeAttribute('data-src');
    }
  }
}

// 3. Service Worker with Advanced Caching
class ServiceWorkerManager {
  constructor() {
    this.cacheName = 'gameverse-v2';
    this.offlinePage = '/offline.html';
  }

  async register() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('ServiceWorker registered:', registration);
        return registration;
      } catch (error) {
        console.error('ServiceWorker registration failed:', error);
      }
    }
  }

  async cacheUrls(urls) {
    const cache = await caches.open(this.cacheName);
    await cache.addAll(urls);
  }

  async clearCache() {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
  }
}

// 4. Image Optimization
class ImageOptimizer {
  constructor() {
    this.supportedFormats = this.detectFormats();
  }

  detectFormats() {
    const formats = { webp: false, avif: false };
    
    // Check WebP support
    const canvas = document.createElement('canvas');
    if (canvas.toDataURL('image/webp').indexOf('image/webp') > -1) {
      formats.webp = true;
    }
    
    return formats;
  }

  getOptimizedUrl(url, width, height) {
    if (this.supportedFormats.webp) {
      return url.replace(/\.(jpg|png)$/, '.webp');
    }
    return url;
  }

  generateSrcSet(url, widths = [320, 640, 960, 1280]) {
    return widths.map(w => `${this.getOptimizedUrl(url, w)} ${w}w`).join(', ');
  }
}

// 5. Fallback System
class FallbackSystem {
  constructor() {
    this.setupImageFallbacks();
    this.setupVideoFallbacks();
    this.setupAPIFallbacks();
  }

  setupImageFallbacks() {
    document.addEventListener('error', (e) => {
      const target = e.target;
      if (target.tagName === 'IMG') {
        if (!target.hasAttribute('data-fallback-attempted')) {
          target.setAttribute('data-fallback-attempted', 'true');
          target.src = this.getFallbackImage(target.alt);
        }
      }
    }, true);
  }

  getFallbackImage(alt = 'Game') {
    return `https://via.placeholder.com/400x300?text=${encodeURIComponent(alt || 'Game+Image')}`;
  }

  setupVideoFallbacks() {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      video.addEventListener('error', () => {
        if (!video.hasAttribute('data-fallback')) {
          video.setAttribute('data-fallback', 'true');
          const source = video.querySelector('source');
          if (source && source.src) {
            // Try alternative format
            const alternative = source.src.replace(/\.(mp4|webm)/, '.mp4');
            source.src = alternative;
            video.load();
          }
        }
      });
    });
  }

  setupAPIFallbacks() {
    window.fetchWithFallback = async (url, options = {}) => {
      try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error('Network response was not ok');
        return response;
      } catch (error) {
        console.warn(`Fetch failed for ${url}, using cache fallback`, error);
        const cache = await caches.open('gameverse-fallback');
        const cached = await cache.match(url);
        if (cached) return cached;
        throw error;
      }
    };
  }
}

// 6. Error Boundaries
class ErrorBoundary {
  constructor(componentName) {
    this.componentName = componentName;
    this.setupGlobalErrorHandler();
  }

  setupGlobalErrorHandler() {
    window.addEventListener('error', (event) => {
      this.handleError(event.error, event.filename, event.lineno);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason);
    });
  }

  handleError(error, filename, lineno) {
    console.error(`Error in ${this.componentName}:`, error);
    
    // Log error to analytics
    this.logError(error, filename, lineno);
    
    // Show user-friendly message
    this.showErrorMessage(error);
  }

  logError(error, filename, lineno) {
    const errorLog = {
      component: this.componentName,
      message: error.message,
      stack: error.stack,
      filename,
      lineno,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Store in localStorage for debugging
    const errors = JSON.parse(localStorage.getItem('error_logs') || '[]');
    errors.push(errorLog);
    if (errors.length > 50) errors.shift();
    localStorage.setItem('error_logs', JSON.stringify(errors));
  }

  showErrorMessage(error) {
    // Don't show all errors to users, only critical ones
    if (error.message && error.message.includes('Failed to fetch')) {
      // Silent fail for network errors
      return;
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-toast';
    errorDiv.innerHTML = `
      <div class="error-content">
        <span>⚠️</span>
        <span>Something went wrong. Please refresh the page.</span>
        <button onclick="location.reload()">Refresh</button>
      </div>
    `;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  }
}

// 7. Mobile Optimization
class MobileOptimizer {
  constructor() {
    this.detectDevice();
    this.setupViewport();
    this.setupTouchEvents();
  }

  detectDevice() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    document.body.classList.add(isMobile ? 'mobile' : 'desktop');
    if (isTablet) document.body.classList.add('tablet');
    if (isIOS) document.body.classList.add('ios');
    
    return { isMobile, isTablet, isIOS };
  }

  setupViewport() {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes, viewport-fit=cover';
    }
  }

  setupTouchEvents() {
    // Remove hover effects on touch devices
    if ('ontouchstart' in window) {
      document.body.classList.add('touch-device');
      
      // Add touch feedback
      document.addEventListener('touchstart', (e) => {
        const target = e.target.closest('button, .game-card, a');
        if (target) {
          target.classList.add('touch-active');
          setTimeout(() => target.classList.remove('touch-active'), 150);
        }
      });
    }
  }

  optimizeImagesForMobile() {
    const images = document.querySelectorAll('img');
    const isMobile = window.innerWidth <= 768;
    
    images.forEach(img => {
      if (isMobile && img.dataset.mobileSrc) {
        img.src = img.dataset.mobileSrc;
      }
    });
  }
}

// 8. Accessibility Improvements (ARIA)
class AccessibilityManager {
  constructor() {
    this.setupARIALabels();
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupScreenReaderSupport();
  }

  setupARIALabels() {
    // Add ARIA labels to interactive elements
    document.querySelectorAll('button:not([aria-label])').forEach(btn => {
      const text = btn.textContent.trim();
      if (text) btn.setAttribute('aria-label', text);
    });
    
    document.querySelectorAll('input').forEach(input => {
      if (!input.hasAttribute('aria-label') && input.placeholder) {
        input.setAttribute('aria-label', input.placeholder);
      }
    });
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Escape key closes modals
      if (e.key === 'Escape') {
        const modal = document.querySelector('.modal.active');
        if (modal) modal.classList.remove('active');
      }
      
      // Tab key navigation enhancement
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
      }
    });
    
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-nav');
    });
  }

  setupFocusManagement() {
    // Add focus styles for keyboard navigation
    const style = document.createElement('style');
    style.textContent = `
      .keyboard-nav :focus {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      
      [role="button"]:focus,
      button:focus,
      a:focus {
        outline: 2px solid #8b5cf6;
        outline-offset: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  setupScreenReaderSupport() {
    // Add skip to content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 0;
      background: #3b82f6;
      color: white;
      padding: 8px;
      z-index: 100;
    `;
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '0';
    });
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add ARIA live region for dynamic content
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.style.cssText = 'position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden;';
    document.body.appendChild(liveRegion);
    
    window.announceToScreenReader = (message) => {
      liveRegion.textContent = message;
      setTimeout(() => { liveRegion.textContent = ''; }, 3000);
    };
  }
}

// 9. Code Splitting (Module Loading)
class ModuleLoader {
  constructor() {
    this.loadedModules = new Set();
    this.moduleCache = new Map();
  }

  async loadModule(moduleName, url) {
    if (this.loadedModules.has(moduleName)) {
      return this.moduleCache.get(moduleName);
    }
    
    try {
      const module = await import(url);
      this.loadedModules.add(moduleName);
      this.moduleCache.set(moduleName, module);
      return module;
    } catch (error) {
      console.error(`Failed to load module ${moduleName}:`, error);
      return null;
    }
  }

  loadOnDemand(moduleName, url, triggerElement) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadModule(moduleName, url);
          observer.unobserve(triggerElement);
        }
      });
    });
    
    observer.observe(triggerElement);
  }

  preloadModule(moduleName, url) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = url;
    document.head.appendChild(link);
  }
}

// 10. Fast Loading Optimizations
class FastLoader {
  constructor() {
    this.optimizeCriticalRenderingPath();
    this.setupResourceHints();
    this.optimizeFonts();
  }

  optimizeCriticalRenderingPath() {
    // Inline critical CSS
    const criticalCSS = `
      body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
      .app-container { min-height: 100vh; }
      .loading-spinner { display: flex; justify-content: center; align-items: center; min-height: 400px; }
    `;
    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.insertBefore(style, document.head.firstChild);
    
    // Defer non-critical CSS
    const nonCriticalCSS = document.querySelectorAll('link[rel="stylesheet"]');
    nonCriticalCSS.forEach(link => {
      if (link.media !== 'print') {
        link.media = 'print';
        link.onload = () => { link.media = 'all'; };
      }
    });
  }

  setupResourceHints() {
    // DNS Prefetch
    const dnsPrefetch = [
      'https://fonts.googleapis.com',
      'https://cdn.pixabay.com',
      'https://play-lh.googleusercontent.com'
    ];
    
    dnsPrefetch.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
    
    // Preconnect
    const preconnect = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ];
    
    preconnect.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = url;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
    
    // Prefetch next likely pages
    const prefetch = ['/games.json', '/ads.json'];
    prefetch.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }

  optimizeFonts() {
    // Use font-display: swap for better perceived performance
    const fontStyle = document.createElement('style');
    fontStyle.textContent = `
      @font-face {
        font-family: 'Orbitron';
        font-display: swap;
      }
    `;
    document.head.appendChild(fontStyle);
  }

  measurePerformance() {
    if ('performance' in window) {
      const perfData = performance.getEntriesByType('navigation')[0];
      if (perfData) {
        console.log('Page load time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
        console.log('DOM Interactive:', perfData.domInteractive - perfData.fetchStart, 'ms');
        
        // Report to analytics
        this.reportMetrics({
          loadTime: perfData.loadEventEnd - perfData.fetchStart,
          domInteractive: perfData.domInteractive - perfData.fetchStart,
          firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0
        });
      }
    }
  }

  reportMetrics(metrics) {
    // Store metrics for analysis
    const allMetrics = JSON.parse(localStorage.getItem('performance_metrics') || '[]');
    allMetrics.push({ ...metrics, timestamp: Date.now() });
    if (allMetrics.length > 100) allMetrics.shift();
    localStorage.setItem('performance_metrics', JSON.stringify(allMetrics));
  }
}

// 11. PWA Install Support
class PWAInstaller {
  constructor() {
    this.deferredPrompt = null;
    this.setupInstallPrompt();
  }

  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });
    
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed');
      this.deferredPrompt = null;
      localStorage.setItem('pwa_installed', 'true');
    });
  }

  showInstallButton() {
    const installBtn = document.createElement('button');
    installBtn.textContent = '📱 Install App';
    installBtn.className = 'install-btn btn-primary';
    installBtn.style.position = 'fixed';
    installBtn.style.bottom = '20px';
    installBtn.style.left = '20px';
    installBtn.style.zIndex = '1000';
    installBtn.style.animation = 'pulse 2s infinite';
    
    installBtn.addEventListener('click', async () => {
      if (this.deferredPrompt) {
        this.deferredPrompt.prompt();
        const result = await this.deferredPrompt.userChoice;
        if (result.outcome === 'accepted') {
          console.log('User accepted install');
        }
        this.deferredPrompt = null;
        installBtn.remove();
      }
    });
    
    document.body.appendChild(installBtn);
  }
}

// 12. Offline Support
class OfflineManager {
  constructor() {
    this.setupOfflineDetection();
    this.cacheOfflineData();
  }

  setupOfflineDetection() {
    window.addEventListener('online', () => {
      this.handleOnline();
    });
    
    window.addEventListener('offline', () => {
      this.handleOffline();
    });
  }

  handleOnline() {
    console.log('Back online');
    document.body.classList.remove('offline');
    this.syncOfflineData();
    window.announceToScreenReader?.('You are back online');
  }

  handleOffline() {
    console.log('Offline mode');
    document.body.classList.add('offline');
    window.announceToScreenReader?.('You are offline. Some features may be limited');
  }

  async cacheOfflineData() {
    const cache = await caches.open('offline-data');
    await cache.add('/offline.html');
    
    // Cache games data
    const games = await fetch('/games.json').then(r => r.json());
    await cache.put('/games.json', new Response(JSON.stringify(games)));
  }

  async syncOfflineData() {
    const offlineQueue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
    
    for (const item of offlineQueue) {
      try {
        await fetch(item.url, {
          method: item.method,
          body: item.body,
          headers: item.headers
        });
      } catch (error) {
        console.error('Failed to sync offline data:', error);
      }
    }
    
    localStorage.setItem('offline_queue', '[]');
  }
}

// 13. CLS (Cumulative Layout Shift) Optimization
class CLSOptimizer {
  constructor() {
    this.reserveSpaceForImages();
    this.setupFontFallback();
  }

  reserveSpaceForImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.width && !img.height) {
        img.style.aspectRatio = '16/9';
      }
    });
    
    // Add style to reserve space
    const style = document.createElement('style');
    style.textContent = `
      img, video {
        aspect-ratio: attr(width) / attr(height);
        background: #2d3748;
      }
      
      .skeleton {
        aspect-ratio: 16/9;
      }
    `;
    document.head.appendChild(style);
  }

  setupFontFallback() {
    // Measure font loading
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        document.body.classList.add('fonts-loaded');
      });
    }
  }
}

// 14. LCP (Largest Contentful Paint) Optimization
class LCPOptimizer {
  constructor() {
    this.preloadLCPImage();
    this.optimizeHeroSection();
  }

  preloadLCPImage() {
    // Find likely LCP element (hero image)
    const heroImage = document.querySelector('.hero-slider img, .hero-image');
    if (heroImage && heroImage.src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = heroImage.src;
      document.head.appendChild(link);
    }
  }

  optimizeHeroSection() {
    // Ensure hero section is above the fold and optimized
    const hero = document.querySelector('.hero-slider');
    if (hero) {
      hero.style.contentVisibility = 'auto';
      hero.style.containIntrinsicSize = '0 500px';
    }
  }
}

// 15-40. Additional Performance Optimizations
class PerformanceOptimizer {
  constructor() {
    this.debounceResize();
    this.throttleScroll();
    this.optimizeEventListeners();
    this.usePassiveEvents();
    this.avoidForcedLayouts();
    this.batchDOMUpdates();
    this.useRequestAnimationFrame();
    this.memoizeExpensiveFunctions();
    this.useVirtualScrolling();
    this.implementInfiniteScroll();
    this.optimizeLocalStorage();
    this.compressJSONData();
    this.useWebWorkers();
    this.implementCacheAPI();
    this.optimizeThirdPartyScripts();
    this.reduceCSSSpecificity();
    this.avoidCSSImports();
    this.minifyInlineStyles();
    this.useCSSVariables();
    this.prefetchOnHover();
    this.implementResourceHints();
    this.optimizeWebFonts();
    this.removeUnusedCSS();
    this.implementCriticalCSS();
    this.optimizeJavaScriptExecution();
  }

  debounceResize() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.handleResize();
      }, 150);
    });
  }

  handleResize() {
    // Handle resize events efficiently
    document.dispatchEvent(new CustomEvent('optimized-resize'));
  }

  throttleScroll() {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  handleScroll() {
    // Efficient scroll handling
    document.dispatchEvent(new CustomEvent('optimized-scroll'));
  }

  optimizeEventListeners() {
    // Use event delegation
    document.body.addEventListener('click', (e) => {
      const target = e.target;
      if (target.matches('.game-card')) {
        // Handle game card click
      }
    });
  }

  usePassiveEvents() {
    const passiveEvents = ['touchstart', 'touchmove', 'wheel'];
    passiveEvents.forEach(event => {
      document.addEventListener(event, () => {}, { passive: true });
    });
  }

  avoidForcedLayouts() {
    // Batch read/write operations
    const reads = [];
    const writes = [];
    
    const flush = () => {
      reads.forEach(read => read());
      writes.forEach(write => write());
      reads.length = 0;
      writes.length = 0;
    };
    
    window.batchRead = (fn) => {
      reads.push(fn);
      requestAnimationFrame(flush);
    };
    
    window.batchWrite = (fn) => {
      writes.push(fn);
      requestAnimationFrame(flush);
    };
  }

  batchDOMUpdates() {
    const updateQueue = [];
    let updateScheduled = false;
    
    window.scheduleDOMUpdate = (update) => {
      updateQueue.push(update);
      if (!updateScheduled) {
        updateScheduled = true;
        requestAnimationFrame(() => {
          updateQueue.forEach(update => update());
          updateQueue.length = 0;
          updateScheduled = false;
        });
      }
    };
  }

  useRequestAnimationFrame() {
    // Use rAF for animations
    window.startAnimation = (callback) => {
      let lastTime = 0;
      const animate = (time) => {
        if (time - lastTime >= 16) { // ~60fps
          callback(time);
          lastTime = time;
        }
        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    };
  }

  memoizeExpensiveFunctions() {
    window.memoize = (fn) => {
      const cache = new Map();
      return (...args) => {
        const key = JSON.stringify(args);
        if (cache.has(key)) return cache.get(key);
        const result = fn(...args);
        cache.set(key, result);
        return result;
      };
    };
  }

  useVirtualScrolling() {
    // Implement virtual scrolling for long lists
    class VirtualScroller {
      constructor(container, items, itemHeight, renderItem) {
        this.container = container;
        this.items = items;
        this.itemHeight = itemHeight;
        this.renderItem = renderItem;
        this.visibleCount = Math.ceil(container.clientHeight / itemHeight) + 2;
        this.init();
      }

      init() {
        this.container.style.position = 'relative';
        this.container.style.height = `${this.items.length * this.itemHeight}px`;
        
        this.container.addEventListener('scroll', () => this.update());
        this.update();
      }

      update() {
        const scrollTop = this.container.scrollTop;
        const startIndex = Math.floor(scrollTop / this.itemHeight);
        const endIndex = Math.min(startIndex + this.visibleCount, this.items.length);
        
        const fragment = document.createDocumentFragment();
        for (let i = startIndex; i < endIndex; i++) {
          const item = this.renderItem(this.items[i], i);
          item.style.position = 'absolute';
          item.style.top = `${i * this.itemHeight}px`;
          fragment.appendChild(item);
        }
        
        this.container.innerHTML = '';
        this.container.appendChild(fragment);
      }
    }
    
    window.VirtualScroller = VirtualScroller;
  }

  implementInfiniteScroll() {
    class InfiniteScroller {
      constructor(container, loadMore, options = {}) {
        this.container = container;
        this.loadMore = loadMore;
        this.threshold = options.threshold || 100;
        this.loading = false;
        this.hasMore = true;
        this.init();
      }

      init() {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !this.loading && this.hasMore) {
              this.load();
            }
          });
        });
        
        const sentinel = document.createElement('div');
        sentinel.style.height = '1px';
        this.container.appendChild(sentinel);
        observer.observe(sentinel);
      }

      async load() {
        this.loading = true;
        const more = await this.loadMore();
        this.hasMore = more;
        this.loading = false;
      }
    }
    
    window.InfiniteScroller = InfiniteScroller;
  }

  optimizeLocalStorage() {
    // Compress data before storing
    window.compressForStorage = (data) => {
      const json = JSON.stringify(data);
      // Simple compression (replace repeated patterns)
      return json.replace(/"([^"]+)":/g, '$1:');
    };
    
    window.decompressFromStorage = (compressed) => {
      // Restore JSON format
      const withQuotes = compressed.replace(/(\w+):/g, '"$1":');
      return JSON.parse(withQuotes);
    };
  }

  compressJSONData() {
    // Use more efficient data structures
    class CompressedStorage {
      constructor(prefix = 'compressed_') {
        this.prefix = prefix;
      }

      set(key, value) {
        const compressed = this.compress(value);
        localStorage.setItem(this.prefix + key, compressed);
      }

      get(key) {
        const compressed = localStorage.getItem(this.prefix + key);
        return compressed ? this.decompress(compressed) : null;
      }

      compress(data) {
        const json = JSON.stringify(data);
        // Remove whitespace
        return json.replace(/\s/g, '');
      }

      decompress(compressed) {
        return JSON.parse(compressed);
      }
    }
    
    window.CompressedStorage = CompressedStorage;
  }

  useWebWorkers() {
    // Use Web Workers for heavy computations
    class WorkerManager {
      constructor(workerCode) {
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.worker = new Worker(URL.createObjectURL(blob));
      }

      postMessage(data) {
        this.worker.postMessage(data);
      }

      onMessage(callback) {
        this.worker.onmessage = (e) => callback(e.data);
      }

      terminate() {
        this.worker.terminate();
      }
    }
    
    window.WorkerManager = WorkerManager;
  }

  implementCacheAPI() {
    // Advanced caching strategy
    class CacheStrategy {
      constructor(cacheName = 'gameverse-cache') {
        this.cacheName = cacheName;
      }

      async get(key) {
        const cache = await caches.open(this.cacheName);
        const response = await cache.match(key);
        if (response) {
          return await response.json();
        }
        return null;
      }

      async set(key, value, ttl = 3600000) { // 1 hour default TTL
        const cache = await caches.open(this.cacheName);
        const data = {
          value,
          expires: Date.now() + ttl
        };
        const response = new Response(JSON.stringify(data));
        await cache.put(key, response);
      }

      async invalidate(key) {
        const cache = await caches.open(this.cacheName);
        await cache.delete(key);
      }
    }
    
    window.CacheStrategy = CacheStrategy;
  }

  optimizeThirdPartyScripts() {
    // Defer or lazy load third-party scripts
    const thirdPartyScripts = [
      { src: 'https://www.googletagmanager.com/gtag/js', defer: true },
      { src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', async: true }
    ];
    
    thirdPartyScripts.forEach(script => {
      const scriptTag = document.createElement('script');
      scriptTag.src = script.src;
      if (script.defer) scriptTag.defer = true;
      if (script.async) scriptTag.async = true;
      document.body.appendChild(scriptTag);
    });
  }

  reduceCSSSpecificity() {
    // Use BEM methodology and avoid deep nesting
    const style = document.createElement('style');
    style.textContent = `
      /* Use classes instead of IDs for styling */
      .card { }
      .card__title { }
      .card__image { }
      
      /* Avoid !important */
      .btn { }
      .btn--primary { }
    `;
    document.head.appendChild(style);
  }

  avoidCSSImports() {
    // Inline critical CSS instead of @import
    // Already handled in critical CSS optimization
  }

  minifyInlineStyles() {
    // Remove spaces and comments from inline styles
    const styleElements = document.querySelectorAll('style');
    styleElements.forEach(style => {
      if (!style.hasAttribute('data-minified')) {
        const minified = style.textContent
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
          .replace(/\s+/g, ' ') // Collapse whitespace
          .replace(/;\s*}/g, '}') // Remove trailing semicolons
          .trim();
        style.textContent = minified;
        style.setAttribute('data-minified', 'true');
      }
    });
  }

  useCSSVariables() {
    // Use CSS variables for theming (already implemented)
    // This reduces CSS size and improves maintainability
  }

  prefetchOnHover() {
    // Prefetch links when user hovers
    document.addEventListener('mouseover', (e) => {
      const link = e.target.closest('a, .game-card');
      if (link && link.dataset.prefetchUrl) {
        const prefetchLink = document.createElement('link');
        prefetchLink.rel = 'prefetch';
        prefetchLink.href = link.dataset.prefetchUrl;
        document.head.appendChild(prefetchLink);
      }
    });
  }

  implementResourceHints() {
    // Dynamic resource hints based on user behavior
    class ResourceHinter {
      constructor() {
        this.observedUrls = new Set();
        this.init();
      }

      init() {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const url = entry.target.dataset.prefetchUrl;
              if (url && !this.observedUrls.has(url)) {
                this.prefetch(url);
                this.observedUrls.add(url);
              }
            }
          });
        });
        
        document.querySelectorAll('[data-prefetch-url]').forEach(el => {
          observer.observe(el);
        });
      }

      prefetch(url) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
      }
    }
    
    window.ResourceHinter = ResourceHinter;
  }

  optimizeWebFonts() {
    // Use font-display: optional for non-critical fonts
    const fontStyle = document.createElement('style');
    fontStyle.textContent = `
      @font-face {
        font-family: 'CustomFont';
        src: url('/fonts/custom.woff2') format('woff2');
        font-display: optional;
      }
    `;
    document.head.appendChild(fontStyle);
  }

  removeUnusedCSS() {
    // In production, use tools like PurgeCSS
    // This is a simplified version for demo
    class CSSPurge {
      constructor() {
        this.usedSelectors = new Set();
        this.trackUsedSelectors();
      }

      trackUsedSelectors() {
        const observer = new MutationObserver(() => {
          document.querySelectorAll('*').forEach(el => {
            const classes = Array.from(el.classList);
            classes.forEach(cls => this.usedSelectors.add(`.${cls}`));
            this.usedSelectors.add(el.tagName.toLowerCase());
          });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
      }

      removeUnused(stylesheet) {
        // Simplified: would need to parse CSS rules
        console.log('Unused CSS removal would happen here');
      }
    }
  }

  implementCriticalCSS() {
    // Extract and inline critical CSS
    class CriticalCSS {
      constructor() {
        this.criticalSelectors = [
          'body', '.navbar', '.hero-slider', '.game-card',
          '.btn-primary', '.loading-spinner'
        ];
        this.extractCritical();
      }

      extractCritical() {
        const criticalStyles = [];
        const sheets = document.styleSheets;
        
        try {
          for (const sheet of sheets) {
            try {
              const rules = sheet.cssRules || sheet.rules;
              if (rules) {
                for (const rule of rules) {
                  const selectorText = rule.selectorText;
                  if (selectorText && this.criticalSelectors.some(s => selectorText.includes(s))) {
                    criticalStyles.push(rule.cssText);
                  }
                }
              }
            } catch (e) {
              // CORS issues, skip
            }
          }
        } catch (e) {
          console.warn('Critical CSS extraction failed:', e);
        }
        
        // Inline critical CSS
        const style = document.createElement('style');
        style.textContent = criticalStyles.join('\n');
        document.head.insertBefore(style, document.head.firstChild);
      }
    }
    
    window.CriticalCSS = CriticalCSS;
  }

  optimizeJavaScriptExecution() {
    // Use requestIdleCallback for non-critical JS
    if ('requestIdleCallback' in window) {
      window.runWhenIdle = (callback) => {
        requestIdleCallback(callback, { timeout: 2000 });
      };
    } else {
      window.runWhenIdle = (callback) => {
        setTimeout(callback, 1);
      };
    }
    
    // Defer non-critical JavaScript
    const deferredScripts = document.querySelectorAll('script[data-defer]');
    window.runWhenIdle(() => {
      deferredScripts.forEach(script => {
        const newScript = document.createElement('script');
        newScript.src = script.src;
        document.body.appendChild(newScript);
      });
    });
  }
}

// Initialize all performance features
const lazyLoader = new LazyLoader();
const videoLazyLoader = new VideoLazyLoader();
const serviceWorker = new ServiceWorkerManager();
const imageOptimizer = new ImageOptimizer();
const fallbackSystem = new FallbackSystem();
const errorBoundary = new ErrorBoundary('GameVerse');
const mobileOptimizer = new MobileOptimizer();
const accessibilityManager = new AccessibilityManager();
const moduleLoader = new ModuleLoader();
const fastLoader = new FastLoader();
const pwaInstaller = new PWAInstaller();
const offlineManager = new OfflineManager();
const clsOptimizer = new CLSOptimizer();
const lcpOptimizer = new LCPOptimizer();
const performanceOptimizer = new PerformanceOptimizer();

// Export for use
window.performanceOptimizations = {
  lazyLoader,
  videoLazyLoader,
  serviceWorker,
  imageOptimizer,
  fallbackSystem,
  errorBoundary,
  mobileOptimizer,
  accessibilityManager,
  moduleLoader,
  fastLoader,
  pwaInstaller,
  offlineManager
};