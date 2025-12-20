
import React from 'react';

const Certify: React.FC = () => {
  return (
    <div className="flex-1 bg-background-light dark:bg-background-dark py-20 px-6">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
        <div className="flex-1 space-y-8">
           <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white leading-tight">
             Valida tu <br/> <span className="text-primary">Experiencia</span>
           </h1>
           <p className="text-lg text-slate-500 dark:text-text-secondary max-w-xl leading-relaxed">
             Obtén certificaciones reconocidas por la industria en Sistemas Embebidos, Diseño de Robótica y Arquitectura IoT. Únete a nuestra red de ingenieros certificados.
           </p>
           <div className="space-y-4">
              {[
                "Exámenes supervisados en línea",
                "Evaluación de proyectos prácticos",
                "Credenciales verificables en LinkedIn",
                "Acceso prioritario a bolsa de trabajo"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                   <div className="size-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                      <span className="material-symbols-outlined text-sm">check</span>
                   </div>
                   <span className="text-sm font-bold">{item}</span>
                </div>
              ))}
           </div>
           <button className="px-10 py-4 bg-primary text-white font-bold rounded-2xl shadow-2xl shadow-primary/30 text-lg hover:scale-105 transition-transform">
             Iniciar Evaluación
           </button>
        </div>

        <div className="flex-1 w-full max-w-xl aspect-[4/5] relative">
           <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-[60px] blur-3xl"></div>
           <div className="relative h-full bg-surface-dark rounded-[60px] border border-border-dark p-12 flex flex-col justify-between shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                 <span className="material-symbols-outlined text-8xl text-primary/10">workspace_premium</span>
              </div>
              <div className="space-y-2">
                 <div className="size-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-6">
                    <span className="material-symbols-outlined text-3xl">verified</span>
                 </div>
                 <h2 className="text-3xl font-black text-white">Certificado de <br/> Logro</h2>
                 <p className="text-primary font-black uppercase tracking-widest text-xs">Maestro en IA Robótica</p>
              </div>

              <div className="space-y-6">
                 <div className="h-px bg-border-dark"></div>
                 <div className="flex justify-between items-end">
                    <div className="space-y-1">
                       <p className="text-text-secondary text-[10px] uppercase font-black">Emitido para</p>
                       <p className="text-white font-bold text-lg">Andres Cebrian</p>
                    </div>
                    <div className="text-right">
                       <p className="text-text-secondary text-[10px] uppercase font-black">Fecha</p>
                       <p className="text-white font-bold">Sep 2024</p>
                    </div>
                 </div>
                 <div className="flex justify-between items-center bg-background-dark/50 p-4 rounded-2xl border border-border-dark">
                    <div className="space-y-1">
                       <p className="text-text-secondary text-[10px] uppercase font-black">ID de Verificación</p>
                       <p className="text-white font-mono text-xs">RC-2024-8849-X1</p>
                    </div>
                    <img src="https://picsum.photos/seed/qr/100" className="size-12 rounded opacity-80" alt="QR" />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Certify;
