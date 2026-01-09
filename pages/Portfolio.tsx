
import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Project, LearningPath, CommunityProject } from '../types';
import { getAllPaths } from '../content/pathRegistry';
import { getAllCommunityProjects, deleteCommunityProject } from '../content/communityRegistry';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface PortfolioProps {
  user?: User | null;
}

// Colección de semillas para avatares
const HUMAN_SEEDS = ['Felix', 'Aneka', 'Zack', 'Milo', 'Sorelle', 'Jabala', 'Buster', 'Pepper', 'Annie', 'Shadow', 'Riley', 'Leo'];
const ROBOT_SEEDS = ['Tech', 'Circuit', 'Byte', 'Nano', 'Giga', 'Mega', 'Tera', 'Pico', 'Exa', 'Zetta', 'Yotta', 'Mechanic'];

const Portfolio: React.FC<PortfolioProps> = ({ user }) => {
  const navigate = useNavigate();
  const [allPaths, setAllPaths] = useState<LearningPath[]>([]);
  const [communityProjects, setCommunityProjects] = useState<CommunityProject[]>([]);
  
  // Estados para Edición de Perfil
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [avatarTab, setAvatarTab] = useState<'human' | 'robot'>('human');

  const [isSaving, setIsSaving] = useState(false);
  const [showSqlHelp, setShowSqlHelp] = useState(false);

  // Inicializar campos de edición cuando carga el usuario
  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditDesc(user.description || "Apasionado por los sistemas embebidos y la robótica autónoma. Construyendo herramientas educativas de código abierto para el futuro de la ingeniería.");
      setEditAvatar(user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`);
    }
  }, [user]);

  const fetchData = async () => {
    const [paths, commProjs] = await Promise.all([
      getAllPaths(),
      getAllCommunityProjects()
    ]);
    setAllPaths(paths);
    setCommunityProjects(commProjs);
  };

  useEffect(() => {
    fetchData();
    window.addEventListener('communityUpdated', fetchData);
    return () => window.removeEventListener('communityUpdated', fetchData);
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("¿Estás seguro de que deseas eliminar este proyecto de tu portafolio permanentemente?")) {
        try {
            await deleteCommunityProject(id);
            setCommunityProjects(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            alert("Hubo un error al intentar borrar el proyecto.");
            console.error(error);
        }
    }
  };

  const handleEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate(`/project-editor?edit=${id}`);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      // 1. Actualizar en Supabase
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            name: editName,
            description: editDesc,
            avatar: editAvatar
          })
          .eq('id', user.id);

        if (error) throw error;
      }

      // 2. Actualizar LocalStorage y Estado Global
      const updatedUser: User = { 
        ...user, 
        name: editName, 
        description: editDesc,
        avatar: editAvatar
      };
      
      // Importante: No guardar el password si estuviera en el objeto user en memoria
      const safeUser = { ...updatedUser }; 
      localStorage.setItem('robo_user', JSON.stringify(safeUser));
      
      // 3. Notificar a la App para refrescar navbar, etc.
      window.dispatchEvent(new Event('authChange'));
      
      setIsEditing(false);
      setShowAvatarSelector(false);
    } catch (error: any) {
      console.error("Error guardando perfil:", error);
      // Si el error es por columna faltante, mostramos ayuda SQL
      if (error.message?.includes('column') || error.code === '42703') {
        setShowSqlHelp(true);
      } else {
        alert("Error al guardar cambios. Verifica la consola.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getAvatarUrl = (type: 'human' | 'robot', seed: string) => {
      const style = type === 'human' ? 'avataaars' : 'bottts';
      return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
  };

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

    return list;
  }, [user, allPaths, communityProjects]);

  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark py-12 px-6 relative">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Profile Header */}
        <section className="bg-white dark:bg-card-dark rounded-3xl p-10 border border-slate-200 dark:border-border-dark flex flex-col md:flex-row items-center gap-10 shadow-sm relative group/header">
           
           {/* Botón de Editar Perfil (Solo visible si es el usuario logueado) */}
           {user && !isEditing && (
             <button 
               onClick={() => setIsEditing(true)}
               className="absolute top-6 right-6 p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
               title="Editar Perfil"
             >
               <span className="material-symbols-outlined">edit</span>
             </button>
           )}

           <div className="relative shrink-0 flex flex-col items-center gap-4">
              <div className="relative">
                <img src={isEditing ? editAvatar : (user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=default")} className="size-40 rounded-full border-4 border-primary/20 p-1 bg-surface-dark" alt="Perfil" />
                {!isEditing && <div className="absolute bottom-2 right-2 size-8 bg-green-500 border-4 border-white dark:border-card-dark rounded-full"></div>}
                
                {/* Botón cambiar avatar (Solo edición) */}
                {isEditing && (
                    <button 
                        onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer text-white font-bold flex-col gap-1 backdrop-blur-sm"
                    >
                        <span className="material-symbols-outlined text-3xl">photo_camera</span>
                        <span className="text-[10px] uppercase">Cambiar</span>
                    </button>
                )}
              </div>
           </div>
           
           <div className="flex-1 space-y-4 text-center md:text-left w-full">
              {!isEditing ? (
                <>
                  <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white">{user?.name || 'Invitado'}</h1>
                    <p className="text-primary font-bold uppercase tracking-widest text-sm">
                      {user?.level && user.level > 5 ? 'Ingeniero Pro' : 'Ingeniero en Formación'}
                    </p>
                  </div>
                  <p className="text-slate-500 dark:text-text-secondary max-w-2xl text-lg leading-relaxed">
                    {user?.description || "Apasionado por los sistemas embebidos y la robótica autónoma. Construyendo herramientas educativas de código abierto para el futuro de la ingeniería."}
                  </p>
                </>
              ) : (
                <div className="space-y-4 w-full animate-in fade-in">
                  
                  {/* SELECTOR DE AVATAR EXPANDIBLE */}
                  {showAvatarSelector && (
                      <div className="bg-surface-dark p-6 rounded-2xl border border-border-dark space-y-4 mb-4 animate-in slide-in-from-top-4">
                          <div className="flex gap-2 border-b border-border-dark pb-2">
                              <button onClick={() => setAvatarTab('human')} className={`px-4 py-2 text-xs font-black uppercase rounded-lg transition-all ${avatarTab === 'human' ? 'bg-primary text-white' : 'text-text-secondary hover:text-white'}`}>Ingenieros</button>
                              <button onClick={() => setAvatarTab('robot')} className={`px-4 py-2 text-xs font-black uppercase rounded-lg transition-all ${avatarTab === 'robot' ? 'bg-amber-500 text-black' : 'text-text-secondary hover:text-white'}`}>Droides</button>
                          </div>
                          <div className="grid grid-cols-4 md:grid-cols-6 gap-3 max-h-48 overflow-y-auto p-1">
                              {(avatarTab === 'human' ? HUMAN_SEEDS : ROBOT_SEEDS).map(seed => {
                                  const url = getAvatarUrl(avatarTab, seed);
                                  return (
                                      <button 
                                        key={seed} 
                                        onClick={() => setEditAvatar(url)}
                                        className={`p-1 rounded-xl border-2 transition-all ${editAvatar === url ? 'border-primary bg-primary/20 scale-105' : 'border-transparent hover:border-white/20 hover:bg-white/5'}`}
                                      >
                                          <img src={url} alt={seed} className="w-full h-auto rounded-lg" />
                                      </button>
                                  )
                              })}
                          </div>
                      </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-text-secondary">Tu Nombre</label>
                    <input 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full text-2xl md:text-4xl font-black bg-surface-dark border-b-2 border-primary text-white focus:outline-none py-1"
                      placeholder="Tu Nombre"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-text-secondary">Biografía / Descripción</label>
                    <textarea 
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full h-32 bg-surface-dark p-4 rounded-xl border border-border-dark text-slate-300 focus:border-primary outline-none resize-none"
                      placeholder="Escribe algo sobre ti..."
                    />
                  </div>
                  <div className="flex gap-3 justify-center md:justify-start">
                    <button 
                      onClick={handleSaveProfile} 
                      disabled={isSaving}
                      className="px-6 py-2 bg-primary text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                    >
                      {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                    <button 
                      onClick={() => { setIsEditing(false); setShowAvatarSelector(false); setEditAvatar(user?.avatar || ''); }} 
                      disabled={isSaving}
                      className="px-6 py-2 bg-card-dark text-text-secondary font-bold rounded-xl text-xs uppercase tracking-widest border border-border-dark hover:text-white hover:bg-surface-dark transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {!isEditing && (
                <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
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
              )}
           </div>
           
           {!isEditing && (
             <button className="px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
               Compartir Perfil
             </button>
           )}
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
                    className={`group bg-white dark:bg-card-dark rounded-3xl overflow-hidden border transition-all hover:shadow-2xl relative ${project.isWorkshop ? 'border-primary shadow-lg shadow-primary/5 cursor-default' : 'border-slate-200 dark:border-border-dark cursor-pointer'}`}
                  >
                     <div className="h-56 overflow-hidden relative">
                        <img src={project.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={project.title} />
                        <div className={`absolute top-4 left-4 px-3 py-1 text-white text-[10px] font-black uppercase rounded-lg shadow-lg ${project.isWorkshop ? 'bg-amber-500' : 'bg-primary'}`}>
                          {project.isWorkshop ? 'Certificación' : project.category}
                        </div>
                        
                        {/* Botones de Acción (Solo para proyectos personales) */}
                        {!project.isWorkshop && (
                           <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-20">
                             <button 
                               onClick={(e) => handleEdit(e, project.id)}
                               className="p-2 bg-white/90 text-black rounded-lg shadow-lg hover:bg-white hover:scale-110 transition-all"
                               title="Editar Proyecto"
                             >
                                <span className="material-symbols-outlined text-sm">edit</span>
                             </button>
                             <button 
                               onClick={(e) => handleDelete(e, project.id)}
                               className="p-2 bg-red-500/90 text-white rounded-lg shadow-lg hover:bg-red-600 hover:scale-110 transition-all"
                               title="Eliminar Proyecto"
                             >
                                <span className="material-symbols-outlined text-sm">delete</span>
                             </button>
                           </div>
                        )}
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

        {/* MODAL AYUDA SQL (Si falta la columna) */}
        {showSqlHelp && (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
                <div className="bg-surface-dark border border-border-dark max-w-2xl w-full rounded-[40px] p-10 space-y-6 shadow-2xl animate-in zoom-in-95">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-black text-white">Actualización de Base de Datos Requerida</h2>
                        <button onClick={() => setShowSqlHelp(false)} className="material-symbols-outlined hover:text-red-500">close</button>
                    </div>
                    <p className="text-sm text-text-secondary">
                        Para guardar la descripción y el avatar personalizado, necesitas añadir las columnas a la tabla <code>profiles</code> en Supabase. Ejecuta este SQL:
                    </p>
                    <pre className="bg-black/50 p-6 rounded-2xl text-[10px] font-mono text-green-400 border border-white/5 overflow-x-auto select-all">
{`ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Opcional: Permitir updates públicos (solo para Demo)
DROP POLICY IF EXISTS "Public Update Profiles" ON public.profiles;
CREATE POLICY "Public Update Profiles" ON public.profiles FOR UPDATE USING (true);`}
                    </pre>
                    <button onClick={() => setShowSqlHelp(false)} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase">Entendido</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;
