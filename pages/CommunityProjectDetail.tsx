
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCommunityProjectById } from '../content/communityRegistry';
import { CommunityProject } from '../types';

const CommunityProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<CommunityProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const data = await getCommunityProjectById(id);
      setProject(data || null);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <div className="h-screen bg-background-dark flex items-center justify-center text-white font-black animate-pulse">CARGANDO PROYECTO...</div>;
  if (!project) return <div className="h-screen bg-background-dark flex items-center justify-center text-white font-black">PROYECTO NO ENCONTRADO</div>;

  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark min-h-screen">
      {/* HERO SECTION */}
      <div className="relative h-[50vh] w-full overflow-hidden">
         <img src={project.coverImage} className="w-full h-full object-cover" alt={project.title} />
         <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/50 to-transparent"></div>
         <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 max-w-7xl mx-auto">
            <button onClick={() => navigate('/showcase')} className="mb-6 px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg text-white text-xs font-bold uppercase hover:bg-white/20 transition-all flex items-center gap-2 w-fit">
               <span className="material-symbols-outlined text-sm">arrow_back</span> Volver
            </button>
            <span className="px-3 py-1 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">{project.category}</span>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4">{project.title}</h1>
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
         <div className="lg:col-span-2 space-y-12">
            <section className="prose prose-invert prose-lg max-w-none">
               <h3 className="text-2xl font-black text-white uppercase tracking-widest border-b border-border-dark pb-4 mb-6">Descripción</h3>
               <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">{project.description}</p>
            </section>

            <section className="space-y-12">
               <h3 className="text-2xl font-black text-white uppercase tracking-widest border-b border-border-dark pb-4">Pasos de Construcción</h3>
               {project.steps.map((step, idx) => (
                 <div key={idx} className="space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="size-10 bg-primary text-white rounded-full flex items-center justify-center font-black text-lg shadow-lg shadow-primary/20">
                          {idx + 1}
                       </div>
                       <h4 className="text-2xl font-bold text-white">{step.title}</h4>
                    </div>
                    {step.image && (
                       <div className="aspect-video rounded-3xl overflow-hidden border border-border-dark bg-card-dark">
                          <img src={step.image} className="w-full h-full object-cover" alt={step.title} />
                       </div>
                    )}
                    <p className="text-lg text-text-secondary leading-relaxed whitespace-pre-wrap pl-14">
                       {step.content}
                    </p>
                 </div>
               ))}
            </section>
         </div>

         {/* SIDEBAR */}
         <aside className="space-y-8">
            <div className="p-8 bg-card-dark rounded-3xl border border-border-dark sticky top-24">
               <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-3xl text-amber-500">inventory_2</span>
                  <h3 className="text-xl font-black text-white">Materiales</h3>
               </div>
               <ul className="space-y-3">
                  {project.supplies.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 bg-surface-dark rounded-xl border border-border-dark">
                       <span className="material-symbols-outlined text-green-500 text-sm mt-0.5">check_circle</span>
                       <span className="text-sm font-bold text-slate-300">{item}</span>
                    </li>
                  ))}
                  {project.supplies.length === 0 && <li className="text-text-secondary italic text-sm">No se especificaron materiales.</li>}
               </ul>
               <button onClick={() => window.print()} className="w-full mt-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all">
                  <span className="material-symbols-outlined">print</span> Imprimir Guía
               </button>
            </div>
         </aside>
      </div>
    </div>
  );
};

export default CommunityProjectDetail;
