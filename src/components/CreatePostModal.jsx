import { useState } from 'react';
import { useApp } from '../context/AppContext';

const EMOJIS = ['🌅', '🏙️', '🎨', '📸', '🌊', '🏔️', '🌸', '🎭', '✨', '🍕', '🐶', '🎸', '🚀', '☕', '🏡', '🌈'];
const GRADIENTS = [
  'linear-gradient(135deg, #1e90ff, #0066cc)',
  'linear-gradient(135deg, #ff6b6b, #cc0000)',
  'linear-gradient(135deg, #51cf66, #2b8a3e)',
  'linear-gradient(135deg, #ff922b, #e67700)',
  'linear-gradient(135deg, #845ef7, #5c3ac5)',
  'linear-gradient(135deg, #f06595, #c92a5a)',
  'linear-gradient(135deg, #20c997, #0ca678)',
];

export default function CreatePostModal({ onClose }) {
  const { createPost } = useApp();
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
  const [selectedGradient, setSelectedGradient] = useState(
    GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!caption.trim()) return;
    createPost({ caption, location });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📸 Nova objava</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="image-preview" style={{ background: selectedGradient }}>
              <span style={{ fontSize: 80 }}>{selectedEmoji}</span>
            </div>

            <div className="form-group">
              <label>Izaberi emoji</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {EMOJIS.map((emoji) => (
                  <button
                    type="button"
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    style={{
                      fontSize: 24,
                      padding: 6,
                      borderRadius: 8,
                      background: selectedEmoji === emoji ? 'var(--selamy-blue)' : 'var(--selamy-card)',
                      border: selectedEmoji === emoji ? '2px solid var(--selamy-blue-light)' : '2px solid transparent',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Pozadina</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {GRADIENTS.map((grad, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setSelectedGradient(grad)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: grad,
                      border: selectedGradient === grad ? '3px solid white' : '2px solid transparent',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Opis</label>
              <textarea
                placeholder="Napiši opis objave..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Lokacija</label>
              <input
                type="text"
                placeholder="Dodaj lokaciju (opciono)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!caption.trim()}
            >
              Objavi na Selamy
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
