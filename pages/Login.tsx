import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Verificación estática para el diagnóstico
  const debugInfo = {
    supabaseUrl: !!(process.env.SUPABASE_URL && process.env.SUPABASE_URL !== 'undefined'),
    supabaseKey: !!(process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_ANON_KEY !== 'undefined'),
    geminiKey: !!(process.env.API_KEY && process.env.API_KEY !== 'undefined'),
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!isSupabaseConfigured || !supabase) {
      setError('Configuración ausente. Verifica los Secrets en GitHub y el archivo deploy.yml.');
      triggerShake();
      setShowDebug(true);
      setIsLoading(false);
      return;
    }

    if (role === 'editor' && editorKey !== EDITOR_SECRET_KEY) {
      setError('Clave de editor incorrecta.');
      triggerShake();
      setIsLoading(false);
      return;
    }

    try {
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (profile) {
        saveAndRedirect(profile as User);
      } else {
        const newUser: User = {
          id: crypto.randomUUID(),
          name: name.trim() || 'Usuario RoboLearn',
          email: email.trim().toLowerCase(),
          role: role,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || email)}`,
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
      console.error('Login error:', err);
      setError(err.message || 'Error de conexión con la base de datos.');
      triggerShake();
    } finally {
      setIsLoading(false);
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
        if (user.email && user.name) {
          saveAndRedirect(user);
        } else {
          setError('El archivo JSON no tiene el formato de usuario válido.');
          triggerShake();
        }
      } catch (err) {
        setError('Error al procesar el archivo JSON.');
        triggerShake();
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
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold text-center rounded-2xl">
              <p>{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full py-4 text-white font-black rounded-2xl shadow-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 ${role === 'editor' ? 'bg-purple-600 shadow-purple-600/25' : 'bg-primary shadow-primary/25'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : 'Acceder al Sistema'}
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