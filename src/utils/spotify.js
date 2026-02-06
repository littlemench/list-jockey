// Spotify API utilities
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const SCOPES = [
  'playlist-modify-public',
  'playlist-modify-private',
  'user-read-private',
].join(' ');

// Fallback genres (Spotify's supported genre seeds)
const FALLBACK_GENRES = [
  'acoustic', 'afrobeat', 'alt-rock', 'alternative', 'ambient', 'blues', 'bossanova',
  'breakbeat', 'british', 'chicago-house', 'chill', 'classical', 'club', 'country',
  'dance', 'dancehall', 'death-metal', 'deep-house', 'disco', 'drum-and-bass', 'dub',
  'dubstep', 'edm', 'electro', 'electronic', 'emo', 'folk', 'funk', 'garage', 'gospel',
  'goth', 'grindcore', 'groove', 'grunge', 'guitar', 'happy', 'hard-rock', 'hardcore',
  'hardstyle', 'heavy-metal', 'hip-hop', 'house', 'idm', 'indie', 'indie-pop', 'industrial',
  'j-pop', 'jazz', 'k-pop', 'latin', 'latino', 'lo-fi', 'metal', 'metalcore', 'minimal-techno',
  'new-age', 'opera', 'party', 'piano', 'pop', 'post-punk', 'power-pop', 'progressive-house',
  'psych-rock', 'punk', 'punk-rock', 'r-n-b', 'rainy-day', 'reggae', 'reggaeton', 'rock',
  'rock-n-roll', 'rockabilly', 'romance', 'sad', 'salsa', 'samba', 'singer-songwriter',
  'ska', 'sleep', 'soul', 'soundtracks', 'spanish', 'study', 'summer', 'synth-pop',
  'tango', 'techno', 'trance', 'trip-hop', 'uk-garage', 'work-out', 'world-music'
];

// Generate random string for PKCE
function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

// Generate code challenge for PKCE
async function generateCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Initiate Spotify login
export async function loginWithSpotify() {
  const codeVerifier = generateRandomString(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  localStorage.setItem('spotify_code_verifier', codeVerifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    scope: SCOPES,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

// Exchange code for access token
export async function exchangeCodeForToken(code) {
  const codeVerifier = localStorage.getItem('spotify_code_verifier');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  // Store tokens
  localStorage.setItem('spotify_access_token', data.access_token);
  localStorage.setItem('spotify_refresh_token', data.refresh_token);
  localStorage.setItem('spotify_token_expires', Date.now() + data.expires_in * 1000);
  localStorage.removeItem('spotify_code_verifier');

  return data.access_token;
}

// Get current access token (refresh if needed)
export async function getAccessToken() {
  const accessToken = localStorage.getItem('spotify_access_token');
  const expiresAt = localStorage.getItem('spotify_token_expires');
  const refreshToken = localStorage.getItem('spotify_refresh_token');

  if (!accessToken) return null;

  // Token still valid
  if (Date.now() < Number(expiresAt) - 60000) {
    return accessToken;
  }

  // Need to refresh
  if (refreshToken) {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      const data = await response.json();

      if (data.error) {
        logout();
        return null;
      }

      localStorage.setItem('spotify_access_token', data.access_token);
      localStorage.setItem('spotify_token_expires', Date.now() + data.expires_in * 1000);
      if (data.refresh_token) {
        localStorage.setItem('spotify_refresh_token', data.refresh_token);
      }

      return data.access_token;
    } catch {
      logout();
      return null;
    }
  }

  return null;
}

// Logout
export function logout() {
  localStorage.removeItem('spotify_access_token');
  localStorage.removeItem('spotify_refresh_token');
  localStorage.removeItem('spotify_token_expires');
}

// Get current user profile
export async function getCurrentUser() {
  const token = await getAccessToken();
  if (!token) return null;

  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return null;
  return response.json();
}

// Get available genre seeds
export async function getGenreSeeds() {
  const token = await getAccessToken();
  if (!token) return FALLBACK_GENRES;

  try {
    const response = await fetch('https://api.spotify.com/v1/recommendations/available-genre-seeds', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return FALLBACK_GENRES;
    const data = await response.json();
    return data.genres?.length > 0 ? data.genres : FALLBACK_GENRES;
  } catch {
    return FALLBACK_GENRES;
  }
}

// Search for artists
export async function searchArtists(query) {
  const token = await getAccessToken();
  if (!token || !query) return [];

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=5`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) return [];
  const data = await response.json();
  return data.artists?.items || [];
}

// Search for tracks
export async function searchTracks(query) {
  const token = await getAccessToken();
  if (!token || !query) return [];

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) return [];
  const data = await response.json();
  return data.tracks?.items || [];
}

// Get artist's top tracks
async function getArtistTopTracks(artistId) {
  const token = await getAccessToken();
  if (!token) return [];

  const response = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) return [];
  const data = await response.json();
  return data.tracks || [];
}

// Search tracks by genre
async function searchTracksByGenre(genre, limit = 20) {
  const token = await getAccessToken();
  if (!token) return [];

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=genre:${encodeURIComponent(genre)}&type=track&limit=${limit}&market=US`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) return [];
  const data = await response.json();
  return data.tracks?.items || [];
}

// Shuffle array (Fisher-Yates)
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Get tracks based on section inputs (alternative to deprecated recommendations API)
export async function getRecommendations({ genres = [], artists = [], tracks = [], targetBpm, targetEnergy, limit = 50 }) {
  const token = await getAccessToken();
  if (!token) {
    console.error('getRecommendations: No access token');
    return [];
  }

  const hasInputs = genres.length > 0 || artists.length > 0 || tracks.length > 0;
  if (!hasInputs) {
    console.error('getRecommendations: No inputs provided', { genres, artists, tracks });
    return [];
  }

  console.log('getRecommendations: Fetching tracks for', { genres, artistCount: artists.length, trackCount: tracks.length });

  const allTracks = [];
  const seenIds = new Set();

  // Add any explicitly selected tracks first
  for (const track of tracks) {
    if (!seenIds.has(track.id)) {
      allTracks.push(track);
      seenIds.add(track.id);
    }
  }

  // Get top tracks from selected artists
  for (const artist of artists.slice(0, 3)) {
    const artistTracks = await getArtistTopTracks(artist.id);
    for (const track of artistTracks) {
      if (!seenIds.has(track.id)) {
        allTracks.push(track);
        seenIds.add(track.id);
      }
    }
  }

  // Search for tracks by genre
  const tracksPerGenre = Math.ceil((limit - allTracks.length) / Math.max(genres.length, 1));
  for (const genre of genres.slice(0, 3)) {
    const genreTracks = await searchTracksByGenre(genre, tracksPerGenre);
    for (const track of genreTracks) {
      if (!seenIds.has(track.id)) {
        allTracks.push(track);
        seenIds.add(track.id);
      }
    }
  }

  // Shuffle and limit results
  const shuffled = shuffleArray(allTracks);
  const result = shuffled.slice(0, limit);

  console.log('getRecommendations: Got', result.length, 'tracks');
  return result;
}

// Create a playlist
export async function createPlaylist(name, description = '') {
  const token = await getAccessToken();
  if (!token) {
    console.error('createPlaylist: No access token');
    return null;
  }

  const user = await getCurrentUser();
  if (!user) {
    console.error('createPlaylist: Could not get user');
    return null;
  }

  console.log('createPlaylist: Creating playlist for user', user.id);

  const response = await fetch(
    `https://api.spotify.com/v1/users/${user.id}/playlists`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description, public: false }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('createPlaylist: API error', response.status, errorData);
    return null;
  }
  const playlist = await response.json();
  console.log('createPlaylist: Created playlist', playlist.id);
  return playlist;
}

// Add tracks to playlist
export async function addTracksToPlaylist(playlistId, trackUris) {
  const token = await getAccessToken();
  if (!token) return false;

  // Spotify allows max 100 tracks per request
  for (let i = 0; i < trackUris.length; i += 100) {
    const batch = trackUris.slice(i, i + 100);
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris: batch }),
      }
    );

    if (!response.ok) return false;
  }

  return true;
}

// Generate playlist for a section
export async function generateSectionPlaylist(section, sessionName) {
  const tracks = await getRecommendations({
    genres: section.genres,
    artists: section.artists,
    tracks: section.tracks,
    targetBpm: section.bpm,
    targetEnergy: section.intensity,
    limit: Math.ceil(section.duration / 3.5), // Assume ~3.5 min per track
  });

  if (tracks.length === 0) return null;

  const playlist = await createPlaylist(
    `${sessionName} - ${section.name}`,
    `Generated section: ${section.genres.join(', ')}`
  );

  if (!playlist) return null;

  const trackUris = tracks.map(t => t.uri);
  const success = await addTracksToPlaylist(playlist.id, trackUris);

  return success ? playlist : null;
}

// Generate playlist for entire session (all sections combined)
export async function generateSessionPlaylist(session) {
  console.log('generateSessionPlaylist: Starting for session', session.name);
  console.log('generateSessionPlaylist: Sections:', session.sections.map(s => ({
    name: s.name,
    genres: s.genres,
    artists: s.artists?.length,
    tracks: s.tracks?.length
  })));

  const allTracks = [];

  for (const section of session.sections) {
    // Skip sections with no inputs
    if (section.genres.length === 0 && section.artists.length === 0 && section.tracks.length === 0) {
      console.log('generateSessionPlaylist: Skipping section with no inputs:', section.name);
      continue;
    }

    console.log('generateSessionPlaylist: Processing section:', section.name);

    const tracks = await getRecommendations({
      genres: section.genres,
      artists: section.artists,
      tracks: section.tracks,
      targetBpm: section.bpm,
      targetEnergy: section.intensity,
      limit: Math.ceil(section.duration / 3.5),
    });

    console.log('generateSessionPlaylist: Got', tracks.length, 'tracks for section', section.name);
    allTracks.push(...tracks);
  }

  if (allTracks.length === 0) {
    console.error('generateSessionPlaylist: No tracks generated');
    return null;
  }

  console.log('generateSessionPlaylist: Total tracks:', allTracks.length);

  // Build description from sections
  const sectionDescriptions = session.sections
    .filter(s => s.genres.length > 0 || s.artists.length > 0)
    .map(s => `${s.name}: ${s.genres.slice(0, 2).join(', ')}`)
    .join(' → ');

  const playlist = await createPlaylist(
    session.name,
    `Soundtrack session: ${sectionDescriptions}`
  );

  if (!playlist) {
    console.error('generateSessionPlaylist: Failed to create playlist');
    return null;
  }

  const trackUris = allTracks.map(t => t.uri);
  const success = await addTracksToPlaylist(playlist.id, trackUris);

  if (!success) {
    console.error('generateSessionPlaylist: Failed to add tracks to playlist');
  }

  return success ? playlist : null;
}
