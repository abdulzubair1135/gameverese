// API MODULE

let GAMES_CACHE = null;
let ADS_CACHE = null;

async function fetchGames() {
  if (GAMES_CACHE) return GAMES_CACHE;
  
  try {
    const response = await fetch('games.json');
    if (!response.ok) throw new Error('Failed to load games');
    const games = await response.json();
    GAMES_CACHE = games;
    console.log('✅ Games loaded:', games.length);
    return games;
  } catch (error) {
    console.error('Error fetching games:', error);
    return [];
  }
}

async function fetchAds() {
  if (ADS_CACHE) return ADS_CACHE;
  
  try {
    const response = await fetch('ads.json');
    if (!response.ok) throw new Error('Failed to load ads');
    const ads = await response.json();
    ADS_CACHE = ads;
    return ads;
  } catch (error) {
    console.error('Error fetching ads:', error);
    return [];
  }
}

async function getGameById(gameId) {
  const games = await fetchGames();
  return games.find(game => game.id == gameId);
}

async function getTrendingGames(limit = 10) {
  const games = await fetchGames();
  const likes = getStorage(STORAGE_KEYS.LIKES, {});
  const views = getStorage(STORAGE_KEYS.VIEWS, {});
  
  const scoredGames = games.map(game => {
    const likeCount = likes[game.id] || 0;
    const viewCount = views[game.id] || 0;
    const age = game.date ? (Date.now() - new Date(game.date)) / (1000 * 60 * 60 * 24) : 1;
    const score = (likeCount * 5 + viewCount * 2) / (age + 1);
    return { ...game, trendingScore: score };
  });
  
  return scoredGames.sort((a, b) => b.trendingScore - a.trendingScore).slice(0, limit);
}

async function getMostLikedGames(limit = 10) {
  const games = await fetchGames();
  const likes = getStorage(STORAGE_KEYS.LIKES, {});
  return [...games].sort((a, b) => (likes[b.id] || 0) - (likes[a.id] || 0)).slice(0, limit);
}

async function getMostViewedGames(limit = 10) {
  const games = await fetchGames();
  const views = getStorage(STORAGE_KEYS.VIEWS, {});
  return [...games].sort((a, b) => (views[b.id] || 0) - (views[a.id] || 0)).slice(0, limit);
}

async function getRecentGamesAPI(limit = 10) {
  const games = await fetchGames();
  return [...games].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, limit);
}

async function searchGames(query) {
  const games = await fetchGames();
  const searchTerm = query.toLowerCase();
  return games.filter(game => 
    game.name.toLowerCase().includes(searchTerm) ||
    game.desc.toLowerCase().includes(searchTerm) ||
    (game.tags && game.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
  );
}

async function filterByCategory(category) {
  const games = await fetchGames();
  if (category === 'all') return games;
  return games.filter(game => game.category === category);
}

async function getSimilarGames(gameId, category, limit = 5) {
  const games = await fetchGames();
  return games.filter(game => game.category === category && game.id != gameId).slice(0, limit);
}

async function getRecommendedGames(limit = 10) {
  const games = await fetchGames();
  const profile = getUserProfile();
  const favorites = getFavorites();
  
  const scoredGames = games.map(game => {
    let score = 0;
    score += (profile[game.category] || 0) * 10;
    if (favorites.includes(game.id)) score += 50;
    score += (getGameLikes(game.id) || 0) * 2;
    score += (getGameViews(game.id) || 0);
    return { ...game, recScore: score };
  });
  
  return scoredGames.sort((a, b) => b.recScore - a.recScore).slice(0, limit);
}