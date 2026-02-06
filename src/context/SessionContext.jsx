import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as storage from '../utils/storage';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [sessions, setSessions] = useState([]);

  // Load sessions from storage on mount
  useEffect(() => {
    setSessions(storage.getSessions());
  }, []);

  const refreshSessions = useCallback(() => {
    setSessions(storage.getSessions());
  }, []);

  const createSession = useCallback((name, duration) => {
    const session = storage.createSession(name, duration);
    refreshSessions();
    return session;
  }, [refreshSessions]);

  const updateSession = useCallback((id, updates) => {
    const session = storage.updateSession(id, updates);
    refreshSessions();
    return session;
  }, [refreshSessions]);

  const deleteSession = useCallback((id) => {
    storage.deleteSession(id);
    refreshSessions();
  }, [refreshSessions]);

  const getSession = useCallback((id) => {
    return storage.getSession(id);
  }, []);

  const addSection = useCallback((sessionId, section) => {
    const updated = storage.addSection(sessionId, section);
    refreshSessions();
    return updated;
  }, [refreshSessions]);

  const updateSection = useCallback((sessionId, sectionId, updates) => {
    const updated = storage.updateSection(sessionId, sectionId, updates);
    refreshSessions();
    return updated;
  }, [refreshSessions]);

  const deleteSection = useCallback((sessionId, sectionId) => {
    storage.deleteSection(sessionId, sectionId);
    refreshSessions();
  }, [refreshSessions]);

  return (
    <SessionContext.Provider
      value={{
        sessions,
        createSession,
        updateSession,
        deleteSession,
        getSession,
        addSection,
        updateSection,
        deleteSection,
        refreshSessions,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSessions() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessions must be used within a SessionProvider');
  }
  return context;
}
