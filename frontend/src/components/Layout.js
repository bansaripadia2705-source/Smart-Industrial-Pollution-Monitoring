import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const NAV = [
  { section: 'Overview' },
  { path: '/',          icon: '🏠', key: 'dashboard'      },
  { path: '/live',      icon: '📡', key: 'liveMonitoring' },
  { section: 'Monitoring' },
  { path: '/air',       icon: '🌬️', key: 'airQuality'     },
  { path: '/water',     icon: '💧', key: 'waterQuality'   },
  { path: '/sensors',   icon: '📟', key: 'sensors'        },
  { section: 'Compliance' },
  { path: '/violations',icon: '⚠️', key: 'violations'     },
  { path: '/alerts',    icon: '🚨', key: 'alerts'         },
  { path: '/health',    icon: '🏥', key: 'healthRisk'     },
  { section: 'Data' },
  { path: '/industries',icon: '🏭', key: 'industries'     },
  { path: '/map',       icon: '🗺️', key: 'pollutionMap'   },
  { path: '/analytics', icon: '📈', key: 'analytics'      },
  { section: 'AI & Agents' },
  { path: '/reports',   icon: '🤖', key: 'aiReports'      },
  { path: '/agents',    icon: '⚙️', key: 'agentMonitoring'},
  { section: 'System' },
  { path: '/settings',  icon: '🔧', key: 'settings'       },
];

export default function Layout() {
  const { user, logout }    = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, changeLang, t } = useLanguage();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageTitle = NAV.find(n => n.path && (n.path === '/' ? location.pathname === '/' : location.pathname.startsWith(n.path)))?.key;

  return (
    <div className="layout">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:99 }} onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h2>🌿 {t('appName')}</h2>
          <span>{t('tagline')}</span>
        </div>
        <div className="sidebar-nav">
          {NAV.map((item, i) => {
            if (item.section) return <div key={i} className="nav-section">{item.section}</div>;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                {t(item.key)}
              </NavLink>
            );
          })}
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: '10px', color: 'var(--text-muted)' }}>
          <div>EcoGuard AI v1.0</div>
          <div>IBM Hackathon 2024</div>
        </div>
      </nav>

      {/* Main */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="topbar-btn" style={{ display:'none' }} onClick={() => setSidebarOpen(s => !s)}>☰</button>
            <button className="topbar-btn" style={{ display:'flex' }} onClick={() => setSidebarOpen(s => !s)}>
              ☰
            </button>
            <span className="topbar-title">
              {pageTitle ? t(pageTitle) : 'EcoGuard AI'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display:'flex', alignItems:'center', gap:4 }}>
              <span className="live-dot" /> Live
            </span>
          </div>
          <div className="topbar-right">
            {/* Language selector */}
            <select
              className="lang-select"
              value={lang}
              onChange={e => changeLang(e.target.value)}
              title="Select Language"
            >
              <option value="en">🇬🇧 EN</option>
              <option value="hi">🇮🇳 हि</option>
              <option value="gu">🇮🇳 ગુ</option>
            </select>

            {/* Theme toggle */}
            <button
              className="topbar-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>

            {/* User chip */}
            <div className="user-chip">
              <div className="user-avatar">{user?.name?.[0]?.toUpperCase() || 'A'}</div>
              <span>{user?.name || 'Admin'}</span>
            </div>

            {/* Logout */}
            <button className="topbar-btn" onClick={logout} title="Logout">
              🚪 {t('logout')}
            </button>
          </div>
        </header>

        {/* Page content via React Router Outlet */}
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
