import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function PostCard({ post }) {
  const { currentUser, getUserById, toggleLike, toggleSave, addComment } = useApp();
  const [commentText, setCommentText] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);

  const user = getUserById(post.userId);
  const isLiked = post.likes.includes(currentUser.id);
  const isSaved = post.saved;
  const visibleComments = showAllComments ? post.comments : post.comments.slice(-2);

  const handleComment = () => {
    if (commentText.trim()) {
      addComment(post.id, commentText);
      setCommentText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleComment();
  };

  return (
    <article className="post-card">
      {/* Header */}
      <div className="post-header">
        <div className="post-user">
          <div
            className="post-avatar"
            style={{ background: user.avatar }}
          >
            {user.initial}
          </div>
          <div>
            <div className="post-username">{user.username}</div>
            {post.location && (
              <div className="post-location">{post.location}</div>
            )}
          </div>
        </div>
        <button className="post-more">⋯</button>
      </div>

      {/* Image (emoji placeholder) */}
      <div className="post-image" style={{ background: user.avatar }}>
        <span role="img" aria-label="post">
          {post.emoji}
        </span>
      </div>

      {/* Actions */}
      <div className="post-actions">
        <div className="post-actions-left">
          <button
            className={`post-action-btn ${isLiked ? 'liked' : ''}`}
            onClick={() => toggleLike(post.id)}
            title={isLiked ? 'Ukloni lajk' : 'Lajkuj'}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <button className="post-action-btn" title="Komentariši">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <button className="post-action-btn" title="Podeli">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
        </div>
        <button
          className={`post-save-btn ${isSaved ? 'saved' : ''}`}
          onClick={() => toggleSave(post.id)}
          title={isSaved ? 'Ukloni sačuvano' : 'Sačuvaj'}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <polygon points="19 21 12 16 5 21 5 3 19 3 19 21" />
          </svg>
        </button>
      </div>

      {/* Likes */}
      {post.likes.length > 0 && (
        <div className="post-likes">
          {post.likes.length} {post.likes.length === 1 ? 'sviđanje' : 'sviđanja'}
        </div>
      )}

      {/* Caption */}
      <div className="post-caption">
        <strong>{user.username}</strong>
        {post.caption}
      </div>

      {/* Comments */}
      {post.comments.length > 2 && !showAllComments && (
        <div className="post-comments-link" onClick={() => setShowAllComments(true)}>
          Prikaži svih {post.comments.length} komentara
        </div>
      )}
      {visibleComments.map((c) => {
        const cu = getUserById(c.userId);
        return (
          <div className="post-caption" key={c.id}>
            <strong>{cu.username}</strong>
            {c.text}
          </div>
        );
      })}

      {/* Time */}
      <div className="post-time">{post.timeAgo}</div>

      {/* Add comment */}
      <div className="post-add-comment">
        <input
          type="text"
          placeholder="Dodaj komentar..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className={`post-comment-btn ${commentText.trim() ? 'active' : ''}`}
          onClick={handleComment}
        >
          Objavi
        </button>
      </div>
    </article>
  );
}
