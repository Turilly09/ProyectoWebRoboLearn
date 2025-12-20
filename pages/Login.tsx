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
  const [success, setSuccess] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const debugInfo = {
    supabaseUrl: !!(process.env.SUPABASE_URL && process.env.SUPABASE_URL !== 'undefined' && process.env.SUPABASE_URL !== ''),
    supabaseKey: !!(process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_ANON_KEY !== 'undefined' && process.env.SUPABASE_ANON_KEY !== ''),
    geminiKey: !!(process.env.API_KEY && process.env.API_KEY !== 'undefined' && process.env.API_KEY !== ''),
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!isSupabaseConfigured || !supabase) {
      let missing = [];
      if (!debugInfo.supabaseUrl) missing.push("SUPABASE_URL");
      if (!debugInfo.supabaseKey) missing.push("SUPABASE_ANON_KEY");
      
      setError(`Configuración ausente: [${missing.join(", ")}]. Verifica los Secrets en GitHub y que el build haya terminado.`);
      triggerShake();
      setShowDebug(true);
      setIsLoading(false);
      return;
    }

    if (role === 'editor' && editorKey !== EDITOR_SECRET_KEY) {
      setError('Clave de acceso de editor inválida.');
      triggerShake();
      setIsLoading(false);
      return;
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (profile) {
        if (role === 'editor' && editorKey === EDITOR_SECRET_KEY && profile.role !== 'editor') {
          const { data: updated, error: upgradeError } = await supabase
            .from('profiles')
            .update({ role: 'editor' })
            .eq('id', profile.id)
            .select()
            .single();
          
          if (upgradeError) throw upgradeError;
          setSuccess('¡Identidad actualizada a Editor Técnico!');
          setTimeout(() => saveAndRedirect(updated as User), 1000);
        } else {
          setSuccess('¡Identidad verificada! Accediendo...');
          setTimeout(() => saveAndRedirect(profile as User), 1000);
        }
      } else {
        setSuccess('Creando nuevo perfil técnico...');
        const newUser: User = {
          id: Math.random().toString(36).substring(2) + Date.now().toString(36),
          name: name.trim() || 'Nuevo Ingeniero',
          email: cleanEmail,
          role: role,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || cleanEmail)}`,
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
        
        setTimeout(() => saveAndRedirect(newUser), 1500);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Error de conexión con Supabase.');
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
          <p className="text-text-secondary text-sm">Identificación para despliegue en GitHub</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="flex bg-card-dark p-1 rounded-2xl border border-border-dark">
            <button type="button" onClick={() => setRole('student')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${role === 'student' ? 'bg-primary text-white' : 'text-text-secondary'}`}>Aprendiz</button>
            <button type="button" onClick={() => setRole('editor')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${role === 'editor' ? 'bg-purple-600 text-white' : 'text-text-secondary'}`}>Editor</button>
          </div>

          <div className="space-y-4">
            <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-card-dark border border-border-dark rounded-2xl py-3 px-4 text-sm focus:border-primary outline-none transition-all" placeholder="Nombre Completo" />
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-card-dark border border-border-dark rounded-2xl py-3 px-4 text-sm focus:border-primary outline-none transition-all" placeholder="Email" />
            {role === 'editor' && (
              <input required type="password" value={editorKey} onChange={e => setEditorKey(e.target.value)} className="w-full bg-purple-600/10 border border-purple-600/30 rounded-2xl py-3 px-4 text-sm outline-none" placeholder="Clave Editor (ROBO2025)" />
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold text-center rounded-2xl">
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 text-[11px] font-bold text-center rounded-2xl">
              <p>{success}</p>
            </div>
          )}

          <button type="submit" disabled={isLoading} className={`w-full py-4 text-white font-black rounded-2xl shadow-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 ${role === 'editor' ? 'bg-purple-600 shadow-purple-600/25' : 'bg-primary shadow-primary/25'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {isLoading ? <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : 'Acceder'}
          </button>
        </form>

        <button onClick={() => setShowDebug(!showDebug)} className="w-full text-[9px] font-black uppercase text-text-secondary hover:text-white transition-colors">
          Verificar Configuración del Build
        </button>

        {showDebug && (
          <div className="p-5 bg-black/40 rounded-3xl border border-border-dark space-y-3">
            <h4 className="text-[10px] font-black text-primary uppercase">Diagnóstico</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-secondary">SUPABASE_URL</span>
                <span className={`text-[10px] font-bold ${debugInfo.supabaseUrl ? 'text-green-500' : 'text-red-500'}`}>{debugInfo.supabaseUrl ? 'Inyectada' : 'Faltante'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-secondary">SUPABASE_ANON_KEY</span>
                <span className={`text-[10px] font-bold ${debugInfo.supabaseKey ? 'text-green-500' : 'text-red-500'}`}>{debugInfo.supabaseKey ? 'Inyectada' : 'Faltante'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-secondary">GEMINI_API_KEY</span>
                <span className={`text-[10px] font-bold ${debugInfo.geminiKey ? 'text-green-500' : 'text-red-500'}`}>{debugInfo.geminiKey ? 'Inyectada' : 'Faltante'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;