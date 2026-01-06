import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCommunityProjectById, deleteCommunityProject } from '../content/communityRegistry';
import { CommunityProject, User } from '../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

const CommunityProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<CommunityProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSqlHelp, setShowSqlHelp] = useState(false);

  const user: User | null = useMemo(() => {
    const stored = localStorage.getItem('robo_user');
    return stored ? JSON.parse(stored) : null;
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const data = await getCommunityProjectById(id);
      setProject(data || null);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!project || !id) return;
    if (window.confirm("¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.")) {
        try {
            await deleteCommunityProject(id);
            navigate('/showcase');
        } catch(e) {
            console.error(e);
            setShowSqlHelp(true);
        }
    }
  };

  if (loading) return <div className="h-screen bg-background-dark flex items-center justify-center text-white font-black animate-pulse">CARGANDO PROYECTO...</div>;
  if (!project) return <div className="h-screen bg-background-dark flex items-center justify-center text-white font-black">PROYECTO NO ENCONTRADO</div>;

  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark min-h-screen relative font-body">
      {/* HERO SECTION */}
      <div className="relative h-[50vh] w-full overflow-hidden">
         <img src={project.coverImage} className="w-full h-full object-cover" alt={project.title} />
         <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/50 to-transparent"></div>
         <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 max-w-7xl mx-auto">
            <button onClick={() => navigate('/showcase')} className="mb-6 px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg text-white text-xs font-bold uppercase hover:bg-white/20 transition-all flex items-center gap-2 w-fit">
               <span className="material-symbols-outlined text-sm">arrow_back</span> Volver
            </button>
            <span className="px-3 py-1 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">{project.category}</span>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4 font-display">{project.title}</h1>
            <div className="flex items-center gap-6 text-sm font-bold text-white/80">
               <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined">person</span> {project.authorName}
               </div>
               <div className="flex items-center gap-2 text-red-400">
                  <span className="material-symbols-outlined filled">favorite</span> {project.likes} Likes
               </div>
            </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
         {/* MAIN CONTENT */}
         <div className="lg:col-span-2 space-y-16">
            <section className="bg-card-dark rounded-3xl p-8 border border-border-dark">
               <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">info</span> Descripción
               </h3>
               <p className="text-slate-300 text-lg leading-relaxed whitespace-pre-wrap">{project.description}</p>
            </section>

            <section className="space-y-12">
               <div className="flex items-center gap-3 border-b border-border-dark pb-6">
                  <span className="material-symbols-outlined text-3xl text-primary">format_list_numbered</span>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tight font-display">Pasos de Construcción</h3>
               </div>
               
               <div className="space-y-12">
                  {project.steps.map((step, idx) => (
                    <div key={idx} className="relative pl-8 border-l-2 border-border-dark">
                       <div className="absolute left-[-17px] top-0 size-8 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm shadow-lg shadow-primary/20">
                          {idx + 1}
                       </div>
                       
                       <div className="space-y-6">
                          <h4 className="text-2xl font-bold text-white font-display">{step.title}</h4>
                          
                          {step.image && (
                             <div className="aspect-video rounded-2xl overflow-hidden border border-border-dark bg-black shadow-lg">
                                <img src={step.image} className="w-full h-full object-cover" alt={step.title} />
                             </div>
                          )}
                          
                          <div className="text-lg text-slate-300 leading-relaxed bg-surface-dark/50 p-6 rounded-2xl border border-border-dark/50">
                             <MarkdownRenderer content={step.content} />
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </section>
         </div>

         {/* SIDEBAR (Ahora con estilo de "Caja") */}
         <aside className="space-y-8">
            <div className="p-8 bg-[#1a1d24] rounded-3xl border border-amber-500/20 shadow-2xl sticky top-24 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <span className="material-symbols-outlined text-9xl">inventory_2</span>
               </div>
               
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                     <div className="size-10 bg-amber-500 rounded-xl flex items-center justify-center text-black shadow-lg shadow-amber-500/20">
                        <span className="material-symbols-outlined">inventory_2</span>
                     </div>
                     <h3 className="text-xl font-black text-white font-display">Materiales Necesarios</h3>
                  </div>
                  
                  <ul className="space-y-3">
                     {project.supplies.map((item, i) => (
                       <li key={i} className="flex items-start gap-3 p-3 bg-black/20 rounded-xl border border-white/5 hover:border-amber-500/30 transition-colors">
                          <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5">check_circle</span>
                          <span className="text-sm font-bold text-slate-200">{item}</span>
                       </li>
                     ))}
                     {project.supplies.length === 0 && <li className="text-text-secondary italic text-sm text-center py-4 border border-dashed border-white/10 rounded-xl">No se especificaron materiales.</li>}
                  </ul>

                  <button onClick={() => window.print()} className="w-full mt-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all border border-white/10">
                     <span className="material-symbols-outlined">print</span> Imprimir Guía
                  </button>

                  {/* BOTÓN ELIMINAR (SOLO EDITORES) */}
                  {user?.role === 'editor' && (
                     <button onClick={handleDelete} className="w-full mt-4 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all border border-red-500/20">
                        <span className="material-symbols-outlined">delete_forever</span> Eliminar Proyecto
                     </button>
                  )}
               </div>
            </div>
         </aside>
      </div>

      {/* MODAL SQL HELP */}
      {showSqlHelp && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-surface-dark border border-border-dark max-w-2xl w-full rounded-[40px] p-10 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center">
               <h2 className="text-2xl font-black text-white">Error de Permisos (RLS)</h2>
               <button onClick={() => setShowSqlHelp(false)} className="material-symbols-outlined hover:text-red-500">close</button>
            </div>
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-200 text-xs leading-relaxed">
                 <strong className="block mb-2 uppercase tracking-widest text-amber-500">Diagnóstico:</strong>
                 Tu aplicación usa autenticación personalizada (sin sesión real de Supabase Auth), por lo que la base de datos no puede verificar tu rol de "Editor" automáticamente. Debes permitir el borrado público (la app React ya protege el botón visualmente).
            </div>
            <p className="text-sm text-text-secondary">
               Ejecuta este SQL en Supabase para habilitar el borrado público en esta tabla:
            </p>
            <pre className="bg-black/50 p-6 rounded-2xl text-[10px] font-mono text-green-400 border border-white/5 overflow-x-auto select-all">
{`-- Política PERMISIVA para la DEMO
DROP POLICY IF EXISTS "Owner Delete Projects" ON public.community_projects;
DROP POLICY IF EXISTS "Allow Delete for Owners and Editors" ON public.community_projects;

CREATE POLICY "Allow Public Delete"
ON public.community_projects
FOR DELETE
USING (true);`}
            </pre>
            <button onClick={() => setShowSqlHelp(false)} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase">Entendido</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityProjectDetail;