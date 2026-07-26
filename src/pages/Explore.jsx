import { useState } from 'react';
import { useApp } from '../context/AppContext';

const EXPLORE_EMOJIS = [
  '🌅', '🏙️', '🎨', '📸', '🌊', '🏔️', '🌸', '🎭', '✨',
  '🍕', '🐶', '🎸', '🚀', '☕', '🏡', '🌈', '🎯', '🌻',
];

const EXPLORE_GRADIENTS = [
  'linear-gradient(135deg, #1e90ff, #0066cc)',
  'linear-gradient(135deg, #ff6b6b, #cc0000)',
  'linear-gradient(135deg, #51cf66, #2b8a3e)',
  'linear-gradient(135deg, #ff922b, #e67700)',
  'linear-gradient(135deg, #845ef7, #5c3ac5)',
  'linear-gradient(135deg, #f06595, #c92a5a)',
  'linear-gradient(135deg, #20c997, #0ca678)',
  'linear-gradient(135deg, #ffd43b, #e6b800)',
  'linear-gradient(135deg, #339af0, #1864ab)',
  'linear-gradient(135deg, #ff6b6b, #c92a5a)',
  'linear-gradient(135deg, #63e6be, #20c997)',
  'linear-gradient(135deg, #748ffc, #4c6ef5)',
];

export default function Explore() {
  const { posts } = useApp();
  const [selectedPost, setSelectedPost] = useState(null);

  const gridItems = posts.length > 0
    ? posts.map((p, i) => ({
        id: p.id,
        emoji: p.emoji,
        gradient: EXPLORE_GRADIENTS[i % EXPLORE_GRADIENTS.length],
        likes: p.likes.length,
        comments: p.comments.length,
      }))
    : EXPLORE_EMOJIS.map((emoji, i) => ({
        id: `explore-${i}`,
        emoji,
        gradient: EXPLORE_GRADIENTS[i % EXPLORE_GRADIENTS.length],
        likes: Math.floor(Math.random() * 120) + 10,
        comments: Math.floor(Math.random() * 30) + 1,
      }));

  return (
    <>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, padding: '0 4px' }}>
        🔍 Istraži
      </h2>
      <div className="profile-grid">
        {gridItems.map((item) => (
          <div
            key={item.id}
            className="profile-grid-item"
            style={{ background: item.gradient }}
            onClick={() => setSelectedPost(item)}
          >
            <span style={{ fontSize: 48 }}>{item.emoji}</span>
            <div className="profile-grid-overlay">
              <div className="profile-grid-stat">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {item.likes}
              </div>
              <div className="profile-grid-stat">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {item.comments}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick view modal */}
      {selectedPost && (
        <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>📸 Pregled objave</h2>
              <button className="modal-close" onClick={() => setSelectedPost(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1/1',
                  borderRadius: 12,
                  background: selectedPost.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 100,
                  marginBottom: 16,
                }}
              >
                {selectedPost.emoji}
              </div>
              <div style={{ display: 'flex', gap: 24, justifyContent: 'center', fontSize: 15 }}>
                <span>❤️ {selectedPost.likes} sviđanja</span>
                <span>💬 {selectedPost.comments} komentara</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
