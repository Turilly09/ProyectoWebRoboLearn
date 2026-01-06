
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LearningPath, Module, User } from '../types';
import { getModulesByPath } from '../content/registry';
import { getAllPaths } from '../content/pathRegistry';

const Paths: React.FC = () => {
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [activePathId, setActivePathId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [enrichedPaths, setEnrichedPaths] = useState<(LearningPath & { modules: Module[] })[]>([]);

  const user: User | null = useMemo(() => {
    const stored = localStorage.getItem('robo_user');
    return stored ? JSON.parse(stored) : null;
  }, []);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    const paths = await getAllPaths();
    
    // Enriquecemos cada ruta con sus módulos reales (asíncronamente)
    const processed = await Promise.all(paths.map(async (path) => {
      const allModulesData = await getModulesByPath(path.id);
      
      const modules: Module[] = allModulesData.map(data => ({
        id: data.id,
        title: data.title,
        description: data.subtitle,
        duration: "30 min", 
        status: 'locked',
        icon: data.type === 'practice' ? 'science' : 'bolt', 
        type: data.type || 'theory'
      }));

      // Calcular estados (locked/current/completed)
      let foundCurrent = false;
      const finalModules = modules.map((m, i) => {
        if (!user) return { ...m, status: i === 0 ? 'current' as const : 'locked' as const };
        if (user.completedLessons.includes(m.id)) return { ...m, status: 'completed' as const };
        if (!foundCurrent) {
          foundCurrent = true;
          return { ...m, status: 'current' as const };
        }
        return { ...m, status: 'locked' as const };
      });

      const completedCount = finalModules.filter(m => m.status === 'completed').length;
      const progress = finalModules.length > 0 ? Math.round((completedCount / finalModules.length) * 100) : 0;

      return { ...path, modules: finalModules, progress, modulesCount: finalModules.length };
    }));

    setEnrichedPaths(processed);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadAllData();
    window.addEventListener('lessonsUpdated', loadAllData);
    window.addEventListener('pathsUpdated', loadAllData);
    return () => {
      window.removeEventListener('lessonsUpdated', loadAllData);
      window.removeEventListener('pathsUpdated', loadAllData);
    };
  }, [loadAllData]);

  const activePath = enrichedPaths.find(p => p.id === activePathId);
  const filteredPaths = selectedLevel ? enrichedPaths.filter(p => p.level === selectedLevel) : enrichedPaths;

  const handleModuleClick = (module: Module) => {
    if (!user) { navigate('/login'); return; }
    if (module.status === 'locked') return;
    
    if (module.type === 'practice') {
      navigate(`/ide/${module.id}`);
    } else {
      navigate(`/lesson/${module.id}`);
    }
  };

  const handleWorkshopClick = (workshopId: string) => {
    if (!user) { navigate('/login'); return; }
    // En un caso real, validaríamos si todos los módulos están completos.
    if ((activePath?.progress || 0) < 10 && user.role !== 'editor') {
      alert("Completa más módulos para desbloquear el Proyecto Final.");
      return;
    }
    navigate(`/workshop/${workshopId}`);
  };

  // --- VISTA DETALLE DE RUTA ---
  if (activePath) {
    return (
      <div className="flex-1 flex flex-col bg-background-light dark:bg-background-dark animate-in fade-in duration-500">
        <header className="bg-surface-dark border-b border-border-dark py-8 px-6">
           <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center gap-8">
              <div className="size-20 rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-white/10">
                 <img src={activePath.image} className="w-full h-full object-cover" alt={activePath.title} />
              </div>
              <div className="flex-1 text-center md:text-left text-white">
                 <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                    <h1 className="text-3xl font-black">{activePath.title}</h1>
                    <span className="px-2 py-0.5 rounded-md bg-primary/20 text-primary text-[9px] font-black uppercase tracking-widest">{activePath.level}</span>
                 </div>
                 <p className="text-text-secondary max-w-2xl text-xs">{activePath.description}</p>
              </div>
              <button onClick={() => setActivePathId(null)} className="px-5 py-2 bg-card-dark text-white rounded-lg text-[10px] font-bold border border-border-dark uppercase tracking-widest hover:bg-surface-dark transition-colors">Volver a Rutas</button>
           </div>
        </header>

        <div className="max-w-[1600px] mx-auto w-full px-6 py-8 flex flex-col lg:flex-row gap-8">
           <main className="flex-1 space-y-8">
              <section>
                <h2 className="text-sm font-black text-slate-900 dark:text-white mb-4 uppercase tracking-widest flex items-center gap-2">
                   <span className="material-symbols-outlined text-lg">view_list</span> Módulos del Curso
                </h2>
                <div className="grid grid-cols-1 gap-2">
                   {activePath.modules?.map((module, index) => (
                     <div key={module.id} className={`group flex items-center gap-4 p-4 bg-white dark:bg-card-dark rounded-xl border transition-all shadow-sm ${module.status === 'locked' ? 'opacity-60 grayscale border-border-dark' : 'hover:border-primary/50 border-slate-200 dark:border-border-dark'}`}>
                        <div className={`size-10 rounded-lg bg-surface-dark border flex items-center justify-center shrink-0 ${module.status === 'completed' ? 'text-green-500' : module.type === 'practice' ? 'text-amber-500' : 'text-primary'}`}>
                           <span className="material-symbols-outlined text-lg">{module.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-0.5">
                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${module.type === 'practice' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                                {module.type === 'practice' ? 'Lab' : 'Teoría'}
                              </span>
                              <span className="text-[9px] text-text-secondary font-bold">• Módulo {index + 1}</span>
                           </div>
                           <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{module.title}</h3>
                           <p className="text-[10px] text-slate-500 dark:text-text-secondary line-clamp-1">{module.description}</p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                           {module.status === 'completed' ? (
                             <div className="size-8 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center cursor-pointer hover:bg-green-500/20" onClick={() => handleModuleClick(module)}><span className="material-symbols-outlined text-sm">check_circle</span></div>
                           ) : module.status === 'current' ? (
                             <button onClick={() => handleModuleClick(module)} className="px-4 py-1.5 bg-primary text-white rounded-lg text-[9px] font-black uppercase shadow-lg shadow-primary/20 hover:scale-105 transition-transform">Empezar</button>
                           ) : (
                             <div className="size-8 rounded-full bg-surface-dark text-slate-600 flex items-center justify-center"><span className="material-symbols-outlined text-sm">lock</span></div>
                           )}
                        </div>
                     </div>
                   ))}
                </div>
              </section>

              {/* SECTION DEL WORKSHOP FINAL */}
              {activePath.finalWorkshop && (
                <section className="animate-in slide-in-from-bottom-8 duration-700">
                  <div className="flex items-center gap-2 mb-4">
                     <span className="material-symbols-outlined text-amber-500 text-xl">trophy</span>
                     <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Proyecto de Certificación</h2>
                  </div>
                  
                  <div 
                    onClick={() => handleWorkshopClick(activePath.finalWorkshop!.id)}
                    className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent group cursor-pointer hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500"
                  >
                     <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <span className="material-symbols-outlined text-9xl text-amber-500">engineering</span>
                     </div>
                     <div className="p-6 relative z-10 flex flex-col md:flex-row gap-6 items-center">
                        <div className="size-24 rounded-xl overflow-hidden shadow-2xl border border-amber-500/20 shrink-0">
                           <img src={activePath.finalWorkshop.image} className="w-full h-full object-cover" alt="Workshop" />
                        </div>
                        <div className="flex-1 text-center md:text-left space-y-1">
                           <div className="flex items-center justify-center md:justify-start gap-2">
                              <span className="px-2 py-0.5 rounded bg-amber-500 text-black text-[8px] font-black uppercase">Workshop Final</span>
                              <span className="text-[9px] text-amber-500 font-bold uppercase">{activePath.finalWorkshop.estimatedTime}</span>
                           </div>
                           <h3 className="text-xl font-black text-white group-hover:text-amber-400 transition-colors">{activePath.finalWorkshop.title}</h3>
                           <p className="text-xs text-text-secondary line-clamp-2 max-w-xl">{activePath.finalWorkshop.description}</p>
                        </div>
                        <button className="px-5 py-2 bg-amber-500 text-black rounded-xl font-bold uppercase text-[10px] shadow-lg hover:bg-amber-400 transition-colors">
                           Ver Proyecto
                        </button>
                     </div>
                  </div>
                </section>
              )}
           </main>

           <aside className="w-full lg:w-80 space-y-6">
              <div className="p-6 bg-card-dark rounded-2xl border border-border-dark space-y-4">
                 <h3 className="text-xs font-black text-white uppercase tracking-widest">Tu Progreso</h3>
                 <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-text-secondary">
                       <span>{activePath.progress}% Completado</span>
                       <span>{activePath.modules?.filter(m => m.status === 'completed').length}/{activePath.modulesCount} Módulos</span>
                    </div>
                    <div className="h-1.5 bg-surface-dark rounded-full overflow-hidden border border-border-dark">
                       <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${activePath.progress}%` }}></div>
                    </div>
                 </div>
              </div>

              <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/20 space-y-3">
                 <div className="flex items-center gap-2 text-blue-400">
                    <span className="material-symbols-outlined text-lg">school</span>
                    <h3 className="text-xs font-black uppercase tracking-widest">Certificado</h3>
                 </div>
                 <p className="text-[10px] text-blue-200 leading-relaxed">
                    Al completar todos los módulos teóricos y el laboratorio práctico final, recibirás una insignia verificable en tu perfil de ingeniero.
                 </p>
              </div>
           </aside>
        </div>
      </div>
    );
  }

  // --- VISTA LISTA DE RUTAS ---
  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark p-6 md:p-12 overflow-y-auto">
       <div className="max-w-[1600px] mx-auto space-y-10">
          {/* Header with Filters */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
             <div>
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-2">Rutas de <span className="text-primary">Aprendizaje</span></h1>
                <p className="text-sm text-slate-500 dark:text-text-secondary">Selecciona tu carrera y especialízate en el futuro.</p>
             </div>
             {/* Filters */}
             <div className="flex gap-1 bg-white dark:bg-surface-dark p-1 rounded-xl border border-slate-200 dark:border-border-dark">
                {['Todos', 'Principiante', 'Intermedio', 'Avanzado'].map(lvl => (
                   <button 
                     key={lvl}
                     onClick={() => setSelectedLevel(lvl === 'Todos' ? null : lvl)}
                     className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                        (lvl === 'Todos' && !selectedLevel) || selectedLevel === lvl 
                        ? 'bg-primary text-white shadow-lg' 
                        : 'text-text-secondary hover:text-slate-900 dark:hover:text-white'
                     }`}
                   >
                      {lvl}
                   </button>
                ))}
             </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {isLoading ? (
               Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-64 bg-card-dark rounded-3xl animate-pulse"></div>)
             ) : (
               filteredPaths.map(path => (
                <div 
                  key={path.id}
                  onClick={() => setActivePathId(path.id)} 
                  className="group bg-white dark:bg-card-dark rounded-3xl overflow-hidden border border-slate-200 dark:border-border-dark hover:border-primary/50 hover:shadow-2xl transition-all cursor-pointer flex flex-col h-full"
                >
                   <div className="h-40 relative overflow-hidden shrink-0">
                      <img src={path.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={path.title} />
                      <div className={`absolute top-3 right-3 px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest text-white shadow-lg ${path.color || 'bg-slate-500'}`}>
                         {path.level}
                      </div>
                   </div>
                   <div className="p-5 flex flex-col flex-1 gap-3">
                      <div>
                         <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors line-clamp-1">{path.title}</h3>
                         <p className="text-[10px] text-slate-500 dark:text-text-secondary line-clamp-3 leading-relaxed">{path.description}</p>
                      </div>
                      <div className="mt-auto pt-3 border-t border-slate-100 dark:border-border-dark/50 flex justify-between items-center">
                         <span className="text-[9px] font-bold text-slate-400 uppercase">{path.modulesCount} Módulos</span>
                         <span className="material-symbols-outlined text-primary text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </div>
                   </div>
                </div>
               ))
             )}
          </div>
       </div>
    </div>
  );
};

export default Paths;
