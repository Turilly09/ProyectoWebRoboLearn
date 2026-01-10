
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts } from '../content/storeRegistry';
import { Product, User } from '../types';
import { showToast } from '../components/ToastNotification';

const Store: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState('Todos');
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const user: User | null = useMemo(() => {
    const stored = localStorage.getItem('robo_user');
    return stored ? JSON.parse(stored) : null;
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const data = await getAllProducts();
      setProducts(data);
      setIsLoading(false);
    };
    loadData();
    window.addEventListener('storeUpdated', loadData);
    return () => window.removeEventListener('storeUpdated', loadData);
  }, []);

  const addToCart = (product: Product) => {
    setCartCount(prev => prev + 1);
    showToast(`"${product.name}" añadido al carrito`, 'success');
  };

  const filteredProducts = filter === 'Todos' 
    ? products 
    : products.filter(p => p.category === filter);

  const categories = ['Todos', 'Kits', 'Componentes', 'Sensores', 'Herramientas', 'Merch'];

  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark overflow-y-auto">
      {/* Hero Store */}
      <div className="relative bg-surface-dark border-b border-border-dark py-16 px-6">
         <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-[-50%] right-[-10%] size-[600px] bg-amber-500/10 rounded-full blur-[100px]"></div>
         </div>
         <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4">
               <h1 className="text-5xl font-black text-white">TIENDA <span className="text-amber-500">OFICIAL</span></h1>
               <p className="text-text-secondary max-w-xl text-lg">
                  Hardware certificado para tus proyectos. Desde kits de iniciación hasta componentes de grado industrial.
               </p>
            </div>
            <div className="flex items-center gap-4">
               {user?.role === 'editor' && (
                 <button 
                   onClick={() => navigate('/studio')} 
                   className="px-6 py-3 border border-amber-500/30 text-amber-500 rounded-xl font-bold uppercase text-xs hover:bg-amber-500/10 transition-all flex items-center gap-2"
                 >
                    <span className="material-symbols-outlined text-lg">inventory</span>
                    Gestionar Inventario
                 </button>
               )}
               <button className="relative p-4 bg-card-dark rounded-2xl border border-border-dark hover:border-primary transition-all group">
                  <span className="material-symbols-outlined text-white group-hover:text-primary transition-colors">shopping_cart</span>
                  {cartCount > 0 && (
                    <span className="absolute top-2 right-2 size-5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-card-dark animate-in zoom-in">
                       {cartCount}
                    </span>
                  )}
               </button>
            </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
         {/* Filtros */}
         <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            {categories.map(cat => (
               <button 
                 key={cat}
                 onClick={() => setFilter(cat)}
                 className={`px-6 py-2.5 rounded-full text-xs font-black uppercase whitespace-nowrap border transition-all ${filter === cat ? 'bg-amber-500 border-amber-500 text-black' : 'bg-transparent border-border-dark text-text-secondary hover:text-white hover:border-white/30'}`}
               >
                  {cat}
               </button>
            ))}
         </div>

         {/* Grid de Productos */}
         {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
               {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-96 bg-card-dark rounded-3xl animate-pulse"></div>
               ))}
            </div>
         ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-border-dark rounded-[40px] opacity-50">
               <span className="material-symbols-outlined text-6xl text-text-secondary mb-4">production_quantity_limits</span>
               <p className="text-xl font-bold text-white">No hay productos en esta categoría.</p>
            </div>
         ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
               {filteredProducts.map(product => (
                  <div key={product.id} className="group bg-white dark:bg-card-dark rounded-3xl border border-slate-200 dark:border-border-dark overflow-hidden flex flex-col hover:shadow-2xl hover:border-amber-500/50 transition-all duration-300">
                     <div className="relative h-56 overflow-hidden bg-white p-6 flex items-center justify-center">
                        <img src={product.image} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" alt={product.name} />
                        {product.isNew && (
                           <span className="absolute top-4 left-4 px-3 py-1 bg-primary text-white text-[9px] font-black uppercase rounded-lg shadow-lg">Nuevo</span>
                        )}
                        <span className="absolute top-4 right-4 px-3 py-1 bg-black/10 dark:bg-black/60 backdrop-blur-md text-slate-700 dark:text-white text-[9px] font-black uppercase rounded-lg border border-white/20">
                           {product.category}
                        </span>
                     </div>
                     <div className="p-6 flex-1 flex flex-col">
                        <div className="flex-1 space-y-2 mb-6">
                           <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight group-hover:text-amber-500 transition-colors">{product.name}</h3>
                           <p className="text-xs text-slate-500 dark:text-text-secondary line-clamp-2">{product.description}</p>
                           {product.features && product.features.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-2">
                                 {product.features.slice(0, 2).map((feat, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-surface-dark rounded text-[9px] text-text-secondary border border-border-dark">{feat}</span>
                                 ))}
                              </div>
                           )}
                        </div>
                        <div className="flex items-center justify-between border-t border-border-dark/50 pt-4">
                           <span className="text-xl font-black text-slate-900 dark:text-white">${product.price.toFixed(2)}</span>
                           <button 
                             onClick={() => addToCart(product)}
                             className="size-10 rounded-xl bg-amber-500 text-black flex items-center justify-center hover:scale-110 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
                           >
                              <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                           </button>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
    </div>
  );
};

export default Store;
