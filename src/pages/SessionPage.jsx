import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSessions } from '../context/SessionContext';
import { generateSessionPlaylist } from '../utils/spotify';

const COLORS = ['#FFAEBC', '#A0E7E5', '#B4F8C8', '#FBE7C6'];

function SortableSection({ section, sessionId, onDurationChange, formatDuration, fallbackColorIndex }) {
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [tempDuration, setTempDuration] = useState(section.duration);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Use colorIndex if available, otherwise fall back to array index
  const colorIndex = section.colorIndex ?? fallbackColorIndex;
  const color = COLORS[colorIndex % COLORS.length];

  function handleDurationSave() {
    onDurationChange(section.id, tempDuration);
    setIsEditingDuration(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-4 p-5 bg-neutral-50 rounded-2xl border border-neutral-200 hover:border-neutral-300 transition-all"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-neutral-400 hover:text-neutral-500 cursor-grab active:cursor-grabbing p-1 touch-none"
        title="Drag to reorder"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
        </svg>
      </button>

      {/* Color indicator */}
      <div
        className="w-2 h-10 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />

      {/* Section info */}
      <Link to={`/session/${sessionId}/section/${section.id}`} className="flex-1 min-w-0">
        <h3 className="font-medium text-lg text-neutral-900 mb-0.5">{section.name}</h3>
        <p className="text-neutral-500 text-sm">
          {section.genres.length > 0 && `${section.genres.slice(0, 2).join(', ')}`}
          {section.genres.length > 2 && ` +${section.genres.length - 2}`}
          {section.genres.length === 0 && section.artists.length === 0 && (
            <span className="text-neutral-400 italic">No inputs yet</span>
          )}
          {section.genres.length === 0 && section.artists.length > 0 && (
            `${section.artists.slice(0, 2).map(a => a.name).join(', ')}`
          )}
        </p>
      </Link>

      {/* Duration editor */}
      {isEditingDuration ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={15}
            max={300}
            step={15}
            value={tempDuration}
            onChange={(e) => setTempDuration(Number(e.target.value))}
            className="w-16 bg-white border border-neutral-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-neutral-500 text-neutral-900"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleDurationSave();
              if (e.key === 'Escape') setIsEditingDuration(false);
            }}
          />
          <span className="text-neutral-500 text-sm">min</span>
          <button
            onClick={handleDurationSave}
            className="text-neutral-500 hover:text-neutral-900 p-1"
            title="Save"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setTempDuration(section.duration);
            setIsEditingDuration(true);
          }}
          className="text-neutral-500 hover:text-neutral-900 text-sm px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
          title="Click to edit duration"
        >
          {formatDuration(section.duration)}
        </button>
      )}

      {/* Navigation caret */}
      <Link
        to={`/session/${sessionId}/section/${section.id}`}
        className="text-neutral-400 hover:text-neutral-500 p-2 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

export default function SessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { getSession, updateSession, deleteSession, addSection, updateSection } = useSessions();
  const [session, setSession] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [showNewSection, setShowNewSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionDuration, setNewSectionDuration] = useState(60);
  const [isGenerating, setIsGenerating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const location = useLocation();

  useEffect(() => {
    const s = getSession(sessionId);
    if (!s) {
      navigate('/');
      return;
    }
    setSession(s);
    setEditName(s.name);
  }, [sessionId, getSession, navigate, location.key]);

  function handleDragEnd(event) {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = session.sections.findIndex(s => s.id === active.id);
      const newIndex = session.sections.findIndex(s => s.id === over.id);
      const newSections = arrayMove(session.sections, oldIndex, newIndex);

      updateSession(sessionId, { sections: newSections });
      setSession(prev => ({ ...prev, sections: newSections }));
    }
  }

  function handleUpdateName(e) {
    e.preventDefault();
    if (!editName.trim()) return;
    updateSession(sessionId, { name: editName.trim() });
    setSession(prev => ({ ...prev, name: editName.trim() }));
    setIsEditing(false);
  }

  function handleDeleteSession() {
    if (confirm('Delete this session? This cannot be undone.')) {
      deleteSession(sessionId);
      navigate('/');
    }
  }

  function handleAddSection(e) {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    const updatedSession = addSection(sessionId, {
      name: newSectionName.trim(),
      duration: newSectionDuration,
    });

    // Navigate to the newly added section
    if (updatedSession && updatedSession.sections.length > 0) {
      const newSection = updatedSession.sections[updatedSession.sections.length - 1];
      navigate(`/session/${sessionId}/section/${newSection.id}`);
    }
  }

  function handleDurationChange(sectionId, duration) {
    updateSection(sessionId, sectionId, { duration });
    setSession(getSession(sessionId));
  }

  async function handleGeneratePlaylist() {
    const freshSession = getSession(sessionId);
    if (!freshSession) {
      alert('Session not found.');
      return;
    }

    const sectionsWithInputs = freshSession.sections.filter(
      s => s.genres.length > 0 || s.artists.length > 0 || s.tracks.length > 0
    );

    if (sectionsWithInputs.length === 0) {
      alert('Add inputs (genres, artists, or tracks) to at least one section before generating.');
      return;
    }

    setIsGenerating(true);
    try {
      const playlist = await generateSessionPlaylist(freshSession);
      if (playlist) {
        updateSession(sessionId, {
          playlistId: playlist.id,
          playlistUrl: playlist.external_urls?.spotify,
        });
        setSession(prev => ({
          ...prev,
          playlistId: playlist.id,
          playlistUrl: playlist.external_urls?.spotify,
        }));
        if (playlist.external_urls?.spotify) {
          window.open(playlist.external_urls.spotify, '_blank');
        }
      } else {
        alert('Failed to generate playlist. Try adjusting your inputs.');
      }
    } catch (error) {
      console.error('Playlist generation error:', error);
      alert('An error occurred while generating the playlist.');
    } finally {
      setIsGenerating(false);
    }
  }

  function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  function getTotalSectionDuration() {
    if (!session) return 0;
    return session.sections.reduce((acc, s) => acc + s.duration, 0);
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  const totalSectionDuration = getTotalSectionDuration();

  return (
    <div className="min-h-screen bg-white pb-28">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="mb-10">
          <Link to="/" className="text-neutral-500 hover:text-neutral-900 text-sm mb-6 inline-flex items-center gap-1 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            Sessions
          </Link>

          {isEditing ? (
            <form onSubmit={handleUpdateName} className="flex gap-3">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 bg-white border border-neutral-200 rounded-xl px-4 py-3 text-xl font-light focus:outline-none focus:border-neutral-400 text-neutral-900"
                autoFocus
              />
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
                  setEditName(session.name);
                }}
                className="text-neutral-500 hover:text-neutral-900 px-4 py-2 transition-colors"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-medium tracking-tight text-neutral-900 mb-2">{session.name}</h1>
                <p className="text-neutral-500">
                  {formatDuration(totalSectionDuration)} · {session.sections.length} section{session.sections.length !== 1 ? 's' : ''}
                </p>
              </div>
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
                  onClick={handleDeleteSession}
                  className="text-neutral-400 hover:text-red-500 p-2 hover:bg-neutral-100 rounded-lg transition-all"
                  title="Delete session"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Timeline visualization */}
        {session.sections.length > 0 && totalSectionDuration > 0 && (
          <div className="mb-8">
            <div className="flex h-2 rounded-full overflow-hidden bg-neutral-100">
              {session.sections.map((section, index) => (
                <div
                  key={section.id}
                  className="h-full transition-all"
                  style={{
                    width: `${(section.duration / totalSectionDuration) * 100}%`,
                    backgroundColor: COLORS[(section.colorIndex ?? index) % COLORS.length],
                  }}
                  title={`${section.name}: ${formatDuration(section.duration)}`}
                />
              ))}
            </div>
            <div className="flex mt-2">
              {session.sections.map((section) => (
                <div
                  key={section.id}
                  className="text-xs text-neutral-500 truncate px-1 first:pl-0 last:pr-0"
                  style={{
                    width: `${(section.duration / totalSectionDuration) * 100}%`,
                  }}
                >
                  {section.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section List */}
        <div className="mb-8">
          <h2 className="text-xs text-neutral-500 uppercase tracking-wider font-medium mb-4">Sections</h2>

          {session.sections.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-500 mb-2">No sections yet</p>
              <p className="text-neutral-400 text-sm">Add sections to define how your soundtrack evolves</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={session.sections.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {session.sections.map((section, index) => (
                    <SortableSection
                      key={section.id}
                      section={section}
                      sessionId={sessionId}
                      onDurationChange={handleDurationChange}
                      formatDuration={formatDuration}
                      fallbackColorIndex={index}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* New Section Form */}
        {showNewSection ? (
          <form onSubmit={handleAddSection} className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200 mb-8">
            <div className="mb-5">
              <label className="block text-sm text-neutral-500 mb-2 font-medium">Section name</label>
              <input
                type="text"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="e.g., Opening - Jazz"
                className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400 placeholder:text-neutral-400 text-neutral-900"
                autoFocus
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm text-neutral-500 mb-2 font-medium">
                Duration: <span className="text-neutral-900">{formatDuration(newSectionDuration)}</span>
              </label>
              <input
                type="range"
                min={15}
                max={180}
                step={15}
                value={newSectionDuration}
                onChange={(e) => setNewSectionDuration(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-neutral-900 text-white px-5 py-2.5 rounded-full font-medium hover:bg-neutral-800 transition-colors"
              >
                Add Section
              </button>
              <button
                type="button"
                onClick={() => setShowNewSection(false)}
                className="text-neutral-500 hover:text-neutral-900 px-5 py-2.5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowNewSection(true)}
            className="w-full p-5 border border-dashed border-neutral-300 rounded-2xl text-neutral-500 hover:text-neutral-900 hover:border-neutral-400 transition-all mb-8"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              Add Section
            </span>
          </button>
        )}
      </div>

      {/* Generate Playlist Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
        <div className="max-w-2xl mx-auto">
          {session.playlistUrl ? (
            <div className="flex gap-3">
              <a
                href={session.playlistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-white font-medium py-3.5 rounded-full transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                Open in Spotify
              </a>
              <button
                onClick={handleGeneratePlaylist}
                disabled={isGenerating}
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-medium px-6 py-3.5 rounded-full transition-colors disabled:opacity-50 border border-neutral-200"
              >
                {isGenerating ? 'Regenerating...' : 'Regenerate'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleGeneratePlaylist}
              disabled={isGenerating || session.sections.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-3.5 rounded-full transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isGenerating ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Generating Playlist...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  Generate Session Playlist
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
