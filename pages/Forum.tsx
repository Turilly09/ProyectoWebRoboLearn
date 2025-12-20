
import React from 'react';

const Forum: React.FC = () => {
  return (
    <div className="flex-1 flex bg-background-dark overflow-hidden">
      <aside className="hidden lg:flex w-72 flex-col bg-surface-dark border-r border-border-dark shrink-0">
        <div className="p-6 space-y-6">
           <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-text-secondary tracking-widest">Tableros de Discusión</h3>
              <div className="space-y-1">
                 {[
                   { name: "Ayuda General", icon: "help_center", active: true },
                   { name: "Lógica Arduino", icon: "memory", active: false },
                   { name: "CAD y Diseño", icon: "layers", active: false },
                   { name: "Muestra y Cuenta", icon: "campaign", active: false },
                   { name: "Bolsa de Trabajo", icon: "work", active: false },
                 ].map((board, i) => (
                   <div key={i} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${board.active ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-card-dark'}`}>
                      <span className="material-symbols-outlined text-sm">{board.icon}</span>
                      <span className="text-sm font-bold">{board.name}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
         <header className="p-8 border-b border-border-dark space-y-6">
            <h1 className="text-4xl font-black text-white">Mesa de <span className="text-primary">Ayuda Arduino</span></h1>
            <div className="flex gap-4">
               <div className="flex-1 relative">
                  <span className="material-symbols-outlined absolute left-4 top-3 text-text-secondary">search</span>
                  <input className="w-full bg-surface-dark rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="Buscar discusiones..." />
               </div>
               <button className="px-6 py-3 bg-primary text-white font-bold rounded-xl whitespace-nowrap">Hacer Pregunta</button>
            </div>
         </header>

         <div className="flex-1 overflow-y-auto p-8 space-y-4">
            {[
              { title: "Problemas con dirección I2C en OLED", author: "jake_builds", replies: 12, likes: 45, time: "hace 2h", tags: ["OLED", "I2C"] },
              { title: "¿Mejor servo para brazo robótico de 5kg?", author: "elena_eng", replies: 8, likes: 21, time: "hace 5h", tags: ["Robótica", "Hardware"] },
              { title: "La conexión MQTT se cae en ESP32", author: "iot_master", replies: 24, likes: 56, time: "hace 1d", tags: ["ESP32", "Red"] },
            ].map((post, i) => (
              <div key={i} className="p-6 bg-card-dark rounded-2xl border border-border-dark hover:border-primary/50 transition-all group cursor-pointer">
                 <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                       <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{post.title}</h3>
                       <div className="flex items-center gap-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                          <span className="text-primary">@{post.author}</span>
                          <span>{post.time}</span>
                          <div className="flex gap-2">
                             {post.tags.map(tag => <span key={tag} className="px-2 py-0.5 bg-surface-dark rounded border border-border-dark">#{tag}</span>)}
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-4 shrink-0">
                       <div className="flex flex-col items-center">
                          <span className="text-lg font-black text-white">{post.replies}</span>
                          <span className="text-[8px] uppercase text-text-secondary font-black">Respuestas</span>
                       </div>
                       <div className="flex flex-col items-center">
                          <span className="text-lg font-black text-white">{post.likes}</span>
                          <span className="text-[8px] uppercase text-text-secondary font-black">Likes</span>
                       </div>
                    </div>
                 </div>
              </div>
            ))}
         </div>
      </main>
    </div>
  );
};

export default Forum;
