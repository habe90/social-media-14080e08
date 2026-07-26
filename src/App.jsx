import { Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Header from './components/Header';
import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import CreatePostModal from './components/CreatePostModal';
import { AppProvider, useApp } from './context/AppContext';

function AppContent() {
  const { showCreateModal, setShowCreateModal } = useApp();

  return (
    <div className="app-container">
      <Header />
      <div className="main-layout">
        <SidebarLeft />
        <main className="content-area">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
        <SidebarRight />
      </div>
      {showCreateModal && (
        <CreatePostModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
