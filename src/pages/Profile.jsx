import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Profile() {
  const { currentUser, posts } = useApp();
  const [selectedTab, setSelectedTab] = useState('posts');

  const userPosts = posts.filter((p) => p.userId === currentUser.id);
  const totalLikes = userPosts.reduce((sum, p) => sum + p.likes.length, 0);

  return (
    <>
      {/* Profile Header */}
      <div className="profile-header">
        <div
          className="profile-avatar-large"
          style={{ background: currentUser.avatar }}
        >
          {currentUser.initial}
        </div>
        <div className="profile-info">
          <div className="profile-name">{currentUser.username}</div>
          <div className="profile-handle">@{currentUser.username} · {currentUser.name}</div>

          <div className="profile-stats">
            <div className="profile-stat">
              <strong>{userPosts.length}</strong> objava
            </div>
            <div className="profile-stat">
              <strong>{totalLikes}</strong> sviđanja
            </div>
            <div className="profile-stat">
              <strong>128</strong> pratilaca
            </div>
            <div className="profile-stat">
              <strong>89</strong> praćenih
            </div>
          </div>

          <div className="profile-bio">
            📸 Dobrodošli na moj Selamy profil!<br />
            💙 Delim trenutke koji me inspirišu.<br />
            🌍 Srbija
          </div>
        </div>
      </div>

      {/* Tabovi */}
      <div style={{
        display: 'flex',
        borderTop: '1px solid var(--selamy-border)',
        marginTop: 8,
      }}>
        {[
          { key: 'posts', label: '📷 Objave' },
          { key: 'saved', label: '🔖 Sačuvano' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key)}
            style={{
              flex: 1,
              padding: '14px 0',
              background: 'none',
              color: selectedTab === tab.key ? 'var(--selamy-white)' : 'var(--selamy-text-secondary)',
              fontWeight: selectedTab === tab.key ? 600 : 400,
              fontSize: 13,
              borderBottom: selectedTab === tab.key ? '2px solid var(--selamy-blue)' : '2px solid transparent',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {selectedTab === 'posts' && (
        <>
          {userPosts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📷</div>
              <h3>Još nema objava</h3>
              <p>Klikni na + u gornjem meniju da napraviš svoju prvu objavu na Selamy.</p>
            </div>
          ) : (
            <div className="profile-grid">
              {userPosts.map((post) => (
                <div
                  key={post.id}
                  className="profile-grid-item"
                  style={{ background: currentUser.avatar }}
                >
                  <span style={{ fontSize: 48 }}>{post.emoji}</span>
                  <div className="profile-grid-overlay">
                    <div className="profile-grid-stat">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      {post.likes.length}
                    </div>
                    <div className="profile-grid-stat">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      {post.comments.length}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {selectedTab === 'saved' && (
        <div className="empty-state">
          <div className="empty-state-icon">🔖</div>
          <h3>Sačuvane objave</h3>
          <p>Ovde će se pojaviti objave koje sačuvaš. Klikni na ikonicu bookmark na bilo kojoj objavi.</p>
        </div>
      )}
    </>
  );
}
