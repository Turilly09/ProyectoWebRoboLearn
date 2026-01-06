
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLessonById, getNextLessonId } from '../content/registry';
import { User } from '../types';
import { LessonData, ContentBlock } from '../types/lessons';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

const LessonDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [quizOpen, setQuizOpen] = useState(false);
  
  const [userAnswers, setUserAnswers] = useState<{[key: number]: number}>({});
  const [allCorrect, setAllCorrect] = useState(false);
  
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para simuladores activos (para evitar scroll hijacking)
  const [activeSimulators, setActiveSimulators] = useState<{[key: number]: boolean}>({});

  useEffect(() => {
    const loadData = async () => {
      if (id) {
        setIsLoading(true);
        const [lessonData, nextId] = await Promise.all([
          getLessonById(id),
          getNextLessonId(id)
        ]);
        if (lessonData) setLesson(lessonData);
        setNextLessonId(nextId);
        setCurrentStep(0);
        setQuizOpen(false);
        setUserAnswers({});
        setAllCorrect(false);
        setIsLoading(false);
        window.scrollTo(0, 0);
      }
    };
    loadData();
  }, [id]);

  const saveProgress = () => {
    if (!id) return;
    const storedUser = localStorage.getItem('robo_user');
    if (storedUser) {
      const user: User = JSON.parse(storedUser);
      
      if (!user.completedLessons.includes(id)) {
        user.completedLessons.push(id);
        const xpGain = 200;
        user.xp += xpGain;
        
        const today = new Date().toISOString().split('T')[0];
        if (!user.activityLog) user.activityLog = [];
        
        const existingEntry = user.activityLog.find(log => log.date === today);
        if (existingEntry) {
          existingEntry.xpEarned += xpGain;
        } else {
          user.activityLog.push({ date: today, xpEarned: xpGain });
        }

        user.studyMinutes = (user.studyMinutes || 0) + 30;
        const newLevel = Math.floor(user.xp / 1000) + 1;
        if (newLevel > user.level) {
          user.level = newLevel;
        }
        
        localStorage.setItem('robo_user', JSON.stringify(user));
        window.dispatchEvent(new Event('authChange'));
      }
    }
  };

  const handleFinish = () => {
    saveProgress();
    navigate('/paths');
  };

  const handleNextLesson = () => {
    saveProgress();
    if (nextLessonId) {
      navigate(`/lesson/${nextLessonId}`);
    }
  };

  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    const newAnswers = { ...userAnswers, [questionIndex]: optionIndex };
    setUserAnswers(newAnswers);

    if (lesson?.quiz) {
        const isComplete = lesson.quiz.every((q, idx) => newAnswers[idx] === q.correctIndex);
        setAllCorrect(isComplete);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-background-dark flex items-center justify-center flex-col gap-4 text-white">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-text-secondary uppercase tracking-widest text-xs">Cargando Lección...</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 text-center bg-background-dark text-white">
        <span className="material-symbols-outlined text-6xl text-primary mb-4">construction</span>
        <h2 className="text-3xl font-black">Lección no encontrada</h2>
        <button onClick={() => navigate('/paths')} className="px-8 py-3 bg-primary text-white rounded-xl font-bold mt-4">Volver al Mapa de Rutas</button>
      </div>
    );
  }

  const handleNext = () => {
    if (currentStep < lesson.sections.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setQuizOpen(true);
    }
  };

  const currentSection = lesson.sections[currentStep];

  // Helper para detectar plataforma
  const getSimPlatform = (url: string) => {
    if (url.includes('falstad')) return { name: 'Falstad', icon: 'electrical_services' };
    if (url.includes('tinkercad')) return { name: 'Tinkercad', icon: '3d_rotation' };
    if (url.includes('wokwi')) return { name: 'Wokwi', icon: 'memory' };
    return { name: 'Simulador Externo', icon: 'science' };
  };

  // Helper para renderizar un bloque individual
  const renderBlock = (block: ContentBlock, idx: number) => {
    switch (block.type) {
        case 'text':
            return (
                <div key={idx} className="text-sm md:text-base text-slate-600 dark:text-text-secondary text-justify leading-relaxed">
                   <MarkdownRenderer content={block.content} />
                </div>
            );
        case 'image':
            return (
                <div key={idx} className="aspect-video w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-border-dark relative bg-black max-h-[500px]">
                   <img src={block.content} className="w-full h-full object-cover" alt="Visual" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
            );
        case 'video':
            return (
                <div key={idx} className="aspect-video w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-border-dark bg-black">
                   <iframe 
                       src={block.content} 
                       title="Lesson Video"
                       className="w-full h-full"
                       frameBorder="0"
                       allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                       allowFullScreen
                   ></iframe>
                </div>
            );
        case 'simulator':
            const platform = getSimPlatform(block.content);
            const isActive = activeSimulators[idx];

            return (
                <div key={idx} className="w-full rounded-3xl overflow-hidden shadow-2xl border-2 border-primary/30 bg-[#0b0f14] relative group">
                   <div className="bg-[#111a22] px-4 py-2 border-b border-white/5 flex justify-between items-center z-20 relative">
                      <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                         <span className="material-symbols-outlined text-sm">{platform.icon}</span> {platform.name}
                      </div>
                      <a href={block.content} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-white transition-colors" title="Abrir en ventana nueva">
                         <span className="material-symbols-outlined text-sm">open_in_new</span>
                      </a>
                   </div>
                   
                   <div className="h-[500px] w-full relative">
                      <iframe 
                          src={block.content} 
                          title="Circuit Simulator"
                          className="w-full h-full bg-white"
                          frameBorder="0"
                          allowFullScreen
                      ></iframe>
                      
                      {/* Overlay para evitar scroll trap hasta que se active */}
                      {!isActive && (
                          <div 
                            className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer transition-opacity z-10 hover:bg-black/50"
                            onClick={() => setActiveSimulators(prev => ({...prev, [idx]: true}))}
                          >
                             <span className="material-symbols-outlined text-4xl text-white mb-2">touch_app</span>
                             <p className="text-white font-bold text-sm">Haz clic para interactuar</p>
                          </div>
                      )}
                   </div>
                </div>
            );
        default:
            return null;
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col font-body">
      <header className="sticky top-0 z-40 bg-surface-dark border-b border-border-dark px-4 py-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/paths')} className="p-1.5 hover:bg-card-dark rounded-lg text-text-secondary transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
          <div className="hidden sm:block">
            <h1 className="text-white text-xs font-bold">{lesson.title}</h1>
            <p className="text-text-secondary text-[9px] uppercase font-black tracking-widest">{lesson.subtitle}</p>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-8">
          <div className="h-1.5 bg-border-dark rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500" 
              style={{ width: `${((currentStep + 1) / lesson.sections.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <button className="bg-primary/20 text-primary p-1.5 rounded-lg hover:bg-primary/30 transition-colors">
              <span className="material-symbols-outlined text-lg">smart_toy</span>
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="hidden lg:flex w-64 border-r border-border-dark flex-col p-6 space-y-6 overflow-y-auto shrink-0 bg-surface-dark/30">
           <div className="space-y-3">
              <h3 className="text-[9px] font-black uppercase text-text-secondary tracking-widest">Temario</h3>
              <div className="space-y-1.5">
                 {lesson.sections.map((sec, i) => (
                   <button 
                     key={i}
                     onClick={() => { setCurrentStep(i); setQuizOpen(false); }}
                     className={`w-full text-left p-3 rounded-xl border transition-all ${!quizOpen && currentStep === i ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-dark border-border-dark text-text-secondary hover:border-primary/30'}`}
                   >
                     <p className="text-[11px] font-bold line-clamp-1">{sec.title}</p>
                   </button>
                 ))}
                 <button 
                   onClick={() => setQuizOpen(true)}
                   className={`w-full text-left p-3 rounded-xl border transition-all ${quizOpen ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/5' : 'bg-surface-dark border-border-dark text-text-secondary hover:border-primary/30'}`}
                 >
                    <p className="text-[11px] font-bold">Autoevaluación</p>
                 </button>
              </div>
           </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 md:p-10">
           {!quizOpen ? (
             <article className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <header className="space-y-3">
                   <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight">
                      {currentSection.title}
                   </h2>
                </header>

                {/* DYNAMIC CONTENT BLOCKS */}
                <div className="space-y-8">
                    {currentSection.blocks && currentSection.blocks.length > 0 ? (
                        currentSection.blocks.map((block, idx) => renderBlock(block, idx))
                    ) : (
                        // Fallback para lecciones antiguas que no tengan blocks (migración suave)
                        <>
                           <div className="aspect-video w-full rounded-3xl overflow-hidden relative bg-black">
                               <img src={(currentSection as any).image} className="w-full h-full object-cover" alt="Visual" />
                           </div>
                           <div className="text-sm md:text-base text-slate-600 dark:text-text-secondary text-justify">
                               <MarkdownRenderer content={(currentSection as any).content} />
                           </div>
                        </>
                    )}
                </div>

                <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/20 flex gap-4 items-start">
                   <div className="p-2 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 shrink-0">
                      <span className="material-symbols-outlined text-lg">analytics</span>
                   </div>
                   <div>
                      <h4 className="text-blue-500 font-black text-[10px] uppercase tracking-widest mb-1">Nota Técnica</h4>
                      <p className="text-xs text-slate-500 dark:text-text-secondary leading-relaxed">{currentSection.fact}</p>
                   </div>
                </div>

                <div className="pt-8 flex justify-end">
                   <button onClick={handleNext} className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-xl shadow-primary/20 flex items-center gap-2 hover:scale-105 transition-transform uppercase tracking-wider">
                     {currentStep === lesson.sections.length - 1 ? "Completar Lectura" : "Siguiente Paso"}
                     <span className="material-symbols-outlined text-lg">arrow_forward</span>
                   </button>
                </div>
             </article>
           ) : (
             <div className="max-w-4xl mx-auto py-8 space-y-8 animate-in zoom-in-95 duration-500">
                <div className="text-center space-y-2">
                   <h2 className="text-3xl font-black text-white">Validación de Conocimientos</h2>
                   <p className="text-text-secondary text-sm">Responde correctamente a todas las preguntas para aprobar.</p>
                </div>

                {lesson.quiz && lesson.quiz.map((q, qIndex) => (
                    <div key={qIndex} className="p-6 bg-card-dark rounded-3xl border border-border-dark space-y-4 shadow-xl relative">
                        <div className="absolute -left-3 -top-3 size-8 bg-primary text-white rounded-full flex items-center justify-center font-black text-xs border-4 border-background-dark">
                            {qIndex + 1}
                        </div>
                        <h3 className="text-lg font-bold text-white pl-3">{q.question}</h3>
                        <div className="space-y-2">
                            {q.options.map((opt, i) => {
                                const isSelected = userAnswers[qIndex] === i;
                                return (
                                    <button 
                                        key={opt}
                                        onClick={() => handleAnswerSelect(qIndex, i)}
                                        className={`w-full p-4 rounded-xl border text-left text-sm font-bold transition-all flex justify-between items-center ${
                                            isSelected 
                                                ? 'bg-primary border-primary text-white shadow-lg' 
                                                : 'bg-surface-dark border-border-dark text-text-secondary hover:border-primary/50'
                                        }`}
                                    >
                                        <span>{opt}</span>
                                        {isSelected && <span className="material-symbols-outlined text-sm">radio_button_checked</span>}
                                    </button>
                                );
                            })}
                        </div>
                        {userAnswers[qIndex] !== undefined && userAnswers[qIndex] !== q.correctIndex && (
                             <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold animate-in fade-in flex items-center gap-2">
                                <span className="material-symbols-outlined text-base">error</span>
                                <span>Respuesta incorrecta. {q.hint}</span>
                             </div>
                        )}
                         {userAnswers[qIndex] !== undefined && userAnswers[qIndex] === q.correctIndex && (
                             <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-xs font-bold animate-in fade-in flex items-center gap-2">
                                <span className="material-symbols-outlined text-base">check_circle</span>
                                <span>¡Correcto!</span>
                             </div>
                        )}
                    </div>
                ))}

                <div className="sticky bottom-6 bg-surface-dark/95 backdrop-blur-md p-4 rounded-2xl border border-border-dark shadow-2xl flex justify-between items-center">
                    <div className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                        {Object.keys(userAnswers).length} / {lesson.quiz.length} respondidas
                    </div>
                    
                    {allCorrect ? (
                         <div className="flex gap-3">
                            <button onClick={handleFinish} className="px-6 py-2.5 bg-green-500 text-white rounded-lg text-xs font-black uppercase hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20 animate-bounce">
                                ¡Finalizar Módulo!
                            </button>
                            {nextLessonId && (
                                <button onClick={handleNextLesson} className="px-5 py-2.5 bg-white/10 text-white rounded-lg text-xs font-black uppercase border border-white/20 hover:bg-white/20 transition-colors">
                                Siguiente
                                </button>
                            )}
                        </div>
                    ) : (
                        <button disabled className="px-6 py-2.5 bg-slate-700 text-slate-400 rounded-lg text-xs font-black uppercase cursor-not-allowed border border-slate-600">
                            Completa para avanzar
                        </button>
                    )}
                </div>
             </div>
           )}
        </main>
      </div>
    </div>
  );
};

export default LessonDetail;
