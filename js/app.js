// ============ MAIN APP MODULE ============

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isLight = document.body.classList.contains('light');
            const newTheme = isLight ? 'dark' : 'light';
            setTheme(newTheme);
            themeToggle.textContent = newTheme === 'light' ? '☀️ Light' : '🌙 Dark';
            showToast(`${newTheme === 'light' ? '☀️ Light' : '🌙 Dark'} mode activated!`, 'success');
        });
    }
    
    // Cyberpunk Toggle (FIXED - toggles properly)
    const cyberpunkToggle = document.getElementById('cyberpunkToggle');
    if (cyberpunkToggle) {
        cyberpunkToggle.addEventListener('click', () => {
            const isCyberpunk = document.body.classList.contains('cyberpunk');
            
            if (isCyberpunk) {
                // Remove cyberpunk and restore saved theme
                document.body.classList.remove('cyberpunk');
                const savedTheme = getTheme();
                setTheme(savedTheme);
                // Update theme toggle button text
                const themeToggleBtn = document.getElementById('themeToggle');
                if (themeToggleBtn) {
                    themeToggleBtn.textContent = savedTheme === 'light' ? '☀️ Light' : '🌙 Dark';
                }
                showToast('✨ Normal mode restored!', 'success');
            } else {
                // Remove any theme classes first
                document.body.classList.remove('light');
                // Add cyberpunk
                document.body.classList.add('cyberpunk');
                // Save cyberpunk as theme
                setStorage(STORAGE_KEYS.THEME, 'cyberpunk');
                showToast('💜 Cyberpunk mode activated!', 'success');
            }
        });
    }
    
    // Search Input with debounce
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            const query = e.target.value;
            if (query.length > 1) {
                renderSearchResults(query);
            } else if (query.length === 0) {
                renderHome();
            }
        }, 300));
    }
    
    // Sort Select
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', async () => {
            const value = sortSelect.value;
            const games = await fetchGames();
            let sorted = [...games];
            
            switch(value) {
                case 'likes':
                    sorted.sort((a, b) => (getGameLikes(b.id) || 0) - (getGameLikes(a.id) || 0));
                    break;
                case 'views':
                    sorted.sort((a, b) => (getGameViews(b.id) || 0) - (getGameViews(a.id) || 0));
                    break;
                case 'trending':
                    sorted.sort((a, b) => 
                        ((getGameViews(b.id) || 0) + (getGameLikes(b.id) || 0)) - 
                        ((getGameViews(a.id) || 0) + (getGameLikes(a.id) || 0))
                    );
                    break;
                default:
                    renderHome();
                    return;
            }
            renderSortedResults(sorted);
        });
    }
    
    // Category Filter
    const categorySelect = document.getElementById('categorySelect');
    if (categorySelect) {
        categorySelect.addEventListener('change', (e) => {
            renderCategoryFilter(e.target.value);
        });
    }
    
    // Favorites Button
    const favoritesBtn = document.getElementById('favoritesBtn');
    if (favoritesBtn) {
        favoritesBtn.addEventListener('click', showFavorites);
    }
}

/**
 * Render sorted results
 * @param {Array} games - Sorted games array
 */
function renderSortedResults(games) {
    const html = `
        <div class="fade-in">
            <div class="section-header">
                <h2 class="section-title">📋 Sorted Results (${games.length})</h2>
                <button class="btn-secondary" onclick="renderHome()">Reset</button>
            </div>
            <div class="games-grid stagger">
                ${games.map(g => renderGameCard(g)).join('')}
            </div>
        </div>
    `;
    document.getElementById('app').innerHTML = html;
    attachCardEvents();
}

/**
 * Handle client-side routing
 */
function handleRouting() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#game-')) {
        const gameId = hash.replace('#game-', '');
        renderDetail(gameId);
    } else {
        renderHome();
    }
    
    window.addEventListener('hashchange', () => {
        const newHash = window.location.hash;
        if (newHash && newHash.startsWith('#game-')) {
            const gameId = newHash.replace('#game-', '');
            renderDetail(gameId);
        } else {
            renderHome();
        }
    });
}

/**
 * Setup scroll to top button
 */
function setupScrollToTop() {
    const scrollBtn = document.getElementById('scrollTopBtn');
    if (scrollBtn) {
        window.addEventListener('scroll', () => {
            scrollBtn.classList.toggle('visible', window.scrollY > 300);
        });
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

/**
 * Setup progress bar on scroll
 */
function setupProgressBar() {
    window.addEventListener('scroll', () => {
        const winScroll = document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        const progressBar = document.getElementById('progressBar');
        if (progressBar) progressBar.style.width = scrolled + '%';
    });
}

/**
 * Setup cookie consent modal
 */
function setupCookieConsent() {
    const cookieAccepted = getCookie('cookies_accepted');
    const cookieModal = document.getElementById('cookieModal');
    
    if (!cookieAccepted && cookieModal) {
        setTimeout(() => cookieModal.classList.add('active'), 1000);
    }
    
    const acceptBtn = document.getElementById('acceptCookies');
    const rejectBtn = document.getElementById('rejectCookies');
    
    if (acceptBtn) {
        acceptBtn.onclick = () => {
            setCookie('cookies_accepted', 'true', 365);
            cookieModal.classList.remove('active');
            showToast('Cookies accepted! 🍪', 'success');
        };
    }
    
    if (rejectBtn) {
        rejectBtn.onclick = () => {
            cookieModal.classList.remove('active');
            showToast('Cookies rejected', 'info');
        };
    }
}

/**
 * Setup inspect element blocker
 */
function setupInspectBlocker() {
    // Block F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.key === 'u') ||
            (e.ctrlKey && e.key === 's')) {
            e.preventDefault();
            showInspectorMessage();
            return false;
        }
    });
    
    // Block right click
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showInspectorMessage();
        return false;
    });
    
    function showInspectorMessage() {
        const msg = document.createElement('div');
        msg.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #1a1a1a; color: white; padding: 24px 32px; border-radius: 24px; z-index: 10000; text-align: center; box-shadow: 0 0 50px rgba(0,0,0,0.5); border: 1px solid #333;">
                <span style="font-size: 48px;">🔍</span>
                <p style="margin-top: 12px; font-size: 16px;">Why you spying me? 😢</p>
                <button onclick="this.parentElement.remove()" style="margin-top: 16px; padding: 8px 24px; border-radius: 30px; border: none; background: #e50914; color: white; cursor: pointer;">OK 🙏</button>
            </div>
        `;
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 3000);
    }
}

/**
 * Initialize the application
 */
async function initApp() {
    console.log('🎮 Initializing GameVerse...');
    
    // Setup blockers first
    setupInspectBlocker();
    
    // Initialize modules
    await initAds();
    await fetchGames();
    
    // Apply saved theme
    const savedTheme = getTheme();
    setTheme(savedTheme);
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.textContent = savedTheme === 'light' ? '☀️ Light' : '🌙 Dark';
    }
    
    // Setup all event listeners
    setupEventListeners();
    
    // Handle routing
    handleRouting();
    
    // Update favorite count display
    updateFavCountDisplay();
    
    // Setup UI helpers
    setupScrollToTop();
    setupProgressBar();
    setupCookieConsent();
    
    // Update daily streak
    updateDailyStreak();
    
    console.log('✅ GameVerse Ready!');
}

// Start the application
document.addEventListener('DOMContentLoaded', initApp);