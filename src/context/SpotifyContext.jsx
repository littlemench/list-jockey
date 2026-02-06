import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, logout as spotifyLogout, getAccessToken } from '../utils/spotify';

const SpotifyContext = createContext(null);

export function SpotifyProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    setIsLoading(true);
    try {
      const token = await getAccessToken();
      if (token) {
        const userData = await getCurrentUser();
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    spotifyLogout();
    setUser(null);
    setIsAuthenticated(false);
  }

  return (
    <SpotifyContext.Provider value={{ user, isLoading, isAuthenticated, logout, checkAuth }}>
      {children}
    </SpotifyContext.Provider>
  );
}

export function useSpotify() {
  const context = useContext(SpotifyContext);
  if (!context) {
    throw new Error('useSpotify must be used within a SpotifyProvider');
  }
  return context;
}
