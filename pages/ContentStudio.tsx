
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/gemini';
import { saveDynamicLesson, deleteDynamicLesson, getAllDynamicLessonsList } from '../content/registry';
import { saveDynamicNews, deleteDynamicNews, getAllNews } from '../content/newsRegistry';
import { LessonData } from '../types/lessons';
import { NewsItem } from '../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

const ContentStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'news'>('lessons');
  const [items, setItems] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<string | null>(null); // "secIdx-blockIdx"

  const loadItems = async () => {
    setIsLoading(true);
    if (activeTab === 'lessons') {
      const lessons = await getAllDynamicLessonsList();
      setItems(lessons);
    } else {
      const news = await getAllNews();
      setItems(news);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, [activeTab]);

  const handleCreateNew = () => {
    if (activeTab === 'lessons') {
      setEditingItem({
        id: `custom_lesson_${Date.now()}`,
        title: '',
        subtitle: '',
        pathId: 'e101', // Default path
        order: 1,
        type: 'theory',
        sections: [],
        quiz: []
      } as LessonData);
    } else {
      setEditingItem({
        id: `news_${Date.now()}`,
        title: '',
        excerpt: '',
        content: '',
        category: 'Tecnología',
        date: new Date().toLocaleDateString(),
        author: 'Editor',
        image: '',
        readTime: '5 min'
      } as NewsItem);
    }
  };

  const handleSave = async () => {
    try {
      if (activeTab === 'lessons') {
        await saveDynamicLesson(editingItem as LessonData);
      } else {
        await saveDynamicNews(editingItem as NewsItem);
      }
      setEditingItem(null);
      loadItems();
    } catch (e) {
      alert("Error guardando: " + e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar esto?")) return;
    try {
      if (activeTab === 'lessons') {
        await deleteDynamicLesson(id);
      } else {
        await deleteDynamicNews(id);
      }
      loadItems();
    } catch (e) {
      alert("Error eliminando: " + e);
    }
  };

  // --- GEMINI HELPERS ---

  const handleGenerateLessonDraft = async () => {
    const topic = prompt("¿Sobre qué tema quieres generar la lección?");
    if (!topic) return;
    
    setIsGenerating(true);
    const draft = await geminiService.generateLessonDraft(topic);
    setIsGenerating(false);

    if (draft) {
      setEditingItem({
        ...editingItem,
        title: draft.title || editingItem.title,
        subtitle: draft.subtitle || editingItem.subtitle,
        sections: draft.sections || [],
        quiz: draft.quiz || []
      });
    } else {
      alert("No se pudo generar el borrador.");
    }
  };

  const handleGenerateNewsDraft = async () => {
    const headline = prompt("Titular o tema de la noticia:");
    if (!headline) return;

    setIsGenerating(true);
    const draft = await geminiService.generateNewsDraft(headline);
    setIsGenerating(false);

    if (draft) {
      setEditingItem({
        ...editingItem,
        ...draft,
        date: new Date().toLocaleDateString(),
        author: 'AI Editor'
      });
    } else {
      alert("Error generando noticia.");
    }
  };

  const handleGenerateBlockImage = async (secIdx: number, blockIdx: number) => {
    const lesson = editingItem as LessonData;
    // Context from the section title or previous text block
    const section = lesson.sections[secIdx];
    const promptText = `Technical illustration for "${lesson.title} - ${section.title}". Educational, clean, vector style.`;
    
    setIsGeneratingImage(`${secIdx}-${blockIdx}`);
    const url = await geminiService.generateImage(promptText, "flat vector art");
    setIsGeneratingImage(null);

    if (url) {
      const newSections = [...lesson.sections];
      newSections[secIdx].blocks[blockIdx].content = url;
      setEditingItem({ ...lesson, sections: newSections });
    }
  };

  // --- LESSON EDITING HELPERS ---

  const addSection = () => {
    const l = editingItem as LessonData;
    setEditingItem({
      ...l,
      sections: [...l.sections, { title: 'Nueva Sección', blocks: [], fact: '' }]
    });
  };

  const addBlock = (secIdx: number, type: 'text' | 'image' | 'video' | 'simulator') => {
    const l = editingItem as LessonData;
    const newSections = [...l.sections];
    newSections[secIdx].blocks.push({ type, content: '' });
    setEditingItem({ ...l, sections: newSections });
  };

  const updateBlockContent = (secIdx: number, blockIdx: number, val: string) => {
    const l = editingItem as LessonData;
    const newSections = [...l.sections];
    newSections[secIdx].blocks[blockIdx].content = val;
    setEditingItem({ ...l, sections: newSections });
  };
  
  const removeBlock = (secIdx: number, blockIdx: number) => {
      const l = editingItem as LessonData;
      const newSections = [...l.sections];
      newSections[secIdx].blocks.splice(blockIdx, 1);
      setEditingItem({ ...l, sections: newSections });
  };

  // --- RENDERERS ---

  if (editingItem) {
    return (
      <div className="flex-1 bg-background-dark p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto bg-card-dark border border-border-dark rounded-3xl p-8 space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-white">Editor de {activeTab === 'lessons' ? 'Lección' : 'Noticia'}</h2>
            <div className="flex gap-4">
              <button onClick={() => setEditingItem(null)} className="text-text-secondary hover:text-white">Cancelar</button>
              <button onClick={handleSave} className="px-6 py-2 bg-green-500 text-white rounded-xl font-bold">Guardar</button>
            </div>
          </div>

          {/* AI ACTIONS */}
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3 text-purple-400">
               <span className="material-symbols-outlined">auto_awesome</span>
               <span className="text-xs font-black uppercase">Gemini AI Tools</span>
            </div>
            <button 
              onClick={activeTab === 'lessons' ? handleGenerateLessonDraft : handleGenerateNewsDraft}
              disabled={isGenerating}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold uppercase transition-all"
            >
              {isGenerating ? 'Generando...' : 'Generar Borrador Completo'}
            </button>
          </div>

          {/* FORM FIELDS */}
          <div className="space-y-4">
             <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Título</label>
                <input 
                  value={editingItem.title} 
                  onChange={e => setEditingItem({...editingItem, title: e.target.value})}
                  className="w-full bg-background-dark p-3 rounded-xl border border-border-dark text-white outline-none focus:border-primary"
                />
             </div>
             
             {activeTab === 'lessons' ? (
               <>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-secondary uppercase">Subtítulo</label>
                    <input 
                      value={(editingItem as LessonData).subtitle} 
                      onChange={e => setEditingItem({...editingItem, subtitle: e.target.value})}
                      className="w-full bg-background-dark p-3 rounded-xl border border-border-dark text-white outline-none focus:border-primary"
                    />
                 </div>
                 
                 {/* SECTIONS EDITOR */}
                 <div className="space-y-6 pt-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">Secciones de Contenido</h3>
                        <button onClick={addSection} className="text-xs text-primary font-bold uppercase hover:underline">+ Añadir Sección</button>
                    </div>
                    {(editingItem as LessonData).sections.map((section, idx) => (
                       <div key={idx} className="p-6 bg-surface-dark rounded-2xl border border-border-dark space-y-4">
                          <input 
                            value={section.title}
                            onChange={e => {
                                const newSecs = [...(editingItem as LessonData).sections];
                                newSecs[idx].title = e.target.value;
                                setEditingItem({...editingItem, sections: newSecs});
                            }}
                            className="w-full bg-transparent text-lg font-bold text-white border-b border-white/10 pb-2 mb-4 outline-none focus:border-primary"
                            placeholder="Título de Sección"
                          />
                          
                          {/* BLOCKS */}
                          <div className="space-y-4 pl-4 border-l-2 border-white/5">
                             {section.blocks.map((block, bIdx) => (
                                <div key={bIdx} className="bg-background-dark p-4 rounded-xl relative group">
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                        <span className="text-[9px] uppercase bg-white/10 px-2 py-1 rounded text-white">{block.type}</span>
                                        <button onClick={() => removeBlock(idx, bIdx)} className="text-red-500"><span className="material-symbols-outlined text-sm">delete</span></button>
                                    </div>

                                    {block.type === 'text' && (
                                        <textarea 
                                            value={block.content}
                                            onChange={e => updateBlockContent(idx, bIdx, e.target.value)}
                                            className="w-full h-24 bg-transparent text-sm text-slate-300 outline-none resize-y"
                                            placeholder="Escribe contenido en Markdown..."
                                        />
                                    )}

                                    {block.type === 'image' && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[9px] uppercase font-bold text-text-secondary">URL Imagen</label>
                                                <button 
                                                    onClick={() => handleGenerateBlockImage(idx, bIdx)}
                                                    disabled={isGeneratingImage !== null}
                                                    className="text-[9px] bg-purple-600 px-2 py-0.5 rounded text-white uppercase font-bold"
                                                >
                                                    {isGeneratingImage === `${idx}-${bIdx}` ? 'Generando...' : 'Generar AI'}
                                                </button>
                                            </div>
                                            <input 
                                                value={block.content}
                                                onChange={e => updateBlockContent(idx, bIdx, e.target.value)}
                                                className="w-full bg-white/5 rounded p-2 text-xs text-white"
                                            />
                                            {block.content && <img src={block.content} className="h-20 rounded object-cover" alt="prev" />}
                                        </div>
                                    )}

                                    {(block.type === 'video' || block.type === 'simulator') && (
                                        <div className="space-y-2">
                                            <label className="text-[9px] uppercase font-bold text-text-secondary">URL {block.type}</label>
                                            <input 
                                                value={block.content}
                                                onChange={e => updateBlockContent(idx, bIdx, e.target.value)}
                                                className="w-full bg-white/5 rounded p-2 text-xs text-white"
                                            />
                                        </div>
                                    )}
                                </div>
                             ))}
                             
                             <div className="flex gap-2 pt-2">
                                <button onClick={() => addBlock(idx, 'text')} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] uppercase font-bold text-white">+ Texto</button>
                                <button onClick={() => addBlock(idx, 'image')} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] uppercase font-bold text-white">+ Imagen</button>
                                <button onClick={() => addBlock(idx, 'video')} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] uppercase font-bold text-white">+ Video</button>
                                <button onClick={() => addBlock(idx, 'simulator')} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] uppercase font-bold text-white">+ Simulador</button>
                             </div>
                          </div>
                          
                          <div className="pt-4">
                              <label className="text-[10px] font-bold text-blue-400 uppercase">Dato Curioso (Fact)</label>
                              <input 
                                value={section.fact}
                                onChange={e => {
                                    const newSecs = [...(editingItem as LessonData).sections];
                                    newSecs[idx].fact = e.target.value;
                                    setEditingItem({...editingItem, sections: newSecs});
                                }}
                                className="w-full bg-blue-500/10 border border-blue-500/20 text-blue-100 text-xs p-2 rounded-lg mt-1"
                              />
                          </div>
                       </div>
                    ))}
                 </div>
               </>
             ) : (
               <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-secondary uppercase">Resumen</label>
                    <textarea 
                      value={(editingItem as NewsItem).excerpt} 
                      onChange={e => setEditingItem({...editingItem, excerpt: e.target.value})}
                      className="w-full h-20 bg-background-dark p-3 rounded-xl border border-border-dark text-white outline-none focus:border-primary resize-none"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-secondary uppercase">Contenido</label>
                    <textarea 
                      value={(editingItem as NewsItem).content} 
                      onChange={e => setEditingItem({...editingItem, content: e.target.value})}
                      className="w-full h-64 bg-background-dark p-3 rounded-xl border border-border-dark text-white outline-none focus:border-primary resize-y"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-secondary uppercase">URL Imagen</label>
                    <input 
                      value={(editingItem as NewsItem).image} 
                      onChange={e => setEditingItem({...editingItem, image: e.target.value})}
                      className="w-full bg-background-dark p-3 rounded-xl border border-border-dark text-white outline-none focus:border-primary"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-text-secondary uppercase">Categoría</label>
                        <input 
                          value={(editingItem as NewsItem).category} 
                          onChange={e => setEditingItem({...editingItem, category: e.target.value as any})}
                          className="w-full bg-background-dark p-3 rounded-xl border border-border-dark text-white outline-none focus:border-primary"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-text-secondary uppercase">Tiempo Lectura</label>
                        <input 
                          value={(editingItem as NewsItem).readTime} 
                          onChange={e => setEditingItem({...editingItem, readTime: e.target.value})}
                          className="w-full bg-background-dark p-3 rounded-xl border border-border-dark text-white outline-none focus:border-primary"
                        />
                    </div>
                 </div>
               </>
             )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background-dark p-6 overflow-hidden flex flex-col">
       <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col space-y-6">
          <header className="flex justify-between items-center">
             <h1 className="text-3xl font-black text-white">Content Studio</h1>
             <div className="flex bg-surface-dark p-1 rounded-xl border border-border-dark">
                <button 
                  onClick={() => setActiveTab('lessons')} 
                  className={`px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'lessons' ? 'bg-primary text-white' : 'text-text-secondary'}`}
                >Lecciones</button>
                <button 
                  onClick={() => setActiveTab('news')} 
                  className={`px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'news' ? 'bg-primary text-white' : 'text-text-secondary'}`}
                >Noticias</button>
             </div>
          </header>

          <div className="flex justify-between items-center">
             <p className="text-text-secondary text-sm">Gestiona el contenido de la plataforma. Usa IA para generar borradores.</p>
             <button onClick={handleCreateNew} className="px-6 py-3 bg-white text-black font-black uppercase text-xs rounded-xl hover:bg-slate-200 transition-all shadow-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">add_circle</span> Nuevo {activeTab === 'lessons' ? 'Lección' : 'Artículo'}
             </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-card-dark rounded-3xl border border-border-dark p-6">
             {isLoading ? <div className="text-white text-center py-10">Cargando...</div> : (
               <table className="w-full text-left">
                  <thead className="text-[10px] uppercase font-black text-text-secondary border-b border-border-dark">
                     <tr>
                        <th className="pb-4 pl-4">ID</th>
                        <th className="pb-4">Título</th>
                        <th className="pb-4">{activeTab === 'lessons' ? 'Subtítulo' : 'Categoría'}</th>
                        <th className="pb-4 text-right pr-4">Acciones</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-border-dark/50">
                     {items.map(item => (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                           <td className="py-4 pl-4 text-xs font-mono text-slate-500">{item.id.substring(0,8)}...</td>
                           <td className="py-4 text-white font-bold">{item.title}</td>
                           <td className="py-4 text-slate-400 text-sm">{activeTab === 'lessons' ? (item as LessonData).subtitle : (item as NewsItem).category}</td>
                           <td className="py-4 text-right pr-4 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setEditingItem(item)} className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all"><span className="material-symbols-outlined text-sm">edit</span></button>
                              <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"><span className="material-symbols-outlined text-sm">delete</span></button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
             )}
             {!isLoading && items.length === 0 && (
               <div className="text-center py-20 text-slate-500">No hay contenido aún.</div>
             )}
          </div>
       </div>
    </div>
  );
};

export default ContentStudio;
