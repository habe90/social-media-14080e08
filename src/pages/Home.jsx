import { useApp } from '../context/AppContext';
import StoryRow from '../components/StoryRow';
import PostCard from '../components/PostCard';

export default function Home() {
  const { posts } = useApp();

  return (
    <>
      <StoryRow />
      <div className="feed">
        {posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📸</div>
            <h3>Još nema objava</h3>
            <p>Budi prvi — klikni na + u gornjem meniju i podeli nešto sa zajednicom.</p>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </>
  );
}
