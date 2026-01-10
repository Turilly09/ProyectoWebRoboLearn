
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { geminiService } from '../services/gemini';
import { LessonData, Section, QuizQuestion, ContentBlock } from '../types/lessons';
import { NewsItem, LearningPath, Project, Product } from '../types';
import { saveDynamicLesson, getAllDynamicLessonsList, deleteDynamicLesson } from '../content/registry';
import { saveDynamicNews, getDynamicNews, deleteDynamicNews } from '../content/newsRegistry';
import { getAllPaths, saveDynamicPath, deleteDynamicPath } from '../content/pathRegistry';
import { getAllProducts, saveProduct, deleteProduct } from '../content/storeRegistry'; // Importar registro de tienda
import { MarkdownRenderer } from '../components/MarkdownRenderer';
// Importamos los esquemas de la base de datos
import { CORE_SCHEMA, CONTENT_SCHEMA, COMMUNITY_SCHEMA, UTILS_SCHEMA } from '../content/database_setup';

const FULL_DB_SCRIPT = `
-- =================================================================
-- SCRIPT DE INICIALIZACIÓN COMPLETA - ROBOLEARN
-- =================================================================
-- Copia y pega todo este contenido en el "SQL Editor" de Supabase
-- y pulsa "Run" para configurar todas las tablas y permisos.

${CORE_SCHEMA}

${CONTENT_SCHEMA}

${COMMUNITY_SCHEMA}

${UTILS_SCHEMA}
`;

type StudioTab = 'create' | 'library';
type ContentType = 'lesson' | 'news' | 'path' | 'product';

const ContentStudio: React.FC = () => {
  const navigate = useNavigate();
  
  const [studioTab, setStudioTab] = useState<StudioTab>('create');
  const [contentType, setContentType] = useState<ContentType>('lesson');
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Editor States
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [news, setNews] = useState<NewsItem | null>(null);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [product, setProduct] = useState<Product | null>(null); // Nuevo estado para producto
  
  // Estado específico para bloques de noticias
  const [newsBlocks, setNewsBlocks] = useState<ContentBlock[]>([]);

  const [status, setStatus] = useState<string>("");
  const [errorStatus, setErrorStatus] = useState<string>("");
  const [showSqlHelp, setShowSqlHelp] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  
  // Image Generation State
  const [imageStyle, setImageStyle] = useState("Photorealistic, clean lighting, 8k");
  const [isGeneratingImage, setIsGeneratingImage] = useState<string | null>(null);

  // Library Navigation State
  const [libraryPathId, setLibraryPathId] = useState<string | null>(null);

  const isDeletingRef = useRef(false);

  const [myLessons, setMyLessons] = useState<LessonData[]>([]);
  const [myNews, setMyNews] = useState<NewsItem[]>([]);
  const [allPaths, setAllPaths] = useState<LearningPath[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // Estados locales para edición
  const [newRequirement, setNewRequirement] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const [newGalleryImage, setNewGalleryImage] = useState("");

  const loadData = async (force = false) => {
    if (isDeletingRef.current && !force) return;
    try {
      const [lessons, newsItems, paths, products] = await Promise.all([
        getAllDynamicLessonsList(),
        getDynamicNews(),
        getAllPaths(),
        getAllProducts()
      ]);
      setMyLessons(lessons);
      setMyNews(newsItems);
      setAllPaths(paths);
      setAllProducts(products);
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
    window.addEventListener('storeUpdated', handleUpdate);
    return () => {
      window.removeEventListener('lessonsUpdated', handleUpdate);
      window.removeEventListener('newsUpdated', handleUpdate);
      window.removeEventListener('pathsUpdated', handleUpdate);
      window.removeEventListener('storeUpdated', handleUpdate);
    };
  }, []);

  // Sincronizar contenido de noticias con el editor de bloques al cargar
  useEffect(() => {
    if (news) {
        try {
            const blocks = JSON.parse(news.content);
            if (Array.isArray(blocks)) {
                setNewsBlocks(blocks);
            } else {
                setNewsBlocks([{ type: 'text', content: news.content }]);
            }
        } catch (e) {
            setNewsBlocks([{ type: 'text', content: news.content }]);
        }
    } else {
        setNewsBlocks([]);
    }
  }, [news?.id]);

  const handleCreateEmpty = () => {
    setLesson(null);
    setNews(null);
    setPath(null);
    setProduct(null);

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
            fact: "¿Sabías que...?",
            interaction: "Intenta identificar..."
        }],
        steps: [],
        simulatorUrl: "",
        quiz: [{ question: "Pregunta de validación...", options: ["Opción A", "Opción B", "Opción C", "Opción D"], correctIndex: 0, hint: "Pista para el estudiante" }]
      };
      setLesson(emptyLesson);
    } else if (contentType === 'news') {
      const emptyNews: NewsItem = {
        id: `n${Date.now()}`,
        title: "Nueva Noticia",
        excerpt: "Breve resumen...",
        content: "", 
        date: new Date().toLocaleDateString('es-ES'),
        author: 'Editor',
        category: 'Tecnología',
        image: "https://picsum.photos/seed/news/800/400",
        readTime: "5 min"
      };
      setNews(emptyNews);
      setNewsBlocks([{ type: 'text', content: "Escribe aquí el cuerpo de la noticia..." }]);
    } else if (contentType === 'path') {
      const emptyPath: LearningPath = {
          id: `path_${Date.now()}`,
          title: "Nueva Ruta de Aprendizaje",
          description: "Descripción de la carrera...",
          level: "Principiante",
          modulesCount: 0,
          image: "https://picsum.photos/seed/path/800/450",
          color: "bg-blue-500",
          progress: 0,
          // Workshop inicial vacío
          finalWorkshop: undefined
      };
      setPath(emptyPath);
    } else if (contentType === 'product') {
        const emptyProduct: Product = {
            id: `new_${Date.now()}`,
            name: "Nuevo Producto",
            description: "Breve descripción para la tarjeta del catálogo...",
            longDescription: "Descripción detallada para la página del producto...",
            price: 0,
            category: "Componentes",
            image: "https://picsum.photos/seed/product/500/500",
            images: [], // Inicializar galería
            stock: 10,
            features: [],
            isNew: true
        };
        setProduct(emptyProduct);
    }
    setStudioTab('create');
  };

  const handlePublish = async () => {
    setStatus("Publicando...");
    setErrorStatus("");
    try {
      if (lesson) await saveDynamicLesson(lesson);
      else if (news) {
          const contentToSave = JSON.stringify(newsBlocks);
          await saveDynamicNews({ ...news, content: contentToSave });
      }
      else if (path) await saveDynamicPath(path);
      else if (product) await saveProduct(product);

      setStatus("¡Publicado!");
      setTimeout(() => setStatus(""), 3000);
      loadData(true);
      setLesson(null);
      setNews(null);
      setPath(null);
      setProduct(null);
    } catch (err: any) {
      if (err.message && err.message.includes('foreign key constraint')) {
          setErrorStatus("ERROR CRÍTICO: La Ruta asignada no existe en la Base de Datos.");
          setShowSqlHelp(true);
      } else {
          setErrorStatus("Fallo al publicar: " + err.message);
      }
    }
  };

  // --- LOGICA DE PRODUCTOS ---
  const addFeature = () => {
      if (!product || !newFeature.trim()) return;
      setProduct({ ...product, features: [...product.features, newFeature.trim()] });
      setNewFeature("");
  };
  const removeFeature = (idx: number) => {
      if (!product) return;
      setProduct({ ...product, features: product.features.filter((_, i) => i !== idx) });
  };
  const addGalleryImage = () => {
      if (!product || !newGalleryImage.trim()) return;
      const currentImages = product.images || [];
      setProduct({ ...product, images: [...currentImages, newGalleryImage.trim()] });
      setNewGalleryImage("");
  };
  const removeGalleryImage = (idx: number) => {
      if (!product || !product.images) return;
      setProduct({ ...product, images: product.images.filter((_, i) => i !== idx) });
  };

  // ... (Logica de Workshop se mantiene igual, omitida por brevedad) ...
  const toggleWorkshop = () => {
      if (!path) return;
      if (path.finalWorkshop) {
          if(window.confirm("¿Eliminar el taller final de esta ruta?")) {
              setPath({ ...path, finalWorkshop: undefined });
          }
      } else {
          const newWorkshop: Project = {
              id: `w_${path.id}`,
              title: `Taller Final: ${path.title}`,
              description: "Descripción del proyecto final...",
              image: "https://picsum.photos/seed/workshop/800/600",
              category: "Hardware",
              author: "Sistema",
              isWorkshop: true,
              estimatedTime: "2 Horas",
              difficulty: "Media",
              requirements: [],
              steps: []
          };
          setPath({ ...path, finalWorkshop: newWorkshop });
      }
  };

  const updateWorkshopField = (field: keyof Project, value: any) => {
      if (!path || !path.finalWorkshop) return;
      setPath({
          ...path,
          finalWorkshop: { ...path.finalWorkshop, [field]: value }
      });
  };

  const addWorkshopRequirement = () => {
      if (!path || !path.finalWorkshop || !newRequirement.trim()) return;
      const currentReqs = path.finalWorkshop.requirements || [];
      updateWorkshopField('requirements', [...currentReqs, newRequirement.trim()]);
      setNewRequirement("");
  };

  const removeWorkshopRequirement = (index: number) => {
      if (!path || !path.finalWorkshop) return;
      const currentReqs = path.finalWorkshop.requirements || [];
      updateWorkshopField('requirements', currentReqs.filter((_, i) => i !== index));
  };

  const addWorkshopStep = () => {
      if (!path || !path.finalWorkshop) return;
      const currentSteps = path.finalWorkshop.steps || [];
      updateWorkshopField('steps', [...currentSteps, { title: `Paso ${currentSteps.length + 1}`, description: "", image: "" }]);
  };

  const updateWorkshopStep = (index: number, field: string, value: string) => {
      if (!path || !path.finalWorkshop) return;
      const steps = [...(path.finalWorkshop.steps || [])];
      steps[index] = { ...steps[index], [field]: value };
      updateWorkshopField('steps', steps);
  };

  const removeWorkshopStep = (index: number) => {
      if (!path || !path.finalWorkshop) return;
      const steps = path.finalWorkshop.steps || [];
      updateWorkshopField('steps', steps.filter((_, i) => i !== index));
  };

  const handleRealDelete = async (id: string, type: 'lesson' | 'news' | 'path' | 'product') => {
    if (!window.confirm("¿Deseas eliminar este registro permanentemente de la base de datos?")) return;

    isDeletingRef.current = true;
    setStatus("Borrando de la base de datos...");
    
    if (type === 'lesson') setMyLessons(prev => prev.filter(l => l.id !== id));
    else if (type === 'news') setMyNews(prev => prev.filter(n => n.id !== id));
    else if (type === 'path') setAllPaths(prev => prev.filter(p => p.id !== id));
    else if (type === 'product') setAllProducts(prev => prev.filter(p => p.id !== id));

    try {
      if (type === 'lesson') await deleteDynamicLesson(id);
      else if (type === 'news') await deleteDynamicNews(id);
      else if (type === 'path') await deleteDynamicPath(id);
      else if (type === 'product') await deleteProduct(id);
      
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
      } else if (contentType === 'news') {
        const draft = await geminiService.generateNewsDraft(topic);
        if (draft) {
            setNews({ ...draft, id: `n${Date.now()}`, date: new Date().toLocaleDateString('es-ES') });
            setNewsBlocks([{ type: 'text', content: draft.content }]);
        }
      }
    } catch (err) { setErrorStatus("IA Ocupada."); }
    finally { setIsGenerating(false); }
  };

  // ... (Helper functions for block manipulation omitted for brevity, keeping existing) ...
  const handleGenerateBlockImage = async (secIndex: number, blockIndex: number) => {
     if (!lesson) return;
     const section = lesson.sections[secIndex];
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

  const handleFormat = (elementId: string, format: 'bold' | 'paragraph', content: string, onUpdate: (val: string) => void) => {
    const textarea = document.getElementById(elementId) as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    let newText = '';
    if (format === 'bold') {
        const selection = content.substring(start, end);
        newText = content.substring(0, start) + `**${selection || 'texto'}**` + content.substring(end);
    } else if (format === 'paragraph') {
        newText = content.substring(0, start) + "\n\n" + content.substring(end);
    }
    onUpdate(newText);
    setTimeout(() => { textarea.focus(); }, 50);
  };

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
  const updateSectionInteraction = (index: number, val: string) => {
    if (!lesson) return;
    const newSections = [...lesson.sections];
    newSections[index] = { ...newSections[index], interaction: val };
    setLesson({ ...lesson, sections: newSections });
  };
  const addBlock = (secIndex: number, type: 'text' | 'image' | 'video' | 'simulator') => {
      if (!lesson) return;
      const newSections = [...lesson.sections];
      const newBlock: ContentBlock = { type, content: type === 'text' ? "Nuevo párrafo..." : (type === 'simulator' ? "https://www.falstad.com/circuit/..." : "https://picsum.photos/800/400") };
      newSections[secIndex] = { ...newSections[secIndex], blocks: [...(newSections[secIndex].blocks || []), newBlock] };
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
      if (direction === 'up' && blockIndex > 0) { [blocks[blockIndex - 1], blocks[blockIndex]] = [blocks[blockIndex], blocks[blockIndex - 1]]; } 
      else if (direction === 'down' && blockIndex < blocks.length - 1) { [blocks[blockIndex + 1], blocks[blockIndex]] = [blocks[blockIndex], blocks[blockIndex + 1]]; }
      newSections[secIndex] = { ...newSections[secIndex], blocks };
      setLesson({ ...lesson, sections: newSections });
  };
  const updateBlockContent = (secIndex: number, blockIndex: number, val: string) => {
      if (!lesson) return;
      let finalVal = val;
      if (val.includes('<iframe')) { const srcMatch = val.match(/src="([^"]+)"/); if (srcMatch && srcMatch[1]) finalVal = srcMatch[1]; }
      const newSections = [...lesson.sections];
      const newBlocks = [...newSections[secIndex].blocks];
      newBlocks[blockIndex] = { ...newBlocks[blockIndex], content: finalVal };
      newSections[secIndex] = { ...newSections[secIndex], blocks: newBlocks };
      setLesson({ ...lesson, sections: newSections });
  };
  const addSection = () => {
    if (!lesson) return;
    setLesson({ ...lesson, sections: [...lesson.sections, { title: `Nueva Sección`, blocks: [{ type: 'text', content: "" }], fact: "", interaction: "" }] });
  };
  const removeSection = (index: number) => {
    if (!lesson) return;
    setLesson({ ...lesson, sections: lesson.sections.filter((_, i) => i !== index) });
  };
  const addNewsBlock = (type: 'text' | 'image' | 'video') => { setNewsBlocks([...newsBlocks, { type, content: type === 'text' ? "Nuevo párrafo..." : "https://picsum.photos/800/400" }]); };
  const removeNewsBlock = (index: number) => { setNewsBlocks(newsBlocks.filter((_, i) => i !== index)); };
  const moveNewsBlock = (index: number, direction: 'up' | 'down') => {
      const newBlocks = [...newsBlocks];
      if (direction === 'up' && index > 0) { [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]]; } 
      else if (direction === 'down' && index < newBlocks.length - 1) { [newBlocks[index + 1], newBlocks[index]] = [newBlocks[index], newBlocks[index + 1]]; }
      setNewsBlocks(newBlocks);
  };
  const updateNewsBlockContent = (index: number, val: string) => {
      let finalVal = val;
      if (val.includes('<iframe')) { const srcMatch = val.match(/src="([^"]+)"/); if (srcMatch && srcMatch[1]) finalVal = srcMatch[1]; }
      const newBlocks = [...newsBlocks];
      newBlocks[index] = { ...newBlocks[index], content: finalVal };
      setNewsBlocks(newBlocks);
  };
  const addQuizQuestion = () => { if (!lesson) return; setLesson({ ...lesson, quiz: [...(lesson.quiz || []), { question: "", options: ["","","",""], correctIndex: 0, hint: "" }] }); };
  const removeQuizQuestion = (idx: number) => { if (!lesson) return; setLesson({ ...lesson, quiz: lesson.quiz.filter((_, i) => i !== idx) }); };
  const updateQuizField = (idx: number, field: any, val: any) => { if (!lesson) return; const q = [...lesson.quiz]; q[idx] = { ...q[idx], [field]: val }; setLesson({ ...lesson, quiz: q }); };
  const updateQuizOption = (qIdx: number, oIdx: number, val: string) => { if (!lesson) return; const q = [...lesson.quiz]; const opts = [...q[qIdx].options]; opts[oIdx] = val; q[qIdx] = { ...q[qIdx], options: opts }; setLesson({ ...lesson, quiz: q }); };

  const getFilteredLessons = () => {
    if (!libraryPathId) return [];
    if (libraryPathId === 'unassigned') { return myLessons.filter(l => !l.pathId || !allPaths.find(p => p.id === l.pathId)); }
    return myLessons.filter(l => l.pathId === libraryPathId);
  };
  const getUnassignedCount = () => { return myLessons.filter(l => !l.pathId || !allPaths.find(p => p.id === l.pathId)).length; };
  const handleCopySql = () => { navigator.clipboard.writeText(FULL_DB_SCRIPT); setSqlCopied(true); setTimeout(() => setSqlCopied(false), 2000); };

  // --- RENDER ---
  return (
    <div className="flex-1 flex flex-col bg-background-dark text-white min-h-screen font-body overflow-hidden">
      {/* Header */}
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
          <button onClick={() => setShowSqlHelp(true)} className="px-3 py-1.5 border border-amber-500/30 text-amber-500 rounded-lg text-[9px] font-black uppercase hover:bg-amber-500/10 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">database</span> Configurar RLS
          </button>
          <div className="flex bg-card-dark p-1 rounded-xl border border-border-dark">
             <button onClick={() => setStudioTab('create')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${studioTab === 'create' ? 'bg-primary' : 'text-text-secondary'}`}>Editor</button>
             <button onClick={() => {setStudioTab('library'); setLibraryPathId(null);}} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${studioTab === 'library' ? 'bg-purple-600' : 'text-text-secondary'}`}>Biblioteca</button>
          </div>
          {(lesson || news || path || product) && (
            <button onClick={handlePublish} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-[9px] font-black shadow-lg shadow-green-600/20 uppercase transition-all">Publicar Cambios</button>
          )}
        </div>
      </header>

      {/* Modal Configuración BD */}
      {showSqlHelp && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-surface-dark border border-border-dark max-w-4xl w-full rounded-[40px] p-8 space-y-6 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
             <div className="flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                        <span className="material-symbols-outlined">database</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">Configuración de Base de Datos</h2>
                        <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">Inicialización y Políticas RLS</p>
                    </div>
                </div>
                <button onClick={() => setShowSqlHelp(false)} className="material-symbols-outlined text-text-secondary hover:text-white">close</button>
             </div>
             <div className="flex-1 relative bg-black rounded-2xl border border-white/10 overflow-hidden">
                <div className="absolute top-0 right-0 p-4 z-10">
                    <button 
                        onClick={handleCopySql} 
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase shadow-lg transition-all flex items-center gap-2 ${sqlCopied ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-slate-200'}`}
                    >
                        <span className="material-symbols-outlined text-sm">{sqlCopied ? 'check' : 'content_copy'}</span>
                        {sqlCopied ? '¡Copiado!' : 'Copiar Script'}
                    </button>
                </div>
                <pre className="h-full overflow-auto p-6 text-[11px] font-mono text-green-400 selection:bg-green-900/50">{FULL_DB_SCRIPT}</pre>
             </div>
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
              {!(lesson || news || path || product) ? (
                <>
                  <div className="flex flex-col gap-2">
                      <div className="flex bg-card-dark p-1 rounded-xl border border-border-dark">
                        <button onClick={() => setContentType('lesson')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${contentType === 'lesson' ? 'bg-primary' : 'text-text-secondary'}`}>Módulos</button>
                        <button onClick={() => setContentType('news')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${contentType === 'news' ? 'bg-amber-600' : 'text-text-secondary'}`}>Noticias</button>
                      </div>
                      <div className="flex bg-card-dark p-1 rounded-xl border border-border-dark">
                        <button onClick={() => setContentType('path')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${contentType === 'path' ? 'bg-green-600' : 'text-text-secondary'}`}>Rutas</button>
                        <button onClick={() => setContentType('product')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${contentType === 'product' ? 'bg-purple-600' : 'text-text-secondary'}`}>Productos</button>
                      </div>
                  </div>
                  <button onClick={handleCreateEmpty} className="w-full py-4 bg-primary rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">Crear Manualmente</button>
                  {contentType !== 'product' && (
                      <div className="p-5 bg-card-dark rounded-2xl border border-border-dark space-y-4">
                         <h3 className="text-[10px] font-black text-primary uppercase">Generador IA</h3>
                         <textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder="Ej: Introducción a I2C..." className="w-full h-24 bg-surface-dark border border-border-dark rounded-xl p-3 text-xs resize-none focus:border-primary outline-none" />
                         <button onClick={handleGenerateAI} disabled={isGenerating} className="w-full py-3 bg-white/5 border border-primary/30 text-primary text-[10px] font-black rounded-xl uppercase hover:bg-primary hover:text-white transition-all">
                           {isGenerating ? 'Generando...' : 'Generar Borrador IA'}
                         </button>
                      </div>
                  )}
                </>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-left-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-primary uppercase">Propiedades</h3>
                    <button onClick={() => {setLesson(null); setNews(null); setPath(null); setProduct(null);}} className="text-[10px] text-red-400 hover:text-red-300 uppercase font-bold">Cerrar</button>
                  </div>
                  
                  {/* ... (Lesson, News, Path props omitted for brevity) ... */}
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
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-text-secondary uppercase font-bold">Titular</label>
                            <input value={news.title} onChange={e => setNews({...news, title: e.target.value})} className="w-full bg-card-dark p-3 rounded-xl text-xs border border-border-dark focus:border-primary outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-text-secondary uppercase font-bold">Resumen (Excerpt)</label>
                            <textarea value={news.excerpt} onChange={e => setNews({...news, excerpt: e.target.value})} className="w-full h-20 bg-card-dark p-3 rounded-xl text-xs border border-border-dark focus:border-primary outline-none resize-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-text-secondary uppercase font-bold">Imagen Portada (URL)</label>
                            <input value={news.image} onChange={e => setNews({...news, image: e.target.value})} className="w-full bg-card-dark p-3 rounded-xl text-xs border border-border-dark focus:border-primary outline-none" />
                        </div>
                    </div>
                  )}

                  {path && (
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-text-secondary uppercase font-bold">Nombre de la Ruta</label>
                            <input value={path.title} onChange={e => setPath({...path, title: e.target.value})} className="w-full bg-card-dark p-3 rounded-xl text-xs border border-border-dark focus:border-primary outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-text-secondary uppercase font-bold">Descripción</label>
                            <textarea value={path.description} onChange={e => setPath({...path, description: e.target.value})} className="w-full h-20 bg-card-dark p-3 rounded-xl text-xs border border-border-dark focus:border-primary outline-none resize-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-text-secondary uppercase font-bold">Nivel</label>
                            <select value={path.level} onChange={e => setPath({...path, level: e.target.value as any})} className="w-full bg-card-dark p-3 rounded-xl text-xs border border-border-dark focus:border-primary outline-none">
                                <option value="Principiante">Principiante</option>
                                <option value="Intermedio">Intermedio</option>
                                <option value="Avanzado">Avanzado</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-text-secondary uppercase font-bold">URL Imagen</label>
                            <input value={path.image} onChange={e => setPath({...path, image: e.target.value})} className="w-full bg-card-dark p-3 rounded-xl text-xs border border-border-dark focus:border-primary outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-text-secondary uppercase font-bold">Color (Tailwind Class)</label>
                            <select value={path.color} onChange={e => setPath({...path, color: e.target.value})} className="w-full bg-card-dark p-3 rounded-xl text-xs border border-border-dark focus:border-primary outline-none">
                                <option value="bg-primary">Azul (Primary)</option>
                                <option value="bg-green-500">Verde</option>
                                <option value="bg-orange-500">Naranja</option>
                                <option value="bg-cyan-500">Cyan</option>
                                <option value="bg-purple-500">Púrpura</option>
                                <option value="bg-red-500">Rojo</option>
                                <option value="bg-yellow-600">Amarillo</option>
                                <option value="bg-emerald-500">Esmeralda</option>
                            </select>
                        </div>
                    </div>
                  )}

                  {/* PROPIEDADES DE PRODUCTO */}
                  {product && (
                      <div className="space-y-4">
                          <div className="space-y-1">
                              <label className="text-[10px] text-text-secondary uppercase font-bold">Nombre del Producto</label>
                              <input value={product.name} onChange={e => setProduct({...product, name: e.target.value})} className="w-full bg-card-dark p-3 rounded-xl text-xs border border-border-dark focus:border-primary outline-none" />
                          </div>
                          
                          <div className="space-y-1">
                              <label className="text-[10px] text-text-secondary uppercase font-bold">Descripción Corta (Tarjeta)</label>
                              <textarea value={product.description} onChange={e => setProduct({...product, description: e.target.value})} className="w-full h-20 bg-card-dark p-3 rounded-xl text-xs border border-border-dark focus:border-primary outline-none resize-none" placeholder="Breve descripción para el grid de la tienda..." />
                          </div>

                          {/* PRECIO & STOCK EN FILA */}
                          <div className="flex gap-2">
                              <div className="space-y-1 flex-1">
                                  <label className="text-[10px] text-text-secondary uppercase font-bold">Precio ($)</label>
                                  <input type="number" step="0.01" value={product.price} onChange={e => setProduct({...product, price: parseFloat(e.target.value)})} className="w-full bg-card-dark p-3 rounded-xl text-xs border border-border-dark focus:border-primary outline-none" />
                              </div>
                              <div className="space-y-1 flex-1">
                                  <label className="text-[10px] text-text-secondary uppercase font-bold">Stock</label>
                                  <input type="number" value={product.stock} onChange={e => setProduct({...product, stock: parseInt(e.target.value)})} className="w-full bg-card-dark p-3 rounded-xl text-xs border border-border-dark focus:border-primary outline-none" />
                              </div>
                          </div>

                          <div className="space-y-1">
                              <label className="text-[10px] text-text-secondary uppercase font-bold">Categoría</label>
                              <select value={product.category} onChange={e => setProduct({...product, category: e.target.value as any})} className="w-full bg-card-dark p-3 rounded-xl text-xs border border-border-dark focus:border-primary outline-none">
                                  {['Kits', 'Componentes', 'Sensores', 'Herramientas', 'Merch'].map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                              <input 
                                  type="checkbox" 
                                  checked={product.isNew} 
                                  onChange={e => setProduct({...product, isNew: e.target.checked})}
                                  className="size-4 accent-primary" 
                              />
                              <label className="text-xs text-white font-bold">Marcar como Nuevo Lanzamiento</label>
                          </div>
                      </div>
                  )}
                </div>
              )}
            </aside>

            {/* MAIN EDITOR AREA */}
            <div className="flex-1 bg-background-light dark:bg-background-dark overflow-y-auto relative">
               {/* ... (Lesson and News editors omitted for brevity) ... */}
               {lesson && (
                  <div className="max-w-4xl mx-auto p-12 space-y-12 animate-in fade-in zoom-in-95 duration-300">
                      {/* ... Lesson editor logic ... */}
                      <div className="flex items-center justify-between">
                           <h2 className="text-3xl font-black text-white">Contenido por Bloques</h2>
                           <button onClick={addSection} className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all">
                              <span className="material-symbols-outlined text-sm">add_circle</span> Añadir Sección
                           </button>
                      </div>
                      {/* ... Lesson rendering ... */}
                      <div className="space-y-8">
                           {lesson.sections.map((section, idx) => (
                             <div key={idx} className="p-8 bg-card-dark rounded-3xl border border-border-dark space-y-6 relative group">
                                <button onClick={() => removeSection(idx)} className="absolute top-6 right-6 p-2 bg-red-500/10 text-red-500 rounded-lg opacity-50 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all">
                                   <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black uppercase text-primary tracking-widest">Sección {idx + 1}</label>
                                   <input value={section.title} onChange={e => updateSectionTitle(idx, e.target.value)} className="w-full bg-transparent text-2xl font-bold text-white placeholder-white/20 border-b border-border-dark focus:border-primary outline-none py-2" placeholder="Título de la sección..." />
                                </div>
                                <div className="space-y-4">
                                    {(section.blocks || []).map((block, bIdx) => (
                                        <div key={bIdx} className="relative p-4 bg-surface-dark rounded-xl border border-border-dark group/block hover:border-primary/50 transition-all">
                                            <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity z-10">
                                                <button onClick={() => moveBlock(idx, bIdx, 'up')} className="p-1 hover:bg-white/10 rounded"><span className="material-symbols-outlined text-sm">arrow_upward</span></button>
                                                <button onClick={() => moveBlock(idx, bIdx, 'down')} className="p-1 hover:bg-white/10 rounded"><span className="material-symbols-outlined text-sm">arrow_downward</span></button>
                                                <button onClick={() => removeBlock(idx, bIdx)} className="p-1 hover:bg-red-500/20 text-red-400 rounded"><span className="material-symbols-outlined text-sm">close</span></button>
                                            </div>
                                            {block.type === 'text' && (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[9px] font-bold uppercase text-text-secondary flex items-center gap-1"><span className="material-symbols-outlined text-xs">text_fields</span> Texto (Markdown)</span>
                                                        <div className="flex gap-1">
                                                            <button onClick={() => handleFormat(`lesson-txt-${idx}-${bIdx}`, 'bold', block.content, (val) => updateBlockContent(idx, bIdx, val))} className="p-1 hover:bg-white/10 rounded text-text-secondary hover:text-white transition-colors"><span className="material-symbols-outlined text-sm">format_bold</span></button>
                                                            <button onClick={() => handleFormat(`lesson-txt-${idx}-${bIdx}`, 'paragraph', block.content, (val) => updateBlockContent(idx, bIdx, val))} className="p-1 hover:bg-white/10 rounded text-text-secondary hover:text-white transition-colors"><span className="material-symbols-outlined text-sm">segment</span></button>
                                                        </div>
                                                    </div>
                                                    <textarea id={`lesson-txt-${idx}-${bIdx}`} value={block.content} onChange={e => updateBlockContent(idx, bIdx, e.target.value)} className="w-full h-32 bg-background-dark/50 rounded-lg p-3 text-sm text-slate-300 resize-y outline-none focus:ring-1 focus:ring-primary font-mono" placeholder="Escribe aquí..." />
                                                </div>
                                            )}
                                            {block.type !== 'text' && (
                                                <div className="space-y-2">
                                                     <div className="flex justify-between">
                                                        <span className="text-[9px] font-bold uppercase text-text-secondary flex items-center gap-1"><span className="material-symbols-outlined text-xs">link</span> {block.type} URL</span>
                                                     </div>
                                                     <input value={block.content} onChange={e => updateBlockContent(idx, bIdx, e.target.value)} className="w-full bg-background-dark/50 rounded-lg p-3 text-xs outline-none focus:ring-1 focus:ring-primary" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <div className="flex gap-2 pt-2 justify-center flex-wrap">
                                        <button onClick={() => addBlock(idx, 'text')} className="px-3 py-1.5 bg-surface-dark border border-border-dark hover:border-primary text-text-secondary hover:text-white rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 transition-all"><span className="material-symbols-outlined text-sm">add</span> Texto</button>
                                        <button onClick={() => addBlock(idx, 'image')} className="px-3 py-1.5 bg-surface-dark border border-border-dark hover:border-purple-500 text-text-secondary hover:text-white rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 transition-all"><span className="material-symbols-outlined text-sm">add_photo_alternate</span> Imagen</button>
                                        <button onClick={() => addBlock(idx, 'video')} className="px-3 py-1.5 bg-surface-dark border border-border-dark hover:border-red-500 text-text-secondary hover:text-white rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 transition-all"><span className="material-symbols-outlined text-sm">video_library</span> Video</button>
                                        <button onClick={() => addBlock(idx, 'simulator')} className="px-3 py-1.5 bg-surface-dark border border-border-dark hover:border-green-500 text-text-secondary hover:text-white rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 transition-all"><span className="material-symbols-outlined text-sm">science</span> Simulador</button>
                                    </div>
                                </div>
                             </div>
                           ))}
                        </div>
                  </div>
               )}

               {news && (
                   <div className="max-w-4xl mx-auto p-12 space-y-12 animate-in fade-in zoom-in-95 duration-300">
                        {/* ... News Editor ... */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl font-black text-white">Cuerpo de la Noticia</h2>
                        </div>
                        <div className="space-y-4">
                            {newsBlocks.map((block, bIdx) => (
                                <div key={bIdx} className="relative p-6 bg-card-dark rounded-2xl border border-border-dark group/block hover:border-primary/50 transition-all">
                                    <div className="absolute right-4 top-4 flex gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity z-10">
                                        <button onClick={() => moveNewsBlock(bIdx, 'up')} className="p-1.5 hover:bg-white/10 rounded-lg"><span className="material-symbols-outlined text-sm">arrow_upward</span></button>
                                        <button onClick={() => moveNewsBlock(bIdx, 'down')} className="p-1.5 hover:bg-white/10 rounded-lg"><span className="material-symbols-outlined text-sm">arrow_downward</span></button>
                                        <button onClick={() => removeNewsBlock(bIdx)} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg"><span className="material-symbols-outlined text-sm">close</span></button>
                                    </div>
                                    {block.type === 'text' ? (
                                        <textarea id={`news-txt-${bIdx}`} value={block.content} onChange={e => updateNewsBlockContent(bIdx, e.target.value)} className="w-full h-40 bg-surface-dark rounded-xl p-4 text-sm text-slate-300 resize-y outline-none focus:ring-1 focus:ring-primary font-mono border border-border-dark" placeholder="Texto..." />
                                    ) : (
                                        <input value={block.content} onChange={e => updateNewsBlockContent(bIdx, e.target.value)} className="w-full bg-surface-dark rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-primary border border-border-dark" placeholder="URL..." />
                                    )}
                                </div>
                            ))}
                            <div className="flex gap-3 pt-4 justify-center">
                                <button onClick={() => addNewsBlock('text')} className="px-6 py-3 bg-surface-dark border border-border-dark hover:border-primary text-text-secondary hover:text-white rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 transition-all"><span className="material-symbols-outlined text-lg">add</span> Texto</button>
                                <button onClick={() => addNewsBlock('image')} className="px-6 py-3 bg-surface-dark border border-border-dark hover:border-purple-500 text-text-secondary hover:text-white rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 transition-all"><span className="material-symbols-outlined text-lg">add_photo_alternate</span> Imagen</button>
                                <button onClick={() => addNewsBlock('video')} className="px-6 py-3 bg-surface-dark border border-border-dark hover:border-red-500 text-text-secondary hover:text-white rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 transition-all"><span className="material-symbols-outlined text-lg">video_library</span> Video</button>
                            </div>
                        </div>
                   </div>
               )}

               {!(lesson || news || path || product) && (
                 <div className="flex h-full items-center justify-center opacity-10 flex-col gap-4">
                    <span className="material-symbols-outlined text-[120px]">architecture</span>
                    <p className="font-black text-2xl uppercase">Selecciona o crea un elemento</p>
                 </div>
               )}

                    {/* --- VISTA PREVIA Y EDICIÓN DE PRODUCTO --- */}
                    {product && (
                        <div className="max-w-4xl mx-auto p-12 space-y-12 animate-in fade-in zoom-in-95 duration-300">
                            
                            {/* 1. VISTA PREVIA (Tarjeta) */}
                            <div className="flex flex-col items-center gap-6">
                                <h2 className="text-2xl font-black text-white self-start">Vista Previa (Tarjeta)</h2>
                                <div className="w-full max-w-sm group bg-white dark:bg-card-dark rounded-3xl overflow-hidden border border-slate-200 dark:border-border-dark hover:shadow-2xl transition-all cursor-default relative">
                                    <div className="h-64 overflow-hidden relative p-4 flex items-center justify-center bg-white">
                                        <img src={product.image || "https://picsum.photos/seed/product/500/500"} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" alt={product.name} />
                                        <div className="absolute top-4 right-4 px-3 py-1 bg-black/10 text-slate-700 font-bold text-[9px] uppercase rounded-lg">
                                            {product.category}
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-2">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{product.name || "Nombre Producto"}</h3>
                                        <p className="text-xs text-slate-500 dark:text-text-secondary line-clamp-2">{product.description || "Descripción breve para la tarjeta..."}</p>
                                        <div className="pt-4 flex justify-between items-center border-t border-border-dark/50">
                                            <span className="text-2xl font-black text-slate-900 dark:text-white">${product.price?.toFixed(2)}</span>
                                            <button className="size-10 rounded-xl bg-amber-500 text-black flex items-center justify-center"><span className="material-symbols-outlined">add_shopping_cart</span></button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-border-dark"></div>

                            {/* 2. GESTIÓN DE GALERÍA DE IMÁGENES */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-white flex items-center gap-3"><span className="material-symbols-outlined text-purple-500">collections</span> Galería Multimedia</h3>
                                
                                {/* Imagen Principal */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-text-secondary">Imagen Principal (URL)</label>
                                    <div className="flex gap-2">
                                        <input 
                                            value={product.image} 
                                            onChange={e => setProduct({...product, image: e.target.value})}
                                            className="flex-1 bg-card-dark p-3 rounded-xl border border-border-dark focus:border-purple-500 outline-none text-white text-sm"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>

                                {/* Galería Adicional */}
                                <div className="space-y-4 p-6 bg-card-dark rounded-3xl border border-border-dark">
                                    <label className="text-[10px] font-black uppercase text-text-secondary border-b border-border-dark pb-2 block">Imágenes Adicionales</label>
                                    
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {(product.images || []).map((img, idx) => (
                                            <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-border-dark">
                                                <img src={img} className="w-full h-full object-cover" alt="" />
                                                <button onClick={() => removeGalleryImage(idx)} className="absolute top-2 right-2 bg-red-500 text-white rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                                    <span className="material-symbols-outlined text-sm">close</span>
                                                </button>
                                            </div>
                                        ))}
                                        <div className="aspect-square rounded-xl border-2 border-dashed border-border-dark flex flex-col items-center justify-center p-4 gap-2 hover:border-purple-500/50 transition-colors">
                                            <span className="material-symbols-outlined text-purple-500">add_photo_alternate</span>
                                            <input 
                                                value={newGalleryImage}
                                                onChange={e => setNewGalleryImage(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && addGalleryImage()}
                                                className="w-full bg-transparent text-center text-xs text-white outline-none placeholder-text-secondary"
                                                placeholder="Pegar URL..."
                                            />
                                            <button onClick={addGalleryImage} className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded text-[9px] font-bold uppercase hover:bg-purple-500 hover:text-white transition-all">Añadir</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. DESCRIPCIÓN DETALLADA (Larga) */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-black text-white flex items-center gap-3"><span className="material-symbols-outlined text-blue-500">article</span> Descripción Detallada (Página Producto)</h3>
                                <div className="bg-card-dark rounded-3xl border border-border-dark p-6 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] text-text-secondary uppercase font-bold">Texto de Marketing (Soporta Markdown Básico)</p>
                                        <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded font-bold">Markdown</span>
                                    </div>
                                    <textarea 
                                        value={product.longDescription || ''} 
                                        onChange={e => setProduct({...product, longDescription: e.target.value})}
                                        className="w-full h-64 bg-surface-dark p-4 rounded-xl border border-border-dark focus:border-blue-500 outline-none text-slate-300 text-sm resize-none font-mono leading-relaxed"
                                        placeholder="Escribe aquí la descripción completa que se verá al entrar en el producto..."
                                    />
                                </div>
                            </div>

                            {/* 4. ESPECIFICACIONES TÉCNICAS (Features) */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-black text-white flex items-center gap-3"><span className="material-symbols-outlined text-amber-500">settings_suggest</span> Especificaciones Técnicas</h3>
                                
                                <div className="bg-card-dark border border-border-dark rounded-3xl p-8 space-y-6">
                                    <div className="flex gap-2">
                                        <input 
                                            value={newFeature}
                                            onChange={e => setNewFeature(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && addFeature()}
                                            className="flex-1 bg-surface-dark p-4 rounded-xl border border-border-dark focus:border-amber-500 outline-none text-white text-sm font-medium"
                                            placeholder="Ej: Microcontrolador ATmega328P @ 16MHz"
                                        />
                                        <button onClick={addFeature} className="px-6 bg-amber-500 text-black font-bold rounded-xl text-xs uppercase hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20">
                                            Añadir Spec
                                        </button>
                                    </div>

                                    {product.features.length === 0 ? (
                                        <div className="text-center py-8 opacity-30 border-2 border-dashed border-border-dark rounded-xl">
                                            <p className="text-sm font-bold">Sin especificaciones técnicas definidas.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {product.features.map((feat, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-surface-dark border border-border-dark rounded-xl group hover:border-amber-500/30 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <span className="material-symbols-outlined text-amber-500 text-sm">check_circle</span>
                                                        <span className="text-sm font-bold text-slate-300">{feat}</span>
                                                    </div>
                                                    <button onClick={() => removeFeature(idx)} className="text-red-500/50 hover:text-red-500 transition-colors p-1">
                                                        <span className="material-symbols-outlined text-sm">close</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    )}

                    {/* ... Path Workshop Preview Logic (keeping existing) ... */}
                    {path && (
                        <div className="max-w-4xl mx-auto p-12 space-y-12">
                            <h2 className="text-3xl font-black text-white text-center">Vista Previa de Tarjeta</h2>
                            <div className="w-full max-w-sm mx-auto group bg-white dark:bg-card-dark rounded-3xl overflow-hidden border border-slate-200 dark:border-border-dark hover:border-primary/50 hover:shadow-2xl transition-all cursor-default flex flex-col h-full relative">
                                <div className="h-40 relative overflow-hidden shrink-0">
                                    <img src={path.image || "https://picsum.photos/seed/path/800/450"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={path.title} />
                                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest text-white shadow-lg ${path.color || 'bg-slate-500'}`}>
                                        {path.level}
                                    </div>
                                </div>
                                <div className="p-5 flex flex-col flex-1 gap-3">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors line-clamp-1">{path.title || "Nueva Ruta"}</h3>
                                        <p className="text-[10px] text-slate-500 dark:text-text-secondary line-clamp-3 leading-relaxed">{path.description || "Descripción breve..."}</p>
                                    </div>
                                    <div className="mt-auto pt-3 border-t border-slate-100 dark:border-border-dark/50 flex justify-between items-center">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">{getUnassignedCount() > 0 && path.id === `path_${Date.now()}` ? '0' : '0'} Módulos</span>
                                        <span className="material-symbols-outlined text-primary text-sm">arrow_forward</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="h-px bg-border-dark w-full"></div>

                            {/* SECCIÓN DEL TALLER FINAL */}
                            <div className="w-full space-y-8">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-3xl font-black text-white flex items-center gap-3">
                                            <span className="material-symbols-outlined text-amber-500">trophy</span> Taller Final
                                        </h2>
                                        <p className="text-sm text-text-secondary">El proyecto de certificación para esta ruta.</p>
                                    </div>
                                    <button 
                                        onClick={toggleWorkshop}
                                        className={`px-6 py-2 rounded-xl font-bold uppercase text-xs transition-all ${path.finalWorkshop ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-amber-500 text-black hover:bg-amber-400'}`}
                                    >
                                        {path.finalWorkshop ? 'Eliminar Taller' : 'Añadir Taller Final'}
                                    </button>
                                </div>

                                {path.finalWorkshop && (
                                    <div className="bg-card-dark border border-border-dark rounded-[40px] p-8 space-y-8 animate-in slide-in-from-bottom-4">
                                        {/* ... (Existing Workshop Fields) ... */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-text-secondary">Título del Taller</label>
                                                <input 
                                                    value={path.finalWorkshop.title}
                                                    onChange={e => updateWorkshopField('title', e.target.value)}
                                                    className="w-full bg-surface-dark p-3 rounded-xl border border-border-dark focus:border-amber-500 outline-none text-white font-bold"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-text-secondary">Imagen Principal (URL)</label>
                                                <input 
                                                    value={path.finalWorkshop.image}
                                                    onChange={e => updateWorkshopField('image', e.target.value)}
                                                    className="w-full bg-surface-dark p-3 rounded-xl border border-border-dark focus:border-amber-500 outline-none text-white text-xs"
                                                />
                                            </div>
                                            <div className="col-span-full space-y-2">
                                                <label className="text-[10px] font-black uppercase text-text-secondary">Descripción General</label>
                                                <textarea 
                                                    value={path.finalWorkshop.description}
                                                    onChange={e => updateWorkshopField('description', e.target.value)}
                                                    className="w-full h-24 bg-surface-dark p-3 rounded-xl border border-border-dark focus:border-amber-500 outline-none text-white text-sm resize-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-text-secondary">Tiempo Estimado</label>
                                                <input 
                                                    value={path.finalWorkshop.estimatedTime}
                                                    onChange={e => updateWorkshopField('estimatedTime', e.target.value)}
                                                    className="w-full bg-surface-dark p-3 rounded-xl border border-border-dark focus:border-amber-500 outline-none text-white text-sm"
                                                    placeholder="Ej: 4 Horas"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-text-secondary">Video Tutorial (URL Embed)</label>
                                                <input 
                                                    value={path.finalWorkshop.videoUrl || ''}
                                                    onChange={e => updateWorkshopField('videoUrl', e.target.value)}
                                                    className="w-full bg-surface-dark p-3 rounded-xl border border-border-dark focus:border-amber-500 outline-none text-white text-xs"
                                                    placeholder="https://www.youtube.com/embed/..."
                                                />
                                            </div>
                                            <div className="col-span-full space-y-2">
                                                <label className="text-[10px] font-black uppercase text-text-secondary flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-sm">shopping_cart</span> Link de Compra (Kit)
                                                </label>
                                                <input 
                                                    value={path.finalWorkshop.kitUrl || ''}
                                                    onChange={e => updateWorkshopField('kitUrl', e.target.value)}
                                                    className="w-full bg-surface-dark p-3 rounded-xl border border-border-dark focus:border-amber-500 outline-none text-white text-xs"
                                                    placeholder="https://tienda.robolearn.com/producto/kit-1..."
                                                />
                                            </div>
                                        </div>

                                        {/* Materiales */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-black uppercase text-text-secondary border-b border-border-dark pb-2">Lista de Materiales</h3>
                                            <div className="flex gap-2">
                                                <input 
                                                    value={newRequirement}
                                                    onChange={e => setNewRequirement(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && addWorkshopRequirement()}
                                                    className="flex-1 bg-surface-dark p-3 rounded-xl border border-border-dark focus:border-amber-500 outline-none text-white text-sm"
                                                    placeholder="Ej: 1x Arduino Uno"
                                                />
                                                <button onClick={addWorkshopRequirement} className="px-4 bg-amber-500 text-black font-bold rounded-xl text-xs uppercase hover:bg-amber-400">Añadir</button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {path.finalWorkshop.requirements?.map((req, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-surface-dark border border-border-dark rounded-lg text-xs font-bold text-slate-300">
                                                        {req}
                                                        <button onClick={() => removeWorkshopRequirement(idx)} className="text-red-500 hover:text-white"><span className="material-symbols-outlined text-sm">close</span></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Pasos */}
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center border-b border-border-dark pb-2">
                                                <h3 className="text-sm font-black uppercase text-text-secondary">Pasos del Taller</h3>
                                                <button onClick={addWorkshopStep} className="text-amber-500 font-bold text-xs uppercase hover:text-white flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">add_circle</span> Añadir Paso
                                                </button>
                                            </div>
                                            
                                            {path.finalWorkshop.steps?.map((step, idx) => (
                                                <div key={idx} className="p-6 bg-surface-dark rounded-2xl border border-border-dark relative group">
                                                    <button onClick={() => removeWorkshopStep(idx)} className="absolute top-4 right-4 text-red-500/50 hover:text-red-500"><span className="material-symbols-outlined text-sm">delete</span></button>
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="size-8 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center font-black text-xs border border-amber-500/20">{idx + 1}</div>
                                                            <input 
                                                                value={step.title}
                                                                onChange={e => updateWorkshopStep(idx, 'title', e.target.value)}
                                                                className="flex-1 bg-transparent border-b border-border-dark focus:border-amber-500 outline-none text-white font-bold py-1"
                                                                placeholder="Título del paso"
                                                            />
                                                        </div>
                                                        <textarea 
                                                            value={step.description}
                                                            onChange={e => updateWorkshopStep(idx, 'description', e.target.value)}
                                                            className="w-full h-20 bg-background-dark p-3 rounded-xl border border-border-dark focus:border-amber-500 outline-none text-slate-300 text-sm resize-none"
                                                            placeholder="Instrucciones detalladas..."
                                                        />
                                                        <input 
                                                            value={step.image || ''}
                                                            onChange={e => updateWorkshopStep(idx, 'image', e.target.value)}
                                                            className="w-full bg-background-dark p-2 rounded-xl border border-border-dark focus:border-amber-500 outline-none text-text-secondary text-xs"
                                                            placeholder="URL Imagen del paso (opcional)"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                    </div>
                                )}
                            </div>
                        </div>
                    )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-12 bg-background-dark">
             {/* ... Library View (keeping existing logic) ... */}
             <div className="max-w-7xl mx-auto space-y-8">
               {!libraryPathId && (
                 <div className="animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Estructura de Rutas</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {allPaths.map(p => {
                           const lessonCount = myLessons.filter(l => l.pathId === p.id).length;
                           return (
                             <div key={p.id} onClick={() => setLibraryPathId(p.id)} className="p-6 bg-card-dark rounded-3xl border border-border-dark hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer transition-all group flex flex-col items-center text-center gap-3 relative">
                                <button onClick={(e) => { e.stopPropagation(); setPath(p); setLesson(null); setNews(null); setProduct(null); setStudioTab('create'); }} className="absolute top-4 right-4 p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-xl transition-all" title="Editar Propiedades de Ruta"><span className="material-symbols-outlined text-sm">settings</span></button>
                                <div className="size-14 rounded-2xl bg-surface-dark flex items-center justify-center border border-border-dark group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-3xl text-amber-500">folder</span></div>
                                <div><h3 className="font-bold text-sm text-white group-hover:text-amber-500 transition-colors line-clamp-1">{p.title}</h3><p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">{lessonCount} Lecciones</p></div>
                                <button onClick={(e) => { e.stopPropagation(); handleRealDelete(p.id, 'path'); }} className="absolute bottom-4 left-4 p-2 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100" title="Eliminar Ruta Completa"><span className="material-symbols-outlined text-sm">delete</span></button>
                             </div>
                           )
                        })}
                        {getUnassignedCount() > 0 && <div onClick={() => setLibraryPathId('unassigned')} className="p-6 bg-card-dark rounded-3xl border border-dashed border-slate-600 hover:border-slate-400 hover:bg-white/5 cursor-pointer transition-all group flex flex-col items-center text-center gap-3"><div className="size-14 rounded-2xl bg-surface-dark flex items-center justify-center border border-border-dark"><span className="material-symbols-outlined text-3xl text-slate-500">folder_open</span></div><div><h3 className="font-bold text-sm text-slate-300">Sin Asignar</h3><p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">{getUnassignedCount()} Lecciones</p></div></div>}
                        <div onClick={() => setLibraryPathId('products')} className="p-6 bg-card-dark rounded-3xl border border-border-dark hover:border-purple-500/50 hover:bg-purple-500/5 cursor-pointer transition-all group flex flex-col items-center text-center gap-3"><div className="size-14 rounded-2xl bg-surface-dark flex items-center justify-center border border-border-dark group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-3xl text-purple-500">inventory_2</span></div><div><h3 className="font-bold text-sm text-white group-hover:text-purple-500 transition-colors">Inventario</h3><p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">{allProducts.length} Productos</p></div></div>
                    </div>
                 </div>
               )}
               {libraryPathId && (
                 <div className="animate-in slide-in-from-right-4">
                    <div className="flex items-center gap-4 mb-8">
                       <button onClick={() => setLibraryPathId(null)} className="p-2 hover:bg-white/5 rounded-xl text-text-secondary hover:text-white transition-colors"><span className="material-symbols-outlined">arrow_back</span></button>
                       <div className="flex items-center gap-2 text-2xl font-black text-white"><span className="material-symbols-outlined text-amber-500">folder_open</span>{libraryPathId === 'unassigned' ? 'Sin Asignar' : libraryPathId === 'products' ? 'Inventario de Tienda' : allPaths.find(p => p.id === libraryPathId)?.title}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       {libraryPathId === 'products' ? (
                           allProducts.map(prod => (
                               <div key={prod.id} className="p-6 bg-card-dark rounded-3xl border border-border-dark hover:border-purple-500 group relative flex flex-col">
                                   <button onClick={() => handleRealDelete(prod.id, 'product')} className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/10 rounded-lg"><span className="material-symbols-outlined text-sm">delete</span></button>
                                   <div className="flex-1 space-y-2 mb-4"><span className="px-2 py-1 bg-surface-dark rounded text-[9px] font-black uppercase text-purple-400 tracking-widest">{prod.category} • Stock: {prod.stock}</span><h3 className="font-bold text-lg leading-tight">{prod.name}</h3><p className="text-xl font-black text-white">${prod.price}</p></div>
                                   <button onClick={() => {setProduct(prod); setLesson(null); setNews(null); setPath(null); setStudioTab('create');}} className="w-full py-3 bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white rounded-xl font-bold text-xs uppercase transition-all">Editar Producto</button>
                               </div>
                           ))
                       ) : (
                           getFilteredLessons().map(l => (
                               <div key={l.id} className="p-6 bg-card-dark rounded-3xl border border-border-dark hover:border-primary group relative flex flex-col">
                                   <button onClick={() => handleRealDelete(l.id, 'lesson')} className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/10 rounded-lg"><span className="material-symbols-outlined text-sm">delete</span></button>
                                   <div className="flex-1 space-y-2 mb-4"><span className="px-2 py-1 bg-surface-dark rounded text-[9px] font-black uppercase text-primary tracking-widest">Orden: {l.order || 0}</span><h3 className="font-bold text-lg leading-tight">{l.title}</h3><p className="text-xs text-text-secondary line-clamp-2">{l.subtitle}</p></div>
                                   <button onClick={() => {setLesson(l); setNews(null); setPath(null); setProduct(null); setStudioTab('create');}} className="w-full py-3 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl font-bold text-xs uppercase transition-all">Editar Contenido</button>
                               </div>
                           ))
                       )}
                       {((libraryPathId === 'products' && allProducts.length === 0) || (libraryPathId !== 'products' && getFilteredLessons().length === 0)) && <div className="col-span-full py-20 text-center opacity-30 border-2 border-dashed border-border-dark rounded-3xl"><p className="text-xl font-bold">Carpeta vacía</p></div>}
                    </div>
                 </div>
               )}
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ContentStudio;
