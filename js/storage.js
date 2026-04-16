// ============ STORAGE MODULE ============

const STORAGE_KEYS = {
    LIKES: 'gameverse_likes',
    VIEWS: 'gameverse_views',
    FAVORITES: 'gameverse_favorites',
    COMMENTS: 'gameverse_comments',
    THEME: 'gameverse_theme',
    VISITOR_ID: 'gameverse_visitor_id',
    SESSION_ID: 'gameverse_session_id',
    AD_STATS: 'gameverse_ad_stats',
    USER_PREFS: 'gameverse_user_prefs',
    RECENTLY_PLAYED: 'gameverse_recently_played',
    ACHIEVEMENTS: 'gameverse_achievements',
    POINTS: 'gameverse_points',
    DAILY_STREAK: 'gameverse_daily_streak',
    LAST_VISIT: 'gameverse_last_visit',
    USER_LIKES: 'gameverse_user_likes'  // <-- ADDED: Track which games user liked
};

/**
 * Get data from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Stored data
 */
function getStorage(key, defaultValue = {}) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        console.error(`Error reading ${key}:`, e);
        return defaultValue;
    }
}

/**
 * Set data in localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @returns {boolean} Success status
 */
function setStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error(`Error writing ${key}:`, e);
        return false;
    }
}

/**
 * Remove data from localStorage
 * @param {string} key - Storage key
 */
function removeStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.error(`Error removing ${key}:`, e);
    }
}

/**
 * Clear all app data from localStorage
 */
function clearAllStorage() {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
}

// ============ GAME LIKES (ONE LIKE PER USER) ============

/**
 * Check if user already liked this game
 * @param {string} gameId - Game ID
 * @returns {boolean} True if already liked
 */
function hasUserLiked(gameId) {
    const userLikes = getStorage(STORAGE_KEYS.USER_LIKES, {});
    return userLikes[gameId] === true;
}

/**
 * Get game likes count
 * @param {string} gameId - Game ID
 * @returns {number} Likes count
 */
function getGameLikes(gameId) {
    const likes = getStorage(STORAGE_KEYS.LIKES, {});
    return likes[gameId] || 0;
}

/**
 * Increment game likes (ONLY ONCE PER USER)
 * @param {string} gameId - Game ID
 * @returns {Object} { success: boolean, alreadyLiked: boolean, newLikes: number }
 */
function likeGame(gameId) {
    // Check if user already liked this game
    if (hasUserLiked(gameId)) {
        return { success: false, alreadyLiked: true, newLikes: getGameLikes(gameId) };
    }
    
    // Mark that user liked this game
    const userLikes = getStorage(STORAGE_KEYS.USER_LIKES, {});
    userLikes[gameId] = true;
    setStorage(STORAGE_KEYS.USER_LIKES, userLikes);
    
    // Increment global likes counter
    const likes = getStorage(STORAGE_KEYS.LIKES, {});
    likes[gameId] = (likes[gameId] || 0) + 1;
    setStorage(STORAGE_KEYS.LIKES, likes);
    
    // Add reward points for liking
    addUserPoints(5);
    
    return { success: true, alreadyLiked: false, newLikes: likes[gameId] };
}

// ============ GAME VIEWS ============

/**
 * Get game views count
 * @param {string} gameId - Game ID
 * @returns {number} Views count
 */
function getGameViews(gameId) {
    const views = getStorage(STORAGE_KEYS.VIEWS, {});
    return views[gameId] || 0;
}

/**
 * Check if user already viewed this game (session based)
 * @param {string} gameId - Game ID
 * @returns {boolean} True if already viewed in this session
 */
function hasUserViewed(gameId) {
    const sessionViews = sessionStorage.getItem(`viewed_${gameId}`);
    return sessionViews === 'true';
}

/**
 * Increment game views (ONLY ONCE PER SESSION)
 * @param {string} gameId - Game ID
 * @returns {number} New views count
 */
function trackGameView(gameId) {
    // Don't track if already viewed in this session
    if (hasUserViewed(gameId)) {
        return getGameViews(gameId);
    }
    
    // Mark as viewed in this session
    sessionStorage.setItem(`viewed_${gameId}`, 'true');
    
    // Increment global views counter
    const views = getStorage(STORAGE_KEYS.VIEWS, {});
    views[gameId] = (views[gameId] || 0) + 1;
    setStorage(STORAGE_KEYS.VIEWS, views);
    
    // Add to recently played
    addToRecentlyPlayed(gameId);
    
    return views[gameId];
}

// ============ FAVORITES ============

/**
 * Get user's favorite games
 * @returns {Array} Favorite game IDs
 */
function getFavorites() {
    return getStorage(STORAGE_KEYS.FAVORITES, []);
}

/**
 * Add game to favorites
 * @param {string} gameId - Game ID
 * @returns {Array} Updated favorites
 */
function addFavorite(gameId) {
    const favorites = getFavorites();
    if (!favorites.includes(gameId)) {
        favorites.push(gameId);
        setStorage(STORAGE_KEYS.FAVORITES, favorites);
        if (typeof showToast !== 'undefined') {
            showToast('Added to favorites! ❤️', 'success');
        }
    }
    updateFavCountDisplay();
    return favorites;
}

/**
 * Remove game from favorites
 * @param {string} gameId - Game ID
 * @returns {Array} Updated favorites
 */
function removeFavorite(gameId) {
    let favorites = getFavorites();
    favorites = favorites.filter(id => id !== gameId);
    setStorage(STORAGE_KEYS.FAVORITES, favorites);
    if (typeof showToast !== 'undefined') {
        showToast('Removed from favorites 💔', 'info');
    }
    updateFavCountDisplay();
    return favorites;
}

/**
 * Check if game is in favorites
 * @param {string} gameId - Game ID
 * @returns {boolean} Is favorite
 */
function isFavorite(gameId) {
    return getFavorites().includes(gameId);
}

/**
 * Update favorite count display in navbar
 */
function updateFavCountDisplay() {
    const count = getFavorites().length;
    const favSpan = document.getElementById('favCount');
    if (favSpan) favSpan.textContent = count;
}

// ============ COMMENTS ============

/**
 * Get comments for a game
 * @param {string} gameId - Game ID
 * @returns {Array} Comments array
 */
function getComments(gameId) {
    const comments = getStorage(STORAGE_KEYS.COMMENTS, {});
    return comments[gameId] || [];
}

/**
 * Add comment to a game
 * @param {string} gameId - Game ID
 * @param {string} commentText - Comment text
 * @param {string} parentId - Parent comment ID for replies
 * @returns {Array} Updated comments
 */
function addComment(gameId, commentText, parentId = null) {
    const comments = getStorage(STORAGE_KEYS.COMMENTS, {});
    if (!comments[gameId]) comments[gameId] = [];
    
    const newComment = {
        id: Date.now().toString(),
        text: escapeHtml(commentText),
        author: 'Player_' + Math.floor(Math.random() * 10000),
        timestamp: new Date().toISOString(),
        likes: 0,
        replies: []
    };
    
    if (parentId) {
        // Find parent comment and add reply
        const findAndAddReply = (commentsList) => {
            for (let comment of commentsList) {
                if (comment.id === parentId) {
                    comment.replies.push(newComment);
                    return true;
                }
                if (comment.replies && findAndAddReply(comment.replies)) return true;
            }
            return false;
        };
        findAndAddReply(comments[gameId]);
    } else {
        comments[gameId].push(newComment);
    }
    
    setStorage(STORAGE_KEYS.COMMENTS, comments);
    return comments[gameId];
}

/**
 * Like a comment
 * @param {string} gameId - Game ID
 * @param {string} commentId - Comment ID
 */
function likeComment(gameId, commentId) {
    const comments = getStorage(STORAGE_KEYS.COMMENTS, {});
    const findAndLike = (commentsList) => {
        for (let comment of commentsList) {
            if (comment.id === commentId) {
                comment.likes = (comment.likes || 0) + 1;
                return true;
            }
            if (comment.replies && findAndLike(comment.replies)) return true;
        }
        return false;
    };
    findAndLike(comments[gameId] || []);
    setStorage(STORAGE_KEYS.COMMENTS, comments);
}

// ============ THEME ============

/**
 * Set theme
 * @param {string} theme - 'dark', 'light', or 'cyberpunk'
 */
function setTheme(theme) {
    setStorage(STORAGE_KEYS.THEME, theme);
    document.body.classList.remove('light', 'cyberpunk');
    if (theme === 'light') document.body.classList.add('light');
    if (theme === 'cyberpunk') document.body.classList.add('cyberpunk');
}

/**
 * Get current theme
 * @returns {string} Current theme
 */
function getTheme() {
    return getStorage(STORAGE_KEYS.THEME, 'dark');
}

// ============ RECENTLY PLAYED ============

/**
 * Add to recently played games
 * @param {string} gameId - Game ID
 */
function addToRecentlyPlayed(gameId) {
    let recent = getStorage(STORAGE_KEYS.RECENTLY_PLAYED, []);
    recent = [gameId, ...recent.filter(id => id !== gameId)];
    recent = recent.slice(0, 20);
    setStorage(STORAGE_KEYS.RECENTLY_PLAYED, recent);
}

/**
 * Get recently played games
 * @returns {Array} Recently played game IDs
 */
function getRecentlyPlayed() {
    return getStorage(STORAGE_KEYS.RECENTLY_PLAYED, []);
}

// ============ USER POINTS & STREAK ============

/**
 * Update user points
 * @param {number} points - Points to add
 */
function addUserPoints(points) {
    const current = getStorage(STORAGE_KEYS.POINTS, 0);
    setStorage(STORAGE_KEYS.POINTS, current + points);
}

/**
 * Get user points
 * @returns {number} User points
 */
function getUserPoints() {
    return getStorage(STORAGE_KEYS.POINTS, 0);
}

/**
 * Update daily streak
 * @returns {number} Current streak
 */
function updateDailyStreak() {
    const lastVisit = getStorage(STORAGE_KEYS.LAST_VISIT);
    const today = new Date().toDateString();
    let streak = getStorage(STORAGE_KEYS.DAILY_STREAK, 0);
    
    if (lastVisit === today) return streak;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastVisit === yesterday.toDateString()) {
        streak++;
    } else {
        streak = 1;
    }
    
    setStorage(STORAGE_KEYS.DAILY_STREAK, streak);
    setStorage(STORAGE_KEYS.LAST_VISIT, today);
    
    // Reward for streak
    if (streak >= 7) {
        addUserPoints(50);
        if (typeof showToast !== 'undefined') {
            showToast(`🎉 7-day streak! +50 points!`, 'success');
        }
    } else if (streak >= 3) {
        addUserPoints(20);
        if (typeof showToast !== 'undefined') {
            showToast(`🔥 ${streak} day streak! +20 points!`, 'success');
        }
    }
    
    return streak;
}

// ============ COOKIES ============

/**
 * Set cookie
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Days to expire
 */
function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

/**
 * Get cookie
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value
 */
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// ============ VISITOR ID ============

/**
 * Get or create visitor ID
 * @returns {string} Visitor ID
 */
function getVisitorId() {
    let id = getStorage(STORAGE_KEYS.VISITOR_ID);
    if (!id) {
        id = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        setStorage(STORAGE_KEYS.VISITOR_ID, id);
    }
    return id;
}