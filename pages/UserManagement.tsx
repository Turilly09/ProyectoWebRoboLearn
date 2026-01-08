
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../types';
import { getAllUsers, deleteUser } from '../content/userRegistry';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showSqlHelp, setShowSqlHelp] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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
    }
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
                <div className="px-6 py-3 bg-card-dark rounded-xl border border-border-dark flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase text-text-secondary">Estudiantes</span>
                    <span className="text-xl font-black text-primary">{stats.students}</span>
                </div>
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
          <div className="bg-surface-dark border border-border-dark max-w-2xl w-full rounded-[40px] p-10 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center">
               <h2 className="text-2xl font-black text-white">Error de Permisos (Delete)</h2>
               <button onClick={() => setShowSqlHelp(false)} className="material-symbols-outlined hover:text-red-500">close</button>
            </div>
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-200 text-xs leading-relaxed">
                 <strong className="block mb-2 uppercase tracking-widest text-amber-500">Diagnóstico:</strong>
                 Supabase está bloqueando el borrado. Esto ocurre porque faltan políticas RLS para DELETE o porque el usuario tiene contenido (Proyectos, Wiki) que impide borrar su perfil por seguridad.
            </div>
            <p className="text-sm text-text-secondary">
               Ejecuta este <strong>Script Maestro</strong> en Supabase para solucionar todos los permisos de una vez:
            </p>
            <pre className="bg-black/50 p-6 rounded-2xl text-[10px] font-mono text-green-400 border border-white/5 overflow-x-auto select-all">
{`-- 1. Permitir borrar Perfiles
DROP POLICY IF EXISTS "Public Delete Profiles" ON public.profiles;
CREATE POLICY "Public Delete Profiles" ON public.profiles FOR DELETE USING (true);

-- 2. Permitir borrar Proyectos de la Comunidad
DROP POLICY IF EXISTS "Allow Public Delete" ON public.community_projects;
CREATE POLICY "Allow Public Delete" ON public.community_projects FOR DELETE USING (true);

-- 3. Permitir borrar Entradas de Wiki
DROP POLICY IF EXISTS "Public Delete Wiki" ON public.wiki_entries;
CREATE POLICY "Public Delete Wiki" ON public.wiki_entries FOR DELETE USING (true);

-- 4. Permitir borrar Cuadernos
DROP POLICY IF EXISTS "Public Delete Notebooks" ON public.notebooks;
CREATE POLICY "Public Delete Notebooks" ON public.notebooks FOR DELETE USING (true);`}
            </pre>
            <button onClick={() => setShowSqlHelp(false)} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase">Entendido, ejecutar SQL</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
