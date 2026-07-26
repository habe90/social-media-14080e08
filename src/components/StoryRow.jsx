import { useApp } from '../context/AppContext';

export default function StoryRow() {
  const { stories, currentUser, getUserById } = useApp();

  const allStories = [
    { id: 0, userId: currentUser.id, isMine: true, seen: true },
    ...stories.filter((s) => s.userId !== currentUser.id),
  ];

  return (
    <div className="stories-container">
      {allStories.map((story) => {
        const user = getUserById(story.userId);
        const isMine = story.userId === currentUser.id;

        return (
          <div className="story-item" key={story.id}>
            <div className={`story-ring ${story.seen && !isMine ? 'seen' : ''}`}>
              <div
                className="story-avatar"
                style={{ background: user.avatar }}
              >
                {isMine ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                ) : (
                  user.initial
                )}
              </div>
            </div>
            <span className="story-username">
              {isMine ? 'Tvoja priča' : user.username}
            </span>
          </div>
        );
      })}
    </div>
  );
}
