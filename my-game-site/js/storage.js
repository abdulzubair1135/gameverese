// STORAGE MODULE

const STORAGE_KEYS = {
  LIKES: 'gamehub_likes',
  VIEWS: 'gamehub_views',
  COMMENTS: 'gamehub_comments',
  FAVORITES: 'gamehub_favorites',
  RATINGS: 'gamehub_ratings',
  RECENT: 'gamehub_recent',
  VISITOR_COUNT: 'gamehub_visitor_count',
  CLICK_COUNTER: 'gamehub_click_counter',
  AD_STATS: 'gamehub_ad_stats',
  USER_PROFILE: 'gamehub_user_profile',
  THEME: 'gamehub_theme'
};

function getStorage(key, defaultValue = {}) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

function getGameLikes(gameId) {
  const likes = getStorage(STORAGE_KEYS.LIKES, {});
  return likes[gameId] || 0;
}

function likeGame(gameId) {
  const likes = getStorage(STORAGE_KEYS.LIKES, {});
  likes[gameId] = (likes[gameId] || 0) + 1;
  setStorage(STORAGE_KEYS.LIKES, likes);
  return likes[gameId];
}

function getGameViews(gameId) {
  const views = getStorage(STORAGE_KEYS.VIEWS, {});
  return views[gameId] || 0;
}

function trackGameView(gameId) {
  const views = getStorage(STORAGE_KEYS.VIEWS, {});
  views[gameId] = (views[gameId] || 0) + 1;
  setStorage(STORAGE_KEYS.VIEWS, views);
  return views[gameId];
}

function getFavorites() {
  return getStorage(STORAGE_KEYS.FAVORITES, []);
}

function addFavorite(gameId) {
  const favorites = getFavorites();
  if (!favorites.includes(gameId)) {
    favorites.push(gameId);
    setStorage(STORAGE_KEYS.FAVORITES, favorites);
  }
  return favorites;
}

function removeFavorite(gameId) {
  let favorites = getFavorites();
  favorites = favorites.filter(id => id !== gameId);
  setStorage(STORAGE_KEYS.FAVORITES, favorites);
  return favorites;
}

function isFavorite(gameId) {
  return getFavorites().includes(gameId);
}

function setRating(gameId, rating) {
  const ratings = getStorage(STORAGE_KEYS.RATINGS, {});
  ratings[gameId] = rating;
  setStorage(STORAGE_KEYS.RATINGS, ratings);
}

function getRating(gameId) {
  const ratings = getStorage(STORAGE_KEYS.RATINGS, {});
  return ratings[gameId] || 0;
}

function getComments(gameId) {
  const comments = getStorage(STORAGE_KEYS.COMMENTS, {});
  return comments[gameId] || [];
}

function addComment(gameId, commentText) {
  const comments = getStorage(STORAGE_KEYS.COMMENTS, {});
  if (!comments[gameId]) comments[gameId] = [];
  comments[gameId].push({
    id: Date.now().toString(),
    text: commentText,
    timestamp: new Date().toISOString()
  });
  setStorage(STORAGE_KEYS.COMMENTS, comments);
  return comments[gameId];
}

function addToRecent(gameId) {
  let recent = getStorage(STORAGE_KEYS.RECENT, []);
  recent = [gameId, ...recent.filter(id => id !== gameId)];
  recent = recent.slice(0, 10);
  setStorage(STORAGE_KEYS.RECENT, recent);
  return recent;
}

function getRecentIds() {
  return getStorage(STORAGE_KEYS.RECENT, []);
}

function incrementVisitorCount() {
  let count = getStorage(STORAGE_KEYS.VISITOR_COUNT, 0);
  count++;
  setStorage(STORAGE_KEYS.VISITOR_COUNT, count);
  return count;
}

function updateUserProfile(category) {
  const profile = getStorage(STORAGE_KEYS.USER_PROFILE, {});
  profile[category] = (profile[category] || 0) + 1;
  setStorage(STORAGE_KEYS.USER_PROFILE, profile);
}

function getUserProfile() {
  return getStorage(STORAGE_KEYS.USER_PROFILE, {});
}

function setTheme(theme) {
  setStorage(STORAGE_KEYS.THEME, theme);
  if (theme === 'light') {
    document.body.classList.add('light');
  } else {
    document.body.classList.remove('light');
  }
}

function getTheme() {
  return getStorage(STORAGE_KEYS.THEME, 'dark');
}

function setCookie(name, value, days) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}