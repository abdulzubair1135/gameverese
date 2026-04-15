// UI MODULE

let allGamesData = [];

function showLoading(show) {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) {
    spinner.style.display = show ? 'flex' : 'none';
  }
}

function showSkeleton(count = 6) {
  const app = document.getElementById('app');
  let skeletonHtml = '<div class="games-grid">';
  for (let i = 0; i < count; i++) {
    skeletonHtml += `
      <div class="skeleton-card">
        <div class="skeleton-image"></div>
        <div class="skeleton-text" style="width: 80%;"></div>
        <div class="skeleton-text" style="width: 60%;"></div>
      </div>
    `;
  }
  skeletonHtml += '</div>';
  app.innerHTML = skeletonHtml;
}

function renderGameCard(game) {
  const likes = getGameLikes(game.id);
  const views = getGameViews(game.id);
  const isFav = isFavorite(game.id);
  
  return `
    <div class="game-card" data-game-id="${game.id}">
      <div class="card-image-container">
        <img class="card-image" src="${game.image}" alt="${escapeHtml(game.name)}" loading="lazy">
        <div class="card-actions-overlay">
          <button class="card-action-btn fav-btn" data-id="${game.id}">${isFav ? '❤️' : '🤍'}</button>
          <button class="card-action-btn share-btn" data-id="${game.id}">🔗</button>
        </div>
      </div>
      <div class="card-content">
        <h3 class="card-title">${escapeHtml(game.name)}</h3>
        <p class="card-description">${escapeHtml(game.desc)}</p>
        <div class="card-stats">
          <span>⭐ ${formatNumber(likes)}</span>
          <span>👁 ${formatNumber(views)}</span>
        </div>
        ${game.tags ? `<div class="card-tags">${game.tags.map(tag => `<span class="tag" data-tag="${tag}">#${tag}</span>`).join('')}</div>` : ''}
      </div>
    </div>
  `;
}

function renderSection(title, games) {
  if (!games || !games.length) return '';
  
  return `
    <div class="section-header">
      <h2 class="section-title">${title}</h2>
    </div>
    <div class="games-grid">
      ${games.map(game => renderGameCard(game)).join('')}
    </div>
  `;
}

async function renderHome() {
  console.log('🎮 Rendering Home...');
  showSkeleton();
  
  const games = await fetchGames();
  allGamesData = games;
  
  const visitorCount = incrementVisitorCount();
  const trending = await getTrendingGames(8);
  const recent = await getRecentGamesAPI(8);
  const mostViewed = await getMostViewedGames(8);
  const mostLiked = await getMostLikedGames(8);
  const recommended = await getRecommendedGames(8);
  const favorites = getFavorites();
  const favoriteGames = games.filter(g => favorites.includes(g.id));
  const recentIds = getRecentIds();
  const recentlyViewedGames = games.filter(g => recentIds.includes(g.id));
  
  let html = `<div class="app-container fade">`;
  
  html += `
    <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 24px; padding: 40px; text-align: center; margin-bottom: 32px;">
      <h1 style="font-size: 2.5rem; margin-bottom: 12px;">🎮 Welcome to GameHub</h1>
      <p style="font-size: 1.2rem; margin-bottom: 16px;">Discover the best premium games online</p>
      <div style="display: flex; gap: 20px; justify-content: center;">
        <span>👥 ${formatNumber(visitorCount)} Visitors</span>
        <span>🎮 ${games.length}+ Games</span>
      </div>
    </div>
  `;
  
  if (recommended.length) html += renderSection('🎯 Recommended For You', recommended);
  if (trending.length) html += renderSection('🔥 Trending Now', trending);
  if (mostLiked.length) html += renderSection('⭐ Most Liked', mostLiked);
  if (mostViewed.length) html += renderSection('👁 Most Viewed', mostViewed);
  if (recent.length) html += renderSection('🆕 Recently Added', recent);
  if (favoriteGames.length) html += renderSection('❤️ Your Favorites', favoriteGames);
  if (recentlyViewedGames.length) html += renderSection('⏱️ Recently Viewed', recentlyViewedGames);
  html += renderSection('🎮 All Games', games.slice(0, 20));
  
  html += `</div>`;
  
  document.getElementById('app').innerHTML = html;
  attachCardEvents();
}

async function renderDetail(gameId) {
  showLoading(true);
  
  const game = await getGameById(gameId);
  if (!game) {
    renderHome();
    return;
  }
  
  trackGameView(gameId);
  addToRecent(gameId);
  updateUserProfile(game.category);
  
  const likes = getGameLikes(gameId);
  const views = getGameViews(gameId);
  const rating = getRating(gameId);
  const comments = getComments(gameId);
  const similarGames = await getSimilarGames(gameId, game.category, 5);
  
  let starsHtml = '';
  for (let i = 1; i <= 5; i++) {
    starsHtml += `<span class="star" data-rating="${i}" style="cursor:pointer; font-size:1.5rem; ${i <= rating ? 'color:#fbbf24' : 'color:#4b5563'}">★</span>`;
  }
  
  let html = `
    <div class="app-container detail-container fade">
      <button class="back-btn" onclick="renderHome()">← Back to Games</button>
      
      <div style="position:relative; border-radius:24px; overflow:hidden; margin-bottom:32px;">
        <img src="${game.image}" style="width:100%; height:400px; object-fit:cover;">
        <div style="position:absolute; bottom:0; left:0; right:0; padding:40px; background:linear-gradient(transparent, rgba(0,0,0,0.9));">
          <h1 style="font-size:2rem;">${escapeHtml(game.name)}</h1>
         <button class="btn-primary install-btn" data-id="${game.id}">⬇️ Install Now</button>
        </div>
      </div>
      
      <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:20px; background:var(--bg-card); border-radius:20px; padding:24px; margin-bottom:32px;">
        <div style="text-align:center"><div style="font-size:0.8rem; color:#6b7280">Category</div><div style="font-size:1.2rem; font-weight:bold">🎮 ${game.category}</div></div>
        <div style="text-align:center"><div style="font-size:0.8rem; color:#6b7280">Likes</div><div style="font-size:1.2rem; font-weight:bold" id="likeCount">⭐ ${formatNumber(likes)}</div></div>
        <div style="text-align:center"><div style="font-size:0.8rem; color:#6b7280">Views</div><div style="font-size:1.2rem; font-weight:bold">👁 ${formatNumber(views)}</div></div>
        <div style="text-align:center"><div style="font-size:0.8rem; color:#6b7280">Rating</div><div style="font-size:1.2rem" id="ratingStars">${starsHtml}</div></div>
      </div>
      
      <div style="margin-bottom:32px">
        <h3>📖 About this game</h3>
        <p style="line-height:1.7">${escapeHtml(game.longDesc || game.desc)}</p>
      </div>
      
      ${game.tags ? `<div style="margin-bottom:32px"><h3>🏷️ Tags</h3><div class="card-tags">${game.tags.map(tag => `<span class="tag" data-tag="${tag}">#${tag}</span>`).join('')}</div></div>` : ''}
      
      <div style="background:var(--bg-card); border-radius:20px; padding:24px; margin-bottom:32px">
        <h3>💬 Comments (${comments.length})</h3>
        <div style="display:flex; gap:12px; margin-bottom:20px">
          <input type="text" id="commentInput" class="comment-input" placeholder="Write a comment..." style="flex:1; padding:12px; border-radius:12px; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-primary)">
          <button class="btn-primary" id="submitCommentBtn">Post</button>
        </div>
        <div id="commentsList">
          ${comments.length ? comments.map(c => `<div style="padding:12px; border-bottom:1px solid var(--border-color)"><strong>🎮 Player</strong><p>${escapeHtml(c.text)}</p><small>${timeAgo(c.timestamp)}</small></div>`).join('') : '<p>No comments yet. Be the first!</p>'}
        </div>
      </div>
      
      <div style="margin-bottom:32px">
        <h3>🎯 Similar Games</h3>
        <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:16px; margin-top:16px">
          ${similarGames.map(g => `<div class="game-card similar-card" data-game-id="${g.id}" style="cursor:pointer"><img src="${g.image}" style="width:100%; height:120px; object-fit:cover;"><div class="card-content"><h4>${escapeHtml(g.name)}</h4></div></div>`).join('')}
        </div>
      </div>
      
      ${renderDetailAd()}
    </div>
  `;
  
  document.getElementById('app').innerHTML = html;
  attachDetailEvents(gameId);
  showLoading(false);
}

function attachCardEvents() {
  document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.fav-btn') && !e.target.closest('.share-btn') && !e.target.closest('.tag')) {
        const gameId = card.dataset.gameId;
        if (gameId) openGameWithAd(gameId);
      }
    });
  });
  
  document.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const gameId = btn.dataset.id;
      if (isFavorite(gameId)) {
        removeFavorite(gameId);
        btn.innerHTML = '🤍';
      } else {
        addFavorite(gameId);
        btn.innerHTML = '❤️';
      }
      updateFavCount();
    });
  });
  
  document.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const gameId = btn.dataset.id;
      const url = `${window.location.origin}${window.location.pathname}#game-${gameId}`;
      navigator.clipboard.writeText(url);
      showToast('Link copied!', 'success');
    });
  });
  
  document.querySelectorAll('.tag').forEach(tag => {
    tag.addEventListener('click', (e) => {
      e.stopPropagation();
      const tagName = tag.dataset.tag;
      searchByTag(tagName);
    });
  });
}

function attachDetailEvents(gameId) {
    // 🔥 INSTALL BUTTON LOGIC
const installBtn = document.querySelector('.install-btn');

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    const game = await getGameById(gameId);

    if (game && game.downloadLink) {
     window.location.href = game.downloadLink;// new tab
    } else {
      showToast('Download link not available');
    }
  });
}
  document.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', () => {
      const rating = parseInt(star.dataset.rating);
      setRating(gameId, rating);
      renderDetail(gameId);
    });
  });
  
  const submitBtn = document.getElementById('submitCommentBtn');
  if (submitBtn) {
    submitBtn.onclick = () => {
      const input = document.getElementById('commentInput');
      const comment = input.value.trim();
      if (comment) {
        addComment(gameId, comment);
        input.value = '';
        renderDetail(gameId);
        showToast('Comment posted!', 'success');
      }
    };
  }
  
  document.querySelectorAll('.similar-card, .similar-games-grid .game-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.gameId;
      if (id) openGameWithAd(id);
    });
  });
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#3b82f6; color:white; padding:12px 24px; border-radius:50px; z-index:10000; animation:fadeInUp 0.3s ease';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function updateFavCount() {
  const count = getFavorites().length;
  const favCountSpan = document.getElementById('favCount');
  if (favCountSpan) favCountSpan.textContent = count;
}

function openGameWithAd(gameId) {
  showAdPopup(() => {
    window.location.hash = `game-${gameId}`;
    renderDetail(gameId);
  });
}

window.renderHome = renderHome;
window.renderDetail = renderDetail;
window.openGameWithAd = openGameWithAd;