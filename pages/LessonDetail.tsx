
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLessonById, getNextLessonId } from '../content/registry';
import { User } from '../types';
import { LessonData, ContentBlock } from '../types/lessons';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { showToast } from '../components/ToastNotification';
import { evaluateBadges } from '../services/badgeService';

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

  // UX States
  const [activeSimulators, setActiveSimulators] = useState<{[key: number]: boolean}>({});
  const [theaterMode, setTheaterMode] = useState<number | null>(null); // Index of simulator in theater mode
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

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
        setChallengeCompleted(false);
        cancelSpeech(); // Stop talking if changing lesson
        setIsLoading(false);
        window.scrollTo(0, 0);
      }
    };
    loadData();
    return () => cancelSpeech();
  }, [id]);

  // Reset challenge state when step changes
  useEffect(() => {
    setChallengeCompleted(false);
    cancelSpeech();
  }, [currentStep]);

  // --- TEXT TO SPEECH ENGINE ---
  const toggleSpeech = () => {
    if (isSpeaking) {
      cancelSpeech();
    } else {
      startSpeech();
    }
  };

  const cancelSpeech = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const startSpeech = () => {
    if (!lesson) return;
    const section = lesson.sections[currentStep];
    
    // Construct text from title + blocks
    let textToRead = `${section.title}. `;
    section.blocks.forEach(b => {
        if (b.type === 'text') {
            // Remove markdown symbols for cleaner speech
            const cleanText = b.content.replace(/[*_#`]/g, '');
            textToRead += cleanText + " ";
        }
    });

    if (section.fact) textToRead += `Nota técnica: ${section.fact}. `;
    if (section.interaction) textToRead += `Desafío: ${section.interaction}. `;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    
    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const saveProgress = async () => {
    if (!id) return;
    const storedUser = localStorage.getItem('robo_user');
    if (storedUser) {
      let user: User = JSON.parse(storedUser);
      
      if (!user.completedLessons.includes(id)) {
        user.completedLessons.push(id);
        const xpGain = 200;
        user.xp += xpGain;
        
        showToast(`+${xpGain} XP Ganada!`, 'xp');

        const today = new Date().toISOString().split('T')[0];
        if (!user.activityLog) user.activityLog = [];
        
        const existingEntry = user.activityLog.find(log => log.date === today);
        if (existingEntry) {
          const currentXp = (existingEntry as any).xpEarned || (existingEntry as any).xp_earned || 0;
          existingEntry.xpEarned = currentXp + xpGain;
          if ((existingEntry as any).xp_earned) delete (existingEntry as any).xp_earned;
        } else {
          user.activityLog.push({ date: today, xpEarned: xpGain });
        }

        user.studyMinutes = (user.studyMinutes || 0) + 30;
        const newLevel = Math.floor(user.xp / 1000) + 1;
        if (newLevel > user.level) {
          user.level = newLevel;
          setTimeout(() => showToast(`¡Nivel ${newLevel} Alcanzado!`, 'success'), 1000);
        }

        // --- EVALUAR LOGROS (BADGES) ---
        user = evaluateBadges(user, { actionType: 'lesson_complete' });
        
        // Guardar
        localStorage.setItem('robo_user', JSON.stringify(user));
        window.dispatchEvent(new Event('authChange'));

        if (isSupabaseConfigured && supabase) {
            try {
                await supabase.from('profiles').update({
                    xp: user.xp,
                    level: user.level,
                    completed_lessons: user.completedLessons,
                    activity_log: user.activityLog,
                    study_minutes: user.studyMinutes,
                    badges: user.badges
                }).eq('id', user.id);
            } catch (e) {
                console.error("Error DB sync:", e);
            }
        }
      } else {
          showToast("Repaso completado (Sin XP extra)", 'info');
      }
    }
  };

  const handleFinish = async () => {
    await saveProgress();
    navigate('/paths');
  };

  const handleNextLesson = async () => {
    await saveProgress();
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
        if(isComplete) showToast("¡Evaluación perfecta!", 'success');
    }
  };

  const handleCompleteChallenge = () => {
      if (!challengeCompleted) {
          setChallengeCompleted(true);
          showToast("¡Micro-Desafío Completado!", "success");
          // Play subtle sound? (Future improvement)
      }
  };

  if (isLoading) return <div className="h-screen bg-background-dark flex items-center justify-center text-white">Cargando Lección...</div>;
  if (!lesson) return <div>No encontrada</div>;

  const handleNext = () => {
    if (currentStep < lesson.sections.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setQuizOpen(true);
    }
  };

  const currentSection = lesson.sections[currentStep];

  const getSimPlatform = (url: string) => {
    if (url.includes('falstad')) return { name: 'Falstad', icon: 'electrical_services' };
    if (url.includes('tinkercad')) return { name: 'Tinkercad', icon: '3d_rotation' };
    if (url.includes('wokwi')) return { name: 'Wokwi', icon: 'memory' };
    return { name: 'Simulador Externo', icon: 'science' };
  };

  const renderBlock = (block: ContentBlock, idx: number) => {
    switch (block.type) {
        case 'text':
            return (
                <div key={idx} className="text-sm md:text-lg text-slate-600 dark:text-slate-300 text-justify leading-relaxed font-body">
                   <MarkdownRenderer content={block.content} />
                </div>
            );
        case 'image':
            return (
                <div key={idx} className="aspect-video w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-border-dark relative bg-black max-h-[500px] group cursor-zoom-in">
                   <img src={block.content} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Visual" />
                   <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      Click para ampliar
                   </div>
                </div>
            );
        case 'video':
            return (
                <div key={idx} className="aspect-video w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-border-dark bg-black">
                   <iframe src={block.content} className="w-full h-full" frameBorder="0" allowFullScreen></iframe>
                </div>
            );
        case 'simulator':
            const platform = getSimPlatform(block.content);
            const isActive = activeSimulators[idx];
            return (
                <div key={idx} className="w-full rounded-3xl overflow-hidden shadow-2xl border-2 border-primary/30 bg-[#0b0f14] relative group">
                   <div className="bg-[#111a22] px-4 py-3 border-b border-white/5 flex justify-between items-center z-20 relative">
                      <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                         <span className="material-symbols-outlined text-sm">{platform.icon}</span> {platform.name}
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setTheaterMode(idx)}
                            className="text-text-secondary hover:text-white transition-colors flex items-center gap-1 px-2 py-1 hover:bg-white/10 rounded-lg" 
                            title="Modo Teatro"
                        >
                            <span className="material-symbols-outlined text-sm">fullscreen</span>
                            <span className="text-[10px] font-bold uppercase hidden sm:block">Expandir</span>
                        </button>
                      </div>
                   </div>
                   <div className="aspect-video w-full relative">
                      <iframe src={block.content} className="w-full h-full bg-white" frameBorder="0" allowFullScreen></iframe>
                      {!isActive && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer transition-opacity z-10 hover:bg-black/50" onClick={() => setActiveSimulators(prev => ({...prev, [idx]: true}))}>
                             <span className="material-symbols-outlined text-4xl text-white mb-2">touch_app</span>
                             <p className="text-white font-bold text-sm">Haz clic para interactuar</p>
                          </div>
                      )}
                   </div>
                </div>
            );
        default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col font-body">
      {/* THEATER MODE OVERLAY */}
      {theaterMode !== null && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
              <div className="flex justify-between items-center p-4 text-white">
                  <h3 className="font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">science</span> Modo Laboratorio
                  </h3>
                  <button onClick={() => setTheaterMode(null)} className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-xs font-bold uppercase">
                      <span className="material-symbols-outlined text-sm">close_fullscreen</span> Salir
                  </button>
              </div>
              <div className="flex-1 p-4 pb-8">
                  <iframe 
                    src={currentSection.blocks[theaterMode].content} 
                    className="w-full h-full rounded-2xl bg-white shadow-2xl border border-white/10" 
                    frameBorder="0" 
                    allowFullScreen
                  ></iframe>
              </div>
          </div>
      )}

      <header className="sticky top-0 z-40 bg-surface-dark border-b border-border-dark px-4 py-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/paths')} className="p-1.5 hover:bg-card-dark rounded-lg text-text-secondary transition-colors"><span className="material-symbols-outlined text-lg">close</span></button>
          <div className="hidden sm:block">
            <h1 className="text-white text-xs font-bold">{lesson.title}</h1>
            <p className="text-text-secondary text-[9px] uppercase font-black tracking-widest">{lesson.subtitle}</p>
          </div>
        </div>
        <div className="flex-1 max-w-md mx-8">
          <div className="h-1.5 bg-border-dark rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${((currentStep + 1) / lesson.sections.length) * 100}%` }}></div>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={toggleSpeech} 
             className={`p-1.5 rounded-lg transition-all flex items-center gap-2 ${isSpeaking ? 'bg-primary text-white animate-pulse' : 'bg-surface-dark text-text-secondary hover:text-white'}`}
             title={isSpeaking ? "Detener lectura" : "Escuchar lección"}
           >
             <span className="material-symbols-outlined text-lg">{isSpeaking ? 'stop_circle' : 'text_to_speech'}</span>
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="hidden lg:flex w-64 border-r border-border-dark flex-col p-6 space-y-6 overflow-y-auto shrink-0 bg-surface-dark/30">
           <div className="space-y-3">
              <h3 className="text-[9px] font-black uppercase text-text-secondary tracking-widest">Temario</h3>
              <div className="space-y-1.5">
                 {lesson.sections.map((sec, i) => (
                   <button key={i} onClick={() => { setCurrentStep(i); setQuizOpen(false); }} className={`w-full text-left p-3 rounded-xl border transition-all ${!quizOpen && currentStep === i ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-dark border-border-dark text-text-secondary hover:border-primary/30'}`}>
                     <p className="text-[11px] font-bold line-clamp-1">{sec.title}</p>
                   </button>
                 ))}
                 <button onClick={() => setQuizOpen(true)} className={`w-full text-left p-3 rounded-xl border transition-all ${quizOpen ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/5' : 'bg-surface-dark border-border-dark text-text-secondary hover:border-primary/30'}`}>
                    <p className="text-[11px] font-bold">Autoevaluación</p>
                 </button>
              </div>
           </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 md:p-10">
           {!quizOpen ? (
             <article className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-500 pb-20">
                <header className="space-y-4">
                   <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
                      <span className="bg-primary/20 px-2 py-1 rounded">Parte {currentStep + 1} de {lesson.sections.length}</span>
                   </div>
                   <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight">{currentSection.title}</h2>
                </header>
                
                <div className="space-y-12">
                    {currentSection.blocks && currentSection.blocks.length > 0 ? (
                        currentSection.blocks.map((block, idx) => renderBlock(block, idx))
                    ) : (
                        <div className="text-sm md:text-base text-slate-600 dark:text-text-secondary text-justify">
                            <MarkdownRenderer content={(currentSection as any).content || ''} />
                        </div>
                    )}
                </div>

                {/* INTERACTIVE CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                    {currentSection.interaction && (
                        <div 
                            onClick={handleCompleteChallenge}
                            className={`p-6 rounded-3xl border cursor-pointer transition-all relative overflow-hidden group ${challengeCompleted ? 'bg-green-500/10 border-green-500/30' : 'bg-purple-500/5 border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/10'}`}
                        >
                            <div className="flex gap-4 items-start relative z-10">
                                <div className={`p-3 rounded-2xl shrink-0 transition-colors ${challengeCompleted ? 'bg-green-500 text-white' : 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'}`}>
                                    <span className="material-symbols-outlined text-xl">{challengeCompleted ? 'check' : 'touch_app'}</span>
                                </div>
                                <div>
                                    <h4 className={`font-black text-[10px] uppercase tracking-widest mb-1 ${challengeCompleted ? 'text-green-500' : 'text-purple-500'}`}>
                                        {challengeCompleted ? '¡Desafío Completado!' : 'Micro-Desafío'}
                                    </h4>
                                    <p className={`text-sm leading-relaxed ${challengeCompleted ? 'text-green-200' : 'text-slate-500 dark:text-slate-300'}`}>
                                        {currentSection.interaction}
                                    </p>
                                    {!challengeCompleted && <p className="text-[10px] font-bold text-purple-400 mt-2 uppercase">Haz clic al completar</p>}
                                </div>
                            </div>
                            {/* Simple Visual Feedback Element */}
                            {challengeCompleted && <div className="absolute -bottom-4 -right-4 text-green-500/10 text-9xl material-symbols-outlined">verified</div>}
                        </div>
                    )}
                    
                    {currentSection.fact && (
                        <details className="group p-6 bg-blue-500/5 rounded-3xl border border-blue-500/20 open:bg-blue-500/10 transition-colors cursor-pointer">
                            <summary className="flex gap-4 items-center list-none">
                                <div className="p-3 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20 shrink-0">
                                    <span className="material-symbols-outlined text-xl">lightbulb</span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-blue-500 font-black text-[10px] uppercase tracking-widest mb-0.5">Nota Técnica</h4>
                                    <p className="text-xs text-blue-300 font-bold group-open:hidden">Pulsa para revelar dato curioso</p>
                                </div>
                                <span className="material-symbols-outlined text-blue-500 transition-transform group-open:rotate-180">expand_more</span>
                            </summary>
                            <div className="mt-4 pl-[4.5rem] animate-in slide-in-from-top-2">
                                <p className="text-sm text-slate-300 leading-relaxed border-l-2 border-blue-500/30 pl-4">{currentSection.fact}</p>
                            </div>
                        </details>
                    )}
                </div>

                <div className="h-px bg-border-dark my-8"></div>

                <div className="flex justify-end pb-12">
                   <button onClick={handleNext} className="group relative px-8 py-4 bg-primary text-white rounded-2xl text-sm font-black shadow-2xl shadow-primary/30 overflow-hidden hover:scale-105 transition-transform uppercase tracking-wider">
                     <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                     <span className="relative flex items-center gap-3">
                        {currentStep === lesson.sections.length - 1 ? "Completar Lectura" : "Siguiente Paso"}
                        <span className="material-symbols-outlined text-xl">arrow_forward</span>
                     </span>
                   </button>
                </div>
             </article>
           ) : (
             <div className="max-w-4xl mx-auto py-8 space-y-8 animate-in zoom-in-95 duration-500">
                <div className="text-center space-y-4">
                   <div className="inline-flex p-4 bg-primary/10 rounded-full text-primary mb-4 ring-4 ring-primary/5">
                      <span className="material-symbols-outlined text-4xl">quiz</span>
                   </div>
                   <h2 className="text-4xl font-black text-white">Validación de Conocimientos</h2>
                   <p className="text-text-secondary text-lg max-w-xl mx-auto">Demuestra lo que has aprendido. Responde correctamente a todas las preguntas para obtener tu XP.</p>
                </div>
                
                <div className="space-y-6">
                    {lesson.quiz && lesson.quiz.map((q, qIndex) => (
                        <div key={qIndex} className="p-8 bg-card-dark rounded-[32px] border border-border-dark space-y-6 shadow-xl relative overflow-hidden group">
                            <div className="flex gap-6">
                                <div className="size-10 bg-surface-dark text-white rounded-xl flex items-center justify-center font-black text-lg border border-border-dark shrink-0">{qIndex + 1}</div>
                                <h3 className="text-xl font-bold text-white pt-1">{q.question}</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-16">
                                {q.options.map((opt, i) => {
                                    const isSelected = userAnswers[qIndex] === i;
                                    const isCorrect = isSelected && i === q.correctIndex; // Only reveal visual if done (logic simplified here)
                                    return (
                                        <button 
                                            key={opt} 
                                            onClick={() => handleAnswerSelect(qIndex, i)} 
                                            className={`w-full p-4 rounded-2xl border text-left text-sm font-medium transition-all flex justify-between items-center group/btn
                                                ${isSelected 
                                                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                                                    : 'bg-surface-dark border-border-dark text-text-secondary hover:border-primary/50 hover:text-white'
                                                }`}
                                        >
                                            <span>{opt}</span>
                                            {isSelected && <span className="material-symbols-outlined text-lg animate-in zoom-in">check_circle</span>}
                                        </button>
                                    );
                                })}
                            </div>
                            
                            {userAnswers[qIndex] !== undefined && userAnswers[qIndex] !== q.correctIndex && (
                                <div className="ml-16 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold animate-in slide-in-from-top-2 flex items-start gap-3">
                                    <span className="material-symbols-outlined text-xl shrink-0">error</span>
                                    <span>Respuesta incorrecta. {q.hint}</span>
                                </div>
                            )}
                            
                            {userAnswers[qIndex] !== undefined && userAnswers[qIndex] === q.correctIndex && (
                                <div className="ml-16 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 text-sm font-bold animate-in slide-in-from-top-2 flex items-center gap-3">
                                    <span className="material-symbols-outlined text-xl">check_circle</span>
                                    <span>¡Correcto! Bien hecho.</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="sticky bottom-6 z-30">
                    <div className="bg-surface-dark/90 backdrop-blur-xl p-4 rounded-3xl border border-border-dark shadow-2xl flex justify-between items-center max-w-2xl mx-auto">
                        <div className="px-4">
                            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Tu Progreso</p>
                            <p className="text-white font-bold">{Object.keys(userAnswers).length} de {lesson.quiz.length} completadas</p>
                        </div>
                        
                        {allCorrect ? (
                             <div className="flex gap-3">
                                <button onClick={handleFinish} className="px-8 py-3 bg-green-500 text-white rounded-2xl text-sm font-black uppercase hover:bg-green-600 transition-all shadow-xl shadow-green-500/30 hover:scale-105 flex items-center gap-2">
                                    <span>Finalizar Módulo</span>
                                    <span className="material-symbols-outlined">emoji_events</span>
                                </button>
                                {nextLessonId && <button onClick={handleNextLesson} className="px-6 py-3 bg-white/10 text-white rounded-2xl text-sm font-black uppercase border border-white/20 hover:bg-white/20 transition-colors">Siguiente &rarr;</button>}
                            </div>
                        ) : (
                            <button disabled className="px-8 py-3 bg-surface-dark text-slate-600 rounded-2xl text-sm font-black uppercase cursor-not-allowed border border-border-dark flex items-center gap-2">
                                <span>Completa el Quiz</span>
                                <span className="material-symbols-outlined">lock</span>
                            </button>
                        )}
                    </div>
                </div>
             </div>
           )}
        </main>
      </div>
    </div>
  );
};

export default LessonDetail;
