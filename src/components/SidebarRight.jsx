import { useApp } from '../context/AppContext';

export default function SidebarRight() {
  const { currentUser, users } = useApp();

  const suggestions = users
    .filter((u) => u.id !== currentUser.id)
    .slice(0, 5);

  return (
    <aside className="sidebar-right">
      <div className="sidebar-user">
        <div
          className="sidebar-user-avatar"
          style={{ background: currentUser.avatar }}
        >
          {currentUser.initial}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{currentUser.username}</div>
          <div className="sidebar-user-handle">{currentUser.name}</div>
        </div>
        <span className="sidebar-switch">Prebaci</span>
      </div>

      <div className="sidebar-suggestions-title">
        <span>Predlozi za tebe</span>
        <span>Vidi sve</span>
      </div>

      {suggestions.map((user) => (
        <div className="sidebar-suggestion" key={user.id}>
          <div
            className="sidebar-suggestion-avatar"
            style={{ background: user.avatar }}
          >
            {user.initial}
          </div>
          <div className="sidebar-suggestion-info">
            <div className="sidebar-suggestion-name">{user.username}</div>
            <div className="sidebar-suggestion-sub">Novo na Selamy</div>
          </div>
          <button className="sidebar-follow-btn">Zaprati</button>
        </div>
      ))}

      <div className="sidebar-footer">
        <p>© 2026 Selamy · Sva prava zadržana</p>
        <p>O nama · Pomoć · Uslovi · Privatnost</p>
      </div>
    </aside>
  );
}
