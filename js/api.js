// ============ API MODULE ============

let GAMES_CACHE = null;
let CATEGORIES_CACHE = null;

// Default games data (fallback if JSON fetch fails)
const DEFAULT_GAMES = [
    {
        id: "1",
        name: "🏎 Asphalt 9",
        shortDesc: "High-octane arcade racing with stunning graphics",
        longDesc: "Experience the thrill of extreme racing with over 50 licensed cars. Race against players worldwide, perform spectacular stunts, and unlock the most prestigious hypercars. With intuitive controls and breathtaking visuals, Asphalt 9 delivers the most immersive racing experience on mobile.",
        category: "racing",
        tags: ["racing", "arcade", "multiplayer", "cars", "stunts"],
        popularity: 98,
        rating: 4.6,
        image: "https://play-lh.googleusercontent.com/3O0RARWyhJaNj0r6GP_Oa_AaUZ0xn3dUA2M3AaPPqW4fm8mD02vUF52nkN8q0zdY_pYoztQXs2b5hz5DtkHokm4=w5120-h2880-rw",
        trailerUrl: "https://www.youtube.com/embed/4DCAQ1eQzQI",
        downloadLink: "#"
    },
    {
        id: "2",
        name: "🔫 Call of Duty Mobile",
        shortDesc: "Console-quality FPS on mobile",
        longDesc: "Call of Duty Mobile delivers the most intense first-person shooter experience on mobile devices. Featuring classic maps, beloved game modes, and iconic characters from the Call of Duty franchise. Compete in 5v5 multiplayer battles, fight for survival in Battle Royale, and rank up through competitive seasons.",
        category: "fps",
        tags: ["fps", "shooter", "multiplayer", "battle royale", "competitive"],
        popularity: 99,
        rating: 4.8,
        image: "https://play-lh.googleusercontent.com/BJ-Lb_kL7F_RcKl2F1p9m3CdXryDgUQHd5C0dg8H7D0_nxoMpN702UrOX8GLhx-FC-lxT7FZ7L5f4ySLoxy2=w1052-h592-rw",
        trailerUrl: "https://www.youtube.com/embed/0ElaZOxeAMM",
        downloadLink: "#"
    },
    {
        id: "3",
        name: "⚔️ Genshin Impact",
        shortDesc: "Open-world action RPG",
        longDesc: "Step into Teyvat, a vast world teeming with mythical creatures and elemental magic. Explore seven nations, meet a diverse cast of characters with unique personalities and abilities, and unravel the mysteries of the gods.",
        category: "rpg",
        tags: ["rpg", "open-world", "anime", "adventure"],
        popularity: 97,
        rating: 4.7,
        image: "https://play-lh.googleusercontent.com/1mPgBvHrDQ8yWvO6G2iKhVqYNYMPLMyHkz4rPPXOgQ3FpXF8OxBsE_jLLaEjEIXQ4NQ=w526-h296-rw",
        trailerUrl: "https://www.youtube.com/embed/HLUY1nICQRY",
        downloadLink: "#"
    },
    {
        id: "4",
        name: "👑 PUBG Mobile",
        shortDesc: "Battle royale action",
        longDesc: "Winner Winner Chicken Dinner! Drop into intense 100-player battles, loot weapons and gear, and be the last one standing. Experience the original battle royale sensation on mobile.",
        category: "battle-royale",
        tags: ["battle-royale", "shooter", "multiplayer"],
        popularity: 96,
        rating: 4.5,
        image: "https://play-lh.googleusercontent.com/JcWUm9rXH0QCVt-RrYb2LZ9v0T5K7j8y6U5iI4o3pO2iIuYtRrEeWwQqQ",
        trailerUrl: "https://www.youtube.com/embed/LOe0wOqsn2c",
        downloadLink: "#"
    },
    {
        id: "5",
        name: "🎯 Free Fire",
        shortDesc: "Fast-paced battle royale",
        longDesc: "10-minute survival shooter. 50 players drop on a deserted island, fight for weapons and survival, and become the last one standing. Quick matches, intense action!",
        category: "battle-royale",
        tags: ["battle-royale", "action", "fast-paced"],
        popularity: 95,
        rating: 4.4,
        image: "https://play-lh.googleusercontent.com/3WZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZx",
        trailerUrl: "https://www.youtube.com/embed/_LVweYjUEWk",
        downloadLink: "#"
    },
    {
        id: "6",
        name: "🏁 Need for Speed",
        shortDesc: "Street racing at its finest",
        longDesc: "Outrun the cops, take down rival crews, and build the ultimate dream garage. Authentic racing experience with deep customization and thrilling police chases.",
        category: "racing",
        tags: ["racing", "cars", "arcade"],
        popularity: 94,
        rating: 4.5,
        image: "https://play-lh.googleusercontent.com/8rXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx",
        trailerUrl: "https://www.youtube.com/embed/U5_wnXQTc1s",
        downloadLink: "#"
    }
];

/**
 * Fetch games from JSON file
 * @returns {Promise<Array>} Games array
 */
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
        console.error('Error fetching games, using defaults:', error);
        GAMES_CACHE = DEFAULT_GAMES;
        return DEFAULT_GAMES;
    }
}

/**
 * Get game by ID
 * @param {string} gameId - Game ID
 * @returns {Promise<Object|null>} Game object
 */
async function getGameById(gameId) {
    const games = await fetchGames();
    return games.find(game => game.id == gameId) || null;
}

/**
 * Search games by query
 * @param {string} query - Search query
 * @returns {Promise<Array>} Filtered games
 */
async function searchGames(query) {
    const games = await fetchGames();
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) return games;
    
    return games.filter(game => 
        game.name.toLowerCase().includes(searchTerm) ||
        (game.shortDesc && game.shortDesc.toLowerCase().includes(searchTerm)) ||
        (game.tags && game.tags.some(tag => tag.toLowerCase().includes(searchTerm))) ||
        (game.category && game.category.toLowerCase().includes(searchTerm))
    );
}

/**
 * Filter games by category
 * @param {string} category - Category name
 * @returns {Promise<Array>} Filtered games
 */
async function filterByCategory(category) {
    const games = await fetchGames();
    if (category === 'all') return games;
    return games.filter(game => game.category === category);
}

/**
 * Get trending games based on views and likes
 * @param {number} limit - Number of games to return
 * @returns {Promise<Array>} Trending games
 */
async function getTrendingGames(limit = 10) {
    const games = await fetchGames();
    return [...games]
        .sort((a, b) => {
            const scoreA = (getGameViews(a.id) || 0) + (getGameLikes(a.id) || 0);
            const scoreB = (getGameViews(b.id) || 0) + (getGameLikes(b.id) || 0);
            return scoreB - scoreA;
        })
        .slice(0, limit);
}

/**
 * Get most liked games
 * @param {number} limit - Number of games to return
 * @returns {Promise<Array>} Most liked games
 */
async function getMostLikedGames(limit = 10) {
    const games = await fetchGames();
    return [...games]
        .sort((a, b) => (getGameLikes(b.id) || 0) - (getGameLikes(a.id) || 0))
        .slice(0, limit);
}

/**
 * Get most viewed games
 * @param {number} limit - Number of games to return
 * @returns {Promise<Array>} Most viewed games
 */
async function getMostViewedGames(limit = 10) {
    const games = await fetchGames();
    return [...games]
        .sort((a, b) => (getGameViews(b.id) || 0) - (getGameViews(a.id) || 0))
        .slice(0, limit);
}

/**
 * Get recently added games
 * @param {number} limit - Number of games to return
 * @returns {Promise<Array>} Recent games
 */
async function getRecentGames(limit = 10) {
    const games = await fetchGames();
    return [...games]
        .sort((a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0))
        .slice(0, limit);
}

/**
 * Get similar games based on category and tags
 * @param {string} gameId - Current game ID
 * @param {string} category - Game category
 * @param {Array} tags - Game tags
 * @param {number} limit - Number of games to return
 * @returns {Promise<Array>} Similar games
 */
async function getSimilarGames(gameId, category, tags = [], limit = 6) {
    const games = await fetchGames();
    
    return games
        .filter(game => game.id !== gameId)
        .sort((a, b) => {
            let scoreA = 0, scoreB = 0;
            
            // Category match
            if (a.category === category) scoreA += 10;
            if (b.category === category) scoreB += 10;
            
            // Tag matches
            if (a.tags) {
                const tagMatchesA = a.tags.filter(tag => tags.includes(tag)).length;
                scoreA += tagMatchesA * 5;
            }
            if (b.tags) {
                const tagMatchesB = b.tags.filter(tag => tags.includes(tag)).length;
                scoreB += tagMatchesB * 5;
            }
            
            // Popularity
            scoreA += (getGameViews(a.id) || 0) / 1000;
            scoreB += (getGameViews(b.id) || 0) / 1000;
            
            return scoreB - scoreA;
        })
        .slice(0, limit);
}

/**
 * Get personalized recommendations
 * @param {number} limit - Number of games to return
 * @returns {Promise<Array>} Recommended games
 */
async function getRecommendedGames(limit = 10) {
    const games = await fetchGames();
    const favorites = getFavorites();
    const recent = getRecentlyPlayed();
    
    return games
        .sort((a, b) => {
            let scoreA = 0, scoreB = 0;
            
            // Favorite bonus
            if (favorites.includes(a.id)) scoreA += 50;
            if (favorites.includes(b.id)) scoreB += 50;
            
            // Recently played bonus
            const recentIndexA = recent.indexOf(a.id);
            const recentIndexB = recent.indexOf(b.id);
            if (recentIndexA !== -1) scoreA += (10 - recentIndexA);
            if (recentIndexB !== -1) scoreB += (10 - recentIndexB);
            
            // Popularity
            scoreA += (getGameViews(a.id) || 0) / 1000;
            scoreB += (getGameViews(b.id) || 0) / 1000;
            scoreA += (getGameLikes(a.id) || 0) / 100;
            scoreB += (getGameLikes(b.id) || 0) / 100;
            
            return scoreB - scoreA;
        })
        .slice(0, limit);
}

/**
 * Get all unique categories from games
 * @returns {Promise<Array>} Categories list
 */
async function getCategories() {
    if (CATEGORIES_CACHE) return CATEGORIES_CACHE;
    
    const games = await fetchGames();
    const categories = [...new Set(games.map(game => game.category))];
    CATEGORIES_CACHE = categories;
    return categories;
}

/**
 * Get all unique tags from games
 * @returns {Promise<Array>} Tags list
 */
async function getAllTags() {
    const games = await fetchGames();
    const tags = new Set();
    games.forEach(game => {
        if (game.tags) {
            game.tags.forEach(tag => tags.add(tag));
        }
    });
    return [...tags];
}