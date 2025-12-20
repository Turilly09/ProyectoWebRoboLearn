
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LearningPath, Module, User } from '../types';
import { getModulesByPath } from '../content/registry';
import { getAllPaths } from '../content/pathRegistry';

const Paths: React.FC = () => {
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [activePathId, setActivePathId] = useState<string | null>(null);
  const [allPaths, setAllPaths] = useState<LearningPath[]>([]);
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

  if (activePath) {
    return (
      <div className="flex-1 flex flex-col bg-background-light dark:bg-background-dark animate-in fade-in duration-500">
        <header className="bg-surface-dark border-b border-border-dark py-12 px-6">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-10">
              <div className="size-24 rounded-3xl overflow-hidden shadow-2xl shrink-0">
                 <img src={activePath.image} className="w-full h-full object-cover" alt={activePath.title} />
              </div>
              <div className="flex-1 text-center md:text-left text-white">
                 <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                    <h1 className="text-4xl font-black">{activePath.title}</h1>
                    <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">{activePath.level}</span>
                 </div>
                 <p className="text-text-secondary max-w-2xl">{activePath.description}</p>
              </div>
              <button onClick={() => setActivePathId(null)} className="px-6 py-2.5 bg-card-dark text-white rounded-xl text-sm font-bold border border-border-dark">Volver a Rutas</button>
           </div>
        </header>

        <div className="max-w-7xl mx-auto w-full px-6 py-12 flex flex-col lg:flex-row gap-12">
           <main className="flex-1 space-y-12">
              <section>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8">Módulos del Curso</h2>
                <div className="grid grid-cols-1 gap-4">
                   {activePath.modules?.map((module, index) => (
                     <div key={module.id} className={`group flex items-center gap-6 p-6 bg-white dark:bg-card-dark rounded-3xl border transition-all shadow-sm ${module.status === 'locked' ? 'opacity-60 grayscale border-border-dark' : 'hover:border-primary/50 border-slate-200 dark:border-border-dark'}`}>
                        <div className={`size-14 rounded-2xl bg-surface-dark border flex items-center justify-center shrink-0 ${module.status === 'completed' ? 'text-green-500' : module.type === 'practice' ? 'text-amber-500' : 'text-primary'}`}>
                           <span className="material-symbols-outlined">{module.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-3 mb-1">
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${module.type === 'practice' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                                {module.type === 'practice' ? 'Laboratorio' : 'Teoría'}
                              </span>
                              <span className="text-[10px] text-text-secondary font-bold">• Módulo {index + 1}</span>
                           </div>
                           <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{module.title}</h3>
                           <p className="text-sm text-slate-500 dark:text-text-secondary line-clamp-1">{module.description}</p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                           {module.status === 'completed' ? (
                             <div className="size-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center cursor-pointer" onClick={() => handleModuleClick(module)}><span className="material-symbols-outlined">check_circle</span></div>
                           ) : module.status === 'current' ? (
                             <button onClick={() => handleModuleClick(module)} className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20">Empezar</button>
                           ) : (
                             <div className="size-10 rounded-full bg-surface-dark text-slate-600 flex items-center justify-center"><span className="material-symbols-outlined">lock</span></div>
                           )}
                        </div>
                     </div>
                   ))}
                </div>
              </section>
           </main>

           <aside className="lg:w-80 space-y-8 shrink-0">
              <div className="p-8 bg-surface-dark rounded-3xl border border-border-dark space-y-6">
                 <h3 className="font-bold text-white uppercase text-xs tracking-widest text-text-secondary">Progreso de Ruta</h3>
                 <div className="relative size-40 mx-auto">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                       <path className="stroke-current text-border-dark" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                       <path className="stroke-current text-primary" strokeDasharray={`${activePath.progress}, 100`} strokeWidth="3" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-3xl font-black text-white">{activePath.progress}%</span>
                       <span className="text-[8px] font-black uppercase text-text-secondary">Completado</span>
                    </div>
                 </div>
              </div>
           </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background-light dark:bg-background-dark">
      <section className="relative h-80 flex items-center justify-center overflow-hidden bg-surface-dark">
         <img src="https://picsum.photos/seed/pathshero/1920/600" className="absolute inset-0 w-full h-full object-cover opacity-30" alt="Fondo" />
         <div className="relative z-10 text-center space-y-4 px-6">
            <h1 className="text-4xl md:text-6xl font-black text-white">Domina la <span className="text-primary">Ingeniería</span></h1>
            <p className="text-text-secondary max-w-xl mx-auto">Selecciona tu especialidad y comienza tu carrera técnica hoy mismo.</p>
         </div>
      </section>

      <div className="max-w-7xl mx-auto w-full px-6 py-12 flex flex-col lg:flex-row gap-12">
         <aside className="lg:w-64 space-y-8 shrink-0">
            <div className="space-y-4">
               <h3 className="font-bold text-white uppercase text-xs tracking-widest text-text-secondary">Nivel de Dificultad</h3>
               <div className="flex flex-col gap-2">
                  {['Principiante', 'Intermedio', 'Avanzado'].map(level => (
                    <button key={level} onClick={() => setSelectedLevel(selectedLevel === level ? null : level)} className={`flex items-center justify-between p-3 rounded-xl border transition-all text-sm font-bold ${selectedLevel === level ? 'bg-primary border-primary text-white' : 'bg-surface-dark border-border-dark text-text-secondary hover:border-primary/50'}`}>
                      {level} {selectedLevel === level && <span className="material-symbols-outlined text-sm">check</span>}
                    </button>
                  ))}
               </div>
            </div>
         </aside>

         <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
            {isLoading ? (
               Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-64 bg-card-dark rounded-3xl animate-pulse"></div>
               ))
            ) : (
               filteredPaths.map(path => (
                 <div key={path.id} onClick={() => setActivePathId(path.id)} className="group flex flex-col bg-white dark:bg-card-dark rounded-3xl overflow-hidden border border-slate-200 dark:border-border-dark hover:shadow-2xl transition-all duration-500 cursor-pointer">
                    <div className="h-60 overflow-hidden relative">
                       <img src={path.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={path.title} />
                       <div className="absolute top-4 right-4 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest">{path.level}</div>
                       {path.progress !== undefined && path.progress > 0 && (
                         <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/20">
                            <div className="h-full bg-primary" style={{ width: `${path.progress}%` }}></div>
                         </div>
                       )}
                    </div>
                    <div className="p-8 flex flex-col flex-1">
                       <h3 className="text-2xl font-black mb-3 text-slate-900 dark:text-white">{path.title}</h3>
                       <p className="text-slate-500 dark:text-text-secondary text-sm line-clamp-2">{path.description}</p>
                       <div className="mt-auto pt-6 flex justify-between items-center border-t border-border-dark/50">
                          <span className="text-sm font-bold">{path.modulesCount} Módulos</span>
                          <span className="material-symbols-outlined text-primary">arrow_forward</span>
                       </div>
                    </div>
                 </div>
               ))
            )}
         </main>
      </div>
    </div>
  );
};

export default Paths;
