
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, getAllProducts } from '../content/storeRegistry';
import { Product } from '../types';
import { showToast } from '../components/ToastNotification';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'desc' | 'specs'>('desc');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setIsLoading(true);
      
      const foundProduct = await getProductById(id);
      
      if (foundProduct) {
        setProduct(foundProduct);
        setSelectedImage(foundProduct.image);
        
        // Cargar relacionados
        const all = await getAllProducts();
        const related = all
            .filter(p => p.category === foundProduct.category && p.id !== foundProduct.id)
            .slice(0, 3);
        setRelatedProducts(related);
      }
      
      setIsLoading(false);
    };
    loadData();
    window.scrollTo(0,0);
  }, [id]);

  const addToCart = () => {
    if (!product) return;
    showToast(`${quantity}x "${product.name}" añadido al carrito`, 'success');
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-background-dark text-white font-bold animate-pulse">CARGANDO PRODUCTO...</div>;
  if (!product) return <div className="h-screen flex items-center justify-center bg-background-dark text-white font-bold">PRODUCTO NO ENCONTRADO</div>;

  // Mockear galería si no hay múltiples imágenes en DB
  const gallery = product.images && product.images.length > 0 
    ? [product.image, ...product.images] 
    : [product.image, product.image, product.image]; // Duplicamos para demo visual

  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark font-body min-h-screen">
      {/* Breadcrumbs */}
      <div className="bg-surface-dark border-b border-border-dark py-4 px-6">
         <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-widest">
            <button onClick={() => navigate('/store')} className="hover:text-white transition-colors">Tienda</button>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-primary">{product.category}</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-white truncate">{product.name}</span>
         </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-16">
         
         {/* MAIN PRODUCT GRID */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* LEFT: GALLERY */}
            <div className="space-y-4">
               <div className="aspect-square bg-white rounded-3xl border border-slate-200 dark:border-border-dark flex items-center justify-center p-8 overflow-hidden relative group">
                  <img src={selectedImage} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" alt={product.name} />
                  {product.isNew && (
                     <span className="absolute top-4 left-4 px-4 py-1.5 bg-primary text-white text-[10px] font-black uppercase rounded-lg shadow-lg">Nuevo Lanzamiento</span>
                  )}
               </div>
               <div className="grid grid-cols-4 gap-4">
                  {gallery.slice(0,4).map((img, idx) => (
                     <div 
                       key={idx} 
                       onClick={() => setSelectedImage(img)}
                       className={`aspect-square bg-white rounded-xl border cursor-pointer p-2 flex items-center justify-center transition-all ${selectedImage === img ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200 dark:border-border-dark hover:border-primary/50'}`}
                     >
                        <img src={img} className="max-w-full max-h-full object-contain opacity-80 hover:opacity-100" alt="Thumbnail" />
                     </div>
                  ))}
               </div>
            </div>

            {/* RIGHT: INFO & BUY */}
            <div className="space-y-8">
               <div className="space-y-2">
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight">{product.name}</h1>
                  <div className="flex items-center gap-4">
                     <span className="px-3 py-1 bg-surface-dark border border-border-dark rounded-lg text-text-secondary text-[10px] font-black uppercase tracking-widest">
                        SKU: {product.id.toUpperCase().substring(0, 8)}
                     </span>
                     <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                        <span className="material-symbols-outlined text-sm filled">star</span>
                        <span className="material-symbols-outlined text-sm filled">star</span>
                        <span className="material-symbols-outlined text-sm filled">star</span>
                        <span className="material-symbols-outlined text-sm filled">star</span>
                        <span className="material-symbols-outlined text-sm">star_half</span>
                        <span className="text-text-secondary ml-1">(4.8)</span>
                     </div>
                  </div>
               </div>

               <div className="flex items-end gap-4 pb-6 border-b border-slate-200 dark:border-border-dark">
                  <span className="text-5xl font-black text-slate-900 dark:text-white">${product.price.toFixed(2)}</span>
                  {product.stock > 0 ? (
                     <span className="text-green-500 font-bold text-xs uppercase mb-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">check_circle</span> En Stock ({product.stock})
                     </span>
                  ) : (
                     <span className="text-red-500 font-bold text-xs uppercase mb-2">Agotado</span>
                  )}
               </div>

               <p className="text-slate-500 dark:text-text-secondary text-base leading-relaxed">
                  {product.description}
               </p>

               {/* ADD TO CART */}
               <div className="p-6 bg-surface-dark rounded-2xl border border-border-dark space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-text-secondary uppercase">Cantidad</span>
                     <div className="flex items-center bg-card-dark rounded-xl border border-border-dark">
                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:text-white transition-colors text-text-secondary"><span className="material-symbols-outlined text-sm">remove</span></button>
                        <span className="w-8 text-center font-bold text-white">{quantity}</span>
                        <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="p-3 hover:text-white transition-colors text-text-secondary"><span className="material-symbols-outlined text-sm">add</span></button>
                     </div>
                  </div>
                  <button 
                    onClick={addToCart}
                    disabled={product.stock === 0}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     <span className="material-symbols-outlined">shopping_cart</span>
                     {product.stock === 0 ? 'Sin Stock' : 'Añadir al Carrito'}
                  </button>
               </div>

               {/* FEATURES SHORT LIST */}
               <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-text-secondary tracking-widest">Highlights</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                     {product.features.slice(0, 4).map((feat, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                           <span className="material-symbols-outlined text-primary text-sm">check</span>
                           {feat}
                        </li>
                     ))}
                  </ul>
               </div>
            </div>
         </div>

         {/* TABS INFO */}
         <div className="space-y-8">
            <div className="flex border-b border-border-dark">
               <button 
                 onClick={() => setActiveTab('desc')}
                 className={`px-8 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'desc' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-white'}`}
               >
                  Descripción Detallada
               </button>
               <button 
                 onClick={() => setActiveTab('specs')}
                 className={`px-8 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'specs' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-white'}`}
               >
                  Especificaciones Técnicas
               </button>
            </div>

            <div className="bg-card-dark rounded-3xl p-8 border border-border-dark min-h-[200px]">
               {activeTab === 'desc' ? (
                  <div className="prose prose-invert max-w-none text-slate-300">
                     <p className="text-lg leading-relaxed">{product.description}</p>
                     <p className="mt-4">
                        Este producto ha sido seleccionado por el equipo de ingeniería de RoboLearn por su calidad y compatibilidad con nuestros cursos. 
                        Incluye garantía de funcionamiento y soporte en nuestros foros.
                     </p>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {product.features.map((feat, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-surface-dark rounded-xl border border-border-dark">
                           <span className="font-bold text-white">{feat}</span>
                           <span className="material-symbols-outlined text-green-500 text-sm">verified</span>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>

         {/* RELATED PRODUCTS */}
         {relatedProducts.length > 0 && (
            <div className="space-y-8 border-t border-border-dark pt-12">
               <h3 className="text-2xl font-black text-white">Productos Relacionados</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedProducts.map(rel => (
                     <div 
                        key={rel.id} 
                        onClick={() => navigate(`/store/product/${rel.id}`)}
                        className="group bg-card-dark rounded-2xl border border-border-dark hover:border-primary/50 overflow-hidden cursor-pointer transition-all"
                     >
                        <div className="h-40 bg-white p-4 flex items-center justify-center relative">
                           <img src={rel.image} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform" alt={rel.name} />
                        </div>
                        <div className="p-6">
                           <h4 className="font-bold text-white mb-1 truncate">{rel.name}</h4>
                           <div className="flex justify-between items-center">
                              <span className="text-lg font-black text-primary">${rel.price.toFixed(2)}</span>
                              <span className="text-[10px] font-black uppercase text-text-secondary">Ver más</span>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

      </div>
    </div>
  );
};

export default ProductDetail;
