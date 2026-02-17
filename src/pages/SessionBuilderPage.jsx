import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessions } from '../context/SessionContext';
import { getGenreSeeds, searchArtists, searchTracks } from '../utils/spotify';

const COLORS = ['#FFAEBC', '#A0E7E5', '#B4F8C8', '#FBE7C6'];

function ExpandableSection({ section, index, onUpdate, onRemove, isExpanded, onToggleExpand }) {
  const [availableGenres, setAvailableGenres] = useState([]);
  const [artistQuery, setArtistQuery] = useState('');
  const [artistResults, setArtistResults] = useState([]);
  const [trackQuery, setTrackQuery] = useState('');
  const [trackResults, setTrackResults] = useState([]);
  const [isSearchingArtists, setIsSearchingArtists] = useState(false);
  const [isSearchingTracks, setIsSearchingTracks] = useState(false);
  const [genreFilter, setGenreFilter] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const color = COLORS[index % COLORS.length];

  const emojis = ['🎵', '🎸', '🎹', '🎤', '🎧', '🎺', '🎷', '🥁', '🎻', '🪕', '🪘', '🎼', '🔊', '📻', '💿', '🎶', '🌟', '⚡', '🔥', '💫', '✨', '🌈', '🎯', '🚀'];

  useEffect(() => {
    if (isExpanded) {
      loadGenres();
    }
  }, [isExpanded]);

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

  async function loadGenres() {
    const genres = await getGenreSeeds();
    setAvailableGenres(genres);
  }

  function handleToggleGenre(genre) {
    const currentGenres = section.genres || [];
    const newGenres = currentGenres.includes(genre)
      ? currentGenres.filter(g => g !== genre)
      : [...currentGenres, genre];
    onUpdate({ ...section, genres: newGenres });
  }

  function handleAddArtist(artist) {
    const currentArtists = section.artists || [];
    if (currentArtists.some(a => a.id === artist.id)) return;
    const newArtists = [...currentArtists, { id: artist.id, name: artist.name, image: artist.images?.[0]?.url }];
    onUpdate({ ...section, artists: newArtists });
    setArtistQuery('');
    setArtistResults([]);
  }

  function handleRemoveArtist(artistId) {
    const newArtists = (section.artists || []).filter(a => a.id !== artistId);
    onUpdate({ ...section, artists: newArtists });
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
    onUpdate({ ...section, tracks: newTracks });
    setTrackQuery('');
    setTrackResults([]);
  }

  function handleRemoveTrack(trackId) {
    const newTracks = (section.tracks || []).filter(t => t.id !== trackId);
    onUpdate({ ...section, tracks: newTracks });
  }

  const filteredGenres = genreFilter
    ? availableGenres.filter(g => g.toLowerCase().includes(genreFilter.toLowerCase()))
    : availableGenres;

  function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  return (
    <div className="bg-neutral-50 rounded-2xl border border-neutral-200 overflow-hidden">
      {/* Section Header - Always Visible */}
      <div className="flex items-center gap-4 p-4">
        <div
          className="w-2 h-10 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-2xl hover:scale-110 transition-transform cursor-pointer"
                title="Change icon"
              >
                {section.emoji || '🎵'}
              </button>
              {showEmojiPicker && (
                <div className="absolute z-20 top-full left-0 mt-2 p-3 bg-white border border-neutral-200 rounded-lg shadow-lg">
                  <div className="grid grid-cols-6 gap-2 max-w-xs">
                    {emojis.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => {
                          onUpdate({ ...section, emoji });
                          setShowEmojiPicker(false);
                        }}
                        className="text-2xl hover:scale-125 transition-transform cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <input
              type="text"
              value={section.name}
              onChange={(e) => onUpdate({ ...section, name: e.target.value })}
              placeholder="Click to edit section name"
              className="flex-1 bg-transparent text-lg font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-200 rounded px-2 py-1 -ml-2"
            />
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={15}
              max={180}
              step={15}
              value={section.duration}
              onChange={(e) => onUpdate({ ...section, duration: Number(e.target.value) })}
              className="w-32"
            />
            <span className="text-sm text-neutral-500">{formatDuration(section.duration)}</span>
          </div>
        </div>
        <button
          onClick={onToggleExpand}
          className="text-neutral-500 hover:text-neutral-900 p-2 transition-colors"
          title={isExpanded ? "Collapse" : "Expand"}
        >
          <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button
          onClick={onRemove}
          className="text-neutral-400 hover:text-red-500 p-2 transition-colors"
          title="Remove section"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Section Details - Expandable */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-6 border-t border-neutral-200 pt-4">
          {/* Genres */}
          <div>
            <h3 className="text-sm font-medium text-neutral-900 mb-3">Genres</h3>
            {section.genres?.length > 0 && (
              <div className="mb-3 p-3 bg-white border border-neutral-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-neutral-600">Selected ({section.genres.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {section.genres.map(genre => (
                    <button
                      key={genre}
                      onClick={() => handleToggleGenre(genre)}
                      className="px-3 py-1.5 rounded-full text-sm bg-neutral-900 text-white hover:bg-neutral-700 transition-all cursor-pointer"
                    >
                      {genre} ×
                    </button>
                  ))}
                </div>
              </div>
            )}
            <input
              type="text"
              placeholder="Filter genres..."
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="w-full mb-3 bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-400 placeholder:text-neutral-400 text-neutral-900"
            />
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {filteredGenres.map(genre => (
                <button
                  key={genre}
                  onClick={() => handleToggleGenre(genre)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all cursor-pointer ${
                    section.genres?.includes(genre)
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Artists */}
          <div>
            <h3 className="text-sm font-medium text-neutral-900 mb-3">Reference Artists</h3>
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search artists..."
                value={artistQuery}
                onChange={(e) => setArtistQuery(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-400 placeholder:text-neutral-400 text-neutral-900"
              />
              {artistResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {artistResults.map(artist => (
                    <button
                      key={artist.id}
                      onClick={() => handleAddArtist(artist)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors text-left"
                    >
                      {artist.images?.[0] && (
                        <img src={artist.images[0].url} alt={artist.name} className="w-10 h-10 rounded-full object-cover" />
                      )}
                      <span className="text-sm text-neutral-900">{artist.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {section.artists?.length > 0 && (
              <div className="space-y-2">
                {section.artists.map(artist => (
                  <div key={artist.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-neutral-200">
                    {artist.image && (
                      <img src={artist.image} alt={artist.name} className="w-8 h-8 rounded-full object-cover" />
                    )}
                    <span className="flex-1 text-sm text-neutral-900">{artist.name}</span>
                    <button
                      onClick={() => handleRemoveArtist(artist.id)}
                      className="text-neutral-400 hover:text-red-500 p-1 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tracks */}
          <div>
            <h3 className="text-sm font-medium text-neutral-900 mb-3">Tracks</h3>
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search tracks..."
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-400 placeholder:text-neutral-400 text-neutral-900"
              />
              {trackResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {trackResults.map(track => (
                    <button
                      key={track.id}
                      onClick={() => handleAddTrack(track)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors text-left"
                    >
                      {track.album?.images?.[0] && (
                        <img src={track.album.images[0].url} alt={track.name} className="w-10 h-10 rounded object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-900 truncate">{track.name}</p>
                        <p className="text-xs text-neutral-500 truncate">{track.artists?.[0]?.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {section.tracks?.length > 0 && (
              <div className="space-y-2">
                {section.tracks.map(track => (
                  <div key={track.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-neutral-200">
                    {track.image && (
                      <img src={track.image} alt={track.name} className="w-8 h-8 rounded object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-900 truncate">{track.name}</p>
                      <p className="text-xs text-neutral-500 truncate">{track.artist}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveTrack(track.id)}
                      className="text-neutral-400 hover:text-red-500 p-1 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BPM & Intensity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">BPM Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={60}
                  max={200}
                  value={section.bpmMin || ''}
                  onChange={(e) => onUpdate({ ...section, bpmMin: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Min"
                  className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-400 placeholder:text-neutral-400 text-neutral-900"
                />
                <input
                  type="number"
                  min={60}
                  max={200}
                  value={section.bpmMax || ''}
                  onChange={(e) => onUpdate({ ...section, bpmMax: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Max"
                  className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-400 placeholder:text-neutral-400 text-neutral-900"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                Intensity: {section.intensity !== null && section.intensity !== undefined ? section.intensity : 50}
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={section.intensity !== null && section.intensity !== undefined ? section.intensity : 50}
                onChange={(e) => onUpdate({ ...section, intensity: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SessionBuilderPage() {
  const navigate = useNavigate();
  const { createSession, addSection } = useSessions();
  const [sessionName, setSessionName] = useState('');
  const [sections, setSections] = useState([]);
  const [expandedSections, setExpandedSections] = useState(new Set());

  function handleAddSection() {
    const newSection = {
      id: Date.now().toString(),
      name: `Section ${sections.length + 1}`,
      duration: 60,
      genres: [],
      artists: [],
      tracks: [],
      bpm: null,
      intensity: 50,
    };
    setSections([...sections, newSection]);
    setExpandedSections(new Set([...expandedSections, newSection.id]));
  }

  function handleUpdateSection(updatedSection) {
    setSections(sections.map(s => s.id === updatedSection.id ? updatedSection : s));
  }

  function handleRemoveSection(id) {
    setSections(sections.filter(s => s.id !== id));
    const newExpanded = new Set(expandedSections);
    newExpanded.delete(id);
    setExpandedSections(newExpanded);
  }

  function handleToggleExpand(id) {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  }

  function handleCreateSession() {
    if (!sessionName.trim()) {
      alert('Please enter a session name');
      return;
    }

    if (sections.length === 0) {
      alert('Please add at least one section');
      return;
    }

    // Create the session
    const totalDuration = sections.reduce((sum, s) => sum + s.duration, 0);
    const session = createSession(sessionName.trim(), totalDuration);

    // Add all sections with their details
    sections.forEach(section => {
      addSection(session.id, {
        name: section.name,
        duration: section.duration,
        genres: section.genres || [],
        artists: section.artists || [],
        tracks: section.tracks || [],
        bpm: section.bpm,
        intensity: section.intensity,
      });
    });

    // Navigate to session overview
    navigate(`/session/${session.id}`);
  }

  function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  const totalDuration = sections.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="mb-10">
          <button
            onClick={() => navigate('/')}
            className="text-neutral-500 hover:text-neutral-900 text-sm mb-6 inline-flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            Cancel
          </button>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900 mb-2">Create New Session</h1>
          <p className="text-neutral-500">Build your session structure and refine each section</p>
        </header>

        {/* Session Name */}
        <div className="mb-8">
          <label className="block text-sm text-neutral-500 mb-2 font-medium">Session Name</label>
          <input
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="e.g., Saturday House Party"
            className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400 placeholder:text-neutral-400 text-neutral-900"
            autoFocus
          />
        </div>

        {/* Sections List */}
        <div className="mb-6">
          <h2 className="text-xs text-neutral-500 uppercase tracking-wider font-medium mb-4">
            Sections {sections.length > 0 && `(${sections.length})`}
          </h2>

          {sections.length === 0 ? (
            <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-neutral-200 mb-4">
              <p className="text-neutral-500 mb-2">No sections yet</p>
              <p className="text-neutral-400 text-sm">Add your first section to get started</p>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {sections.map((section, index) => (
                <ExpandableSection
                  key={section.id}
                  section={section}
                  index={index}
                  onUpdate={handleUpdateSection}
                  onRemove={() => handleRemoveSection(section.id)}
                  isExpanded={expandedSections.has(section.id)}
                  onToggleExpand={() => handleToggleExpand(section.id)}
                />
              ))}
            </div>
          )}

          <button
            onClick={handleAddSection}
            className="w-full p-4 border border-neutral-300 rounded-2xl text-neutral-500 hover:text-neutral-900 hover:border-neutral-400 transition-all cursor-pointer"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              Add Section
            </span>
          </button>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      {sections.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent border-t border-neutral-200">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-neutral-500 text-sm">Total Duration</span>
              <span className="text-neutral-900 font-medium">{formatDuration(totalDuration)}</span>
            </div>
            <button
              onClick={handleCreateSession}
              disabled={!sessionName.trim() || sections.length === 0}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-3.5 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Create Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
