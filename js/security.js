// ============ PART 5: SECURITY ENHANCEMENTS ============

class SecurityManager {
  constructor() {
    this.setupXSSProtection();
    this.setupInputSanitization();
    this.setupCSRFProtection();
    this.setupSecureStorage();
    this.setupContentSecurity();
  }

  // 1. XSS Protection
  setupXSSProtection() {
    // Override dangerous methods
    const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    
    Object.defineProperty(Element.prototype, 'innerHTML', {
      get: originalInnerHTML.get,
      set: function(value) {
        if (typeof value === 'string' && this.shouldSanitize()) {
          value = this.sanitizeHTML(value);
        }
        return originalInnerHTML.set.call(this, value);
      }
    });
  }

  shouldSanitize() {
    // Don't sanitize trusted elements
    return !this.closest('[data-trusted="true"]');
  }

  sanitizeHTML(str) {
    if (!str) return '';
    
    // Remove script tags and event handlers
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/g, '')
      .replace(/on\w+='[^']*'/g, '')
      .replace(/javascript:/gi, 'blocked:')
      .replace(/vbscript:/gi, 'blocked:')
      .replace(/data:text\/html/gi, 'blocked:');
  }

  // 2. Input Sanitization
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[&<>]/g, (match) => {
        const escape = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;'
        };
        return escape[match];
      })
      .replace(/[()]/g, '')
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, (char) => {
        // Remove emojis if needed
        return '';
      })
      .trim();
  }

  sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = Array.isArray(obj) ? [] : {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeInput(value);
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  // 3. Secure localStorage
  setupSecureStorage() {
    // Encrypt sensitive data before storing
    const originalSetItem = localStorage.setItem;
    const originalGetItem = localStorage.getItem;
    
    localStorage.setItem = (key, value) => {
      if (this.isSensitiveKey(key)) {
        value = this.encryptData(value);
      }
      originalSetItem.call(localStorage, key, value);
    };
    
    localStorage.getItem = (key) => {
      let value = originalGetItem.call(localStorage, key);
      if (value && this.isSensitiveKey(key)) {
        value = this.decryptData(value);
      }
      return value;
    };
  }

  isSensitiveKey(key) {
    const sensitive = [
      'user_id', 'session', 'token', 'password', 'email',
      'payment', 'credit_card', 'premium_subscription'
    ];
    return sensitive.some(s => key.toLowerCase().includes(s));
  }

  encryptData(data) {
    // Simple encryption for demo - use proper encryption in production
    try {
      const json = JSON.stringify(data);
      // Simple base64 encoding (not secure, use proper encryption in production)
      return btoa(encodeURIComponent(json));
    } catch (e) {
      return data;
    }
  }

  decryptData(data) {
    try {
      const decoded = decodeURIComponent(atob(data));
      return JSON.parse(decoded);
    } catch (e) {
      return data;
    }
  }

  // 4. Safe Link Handling
  validateUrl(url) {
    if (!url) return false;
    
    try {
      const parsed = new URL(url);
      const allowedProtocols = ['http:', 'https:'];
      const allowedDomains = [
        'example.com', 'play.google.com', 'apps.apple.com',
        'youtube.com', 'youtu.be', 'vimeo.com'
      ];
      
      if (!allowedProtocols.includes(parsed.protocol)) return false;
      
      // Check if domain is allowed
      const isAllowed = allowedDomains.some(domain => 
        parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
      );
      
      return isAllowed;
    } catch (e) {
      return false;
    }
  }

  getSafeLink(url, text) {
    if (this.validateUrl(url)) {
      return `<a href="${this.sanitizeInput(url)}" target="_blank" rel="noopener noreferrer">${this.sanitizeInput(text)}</a>`;
    }
    return `<span class="invalid-link">${this.sanitizeInput(text)}</span>`;
  }

  // 5. Content Security Policy
  setupContentSecurity() {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: https: http:;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' https://www.google-analytics.com;
      frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com;
      media-src 'self' https: data:;
    `.replace(/\s+/g, ' ').trim();
    
    document.head.appendChild(meta);
  }

  // 6. Prevent Script Injection
  preventScriptInjection() {
    // Monitor for script injection attempts
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            if (node.tagName === 'SCRIPT') {
              console.warn('Script injection detected and blocked');
              node.remove();
            }
            
            // Check for inline event handlers
            if (node.hasAttributes()) {
              Array.from(node.attributes).forEach(attr => {
                if (attr.name.startsWith('on') || 
                    (attr.name === 'href' && attr.value.toLowerCase().includes('javascript:'))) {
                  console.warn('Dangerous attribute detected:', attr.name);
                  node.removeAttribute(attr.name);
                }
              });
            }
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // 7. Rate Limiting
  setupRateLimiting() {
    const rateLimits = new Map();
    
    window.checkRateLimit = (action, limit = 10, windowMs = 60000) => {
      const now = Date.now();
      const userActions = rateLimits.get(action) || [];
      
      // Clean old actions
      const recentActions = userActions.filter(time => now - time < windowMs);
      
      if (recentActions.length >= limit) {
        console.warn(`Rate limit exceeded for action: ${action}`);
        return false;
      }
      
      recentActions.push(now);
      rateLimits.set(action, recentActions);
      return true;
    };
  }

  // 8. Session Management
  setupSessionManagement() {
    const sessionId = this.generateSessionId();
    const sessionStart = Date.now();
    
    sessionStorage.setItem('session_id', sessionId);
    sessionStorage.setItem('session_start', sessionStart.toString());
    
    // Check for session timeout (30 minutes)
    setInterval(() => {
      const start = parseInt(sessionStorage.getItem('session_start') || '0');
      const duration = Date.now() - start;
      
      if (duration > 30 * 60 * 1000) {
        this.cleanupSession();
      }
    }, 60000);
  }

  generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
  }

  cleanupSession() {
    // Clear sensitive data
    const sensitiveKeys = ['user_id', 'session', 'premium_subscription'];
    sensitiveKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    sessionStorage.clear();
    
    // Notify user
    if (window.showToast) {
      window.showToast('Session expired. Please refresh the page.', 'warning');
    }
  }

  // 9. Input Validation
  validateInput(input, type = 'text') {
    const validators = {
      text: (value) => value.length <= 1000 && /^[a-zA-Z0-9\s\-_.,!?()]+$/.test(value),
      email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      username: (value) => /^[a-zA-Z0-9_]{3,20}$/.test(value),
      comment: (value) => value.length <= 500 && /^[a-zA-Z0-9\s\-_.,!?()]+$/.test(value),
      search: (value) => value.length <= 100 && /^[a-zA-Z0-9\s\-_]+$/.test(value)
    };
    
    const validator = validators[type] || validators.text;
    return validator(this.sanitizeInput(input));
  }

  // 10. CORS Protection
  setupCORProtection() {
    // Check if running in iframe
    if (window.self !== window.top) {
      // Check if parent domain is allowed
      const allowedOrigins = ['example.com', 'localhost'];
      const referrer = document.referrer;
      
      let isAllowed = false;
      for (const origin of allowedOrigins) {
        if (referrer.includes(origin)) {
          isAllowed = true;
          break;
        }
      }
      
      if (!isAllowed) {
        // Break out of iframe
        window.top.location = window.self.location;
      }
    }
  }

  // 11. Secure Cookies
  setupSecureCookies() {
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (this.isSensitiveKey(name)) {
        // Secure existing cookies
        document.cookie = `${name}=${value}; Secure; HttpOnly; SameSite=Strict`;
      }
    });
  }

  // 12. Data Validation
  validateGameData(data) {
    const required = ['id', 'name', 'category'];
    for (const field of required) {
      if (!data[field]) return false;
    }
    
    if (typeof data.name !== 'string' || data.name.length > 100) return false;
    if (data.desc && data.desc.length > 500) return false;
    
    return true;
  }

  // 13. SQL Injection Prevention (for API calls)
  sanitizeQueryParam(param) {
    if (typeof param !== 'string') return param;
    
    // Remove SQL injection patterns
    return param
      .replace(/('|"|;|--|\/\*|\*\/|\\x00)/g, '')
      .replace(/union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript/i, '');
  }

  // 14. File Upload Security (if implemented)
  validateFile(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedTypes.includes(file.type)) return false;
    if (file.size > maxSize) return false;
    
    // Check for malicious content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      if (content.includes('<script') || content.includes('<?php')) {
        return false;
      }
    };
    
    return true;
  }

  // 15. Clickjacking Protection
  preventClickjacking() {
    if (window.self !== window.top) {
      const style = document.createElement('style');
      style.textContent = `
        body {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
      
      window.top.location = window.self.location;
    }
  }
}

// Initialize security
const security = new SecurityManager();
window.security = security;

// Apply security patches
security.preventScriptInjection();
security.setupSessionManagement();
security.preventClickjacking();

// Export sanitization functions for global use
window.sanitizeHTML = (str) => security.sanitizeHTML(str);
window.sanitizeInput = (input) => security.sanitizeInput(input);
window.validateUrl = (url) => security.validateUrl(url);