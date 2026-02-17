import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessions } from '../context/SessionContext';

export default function SessionBuilderPage() {
  const navigate = useNavigate();
  const { createSession, addSection } = useSessions();
  const [sessionName, setSessionName] = useState('');
  const [sections, setSections] = useState([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionDuration, setNewSectionDuration] = useState(60);

  function handleAddSection(e) {
    e.preventDefault();
    if (!newSectionName.trim()) return;

    setSections([...sections, {
      id: Date.now().toString(),
      name: newSectionName.trim(),
      duration: newSectionDuration,
    }]);

    setNewSectionName('');
    setNewSectionDuration(60);
  }

  function handleRemoveSection(id) {
    setSections(sections.filter(s => s.id !== id));
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

    // Add all sections
    sections.forEach(section => {
      addSection(session.id, {
        name: section.name,
        duration: section.duration,
      });
    });

    // Navigate to the first section
    const firstSectionId = `${session.id}-section-1`;
    navigate(`/session/${session.id}/section/${firstSectionId}`);
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
    <div className="min-h-screen bg-white">
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
          <p className="text-neutral-500">Set up your session structure before adding details</p>
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
        <div className="mb-8">
          <h2 className="text-xs text-neutral-500 uppercase tracking-wider font-medium mb-4">
            Sections {sections.length > 0 && `(${sections.length})`}
          </h2>

          {sections.length === 0 ? (
            <div className="text-center py-8 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
              <p className="text-neutral-400 text-sm">No sections yet. Add your first section below.</p>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-200"
                >
                  <div>
                    <h3 className="font-medium text-neutral-900">{section.name}</h3>
                    <p className="text-sm text-neutral-500">{formatDuration(section.duration)}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveSection(section.id)}
                    className="text-neutral-400 hover:text-red-500 p-2 transition-colors"
                    title="Remove section"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Section Form */}
        <form onSubmit={handleAddSection} className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200 mb-8">
          <h3 className="font-medium text-neutral-900 mb-4">Add Section</h3>
          <div className="mb-4">
            <label className="block text-sm text-neutral-500 mb-2 font-medium">Section Name</label>
            <input
              type="text"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="e.g., Opening - Jazz"
              className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-400 placeholder:text-neutral-400 text-neutral-900"
            />
          </div>
          <div className="mb-4">
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
          <button
            type="submit"
            className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 px-5 py-2.5 rounded-full font-medium transition-colors"
          >
            Add Section
          </button>
        </form>

        {/* Summary and Create Button */}
        {sections.length > 0 && (
          <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200 mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-neutral-500 text-sm">Total Duration</span>
              <span className="text-neutral-900 font-medium">{formatDuration(totalDuration)}</span>
            </div>
            <button
              onClick={handleCreateSession}
              disabled={!sessionName.trim() || sections.length === 0}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-3 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
