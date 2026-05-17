import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import i18n from '../../i18n/i18n';

const LangToggle = () => {
  const lang = i18n.language;
  const toggle = () => {
    const next = lang === 'es' ? 'en' : 'es';
    i18n.changeLanguage(next);
    localStorage.setItem('zeal_lang', next);
  };
  return (
    <button onClick={toggle}
      className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200
                 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
      <span className="text-base">{lang === 'es' ? 'ðŸ‡ºðŸ‡¸' : 'ðŸ‡ªðŸ‡¸'}</span>
      <span>{lang === 'es' ? 'EN' : 'ES'}</span>
    </button>
  );
};

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const dashPath = user?.type === 'worker' ? '/worker' : user?.type === 'business' ? '/business' : '/admin';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-extrabold text-xl text-gray-900">
              Shift<span className="text-brand-500">MIA</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/shifts"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${location.pathname === '/shifts' ? 'bg-brand-50 text-brand-600' : 'text-gray-600 hover:bg-gray-50'}`}>
              {t('nav.shifts')}
            </Link>

            {user && (
              <Link to={dashPath}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${location.pathname === dashPath ? 'bg-brand-50 text-brand-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                {t('nav.dashboard')}
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <LangToggle />
            {user ? (
              <div className="flex items-center gap-3">
                <Link to={`/${user.type}/profile`}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors">
                  {user.avatar_url
                    ? <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    : <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm">
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                  }
                  <span>{user.name?.split(' ')[0]}</span>
                </Link>
                <button onClick={handleLogout} className="btn-ghost text-sm">
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <>
                <Link to="/login"    className="btn-ghost text-sm">{t('nav.login')}</Link>
                <Link to="/register" className="btn-primary text-sm">{t('nav.register')}</Link>
              </>
            )}
          </div>

          {/* Mobile burger */}
          <button className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-gray-100 space-y-1">
            <Link to="/shifts" className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}>{t('nav.shifts')}</Link>
            {user && <Link to={dashPath} className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}>{t('nav.dashboard')}</Link>}
            <div className="flex items-center gap-2 px-3 py-2">
              <LangToggle />
            </div>
            {user
              ? <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                  {t('nav.logout')}
                </button>
              : <>
                  <Link to="/login"    className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>{t('nav.login')}</Link>
                  <Link to="/register" className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>{t('nav.register')}</Link>
                </>
            }
          </div>
        )}
      </div>
    </nav>
  );
}
