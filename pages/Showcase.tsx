
import React from 'react';
import { PROJECTS } from '../constants';

const Showcase: React.FC = () => {
  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row items-end justify-between gap-6">
          <div className="space-y-4">
            <h1 className="text-5xl font-black">VITRINA DE LA <br/> <span className="text-primary">COMUNIDAD</span></h1>
            <p className="text-text-secondary max-w-xl">Proyectos inspiradores de creadores de todo el mundo. Filtra por tecnología o complejidad.</p>
          </div>
          <div className="flex gap-4">
             <button className="px-6 py-3 bg-surface-dark border border-border-dark rounded-xl text-white font-bold text-sm hover:bg-card-dark transition-colors">Filtros</button>
             <button className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-xl shadow-primary/20">Compartir Proyecto</button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
           {Array.from({ length: 12 }).map((_, i) => {
             const proj = PROJECTS[i % PROJECTS.length];
             return (
               <div key={i} className="group flex flex-col bg-card-dark rounded-2xl overflow-hidden border border-border-dark hover:border-primary/50 transition-all cursor-pointer">
                  <div className="aspect-[4/3] overflow-hidden relative">
                     <img src={`https://picsum.photos/seed/proj${i}/600/450`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Proyecto" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                        <button className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg">Ver Detalles</button>
                     </div>
                  </div>
                  <div className="p-4 space-y-2">
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{proj.category}</span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-text-secondary">
                           <span className="material-symbols-outlined text-xs">visibility</span> 1.2k
                        </div>
                     </div>
                     <h3 className="text-white font-bold truncate">{proj.title}</h3>
                  </div>
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
};

export default Showcase;
