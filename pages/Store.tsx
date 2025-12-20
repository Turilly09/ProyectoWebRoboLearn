
import React from 'react';

const Store: React.FC = () => {
  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Banner */}
        <section className="relative h-64 rounded-[40px] overflow-hidden bg-surface-dark flex items-center px-12 group">
           <img 
             src="https://picsum.photos/seed/store/1920/400" 
             className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000" 
             alt="Banner Tienda" 
           />
           <div className="relative z-10 max-w-lg space-y-4">
              <h1 className="text-4xl font-black text-white leading-tight">Kit de Inicio de <br/> Robótica Definitivo</h1>
              <p className="text-text-secondary text-sm">Todo lo que necesitas para completar la ruta de "IA en Robótica" en una sola caja.</p>
              <button className="px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/30">Comprar Ahora</button>
           </div>
        </section>

        {/* Categories */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
           {['Todo', 'Microcontroladores', 'Sensores', 'Actuadores', 'Kits', 'Piezas 3D'].map(cat => (
             <button key={cat} className="px-6 py-2 bg-card-dark border border-border-dark rounded-full text-sm font-bold text-text-secondary hover:text-white hover:border-primary transition-all whitespace-nowrap">
               {cat}
             </button>
           ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
           {[
             { name: "Arduino Uno R3", price: 24.99, image: "https://picsum.photos/seed/uno/400/400" },
             { name: "Micro Servo SG90", price: 5.49, image: "https://picsum.photos/seed/servo/400/400" },
             { name: "Ultrasónico HC-SR04", price: 3.99, image: "https://picsum.photos/seed/sensor/400/400" },
             { name: "Controlador L298N", price: 8.99, image: "https://picsum.photos/seed/driver/400/400" },
             { name: "ESP32 DevKit V1", price: 12.99, image: "https://picsum.photos/seed/esp32/400/400" },
             { name: "Batería LiPo 7.4V", price: 18.50, image: "https://picsum.photos/seed/lipo/400/400" },
             { name: "Módulo Buzzer", price: 1.99, image: "https://picsum.photos/seed/buzz/400/400" },
             { name: "Protoboard 830pt", price: 6.99, image: "https://picsum.photos/seed/bread/400/400" },
           ].map((prod, i) => (
             <div key={i} className="group bg-white dark:bg-card-dark rounded-3xl p-4 border border-slate-200 dark:border-border-dark hover:shadow-2xl transition-all flex flex-col">
                <div className="aspect-square rounded-2xl overflow-hidden mb-4 relative">
                   <img src={prod.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={prod.name} />
                   <button className="absolute bottom-4 right-4 size-10 bg-primary text-white rounded-xl shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                   </button>
                </div>
                <div className="space-y-1">
                   <h3 className="text-slate-900 dark:text-white font-bold">{prod.name}</h3>
                   <div className="flex justify-between items-center">
                      <p className="text-primary font-black text-lg">${prod.price}</p>
                      <div className="flex text-amber-400">
                         <span className="material-symbols-outlined text-xs filled">star</span>
                         <span className="material-symbols-outlined text-xs filled">star</span>
                         <span className="material-symbols-outlined text-xs filled">star</span>
                         <span className="material-symbols-outlined text-xs filled">star</span>
                      </div>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default Store;
