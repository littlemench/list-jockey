import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SpotifyProvider } from './context/SpotifyContext';
import { SessionProvider } from './context/SessionContext';
import HomePage from './pages/HomePage';
import SessionBuilderPage from './pages/SessionBuilderPage';
import SessionPage from './pages/SessionPage';
import SectionPage from './pages/SectionPage';
import CallbackPage from './pages/CallbackPage';

export default function App() {
  return (
    <BrowserRouter>
      <SpotifyProvider>
        <SessionProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/callback" element={<CallbackPage />} />
            <Route path="/session/new" element={<SessionBuilderPage />} />
            <Route path="/session/:sessionId" element={<SessionPage />} />
            <Route path="/session/:sessionId/section/:sectionId" element={<SectionPage />} />
          </Routes>
        </SessionProvider>
      </SpotifyProvider>
    </BrowserRouter>
  );
}
