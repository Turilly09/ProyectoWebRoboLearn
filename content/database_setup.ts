
/*
  =============================================================================
  MAPA MAESTRO DE LA BASE DE DATOS (ROBOLEARN)
  =============================================================================
  
  Instrucciones:
  Copia y pega los bloques de código SQL de abajo en el "SQL Editor" de Supabase
  para crear o actualizar tu infraestructura.

  Principios de Diseño:
  1. NO DESTRUCTIVO: Usamos `IF NOT EXISTS` para no borrar datos previos.
  2. FLEXIBLE: Usamos `JSONB` para contenido complejo (pasos, secciones, quizzes).
  3. SEGURO: Incluye políticas RLS (Row Level Security) básicas.
*/

// ============================================================================
// 1. USUARIOS Y PERFILES (Core)
// ============================================================================
export const CORE_SCHEMA = `
-- Tabla de Perfiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    password TEXT, -- Demo only
    avatar TEXT,
    role TEXT DEFAULT 'student',
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    completed_lessons TEXT[] DEFAULT '{}',
    completed_workshops TEXT[] DEFAULT '{}',
    activity_log JSONB DEFAULT '[]'::jsonb,
    study_minutes INTEGER DEFAULT 0,
    description TEXT,
    github_user TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Políticas de Seguridad (RLS) para Perfiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Update Profiles" ON public.profiles;
CREATE POLICY "Public Update Profiles" ON public.profiles FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public Insert Profiles" ON public.profiles;
CREATE POLICY "Public Insert Profiles" ON public.profiles FOR INSERT WITH CHECK (true);
`;

// ============================================================================
// 2. CONTENIDO EDUCATIVO (Lecciones, Rutas, Noticias)
// ============================================================================
export const CONTENT_SCHEMA = `
-- 2.1 Rutas de Aprendizaje
CREATE TABLE IF NOT EXISTS public.paths (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    level TEXT,
    image TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.paths ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read Paths" ON public.paths;
CREATE POLICY "Read Paths" ON public.paths FOR SELECT USING (true);
DROP POLICY IF EXISTS "Write Paths" ON public.paths;
CREATE POLICY "Write Paths" ON public.paths FOR ALL USING (true);

-- 2.2 Lecciones Dinámicas (Soporte Híbrido: Teoría + Práctica)
CREATE TABLE IF NOT EXISTS public.lessons (
    id TEXT PRIMARY KEY,
    path_id TEXT,
    "order" INTEGER,
    type TEXT DEFAULT 'theory', -- 'theory' | 'practice'
    title TEXT,
    subtitle TEXT,
    sections JSONB DEFAULT '[]'::jsonb, -- Para Teoría: Bloques de contenido
    simulator_url TEXT,                 -- Para Práctica: URL del simulador
    steps JSONB DEFAULT '[]'::jsonb,    -- Para Práctica: Pasos guiados
    quiz JSONB DEFAULT '[]'::jsonb,     -- Ambos: Validación
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- MIGRACIÓN SEGURA: Añadir columnas si no existen (para bases de datos ya creadas)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'type') THEN
        ALTER TABLE public.lessons ADD COLUMN type TEXT DEFAULT 'theory';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'sections') THEN
        ALTER TABLE public.lessons ADD COLUMN sections JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'simulator_url') THEN
        ALTER TABLE public.lessons ADD COLUMN simulator_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'steps') THEN
        ALTER TABLE public.lessons ADD COLUMN steps JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read Lessons" ON public.lessons;
CREATE POLICY "Read Lessons" ON public.lessons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Write Lessons" ON public.lessons;
CREATE POLICY "Write Lessons" ON public.lessons FOR ALL USING (true);

-- 2.3 Noticias / Blog
CREATE TABLE IF NOT EXISTS public.news (
    id TEXT PRIMARY KEY,
    title TEXT,
    excerpt TEXT,
    content TEXT,
    author TEXT,
    category TEXT,
    image TEXT,
    read_time TEXT,
    date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read News" ON public.news;
CREATE POLICY "Read News" ON public.news FOR SELECT USING (true);
DROP POLICY IF EXISTS "Write News" ON public.news;
CREATE POLICY "Write News" ON public.news FOR ALL USING (true);
`;

// ============================================================================
// 3. COMUNIDAD Y SOCIAL (Proyectos, Foro, Wiki)
// ============================================================================
export const COMMUNITY_SCHEMA = `
-- 3.1 Proyectos de la Comunidad (Portfolio)
CREATE TABLE IF NOT EXISTS public.community_projects (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT,
    description TEXT,
    cover_image TEXT,
    category TEXT,
    author_id TEXT,
    author_name TEXT,
    likes INTEGER DEFAULT 0,
    supplies TEXT[] DEFAULT '{}',
    steps JSONB DEFAULT '[]'::jsonb, -- Pasos del proyecto con imágenes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.community_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public All Projects" ON public.community_projects;
CREATE POLICY "Public All Projects" ON public.community_projects FOR ALL USING (true);

-- 3.2 Foro de Discusión
CREATE TABLE IF NOT EXISTS public.forum_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT,
    content TEXT,
    author TEXT,
    board TEXT DEFAULT 'Ayuda General',
    tags TEXT[] DEFAULT '{}',
    likes INTEGER DEFAULT 0,
    replies INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public All Forum" ON public.forum_posts;
CREATE POLICY "Public All Forum" ON public.forum_posts FOR ALL USING (true);

-- 3.3 Wiki Colaborativa
CREATE TABLE IF NOT EXISTS public.wiki_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    term TEXT,
    definition TEXT,
    category TEXT,
    author_name TEXT,
    author_id TEXT,
    status TEXT DEFAULT 'pending', -- 'pending' | 'approved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.wiki_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public All Wiki" ON public.wiki_entries;
CREATE POLICY "Public All Wiki" ON public.wiki_entries FOR ALL USING (true);
`;

// ============================================================================
// 4. UTILIDADES (Cuadernos de notas, etc.)
// ============================================================================
export const UTILS_SCHEMA = `
-- Cuaderno de Ingeniería (Notas por usuario y taller)
CREATE TABLE IF NOT EXISTS public.notebooks (
    user_id TEXT,
    workshop_id TEXT,
    content TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id, workshop_id)
);
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public All Notebooks" ON public.notebooks;
CREATE POLICY "Public All Notebooks" ON public.notebooks FOR ALL USING (true);
`;
