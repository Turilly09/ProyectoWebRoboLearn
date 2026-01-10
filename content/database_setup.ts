
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
    badges TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- MIGRACIÓN DE EMERGENCIA: Asegurar que las columnas nuevas existen si la tabla ya fue creada
DO $$
BEGIN
    -- Añadir preferences
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferences') THEN
        ALTER TABLE public.profiles ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
    END IF;
    -- Añadir badges
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'badges') THEN
        ALTER TABLE public.profiles ADD COLUMN badges TEXT[] DEFAULT '{}';
    END IF;
    -- Añadir description
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'description') THEN
        ALTER TABLE public.profiles ADD COLUMN description TEXT;
    END IF;
    -- Añadir github_user
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'github_user') THEN
        ALTER TABLE public.profiles ADD COLUMN github_user TEXT;
    END IF;
END $$;

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
    final_workshop JSONB DEFAULT NULL, -- Proyecto Final Integrado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- MIGRACIÓN: Asegurar que la columna existe si la tabla ya fue creada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'paths' AND column_name = 'final_workshop') THEN
        ALTER TABLE public.paths ADD COLUMN final_workshop JSONB DEFAULT NULL;
    END IF;
END $$;

ALTER TABLE public.paths ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read Paths" ON public.paths;
CREATE POLICY "Read Paths" ON public.paths FOR SELECT USING (true);
DROP POLICY IF EXISTS "Write Paths" ON public.paths;
CREATE POLICY "Write Paths" ON public.paths FOR ALL USING (true);

-- SEED DATA: Rutas por defecto (Vital para evitar errores de Foreign Key)
-- Nota: El seed no incluye final_workshop complejo para mantener el SQL legible, se añaden nulos por defecto.
INSERT INTO public.paths (id, title, description, level, image, color) VALUES
('e101', 'Introducción a la Electricidad', 'Fundamentos físicos: voltaje, corriente, resistencia.', 'Principiante', 'https://picsum.photos/seed/elec/800/450', 'bg-green-500'),
('analog1', 'Electrónica Analógica', 'Transistores, OpAmps y señales continuas.', 'Intermedio', 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&q=80&w=800', 'bg-orange-500'),
('digital1', 'Electrónica Digital', 'Álgebra de Boole, puertas lógicas y binario.', 'Principiante', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800', 'bg-cyan-500'),
('al1', 'Lógica de Arduino', 'Programación de microcontroladores y sensores.', 'Intermedio', 'https://picsum.photos/seed/arduino/800/450', 'bg-blue-500'),
('rai', 'IA en Robótica', 'Visión artificial y decisiones autónomas.', 'Avanzado', 'https://picsum.photos/seed/robo/800/450', 'bg-purple-500'),
('ca101', 'Corriente Alterna', 'Fasores, impedancia y potencia en AC.', 'Avanzado', 'https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&q=80&w=800', 'bg-red-500'),
('auto1', 'Automatismos Industriales', 'PLC, relés y control de motores.', 'Intermedio', 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=800', 'bg-yellow-600'),
('robo_start', 'Robótica para Principiantes', 'Construye tu primer robot móvil.', 'Principiante', 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800', 'bg-emerald-500')
ON CONFLICT (id) DO NOTHING;

-- 2.2 Lecciones Dinámicas (Soporte Híbrido: Teoría + Práctica)
CREATE TABLE IF NOT EXISTS public.lessons (
    id TEXT PRIMARY KEY,
    path_id TEXT REFERENCES public.paths(id), -- Clave foránea explícita
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

-- MIGRACIÓN SEGURA: Añadir columnas si no existen
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
// 4. TIENDA Y UTILIDADES
// ============================================================================
export const UTILS_SCHEMA = `
-- Cuaderno de Ingeniería
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

-- Productos de la Tienda
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT,
    description TEXT,
    long_description TEXT, -- Nueva columna para descripción detallada
    price NUMERIC,
    category TEXT,
    image TEXT,
    images TEXT[] DEFAULT '{}',
    stock INTEGER DEFAULT 0,
    features TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- MIGRACIÓN: Asegurar long_description
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'long_description') THEN
        ALTER TABLE public.products ADD COLUMN long_description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'images') THEN
        ALTER TABLE public.products ADD COLUMN images TEXT[] DEFAULT '{}';
    END IF;
END $$;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Products" ON public.products;
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Write Products" ON public.products;
CREATE POLICY "Public Write Products" ON public.products FOR ALL USING (true);
`;
