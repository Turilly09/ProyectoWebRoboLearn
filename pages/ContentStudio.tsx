
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { geminiService } from '../services/gemini';
import { LessonData, Section, QuizQuestion, ContentBlock } from '../types/lessons';
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
  
  // Image Generation State (Ahora usa IDs combinados: sectionIndex-blockIndex)
  const [imageStyle, setImageStyle] = useState("Photorealistic, clean lighting, 8k");
  const [isGeneratingImage, setIsGeneratingImage] = useState<string | null>(null);

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
        sections: [{ 
            title: "1. Introducción", 
            blocks: [
                { type: 'text', content: "Escribe aquí el contenido teórico.\n\nUsa doble enter para separar párrafos." },
                { type: 'image', content: "https://picsum.photos/seed/new/800/400" }
            ],
            fact: "¿Sabías que...?" 
        }],
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

  // GENERA IMAGEN PARA UN BLOQUE ESPECIFICO
  const handleGenerateBlockImage = async (secIndex: number, blockIndex: number) => {
     if (!lesson) return;
     const section = lesson.sections[secIndex];
     // Contexto: Título de sección + contenido del bloque anterior (si es texto) para dar contexto
     const prevBlock = blockIndex > 0 ? section.blocks[blockIndex - 1] : null;
     const context = prevBlock?.type === 'text' ? prevBlock.content.substring(0, 100) : "";
     const prompt = `${section.title}. ${context}`;
     
     const genId = `${secIndex}-${blockIndex}`;
     setIsGeneratingImage(genId);

     try {
         const imageUrl = await geminiService.generateImage(prompt, imageStyle);
         if (imageUrl) {
             updateBlockContent(secIndex, blockIndex, imageUrl);
         } else {
             setErrorStatus("IA no pudo generar la imagen.");
         }
     } catch(e) {
         setErrorStatus("Error generando imagen.");
     } finally {
         setIsGeneratingImage(null);
     }
  };

  // --- LOGICA DE BLOQUES ---
  const updateSectionTitle = (index: number, val: string) => {
    if (!lesson) return;
    const newSections = [...lesson.sections];
    newSections[index] = { ...newSections[index], title: val };
    setLesson({ ...lesson, sections: newSections });
  };

  const updateSectionFact = (index: number, val: string) => {
    if (!lesson) return;
    const newSections = [...lesson.sections];
    newSections[index] = { ...newSections[index], fact: val };
    setLesson({ ...lesson, sections: newSections });
  };

  const addBlock = (secIndex: number, type: 'text' | 'image' | 'video') => {
      if (!lesson) return;
      const newSections = [...lesson.sections];
      const newBlock: ContentBlock = {
          type,
          content: type === 'text' ? "Nuevo párrafo..." : "https://picsum.photos/800/400"
      };
      newSections[secIndex] = {
          ...newSections[secIndex],
          blocks: [...(newSections[secIndex].blocks || []), newBlock]
      };
      setLesson({ ...lesson, sections: newSections });
  };

  const removeBlock = (secIndex: number, blockIndex: number) => {
      if (!lesson) return;
      const newSections = [...lesson.sections];
      const newBlocks = newSections[secIndex].blocks.filter((_, i) => i !== blockIndex);
      newSections[secIndex] = { ...newSections[secIndex], blocks: newBlocks };
      setLesson({ ...lesson, sections: newSections });
  };

  const moveBlock = (secIndex: number, blockIndex: number, direction: 'up' | 'down') => {
      if (!lesson) return;
      const newSections = [...lesson.sections];
      const blocks = [...newSections[secIndex].blocks];
      
      if (direction === 'up' && blockIndex > 0) {
          [blocks[blockIndex - 1], blocks[blockIndex]] = [blocks[blockIndex], blocks[blockIndex - 1]];
      } else if (direction === 'down' && blockIndex < blocks.length - 1) {
          [blocks[blockIndex + 1], blocks[blockIndex]] = [blocks[blockIndex], blocks[blockIndex + 1]];
      }
      
      newSections[secIndex] = { ...newSections[secIndex], blocks };
      setLesson({ ...lesson, sections: newSections });
  };

  const updateBlockContent = (secIndex: number, blockIndex: number, val: string) => {
      if (!lesson) return;
      const newSections = [...lesson.sections];
      const newBlocks = [...newSections[secIndex].blocks];
      newBlocks[blockIndex] = { ...newBlocks[blockIndex], content: val };
      newSections[secIndex] = { ...newSections[secIndex], blocks: newBlocks };
      setLesson({ ...lesson, sections: newSections });
  };

  const addSection = () => {
    if (!lesson) return;
    setLesson({
      ...lesson,
      sections: [...lesson.sections, { 
          title: `Nueva Sección`, 
          blocks: [{ type: 'text', content: "" }], 
          fact: "" 
      }]
    });
  };

  const removeSection = (index: number) => {
    if (!lesson) return;
    setLesson({ ...lesson, sections: lesson.sections.filter((_, i) => i !== index) });
  };

  // QUIZ LOGIC (Simplified for brevity as it was working)
  const addQuizQuestion = () => {
    if (!lesson) return;
    setLesson({ ...lesson, quiz: [...(lesson.quiz || []), { question: "", options: ["","","",""], correctIndex: 0, hint: "" }] });
  };
  const removeQuizQuestion = (idx: number) => {
      if (!lesson) return;
      setLesson({ ...lesson, quiz: lesson.quiz.filter((_, i) => i !== idx) });
  };
  const updateQuizField = (idx: number, field: any, val: any) => {
      if (!lesson) return;
      const q = [...lesson.quiz];
      q[idx] = { ...q[idx], [field]: val };
      setLesson({ ...lesson, quiz: q });
  };
  const updateQuizOption = (qIdx: number, oIdx: number, val: string) => {
      if (!lesson) return;
      const q = [...lesson.quiz];
      const opts = [...q[qIdx].options];
      opts[oIdx] = val;
      q[qIdx] = { ...q[qIdx], options: opts };
      setLesson({ ...lesson, quiz: q });
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
             <p className="text-white">Use el SQL proporcionado anteriormente.</p>
             <button onClick={() => setShowSqlHelp(false)} className="w-full py-2 bg-primary text-white rounded-xl">Cerrar</button>
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
            {/* SIDEBAR */}
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
                  <div className="p-5 bg-card-dark rounded-2xl border border-border-dark space-y-4">
                     <h3 className="text-[10px] font-black text-purple-400 uppercase">Estilo de Imagen IA</h3>
                     <select value={imageStyle} onChange={(e) => setImageStyle(e.target.value)} className="w-full bg-surface-dark border border-border-dark rounded-xl p-3 text-xs text-white focus:border-purple-500 outline-none">
                        <option value="Photorealistic, clean lighting, 8k">Realista (Laboratorio)</option>
                        <option value="Cyberpunk, neon lights, futuristic">Cyberpunk</option>
                        <option value="Technical blueprint, schematic, blue background, white lines">Plano Técnico</option>
                        <option value="3D render, isometric, plastic texture">3D Render</option>
                     </select>
                  </div>
                </>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-left-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-primary uppercase">Propiedades</h3>
                    <button onClick={() => {setLesson(null); setNews(null);}} className="text-[10px] text-red-400 hover:text-red-300 uppercase font-bold">Cerrar</button>
                  </div>
                  {lesson && (
                    <div className="space-y-4">
                       <div className="space-y-1">
                          <label className="text-[10px] text-text-secondary uppercase font-bold">Título</label>
                          <input value={lesson.title} onChange={e => setLesson({...lesson, title: e.target.value})} className="w-full bg-card-dark p-3 rounded-xl text-xs border border-border-dark focus:border-primary outline-none" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] text-text-secondary uppercase font-bold">Subtítulo</label>
                          <input value={lesson.subtitle} onChange={e => setLesson({...lesson, subtitle: e.target.value})} className="w-full bg-card-dark p-3 rounded-xl text-xs border border-border-dark focus:border-primary outline-none" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] text-text-secondary uppercase font-bold">Ruta</label>
                          <select value={lesson.pathId || ''} onChange={e => setLesson({...lesson, pathId: e.target.value})} className="w-full bg-card-dark p-3 rounded-xl text-xs border border-border-dark focus:border-primary outline-none text-white">
                             {allPaths.map(p => <option key={p.id} value={p.id}>{p.title} ({p.level})</option>)}
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] text-text-secondary uppercase font-bold">Orden</label>
                          <input type="number" value={lesson.order} onChange={e => setLesson({...lesson, order: parseInt(e.target.value)})} className="w-full bg-card-dark p-3 rounded-xl text-xs border border-border-dark focus:border-primary outline-none" />
                       </div>
                    </div>
                  )}
                  {news && (
                      <div className="text-xs text-text-secondary">Edición de noticias no modificada para bloques aún.</div>
                  )}
                </div>
              )}
            </aside>

            {/* MAIN EDITOR AREA */}
            <div className="flex-1 bg-background-light dark:bg-background-dark overflow-y-auto relative">
               {!(lesson || news) ? (
                 <div className="flex h-full items-center justify-center opacity-10 flex-col gap-4">
                    <span className="material-symbols-outlined text-[120px]">architecture</span>
                    <p className="font-black text-2xl uppercase">Selecciona o crea un elemento</p>
                 </div>
               ) : (
                 <div className="max-w-4xl mx-auto p-12 space-y-12 animate-in fade-in zoom-in-95 duration-300">
                    {lesson && (
                      <>
                        <div className="flex items-center justify-between">
                           <h2 className="text-3xl font-black text-white">Contenido por Bloques</h2>
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
                                     onChange={e => updateSectionTitle(idx, e.target.value)}
                                     className="w-full bg-transparent text-2xl font-bold text-white placeholder-white/20 border-b border-border-dark focus:border-primary outline-none py-2"
                                     placeholder="Título de la sección..." 
                                   />
                                </div>

                                {/* BLOCKS EDITOR */}
                                <div className="space-y-4">
                                    {(section.blocks || []).map((block, bIdx) => (
                                        <div key={bIdx} className="relative p-4 bg-surface-dark rounded-xl border border-border-dark group/block hover:border-primary/50 transition-all">
                                            {/* Block Controls */}
                                            <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity z-10">
                                                <button onClick={() => moveBlock(idx, bIdx, 'up')} className="p-1 hover:bg-white/10 rounded"><span className="material-symbols-outlined text-sm">arrow_upward</span></button>
                                                <button onClick={() => moveBlock(idx, bIdx, 'down')} className="p-1 hover:bg-white/10 rounded"><span className="material-symbols-outlined text-sm">arrow_downward</span></button>
                                                <button onClick={() => removeBlock(idx, bIdx)} className="p-1 hover:bg-red-500/20 text-red-400 rounded"><span className="material-symbols-outlined text-sm">close</span></button>
                                            </div>

                                            {block.type === 'text' && (
                                                <div className="space-y-2">
                                                    <span className="text-[9px] font-bold uppercase text-text-secondary flex items-center gap-1"><span className="material-symbols-outlined text-xs">text_fields</span> Texto (Markdown)</span>
                                                    <textarea 
                                                        value={block.content}
                                                        onChange={e => updateBlockContent(idx, bIdx, e.target.value)}
                                                        className="w-full h-32 bg-background-dark/50 rounded-lg p-3 text-sm text-slate-300 resize-y outline-none focus:ring-1 focus:ring-primary font-mono"
                                                    />
                                                    {/* Mini Preview */}
                                                    <div className="p-3 bg-black/20 rounded-lg border border-border-dark/50">
                                                        <MarkdownRenderer content={block.content} className="text-xs text-slate-400" />
                                                    </div>
                                                </div>
                                            )}

                                            {block.type === 'image' && (
                                                <div className="space-y-2">
                                                     <div className="flex justify-between">
                                                        <span className="text-[9px] font-bold uppercase text-purple-400 flex items-center gap-1"><span className="material-symbols-outlined text-xs">image</span> Imagen</span>
                                                        <button 
                                                            onClick={() => handleGenerateBlockImage(idx, bIdx)}
                                                            disabled={isGeneratingImage !== null}
                                                            className="px-2 py-0.5 bg-purple-600 rounded text-[9px] font-black uppercase hover:bg-purple-500 flex items-center gap-1"
                                                        >
                                                            {isGeneratingImage === `${idx}-${bIdx}` ? '...' : <><span className="material-symbols-outlined text-[10px]">auto_awesome</span> Generar</>}
                                                        </button>
                                                     </div>
                                                     <input 
                                                        value={block.content}
                                                        onChange={e => updateBlockContent(idx, bIdx, e.target.value)}
                                                        className="w-full bg-background-dark/50 rounded-lg p-3 text-xs outline-none focus:ring-1 focus:ring-purple-500"
                                                        placeholder="URL de la imagen..."
                                                     />
                                                     {block.content && (
                                                         <div className="h-40 rounded-lg overflow-hidden bg-black relative">
                                                             <img src={block.content} className="w-full h-full object-cover" alt="preview" />
                                                         </div>
                                                     )}
                                                </div>
                                            )}

                                            {block.type === 'video' && (
                                                <div className="space-y-2">
                                                     <span className="text-[9px] font-bold uppercase text-red-400 flex items-center gap-1"><span className="material-symbols-outlined text-xs">play_circle</span> Video (Embed)</span>
                                                     <input 
                                                        value={block.content}
                                                        onChange={e => updateBlockContent(idx, bIdx, e.target.value)}
                                                        className="w-full bg-background-dark/50 rounded-lg p-3 text-xs outline-none focus:ring-1 focus:ring-red-500"
                                                        placeholder="https://www.youtube.com/embed/..."
                                                     />
                                                     {block.content && (
                                                         <div className="aspect-video rounded-lg overflow-hidden bg-black">
                                                             <iframe src={block.content} className="w-full h-full" frameBorder="0"></iframe>
                                                         </div>
                                                     )}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Add Block Buttons */}
                                    <div className="flex gap-2 pt-2 justify-center">
                                        <button onClick={() => addBlock(idx, 'text')} className="px-3 py-1.5 bg-surface-dark border border-border-dark hover:border-primary text-text-secondary hover:text-white rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 transition-all">
                                            <span className="material-symbols-outlined text-sm">add</span> Texto
                                        </button>
                                        <button onClick={() => addBlock(idx, 'image')} className="px-3 py-1.5 bg-surface-dark border border-border-dark hover:border-purple-500 text-text-secondary hover:text-white rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 transition-all">
                                            <span className="material-symbols-outlined text-sm">add_photo_alternate</span> Imagen
                                        </button>
                                        <button onClick={() => addBlock(idx, 'video')} className="px-3 py-1.5 bg-surface-dark border border-border-dark hover:border-red-500 text-text-secondary hover:text-white rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 transition-all">
                                            <span className="material-symbols-outlined text-sm">video_library</span> Video
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4 border-t border-border-dark/50">
                                   <label className="text-[10px] font-bold uppercase text-blue-400 flex items-center gap-2"><span className="material-symbols-outlined text-sm">lightbulb</span> Dato Curioso</label>
                                   <input 
                                      value={section.fact}
                                      onChange={e => updateSectionFact(idx, e.target.value)}
                                      className="w-full bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-200 focus:border-blue-500 outline-none"
                                   />
                                </div>
                             </div>
                           ))}
                        </div>
                        
                        <div className="h-px bg-border-dark my-12"></div>

                        {/* QUIZ SECTION */}
                        <div className="p-8 bg-surface-dark rounded-3xl border border-border-dark space-y-8">
                           <div className="flex justify-between items-center">
                             <h3 className="text-xl font-black text-white flex items-center gap-3"><span className="material-symbols-outlined text-primary">quiz</span> Evaluación</h3>
                             <button onClick={addQuizQuestion} className="px-4 py-2 bg-white/5 border border-border-dark rounded-xl text-[10px] font-black uppercase hover:bg-primary hover:text-white transition-all">Añadir Pregunta</button>
                           </div>
                           <div className="space-y-6">
                            {(lesson.quiz || []).map((q, qIndex) => (
                                <div key={qIndex} className="p-6 bg-black/20 rounded-2xl border border-border-dark relative">
                                    <button onClick={() => removeQuizQuestion(qIndex)} className="absolute top-4 right-4 text-red-500 hover:text-white"><span className="material-symbols-outlined text-sm">delete</span></button>
                                    <div className="space-y-4 pr-12">
                                        <input value={q.question} onChange={e => updateQuizField(qIndex, 'question', e.target.value)} className="w-full bg-card-dark p-3 rounded-xl border border-border-dark focus:border-primary outline-none text-white font-bold" placeholder="Pregunta..." />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {q.options.map((opt, optIndex) => (
                                                <div key={optIndex} className="flex items-center gap-2">
                                                    <input type="radio" checked={q.correctIndex === optIndex} onChange={() => updateQuizField(qIndex, 'correctIndex', optIndex)} className="accent-primary size-4" />
                                                    <input value={opt} onChange={e => updateQuizOption(qIndex, optIndex, e.target.value)} className={`w-full bg-card-dark p-3 rounded-xl border text-sm outline-none ${q.correctIndex === optIndex ? 'border-primary text-primary' : 'border-border-dark'}`} placeholder={`Opción ${optIndex+1}`} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                           </div>
                        </div>
                      </>
                    )}
                    {news && (
                        <div className="text-center text-text-secondary py-20">El editor de noticias no está actualizado para bloques todavía.</div>
                    )}
                 </div>
               )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-12 bg-background-dark">
             {/* LIBRARY VIEW (Simplificado) */}
             <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                 {myLessons.map(l => (
                     <div key={l.id} className="p-6 bg-card-dark rounded-3xl border border-border-dark hover:border-primary group relative">
                         <button onClick={() => handleRealDelete(l.id, 'lesson')} className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><span className="material-symbols-outlined">delete</span></button>
                         <h3 className="font-bold text-lg">{l.title}</h3>
                         <button onClick={() => {setLesson(l); setNews(null); setStudioTab('create');}} className="mt-4 w-full py-2 bg-primary/10 text-primary rounded-lg font-bold text-xs">Editar</button>
                     </div>
                 ))}
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ContentStudio;
