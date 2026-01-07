
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLessonById } from '../content/registry';
import { LessonData, ContentBlock } from '../types/lessons';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { User } from '../types';

const LessonDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLesson = async () => {
      setIsLoading(true);
      if (id) {
        const data = await getLessonById(id);
        if (data) {
          setLesson(data);
          // Reset states when lesson changes
          setCurrentSectionIndex(0);
          setShowQuiz(false);
          setQuizAnswers(new Array(data.quiz ? data.quiz.length : 0).fill(-1));
          setQuizSubmitted(false);
        }
      }
      setIsLoading(false);
    };
    loadLesson();
  }, [id]);

  const handleNext = () => {
    if (!lesson) return;
    if (currentSectionIndex < lesson.sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      setShowQuiz(true);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (showQuiz) {
      setShowQuiz(false);
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
    }
    window.scrollTo(0, 0);
  };

  const handleQuizOptionChange = (questionIndex: number, optionIndex: number) => {
    const newAnswers = [...quizAnswers];
    newAnswers[questionIndex] = optionIndex;
    setQuizAnswers(newAnswers);
  };

  const handleFinish = () => {
    // Validate quiz
    setQuizSubmitted(true);
    const allCorrect = lesson?.quiz.every((q, i) => q.correctIndex === quizAnswers[i]);
    
    if (allCorrect) {
      const stored = localStorage.getItem('robo_user');
      if (stored && lesson) {
        const user: User = JSON.parse(stored);
        if (!user.completedLessons.includes(lesson.id)) {
            user.completedLessons.push(lesson.id);
            user.xp += 100;
            // Add to activity log if needed
            const today = new Date().toISOString().split('T')[0];
            if (!user.activityLog) user.activityLog = [];
            const logIndex = user.activityLog.findIndex(l => l.date === today);
            if(logIndex >= 0) {
                user.activityLog[logIndex].xpEarned += 100;
            } else {
                user.activityLog.push({ date: today, xpEarned: 100 });
            }
            localStorage.setItem('robo_user', JSON.stringify(user));
            window.dispatchEvent(new Event('authChange'));
        }
        navigate('/paths'); // Or dashboard
      }
    } else {
      alert("Algunas respuestas son incorrectas. Revisa las pistas e intenta de nuevo.");
    }
  };

  const renderBlock = (block: ContentBlock, idx: number) => {
    switch (block.type) {
        case 'text':
            return (
                <div key={idx} className="text-sm md:text-base text-slate-300 text-justify leading-relaxed">
                   <MarkdownRenderer content={block.content} />
                </div>
            );
        case 'image':
            return (
                <div key={idx} className="aspect-video w-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative bg-black max-h-[500px] my-6">
                   <img src={block.content} className="w-full h-full object-contain" alt="Visual" />
                </div>
            );
        case 'video':
            return (
                <div key={idx} className="aspect-video w-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black my-6">
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
             return (
                 <div key={idx} className="aspect-video w-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black my-6 relative group">
                    <iframe 
                       src={block.content} 
                       title="Circuit Simulator"
                       className="w-full h-full"
                       frameBorder="0"
                    ></iframe>
                    <div className="absolute top-2 right-2 bg-black/70 px-3 py-1 rounded-lg text-[10px] text-white pointer-events-none">Simulador Interactivo</div>
                 </div>
             );
        default:
            return null;
    }
  };

  if (isLoading) {
      return <div className="h-screen bg-background-dark flex items-center justify-center text-white">Cargando Lección...</div>;
  }

  if (!lesson) {
      return <div className="h-screen bg-background-dark flex items-center justify-center text-white">Lección no encontrada</div>;
  }

  const currentSection = lesson.sections[currentSectionIndex];

  return (
    <div className="min-h-screen bg-background-dark flex flex-col items-center py-10 px-4 md:px-0 font-body text-white">
      <div className="w-full max-w-3xl space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-white/10">
           <div>
              <p className="text-primary font-bold text-xs uppercase tracking-widest mb-1">{lesson.subtitle}</p>
              <h1 className="text-3xl font-black">{lesson.title}</h1>
           </div>
           <button onClick={() => navigate('/paths')} className="text-slate-400 hover:text-white">
              <span className="material-symbols-outlined">close</span>
           </button>
        </header>

        {/* Progress */}
        {!showQuiz && (
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-primary transition-all duration-500" 
                    style={{ width: `${((currentSectionIndex + 1) / lesson.sections.length) * 100}%` }}
                ></div>
            </div>
        )}

        {/* Content */}
        <div className="min-h-[400px]">
            {showQuiz ? (
                <div className="space-y-8 animate-in slide-in-from-right-4">
                    <div className="text-center space-y-2">
                        <span className="material-symbols-outlined text-4xl text-primary">quiz</span>
                        <h2 className="text-2xl font-black">Evaluación de Conocimientos</h2>
                        <p className="text-slate-400 text-sm">Responde correctamente para completar el módulo.</p>
                    </div>

                    <div className="space-y-6">
                        {lesson.quiz.map((q, qIdx) => (
                            <div key={qIdx} className="bg-card-dark p-6 rounded-2xl border border-white/5 space-y-4">
                                <h3 className="font-bold text-lg">{q.question}</h3>
                                <div className="space-y-2">
                                    {q.options.map((opt, optIdx) => (
                                        <label 
                                            key={optIdx} 
                                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                                quizAnswers[qIdx] === optIdx 
                                                    ? 'bg-primary/20 border-primary text-white' 
                                                    : 'bg-white/5 border-transparent hover:bg-white/10 text-slate-300'
                                            }`}
                                        >
                                            <input 
                                                type="radio" 
                                                name={`q-${qIdx}`} 
                                                checked={quizAnswers[qIdx] === optIdx}
                                                onChange={() => handleQuizOptionChange(qIdx, optIdx)}
                                                className="hidden"
                                            />
                                            <div className={`size-4 rounded-full border flex items-center justify-center ${quizAnswers[qIdx] === optIdx ? 'border-primary' : 'border-slate-500'}`}>
                                                {quizAnswers[qIdx] === optIdx && <div className="size-2 bg-primary rounded-full"></div>}
                                            </div>
                                            <span className="text-sm">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                                {quizSubmitted && quizAnswers[qIdx] !== q.correctIndex && (
                                    <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-xs font-bold flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">info</span>
                                        Pista: {q.hint}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in duration-500 key={currentSectionIndex}">
                    <h2 className="text-2xl font-bold text-white mb-6">{currentSection.title}</h2>
                    
                    <div className="space-y-6">
                        {currentSection.blocks.map((block, idx) => renderBlock(block, idx))}
                    </div>

                    {(currentSection.fact || currentSection.interaction) && (
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentSection.fact && (
                                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl">
                                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                                        <span className="material-symbols-outlined text-sm">lightbulb</span>
                                        <span className="text-xs font-black uppercase tracking-widest">Dato Curioso</span>
                                    </div>
                                    <p className="text-sm text-blue-100">{currentSection.fact}</p>
                                </div>
                            )}
                            {currentSection.interaction && (
                                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl">
                                    <div className="flex items-center gap-2 text-amber-500 mb-2">
                                        <span className="material-symbols-outlined text-sm">science</span>
                                        <span className="text-xs font-black uppercase tracking-widest">Experimenta</span>
                                    </div>
                                    <p className="text-sm text-amber-100">{currentSection.interaction}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Footer Navigation */}
        <div className="flex justify-between items-center pt-8 border-t border-white/10 w-full">
            <button 
                onClick={handlePrev}
                disabled={currentSectionIndex === 0 && !showQuiz}
                className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
                Anterior
            </button>

            {showQuiz ? (
                <button 
                    onClick={handleFinish}
                    className="px-8 py-3 bg-green-500 text-white rounded-xl font-black uppercase tracking-widest hover:bg-green-400 transition-all shadow-lg shadow-green-500/20"
                >
                    Finalizar Módulo
                </button>
            ) : (
                <button 
                    onClick={handleNext}
                    className="px-8 py-3 bg-primary text-white rounded-xl font-black uppercase tracking-widest hover:bg-primary/80 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                    {currentSectionIndex === lesson.sections.length - 1 ? 'Ir al Quiz' : 'Siguiente'}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default LessonDetail;
