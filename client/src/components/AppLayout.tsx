import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard,
  KanbanSquare,
  UserCheck,
  LifeBuoy,
  Settings,
  Sun,
  Moon,
  Bell,
  Search,
  LogOut,
  GitBranch,
} from 'lucide-react';
import type { ThemeMode } from '@/theme';
import { api } from '@/lib/api';
import type { Notification } from '@/lib/api';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/portfolio', label: 'Portfolio', icon: KanbanSquare },
  { to: '/change', label: 'Change', icon: GitBranch },
  { to: '/my-work', label: 'My Work', icon: UserCheck },
  { to: '/support', label: 'Support', icon: LifeBuoy },
];

interface AppLayoutProps {
  mode: ThemeMode;
  onToggleTheme: () => void;
  children: React.ReactNode;
}

export default function AppLayout({ mode, onToggleTheme, children }: AppLayoutProps) {
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);

  const refreshUnread = useCallback(() => {
    api.getUnreadCount()
      .then((r) => setUnread(r.data.count))
      .catch(() => setUnread(0));
  }, []);

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread]);

  useEffect(() => {
    if (!showNotifs) return;
    api.listNotifications()
      .then((r) => setNotifs(r.data.slice(0, 12)))
      .catch(() => setNotifs([]));
  }, [showNotifs]);

  const markAllRead = () => {
    api.markAllNotificationsRead()
      .then(() => { refreshUnread(); setNotifs((n) => n.map((x) => ({ ...x, read: true }))); })
      .catch(() => {});
  };

  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">E</div>
          <div>
            <div className="brand-name">EIDH</div>
            <div className="brand-sub">Center of Excellence</div>
          </div>
        </div>

        <div className="sidebar-label">Workspace</div>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className="sidebar-link">
            <Icon size={16} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}

        <div className="sidebar-label">System</div>
        <NavLink to="/admin" className="sidebar-link">
          <Settings size={16} strokeWidth={2} />
          <span>Admin</span>
        </NavLink>

        <div className="sidebar-footer">
          <div>© 2026 EIDH</div>
          <div style={{ marginTop: 3 }}>v1.0 · CoE</div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main">
        {/* TOP HEADER */}
        <header className="topbar">
          <div>
            <div className="topbar-title">Enterprise Innovation & Delivery Hub</div>
            <div className="topbar-sub">Portfolio · Execution · Support</div>
          </div>

          <div className="search-box">
            <Search size={15} />
            <input type="text" placeholder="Search projects, tickets, people…" />
          </div>

          <button className="icon-button" title="Toggle theme" onClick={onToggleTheme} type="button">
            {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="notification-wrap">
            <button className="icon-button" title="Notifications" type="button" onClick={() => setShowNotifs((s) => !s)}>
              <Bell size={18} />
              {unread > 0 && <span className="notification-badge">{unread}</span>}
            </button>
            {showNotifs && (
              <div className="notification-dropdown">
                <div className="notification-head">
                  <span>Notifications</span>
                  <button className="icon-clear" onClick={markAllRead} type="button">Mark all read</button>
                </div>
                {notifs.length === 0 ? (
                  <div className="ai-result-empty" style={{ padding: 14 }}><div>🔔</div>No notifications yet.</div>
                ) : (
                  <div className="stack">
                    {notifs.map((n) => (
                      <div key={n.id} className="notification-item" data-unread={!n.read}>
                        <div className="cell-title">{n.title}</div>
                        {n.body && <div className="cell-sub">{n.body}</div>}
                        <div className="cell-sub" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {n.read ? 'Read' : 'New'} · {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button className="user-menu" onClick={() => navigate('/my-work')} type="button">
            <div className="avatar">JC</div>
            <div style={{ textAlign: 'left' }}>
              <div className="user-name">Jane Chen</div>
              <div className="user-role">Executive</div>
            </div>
          </button>

          <button
            className="icon-button"
            title="Log out"
            type="button"
            onClick={() => navigate('/')}
          >
            <LogOut size={18} />
          </button>
        </header>

        {/* CONTENT */}
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
