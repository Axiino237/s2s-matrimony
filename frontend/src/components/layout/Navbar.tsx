import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isAuthenticated, user, logout, isSuperAdmin, isAdmin } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Success Stories', href: '/success-stories' },
    { label: 'Membership', href: '/membership' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ];

  const isLandingHero = location.pathname === '/' && !isScrolled;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled || location.pathname !== '/' ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src="/images/logo.png" 
              alt="S2S Matrimony" 
              className="w-10 h-10 object-contain rounded-xl shadow-sm border border-amber-400/40 p-0.5 bg-white" 
            />
            <div>
              <span className="font-display font-black text-xl text-slate-900 tracking-tight block leading-none">S2S MATRIMONY</span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mt-0.5">Community Platform</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm transition-colors hover:text-primary ${
                  location.pathname === link.href 
                    ? 'text-primary font-black border-b-2 border-primary pb-0.5' 
                    : (isLandingHero ? 'text-slate-800 font-bold hover:text-primary' : 'text-slate-700 font-bold hover:text-primary')
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {isSuperAdmin() ? (
                  <Link to="/super-admin/dashboard" className="btn btn-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-md">⚡ Super Admin</Link>
                ) : isAdmin() ? (
                  <Link to="/admin/dashboard" className="btn btn-secondary btn-sm font-bold border border-slate-200 shadow-sm">Admin Panel</Link>
                ) : (
                  <Link to="/dashboard" className="btn btn-secondary btn-sm font-bold border border-slate-200 shadow-sm">Dashboard</Link>
                )}
                <button onClick={handleLogout} className="btn btn-ghost btn-sm font-bold text-slate-700 hover:text-rose-600">Logout</button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm font-bold text-slate-800 hover:text-primary">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm font-bold shadow-md">Register Free</Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="md:hidden p-2 text-slate-800 hover:text-primary transition-colors"
            aria-label="Toggle menu"
          >

            <div className="w-6 flex flex-col gap-1.5">
              <span className={`h-0.5 bg-current transition-all ${isMobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`h-0.5 bg-current transition-all ${isMobileOpen ? 'opacity-0' : ''}`} />
              <span className={`h-0.5 bg-current transition-all ${isMobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileOpen && (
          <div className="md:hidden pb-6 animate-slide-up">
            <div className="glass-card p-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMobileOpen(false)}
                  className="block py-2.5 px-4 rounded-xl text-text-secondary hover:text-white hover:bg-white/10 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    {user?.roles?.includes('SUPER_ADMIN') ? (
                      <Link to="/super-admin/dashboard" onClick={() => setIsMobileOpen(false)} className="btn btn-primary">⚡ Super Admin</Link>
                    ) : user?.roles?.includes('ADMIN') ? (
                      <Link to="/admin/dashboard" onClick={() => setIsMobileOpen(false)} className="btn btn-primary">Admin Panel</Link>
                    ) : (
                      <Link to="/dashboard" onClick={() => setIsMobileOpen(false)} className="btn btn-primary">Dashboard</Link>
                    )}
                    <button onClick={handleLogout} className="btn btn-ghost">Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsMobileOpen(false)} className="btn btn-secondary">Login</Link>
                    <Link to="/register" onClick={() => setIsMobileOpen(false)} className="btn btn-primary">Register Free</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
