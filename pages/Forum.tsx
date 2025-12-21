import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPosts, createPost, likePost } from '../content/forumRegistry';
import { ForumPost, User } from '../types';

const Forum: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [activeBoard, setActiveBoard] = useState('Ayuda General');
  
  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const user: User | null = useMemo(() => {
    const stored = localStorage.getItem('robo_user');
    return stored ? JSON.parse(stored) : null;
  }, []);

  const loadPosts = async () => {
    setIsLoading(true);
    const data = await getAllPosts();
    setPosts(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadPosts();
    window.addEventListener('forumUpdated', loadPosts);
    return () => window.removeEventListener('forumUpdated', loadPosts);
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      await createPost({
        title: newTitle,
        content: newContent,
        author: user.name,
        tags: newTags.split(',').map(t => t.trim()).filter(t => t !== '')
      });
      setShowNewPostModal(false);
      setNewTitle('');
      setNewContent('');
      setNewTags('');
    } catch (error) {
      alert("Error al crear el post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (post: ForumPost) => {
    // Optimistic update
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: p.likes + 1 } : p));
    await likePost(post.id, post.likes);
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const boards = [
    { name: "Ayuda General", icon: "help_center" },
    { name: "Lógica Arduino", icon: "memory" },
    { name: "CAD y Diseño", icon: "layers" },
    { name: "Muestra y Cuenta", icon: "campaign" },
    { name: "Bolsa de Trabajo", icon: "work" },
  ];

  return (
    <div className="flex-1 flex bg-background-dark overflow-hidden relative">
      <aside className="hidden lg:flex w-72 flex-col bg-surface-dark border-r border-border-dark shrink-0">
        <div className="p-6 space-y-6">
           <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-text-secondary tracking-widest">Tableros de Discusión</h3>
              <div className="space-y-1">
                 {boards.map((board, i) => (
                   <div 
                    key={i} 
                    onClick={() => setActiveBoard(board.name)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${activeBoard === board.name ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-card-dark'}`}
                   >
                      <span className="material-symbols-outlined text-sm">{board.icon}</span>
                      <span className="text-sm font-bold">{board.name}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative">
         <header className="p-8 border-b border-border-dark space-y-6 bg-surface-dark/50 backdrop-blur-md sticky top-0 z-30">
            <h1 className="text-4xl font-black text-white">Foro: <span className="text-primary">{activeBoard}</span></h1>
            <div className="flex gap-4">
               <div className="flex-1 relative">
                  <span className="material-symbols-outlined absolute left-4 top-3 text-text-secondary">search</span>
                  <input 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-surface-dark rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all border border-border-dark" 
                    placeholder="Buscar discusiones por título o etiquetas..." 
                  />
               </div>
               <button 
                onClick={() => user ? setShowNewPostModal(true) : navigate('/login')}
                className="px-6 py-3 bg-primary text-white font-bold rounded-xl whitespace-nowrap hover:bg-primary/80 transition-all shadow-lg shadow-primary/20"
               >
                 Hacer Pregunta
               </button>
            </div>
         </header>

         <div className="flex-1 overflow-y-auto p-8 space-y-4">
            {isLoading ? (
               <div className="space-y-4">
                 {[1,2,3].map(i => <div key={i} className="h-32 bg-card-dark rounded-2xl animate-pulse"></div>)}
               </div>
            ) : filteredPosts.length === 0 ? (
               <div className="text-center py-20 opacity-50">
                  <span className="material-symbols-outlined text-6xl text-text-secondary mb-4">forum</span>
                  <p className="text-white font-bold">No hay discusiones aún.</p>
                  <p className="text-sm text-text-secondary">Sé el primero en preguntar.</p>
               </div>
            ) : (
              filteredPosts.map((post) => (
                <div key={post.id} className="p-6 bg-card-dark rounded-2xl border border-border-dark hover:border-primary/50 transition-all group animate-in slide-in-from-bottom-2">
                   <div className="flex items-start justify-between gap-4">
                      <div className="space-y-3 flex-1">
                         <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{post.title}</h3>
                         <p className="text-sm text-text-secondary line-clamp-2">{post.content}</p>
                         <div className="flex items-center gap-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest pt-2">
                            <span className="text-primary flex items-center gap-1">
                              <span className="material-symbols-outlined text-[10px]">person</span>
                              @{post.author}
                            </span>
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                            <div className="flex gap-2">
                               {post.tags.map(tag => (
                                 <span key={tag} className="px-2 py-0.5 bg-surface-dark rounded border border-border-dark">#{tag}</span>
                               ))}
                            </div>
                         </div>
                      </div>
                      <div className="flex flex-col gap-3 shrink-0">
                         <button onClick={() => handleLike(post)} className="flex flex-col items-center p-2 rounded-lg hover:bg-white/5 transition-colors group/like">
                            <span className="material-symbols-outlined text-lg text-text-secondary group-hover/like:text-red-500 transition-colors">favorite</span>
                            <span className="text-[10px] font-black text-white">{post.likes}</span>
                         </button>
                         <div className="flex flex-col items-center p-2">
                            <span className="material-symbols-outlined text-lg text-text-secondary">chat_bubble</span>
                            <span className="text-[10px] font-black text-white">{post.replies}</span>
                         </div>
                      </div>
                   </div>
                </div>
              ))
            )}
         </div>
      </main>

      {/* MODAL CREAR POST */}
      {showNewPostModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-surface-dark w-full max-w-2xl rounded-[32px] border border-border-dark p-8 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-black text-white">Nueva Discusión</h2>
                 <button onClick={() => setShowNewPostModal(false)} className="material-symbols-outlined text-text-secondary hover:text-white">close</button>
              </div>
              
              <form onSubmit={handleCreatePost} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-text-secondary">Título de tu pregunta</label>
                    <input 
                      required
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      className="w-full bg-card-dark p-4 rounded-xl border border-border-dark focus:border-primary outline-none text-white font-bold"
                      placeholder="Ej: Problema con interrupciones en ESP32"
                    />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-text-secondary">Detalles técnicos</label>
                    <textarea 
                      required
                      value={newContent}
                      onChange={e => setNewContent(e.target.value)}
                      className="w-full h-40 bg-card-dark p-4 rounded-xl border border-border-dark focus:border-primary outline-none text-sm text-white resize-none"
                      placeholder="Describe tu problema, hardware usado y código relevante..."
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-text-secondary">Etiquetas (separadas por coma)</label>
                    <input 
                      value={newTags}
                      onChange={e => setNewTags(e.target.value)}
                      className="w-full bg-card-dark p-4 rounded-xl border border-border-dark focus:border-primary outline-none text-sm text-text-secondary"
                      placeholder="Ej: Arduino, C++, Motores"
                    />
                 </div>

                 <button 
                   type="submit" 
                   disabled={isSubmitting}
                   className="w-full py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                 >
                   {isSubmitting ? 'Publicando...' : 'Publicar Pregunta'}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Forum;