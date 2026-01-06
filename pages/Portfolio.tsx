import React, { useMemo, useEffect, useState } from 'react';
import { PROJECTS } from '../constants';
import { User, Project, LearningPath } from '../types';
import { getAllPaths } from '../content/pathRegistry';
import { supabase } from '../services/supabase';

interface PortfolioProps {
  user?: User | null;
}

// Lista de semillas para generar avatares consistentes
const AVATAR_SEEDS = [
  'Felix', 'Aneka', 'Zoe', 'Midnight', 'Rocky', 'Simba', 
  'Caleb', 'Jasmine', 'Avery', 'Mason', 'Jack', 'Bella'
];

const Portfolio: React.FC<PortfolioProps> = ({ user }) => {
  const [allPaths, setAllPaths] = useState<LearningPath[]>([]);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchPaths = async () => {
      const paths = await getAllPaths();
      setAllPaths(paths);
    };
    fetchPaths();
  }, []);

  const allProjects = useMemo(() => {
    const workshopsCompleted: Project[] = [];
    
    if (user?.completedWorkshops) {
      allPaths.forEach(path => {
        if (path.finalWorkshop && user.completedWorkshops.includes(path.finalWorkshop.id)) {
          workshopsCompleted.push({
            ...path.finalWorkshop,
            author: user.name
          });
        }
      });
    }

    return [...workshopsCompleted, ...PROJECTS];
  }, [user, allPaths]);

  const handleAvatarSelect = async (seed: string) => {
    if (!user) return;
    setIsUpdating(true);
    const newAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

    try {
      // 1. Actualizar en Supabase
      if (supabase) {
        await supabase
          .from('profiles')
          .update({ avatar: newAvatarUrl })
          .eq('id', user.id);
      }

      // 2. Actualizar LocalStorage y Estado Global
      const updatedUser = { ...user, avatar: newAvatarUrl };
      localStorage.setItem('robo_user', JSON.stringify(updatedUser));
      
      // 3. Notificar a la App para refrescar
      window.dispatchEvent(new Event('authChange'));
      
      setIsAvatarModalOpen(false);
    } catch (error) {
      console.error("Error updating avatar:", error);
      alert("No se pudo actualizar el avatar. Intenta de nuevo.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Profile Header */}
        <section className="bg-white dark:bg-card-dark rounded-3xl p-10 border border-slate-200 dark:border-border-dark flex flex-col md:flex-row items-center gap-10 shadow-sm relative overflow-hidden">
           <div className="relative group cursor-pointer" onClick={() => user && setIsAvatarModalOpen(true)}>
              <img src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"} className="size-40 rounded-full border-4 border-primary/20 p-1 bg-surface-dark" alt="Perfil" />
              <div className="absolute bottom-2 right-2 size-8 bg-green-500 border-4 border-white dark:border-card-dark rounded-full z-10"></div>
              
              {/* Overlay de Edición */}
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                 <span className="material-symbols-outlined text-white text-3xl">edit</span>
              </div>
           </div>
           
           <div className="flex-1 space-y-4 text-center md:text-left">
              <div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white">{user?.name || 'Invitado'}</h1>
                <p className="text-primary font-bold uppercase tracking-widest text-sm">
                  {user?.level && user.level > 5 ? 'Ingeniero Pro' : 'Ingeniero en Formación'}
                </p>
              </div>
              <p className="text-slate-500 dark:text-text-secondary max-w-2xl">
                Apasionado por los sistemas embebidos y la robótica autónoma. Construyendo herramientas educativas de código abierto para el futuro de la ingeniería.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                 {[
                   { label: "Proyectos", val: allProjects.length.toString() },
                   { label: "Nivel", val: user?.level?.toString() || "1" },
                   { label: "Workshops", val: user?.completedWorkshops?.length?.toString() || "0" },
                 ].map((stat, i) => (
                   <div key={i} className="px-6 py-2 bg-slate-100 dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark">
                      <span className="font-black text-slate-900 dark:text-white">{stat.val}</span>
                      <span className="ml-2 text-xs text-slate-500 dark:text-text-secondary font-bold uppercase">{stat.label}</span>
                   </div>
                 ))}
              </div>
           </div>
           <button className="px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
             Compartir Perfil
           </button>
        </section>

        {/* Projects Grid */}
        <section className="space-y-8">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black dark:text-white text-slate-900">Mi Portafolio de Proyectos</h2>
              <button className="flex items-center gap-2 text-primary font-bold hover:underline">
                 <span className="material-symbols-outlined text-sm">add</span>
                 Subir Proyecto Personal
              </button>
           </div>
           
           {allProjects.length === 0 ? (
             <div className="text-center py-20 bg-white dark:bg-card-dark rounded-[40px] border-2 border-dashed border-border-dark">
                <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">folder_open</span>
                <p className="text-text-secondary font-bold text-lg">Aún no tienes proyectos. ¡Completa un workshop para empezar!</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {allProjects.map(project => (
                  <div key={project.id} className={`group bg-white dark:bg-card-dark rounded-3xl overflow-hidden border transition-all hover:shadow-2xl ${project.isWorkshop ? 'border-primary shadow-lg shadow-primary/5' : 'border-slate-200 dark:border-border-dark'}`}>
                     <div className="h-56 overflow-hidden relative">
                        <img src={project.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={project.title} />
                        <div className={`absolute top-4 left-4 px-3 py-1 text-white text-[10px] font-black uppercase rounded-lg shadow-lg ${project.isWorkshop ? 'bg-amber-500' : 'bg-primary'}`}>
                          {project.isWorkshop ? 'Certificación' : project.category}
                        </div>
                     </div>
                     <div className="p-6">
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors dark:text-white text-slate-900">{project.title}</h3>
                        <p className="text-slate-500 dark:text-text-secondary text-sm line-clamp-2 mb-4">{project.description}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-border-dark/50">
                           <div className="flex items-center gap-2">
                              <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.author}`} className="size-6 rounded-full bg-slate-800" alt={project.author} />
                              <span className="text-xs font-bold text-slate-400">{project.author}</span>
                           </div>
                           <div className="flex gap-3">
                             {project.isWorkshop && <span className="material-symbols-outlined text-amber-500 text-sm">verified</span>}
                             <button className="text-primary hover:scale-125 transition-transform"><span className="material-symbols-outlined">favorite</span></button>
                           </div>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </section>

        {/* MODAL SELECCIÓN AVATAR */}
        {isAvatarModalOpen && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-surface-dark border border-border-dark max-w-3xl w-full rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
               <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-white">Elige tu Identidad</h2>
                  <button onClick={() => setIsAvatarModalOpen(false)} className="material-symbols-outlined text-text-secondary hover:text-white">close</button>
               </div>
               
               <div className="flex-1 overflow-y-auto pr-2">
                 {isUpdating ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                       <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                       <p className="text-white font-bold text-xs uppercase tracking-widest">Actualizando Perfil...</p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {AVATAR_SEEDS.map((seed) => {
                          const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
                          const isSelected = user?.avatar === url;
                          return (
                            <button 
                              key={seed}
                              onClick={() => handleAvatarSelect(seed)}
                              className={`p-4 rounded-3xl border-2 transition-all group hover:scale-105 ${isSelected ? 'bg-primary/20 border-primary shadow-lg shadow-primary/20' : 'bg-card-dark border-border-dark hover:border-primary/50'}`}
                            >
                               <img src={url} className="w-full h-auto rounded-full bg-surface-dark mb-3" alt={seed} />
                               <p className={`text-xs font-bold uppercase text-center ${isSelected ? 'text-primary' : 'text-text-secondary group-hover:text-white'}`}>{seed}</p>
                            </button>
                          );
                        })}
                    </div>
                 )}
               </div>
               
               <div className="mt-8 pt-6 border-t border-border-dark flex justify-end">
                  <button onClick={() => setIsAvatarModalOpen(false)} className="px-6 py-3 text-text-secondary font-bold hover:text-white text-sm">Cancelar</button>
               </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Portfolio;