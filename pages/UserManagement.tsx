
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../types';
import { getAllUsers, deleteUser } from '../content/userRegistry';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showSqlHelp, setShowSqlHelp] = useState(false);
  const [sqlMode, setSqlMode] = useState<'reset' | 'fix'>('fix');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [copyFeedback, setCopyFeedback] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('robo_user');
    if (stored) setCurrentUser(JSON.parse(stored));
    
    loadUsers();
    window.addEventListener('usersUpdated', loadUsers);
    return () => window.removeEventListener('usersUpdated', loadUsers);
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    const data = await getAllUsers();
    setUsers(data);
    setIsLoading(false);
  };

  const handleDelete = async (userToDelete: User) => {
    if (userToDelete.id === currentUser?.id) {
        alert("No puedes eliminar tu propia cuenta desde aquí.");
        return;
    }

    if (!window.confirm(`⚠️ ADVERTENCIA ⚠️\n\n¿Estás seguro de que deseas eliminar a "${userToDelete.name}"?\nEsta acción borrará su progreso, XP y perfil permanentemente.`)) {
        return;
    }

    try {
        await deleteUser(userToDelete.id);
    } catch (e) {
        setShowSqlHelp(true);
        setSqlMode('fix');
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCRIPTS[sqlMode]);
    setCopyFeedback('¡Código Copiado!');
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const stats = {
      total: users.length,
      editors: users.filter(u => u.role === 'editor').length,
      students: users.filter(u => u.role === 'student').length,
      totalXp: users.reduce((acc, curr) => acc + (curr.xp || 0), 0)
  };

  const SQL_SCRIPTS = {
    reset: `
-- =================================================================
-- 1. RESET TOTAL (CUIDADO: BORRA DATOS)
-- =================================================================

DROP TABLE IF EXISTS public.community_projects CASCADE;
DROP TABLE IF EXISTS public.notebooks CASCADE;
DROP TABLE IF EXISTS public.forum_posts CASCADE;
DROP TABLE IF EXISTS public.news CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.paths CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.wiki_entries CASCADE;

-- CREACIÓN DE TABLAS

CREATE TABLE public.profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    avatar TEXT,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    role TEXT DEFAULT 'student',
    completed_lessons JSONB DEFAULT '[]'::jsonb,
    completed_workshops JSONB DEFAULT '[]'::jsonb,
    activity_log JSONB DEFAULT '[]'::jsonb,
    study_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.paths (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    level TEXT,
    image TEXT,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.lessons (
    id TEXT PRIMARY KEY,
    path_id TEXT REFERENCES public.paths(id) ON DELETE SET NULL,
    "order" INTEGER DEFAULT 0,
    type TEXT DEFAULT 'theory',
    title TEXT NOT NULL,
    subtitle TEXT,
    sections JSONB DEFAULT '[]'::jsonb,
    simulator_url TEXT,
    steps JSONB DEFAULT '[]'::jsonb,
    quiz JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.news (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    excerpt TEXT,
    content TEXT,
    author TEXT,
    category TEXT,
    image TEXT,
    read_time TEXT,
    date TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.forum_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    board TEXT DEFAULT 'Ayuda General',
    tags TEXT[] DEFAULT '{}',
    likes INTEGER DEFAULT 0,
    replies INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.notebooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, 
    workshop_id TEXT NOT NULL,
    content TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, workshop_id)
);

CREATE TABLE public.community_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    category TEXT DEFAULT 'General',
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    supplies JSONB DEFAULT '[]'::jsonb,
    steps JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.wiki_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    term TEXT NOT NULL,
    definition TEXT NOT NULL,
    category TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEGURIDAD RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_entries ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PERMISIVAS (DEMO)
CREATE POLICY "Public Profiles All" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Public Projects All" ON public.community_projects FOR ALL USING (true);
CREATE POLICY "Public Wiki All" ON public.wiki_entries FOR ALL USING (true);
CREATE POLICY "Public Notebooks All" ON public.notebooks FOR ALL USING (true);
CREATE POLICY "Public Forum All" ON public.forum_posts FOR ALL USING (true);
CREATE POLICY "Public Content All" ON public.lessons FOR ALL USING (true);
CREATE POLICY "Public News All" ON public.news FOR ALL USING (true);
CREATE POLICY "Public Paths All" ON public.paths FOR ALL USING (true);
    `,
    fix: `
-- =================================================================
-- 2. REPARACIÓN DE PERMISOS (NO BORRA DATOS)
-- =================================================================

-- 1. Habilitar RLS en todas las tablas por seguridad
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_entries ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas antiguas restrictivas
DROP POLICY IF EXISTS "Public Profiles All" ON public.profiles;
DROP POLICY IF EXISTS "Public Projects All" ON public.community_projects;
DROP POLICY IF EXISTS "Public Wiki All" ON public.wiki_entries;
DROP POLICY IF EXISTS "Public Notebooks All" ON public.notebooks;
DROP POLICY IF EXISTS "Public Forum All" ON public.forum_posts;
DROP POLICY IF EXISTS "Public Content All" ON public.lessons;
DROP POLICY IF EXISTS "Public News All" ON public.news;
DROP POLICY IF EXISTS "Public Paths All" ON public.paths;
DROP POLICY IF EXISTS "Allow Public Delete" ON public.community_projects;
DROP POLICY IF EXISTS "Public Delete Profiles" ON public.profiles;

-- 3. Crear Políticas "Permissive Mode" (Para Demo/Dev)
CREATE POLICY "Public Profiles All" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Public Projects All" ON public.community_projects FOR ALL USING (true);
CREATE POLICY "Public Wiki All" ON public.wiki_entries FOR ALL USING (true);
CREATE POLICY "Public Notebooks All" ON public.notebooks FOR ALL USING (true);
CREATE POLICY "Public Forum All" ON public.forum_posts FOR ALL USING (true);
CREATE POLICY "Public Content All" ON public.lessons FOR ALL USING (true);
CREATE POLICY "Public News All" ON public.news FOR ALL USING (true);
CREATE POLICY "Public Paths All" ON public.paths FOR ALL USING (true);

-- 4. Parchear columnas faltantes comunes
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS board TEXT DEFAULT 'Ayuda General';
    `
  };

  return (
    <div className="flex-1 bg-background-dark min-h-screen text-white font-body p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-border-dark pb-8">
            <div className="space-y-2">
                <h1 className="text-4xl font-black uppercase tracking-tight">Gestión de <span className="text-primary">Usuarios</span></h1>
                <p className="text-text-secondary text-sm">Administra los permisos y el acceso a la plataforma.</p>
            </div>
            <div className="flex gap-4">
                <div className="px-6 py-3 bg-card-dark rounded-xl border border-border-dark flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase text-text-secondary">Total</span>
                    <span className="text-xl font-black text-white">{stats.total}</span>
                </div>
                <div className="px-6 py-3 bg-card-dark rounded-xl border border-border-dark flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase text-text-secondary">Editores</span>
                    <span className="text-xl font-black text-purple-400">{stats.editors}</span>
                </div>
                <button 
                    onClick={() => setShowSqlHelp(true)}
                    className="px-6 py-3 bg-surface-dark rounded-xl border border-border-dark flex flex-col items-center hover:border-primary transition-colors group cursor-pointer"
                >
                    <span className="text-[10px] font-black uppercase text-text-secondary group-hover:text-primary">Base de Datos</span>
                    <span className="text-xl font-black text-white group-hover:text-primary"><span className="material-symbols-outlined align-middle text-xl">database</span> SQL</span>
                </button>
            </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
            <span className="material-symbols-outlined absolute left-4 top-3 text-text-secondary">search</span>
            <input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-surface-dark border border-border-dark rounded-xl py-3 pl-12 pr-4 text-sm focus:border-primary outline-none text-white"
                placeholder="Buscar por nombre o email..."
            />
        </div>

        {/* Table/List */}
        <div className="space-y-4">
            {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-20 bg-card-dark rounded-2xl animate-pulse"></div>
                ))
            ) : filteredUsers.length === 0 ? (
                 <div className="p-12 text-center border-2 border-dashed border-border-dark rounded-3xl opacity-50">
                    <p>No se encontraron usuarios.</p>
                 </div>
            ) : (
                <div className="bg-card-dark rounded-3xl border border-border-dark overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-dark border-b border-border-dark text-[10px] uppercase tracking-widest text-text-secondary font-black">
                                <th className="p-6">Usuario</th>
                                <th className="p-6">Rol</th>
                                <th className="p-6">Progreso</th>
                                <th className="p-6 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-dark">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <img src={user.avatar} className="size-10 rounded-full bg-black border border-white/10" alt={user.name} />
                                            <div>
                                                <p className="font-bold text-white text-sm">{user.name}</p>
                                                <p className="text-xs text-text-secondary">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${user.role === 'editor' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                                            {user.role === 'editor' ? 'Editor Técnico' : 'Estudiante'}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                                                <span className="material-symbols-outlined text-sm text-amber-500">military_tech</span>
                                                Nivel {user.level}
                                            </div>
                                            <p className="text-[10px] text-text-secondary">{user.xp.toLocaleString()} XP Totales</p>
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        {user.id !== currentUser?.id && (
                                            <button 
                                                onClick={() => handleDelete(user)}
                                                className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 ml-auto"
                                            >
                                                <span className="material-symbols-outlined text-sm">block</span> Expulsar
                                            </button>
                                        )}
                                        {user.id === currentUser?.id && (
                                            <span className="text-[10px] text-text-secondary italic">Tú</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>

      {/* SQL HELP MODAL */}
      {showSqlHelp && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-surface-dark border border-border-dark max-w-3xl w-full rounded-[40px] p-10 space-y-6 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center shrink-0">
               <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white">Consola SQL Centralizada</h2>
                  <p className="text-xs text-text-secondary">Debes ejecutar este código manualmente en el <strong>SQL Editor</strong> de Supabase.</p>
               </div>
               <button onClick={() => setShowSqlHelp(false)} className="material-symbols-outlined hover:text-red-500">close</button>
            </div>

            <div className="flex gap-2 bg-black/30 p-1 rounded-xl shrink-0">
                <button 
                    onClick={() => setSqlMode('fix')} 
                    className={`flex-1 py-3 rounded-lg text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${sqlMode === 'fix' ? 'bg-primary text-white shadow-lg' : 'text-text-secondary hover:text-white'}`}
                >
                    <span className="material-symbols-outlined text-sm">build</span> Solo Reparar Permisos
                </button>
                <button 
                    onClick={() => setSqlMode('reset')} 
                    className={`flex-1 py-3 rounded-lg text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${sqlMode === 'reset' ? 'bg-red-500 text-white shadow-lg' : 'text-text-secondary hover:text-white'}`}
                >
                    <span className="material-symbols-outlined text-sm">delete_forever</span> Reset Total (Borrar Todo)
                </button>
            </div>
            
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-200 text-xs leading-relaxed shrink-0">
                 {sqlMode === 'fix' ? (
                     <span><strong className="text-amber-500">SEGURO:</strong> Copia este código, ve a Supabase - SQL Editor y ejecútalo. Esto actualizará las políticas de seguridad (RLS) para permitir el borrado.</span>
                 ) : (
                     <span><strong className="text-red-500">PELIGRO:</strong> Este script borrará TODAS las tablas y datos. Úsalo solo para inicializar la base de datos desde cero.</span>
                 )}
            </div>
            
            <pre className="flex-1 bg-black/50 p-6 rounded-2xl text-[10px] font-mono text-green-400 border border-white/5 overflow-x-auto select-all overflow-y-auto">
                {SQL_SCRIPTS[sqlMode]}
            </pre>
            
            <div className="flex gap-3 shrink-0">
                <button 
                  onClick={handleCopySql} 
                  className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all ${copyFeedback ? 'bg-green-500 text-white' : 'bg-surface-dark border border-border-dark hover:bg-card-dark text-white'}`}
                >
                   <span className="material-symbols-outlined text-sm">{copyFeedback ? 'check' : 'content_copy'}</span> 
                   {copyFeedback || 'Copiar Código'}
                </button>
                <a 
                  href="https://supabase.com/dashboard/project/_/sql" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-primary/80 transition-all"
                >
                    <span className="material-symbols-outlined text-sm">open_in_new</span> Ir a Supabase
                </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
