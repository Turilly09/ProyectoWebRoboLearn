
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAllPaths } from '../content/pathRegistry';
import { getNotebook, saveNotebook } from '../content/notebookRegistry';
import { Project, User } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { evaluateBadges } from '../services/badgeService'; // Importar servicio

const WorkshopDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'steps' | 'materials'>('steps');
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para el Cuaderno
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Obtener usuario actual
  const getUser = (): User | null => {
    const stored = localStorage.getItem('robo_user');
    return stored ? JSON.parse(stored) : null;
  };

  useEffect(() => {
    const loadProjectAndNotes = async () => {
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

      const user = getUser();
      if (user && found) {
        const savedNotes = await getNotebook(user.id, found.id);
        setNotes(savedNotes);
      }
      
      setIsLoading(false);
    };
    loadProjectAndNotes();
  }, [id]);

  // Lógica de Auto-Guardado
  useEffect(() => {
    const user = getUser();
    if (!user || !project || !id) return;

    const timeoutId = setTimeout(async () => {
      setIsSavingNotes(true);
      try {
        await saveNotebook(user.id, id, notes);
        setLastSaved(new Date());
      } catch (e) {
        console.error("Error guardando notas", e);
      } finally {
        setIsSavingNotes(false);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [notes, id, project]);

  const toggleStep = (index: number) => {
    if (completedSteps.includes(index)) {
      setCompletedSteps(prev => prev.filter(i => i !== index));
    } else {
      setCompletedSteps(prev => [...prev, index]);
    }
  };

  const handleCompleteWorkshop = async () => {
    let user = getUser();
    if (user && project) {
      if (!user.completedWorkshops.includes(project.id)) {
        user.completedWorkshops.push(project.id);
        user.xp += 500; 
        const today = new Date().toISOString().split('T')[0];
        if (!user.activityLog) user.activityLog = [];
        
        const log = user.activityLog.find(l => l.date === today);
        if (log) {
            const currentXp = (log as any).xpEarned || (log as any).xp_earned || 0;
            log.xpEarned = currentXp + 500;
            if ((log as any).xp_earned) delete (log as any).xp_earned;
        } else {
            user.activityLog.push({ date: today, xpEarned: 500 });
        }

        const newLevel = Math.floor(user.xp / 1000) + 1;
        if (newLevel > user.level) {
          user.level = newLevel;
        }

        // --- EVALUAR LOGROS (BADGES) ---
        user = evaluateBadges(user, { actionType: 'workshop_complete' });

        // Guardar
        localStorage.setItem('robo_user', JSON.stringify(user));
        window.dispatchEvent(new Event('authChange'));

        if (isSupabaseConfigured && supabase) {
            try {
                await supabase.from('profiles').update({
                    xp: user.xp,
                    level: user.level,
                    completed_workshops: user.completedWorkshops,
                    activity_log: user.activityLog,
                    badges: user.badges
                }).eq('id', user.id);
            } catch (e) {
                console.error("Error updating DB:", e);
            }
        }
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
                   <iframe width="100%" height="100%" src={project.videoUrl} title="Workshop Video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                ) : (
                   <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                      <span className="material-symbols-outlined text-6xl text-white/20">play_circle_off</span>
                      <p className="text-white/30 font-bold">Video no disponible</p>
                   </div>
                )}
             </div>

             {/* TABS */}
             <div className="flex border-b border-white/5 bg-[#14161a]">
                <button onClick={() => setActiveTab('steps')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'steps' ? 'text-amber-500 border-b-2 border-amber-500 bg-amber-500/5' : 'text-slate-500 hover:text-white'}`}>Instrucciones</button>
                <button onClick={() => setActiveTab('materials')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'materials' ? 'text-amber-500 border-b-2 border-amber-500 bg-amber-500/5' : 'text-slate-500 hover:text-white'}`}>Lista de Materiales (BOM)</button>
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
                                 <button onClick={() => toggleStep(idx)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${completedSteps.includes(idx) ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-amber-500 text-black hover:bg-amber-400'}`}>
                                    {completedSteps.includes(idx) ? 'Marcar como pendiente' : 'Completar Paso'}
                                 </button>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                ) : (
                   <div className="max-w-2xl mx-auto space-y-8">
                      <div className="flex items-center justify-between">
                          <h2 className="text-2xl font-black text-white">Requisitos del Proyecto</h2>
                          <a href={project.kitUrl || '/#/store'} target={project.kitUrl ? "_blank" : "_self"} rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold uppercase text-xs shadow-lg shadow-green-600/20 transition-all animate-bounce">
                              <span className="material-symbols-outlined text-lg">shopping_cart</span>
                              Comprar Kit Completo
                          </a>
                      </div>
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
                         <p className="text-xs text-blue-200 leading-relaxed">Asegúrate de tener todos los componentes antes de comenzar. Puedes adquirir el kit completo en el botón de arriba o visitar nuestra <button onClick={() => navigate('/store')} className="underline font-bold hover:text-white">Tienda General</button>.</p>
                      </div>
                   </div>
                )}
             </div>
          </div>

          {/* COLUMNA DERECHA: CUADERNO */}
          <div className="hidden lg:flex w-1/3 bg-[#0f1115] flex-col border-l border-white/5">
             <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#14161a]">
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2"><span className="material-symbols-outlined text-sm">edit_note</span> Cuaderno de Ingeniería</h3>
                <div className="flex items-center gap-2">
                  {isSavingNotes ? <span className="text-[10px] font-bold text-amber-500 animate-pulse">Guardando...</span> : lastSaved ? <span className="text-[10px] font-bold text-green-500">Guardado {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span> : null}
                </div>
             </div>
             <div className="flex-1 p-0 relative group">
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full h-full bg-[#0f1115] p-6 text-sm text-slate-300 focus:text-white outline-none resize-none font-mono leading-relaxed" placeholder="Utiliza este espacio para documentar tus hallazgos..."></textarea>
                <div className="absolute bottom-4 right-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="px-2 py-1 bg-white/10 rounded text-[9px] text-white/50">Markdown soportado</span>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default WorkshopDetail;
