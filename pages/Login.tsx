
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabase';

// Base64 de "ROBO2025". 
const EDITOR_KEY_ENCODED = "Uk9CTzIwMjU=";

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [editorKey, setEditorKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showSqlHelp, setShowSqlHelp] = useState(false); // Estado para ayuda SQL
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const envStatus = {
    url: process.env.SUPABASE_URL || '',
    key: process.env.SUPABASE_ANON_KEY || '',
    gemini: process.env.API_KEY || ''
  };

  // Helper para mapear snake_case (DB) a camelCase (App)
  const mapProfileToUser = (profile: any): User => {
    // Normalizar activityLog ítem por ítem
    const rawLogs = profile.activity_log || profile.activityLog || [];
    const normalizedLogs = rawLogs.map((log: any) => ({
        date: log.date,
        // Leer ambas posibilidades para asegurar compatibilidad
        xpEarned: log.xp_earned !== undefined ? log.xp_earned : (log.xpEarned || 0)
    }));

    return {
      ...profile,
      // Prioridad a snake_case que viene de la DB, fallback a camelCase si ya estaba formateado
      completedLessons: profile.completed_lessons || profile.completedLessons || [],
      completedWorkshops: profile.completed_workshops || profile.completedWorkshops || [],
      activityLog: normalizedLogs,
      studyMinutes: profile.study_minutes || profile.studyMinutes || 0,
      // Mapeo de nuevos campos (Seguridad contra fallos si la columna no existe en DB aún)
      description: profile.description || '',
      githubUser: profile.github_user || '', 
      preferences: profile.preferences || {}, 
      badges: profile.badges || [], // badges
      
      // Asegurar que campos opcionales existan
      xp: profile.xp || 0,
      level: profile.level || 1,
      role: profile.role || 'student'
    };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!isSupabaseConfigured || !supabase) {
      let missing = [];
      if (!envStatus.url || envStatus.url === 'undefined') missing.push("SUPABASE_URL");
      if (!envStatus.key || envStatus.key === 'undefined') missing.push("SUPABASE_ANON_KEY");
      
      setError(`Error de Configuración: Falta [${missing.join(", ")}]. Revisa los Secrets en GitHub.`);
      triggerShake();
      setShowDebug(true);
      setIsLoading(false);
      return;
    }

    let isEditorKeyValid = false;
    if (role === 'editor') {
        const inputKey = editorKey.trim();
        try {
            if (btoa(inputKey) !== EDITOR_KEY_ENCODED) {
                setError('Clave maestra de editor inválida ');
                triggerShake();
                setIsLoading(false);
                return;
            }
            isEditorKeyValid = true;
        } catch (e) {
            setError('Caracteres inválidos en la clave.');
            triggerShake();
            setIsLoading(false);
            return;
        }
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      if (cleanPassword.length < 4) {
        throw new Error("La contraseña debe tener al menos 4 caracteres.");
      }
      
      // Buscar usuario existente
      const { data: rawProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (rawProfile) {
        const profile = mapProfileToUser(rawProfile);

        // --- USUARIO EXISTENTE ---
        if (rawProfile.password !== cleanPassword) {
          setError('Contraseña incorrecta. Si eres el dueño de esta cuenta, verifica tus datos.');
          triggerShake();
          setIsLoading(false);
          return;
        }

        if (role === 'editor' && isEditorKeyValid && profile.role !== 'editor') {
          const { data: updatedRaw, error: upgradeError } = await supabase
            .from('profiles')
            .update({ role: 'editor' })
            .eq('id', profile.id)
            .select()
            .single();
          
          if (upgradeError) throw upgradeError;
          const updatedProfile = mapProfileToUser(updatedRaw);
          setSuccess('¡Identidad verificada y elevada a Editor!');
          setTimeout(() => saveAndRedirect(updatedProfile), 1000);
        } else {
          setSuccess(`¡Bienvenido de nuevo, ${profile.name.split(' ')[0]}!`);
          setTimeout(() => saveAndRedirect(profile), 1000);
        }

      } else {
        // --- USUARIO NUEVO ---
        setSuccess('Cuenta no encontrada. Creando nuevo perfil seguro...');
        
        // Datos para insertar (snake_case para DB)
        const newUserInsert = {
          id: Math.random().toString(36).substring(2) + Date.now().toString(36),
          name: name.trim() || 'Nuevo Ingeniero',
          email: cleanEmail,
          password: cleanPassword,
          role: role,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || cleanEmail)}`,
          level: 1,
          xp: 0,
          completed_lessons: [],
          completed_workshops: [],
          activity_log: [],
          study_minutes: 0,
          badges: [],
          // Nuevos campos inicializados
          preferences: {}
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert(newUserInsert);

        if (insertError) throw insertError;
        
        // Convertimos a camelCase para la app
        const newUserApp = mapProfileToUser(newUserInsert);
        
        setSuccess('¡Perfil creado exitosamente! Accediendo...');
        setTimeout(() => saveAndRedirect(newUserApp), 1500);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      // Detección específica del error de columna faltante
      if (err.message && (err.message.includes('column') || err.message.includes('preferences'))) {
          setError('Error de Base de Datos: Faltan columnas en la tabla "profiles".');
          setShowSqlHelp(true); // Mostrar modal de ayuda
      } else {
          setError(err.message || 'Error al conectar con la base de datos.');
      }
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
    const safeUser = { ...user };
    delete safeUser.password;
    localStorage.setItem('robo_user', JSON.stringify(safeUser));
    window.dispatchEvent(new Event('authChange'));
    navigate('/dashboard');
  };

  const maskValue = (val: string) => {
    if (!val || val === 'undefined') return "FALTANTE ❌";
    if (val.length < 10) return "VALOR INVÁLIDO ⚠️";
    return `${val.substring(0, 8)}...${val.substring(val.length - 4)} ✅`;
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
              {role === 'editor' ? 'admin_panel_settings' : 'lock'}
            </span>
          </div>
          <h1 className="text-3xl font-black">Acceso Seguro</h1>
          <p className="text-text-secondary text-sm">Si es tu primera vez, crearemos tu cuenta automáticamente.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="flex bg-card-dark p-1 rounded-2xl border border-border-dark">
            <button type="button" onClick={() => setRole('student')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${role === 'student' ? 'bg-primary text-white' : 'text-text-secondary'}`}>Aprendiz</button>
            <button type="button" onClick={() => setRole('editor')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${role === 'editor' ? 'bg-purple-600 text-white' : 'text-text-secondary'}`}>Editor</button>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-3 text-text-secondary text-lg">person</span>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-card-dark border border-border-dark rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-primary outline-none transition-all placeholder-white/20" placeholder="Nombre Público" />
            </div>
            
            <div className="relative">
               <span className="material-symbols-outlined absolute left-4 top-3 text-text-secondary text-lg">email</span>
               <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-card-dark border border-border-dark rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-primary outline-none transition-all placeholder-white/20" placeholder="Correo Electrónico" />
            </div>

            <div className="relative">
               <span className="material-symbols-outlined absolute left-4 top-3 text-text-secondary text-lg">key</span>
               <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-card-dark border border-border-dark rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-primary outline-none transition-all placeholder-white/20" placeholder="Contraseña" />
            </div>

            {role === 'editor' && (
              <div className="relative animate-in slide-in-from-top-2">
                 <span className="material-symbols-outlined absolute left-4 top-3 text-purple-400 text-lg">encrypted</span>
                 <input required type="password" value={editorKey} onChange={e => setEditorKey(e.target.value)} className="w-full bg-purple-600/10 border border-purple-600/30 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none placeholder-purple-300/50 text-white" placeholder="Clave Maestra" />
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold text-center rounded-2xl animate-pulse">
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 text-[11px] font-bold text-center rounded-2xl">
              <p>{success}</p>
            </div>
          )}

          <button type="submit" disabled={isLoading} className={`w-full py-4 text-white font-black rounded-2xl shadow-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 ${role === 'editor' ? 'bg-purple-600 shadow-purple-600/25 hover:bg-purple-500' : 'bg-primary shadow-primary/25 hover:bg-primary/80'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {isLoading ? <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : (role === 'editor' ? 'Acceder como Editor' : 'Entrar / Registrarse')}
          </button>
        </form>

        <button onClick={() => setShowDebug(!showDebug)} className="w-full text-[9px] font-black uppercase text-text-secondary hover:text-white transition-colors">
          Diagnóstico del Sistema
        </button>

        {showDebug && (
          <div className="p-5 bg-black/40 rounded-3xl border border-border-dark space-y-3">
            <h4 className="text-[10px] font-black text-primary uppercase">Estado de Variables</h4>
            <div className="space-y-2">
              <div className="flex flex-col">
                <span className="text-[9px] text-text-secondary uppercase">Supabase URL</span>
                <span className="text-[10px] font-mono break-all">{maskValue(envStatus.url)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-text-secondary uppercase">Supabase Key</span>
                <span className="text-[10px] font-mono break-all">{maskValue(envStatus.key)}</span>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE AYUDA SQL PARA ERROR DE SCHEMA */}
        {showSqlHelp && (
            <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 rounded-[40px]">
                <div className="w-full h-full overflow-y-auto space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black text-red-500">¡Actualización Requerida!</h3>
                        <button onClick={() => setShowSqlHelp(false)} className="text-white hover:text-red-500"><span className="material-symbols-outlined">close</span></button>
                    </div>
                    <p className="text-xs text-text-secondary">
                        La base de datos no tiene las columnas <code>preferences</code>, <code>badges</code> o <code>description</code>. Copia este código y ejecútalo en el <strong>SQL Editor</strong> de Supabase para arreglarlo:
                    </p>
                    <pre className="bg-surface-dark p-4 rounded-xl border border-border-dark text-[10px] font-mono text-green-400 overflow-x-auto select-all">
{`-- Actualizar Tabla de Perfiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS github_user TEXT;

-- Forzar permisos
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Update Profiles" ON public.profiles;
CREATE POLICY "Public Update Profiles" ON public.profiles FOR UPDATE USING (true);
`}
                    </pre>
                    <button onClick={() => setShowSqlHelp(false)} className="w-full py-3 bg-white text-black font-black uppercase text-xs rounded-xl">Cerrar</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Login;
