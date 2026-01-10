
import React, { useState, useEffect } from 'react';
import { getAllUsers, updateUserRole, deleteUser } from '../content/userRegistry';
import { User } from '../types';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
    window.addEventListener('usersUpdated', loadUsers);
    return () => window.removeEventListener('usersUpdated', loadUsers);
  }, []);

  const handleRoleChange = async (user: User) => {
      const newRole = user.role === 'student' ? 'editor' : 'student';
      if(window.confirm(`¿Cambiar rol de ${user.name} a ${newRole.toUpperCase()}?`)) {
          try {
              await updateUserRole(user.id, newRole);
          } catch(e) {
              setErrorMsg("Error actualizando rol. Verifica permisos.");
              setTimeout(() => setErrorMsg(""), 3000);
          }
      }
  };

  const handleDeleteUser = async (id: string) => {
      if(window.confirm("¿Eliminar usuario y todos sus datos? Esta acción es IRREVERSIBLE.")) {
          try {
              await deleteUser(id);
          } catch(e) {
              setErrorMsg("Error eliminando usuario.");
              setTimeout(() => setErrorMsg(""), 3000);
          }
      }
  };

  const filteredUsers = users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark p-6 md:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="material-symbols-outlined text-amber-500 text-3xl">admin_panel_settings</span>
                        Gestión de Usuarios
                    </h2>
                    <p className="text-text-secondary text-sm mt-1">Administra accesos y permisos de la plataforma.</p>
                </div>
                
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-secondary text-lg">search</span>
                    <input 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-card-dark border border-border-dark rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:border-amber-500 outline-none w-64 md:w-80"
                        placeholder="Buscar por nombre o email..."
                    />
                </div>
            </div>

            {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl font-bold text-center">
                    {errorMsg}
                </div>
            )}

            {/* Grid de Usuarios */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1,2,3].map(i => <div key={i} className="h-64 bg-card-dark rounded-3xl animate-pulse"></div>)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map(user => (
                        <div key={user.id} className="bg-card-dark rounded-3xl p-6 border border-border-dark flex flex-col gap-4 relative group hover:border-amber-500/30 transition-all shadow-lg">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <img src={user.avatar} className="size-12 rounded-full bg-surface-dark border border-border-dark" alt={user.name} />
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-white leading-tight truncate">{user.name}</h3>
                                        <p className="text-[10px] text-text-secondary truncate max-w-[150px]" title={user.email}>{user.email}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${user.role === 'editor' ? 'bg-purple-500/20 text-purple-400' : 'bg-primary/20 text-primary'}`}>
                                    {user.role === 'editor' ? 'Editor' : 'Alumno'}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 py-4 border-y border-border-dark/50">
                                <div className="text-center">
                                    <p className="text-lg font-black text-white">{user.level}</p>
                                    <p className="text-[9px] text-text-secondary uppercase font-bold">Nivel</p>
                                </div>
                                <div className="text-center border-l border-border-dark/50">
                                    <p className="text-lg font-black text-white">{user.xp}</p>
                                    <p className="text-[9px] text-text-secondary uppercase font-bold">XP</p>
                                </div>
                                <div className="text-center border-l border-border-dark/50">
                                    <p className="text-lg font-black text-white">{(user.badges || []).length}</p>
                                    <p className="text-[9px] text-text-secondary uppercase font-bold">Insignias</p>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-auto">
                                <button 
                                    onClick={() => handleRoleChange(user)}
                                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border ${user.role === 'editor' ? 'border-primary text-primary hover:bg-primary hover:text-white' : 'border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white'}`}
                                >
                                    {user.role === 'editor' ? 'Degradar a Alumno' : 'Ascender a Editor'}
                                </button>
                                <button 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="px-3 py-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                    title="Eliminar Usuario"
                                >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredUsers.length === 0 && (
                        <div className="col-span-full py-20 text-center opacity-50 border-2 border-dashed border-border-dark rounded-3xl">
                            <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
                            <p className="text-xl font-bold">No se encontraron usuarios.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default UserManagement;
