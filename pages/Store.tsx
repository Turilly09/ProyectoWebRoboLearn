
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts } from '../content/storeRegistry';
import { getStoreStatus, setStoreStatus } from '../content/settingsRegistry';
import { Product, User } from '../types';
import { showToast } from '../components/ToastNotification';

const Store: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState('Todos');
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado de la tienda
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const user: User | null = useMemo(() => {
    const stored = localStorage.getItem('robo_user');
    return stored ? JSON.parse(stored) : null;
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [prods, status] = await Promise.all([
      getAllProducts(),
      getStoreStatus()
    ]);
    setProducts(prods);
    setIsStoreOpen(status);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storeUpdated', loadData);
    window.addEventListener('settingsUpdated', loadData);
    return () => {
        window.removeEventListener('storeUpdated', loadData);
        window.removeEventListener('settingsUpdated', loadData);
    };
  }, []);

  const toggleStore = async () => {
      if (!user || user.role !== 'editor') return;
      setIsToggling(true);
      try {
          const newState = !isStoreOpen;
          await setStoreStatus(newState);
          setIsStoreOpen(newState);
          showToast(newState ? "Tienda Abierta al Público" : "Tienda Cerrada (Modo Construcción)", "info");
      } catch (e) {
          showToast("Error al cambiar estado", "error");
      } finally {
          setIsToggling(false);
      }
  };

  const addToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation(); // Evitar navegación al clicar comprar
    setCartCount(prev => prev + 1);
    showToast(`"${product.name}" añadido al carrito`, 'success');
  };

  const filteredProducts = filter === 'Todos' 
    ? products 
    : products.filter(p => p.category === filter);

  const categories = ['Todos', 'Kits', 'Componentes', 'Sensores', 'Herramientas', 'Merch'];

  // VISTA: EN CONSTRUCCIÓN (Si está cerrada y NO es editor)
  if (!isLoading && !isStoreOpen && user?.role !== 'editor') {
      return (
          <div className="flex-1 bg-background-dark flex flex-col items-center justify-center p-6 text-center h-[calc(100vh-80px)]">
              <div className="max-w-lg space-y-8 animate-in zoom-in-95 duration-700">
                  <div className="relative">
                      <div className="absolute inset-0 bg-amber-500/20 blur-[60px] rounded-full"></div>
                      <span className="material-symbols-outlined text-[120px] text-amber-500 relative z-10">engineering</span>
                  </div>
                  <div className="space-y-4">
                      <h1 className="text-4xl md:text-5xl font-black text-white uppercase leading-tight">
                          Área en <span className="text-amber-500">Construcción</span>
                      </h1>
                      <p className="text-slate-400 text-lg leading-relaxed">
                          Estamos preparando el inventario con los mejores componentes para tus proyectos. 
                          La tienda oficial de RoboLearn abrirá sus puertas muy pronto.
                      </p>
                  </div>
                  <div className="p-4 bg-card-dark border border-border-dark rounded-2xl inline-block">
                      <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Notifícame cuando abra</p>
                      <div className="flex gap-2">
                          <input disabled className="bg-surface-dark border border-border-dark rounded-lg px-4 py-2 text-sm text-white w-64 opacity-50 cursor-not-allowed" placeholder="tu@email.com" />
                          <button disabled className="px-4 py-2 bg-primary text-white rounded-lg font-bold text-xs uppercase opacity-50 cursor-not-allowed">Enviar</button>
                      </div>
                  </div>
                  <div>
                      <button onClick={() => navigate('/dashboard')} className="text-primary font-bold hover:underline text-sm uppercase tracking-widest mt-8">
                          Volver al Panel
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark overflow-y-auto">
      {/* Hero Store */}
      <div className={`relative border-b border-border-dark py-16 px-6 transition-colors duration-500 ${!isStoreOpen ? 'bg-amber-900/10' : 'bg-surface-dark'}`}>
         <div className="absolute inset-0 overflow-hidden">
            <div className={`absolute top-[-50%] right-[-10%] size-[600px] rounded-full blur-[100px] transition-colors duration-500 ${!isStoreOpen ? 'bg-amber-500/10' : 'bg-purple-500/10'}`}></div>
         </div>
         <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                   <h1 className="text-5xl font-black text-white">TIENDA <span className={!isStoreOpen ? "text-amber-500" : "text-primary"}>OFICIAL</span></h1>
                   {!isStoreOpen && (
                       <span className="px-3 py-1 bg-amber-500 text-black text-[10px] font-black uppercase rounded-lg tracking-widest animate-pulse">
                           Modo Editor (Tienda Cerrada)
                       </span>
                   )}
               </div>
               <p className="text-text-secondary max-w-xl text-lg">
                  Hardware certificado para tus proyectos. Desde kits de iniciación hasta componentes de grado industrial.
               </p>
            </div>
            <div className="flex items-center gap-4">
               
               {/* TOGGLE PARA EDITORES */}
               {user?.role === 'editor' && (
                   <div className="flex items-center gap-3 bg-black/40 p-2 pr-4 rounded-xl border border-white/10 backdrop-blur-sm mr-4">
                       <button 
                         onClick={toggleStore} 
                         disabled={isToggling}
                         className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${isStoreOpen ? 'bg-green-500' : 'bg-red-500'}`}
                       >
                           <div className={`absolute top-1 left-1 bg-white size-4 rounded-full transition-transform duration-300 ${isStoreOpen ? 'translate-x-6' : 'translate-x-0'}`}></div>
                       </button>
                       <span className="text-[10px] font-black uppercase text-white">
                           {isToggling ? '...' : (isStoreOpen ? 'Tienda Abierta' : 'Tienda Cerrada')}
                       </span>
                   </div>
               )}

               {user?.role === 'editor' && (
                 <button 
                   onClick={() => navigate('/studio')} 
                   className="px-6 py-3 border border-amber-500/30 text-amber-500 rounded-xl font-bold uppercase text-xs hover:bg-amber-500/10 transition-all flex items-center gap-2"
                 >
                    <span className="material-symbols-outlined text-lg">inventory</span>
                    Inventario
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
                  <div 
                    key={product.id} 
                    onClick={() => navigate(`/store/product/${product.id}`)}
                    className="group bg-white dark:bg-card-dark rounded-3xl border border-slate-200 dark:border-border-dark overflow-hidden flex flex-col hover:shadow-2xl hover:border-amber-500/50 transition-all duration-300 cursor-pointer"
                  >
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
                             onClick={(e) => addToCart(e, product)}
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
