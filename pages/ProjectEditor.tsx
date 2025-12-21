

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommunityProject, User } from '../types';
import { saveCommunityProject } from '../content/communityRegistry';

const ProjectEditor: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'supplies' | 'steps'>('info');
  
  const user: User | null = useMemo(() => {
    const stored = localStorage.getItem('robo_user');
    return stored ? JSON.parse(stored) : null;
  }, []);

  const [project, setProject] = useState<CommunityProject>({
    id: `temp_${Date.now()}`,
    title: '',
    description: '',
    coverImage: 'https://picsum.photos/seed/newproj/800/600',
    category: 'General',
    authorId: user?.id || '',
    authorName: user?.name || 'Anon',
    likes: 0,
    supplies: [],
    steps: []
  });

  const [newSupply, setNewSupply] = useState('');

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSave = async () => {
    if (!project.title) return alert("El título es obligatorio");
    setIsSubmitting(true);
    try {
      await saveCommunityProject(project);
      navigate('/showcase');
    } catch (e) {
      alert("Error al guardar. Verifica la consola.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addStep = () => {
    setProject(prev => ({
      ...prev,
      steps: [...prev.steps, { title: `Paso ${prev.steps.length + 1}`, content: '', image: 'https://picsum.photos/seed/step/600/400' }]
    }));
  };

  const updateStep = (index: number, field: string, value: string) => {
    const newSteps = [...project.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setProject({ ...project, steps: newSteps });
  };

  const removeStep = (index: number) => {
    setProject({ ...project, steps: project.steps.filter((_, i) => i !== index) });
  };

  const addSupply = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSupply.trim()) {
      setProject(prev => ({ ...prev, supplies: [...prev.supplies, newSupply.trim()] }));
      setNewSupply('');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background-dark min-h-screen text-white">
      <header className="h-16 border-b border-border-dark bg-surface-dark px-6 flex items-center justify-between sticky top-0 z-50">
         <div className="flex items-center gap-4">
            <button onClick={() => navigate('/showcase')} className="p-2 hover:bg-white/5 rounded-xl text-text-secondary"><span className="material-symbols-outlined">close</span></button>
            <h1 className="font-black text-sm uppercase tracking-widest">Crear Proyecto</h1>
         </div>
         <div className="flex items-center gap-4">
            <div className="flex bg-card-dark p-1 rounded-xl border border-border-dark">
               <button onClick={() => setActiveTab('info')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'info' ? 'bg-primary text-white' : 'text-text-secondary'}`}>Info General</button>
               <button onClick={() => setActiveTab('supplies')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'supplies' ? 'bg-primary text-white' : 'text-text-secondary'}`}>Materiales</button>
               <button onClick={() => setActiveTab('steps')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'steps' ? 'bg-primary text-white' : 'text-text-secondary'}`}>Pasos ({project.steps.length})</button>
            </div>
            <button 
              onClick={handleSave} 
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold uppercase shadow-lg shadow-green-600/20"
            >
              {isSubmitting ? 'Guardando...' : 'Publicar'}
            </button>
         </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-12">
         <div className="max-w-4xl mx-auto space-y-8">
            
            {/* --- PESTAÑA INFO --- */}
            {activeTab === 'info' && (
              <div className="space-y-8 animate-in slide-in-from-left-4">
                 <div className="space-y-4">
                    <label className="text-xs font-black uppercase text-text-secondary">Título del Proyecto</label>
                    <input 
                      value={project.title}
                      onChange={e => setProject({...project, title: e.target.value})}
                      className="w-full text-4xl font-black bg-transparent border-b border-border-dark py-2 outline-none focus:border-primary placeholder-white/20"
                      placeholder="Ej: Brazo Robótico impreso en 3D"
                    />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="text-xs font-black uppercase text-text-secondary">Descripción Corta</label>
                       <textarea 
                          value={project.description}
                          onChange={e => setProject({...project, description: e.target.value})}
                          className="w-full h-40 bg-card-dark p-4 rounded-2xl border border-border-dark outline-none focus:border-primary resize-none"
                          placeholder="Resume de qué trata tu proyecto..."
                       />
                       <label className="text-xs font-black uppercase text-text-secondary">Categoría</label>
                       <select 
                          value={project.category}
                          onChange={e => setProject({...project, category: e.target.value})}
                          className="w-full bg-card-dark p-4 rounded-2xl border border-border-dark outline-none focus:border-primary text-white"
                       >
                          {['General', 'Robótica', 'IoT', 'Impresión 3D', 'Software', 'Electrónica'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                       </select>
                    </div>
                    <div className="space-y-4">
                       <label className="text-xs font-black uppercase text-text-secondary">Imagen de Portada (URL)</label>
                       <div className="aspect-video rounded-2xl overflow-hidden bg-black/20 border border-border-dark relative group">
                          <img src={project.coverImage} className="w-full h-full object-cover opacity-60" alt="Cover" />
                          <div className="absolute inset-0 flex items-center justify-center">
                             <input 
                                value={project.coverImage}
                                onChange={e => setProject({...project, coverImage: e.target.value})}
                                className="w-[90%] bg-black/50 backdrop-blur-md p-2 rounded-xl text-xs text-center border border-white/20 outline-none focus:border-primary"
                                placeholder="https://..."
                             />
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {/* --- PESTAÑA MATERIALES --- */}
            {activeTab === 'supplies' && (
               <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right-4">
                  <div className="text-center space-y-2">
                     <span className="material-symbols-outlined text-4xl text-amber-500">inventory_2</span>
                     <h2 className="text-2xl font-black">Lista de Materiales (BOM)</h2>
                     <p className="text-text-secondary text-sm">¿Qué componentes necesita alguien para replicar esto?</p>
                  </div>

                  <form onSubmit={addSupply} className="flex gap-4">
                     <input 
                       value={newSupply}
                       onChange={e => setNewSupply(e.target.value)}
                       className="flex-1 bg-card-dark p-4 rounded-xl border border-border-dark outline-none focus:border-amber-500"
                       placeholder="Ej: 1x Arduino Uno"
                     />
                     <button type="submit" className="px-6 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400">Añadir</button>
                  </form>

                  <ul className="space-y-2">
                     {project.supplies.map((item, i) => (
                       <li key={i} className="flex justify-between items-center p-4 bg-surface-dark border border-border-dark rounded-xl">
                          <span className="font-bold text-sm">{item}</span>
                          <button onClick={() => setProject(prev => ({...prev, supplies: prev.supplies.filter((_, idx) => idx !== i)}))} className="text-red-500 hover:text-white">
                             <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                       </li>
                     ))}
                     {project.supplies.length === 0 && (
                        <li className="text-center p-8 border border-dashed border-border-dark rounded-xl text-text-secondary italic">No hay materiales listados.</li>
                     )}
                  </ul>
               </div>
            )}

            {/* --- PESTAÑA PASOS --- */}
            {activeTab === 'steps' && (
               <div className="space-y-8 animate-in fade-in">
                  <div className="flex justify-between items-center">
                     <h2 className="text-2xl font-black">Instrucciones Paso a Paso</h2>
                     <button onClick={addStep} className="px-4 py-2 bg-primary/20 text-primary border border-primary/50 rounded-xl text-xs font-black uppercase hover:bg-primary hover:text-white transition-all">
                        + Añadir Paso
                     </button>
                  </div>

                  <div className="space-y-6">
                     {project.steps.map((step, idx) => (
                        <div key={idx} className="p-6 bg-card-dark rounded-3xl border border-border-dark space-y-4 relative group">
                           <div className="absolute top-4 left-[-12px] size-8 bg-primary text-white rounded-full flex items-center justify-center font-black shadow-lg">
                              {idx + 1}
                           </div>
                           <button onClick={() => removeStep(idx)} className="absolute top-4 right-4 text-red-500/50 hover:text-red-500">
                              <span className="material-symbols-outlined">delete</span>
                           </button>

                           <div className="pl-6 space-y-4">
                              <input 
                                 value={step.title}
                                 onChange={e => updateStep(idx, 'title', e.target.value)}
                                 className="w-full bg-transparent text-xl font-bold border-b border-border-dark focus:border-primary outline-none py-2"
                                 placeholder="Título del paso..."
                              />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <textarea 
                                    value={step.content}
                                    onChange={e => updateStep(idx, 'content', e.target.value)}
                                    className="w-full h-40 bg-surface-dark p-4 rounded-xl border border-border-dark outline-none focus:border-primary resize-none text-sm leading-relaxed"
                                    placeholder="Explica qué hacer en este paso..."
                                 />
                                 <div className="space-y-2">
                                    <div className="h-32 bg-black/20 rounded-xl overflow-hidden border border-border-dark relative">
                                       <img src={step.image} className="w-full h-full object-cover" alt="Step Preview" />
                                    </div>
                                    <input 
                                       value={step.image}
                                       onChange={e => updateStep(idx, 'image', e.target.value)}
                                       className="w-full bg-surface-dark p-2 rounded-lg border border-border-dark outline-none text-xs focus:border-primary"
                                       placeholder="URL de imagen..."
                                    />
                                 </div>
                              </div>
                           </div>
                        </div>
                     ))}
                     {project.steps.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-border-dark rounded-3xl opacity-50">
                           <span className="material-symbols-outlined text-4xl mb-2">format_list_numbered</span>
                           <p>Añade el primer paso para comenzar el tutorial.</p>
                        </div>
                     )}
                  </div>
               </div>
            )}
         </div>
      </main>
    </div>
  );
};

export default ProjectEditor;
