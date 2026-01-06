
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User } from '../types';

interface NavbarProps {
  user?: User | null;
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const links = [
    { name: "Inicio", path: "/" },
    { name: "Rutas", path: "/paths" },
    { name: "Wiki", path: "/wiki" },
    { name: "Comunidad", path: "/showcase" },
    { name: "Foro", path: "/forum" },
    { name: "Tienda", path: "/store" },
  ];

  const handleLogout = () => {
    localStorage.removeItem('robo_user');
    window.dispatchEvent(new Event('authChange'));
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  // Calcular progreso para la barrita del menú
  const xpProgress = user ? Math.min(((user.xp % 1000) / 1000) * 100, 100) : 0;

  return (
    <nav className="w-full border-b border-solid dark:border-border-dark border-slate-200 bg-white dark:bg-surface-dark sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-3 relative">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-8">
            <Link to="/" className="flex items-center gap-3 text-slate-900 dark:text-white hover:opacity-80 transition-opacity">
              <div className="size-8 text-primary">
                <svg className="w-full h-full" fill="currentColor" viewBox="0 0 48 48">
                  <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold leading-tight tracking-tight hidden sm:block font-display">RoboLearn</h2>
            </Link>
          </div>

          <div className="flex items-center gap-3 md:gap-8">
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6 overflow-x-auto max-w-[500px] no-scrollbar">
              {links.map((link) => (
                <Link 
                  key={link.path}
                  to={link.path} 
                  className={`text-sm font-medium transition-colors whitespace-nowrap ${isActive(link.path) ? 'text-primary font-bold' : 'text-slate-600 dark:text-gray-300 hover:text-primary'}`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
            
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-card-dark rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">
                {isMenuOpen ? 'close' : 'menu'}
              </span>
            </button>

            {/* User Profile / Login */}
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden lg:flex flex-col items-end">
                   <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">{user.name}</p>
                   <p className={`text-[10px] font-black uppercase tracking-tighter ${user.role === 'editor' ? 'text-purple-400' : 'text-primary'}`}>
                    {user.role === 'editor' ? 'Editor Técnico' : `Nivel ${user.level}`}
                   </p>
                </div>
                <div className="group relative">
                  <img src={user.avatar} className={`size-10 rounded-full border-2 cursor-pointer transition-all ${user.role === 'editor' ? 'border-purple-500/50 hover:border-purple-500' : 'border-primary/20 hover:border-primary'}`} alt="Perfil" />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-card-dark border border-border-dark rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-3 z-50 overflow-hidden">
                    <div className="px-5 py-3 border-b border-border-dark/50 mb-2 bg-surface-dark/50">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-[10px] font-black text-text-secondary uppercase">Tu Progreso</p>
                        <p className="text-[10px] font-black text-primary uppercase">Nivel {user.level}</p>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${xpProgress}%` }}></div>
                      </div>
                    </div>
                    
                    <Link to="/dashboard" className="flex items-center gap-3 px-5 py-2.5 text-sm text-text-secondary hover:bg-surface-dark hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-lg">dashboard</span> Panel de Control
                    </Link>
                    <Link to="/portfolio" className="flex items-center gap-3 px-5 py-2.5 text-sm text-text-secondary hover:bg-surface-dark hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-lg">person</span> Mi Portfolio
                    </Link>
                    <Link to="/certify" className="flex items-center gap-3 px-5 py-2.5 text-sm text-text-secondary hover:bg-surface-dark hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-lg">workspace_premium</span> Certificaciones
                    </Link>
                    
                    {user.role === 'editor' && (
                      <>
                        <div className="h-px bg-border-dark/50 my-2"></div>
                        <div className="px-5 py-1">
                          <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Herramientas</p>
                        </div>
                        <Link to="/studio" className="flex items-center gap-3 px-5 py-2.5 text-sm text-purple-400 hover:bg-purple-600/10 hover:text-purple-300 transition-colors">
                          <span className="material-symbols-outlined text-lg">edit_square</span> Content Studio
                        </Link>
                      </>
                    )}
                    
                    <div className="h-px bg-border-dark my-2"></div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                      <span className="material-symbols-outlined text-lg">logout</span> Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link to="/login" className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                Entrar
              </Link>
            )}
          </div>
        </header>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white dark:bg-surface-dark border-b border-solid border-slate-200 dark:border-border-dark shadow-2xl z-40 animate-in slide-in-from-top-2">
            <div className="flex flex-col p-4 gap-2">
              {links.map((link) => (
                <Link 
                  key={link.path}
                  to={link.path} 
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${
                    isActive(link.path) 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-card-dark hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
