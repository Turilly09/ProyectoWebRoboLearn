
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const EDITOR_SECRET_KEY = "ROBO2025"; 

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [editorKey, setEditorKey] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Verificación de variables de entorno (Diagnóstico)
  const debugInfo = {
    supabaseUrl: !!(process.env as any).SUPABASE_URL,
    supabaseKey: !!(process.env as any).SUPABASE_ANON_KEY,
    geminiKey: !!(process.env as any).API_KEY,
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isSupabaseConfigured) {
      setError('Error Crítico: La base de datos no está configurada en los Secrets de GitHub.');
      triggerShake();
      setShowDebug(true);
      return;
    }

    if (role === 'editor' && editorKey !== EDITOR_SECRET_KEY) {
      setError('Clave de editor incorrecta. Acceso denegado.');
      triggerShake();
      return;
    }

    try {
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (profile) {
        saveAndRedirect(profile as User);
      } else {
        const newUser: User = {
          id: 'u-' + Math.random().toString(36).substr(2, 9),
          name: name || 'Usuario RoboLearn',
          email: email,
          role: role,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
          level: 1,
          xp: 0,
          completedLessons: [],
          completedWorkshops: [],
          activityLog: [],
          studyMinutes: 0
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert(newUser);

        if (insertError) throw insertError;
        saveAndRedirect(newUser);
      }
    } catch (err: any) {
      console.error(err);
      setError('Error: Revisa que las tablas en Supabase estén creadas (SQL Editor).');
      triggerShake();
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const saveAndRedirect = (user: User) => {
    localStorage.setItem('robo_user', JSON.stringify(user));
    window.dispatchEvent(new Event('authChange'));
    navigate('/dashboard');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const user = JSON.parse(event.target?.result as string) as User;
        if (user.id && user.name) {
          saveAndRedirect(user);
        } else {
          setError('Archivo inválido.');
        }
      } catch (err) {
        setError('Error al leer el archivo.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center p-6 relative overflow-hidden text-white font-display">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>

      <div className="absolute top-[-10%] left-[-10%] size-96 bg-primary/20 rounded-full blur-[120px]"></div>
      
      <div className={`w-full max-w-md bg-surface-dark/80 backdrop-blur-xl border border-border-dark p-10 rounded-[40px] shadow-2xl space-y-8 z-10 relative transition-all ${isShaking ? 'animate-shake border-red-500/50' : ''}`}>
        <div className="text-center space-y-2">
          <div className={`size-16 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-colors duration-500 ${role === 'editor' ? 'bg-purple-600/20 text-purple-400' : 'bg-primary/20 text-primary'}`}>
            <span className="material-symbols-outlined text-4xl">
              {role === 'editor' ? 'admin_panel_settings' : 'precision_manufacturing'}
            </span>
          </div>
          <h1 className="text-3xl font-black">RoboLearn Pro</h1>
          <p className="text-text-secondary text-sm">Tu carrera técnica sincronizada en la nube</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="flex bg-card-dark p-1 rounded-2xl border border-border-dark shadow-inner">
            <button type="button" onClick={() => setRole('student')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${role === 'student' ? 'bg-primary text-white' : 'text-text-secondary'}`}>Aprendiz</button>
            <button type="button" onClick={() => setRole('editor')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${role === 'editor' ? 'bg-purple-600 text-white' : 'text-text-secondary'}`}>Editor</button>
          </div>

          <div className="space-y-4">
            <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-card-dark border border-border-dark rounded-2xl py-3 px-4 text-sm focus:border-primary outline-none transition-all" placeholder="Nombre Completo" />
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-card-dark border border-border-dark rounded-2xl py-3 px-4 text-sm focus:border-primary outline-none transition-all" placeholder="Email" />
            {role === 'editor' && (
              <input required type="password" value={editorKey} onChange={e => setEditorKey(e.target.value)} className="w-full bg-purple-600/10 border border-purple-600/30 rounded-2xl py-3 px-4 text-sm outline-none" placeholder="Clave Editor" />
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold text-center rounded-2xl space-y-2">
              <p>{error}</p>
              {!isSupabaseConfigured && (
                <p className="text-[9px] opacity-70 font-normal">Ve a GitHub -> Settings -> Secrets -> Actions y añade SUPABASE_URL y SUPABASE_ANON_KEY.</p>
              )}
            </div>
          )}

          <button type="submit" className={`w-full py-4 text-white font-black rounded-2xl shadow-xl transition-all uppercase tracking-widest text-xs ${role === 'editor' ? 'bg-purple-600 shadow-purple-600/25' : 'bg-primary shadow-primary/25'}`}>
            Acceder al Sistema
          </button>
        </form>

        <div className="space-y-3">
          <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 bg-white/5 border border-dashed border-border-dark text-white rounded-2xl text-[10px] font-black uppercase hover:bg-white/10 transition-all">
            Importar Identidad JSON
          </button>
          <button onClick={() => setShowDebug(!showDebug)} className="w-full text-[9px] font-black uppercase text-text-secondary hover:text-white transition-colors">
            {showDebug ? 'Ocultar Diagnóstico' : 'Verificar Conexión Técnico'}
          </button>
        </div>

        {showDebug && (
          <div className="p-5 bg-black/40 rounded-3xl border border-border-dark space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <h4 className="text-[10px] font-black text-primary uppercase">Estado de Configuración</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-secondary">SUPABASE_URL</span>
                <span className={`text-[10px] font-bold ${debugInfo.supabaseUrl ? 'text-green-500' : 'text-red-500'}`}>{debugInfo.supabaseUrl ? 'OK' : 'FALTA'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-secondary">SUPABASE_ANON_KEY</span>
                <span className={`text-[10px] font-bold ${debugInfo.supabaseKey ? 'text-green-500' : 'text-red-500'}`}>{debugInfo.supabaseKey ? 'OK' : 'FALTA'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-secondary">GEMINI_API_KEY</span>
                <span className={`text-[10px] font-bold ${debugInfo.geminiKey ? 'text-green-500' : 'text-red-500'}`}>{debugInfo.geminiKey ? 'OK' : 'FALTA'}</span>
              </div>
            </div>
          </div>
        )}
        
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
      </div>
    </div>
  );
};

export default Login;
