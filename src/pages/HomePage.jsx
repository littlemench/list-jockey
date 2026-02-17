import { Link, useNavigate } from 'react-router-dom';
import { useSessions } from '../context/SessionContext';
import { useSpotify } from '../context/SpotifyContext';
import { loginWithSpotify } from '../utils/spotify';

export default function HomePage() {
  const { sessions, deleteSession } = useSessions();
  const { user, isLoading, isAuthenticated, logout } = useSpotify();
  const navigate = useNavigate();

  function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <div className="text-center max-w-md">
          <div className="flex flex-col items-center mb-6">
            <img src="/logo.png" alt="List Jockey" className="w-32 h-32 mb-4" />
            <h1 className="text-4xl font-medium tracking-tight text-neutral-900">List Jockey</h1>
          </div>
          <p className="text-neutral-500 mb-10 text-lg leading-relaxed">
            Plan the arc of your event's soundtrack. Connect with Spotify to create playlists automatically.
          </p>
          <button
            onClick={loginWithSpotify}
            className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-8 py-3 rounded-full transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Connect with Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="List Jockey" className="w-7 h-7" />
            <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Sessions</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-neutral-500 text-sm">{user?.display_name}</span>
            <button
              onClick={logout}
              className="text-neutral-500 hover:text-neutral-900 text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Session List */}
        <div className="space-y-3 mb-8">
          {sessions.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-neutral-500 mb-2">No Sessions Yet</p>
              <p className="text-neutral-400 text-sm">Build your first session by creating one or more sections to get started</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="group flex items-center justify-between p-5 bg-neutral-50 rounded-2xl border border-neutral-200 hover:border-neutral-300 transition-all"
              >
                <Link to={`/session/${session.id}`} className="flex-1 min-w-0">
                  <h2 className="font-medium text-lg text-neutral-900 mb-1">{session.name}</h2>
                  <p className="text-neutral-500 text-sm">
                    {formatDuration(session.duration)} · {session.sections.length} section{session.sections.length !== 1 ? 's' : ''}
                  </p>
                </Link>
                <button
                  onClick={() => deleteSession(session.id)}
                  className="text-neutral-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete session"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* New Session Button */}
        <button
          onClick={() => navigate('/session/new')}
          className="w-full p-5 border border-dashed border-neutral-300 rounded-2xl text-neutral-500 hover:text-neutral-900 hover:border-neutral-400 transition-all"
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            Create New Session
          </span>
        </button>
      </div>
    </div>
  );
}
