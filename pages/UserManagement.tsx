
import React, { useState, useEffect, useMemo } from 'react';
import { getAllUsers, updateUserRole, deleteUser } from '../content/userRegistry';
import { User } from '../types';

type SortField = 'name' | 'email' | 'role' | 'level' | 'xp' | 'joined';
type SortOrder = 'asc' | 'desc';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Estados de UI para gestión de datos
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'editor'>('all');
  const [sortField, setSortField] = useState<SortField>('level');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Lógica de Filtrado y Ordenamiento
  const processedUsers = useMemo(() => {
    let result = [...users];

    // 1. Filtro de Texto
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(u => 
        u.name.toLowerCase().includes(lowerTerm) || 
        u.email.toLowerCase().includes(lowerTerm)
      );
    }

    // 2. Filtro de Rol
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }

    // 3. Ordenamiento
    result.sort((a, b) => {
      let valA: any = a[sortField as keyof User];
      let valB: any = b[sortField as keyof User];

      // Casos especiales
      if (sortField === 'joined') { 
          // Usamos el ID o un campo de fecha si existiera (asumimos orden de creación por defecto si no hay fecha explícita)
          return 0; 
      } 

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchTerm, roleFilter, sortField, sortOrder]);

  // Paginación
  const totalPages = Math.ceil(processedUsers.length / itemsPerPage);
  const paginatedUsers = processedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark p-6 md:p-10 overflow-y-auto font-body">
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2">
            
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-surface-dark p-6 rounded-3xl border border-border-dark shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="material-symbols-outlined text-amber-500 text-3xl">group</span>
                        Directorio de Usuarios
                    </h2>
                    <p className="text-text-secondary text-xs mt-1 font-bold uppercase tracking-widest">
                        Total: <span className="text-white">{users.length}</span> | Filtrados: <span className="text-primary">{processedUsers.length}</span>
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <select 
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value as any); setCurrentPage(1); }}
                        className="bg-card-dark border border-border-dark rounded-xl py-2.5 px-4 text-xs font-bold text-white focus:border-amber-500 outline-none uppercase"
                    >
                        <option value="all">Todos los Roles</option>
                        <option value="student">Estudiantes</option>
                        <option value="editor">Editores</option>
                    </select>

                    <div className="relative flex-1 sm:flex-none">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-secondary text-lg">search</span>
                        <input 
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full sm:w-64 bg-card-dark border border-border-dark rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:border-amber-500 outline-none font-medium"
                            placeholder="Buscar por nombre o email..."
                        />
                    </div>
                </div>
            </div>

            {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl font-bold text-center text-sm">
                    {errorMsg}
                </div>
            )}

            {/* DATA TABLE */}
            <div className="bg-surface-dark border border-border-dark rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-card-dark border-b border-border-dark text-[10px] uppercase font-black text-text-secondary tracking-widest">
                                <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-1">Usuario {sortField === 'name' && <span className="material-symbols-outlined text-sm">{sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}</div>
                                </th>
                                <th className="p-4 hidden md:table-cell cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('email')}>
                                    <div className="flex items-center gap-1">Email {sortField === 'email' && <span className="material-symbols-outlined text-sm">{sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}</div>
                                </th>
                                <th className="p-4 cursor-pointer hover:text-white transition-colors text-center" onClick={() => handleSort('role')}>
                                    <div className="flex items-center justify-center gap-1">Rol {sortField === 'role' && <span className="material-symbols-outlined text-sm">{sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}</div>
                                </th>
                                <th className="p-4 cursor-pointer hover:text-white transition-colors text-center" onClick={() => handleSort('level')}>
                                    <div className="flex items-center justify-center gap-1">Nivel {sortField === 'level' && <span className="material-symbols-outlined text-sm">{sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}</div>
                                </th>
                                <th className="p-4 cursor-pointer hover:text-white transition-colors text-center" onClick={() => handleSort('xp')}>
                                    <div className="flex items-center justify-center gap-1">XP {sortField === 'xp' && <span className="material-symbols-outlined text-sm">{sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}</div>
                                </th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-dark/50 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-text-secondary">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            <span>Cargando datos...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-text-secondary italic">No se encontraron usuarios.</td>
                                </tr>
                            ) : (
                                paginatedUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <img src={user.avatar} className="size-8 rounded-full bg-black/20" alt="" />
                                                <span className="font-bold text-white group-hover:text-primary transition-colors">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 hidden md:table-cell text-text-secondary font-mono text-xs">{user.email}</td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-block px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${user.role === 'editor' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-surface-dark text-text-secondary border border-border-dark'}`}>
                                                {user.role === 'editor' ? 'Editor' : 'Alumno'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center font-bold text-white">{user.level}</td>
                                        <td className="p-4 text-center font-mono text-xs text-primary">{user.xp.toLocaleString()}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleRoleChange(user)}
                                                    className="p-1.5 hover:bg-white/10 rounded-lg text-text-secondary hover:text-white transition-colors"
                                                    title={user.role === 'student' ? "Ascender a Editor" : "Degradar a Alumno"}
                                                >
                                                    <span className="material-symbols-outlined text-lg">{user.role === 'student' ? 'upgrade' : 'person'}</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-1.5 hover:bg-red-500/20 rounded-lg text-text-secondary hover:text-red-500 transition-colors"
                                                    title="Eliminar Usuario"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-border-dark flex items-center justify-between bg-card-dark">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg text-[10px] font-black uppercase bg-surface-dark border border-border-dark text-text-secondary hover:text-white hover:border-primary disabled:opacity-50 disabled:hover:border-border-dark disabled:hover:text-text-secondary transition-all"
                    >
                        Anterior
                    </button>
                    <span className="text-[10px] font-bold text-text-secondary uppercase">
                        Página <span className="text-white">{currentPage}</span> de <span className="text-white">{totalPages || 1}</span>
                    </span>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="px-4 py-2 rounded-lg text-[10px] font-black uppercase bg-surface-dark border border-border-dark text-text-secondary hover:text-white hover:border-primary disabled:opacity-50 disabled:hover:border-border-dark disabled:hover:text-text-secondary transition-all"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default UserManagement;
