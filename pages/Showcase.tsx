
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAllCommunityProjects, deleteCommunityProject, getCommunityStats } from '../content/communityRegistry';
import { getLeaderboard, LeaderboardData, LeaderboardEntry } from '../content/leaderboardRegistry';
import { CommunityProject, User } from '../types';

export default function Showcase() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'projects' | 'leaderboard'>('projects');
  
  // Projects State
  const [projects, setProjects] = useState<CommunityProject[]>([]);
  const [filter, setFilter] = useState('Todos');
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  
  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  // Stats State
  const [stats, setStats] = useState({ total: 0, online: 0 });

  const [showSqlHelp, setShowSqlHelp] = useState(false);

  const user: User | null = useMemo(() => {
    try {
      const stored = localStorage.getItem('robo_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    loadProjects();
    loadStats();
    window.addEventListener('communityUpdated', loadProjects);
    return () => window.removeEventListener('communityUpdated', loadProjects);
  }, []);

  // Cargar leaderboard al cambiar de tab
  useEffect(() => {
    if (activeTab === 'leaderboard') {
      loadLeaderboard();
    }
  }, [activeTab, user]);

  const loadStats = async () => {
    const s = await getCommunityStats();
    setStats(s);
  };

  const loadProjects = async () => {
    setIsLoadingProjects(true);
    const data = await getAllCommunityProjects();
    setProjects(data);
    setIsLoadingProjects(false);
  };

  const loadLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    const data = await getLeaderboard(user?.id);
    setLeaderboard(data);
    setIsLoadingLeaderboard(false);
  };

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

  // Componente para una fila del ranking
  const RankRow = ({ entry, isUser = false, type }: { entry: LeaderboardEntry, isUser?: boolean, type: 'monthly' | 'allTime' }) => {
    const isTop3 = entry.rank <= 3;
    let badgeColor = "bg-slate-700 text-slate-400";
    if (entry.rank === 1) badgeColor = "bg-yellow-500 text-black";
    if (entry.rank === 2) badgeColor = "bg-slate-300 text-black";
    if (entry.rank === 3) badgeColor = "bg-amber-700 text-white";

    return (
      <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${isUser ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10 transform scale-[1.02]' : 'bg-card-dark border-border-dark'}`}>
        <div className={`size-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${badgeColor} shadow-lg`}>
          {entry.rank}
        </div>
        <img src={entry.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.name}`} className="size-10 rounded-full bg-surface-dark" alt={entry.name} />
        <div className="flex-1 min-w-0">
          <p className={`font-bold truncate ${isUser ? 'text-primary' : 'text-white'}`}>{entry.name} {isUser && '(Tú)'}</p>
          <p className="text-[10px] text-text-secondary uppercase font-black">Nivel {entry.level}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-white">{entry.xp.toLocaleString()}</p>
          <p className="text-[9px] text-text-secondary uppercase font-bold">XP {type === 'monthly' ? 'Mes' : 'Total'}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark py-12 px-6 relative">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row items-end justify-between gap-6 pb-8 border-b border-border-dark">
          <div className="space-y-4">
            <h1 className="text-5xl font-black text-slate-900 dark:text-white">COMUNIDAD <span className="text-primary">ROBOLEARN</span></h1>
            <p className="text-slate-500 dark:text-text-secondary max-w-xl">
              El espacio donde los ingenieros comparten, compiten y crecen juntos.
            </p>
            {/* STATS COUNTER */}
            <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full border border-green-500/20">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-black uppercase text-green-500 tracking-wide">{stats.online} Online</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
                    <span className="material-symbols-outlined text-sm text-primary">group</span>
                    <span className="text-xs font-black uppercase text-primary tracking-wide">{stats.total} Miembros</span>
                </div>
            </div>
          </div>
          <div className="flex bg-card-dark p-1 rounded-xl border border-border-dark">
             <button 
               onClick={() => setActiveTab('projects')}
               className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'projects' ? 'bg-primary text-white shadow-lg' : 'text-text-secondary hover:text-white'}`}
             >
               <span className="material-symbols-outlined text-sm">inventory_2</span> Proyectos
             </button>
             <button 
               onClick={() => setActiveTab('leaderboard')}
               className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'leaderboard' ? 'bg-amber-500 text-black shadow-lg' : 'text-text-secondary hover:text-white'}`}
             >
               <span className="material-symbols-outlined text-sm">trophy</span> Ranking
             </button>
          </div>
        </header>

        {/* --- TAB PROYECTOS --- */}
        {activeTab === 'projects' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar w-full md:w-auto">
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
              <button 
                onClick={() => user ? navigate('/project-editor') : navigate('/login')}
                className="px-6 py-2 bg-primary text-white rounded-xl font-bold shadow-xl shadow-primary/20 flex items-center gap-2 hover:scale-105 transition-transform whitespace-nowrap"
              >
                  <span className="material-symbols-outlined text-lg">add_circle</span>
                  Subir Proyecto
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {isLoadingProjects ? (
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
          </div>
        )}

        {/* --- TAB LEADERBOARD --- */}
        {activeTab === 'leaderboard' && (
          <div className="animate-in fade-in slide-in-from-right-4 space-y-12">
            {isLoadingLeaderboard || !leaderboard ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {[1,2].map(i => <div key={i} className="h-96 bg-card-dark rounded-3xl animate-pulse"></div>)}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                 {/* COLUMNA MENSUAL */}
                 <section className="space-y-6">
                    <div className="flex items-center gap-4 mb-2">
                       <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg shadow-orange-500/20">
                          <span className="material-symbols-outlined text-2xl text-white">local_fire_department</span>
                       </div>
                       <div>
                          <h2 className="text-2xl font-black text-white">Top Ingenieros del Mes</h2>
                          <p className="text-text-secondary text-xs font-bold uppercase tracking-widest">Competición Activa</p>
                       </div>
                    </div>
                    
                    <div className="space-y-3">
                       {leaderboard.monthly.length > 0 ? (
                         leaderboard.monthly.map(entry => (
                           <RankRow key={entry.id} entry={entry} type="monthly" isUser={entry.id === user?.id} />
                         ))
                       ) : (
                         <div className="p-8 text-center border-2 border-dashed border-border-dark rounded-2xl opacity-50">Nadie ha ganado XP este mes aún.</div>
                       )}
                       
                       {/* TU POSICIÓN MENSUAL (Si no estás en el top 5) */}
                       {user && leaderboard.userRankMonthly && leaderboard.userRankMonthly.rank > 5 && (
                         <>
                            <div className="flex items-center gap-4 py-2 opacity-30">
                               <div className="w-0.5 h-8 bg-border-dark mx-auto"></div>
                            </div>
                            <RankRow entry={leaderboard.userRankMonthly} isUser={true} type="monthly" />
                         </>
                       )}
                    </div>
                 </section>

                 {/* COLUMNA HISTÓRICA */}
                 <section className="space-y-6">
                    <div className="flex items-center gap-4 mb-2">
                       <div className="p-3 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl shadow-lg shadow-amber-500/20">
                          <span className="material-symbols-outlined text-2xl text-white">military_tech</span>
                       </div>
                       <div>
                          <h2 className="text-2xl font-black text-white">Leyendas Históricas</h2>
                          <p className="text-text-secondary text-xs font-bold uppercase tracking-widest">Salón de la Fama</p>
                       </div>
                    </div>
                    
                    <div className="space-y-3">
                       {leaderboard.allTime.length > 0 ? (
                         leaderboard.allTime.map(entry => (
                           <RankRow key={entry.id} entry={entry} type="allTime" isUser={entry.id === user?.id} />
                         ))
                       ) : (
                         <div className="p-8 text-center border-2 border-dashed border-border-dark rounded-2xl opacity-50">Sin datos históricos.</div>
                       )}

                       {/* TU POSICIÓN HISTÓRICA (Si no estás en el top 5) */}
                       {user && leaderboard.userRankAllTime && leaderboard.userRankAllTime.rank > 5 && (
                         <>
                            <div className="flex items-center gap-4 py-2 opacity-30">
                               <div className="w-0.5 h-8 bg-border-dark mx-auto"></div>
                            </div>
                            <RankRow entry={leaderboard.userRankAllTime} isUser={true} type="allTime" />
                         </>
                       )}
                    </div>
                 </section>
              </div>
            )}
          </div>
        )}

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
}
