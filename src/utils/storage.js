// Local storage utilities for sessions

const STORAGE_KEY = 'soundtrack_sessions';

// Get all sessions
export function getSessions() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Save all sessions
export function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

// Get a single session by ID
export function getSession(id) {
  const sessions = getSessions();
  return sessions.find(s => s.id === id) || null;
}

// Create a new session
export function createSession(name, duration) {
  const sessions = getSessions();
  const newSession = {
    id: crypto.randomUUID(),
    name,
    duration, // in minutes
    sections: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  sessions.push(newSession);
  saveSessions(sessions);
  return newSession;
}

// Update a session
export function updateSession(id, updates) {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === id);
  if (index === -1) return null;

  sessions[index] = {
    ...sessions[index],
    ...updates,
    updatedAt: Date.now(),
  };
  saveSessions(sessions);
  return sessions[index];
}

// Delete a session
export function deleteSession(id) {
  const sessions = getSessions();
  const filtered = sessions.filter(s => s.id !== id);
  saveSessions(filtered);
}

// Add a section to a session
export function addSection(sessionId, section) {
  const session = getSession(sessionId);
  if (!session) return null;

  // Get the next available color index that isn't already used
  const usedColorIndices = new Set(session.sections.map(s => s.colorIndex).filter(i => i !== undefined));
  let nextColorIndex = 0;
  while (usedColorIndices.has(nextColorIndex) && nextColorIndex < 100) {
    nextColorIndex++;
  }

  const newSection = {
    id: crypto.randomUUID(),
    name: section.name || 'New Section',
    duration: section.duration || 60, // in minutes
    colorIndex: nextColorIndex, // Persistent unique color assignment
    genres: [],
    artists: [],
    tracks: [],
    bpm: null,
    intensity: null, // 0-100
    playlistId: null,
    playlistUrl: null,
    ...section,
  };

  return updateSession(sessionId, {
    sections: [...session.sections, newSection],
  });
}

// Update a section
export function updateSection(sessionId, sectionId, updates) {
  const session = getSession(sessionId);
  if (!session) return null;

  const sections = session.sections.map(s =>
    s.id === sectionId ? { ...s, ...updates } : s
  );

  return updateSession(sessionId, { sections });
}

// Delete a section
export function deleteSection(sessionId, sectionId) {
  const session = getSession(sessionId);
  if (!session) return null;

  const sections = session.sections.filter(s => s.id !== sectionId);
  return updateSession(sessionId, { sections });
}

// Reorder sections
export function reorderSections(sessionId, sectionIds) {
  const session = getSession(sessionId);
  if (!session) return null;

  const sectionMap = new Map(session.sections.map(s => [s.id, s]));
  const reordered = sectionIds.map(id => sectionMap.get(id)).filter(Boolean);

  return updateSession(sessionId, { sections: reordered });
}
