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
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#f9f9f9]">
        <div className="text-center max-w-4xl">
          <h1 className="text-6xl font-bold tracking-tight text-black mb-8">
            Plan your perfect soundtrack
          </h1>
          <p className="text-xl text-neutral-600 mb-16 leading-relaxed">
            Design the arc of your event's music. Connect with Spotify to create playlists automatically.
          </p>
          <button
            onClick={loginWithSpotify}
            className="inline-flex items-center gap-3 bg-black hover:bg-neutral-800 text-white font-medium text-base px-8 py-3.5 rounded-lg transition-all cursor-pointer"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Start with Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <h1 className="text-3xl font-bold tracking-tight text-black">Your Sessions</h1>
          <div className="flex items-center gap-6">
            <span className="text-neutral-600 text-sm">{user?.display_name}</span>
            <button
              onClick={logout}
              className="text-neutral-600 hover:text-black text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Session List */}
        <div className="space-y-4 mb-8">
          {sessions.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg border border-black">
              <p className="text-neutral-500 text-base mb-2">No sessions yet</p>
              <p className="text-neutral-400 text-sm">Create your first session to get started</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="group flex items-center justify-between p-6 bg-white rounded-lg transition-all border border-black"
              >
                <Link to={`/session/${session.id}`} className="flex-1 min-w-0">
                  <h2 className="font-bold text-lg text-black mb-1">{session.name}</h2>
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
          className="w-full py-3.5 bg-black hover:bg-neutral-800 rounded-lg text-white font-medium transition-all cursor-pointer text-base"
        >
          Create New Session
        </button>
      </div>
    </div>
  );
}
