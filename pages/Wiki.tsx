import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { WikiEntry, User } from '../types';
import { getApprovedWikiEntries, getPendingWikiEntries, createWikiEntry, approveWikiEntry, deleteWikiEntry } from '../content/wikiRegistry';

const Wiki: React.FC = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<WikiEntry[]>([]);
  const [pendingEntries, setPendingEntries] = useState<WikiEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('Todas');
  const [activeTab, setActiveTab] = useState<'dictionary' | 'moderation'>('dictionary');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSqlHelp, setShowSqlHelp] = useState(false);
  
  // New Entry Form
  const [newTerm, setNewTerm] = useState('');
  const [newDefinition, setNewDefinition] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const user: User | null = useMemo(() => {
    const stored = localStorage.getItem('robo_user');
    return stored ? JSON.parse(stored) : null;
  }, []);

  const loadData = async () => {
    const approved = await getApprovedWikiEntries();
    setEntries(approved);

    if (user?.role === 'editor') {
        const pending = await getPendingWikiEntries();
        setPendingEntries(pending);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('wikiUpdated', loadData);
    return () => window.removeEventListener('wikiUpdated', loadData);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    
    setIsSubmitting(true);
    try {
        await createWikiEntry({
            term: newTerm,
            definition: newDefinition,
            category: newCategory,
            author_name: user.name,
            author_id: user.id
        });
        setShowAddModal(false);
        setNewTerm('');
        setNewDefinition('');
        alert("¡Gracias! Tu término ha sido enviado a moderación. Recibirás XP cuando sea aprobado.");
    } catch (e) {
        setShowSqlHelp(true);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleApprove = async (entry: WikiEntry) => {
      try {
          await approveWikiEntry(entry.id, entry.author_id);
      } catch (e) {
          setShowSqlHelp(true);
      }
  };

  const handleReject = async (id: string) => {
      if(!window.confirm("¿Rechazar y eliminar esta entrada?")) return;
      try {
          await deleteWikiEntry(id);
      } catch (e) {
          setShowSqlHelp(true);
      }
  };

  const filteredEntries = entries.filter(e => {
      const matchesSearch = e.term.toLowerCase().includes(searchTerm.toLowerCase()) || e.definition.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === 'Todas' || e.category === filter;
      return matchesSearch && matchesFilter;
  });

  const categories = ['Todas', 'Electrónica', 'Programación', 'Electricidad', 'General'];

  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark py-12 px-6 relative">
        <div className="max-w-7xl mx-auto space-y-12">
            
            {/* Header */}
            <header className="flex flex-col md:flex-row items-end justify-between gap-6">
                <div className="space-y-4">
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white">WIKI<span className="text-primary">LEARN</span></h1>
                    <p className="text-slate-500 dark:text-text-secondary max-w-xl">
                        La enciclopedia de ingeniería construida por la comunidad. <br/>
                        <span className="text-primary font-bold">¡Contribuye y gana 50 XP por término aceptado!</span>
                    </p>
                </div>
                <div className="flex gap-4">
                     {user?.role === 'editor' && (
                         <div className="flex bg-card-dark p-1 rounded-xl border border-border-dark">
                             <button onClick={() => setActiveTab('dictionary')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'dictionary' ? 'bg-primary text-white' : 'text-text-secondary'}`}>Diccionario</button>
                             <button onClick={() => setActiveTab('moderation')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'moderation' ? 'bg-amber-500 text-black' : 'text-text-secondary'}`}>
                                Moderación 
                                {pendingEntries.length > 0 && <span className="size-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px]">{pendingEntries.length}</span>}
                             </button>
                         </div>
                     )}
                     <button 
                       onClick={() => user ? setShowAddModal(true) : navigate('/login')}
                       className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-xl shadow-primary/20 flex items-center gap-2 hover:scale-105 transition-transform"
                     >
                        <span className="material-symbols-outlined">add_circle</span>
                        Definir Término
                     </button>
                </div>
            </header>

            {/* VISTA DICCIONARIO */}
            {activeTab === 'dictionary' && (
                <div className="space-y-8 animate-in fade-in">
                    {/* Buscador y Filtros */}
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 relative">
                            <span className="material-symbols-outlined absolute left-4 top-3 text-text-secondary">search</span>
                            <input 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-surface-dark border border-border-dark rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:border-primary outline-none"
                                placeholder="Buscar concepto (ej: Resistencia Pull-up)..."
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                           {categories.map(cat => (
                               <button 
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${filter === cat ? 'bg-primary border-primary text-white' : 'bg-transparent border-border-dark text-text-secondary hover:border-primary/50'}`}
                               >
                                   {cat}
                               </button>
                           ))}
                        </div>
                    </div>

                    {/* Grid de Términos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEntries.map(entry => (
                            <div key={entry.id} className="bg-card-dark p-6 rounded-3xl border border-border-dark hover:border-primary/50 transition-all group flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors">{entry.term}</h3>
                                    <span className="px-2 py-1 bg-surface-dark rounded text-[9px] font-black uppercase text-text-secondary tracking-widest">{entry.category}</span>
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed mb-6 flex-1">
                                    {entry.definition}
                                </p>
                                <div className="pt-4 border-t border-border-dark flex justify-between items-center text-[10px] font-bold text-text-secondary uppercase">
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">edit</span> Definido por: {entry.author_name}</span>
                                    {user?.role === 'editor' && (
                                        <button onClick={() => handleReject(entry.id)} className="text-red-500 hover:text-white"><span className="material-symbols-outlined text-sm">delete</span></button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {filteredEntries.length === 0 && (
                            <div className="col-span-full py-20 text-center opacity-50">
                                <span className="material-symbols-outlined text-6xl text-text-secondary mb-4">menu_book</span>
                                <p className="text-white font-bold">No encontramos ese término.</p>
                                <button onClick={() => setShowAddModal(true)} className="text-primary hover:underline mt-2">¡Sé el primero en definirlo!</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* VISTA MODERACIÓN (Solo Editores) */}
            {activeTab === 'moderation' && user?.role === 'editor' && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-amber-500">gavel</span> Cola de Moderación
                    </h2>
                    
                    {pendingEntries.length === 0 ? (
                        <div className="p-12 bg-surface-dark rounded-3xl border border-border-dark text-center">
                            <span className="material-symbols-outlined text-4xl text-green-500 mb-4">check_circle</span>
                            <p className="text-white font-bold">Todo al día. No hay términos pendientes.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {pendingEntries.map(entry => (
                                <div key={entry.id} className="p-6 bg-card-dark rounded-2xl border border-amber-500/30 flex flex-col md:flex-row gap-6 items-start md:items-center">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-black text-white">{entry.term}</h3>
                                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-[10px] font-black uppercase rounded">{entry.category}</span>
                                        </div>
                                        <p className="text-slate-300 text-sm">{entry.definition}</p>
                                        <p className="text-[10px] text-text-secondary">Autor: <span className="text-white font-bold">{entry.author_name}</span></p>
                                    </div>
                                    <div className="flex gap-3 shrink-0">
                                        <button onClick={() => handleReject(entry.id)} className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl font-bold text-xs hover:bg-red-500 hover:text-white transition-all">Rechazar</button>
                                        <button onClick={() => handleApprove(entry)} className="px-6 py-2 bg-green-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-green-500/20 hover:scale-105 transition-all">Aprobar (+50 XP)</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* MODAL NUEVO TÉRMINO */}
        {showAddModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-surface-dark w-full max-w-lg rounded-[32px] border border-border-dark p-8 shadow-2xl animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-black text-white">Definir Nuevo Término</h2>
                        <button onClick={() => setShowAddModal(false)} className="material-symbols-outlined text-text-secondary hover:text-white">close</button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-text-secondary">Concepto / Término</label>
                            <input 
                                required
                                value={newTerm}
                                onChange={e => setNewTerm(e.target.value)}
                                className="w-full bg-card-dark p-4 rounded-xl border border-border-dark focus:border-primary outline-none text-white font-bold"
                                placeholder="Ej: PWM"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-text-secondary">Categoría</label>
                            <select 
                                value={newCategory}
                                onChange={e => setNewCategory(e.target.value)}
                                className="w-full bg-card-dark p-4 rounded-xl border border-border-dark focus:border-primary outline-none text-white"
                            >
                                {categories.filter(c => c !== 'Todas').map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-text-secondary">Definición (Sé preciso)</label>
                            <textarea 
                                required
                                value={newDefinition}
                                onChange={e => setNewDefinition(e.target.value)}
                                className="w-full h-32 bg-card-dark p-4 rounded-xl border border-border-dark focus:border-primary outline-none text-sm text-white resize-none"
                                placeholder="Explica el concepto claramente..."
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest hover:bg-primary/90 transition-all"
                        >
                            {isSubmitting ? 'Enviando...' : 'Enviar a Moderación'}
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* SQL HELP MODAL */}
        {showSqlHelp && (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
                <div className="bg-surface-dark border border-border-dark max-w-2xl w-full rounded-[40px] p-10 space-y-6 shadow-2xl animate-in zoom-in-95">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-black text-white">Configurar Base de Datos Wiki</h2>
                        <button onClick={() => setShowSqlHelp(false)} className="material-symbols-outlined hover:text-red-500">close</button>
                    </div>
                    <p className="text-sm text-text-secondary">Copia y ejecuta este script en Supabase para crear la tabla y permisos:</p>
                    <pre className="bg-black/50 p-6 rounded-2xl text-[10px] font-mono text-green-400 border border-white/5 overflow-x-auto select-all">
{`-- Crear tabla Wiki
CREATE TABLE IF NOT EXISTS public.wiki_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    term TEXT NOT NULL,
    definition TEXT NOT NULL,
    category TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.wiki_entries ENABLE ROW LEVEL SECURITY;

-- Políticas
-- 1. Cualquiera puede leer entradas (aprobadas o no, el filtro se hace en frontend para editores)
CREATE POLICY "Public Read Wiki" ON public.wiki_entries FOR SELECT USING (true);

-- 2. Cualquiera autenticado puede proponer (Insert)
CREATE POLICY "Public Insert Wiki" ON public.wiki_entries FOR INSERT WITH CHECK (true);

-- 3. Permitir actualizar (Aprobar) y borrar (Rechazar) a todos (para Demo, en prod solo admin)
CREATE POLICY "Public Update Wiki" ON public.wiki_entries FOR UPDATE USING (true);
CREATE POLICY "Public Delete Wiki" ON public.wiki_entries FOR DELETE USING (true);`}
                    </pre>
                    <button onClick={() => setShowSqlHelp(false)} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase">Entendido</button>
                </div>
            </div>
        )}
    </div>
  );
};

export default Wiki;