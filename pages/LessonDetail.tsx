
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLessonById, getNextLessonId } from '../content/registry';
import { User } from '../types';
import { LessonData } from '../types/lessons';

const LessonDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizAnswered, setQuizAnswered] = useState<number | null>(null);
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        setQuizAnswered(null);
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

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
      <header className="sticky top-0 z-40 bg-surface-dark border-b border-border-dark px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/paths')} className="p-2 hover:bg-card-dark rounded-xl text-text-secondary transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
          <div className="hidden sm:block">
            <h1 className="text-white text-sm font-bold">{lesson.title}</h1>
            <p className="text-text-secondary text-[10px] uppercase font-black tracking-widest">{lesson.subtitle}</p>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-8">
          <div className="h-2 bg-border-dark rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500" 
              style={{ width: `${((currentStep + 1) / lesson.sections.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <button className="bg-primary/20 text-primary p-2 rounded-xl hover:bg-primary/30 transition-colors">
              <span className="material-symbols-outlined text-sm">smart_toy</span>
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="hidden lg:flex w-72 border-r border-border-dark flex-col p-8 space-y-8 overflow-y-auto shrink-0">
           <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-text-secondary tracking-widest">Temario</h3>
              <div className="space-y-2">
                 {lesson.sections.map((sec, i) => (
                   <button 
                     key={i}
                     onClick={() => { setCurrentStep(i); setQuizOpen(false); }}
                     className={`w-full text-left p-4 rounded-2xl border transition-all ${!quizOpen && currentStep === i ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-dark border-border-dark text-text-secondary hover:border-primary/30'}`}
                   >
                     <p className="text-xs font-bold line-clamp-1">{sec.title}</p>
                   </button>
                 ))}
                 <button 
                   onClick={() => setQuizOpen(true)}
                   className={`w-full text-left p-4 rounded-2xl border transition-all ${quizOpen ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/5' : 'bg-surface-dark border-border-dark text-text-secondary hover:border-primary/30'}`}
                 >
                    <p className="text-xs font-bold">Autoevaluación</p>
                 </button>
              </div>
           </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-20">
           {!quizOpen ? (
             <article className="max-w-3xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-500">
                <header className="space-y-4">
                   <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight">
                      {currentSection.title}
                   </h2>
                </header>

                <div className="aspect-video w-full rounded-[40px] overflow-hidden shadow-2xl border border-slate-200 dark:border-border-dark relative bg-black">
                   {currentSection.video ? (
                     <iframe 
                       src={currentSection.video} 
                       title="Lesson Video"
                       className="w-full h-full"
                       frameBorder="0"
                       allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                       allowFullScreen
                     ></iframe>
                   ) : (
                     <>
                       <img src={currentSection.image} className="w-full h-full object-cover" alt="Visual" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                     </>
                   )}
                </div>

                <div className="space-y-6">
                  <p className="text-lg md:text-xl text-slate-600 dark:text-text-secondary leading-relaxed font-medium italic border-l-4 border-primary pl-6 text-justify [hyphens:auto]">
                    {currentSection.content}
                  </p>
                </div>

                <div className="p-8 bg-blue-500/5 rounded-3xl border border-blue-500/20 flex gap-6 items-start">
                   <div className="p-3 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                      <span className="material-symbols-outlined">analytics</span>
                   </div>
                   <div>
                      <h4 className="text-blue-500 font-black text-xs uppercase tracking-widest mb-1">Nota Técnica</h4>
                      <p className="text-sm text-slate-500 dark:text-text-secondary">{currentSection.fact}</p>
                   </div>
                </div>

                <div className="pt-10 flex justify-end">
                   <button onClick={handleNext} className="px-10 py-4 bg-primary text-white rounded-2xl font-bold shadow-2xl shadow-primary/30 flex items-center gap-3 hover:scale-105 transition-transform">
                     {currentStep === lesson.sections.length - 1 ? "Completar Lectura" : "Siguiente Paso"}
                     <span className="material-symbols-outlined">arrow_forward</span>
                   </button>
                </div>
             </article>
           ) : (
             <div className="max-w-2xl mx-auto py-12 space-y-10 animate-in zoom-in-95 duration-500">
                <div className="text-center space-y-4">
                   <h2 className="text-4xl font-black text-white">Validación de Módulo</h2>
                   <p className="text-text-secondary">Confirma que has asimilado los conceptos.</p>
                </div>

                <div className="p-10 bg-card-dark rounded-[40px] border border-border-dark space-y-8 shadow-2xl">
                   <h3 className="text-xl font-bold text-white">{lesson.quiz.question}</h3>
                   <div className="space-y-4">
                      {lesson.quiz.options.map((opt, i) => (
                        <button 
                          key={opt}
                          onClick={() => setQuizAnswered(i)}
                          className={`w-full p-6 rounded-2xl border text-left font-bold transition-all ${quizAnswered === i ? 'bg-primary border-primary text-white' : 'bg-surface-dark border-border-dark text-text-secondary hover:border-primary/50'}`}
                        >
                          {opt}
                        </button>
                      ))}
                   </div>

                   {quizAnswered !== null && quizAnswered === lesson.quiz.correctIndex && (
                     <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 animate-in fade-in">
                        <div className="flex items-center gap-4 mb-4">
                           <span className="material-symbols-outlined text-3xl">workspace_premium</span>
                           <p className="font-bold text-lg">¡Módulo Superado! Has ganado 200 XP.</p>
                        </div>
                        <div className="flex gap-4">
                           <button onClick={handleFinish} className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20">
                             Finalizar
                           </button>
                           {nextLessonId && (
                             <button onClick={handleNextLesson} className="flex-1 py-3 bg-white/10 text-white rounded-xl font-bold border border-white/20 hover:bg-white/20 transition-colors">
                               Siguiente Lección
                             </button>
                           )}
                        </div>
                     </div>
                   )}
                   
                   {quizAnswered !== null && quizAnswered !== lesson.quiz.correctIndex && (
                     <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-bold animate-shake">
                        Esa no es la respuesta correcta. Revisa el material e inténtalo de nuevo.
                     </div>
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