
import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getAllNews } from '../content/newsRegistry';
import { NewsItem, ContentBlock } from '../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

const Blog: React.FC = () => {
  const [searchParams] = useSearchParams();
  const detailId = searchParams.get('id');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [allNewsItems, setAllNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNews = async () => {
      setIsLoading(true);
      const news = await getAllNews();
      setAllNewsItems(news);
      setIsLoading(false);
    };
    loadNews();
    window.addEventListener('newsUpdated', loadNews);
    return () => window.removeEventListener('newsUpdated', loadNews);
  }, []);

  const filteredNews = useMemo(() => {
    return allNewsItems.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todas' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allNewsItems, searchTerm, selectedCategory]);

  const categories = ['Todas', 'Tecnología', 'Comunidad', 'Tutorial', 'Evento'];

  const detailItem = useMemo(() => allNewsItems.find(n => n.id === detailId), [allNewsItems, detailId]);

  // Helper para renderizar bloques de noticia
  const renderNewsBlock = (block: ContentBlock, idx: number) => {
    switch (block.type) {
      case 'text':
        return (
           <div key={idx} className="text-lg text-slate-300 leading-relaxed mb-6">
             <MarkdownRenderer content={block.content} />
           </div>
        );
      case 'image':
        return (
           <div key={idx} className="aspect-video w-full rounded-[32px] overflow-hidden shadow-2xl border border-border-dark relative bg-black my-8">
             <img src={block.content} className="w-full h-full object-cover" alt="Visual" />
           </div>
        );
      case 'video':
        return (
           <div key={idx} className="aspect-video w-full rounded-[32px] overflow-hidden shadow-2xl border border-border-dark bg-black my-8">
              <iframe src={block.content} title="Video" className="w-full h-full" frameBorder="0" allowFullScreen></iframe>
           </div>
        );
      default:
        return null;
    }
  };

  if (detailItem) {
    return (
      <div className="flex-1 bg-background-dark py-16 px-6">
        <article className="max-w-4xl mx-auto space-y-12">
          <header className="space-y-6 text-center">
            <div className="flex justify-center">
               <span className="px-4 py-1.5 bg-primary/20 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                {detailItem.category}
               </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">{detailItem.title}</h1>
            <div className="flex items-center justify-center gap-6 text-text-secondary text-sm font-bold">
               <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">person</span>
                  {detailItem.author}
               </div>
               <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">calendar_month</span>
                  {detailItem.date}
               </div>
               <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  {detailItem.readTime}
               </div>
            </div>
          </header>

          <div className="aspect-video w-full rounded-[40px] overflow-hidden shadow-2xl border border-border-dark">
             <img src={detailItem.image} className="w-full h-full object-cover" alt={detailItem.title} />
          </div>

          <div className="prose prose-invert prose-lg max-w-none text-text-secondary leading-relaxed">
             <p className="text-2xl font-medium text-white/80 border-l-4 border-primary pl-8 italic mb-12">
               {detailItem.excerpt}
             </p>
             
             {/* RENDERIZADO DINÁMICO DE BLOQUES */}
             {detailItem.blocks && detailItem.blocks.length > 0 ? (
                <div>
                  {detailItem.blocks.map((block, idx) => renderNewsBlock(block, idx))}
                </div>
             ) : (
                // Fallback Legacy (Texto plano)
                <div className="whitespace-pre-wrap text-lg">
                    {detailItem.content}
                </div>
             )}

             <div className="h-px bg-border-dark my-10"></div>
             <div className="flex justify-between items-center">
                <button 
                  onClick={() => window.history.back()}
                  className="px-8 py-3 bg-card-dark text-white rounded-2xl font-bold flex items-center gap-2 border border-border-dark hover:bg-surface-dark transition-all"
                >
                   <span className="material-symbols-outlined">arrow_back</span> Volver al Blog
                </button>
             </div>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background-dark py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row items-end justify-between gap-8 bg-surface-dark p-12 rounded-[40px] border border-border-dark relative overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] size-96 bg-primary/10 rounded-full blur-[100px]"></div>
          <div className="relative z-10 space-y-4">
            <h1 className="text-5xl font-black text-white">BLOG DE <br/> <span className="text-primary">INGENIERÍA</span></h1>
            <p className="text-text-secondary max-w-xl">Noticias, lanzamientos de productos, tutoriales avanzados y eventos de la comunidad RoboLearn.</p>
          </div>
          <div className="relative z-10 w-full md:w-96">
            <span className="material-symbols-outlined absolute left-4 top-3 text-text-secondary">search</span>
            <input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-card-dark border border-border-dark rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all" 
              placeholder="Buscar artículos..." 
            />
          </div>
        </header>

        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
           {categories.map(cat => (
             <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-full text-xs font-black uppercase transition-all whitespace-nowrap border ${selectedCategory === cat ? 'bg-primary border-primary text-white' : 'bg-card-dark border-border-dark text-text-secondary hover:text-white'}`}
             >
               {cat}
             </button>
           ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
           {isLoading ? (
             Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[500px] bg-card-dark rounded-[32px] animate-pulse"></div>
             ))
           ) : (
             filteredNews.map((item) => (
               <Link 
                to={`/blog?id=${item.id}`} 
                key={item.id} 
                className="group flex flex-col bg-card-dark rounded-[32px] overflow-hidden border border-border-dark hover:border-primary/50 transition-all duration-500 shadow-xl"
               >
                  <div className="h-60 overflow-hidden relative">
                     <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.title} />
                     <div className="absolute top-6 right-6 px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-xl text-white text-[9px] font-black uppercase tracking-widest">
                       {item.category}
                     </div>
                  </div>
                  <div className="p-8 flex flex-col flex-1 space-y-4">
                     <div className="flex items-center gap-3 text-[10px] font-black text-text-secondary uppercase">
                        <span>{item.date}</span>
                        <span className="size-1 bg-border-dark rounded-full"></span>
                        <span>{item.readTime}</span>
                     </div>
                     <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors leading-tight">{item.title}</h3>
                     <p className="text-text-secondary text-sm leading-relaxed line-clamp-3">
                       {item.excerpt}
                     </p>
                     <div className="pt-4 mt-auto flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                           <span className="material-symbols-outlined text-sm">trending_flat</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-primary transition-colors">Leer Artículo Completo</span>
                     </div>
                  </div>
               </Link>
             ))
           )}
        </div>

        {!isLoading && filteredNews.length === 0 && (
          <div className="py-20 text-center opacity-30">
            <span className="material-symbols-outlined text-6xl mb-4 text-white">search_off</span>
            <p className="text-xl font-bold text-white">No se encontraron artículos con esos criterios.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
