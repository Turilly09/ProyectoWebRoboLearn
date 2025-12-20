
import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { User } from '../types';

interface DashboardProps {
  user: User | null;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();

  const exportIdentity = () => {
    if (!user) return;
    const dataStr = JSON.stringify(user, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `robostudent_${user.name.toLowerCase().replace(/\s+/g, '_')}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const chartData = useMemo(() => {
    const days = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' });
      
      const logEntry = user?.activityLog?.find(log => log.date === dateStr);
      days.push({
        name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        xp: logEntry ? logEntry.xpEarned : 0
      });
    }
    return days;
  }, [user?.activityLog]);

  const studyHours = useMemo(() => {
    const minutes = user?.studyMinutes || (user?.completedLessons?.length || 0) * 30;
    return (minutes / 60).toFixed(1);
  }, [user?.studyMinutes, user?.completedLessons]);

  const progressToNextLevel = useMemo(() => {
    if (!user) return 0;
    const currentLevelXp = (user.level - 1) * 1000;
    const xpInCurrentLevel = user.xp - currentLevelXp;
    return Math.min((xpInCurrentLevel / 1000) * 100, 100);
  }, [user?.xp, user?.level]);

  return (
    <div className="flex-1 bg-background-dark text-white overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full p-8 md:p-12 space-y-12">
        {/* Header con acciones rápidas */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black">Hola, {user?.name.split(' ')[0] || 'Ingeniero'} 👋</h1>
            <p className="text-text-secondary text-sm">Aquí tienes el resumen de tu avance técnico hoy.</p>
          </div>
          <div className="flex gap-3">
             <button onClick={exportIdentity} className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-border-dark rounded-2xl text-[10px] font-black uppercase hover:bg-white/10 transition-all">
                <span className="material-symbols-outlined text-sm">save_alt</span>
                Backup de Identidad
             </button>
             <Link to="/paths" className="px-8 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                Continuar Aprendiendo
             </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 p-8 bg-gradient-to-br from-primary to-blue-700 rounded-[32px] text-white flex flex-col justify-between shadow-xl shadow-blue-500/20 relative overflow-hidden group">
             <div className="absolute top-[-20%] right-[-20%] size-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
             <div>
               <p className="opacity-80 text-[10px] font-black uppercase tracking-widest mb-1">Rango Actual</p>
               <h3 className="text-3xl font-black">Nivel {user?.level || 1}</h3>
             </div>
             <div className="mt-8 space-y-3">
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                   <div className="h-full bg-white transition-all duration-1000" style={{ width: `${progressToNextLevel}%` }}></div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest">{user?.xp || 0} XP</p>
                  <p className="text-[10px] font-bold opacity-60">PRÓXIMO NIVEL AL LLEGAR A {user?.level ? user.level * 1000 : 1000} XP</p>
                </div>
             </div>
          </div>
          
          {[
            { label: "Módulos Listos", val: user?.completedLessons?.length || "0", icon: "verified", color: "text-green-400" },
            { label: "Horas de Laboratorio", val: studyHours, icon: "schedule", color: "text-amber-400" },
            { label: "Proyectos Activos", val: (user?.completedWorkshops?.length || 0) + 2, icon: "memory", color: "text-purple-400" },
          ].map((stat, i) => (
            <div key={i} className="p-8 bg-card-dark rounded-[32px] border border-border-dark flex flex-col justify-center">
               <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-surface-dark rounded-2xl shadow-inner">
                     <span className={`material-symbols-outlined ${stat.color}`}>{stat.icon}</span>
                  </div>
                  <span className="text-text-secondary font-black text-[10px] uppercase tracking-widest">{stat.label}</span>
               </div>
               <p className="text-4xl font-black tracking-tight">{stat.val}</p>
            </div>
          ))}
        </section>

        {/* Contenido Principal */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          {/* Gráfico de Actividad */}
          <div className="lg:col-span-2 p-10 bg-card-dark rounded-[40px] border border-border-dark relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <span className="material-symbols-outlined text-[120px]">trending_up</span>
             </div>
             <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-xl font-black">Actividad de XP</h3>
                  <p className="text-xs text-text-secondary">Puntos de experiencia obtenidos esta semana</p>
                </div>
             </div>
             <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData}>
                      <defs>
                         <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#137fec" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#137fec" stopOpacity={0}/>
                         </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#324d67" opacity={0.5} />
                      <XAxis dataKey="name" stroke="#92adc9" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111a22', border: '1px solid #324d67', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }} 
                        itemStyle={{ color: '#137fec' }} 
                        cursor={{ stroke: '#137fec', strokeWidth: 1 }}
                      />
                      <Area 
                        animationDuration={2000}
                        type="monotone" 
                        dataKey="xp" 
                        stroke="#137fec" 
                        strokeWidth={5} 
                        fillOpacity={1} 
                        fill="url(#colorXp)" 
                      />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Siguientes pasos */}
          <div className="p-10 bg-card-dark rounded-[40px] border border-border-dark space-y-8 flex flex-col">
             <h3 className="text-xl font-black">Continuar Ruta</h3>
             <div className="space-y-4 flex-1">
                {[
                  { title: "Electricidad Estática", time: "30 min", icon: "bolt", id: "m1", path: "/lesson/m1" },
                  { title: "Seguridad Lab", time: "20 min", icon: "security", id: "m2", path: "/lesson/m2" },
                ].filter(l => !user?.completedLessons?.includes(l.id)).slice(0, 2).map((next, i) => (
                  <Link to={next.path} key={i} className="flex items-center gap-5 p-5 rounded-2xl bg-surface-dark border border-border-dark/50 hover:border-primary transition-all group">
                     <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">{next.icon}</span>
                     </div>
                     <div>
                        <p className="text-white text-sm font-bold group-hover:text-primary transition-colors">{next.title}</p>
                        <p className="text-text-secondary text-[10px] uppercase font-black">{next.time} estimación</p>
                     </div>
                  </Link>
                ))}
                
                {(user?.completedLessons?.length || 0) >= 2 && (
                  <div className="text-center p-8 bg-surface-dark/50 rounded-3xl border border-dashed border-border-dark flex flex-col items-center">
                    <div className="size-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-4 animate-bounce">
                      <span className="material-symbols-outlined text-3xl">emoji_events</span>
                    </div>
                    <p className="text-sm font-bold text-white mb-2">¡Módulos Iniciales Listos!</p>
                    <p className="text-[10px] text-text-secondary font-bold uppercase max-w-[160px]">Explora el catálogo para nuevos retos técnicos.</p>
                  </div>
                )}
             </div>
             <Link to="/paths" className="w-full py-4 bg-surface-dark border border-border-dark text-text-secondary text-[10px] font-black rounded-2xl hover:text-white hover:bg-card-dark transition-all text-center uppercase tracking-widest">
                Catálogo de Ingeniería
             </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
