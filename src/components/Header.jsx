import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, setShowCreateModal } = useApp();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="header">
      <div className="header-inner">
        <div
          className="header-logo"
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          <span>Sela</span>my
        </div>

        <div className="header-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input type="text" placeholder="Pretraži..." />
        </div>

        <div className="header-actions">
          {/* Home */}
          <svg
            className="header-icon"
            viewBox="0 0 24 24"
            fill={isActive('/') ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            onClick={() => navigate('/')}
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>

          {/* Create */}
          <svg
            className="header-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            onClick={() => setShowCreateModal(true)}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>

          {/* Explore */}
          <svg
            className="header-icon"
            viewBox="0 0 24 24"
            fill={isActive('/explore') ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            onClick={() => navigate('/explore')}
          >
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>

          {/* Profile */}
          <div
            className="header-avatar"
            onClick={() => navigate('/profile')}
            style={{
              background: currentUser.avatar,
              borderColor: isActive('/profile') ? '#1e90ff' : 'transparent',
            }}
          >
            {currentUser.initial}
          </div>
        </div>
      </div>
    </header>
  );
}
