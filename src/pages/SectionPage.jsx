import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSessions } from '../context/SessionContext';
import { getGenreSeeds, searchArtists, searchTracks } from '../utils/spotify';

export default function SectionPage() {
  const { sessionId, sectionId } = useParams();
  const navigate = useNavigate();
  const { getSession, updateSection, deleteSection } = useSessions();

  const [session, setSession] = useState(null);
  const [section, setSection] = useState(null);
  const [availableGenres, setAvailableGenres] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDuration, setEditDuration] = useState(60);

  // Search states
  const [artistQuery, setArtistQuery] = useState('');
  const [artistResults, setArtistResults] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [trackQuery, setTrackQuery] = useState('');
  const [trackResults, setTrackResults] = useState([]);
  const [isSearchingArtists, setIsSearchingArtists] = useState(false);
  const [isSearchingTracks, setIsSearchingTracks] = useState(false);
  const [genreFilter, setGenreFilter] = useState('');

  useEffect(() => {
    loadData();
  }, [sessionId, sectionId]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (artistQuery.length >= 2) {
        setIsSearchingArtists(true);
        const results = await searchArtists(artistQuery);
        setArtistResults(results);
        setIsSearchingArtists(false);
      } else {
        setArtistResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [artistQuery]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (trackQuery.length >= 2) {
        setIsSearchingTracks(true);
        const results = await searchTracks(trackQuery);
        setTrackResults(results);
        setIsSearchingTracks(false);
      } else {
        setTrackResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [trackQuery]);

  async function loadData() {
    const s = getSession(sessionId);
    if (!s) {
      navigate('/');
      return;
    }
    setSession(s);

    const sec = s.sections.find(sec => sec.id === sectionId);
    if (!sec) {
      navigate(`/session/${sessionId}`);
      return;
    }
    setSection(sec);
    setEditName(sec.name);
    setEditDuration(sec.duration);

    const genres = await getGenreSeeds();
    setAvailableGenres(genres);
  }

  function handleUpdateBasics(e) {
    e.preventDefault();
    if (!editName.trim()) return;
    const updated = updateSection(sessionId, sectionId, {
      name: editName.trim(),
      duration: editDuration,
    });
    if (updated) {
      const sec = updated.sections.find(s => s.id === sectionId);
      setSection(sec);
    }
    setIsEditing(false);
  }

  function handleDurationChange(newDuration) {
    const updated = updateSection(sessionId, sectionId, { duration: newDuration });
    if (updated) {
      const sec = updated.sections.find(s => s.id === sectionId);
      setSection(sec);
      setSession(getSession(sessionId));
      setEditDuration(newDuration);
    }
  }

  function getSessionTotalDuration() {
    if (!session) return 0;
    return session.sections.reduce((acc, s) => acc + s.duration, 0);
  }

  function handleToggleGenre(genre) {
    const currentGenres = section.genres || [];
    const newGenres = currentGenres.includes(genre)
      ? currentGenres.filter(g => g !== genre)
      : [...currentGenres, genre];
    const updated = updateSection(sessionId, sectionId, { genres: newGenres });
    if (updated) {
      const sec = updated.sections.find(s => s.id === sectionId);
      setSection(sec);
    }
  }

  function handleAddArtist(artist) {
    const currentArtists = section.artists || [];
    if (currentArtists.some(a => a.id === artist.id)) return;
    const newArtists = [...currentArtists, { id: artist.id, name: artist.name, image: artist.images?.[0]?.url }];
    const updated = updateSection(sessionId, sectionId, { artists: newArtists });
    if (updated) {
      const sec = updated.sections.find(s => s.id === sectionId);
      setSection(sec);
    }
    setArtistQuery('');
    setArtistResults([]);
  }

  function handleRemoveArtist(artistId) {
    const newArtists = (section.artists || []).filter(a => a.id !== artistId);
    const updated = updateSection(sessionId, sectionId, { artists: newArtists });
    if (updated) {
      const sec = updated.sections.find(s => s.id === sectionId);
      setSection(sec);
    }
  }

  function handleAddTrack(track) {
    const currentTracks = section.tracks || [];
    if (currentTracks.some(t => t.id === track.id)) return;
    const newTracks = [...currentTracks, {
      id: track.id,
      name: track.name,
      artist: track.artists?.[0]?.name,
      image: track.album?.images?.[0]?.url,
    }];
    const updated = updateSection(sessionId, sectionId, { tracks: newTracks });
    if (updated) {
      const sec = updated.sections.find(s => s.id === sectionId);
      setSection(sec);
    }
    setTrackQuery('');
    setTrackResults([]);
  }

  function handleRemoveTrack(trackId) {
    const newTracks = (section.tracks || []).filter(t => t.id !== trackId);
    const updated = updateSection(sessionId, sectionId, { tracks: newTracks });
    if (updated) {
      const sec = updated.sections.find(s => s.id === sectionId);
      setSection(sec);
    }
  }

  function handleBpmChange(value) {
    const updated = updateSection(sessionId, sectionId, { bpm: value || null });
    if (updated) {
      const sec = updated.sections.find(s => s.id === sectionId);
      setSection(sec);
    }
  }

  function handleIntensityChange(value) {
    const updated = updateSection(sessionId, sectionId, { intensity: value });
    if (updated) {
      const sec = updated.sections.find(s => s.id === sectionId);
      setSection(sec);
    }
  }

  function handleDeleteSection() {
    setShowDeleteModal(true);
  }

  function confirmDeleteSection() {
    deleteSection(sessionId, sectionId);
    navigate(`/session/${sessionId}`);
  }

  function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  if (!section) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="mb-10">
          <Link
            to={`/session/${sessionId}`}
            className="text-neutral-500 hover:text-neutral-900 text-sm mb-6 inline-flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            {session?.name}
          </Link>

          {isEditing ? (
            <form onSubmit={handleUpdateBasics} className="space-y-5">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-xl font-light text-neutral-900 focus:outline-none focus:border-neutral-400 placeholder:text-neutral-400"
                autoFocus
              />
              <div>
                <label className="block text-sm text-neutral-500 mb-2 font-medium">
                  Duration: <span className="text-neutral-900">{formatDuration(editDuration)}</span>
                </label>
                <input
                  type="range"
                  min={15}
                  max={180}
                  step={15}
                  value={editDuration}
                  onChange={(e) => setEditDuration(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-neutral-900 text-white px-5 py-2.5 rounded-full font-medium hover:bg-neutral-800 transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(section.name);
                    setEditDuration(section.duration);
                  }}
                  className="text-neutral-500 hover:text-neutral-900 px-5 py-2.5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-start justify-between mb-6">
                <h1 className="text-2xl font-medium tracking-tight text-neutral-900">{section.name}</h1>
                <div className="flex gap-1">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-neutral-500 hover:text-neutral-900 p-2 hover:bg-neutral-100 rounded-lg transition-all"
                    title="Edit name"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleDeleteSection}
                    className="text-neutral-400 hover:text-red-500 p-2 hover:bg-neutral-100 rounded-lg transition-all"
                    title="Delete section"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Duration slider */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-neutral-500 font-medium">Section duration</span>
                  <span className="text-sm font-medium text-neutral-900">{formatDuration(section.duration)}</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={180}
                  step={15}
                  value={section.duration}
                  onChange={(e) => handleDurationChange(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex items-center justify-between mt-3 text-xs text-neutral-500">
                  <span>15m</span>
                  <span className="text-neutral-500">
                    Session total: <span className="text-neutral-900 font-medium">{formatDuration(getSessionTotalDuration())}</span>
                  </span>
                  <span>3h</span>
                </div>
              </div>
            </>
          )}
        </header>

        {/* Inputs */}
        <div className="space-y-10">
          {/* Genres */}
          <div>
            <h2 className="text-xs text-neutral-500 uppercase tracking-wider font-medium mb-4">
              Genres {section.genres?.length > 0 && <span className="text-neutral-900">({section.genres.length})</span>}
            </h2>

            {/* Selected genres */}
            {section.genres?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {section.genres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => handleToggleGenre(genre)}
                    className="px-4 py-2 rounded-full text-sm bg-neutral-900 text-white hover:bg-neutral-800 transition-colors font-medium"
                  >
                    {genre}
                    <span className="ml-2 opacity-60">×</span>
                  </button>
                ))}
              </div>
            )}

            {/* Genre search */}
            <input
              type="text"
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              placeholder="Filter genres..."
              className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:border-neutral-400 placeholder:text-neutral-400 text-neutral-900"
            />

            {/* Available genres */}
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
              {availableGenres
                .filter(genre => !section.genres?.includes(genre))
                .filter(genre => genre.toLowerCase().includes(genreFilter.toLowerCase()))
                .map((genre) => (
                  <button
                    key={genre}
                    onClick={() => handleToggleGenre(genre)}
                    className="px-4 py-2 rounded-full text-sm bg-neutral-50 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-200 transition-colors"
                  >
                    {genre}
                  </button>
                ))}
            </div>
          </div>

          {/* Reference Artists */}
          <div>
            <h2 className="text-xs text-neutral-500 uppercase tracking-wider font-medium mb-4">Reference Artists</h2>

            {/* Selected artists */}
            {section.artists?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {section.artists.map((artist) => (
                  <div
                    key={artist.id}
                    className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-full pl-1.5 pr-4 py-1.5"
                  >
                    {artist.image ? (
                      <img src={artist.image} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-neutral-200" />
                    )}
                    <span className="text-sm font-medium text-neutral-900">{artist.name}</span>
                    <button
                      onClick={() => handleRemoveArtist(artist.id)}
                      className="text-neutral-500 hover:text-neutral-900 ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Artist search */}
            <div className="relative">
              <input
                type="text"
                value={artistQuery}
                onChange={(e) => setArtistQuery(e.target.value)}
                placeholder="Search for an artist..."
                className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400 placeholder:text-neutral-400 text-neutral-900"
              />
              {(artistResults.length > 0 || isSearchingArtists) && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  {isSearchingArtists ? (
                    <div className="p-4 text-neutral-500 text-sm">Searching...</div>
                  ) : (
                    artistResults.map((artist) => (
                      <button
                        key={artist.id}
                        onClick={() => handleAddArtist(artist)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        {artist.images?.[0]?.url ? (
                          <img src={artist.images[0].url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-neutral-200" />
                        )}
                        <span className="font-medium text-neutral-900">{artist.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Reference Tracks */}
          <div>
            <h2 className="text-xs text-neutral-500 uppercase tracking-wider font-medium mb-4">Reference Tracks</h2>

            {/* Selected tracks */}
            {section.tracks?.length > 0 && (
              <div className="space-y-2 mb-4">
                {section.tracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 rounded-xl p-3"
                  >
                    {track.image ? (
                      <img src={track.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-neutral-200" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-neutral-900 truncate">{track.name}</div>
                      <div className="text-sm text-neutral-500 truncate">{track.artist}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveTrack(track.id)}
                      className="text-neutral-400 hover:text-neutral-900 p-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Track search */}
            <div className="relative">
              <input
                type="text"
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                placeholder="Search for a track..."
                className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400 placeholder:text-neutral-400 text-neutral-900"
              />
              {(trackResults.length > 0 || isSearchingTracks) && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  {isSearchingTracks ? (
                    <div className="p-4 text-neutral-500 text-sm">Searching...</div>
                  ) : (
                    trackResults.map((track) => (
                      <button
                        key={track.id}
                        onClick={() => handleAddTrack(track)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors text-left first:rounded-t-xl last:rounded-b-xl"
                      >
                        {track.album?.images?.[0]?.url ? (
                          <img src={track.album.images[0].url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-neutral-200" />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-neutral-900 truncate">{track.name}</div>
                          <div className="text-sm text-neutral-500 truncate">{track.artists?.[0]?.name}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* BPM */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6">
            <h2 className="text-xs text-neutral-500 uppercase tracking-wider font-medium mb-4">
              Target BPM {section.bpm && <span className="text-neutral-900">({section.bpm})</span>}
            </h2>
            <input
              type="range"
              min={60}
              max={180}
              value={section.bpm || 120}
              onChange={(e) => handleBpmChange(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-neutral-500 mt-2">
              <span>60</span>
              <span>120</span>
              <span>180</span>
            </div>
          </div>

          {/* Intensity */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6">
            <h2 className="text-xs text-neutral-500 uppercase tracking-wider font-medium mb-4">
              Intensity {section.intensity !== null && <span className="text-neutral-900">({section.intensity}%)</span>}
            </h2>
            <input
              type="range"
              min={0}
              max={100}
              value={section.intensity || 50}
              onChange={(e) => handleIntensityChange(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-neutral-500 mt-2">
              <span>Chill</span>
              <span>Moderate</span>
              <span>High Energy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Delete section?</h3>
            <p className="text-neutral-500 mb-6">
              This will permanently delete "{section.name}". This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSection}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
