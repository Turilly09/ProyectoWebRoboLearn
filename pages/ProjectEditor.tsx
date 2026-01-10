
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CommunityProject, User } from '../types';
import { saveCommunityProject, getCommunityProjectById } from '../content/communityRegistry';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { evaluateBadges } from '../services/badgeService'; // Importar servicio

const ProjectEditor: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!editId);
  const [showSqlHelp, setShowSqlHelp] = useState(false);
  
  const user: User | null = useMemo(() => {
    const stored = localStorage.getItem('robo_user');
    return stored ? JSON.parse(stored) : null;
  }, []);

  const [project, setProject] = useState<CommunityProject>({
    id: `temp_${Date.now()}`,
    title: '',
    description: '',
    coverImage: 'https://picsum.photos/seed/newproj/1200/600',
    category: 'General',
    authorId: user?.id || '',
    authorName: user?.name || 'Anon',
    likes: 0,
    supplies: [],
    steps: []
  });

  const [newSupply, setNewSupply] = useState('');

  // Cargar datos si estamos en modo edición
  useEffect(() => {
    const loadProject = async () => {
      if (!editId) return;
      
      const existing = await getCommunityProjectById(editId);
      if (existing) {
        if (existing.authorId !== user?.id && user?.role !== 'editor') {
          alert("No tienes permiso para editar este proyecto.");
          navigate('/portfolio');
          return;
        }
        setProject(existing);
      } else {
        alert("Proyecto no encontrado.");
        navigate('/portfolio');
      }
      setIsLoading(false);
    };

    if (user && editId) {
      loadProject();
    } else if (!user) {
      navigate('/login');
    }
  }, [editId, user, navigate]);

  if (!user) return null;

  if (isLoading) {
    return (
        <div className="h-screen bg-background-dark flex items-center justify-center text-white font-black animate-pulse">
            CARGANDO DATOS...
        </div>
    );
  }

  const handleSave = async () => {
    if (!project.title) return alert("El título es obligatorio");
    if (project.steps.length === 0) return alert("Añade al menos un paso.");
    
    setIsSubmitting(true);
    try {
      await saveCommunityProject(project);
      
      // --- BADGE LOGIC (Solo si es nuevo proyecto) ---
      if (!editId) {
          const updatedUser = evaluateBadges(user, { actionType: 'project_created' });
          localStorage.setItem('robo_user', JSON.stringify(updatedUser));
          window.dispatchEvent(new Event('authChange'));
      }

      if (editId) {
          navigate(`/community-project/${project.id}`);
      } else {
          navigate('/portfolio');
      }
    } catch (e) {
      console.error(e);
      setShowSqlHelp(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addStep = () => {
    setProject(prev => ({
      ...prev,
      steps: [...prev.steps, { title: `Paso ${prev.steps.length + 1}`, content: '', image: '' }]
    }));
  };

  const updateStep = (index: number, field: string, value: string) => {
    const newSteps = [...project.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setProject({ ...project, steps: newSteps });
  };

  const removeStep = (index: number) => {
    if(!window.confirm("¿Borrar este paso?")) return;
    setProject({ ...project, steps: project.steps.filter((_, i) => i !== index) });
  };

  const addSupply = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSupply.trim()) {
      setProject(prev => ({ ...prev, supplies: [...prev.supplies, newSupply.trim()] }));
      setNewSupply('');
    }
  };

  const removeSupply = (index: number) => {
    setProject(prev => ({ ...prev, supplies: prev.supplies.filter((_, i) => i !== index) }));
  };

  return (
    <div className="flex-1 flex flex-col bg-background-dark min-h-screen text-white font-body relative">
      {/* HEADER FIJO */}
      <header className="h-16 border-b border-border-dark bg-surface-dark px-6 flex items-center justify-between sticky top-0 z-50 shadow-xl">
         <div className="flex items-center gap-4">
            <button onClick={() => navigate('/portfolio')} className="p-2 hover:bg-white/5 rounded-xl text-text-secondary transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h1 className="font-black text-sm uppercase tracking-widest hidden sm:block">
                {editId ? 'Editando Proyecto' : 'Nuevo Proyecto'}
            </h1>
         </div>
         <div className="flex items-center gap-4">
            <div className="hidden md:flex text-[10px] font-bold text-text-secondary uppercase tracking-widest gap-4">
               <span>{project.supplies.length} Materiales</span>
               <span>{project.steps.length} Pasos</span>
            </div>
            <button 
              onClick={handleSave} 
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold uppercase shadow-lg shadow-green-600/20 flex items-center gap-2 transition-all"
            >
              {isSubmitting ? 'Guardando...' : <><span className="material-symbols-outlined text-sm">save</span> {editId ? 'Actualizar' : 'Publicar'}</>}
            </button>
         </div>
      </header>

      <main className="flex-1 overflow-y-auto">
         <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-16">
            
            {/* 1. INFORMACIÓN GENERAL */}
            <section className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
               <div className="relative group rounded-3xl overflow-hidden aspect-[21/9] bg-black border border-border-dark">
                  <img src={project.coverImage} className="w-full h-full object-cover opacity-50 group-hover:opacity-40 transition-opacity" alt="Cover" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 space-y-4">
                     <span className="material-symbols-outlined text-4xl text-white/20">add_a_photo</span>
                     <input 
                        value={project.coverImage}
                        onChange={e => setProject({...project, coverImage: e.target.value})}
                        className="w-full max-w-lg bg-black/50 backdrop-blur-md p-3 rounded-xl text-xs text-center border border-white/10 outline-none focus:border-primary text-white"
                        placeholder="Pega la URL de tu imagen de portada aquí..."
                     />
                  </div>
               </div>

               <div className="space-y-6">
                  <input 
                    value={project.title}
                    onChange={e => setProject({...project, title: e.target.value})}
                    className="w-full bg-transparent text-4xl md:text-5xl font-black text-white placeholder-white/20 border-b border-transparent focus:border-border-dark outline-none py-2"
                    placeholder="Título del Proyecto..."
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="md:col-span-2">
                        <textarea 
                           value={project.description}
                           onChange={e => setProject({...project, description: e.target.value})}
                           className="w-full h-32 bg-card-dark/50 p-4 rounded-2xl border border-border-dark outline-none focus:border-primary resize-none text-sm leading-relaxed"
                           placeholder="Describe brevemente de qué trata tu proyecto y qué problema resuelve..."
                        />
                     </div>
                     <div>
                        <label className="text-[10px] font-black uppercase text-text-secondary mb-2 block">Categoría</label>
                        <select 
                           value={project.category}
                           onChange={e => setProject({...project, category: e.target.value})}
                           className="w-full bg-card-dark p-4 rounded-2xl border border-border-dark outline-none focus:border-primary text-white text-sm font-bold"
                        >
                           {['General', 'Robótica', 'IoT', 'Impresión 3D', 'Software', 'Electrónica'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                     </div>
                  </div>
               </div>
            </section>

            {/* 2. CAJA DE COMPONENTES (SUPPLIES BOX) */}
            <section className="space-y-6 animate-in slide-in-from-bottom-4 duration-700 delay-100">
               <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-amber-500 flex items-center justify-center text-black">
                     <span className="material-symbols-outlined text-lg">inventory_2</span>
                  </div>
                  <h2 className="text-2xl font-black text-white">Caja de Componentes</h2>
               </div>

               <div className="bg-card-dark rounded-3xl border border-border-dark p-8 shadow-xl">
                  <div className="flex flex-col md:flex-row gap-4 mb-8">
                     <form onSubmit={addSupply} className="flex-1 flex gap-4">
                        <div className="flex-1 relative">
                           <span className="material-symbols-outlined absolute left-4 top-3.5 text-text-secondary">search</span>
                           <input 
                             value={newSupply}
                             onChange={e => setNewSupply(e.target.value)}
                             className="w-full bg-surface-dark pl-12 p-4 rounded-xl border border-border-dark outline-none focus:border-amber-500 text-sm"
                             placeholder="Ej: 1x Arduino Uno R3"
                           />
                        </div>
                        <button type="submit" className="px-6 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-colors">
                           Añadir
                        </button>
                     </form>
                  </div>

                  {project.supplies.length === 0 ? (
                     <div className="text-center py-8 border-2 border-dashed border-border-dark rounded-2xl opacity-50">
                        <p className="text-sm font-bold">La caja está vacía. Añade los materiales necesarios.</p>
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {project.supplies.map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-surface-dark rounded-xl border border-border-dark group hover:border-amber-500/50 transition-all">
                             <div className="flex items-center gap-3 min-w-0">
                                <span className="material-symbols-outlined text-amber-500 text-sm">check_circle</span>
                                <span className="text-sm font-bold text-slate-300 truncate">{item}</span>
                             </div>
                             <button onClick={() => removeSupply(i)} className="text-red-500/50 hover:text-red-500 transition-colors">
                                <span className="material-symbols-outlined text-sm">close</span>
                             </button>
                          </div>
                        ))}
                     </div>
                  )}
               </div>
            </section>

            {/* 3. SECUENCIADOR DE PASOS */}
            <section className="space-y-8 animate-in slide-in-from-bottom-4 duration-700 delay-200">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-lg">format_list_numbered</span>
                     </div>
                     <h2 className="text-2xl font-black text-white">Instrucciones de Montaje</h2>
                  </div>
               </div>

               <div className="space-y-12">
                  {project.steps.map((step, idx) => (
                     <div key={idx} className="relative pl-8 md:pl-12 border-l-2 border-border-dark group">
                        <div className="absolute left-[-17px] md:left-[-21px] top-0 size-8 md:size-10 bg-card-dark border-4 border-background-dark text-white rounded-full flex items-center justify-center font-black shadow-lg z-10">
                           {idx + 1}
                        </div>
                        
                        <div className="bg-card-dark rounded-3xl border border-border-dark p-6 md:p-8 space-y-6 relative hover:border-primary/30 transition-all">
                           <button onClick={() => removeStep(idx)} className="absolute top-4 right-4 p-2 text-red-500/30 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                              <span className="material-symbols-outlined">delete</span>
                           </button>

                           <div className="space-y-4">
                              <div className="space-y-1">
                                 <label className="text-[10px] font-black uppercase text-text-secondary">Título del Paso</label>
                                 <input 
                                    value={step.title}
                                    onChange={e => updateStep(idx, 'title', e.target.value)}
                                    className="w-full bg-transparent text-xl font-bold border-b border-border-dark focus:border-primary outline-none py-2 text-white"
                                    placeholder="Ej: Conexión de Motores"
                                 />
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                 <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                       <label className="text-[10px] font-black uppercase text-text-secondary">Explicación</label>
                                       <span className="text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded font-bold">Markdown OK</span>
                                    </div>
                                    <textarea 
                                       value={step.content}
                                       onChange={e => updateStep(idx, 'content', e.target.value)}
                                       className="w-full h-48 bg-surface-dark p-4 rounded-xl border border-border-dark outline-none focus:border-primary resize-none text-sm leading-relaxed font-mono"
                                       placeholder="Explica detalladamente las acciones..."
                                    />
                                 </div>

                                 <div className="space-y-4">
                                    <div className="space-y-2">
                                       <label className="text-[10px] font-black uppercase text-text-secondary">Imagen Referencial</label>
                                       <input 
                                          value={step.image}
                                          onChange={e => updateStep(idx, 'image', e.target.value)}
                                          className="w-full bg-surface-dark p-3 rounded-xl border border-border-dark outline-none text-xs focus:border-primary text-white"
                                          placeholder="URL de imagen (https://...)"
                                       />
                                    </div>
                                    <div className="h-32 bg-black/20 rounded-xl overflow-hidden border border-border-dark flex items-center justify-center relative bg-surface-dark">
                                       {step.image ? (
                                          <img src={step.image} className="w-full h-full object-cover" alt="Preview" />
                                       ) : (
                                          <span className="material-symbols-outlined text-text-secondary opacity-30">image</span>
                                       )}
                                    </div>
                                    {/* PREVIEW MINI */}
                                    <div className="bg-surface-dark/50 p-3 rounded-xl border border-border-dark/50 max-h-32 overflow-y-auto">
                                       <p className="text-[9px] font-black uppercase text-text-secondary mb-1">Vista Previa Texto:</p>
                                       <MarkdownRenderer content={step.content} className="text-xs text-slate-400" />
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  ))}
                  
                  <div className="pl-12">
                     <button 
                        onClick={addStep}
                        className="w-full py-6 border-2 border-dashed border-border-dark rounded-3xl flex flex-col items-center justify-center gap-2 text-text-secondary hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all group"
                     >
                        <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">add_circle</span>
                        <span className="font-bold text-sm uppercase tracking-widest">Añadir Siguiente Paso</span>
                     </button>
                  </div>
               </div>
            </section>
         </div>
      </main>

      {/* MODAL SQL HELP */}
      {showSqlHelp && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-surface-dark border border-border-dark max-w-2xl w-full rounded-[40px] p-10 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center">
               <h2 className="text-2xl font-black text-white">Error de Permisos (Update)</h2>
               <button onClick={() => setShowSqlHelp(false)} className="material-symbols-outlined hover:text-red-500">close</button>
            </div>
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-200 text-xs leading-relaxed">
                 <strong className="block mb-2 uppercase tracking-widest text-amber-500">Diagnóstico:</strong>
                 No puedes guardar los cambios porque la base de datos bloquea la actualización (UPDATE).
            </div>
            <p className="text-sm text-text-secondary">
               Ejecuta este SQL en Supabase para permitir que los usuarios editen sus proyectos:
            </p>
            <pre className="bg-black/50 p-6 rounded-2xl text-[10px] font-mono text-green-400 border border-white/5 overflow-x-auto select-all">
{`-- Habilitar Update
DROP POLICY IF EXISTS "Allow Public Update Projects" ON public.community_projects;
CREATE POLICY "Allow Public Update Projects"
ON public.community_projects
FOR UPDATE
USING (true);

-- Asegurar Insert (por si acaso)
DROP POLICY IF EXISTS "Allow Public Insert Projects" ON public.community_projects;
CREATE POLICY "Allow Public Insert Projects"
ON public.community_projects
FOR INSERT
WITH CHECK (true);`}
            </pre>
            <button onClick={() => setShowSqlHelp(false)} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase">Entendido</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectEditor;
