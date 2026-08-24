import { NavLink, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import type { ThemeMode } from '@/theme';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/portfolio', label: 'Portfolio', icon: KanbanSquare },
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

          <button className="icon-button" title="Notifications" type="button">
            <Bell size={18} />
            <span className="notification-badge">3</span>
          </button>

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
