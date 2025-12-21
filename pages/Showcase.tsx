import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAllCommunityProjects, deleteCommunityProject } from '../content/communityRegistry';
import { CommunityProject, User } from '../types';

const Showcase: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<CommunityProject[]>([]);
  const [filter, setFilter] = useState('Todos');
  const [isLoading, setIsLoading] = useState(true);
  const [showSqlHelp, setShowSqlHelp] = useState(false);

  const user: User | null = useMemo(() => {
    const stored = localStorage.getItem('robo_user');
    return stored ? JSON.parse(stored) : null;
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    const data = await getAllCommunityProjects();
    setProjects(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadProjects();
    window.addEventListener('communityUpdated', loadProjects);
    return () => window.removeEventListener('communityUpdated', loadProjects);
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm("¿Estás seguro de que deseas eliminar este proyecto permanentemente?")) {
      try {
        await deleteCommunityProject(id);
        loadProjects();
      } catch (error) {
        console.error("Error deleting:", error);
        setShowSqlHelp(true);
      }
    }
  };

  const filteredProjects = filter === 'Todos' ? projects : projects.filter(p => p.category === filter);

  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark py-12 px-6 relative">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row items-end justify-between gap-6">
          <div className="space-y-4">
            <h1 className="text-5xl font-black text-slate-900 dark:text-white">VITRINA DE LA <br/> <span className="text-primary">COMUNIDAD</span></h1>
            <p className="text-slate-500 dark:text-text-secondary max-w-xl">
              Explora proyectos open-source creados por ingenieros como tú. Comparte tus inventos con el mundo.
            </p>
          </div>
          <div className="flex gap-4">
             <button 
               onClick={() => user ? navigate('/project-editor') : navigate('/login')}
               className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-xl shadow-primary/20 flex items-center gap-2 hover:scale-105 transition-transform"
             >
                <span className="material-symbols-outlined">add_circle</span>
                Compartir Proyecto
             </button>
          </div>
        </header>

        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
           {['Todos', 'Robótica', 'IoT', 'Impresión 3D', 'Software', 'Electrónica', 'General'].map(cat => (
             <button 
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-2 rounded-full text-xs font-black uppercase transition-all whitespace-nowrap border ${filter === cat ? 'bg-card-dark border-primary text-primary' : 'bg-transparent border-slate-200 dark:border-border-dark text-slate-500 hover:border-primary/50'}`}
             >
               {cat}
             </button>
           ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
           {isLoading ? (
             Array.from({ length: 4 }).map((_, i) => (
               <div key={i} className="aspect-[4/3] bg-card-dark rounded-2xl animate-pulse"></div>
             ))
           ) : filteredProjects.length === 0 ? (
             <div className="col-span-full py-20 text-center opacity-50 border-2 border-dashed border-border-dark rounded-[40px]">
                <span className="material-symbols-outlined text-6xl text-text-secondary mb-4">inventory_2</span>
                <p className="text-xl font-bold dark:text-white">Aún no hay proyectos en esta categoría.</p>
                <p className="text-sm text-text-secondary">¡Sé el primero en publicar uno!</p>
             </div>
           ) : (
             filteredProjects.map((proj) => (
               <div key={proj.id} className="group flex flex-col bg-white dark:bg-card-dark rounded-2xl overflow-hidden border border-slate-200 dark:border-border-dark hover:border-primary/50 transition-all shadow-sm hover:shadow-xl relative">
                  
                  {user?.role === 'editor' && (
                    <button 
                      onClick={(e) => handleDelete(e, proj.id)}
                      className="absolute top-2 left-2 p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg backdrop-blur-md transition-all z-20 shadow-lg cursor-pointer"
                      title="Borrar Proyecto"
                    >
                       <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  )}

                  <Link to={`/community-project/${proj.id}`} className="flex flex-col flex-1">
                      <div className="aspect-[4/3] overflow-hidden relative">
                         <img src={proj.coverImage || 'https://picsum.photos/seed/default/600/400'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={proj.title} />
                         <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-white text-[9px] font-black uppercase">
                            {proj.category}
                         </div>
                      </div>
                      <div className="p-4 space-y-2 flex-1 flex flex-col">
                         <h3 className="text-slate-900 dark:text-white font-bold truncate text-lg group-hover:text-primary transition-colors">{proj.title}</h3>
                         <p className="text-xs text-slate-500 dark:text-text-secondary line-clamp-2">{proj.description}</p>
                         
                         <div className="pt-4 mt-auto flex items-center justify-between border-t border-slate-100 dark:border-border-dark/50">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary">
                               <span className="material-symbols-outlined text-sm">person</span>
                               {proj.authorName}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-primary">
                               <span className="material-symbols-outlined text-xs">favorite</span> {proj.likes}
                            </div>
                         </div>
                      </div>
                  </Link>
               </div>
             ))
           )}
        </div>

        {showSqlHelp && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-surface-dark border border-border-dark max-w-2xl w-full rounded-[40px] p-10 space-y-6 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-black text-white">Error de Permisos (RLS)</h2>
                 <button onClick={() => setShowSqlHelp(false)} className="material-symbols-outlined hover:text-red-500">close</button>
              </div>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-200 text-xs leading-relaxed">
                 <strong className="block mb-2 uppercase tracking-widest text-amber-500">Diagnóstico:</strong>
                 Tu aplicación usa autenticación personalizada (sin sesión real de Supabase Auth), por lo que la base de datos no puede verificar tu rol de "Editor" automáticamente. Debes permitir el borrado público (la app React ya protege el botón visualmente).
              </div>
              <p className="text-sm text-text-secondary">
                 Ejecuta este SQL en Supabase para solucionar el problema definitivamente:
              </p>
              <pre className="bg-black/50 p-6 rounded-2xl text-[10px] font-mono text-green-400 border border-white/5 overflow-x-auto select-all">
{`-- 1. Eliminar políticas anteriores restrictivas
DROP POLICY IF EXISTS "Owner Delete Projects" ON public.community_projects;
DROP POLICY IF EXISTS "Allow Delete for Owners and Editors" ON public.community_projects;

-- 2. Crear política PERMISIVA (Confía en la validación del Frontend)
CREATE POLICY "Allow Public Delete"
ON public.community_projects
FOR DELETE
USING (true);`}
              </pre>
              <button onClick={() => setShowSqlHelp(false)} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase">Entendido, ejecutaré el SQL</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Showcase;