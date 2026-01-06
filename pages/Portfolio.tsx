import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PROJECTS } from '../constants';
import { User, Project, LearningPath, CommunityProject } from '../types';
import { getAllPaths } from '../content/pathRegistry';
import { getAllCommunityProjects } from '../content/communityRegistry';

interface PortfolioProps {
  user?: User | null;
}

const Portfolio: React.FC<PortfolioProps> = ({ user }) => {
  const navigate = useNavigate();
  const [allPaths, setAllPaths] = useState<LearningPath[]>([]);
  const [communityProjects, setCommunityProjects] = useState<CommunityProject[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [paths, commProjs] = await Promise.all([
        getAllPaths(),
        getAllCommunityProjects()
      ]);
      setAllPaths(paths);
      setCommunityProjects(commProjs);
    };
    fetchData();
  }, []);

  const allProjects = useMemo(() => {
    const list: Project[] = [];
    
    // 1. Añadir Workshops completados (Certificaciones)
    if (user?.completedWorkshops) {
      allPaths.forEach(path => {
        if (path.finalWorkshop && user.completedWorkshops.includes(path.finalWorkshop.id)) {
          list.push({
            ...path.finalWorkshop,
            author: user.name,
            isWorkshop: true
          });
        }
      });
    }

    // 2. Añadir Proyectos Personales creados en la Comunidad
    if (user) {
        const myCommProjects = communityProjects.filter(p => p.authorId === user.id);
        const mappedProjects: Project[] = myCommProjects.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            image: p.coverImage,
            category: p.category,
            author: p.authorName,
            isWorkshop: false
        }));
        list.push(...mappedProjects);
    }

    // 3. Añadir estáticos (ahora vacío por defecto)
    return [...list, ...PROJECTS];
  }, [user, allPaths, communityProjects]);

  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Profile Header */}
        <section className="bg-white dark:bg-card-dark rounded-3xl p-10 border border-slate-200 dark:border-border-dark flex flex-col md:flex-row items-center gap-10 shadow-sm">
           <div className="relative">
              <img src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"} className="size-40 rounded-full border-4 border-primary/20 p-1" alt="Perfil" />
              <div className="absolute bottom-2 right-2 size-8 bg-green-500 border-4 border-white dark:border-card-dark rounded-full"></div>
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
                   { label: "Total Proyectos", val: allProjects.length.toString() },
                   { label: "Nivel", val: user?.level?.toString() || "1" },
                   { label: "Certificaciones", val: user?.completedWorkshops?.length?.toString() || "0" },
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
              <h2 className="text-2xl font-black">Mi Portafolio de Proyectos</h2>
              <button 
                onClick={() => user ? navigate('/project-editor') : navigate('/login')}
                className="flex items-center gap-2 text-primary font-bold hover:underline"
              >
                 <span className="material-symbols-outlined text-sm">add_circle</span>
                 Subir Proyecto Personal
              </button>
           </div>
           
           {allProjects.length === 0 ? (
             <div className="text-center py-20 bg-white dark:bg-card-dark rounded-[40px] border-2 border-dashed border-border-dark">
                <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">folder_open</span>
                <p className="text-text-secondary font-bold text-lg">Aún no tienes proyectos.</p>
                <div className="flex gap-4 justify-center mt-4">
                    <button onClick={() => navigate('/paths')} className="text-primary font-bold hover:underline text-sm">Completar un Workshop</button>
                    <span className="text-text-secondary">•</span>
                    <button onClick={() => navigate('/project-editor')} className="text-primary font-bold hover:underline text-sm">Crear Proyecto Personal</button>
                </div>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {allProjects.map(project => (
                  <div 
                    key={project.id} 
                    onClick={() => !project.isWorkshop && navigate(`/community-project/${project.id}`)}
                    className={`group bg-white dark:bg-card-dark rounded-3xl overflow-hidden border transition-all hover:shadow-2xl ${project.isWorkshop ? 'border-primary shadow-lg shadow-primary/5 cursor-default' : 'border-slate-200 dark:border-border-dark cursor-pointer'}`}
                  >
                     <div className="h-56 overflow-hidden relative">
                        <img src={project.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={project.title} />
                        <div className={`absolute top-4 left-4 px-3 py-1 text-white text-[10px] font-black uppercase rounded-lg shadow-lg ${project.isWorkshop ? 'bg-amber-500' : 'bg-primary'}`}>
                          {project.isWorkshop ? 'Certificación' : project.category}
                        </div>
                     </div>
                     <div className="p-6">
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{project.title}</h3>
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
      </div>
    </div>
  );
};

export default Portfolio;