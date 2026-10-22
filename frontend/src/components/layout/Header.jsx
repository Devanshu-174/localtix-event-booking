import React from 'react';
import { QrCode, Menu, Sun, Moon, ArrowRight } from 'lucide-react';
export default function Header({
  user,
  theme,
  setTheme,
  tab,
  setTab,
  setModal,
}) {
  return (
    <header className="topbar">
      <a className="brand" onClick={() => setTab('discover')}>
        <span className="brandmark">
          <QrCode size={20} />
        </span>
        <span>
          local<span className="brand-light">tix</span>
        </span>
        <span className="brand-dot">.</span>
      </a>
      <nav className="nav">
        <button
          className={tab === 'discover' ? 'active' : ''}
          onClick={() => setTab('discover')}
        >
          Discover
        </button>
        <button
          className={tab === 'tickets' ? 'active' : ''}
          onClick={() => (user ? setTab('tickets') : setModal('login'))}
        >
          {user?.role === 'ORGANIZER' ? 'Guest list' : 'My tickets'}
        </button>
        {user?.role === 'ORGANIZER' && (
          <button
            className={tab === 'organizer' ? 'active' : ''}
            onClick={() => setTab('organizer')}
          >
            Organizer
          </button>
        )}
      </nav>
      <div className="top-actions">
        <button
          className="icon-btn mobile-menu"
          onClick={() => setModal('menu')}
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
        <button
          className="theme-toggle"
          onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          aria-label={
            theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
          }
          title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
        {user ? (
          <>
            <span className="hello">Hi, {user.name.split(' ')[0]}</span>
            <button
              className="avatar"
              onClick={() => setTab('profile')}
              title="My profile"
              aria-label="Open my profile"
              aria-current={tab === 'profile' ? 'page' : undefined}
            >
              {user.name.slice(0, 1).toUpperCase()}
            </button>
          </>
        ) : (
          <>
            <button className="text-btn" onClick={() => setModal('login')}>
              Log in
            </button>
            <button
              className="dark-btn small"
              onClick={() => setModal('register')}
            >
              Get started <ArrowRight size={14} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
