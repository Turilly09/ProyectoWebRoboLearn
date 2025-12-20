import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { geminiService } from '../services/gemini';
import { LessonData, PracticeStep, Section } from '../types/lessons';
import { NewsItem, LearningPath } from '../types';
import { saveDynamicLesson, getAllDynamicLessonsList, deleteDynamicLesson } from '../content/registry';
import { saveDynamicNews, getDynamicNews, deleteDynamicNews } from '../content/newsRegistry';
import { getAllPaths } from '../content/pathRegistry';

type StudioTab = 'create' | 'library';
type ContentType = 'lesson' | 'news';
type EditorView = 'edit' | 'preview' | 'code';

const ContentStudio: React.FC = () => {
  const navigate = useNavigate();
  
  const [studioTab, setStudioTab] = useState<StudioTab>('create');
  const [contentType, setContentType] = useState<ContentType>('lesson');
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [news, setNews] = useState<NewsItem | null>(null);
  const [activeTab, setActiveTab] = useState<EditorView>('edit');
  const [status, setStatus] = useState<string>("");
  const [errorStatus, setErrorStatus] = useState<string>("");

  const [myLessons, setMyLessons] = useState<LessonData[]>([]);
  const [myNews, setMyNews] = useState<NewsItem[]>([]);
  const [allPaths, setAllPaths] = useState<LearningPath[]>([]);

  const loadData = async () => {
    try {
      const lessons = await getAllDynamicLessonsList();
      const newsItems = await getDynamicNews();
      const paths = await getAllPaths();
      
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
    window.addEventListener('pathsUpdated', handleUpdate);
    return () => {
      window.removeEventListener('lessonsUpdated', handleUpdate);
      window.removeEventListener('newsUpdated', handleUpdate);
      window.removeEventListener('pathsUpdated', handleUpdate);
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
        sections: [
          { 
            title: "1. Introducción", 
            content: "Contenido de la sección...", 
            image: "https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&q=80&w=1000", 
            fact: "Dato curioso técnico." 
          }
        ],
        steps: [{ title: "Paso 1", desc: "Instrucciones del simulador..." }],
        simulatorUrl: "https://www.falstad.com/circuit/circuitjs.html",
        quiz: {
          question: "¿Pregunta de validación?",
          options: ["Respuesta A", "Respuesta B", "Respuesta C", "Respuesta D"],
          correctIndex: 0,
          hint: "Busca en el texto..."
        }
      };
      setLesson(emptyLesson);
      setNews(null);
    } else {
      const emptyNews: NewsItem = {
        id: `n${Date.now()}`,
        title: "Nueva Noticia",
        excerpt: "Extracto breve que aparecerá en el feed...",
        content: "Escribe aquí el cuerpo completo de la noticia...",
        date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
        author: JSON.parse(localStorage.getItem('robo_user') || '{}').name || 'Editor Técnico',
        category: 'Tecnología',
        image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1000",
        readTime: "5 min"
      };
      setNews(emptyNews);
      setLesson(null);
    }
    setStudioTab('create');
    setActiveTab('edit');
  };

  const handlePublish = async () => {
    setStatus("Guardando...");
    setErrorStatus("");
    try {
      if (lesson) {
        await saveDynamicLesson(lesson);
        setStatus("¡Módulo guardado!");
      } else if (news) {
        await saveDynamicNews(news);
        setStatus("¡Noticia publicada!");
      }
      setTimeout(() => setStatus(""), 3000);
      loadData();
    } catch (err: any) {
      setErrorStatus("Error al guardar: " + err.message);
    }
  };

  // ACTUALIZACIÓN OPTIMISTA: Borramos del estado local antes de esperar a la DB
  const handleDeleteLesson = async (id: string, title: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el módulo "${title}"?`)) {
      // Guardamos copia por si falla
      const backup = [...myLessons];
      // Borrado optimista
      setMyLessons(prev => prev.filter(l => l.id !== id));
      setStatus("Eliminando...");
      
      try {
        await deleteDynamicLesson(id);
        setStatus("Módulo eliminado.");
        setTimeout(() => setStatus(""), 3000);
      } catch (err: any) {
        // Si falla, restauramos
        setMyLessons(backup);
        setErrorStatus("Error al borrar de la base de datos.");
        setTimeout(() => setErrorStatus(""), 5000);
      }
    }
  };

  const handleDeleteNews = async (id: string, title: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la noticia "${title}"?`)) {
      const backup = [...myNews];
      setMyNews(prev => prev.filter(n => n.id !== id));
      setStatus("Eliminando...");
      
      try {
        await deleteDynamicNews(id);
        setStatus("Noticia eliminada.");
        setTimeout(() => setStatus(""), 3000);
      } catch (err: any) {
        setMyNews(backup);
        setErrorStatus("Error al borrar de la base de datos.");
        setTimeout(() => setErrorStatus(""), 5000);
      }
    }
  };

  const handleGenerateAI = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setErrorStatus("");
    try {
      if (contentType === 'lesson') {
        const draft = await geminiService.generateLessonDraft(topic);
        if (draft) {
          setLesson({ ...draft, id: `m${Date.now()}`, pathId: allPaths[0]?.id || 'e101', order: 10, type: 'theory' });
          setNews(null);
        }
      } else {
        const draft = await geminiService.generateNewsDraft(topic);
        if (draft) {
          setNews({ ...draft, id: `n${Date.now()}`, date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) });
          setLesson(null);
        }
      }
    } catch (err: any) {
      setErrorStatus("IA ocupada o error de conexión.");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateSection = (idx: number, field: keyof Section, val: string) => {
    if (!lesson) return;
    const ns = [...lesson.sections];
    ns[idx] = { ...ns[idx], [field]: val };
    setLesson({ ...lesson, sections: ns });
  };

  const updateStep = (idx: number, field: keyof PracticeStep, val: string) => {
    if (!lesson || !lesson.steps) return;
    const nst = [...lesson.steps];
    nst[idx] = { ...nst[idx], [field]: val };
    setLesson({ ...lesson, steps: nst });
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
          <div className="flex bg-card-dark p-1 rounded-xl border border-border-dark">
             <button onClick={() => {setStudioTab('create'); setContentType('lesson');}} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${studioTab === 'create' ? 'bg-primary' : 'text-text-secondary'}`}>Diseño</button>
             <button onClick={() => setStudioTab('library')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${studioTab === 'library' ? 'bg-purple-600' : 'text-text-secondary'}`}>Biblioteca</button>
          </div>
          {(lesson || news) && studioTab === 'create' && (
            <button onClick={handlePublish} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-[9px] font-black shadow-lg shadow-green-600/20 uppercase transition-all">
              {news ? 'Publicar Noticia' : 'Guardar Módulo'}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {studioTab === 'create' ? (
          <>
            <aside className="w-80 border-r border-border-dark flex flex-col bg-surface-dark/50 shrink-0 overflow-y-auto">
               {!(lesson || news) ? (
                 <div className="p-6 space-y-6">
                    <div className="flex bg-card-dark p-1 rounded-xl border border-border-dark">
                      <button onClick={() => setContentType('lesson')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${contentType === 'lesson' ? 'bg-primary' : 'text-text-secondary'}`}>Módulos</button>
                      <button onClick={() => setContentType('news')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${contentType === 'news' ? 'bg-amber-600' : 'text-text-secondary'}`}>Noticias</button>
                    </div>
                    <button onClick={handleCreateEmpty} className={`w-full py-4 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all ${contentType === 'news' ? 'bg-amber-600 shadow-amber-600/20' : 'bg-primary shadow-primary/20'}`}>
                      {contentType === 'news' ? 'Nueva Noticia Manual' : 'Nuevo Módulo Manual'}
                    </button>

                    <div className="p-5 bg-card-dark rounded-2xl border border-border-dark space-y-4">
                       <h3 className="text-[10px] font-black text-primary uppercase tracking-widest">Generador IA</h3>
                       <textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder={contentType === 'news' ? "Ej: Nuevo descubrimiento en Marte..." : "Ej: Protocolo I2C avanzado..."} className="w-full h-24 bg-surface-dark border border-border-dark rounded-xl p-3 text-xs resize-none" />
                       <button onClick={handleGenerateAI} disabled={isGenerating} className="w-full py-3 bg-white/5 border border-primary/30 text-primary text-[10px] font-black rounded-xl uppercase">
                         {isGenerating ? 'Generando...' : 'Generar Borrador'}
                       </button>
                    </div>
                 </div>
               ) : (
                 <div className="p-5 space-y-6">
                    {news ? (
                      <div className="space-y-6">
                         <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-4">
                            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Ajustes de Noticia</h4>
                            <div className="space-y-3">
                               <div>
                                  <label className="text-[9px] font-bold text-text-secondary uppercase">Categoría</label>
                                  <select 
                                    value={news.category} 
                                    onChange={e => setNews({...news, category: e.target.value as any})}
                                    className="w-full bg-card-dark border border-border-dark rounded-lg p-2 text-[10px] font-bold mt-1"
                                  >
                                    {['Tecnología', 'Comunidad', 'Tutorial', 'Evento'].map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                               </div>
                               <div>
                                  <label className="text-[9px] font-bold text-text-secondary uppercase">Imagen URL</label>
                                  <input value={news.image} onChange={e => setNews({...news, image: e.target.value})} className="w-full bg-card-dark border border-border-dark rounded-lg p-2 text-[10px] mt-1" />
                               </div>
                               <div>
                                  <label className="text-[9px] font-bold text-text-secondary uppercase">Resumen (Excerpt)</label>
                                  <textarea value={news.excerpt} onChange={e => setNews({...news, excerpt: e.target.value})} className="w-full h-20 bg-card-dark border border-border-dark rounded-lg p-2 text-[10px] resize-none mt-1" />
                               </div>
                            </div>
                         </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                         <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-4">
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest">Ajustes del Módulo</h4>
                            <div className="flex bg-surface-dark p-1 rounded-xl border border-border-dark">
                              <button onClick={() => setLesson({...lesson!, type: 'theory'})} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase ${lesson?.type === 'theory' ? 'bg-primary' : 'text-text-secondary'}`}>Teoría</button>
                              <button onClick={() => setLesson({...lesson!, type: 'practice'})} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase ${lesson?.type === 'practice' ? 'bg-amber-500' : 'text-text-secondary'}`}>Práctica</button>
                            </div>
                            <div className="space-y-2 mt-4">
                               <label className="text-[9px] font-bold text-text-secondary uppercase">Ruta de Destino</label>
                               <select 
                                  value={lesson?.pathId} 
                                  onChange={e => setLesson({...lesson!, pathId: e.target.value})}
                                  className="w-full bg-card-dark border border-border-dark rounded-lg p-2 text-[10px] font-bold mt-1"
                                >
                                  {allPaths.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                               <label className="text-[9px] font-bold text-text-secondary uppercase">Posición (Orden)</label>
                               <input 
                                  type="number" 
                                  value={lesson?.order} 
                                  onChange={e => setLesson({...lesson!, order: parseInt(e.target.value)})}
                                  className="w-full bg-card-dark border border-border-dark rounded-lg p-2 text-[10px] font-bold mt-1"
                                />
                             </div>
                         </div>
                      </div>
                    )}
                    <button onClick={() => {setLesson(null); setNews(null);}} className="w-full py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase">Descartar Borrador</button>
                    {status && <div className="p-3 bg-green-500/10 text-green-500 text-[10px] font-bold text-center rounded-xl">{status}</div>}
                    {errorStatus && <div className="p-3 bg-red-500/10 text-red-500 text-[10px] font-bold text-center rounded-xl">{errorStatus}</div>}
                 </div>
               )}
            </aside>

            <div className="flex-1 overflow-hidden flex flex-col bg-background-light dark:bg-background-dark/30">
               {news ? (
                 <div className="flex-1 overflow-y-auto p-12">
                    <div className="max-w-4xl mx-auto space-y-8">
                       <input 
                        value={news.title} 
                        onChange={e => setNews({...news, title: e.target.value})} 
                        className="w-full bg-transparent text-4xl font-black outline-none text-slate-900 dark:text-white" 
                        placeholder="Título de la noticia..." 
                       />
                       <div className="p-8 bg-white dark:bg-card-dark rounded-[40px] border border-border-dark shadow-xl">
                          <textarea 
                            value={news.content} 
                            onChange={e => setNews({...news, content: e.target.value})} 
                            className="w-full h-[600px] bg-transparent text-lg text-slate-600 dark:text-text-secondary outline-none resize-none leading-relaxed" 
                            placeholder="Cuerpo de la noticia..." 
                          />
                       </div>
                    </div>
                 </div>
               ) : lesson ? (
                 lesson.type === 'practice' ? (
                   <div className="flex-1 flex overflow-hidden">
                      <aside className="w-72 border-r border-border-dark bg-black/20 flex flex-col shrink-0">
                         <div className="p-4 space-y-4 overflow-y-auto flex-1">
                            <label className="text-[9px] font-bold text-text-secondary uppercase">Pasos de Guía</label>
                            {lesson.steps?.map((step, idx) => (
                              <div key={idx} className="p-3 bg-card-dark rounded-xl border border-border-dark space-y-2">
                                 <input value={step.title} onChange={e => updateStep(idx, 'title', e.target.value)} className="w-full bg-transparent text-[10px] font-black border-b border-white/5 outline-none" />
                                 <textarea value={step.desc} onChange={e => updateStep(idx, 'desc', e.target.value)} className="w-full h-20 bg-transparent text-[10px] text-text-secondary outline-none resize-none" />
                              </div>
                            ))}
                         </div>
                      </aside>
                      <main className="flex-1 bg-black"><iframe src={lesson.simulatorUrl} className="w-full h-full border-none" /></main>
                   </div>
                 ) : (
                   <div className="flex-1 overflow-y-auto p-12">
                      <div className="max-w-4xl mx-auto space-y-8">
                         {lesson.sections.map((sec, idx) => (
                           <div key={idx} className="p-8 bg-white dark:bg-card-dark rounded-[40px] border border-border-dark space-y-4">
                              <input value={sec.title} onChange={e => updateSection(idx, 'title', e.target.value)} className="w-full bg-transparent text-xl font-bold border-b border-border-dark pb-2 outline-none" />
                              <textarea value={sec.content} onChange={e => updateSection(idx, 'content', e.target.value)} className="w-full h-40 bg-surface-dark/50 p-4 rounded-xl text-sm border border-border-dark resize-none" />
                           </div>
                         ))}
                      </div>
                   </div>
                 )
               ) : (
                 <div className="flex-1 flex items-center justify-center flex-col opacity-20">
                    <span className="material-symbols-outlined text-[120px]">post_add</span>
                    <p className="text-xl font-black uppercase tracking-widest text-white">Crea contenido para la plataforma</p>
                 </div>
               )}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-12 bg-background-dark">
             <div className="max-w-7xl mx-auto space-y-16">
                <section className="space-y-8">
                   <h2 className="text-3xl font-black flex items-center gap-3"><span className="material-symbols-outlined text-primary">school</span> Módulos de Formación Dinámicos</h2>
                   {status && <div className="fixed top-24 right-8 z-[100] p-4 bg-green-500 text-white rounded-2xl shadow-xl font-bold text-xs animate-bounce">{status}</div>}
                   {errorStatus && <div className="fixed top-24 right-8 z-[100] p-4 bg-red-500 text-white rounded-2xl shadow-xl font-bold text-xs">{errorStatus}</div>}
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {myLessons.map(l => (
                        <div key={l.id} className="p-6 bg-card-dark rounded-3xl border border-border-dark flex flex-col justify-between hover:border-primary transition-all group relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteLesson(l.id, l.title); }} 
                                className="size-8 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg"
                                title="Eliminar Módulo"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                           </div>
                           
                           <div>
                              <div className="flex justify-between items-start mb-2">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${l.type === 'practice' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>{l.type}</span>
                              </div>
                              <h3 className="text-lg font-bold mt-2 pr-8">{l.title}</h3>
                              <p className="text-[10px] text-text-secondary uppercase font-bold mt-1">ID: {l.id}</p>
                           </div>
                           <button onClick={() => {setLesson(l); setNews(null); setStudioTab('create');}} className="mt-6 w-full py-2.5 bg-white/5 border border-border-dark rounded-xl text-[10px] font-black uppercase hover:bg-primary transition-all">Editar Módulo</button>
                        </div>
                      ))}
                      {myLessons.length === 0 && <div className="col-span-full py-12 text-center bg-white/5 rounded-3xl border border-dashed border-border-dark"><p className="text-text-secondary text-sm italic">No hay módulos dinámicos creados.</p></div>}
                   </div>
                </section>

                <section className="space-y-8">
                   <h2 className="text-3xl font-black flex items-center gap-3"><span className="material-symbols-outlined text-amber-500">newspaper</span> Noticias y Blog Dinámicos</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {myNews.map(n => (
                        <div key={n.id} className="p-6 bg-card-dark rounded-3xl border border-border-dark flex flex-col justify-between hover:border-amber-500 transition-all group relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteNews(n.id, n.title); }} 
                                className="size-8 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg"
                                title="Eliminar Noticia"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                           </div>
                           
                           <div>
                              <div className="flex justify-between items-start mb-2">
                                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[8px] font-black uppercase">{n.category}</span>
                              </div>
                              <h3 className="text-lg font-bold mt-2 pr-8">{n.title}</h3>
                              <p className="text-[10px] text-text-secondary uppercase font-bold mt-1">ID: {n.id}</p>
                           </div>
                           <button onClick={() => {setNews(n); setLesson(null); setStudioTab('create');}} className="mt-6 w-full py-2.5 bg-white/5 border border-border-dark rounded-xl text-[10px] font-black uppercase hover:bg-amber-500 transition-all">Editar Noticia</button>
                        </div>
                      ))}
                      {myNews.length === 0 && <div className="col-span-full py-12 text-center bg-white/5 rounded-3xl border border-dashed border-border-dark"><p className="text-text-secondary text-sm italic">No hay noticias dinámicas creadas.</p></div>}
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