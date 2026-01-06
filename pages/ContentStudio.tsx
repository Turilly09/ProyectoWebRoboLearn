
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { geminiService } from '../services/gemini';
import { LessonData, Section, QuizQuestion } from '../types/lessons';
import { NewsItem, LearningPath } from '../types';
import { saveDynamicLesson, getAllDynamicLessonsList, deleteDynamicLesson } from '../content/registry';
import { saveDynamicNews, getDynamicNews, deleteDynamicNews } from '../content/newsRegistry';
import { getAllPaths } from '../content/pathRegistry';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

type StudioTab = 'create' | 'library';
type ContentType = 'lesson' | 'news';

const ContentStudio: React.FC = () => {
  const navigate = useNavigate();
  
  const [studioTab, setStudioTab] = useState<StudioTab>('create');
  const [contentType, setContentType] = useState<ContentType>('lesson');
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [news, setNews] = useState<NewsItem | null>(null);
  const [status, setStatus] = useState<string>("");
  const [errorStatus, setErrorStatus] = useState<string>("");
  const [showSqlHelp, setShowSqlHelp] = useState(false);
  
  const isDeletingRef = useRef(false);

  const [myLessons, setMyLessons] = useState<LessonData[]>([]);
  const [myNews, setMyNews] = useState<NewsItem[]>([]);
  const [allPaths, setAllPaths] = useState<LearningPath[]>([]);

  const loadData = async (force = false) => {
    if (isDeletingRef.current && !force) return;
    try {
      const [lessons, newsItems, paths] = await Promise.all([
        getAllDynamicLessonsList(),
        getDynamicNews(),
        getAllPaths()
      ]);
      setMyLessons(lessons);
      setMyNews(newsItems);
      setAllPaths(paths);
    } catch (err) {
      console.error("Error cargando datos:", err);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('lessonsUpdated', handleUpdate);
    window.addEventListener('newsUpdated', handleUpdate);
    return () => {
      window.removeEventListener('lessonsUpdated', handleUpdate);
      window.removeEventListener('newsUpdated', handleUpdate);
    };
  }, []);

  const handleCreateEmpty = () => {
    if (contentType === 'lesson') {
      const emptyLesson: LessonData = {
        id: `m${Date.now()}`,
        pathId: allPaths[0]?.id || 'e101',
        order: 5,
        type: 'theory',
        title: "Nuevo Módulo",
        subtitle: "Subtítulo descriptivo...",
        sections: [{ title: "1. Introducción", content: "Escribe aquí el contenido teórico.\n\nUsa doble enter para separar párrafos y **asteriscos** para negrita.", image: "https://picsum.photos/seed/new/800/400", fact: "¿Sabías que...?" }],
        steps: [],
        simulatorUrl: "",
        quiz: [{ question: "Pregunta de validación...", options: ["Opción A", "Opción B", "Opción C", "Opción D"], correctIndex: 0, hint: "Pista para el estudiante" }]
      };
      setLesson(emptyLesson);
      setNews(null);
    } else {
      const emptyNews: NewsItem = {
        id: `n${Date.now()}`,
        title: "Nueva Noticia",
        excerpt: "Breve resumen...",
        content: "Contenido completo...",
        date: new Date().toLocaleDateString('es-ES'),
        author: 'Editor',
        category: 'Tecnología',
        image: "https://picsum.photos/seed/news/800/400",
        readTime: "5 min"
      };
      setNews(emptyNews);
      setLesson(null);
    }
    setStudioTab('create');
  };

  const handlePublish = async () => {
    setStatus("Publicando...");
    setErrorStatus("");
    try {
      if (lesson) await saveDynamicLesson(lesson);
      else if (news) await saveDynamicNews(news);
      setStatus("¡Publicado!");
      setTimeout(() => setStatus(""), 3000);
      loadData(true);
      setLesson(null);
      setNews(null);
    } catch (err: any) {
      setErrorStatus("Fallo al publicar: " + err.message);
    }
  };

  const handleRealDelete = async (id: string, type: 'lesson' | 'news') => {
    if (!window.confirm("¿Deseas eliminar este registro permanentemente de la base de datos?")) return;

    isDeletingRef.current = true;
    setStatus("Borrando de la base de datos...");
    
    if (type === 'lesson') setMyLessons(prev => prev.filter(l => l.id !== id));
    else setMyNews(prev => prev.filter(n => n.id !== id));

    try {
      if (type === 'lesson') await deleteDynamicLesson(id);
      else await deleteDynamicNews(id);
      setStatus("Registro borrado con éxito.");
      setTimeout(() => setStatus(""), 3000);
    } catch (err: any) {
      setErrorStatus("Error de Permisos: El servidor rechazó el borrado. Verifica las políticas RLS.");
      setShowSqlHelp(true);
      setTimeout(() => { setErrorStatus(""); loadData(true); }, 5000);
    } finally {
      isDeletingRef.current = false;
    }
  };

  const handleGenerateAI = async () => {
    if (!topic) return;
    setIsGenerating(true);
    try {
      if (contentType === 'lesson') {
        const draft = await geminiService.generateLessonDraft(topic);
        if (draft) setLesson({ ...draft, id: `m${Date.now()}`, pathId: allPaths[0]?.id || 'e101', order: 10, type: 'theory' });
      } else {
        const draft = await geminiService.generateNewsDraft(topic);
        if (draft) setNews({ ...draft, id: `n${Date.now()}`, date: new Date().toLocaleDateString('es-ES') });
      }
    } catch (err) { setErrorStatus("IA Ocupada."); }
    finally { setIsGenerating(false); }
  };

  // Helpers de edición para Lecciones
  const updateSection = (index: number, field: keyof Section, value: string) => {
    if (!lesson) return;
    const newSections = [...lesson.sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setLesson({ ...lesson, sections: newSections });
  };

  const addSection = () => {
    if (!lesson) return;
    setLesson({
      ...lesson,
      sections: [...lesson.sections, { title: `Nueva Sección ${lesson.sections.length + 1}`, content: "", image: "https://picsum.photos/800/400", fact: "" }]
    });
  };

  const removeSection = (index: number) => {
    if (!lesson) return;
    setLesson({ ...lesson, sections: lesson.sections.filter((_, i) => i !== index) });
  };

  // Helpers de edición para Quiz (Múltiples preguntas)
  const addQuizQuestion = () => {
    if (!lesson) return;
    const newQuestion: QuizQuestion = {
        question: "Nueva pregunta...",
        options: ["Opción A", "Opción B", "Opción C"],
        correctIndex: 0,
        hint: "Pista..."
    };
    setLesson({ ...lesson, quiz: [...(lesson.quiz || []), newQuestion] });
  };

  const removeQuizQuestion = (index: number) => {
    if (!lesson) return;
    setLesson({ ...lesson, quiz: lesson.quiz.filter((_, i) => i !== index) });
  };

  const updateQuizQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    if (!lesson) return;
    const newQuiz = [...lesson.quiz];
    newQuiz[index] = { ...newQuiz[index], [field]: value };
    setLesson({ ...lesson, quiz: newQuiz });
  };

  const updateQuizOption = (qIndex: number, optIndex: number, value: string) => {
    if (!lesson) return;
    const newQuiz = [...lesson.quiz];
    const newOptions = [...newQuiz[qIndex].options];
    newOptions[optIndex] = value;
    newQuiz[qIndex] = { ...newQuiz[qIndex], options: newOptions };
    setLesson({ ...lesson, quiz: newQuiz });
  };

  return (
    <div className="flex-1 flex flex-col bg-background-dark text-white min-h-screen font-body overflow-hidden">
      <header className="p-4 border-b border-border-dark flex items-center justify-between bg-surface-dark z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-card-dark rounded-xl text-text-secondary transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">terminal</span>
            <h1 className="font-black text-xs uppercase tracking-widest">RoboLearn Studio</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setShowSqlHelp(true)} className="px-3 py-1.5 border border-amber-500/30 text-amber-500 rounded-lg text-[9px] font-black uppercase hover:bg-amber-500/10 transition-all">Configurar RLS</button>
          <div className="flex bg-card-dark p-1 rounded-xl border border-border-dark">
             <button onClick={() => setStudioTab('create')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${studioTab === 'create' ? 'bg-primary' : 'text-text-secondary'}`}>Editor</button>
             <button onClick={() => setStudioTab('library')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${studioTab === 'library' ? 'bg-purple-600' : 'text-text-secondary'}`}>Biblioteca</button>
          </div>
          {(lesson || news) && (
            <button onClick={handlePublish} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-[9px] font-black shadow-lg shadow-green-600/20 uppercase transition-all">Publicar Cambios</button>
          )}
        </div>
      </header>

      {showSqlHelp && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-surface-dark border border-border-dark max-w-2xl w-full rounded-[40px] p-10 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center">
               <h2 className="text-2xl font-black text-white">Dar Permisos de Borrado</h2>
               <button onClick={() => setShowSqlHelp(false)} className="material-symbols-outlined hover:text-red-500">close</button>
            </div>
            <p className="text-sm text-text-secondary">Pega esto en el SQL Editor de Supabase:</p>
            <pre className="bg-black/50 p-6 rounded-2xl text-[10px] font-mono text-green-400 border border-white/5 overflow-x-auto select-all">
{`CREATE POLICY "Allow Public Delete" ON public.lessons FOR DELETE USING (true);
CREATE POLICY "Allow Public Delete" ON public.news FOR DELETE USING (true);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;`}
            </pre>
            <button onClick={() => setShowSqlHelp(false)} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase">Hecho</button>
          </div>
        </div>
      )}

      <main className="flex-1 flex overflow-hidden relative">
        <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
          {status && <div className="px-6 py-3 bg-green-600 text-white rounded-2xl text-xs font-bold shadow-2xl animate-in slide-in-from-right-4">{status}</div>}
          {errorStatus && <div className="px-6 py-3 bg-red-600 text-white rounded-2xl text-xs font-bold shadow-2xl animate-in slide-in-from-right-4">{errorStatus}</div>}
        </div>

        {studioTab === 'create' ? (
          <div className="flex-1 flex">
            {/* --- PANEL LATERAL (METADATA) --- */}
            <aside className="w-80 border-r border-border-dark flex flex-col bg-surface-dark/50 shrink-0 overflow-y-auto p-6 space-y-6">
              {!(lesson || news) ? (
                <>
                  <div className="flex bg-card-dark p-1 rounded-xl border border-border-dark">
                    <button onClick={() => setContentType('lesson')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${contentType === 'lesson' ? 'bg-primary' : 'text-text-secondary'}`}>Módulos</button>
                    <button onClick={() => setContentType('news')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${contentType === 'news' ? 'bg-amber-600' : 'text-text-secondary'}`}>Noticias</button>
                  </div>
                  <button onClick={handleCreateEmpty} className="w-full py-4 bg-primary rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">Crear Manualmente</button>
                  <div className="p-5 bg-card-dark rounded-2xl border border-border-dark space-y-4">
                     <h3 className="text-[10px] font-black text-primary uppercase">Generador IA</h3>
                     <textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder="Ej: Introducción a I2C..." className="w-full h-24 bg-surface-dark border border-border-dark rounded-xl p-3 text-xs resize-none focus:border-primary outline-none" />
                     <button onClick={handleGenerateAI} disabled={isGenerating} className="w-full py-3 bg-white/5 border border-primary/30 text-primary text-[10px] font-black rounded-xl uppercase hover:bg-primary hover:text-white transition-all">
                       {isGenerating ? 'Generando...' : 'Generar Borrador IA'}
                     </button>
                  </div>
                </>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-left-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-primary uppercase">Propiedades Generales</h3>
                    <button onClick={() => {setLesson(null); setNews(null);}} className="text-[10px] text-red-400 hover:text-red-300 uppercase font-bold">Cerrar</button>
                  </div>
                  
                  {lesson && (
                    <div className="space-y-4">
                       <div className="space-y-1">
                          <label className="text-[10px] text-text-secondary uppercase font-bold">Título del Módulo</label>
                          <input value={lesson.title} onChange={e => setLesson({...lesson, title: e.target.value})} className="w-full bg-card-dark p-3 rounded-xl text-xs border border-border-dark focus:border-primary outline-none" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] text-text-secondary uppercase font-bold">Subtítulo</label>
                          <input value={lesson.subtitle} onChange={e => setLesson({...lesson, subtitle: e.target.value})} className="w-full bg-card-dark p-3 rounded-xl text-xs border border-border-dark focus:border-primary outline-none" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] text-text-secondary uppercase font-bold">Asignar a Ruta</label>
                          <select value={lesson.pathId || ''} onChange={e => setLesson({...lesson, pathId: e.target.value})} className="w-full bg-card-dark p-3 rounded-xl text-xs border border-border-dark focus:border-primary outline-none text-white">
                             {allPaths.map(p => <option key={p.id} value={p.id}>{p.title} ({p.level})</option>)}
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] text-text-secondary uppercase font-bold">Orden en la Ruta</label>
                          <input type="number" value={lesson.order} onChange={e => setLesson({...lesson, order: parseInt(e.target.value)})} className="w-full bg-card-dark p-3 rounded-xl text-xs border border-border-dark focus:border-primary outline-none" />
                       </div>
                    </div>
                  )}

                  {news && (
                    <div className="space-y-4">
                       <div className="space-y-1">
                          <label className="text-[10px] text-text-secondary uppercase font-bold">Titular</label>
                          <input value={news.title} onChange={e => setNews({...news, title: e.target.value})} className="w-full bg-card-dark p-3 rounded-xl text-xs border border-border-dark focus:border-amber-500 outline-none" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] text-text-secondary uppercase font-bold">Categoría</label>
                          <select value={news.category} onChange={e => setNews({...news, category: e.target.value as any})} className="w-full bg-card-dark p-3 rounded-xl text-xs border border-border-dark focus:border-amber-500 outline-none text-white">
                             {['Tecnología', 'Comunidad', 'Tutorial', 'Evento'].map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] text-text-secondary uppercase font-bold">Autor</label>
                          <input value={news.author} onChange={e => setNews({...news, author: e.target.value})} className="w-full bg-card-dark p-3 rounded-xl text-xs border border-border-dark focus:border-amber-500 outline-none" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] text-text-secondary uppercase font-bold">Tiempo Lectura</label>
                          <input value={news.readTime} onChange={e => setNews({...news, readTime: e.target.value})} className="w-full bg-card-dark p-3 rounded-xl text-xs border border-border-dark focus:border-amber-500 outline-none" />
                       </div>
                    </div>
                  )}
                  
                  <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl text-[10px] text-blue-300">
                    <p>Los cambios se guardan localmente hasta que pulsas "Publicar".</p>
                  </div>
                </div>
              )}
            </aside>

            {/* --- ÁREA PRINCIPAL (EDITOR) --- */}
            <div className="flex-1 bg-background-light dark:bg-background-dark overflow-y-auto relative">
               {!(lesson || news) ? (
                 <div className="flex h-full items-center justify-center opacity-10 flex-col gap-4">
                    <span className="material-symbols-outlined text-[120px]">architecture</span>
                    <p className="font-black text-2xl uppercase">Selecciona o crea un elemento</p>
                 </div>
               ) : (
                 <div className="max-w-4xl mx-auto p-12 space-y-12 animate-in fade-in zoom-in-95 duration-300">
                    {/* EDITOR DE LECCIONES */}
                    {lesson && (
                      <>
                        <div className="flex items-center justify-between">
                           <h2 className="text-3xl font-black text-white">Contenido del Módulo</h2>
                           <button onClick={addSection} className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all">
                              <span className="material-symbols-outlined text-sm">add_circle</span> Añadir Sección
                           </button>
                        </div>

                        <div className="space-y-8">
                           {lesson.sections.map((section, idx) => (
                             <div key={idx} className="p-8 bg-card-dark rounded-3xl border border-border-dark space-y-6 relative group">
                                <button onClick={() => removeSection(idx)} className="absolute top-6 right-6 p-2 bg-red-500/10 text-red-500 rounded-lg opacity-50 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all">
                                   <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                                
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black uppercase text-primary tracking-widest">Sección {idx + 1}</label>
                                   <input 
                                     value={section.title} 
                                     onChange={e => updateSection(idx, 'title', e.target.value)}
                                     className="w-full bg-transparent text-2xl font-bold text-white placeholder-white/20 border-b border-border-dark focus:border-primary outline-none py-2"
                                     placeholder="Título de la sección..." 
                                   />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                   <div className="space-y-2">
                                      <div className="flex justify-between items-center">
                                         <label className="text-[10px] font-bold uppercase text-text-secondary">Contenido Teórico</label>
                                         <span className="text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded font-bold">Soporta Markdown</span>
                                      </div>
                                      <div className="text-[10px] text-text-secondary mb-1 space-x-2">
                                         <span>Tip: Usa <strong>**texto**</strong> para negrita</span>
                                         <span>•</span>
                                         <span>Doble Enter para nuevo párrafo</span>
                                      </div>
                                      <textarea 
                                        value={section.content}
                                        onChange={e => updateSection(idx, 'content', e.target.value)}
                                        className="w-full h-48 bg-surface-dark rounded-xl border border-border-dark p-4 text-sm text-text-secondary leading-relaxed focus:border-primary outline-none resize-none font-mono"
                                        placeholder="Desarrolla el tema aquí..."
                                      />
                                      {/* LIVE PREVIEW AREA */}
                                      <div className="mt-2 p-4 bg-surface-dark/50 rounded-xl border border-border-dark/50">
                                         <p className="text-[9px] font-black uppercase text-text-secondary mb-2">Vista Previa:</p>
                                         <MarkdownRenderer content={section.content} className="text-sm text-slate-300" />
                                      </div>
                                   </div>
                                   <div className="space-y-4">
                                      <div className="space-y-2">
                                         <label className="text-[10px] font-bold uppercase text-text-secondary">URL Imagen</label>
                                         <input 
                                           value={section.image}
                                           onChange={e => updateSection(idx, 'image', e.target.value)}
                                           className="w-full bg-surface-dark rounded-xl border border-border-dark p-3 text-xs focus:border-primary outline-none"
                                           placeholder="https://..."
                                         />
                                      </div>
                                      <div className="space-y-2">
                                         <label className="text-[10px] font-bold uppercase text-text-secondary">URL Video (YouTube Embed)</label>
                                         <input 
                                           value={section.video || ''}
                                           onChange={e => updateSection(idx, 'video', e.target.value)}
                                           className="w-full bg-surface-dark rounded-xl border border-border-dark p-3 text-xs focus:border-primary outline-none"
                                           placeholder="https://www.youtube.com/embed/..."
                                         />
                                      </div>
                                      <div className="h-32 rounded-xl bg-black/20 overflow-hidden border border-border-dark flex items-center justify-center relative">
                                         {section.video ? (
                                           <iframe src={section.video} className="w-full h-full" title="Preview" frameBorder="0"></iframe>
                                         ) : section.image ? (
                                           <img src={section.image} className="w-full h-full object-cover" alt="Preview" />
                                         ) : (
                                           <span className="material-symbols-outlined text-text-secondary">image</span>
                                         )}
                                      </div>
                                   </div>
                                </div>

                                <div className="space-y-2">
                                   <label className="text-[10px] font-bold uppercase text-blue-400 flex items-center gap-2"><span className="material-symbols-outlined text-sm">lightbulb</span> Dato Curioso (Fact)</label>
                                   <input 
                                      value={section.fact}
                                      onChange={e => updateSection(idx, 'fact', e.target.value)}
                                      className="w-full bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-200 focus:border-blue-500 outline-none"
                                      placeholder="¿Sabías que...?"
                                   />
                                </div>
                             </div>
                           ))}
                        </div>

                        <div className="h-px bg-border-dark my-12"></div>

                        {/* SECCIÓN DE QUIZZES MÚLTIPLES */}
                        <div className="p-8 bg-surface-dark rounded-3xl border border-border-dark space-y-8">
                           <div className="flex justify-between items-center">
                             <h3 className="text-xl font-black text-white flex items-center gap-3"><span className="material-symbols-outlined text-primary">quiz</span> Evaluación del Módulo</h3>
                             <button onClick={addQuizQuestion} className="px-4 py-2 bg-white/5 border border-border-dark rounded-xl text-[10px] font-black uppercase hover:bg-primary hover:text-white transition-all">
                                Añadir Pregunta
                             </button>
                           </div>
                           
                           <div className="space-y-6">
                            {(lesson.quiz || []).map((q, qIndex) => (
                                <div key={qIndex} className="p-6 bg-black/20 rounded-2xl border border-border-dark relative group">
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <div className="px-2 py-1 bg-primary/20 text-primary rounded text-[9px] font-bold">Q{qIndex + 1}</div>
                                        {lesson.quiz.length > 1 && (
                                            <button onClick={() => removeQuizQuestion(qIndex)} className="text-red-500 hover:text-white transition-colors">
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-4 pr-12">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-text-secondary">Enunciado</label>
                                            <input 
                                                value={q.question} 
                                                onChange={e => updateQuizQuestion(qIndex, 'question', e.target.value)}
                                                className="w-full bg-card-dark p-3 rounded-xl border border-border-dark focus:border-primary outline-none text-white font-bold"
                                                placeholder="Pregunta..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {q.options.map((opt, optIndex) => (
                                                <div key={optIndex} className="flex items-center gap-2">
                                                <input 
                                                    type="radio" 
                                                    name={`correctOption_${qIndex}`} 
                                                    checked={q.correctIndex === optIndex} 
                                                    onChange={() => updateQuizQuestion(qIndex, 'correctIndex', optIndex)}
                                                    className="accent-primary size-4 cursor-pointer"
                                                />
                                                <input 
                                                    value={opt}
                                                    onChange={e => updateQuizOption(qIndex, optIndex, e.target.value)}
                                                    className={`w-full bg-card-dark p-3 rounded-xl border text-sm outline-none ${q.correctIndex === optIndex ? 'border-primary text-primary font-bold' : 'border-border-dark text-text-secondary focus:border-white'}`}
                                                    placeholder={`Opción ${optIndex+1}`}
                                                />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-text-secondary">Pista (Hint)</label>
                                            <input 
                                                value={q.hint} 
                                                onChange={e => updateQuizQuestion(qIndex, 'hint', e.target.value)}
                                                className="w-full bg-card-dark p-3 rounded-xl border border-border-dark focus:border-primary outline-none text-xs"
                                                placeholder="Pista para el estudiante..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                           </div>
                        </div>
                      </>
                    )}

                    {/* EDITOR DE NOTICIAS */}
                    {news && (
                      <div className="space-y-8">
                         <h2 className="text-3xl font-black text-white">Contenido de la Noticia</h2>
                         
                         <div className="p-8 bg-card-dark rounded-3xl border border-border-dark space-y-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-bold uppercase text-text-secondary">URL Imagen de Cabecera</label>
                               <input 
                                 value={news.image}
                                 onChange={e => setNews({...news, image: e.target.value})}
                                 className="w-full bg-surface-dark p-3 rounded-xl border border-border-dark focus:border-amber-500 outline-none text-sm"
                               />
                               {news.image && (
                                 <div className="h-64 rounded-xl overflow-hidden mt-4 border border-border-dark">
                                    <img src={news.image} className="w-full h-full object-cover" alt="Preview" />
                                 </div>
                               )}
                            </div>

                            <div className="space-y-2">
                               <label className="text-[10px] font-bold uppercase text-text-secondary">Extracto (Resumen)</label>
                               <textarea 
                                 value={news.excerpt}
                                 onChange={e => setNews({...news, excerpt: e.target.value})}
                                 className="w-full h-24 bg-surface-dark p-4 rounded-xl border border-border-dark focus:border-amber-500 outline-none text-sm leading-relaxed resize-none"
                               />
                            </div>

                            <div className="space-y-2">
                               <div className="flex justify-between items-center">
                                   <label className="text-[10px] font-bold uppercase text-text-secondary">Cuerpo del Artículo</label>
                                   <span className="text-[9px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded font-bold">Soporta Markdown</span>
                               </div>
                               <textarea 
                                 value={news.content}
                                 onChange={e => setNews({...news, content: e.target.value})}
                                 className="w-full h-96 bg-surface-dark p-6 rounded-xl border border-border-dark focus:border-amber-500 outline-none text-base leading-loose resize-none font-mono text-slate-300"
                               />
                               {/* LIVE PREVIEW AREA FOR NEWS */}
                               <div className="mt-4 p-6 bg-surface-dark/50 rounded-xl border border-border-dark/50">
                                   <p className="text-[9px] font-black uppercase text-text-secondary mb-4">Vista Previa:</p>
                                   <MarkdownRenderer content={news.content} className="text-lg text-slate-300 leading-relaxed" />
                               </div>
                            </div>
                         </div>
                      </div>
                    )}
                 </div>
               )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-12 bg-background-dark">
             {/* ... Vista de Biblioteca ... */}
             <div className="max-w-7xl mx-auto space-y-16">
                <section className="space-y-8">
                   <h2 className="text-3xl font-black flex items-center gap-3 text-primary">
                     <span className="material-symbols-outlined text-4xl">school</span> Módulos en la Nube
                   </h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {myLessons.map(l => (
                        <div key={l.id} className="p-6 bg-card-dark rounded-3xl border border-border-dark flex flex-col justify-between hover:border-primary transition-all group relative animate-in fade-in zoom-in-95">
                           <button 
                             onClick={() => handleRealDelete(l.id, 'lesson')} 
                             className="absolute top-4 right-4 size-10 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white shadow-xl"
                           >
                              <span className="material-symbols-outlined text-sm">delete_forever</span>
                           </button>
                           <div>
                              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[8px] font-black uppercase tracking-widest">{l.type}</span>
                              <h3 className="text-lg font-bold mt-2 pr-8">{l.title}</h3>
                              <p className="text-[10px] text-text-secondary font-bold mt-1">UUID: {l.id}</p>
                           </div>
                           <button onClick={() => {setLesson(l); setNews(null); setStudioTab('create');}} className="mt-6 w-full py-2.5 bg-white/5 border border-border-dark rounded-xl text-[10px] font-black uppercase hover:bg-primary transition-all">Editar Módulo</button>
                        </div>
                      ))}
                      {myLessons.length === 0 && <div className="col-span-full py-20 text-center bg-white/5 rounded-[40px] border border-dashed border-border-dark italic text-text-secondary">No hay módulos dinámicos. Crea uno para empezar.</div>}
                   </div>
                </section>

                <section className="space-y-8">
                   <h2 className="text-3xl font-black flex items-center gap-3 text-amber-500">
                     <span className="material-symbols-outlined text-4xl">newspaper</span> Noticias en la Nube
                   </h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {myNews.map(n => (
                        <div key={n.id} className="p-6 bg-card-dark rounded-3xl border border-border-dark flex flex-col justify-between hover:border-amber-500 transition-all group relative animate-in fade-in zoom-in-95">
                           <button 
                             onClick={() => handleRealDelete(n.id, 'news')} 
                             className="absolute top-4 right-4 size-10 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white shadow-xl"
                           >
                              <span className="material-symbols-outlined text-sm">delete_forever</span>
                           </button>
                           <div>
                              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[8px] font-black uppercase tracking-widest">{n.category}</span>
                              <h3 className="text-lg font-bold mt-2 pr-8">{n.title}</h3>
                              <p className="text-[10px] text-text-secondary font-bold mt-1">UUID: {n.id}</p>
                           </div>
                           <button onClick={() => {setNews(n); setLesson(null); setStudioTab('create');}} className="mt-6 w-full py-2.5 bg-white/5 border border-border-dark rounded-xl text-[10px] font-black uppercase hover:bg-amber-500 transition-all">Editar Noticia</button>
                        </div>
                      ))}
                      {myNews.length === 0 && <div className="col-span-full py-20 text-center bg-white/5 rounded-[40px] border border-border-dark border-dashed italic text-text-secondary">No hay noticias dinámicas publicadas.</div>}
                   </div>
                </section>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ContentStudio;
