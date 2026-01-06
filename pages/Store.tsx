import React from 'react';
import { useNavigate } from 'react-router-dom';

const Store: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark py-20 px-6 flex items-center justify-center">
      <div className="max-w-3xl mx-auto w-full space-y-12 text-center">
        
        <div className="relative inline-block">
           <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full"></div>
           <div className="relative size-32 bg-surface-dark border border-border-dark rounded-[40px] flex items-center justify-center mx-auto shadow-2xl mb-8">
              <span className="material-symbols-outlined text-7xl text-amber-500">construction</span>
           </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white leading-tight">
            Tienda en <br/> <span className="text-primary">Construcción</span>
          </h1>
          <p className="text-xl text-slate-500 dark:text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Estamos preparando el inventario con los mejores componentes, sensores y kits oficiales para tus rutas de aprendizaje.
          </p>
        </div>

        {/* Placeholder visual de lo que vendrá, desactivado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto opacity-40 grayscale pointer-events-none select-none blur-[1px]">
           {[1, 2, 3].map((_, i) => (
             <div key={i} className="p-4 bg-card-dark rounded-2xl border border-border-dark flex items-center gap-4">
                <div className="size-12 bg-surface-dark rounded-xl"></div>
                <div className="space-y-2 flex-1">
                   <div className="h-3 bg-surface-dark rounded w-3/4"></div>
                   <div className="h-2 bg-surface-dark rounded w-1/2"></div>
                </div>
             </div>
           ))}
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-amber-500">Próximamente Kits Certificados</p>

        <div className="pt-4">
           <button 
             onClick={() => navigate('/')}
             className="px-10 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-2 mx-auto"
           >
             <span className="material-symbols-outlined">arrow_back</span>
             Volver al Inicio
           </button>
        </div>

      </div>
    </div>
  );
};

export default Store;