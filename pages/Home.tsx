
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllNews } from '../content/newsRegistry';
import { getAllPaths } from '../content/pathRegistry';
import { getModulesByPath } from '../content/registry';
import { NewsItem, LearningPath } from '../types';

const Home: React.FC = () => {
  const [allNewsItems, setAllNewsItems] = useState<NewsItem[]>([]);
  const [allPaths, setAllPaths] = useState<LearningPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [news, paths] = await Promise.all([
        getAllNews(),
        getAllPaths()
      ]);

      // Enriquecemos las rutas con el conteo real de módulos (también asíncrono)
      const enrichedPaths = await Promise.all(
        paths.slice(0, 3).map(async (path) => {
          const mods = await getModulesByPath(path.id);
          return { ...path, modulesCount: mods.length };
        })
      );

      setAllNewsItems(news);
      setAllPaths(enrichedPaths);
      setIsLoading(false);
    };

    loadData();
    window.addEventListener('newsUpdated', loadData);
    window.addEventListener('pathsUpdated', loadData);
    window.addEventListener('lessonsUpdated', loadData);
    return () => {
      window.removeEventListener('newsUpdated', loadData);
      window.removeEventListener('pathsUpdated', loadData);
      window.removeEventListener('lessonsUpdated', loadData);
    };
  }, []);

  const latestNews = useMemo(() => allNewsItems.slice(0, 3), [allNewsItems]);

  return (
    <div className="flex flex-col flex-1 px-4 md:px-10 py-5">
      <div className="max-w-[1280px] mx-auto w-full flex flex-col gap-16">
        {/* Hero Section */}
        <section className="flex flex-col-reverse md:flex-row items-center gap-12 py-10">
          <div className="flex flex-col gap-8 flex-1">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
                Construye el Futuro, <br/>
                <span className="text-primary">Circuito a Circuito</span>.
              </h1>
              <p className="text-slate-600 dark:text-text-secondary text-lg max-w-xl">
                Un entorno pedagógico integrado para dominar la electrónica y la robótica. 
                Desde la simulación en tiempo real hasta el despliegue en el mundo real.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link to="/paths" className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:scale-105 transition-all">
                <span className="material-symbols-outlined">bolt</span>
                Empezar a Aprender
              </Link>
              <Link to="/paths" className="px-8 py-4 bg-slate-200 dark:bg-card-dark text-slate-900 dark:text-white rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-border-dark transition-all">
                Explorar Tutoriales
              </Link>
            </div>
          </div>
          <div className="flex-1 w-full max-w-lg aspect-video rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-border-dark relative group">
             <img 
               src="https://picsum.photos/seed/robothero/1200/800" 
               className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
               alt="Entorno de Robótica" 
             />
          </div>
        </section>

        {/* Últimas Noticias */}
        <section className="space-y-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black">Noticias del Sector</h2>
              <p className="text-text-secondary text-sm">Mantente al día con lo último en ingeniería y hardware.</p>
            </div>
            <Link to="/blog" className="px-5 py-2.5 bg-surface-dark border border-border-dark rounded-xl text-xs font-black uppercase hover:bg-card-dark transition-all text-white">Ver Blog Completo</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-96 bg-card-dark rounded-3xl animate-pulse"></div>
              ))
            ) : (
              latestNews.map((news) => (
                <Link to={`/blog?id=${news.id}`} key={news.id} className="group flex flex-col bg-white dark:bg-card-dark rounded-3xl overflow-hidden border border-slate-200 dark:border-border-dark hover:shadow-2xl transition-all duration-500">
                  <div className="h-52 overflow-hidden relative">
                    <img src={news.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={news.title} />
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-primary/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest shadow-lg">
                      {news.category}
                    </div>
                  </div>
                  <div className="p-7 flex flex-col gap-3">
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-xs">calendar_month</span> {news.date} • {news.readTime} lectura
                    </p>
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors leading-tight">{news.title}</h3>
                    <p className="text-slate-500 dark:text-text-secondary text-sm line-clamp-2 leading-relaxed">{news.excerpt}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Path Highlights */}
        <section className="space-y-8 pb-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black">Rutas de Aprendizaje Destacadas</h2>
            <Link to="/paths" className="text-primary font-bold hover:underline">Ver Todas</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-80 bg-card-dark rounded-3xl animate-pulse"></div>
              ))
            ) : (
              allPaths.map((path) => (
                <Link to="/paths" key={path.id} className="group flex flex-col bg-white dark:bg-card-dark rounded-3xl overflow-hidden border border-slate-200 dark:border-border-dark hover:-translate-y-2 transition-all duration-300 shadow-sm hover:shadow-xl">
                  <div className="h-48 overflow-hidden relative">
                    <img src={path.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={path.title} />
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest">
                      {path.level}
                    </div>
                  </div>
                  <div className="p-6 flex flex-col gap-3">
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{path.title}</h3>
                    <p className="text-slate-500 dark:text-text-secondary text-sm line-clamp-2">{path.description}</p>
                    <div className="flex items-center justify-between pt-4 mt-auto">
                      <span className="text-xs font-bold text-slate-400 uppercase">{path.modulesCount} Módulos</span>
                      <span className="material-symbols-outlined text-primary">arrow_forward</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
