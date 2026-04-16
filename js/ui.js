// ============ UI MODULE ============

let allGamesData = [];
let currentPage = 'home';

/**
 * Show/hide loading spinner
 * @param {boolean} show - Show or hide
 */
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Show skeleton loading cards
 */
function showSkeleton() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="games-grid">
            ${Array(8).fill(0).map(() => `
                <div class="skeleton-card">
                    <div class="skeleton-image"></div>
                    <div class="skeleton-text" style="width: 80%;"></div>
                    <div class="skeleton-text" style="width: 60%;"></div>
                    <div class="skeleton-text short" style="width: 40%;"></div>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Render a single game card
 * @param {Object} game - Game object
 * @returns {string} HTML string
 */
function renderGameCard(game) {
    const likes = getGameLikes(game.id);
    const views = getGameViews(game.id);
    const isFav = isFavorite(game.id);
    const imageUrl = game.image || (game.images ? game.images[0] : 'https://via.placeholder.com/400x200?text=🎮');
    
    const categoryIcons = {
        racing: '🏎️',
        fps: '🔫',
        action: '⚔️',
        rpg: '🗡️',
        'battle-royale': '🏆'
    };
    const categoryIcon = categoryIcons[game.category] || '🎮';
    
    return `
        <div class="game-card card-shine" data-game-id="${game.id}">
            <div class="card-media img-zoom">
                <img class="card-image" src="${imageUrl}" alt="${escapeHtml(game.name)}" loading="lazy"
                     onerror="this.src='https://via.placeholder.com/400x200?text=🎮+${encodeURIComponent(game.name)}'">
                <div class="card-category-badge">${categoryIcon} ${game.category || 'Game'}</div>
                <div class="card-actions">
                    <button class="card-action-btn fav-btn" data-id="${game.id}" aria-label="Favorite">
                        ${isFav ? '❤️' : '🤍'}
                    </button>
                    <button class="card-action-btn share-btn" data-id="${game.id}" aria-label="Share">
                        🔗
                    </button>
                </div>
            </div>
            <div class="card-content">
                <h3 class="card-title">${escapeHtml(game.name)}</h3>
                <p class="card-description">${escapeHtml(game.shortDesc || game.desc || 'Awesome game!')}</p>
                <div class="card-stats">
                    <span>⭐ ${formatNumber(likes)}</span>
                    <span>👁 ${formatNumber(views)}</span>
                </div>
                ${game.tags ? `<div class="card-tags">${game.tags.slice(0, 3).map(tag => `<span class="tag" data-tag="${tag}">#${tag}</span>`).join('')}</div>` : ''}
            </div>
        </div>
    `;
}

/**
 * Render the home page
 */
async function renderHome() {
    console.log('🎮 Rendering Home...');
    currentPage = 'home';
    showSkeleton();
    
    const games = await fetchGames();
    allGamesData = games;
    
    if (!games || games.length === 0) {
        document.getElementById('app').innerHTML = `
            <div style="text-align: center; padding: 80px 20px;">
                <span style="font-size: 64px;">😢</span>
                <h2>No games found</h2>
                <button class="btn-primary" onclick="location.reload()" style="margin-top: 20px;">Refresh</button>
            </div>
        `;
        showLoading(false);
        return;
    }
    
    const trending = await getTrendingGames(12);
    const mostLiked = await getMostLikedGames(12);
    const recommended = await getRecommendedGames(12);
    const favorites = getFavorites();
    const favoriteGames = games.filter(g => favorites.includes(g.id)).slice(0, 12);
    const recentlyPlayedIds = getRecentlyPlayed();
    const recentlyPlayed = games.filter(g => recentlyPlayedIds.includes(g.id)).slice(0, 12);
    const inlineAd = getRandomAd('banner');
    
    let html = `<div class="fade-in">`;
    
    html += `
        <div class="hero-banner glass-card">
            <div class="hero-content">
                <h1 class="hero-title gradient-text">🎮 Welcome to GameVerse</h1>
                <p class="hero-subtitle">Next-Generation Gaming Platform</p>
                <button class="btn-primary pulse" onclick="document.getElementById('trendingSection')?.scrollIntoView({behavior:'smooth'})">
                    🔥 Explore Games
                </button>
            </div>
        </div>
    `;
    
    if (trending.length) {
        html += `
            <div id="trendingSection">
                <div class="section-header">
                    <h2 class="section-title">🔥 Trending Now</h2>
                    <div class="scroll-btns">
                        <button class="scroll-btn" onclick="scrollRow('trendingRow', 'left')">◀</button>
                        <button class="scroll-btn" onclick="scrollRow('trendingRow', 'right')">▶</button>
                    </div>
                </div>
                <div id="trendingRow" class="scroll-row">
                    ${trending.map(g => renderGameCard(g)).join('')}
                    ${inlineAd ? renderInlineAdCard() : ''}
                </div>
            </div>
        `;
    }
    
    if (recommended.length) {
        html += `
            <div class="section-header">
                <h2 class="section-title">🎯 Recommended For You</h2>
                <div class="scroll-btns">
                    <button class="scroll-btn" onclick="scrollRow('recommendedRow', 'left')">◀</button>
                    <button class="scroll-btn" onclick="scrollRow('recommendedRow', 'right')">▶</button>
                </div>
            </div>
            <div id="recommendedRow" class="scroll-row">
                ${recommended.map(g => renderGameCard(g)).join('')}
            </div>
        `;
    }
    
    if (mostLiked.length) {
        html += `
            <div class="section-header">
                <h2 class="section-title">⭐ Most Liked</h2>
                <div class="scroll-btns">
                    <button class="scroll-btn" onclick="scrollRow('likedRow', 'left')">◀</button>
                    <button class="scroll-btn" onclick="scrollRow('likedRow', 'right')">▶</button>
                </div>
            </div>
            <div id="likedRow" class="scroll-row">
                ${mostLiked.map(g => renderGameCard(g)).join('')}
            </div>
        `;
    }
    
    if (recentlyPlayed.length) {
        html += `
            <div class="section-header">
                <h2 class="section-title">⏱️ Recently Played</h2>
                <div class="scroll-btns">
                    <button class="scroll-btn" onclick="scrollRow('recentRow', 'left')">◀</button>
                    <button class="scroll-btn" onclick="scrollRow('recentRow', 'right')">▶</button>
                </div>
            </div>
            <div id="recentRow" class="scroll-row">
                ${recentlyPlayed.map(g => renderGameCard(g)).join('')}
            </div>
        `;
    }
    
    if (favoriteGames.length) {
        html += `
            <div class="section-header">
                <h2 class="section-title">❤️ Your Favorites</h2>
                <div class="scroll-btns">
                    <button class="scroll-btn" onclick="scrollRow('favRow', 'left')">◀</button>
                    <button class="scroll-btn" onclick="scrollRow('favRow', 'right')">▶</button>
                </div>
            </div>
            <div id="favRow" class="scroll-row">
                ${favoriteGames.map(g => renderGameCard(g)).join('')}
            </div>
        `;
    }
    
    html += `
        <div class="section-header">
            <h2 class="section-title">🎮 All Games</h2>
        </div>
        <div class="games-grid stagger">
            ${games.map(g => renderGameCard(g)).join('')}
        </div>
    `;
    
    html += `</div>`;
    
    document.getElementById('app').innerHTML = html;
    attachCardEvents();
    showLoading(false);
    updateDailyStreak();
}

/**
 * Render game detail page
 * @param {string} gameId - Game ID
 */
async function renderDetail(gameId) {
    console.log('🎮 Rendering Detail for:', gameId);
    currentPage = 'detail';
    showLoading(true);
    
    const game = await getGameById(gameId);
    if (!game) {
        renderHome();
        return;
    }
    
    trackGameView(gameId);
    addToRecentlyPlayed(gameId);
    
    const likes = getGameLikes(gameId);
    const views = getGameViews(gameId);
    const isFav = isFavorite(gameId);
    const alreadyLiked = hasUserLiked(gameId);
    const comments = getComments(gameId);
    const similarGames = await getSimilarGames(gameId, game.category, game.tags || [], 8);
    
    const topAd = getRandomAd('banner');
    const middleAd = getDifferentAd(topAd?.id);
    const bottomAd = getDifferentAd(middleAd?.id);
    const imageUrl = game.image || (game.images ? game.images[0] : 'https://via.placeholder.com/800x400');
    
    let html = `
        <div class="fade-in">
            <button class="back-btn" onclick="renderHome()">← Back to Games</button>
            
            ${topAd ? renderDetailAd(topAd, 'Top Sponsor') : ''}
            
            <div class="detail-hero">
                <img src="${imageUrl}" alt="${escapeHtml(game.name)}" onerror="this.src='https://via.placeholder.com/800x400?text=🎮'">
                <div class="detail-overlay">
                    <h1>${escapeHtml(game.name)}</h1>
                    <div class="detail-actions">
                        <button class="btn-primary play-now-btn" data-id="${game.id}">▶ Play Now</button>
                        <button class="btn-secondary" onclick="openTrailer('${game.trailerUrl || ''}')">🎬 Trailer</button>
                        <button class="btn-secondary" id="detailFavBtn">${isFav ? '❤️ Remove' : '🤍 Save'}</button>
                    </div>
                </div>
            </div>
            
            <div class="detail-stats">
                <div class="stat-card like-stat" data-id="${game.id}" data-liked="${alreadyLiked}" style="${alreadyLiked ? 'opacity:0.6; cursor:default;' : ''}">
                    <span class="stat-value">⭐ ${formatNumber(likes)}</span>
                    <span class="stat-label">${alreadyLiked ? 'Already Liked ✓' : 'Click to Like'}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">👁 ${formatNumber(views)}</span>
                    <span class="stat-label">Views</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">🎮 ${game.category || 'Game'}</span>
                    <span class="stat-label">Category</span>
                </div>
                <div class="stat-card share-stat" data-id="${game.id}">
                    <span class="stat-value">🔗 Share</span>
                    <span class="stat-label">Spread the word</span>
                </div>
            </div>
            
            <div class="detail-description">
                <h3>📖 About This Game</h3>
                <p>${escapeHtml(game.longDesc || game.shortDesc || game.desc || 'No description available.')}</p>
            </div>
            
            ${middleAd ? renderDetailAd(middleAd, 'Advertisement') : ''}
            
            ${game.tags ? `
            <div class="detail-tags">
                <h3>🏷️ Related Tags</h3>
                <div class="card-tags">
                    ${game.tags.map(tag => `<span class="tag" data-tag="${tag}">#${tag}</span>`).join('')}
                </div>
            </div>
            ` : ''}
            
            <div class="comments-section">
                <h3>💬 Comments (${comments.length})</h3>
                <div class="comment-input-wrapper">
                    <input type="text" id="commentInput" class="comment-input" placeholder="Write a comment..." maxlength="500">
                    <button class="btn-primary" id="submitCommentBtn">Post</button>
                </div>
                <div id="commentsList" class="comments-list">
                    ${renderComments(comments, gameId)}
                </div>
            </div>
            
            ${bottomAd ? renderDetailAd(bottomAd, 'Sponsored') : ''}
            
            ${similarGames.length ? `
            <div class="similar-games">
                <h3>🎯 You Might Also Like</h3>
                <div class="scroll-row">
                    ${similarGames.map(g => renderGameCard(g)).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    `;
    
    document.getElementById('app').innerHTML = html;
    attachDetailEvents(gameId);
    attachCardEvents();
    showLoading(false);
}

/**
 * Render comments with replies
 * @param {Array} comments - Comments array
 * @param {string} gameId - Game ID
 * @returns {string} HTML string
 */
function renderComments(comments, gameId) {
    if (!comments.length) {
        return '<p style="text-align:center; padding:40px; color:var(--text-secondary);">💬 No comments yet. Be the first!</p>';
    }
    
    return comments.map(comment => `
        <div class="comment-item" data-comment-id="${comment.id}">
            <div class="comment-header">
                <div class="comment-author">
                    <span>🎮</span>
                    <strong>${escapeHtml(comment.author)}</strong>
                </div>
                <div class="comment-time">${timeAgo(comment.timestamp)}</div>
            </div>
            <div class="comment-text">${escapeHtml(comment.text)}</div>
            <div class="comment-actions">
                <button class="reply-btn" data-comment-id="${comment.id}">💬 Reply (${comment.replies?.length || 0})</button>
                <button class="like-comment-btn" data-comment-id="${comment.id}">❤️ ${comment.likes || 0}</button>
            </div>
            <div class="replies-container" id="replies-${comment.id}" style="display: none;">
                ${comment.replies ? comment.replies.map(reply => `
                    <div class="reply-item">
                        <div class="comment-header">
                            <div class="comment-author">
                                <span>↳</span>
                                <strong>${escapeHtml(reply.author)}</strong>
                            </div>
                            <div class="comment-time">${timeAgo(reply.timestamp)}</div>
                        </div>
                        <div class="comment-text">${escapeHtml(reply.text)}</div>
                    </div>
                `).join('') : ''}
                <div class="reply-input-wrapper">
                    <input type="text" class="reply-input" placeholder="Write a reply..." maxlength="300">
                    <button class="btn-primary submit-reply-btn" data-comment-id="${comment.id}">Reply</button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Attach events to all game cards
 */
function attachCardEvents() {
    document.querySelectorAll('.game-card').forEach(card => {
        const newCard = card.cloneNode(true);
        card.parentNode.replaceChild(newCard, card);
        
        newCard.addEventListener('click', (e) => {
            if (e.target.classList.contains('fav-btn') || 
                e.target.classList.contains('share-btn') || 
                e.target.classList.contains('tag') ||
                e.target.closest('.ad-card')) {
                return;
            }
            
            const gameId = newCard.dataset.gameId;
            if (gameId) {
                showAdPopup(() => {
                    window.location.hash = `game-${gameId}`;
                    renderDetail(gameId);
                });
            }
        });
        
        newCard.addEventListener('click', (e) => {
            createRipple(e, newCard);
        });
    });
    
    document.querySelectorAll('.fav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const gameId = btn.dataset.id;
            if (isFavorite(gameId)) {
                removeFavorite(gameId);
                btn.innerHTML = '🤍';
                animateButton(btn, 'heart-break');
            } else {
                addFavorite(gameId);
                btn.innerHTML = '❤️';
                animateButton(btn, 'heart-beat');
            }
        });
    });
    
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const gameId = btn.dataset.id;
            const game = allGamesData.find(g => g.id === gameId);
            if (game) {
                const url = `${window.location.origin}${window.location.pathname}#game-${gameId}`;
                const success = await copyToClipboard(url);
                if (success) {
                    showToast('Link copied to clipboard! 🔗', 'success');
                } else {
                    showToast('Failed to copy link', 'error');
                }
            }
        });
    });
    
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
            e.stopPropagation();
            filterByTag(tag.dataset.tag);
        });
    });
}

/**
 * Animate button with class
 * @param {HTMLElement} btn - Button element
 * @param {string} animationClass - Animation class name
 */
function animateButton(btn, animationClass) {
    btn.classList.add(animationClass);
    setTimeout(() => btn.classList.remove(animationClass), 300);
}

/**
 * Attach events to detail page
 * @param {string} gameId - Game ID
 */
function attachDetailEvents(gameId) {
    // Favorite button
    const favBtn = document.getElementById('detailFavBtn');
    if (favBtn) {
        favBtn.onclick = () => {
            if (isFavorite(gameId)) {
                removeFavorite(gameId);
                favBtn.innerHTML = '🤍 Save';
                favBtn.classList.add('heart-break');
                setTimeout(() => favBtn.classList.remove('heart-break'), 300);
            } else {
                addFavorite(gameId);
                favBtn.innerHTML = '❤️ Remove';
                favBtn.classList.add('heart-beat');
                setTimeout(() => favBtn.classList.remove('heart-beat'), 300);
            }
        };
    }
    
    // Like button (stat card) - ONLY ONE LIKE PER USER
    const likeStat = document.querySelector('.like-stat');
    if (likeStat) {
        const alreadyLiked = hasUserLiked(gameId);
        
        if (alreadyLiked) {
            likeStat.style.opacity = '0.6';
            likeStat.style.cursor = 'default';
            const labelSpan = likeStat.querySelector('.stat-label');
            if (labelSpan) labelSpan.innerHTML = 'Already Liked ✓';
        }
        
        likeStat.onclick = () => {
            if (hasUserLiked(gameId)) {
                showToast('You already liked this game! ❤️', 'info');
                return;
            }
            
            const result = likeGame(gameId);
            
            if (result.success) {
                likeStat.querySelector('.stat-value').innerHTML = `⭐ ${formatNumber(result.newLikes)}`;
                likeStat.querySelector('.stat-label').innerHTML = 'Liked ✓';
                likeStat.style.opacity = '0.6';
                likeStat.style.cursor = 'default';
                showToast('Thanks for liking! +5 points ⭐', 'success');
                likeStat.style.transform = 'scale(1.1)';
                setTimeout(() => likeStat.style.transform = '', 200);
            } else if (result.alreadyLiked) {
                showToast('You already liked this game! ❤️', 'info');
            }
        };
    }
    
    // Share stat
    const shareStat = document.querySelector('.share-stat');
    if (shareStat) {
        shareStat.onclick = async () => {
            const url = `${window.location.origin}${window.location.pathname}#game-${gameId}`;
            const success = await copyToClipboard(url);
            if (success) {
                showToast('Link copied to clipboard! 🔗', 'success');
                shareStat.style.transform = 'scale(1.1)';
                setTimeout(() => shareStat.style.transform = '', 200);
            }
        };
    }
    
    // Play button
    const playBtn = document.querySelector('.play-now-btn');
    if (playBtn) {
        playBtn.onclick = () => {
            showRewardAd((success) => {
                if (success) {
                    showToast('Game starting! 🎮', 'success');
                } else {
                    showToast('Game starting! 🎮', 'info');
                }
            });
        };
    }
    
    // Comment submission
    const submitBtn = document.getElementById('submitCommentBtn');
    if (submitBtn) {
        submitBtn.onclick = () => {
            const input = document.getElementById('commentInput');
            const comment = input.value.trim();
            if (comment) {
                addComment(gameId, comment);
                input.value = '';
                renderDetail(gameId);
                showToast('Comment posted! ✅', 'success');
            } else {
                showToast('Please enter a comment', 'error');
            }
        };
    }
    
    // Reply buttons
    document.querySelectorAll('.reply-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const commentId = btn.dataset.commentId;
            const repliesContainer = document.getElementById(`replies-${commentId}`);
            if (repliesContainer) {
                const isVisible = repliesContainer.style.display === 'block';
                repliesContainer.style.display = isVisible ? 'none' : 'block';
            }
        };
    });
    
    // Submit reply buttons
    document.querySelectorAll('.submit-reply-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const commentId = btn.dataset.commentId;
            const wrapper = btn.closest('.reply-input-wrapper');
            const input = wrapper.querySelector('.reply-input');
            const replyText = input.value.trim();
            if (replyText) {
                addComment(gameId, replyText, commentId);
                renderDetail(gameId);
                showToast('Reply posted! ✅', 'success');
            } else {
                showToast('Please enter a reply', 'error');
            }
        };
    });
    
    // Like comment buttons
    document.querySelectorAll('.like-comment-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const commentId = btn.dataset.commentId;
            likeComment(gameId, commentId);
            renderDetail(gameId);
            showToast('Liked comment! ❤️', 'success');
        };
    });
}

/**
 * Filter games by tag
 * @param {string} tagName - Tag name
 */
async function filterByTag(tagName) {
    showLoading(true);
    const games = await fetchGames();
    const filtered = games.filter(g => g.tags && g.tags.includes(tagName));
    
    const html = `
        <div class="fade-in">
            <div class="section-header">
                <h2 class="section-title">🏷️ #${tagName} (${filtered.length} games)</h2>
                <button class="btn-secondary" onclick="renderHome()">Show All Games</button>
            </div>
            <div class="games-grid stagger">
                ${filtered.length ? filtered.map(g => renderGameCard(g)).join('') : `
                    <div style="text-align: center; grid-column: 1/-1; padding: 60px;">
                        <span style="font-size: 48px;">😢</span>
                        <p>No games found with this tag</p>
                    </div>
                `}
            </div>
        </div>
    `;
    
    document.getElementById('app').innerHTML = html;
    attachCardEvents();
    showLoading(false);
    showToast(`Found ${filtered.length} games with #${tagName}`, 'info');
}

/**
 * Scroll horizontal row
 * @param {string} rowId - Row element ID
 * @param {string} direction - 'left' or 'right'
 */
function scrollRow(rowId, direction) {
    const container = document.getElementById(rowId);
    if (container) {
        const scrollAmount = direction === 'left' ? -350 : 350;
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
}

/**
 * Open trailer modal
 * @param {string} url - YouTube embed URL
 */
function openTrailer(url) {
    if (!url) {
        showToast('No trailer available', 'info');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.zIndex = '3000';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; padding: 0; background: black; position: relative;">
            <button onclick="this.closest('.modal').remove()" class="modal-close" style="position: absolute; top: -40px; right: 0; background: white; width: 32px; height: 32px; border-radius: 50%;">✕</button>
            <iframe src="${url}" frameborder="0" allowfullscreen style="width: 100%; height: 400px; border-radius: 20px;"></iframe>
        </div>
    `;
    document.body.appendChild(modal);
}

/**
 * Show toast notification
 * @param {string} message - Message to show
 * @param {string} type - 'success', 'error', 'warning', 'info'
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '🎮'}</span>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Render search results
 * @param {string} query - Search query
 */
async function renderSearchResults(query) {
    if (!query.trim()) {
        renderHome();
        return;
    }
    
    showLoading(true);
    const results = await searchGames(query);
    
    const html = `
        <div class="fade-in">
            <div class="section-header">
                <h2 class="section-title">🔍 Search Results (${results.length})</h2>
                <button class="btn-secondary" onclick="renderHome()">Clear</button>
            </div>
            <div class="games-grid stagger">
                ${results.length ? results.map(g => renderGameCard(g)).join('') : `
                    <div style="text-align: center; grid-column: 1/-1; padding: 60px;">
                        <span style="font-size: 48px;">😢</span>
                        <p>No games found matching "${escapeHtml(query)}"</p>
                    </div>
                `}
            </div>
        </div>
    `;
    
    document.getElementById('app').innerHTML = html;
    attachCardEvents();
    showLoading(false);
}

/**
 * Render category filtered games
 * @param {string} category - Category name
 */
async function renderCategoryFilter(category) {
    showLoading(true);
    const filtered = await filterByCategory(category);
    
    const categoryNames = {
        all: 'All Games',
        racing: 'Racing Games',
        fps: 'FPS Games',
        action: 'Action Games',
        rpg: 'RPG Games',
        'battle-royale': 'Battle Royale Games'
    };
    
    const html = `
        <div class="fade-in">
            <div class="section-header">
                <h2 class="section-title">${categoryNames[category] || category.toUpperCase()} (${filtered.length})</h2>
                <button class="btn-secondary" onclick="renderHome()">Show All</button>
            </div>
            <div class="games-grid stagger">
                ${filtered.map(g => renderGameCard(g)).join('')}
            </div>
        </div>
    `;
    
    document.getElementById('app').innerHTML = html;
    attachCardEvents();
    showLoading(false);
}

/**
 * Show user's favorite games
 */
async function showFavorites() {
    showLoading(true);
    const favorites = getFavorites();
    const games = await fetchGames();
    const favoriteGames = games.filter(g => favorites.includes(g.id));
    
    const html = `
        <div class="fade-in">
            <div class="section-header">
                <h2 class="section-title">❤️ Your Favorites (${favoriteGames.length})</h2>
                <button class="btn-secondary" onclick="renderHome()">Show All Games</button>
            </div>
            <div class="games-grid stagger">
                ${favoriteGames.length ? favoriteGames.map(g => renderGameCard(g)).join('') : `
                    <div style="text-align: center; grid-column: 1/-1; padding: 60px;">
                        <span style="font-size: 48px;">💔</span>
                        <p>No favorites yet. Click ❤️ on games to save them!</p>
                    </div>
                `}
            </div>
        </div>
    `;
    
    document.getElementById('app').innerHTML = html;
    attachCardEvents();
    showLoading(false);
}

// Make functions global
window.renderHome = renderHome;
window.renderDetail = renderDetail;
window.showFavorites = showFavorites;
window.openTrailer = openTrailer;
window.showToast = showToast;
window.filterByTag = filterByTag;
window.renderCategoryFilter = renderCategoryFilter;
window.renderSearchResults = renderSearchResults;
window.scrollRow = scrollRow;
window.attachCardEvents = attachCardEvents;