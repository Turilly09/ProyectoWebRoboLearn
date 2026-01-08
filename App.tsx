import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Paths from './pages/Paths';
import IDE from './pages/IDE';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Showcase from './pages/Showcase';
import Forum from './pages/Forum';
import Store from './pages/Store';
import Certify from './pages/Certify';
import LessonDetail from './pages/LessonDetail';
import WorkshopDetail from './pages/WorkshopDetail';
import ContentStudio from './pages/ContentStudio';
import ProjectEditor from './pages/ProjectEditor';
import CommunityProjectDetail from './pages/CommunityProjectDetail';
import Login from './pages/Login';
import Blog from './pages/Blog';
import Wiki from './pages/Wiki'; // Import Wiki
import { User } from './types';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = localStorage.getItem('robo_user');
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const EditorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const stored = localStorage.getItem('robo_user');
  if (!stored) return <Navigate to="/login" />;
  const user: User = JSON.parse(stored);
  return user.role === 'editor' ? <>{children}</> : <Navigate to="/dashboard" />;
};

const AppContent: React.FC = () => {
  const location = useLocation();
  // Inicialización Lazy para leer localStorage antes del primer render
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('robo_user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    const checkAuth = () => {
      const stored = localStorage.getItem('robo_user');
      setUser(stored ? JSON.parse(stored) : null);
    };
    window.addEventListener('authChange', checkAuth);
    return () => window.removeEventListener('authChange', checkAuth);
  }, []);

  // Navbar visible en todos lados excepto Login, Studio e IDE/Lección (para enfoque total)
  const hideNavbarOn = ['/login', '/studio', '/project-editor'];
  const isIdeOrLesson = location.pathname.startsWith('/ide') || location.pathname.startsWith('/lesson/') || location.pathname.startsWith('/workshop/');
  const showNavbar = !hideNavbarOn.includes(location.pathname) && !isIdeOrLesson;

  return (
    <div className="flex flex-col min-h-screen">
      {showNavbar && <Navbar user={user} />}
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/paths" element={<Paths />} />
          <Route path="/ide/:id" element={<PrivateRoute><IDE /></PrivateRoute>} />
          <Route path="/ide" element={<Navigate to="/ide/p1" />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard user={user} /></PrivateRoute>} />
          <Route path="/portfolio" element={<PrivateRoute><Portfolio user={user} /></PrivateRoute>} />
          <Route path="/showcase" element={<Showcase />} />
          <Route path="/community-project/:id" element={<CommunityProjectDetail />} />
          <Route path="/project-editor" element={<PrivateRoute><ProjectEditor /></PrivateRoute>} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/wiki" element={<Wiki />} />
          <Route path="/store" element={<Store />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/certify" element={<PrivateRoute><Certify /></PrivateRoute>} />
          <Route path="/lesson/:id" element={<PrivateRoute><LessonDetail /></PrivateRoute>} />
          <Route path="/workshop/:id" element={<PrivateRoute><WorkshopDetail /></PrivateRoute>} />
          <Route path="/studio" element={<EditorRoute><ContentStudio /></EditorRoute>} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;