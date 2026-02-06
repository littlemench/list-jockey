import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeCodeForToken } from '../utils/spotify';
import { useSpotify } from '../context/SpotifyContext';

export default function CallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth } = useSpotify();
  const [error, setError] = useState(null);

  useEffect(() => {
    handleCallback();
  }, []);

  async function handleCallback() {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setError('Authorization was denied. Please try again.');
      return;
    }

    if (!code) {
      setError('No authorization code received.');
      return;
    }

    try {
      await exchangeCodeForToken(code);
      await checkAuth();
      navigate('/');
    } catch (err) {
      console.error('Token exchange failed:', err);
      setError('Failed to complete authorization. Please try again.');
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="text-neutral-400 hover:text-neutral-900 transition-colors"
        >
          Back to home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-neutral-400">Connecting to Spotify...</div>
    </div>
  );
}
