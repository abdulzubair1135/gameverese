// MAIN APP MODULE

async function initApp() {
  console.log('🎮 Initializing GameHub...');
  
  await initAds();
  const games = await fetchGames();
  console.log('📊 Total games:', games.length);
  
  const savedTheme = getTheme();
  setTheme(savedTheme);
  document.getElementById('themeToggle').textContent = savedTheme === 'light' ? '☀️' : '🌙';
  
  setupEventListeners();
  handleRouting();
  setupProgressBar();
  setupScrollToTop();
  setupRipple();
  updateFavCount();
  setupSecurity();
  setupCookieConsent();
  
  console.log('✅ GameHub Ready!');
}

function setupEventListeners() {
  document.getElementById('themeToggle').addEventListener('click', () => {
    const isLight = document.body.classList.contains('light');
    const newTheme = isLight ? 'dark' : 'light';
    setTheme(newTheme);
    document.getElementById('themeToggle').textContent = newTheme === 'light' ? '☀️' : '🌙';
  });
  
  document.getElementById('searchInput').addEventListener('input', debounce(handleSearch, 300));
  document.getElementById('sortSelect').addEventListener('change', handleSort);
  document.getElementById('categoryFilter').addEventListener('change', handleCategoryFilter);
  document.getElementById('favoritesBtn').addEventListener('click', showFavorites);
}

async function handleSearch() {
  const query = document.getElementById('searchInput').value;
  if (!query.trim()) {
    renderHome();
    return;
  }
  const results = await searchGames(query);
  renderSearchResults(results);
}

async function handleSort() {
  const sortValue = document.getElementById('sortSelect').value;
  let games = [...allGamesData];
  
  switch(sortValue) {
    case 'trending':
      games = await getTrendingGames(50);
      break;
    case 'likes':
      games.sort((a, b) => (getGameLikes(b.id) || 0) - (getGameLikes(a.id) || 0));
      break;
    case 'views':
      games.sort((a, b) => (getGameViews(b.id) || 0) - (getGameViews(a.id) || 0));
      break;
    case 'recent':
      games.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      break;
  }
  renderSearchResults(games);
}

async function handleCategoryFilter() {
  const category = document.getElementById('categoryFilter').value;
  const filtered = await filterByCategory(category);
  renderSearchResults(filtered);
}

function renderSearchResults(games) {
  const app = document.getElementById('app');
  if (!games.length) {
    app.innerHTML = `<div class="app-container" style="text-align:center; padding:60px"><h2>😢 No games found</h2><button class="btn-primary" onclick="renderHome()">Back to Home</button></div>`;
    return;
  }
  app.innerHTML = `<div class="app-container fade"><div class="section-header"><h2 class="section-title">🔍 Search Results (${games.length})</h2><button class="btn-secondary" onclick="renderHome()">Clear</button></div><div class="games-grid">${games.map(g => renderGameCard(g)).join('')}</div></div>`;
  attachCardEvents();
}

async function showFavorites() {
  const favorites = getFavorites();
  const favoriteGames = allGamesData.filter(g => favorites.includes(g.id));
  renderSearchResults(favoriteGames);
}

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

function setupProgressBar() {
  window.addEventListener('scroll', () => {
    const winScroll = document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    document.getElementById('progressBar').style.width = scrolled + '%';
  });
}

function setupScrollToTop() {
  const scrollBtn = document.getElementById('scrollTopBtn');
  window.addEventListener('scroll', () => {
    scrollBtn.classList.toggle('visible', window.scrollY > 300);
  });
  scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function setupRipple() {
  document.body.addEventListener('click', (e) => {
    const target = e.target.closest('button, .game-card');
    if (target) createRipple(e, target);
  });
}

function setupSecurity() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J'))) {
      e.preventDefault();
      document.getElementById('securityModal').classList.add('active');
    }
  });
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    document.getElementById('securityModal').classList.add('active');
  });
  document.getElementById('closeSecurityBtn').addEventListener('click', () => {
    document.getElementById('securityModal').classList.remove('active');
  });
}

function setupCookieConsent() {
  const cookieAccepted = getCookie('cookies_accepted');
  if (!cookieAccepted) {
    setTimeout(() => document.getElementById('cookieModal').classList.add('active'), 1000);
  }
  document.getElementById('acceptCookiesBtn').onclick = () => {
    setCookie('cookies_accepted', 'true', 30);
    document.getElementById('cookieModal').classList.remove('active');
  };
  document.getElementById('rejectCookiesBtn').onclick = () => {
    document.getElementById('cookieModal').classList.remove('active');
  };
}

window.searchByTag = async (tag) => {
  const games = await fetchGames();
  const filtered = games.filter(g => g.tags && g.tags.includes(tag));
  renderSearchResults(filtered);
};

document.addEventListener('DOMContentLoaded', initApp);

// 🔥 PAGE LOAD HANDLE
window.addEventListener('load', () => {
  const hash = window.location.hash;

  if (hash.startsWith('#game-')) {
    const gameId = hash.replace('#game-', '');
    renderDetail(gameId);
  } else {
    renderHome();
  }
});

// 🔥 HASH CHANGE HANDLE
window.addEventListener('hashchange', () => {
  const hash = window.location.hash;

  if (hash.startsWith('#game-')) {
    const gameId = hash.replace('#game-', '');
    renderDetail(gameId);
  } else {
    renderHome();
  }
});
