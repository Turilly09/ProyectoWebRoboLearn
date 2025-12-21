
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAllPaths } from '../content/pathRegistry';
import { Project, User } from '../types';

const WorkshopDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'steps' | 'materials'>('steps');
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      setIsLoading(true);
      const paths = await getAllPaths();
      let found: Project | undefined;
      
      for (const p of paths) {
        if (p.finalWorkshop && p.finalWorkshop.id === id) {
          found = p.finalWorkshop;
          break;
        }
      }
      setProject(found || null);
      setIsLoading(false);
    };
    loadProject();
  }, [id]);

  const toggleStep = (index: number) => {
    if (completedSteps.includes(index)) {
      setCompletedSteps(prev => prev.filter(i => i !== index));
    } else {
      setCompletedSteps(prev => [...prev, index]);
    }
  };

  const handleCompleteWorkshop = () => {
    const storedUser = localStorage.getItem('robo_user');
    if (storedUser && project) {
      const user: User = JSON.parse(storedUser);
      if (!user.completedWorkshops.includes(project.id)) {
        user.completedWorkshops.push(project.id);
        user.xp += 500; // Gran recompensa por workshop
        // Añadir al log
        const today = new Date().toISOString().split('T')[0];
        if (!user.activityLog) user.activityLog = [];
        const log = user.activityLog.find(l => l.date === today);
        if (log) log.xpEarned += 500;
        else user.activityLog.push({ date: today, xpEarned: 500 });

        localStorage.setItem('robo_user', JSON.stringify(user));
        window.dispatchEvent(new Event('authChange'));
      }
      navigate('/portfolio');
    }
  };

  if (isLoading) return <div className="h-screen bg-background-dark flex items-center justify-center text-white font-black animate-pulse">CARGANDO TALLER...</div>;
  
  if (!project) return (
     <div className="h-screen bg-background-dark flex flex-col items-center justify-center text-white gap-4">
        <h1 className="text-4xl font-black">Proyecto No Encontrado</h1>
        <button onClick={() => navigate('/paths')} className="px-6 py-2 bg-primary rounded-xl font-bold">Volver</button>
     </div>
  );

  const progress = project.steps ? Math.round((completedSteps.length / project.steps.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0f1115] text-white flex flex-col font-display">
       {/* HEADER COMPACTO */}
       <header className="h-16 border-b border-white/5 bg-[#14161a] flex items-center justify-between px-6 sticky top-0 z-50">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate('/paths')} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">arrow_back</span>
             </button>
             <div>
                <h1 className="text-sm font-bold text-white">{project.title}</h1>
                <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Workshop de Certificación</p>
             </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase text-slate-500">Progreso de Montaje</span>
                <div className="w-32 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                   <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
             </div>
             {progress === 100 ? (
               <button onClick={handleCompleteWorkshop} className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase rounded-lg shadow-lg shadow-amber-500/20 animate-pulse">
                  Certificar Proyecto
               </button>
             ) : (
               <div className="px-4 py-2 bg-white/5 text-slate-500 font-bold text-xs uppercase rounded-lg border border-white/5">
                  En Progreso
               </div>
             )}
          </div>
       </header>

       <div className="flex-1 flex overflow-hidden">
          {/* COLUMNA IZQUIERDA: VIDEO Y RECURSOS */}
          <div className="w-full lg:w-2/3 flex flex-col border-r border-white/5 overflow-y-auto">
             {/* VIDEO PLAYER AREA */}
             <div className="aspect-video bg-black relative shadow-2xl shrink-0">
                {project.videoUrl ? (
                   <iframe 
                     width="100%" 
                     height="100%" 
                     src={project.videoUrl} 
                     title="Workshop Video" 
                     frameBorder="0" 
                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                     allowFullScreen
                   ></iframe>
                ) : (
                   <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                      <span className="material-symbols-outlined text-6xl text-white/20">play_circle_off</span>
                      <p className="text-white/30 font-bold">Video no disponible</p>
                   </div>
                )}
             </div>

             {/* TABS CONTROLS */}
             <div className="flex border-b border-white/5 bg-[#14161a]">
                <button 
                  onClick={() => setActiveTab('steps')}
                  className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'steps' ? 'text-amber-500 border-b-2 border-amber-500 bg-amber-500/5' : 'text-slate-500 hover:text-white'}`}
                >
                   Instrucciones
                </button>
                <button 
                  onClick={() => setActiveTab('materials')}
                  className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'materials' ? 'text-amber-500 border-b-2 border-amber-500 bg-amber-500/5' : 'text-slate-500 hover:text-white'}`}
                >
                   Lista de Materiales (BOM)
                </button>
             </div>

             {/* CONTENT AREA */}
             <div className="p-8">
                {activeTab === 'steps' ? (
                   <div className="space-y-12 max-w-3xl mx-auto">
                      <div className="space-y-4">
                         <h2 className="text-2xl font-black text-white">Guía de Construcción</h2>
                         <p className="text-slate-400 leading-relaxed">{project.description}</p>
                      </div>
                      
                      <div className="space-y-8">
                         {project.steps?.map((step, idx) => (
                           <div key={idx} className={`flex gap-6 p-6 rounded-2xl border transition-all ${completedSteps.includes(idx) ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-white/5'}`}>
                              <div className="shrink-0 flex flex-col items-center gap-2">
                                 <div className={`size-8 rounded-full flex items-center justify-center text-xs font-black border ${completedSteps.includes(idx) ? 'bg-green-500 text-black border-green-500' : 'bg-transparent text-slate-500 border-slate-700'}`}>
                                    {completedSteps.includes(idx) ? <span className="material-symbols-outlined text-sm">check</span> : idx + 1}
                                 </div>
                                 {idx < (project.steps?.length || 0) - 1 && <div className={`w-0.5 flex-1 ${completedSteps.includes(idx) ? 'bg-green-500/30' : 'bg-white/10'}`}></div>}
                              </div>
                              <div className="space-y-4 flex-1">
                                 <h3 className={`text-lg font-bold ${completedSteps.includes(idx) ? 'text-green-500' : 'text-white'}`}>{step.title}</h3>
                                 <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
                                 {step.image && (
                                    <div className="rounded-xl overflow-hidden border border-white/10">
                                       <img src={step.image} className="w-full object-cover" alt={step.title} />
                                    </div>
                                 )}
                                 <button 
                                   onClick={() => toggleStep(idx)}
                                   className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${completedSteps.includes(idx) ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-amber-500 text-black hover:bg-amber-400'}`}
                                 >
                                    {completedSteps.includes(idx) ? 'Marcar como pendiente' : 'Completar Paso'}
                                 </button>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                ) : (
                   <div className="max-w-2xl mx-auto space-y-8">
                      <h2 className="text-2xl font-black text-white">Requisitos del Proyecto</h2>
                      <div className="bg-[#1a1d24] rounded-2xl border border-white/10 overflow-hidden">
                         {project.requirements?.map((req, i) => (
                           <div key={i} className="flex items-center gap-4 p-4 border-b border-white/5 last:border-0 hover:bg-white/5">
                              <span className="material-symbols-outlined text-amber-500">check_box_outline_blank</span>
                              <span className="text-slate-300 font-medium">{req}</span>
                           </div>
                         ))}
                      </div>
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-4">
                         <span className="material-symbols-outlined text-blue-400">info</span>
                         <p className="text-xs text-blue-200 leading-relaxed">
                            Asegúrate de tener todos los componentes antes de comenzar. Puedes adquirir el kit completo en la <button onClick={() => navigate('/store')} className="underline font-bold hover:text-white">Tienda</button>.
                         </p>
                      </div>
                   </div>
                )}
             </div>
          </div>

          {/* COLUMNA DERECHA: NOTAS / IDE (SIMPLIFICADO) */}
          <div className="hidden lg:flex w-1/3 bg-[#0f1115] flex-col">
             <div className="p-6 border-b border-white/5">
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">Cuaderno de Ingeniería</h3>
             </div>
             <div className="flex-1 p-6">
                <textarea 
                  className="w-full h-full bg-[#14161a] rounded-xl border border-white/5 p-4 text-sm text-slate-300 focus:border-amber-500/50 outline-none resize-none font-mono"
                  placeholder="Toma notas sobre tus mediciones, errores encontrados o ideas de mejora aquí..."
                ></textarea>
             </div>
          </div>
       </div>
    </div>
  );
};

export default WorkshopDetail;